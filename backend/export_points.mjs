import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pointsPath = path.join(__dirname, '..', 'src', 'components', 'ui', 'map', 'points.js');
const pointsUrl = pathToFileURL(pointsPath).href;

try {
  const mod = await import(pointsUrl);
  const points = mod.pointsOfInterest || mod.default || [];
  console.log(JSON.stringify(points, null, 2));
} catch (err) {
  console.error('Failed to import points.js:', err && err.stack ? err.stack : err.message || err);
  process.exit(1);
}
