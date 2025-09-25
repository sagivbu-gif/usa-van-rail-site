
/* assets/main.js
   Robust, defensive map renderer for the itinerary_spec.txt (JSON).
   - handles missing coords
   - handles missing polyline (draws dashed straight line between from->to)
   - supports encoded Google polyline strings (decodePolyline)
   - supports raw polylines as arrays of [lat,lng] pairs
   - toggles scenic/fast preference (affects style only)
*/

async function fetchItinerary() {
  try {
    const r = await fetch('/itinerary_spec.txt', {cache: 'no-store'});
    const text = await r.text();
    // The itinerary_spec.txt is JSON. Trim and parse.
    const data = JSON.parse(text);
    return data;
  } catch (err) {
    console.error('Failed to load itinerary_spec.txt:', err);
    throw err;
  }
}

/* Decode encoded polyline (Google encoded polyline algorithm) */
function decodePolyline(encoded) {
  if (!encoded || typeof encoded !== 'string') return [];
  let index = 0, lat = 0, lng = 0, coordinates = [];
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += deltaLat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += deltaLng;
    coordinates.push([lat / 1e5, lng / 1e5]);
  }
  return coordinates;
}

function isLatLng(obj) {
  return Array.isArray(obj) && obj.length === 2 && typeof obj[0] === 'number' && typeof obj[1] === 'number';
}

function ensureLatLngArray(poly) {
  if (!poly) return [];
  // If encoded string
  if (typeof poly === 'string') return decodePolyline(poly);
  // If array of arrays already
  if (Array.isArray(poly) && poly.length && Array.isArray(poly[0]) && isLatLng(poly[0])) return poly;
  // Unknown
  return [];
}

function createMarker(point) {
  const title = point.name || '(unknown)';
  const el = L.marker([point.coords[0], point.coords[1]]);
  let popup = `<strong>${title}</strong><div class="muted">${point.type || ''}</div>`;
  if (point.description) popup += `<div style="margin-top:6px">${point.description}</div>`;
  if (point.parking) popup += `<div class="small">Parking: ${point.parking}</div>`;
  if (point.price_estimate) popup += `<div class="small">Est. price: ${point.price_estimate}</div>`;
  el.bindPopup(popup);
  return el;
}

function fitMapToLayers(map, group) {
  try {
    const bounds = group.getBounds();
    if (bounds.isValid()) map.fitBounds(bounds, {padding: [40,40]});
  } catch(e){ console.warn('fit bounds failed', e); }
}

(async function init() {
  const map = L.map('map', {trackResize: true}).setView([39.5, -98.35], 4);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

  // Simple layer groups
  const drivesLayer = L.layerGroup().addTo(map);
  const railsLayer = L.layerGroup().addTo(map);
  const hikesLayer = L.layerGroup().addTo(map);
  const pointsLayer = L.layerGroup().addTo(map);

  const overlayGroup = L.featureGroup().addTo(map);

  let pref = 'scenic';
  const prefValEl = document.getElementById('prefVal');
  const togglePrefBtn = document.getElementById('togglePref');
  togglePrefBtn.addEventListener('click', () => {
    pref = (pref === 'scenic') ? 'fastest' : 'scenic';
    prefValEl.textContent = pref;
    // Could re-fetch or re-style polylines based on preference. For now, only style toggles.
    document.querySelectorAll('.route-line').forEach(el => {
      if (pref === 'scenic') el.setStyle && el.setStyle({dashArray: null, opacity:1});
      else el.setStyle && el.setStyle({dashArray: '6,8', opacity:0.9});
    });
  });

  // Load data
  let itinerary;
  try { itinerary = await fetchItinerary(); } catch(e){ 
    const el = document.getElementById('daysList');
    el.innerHTML = `<div class="warning">Could not load itinerary_spec.txt — check that the file exists and is valid JSON.</div>`;
    return;
  }

  // Date anchor display if provided
  if (itinerary.date_anchor) {
    const dateVal = document.getElementById('dateVal');
    dateVal.textContent = itinerary.date_anchor;
  }

  const daysListEl = document.getElementById('daysList');
  daysListEl.innerHTML = ''; // clear

  const missingCoords = [];
  const routeGroup = L.featureGroup().addTo(map);

  (itinerary.days || []).forEach((day, dayIndex) => {
    const card = document.createElement('div');
    card.className = 'day-card';
    const title = document.createElement('div');
    title.innerHTML = `<strong>Day ${dayIndex+1} — ${day.title || day.summary || ''}</strong>`;
    card.appendChild(title);

    const info = document.createElement('div');
    info.className = 'muted';
    info.innerText = `Planned stay: ${day.stay_summary || (day.points && day.points.length)+' points' || '—'}`;
    card.appendChild(info);

    // Points list
    const ul = document.createElement('div');
    ul.style.marginTop = '8px';

    (day.points || []).forEach(pt => {
      const pdiv = document.createElement('div');
      pdiv.className = 'small';
      pdiv.innerHTML = `<strong>${pt.name}</strong> — ${pt.type || ''} — ${pt.stay_duration_min || '-'} min`;
      ul.appendChild(pdiv);

      // create marker if coords valid
      if (pt.coords && isLatLng(pt.coords)) {
        const m = createMarker(pt);
        m.addTo(pointsLayer);
        routeGroup.addLayer(m);
      } else {
        missingCoords.push(pt.id || pt.name || ('day'+(dayIndex+1)));
        console.warn('Point missing coords, skipping marker:', pt);
      }
    });

    card.appendChild(ul);

    // Segments: draw polylines based on mode
    (day.segments || []).forEach(seg => {
      const from = seg.from;
      const to = seg.to;
      // Validate endpoints
      if (!from || !to || !from.coords || !to.coords || !isLatLng(from.coords) || !isLatLng(to.coords)) {
        console.warn('Segment endpoints missing coords — segment skipped or drawn straight depending on availability', seg);
        return;
      }

      let latlngs = [];
      if (seg.polyline && seg.polyline.length) {
        latlngs = ensureLatLngArray(seg.polyline);
      } else {
        // Try encoded_polyline string
        if (seg.encoded_polyline && typeof seg.encoded_polyline === 'string') {
          latlngs = decodePolyline(seg.encoded_polyline);
        } else {
          // Draw dashed straight line between from and to
          latlngs = [from.coords, to.coords];
        }
      }

      // If polyline decoding failed but endpoints ok, fallback
      if (!latlngs || !latlngs.length) latlngs = [from.coords, to.coords];

      // Choose style by mode
      const mode = (seg.mode || 'drive').toLowerCase();
      let style = {weight:4, opacity:0.85};
      if (mode === 'drive') style.color = '#1e40af';
      else if (mode === 'rail') style.color = '#10b981';
      else if (mode === 'hike' || mode === 'walk') style.color = '#f97316';
      else style.color = '#6b7280';

      // If polyline was missing originally, make dashed and add a warning popup
      const missingPolyline = !(seg.polyline && seg.polyline.length) && !seg.encoded_polyline;
      if (missingPolyline) style.dashArray = '8,8', style.opacity = 0.85;

      const poly = L.polyline(latlngs, style);
      poly.className = 'route-line';
      poly.addTo(routeGroup);

      // Popup with segment info
      const popupLines = [];
      popupLines.push(`<strong>${seg.summary || (mode+' segment')}</strong>`);
      if (seg.distance_text) popupLines.push(`<div>Distance: ${seg.distance_text}</div>`);
      if (seg.duration_text) popupLines.push(`<div>Duration: ${seg.duration_text}</div>`);
      if (missingPolyline) popupLines.push(`<div class="small" style="color:#b45309">Warning: polyline missing — rendered as straight dashed line</div>`);
      poly.bindPopup(popupLines.join(''));

    });

    // Add a quick "center on day" button
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.style.marginTop = '8px';
    btn.textContent = 'Center on day';
    btn.addEventListener('click', () => {
      const bounds = L.featureGroup(
        (day.points || []).filter(p=>p.coords && isLatLng(p.coords)).map(p=>L.marker(p.coords))
      ).getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, {padding:[40,40]});
    });
    card.appendChild(btn);

    daysListEl.appendChild(card);
  });

  if (missingCoords.length) {
    console.warn('Points missing coords (skipped markers):', missingCoords);
  }

  // Fit map to route
  try { if (routeGroup.getLayers().length) map.fitBounds(routeGroup.getBounds(), {padding:[40,40]}); } catch(e){}

})();
