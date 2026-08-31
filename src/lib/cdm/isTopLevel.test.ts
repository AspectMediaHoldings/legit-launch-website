import { describe, it, expect } from 'vitest';
import { isTopLevel } from './isTopLevel.js';

describe('isTopLevel', () => {
  describe('Facebook comments', () => {
    it('treats parent.id === post.id as top-level', () => {
      expect(isTopLevel('post_abc', 'post_abc')).toBe(true);
    });

    it('treats parent.id !== post.id as a reply', () => {
      expect(isTopLevel('comment_xyz', 'post_abc')).toBe(false);
    });

    it('does NOT drop top-level FB comments (the playbook gotcha)', () => {
      // Playbook rule: "Compare the two ids instead. Do not treat 'has a parent'
      // as 'is a reply' — every top-level FB comment has a parent id equal to
      // the post id." This test locks that behavior in.
      const parent = 'post_1234567890';
      const post = 'post_1234567890';
      expect(isTopLevel(parent, post)).toBe(true);
    });
  });

  describe('Instagram comments', () => {
    it('treats missing parentId as top-level', () => {
      expect(isTopLevel(null, 'ig_media_123')).toBe(true);
      expect(isTopLevel(undefined, 'ig_media_123')).toBe(true);
    });

    it('treats empty-string parentId as top-level', () => {
      expect(isTopLevel('', 'ig_media_123')).toBe(true);
    });
  });
});
