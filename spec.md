# Specification

## Summary
**Goal:** Enhance the ShortSport feed with auto-scroll, comments, sharing, and poster profile display/navigation.

**Planned changes:**
- Add click-to-activate auto-scroll mode in ShortSportPage: after the current video finishes, automatically scroll to the next video and continue playing sequentially until no more videos remain
- Add a comments button/icon to each ShortSport item that opens a comments panel (reusing existing `addComment`/`getComments` backend and `CommentsSheet` logic), showing all comments with username/avatar and allowing authenticated users to post new comments
- Add a share button to each ShortSport item that opens a modal/bottom sheet listing the current user's friends (reusing existing `getFriends` and `sendMessage` backend), allowing the user to select one or more friends and send the post as a direct message, with a success confirmation
- Overlay the poster's avatar and display name on each ShortSport item (bottom-left), falling back to gradient initials if no profile picture exists; tapping the avatar or name navigates to that user's `UserProfilePage` using their principal ID

**User-visible outcome:** Users can click a ShortSport video to enable auto-scroll through the feed, view and post comments on each item, share items directly to friends via messages, and tap the poster's avatar/name to visit their profile page.
