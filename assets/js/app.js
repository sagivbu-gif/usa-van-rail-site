// Minimal app.js that fetches /itinerary_spec.txt and assets/config files.
// Renders day cards in sidebar and a Leaflet map with points & simple polylines.
// Guards for missing coords and returns clear console errors.

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return await res.json();
}

let map, markersLayer, polyLayer;
let defaults = {};
let iconsMap = {};
let itinerary = null;

function initMap() {
  map = L.map('map').setView([40.7580, -73.9855], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  polyLayer = L.layerGroup().addTo(map);
}

function iconFor(type) {
  const mapping = iconsMap[type] || null;
  if (!mapping) return null;
  const html = `<span class="badge"><img src="assets/icons/${mapping[1]}" alt="" style="width:20px;height:20px;vertical-align:middle"/></span>`;
  return html;
}

function formatTime(t) { return t || ''; }

function renderSidebar(itinerary) {
  const container = document.getElementById('daysList');
  container.innerHTML = '';
  if (!itinerary.days || itinerary.days.length === 0) {
    container.innerHTML = '<p>No days in itinerary.</p>';
    return;
  }
  itinerary.days.forEach(day => {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'card';
    const title = document.createElement('h3');
    title.textContent = `Day ${day.day} — ${day.date}`;
    dayDiv.appendChild(title);
    if (day.stops && day.stops.length) {
      day.stops.forEach(stop => {
        const stopDiv = document.createElement('div');
        stopDiv.className = 'card';
        let icons = iconFor(stop.type) || '';
        stopDiv.innerHTML = `<div class="badges">${icons} <strong>${stop.name}</strong></div>
          <div class="meta">Type: ${stop.type}${stop.subtype? ' / '+stop.subtype : ''}</div>
          <div>Arrival: ${stop.computed && stop.computed.arrival_time ? stop.computed.arrival_time : '-' } — Departure: ${stop.computed && stop.computed.departure_time ? stop.computed.departure_time : '-' }</div>`;
        stopDiv.addEventListener('click', () => onSelectStop(stop));
        dayDiv.appendChild(stopDiv);
      });
    }
    container.appendChild(dayDiv);
  });
}

function renderMap(itinerary) {
  if (!map) initMap();
  markersLayer.clearLayers();
  polyLayer.clearLayers();
  const allCoords = [];
  itinerary.days.forEach(day => {
    day.stops && day.stops.forEach(stop => {
      const coords = stop.coords || stop.from_coords || stop.to_coords || null;
      if (coords && Array.isArray(coords) && coords.length === 2) {
        const marker = L.marker([coords[0], coords[1]]);
        marker.bindPopup(`<strong>${stop.name}</strong><br>${stop.type}`);
        marker.on('click', () => onSelectStop(stop));
        marker.addTo(markersLayer);
        allCoords.push([coords[0], coords[1]]);
      }
    });
    day.stops && day.stops.forEach(stop => {
      if (stop.type === 'transfer' || stop.type === 'travel_day' || stop.type === 'train') {
        let from = stop.from_coords || stop.coords || null;
        let to = stop.to_coords || null;
        if (from && to && from.length===2 && to.length===2) {
          const latlngs = [[from[0], from[1]],[to[0], to[1]]];
          L.polyline(latlngs, {color:'#2d9cdb', weight:3, dashArray: '6 6'}).addTo(polyLayer);
          allCoords.push([from[0], from[1]]);
          allCoords.push([to[0], to[1]]);
        }
      }
    });
  });
  if (allCoords.length) {
    const bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds.pad(0.3));
  }
}

function onSelectStop(stop) {
  const sel = document.getElementById('selectedContent');
  const arrival = stop.computed && stop.computed.arrival_time ? stop.computed.arrival_time : '-';
  const departure = stop.computed && stop.computed.departure_time ? stop.computed.departure_time : '-';
  sel.innerHTML = `<h3>${stop.name}</h3>
    <div class="meta">Type: ${stop.type}${stop.subtype ? ' / '+stop.subtype : ''}</div>
    <div><strong>Arrival:</strong> ${arrival} <strong>Departure:</strong> ${departure}</div>
    <div><strong>What to do:</strong><br>${stop.description || '-'}</div>
    <div style="margin-top:6px"><em>Raw coords:</em> ${stop.coords ? stop.coords.join(', ') : (stop.from_coords ? stop.from_coords.join(', '): '-')}</div>`;
}

function computeSchedule(itin, landingDate, landingTime) {
  if (!itin || !itin.days) return itin;
  const baggage = defaults.baggage_claim_minutes || 120;
  const hotel_checkin = defaults.hotel_checkin_minutes || 150;
  let landingDateTime = null;
  if (landingDate && landingTime) {
    landingDateTime = landingDate + 'T' + landingTime;
  }
  function addMinutes(iso, mins) {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() + mins);
    return d.toISOString().slice(0,16);
  }
  if (landingDateTime) {
    for (const day of itin.days) {
      for (const stop of day.stops) {
        if (stop.type === 'airport') {
          const arr = landingDate + 'T' + landingTime;
          stop.computed = stop.computed || {};
          stop.computed.arrival_time = landingTime;
          const dep = addMinutes(arr, baggage);
          stop.computed.departure_time = dep.slice(11);
          let nextIndex = day.stops.indexOf(stop) + 1;
          if (nextIndex < day.stops.length) {
            const next = day.stops[nextIndex];
            if (next.type === 'transfer' && next.computed && next.computed.drive_minutes) {
              const driveMin = next.computed.drive_minutes;
              const arrivalNext = addMinutes(dep, driveMin);
              next.computed = next.computed || {};
              next.computed.departure_time = dep.slice(11);
              next.computed.arrival_time = arrivalNext.slice(11);
              if (next.to_coords && next.to_coords.length===2) {
                for (const s of day.stops) {
                  if (s.coords && s.coords[0]===next.to_coords[0] && s.coords[1]===next.to_coords[1]) {
                    s.computed = s.computed || {};
                    s.computed.arrival_time = arrivalNext.slice(11);
                    const hotelDep = addMinutes(arrivalNext, hotel_checkin);
                    s.computed.departure_time = hotelDep.slice(11);
                  }
                }
              }
            }
          }
          return itin;
        }
      }
    }
  }
  return itin;
}

async function main() {
  try {
    document.getElementById('status').textContent = 'Loading...';
    defaults = await fetchJSON('assets/config/defaults.json');
    iconsMap = await fetchJSON('assets/config/icons_map.json');
    itinerary = await fetchJSON('/itinerary_spec.txt');
    if (!itinerary.days) throw new Error('Parsed itinerary missing "days" array. Ensure /itinerary_spec.txt is at site root and returns JSON.');
    if (itinerary.start_date) {
      document.getElementById('landingDate').value = itinerary.start_date;
    } else if (itinerary.days && itinerary.days[0] && itinerary.days[0].date) {
      document.getElementById('landingDate').value = itinerary.days[0].date;
    }
    if (itinerary.landing && itinerary.landing.arrival_time) {
      document.getElementById('landingTime').value = itinerary.landing.arrival_time;
    }
    renderSidebar(itinerary);
    initMap();
    renderMap(itinerary);
    const landingDate = document.getElementById('landingDate').value;
    const landingTime = document.getElementById('landingTime').value;
    itinerary = computeSchedule(itinerary, landingDate, landingTime);
    renderSidebar(itinerary);
    document.getElementById('status').textContent = 'Loaded';
  } catch (err) {
    console.error(err);
    document.getElementById('daysList').innerHTML = '<div class="card"><strong>Error loading itinerary</strong><div style="font-size:13px;color:#a00">'+err.message+'</div></div>';
    document.getElementById('status').textContent = 'Error';
  }
}

document.getElementById('applyLanding').addEventListener('click', () => {
  try {
    const landingDate = document.getElementById('landingDate').value;
    const landingTime = document.getElementById('landingTime').value;
    itinerary = computeSchedule(itinerary, landingDate, landingTime);
    renderSidebar(itinerary);
    renderMap(itinerary);
  } catch (e) { console.error(e); }
});

main();
