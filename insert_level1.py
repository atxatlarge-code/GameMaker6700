import re

with open('src/levels.js', 'r') as f:
    content = f.read()

new_func = """function createLevel1Grid() {
  const grid = createBlankGrid();
  
  // Floor
  for(let c=0; c<60; c++) {
    grid[28][c] = 7;
    grid[29][c] = 7;
  }
  
  // Hurdle
  grid[27][10] = 1;
  
  // Gap
  grid[28][20] = 0; grid[29][20] = 0;
  
  // Spikes
  grid[28][30] = 4;
  
  // Small ledge
  for(let r=25; r<=29; r++) {
    grid[r][40] = 1;
    grid[r][41] = 1;
  }
  grid[27][38] = 2; // Trampoline
  
  // Goal platform
  for(let c=50; c<60; c++) {
    grid[25][c] = 7; // Same height as ledge
  }
  
  return grid;
}

"""

content = content.replace("const PRESETS = [", new_func + "const PRESETS = [")

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Inserted createLevel1Grid.")
