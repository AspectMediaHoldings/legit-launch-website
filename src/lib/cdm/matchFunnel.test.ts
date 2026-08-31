import { describe, it, expect } from 'vitest';
import { matchFunnel, type Funnel } from './matchFunnel.js';

const baseFunnel: Omit<Funnel, 'id' | 'keyword' | 'post_scope' | 'active'> = {
  brand: 'legit-launch',
  dm_body: 'download link goes here',
};

function makeFunnel(overrides: Partial<Funnel>): Funnel {
  return {
    id: 'f_default',
    keyword: 'LEGIT',
    post_scope: null,
    active: true,
    ...baseFunnel,
    ...overrides,
  };
}

describe('matchFunnel', () => {
  it('returns null when no funnel keyword appears in the comment', () => {
    const funnel = makeFunnel({ id: 'f1' });
    const result = matchFunnel({
      commentText: 'just scrolling by, nice post',
      postId: 'post_123',
      funnels: [funnel],
    });
    expect(result).toBeNull();
  });

  it('returns null when the funnel list is empty', () => {
    const result = matchFunnel({
      commentText: 'LEGIT',
      postId: 'post_123',
      funnels: [],
    });
    expect(result).toBeNull();
  });

  it('matches an active catch-all funnel on keyword', () => {
    const funnel = makeFunnel({ id: 'f1' });
    const result = matchFunnel({
      commentText: 'LEGIT please',
      postId: 'post_123',
      funnels: [funnel],
    });
    expect(result?.id).toBe('f1');
  });

  it('prefers a specific-post funnel over a catch-all with the same keyword', () => {
    const catchAll = makeFunnel({ id: 'f_catchall', post_scope: null });
    const specific = makeFunnel({ id: 'f_specific', post_scope: 'post_123' });
    const result = matchFunnel({
      commentText: 'LEGIT',
      postId: 'post_123',
      funnels: [catchAll, specific],
    });
    expect(result?.id).toBe('f_specific');
  });

  it('does not match a specific-post funnel on the wrong post', () => {
    const specific = makeFunnel({ id: 'f_specific', post_scope: 'post_ABC' });
    const result = matchFunnel({
      commentText: 'LEGIT',
      postId: 'post_XYZ',
      funnels: [specific],
    });
    expect(result).toBeNull();
  });

  it('falls through to catch-all when specific match is for a different post', () => {
    const wrongPostSpecific = makeFunnel({
      id: 'f_specific',
      post_scope: 'post_OTHER',
    });
    const catchAll = makeFunnel({ id: 'f_catchall', post_scope: null });
    const result = matchFunnel({
      commentText: 'LEGIT',
      postId: 'post_123',
      funnels: [wrongPostSpecific, catchAll],
    });
    expect(result?.id).toBe('f_catchall');
  });

  it('returns a paused specific funnel rather than falling through to an active catch-all', () => {
    // Playbook rule: a paused funnel must stop, not fall through.
    // The paused funnel still OWNS the comment. Caller checks .active
    // and records skip_log with reason "funnel paused".
    const paused = makeFunnel({
      id: 'f_specific_paused',
      post_scope: 'post_123',
      active: false,
    });
    const activeCatchAll = makeFunnel({
      id: 'f_catchall_active',
      post_scope: null,
      active: true,
    });
    const result = matchFunnel({
      commentText: 'LEGIT',
      postId: 'post_123',
      funnels: [paused, activeCatchAll],
    });
    expect(result?.id).toBe('f_specific_paused');
    expect(result?.active).toBe(false);
  });

  it('breaks ties among specific matches by id (ascending)', () => {
    const a = makeFunnel({ id: 'f_aaa', post_scope: 'post_123' });
    const b = makeFunnel({ id: 'f_bbb', post_scope: 'post_123' });
    const result = matchFunnel({
      commentText: 'LEGIT',
      postId: 'post_123',
      funnels: [b, a],
    });
    expect(result?.id).toBe('f_aaa');
  });

  it('normalizes the comment text before matching', () => {
    const funnel = makeFunnel({ id: 'f1', keyword: 'legit' });
    const result = matchFunnel({
      commentText: '  LEGIT!!!  ',
      postId: 'post_123',
      funnels: [funnel],
    });
    expect(result?.id).toBe('f1');
  });

  it('does not match a keyword that appears as a substring of a larger word', () => {
    const funnel = makeFunnel({ id: 'f1', keyword: 'legit' });
    const result = matchFunnel({
      commentText: 'legitimate concerns',
      postId: 'post_123',
      funnels: [funnel],
    });
    expect(result).toBeNull();
  });

  it('picks exactly one funnel even when many candidates match', () => {
    const funnels: Funnel[] = [
      makeFunnel({ id: 'f_a', post_scope: null }),
      makeFunnel({ id: 'f_b', post_scope: null }),
      makeFunnel({ id: 'f_c', post_scope: 'post_123' }),
      makeFunnel({ id: 'f_d', post_scope: 'post_123' }),
    ];
    const result = matchFunnel({
      commentText: 'LEGIT',
      postId: 'post_123',
      funnels,
    });
    // Exactly one specific match wins, deterministically by id.
    expect(result?.id).toBe('f_c');
  });
});
