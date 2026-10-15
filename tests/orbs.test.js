// The thinking orbs are a port (src/vendor/orbs.js) of the thinking-orbs library's engine. Its
// frames are pure maths, so the port is checked dot by dot against the library's own golden
// vectors (tests/orbs-golden.json, cut down to the states and size Dorkhub draws).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ORBS } from '../src/vendor/orbs.js';

const golden = JSON.parse(readFileSync(new URL('./orbs-golden.json', import.meta.url), 'utf8'));

test('each state resolves to the same mode, speed and options as the library', () => {
  for (const [key, want] of Object.entries(golden.resolved)) {
    const r = ORBS.resolve(key.replace(/-20$/, ''));
    assert.equal(r.mode, want.mode, key);
    assert.equal(r.speed, want.speed, key);
    for (const [k, v] of Object.entries(want.opts)) assert.ok(Math.abs(r.opts[k] - v) < 1e-9, `${key} ${k}: ${r.opts[k]} vs ${v}`);
  }
});

test('every dot and line matches the library at its sample times', () => {
  for (const c of golden.cases) {
    const r = ORBS.resolve(c.state);
    const f = ORBS.frames[r.mode](20, Number(c.t), r.opts);
    const dots = f.dots.flatMap(d => [d.x, d.y, d.z, d.r, d.white, d.a ?? 1]);
    const lines = f.lines.flatMap(l => [l.x1, l.y1, l.x2, l.y2, l.white, l.a ?? 1, l.w]);
    const want = { dots: c.dots, lines: c.lines };
    assert.equal(dots.length, want.dots.length, `${c.key}: dot count`);
    assert.equal(lines.length, want.lines.length, `${c.key}: line count`);
    dots.forEach((v, i) => assert.ok(Math.abs(v - want.dots[i]) <= golden.tolerance, `${c.key}: dot value ${i}: ${v} vs ${want.dots[i]}`));
    lines.forEach((v, i) => assert.ok(Math.abs(v - want.lines[i]) <= golden.tolerance, `${c.key}: line value ${i}`));
  }
});
