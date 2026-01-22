const fs = require('fs');

const pointsContent = fs.readFileSync('src/components/ui/map/points.js', 'utf8');
const remainingContent = fs.readFileSync('remaining_points_output.txt', 'utf8');

// Insert remaining entries before the final ];
const newContent = pointsContent.replace(/\];$/, `${remainingContent}
\];`);

fs.writeFileSync('src/components/ui/map/points.js', newContent, 'utf8');
console.log('✓ Appended 512 stations to points.js');
