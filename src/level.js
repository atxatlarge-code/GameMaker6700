import { CONFIG } from './config.js';

export class Level {
  constructor() {
    this.id = 'preset-1';
    this.name = 'Mushroom Forest';
    this.grid = [];
    this.playerSpawn = { col: 5, row: 27 };
    this.goalPos = { col: 55, row: 19 };
    this.portal1 = null;
    this.portal2 = null;
    this._nextPortal = 1;
    this.enemies = []; // [{ id, col, row, speed, patrolRange }]
    this.isPreset = true;
    this.onModify = null;
    this.history = [];
    this.initDefaultGrid();
  }

  load(levelData) {
    this.id = levelData.id;
    this.name = levelData.name;
    this.grid = JSON.parse(JSON.stringify(levelData.grid));
    this.playerSpawn = { ...levelData.playerSpawn };
    this.goalPos = { ...levelData.goalPos };
    this.portal1 = levelData.portal1 ? { ...levelData.portal1 } : null;
    this.portal2 = levelData.portal2 ? { ...levelData.portal2 } : null;
    this._nextPortal = 1;
    this.enemies = levelData.enemies ? levelData.enemies.map(e => ({ ...e })) : [];
    this.isPreset = levelData.isPreset || false;
    this.history = [];
  }

  export() {
    return {
      id: this.id,
      name: this.name,
      grid: JSON.parse(JSON.stringify(this.grid)),
      playerSpawn: { ...this.playerSpawn },
      goalPos: { ...this.goalPos },
      portal1: this.portal1 ? { ...this.portal1 } : null,
      portal2: this.portal2 ? { ...this.portal2 } : null,
      enemies: this.enemies.map(e => ({ ...e })),
      isPreset: this.isPreset,
    };
  }

  pushHistory() {
    this.history.push({
      grid: JSON.parse(JSON.stringify(this.grid)),
      playerSpawn: { ...this.playerSpawn },
      goalPos: { ...this.goalPos },
      portal1: this.portal1 ? { ...this.portal1 } : null,
      portal2: this.portal2 ? { ...this.portal2 } : null,
      _nextPortal: this._nextPortal,
      enemies: this.enemies.map(e => ({ ...e })),
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

  addEnemy(col, row, speed, patrolRange) {
    // Only one enemy per tile
    if (this.enemies.some(e => e.col === col && e.row === row)) return false;

    // Check if there is a block (1: Wall, 3: Fire, 4: Spikes)
    const tileVal = this.getTile(col, row);
    if (tileVal === 1 || tileVal === 3 || tileVal === 4) {
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
          row.push(1);
        } else {
          row.push(0);
        }
      }
      this.grid.push(row);
    }
    this.grid[22][50] = 1; this.grid[22][51] = 1;
    this.grid[23][23] = 1; this.grid[23][24] = 1; this.grid[23][25] = 1; this.grid[23][26] = 1; this.grid[23][49] = 1; this.grid[23][50] = 1; this.grid[23][51] = 1;
    this.grid[24][23] = 1; this.grid[24][26] = 1; this.grid[24][48] = 1; this.grid[24][49] = 1; this.grid[24][50] = 1; this.grid[24][51] = 1;
    this.grid[25][14] = 1; this.grid[25][15] = 1; this.grid[25][16] = 1; this.grid[25][17] = 1; this.grid[25][18] = 1; this.grid[25][19] = 1;
    this.grid[25][23] = 1; this.grid[25][26] = 1; this.grid[25][32] = 1; this.grid[25][33] = 1;
    this.grid[25][47] = 1; this.grid[25][48] = 1; this.grid[25][49] = 1; this.grid[25][50] = 1; this.grid[25][51] = 1;
    this.grid[26][14] = 1; this.grid[26][19] = 1; this.grid[26][23] = 1; this.grid[26][26] = 1;
    this.grid[26][32] = 1; this.grid[26][33] = 1; this.grid[26][38] = 1; this.grid[26][39] = 1;
    this.grid[26][46] = 1; this.grid[26][47] = 1; this.grid[26][48] = 1; this.grid[26][49] = 1; this.grid[26][50] = 1; this.grid[26][51] = 1;
    this.grid[27][9] = 2; this.grid[27][12] = 1; this.grid[27][13] = 1; this.grid[27][14] = 1; this.grid[27][19] = 1; this.grid[27][21] = 2;
    this.grid[27][23] = 1; this.grid[27][26] = 1; this.grid[27][32] = 1; this.grid[27][33] = 1; this.grid[27][35] = 2; this.grid[27][38] = 1; this.grid[27][39] = 1;
    this.grid[27][45] = 1; this.grid[27][46] = 1; this.grid[27][47] = 1; this.grid[27][48] = 1; this.grid[27][49] = 1; this.grid[27][50] = 1; this.grid[27][51] = 1;
    
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
          if (value === 1 || value === 3 || value === 4) {
            this._removeEnemyInternal(col, row);
          }
        }
        this.grid[row][col] = value;
        if (this.onModify) this.onModify();
      }
    }
  }

  setPlayerSpawn(col, row) {
    if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
      if (this.playerSpawn.col !== col || this.playerSpawn.row !== row) {
        this.pushHistory();
        this.playerSpawn = { col, row };
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

