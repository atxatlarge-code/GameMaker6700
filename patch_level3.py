with open('src/levels.js', 'r') as f:
    content = f.read()

new_level_3 = """
function createLevel3Grid() {
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
  }
  // Add some spikes at the bottom of the pit just in case
  for(let c=25; c<=35; c++) {
    grid[29][c] = 4;
  }
  
  // Enemy on the other side
  grid[27][42] = 20; // Basic enemy
  // Small wall to trap enemy
  grid[27][45] = 7;
  
  // Goal
  for(let r=25; r<=29; r++) { grid[r][55] = 7; }
  
  return grid;
}
"""

# Insert before PRESETS
parts = content.split('const PRESETS = [')
before_presets = parts[0] + new_level_3 + 'const PRESETS = [\n'
after_presets = parts[1]

# Now we need to add the preset to the PRESETS array.
# The PRESETS array looks like:
# const PRESETS = [
#   {
#     id: 'level-1', ...
#   },
#   {
#     id: 'level-2', ...
#   }
# ];

new_preset = """  {
    id: 'level-3',
    name: 'Demolition & Danger',
    grid: createLevel3Grid(),
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 55, row: 24 },
    isPreset: true,
  },
"""

# Insert right after `const PRESETS = [`
final_content = before_presets + new_preset + after_presets

with open('src/levels.js', 'w') as f:
    f.write(final_content)

print("Level 3 injected!")
