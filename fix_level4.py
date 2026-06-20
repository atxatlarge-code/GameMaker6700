import json

with open('src/levels.js', 'r') as f:
    content = f.read()

# Replace createLevel4Grid
old_grid = """function createLevel4Grid() {
  const grid = createBlankGrid();
  
  // Starting platform
  for(let c=0; c<10; c++) {
    for(let r=25; r<=29; r++) { grid[r][c] = 7; }
  }
  // Gap
  for(let c=10; c<20; c++) {
    grid[28][c] = 0; grid[29][c] = 0;
    // Spikes at bottom
    grid[29][c] = 4;
  }
  // Middle platform (Worm will be here)
  for(let c=20; c<30; c++) {
    for(let r=25; r<=29; r++) { grid[r][c] = 7; }
  }
  // Gap 2
  for(let c=30; c<40; c++) {
    grid[28][c] = 0; grid[29][c] = 0;
    grid[29][c] = 4;
  }
  // High platforms for Bats
  grid[20][34] = 7; grid[20][35] = 7;
  
  // Platform 3 (Chaser enemy will be here)
  for(let c=40; c<50; c++) {
    for(let r=25; r<=29; r++) { grid[r][c] = 7; }
  }
  // Gap 3
  for(let c=50; c<55; c++) {
    grid[28][c] = 0; grid[29][c] = 0;
    grid[29][c] = 4;
  }
  // Goal
  for(let c=55; c<60; c++) {
    for(let r=25; r<=29; r++) { grid[r][c] = 7; }
  }
  
  return grid;
}"""

new_grid = """function createLevel4Grid() {
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
}"""

content = content.replace(old_grid, new_grid)

# Fix enemy positions in preset
old_preset = """  {
    id: 'level-4',
    name: 'Hostile Territory',
    grid: createLevel4Grid(),
    enemies: [
      { id: 'e1', col: 25, row: 24, speed: 0, patrolRange: 0, type: 'worm' },
      { id: 'e2', col: 34, row: 19, speed: 0, patrolRange: 0, type: 'bat' },
      { id: 'e3', col: 45, row: 24, speed: 1.8, patrolRange: 0, type: 'chaser' }
    ],
    playerSpawn: { col: 2, row: 24 },
    goalPos: { col: 57, row: 24 },
    isPreset: true,
  },"""

new_preset = """  {
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
  },"""

content = content.replace(old_preset, new_preset)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Level 4 geometry fixed!")
