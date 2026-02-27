# Specification

## Summary
**Goal:** Add user profiles with a picture, bio, display name, and unique handle, along with public discovery and profile visibility across the app.

**Planned changes:**
- Extend the backend data model to store user profiles (handle, display name, bio, profile picture as blob) tied to Internet Identity principals
- Add backend functions to create/update a profile, fetch by principal, fetch by handle, and search by handle
- Update the ProfilePage to require login before profile setup/editing; show a form with fields for handle, display name, bio, and profile picture upload from device; validate handle uniqueness on submit
- Create a public UserProfilePage accessible at `/profile/:handle` showing the user's avatar, handle, display name, bio, post count, and a 3-column grid of their posts
- Add a user search input to the ExplorePage that searches by handle and shows results with avatar, handle, and display name; clicking a result navigates to their profile page
- Update PostCard and FeedPage to display the author's profile picture and handle alongside each post, linking to their public profile page

**User-visible outcome:** Users can set up a profile with a picture, bio, and unique handle. Anyone can discover and view public profiles by searching for a handle or clicking an author's name/avatar on a post.
