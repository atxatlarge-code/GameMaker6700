import re

with open('src/levels.js', 'r') as f:
    content = f.read()

# 1. Clean out ANY existing createLevelXGrid functions to avoid duplicates
for i in range(1, 6):
    # This regex is a bit complex. Let's just remove them cleanly.
    pattern = rf'function createLevel{i}Grid\(\) \{{.*?\n\}}'
    content = re.sub(pattern, '', content, flags=re.DOTALL)

# Now we construct the functions.
grids = """
function createLevel1Grid() {
  const grid = createBlankGrid();
  for(let c=0; c<60; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  grid[27][10] = 1;
  grid[28][20] = 0; grid[29][20] = 0;
  grid[28][30] = 4;
  for(let r=25; r<=29; r++) { grid[r][40] = 1; grid[r][41] = 1; }
  grid[27][38] = 2; 
  for(let c=50; c<60; c++) { grid[25][c] = 7; }
  return grid;
}

function createLevel2Grid() {
  const grid = createBlankGrid();
  for(let c=0; c<60; c++) { grid[28][c] = 1; grid[29][c] = 1; }
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

function createLevel3Grid() {
  const grid = createBlankGrid();
  grid[27][10] = 49;
  for(let r=24; r<=27; r++) { grid[r][15] = 50; }
  for(let c=25; c<=35; c++) {
    grid[28][c] = 0; grid[29][c] = 0;
    grid[27][c] = 22; grid[29][c] = 4;
  }
  grid[27][45] = 7;
  for(let r=25; r<=29; r++) { grid[r][55] = 7; }
  return grid;
}

function createLevel4Grid() {
  const grid = createBlankGrid();
  for(let c=0; c<=10; c++) { for(let r=25; r<=29; r++) { grid[r][c] = 7; } }
  for(let c=11; c<=13; c++) { grid[28][c] = 0; grid[29][c] = 0; grid[29][c] = 4; }
  for(let c=14; c<=24; c++) { for(let r=25; r<=29; r++) { grid[r][c] = 7; } }
  for(let c=25; c<=27; c++) { grid[28][c] = 0; grid[29][c] = 0; grid[29][c] = 4; }
  for(let c=28; c<=48; c++) { for(let r=25; r<=29; r++) { grid[r][c] = 7; } }
  grid[20][33] = 7; grid[20][34] = 7;
  for(let c=49; c<=51; c++) { grid[28][c] = 0; grid[29][c] = 0; grid[29][c] = 4; }
  for(let c=52; c<60; c++) { for(let r=25; r<=29; r++) { grid[r][c] = 7; } }
  return grid;
}

function createLevel5Grid() {
  const grid = createBlankGrid();
  for(let c=0; c<=5; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  for(let c=6; c<=12; c++) { grid[28][c] = 17; grid[29][c] = 7; }
  for(let c=13; c<=15; c++) { grid[28][c] = 0; grid[29][c] = 3; }
  for(let c=16; c<=20; c++) { grid[25][c] = 17; }
  for(let c=21; c<=24; c++) { grid[28][c] = 31; grid[29][c] = 4; }
  for(let c=25; c<=30; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  grid[27][30] = 54;
  for(let c=33; c<=35; c++) { grid[24][c] = 17; }
  for(let c=38; c<=40; c++) { grid[20][c] = 17; }
  for(let c=44; c<=46; c++) { grid[24][c] = 17; }
  for(let c=49; c<60; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  return grid;
}
"""

presets = """const PRESETS = [
  { id: 'level-1', name: 'The Fundamentals', grid: createLevel1Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 24 }, isPreset: true },
  { id: 'level-2', name: 'Puzzles & Pathways', grid: createLevel2Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-3', name: 'Demolition & Danger', grid: createLevel3Grid(), enemies: [{ id: 'e1', col: 42, row: 26, speed: 1.8, patrolRange: 5, type: 'basic' }], playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 24 }, isPreset: true },
  { id: 'level-4', name: 'Hostile Territory', grid: createLevel4Grid(), enemies: [{ id: 'e1', col: 19, row: 24, speed: 0, patrolRange: 0, type: 'worm' }, { id: 'e2', col: 33, row: 19, speed: 0, patrolRange: 0, type: 'bat' }, { id: 'e3', col: 45, row: 24, speed: 1.8, patrolRange: 0, type: 'chaser' }], playerSpawn: { col: 2, row: 24 }, goalPos: { col: 57, row: 24 }, isPreset: true },
  { id: 'level-5', name: 'The Elements', grid: createLevel5Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true }
];"""

start = content.find('const PRESETS = [')
end = content.find('];', start) + 2

if start != -1 and end != -1:
    before = content[:start]
    after = content[end:]
    
    with open('src/levels.js', 'w') as f:
        f.write(before + grids + presets + after)
    print("Fixed levels.js completely.")
else:
    print("Failed to find PRESETS.")
