# Specification

## Summary
**Goal:** Replace all logo image elements throughout the app with a text-only "Smileup" wordmark using the existing brand accent colors.

**Planned changes:**
- In `TopBar.tsx`, remove the logo image and replace it with a styled text-only "Smileup" wordmark using existing brand accent colors that contrast on the black background
- In `LandingPage.tsx`, remove the logo image and replace it with the same text-only "Smileup" wordmark matching the TopBar style
- In `App.tsx` (splash/initialization screen), replace any logo image with the same text-only "Smileup" wordmark for visual consistency

**User-visible outcome:** Everywhere a logo image previously appeared (TopBar, LandingPage, splash screen), users now see a clean, typographic "Smileup" wordmark styled with the existing brand colors against the black background — no image assets are used.
