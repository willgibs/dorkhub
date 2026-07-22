import { describe, expect, it } from 'vitest';
import { tallyProjectTags } from './tally';

describe('tallyProjectTags', () => {
  it('counts a tag once per row it appears in', () => {
    const tally = tallyProjectTags([{ tags: ['audio'] }, { tags: ['audio'] }]);
    expect(tally.get('audio')).toBe(2);
  });

  it('tracks multiple distinct tags independently', () => {
    const tally = tallyProjectTags([{ tags: ['audio', 'cli'] }, { tags: ['cli'] }]);
    expect(tally.get('audio')).toBe(1);
    expect(tally.get('cli')).toBe(2);
  });

  it('does not dedupe repeats within a single row (tags are already deduped at write)', () => {
    const tally = tallyProjectTags([{ tags: ['audio', 'audio'] }]);
    expect(tally.get('audio')).toBe(2);
  });

  it('preserves case exactly as stored — distinct casings tally separately', () => {
    const tally = tallyProjectTags([{ tags: ['Audio'] }, { tags: ['audio'] }]);
    expect(tally.get('Audio')).toBe(1);
    expect(tally.get('audio')).toBe(1);
  });

  it('returns an empty map for no rows', () => {
    expect(tallyProjectTags([]).size).toBe(0);
  });

  it('returns an empty map when every row has an empty tags array', () => {
    expect(tallyProjectTags([{ tags: [] }, { tags: [] }]).size).toBe(0);
  });
});
