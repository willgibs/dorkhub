/* ================= one write per page in flight, on this instance =================
   A flight is one model write. It reads the writer's words as they come and keeps them; each
   response is a seat on it, streaming everything written so far and then the rest, and the same
   trailer at the end. The writer is stopped only when the last seat has gone. A second reader
   asking for the same page while it is being written takes a seat instead of a second write.

   A flight is claimed (put in the instance's map) before its writer starts, so a reader who
   arrives during the trial checks waits on it too. If it ends before its first word (a refusal,
   a failure), it was never joinable: ready resolves false and the waiting readers go their own
   way. Nothing here crosses instances. */

/* a flight older than this is never joined: a writer that stalls keeps only its own readers */
const JOIN_WINDOW = 110_000;

/** @typedef {{ ready: Promise<boolean>, stream(): ReadableStream<Uint8Array>, leave(): void }} Seat */
/** @typedef {{ tail: Record<string, unknown> | null, after?: Promise<unknown> }} Settled */

export class Flight {
  constructor() {
    this.text = '';
    this.started = false;
    this.done = false;
    /** @type {Record<string, unknown> | null} */ this.tail = null;
    this.t0 = Date.now();
    this.holders = 0;
    this.ac = new AbortController();
    /** @type {(ok: boolean) => void} */ let ready = () => {};
    /** resolves true at the first word, false if it ended without one */
    this.ready = /** @type {Promise<boolean>} */ (new Promise(r => { ready = r; }));
    this.resolveReady = ready;
    /** @type {() => void} */ let fin = () => {};
    /** resolves when the flight and its follow-up work (cache write, report) are over */
    this.finished = /** @type {Promise<void>} */ (new Promise(r => { fin = r; }));
    this.resolveFinished = fin;
    /** @type {() => void} */ this.wake = () => {};
    this.changed = this.next();
    /** called once, when the flight can no longer be joined @type {() => void} */
    this.onGone = () => {};
  }

  get signal() { return this.ac.signal; }
  get joinable() { return !this.done && !this.ac.signal.aborted && Date.now() - this.t0 < JOIN_WINDOW; }

  /** @returns {Promise<void>} */
  next() { return new Promise(r => { this.wake = r; }); }
  bump() { const w = this.wake; this.changed = this.next(); w(); }
  gone() { const g = this.onGone; this.onGone = () => {}; g(); }

  /** Take a seat. Until it leaves, the writer keeps writing. @returns {Seat} */
  seat() {
    this.holders++;
    let left = false;
    const leave = () => { if (left) return; left = true; this.release(); };
    return { ready: this.ready, leave, stream: () => this.stream(leave) };
  }

  release() {
    this.holders--;
    if (this.holders <= 0 && !this.done && !this.ac.signal.aborted) { this.gone(); this.ac.abort(); }
  }

  /** Give up before writing (the trial said no, the reader left): anyone waiting goes their own way. */
  abandon() {
    if (this.done) return;
    this.done = true; this.gone(); this.resolveReady(false); this.resolveFinished(); this.bump();
  }

  /** @param {() => void} leave @returns {ReadableStream<Uint8Array>} */
  stream(leave) {
    const enc = new TextEncoder(); let pos = 0;
    return new ReadableStream({
      pull: async c => {
        for (;;) {
          if (pos < this.text.length) { const s = this.text.slice(pos); pos = this.text.length; c.enqueue(enc.encode(s)); return; }
          if (this.done) {
            try { if (this.tail) c.enqueue(enc.encode(`\u0000${JSON.stringify(this.tail)}`)); c.close(); } catch { /* the reader is gone */ }
            leave(); return;
          }
          await this.changed;
        }
      },
      cancel: () => leave(),
    });
  }

  /**
   * Read the writer to its end. settle(started, error) decides the trailer once the words stop, and
   * may hand back follow-up work (`after`) that the flight's `finished` waits for.
   * @param {AsyncIterable<string>} words @param {(started: boolean, error: unknown) => Promise<Settled>} settle
   */
  async run(words, settle) {
    /** @type {unknown} */ let error = null;
    try {
      for await (const v of words) {
        this.text += v;
        if (!this.started) { this.started = true; this.resolveReady(true); }
        this.bump();
      }
    } catch (e) { error = e; }
    /** @type {Settled} */ let out = { tail: this.started ? { error: 'upstream_error' } : null };
    try { out = await settle(this.started, error); } catch { /* keep the generic ending */ }
    this.tail = out.tail; this.done = true; this.gone(); this.resolveReady(false); this.bump();
    try { await out.after; } catch { /* each job logs its own failure */ }
    this.resolveFinished();
  }
}

/* The flights of one instance, per store (so tests with their own stores never meet). */
/** @type {WeakMap<object, Map<string, Flight>>} */ const flights = new WeakMap();
/** @param {object} store */
export function flightsOf(store) {
  let m = flights.get(store); if (!m) { m = new Map(); flights.set(store, m); }
  return m;
}

/** Put a new flight in the map under key; it leaves the map once it can't be joined. @param {Map<string, Flight>} map @param {string} key */
export function claim(map, key) {
  const f = new Flight();
  map.set(key, f);
  f.onGone = () => { if (map.get(key) === f) map.delete(key); };
  return f;
}
