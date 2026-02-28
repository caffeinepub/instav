# Specification

## Summary
**Goal:** Fix the follow/unfollow button on user profile pages so that it correctly calls the backend, persists follow relationships, and displays accurate follower/following counts.

**Planned changes:**
- Fix backend follow/unfollow functions to persistently store follower/following relationships and return accurate counts via `getFollowerCount`, `getFollowingCount`, and `isFollowing` queries
- Wire up `useFollowUser` and `useUnfollowUser` React Query mutation hooks in `useQueries.ts` to call the correct backend actor methods and invalidate relevant queries on success
- Fix the follow/unfollow button on `UserProfilePage` to trigger the backend mutation, show a loading/disabled state during the call, toggle the label between "Follow" and "Following", and refresh follower/following counts immediately after the action
- Show an error toast and revert button state if the backend call fails

**User-visible outcome:** Users can tap the Follow button on a profile page, see it respond with a loading state, update to "Following", and see the follower count increment — and vice versa when unfollowing — all without a page reload.
