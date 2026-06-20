import { CONFIG } from './config.js';

// Helper to generate a blank grid
function createBlankGrid() {
  const grid = [];
  for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
    const row = [];
    for (let c = 0; c < CONFIG.GRID_COLS; c++) {
      if (r >= CONFIG.GRID_ROWS - 2) {
        row.push(1); // Bottom 2 rows are ground
      } else {
        row.push(0);
      }
    }
    grid.push(row);
  }
  return grid;
}

// Preset 1: Mushroom Forest
function createMushroomForestGrid() {
  const grid = createBlankGrid();
  grid[22][50] = 1; grid[22][51] = 1;
  grid[23][23] = 1; grid[23][24] = 1; grid[23][25] = 1; grid[23][26] = 1; grid[23][49] = 1; grid[23][50] = 1; grid[23][51] = 1;
  grid[24][23] = 1; grid[24][26] = 1; grid[24][48] = 1; grid[24][49] = 1; grid[24][50] = 1; grid[24][51] = 1;
  grid[25][14] = 1; grid[25][15] = 1; grid[25][16] = 1; grid[25][17] = 1; grid[25][18] = 1; grid[25][19] = 1;
  grid[25][23] = 1; grid[25][26] = 1; grid[25][32] = 1; grid[25][33] = 1;
  grid[25][47] = 1; grid[25][48] = 1; grid[25][49] = 1; grid[25][50] = 1; grid[25][51] = 1;
  grid[26][14] = 1; grid[26][19] = 1; grid[26][23] = 1; grid[26][26] = 1;
  grid[26][32] = 1; grid[26][33] = 1; grid[26][38] = 1; grid[26][39] = 1;
  grid[26][46] = 1; grid[26][47] = 1; grid[26][48] = 1; grid[26][49] = 1; grid[26][50] = 1; grid[26][51] = 1;
  grid[27][9] = 2; grid[27][12] = 1; grid[27][13] = 1; grid[27][14] = 1; grid[27][19] = 1; grid[27][21] = 2;
  grid[27][23] = 1; grid[27][26] = 1; grid[27][32] = 1; grid[27][33] = 1; grid[27][35] = 2; grid[27][38] = 1; grid[27][39] = 1;
  grid[27][45] = 1; grid[27][46] = 1; grid[27][47] = 1; grid[27][48] = 1; grid[27][49] = 1; grid[27][50] = 1; grid[27][51] = 1;
  return grid;
}


// Preset 2: Platformer Basics
function createPlatformerGrid() {
  const grid = createBlankGrid();
  // Make a pit in the ground with spikes at the bottom
  for (let c = 20; c < 30; c++) {
    grid[28][c] = 4; grid[29][c] = 4;
  }
  // Floating stepping stones across the pit
  grid[26][20] = 1; grid[26][21] = 1;
  grid[24][24] = 1; grid[24][25] = 1;
  grid[26][28] = 1; grid[26][29] = 1;
  // High tower
  for (let r = 20; r <= 27; r++) {
    grid[r][40] = 1; grid[r][41] = 1;
  }
  grid[27][37] = 2; // Mushroom to bounce over tower
  return grid;
}

// Preset 3: Sky Climb
function createSkyClimbGrid() {
  const grid = createBlankGrid();
  // Mushrooms on ground
  grid[27][8] = 2; grid[27][25] = 2; grid[27][42] = 2;

  // Staggered vertical platforms
  grid[22][12] = 1; grid[22][13] = 1; grid[22][14] = 1;
  grid[17][18] = 1; grid[17][19] = 1; grid[17][20] = 1;
  grid[13][26] = 1; grid[13][27] = 1; grid[13][28] = 1;
  grid[10][35] = 1; grid[10][36] = 1; grid[10][37] = 1;
  grid[7][45] = 1; grid[7][46] = 1; grid[7][47] = 1; grid[7][48] = 1;

  return grid;
}

// Preset 4: Speed Run
function createSpeedRunGrid() {
  const grid = createBlankGrid();
  // Series of hurdles with fire in front
  for (let c of [15, 25, 35, 45]) {
    grid[27][c] = 1; grid[26][c] = 1;
    grid[27][c - 1] = 3; // Fire!
  }
  grid[27][30] = 2; // Bounce over double hurdle
  grid[27][31] = 1; grid[26][31] = 1; grid[25][31] = 1;
  return grid;
}

// Preset 5: Portal Chamber
function createPortalChamberGrid() {
  const grid = createBlankGrid();
  // Tall impassable wall separating col 15
  for (let r = 10; r <= 27; r++) {
    grid[r][15] = 1;
    grid[r][16] = 1;
  }
  // Lava pool on the right side
  for (let c = 28; c <= 45; c++) {
    grid[27][c] = 3; // Fire
  }
  // High ledge where Portal 2 exits
  grid[16][22] = 1; grid[16][23] = 1; grid[16][24] = 1; grid[16][25] = 1;
  
  // Floating platforms over the lava
  grid[22][32] = 1; grid[22][33] = 1;
  grid[18][38] = 1; grid[18][39] = 1;
  grid[23][44] = 1; grid[23][45] = 1;
  
  // Mushroom trampoline before the goal
  grid[27][48] = 2;
  grid[23][51] = 1; grid[23][52] = 1; grid[23][53] = 1;
  
  return grid;
}

// Preset 6: Lava Caverns
function createLavaCavernsGrid() {
  const grid = createBlankGrid();
  // Huge bed of fire
  for (let c = 10; c <= 50; c++) {
    grid[27][c] = 3; // Fire
  }
  // Stepping pillars in the lava
  for (let c of [14, 20, 26, 32, 38, 44]) {
    grid[27][c] = 1;
    grid[26][c] = 1;
  }
  // Spikes on some pillars to force high jumps
  grid[25][20] = 4;
  grid[25][32] = 4;
  
  // Floating platforms above spikes
  grid[21][19] = 1; grid[21][20] = 1; grid[21][21] = 1;
  grid[21][31] = 1; grid[21][32] = 1; grid[21][33] = 1;
  
  // Trampoline on pillar 38
  grid[25][38] = 2;
  
  // High tower before goal
  for (let r = 15; r <= 27; r++) {
    grid[r][48] = 1; grid[r][49] = 1;
  }
  
  // Platform for goal
  grid[15][52] = 1; grid[15][53] = 1; grid[15][54] = 1;
  
  return grid;
}

// Preset 7: Bouncy Castle
function createBouncyCastleGrid() {
  const grid = createBlankGrid();
  // Ground trampolines everywhere
  for (let c = 10; c <= 48; c += 4) {
    grid[27][c] = 2; grid[27][c+1] = 2;
  }
  // Floating castle platforms
  grid[20][15] = 1; grid[20][16] = 1; grid[20][17] = 1;
  grid[15][24] = 1; grid[15][25] = 1; grid[15][26] = 1;
  grid[12][34] = 1; grid[12][35] = 1; grid[12][36] = 1;
  grid[16][42] = 1; grid[16][43] = 1; grid[16][44] = 1;
  
  // Enclosed throne room in sky
  for (let c = 46; c <= 56; c++) {
    grid[10][c] = 1; // Floor
    grid[4][c] = 1;  // Ceiling
  }
  for (let r = 4; r <= 10; r++) {
    grid[r][46] = 1; // Left wall
    grid[r][56] = 1; // Right wall
  }
  
  return grid;
}

// Preset 8: Tower of Peril
function createTowerOfPerilGrid() {
  const grid = createBlankGrid();
  // Huge central tower from col 22 to 38, row 6 to 27
  for (let r = 6; r <= 27; r++) {
    grid[r][22] = 1; // Left outer wall
    grid[r][38] = 1; // Right outer wall
  }
  // Entrance at bottom left
  grid[26][22] = 0; grid[27][22] = 0;
  
  // Internal zig-zag floors
  // Floor 1 (right to left)
  for (let c = 22; c <= 34; c++) grid[23][c] = 1;
  // Floor 2 (left to right)
  for (let c = 26; c <= 38; c++) grid[19][c] = 1;
  // Floor 3 (right to left)
  for (let c = 22; c <= 34; c++) grid[15][c] = 1;
  // Floor 4 (left to right)
  for (let c = 26; c <= 38; c++) grid[11][c] = 1;
  // Top roof
  for (let c = 22; c <= 38; c++) grid[6][c] = 1;
  
  // Hazards inside tower
  grid[22][28] = 4; // Spikes on floor 1
  grid[18][32] = 4; // Spikes on floor 2
  grid[14][26] = 3; // Fire on floor 3
  
  // Floating cloud platform on the right for goal
  grid[10][48] = 1; grid[10][49] = 1; grid[10][50] = 1; grid[10][51] = 1;
  
  return grid;
}

function createFortressOfBouncinessGrid() {
  const grid = createBlankGrid();
  
  // Starting area walls
  grid[27][10] = 1;
  grid[26][10] = 1;
  grid[25][10] = 1;

  // Key platform up high
  for (let c = 12; c <= 18; c++) grid[18][c] = 1;
  grid[17][15] = 9; // Key
  
  // A moveable block blocking the way
  grid[27][12] = 10;
  
  // Trampoline to reach the key
  grid[27][14] = 2;
  
  // Fire pit
  for (let c = 20; c <= 30; c++) grid[27][c] = 3;
  // A trampoline in the middle of the fire pit
  grid[26][25] = 1;
  grid[25][25] = 2; // Trampoline on top of a block

  // Lock blocking the exit
  grid[27][40] = 8;
  grid[26][40] = 8;
  grid[25][40] = 8;
  grid[24][40] = 8;
  
  // Safe zone after the fire pit
  for (let c = 31; c <= 50; c++) grid[27][c] = 1;
  
  // A few coins scattered
  grid[16][15] = 5;
  grid[21][25] = 5;
  grid[26][35] = 5;

  return grid;
}

// Preset 10: Mechanics Showcase
function createMechanicsShowcaseGrid() {
  const grid = createBlankGrid();
  // Ice slide
  for (let c = 10; c <= 15; c++) {
    grid[27][c] = 17;
    grid[28][c] = 17;
  }
  // Double Jump powerup before pit
  grid[26][15] = 24;
  
  // Spikes pit
  for (let c = 16; c <= 20; c++) {
    grid[27][c] = 4;
    grid[28][c] = 4;
  }

  // Anti-Gravity tunnel
  grid[26][23] = 18;
  grid[25][23] = 18;
  grid[24][23] = 18;
  grid[23][23] = 18;
  grid[22][23] = 18;
  
  // Ceiling with Conveyor Right
  for (let c = 22; c <= 30; c++) {
    grid[19][c] = 20; // Ceiling floor
    grid[18][c] = 1;  // Ceiling backing
  }
  
  // Drop down
  for (let r = 20; r <= 27; r++) {
    grid[r][31] = 1; // Wall to force drop down
  }

  // Tripwire
  grid[27][35] = 21;

  // Red/Blue block puzzle
  grid[27][40] = 12; // Red block blocks bottom
  grid[26][40] = 12;
  grid[25][40] = 12;

  // Blue block blocks top (initially open if switch is unpressed)
  // Actually tripwire toggles the state. 
  grid[24][40] = 13;
  grid[23][40] = 13;

  // Goal platform
  for (let c = 52; c <= 56; c++) {
    grid[20][c] = 1;
  }
  return grid;
}

function createAbyssalDepthsGrid() {
  const grid = createBlankGrid();
  // Deep pit
  for (let r = 10; r <= 27; r++) {
    grid[r][4] = 1; // Left wall
    grid[r][16] = 1; // Right wall
  }
  // Slime wall on the right for sliding down safely
  for (let r = 12; r <= 25; r++) {
    grid[r][15] = 32;
  }
  // Water pool at the bottom
  for (let r = 24; r <= 27; r++) {
    for (let c = 5; c <= 15; c++) {
      grid[r][c] = 31;
    }
  }
  // Switch in the water
  grid[27][10] = 11;
  // Fire hazard in the water to avoid
  grid[27][12] = 14;

  // Path out of the water using trampolines
  grid[27][5] = 3;
  grid[23][5] = 3;
  
  // High ledge to goal
  for (let c = 16; c <= 25; c++) {
    grid[10][c] = 1;
  }
  
  // Doorway is blocked by red block
  grid[9][24] = 12;
  grid[8][24] = 12;

  // Floor out of bounds for the rest
  for (let c = 26; c < CONFIG.GRID_COLS; c++) {
    grid[27][c] = 1;
  }

  return grid;
}

// Preset 12: Windy Ascents
function createWindyAscentsGrid() {
  const grid = createBlankGrid();
  
  // Floor with spikes to penalize falling
  for (let c = 5; c < 50; c++) {
    grid[27][c] = 4; // Spikes
  }
  
  // Starting safe zone
  grid[27][3] = 1; grid[27][4] = 1;
  grid[26][4] = 1;
  
  // Wind Up column 1
  for (let r = 15; r <= 26; r++) {
    grid[r][6] = 36; // Wind Up
    grid[r][7] = 36;
  }
  
  // Wind Right across
  for (let c = 8; c <= 20; c++) {
    grid[15][c] = 39; // Wind Right
    grid[16][c] = 39;
  }
  
  // Wind Down
  for (let r = 17; r <= 22; r++) {
    grid[r][19] = 37; // Wind Down
    grid[r][20] = 37;
  }
  
  // Platform to catch player
  grid[24][19] = 1; grid[24][20] = 1; grid[24][21] = 1;
  
  // Wind Right
  for (let c = 22; c <= 35; c++) {
    grid[23][c] = 39;
    grid[22][c] = 39;
  }
  
  // Wind Up to Goal
  for (let r = 5; r <= 22; r++) {
    grid[r][34] = 36;
    grid[r][35] = 36;
  }
  
  // Goal platform
  grid[5][38] = 1; grid[5][39] = 1; grid[5][40] = 1;
  
  return grid;
}

// Preset 10: Magnetic Facility
function createMagneticFacilityGrid() {
  const grid = createBlankGrid();
  
  // Powerup platform
  grid[27][8] = 1; grid[26][8] = 1; grid[25][8] = 1;
  grid[25][9] = 43; // Magnetic Boots

  // Tall ceiling structure to walk on
  for (let r = 20; r <= 23; r++) {
    for (let c = 12; c <= 25; c++) {
      grid[r][c] = 1;
    }
  }

  // Spikes below the ceiling
  for (let c = 12; c <= 25; c++) {
    grid[27][c] = 4;
  }

  // Conveyor Belt jumping section
  grid[20][30] = 20; grid[20][31] = 20; grid[20][32] = 20; // Conveyor Right
  grid[15][38] = 19; grid[15][39] = 19; grid[15][40] = 19; // Conveyor Left
  grid[10][45] = 1; grid[10][46] = 1;

  // Final wall climb
  for (let r = 8; r <= 27; r++) {
    grid[r][50] = 1;
  }

  // Goal platform
  grid[7][51] = 1; grid[7][52] = 1; grid[7][53] = 1;

  return grid;
}

// Preset 14: Ghostly Demolition
function createGhostlyDemolitionGrid() {
  const grid = createBlankGrid();
  
  // Starting area
  grid[27][3] = 51; // Ghost Switch
  grid[27][10] = 11; // Switch Block
  
  // Wall of Red/Blue blocks
  for (let r = 20; r <= 27; r++) {
    grid[r][15] = 12; // Red Blocks
    grid[r][16] = 13; // Blue Blocks
  }
  
  // Bomb powerup area
  grid[27][22] = 49; // Bomb Powerup
  
  // Cracked wall blocking goal
  for (let r = 15; r <= 27; r++) {
    grid[r][30] = 50; // Cracked Blocks
    grid[r][31] = 50; // Cracked Blocks
  }

  // Red Door blocking goal
  grid[27][40] = 46;
  grid[26][40] = 46;
  grid[25][40] = 46;

  // Ledges to make it look cool
  grid[20][35] = 1; grid[20][36] = 1; grid[20][37] = 1;
  grid[18][45] = 1; grid[18][46] = 1; grid[18][47] = 1;

  return grid;
}

function createJumpThroughGrid() {
  const grid = createBlankGrid();
  
  // Create a tower of jump-through platforms
  for (let c = 5; c <= 25; c++) {
    grid[22][c] = 52;
  }

  // The player spawns at col 10, row 20 (on top of the platform).
  // The goal is at col 10, row 27 (below the platform).
  // The ONLY way to reach the goal is to drop down.
  return grid;
}

function createCannonBarrelGrid() {
  const grid = createBlankGrid();
  
  // A giant pit with no floor
  // Start platform
  grid[27][5] = 1; grid[27][6] = 1; grid[27][7] = 1;

  // First cannon to catch the jump
  grid[24][12] = 53;

  // Second cannon
  grid[15][20] = 53;

  // Third cannon
  grid[25][30] = 53;

  // Fourth cannon pointing up to goal
  grid[18][45] = 53;

  // Goal platform
  grid[5][45] = 1; grid[5][46] = 1; grid[5][47] = 1;
  grid[5][44] = 1;

  return grid;
}

// Preset 25: Painted Pathways
function createPaintedPathwaysGrid() {
  const grid = createBlankGrid();
  // Player spawns on left
  // First challenge: A paint block that reveals a staircase
  grid[25][10] = 105; // Paint block
  grid[24][12] = 106; grid[23][14] = 106; grid[22][16] = 106; // Invisible stairs
  
  // Platform to rest on
  grid[22][17] = 1; grid[22][18] = 1; grid[22][19] = 1; grid[22][20] = 1;
  
  // Second challenge: A pit of spikes, need to hit paint block in air or from below
  for (let c = 21; c <= 30; c++) {
    grid[28][c] = 4;
    grid[29][c] = 4;
  }
  
  grid[25][24] = 105; // Paint block floating over spikes
  grid[22][24] = 106; grid[22][25] = 106; // Invisible bridge over spikes
  grid[22][26] = 106; grid[22][27] = 106; grid[22][28] = 106;
  
  // Final stretch
  grid[22][30] = 1; grid[22][31] = 1; grid[22][32] = 1;
  
  // A wall blocking the goal, with a paint block above it
  for(let r=22; r<=27; r++) {
    grid[r][38] = 1;
  }
  grid[20][36] = 105; // Paint block
  grid[18][38] = 106; // Invisible block above wall
  
  // Platform behind wall to land safely
  grid[25][40] = 1; grid[25][41] = 1;
  
  return grid;
}

// Preset 26: Dash City
function createDashCityGrid() {
  const grid = createBlankGrid();
  // Player spawns on left
  grid[28][2] = 1; grid[28][3] = 1; grid[28][4] = 1;

  // Huge gap, need to hit dash panel
  grid[28][5] = 24; // Dash Panel Right
  
  for (let c = 6; c <= 20; c++) {
    grid[29][c] = 4; // Spikes
  }
  
  // Landing platform
  grid[28][21] = 1; grid[28][22] = 1; grid[28][23] = 1;
  
  // Another dash panel over a longer gap
  grid[28][24] = 24; // Dash Panel Right
  grid[28][25] = 24; // Dash Panel Right
  
  for (let c = 26; c <= 45; c++) {
    grid[29][c] = 4; // Spikes
  }
  
  // Final landing and goal
  grid[28][46] = 1; grid[28][47] = 1; grid[28][48] = 1;
  
  return grid;
}


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

  // Giant funnel towards the center
  for(let i=0; i<15; i++) {
    // left stairs
    grid[28 - i][1 + i] = 1;
    // right stairs
    grid[28 - i][58 - i] = 1;
  }
  
  // Trampolines at the bottom funnel to bounce you back up!
  for(let c=16; c<=20; c++) {
    grid[28][c] = 2; // Trampoline
  }
  for(let c=39; c<=43; c++) {
    grid[28][c] = 2; // Trampoline
  }
  
  // The central pit of spikes
  for(let c=21; c<=38; c++) {
    grid[29][c] = 4; // Spikes
    grid[28][c] = 4; // Spikes
  }
  
  // A safety island in the middle of the pit with a big trampoline
  for(let c=28; c<=31; c++) {
    grid[28][c] = 1;
    grid[27][c] = 2; // Mega bounce
  }
  
  // Bumpers scattered to create chaotic bounces
  grid[20][10] = 28;
  grid[22][15] = 28;
  grid[15][20] = 28;
  grid[18][30] = 28;
  grid[15][40] = 28;
  grid[22][45] = 28;
  grid[20][50] = 28;
  grid[10][25] = 28;
  grid[10][35] = 28;

  // Some floating platforms to land on
  grid[12][10] = 1; grid[12][11] = 1;
  grid[12][48] = 1; grid[12][49] = 1;
  
  // Gravity Wells (60) to pull the ball in crazy directions
  grid[8][15] = 60;
  grid[8][45] = 60;
  
  // Wind blowing up in the center column
  for(let r=5; r<=24; r++) {
    for(let c=29; c<=30; c++) {
      grid[r][c] = 36; // Wind Up
    }
  }

  // Goal platform at the top middle
  for(let c=28; c<=31; c++) {
    grid[4][c] = 1;
  }
  
  // Slime on the upper walls to catch you
  for(let r=1; r<15; r++) {
    grid[r][1] = 32;
    grid[r][58] = 32;
  }

  return grid;
}

const PRESETS = [
  {
    id: 'level-5',
    name: 'Pinball Chaos',
    grid: createBallLevelGrid(),
    playerSpawn: { col: 10, row: 10, charId: 'ball' },
    goalPos: { col: 30, row: 4 },
    isPreset: true,
  },

  {
    id: 'preset-1',
    name: 'Mushroom Forest',
    grid: createMushroomForestGrid(),
    playerSpawn: { col: 5, row: 27 },
    goalPos: { col: 55, row: 19 },
    portal1: { col: 16, row: 27 },
    portal2: { col: 42, row: 27 },
    isPreset: true,
  },
  {
    id: 'preset-2',
    name: 'Platformer Basics',
    grid: createPlatformerGrid(),
    playerSpawn: { col: 5, row: 27 },
    goalPos: { col: 48, row: 27 },
    isPreset: true,
  },
  {
    id: 'preset-3',
    name: 'Sky Climb',
    grid: createSkyClimbGrid(),
    playerSpawn: { col: 4, row: 27 },
    goalPos: { col: 46, row: 6 },
    isPreset: true,
  },
  {
    id: 'preset-4',
    name: 'Speed Run',
    grid: createSpeedRunGrid(),
    playerSpawn: { col: 4, row: 27 },
    goalPos: { col: 54, row: 27 },
    isPreset: true,
  },
  {
    id: 'preset-5',
    name: 'Portal Chamber',
    grid: createPortalChamberGrid(),
    playerSpawn: { col: 4, row: 27 },
    goalPos: { col: 52, row: 22 },
    portal1: { col: 10, row: 27 },
    portal2: { col: 24, row: 15 },
    isPreset: true,
  },
  {
    id: 'preset-6',
    name: 'Lava Caverns',
    grid: createLavaCavernsGrid(),
    playerSpawn: { col: 4, row: 27 },
    goalPos: { col: 53, row: 14 },
    isPreset: true,
  },
  {
    id: 'preset-7',
    name: 'Bouncy Castle',
    grid: createBouncyCastleGrid(),
    playerSpawn: { col: 4, row: 27 },
    goalPos: { col: 51, row: 9 },
    portal1: { col: 35, row: 11 },
    portal2: { col: 48, row: 9 },
    isPreset: true,
  },
  {
    id: 'preset-8',
    name: 'Tower of Peril',
    grid: createTowerOfPerilGrid(),
    playerSpawn: { col: 15, row: 27 },
    goalPos: { col: 50, row: 9 },
    portal1: { col: 35, row: 10 },
    portal2: { col: 46, row: 9 },
    isPreset: true,
  },
  {
    id: 'preset-9',
    name: 'Fortress of Bounciness',
    grid: createFortressOfBouncinessGrid(),
    playerSpawn: { col: 5, row: 27 },
    goalPos: { col: 45, row: 27 },
    enemies: [
      { id: 'e1', col: 35, row: 27, speed: 1.5, patrolRange: 4, type: 'chaser' }
    ],
    isPreset: true,
  },
  {
    id: 'preset-10',
    name: 'Mechanics Showcase',
    grid: createMechanicsShowcaseGrid(),
    playerSpawn: { col: 5, row: 27 },
    goalPos: { col: 54, row: 19 },
    platforms: [
      { id: 'p1', col: 44, row: 25, distance: 4, axis: 'y' }
    ],
    isPreset: true,
  },
  {
    id: 'preset-11',
    name: 'Abyssal Depths',
    grid: createAbyssalDepthsGrid(),
    playerSpawn: { col: 6, row: 10 },
    goalPos: { col: 25, row: 9 },
    isDark: true,
    isPreset: true,
  },
  {
    id: 'preset-12',
    name: 'Windy Ascents',
    grid: createWindyAscentsGrid(),
    playerSpawn: { col: 3, row: 26 },
    goalPos: { col: 39, row: 4 },
    isPreset: true,
  },
  {
    id: 'preset-13',
    name: 'Magnetic Facility',
    grid: createMagneticFacilityGrid(),
    playerSpawn: { col: 4, row: 27 },
    goalPos: { col: 52, row: 6 },
    isPreset: true,
  },
  {
    id: 'preset-14',
    name: 'Ghostly Demolition',
    grid: createGhostlyDemolitionGrid(),
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 55, row: 27 },
    isPreset: true,
  },
  {
    id: 'preset-15',
    name: 'Jump-Through Trial',
    grid: createJumpThroughGrid(),
    playerSpawn: { col: 10, row: 20 },
    goalPos: { col: 10, row: 27 },
    isPreset: true,
  },
  {
    id: 'preset-16',
    name: 'Cannon Trial',
    grid: createCannonBarrelGrid(),
    playerSpawn: { col: 6, row: 27 },
    goalPos: { col: 46, row: 5 },
    isPreset: true,
  },
  {
    id: 'preset-17',
    name: 'Turret Alley',
    grid: createTurretGrid(),
    playerSpawn: { col: 5, row: 27 },
    goalPos: { col: 45, row: 5 },
  },
  {
    id: 'preset-18',
    name: 'Rope Swings',
    grid: createRopeSwingsGrid(),
    playerSpawn: { col: 5, row: 27 },
    goalPos: { col: 55, row: 5 },
    isPreset: true,
  },
  {
    id: 'preset-19',
    name: 'Minecart Madness',
    grid: createMinecartMadnessGrid(),
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 57, row: 5 },
    isPreset: true,
  },
      {
    id: 'preset-20',
    name: 'Frozen Conveyor Challenge',
    grid: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 21, 21, 21, 21, 21, 0, 0, 0, 0, 22, 22, 22, 22, 22, 0, 0, 0, 18, 18, 18, 18, 18, 0, 0, 0, 20, 20, 20, 20, 20, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]],
    playerSpawn: {"col": 2, "row": 27},
    goalPos: {"col": 55, "row": 27},
    isPreset: true
  },


    {
    id: 'preset-21',
    name: 'Gravity Slime Cavern',
    grid: [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 0, 0, 0, 0, 0, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 32, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
    playerSpawn: {"col": 2, "row": 27},
    goalPos: {"col": 45, "row": 27},
    isPreset: true
  },
  {
    id: 'preset-22',
    name: 'Reflector Chamber',
    grid: createReflectorChamberGrid(),
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 55, row: 27 },
    isPreset: true,
  },
  {
    id: 'preset-23',
    name: 'Singularity Sprint',
    grid: createSingularitySprintGrid(),
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 57, row: 27 },
  },
  {
    id: 'preset-24',
    name: 'Tiny Tunnels',
    grid: createTinyTunnelsGrid(),
    playerSpawn: { col: 2, row: 27 },
    goalPos: { col: 50, row: 20 },
    isPreset: true,
  },
  {
    id: 'preset-25',
    name: 'Painted Pathways',
    grid: createPaintedPathwaysGrid(),
    playerSpawn: { col: 4, row: 27 },
    goalPos: { col: 45, row: 27 },
    isPreset: true,
  },
  {
    id: 'preset-26',
    name: 'Dash City',
    grid: createDashCityGrid(),
    playerSpawn: { col: 3, row: 27 },
    goalPos: { col: 47, row: 27 },
    isPreset: true,
  }
];

function createTinyTunnelsGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Floor
  for (let c = 0; c < 60; c++) grid[28][c] = 1;
  for (let c = 0; c < 60; c++) grid[29][c] = 1;
  
  // Left wall
  for (let r = 0; r < 30; r++) grid[r][0] = 1;
  // Right wall
  for (let r = 0; r < 30; r++) grid[r][59] = 1;

  // Giant wall blocking progress
  for (let r = 10; r < 28; r++) {
    grid[r][25] = 1;
  }

  // 1-tile high gap at the bottom of the wall
  grid[27][25] = 0; // Gap for shrunk player
  grid[27][26] = 0;
  grid[27][27] = 0;

  // Shrinking potion
  grid[27][15] = 104; // Shrink Potion

  // A couple of obstacles that require small jumps
  grid[27][40] = 1; // Small hurdle
  grid[27][45] = 1; // Small hurdle

  return grid;
}

function createSingularitySprintGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Floor with gaps
  for (let c = 0; c < 15; c++) grid[28][c] = 1;
  for (let c = 25; c < 40; c++) grid[28][c] = 1;
  for (let c = 50; c < 60; c++) grid[28][c] = 1;
  
  // Left wall
  for (let r = 0; r < 30; r++) grid[r][0] = 1;
  // Right wall
  for (let r = 0; r < 30; r++) grid[r][59] = 1;

  // Add Gravity Wells over the gaps to help pull player across
  grid[20][20] = 60; // Gravity well 1
  grid[20][45] = 60; // Gravity well 2
  
  // Turrets that fire projectiles which get sucked into gravity well
  grid[27][14] = 54; // Turret
  grid[27][39] = 54; // Turret
  
  return grid;
}

function createReflectorChamberGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Floor
  for (let c = 0; c < 60; c++) grid[28][c] = 1;
  for (let c = 0; c < 60; c++) grid[29][c] = 1;
  // Left wall
  for (let r = 0; r < 30; r++) grid[r][0] = 1;
  // Right wall
  for (let r = 0; r < 30; r++) grid[r][59] = 1;
  // Ceiling
  for (let c = 0; c < 60; c++) grid[0][c] = 1;

  // Turrets on the right, shooting left
  grid[27][50] = 10;
  grid[25][50] = 10;
  grid[23][50] = 10;
  
  // A lazer enemy on a platform
  grid[15][40] = 1;
  grid[15][41] = 1;
  grid[15][42] = 1;
  grid[14][41] = 14; // Lazer

  // Give player a reflector shield cover
  grid[27][20] = 59;
  grid[26][20] = 59;
  grid[25][20] = 59;
  grid[24][20] = 59;
  
  // Put a key and door just to use it
  grid[13][41] = 9; // Key
  grid[27][58] = 8; // Door
  
  return grid;
}

function createMinecartMadnessGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Starting area
  for (let c = 0; c < 10; c++) grid[28][c] = 1; // Floor
  grid[27][4] = 56; // Minecart!

  // Ramp 1
  grid[28][10] = 57; // Ramp Right
  
  // Huge Lava gap
  for (let c = 10; c < 20; c++) grid[29][c] = 3;
  
  // Landing platform
  for (let c = 20; c < 25; c++) grid[20][c] = 1;
  grid[19][24] = 57; // Another Ramp Right
  
  // Another Huge Lava gap
  for (let c = 25; c < 45; c++) grid[29][c] = 3;

  // Final landing
  for (let c = 45; c < 60; c++) grid[10][c] = 1;
  
  return grid;
}

function createRopeSwingsGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  // Floor
  for (let c = 0; c < 15; c++) grid[28][c] = 1;
  // Goal Platform
  for (let c = 50; c < 60; c++) grid[6][c] = 1;
  // Lava pit
  for (let c = 15; c < 50; c++) grid[29][c] = 3;

  // Ceiling for ropes
  for (let c = 15; c < 50; c += 10) {
    grid[0][c] = 1;
    grid[1][c] = 55; // Rope anchor
  }

  return grid;
}

function createTurretGrid() {
  const grid = Array.from({ length: 30 }, () => Array(50).fill(0));
  // Floor
  for (let c = 0; c < 50; c++) grid[28][c] = 1;
  // Walls
  for (let r = 0; r < 30; r++) { grid[r][0] = 1; grid[r][49] = 1; }
  
  // Turrets firing left
  grid[27][48] = 54;
  grid[24][40] = 54;
  grid[20][45] = 54;
  grid[15][35] = 54;
  grid[10][40] = 54;
  grid[5][48] = 54;

  // Platforms to climb
  grid[25][15] = 1; grid[25][16] = 1; grid[25][17] = 1;
  grid[21][5] = 1; grid[21][6] = 1; grid[21][7] = 1;
  grid[16][15] = 1; grid[16][16] = 1; grid[16][17] = 1;
  grid[11][5] = 1; grid[11][6] = 1; grid[11][7] = 1;
  grid[6][15] = 1; grid[6][16] = 1; grid[6][17] = 1;
  
  // Goal platform
  for (let c = 40; c <= 45; c++) grid[6][c] = 1;

  return grid;
}

const STORAGE_KEY = 'gm6700_custom_levels';

export class LevelManager {
  static getLevels() {
    let customLevels = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        customLevels = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Error loading custom levels from localStorage', e);
    }
    return [...PRESETS, ...customLevels];
  }

  static saveCustomLevels(customLevels) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customLevels));
    } catch (e) {
      console.error('Error saving custom levels to localStorage', e);
    }
  }

  static saveLevel(updatedLevel) {
    if (updatedLevel.isPreset) {
      // Cannot overwrite preset directly, create a custom duplicate
      updatedLevel = { ...updatedLevel, id: 'custom-' + Date.now(), isPreset: false, name: updatedLevel.name + ' (Custom)' };
    }
    const levels = this.getLevels();
    const customLevels = levels.filter(l => !l.isPreset);
    const index = customLevels.findIndex(l => l.id === updatedLevel.id);
    if (index >= 0) {
      customLevels[index] = updatedLevel;
    } else {
      customLevels.push(updatedLevel);
    }
    this.saveCustomLevels(customLevels);
    return updatedLevel;
  }

  static createLevel(name = 'New Level') {
    const newLevel = {
      id: 'custom-' + Date.now(),
      name: name,
      grid: createBlankGrid(),
      playerSpawn: { col: 5, row: 27 },
      goalPos: { col: 52, row: 27 },
      isPreset: false,
      createdAt: Date.now()
    };
    const levels = this.getLevels();
    const customLevels = levels.filter(l => !l.isPreset);
    customLevels.push(newLevel);
    this.saveCustomLevels(customLevels);
    return newLevel;
  }

  static deleteLevel(id) {
    const levels = this.getLevels();
    const customLevels = levels.filter(l => !l.isPreset && l.id !== id);
    this.saveCustomLevels(customLevels);
  }

  static duplicateLevel(id) {
    const levels = this.getLevels();
    const source = levels.find(l => l.id === id);
    if (!source) return null;

    const duplicate = {
      id: 'custom-' + Date.now(),
      name: source.name + ' Copy',
      // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
      grid: source.grid.map(row => row.slice()),
      playerSpawn: { ...source.playerSpawn },
      goalPos: { ...source.goalPos },
      isPreset: false,
      createdAt: Date.now()
    };

    const customLevels = levels.filter(l => !l.isPreset);
    customLevels.push(duplicate);
    this.saveCustomLevels(customLevels);
    return duplicate;
  }

  static getLevel(id) {
    const levels = this.getLevels();
    return levels.find(l => l.id === id) || PRESETS[0];
  }
}
