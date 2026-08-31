import { describe, it, expect } from 'vitest';
import { isSelfComment } from './isSelfComment.js';

describe('isSelfComment', () => {
  const brandIds = ['ig_thelegitlaunch_12345', 'fb_page_67890'];

  it('returns true for a comment authored by our IG account', () => {
    expect(isSelfComment('ig_thelegitlaunch_12345', brandIds)).toBe(true);
  });

  it('returns true for a comment authored by our FB Page', () => {
    expect(isSelfComment('fb_page_67890', brandIds)).toBe(true);
  });

  it('returns false for a stranger', () => {
    expect(isSelfComment('ig_someone_else_99999', brandIds)).toBe(false);
  });

  it('returns false when authorId is missing or empty', () => {
    expect(isSelfComment(null, brandIds)).toBe(false);
    expect(isSelfComment(undefined, brandIds)).toBe(false);
    expect(isSelfComment('', brandIds)).toBe(false);
  });

  it('returns false when brand list is empty', () => {
    expect(isSelfComment('anyone', [])).toBe(false);
  });
});
