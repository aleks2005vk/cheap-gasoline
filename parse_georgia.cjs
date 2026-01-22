const fs = require('fs');
const path = require('path');

const dataPath = 'overpass_georgia.json';
const raw = fs.readFileSync(dataPath, 'utf8');
const obj = JSON.parse(raw);

const keywords = ['rompetrol','socar','wissol','lukoil','gulf','bp','shell','total'];

function tagMatches(tags) {
  if (!tags) return false;
  const fields = ['brand','brand:en','operator','name','name:en'];
  for (const f of fields) {
    if (!tags[f]) continue;
    const val = String(tags[f]).toLowerCase();
    for (const kw of keywords) {
      if (val.includes(kw)) return true;
    }
  }
  return false;
}

const results = [];
for (const el of obj.elements || []) {
  const tags = el.tags || {};
  if (!tagMatches(tags)) continue;

  let lat = null;
  let lon = null;
  if (el.type === 'node') {
    lat = el.lat; lon = el.lon;
  } else if (el.type === 'way' || el.type === 'relation') {
    if (el.center) { lat = el.center.lat; lon = el.center.lon; }
  }
  if (lat == null || lon == null) continue;

  const name = tags['name:en'] || tags.name || tags['brand:en'] || tags.brand || 'Fuel Station';
  const brand = tags['brand:en'] || tags.brand || tags.operator || '';

  results.push({
    name: String(name).substring(0, 80),
    lat: Number(lat),
    lng: Number(lon),
    description: brand ? `${String(brand).substring(0, 60)}` : 'fuel station',
    prices: null,
    image: 'https://via.placeholder.com/120x80?text=Fuel'
  });
}

console.log(`Found ${results.length} stations. Writing...`);
fs.writeFileSync('scripts/new_points_georgia.json', JSON.stringify(results, null, 2));
console.log(`Wrote to scripts/new_points_georgia.json`);
