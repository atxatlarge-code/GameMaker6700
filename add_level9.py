import re

with open('src/levels.js', 'r') as f:
    content = f.read()

level9_grid = """function createLevel9Grid() {
  const grid = createBlankGrid();
  
  // Starting area
  for(let c=0; c<=6; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Shrink potion
  grid[27][4] = 104; 
  
  // Wall with 1-tile gap at the bottom
  for(let r=10; r<=27; r++) { grid[r][8] = 1; }
  grid[29][8] = 1; // Floor is solid, gap is at row 28
  
  // Grapple area
  for(let c=9; c<=18; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  grid[27][14] = 44; // Grapple powerup
  
  // Grapple pit
  for(let c=19; c<=30; c++) { grid[28][c] = 0; grid[29][c] = 4; } // Spikes below
  for(let c=19; c<=30; c++) { grid[15][c] = 1; } // Ceiling to grapple onto
  
  // Bomb area
  for(let c=31; c<=40; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  grid[27][34] = 49; // Bomb powerup
  
  // Destructible wall
  for(let r=20; r<=27; r++) { grid[r][40] = 6; } // Explodable blocks
  
  // Boomerang area
  for(let c=41; c<=50; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  grid[27][44] = 33; // Boomerang powerup
  
  // Switch
  grid[20][45] = 12; // Red Switch
  
  // Door (Blue blocks that turn off when red switch is hit? Wait, if switch is red, blue blocks are solid. Hit switch -> turns blue -> red blocks solid, blue blocks disappear)
  for(let r=20; r<=27; r++) { grid[r][50] = 13; } // Blue switch block
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}
"""

new_preset = """  { id: 'level-8', name: 'Quantum Facility', grid: createLevel8Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, portal1: { col: 5, row: 27 }, portal2: { col: 15, row: 27 }, isPreset: true },
  { id: 'level-9', name: 'Powerup Playground', grid: createLevel9Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true }
];"""

content = content.replace("function createLevel8Grid() {", level9_grid + "\nfunction createLevel8Grid() {")
content = content.replace("  { id: 'level-8', name: 'Quantum Facility', grid: createLevel8Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, portal1: { col: 5, row: 27 }, portal2: { col: 15, row: 27 }, isPreset: true }\n];", new_preset)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Inserted Level 9.")
