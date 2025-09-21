# Point Types (Spec v2)

- Each point: id, name, type, coords [lat,lng], stay_duration_min, description, links, parking, price_estimate.

## Segment polyline rules
- Can be **encoded string** (Google-style polyline).
- Or **raw array of coordinates**.
- If empty → draw **dashed straight line** from origin to destination.
