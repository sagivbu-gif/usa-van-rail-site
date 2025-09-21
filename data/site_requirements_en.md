# Site Requirements (EN)
- Single HTML file (Tailwind + Leaflet via CDN)
- Mobile-first
- Map w/ filters: days, modes (road/rail/hike), scenic vs. fast
- Roads: live via OSRM (dynamic). Rail/Hike: fixed polylines.
- Day cards show: title, points, segments, sleep location.
- Popup open smoothly (avoid close-on-first-click)
- If segment polyline empty → render dashed placeholder + warning.
- Date anchor: 2026-08-27 (display local times in city)
- Van tab with vehicle info