import re

with open('src/levels.js', 'r') as f:
    content = f.read()

# Make it extremely simple: just a flat floor
new_level_1 = """function createLevel1Grid() {
  const grid = createBlankGrid();
  
  // Floor
  for(let c=0; c<60; c++) {
    grid[28][c] = 1;
    grid[29][c] = 1;
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
    grid[25][c] = 1; // Same height as ledge
  }
  
  return grid;
}"""

content = re.sub(r'function createLevel1Grid\(\) \{.*?\n\}', new_level_1, content, flags=re.DOTALL)
content = re.sub(r"goalPos:\s*\{[^}]*\}", "goalPos: { col: 55, row: 24 }", content)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Updated createLevel1Grid with easier obstacles.")
