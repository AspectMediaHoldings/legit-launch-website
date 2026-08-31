// Determine whether a comment is top-level (not a reply to another comment).
//
// Instagram: reply-to-reply is not exposed at all in the webhook, so `parentId` is
// undefined for the comments we care about. Treat missing parentId as top-level.
//
// Facebook: every comment has a `parent.id`. For a TOP-LEVEL comment, parent.id
// equals the post.id. For a REPLY, parent.id is another comment's id. Comparing
// existence of `parent` would drop every real top-level FB comment, per the source
// playbook's known-gotcha list.
export function isTopLevel(
  parentId: string | null | undefined,
  postId: string
): boolean {
  if (parentId == null || parentId === '') return true;
  return parentId === postId;
}
