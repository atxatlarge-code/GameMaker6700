import { CONFIG } from './config.js';

export class Level {
  constructor() {
    this.id = 'preset-1';
    this.name = 'Mushroom Forest';
    this.grid = [];
    this.playerSpawn = { col: 5, row: 27 };
    this.goalPos = { col: 52, row: 27 };
    this.portal1 = null;
    this.portal2 = null;
    this._nextPortal = 1;
    this.isPreset = true;
    this.onModify = null;
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
    this.isPreset = levelData.isPreset || false;
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
      isPreset: this.isPreset,
    };
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
    this.grid[27][12] = 1; this.grid[27][13] = 1; this.grid[27][14] = 1;
    this.grid[25][18] = 1; this.grid[25][19] = 1;
    this.grid[23][24] = 1; this.grid[23][25] = 1; this.grid[23][26] = 1;
    this.grid[25][32] = 1; this.grid[25][33] = 1;
    this.grid[27][38] = 1; this.grid[27][39] = 1;
    this.grid[27][9] = 2; this.grid[27][21] = 2; this.grid[27][35] = 2;
    
    // Default portals in Mushroom Forest preset
    this.portal1 = { col: 16, row: 27 };
    this.portal2 = { col: 42, row: 27 };
  }

  getTile(col, row) {
    if (col < 0 || col >= CONFIG.GRID_COLS || row < 0 || row >= CONFIG.GRID_ROWS) {
      return 1;
    }
    return this.grid[row][col];
  }

  setTile(col, row, value) {
    if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
      if (value !== 0) {
        if (this.portal1 && this.portal1.col === col && this.portal1.row === row) this.portal1 = null;
        if (this.portal2 && this.portal2.col === col && this.portal2.row === row) this.portal2 = null;
      }
      if (this.grid[row][col] !== value) {
        this.grid[row][col] = value;
        if (this.onModify) this.onModify();
      }
    }
  }

  setPlayerSpawn(col, row) {
    if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
      this.playerSpawn = { col, row };
      if (this.portal1 && this.portal1.col === col && this.portal1.row === row) this.portal1 = null;
      if (this.portal2 && this.portal2.col === col && this.portal2.row === row) this.portal2 = null;
      this.setTile(col, row, 0);
      if (this.onModify) this.onModify();
    }
  }

  setGoalPos(col, row) {
    if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
      this.goalPos = { col, row };
      if (this.portal1 && this.portal1.col === col && this.portal1.row === row) this.portal1 = null;
      if (this.portal2 && this.portal2.col === col && this.portal2.row === row) this.portal2 = null;
      this.setTile(col, row, 0);
      if (this.onModify) this.onModify();
    }
  }

  setPortal(col, row) {
    if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
      if (this.portal1 && this.portal1.col === col && this.portal1.row === row) return;
      if (this.portal2 && this.portal2.col === col && this.portal2.row === row) return;

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
      this.setTile(col, row, 0);
      if (this.onModify) this.onModify();
    }
  }
}
