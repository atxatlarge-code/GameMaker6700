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

  getBreakableColors() {
    switch (this.theme) {
      case '16bit':
        return {
          primary: '#b85c27',
          light: '#d3733c',
          dark: '#ac5827',
          border: '#7a3f1b',
          detail: '#54280f',
          crack: '#ffffff',
          straw: '#ffd000'
        };
      case 'butterflies':
        return {
          primary: '#ea698b',
          light: '#ff8da1',
          dark: '#c75175',
          border: '#b23a5c',
          detail: '#801c3e',
          crack: '#ffd60a',
          straw: '#ffea75'
        };
      case 'icecream':
        return {
          primary: '#ffb3c6',
          light: '#ffe5ec',
          dark: '#f8ad9d',
          border: '#eb937c',
          detail: '#fcd5c3',
          crack: '#f49097',
          straw: '#ffe58f'
        };
      case 'spooky':
        return {
          primary: '#5c3d91',
          light: '#704da8',
          dark: '#482e78',
          border: '#4e2e80',
          detail: '#351a5e',
          crack: '#00ffcc',
          straw: '#d4fc34'
        };
      default: // default theme (Forest)
        return {
          primary: '#ab7a4e',
          light: '#c69c6d',
          dark: '#8c6239',
          border: '#754b2d',
          detail: '#542e14',
          crack: '#ffffff',
          straw: '#e0ad34'
        };
    }
  }

  renderBreakableBlock(x, y, alpha = 1, col = null, row = null, engine = null) {
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.translate(x, y);

    const colors = this.getBreakableColors();
    const size = CONFIG.TILE_SIZE;

    const c = col !== null ? col : 0;
    const r = row !== null ? row : 0;

    // Check neighbors of type 6 (breakable block)
    const hasLeft = col !== null && engine && engine.getTile(col - 1, row) === 6;
    const hasRight = col !== null && engine && engine.getTile(col + 1, row) === 6;
    const hasTop = row !== null && engine && engine.getTile(col, row - 1) === 6;
    const hasBottom = row !== null && engine && engine.getTile(col, row + 1) === 6;

    // Helper to get a stable, wobbly offset along grid coordinates
    const getWobble = (seed) => {
      const val = Math.sin(seed) * 10000;
      return val - Math.floor(val);
    };

    // Helper to draw a wobbly segment between two points
    const drawWobbleLine = (x1, y1, x2, y2, seed, wobbleAmt = 1.5) => {
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;
      const nx = -dy / len;
      const ny = dx / len;
      const w = (getWobble(seed) - 0.5) * wobbleAmt;
      this.ctx.quadraticCurveTo(mx + nx * w, my + ny * w, x2, y2);
      this.ctx.stroke();
    };

    // Helper to shade individual rounded mud bricks (highlights & shadows)
    const drawBrickShading = (bx, by, bw, bh, seed) => {
      // Highlight on top & left of the brick (rounded look)
      this.ctx.strokeStyle = colors.light;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(bx + 2.5, by + bh - 2.5);
      this.ctx.quadraticCurveTo(bx + 2.5, by + 2.5, bx + bw / 2, by + 2.5);
      this.ctx.quadraticCurveTo(bx + bw - 2.5, by + 2.5, bx + bw - 2.5, by + 2.5);
      this.ctx.stroke();

      // Shadow on bottom & right of the brick
      this.ctx.strokeStyle = colors.detail;
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(bx + bw - 2.5, by + 2.5);
      this.ctx.quadraticCurveTo(bx + bw - 2.5, by + bh - 2.5, bx + bw / 2, by + bh - 2.5);
      this.ctx.quadraticCurveTo(bx + 2.5, by + bh - 2.5, bx + 2.5, by + bh - 2.5);
      this.ctx.stroke();
    };

    // 1. Fill unified base mud block background using the wobbly outline
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);

    // Top edge path
    if (hasTop) {
      this.ctx.lineTo(size, 0);
    } else {
      const w = (getWobble(c * 17 + r * 31) - 0.5) * 5;
      this.ctx.quadraticCurveTo(size / 2, w, size, 0);
    }

    // Right edge path
    if (hasRight) {
      this.ctx.lineTo(size, size);
    } else {
      const w = (getWobble(c * 19 + r * 29) - 0.5) * 5;
      this.ctx.quadraticCurveTo(size + w, size / 2, size, size);
    }

    // Bottom edge path
    if (hasBottom) {
      this.ctx.lineTo(0, size);
    } else {
      const w = (getWobble(c * 23 + r * 37) - 0.5) * 5;
      this.ctx.quadraticCurveTo(size / 2, size + w, 0, size);
    }

    // Left edge path
    if (hasLeft) {
      this.ctx.lineTo(0, 0);
    } else {
      const w = (getWobble(c * 13 + r * 41) - 0.5) * 5;
      this.ctx.quadraticCurveTo(w, size / 2, 0, 0);
    }
    this.ctx.closePath();

    // Create Studio Ghibli-esque warm base linear gradient
    const grad = this.ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, colors.light);
    grad.addColorStop(1, colors.dark);
    this.ctx.fillStyle = grad;
    this.ctx.fill();

    // 2. Draw wobbly mud brick joints (crevices) inside and along active boundaries
    this.ctx.strokeStyle = colors.border;
    this.ctx.lineWidth = 2.2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    // Horizontal staggered joint line across the middle
    drawWobbleLine(0, 20, size, 20, c * 11 + r * 19, 2.5);

    const varIdx = col !== null ? Math.abs(col) % 5 : 0;
    const seed = c * 71 + r * 93;

    if (varIdx === 0) {
      // Variety 0: Top split at 20, Bottom split at 10
      drawWobbleLine(20, 0, 20, 20, seed + 1, 2);
      drawWobbleLine(10, 20, 10, size, seed + 2, 2);

      // Top-Left brick
      drawBrickShading(1.5, 1.5, 17, 17, seed + 3);
      // Top-Right brick
      drawBrickShading(21.5, 1.5, 9, 17, seed + 4);
      // Bottom-Left brick
      drawBrickShading(1.5, 21.5, 7, 9, seed + 5);
      // Bottom-Right brick
      drawBrickShading(11.5, 21.5, 19, 9, seed + 6);
    } else if (varIdx === 1) {
      // Variety 1: Top split at 10, Bottom split at 22
      drawWobbleLine(10, 0, 10, 20, seed + 1, 2);
      drawWobbleLine(22, 20, 22, size, seed + 2, 2);

      // Top-Left brick
      drawBrickShading(1.5, 1.5, 7, 17, seed + 3);
      // Top-Right brick
      drawBrickShading(11.5, 1.5, 19, 17, seed + 4);
      // Bottom-Left brick
      drawBrickShading(1.5, 21.5, 19, 9, seed + 5);
      // Bottom-Right brick
      drawBrickShading(23.5, 21.5, 7, 9, seed + 6);
    } else if (varIdx === 2) {
      // Variety 2: Top split at 24, Bottom split none
      drawWobbleLine(24, 0, 24, 20, seed + 1, 2);

      // Top-Left brick
      drawBrickShading(1.5, 1.5, 21, 17, seed + 3);
      // Top-Right brick
      drawBrickShading(25.5, 1.5, 5, 17, seed + 4);
      // Bottom full brick
      drawBrickShading(1.5, 21.5, size - 3, 9, seed + 5);
    } else if (varIdx === 3) {
      // Variety 3: Top split none, Bottom split at 14
      drawWobbleLine(14, 20, 14, size, seed + 1, 2);

      // Top full brick
      drawBrickShading(1.5, 1.5, size - 3, 17, seed + 3);
      // Bottom-Left brick
      drawBrickShading(1.5, 21.5, 11, 9, seed + 4);
      // Bottom-Right brick
      drawBrickShading(15.5, 21.5, 15, 9, seed + 5);
    } else {
      // Variety 4: Top split at 12, Bottom split at 20
      drawWobbleLine(12, 0, 12, 20, seed + 1, 2);
      drawWobbleLine(20, 20, 20, size, seed + 2, 2);

      // Top-Left brick
      drawBrickShading(1.5, 1.5, 9, 17, seed + 3);
      // Top-Right brick
      drawBrickShading(13.5, 1.5, 17, 17, seed + 4);
      // Bottom-Left brick
      drawBrickShading(1.5, 21.5, 17, 9, seed + 5);
      // Bottom-Right brick
      drawBrickShading(21.5, 21.5, 9, 9, seed + 6);
    }

    // 4. Draw Hand-Drawn Outline Strokes on external exposed edges (non-molded)
    this.ctx.strokeStyle = colors.border;
    this.ctx.lineWidth = 2.5;

    if (!hasTop) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, 0);
      const w = (getWobble(c * 17 + r * 31) - 0.5) * 5;
      this.ctx.quadraticCurveTo(size / 2, w, size, 0);
      this.ctx.stroke();
    }
    if (!hasRight) {
      this.ctx.beginPath();
      this.ctx.moveTo(size, 0);
      const w = (getWobble(c * 19 + r * 29) - 0.5) * 5;
      this.ctx.quadraticCurveTo(size + w, size / 2, size, size);
      this.ctx.stroke();
    }
    if (!hasBottom) {
      this.ctx.beginPath();
      this.ctx.moveTo(size, size);
      const w = (getWobble(c * 23 + r * 37) - 0.5) * 5;
      this.ctx.quadraticCurveTo(size / 2, size + w, 0, size);
      this.ctx.stroke();
    }
    if (!hasLeft) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, size);
      const w = (getWobble(c * 13 + r * 41) - 0.5) * 5;
      this.ctx.quadraticCurveTo(w, size / 2, 0, 0);
      this.ctx.stroke();
    }

    // 5. Draw straw flecks and organic textures (gives the Ghibli mud-brick look)
    this.ctx.strokeStyle = colors.straw;
    this.ctx.lineWidth = 1;
    const strawSeed = c * 3 + r * 7;
    for (let i = 0; i < 4; i++) {
      const fx = 5 + getWobble(strawSeed + i * 2) * (size - 10);
      const fy = 5 + getWobble(strawSeed + i * 3) * (size - 10);
      const fa = getWobble(strawSeed + i * 5) * Math.PI * 2;
      const fl = 3 + getWobble(strawSeed + i * 7) * 4;
      this.ctx.beginPath();
      this.ctx.moveTo(fx, fy);
      this.ctx.lineTo(fx + Math.cos(fa) * fl, fy + Math.sin(fa) * fl);
      this.ctx.stroke();
    }

    // 6. Exposed moss/grass tufts on top (very Studio Ghibli style)
    if (!hasTop) {
      let mossColor = '#689f38'; // forest/grass green
      if (this.theme === 'spooky') mossColor = '#00ffcc';
      else if (this.theme === 'butterflies') mossColor = '#9b2247';
      else if (this.theme === 'icecream') mossColor = '#e07a5f';

      this.ctx.fillStyle = mossColor;
      this.ctx.beginPath();
      // Left blade
      this.ctx.moveTo(size * 0.2, 1);
      this.ctx.quadraticCurveTo(size * 0.22, -3.5, size * 0.25, -2);
      this.ctx.quadraticCurveTo(size * 0.23, -1, size * 0.28, 1);
      // Center blade
      this.ctx.moveTo(size * 0.5, 1);
      this.ctx.quadraticCurveTo(size * 0.48, -4.5, size * 0.45, -2.5);
      this.ctx.quadraticCurveTo(size * 0.52, -1, size * 0.55, 1);
      // Right blade
      this.ctx.moveTo(size * 0.8, 1);
      this.ctx.quadraticCurveTo(size * 0.78, -3.5, size * 0.75, -2);
      this.ctx.quadraticCurveTo(size * 0.82, -1, size * 0.85, 1);
      this.ctx.fill();
    }

    this.ctx.restore();
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

    // Mobile touch support for editing
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.engine && this.engine.mode === CONFIG.MODE_PLAY) return;
      e.preventDefault();
      if (e.touches.length > 0) {
        this.isMouseDown = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
        this.handleInput();
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.engine && this.engine.mode === CONFIG.MODE_PLAY) return;
      e.preventDefault();
      if (e.touches.length > 0) {
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
        this.updateHover();
        if (this.isMouseDown) {
          this.handleInput();
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      this.isMouseDown = false;
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
      case CONFIG.TOOL_BREAKABLE:
        if (this.level.getTile(col, row) !== 6) {
          this.level.setTile(col, row, 6);
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
      case CONFIG.TOOL_COIN:
        if (this.level.getTile(col, row) !== 5) {
          this.level.setTile(col, row, 5);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_ENEMY:
        if (this.level.addEnemy(col, row, CONFIG.ENEMY_SPEED, CONFIG.ENEMY_PATROL_RANGE)) {
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_ERASE:
        if (this.level.removePortal(col, row)) {
          audio.playEraseSound();
        } else if (this.level.removeEnemy(col, row)) {
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
        case CONFIG.TOOL_BREAKABLE:
          this.renderBreakableBlock(x, y, 0.5);
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
        case CONFIG.TOOL_COIN:
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE / 2);
          this.ctx.fillStyle = '#ffd60a';
          this.ctx.strokeStyle = '#d4a359';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, CONFIG.TILE_SIZE * 0.3, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();
          
          this.ctx.fillStyle = '#d4a359';
          this.ctx.font = 'bold 12px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('$', 0, 0);
          this.ctx.restore();
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
        case CONFIG.TOOL_ENEMY: {
          const tileVal = this.level.getTile(this.hoverCol, this.hoverRow);
          const isInvalid = (tileVal === 1 || tileVal === 3 || tileVal === 4 || tileVal === 5 || tileVal === 6) ||
            (this.level.playerSpawn && this.level.playerSpawn.col === this.hoverCol && this.level.playerSpawn.row === this.hoverRow) ||
            (this.level.goalPos && this.level.goalPos.col === this.hoverCol && this.level.goalPos.row === this.hoverRow) ||
            ((this.level.portal1 && this.level.portal1.col === this.hoverCol && this.level.portal1.row === this.hoverRow) ||
             (this.level.portal2 && this.level.portal2.col === this.hoverCol && this.level.portal2.row === this.hoverRow));

          if (isInvalid) {
            // Draw soft red warning square underneath
            this.ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            // Make the ghost sprite more transparent/dimmed
            this.ctx.globalAlpha = 0.25;
          }

          // Ghost soot sprite hover preview
          const cx2 = x + CONFIG.TILE_SIZE / 2;
          const cy2 = y + CONFIG.TILE_SIZE / 2;
          const r2 = CONFIG.TILE_SIZE * 0.36;
          // Bumps
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2 - Math.PI * 0.5;
            this.ctx.fillStyle = 'rgba(30,23,32,0.8)';
            this.ctx.beginPath();
            this.ctx.arc(cx2 + Math.cos(a) * r2 * 0.88, cy2 + Math.sin(a) * r2 * 0.88, r2 * 0.25, 0, Math.PI * 2);
            this.ctx.fill();
          }
          // Body
          this.ctx.fillStyle = 'rgba(30,23,32,0.85)';
          this.ctx.beginPath();
          this.ctx.arc(cx2, cy2, r2, 0, Math.PI * 2);
          this.ctx.fill();
          // Eyes
          this.ctx.fillStyle = 'rgba(245,240,235,0.9)';
          this.ctx.beginPath();
          this.ctx.arc(cx2 - r2 * 0.36, cy2, r2 * 0.32, 0, Math.PI * 2);
          this.ctx.arc(cx2 + r2 * 0.36, cy2, r2 * 0.32, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#0d0a0f';
          this.ctx.beginPath();
          this.ctx.arc(cx2 - r2 * 0.33, cy2 + r2 * 0.04, r2 * 0.18, 0, Math.PI * 2);
          this.ctx.arc(cx2 + r2 * 0.39, cy2 + r2 * 0.04, r2 * 0.18, 0, Math.PI * 2);
          this.ctx.fill();
          break;
        }
        case CONFIG.TOOL_ERASE:
          this.ctx.fillStyle = 'rgba(184, 84, 80, 0.6)';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          break;
      }
      this.ctx.restore();

      // Border highlight around hovered tile
      let isValid = true;
      if (this.currentTool === CONFIG.TOOL_ENEMY) {
        const tileVal = this.level.getTile(this.hoverCol, this.hoverRow);
        const isInvalid = (tileVal === 1 || tileVal === 3 || tileVal === 4 || tileVal === 6) ||
          (this.level.playerSpawn && this.level.playerSpawn.col === this.hoverCol && this.level.playerSpawn.row === this.hoverRow) ||
          (this.level.goalPos && this.level.goalPos.col === this.hoverCol && this.level.goalPos.row === this.hoverRow) ||
          ((this.level.portal1 && this.level.portal1.col === this.hoverCol && this.level.portal1.row === this.hoverRow) ||
           (this.level.portal2 && this.level.portal2.col === this.hoverCol && this.level.portal2.row === this.hoverRow));
        if (isInvalid) isValid = false;
      }
      this.ctx.strokeStyle = isValid ? '#d4a359' : '#ef4444';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
    }
  }
}
