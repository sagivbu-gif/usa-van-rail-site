# Site Requirements (EN)

- Single HTML (Tailwind + Leaflet via CDN)
- Map shows days with filters/toggles (mode: road/rail/hike; scenic vs fastest)
- Roads: live via OSRM (dynamic). Rail/Hike: fixed polylines (encoded or raw). Empty → dashed straight line.
- Day cards: title, points, segments, sleep location
- Popups smooth (avoid close-on-first-click)
- Date anchor: 2026-08-27 (display local times in city)
- Van tab with vehicle info
- Images: lazy-load, responsive when added later
- Polyline support: encoded/raw