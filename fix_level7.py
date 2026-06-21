import re

with open('src/levels.js', 'r') as f:
    content = f.read()

# We need to replace createLevel7Grid()
level7_grid = """function createLevel7Grid() {
  const grid = createBlankGrid();
  
  for(let c=0; c<=4; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  grid[27][3] = 41; // Dash Powerup
  
  for(let c=5; c<=8; c++) {
    grid[28][c] = 24; // Dash Panel Right
    grid[29][c] = 7;
  }
  
  for(let c=9; c<=50; c++) {
    grid[28][c] = 0; grid[29][c] = 4; // Spikes below
  }
  
  // Rope over the gap, reachable from dash panel jump
  // Player dashes at y=28, jumps around col 9, reaches peak around col 12 at y=24
  // We'll place the rope anchor at y=20 so the rope hangs down to y=23 (length 120 pixels = 3 tiles)
  grid[20][15] = 55; // Rope anchor
  
  // Cannon barrel to shoot the player across the rest of the gap
  // Player swings from col 15, let's put cannon at col 23, row 22
  grid[22][23] = 53; // Cannon barrel
  
  // Minecart on a floating track
  // Cannon shoots player at an angle, let's say they land at col 35
  for(let c=35; c<=48; c++) {
    grid[25][c] = 7; // Ground for track
  }
  grid[24][36] = 56; // Minecart
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}"""

# Use regex to replace the old createLevel7Grid function
content = re.sub(r'function createLevel7Grid\(\) \{.*?\n\}', level7_grid, content, flags=re.DOTALL)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Fixed Level 7.")
