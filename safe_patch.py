import re

with open('src/levels.js', 'r') as f:
    content = f.read()

# The original file has `const PRESETS = [` at line 577.
# We will split the file by `const PRESETS = [` and find where the array ends.
parts = content.split('const PRESETS = [')
before_presets = parts[0]
after_presets_start = parts[1]

# Find the end of PRESETS array
bracket_count = 1
end_idx = -1
in_string = False
for i in range(len(after_presets_start)):
    char = after_presets_start[i]
    if char == "'" or char == '"':
        in_string = not in_string
    if not in_string:
        if char == '[':
            bracket_count += 1
        elif char == ']':
            bracket_count -= 1
            if bracket_count == 0:
                end_idx = i
                break

after_presets = after_presets_start[end_idx+1:]
if after_presets.startswith(';'):
    after_presets = after_presets[1:]

new_functions = """
function createLevel1Grid() {
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
    grid[25][c] = 1;
  }
  return grid;
}

function createLevel2Grid() {
  const grid = createBlankGrid();
  for(let c=0; c<60; c++) {
    grid[28][c] = 1;
    grid[29][c] = 1;
  }
  for(let r=25; r<=27; r++) { grid[r][10] = 6; }
  for(let r=24; r<=27; r++) { grid[r][25] = 1; }
  grid[27][20] = 10;
  grid[25][35] = 1;
  grid[24][35] = 9;
  for(let r=24; r<=27; r++) { grid[r][40] = 8; }
  grid[27][45] = 11;
  for(let r=25; r<=27; r++) { grid[r][50] = 12; }
  return grid;
}
"""

new_presets = """const PRESETS = [
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
  }
];"""

with open('src/levels.js', 'w') as f:
    f.write(before_presets + new_functions + new_presets + after_presets)

print("Safe patch applied successfully.")
