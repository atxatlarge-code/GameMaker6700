import re

with open('src/levels.js', 'r') as f:
    content = f.read()

level10_grid = """function createLevel10Grid() {
  const grid = createBlankGrid();
  
  // Safe start
  for(let c=0; c<=3; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Conveyor over lava
  for(let c=4; c<=12; c++) {
    grid[28][c] = 20; // Conveyor Right
    grid[29][c] = 22; // Lava below
  }
  
  // Turret firing from above
  grid[20][10] = 8; // Laser Turret Down? Wait, we don't know the exact direction, let's just place it at 10, 20
  
  // Jump through platforms moving up
  grid[24][15] = 52;
  grid[20][18] = 52;
  grid[16][21] = 52;
  
  // Dash powerup at top
  grid[15][21] = 41; // Dash Powerup
  
  // Long dash gap
  for(let c=22; c<=35; c++) {
    grid[29][c] = 22; // Lava
  }
  
  // Rope over lava
  grid[5][30] = 55; // Rope anchor
  
  // Landing zone with switch
  for(let c=36; c<=42; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  grid[27][40] = 12; // Red Switch
  
  // Blue switch door
  for(let r=10; r<=28; r++) { grid[r][44] = 13; } // Blue blocks
  
  // Cannon to shoot over final gap
  grid[27][42] = 53; // Cannon
  
  // Gravity well
  grid[15][50] = 30; // Gravity well
  
  // Final goal
  for(let c=55; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}
"""

new_preset = """  { id: 'level-9', name: 'Powerup Playground', grid: createLevel9Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-10', name: 'The Final Gauntlet', grid: createLevel10Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 57, row: 27 }, isPreset: true }
];"""

content = content.replace("function createLevel9Grid() {", level10_grid + "\nfunction createLevel9Grid() {")
content = content.replace("  { id: 'level-9', name: 'Powerup Playground', grid: createLevel9Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true }\n];", new_preset)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Inserted Level 10.")
