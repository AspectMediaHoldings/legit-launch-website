import { describe, it, expect } from 'vitest';
import { normalize, containsKeyword } from './normalize.js';

describe('normalize', () => {
  it('lowercases input', () => {
    expect(normalize('LEGIT')).toBe('legit');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalize('  legit  ')).toBe('legit');
  });

  it('collapses internal whitespace', () => {
    expect(normalize('legit    launch')).toBe('legit launch');
  });

  it('strips ASCII punctuation', () => {
    expect(normalize('LEGIT!!!')).toBe('legit');
    expect(normalize('legit? yes.')).toBe('legit yes');
    expect(normalize('(legit)')).toBe('legit');
  });

  it('preserves Unicode letters', () => {
    expect(normalize('résumé')).toBe('résumé');
  });

  it('strips emoji', () => {
    expect(normalize('legit 🔥')).toBe('legit');
  });

  it('handles empty and non-string input safely', () => {
    expect(normalize('')).toBe('');
    // @ts-expect-error deliberate wrong-type input
    expect(normalize(null)).toBe('');
    // @ts-expect-error deliberate wrong-type input
    expect(normalize(undefined)).toBe('');
  });
});

describe('containsKeyword', () => {
  it('matches whole word', () => {
    expect(containsKeyword('i want legit', 'legit')).toBe(true);
  });

  it('matches keyword at start', () => {
    expect(containsKeyword('legit please', 'legit')).toBe(true);
  });

  it('matches keyword at end', () => {
    expect(containsKeyword('please legit', 'legit')).toBe(true);
  });

  it('matches single-word comment', () => {
    expect(containsKeyword('legit', 'legit')).toBe(true);
  });

  it('does not match keyword as substring of larger word', () => {
    expect(containsKeyword('legitimate', 'legit')).toBe(false);
    expect(containsKeyword('illegit', 'legit')).toBe(false);
  });

  it('returns false for empty inputs', () => {
    expect(containsKeyword('', 'legit')).toBe(false);
    expect(containsKeyword('legit', '')).toBe(false);
  });

  it('is case-agnostic when caller normalizes first', () => {
    // Contract: both args must be pre-normalized. Function does not lowercase.
    expect(containsKeyword('LEGIT', 'legit')).toBe(false);
    expect(containsKeyword(normalize('LEGIT'), normalize('legit'))).toBe(true);
  });
});
