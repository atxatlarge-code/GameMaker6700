import re

with open('src/levels.js', 'r') as f:
    content = f.read()

new_func = """function createLevel2Grid() {
  const grid = createBlankGrid();
  // Floor
  for(let c=0; c<60; c++) {
    grid[28][c] = 1;
    grid[29][c] = 1;
  }
  
  // Section 1: Breakable blocks blocking the way
  for(let r=25; r<=27; r++) {
    grid[r][10] = 6; // Breakable block
  }

  // Section 2: Moveable block to jump over a wall
  for(let r=24; r<=27; r++) {
    grid[r][25] = 1; // Wall
  }
  grid[27][20] = 10; // Moveable block
  
  // Section 3: Key & Lock
  grid[25][35] = 1; // Ledge
  grid[24][35] = 9; // Key
  
  for(let r=24; r<=27; r++) {
    grid[r][40] = 8; // Lock
  }

  // Section 4: Switch and Red/Blue Blocks
  grid[27][45] = 11; // Switch
  for(let r=25; r<=27; r++) {
    grid[r][50] = 12; // Red Block (disappears when switch is hit)
  }
  
  return grid;
}

"""

# Insert function right before const PRESETS
content = content.replace("const PRESETS = [", new_func + "const PRESETS = [")

# Add preset to PRESETS array
new_preset = """  {
    id: 'level-2',
    name: 'Puzzles & Pathways',
    grid: createLevel2Grid(),
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 55, row: 27 },
    isPreset: true,
  }
];"""

content = re.sub(r'\];$', new_preset, content, flags=re.MULTILINE)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Level 2 added to levels.js")
