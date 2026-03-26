# Smileup — Luxury UI Overhaul

## Current State
Smileup is a full social media app with: Feed, ShortSport (horizontal swipe, auto-scroll), Trending Creators, Profile pages, Messaging (Inbox/Friends/Shadowing tabs), Create Post, and Explore. The UI has a dark theme with gold accents and glassmorphism. Backend has follow/shadow, messaging, posts, and user profile APIs.

## Requested Changes (Diff)

### Add
- Luxury + modern tech visual direction: deeper darks, gold/cyan/purple accent system, stronger glassmorphism, premium typography
- TrendingProfilesSection: card layout for all 10 — #1 full gold card, #2 silver card, #3–10 colorful bordered cards matching theme
- ShortSport: shadow (follow) count display next to author name/button in the post overlay
- ShortSport: video-only enforcement (filter feed to video posts only; in CreatePostPage reject non-video files with toast message + 3-minute duration limit validation)
- LandingPage: luxury redesign — centered Smileup wordmark with gold/cyan gradient, premium feature showcase, refined CTA button
- UserProfilePage (channel page): rename "Follow" → "Shadow", show live shadow count in a prominent golden stat box
- ProfilePage (own): show shadow count (follower count from backend) in a golden box replacing static "0 Followers"

### Modify
- ShortSportPage: remove ChevronUp/Down navigation arrow buttons (swipe-only navigation, no navigator UI)
- TrendingProfilesSection: from horizontal avatar scroll to ranked card layout with tiered theming
- LandingPage: full luxury redesign keeping same routes and auth logic
- UserProfilePage: "Follow" label → "Shadow", add live follower count stat with gold styling
- ProfilePage: wire follower count via useGetFollowerCount hook (already exists), gold styling for shadows box

### Remove
- ShortSport up/down chevron navigation buttons
- Static placeholder follower counts (replace with real data from backend)

## Implementation Plan
1. Update LandingPage.tsx — luxury dark redesign, centered Smileup with gold/cyan gradient wordmark, premium feature cards, refined CTA
2. Update TrendingProfilesSection.tsx — card-based layout, #1 gold theme, #2 silver theme, #3–10 colorful bordered cards
3. Update ShortSportPage.tsx — remove ChevronUp/Down buttons, add shadow count in author overlay, filter to video-only posts
4. Update CreatePostPage.tsx — add video-only validation for ShortSport (reject non-video, enforce 3-minute max)
5. Update UserProfilePage.tsx — rename Follow→Shadow, live shadow count in gold stat box, premium channel layout
6. Update ProfilePage.tsx — wire useGetFollowerCount, display in gold "Shadows" box
