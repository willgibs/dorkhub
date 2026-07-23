import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { autoApproveMinStars, needsReview } from './policy';

describe('autoApproveMinStars — env parsing matrix', () => {
  const ORIGINAL = process.env.AUTO_APPROVE_MIN_STARS;

  beforeEach(() => {
    delete process.env.AUTO_APPROVE_MIN_STARS;
  });

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.AUTO_APPROVE_MIN_STARS;
    } else {
      process.env.AUTO_APPROVE_MIN_STARS = ORIGINAL;
    }
  });

  it('defaults to 20 when unset', () => {
    expect(autoApproveMinStars()).toBe(20);
  });

  it('defaults to 20 when whitespace-only', () => {
    process.env.AUTO_APPROVE_MIN_STARS = '   ';
    expect(autoApproveMinStars()).toBe(20);
  });

  it('defaults to 20 on garbage (unparseable) input', () => {
    process.env.AUTO_APPROVE_MIN_STARS = 'garbage';
    expect(autoApproveMinStars()).toBe(20);
  });

  it('defaults to 20 on negative input', () => {
    process.env.AUTO_APPROVE_MIN_STARS = '-5';
    expect(autoApproveMinStars()).toBe(20);
  });

  it("parses '0' as a valid (non-default) threshold", () => {
    process.env.AUTO_APPROVE_MIN_STARS = '0';
    expect(autoApproveMinStars()).toBe(0);
  });

  it("parses '150' as-is", () => {
    process.env.AUTO_APPROVE_MIN_STARS = '150';
    expect(autoApproveMinStars()).toBe(150);
  });

  it('trims surrounding whitespace before parsing', () => {
    process.env.AUTO_APPROVE_MIN_STARS = '  75  ';
    expect(autoApproveMinStars()).toBe(75);
  });
});

describe('needsReview — boundary at threshold 20', () => {
  it('19 stars < 20 → needs review', () => {
    expect(needsReview({ stars_count: 19 }, 20)).toBe(true);
  });

  it('20 stars == threshold → does NOT need review (strict <)', () => {
    expect(needsReview({ stars_count: 20 }, 20)).toBe(false);
  });

  it('21 stars > threshold → does NOT need review', () => {
    expect(needsReview({ stars_count: 21 }, 20)).toBe(false);
  });
});
