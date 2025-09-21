# USA Van + Rail — Deploy

This repo hosts the live site on **GitHub Pages**.

## Update steps
1. Replace `data/itinerary_spec.txt` when itinerary changes.
2. Commit with message `deploy update`.
3. Ensure **Settings → Pages → Source = Deploy from a branch (main / root)**.

## Notes
- Roads: live OSRM routing.
- Rail/Hike: fixed polylines. Encoded or raw. Empty = dashed straight line.
- Toggle Scenic/Fastest in the header.
- 15 days currently included (more can be enabled later).

_Last build: 2025-09-21_
