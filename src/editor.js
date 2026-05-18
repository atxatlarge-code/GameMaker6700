import { CONFIG } from './config.js';
import { audio } from './audio.js';

export class Editor {
  constructor(canvas, level, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = level;
    this.assets = assets;
    this.currentTool = CONFIG.TOOL_WALL;
    this.isMouseDown = false;
    this.hoverCol = -1;
    this.hoverRow = -1;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.engine = null;
    this.theme = 'default';

    this.initListeners();
  }

  initEngine(engine) {
    this.engine = engine;
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setTheme(theme) {
    this.theme = theme;
  }

  getGroundColor() {
    switch (this.theme) {
      case '16bit': return '#b85c27';
      case 'butterflies': return '#00f2fe';
      case 'icecream': return '#b8e0d2';
      case 'spooky': return '#686de0';
      default: return '#528c46';
    }
  }

  initListeners() {
    this.canvas.addEventListener('mousedown', (e) => {
      if (this.engine && this.engine.mode === CONFIG.MODE_PLAY) return;
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.handleInput();
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.engine && this.engine.mode === CONFIG.MODE_PLAY) return;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.updateHover();
      if (this.isMouseDown) {
        this.handleInput();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.hoverCol = -1;
      this.hoverRow = -1;
    });
  }

  getGridCoords() {
    if (!this.lastMouseX || !this.lastMouseY) return { col: -1, row: -1 };
    const rect = this.canvas.getBoundingClientRect();
    const x = this.lastMouseX - rect.left;
    const y = this.lastMouseY - rect.top;
    const camX = this.engine ? this.engine.camera.x : 0;
    const camY = this.engine ? this.engine.camera.y : 0;
    const col = Math.floor((x + camX) / CONFIG.TILE_SIZE);
    const row = Math.floor((y + camY) / CONFIG.TILE_SIZE);
    return { col, row };
  }

  updateHover() {
    if (this.engine && this.engine.mode === CONFIG.MODE_PLAY) {
      this.hoverCol = -1;
      this.hoverRow = -1;
      return;
    }
    const { col, row } = this.getGridCoords();
    if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
      this.hoverCol = col;
      this.hoverRow = row;
    } else {
      this.hoverCol = -1;
      this.hoverRow = -1;
    }
  }

  handleInput() {
    if (this.engine && this.engine.mode === CONFIG.MODE_PLAY) return;
    const { col, row } = this.getGridCoords();
    if (col < 0 || col >= CONFIG.GRID_COLS || row < 0 || row >= CONFIG.GRID_ROWS) return;

    switch (this.currentTool) {
      case CONFIG.TOOL_WALL:
        if (this.level.getTile(col, row) !== 1) {
          this.level.setTile(col, row, 1);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_TRAMPOLINE:
        if (this.level.getTile(col, row) !== 2) {
          this.level.setTile(col, row, 2);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_FIRE:
        if (this.level.getTile(col, row) !== 3) {
          this.level.setTile(col, row, 3);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_SPIKES:
        if (this.level.getTile(col, row) !== 4) {
          this.level.setTile(col, row, 4);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_ERASE:
        if (this.level.removePortal(col, row)) {
          audio.playEraseSound();
        } else if (this.level.getTile(col, row) !== 0) {
          this.level.setTile(col, row, 0);
          audio.playEraseSound();
        }
        break;
      case CONFIG.TOOL_PORTAL:
        this.level.setPortal(col, row);
        audio.playTileSound();
        break;
      case CONFIG.TOOL_PLAYER:
        if (this.level.playerSpawn.col !== col || this.level.playerSpawn.row !== row) {
          this.level.setPlayerSpawn(col, row);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_GOAL:
        if (this.level.goalPos.col !== col || this.level.goalPos.row !== row) {
          this.level.setGoalPos(col, row);
          audio.playTileSound();
        }
        break;
    }
  }

  render() {
    // Render Faint Grid Lines across entire world space
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 1;

    const worldWidth = CONFIG.GRID_COLS * CONFIG.TILE_SIZE;
    const worldHeight = CONFIG.GRID_ROWS * CONFIG.TILE_SIZE;

    for (let c = 0; c <= CONFIG.GRID_COLS; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * CONFIG.TILE_SIZE, 0);
      this.ctx.lineTo(c * CONFIG.TILE_SIZE, worldHeight);
      this.ctx.stroke();
    }

    for (let r = 0; r <= CONFIG.GRID_ROWS; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * CONFIG.TILE_SIZE);
      this.ctx.lineTo(worldWidth, r * CONFIG.TILE_SIZE);
      this.ctx.stroke();
    }

    // Render Hover Preview
    if (this.hoverCol !== -1 && this.hoverRow !== -1) {
      const x = this.hoverCol * CONFIG.TILE_SIZE;
      const y = this.hoverRow * CONFIG.TILE_SIZE;

      this.ctx.save();
      this.ctx.globalAlpha = 0.5;

      switch (this.currentTool) {
        case CONFIG.TOOL_WALL:
          if (this.assets.ground && this.theme === 'default') {
            this.ctx.drawImage(this.assets.ground, x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = this.getGroundColor();
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
          break;
        case CONFIG.TOOL_TRAMPOLINE:
          if (this.assets.trampoline) {
            this.ctx.drawImage(this.assets.trampoline, x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = '#cc635e';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
          break;
        case CONFIG.TOOL_FIRE:
          if (this.assets.fire) {
            this.ctx.drawImage(this.assets.fire, x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = '#ff9500';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
          break;
        case CONFIG.TOOL_SPIKES:
          if (this.assets.spikes) {
            this.ctx.drawImage(this.assets.spikes, x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = '#dbe2ef';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
          break;
        case CONFIG.TOOL_PORTAL:
          const cx = x + CONFIG.TILE_SIZE / 2;
          const cy = y + CONFIG.TILE_SIZE / 2;
          this.ctx.fillStyle = (!this.level.portal1 || (this.level.portal1 && this.level.portal2 && this.level._nextPortal === 1)) ? '#06b6d4' : '#ec4899';
          this.ctx.beginPath();
          this.ctx.ellipse(cx, cy, CONFIG.TILE_SIZE * 0.4, CONFIG.TILE_SIZE * 0.45, 0, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        case CONFIG.TOOL_PLAYER:
          if (this.assets.player) {
            this.ctx.drawImage(this.assets.player, x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = '#d4a359';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
          break;
        case CONFIG.TOOL_GOAL:
          if (this.assets.goal) {
            this.ctx.drawImage(this.assets.goal, x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = '#e8b76c';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
          break;
        case CONFIG.TOOL_ERASE:
          this.ctx.fillStyle = 'rgba(184, 84, 80, 0.6)';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          break;
      }
      this.ctx.restore();

      // Border highlight around hovered tile
      this.ctx.strokeStyle = '#d4a359';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
    }
  }
}
