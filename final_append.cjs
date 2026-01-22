const fs = require('fs');

const pointsPath = 'src/components/ui/map/points.js';
const remainingPath = 'remaining_points_output.txt';

const content = fs.readFileSync(pointsPath, 'utf8');
const remaining = fs.readFileSync(remainingPath, 'utf8');

// Find the last occurrence of ];
const lastIdx = content.lastIndexOf('];');
if (lastIdx === -1) {
  console.error('ERROR: closing ]; not found');
  process.exit(1);
}

const before = content.substring(0, lastIdx);
const after = content.substring(lastIdx);

const combined = before + ',\n' + remaining + '\n' + after;

fs.writeFileSync(pointsPath, combined, 'utf8');
console.log('✅ Successfully appended all 512 remaining stations to points.js');

// Verify
const newContent = fs.readFileSync(pointsPath, 'utf8');
const count = (newContent.match(/name: '/g) || []).length;
console.log(`Total entries in points.js: ${count}`);
