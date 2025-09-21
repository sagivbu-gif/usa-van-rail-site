# Point Types (Spec v2)

Each point has: `id`, `name`, `type`, `coords [lat, lng]`, `stay_duration_min`, `description`, `links`, `parking`, `price_estimate`.

## Segment polyline rules
- `polyline` may be **encoded string** (Google-style) OR **raw array of [lat,lng]**.
- If `polyline` is **empty** or missing → render **dashed straight line** from origin to destination.
- Road segments are **live** (OSRM). Rail/Hike are **fixed** using `polyline`.

## Pricing defaults
- National Park entry: $35/vehicle
- City parking: $4/hour
- Public lot: $15/day
- RV hookup: $55/night
- Museum adult ticket: $25