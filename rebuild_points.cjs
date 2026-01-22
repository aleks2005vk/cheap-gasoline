const fs = require('fs');

// Read JSON data
const jsonData = JSON.parse(fs.readFileSync('scripts/new_points_georgia.json', 'utf8'));

// Convert to JS object literals (all 532)
const lines = jsonData.map(p => {
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

// Create the full export
const fullCode = `export const pointsOfInterest = [
  // Wissol станции с ценами и изображениями
  {
    name: 'Wissol Premium Station 1',
    lat: 41.793563,
    lng: 44.770812,
    description: 'Премиум-станция Wissol',
    prices: { regular: 2.30, premium: 2.40, diesel: 2.55 },
    image: 'https://via.placeholder.com/120x80?text=Wissol+1',
  },
  {
    name: 'Wissol Premium Station 2',
    lat: 41.778937,
    lng: 44.796312,
    description: 'Премиум-станция Wissol',
    prices: { regular: 2.32, premium: 2.42, diesel: 2.57 },
    image: 'https://via.placeholder.com/120x80?text=Wissol+2',
  },
  {
    name: 'Wissol Premium Station 3',
    lat: 41.787312,
    lng: 44.799937,
    description: 'Премиум-станция Wissol',
    prices: { regular: 2.31, premium: 2.41, diesel: 2.56 },
    image: 'https://via.placeholder.com/120x80?text=Wissol+3',
  },
  {
    name: 'Wissol Economy Station',
    lat: 41.766437,
    lng: 44.769188,
    description: 'Эконом-станция Wissol',
    prices: { regular: 2.25, premium: 2.35, diesel: 2.50 },
    image: 'https://via.placeholder.com/120x80?text=Wissol+4',
  },

  // SOCAR станции (demo)
  {
    name: 'SOCAR Downtown',
    lat: 41.75284003977971,
    lng: 44.77008311963776,
    description: 'SOCAR центральная станция',
    prices: { regular: 2.28, premium: 2.38, diesel: 2.53 },
  },
  {
    name: 'SOCAR Sabail',
    lat: 41.761163631923885,
    lng: 44.76828067512463,
    description: 'SOCAR Сабаил район',
    prices: { regular: 2.27, premium: 2.37, diesel: 2.52 },
  },
  {
    name: 'SOCAR Natashnana',
    lat: 41.785400296988236,
    lng: 44.79870420429224,
    description: 'SOCAR Натачнана',
    prices: { regular: 2.29, premium: 2.39, diesel: 2.54 },
  },
  {
    name: 'SOCAR Airport Road',
    lat: 41.6847715243548,
    lng: 44.82525675825556,
    description: 'SOCAR по дороге на аэропорт',
    prices: { regular: 2.26, premium: 2.36, diesel: 2.51 },
  },
  {
    name: 'SOCAR South Highway',
    lat: 41.72541450358457,
    lng: 44.77913113549115,
    description: 'SOCAR южная дорога',
    prices: { regular: 2.24, premium: 2.34, diesel: 2.49 },
  },
  {
    name: 'SOCAR North Central',
    lat: 41.78016995481618,
    lng: 44.76876944291004,
    description: 'SOCAR северный центр',
    prices: { regular: 2.28, premium: 2.38, diesel: 2.53 },
  },
  {
    name: 'SOCAR Baku Center',
    lat: 41.781768116200226,
    lng: 44.796969166182265,
    description: 'SOCAR центр Баку',
    prices: { regular: 2.30, premium: 2.40, diesel: 2.55 },
  },
  {
    name: 'SOCAR East Bay',
    lat: 41.699166448697966,
    lng: 44.870111865674424,
    description: 'SOCAR восточный залив',
    prices: { regular: 2.25, premium: 2.35, diesel: 2.50 },
  },
  {
    name: 'SOCAR Yasamal',
    lat: 41.755948312033745,
    lng: 44.78930061171106,
    description: 'SOCAR Ясамал',
    prices: { regular: 2.29, premium: 2.39, diesel: 2.54 },
  },
  {
    name: 'SOCAR Nizami',
    lat: 41.78434600459173,
    lng: 44.78187562756443,
    description: 'SOCAR Низами',
    prices: { regular: 2.31, premium: 2.41, diesel: 2.56 },
  },
  {
    name: 'SOCAR Absheron',
    lat: 41.66992534895528,
    lng: 44.855956712218905,
    description: 'SOCAR Абшерон',
    prices: { regular: 2.23, premium: 2.33, diesel: 2.48 },
  },
  {
    name: 'SOCAR Southwest',
    lat: 41.72121462043013,
    lng: 44.74602447360111,
    description: 'SOCAR юго-западная',
    prices: { regular: 2.26, premium: 2.36, diesel: 2.51 },
  },
  {
    name: 'SOCAR West Gate',
    lat: 41.72195039242852,
    lng: 44.73060061171107,
    description: 'SOCAR западные врата',
    prices: { regular: 2.27, premium: 2.37, diesel: 2.52 },
  },
  {
    name: 'SOCAR Sumgait Road',
    lat: 41.49318120527854,
    lng: 44.819880258255566,
    description: 'SOCAR дорога на Сумгаит',
    prices: { regular: 2.22, premium: 2.32, diesel: 2.47 },
  },
  {
    name: 'SOCAR Matbulat',
    lat: 41.78110601966969,
    lng: 44.76958562756446,
    description: 'SOCAR Матбулат',
    prices: { regular: 2.28, premium: 2.38, diesel: 2.53 },
  },
  {
    name: 'SOCAR Fountain Square',
    lat: 41.77324057860062,
    lng: 44.8029088963655,
    description: 'SOCAR площадь Фонтанов',
    prices: { regular: 2.30, premium: 2.40, diesel: 2.55 },
  },
  {
    name: 'SOCAR Ganja Road',
    lat: 41.72217851665621,
    lng: 44.764838542910034,
    description: 'SOCAR дорога на Гянджу',
    prices: { regular: 2.25, premium: 2.35, diesel: 2.50 },
  },
  {
    name: 'SOCAR Bayil Port',
    lat: 41.68513727097273,
    lng: 44.82672562756445,
    description: 'SOCAR Баильский порт',
    prices: { regular: 2.24, premium: 2.34, diesel: 2.49 },
  },
  {
    name: 'SOCAR Seaside',
    lat: 41.755098890958074,
    lng: 44.77992618894666,
    description: 'SOCAR береговая',
    prices: { regular: 2.29, premium: 2.39, diesel: 2.54 },
  },
  {
    name: 'SOCAR Pirallahi',
    lat: 41.56448359185823,
    lng: 44.97613896618225,
    description: 'SOCAR Пиралахи',
    prices: { regular: 2.20, premium: 2.30, diesel: 2.45 },
  },
  {
    name: 'SOCAR Masazir',
    lat: 41.692994297546264,
    lng: 44.961147804292224,
    description: 'SOCAR Масазыр',
    prices: { regular: 2.21, premium: 2.31, diesel: 2.46 },
  },
  {
    name: 'SOCAR Binagadi',
    lat: 41.78789597056936,
    lng: 44.802894273601126,
    description: 'SOCAR Бинагади',
    prices: { regular: 2.27, premium: 2.37, diesel: 2.52 },
  },
  {
    name: 'SOCAR Surakhani',
    lat: 41.73696839499237,
    lng: 44.83945603498332,
    description: 'SOCAR Сураханы',
    prices: { regular: 2.26, premium: 2.36, diesel: 2.51 },
  },
  {
    name: 'SOCAR Shaki',
    lat: 42.03353707219411,
    lng: 43.82911184291001,
    description: 'SOCAR Шаки',
    prices: { regular: 2.19, premium: 2.29, diesel: 2.44 },
  },
  {
    name: 'SOCAR Lankaran',
    lat: 41.54918628976695,
    lng: 45.02327911963775,
    description: 'SOCAR Ланкаран',
    prices: { regular: 2.18, premium: 2.28, diesel: 2.43 },
  },
  {
    name: 'SOCAR Jalilabad',
    lat: 41.58124418243834,
    lng: 44.95488778101997,
    description: 'SOCAR Джалилабад',
    prices: { regular: 2.20, premium: 2.30, diesel: 2.45 },
  },

  // 532 real fuel stations from OpenStreetMap (Rompetrol, SOCAR, Wissol, Lukoil, Gulf, BP, Shell, Total)
${lines.join('\n')}
];
`;

fs.writeFileSync('src/components/ui/map/points.js', fullCode, 'utf8');
console.log(`✅ Created points.js with ${jsonData.length + 30} total stations`);
