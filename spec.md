# Specification

## Summary
**Goal:** Fix media (images and videos) not rendering across the feed, explore, profile, and short video pages in the Smileup app.

**Planned changes:**
- Fix PostCard component to correctly resolve and display image and video media from backend blob/URL data
- Fix the blob rendering utility so binary blob data is properly converted to object URLs or data URLs before being assigned to `img`/`video` src attributes
- Fix ProfilePage to correctly fetch and display the current user's posts including media thumbnails in the posts grid and liked posts tab
- Fix UserProfilePage to correctly fetch and display any public user's posts with media visible
- Fix ShortSportPage so video posts load, display thumbnails, and play back correctly with working controls
- Fix ExplorePage so all posts render their image and video media without broken placeholders

**User-visible outcome:** Users can see all photos, videos, and post media on the feed, explore page, their own profile, other users' profiles, and the short video feed — with no broken image or video placeholders.
