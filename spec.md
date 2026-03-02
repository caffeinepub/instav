# Specification

## Summary
**Goal:** Redesign the ProfilePage with a professional Instagram-style layout featuring an uploadable banner, uploadable profile photo, and an enhanced dark/golden-themed profile info section.

**Planned changes:**
- Add a full-width uploadable banner image area (~180px tall) at the top of ProfilePage, with a dark gradient fallback and a camera icon overlay to trigger image upload; save banner blob to the backend
- Replace the orange initials avatar with an uploadable circular profile photo that overlaps the bottom edge of the banner (Instagram-style); show a camera icon overlay to trigger upload; fall back to gradient initials avatar if no photo is set; save photo blob to the backend
- Display the user's display name inside a dark rounded pill/box with a golden glow/drop-shadow
- Show the user's @handle in smaller grey text below the name
- Show Followers, Following, and Posts counts in a horizontal stats row; Followers displayed in a golden-bordered box with golden drop-shadow
- Keep the Edit Profile button right-aligned in the profile header area

**User-visible outcome:** Users see a polished profile page with an uploadable banner and profile photo (Instagram-style overlap), their name styled in a dark golden-glow box, their handle, and a clean horizontal stats row — all consistent with the app's dark golden theme.
