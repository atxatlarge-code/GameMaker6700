import re

with open('src/levels.js', 'r') as f:
    content = f.read()

level7_grid = """
function createLevel7Grid() {
  const grid = createBlankGrid();
  
  // Starting safe ground
  for(let c=0; c<=4; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Dash powerup
  grid[27][3] = 41; // Dash Powerup
  
  // Dash Panel Right launching over a large gap
  for(let c=5; c<=8; c++) {
    grid[28][c] = 24; // Dash Panel Right
    grid[29][c] = 7;
  }
  
  // Giant spike pit
  for(let c=9; c<=50; c++) {
    grid[28][c] = 0; grid[29][c] = 4; // Spikes below
  }
  
  // Rope over the gap
  grid[10][20] = 55; // Rope anchor
  
  // Cannon in the middle of the air
  grid[20][32] = 53; // Cannon barrel
  
  // Minecart on a floating track
  for(let c=40; c<=48; c++) {
    grid[24][c] = 7; // Ground for track
  }
  grid[23][40] = 56; // Minecart
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}
"""

new_preset = """  { id: 'level-6', name: 'Industrial Complex', grid: createLevel6Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-7', name: 'Momentum & Trajectory', grid: createLevel7Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true }
];"""

content = content.replace("function createLevel6Grid() {", level7_grid + "\nfunction createLevel6Grid() {")
content = content.replace("  { id: 'level-6', name: 'Industrial Complex', grid: createLevel6Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true }\n];", new_preset)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Inserted Level 7.")
