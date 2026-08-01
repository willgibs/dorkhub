import { describe, expect, it } from 'vitest';

import { activeHeadingId } from './readme-contents';

const LINE = 114; // header offset (90) + reading line (24)

describe('activeHeadingId', () => {
  it('marks nothing above the first heading', () => {
    expect(activeHeadingId([{ id: 'install', top: 400 }], LINE)).toBeNull();
  });

  it('marks a heading the moment it crosses the reading line', () => {
    expect(activeHeadingId([{ id: 'install', top: 114 }], LINE)).toBe('install');
  });

  it('marks the last heading that has passed, not the first', () => {
    const tops = [
      { id: 'install', top: -900 },
      { id: 'usage', top: -120 },
      { id: 'license', top: 640 },
    ];
    expect(activeHeadingId(tops, LINE)).toBe('usage');
  });

  it('holds the current section while it spans the whole viewport', () => {
    // The failure mode of a band-based observer: nothing is near the top, so
    // it reports nothing. Position always has an answer.
    const tops = [
      { id: 'install', top: -4000 },
      { id: 'usage', top: 3200 },
    ];
    expect(activeHeadingId(tops, LINE)).toBe('install');
  });

  it('resolves a deep link landing mid-document', () => {
    // #usage put usage at the reading line; install is above it.
    const tops = [
      { id: 'install', top: -300 },
      { id: 'usage', top: 112 },
      { id: 'faq', top: 900 },
    ];
    expect(activeHeadingId(tops, LINE)).toBe('usage');
  });

  it('marks the last heading at the bottom of the page', () => {
    const tops = [
      { id: 'install', top: -2000 },
      { id: 'usage', top: -1200 },
      { id: 'faq', top: -80 },
    ];
    expect(activeHeadingId(tops, LINE)).toBe('faq');
  });

  it('handles an empty outline', () => {
    expect(activeHeadingId([], LINE)).toBeNull();
  });
});
