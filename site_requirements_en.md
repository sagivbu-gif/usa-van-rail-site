# Site Requirements (site_requirements_en.md)

This document summarizes the site behavior and feature requirements.

- Single-page site (index.html) suitable for GitHub Pages.
- Map: interactive map using Leaflet (tiles: OpenStreetMap).
- Mobile-first layout. Sidebar with day cards and map on the right on wide screens; stacked on narrow screens.
- All times/dates are calculated from a Date Anchor (default: 2026-08-27).
- Modes supported: `drive` (van), `rail` (train), `hike` (trail/walk).
- For `drive` segments the app should prefer scenic routes when time difference is within reason — UI provides a scenic/fast toggle.
- Driving segments: OSRM routing is preferred at runtime (not included). If a polyline is present it will be used; if missing, a dashed straight line between endpoints will be rendered with a warning.
- Train routes: must follow real Amtrak lines when provided. If `encoded_polyline` or `polyline` is provided, render it as-is.
- Points must include required fields (see point_types_spec.md).
- Image handling: images are lazy-loaded, responsive WebP when available. (Not included in this package.)
- Performance: avoid heavy external CSS frameworks in production; build Tailwind via PostCSS/Tailwind CLI for production release. This package contains minimal CSS to avoid dependency on tailwind CDN.
- Accessibility: map popups should be keyboard-focusable; day list should be scrollable and accessible.
- Deployment: site is intended for GitHub Pages from a `deploy` repository (e.g., `usa-van-rail-site`).

## Maintenance workflow
1. Edit `itinerary_spec.txt` (schema v2) in `usa-van-rail-specs` repository.
2. Copy updated `itinerary_spec.txt` into the deploy repository root.
3. Commit with message `deploy update` for site changes or `update specs` for spec-only changes.
