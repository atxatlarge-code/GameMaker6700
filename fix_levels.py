import re

with open('src/levels.js', 'r') as f:
    content = f.read()

# Define Level 3
level3_grid = """function createLevel3Grid() {
  const grid = createBlankGrid();
  // Bomb pickup
  grid[27][10] = 49;
  // Cracked block wall
  for(let r=24; r<=27; r++) { grid[r][15] = 50; }
  // Spike pit with crumbling block bridge
  for(let c=25; c<=35; c++) {
    grid[28][c] = 0; // Remove ground
    grid[29][c] = 0;
    grid[27][c] = 22; // Crumbling bridge
    grid[29][c] = 4; // Spikes
  }
  // Enemy on the other side handled in preset
  // Small wall to trap enemy
  grid[27][45] = 7;
  // Goal
  for(let r=25; r<=29; r++) { grid[r][55] = 7; }
  return grid;
}
"""

# Define Level 4
level4_grid = """function createLevel4Grid() {
  const grid = createBlankGrid();
  // Starting platform
  for(let c=0; c<=10; c++) {
    for(let r=25; r<=29; r++) { grid[r][c] = 7; }
  }
  // Gap 1
  for(let c=11; c<=13; c++) {
    grid[28][c] = 0; grid[29][c] = 0;
    grid[29][c] = 4; // Spikes
  }
  // Middle platform (Worm will be here)
  for(let c=14; c<=24; c++) {
    for(let r=25; r<=29; r++) { grid[r][c] = 7; }
  }
  // Gap 2
  for(let c=25; c<=27; c++) {
    grid[28][c] = 0; grid[29][c] = 0;
    grid[29][c] = 4;
  }
  // Platform 3 (Chaser enemy will be here)
  for(let c=28; c<=48; c++) {
    for(let r=25; r<=29; r++) { grid[r][c] = 7; }
  }
  // High platforms for Bats
  grid[20][33] = 7; grid[20][34] = 7;
  // Gap 3
  for(let c=49; c<=51; c++) {
    grid[28][c] = 0; grid[29][c] = 0;
    grid[29][c] = 4;
  }
  // Goal
  for(let c=52; c<60; c++) {
    for(let r=25; r<=29; r++) { grid[r][c] = 7; }
  }
  return grid;
}
"""

content = content.replace("const PRESETS = [", level3_grid + level4_grid + "const PRESETS = [")

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Inserted createLevel3Grid and createLevel4Grid.")
