import sys

with open('src/levels.js', 'r') as f:
    content = f.read()

ball_level_grid = """
function createBallLevelGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Floor and ceiling
  for(let c=0; c<60; c++) {
    grid[0][c] = 1;
    grid[29][c] = 1;
  }
  // Left and Right walls
  for(let r=0; r<30; r++) {
    grid[r][0] = 1;
    grid[r][59] = 1;
  }

  // Pinball flipper-like ramps at the bottom
  for(let c=1; c<15; c++) {
    grid[28][c] = 57; // Ramp Right
  }
  for(let c=45; c<59; c++) {
    grid[28][c] = 58; // Ramp Left
  }
  
  // A huge pit in the middle bottom
  for(let c=20; c<40; c++) {
    grid[29][c] = 4; // Spikes
    grid[28][c] = 4; // Spikes
  }
  
  // Bouncers and Bumpers scattered
  grid[25][15] = 28; // Bumper
  grid[25][44] = 28; // Bumper
  grid[20][30] = 28; // Bumper
  
  // Trampolines
  grid[27][18] = 2;
  grid[27][41] = 2;
  
  // Middle structure with Jump Through platforms (52)
  for(let c=25; c<=35; c++) {
    grid[22][c] = 52;
    grid[15][c] = 52;
  }
  
  // Gravity Wells (60)
  grid[10][15] = 60;
  grid[10][45] = 60;
  
  // A path up via Trampolines
  grid[24][5] = 2;
  grid[18][5] = 2;
  grid[12][5] = 2;
  
  // Ramps directing ball towards middle
  grid[14][10] = 57;
  grid[14][49] = 58;
  
  // Goal platform at the top
  for(let c=28; c<=32; c++) {
    grid[5][c] = 1;
  }
  
  // Wind blowing up in the center
  for(let r=16; r<=21; r++) {
    for(let c=29; c<=31; c++) {
      grid[r][c] = 36; // Wind Up
    }
  }

  // More chaos: Slime on the walls
  for(let r=5; r<25; r++) {
    grid[r][1] = 32; // Slime
    grid[r][58] = 32; // Slime
  }

  // Cannons firing across
  grid[18][2] = 53; // Cannon Barrel
  grid[12][57] = 53; // Cannon Barrel

  return grid;
}
"""

preset_entry = """  {
    id: 'level-5',
    name: 'Pinball Chaos',
    grid: createBallLevelGrid(),
    playerSpawn: { col: 5, row: 26, charId: 'ball' },
    goalPos: { col: 30, row: 4 },
    isPreset: true,
  },"""

if "createBallLevelGrid" not in content:
    target = "const PRESETS = ["
    replacement = ball_level_grid + "\n" + target + "\n" + preset_entry
    content = content.replace(target, replacement, 1)

    with open('src/levels.js', 'w') as f:
        f.write(content)
    print("Injected cleanly at the beginning.")
else:
    print("Already injected.")
