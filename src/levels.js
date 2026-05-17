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

// Preset 1: Mushroom Forest (Original default)
function createMushroomForestGrid() {
  const grid = createBlankGrid();
  // Platforms
  grid[27][12] = 1; grid[27][13] = 1; grid[27][14] = 1;
  grid[25][18] = 1; grid[25][19] = 1;
  grid[23][24] = 1; grid[23][25] = 1; grid[23][26] = 1;
  grid[25][32] = 1; grid[25][33] = 1;
  grid[27][38] = 1; grid[27][39] = 1;
  // Mushrooms
  grid[27][9] = 2; grid[27][21] = 2; grid[27][35] = 2;
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

const PRESETS = [
  {
    id: 'preset-1',
    name: 'Mushroom Forest',
    grid: createMushroomForestGrid(),
    playerSpawn: { col: 5, row: 27 },
    goalPos: { col: 52, row: 27 },
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
      grid: JSON.parse(JSON.stringify(source.grid)),
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
