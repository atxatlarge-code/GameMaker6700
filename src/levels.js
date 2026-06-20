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




function createBallLevelGrid() {
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

function createLevel6Grid() {
  const grid = createBlankGrid();
  
  // Starting safe ground
  for(let c=0; c<=4; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Conveyor Right over spikes
  for(let c=5; c<=15; c++) {
    grid[28][c] = 20; // Conveyor Right
    grid[29][c] = 4;  // Spikes below
  }
  
  // Wind Up tunnel
  for(let c=16; c<=18; c++) {
    for(let r=10; r<=29; r++) {
      grid[r][c] = 36; // Wind Up
    }
  }
  
  // Conveyor Left platform high up
  for(let c=19; c<=25; c++) {
    grid[15][c] = 19; // Conveyor Left
  }
  
  // Jump through platforms
  for(let c=28; c<=30; c++) { grid[12][c] = 52; }
  for(let c=32; c<=34; c++) { grid[16][c] = 52; }
  for(let c=28; c<=30; c++) { grid[20][c] = 52; }
  
  // Wind Right over giant spike pit
  for(let c=31; c<=50; c++) {
    for(let r=20; r<=28; r++) {
      grid[r][c] = 39; // Wind Right
    }
    grid[29][c] = 4; // Spikes below
  }
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}

function createLevel7Grid() {
  const grid = createBlankGrid();
  
  // Starting safe ground
  for(let c=0; c<=4; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Dash powerup
  grid[27][3] = 41; // Dash Powerup
  
  // Dash Panel Right launching over a large gap
  for(let c=5; c<=8; c++) {
    grid[28][c] = 24; // Dash Panel Right
    grid[29][c] = 7;
  }
  
  // Giant spike pit
  for(let c=9; c<=50; c++) {
    grid[28][c] = 0; grid[29][c] = 4; // Spikes below
  }
  
  // Rope over the gap
  grid[10][20] = 55; // Rope anchor
  
  // Cannon in the middle of the air
  grid[20][32] = 53; // Cannon barrel
  
  // Minecart on a floating track
  for(let c=40; c<=48; c++) {
    grid[24][c] = 7; // Ground for track
  }
  grid[23][40] = 56; // Minecart
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}

function createLevel8Grid() {
  const grid = createBlankGrid();
  
  // Starting safe ground
  for(let c=0; c<=8; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Wall blocking the way
  for(let r=10; r<=29; r++) { grid[r][10] = 1; }
  
  // Ground past the wall
  for(let c=11; c<=20; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Gravity switch
  grid[28][18] = 29; // Gravity Switch
  
  // Ceiling path
  for(let c=15; c<=30; c++) { grid[4][c] = 7; grid[5][c] = 7; }
  
  // Spikes on floor and ceiling
  for(let c=31; c<=45; c++) {
    grid[28][c] = 0; grid[29][c] = 4; // Floor spikes
    grid[4][c] = 0; grid[5][c] = 4;   // Ceiling spikes (gravity is reversed, so these act as floor spikes)
  }
  
  // Gravity well to slingshot across
  grid[16][38] = 30; // Gravity Well
  
  // Ceiling path after spikes
  for(let c=46; c<=55; c++) { grid[4][c] = 7; grid[5][c] = 7; }
  
  // Gravity switch to drop back down
  grid[6][52] = 29; // Gravity Switch
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}

function createLevel9Grid() {
  const grid = createBlankGrid();
  
  // Starting area
  for(let c=0; c<=6; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Shrink potion
  grid[27][4] = 104; 
  
  // Wall with 1-tile gap at the bottom
  for(let r=10; r<=27; r++) { grid[r][8] = 1; }
  grid[29][8] = 1; // Floor is solid, gap is at row 28
  
  // Grapple area
  for(let c=9; c<=18; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  grid[27][14] = 44; // Grapple powerup
  
  // Grapple pit
  for(let c=19; c<=30; c++) { grid[28][c] = 0; grid[29][c] = 4; } // Spikes below
  for(let c=19; c<=30; c++) { grid[15][c] = 1; } // Ceiling to grapple onto
  
  // Bomb area
  for(let c=31; c<=40; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  grid[27][34] = 49; // Bomb powerup
  
  // Destructible wall
  for(let r=20; r<=27; r++) { grid[r][40] = 6; } // Explodable blocks
  
  // Boomerang area
  for(let c=41; c<=50; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  grid[27][44] = 33; // Boomerang powerup
  
  // Switch
  grid[20][45] = 12; // Red Switch
  
  // Door (Blue blocks that turn off when red switch is hit? Wait, if switch is red, blue blocks are solid. Hit switch -> turns blue -> red blocks solid, blue blocks disappear)
  for(let r=20; r<=27; r++) { grid[r][50] = 13; } // Blue switch block
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}

function createLevel10Grid() {
  const grid = createBlankGrid();
  
  // Safe start
  for(let c=0; c<=3; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  
  // Conveyor over lava
  for(let c=4; c<=12; c++) {
    grid[28][c] = 20; // Conveyor Right
    grid[29][c] = 22; // Lava below
  }
  
  // Turret firing from above
  grid[20][10] = 8; // Laser Turret Down? Wait, we don't know the exact direction, let's just place it at 10, 20
  
  // Jump through platforms moving up
  grid[24][15] = 52;
  grid[20][18] = 52;
  grid[16][21] = 52;
  
  // Dash powerup at top
  grid[15][21] = 41; // Dash Powerup
  
  // Long dash gap
  for(let c=22; c<=35; c++) {
    grid[29][c] = 22; // Lava
  }
  
  // Rope over lava
  grid[5][30] = 55; // Rope anchor
  
  // Landing zone with switch
  for(let c=36; c<=42; c++) { grid[28][c] = 7; grid[29][c] = 7; }
  grid[27][40] = 12; // Red Switch
  
  // Blue switch door
  for(let r=10; r<=28; r++) { grid[r][44] = 13; } // Blue blocks
  
  // Cannon to shoot over final gap
  grid[27][42] = 53; // Cannon
  
  // Gravity well
  grid[15][50] = 30; // Gravity well
  
  // Final goal
  for(let c=55; c<60; c++) {
    grid[28][c] = 7; grid[29][c] = 7;
  }
  
  return grid;
}

const PRESETS = [
  { id: 'level-1', name: 'The Fundamentals', grid: createLevel1Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 24 }, isPreset: true },
  { id: 'level-2', name: 'Puzzles & Pathways', grid: createLevel2Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-3', name: 'Demolition & Danger', grid: createLevel3Grid(), enemies: [{ id: 'e1', col: 42, row: 26, speed: 1.8, patrolRange: 5, type: 'basic' }], playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 24 }, isPreset: true },
  { id: 'level-4', name: 'Hostile Territory', grid: createLevel4Grid(), enemies: [{ id: 'e1', col: 19, row: 24, speed: 0, patrolRange: 0, type: 'worm' }, { id: 'e2', col: 33, row: 19, speed: 0, patrolRange: 0, type: 'bat' }, { id: 'e3', col: 45, row: 24, speed: 1.8, patrolRange: 0, type: 'chaser' }], playerSpawn: { col: 2, row: 24 }, goalPos: { col: 57, row: 24 }, isPreset: true },
  { id: 'level-5', name: 'The Elements', grid: createLevel5Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-6', name: 'Industrial Complex', grid: createLevel6Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-7', name: 'Momentum & Trajectory', grid: createLevel7Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-8', name: 'Quantum Facility', grid: createLevel8Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, portal1: { col: 5, row: 27 }, portal2: { col: 15, row: 27 }, isPreset: true },
  { id: 'level-9', name: 'Powerup Playground', grid: createLevel9Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-10', name: 'The Final Gauntlet', grid: createLevel10Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 57, row: 27 }, isPreset: true }
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
