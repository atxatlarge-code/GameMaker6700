const fs = require('fs');
let data = JSON.parse(fs.readFileSync('custom_levels.json', 'utf8'));
let level = data[0];

// Player is at col 5, row 27.
// Let's build a tall wall at column 8 from row 20 to 28, blocking them.
for (let r = 20; r <= 28; r++) {
    level.grid[r][8] = 1;
}

level.name = "Unsolvable Forest";
data[0] = level;
fs.writeFileSync('custom_levels.json', JSON.stringify(data));
console.log("Level broken!");
