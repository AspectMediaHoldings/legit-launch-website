// Normalize comment text for keyword matching.
// Lowercase, trim, strip punctuation (Unicode-aware), collapse internal whitespace.
export function normalize(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check whether a normalized comment contains a keyword as a whole word.
// Prevents "GUIDES" from matching "GUIDE" but "GUIDE!" (after normalize) does match "GUIDE".
export function containsKeyword(normalizedText: string, normalizedKeyword: string): boolean {
  if (!normalizedText || !normalizedKeyword) return false;
  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'u');
  return pattern.test(normalizedText);
}
