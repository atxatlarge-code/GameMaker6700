import { CONFIG } from './config.js';
import { TILE } from './tiles.js';

// Helper to generate a blank grid
function createBlankGrid() {
  const grid = [];
  for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
    const row = [];
    for (let c = 0; c < CONFIG.GRID_COLS; c++) {
      if (r >= CONFIG.GRID_ROWS - 2) {
        row.push(TILE.SOLID); // Bottom 2 rows are ground
      } else {
        row.push(TILE.EMPTY);
      }
    }
    grid.push(row);
  }
  return grid;
}

// Preset 1: Mushroom Forest
function createMushroomForestGrid() {
  const grid = createBlankGrid();
  grid[22][50] = TILE.SOLID; grid[22][51] = TILE.SOLID;
  grid[23][23] = TILE.SOLID; grid[23][24] = TILE.SOLID; grid[23][25] = TILE.SOLID; grid[23][26] = TILE.SOLID; grid[23][49] = TILE.SOLID; grid[23][50] = TILE.SOLID; grid[23][51] = TILE.SOLID;
  grid[24][23] = TILE.SOLID; grid[24][26] = TILE.SOLID; grid[24][48] = TILE.SOLID; grid[24][49] = TILE.SOLID; grid[24][50] = TILE.SOLID; grid[24][51] = TILE.SOLID;
  grid[25][14] = TILE.SOLID; grid[25][15] = TILE.SOLID; grid[25][16] = TILE.SOLID; grid[25][17] = TILE.SOLID; grid[25][18] = TILE.SOLID; grid[25][19] = TILE.SOLID;
  grid[25][23] = TILE.SOLID; grid[25][26] = TILE.SOLID; grid[25][32] = TILE.SOLID; grid[25][33] = TILE.SOLID;
  grid[25][47] = TILE.SOLID; grid[25][48] = TILE.SOLID; grid[25][49] = TILE.SOLID; grid[25][50] = TILE.SOLID; grid[25][51] = TILE.SOLID;
  grid[26][14] = TILE.SOLID; grid[26][19] = TILE.SOLID; grid[26][23] = TILE.SOLID; grid[26][26] = TILE.SOLID;
  grid[26][32] = TILE.SOLID; grid[26][33] = TILE.SOLID; grid[26][38] = TILE.SOLID; grid[26][39] = TILE.SOLID;
  grid[26][46] = TILE.SOLID; grid[26][47] = TILE.SOLID; grid[26][48] = TILE.SOLID; grid[26][49] = TILE.SOLID; grid[26][50] = TILE.SOLID; grid[26][51] = TILE.SOLID;
  grid[27][9] = TILE.TRAMPOLINE; grid[27][12] = TILE.SOLID; grid[27][13] = TILE.SOLID; grid[27][14] = TILE.SOLID; grid[27][19] = TILE.SOLID; grid[27][21] = TILE.TRAMPOLINE;
  grid[27][23] = TILE.SOLID; grid[27][26] = TILE.SOLID; grid[27][32] = TILE.SOLID; grid[27][33] = TILE.SOLID; grid[27][35] = TILE.TRAMPOLINE; grid[27][38] = TILE.SOLID; grid[27][39] = TILE.SOLID;
  grid[27][45] = TILE.SOLID; grid[27][46] = TILE.SOLID; grid[27][47] = TILE.SOLID; grid[27][48] = TILE.SOLID; grid[27][49] = TILE.SOLID; grid[27][50] = TILE.SOLID; grid[27][51] = TILE.SOLID;
  return grid;
}


// Preset 2: Platformer Basics
function createPlatformerGrid() {
  const grid = createBlankGrid();
  // Make a pit in the ground with spikes at the bottom
  for (let c = 20; c < 30; c++) {
    grid[28][c] = TILE.SPIKES; grid[29][c] = TILE.SPIKES;
  }
  // Floating stepping stones across the pit
  grid[26][20] = TILE.SOLID; grid[26][21] = TILE.SOLID;
  grid[24][24] = TILE.SOLID; grid[24][25] = TILE.SOLID;
  grid[26][28] = TILE.SOLID; grid[26][29] = TILE.SOLID;
  // High tower
  for (let r = 20; r <= 27; r++) {
    grid[r][40] = TILE.SOLID; grid[r][41] = TILE.SOLID;
  }
  grid[27][37] = TILE.TRAMPOLINE; // Mushroom to bounce over tower
  return grid;
}

// Preset 3: Sky Climb
function createSkyClimbGrid() {
  const grid = createBlankGrid();
  // Mushrooms on ground
  grid[27][8] = TILE.TRAMPOLINE; grid[27][25] = TILE.TRAMPOLINE; grid[27][42] = TILE.TRAMPOLINE;

  // Staggered vertical platforms
  grid[22][12] = TILE.SOLID; grid[22][13] = TILE.SOLID; grid[22][14] = TILE.SOLID;
  grid[17][18] = TILE.SOLID; grid[17][19] = TILE.SOLID; grid[17][20] = TILE.SOLID;
  grid[13][26] = TILE.SOLID; grid[13][27] = TILE.SOLID; grid[13][28] = TILE.SOLID;
  grid[10][35] = TILE.SOLID; grid[10][36] = TILE.SOLID; grid[10][37] = TILE.SOLID;
  grid[7][45] = TILE.SOLID; grid[7][46] = TILE.SOLID; grid[7][47] = TILE.SOLID; grid[7][48] = TILE.SOLID;

  return grid;
}

// Preset 4: Speed Run
function createSpeedRunGrid() {
  const grid = createBlankGrid();
  // Series of hurdles with fire in front
  for (let c of [15, 25, 35, 45]) {
    grid[27][c] = TILE.SOLID; grid[26][c] = TILE.SOLID;
    grid[27][c - 1] = TILE.FIRE; // Fire!
  }
  grid[27][30] = TILE.TRAMPOLINE; // Bounce over double hurdle
  grid[27][31] = TILE.SOLID; grid[26][31] = TILE.SOLID; grid[25][31] = TILE.SOLID;
  return grid;
}

// Preset 5: Portal Chamber
function createPortalChamberGrid() {
  const grid = createBlankGrid();
  // Tall impassable wall separating col 15
  for (let r = 10; r <= 27; r++) {
    grid[r][15] = TILE.SOLID;
    grid[r][16] = TILE.SOLID;
  }
  // Lava pool on the right side
  for (let c = 28; c <= 45; c++) {
    grid[27][c] = TILE.FIRE; // Fire
  }
  // High ledge where Portal 2 exits
  grid[16][22] = TILE.SOLID; grid[16][23] = TILE.SOLID; grid[16][24] = TILE.SOLID; grid[16][25] = TILE.SOLID;
  
  // Floating platforms over the lava
  grid[22][32] = TILE.SOLID; grid[22][33] = TILE.SOLID;
  grid[18][38] = TILE.SOLID; grid[18][39] = TILE.SOLID;
  grid[23][44] = TILE.SOLID; grid[23][45] = TILE.SOLID;
  
  // Mushroom trampoline before the goal
  grid[27][48] = TILE.TRAMPOLINE;
  grid[23][51] = TILE.SOLID; grid[23][52] = TILE.SOLID; grid[23][53] = TILE.SOLID;
  
  return grid;
}

// Preset 6: Lava Caverns
function createLavaCavernsGrid() {
  const grid = createBlankGrid();
  // Huge bed of fire
  for (let c = 10; c <= 50; c++) {
    grid[27][c] = TILE.FIRE; // Fire
  }
  // Stepping pillars in the lava
  for (let c of [14, 20, 26, 32, 38, 44]) {
    grid[27][c] = TILE.SOLID;
    grid[26][c] = TILE.SOLID;
  }
  // Spikes on some pillars to force high jumps
  grid[25][20] = TILE.SPIKES;
  grid[25][32] = TILE.SPIKES;
  
  // Floating platforms above spikes
  grid[21][19] = TILE.SOLID; grid[21][20] = TILE.SOLID; grid[21][21] = TILE.SOLID;
  grid[21][31] = TILE.SOLID; grid[21][32] = TILE.SOLID; grid[21][33] = TILE.SOLID;
  
  // Trampoline on pillar 38
  grid[25][38] = TILE.TRAMPOLINE;
  
  // High tower before goal
  for (let r = 15; r <= 27; r++) {
    grid[r][48] = TILE.SOLID; grid[r][49] = TILE.SOLID;
  }
  
  // Platform for goal
  grid[15][52] = TILE.SOLID; grid[15][53] = TILE.SOLID; grid[15][54] = TILE.SOLID;
  
  return grid;
}

// Preset 7: Bouncy Castle
function createBouncyCastleGrid() {
  const grid = createBlankGrid();
  // Ground trampolines everywhere
  for (let c = 10; c <= 48; c += 4) {
    grid[27][c] = TILE.TRAMPOLINE; grid[27][c+1] = TILE.TRAMPOLINE;
  }
  // Floating castle platforms
  grid[20][15] = TILE.SOLID; grid[20][16] = TILE.SOLID; grid[20][17] = TILE.SOLID;
  grid[15][24] = TILE.SOLID; grid[15][25] = TILE.SOLID; grid[15][26] = TILE.SOLID;
  grid[12][34] = TILE.SOLID; grid[12][35] = TILE.SOLID; grid[12][36] = TILE.SOLID;
  grid[16][42] = TILE.SOLID; grid[16][43] = TILE.SOLID; grid[16][44] = TILE.SOLID;
  
  // Enclosed throne room in sky
  for (let c = 46; c <= 56; c++) {
    grid[10][c] = TILE.SOLID; // Floor
    grid[4][c] = TILE.SOLID;  // Ceiling
  }
  for (let r = 4; r <= 10; r++) {
    grid[r][46] = TILE.SOLID; // Left wall
    grid[r][56] = TILE.SOLID; // Right wall
  }
  
  return grid;
}

// Preset 8: Tower of Peril
function createTowerOfPerilGrid() {
  const grid = createBlankGrid();
  // Huge central tower from col 22 to 38, row 6 to 27
  for (let r = 6; r <= 27; r++) {
    grid[r][22] = TILE.SOLID; // Left outer wall
    grid[r][38] = TILE.SOLID; // Right outer wall
  }
  // Entrance at bottom left
  grid[26][22] = TILE.EMPTY; grid[27][22] = TILE.EMPTY;
  
  // Internal zig-zag floors
  // Floor 1 (right to left)
  for (let c = TILE.CRUMBLE; c <= 34; c++) grid[23][c] = TILE.SOLID;
  // Floor 2 (left to right)
  for (let c = TILE.FAKE_WALL; c <= 38; c++) grid[19][c] = TILE.SOLID;
  // Floor 3 (right to left)
  for (let c = TILE.CRUMBLE; c <= 34; c++) grid[15][c] = TILE.SOLID;
  // Floor 4 (left to right)
  for (let c = TILE.FAKE_WALL; c <= 38; c++) grid[11][c] = TILE.SOLID;
  // Top roof
  for (let c = TILE.CRUMBLE; c <= 38; c++) grid[6][c] = TILE.SOLID;
  
  // Hazards inside tower
  grid[22][28] = TILE.SPIKES; // Spikes on floor 1
  grid[18][32] = TILE.SPIKES; // Spikes on floor 2
  grid[14][26] = TILE.FIRE; // Fire on floor 3
  
  // Floating cloud platform on the right for goal
  grid[10][48] = TILE.SOLID; grid[10][49] = TILE.SOLID; grid[10][50] = TILE.SOLID; grid[10][51] = TILE.SOLID;
  
  return grid;
}

function createFortressOfBouncinessGrid() {
  const grid = createBlankGrid();
  
  // Starting area walls
  grid[27][10] = TILE.SOLID;
  grid[26][10] = TILE.SOLID;
  grid[25][10] = TILE.SOLID;

  // Key platform up high
  for (let c = TILE.BLOCK_RED; c <= 18; c++) grid[18][c] = TILE.SOLID;
  grid[17][15] = TILE.KEY; // Key
  
  // A moveable block blocking the way
  grid[27][12] = TILE.MOVEABLE;
  
  // Trampoline to reach the key
  grid[27][14] = TILE.TRAMPOLINE;
  
  // Fire pit
  for (let c = TILE.CONVEYOR_RIGHT; c <= 30; c++) grid[27][c] = TILE.FIRE;
  // A trampoline in the middle of the fire pit
  grid[26][25] = TILE.SOLID;
  grid[25][25] = TILE.TRAMPOLINE; // Trampoline on top of a block

  // Lock blocking the exit
  grid[27][40] = TILE.LOCK;
  grid[26][40] = TILE.LOCK;
  grid[25][40] = TILE.LOCK;
  grid[24][40] = TILE.LOCK;
  
  // Safe zone after the fire pit
  for (let c = TILE.WATER; c <= 50; c++) grid[27][c] = TILE.SOLID;
  
  // A few coins scattered
  grid[16][15] = TILE.COIN;
  grid[21][25] = TILE.COIN;
  grid[26][35] = TILE.COIN;

  return grid;
}

// Preset 10: Mechanics Showcase
function createMechanicsShowcaseGrid() {
  const grid = createBlankGrid();
  // Ice slide
  for (let c = 10; c <= 15; c++) {
    grid[27][c] = TILE.ICE;
    grid[28][c] = TILE.ICE;
  }
  // Double Jump powerup before pit
  grid[26][15] = TILE.DASH_PANEL_RIGHT;
  
  // Spikes pit
  for (let c = 16; c <= 20; c++) {
    grid[27][c] = TILE.SPIKES;
    grid[28][c] = TILE.SPIKES;
  }

  // Anti-Gravity tunnel
  grid[26][23] = TILE.ANTI_GRAVITY;
  grid[25][23] = TILE.ANTI_GRAVITY;
  grid[24][23] = TILE.ANTI_GRAVITY;
  grid[23][23] = TILE.ANTI_GRAVITY;
  grid[22][23] = TILE.ANTI_GRAVITY;
  
  // Ceiling with Conveyor Right
  for (let c = 22; c <= 30; c++) {
    grid[19][c] = TILE.CONVEYOR_RIGHT; // Ceiling floor
    grid[18][c] = TILE.SOLID;  // Ceiling backing
  }
  
  // Drop down
  for (let r = 20; r <= 27; r++) {
    grid[r][31] = TILE.SOLID; // Wall to force drop down
  }

  // Tripwire
  grid[27][35] = TILE.TRIPWIRE;

  // Red/Blue block puzzle
  grid[27][40] = TILE.BLOCK_RED; // Red block blocks bottom
  grid[26][40] = TILE.BLOCK_RED;
  grid[25][40] = TILE.BLOCK_RED;

  // Blue block blocks top (initially open if switch is unpressed)
  // Actually tripwire toggles the state. 
  grid[24][40] = TILE.BLOCK_BLUE;
  grid[23][40] = TILE.BLOCK_BLUE;

  // Goal platform
  for (let c = 52; c <= 56; c++) {
    grid[20][c] = TILE.SOLID;
  }
  return grid;
}

function createAbyssalDepthsGrid() {
  const grid = createBlankGrid();
  // Deep pit
  for (let r = 10; r <= 27; r++) {
    grid[r][4] = TILE.SOLID; // Left wall
    grid[r][16] = TILE.SOLID; // Right wall
  }
  // Slime wall on the right for sliding down safely
  for (let r = 12; r <= 25; r++) {
    grid[r][15] = TILE.SLIME;
  }
  // Water pool at the bottom
  for (let r = 24; r <= 27; r++) {
    for (let c = 5; c <= 15; c++) {
      grid[r][c] = TILE.WATER;
    }
  }
  // Switch in the water
  grid[27][10] = TILE.SWITCH;
  // Fire hazard in the water to avoid
  grid[27][12] = TILE.SIZE_PORTAL;

  // Path out of the water using trampolines
  grid[27][5] = TILE.FIRE;
  grid[23][5] = TILE.FIRE;
  
  // High ledge to goal
  for (let c = 16; c <= 25; c++) {
    grid[10][c] = TILE.SOLID;
  }
  
  // Doorway is blocked by red block
  grid[9][24] = TILE.BLOCK_RED;
  grid[8][24] = TILE.BLOCK_RED;

  // Floor out of bounds for the rest
  for (let c = 26; c < CONFIG.GRID_COLS; c++) {
    grid[27][c] = TILE.SOLID;
  }

  return grid;
}

// Preset 12: Windy Ascents
function createWindyAscentsGrid() {
  const grid = createBlankGrid();
  
  // Floor with spikes to penalize falling
  for (let c = 5; c < 50; c++) {
    grid[27][c] = TILE.SPIKES; // Spikes
  }
  
  // Starting safe zone
  grid[27][3] = TILE.SOLID; grid[27][4] = TILE.SOLID;
  grid[26][4] = TILE.SOLID;
  
  // Wind Up column 1
  for (let r = 15; r <= 26; r++) {
    grid[r][6] = TILE.WIND_UP; // Wind Up
    grid[r][7] = TILE.WIND_UP;
  }
  
  // Wind Right across
  for (let c = 8; c <= 20; c++) {
    grid[15][c] = TILE.WIND_RIGHT; // Wind Right
    grid[16][c] = TILE.WIND_RIGHT;
  }
  
  // Wind Down
  for (let r = 17; r <= 22; r++) {
    grid[r][19] = TILE.WIND_DOWN; // Wind Down
    grid[r][20] = TILE.WIND_DOWN;
  }
  
  // Platform to catch player
  grid[24][19] = TILE.SOLID; grid[24][20] = TILE.SOLID; grid[24][21] = TILE.SOLID;
  
  // Wind Right
  for (let c = 22; c <= 35; c++) {
    grid[23][c] = TILE.WIND_RIGHT;
    grid[22][c] = TILE.WIND_RIGHT;
  }
  
  // Wind Up to Goal
  for (let r = 5; r <= 22; r++) {
    grid[r][34] = TILE.WIND_UP;
    grid[r][35] = TILE.WIND_UP;
  }
  
  // Goal platform
  grid[5][38] = TILE.SOLID; grid[5][39] = TILE.SOLID; grid[5][40] = TILE.SOLID;
  
  return grid;
}

// Preset 10: Magnetic Facility
function createMagneticFacilityGrid() {
  const grid = createBlankGrid();
  
  // Powerup platform
  grid[27][8] = TILE.SOLID; grid[26][8] = TILE.SOLID; grid[25][8] = TILE.SOLID;
  grid[25][9] = TILE.MAGNETIC_BOOTS; // Magnetic Boots

  // Tall ceiling structure to walk on
  for (let r = 20; r <= 23; r++) {
    for (let c = 12; c <= 25; c++) {
      grid[r][c] = TILE.SOLID;
    }
  }

  // Spikes below the ceiling
  for (let c = 12; c <= 25; c++) {
    grid[27][c] = TILE.SPIKES;
  }

  // Conveyor Belt jumping section
  grid[20][30] = TILE.CONVEYOR_RIGHT; grid[20][31] = TILE.CONVEYOR_RIGHT; grid[20][32] = TILE.CONVEYOR_RIGHT; // Conveyor Right
  grid[15][38] = TILE.CONVEYOR_LEFT; grid[15][39] = TILE.CONVEYOR_LEFT; grid[15][40] = TILE.CONVEYOR_LEFT; // Conveyor Left
  grid[10][45] = TILE.SOLID; grid[10][46] = TILE.SOLID;

  // Final wall climb
  for (let r = 8; r <= 27; r++) {
    grid[r][50] = TILE.SOLID;
  }

  // Goal platform
  grid[7][51] = TILE.SOLID; grid[7][52] = TILE.SOLID; grid[7][53] = TILE.SOLID;

  return grid;
}

// Preset 14: Ghostly Demolition
function createGhostlyDemolitionGrid() {
  const grid = createBlankGrid();
  
  // Starting area
  grid[27][3] = TILE.GHOST_SWITCH; // Ghost Switch
  grid[27][10] = TILE.SWITCH; // Switch Block
  
  // Wall of Red/Blue blocks
  for (let r = 20; r <= 27; r++) {
    grid[r][15] = TILE.BLOCK_RED; // Red Blocks
    grid[r][16] = TILE.BLOCK_BLUE; // Blue Blocks
  }
  
  // Bomb powerup area
  grid[27][22] = TILE.BOMB_POWERUP; // Bomb Powerup
  
  // Cracked wall blocking goal
  for (let r = 15; r <= 27; r++) {
    grid[r][30] = TILE.CRACKED_BLOCK; // Cracked Blocks
    grid[r][31] = TILE.CRACKED_BLOCK; // Cracked Blocks
  }

  // Red Door blocking goal
  grid[27][40] = TILE.DOOR_RED;
  grid[26][40] = TILE.DOOR_RED;
  grid[25][40] = TILE.DOOR_RED;

  // Ledges to make it look cool
  grid[20][35] = TILE.SOLID; grid[20][36] = TILE.SOLID; grid[20][37] = TILE.SOLID;
  grid[18][45] = TILE.SOLID; grid[18][46] = TILE.SOLID; grid[18][47] = TILE.SOLID;

  return grid;
}

function createJumpThroughGrid() {
  const grid = createBlankGrid();
  
  // Create a tower of jump-through platforms
  for (let c = 5; c <= 25; c++) {
    grid[22][c] = TILE.JUMP_THROUGH;
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
  grid[27][5] = TILE.SOLID; grid[27][6] = TILE.SOLID; grid[27][7] = TILE.SOLID;

  // First cannon to catch the jump
  grid[24][12] = TILE.CANNON;

  // Second cannon
  grid[15][20] = TILE.CANNON;

  // Third cannon
  grid[25][30] = TILE.CANNON;

  // Fourth cannon pointing up to goal
  grid[18][45] = TILE.CANNON;

  // Goal platform
  grid[5][45] = TILE.SOLID; grid[5][46] = TILE.SOLID; grid[5][47] = TILE.SOLID;
  grid[5][44] = TILE.SOLID;

  return grid;
}

// Preset 25: Painted Pathways
function createPaintedPathwaysGrid() {
  const grid = createBlankGrid();
  // Player spawns on left
  // First challenge: A paint block that reveals a staircase
  grid[25][10] = TILE.PAINT_BLOCK; // Paint block
  grid[24][12] = TILE.INVISIBLE_BLOCK; grid[23][14] = TILE.INVISIBLE_BLOCK; grid[22][16] = TILE.INVISIBLE_BLOCK; // Invisible stairs
  
  // Platform to rest on
  grid[22][17] = TILE.SOLID; grid[22][18] = TILE.SOLID; grid[22][19] = TILE.SOLID; grid[22][20] = TILE.SOLID;
  
  // Second challenge: A pit of spikes, need to hit paint block in air or from below
  for (let c = 21; c <= 30; c++) {
    grid[28][c] = TILE.SPIKES;
    grid[29][c] = TILE.SPIKES;
  }
  
  grid[25][24] = TILE.PAINT_BLOCK; // Paint block floating over spikes
  grid[22][24] = TILE.INVISIBLE_BLOCK; grid[22][25] = TILE.INVISIBLE_BLOCK; // Invisible bridge over spikes
  grid[22][26] = TILE.INVISIBLE_BLOCK; grid[22][27] = TILE.INVISIBLE_BLOCK; grid[22][28] = TILE.INVISIBLE_BLOCK;
  
  // Final stretch
  grid[22][30] = TILE.SOLID; grid[22][31] = TILE.SOLID; grid[22][32] = TILE.SOLID;
  
  // A wall blocking the goal, with a paint block above it
  for(let r=22; r<=27; r++) {
    grid[r][38] = TILE.SOLID;
  }
  grid[20][36] = TILE.PAINT_BLOCK; // Paint block
  grid[18][38] = TILE.INVISIBLE_BLOCK; // Invisible block above wall
  
  // Platform behind wall to land safely
  grid[25][40] = TILE.SOLID; grid[25][41] = TILE.SOLID;
  
  return grid;
}

// Preset 26: Dash City
function createDashCityGrid() {
  const grid = createBlankGrid();
  // Player spawns on left
  grid[28][2] = TILE.SOLID; grid[28][3] = TILE.SOLID; grid[28][4] = TILE.SOLID;

  // Huge gap, need to hit dash panel
  grid[28][5] = TILE.DASH_PANEL_RIGHT; // Dash Panel Right
  
  for (let c = 6; c <= 20; c++) {
    grid[29][c] = TILE.SPIKES; // Spikes
  }
  
  // Landing platform
  grid[28][21] = TILE.SOLID; grid[28][22] = TILE.SOLID; grid[28][23] = TILE.SOLID;
  
  // Another dash panel over a longer gap
  grid[28][24] = TILE.DASH_PANEL_RIGHT; // Dash Panel Right
  grid[28][25] = TILE.DASH_PANEL_RIGHT; // Dash Panel Right
  
  for (let c = 26; c <= 45; c++) {
    grid[29][c] = TILE.SPIKES; // Spikes
  }
  
  // Final landing and goal
  grid[28][46] = TILE.SOLID; grid[28][47] = TILE.SOLID; grid[28][48] = TILE.SOLID;
  
  return grid;
}




function createBallLevelGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Outer walls
  for(let c=0; c<60; c++) {
    grid[0][c] = TILE.SOLID;
    grid[29][c] = TILE.SOLID;
  }
  for(let r=0; r<30; r++) {
    grid[r][0] = TILE.SOLID;
    grid[r][59] = TILE.SOLID;
  }

  // --- Plunger Lane (Right Side) ---
  for(let r=1; r<29; r++) {
    grid[r][56] = TILE.SOLID; // inner wall of plunger lane
  }
  grid[28][57] = TILE.TRAMPOLINE; // Trampoline to launch up
  grid[28][58] = TILE.TRAMPOLINE;
  
  // Top of plunger lane directs left
  grid[2][56] = TILE.EMPTY; // open a hole
  grid[3][56] = TILE.EMPTY;
  grid[4][56] = TILE.EMPTY;
  grid[1][58] = TILE.RAMP_LEFT; // Ramp Left
  grid[2][58] = TILE.RAMP_LEFT;
  grid[3][58] = TILE.RAMP_LEFT;
  grid[4][57] = TILE.RAMP_LEFT; // Ramp Left pushing into the main area

  // --- Main Area Funnels (Bottom) ---
  // Left funnel
  for(let i=0; i<15; i++) {
    grid[28 - Math.floor(i/2)][1 + i] = TILE.RAMP_RIGHT; // Ramp Right (shallower)
    grid[28 - Math.floor(i/2) + 1][1 + i] = TILE.SOLID; // Support under ramp
  }
  // Right funnel
  for(let i=0; i<15; i++) {
    grid[28 - Math.floor(i/2)][55 - i] = TILE.RAMP_LEFT; // Ramp Left
    grid[28 - Math.floor(i/2) + 1][55 - i] = TILE.SOLID; 
  }
  
  // Pit in the middle
  for(let c=16; c<=40; c++) {
    grid[28][c] = TILE.SPIKES; // Spikes!
  }
  // Wind saving you from the pit
  for(let c=24; c<=32; c++) {
    for(let r=20; r<=27; r++) {
      grid[r][c] = TILE.WIND_UP; // Wind Up
    }
    grid[28][c] = TILE.TRAMPOLINE; // Trampolines right above spikes in the very center
  }

  // --- Mid-Level Flippers / Ramps ---
  // Left mid ramp
  for(let i=0; i<8; i++) {
    grid[20 - i][10 + i] = TILE.RAMP_RIGHT; 
    grid[21 - i][10 + i] = TILE.SOLID;
  }
  // Right mid ramp
  for(let i=0; i<8; i++) {
    grid[20 - i][46 - i] = TILE.RAMP_LEFT; 
    grid[21 - i][46 - i] = TILE.SOLID;
  }

  // --- Bumper Clusters ---
  // Top center cluster
  grid[8][28] = TILE.BUMPER;
  grid[10][25] = TILE.BUMPER;
  grid[10][31] = TILE.BUMPER;
  grid[12][28] = TILE.BUMPER;
  grid[12][20] = TILE.BUMPER;
  grid[12][36] = TILE.BUMPER;

  // --- Cannons ---
  // Cannons shooting across the middle
  grid[15][1] = TILE.CANNON; // Cannon pointing right? Well, cannon spins or shoots automatically.
  grid[10][55] = TILE.CANNON;

  // --- High Ramps ---
  for(let i=0; i<10; i++) {
    grid[12 - Math.floor(i/2)][1 + i] = TILE.RAMP_RIGHT; 
    grid[13 - Math.floor(i/2)][1 + i] = TILE.SOLID; 
  }
  
  // --- Gravity Wells ---
  grid[15][15] = TILE.GRAVITY_WELL;
  grid[15][41] = TILE.GRAVITY_WELL;
  grid[5][10] = TILE.GRAVITY_WELL;
  grid[5][46] = TILE.GRAVITY_WELL;

  // --- Upper Goal Platform ---
  // Locked door blocking goal
  grid[4][28] = TILE.SOLID;
  grid[4][30] = TILE.SOLID;
  grid[4][29] = TILE.LOCK; // Lock
  grid[3][28] = TILE.SOLID;
  grid[3][30] = TILE.SOLID;
  grid[2][28] = TILE.SOLID;
  grid[2][30] = TILE.SOLID;
  
  // Key location
  grid[5][5] = TILE.KEY; // Key in top left corner
  
  // Goal platform floor
  for(let c=27; c<=31; c++) {
    grid[5][c] = TILE.SOLID;
  }

  // --- Slime Walls to catch and drop ---
  for(let r=1; r<10; r++) {
    grid[r][1] = TILE.SLIME;
    grid[r][55] = TILE.SLIME;
  }

  return grid;
}

function createLevel1Grid() {
  const grid = createBlankGrid();
  for(let c=0; c<60; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  grid[27][10] = TILE.SOLID;
  grid[28][20] = TILE.EMPTY; grid[29][20] = TILE.EMPTY;
  grid[28][30] = TILE.SPIKES;
  for(let r=TILE.CHECKPOINT; r<=29; r++) { grid[r][40] = TILE.SOLID; grid[r][41] = TILE.SOLID; }
  grid[27][38] = TILE.TRAMPOLINE; 
  for(let c=TILE.CRACKED_BLOCK; c<60; c++) { grid[25][c] = TILE.EARTH; }
  return grid;
}

function createLevel2Grid() {
  const grid = createBlankGrid();
  for(let c=0; c<60; c++) { grid[28][c] = TILE.SOLID; grid[29][c] = TILE.SOLID; }
  for(let r=TILE.CHECKPOINT; r<=27; r++) { grid[r][10] = TILE.BREAKABLE; }
  for(let r=TILE.DASH_PANEL_RIGHT; r<=27; r++) { grid[r][25] = TILE.SOLID; }
  grid[27][20] = TILE.MOVEABLE;
  grid[25][35] = TILE.SOLID;
  grid[24][35] = TILE.KEY;
  for(let r=TILE.DASH_PANEL_RIGHT; r<=27; r++) { grid[r][40] = TILE.LOCK; }
  grid[27][45] = TILE.SWITCH;
  for(let r=TILE.CHECKPOINT; r<=27; r++) { grid[r][50] = TILE.BLOCK_RED; }
  return grid;
}

function createLevel3Grid() {
  const grid = createBlankGrid();
  grid[27][10] = TILE.BOMB_POWERUP;
  for(let r=TILE.DASH_PANEL_RIGHT; r<=27; r++) { grid[r][15] = TILE.CRACKED_BLOCK; }
  for(let c=25; c<=35; c++) {
    grid[28][c] = TILE.EMPTY; grid[29][c] = TILE.EMPTY;
    grid[27][c] = TILE.CRUMBLE; grid[29][c] = TILE.SPIKES;
  }
  grid[27][45] = TILE.EARTH;
  for(let r=TILE.CHECKPOINT; r<=29; r++) { grid[r][55] = TILE.EARTH; }
  return grid;
}

function createLevel4Grid() {
  const grid = createBlankGrid();
  for(let c=0; c<=10; c++) { for(let r=TILE.CHECKPOINT; r<=29; r++) { grid[r][c] = TILE.EARTH; } }
  for(let c=TILE.SWITCH; c<=13; c++) { grid[28][c] = TILE.EMPTY; grid[29][c] = TILE.EMPTY; grid[29][c] = TILE.SPIKES; }
  for(let c=TILE.SIZE_PORTAL; c<=24; c++) { for(let r=TILE.CHECKPOINT; r<=29; r++) { grid[r][c] = TILE.EARTH; } }
  for(let c=TILE.CHECKPOINT; c<=27; c++) { grid[28][c] = TILE.EMPTY; grid[29][c] = TILE.EMPTY; grid[29][c] = TILE.SPIKES; }
  for(let c=TILE.BUMPER; c<=48; c++) { for(let r=TILE.CHECKPOINT; r<=29; r++) { grid[r][c] = TILE.EARTH; } }
  grid[20][33] = TILE.EARTH; grid[20][34] = TILE.EARTH;
  for(let c=TILE.BOMB_POWERUP; c<=51; c++) { grid[28][c] = TILE.EMPTY; grid[29][c] = TILE.EMPTY; grid[29][c] = TILE.SPIKES; }
  for(let c=TILE.JUMP_THROUGH; c<60; c++) { for(let r=TILE.CHECKPOINT; r<=29; r++) { grid[r][c] = TILE.EARTH; } }
  return grid;
}

function createLevel5Grid() {
  const grid = createBlankGrid();
  for(let c=0; c<=5; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  for(let c=TILE.BREAKABLE; c<=12; c++) { grid[28][c] = TILE.ICE; grid[29][c] = TILE.EARTH; }
  for(let c=TILE.BLOCK_BLUE; c<=15; c++) { grid[28][c] = TILE.EMPTY; grid[29][c] = TILE.FIRE; }
  for(let c=TILE.GHOST_BLOCK; c<=20; c++) { grid[25][c] = TILE.ICE; }
  for(let c=TILE.TRIPWIRE; c<=24; c++) { grid[28][c] = TILE.WATER; grid[29][c] = TILE.SPIKES; }
  for(let c=TILE.CHECKPOINT; c<=30; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  grid[27][30] = TILE.TURRET;
  for(let c=TILE.BOOMERANG; c<=35; c++) { grid[24][c] = TILE.ICE; }
  for(let c=TILE.WIND_LEFT; c<=40; c++) { grid[20][c] = TILE.ICE; }
  for(let c=TILE.GRAPPLE_POWERUP; c<=46; c++) { grid[24][c] = TILE.ICE; }
  for(let c=TILE.BOMB_POWERUP; c<60; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  return grid;
}

function createLevel6Grid() {
  const grid = createBlankGrid();
  
  // Starting safe ground
  for(let c=0; c<=4; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  
  // Conveyor Right over spikes
  for(let c=5; c<=15; c++) {
    grid[28][c] = TILE.CONVEYOR_RIGHT; // Conveyor Right
    grid[29][c] = TILE.SPIKES;  // Spikes below
  }
  
  // Wind Up tunnel
  for(let c=16; c<=18; c++) {
    for(let r=10; r<=29; r++) {
      grid[r][c] = TILE.WIND_UP; // Wind Up
    }
  }
  
  // Conveyor Left platform high up
  for(let c=19; c<=25; c++) {
    grid[15][c] = TILE.CONVEYOR_LEFT; // Conveyor Left
  }
  
  // Jump through platforms
  for(let c=TILE.BUMPER; c<=30; c++) { grid[12][c] = TILE.JUMP_THROUGH; }
  for(let c=TILE.SLIME; c<=34; c++) { grid[16][c] = TILE.JUMP_THROUGH; }
  for(let c=TILE.BUMPER; c<=30; c++) { grid[20][c] = TILE.JUMP_THROUGH; }
  
  // Wind Right over giant spike pit
  for(let c=31; c<=50; c++) {
    for(let r=20; r<=28; r++) {
      grid[r][c] = TILE.WIND_RIGHT; // Wind Right
    }
    grid[29][c] = TILE.SPIKES; // Spikes below
  }
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH;
  }
  
  return grid;
}

function createLevel7Grid() {
  const grid = createBlankGrid();
  
  // Starting safe ground
  for(let c=0; c<=4; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  
  // Dash powerup
  grid[27][3] = TILE.DASH_POWERUP; // Dash Powerup
  
  // Dash Panel Right launching over a large gap
  for(let c=5; c<=8; c++) {
    grid[28][c] = TILE.DASH_PANEL_RIGHT; // Dash Panel Right
    grid[29][c] = TILE.EARTH;
  }
  
  // Giant spike pit
  for(let c=9; c<=50; c++) {
    grid[28][c] = TILE.EMPTY; grid[29][c] = TILE.SPIKES; // Spikes below
    if (c % 5 === 0 && c > 10 && c < 50) {
      grid[27][c] = TILE.EARTH; // Safe island
    }
  }
  
  // Rope over the gap
  grid[10][20] = TILE.ROPE; // Rope anchor
  
  // Cannon in the middle of the air
  grid[20][32] = TILE.CANNON; // Cannon barrel
  
  // Minecart on a floating track
  for(let c=40; c<=48; c++) {
    grid[24][c] = TILE.EARTH; // Ground for track
  }
  grid[23][40] = TILE.MINECART; // Minecart
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH;
  }
  
  return grid;
}

function createLevel8Grid() {
  const grid = createBlankGrid();
  
  // Starting safe ground
  for(let c=0; c<=8; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  
  // Wall blocking the way
  for(let r=10; r<=29; r++) { grid[r][10] = TILE.SOLID; }
  
  // Ground past the wall
  for(let c=11; c<=20; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  
  // Gravity switch
  grid[28][18] = TILE.GRAVITY_SWITCH; // Gravity Switch
  
  // Ceiling path
  for(let c=15; c<=30; c++) { grid[4][c] = TILE.EARTH; grid[5][c] = TILE.EARTH; }
  
  // Spikes on floor and ceiling
  for(let c=31; c<=45; c++) {
    grid[28][c] = TILE.EMPTY; grid[29][c] = TILE.SPIKES; // Floor spikes
    grid[4][c] = TILE.EMPTY; grid[5][c] = TILE.SPIKES;   // Ceiling spikes (gravity is reversed, so these act as floor spikes)
    if (c % 3 === 0) {
      grid[27][c] = TILE.EARTH; // Safe platform
      grid[6][c] = TILE.EARTH;  // Safe ceiling platform
    }
  }
  
  // Gravity well to slingshot across (REMOVED)
  
  // Ceiling path after spikes
  for(let c=46; c<=55; c++) { grid[4][c] = TILE.EARTH; grid[5][c] = TILE.EARTH; }
  
  // Gravity switch to drop back down
  grid[6][52] = TILE.GRAVITY_SWITCH; // Gravity Switch
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH;
  }
  
  return grid;
}

function createLevel9Grid() {
  const grid = createBlankGrid();
  
  // Starting area
  for(let c=0; c<=6; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  
  // Shrink potion
  grid[27][4] = TILE.SHRINK_POTION; 
  
  // Wall with 1-tile gap at the bottom
  for(let r=10; r<=26; r++) { grid[r][8] = TILE.SOLID; } // Gap is now 2 tiles high
  grid[29][8] = TILE.SOLID; // Floor is solid
  
  // Grapple area
  for(let c=9; c<=18; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  grid[27][14] = TILE.DASH_POWERUP; // Replaced Grapple with Dash
  
  // Grapple pit
  for(let c=19; c<=30; c++) { 
    grid[28][c] = TILE.EMPTY; grid[29][c] = TILE.SPIKES; 
    if (c % 4 === 0) {
      grid[27][c] = TILE.EARTH; // Safe platforms over pit
    }
  } 
  for(let c=19; c<=30; c++) { grid[15][c] = TILE.SOLID; } // Ceiling
  
  // Bomb area
  for(let c=31; c<=40; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  
  // Destructible wall
  for(let r=20; r<=27; r++) { grid[r][40] = TILE.EMPTY; } // Explodable blocks removed
  
  // Boomerang area
  for(let c=41; c<=50; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  
  // Switch
  grid[20][45] = TILE.EMPTY; // Red Switch removed
  
  // Door
  for(let r=20; r<=27; r++) { grid[r][50] = TILE.EMPTY; } // Blue switch block removed
  
  // Goal safe ground
  for(let c=51; c<60; c++) {
    grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH;
  }
  
  return grid;
}

function createLevel10Grid() {
  const grid = createBlankGrid();
  
  // Safe start
  for(let c=0; c<=3; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  
  // Conveyor over lava
  for(let c=4; c<=12; c++) {
    grid[28][c] = TILE.CONVEYOR_RIGHT; // Conveyor Right
    grid[29][c] = TILE.CRUMBLE; // Lava below
  }
  
  // Turret firing from above
  grid[20][10] = TILE.LOCK; // Laser Turret Down? Wait, we don't know the exact direction, let's just place it at 10, 20
  
  // Jump through platforms moving up
  grid[24][15] = TILE.JUMP_THROUGH;
  grid[20][18] = TILE.JUMP_THROUGH;
  grid[16][21] = TILE.JUMP_THROUGH;
  
  // Dash powerup at top
  grid[15][21] = TILE.DASH_POWERUP; // Dash Powerup
  
  // Long dash gap
  for(let c=22; c<=35; c++) {
    grid[29][c] = TILE.CRUMBLE; // Lava
  }
  
  // Rope over lava
  grid[5][30] = TILE.ROPE; // Rope anchor
  
  // Landing zone with switch
  for(let c=TILE.WIND_UP; c<=42; c++) { grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH; }
  grid[27][40] = TILE.BLOCK_RED; // Red Switch
  
  // Blue switch door
  for(let r=TILE.MOVEABLE; r<=28; r++) { grid[r][44] = TILE.BLOCK_BLUE; } // Blue blocks
  
  // Cannon to shoot over final gap
  grid[27][42] = TILE.CANNON; // Cannon
  
  // Gravity well
  grid[15][50] = TILE.GRAVITY_WELL_ALIAS; // Gravity well
  
  // Final goal
  for(let c=55; c<60; c++) {
    grid[28][c] = TILE.EARTH; grid[29][c] = TILE.EARTH;
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
  { id: 'level-10', name: 'The Final Gauntlet', grid: createLevel10Grid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 57, row: 27 }, isPreset: true },

  // ── Bonus Levels ──────────────────────────────────────
  { id: 'level-11', name: 'Mushroom Forest', grid: createMushroomForestGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-12', name: 'Classic Platformer', grid: createPlatformerGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-13', name: 'Sky Climb', grid: createSkyClimbGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 5 }, isPreset: true },
  { id: 'level-14', name: 'Speed Run', grid: createSpeedRunGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-15', name: 'Portal Chamber', grid: createPortalChamberGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-16', name: 'Lava Caverns', grid: createLavaCavernsGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-17', name: 'Bouncy Castle', grid: createBouncyCastleGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 5 }, isPreset: true },
  { id: 'level-18', name: 'Tower of Peril', grid: createTowerOfPerilGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 5 }, isPreset: true },
  { id: 'level-19', name: 'Fortress of Bounciness', grid: createFortressOfBouncinessGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-20', name: 'Mechanics Showcase', grid: createMechanicsShowcaseGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-21', name: 'Abyssal Depths', grid: createAbyssalDepthsGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-22', name: 'Windy Ascents', grid: createWindyAscentsGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 5 }, isPreset: true },
  { id: 'level-23', name: 'Magnetic Facility', grid: createMagneticFacilityGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-24', name: 'Ghostly Demolition', grid: createGhostlyDemolitionGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-25', name: 'Jump-Through Tower', grid: createJumpThroughGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 5 }, isPreset: true },
  { id: 'level-26', name: 'Cannon Barrels', grid: createCannonBarrelGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 5 }, isPreset: true },
  { id: 'level-27', name: 'Painted Pathways', grid: createPaintedPathwaysGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-28', name: 'Dash City', grid: createDashCityGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-29', name: 'Pinball Arena', grid: createBallLevelGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 5 }, isPreset: true },
  { id: 'level-30', name: 'Tiny Tunnels', grid: createTinyTunnelsGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-31', name: 'Singularity Sprint', grid: createSingularitySprintGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-32', name: 'Reflector Chamber', grid: createReflectorChamberGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-33', name: 'Minecart Madness', grid: createMinecartMadnessGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 27 }, isPreset: true },
  { id: 'level-34', name: 'Rope Swings', grid: createRopeSwingsGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 5 }, isPreset: true },
  { id: 'level-35', name: 'Turret Gauntlet', grid: createTurretGrid(), playerSpawn: { col: 2, row: 27 }, goalPos: { col: 55, row: 5 }, isPreset: true },
];

function createTinyTunnelsGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Floor
  for (let c = 0; c < 60; c++) grid[28][c] = TILE.SOLID;
  for (let c = 0; c < 60; c++) grid[29][c] = TILE.SOLID;
  
  // Left wall
  for (let r = 0; r < 30; r++) grid[r][0] = TILE.SOLID;
  // Right wall
  for (let r = 0; r < 30; r++) grid[r][59] = TILE.SOLID;

  // Giant wall blocking progress
  for (let r = 10; r < 28; r++) {
    grid[r][25] = TILE.SOLID;
  }

  // 1-tile high gap at the bottom of the wall
  grid[27][25] = TILE.EMPTY; // Gap for shrunk player
  grid[27][26] = TILE.EMPTY;
  grid[27][27] = TILE.EMPTY;

  // Shrinking potion
  grid[27][15] = TILE.SHRINK_POTION; // Shrink Potion

  // A couple of obstacles that require small jumps
  grid[27][40] = TILE.SOLID; // Small hurdle
  grid[27][45] = TILE.SOLID; // Small hurdle

  return grid;
}

function createSingularitySprintGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Floor with gaps
  for (let c = 0; c < 15; c++) grid[28][c] = TILE.SOLID;
  for (let c = TILE.CHECKPOINT; c < 40; c++) grid[28][c] = TILE.SOLID;
  for (let c = TILE.CRACKED_BLOCK; c < 60; c++) grid[28][c] = TILE.SOLID;
  
  // Left wall
  for (let r = 0; r < 30; r++) grid[r][0] = TILE.SOLID;
  // Right wall
  for (let r = 0; r < 30; r++) grid[r][59] = TILE.SOLID;

  // Add Gravity Wells over the gaps to help pull player across
  grid[20][20] = TILE.GRAVITY_WELL; // Gravity well 1
  grid[20][45] = TILE.GRAVITY_WELL; // Gravity well 2
  
  // Turrets that fire projectiles which get sucked into gravity well
  grid[27][14] = TILE.TURRET; // Turret
  grid[27][39] = TILE.TURRET; // Turret
  
  return grid;
}

function createReflectorChamberGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Floor
  for (let c = 0; c < 60; c++) grid[28][c] = TILE.SOLID;
  for (let c = 0; c < 60; c++) grid[29][c] = TILE.SOLID;
  // Left wall
  for (let r = 0; r < 30; r++) grid[r][0] = TILE.SOLID;
  // Right wall
  for (let r = 0; r < 30; r++) grid[r][59] = TILE.SOLID;
  // Ceiling
  for (let c = 0; c < 60; c++) grid[0][c] = TILE.SOLID;

  // Turrets on the right, shooting left
  grid[27][50] = TILE.MOVEABLE;
  grid[25][50] = TILE.MOVEABLE;
  grid[23][50] = TILE.MOVEABLE;
  
  // A lazer enemy on a platform
  grid[15][40] = TILE.SOLID;
  grid[15][41] = TILE.SOLID;
  grid[15][42] = TILE.SOLID;
  grid[14][41] = TILE.SIZE_PORTAL; // Lazer

  // Give player a reflector shield cover
  grid[27][20] = TILE.REFLECTOR;
  grid[26][20] = TILE.REFLECTOR;
  grid[25][20] = TILE.REFLECTOR;
  grid[24][20] = TILE.REFLECTOR;
  
  // Put a key and door just to use it
  grid[13][41] = TILE.KEY; // Key
  grid[27][58] = TILE.LOCK; // Door
  
  return grid;
}

function createMinecartMadnessGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  
  // Starting area
  for (let c = 0; c < 10; c++) grid[28][c] = TILE.SOLID; // Floor
  grid[27][4] = TILE.MINECART; // Minecart!

  // Ramp 1
  grid[28][10] = TILE.RAMP_RIGHT; // Ramp Right
  
  // Huge Lava gap
  for (let c = TILE.MOVEABLE; c < 20; c++) grid[29][c] = TILE.FIRE;
  
  // Landing platform
  for (let c = TILE.CONVEYOR_RIGHT; c < 25; c++) grid[20][c] = TILE.SOLID;
  grid[19][24] = TILE.RAMP_RIGHT; // Another Ramp Right
  
  // Another Huge Lava gap
  for (let c = TILE.CHECKPOINT; c < 45; c++) grid[29][c] = TILE.FIRE;

  // Final landing
  for (let c = TILE.STOPWATCH; c < 60; c++) grid[10][c] = TILE.SOLID;
  
  return grid;
}

function createRopeSwingsGrid() {
  const grid = Array.from({ length: 30 }, () => Array(60).fill(0));
  // Floor
  for (let c = 0; c < 15; c++) grid[28][c] = TILE.SOLID;
  // Goal Platform
  for (let c = TILE.CRACKED_BLOCK; c < 60; c++) grid[6][c] = TILE.SOLID;
  // Lava pit
  for (let c = 15; c < 50; c++) grid[29][c] = TILE.FIRE;

  // Ceiling for ropes
  for (let c = 15; c < 50; c += 10) {
    grid[0][c] = TILE.SOLID;
    grid[1][c] = TILE.ROPE; // Rope anchor
  }

  return grid;
}

function createTurretGrid() {
  const grid = Array.from({ length: 30 }, () => Array(50).fill(0));
  // Floor
  for (let c = 0; c < 50; c++) grid[28][c] = TILE.SOLID;
  // Walls
  for (let r = 0; r < 30; r++) { grid[r][0] = TILE.SOLID; grid[r][49] = TILE.SOLID; }
  
  // Turrets firing left
  grid[27][48] = TILE.TURRET;
  grid[24][40] = TILE.TURRET;
  grid[20][45] = TILE.TURRET;
  grid[15][35] = TILE.TURRET;
  grid[10][40] = TILE.TURRET;
  grid[5][48] = TILE.TURRET;

  // Platforms to climb
  grid[25][15] = TILE.SOLID; grid[25][16] = TILE.SOLID; grid[25][17] = TILE.SOLID;
  grid[21][5] = TILE.SOLID; grid[21][6] = TILE.SOLID; grid[21][7] = TILE.SOLID;
  grid[16][15] = TILE.SOLID; grid[16][16] = TILE.SOLID; grid[16][17] = TILE.SOLID;
  grid[11][5] = TILE.SOLID; grid[11][6] = TILE.SOLID; grid[11][7] = TILE.SOLID;
  grid[6][15] = TILE.SOLID; grid[6][16] = TILE.SOLID; grid[6][17] = TILE.SOLID;
  
  // Goal platform
  for (let c = TILE.BOUNCY_MUSHROOM; c <= 45; c++) grid[6][c] = TILE.SOLID;

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
