# Specification

## Summary
**Goal:** Add a core friend system to Smileup, allowing users to send, receive, accept, decline, cancel, and remove friend connections.

**Planned changes:**
- Add a `FriendRequest` data model to the backend with fields for sender, receiver, status (Pending/Accepted/Declined), and timestamp, with stable storage
- Add backend functions: `sendFriendRequest`, `respondToFriendRequest`, `cancelFriendRequest`, `unfriend`, `getIncomingFriendRequests`, `getOutgoingFriendRequests`, `getFriendsList`, and `getFriendshipStatus`
- Add React Query hooks in `useQueries.ts` for all new friend system backend functions (mutations and queries)
- Update `UserProfilePage` to show a dynamic friend button reflecting the current friendship status: "Add Friend", "Request Sent" (with cancel), "Accept"/"Decline", or "Friends" (with unfriend dropdown)

**User-visible outcome:** Users can visit another user's profile and send a friend request, cancel it, accept or decline incoming requests, and unfriend existing friends. The friend button on profile pages dynamically reflects the current relationship state.
