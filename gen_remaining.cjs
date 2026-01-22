const fs = require('fs');
const jsonData = JSON.parse(fs.readFileSync('scripts/new_points_georgia.json', 'utf8'));

// Skip first 20 (already added), add remaining 512
const toAdd = jsonData.slice(20);

const lines = toAdd.map(p => {
  const name = (p.name || 'Station').replace(/'/g, "\\'");
  const desc = (p.description || '').replace(/'/g, "\\'");
  return `  {
    name: '${name}',
    lat: ${p.lat},
    lng: ${p.lng},
    description: '${desc}',
    prices: null,
    image: 'https://via.placeholder.com/120x80?text=Fuel',
  },`;
});

console.log(lines.join('\n'));
