import re

with open('src/levels.js', 'r') as f:
    content = f.read()

level8_grid = """function createLevel8Grid() {
  const grid = createBlankGrid();
  
  // Starting safe ground
  for(let c=0; c<=8; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Wall blocking the way
  for(let r=10; r<=29; r++) { grid[r][10] = 1; }
  
  // Ground past the wall
  for(let c=11; c<=20; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Gravity switch
  grid[28][18] = 29; // Gravity Switch
  
  // Ceiling path
  for(let c=15; c<=30; c++) { grid[4][c] = 7; grid[5][c] = 7; }
  
  // Spikes on floor and ceiling
  for(let c=31; c<=45; c++) {
    grid[28][c] = 0; grid[29][c] = 4; // Floor spikes
    grid[4][c] = 0; grid[5][c] = 4;   // Ceiling spikes (gravity is reversed, so these act as floor spikes)
  }
  
  // Gravity well to slingshot across
  grid[16][38] = 30; // Gravity Well
  
  // Ceiling path after spikes
  for(let c=46; c<=55; c++) { grid[4][c] = 7; grid[5][c] = 7; }
  
  // Gravity switch to drop back down
  grid[6][52] = 29; // Gravity Switch
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}
"""

new_preset = """  { id: 'level-7', name: 'Momentum & Trajectory', grid: createLevel7Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-8', name: 'Quantum Facility', grid: createLevel8Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, portal1: { col: 5, row: 27 }, portal2: { col: 15, row: 27 }, isPreset: true }
];"""

content = content.replace("function createLevel7Grid() {", level8_grid + "\nfunction createLevel7Grid() {")
content = content.replace("  { id: 'level-7', name: 'Momentum & Trajectory', grid: createLevel7Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true }\n];", new_preset)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Inserted Level 8.")
