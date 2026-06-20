import re

with open('src/levels.js', 'r') as f:
    content = f.read()

# 1. Update createBlankGrid to use tile 7
content = content.replace("row.push(0);", "row.push(r >= 28 ? 7 : 0);")

# 2. Update createLevel1Grid
new_level_1 = """function createLevel1Grid() {
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
}"""

content = re.sub(r'function createLevel1Grid\(\) \{.*?\n\}', new_level_1, content, flags=re.DOTALL)

# 3. Define Level 2
level2_grid = """function createLevel2Grid() {
  const grid = createBlankGrid();
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

# 4. Define Level 3
level3_grid = """function createLevel3Grid() {
  const grid = createBlankGrid();
  // Bomb pickup
  grid[27][10] = 52;
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

# 5. Define Level 4
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

content = content.replace("const PRESETS = [", level2_grid + level3_grid + level4_grid + "const PRESETS = [")

# Now REPLACE the entire PRESETS block!
# From "const PRESETS = [" down to "];" before "function createTinyTunnelsGrid"

# The presets array we want to insert:
new_presets_array = """const PRESETS = [
  {
    id: 'level-1',
    name: 'The Fundamentals',
    grid: createLevel1Grid(),
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 55, row: 24 },
    isPreset: true,
  },
  {
    id: 'level-2',
    name: 'Puzzles & Pathways',
    grid: createLevel2Grid(),
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 55, row: 27 },
    isPreset: true,
  },
  {
    id: 'level-3',
    name: 'Demolition & Danger',
    grid: createLevel3Grid(),
    enemies: [
      { id: 'e1', col: 42, row: 26, speed: 1.8, patrolRange: 5, type: 'basic' }
    ],
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 55, row: 24 },
    isPreset: true,
  },
  {
    id: 'level-4',
    name: 'Hostile Territory',
    grid: createLevel4Grid(),
    enemies: [
      { id: 'e1', col: 19, row: 24, speed: 0, patrolRange: 0, type: 'worm' },
      { id: 'e2', col: 33, row: 19, speed: 0, patrolRange: 0, type: 'bat' },
      { id: 'e3', col: 45, row: 24, speed: 1.8, patrolRange: 0, type: 'chaser' }
    ],
    playerSpawn: { col: 2, row: 24 },
    goalPos: { col: 57, row: 24 },
    isPreset: true,
  }
];"""

content = re.sub(r'const PRESETS = \[.*?\];', new_presets_array, content, flags=re.DOTALL)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Full restore complete!")
