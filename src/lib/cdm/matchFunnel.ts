import { containsKeyword, normalize } from './normalize.js';

export interface Funnel {
  id: string;
  brand: string;
  keyword: string;
  post_scope: string | null;
  dm_body: string;
  active: boolean;
}

export interface MatchInput {
  commentText: string;
  postId: string;
  funnels: readonly Funnel[];
}

// Return exactly one funnel that owns this comment, or null if no funnel matches.
//
// Rules from the source playbook:
//   1. A specific post scope beats a catch-all (post_scope === null).
//   2. Exactly one funnel wins. Ties broken deterministically by id (ascending).
//   3. A paused funnel still OWNS its matching comment. It does not fall through
//      to another funnel. The caller checks `.active` and logs a skip with reason.
//
// Returning a paused funnel (rather than null) is intentional: the orchestrator
// records a skip_log row with "funnel paused" as the reason. Falling through
// would send the DM from a different funnel the operator did not intend.
export function matchFunnel(input: MatchInput): Funnel | null {
  const { commentText, postId, funnels } = input;

  const normalizedText = normalize(commentText);
  if (!normalizedText) return null;

  const candidates = funnels.filter((f) =>
    containsKeyword(normalizedText, normalize(f.keyword))
  );
  if (candidates.length === 0) return null;

  const specific = candidates.filter((f) => f.post_scope === postId);
  if (specific.length > 0) {
    return pickWinner(specific);
  }

  const catchAll = candidates.filter((f) => f.post_scope === null);
  if (catchAll.length > 0) {
    return pickWinner(catchAll);
  }

  return null;
}

function pickWinner(funnels: readonly Funnel[]): Funnel {
  return [...funnels].sort((a, b) => a.id.localeCompare(b.id))[0]!;
}
