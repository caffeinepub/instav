# Specification

## Summary
**Goal:** Fix two critical bugs in the Smileup app: the profile page being permanently stuck in a skeleton/loading state, and post creation always failing with an error message.

**Planned changes:**
- Fix ProfilePage to correctly fetch and display the authenticated user's real data (avatar, display name, bio, follower/following counts, posts grid) instead of remaining stuck in skeleton placeholders indefinitely
- Ensure the profile query does not fire before the actor is initialized, and correctly unwrap `#ok`/`#err` backend response variants
- Show a "create profile" prompt if the user has no profile yet, rather than an endless skeleton
- Fix the `useCreatePost` mutation so that text-only, image, and video posts submit successfully without showing "Failed to create post. Please try again."
- Ensure media blobs are correctly encoded and the actor call parameters match the backend's expected argument types
- Navigate the user away from CreatePostPage on success, and show a descriptive error message on genuine backend errors

**User-visible outcome:** Users can view their real profile data on the profile page, and can successfully create and share text, image, and video posts without encountering errors.
