const fs = require('fs');

const jsonData = JSON.parse(fs.readFileSync('scripts/new_points_georgia.json', 'utf8'));
const jsLines = jsonData.map(p => {
  const nameEsc = p.name.replace(/'/g, "\\'");
  const descEsc = p.description.replace(/'/g, "\\'");
  return `  {
    name: '${nameEsc}',
    lat: ${p.lat},
    lng: ${p.lng},
    description: '${descEsc}',
    prices: null,
    image: '${p.image}',
  },`;
});

const jsCode = jsLines.join('\n');
fs.writeFileSync('new_points_append.txt', jsCode);
console.log('Wrote', jsLines.length, 'entries to new_points_append.txt');
