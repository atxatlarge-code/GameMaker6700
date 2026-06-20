import { CONFIG } from './config.js';

export class Level {
  constructor() {
    this.id = 'preset-1';
    this.name = 'Mushroom Forest';
    this.grid = [];
    this.playerSpawn = { col: 5, row: 27, charId: 'ghibli' };
    this.goalPos = { col: 55, row: 19 };
    this.portal1 = null;
    this.portal2 = null;
    this._nextPortal = 1;
    this.enemies = []; // [{ id, col, row, speed, patrolRange, type }]
    this.platforms = []; // [{ id, col, row, distance, axis }]
    this.isPreset = true;
    this.isDark = false;
    this.parallax = { skyY: 0, mountainsY: 0, hillsY: 0 };
    this.onModify = null;
    this.history = [];
    this.initDefaultGrid();
  }

  load(levelData) {
    this.id = levelData.id;
    this.name = levelData.name;
    // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
    this.grid = levelData.grid.map(row => row.slice());
    this.playerSpawn = { charId: 'ghibli', ...levelData.playerSpawn };
    this.goalPos = { ...levelData.goalPos };
    this.portal1 = levelData.portal1 ? { ...levelData.portal1 } : null;
    this.portal2 = levelData.portal2 ? { ...levelData.portal2 } : null;
    this._nextPortal = 1;
    this.enemies = levelData.enemies ? levelData.enemies.map(e => ({ ...e })) : [];
    this.platforms = levelData.platforms ? levelData.platforms.map(p => ({ ...p })) : [];
    this.isPreset = levelData.isPreset || false;
    this.isDark = levelData.isDark || false;
    this.parallax = levelData.parallax ? { ...levelData.parallax } : { skyY: 0, mountainsY: 0, hillsY: 0 };
    this.history = [];
  }

  export() {
    return {
      id: this.id,
      name: this.name,
      // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
      grid: this.grid.map(row => row.slice()),
      playerSpawn: { ...this.playerSpawn },
      goalPos: { ...this.goalPos },
      portal1: this.portal1 ? { ...this.portal1 } : null,
      portal2: this.portal2 ? { ...this.portal2 } : null,
      enemies: this.enemies.map(e => ({ ...e })),
      platforms: this.platforms.map(p => ({ ...p })),
      isPreset: this.isPreset,
      isDark: this.isDark,
      parallax: { ...this.parallax },
    };
  }

  pushHistory() {
    this.history.push({
      // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
      grid: this.grid.map(row => row.slice()),
      playerSpawn: { ...this.playerSpawn },
      goalPos: { ...this.goalPos },
      portal1: this.portal1 ? { ...this.portal1 } : null,
      portal2: this.portal2 ? { ...this.portal2 } : null,
      _nextPortal: this._nextPortal,
      enemies: this.enemies.map(e => ({ ...e })),
      platforms: this.platforms.map(p => ({ ...p })),
      isDark: this.isDark,
      parallax: { ...this.parallax },
    });
    if (this.history.length > 30) {
      this.history.shift();
    }
  }

  undo() {
    if (this.history.length > 0) {
      const state = this.history.pop();
      this.grid = state.grid;
      this.playerSpawn = state.playerSpawn;
      this.goalPos = state.goalPos;
      this.portal1 = state.portal1;
      this.portal2 = state.portal2;
      this._nextPortal = state._nextPortal;
      this.enemies = state.enemies ? state.enemies.map(e => ({ ...e })) : [];
      this.platforms = state.platforms ? state.platforms.map(p => ({ ...p })) : [];
      this.isDark = state.isDark || false;
      this.parallax = state.parallax ? { ...state.parallax } : { skyY: 0, mountainsY: 0, hillsY: 0 };
      if (this.onModify) this.onModify();
      return true;
    }
    return false;
  }

  _removeEnemyInternal(col, row) {
    const idx = this.enemies.findIndex(e => e.col === col && e.row === row);
    if (idx !== -1) {
      this.enemies.splice(idx, 1);
    }
  }

  _removePlatformInternal(col, row) {
    const idx = this.platforms.findIndex(p => p.col === col && p.row === row);
    if (idx !== -1) {
      this.platforms.splice(idx, 1);
    }
  }

  addEnemy(col, row, speed, patrolRange, type = 'patrol') {
    // Only one enemy per tile
    if (this.enemies.some(e => e.col === col && e.row === row)) return false;

    // Check if there is a block (1: Wall, 3: Fire, 4: Spikes, 6: Breakable, 7: Earth)
    const tileVal = this.getTile(col, row);
    if (tileVal === 1 || tileVal === 3 || tileVal === 4 || tileVal === 6 || tileVal === 7) {
      return false;
    }

    // Check if player spawn is at this location
    if (this.playerSpawn && this.playerSpawn.col === col && this.playerSpawn.row === row) {
      return false;
    }

    // Check if goal is at this location
    if (this.goalPos && this.goalPos.col === col && this.goalPos.row === row) {
      return false;
    }

    // Check if portal1 or portal2 is at this location
    if ((this.portal1 && this.portal1.col === col && this.portal1.row === row) ||
        (this.portal2 && this.portal2.col === col && this.portal2.row === row)) {
      return false;
    }

    this.pushHistory();
    this.enemies.push({
      id: `enemy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      col,
      row,
      speed,
      patrolRange,
      type,
    });
    if (this.onModify) this.onModify();
    return true;
  }

  addPlatform(col, row, distance = 4, axis = 'x') {
    if (this.platforms.some(p => p.col === col && p.row === row)) return false;

    this.pushHistory();
    this.platforms.push({
      id: `platform-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      col,
      row,
      distance,
      axis
    });
    if (this.onModify) this.onModify();
    return true;
  }

  removeEnemy(col, row) {
    const idx = this.enemies.findIndex(e => e.col === col && e.row === row);
    if (idx !== -1) {
      this.pushHistory();
      this.enemies.splice(idx, 1);
      if (this.onModify) this.onModify();
      return true;
    }
    return false;
  }

  initDefaultGrid() {
    this.grid = [];
    for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
      const row = [];
      for (let c = 0; c < CONFIG.GRID_COLS; c++) {
        if (r >= CONFIG.GRID_ROWS - 2) {
          row.push(7);
        } else {
          row.push(0);
        }
      }
      this.grid.push(row);
    }
    this.grid[22][50] = 7; this.grid[22][51] = 7;
    this.grid[23][23] = 7; this.grid[23][24] = 7; this.grid[23][25] = 7; this.grid[23][26] = 7; this.grid[23][49] = 7; this.grid[23][50] = 7; this.grid[23][51] = 7;
    this.grid[24][23] = 7; this.grid[24][26] = 7; this.grid[24][48] = 7; this.grid[24][49] = 7; this.grid[24][50] = 7; this.grid[24][51] = 7;
    this.grid[25][14] = 7; this.grid[25][15] = 7; this.grid[25][16] = 7; this.grid[25][17] = 7; this.grid[25][18] = 7; this.grid[25][19] = 7;
    this.grid[25][23] = 7; this.grid[25][26] = 7; this.grid[25][32] = 7; this.grid[25][33] = 7;
    this.grid[25][47] = 7; this.grid[25][48] = 7; this.grid[25][49] = 7; this.grid[25][50] = 7; this.grid[25][51] = 7;
    this.grid[26][14] = 7; this.grid[26][19] = 7; this.grid[26][23] = 7; this.grid[26][26] = 7;
    this.grid[26][32] = 7; this.grid[26][33] = 7; this.grid[26][38] = 7; this.grid[26][39] = 7;
    this.grid[26][46] = 7; this.grid[26][47] = 7; this.grid[26][48] = 7; this.grid[26][49] = 7; this.grid[26][50] = 7; this.grid[26][51] = 7;
    this.grid[27][9] = 2; this.grid[27][12] = 7; this.grid[27][13] = 7; this.grid[27][14] = 7; this.grid[27][19] = 7; this.grid[27][21] = 2;
    this.grid[27][23] = 7; this.grid[27][26] = 7; this.grid[27][32] = 7; this.grid[27][33] = 7; this.grid[27][35] = 2; this.grid[27][38] = 7; this.grid[27][39] = 7;
    this.grid[27][45] = 7; this.grid[27][46] = 7; this.grid[27][47] = 7; this.grid[27][48] = 7; this.grid[27][49] = 7; this.grid[27][50] = 7; this.grid[27][51] = 7;
    
    // Default portals in Mushroom Forest preset
    this.portal1 = { col: 16, row: 27 };
    this.portal2 = { col: 42, row: 27 };
    this.history = [];
  }

  getTile(col, row) {
    if (col < 0 || col >= CONFIG.GRID_COLS || row < 0 || row >= CONFIG.GRID_ROWS) {
      return 1;
    }
    return this.grid[row][col];
  }

  setTile(col, row, value) {
    if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
      if (this.grid[row][col] !== value) {
        this.pushHistory();
        if (value !== 0) {
          if (this.portal1 && this.portal1.col === col && this.portal1.row === row) this.portal1 = null;
          if (this.portal2 && this.portal2.col === col && this.portal2.row === row) this.portal2 = null;
          if (value === 1 || value === 3 || value === 4 || value === 6 || value === 7) {
            this._removeEnemyInternal(col, row);
          }
          this._removePlatformInternal(col, row);
        }
        this.grid[row][col] = value;
        if (this.onModify) this.onModify();
      }
    }
  }

  setPlayerSpawn(col, row, charId = 'ghibli') {
    if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
      if (this.playerSpawn.col !== col || this.playerSpawn.row !== row || this.playerSpawn.charId !== charId) {
        this.pushHistory();
        this.playerSpawn = { col, row, charId };
        if (this.portal1 && this.portal1.col === col && this.portal1.row === row) this.portal1 = null;
        if (this.portal2 && this.portal2.col === col && this.portal2.row === row) this.portal2 = null;
        this._removeEnemyInternal(col, row);
        this.grid[row][col] = 0;
        if (this.onModify) this.onModify();
      }
    }
  }

  setGoalPos(col, row) {
    if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
      if (this.goalPos.col !== col || this.goalPos.row !== row) {
        this.pushHistory();
        this.goalPos = { col, row };
        if (this.portal1 && this.portal1.col === col && this.portal1.row === row) this.portal1 = null;
        if (this.portal2 && this.portal2.col === col && this.portal2.row === row) this.portal2 = null;
        this._removeEnemyInternal(col, row);
        this.grid[row][col] = 0;
        if (this.onModify) this.onModify();
      }
    }
  }

  setPortal(col, row) {
    if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
      if (this.portal1 && this.portal1.col === col && this.portal1.row === row) return;
      if (this.portal2 && this.portal2.col === col && this.portal2.row === row) return;

      this.pushHistory();
      if (!this.portal1) {
        this.portal1 = { col, row };
      } else if (!this.portal2) {
        this.portal2 = { col, row };
      } else {
        if (this._nextPortal === 2) {
          this.portal2 = { col, row };
          this._nextPortal = 1;
        } else {
          this.portal1 = { col, row };
          this._nextPortal = 2;
        }
      }
      this._removeEnemyInternal(col, row);
      this.grid[row][col] = 0;
      if (this.onModify) this.onModify();
    }
  }

  removePortal(col, row) {
    if (this.portal1 && this.portal1.col === col && this.portal1.row === row) {
      this.pushHistory();
      this.portal1 = null;
      if (this.onModify) this.onModify();
      return true;
    }
    if (this.portal2 && this.portal2.col === col && this.portal2.row === row) {
      this.pushHistory();
      this.portal2 = null;
      if (this.onModify) this.onModify();
      return true;
    }
    return false;
  }
}

