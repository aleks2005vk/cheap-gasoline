const fs = require('fs');
const path = require('path');

const dataPath = path.resolve(__dirname, '../overpass_tbilisi.json');
const outPath = path.resolve(__dirname, 'new_points_tbilisi.json');

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
      if (val.includes(kw)) return { field: f, value: tags[f], keyword: kw };
    }
  }
  return false;
}

const results = [];
for (const el of obj.elements) {
  const tags = el.tags || {};
  const match = tagMatches(tags);
  if (!match) continue;

  let lat = null;
  let lon = null;
  if (el.type === 'node') {
    lat = el.lat; lon = el.lon;
  } else if (el.type === 'way' || el.type === 'relation') {
    if (el.center) { lat = el.center.lat; lon = el.center.lon; }
  }
  if (lat == null || lon == null) continue;

  const name = tags['name:en'] || tags.name || (tags.brand? tags.brand : (tags.operator|| 'Fuel Station'));
  const brand = tags['brand:en'] || tags.brand || tags.operator || '';

  results.push({
    name: String(name),
    lat: Number(lat),
    lng: Number(lon),
    description: brand ? `${brand}` : 'fuel station',
    prices: null,
    image: 'https://via.placeholder.com/120x80?text=Fuel'
  });
}

fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log('Wrote', results.length, 'points to', outPath);
