import re

with open('src/levels.js', 'r') as f:
    content = f.read()

level6_grid = """
function createLevel6Grid() {
  const grid = createBlankGrid();
  
  // Starting safe ground
  for(let c=0; c<=4; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Conveyor Right over spikes
  for(let c=5; c<=15; c++) {
    grid[28][c] = 20; // Conveyor Right
    grid[29][c] = 4;  // Spikes below
  }
  
  // Wind Up tunnel
  for(let c=16; c<=18; c++) {
    for(let r=10; r<=29; r++) {
      grid[r][c] = 36; // Wind Up
    }
  }
  
  // Conveyor Left platform high up
  for(let c=19; c<=25; c++) {
    grid[15][c] = 19; // Conveyor Left
  }
  
  // Jump through platforms
  for(let c=28; c<=30; c++) { grid[12][c] = 52; }
  for(let c=32; c<=34; c++) { grid[16][c] = 52; }
  for(let c=28; c<=30; c++) { grid[20][c] = 52; }
  
  // Wind Right over giant spike pit
  for(let c=31; c<=50; c++) {
    for(let r=20; r<=28; r++) {
      grid[r][c] = 39; // Wind Right
    }
    grid[29][c] = 4; // Spikes below
  }
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}
"""

new_preset = """  { id: 'level-5', name: 'The Elements', grid: createLevel5Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-6', name: 'Industrial Complex', grid: createLevel6Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true }
];"""

content = content.replace("function createLevel5Grid() {", level6_grid + "\nfunction createLevel5Grid() {")
content = content.replace("  { id: 'level-5', name: 'The Elements', grid: createLevel5Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true }\n];", new_preset)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Inserted Level 6.")
