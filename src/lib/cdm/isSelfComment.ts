// Filter own-account comments so replying to our own posts never triggers our own funnels.
// Meta's webhook fires again when we post a public reply; without this we would DM ourselves in a loop.
export function isSelfComment(
  commentAuthorId: string | null | undefined,
  brandAccountIds: readonly string[]
): boolean {
  if (!commentAuthorId) return false;
  return brandAccountIds.includes(commentAuthorId);
}
