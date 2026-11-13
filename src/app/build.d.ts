/* What only the build knows, handed to the page as a module (scripts/build.mjs makes it). */
declare module 'dorkhub:build' {
  /** free pages a month per device (DH_TRIAL_PAGES when the page was built) */
  export const TRIAL_PAGES: number;
  /** the front page's topics: title, kind, hook, and for a topic with a card its size (c) and whether it is night (n) */
  export const FRONT: { t: string, k: string, h: string, c?: string, n?: 1 }[];
  /** the pages written before the front page's topics */
  export const EARLIER: { t: string, k: string, h: string }[];
}
