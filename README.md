# USA Van + Rail — Deploy package (no images)

This ZIP contains a ready-to-upload set of files for the `usa-van-rail-site` deploy repository (single-page site) and supporting spec files.

## What is included
- `index.html` — single-page map UI (no images) using Leaflet.
- `assets/main.js` — map renderer and itinerary loader (reads `/itinerary_spec.txt`).
- `itinerary_spec.txt` — JSON schema v2 sample with 15 days filled (no images).
- `point_types_spec.md` — definitions and required fields.
- `site_requirements_en.md` — site requirements and behavior summary.
- `resources.md` — pricing defaults and references.

## How to deploy (GitHub Pages)
1. In your `usa-van-rail-site` repository (deploy), replace the `index.html` and `assets/` folder with the contents of this ZIP.
2. Copy `itinerary_spec.txt`, `point_types_spec.md`, and other spec files into the repo root or into `usa-van-rail-specs` depending on your workflow.
3. Commit with message:
   - `update specs` if you changed only spec files.
   - `deploy update` for site changes (index.html/assets).
4. Push to GitHub. Pages should serve the updated site from the repo (ensure GitHub Pages is enabled).

## Notes & next steps
- This package intentionally omits images. When ready, add an `images/` folder and ensure `slug` values in the spec map to filenames.
- For production Tailwind usage: build CSS locally using PostCSS/Tailwind CLI and replace the minimal CSS included in `index.html`.
- For live driving routes: integrate OSRM routing server calls or precompute polylines and store them in `itinerary_spec.txt`.

