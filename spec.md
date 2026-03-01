# Specification

## Summary
**Goal:** Add profile row logic to the StoriesRow component, populating right-side profile bubbles with friends, followed users, and recently visited profiles — with glow indicators for new posts and direct post navigation.

**Planned changes:**
- Add stable visit history storage to the backend (up to 2 most recent unique visited profiles per user), with `recordVisit` and `getVisitHistory` methods
- Add `getProfileRowUsers()` backend query returning deduplicated, ordered principals (mutual follows first, then following, then last 2 visited)
- Add `getLatestPostByUser(user: Principal)` backend query returning the most recent post for a user or null
- Add `hasNewPostSince(user: Principal, since: Int)` backend query returning true if the user posted after the given timestamp
- Update StoriesRow frontend component to populate right-side profile bubbles from `getProfileRowUsers()`, polling every ~30 seconds
- Show a glow effect on avatars where `hasNewPostSince` returns true (using last-seen timestamp from localStorage)
- Clicking a glowing avatar fetches the latest post via `getLatestPostByUser` and navigates to it; clicking a non-glowing avatar navigates to the user's profile page; after clicking, clear glow and update localStorage timestamp
- Automatically call `recordVisit` when the authenticated user visits another user's `UserProfilePage` (fire-and-forget, skip own profile)
- Add `backend/migration.mo` to safely initialize the new `visitHistory` stable structure while preserving all existing data

**User-visible outcome:** The right-side profile row in StoriesRow shows friends, followed users, and recently visited profiles. Avatars glow when those users have posted something new, and clicking a glowing avatar takes the user directly to that person's latest post.
