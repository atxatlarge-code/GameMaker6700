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

const PRESETS = [
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
  }
];

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
