# Point Types Spec (point_types_spec.md)

This file lists the supported point types and the required fields for each point entry used by `itinerary_spec.txt` (schema v2).

## Required common fields (for all point types)
- `id` (string) — unique identifier
- `name` (string)
- `type` (string) — e.g. city, national_park, town, campground, station
- `coords` (array) — [latitude, longitude] (required for map rendering)
- `stay_duration_min` (number) — planned minutes of stay
- `description` (string)
- `links` (array) — optional links (urls)
- `parking` (string) — short parking guidance
- `price_estimate` (string) — human-readable estimate
- `slug` (string) — used for image lookups (not used in this package)

## Types (examples)
- `city` — urban stop, museums, restaurants
- `national_park` — park entrance / visitor center
- `campground` — RV campground / overnight site
- `station` — train station / transit hub
- `town` — small town / waypoint

## Notes
- If `coords` is missing, the point will be skipped for map markers and logged.
- `slug` is used by the deploy site to map to images when available; currently images are intentionally omitted.
