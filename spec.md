# Specification

## Summary
**Goal:** Add direct messaging (chat), shortspot sharing in chat, a follow/shadows system, and in-app notifications to InstaV.

**Planned changes:**
- Add backend support for direct messaging: store conversations and messages (with optional shortspot/post reference) between users; expose `sendMessage`, `getConversations`, `getMessages`, and `markMessagesRead`
- Add backend follow system: store follower/following relationships; expose `followUser`, `unfollowUser`, `getFollowers`, `getFollowing`, `isFollowing`; follower count is labelled "Shadows"
- Add backend in-app notifications: store per-user notifications with type, sender, timestamp, read status, and optional post reference; expose `getNotifications` and `markNotificationRead`; auto-create a `new_shadow` notification on follow
- Replace mock MessagesPage with a functional chat UI: conversation list (avatar, name, last message preview, unread badge), thread view (left/right-aligned bubbles, timestamps), text input with Send button, and a "Share Shortspot" button that opens a post picker modal sending a shortspot card in-thread; poll every 5 seconds
- Add Follow/Unfollow button on UserProfilePage for authenticated users; show "Shadows: N" (follower count) and "Following: N" on both ProfilePage and UserProfilePage; optimistic UI update on follow
- Add a bell icon with unread badge to the TopBar; clicking opens a notifications panel listing `new_shadow` events (avatar, handle, "started shadowing you", timestamp); clicking a notification marks it read and navigates to the relevant profile; poll every 15 seconds
- Add a Messages entry point in the BottomNav or TopBar; register `/messages` and `/messages/:principalId` routes in the route tree; unauthenticated access shows a login prompt
- Add a "Message" button on UserProfilePage that navigates authenticated users to `/messages/:principalId` for that user
- Add all new React Query hooks to `useQueries.ts` following existing patterns

**User-visible outcome:** Users can follow each other (with a "Shadows" follower count on profiles), send and receive direct messages with shortspot post sharing in chat, and receive in-app notifications when someone starts shadowing them — all accessible from the main navigation.
