import json

with open('src/levels.js', 'r') as f:
    content = f.read()

# Fix createLevel3Grid
# Find: grid[27][42] = 20; // Basic enemy
# Replace with: // Enemy handled in preset
content = content.replace("grid[27][42] = 20; // Basic enemy", "// Enemy handled in preset")

# Define createLevel4Grid
level_4_grid = """
function createLevel4Grid() {
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
}
"""

# Insert createLevel4Grid before PRESETS
parts = content.split('const PRESETS = [')
before_presets = parts[0] + level_4_grid + 'const PRESETS = [\n'
after_presets = parts[1]

# Now we need to fix Level 3's preset to have the enemy array, and add Level 4's preset.
# Let's find level-3 in after_presets
level3_old = """  {
    id: 'level-3',
    name: 'Demolition & Danger',
    grid: createLevel3Grid(),
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 55, row: 24 },
    isPreset: true,
  },"""

level3_new = """  {
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
      { id: 'e1', col: 25, row: 24, speed: 0, patrolRange: 0, type: 'worm' },
      { id: 'e2', col: 34, row: 19, speed: 0, patrolRange: 0, type: 'bat' },
      { id: 'e3', col: 45, row: 24, speed: 1.8, patrolRange: 0, type: 'chaser' }
    ],
    playerSpawn: { col: 2, row: 24 },
    goalPos: { col: 57, row: 24 },
    isPreset: true,
  },"""

after_presets = after_presets.replace(level3_old, level3_new)

with open('src/levels.js', 'w') as f:
    f.write(before_presets + after_presets)

print("Level 4 injected and Level 3 fixed!")
