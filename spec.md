# Specification

## Summary
**Goal:** Fix ShortSport message sharing so that receivers can open and view the exact ShortSport video that was sent to them.

**Planned changes:**
- In the message thread, detect messages containing a shared ShortSport post and render a tappable preview card (thumbnail or play icon).
- Tapping the preview navigates to `/shortsport?postId=<id>` with the correct post ID.
- Update ShortSportPage to read an optional `postId` query parameter on mount, scroll to and auto-play the matching post when present, and fall back to the normal feed if the ID is not found.
- Ensure the fix works for both sender and receiver sides of the conversation.

**User-visible outcome:** When a user receives a shared ShortSport in a message thread, they can tap the preview and be taken directly to that specific ShortSport video playing in the full-screen reel view.
