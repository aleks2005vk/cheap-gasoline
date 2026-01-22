const fs = require('fs');
const path = require('path');

const ptsPath = path.join(__dirname, '..', 'src', 'components', 'ui', 'map', 'points.js');
const out = process.stdout;

let text = fs.readFileSync(ptsPath, 'utf8');

// Simple heuristic: find the first '[' after 'pointsOfInterest' and the matching closing '];'
const marker = 'pointsOfInterest';
const idx = text.indexOf(marker);
if (idx === -1) {
  console.error('pointsOfInterest marker not found in points.js');
  process.exit(2);
}
const arrStart = text.indexOf('[', idx);
if (arrStart === -1) {
  console.error('Array start not found');
  process.exit(2);
}

// Find closing bracket by counting nesting
let i = arrStart;
let depth = 0;
for (; i < text.length; i++) {
  const ch = text[i];
  if (ch === '[') depth++;
  else if (ch === ']') {
    depth--;
    if (depth === 0) break;
  }
}
const arrEnd = i;
let arrText = text.slice(arrStart, arrEnd + 1);

// Remove line comments
arrText = arrText.replace(/\/\/.*$/gm, '');
// Remove block comments
arrText = arrText.replace(/\/\*[\s\S]*?\*\//g, '');

// Replace single quotes with double quotes (naive but works for this file)
arrText = arrText.replace(/'(.*?)'/gs, function (m, p1) {
  // escape inner double quotes
  const inner = p1.replace(/"/g, '\\"');
  return '"' + inner + '"';
});

// Remove trailing commas before } or ]
arrText = arrText.replace(/,\s*(\}|\])/g, '$1');

// Wrap in parentheses so we can eval safely
try {
  const vm = require('vm');
  const script = new vm.Script('result = ' + arrText);
  const ctx = {};
  script.runInNewContext(ctx);
  const result = ctx.result;
  out.write(JSON.stringify(result, null, 2));
} catch (err) {
  console.error('Error while parsing array:', err.message);
  process.exit(3);
}
