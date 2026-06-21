import re

with open('src/levels.js', 'r') as f:
    content = f.read()

new_grid = """function createBallLevelGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Outer walls
  for(let c=0; c<60; c++) {
    grid[0][c] = 1;
    grid[29][c] = 1;
  }
  for(let r=0; r<30; r++) {
    grid[r][0] = 1;
    grid[r][59] = 1;
  }

  // --- Plunger Lane (Right Side) ---
  for(let r=1; r<29; r++) {
    grid[r][56] = 1; // inner wall of plunger lane
  }
  grid[28][57] = 2; // Trampoline to launch up
  grid[28][58] = 2;
  
  // Top of plunger lane directs left
  grid[2][56] = 0; // open a hole
  grid[3][56] = 0;
  grid[4][56] = 0;
  grid[1][58] = 58; // Ramp Left
  grid[2][58] = 58;
  grid[3][58] = 58;
  grid[4][57] = 58; // Ramp Left pushing into the main area

  // --- Main Area Funnels (Bottom) ---
  // Left funnel
  for(let i=0; i<15; i++) {
    grid[28 - Math.floor(i/2)][1 + i] = 57; // Ramp Right (shallower)
    grid[28 - Math.floor(i/2) + 1][1 + i] = 1; // Support under ramp
  }
  // Right funnel
  for(let i=0; i<15; i++) {
    grid[28 - Math.floor(i/2)][55 - i] = 58; // Ramp Left
    grid[28 - Math.floor(i/2) + 1][55 - i] = 1; 
  }
  
  // Pit in the middle
  for(let c=16; c<=40; c++) {
    grid[28][c] = 4; // Spikes!
  }
  // Wind saving you from the pit
  for(let c=24; c<=32; c++) {
    for(let r=20; r<=27; r++) {
      grid[r][c] = 36; // Wind Up
    }
    grid[28][c] = 2; // Trampolines right above spikes in the very center
  }

  // --- Mid-Level Flippers / Ramps ---
  // Left mid ramp
  for(let i=0; i<8; i++) {
    grid[20 - i][10 + i] = 57; 
    grid[21 - i][10 + i] = 1;
  }
  // Right mid ramp
  for(let i=0; i<8; i++) {
    grid[20 - i][46 - i] = 58; 
    grid[21 - i][46 - i] = 1;
  }

  // --- Bumper Clusters ---
  // Top center cluster
  grid[8][28] = 28;
  grid[10][25] = 28;
  grid[10][31] = 28;
  grid[12][28] = 28;
  grid[12][20] = 28;
  grid[12][36] = 28;

  // --- Cannons ---
  // Cannons shooting across the middle
  grid[15][1] = 53; // Cannon pointing right? Well, cannon spins or shoots automatically.
  grid[10][55] = 53;

  // --- High Ramps ---
  for(let i=0; i<10; i++) {
    grid[12 - Math.floor(i/2)][1 + i] = 57; 
    grid[13 - Math.floor(i/2)][1 + i] = 1; 
  }
  
  // --- Gravity Wells ---
  grid[15][15] = 60;
  grid[15][41] = 60;
  grid[5][10] = 60;
  grid[5][46] = 60;

  // --- Upper Goal Platform ---
  // Locked door blocking goal
  grid[4][28] = 1;
  grid[4][30] = 1;
  grid[4][29] = 8; // Lock
  grid[3][28] = 1;
  grid[3][30] = 1;
  grid[2][28] = 1;
  grid[2][30] = 1;
  
  // Key location
  grid[5][5] = 9; // Key in top left corner
  
  // Goal platform floor
  for(let c=27; c<=31; c++) {
    grid[5][c] = 1;
  }

  // --- Slime Walls to catch and drop ---
  for(let r=1; r<10; r++) {
    grid[r][1] = 32;
    grid[r][55] = 32;
  }

  return grid;
}
"""

preset_entry = """  {
    id: 'level-6',
    name: 'Pinball Chaos V2',
    grid: createBallLevelGrid(),
    playerSpawn: { col: 58, row: 20, charId: 'ball' },
    goalPos: { col: 29, row: 3 },
    isPreset: true,
  }
];"""

# 1. Insert createBallLevelGrid right before const PRESETS = [
if 'function createBallLevelGrid()' in content:
    # Remove old version if it exists
    content = re.sub(r'function createBallLevelGrid\(\) \{.*?\n\}\n(?=const PRESETS)', '', content, flags=re.DOTALL)
content = content.replace('const PRESETS = [', new_grid + '\nconst PRESETS = [')

# 2. Insert the preset entry by replacing the closing brace of PRESETS
if "id: 'level-6'" in content:
    content = re.sub(r"\{\s*id: 'level-6'.*?\}\n\];", preset_entry, content, flags=re.DOTALL)
else:
    # Find the end of PRESETS
    content = re.sub(r"\}\n\];", "},\n" + preset_entry, content, flags=re.DOTALL)

with open('src/levels.js', 'w') as f:
    f.write(content)

print("Advanced level generated!")
