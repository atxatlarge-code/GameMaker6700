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

  renderEarthBlock(x, y, alpha = 1, col = null, row = null, engine = null) {
    if (!this.earthCache) this.earthCache = new Map();

    const c = col !== null ? col : 0;
    const r = row !== null ? row : 0;
    const theme = engine ? engine.theme : this.theme;

    const isSolid = (colNum, rowNum) => {
      if (engine) {
        const t = engine.getTile(colNum, rowNum);
        return t === 1 || t === 6 || t === 7;
      }
      return false;
    };

    const hasLeft = col !== null && isSolid(c - 1, r);
    const hasRight = col !== null && isSolid(c + 1, r);
    const hasTop = row !== null && isSolid(c, r - 1);
    const hasBottom = row !== null && isSolid(c, r + 1);

    const cacheKey = `${c}_${r}_${theme}_${hasLeft ? 1 : 0}${hasRight ? 1 : 0}${hasTop ? 1 : 0}${hasBottom ? 1 : 0}`;

    let cachedCanvas = this.earthCache.get(cacheKey);

    if (!cachedCanvas) {
      cachedCanvas = document.createElement('canvas');
      const pad = 12;
      cachedCanvas.width = CONFIG.TILE_SIZE + pad * 2;
      cachedCanvas.height = CONFIG.TILE_SIZE + pad * 2;
      const offCtx = cachedCanvas.getContext('2d');
      offCtx.translate(pad, pad);

      const colors = this.getBreakableColors();
      const size = CONFIG.TILE_SIZE;

      const getWobble = (seed) => {
        const val = Math.sin(seed) * 10000;
        return val - Math.floor(val);
      };

      offCtx.beginPath();
      offCtx.moveTo(0, 0);

      if (hasTop) {
        offCtx.lineTo(size, 0);
      } else {
        const w = (getWobble(c * 17 + r * 31) - 0.5) * 5;
        offCtx.quadraticCurveTo(size / 2, w, size, 0);
      }

      if (hasRight) {
        offCtx.lineTo(size, size);
      } else {
        const w = (getWobble(c * 19 + r * 29) - 0.5) * 5;
        offCtx.quadraticCurveTo(size + w, size / 2, size, size);
      }

      if (hasBottom) {
        offCtx.lineTo(0, size);
      } else {
        const w = (getWobble(c * 23 + r * 37) - 0.5) * 5;
        offCtx.quadraticCurveTo(size / 2, size + w, 0, size);
      }

      if (hasLeft) {
        offCtx.lineTo(0, 0);
      } else {
        const w = (getWobble(c * 13 + r * 41) - 0.5) * 5;
        offCtx.quadraticCurveTo(w, size / 2, 0, 0);
      }
      offCtx.closePath();

      const grad = offCtx.createLinearGradient(0, 0, 0, size);
      grad.addColorStop(0, colors.primary);
      grad.addColorStop(1, colors.dark);
      offCtx.fillStyle = grad;
      offCtx.fill();

      const seed = c * 71 + r * 93;
      let rngVal = seed + 42;
      const nextRandom = () => {
        rngVal = Math.sin(rngVal) * 10000;
        return rngVal - Math.floor(rngVal);
      };

      const hasStrata1 = nextRandom() > 0.15;
      const hasStrata2 = nextRandom() > 0.25;

      offCtx.strokeStyle = colors.border;
      offCtx.lineWidth = 1.8;

      if (hasStrata1) {
        const y1 = size * (0.28 + nextRandom() * 0.14);
        offCtx.beginPath();
        offCtx.moveTo(0, y1 + (getWobble(seed) - 0.5) * 4);
        for (let lx = 0; lx <= size; lx += 8) {
          const wy = y1 + (getWobble(seed + lx) - 0.5) * 3;
          offCtx.lineTo(lx, wy);
        }
        offCtx.stroke();
      }

      if (hasStrata2) {
        const y2 = size * (0.62 + nextRandom() * 0.16);
        offCtx.beginPath();
        offCtx.moveTo(0, y2 + (getWobble(seed + 10) - 0.5) * 4);
        for (let lx = 0; lx <= size; lx += 8) {
          const wy = y2 + (getWobble(seed + 10 + lx) - 0.5) * 3;
          offCtx.lineTo(lx, wy);
        }
        offCtx.stroke();
      }

      const numDetails = Math.floor(nextRandom() * 4);
      for (let i = 0; i < numDetails; i++) {
        const minX = hasLeft ? 2 : 6;
        const maxX = hasRight ? size - 2 : size - 6;
        const minY = hasTop ? 2 : 12;
        const maxY = hasBottom ? size - 2 : size - 8;

        if (maxX <= minX || maxY <= minY) continue;

        const px = minX + nextRandom() * (maxX - minX);
        const py = minY + nextRandom() * (maxY - minY);
        const detailType = Math.floor(nextRandom() * 3);

        offCtx.fillStyle = colors.detail;
        offCtx.strokeStyle = colors.detail;

        if (detailType === 0) {
          const pr = 1.2 + nextRandom() * 2.2;
          offCtx.beginPath();
          offCtx.arc(px, py, pr, 0, Math.PI * 2);
          offCtx.fill();

          if (pr > 1.8) {
            offCtx.fillStyle = colors.light;
            offCtx.beginPath();
            offCtx.arc(px - pr * 0.3, py - pr * 0.3, pr * 0.3, 0, Math.PI * 2);
            offCtx.fill();
          }
        } else if (detailType === 1) {
          const length = 3 + nextRandom() * 5;
          const angle = (nextRandom() - 0.5) * 0.4;
          offCtx.lineWidth = 1.0 + nextRandom() * 0.8;
          offCtx.beginPath();
          offCtx.moveTo(px - length / 2, py - (length / 2) * Math.sin(angle));
          offCtx.lineTo(px + length / 2, py + (length / 2) * Math.sin(angle));
          offCtx.stroke();
        } else {
          const numDots = 2 + Math.floor(nextRandom() * 2);
          for (let d = 0; d < numDots; d++) {
            const dx = px + (nextRandom() - 0.5) * 5;
            const dy = py + (nextRandom() - 0.5) * 5;
            if (dx >= minX && dx <= maxX && dy >= minY && dy <= maxY) {
              offCtx.beginPath();
              offCtx.arc(dx, dy, 0.8 + nextRandom() * 0.8, 0, Math.PI * 2);
              offCtx.fill();
            }
          }
        }
      }

      let mossColor = '#689f38';
      if (theme === 'spooky') mossColor = '#00ffcc';
      else if (theme === 'butterflies') mossColor = '#9b2247';
      else if (theme === 'icecream') mossColor = '#e07a5f';
      else if (theme === '16bit') mossColor = '#829c36';

      if (!hasTop) {
        offCtx.beginPath();
        offCtx.moveTo(0, 0);
        offCtx.lineTo(size, 0);
        for (let gx = size; gx >= 0; gx -= 5) {
          const wobble = 6 + Math.sin(gx * 0.35 + seed) * 3.5;
          offCtx.lineTo(gx, wobble);
        }
        offCtx.closePath();
        offCtx.fillStyle = mossColor;
        offCtx.fill();

        offCtx.fillStyle = mossColor;
        offCtx.beginPath();
        offCtx.moveTo(size * 0.22, 1);
        offCtx.quadraticCurveTo(size * 0.24, -3.5, size * 0.27, -2);
        offCtx.quadraticCurveTo(size * 0.25, -1, size * 0.3, 1);
        offCtx.moveTo(size * 0.5, 1);
        offCtx.quadraticCurveTo(size * 0.48, -4.5, size * 0.45, -2.5);
        offCtx.quadraticCurveTo(size * 0.52, -1, size * 0.55, 1);
        offCtx.moveTo(size * 0.78, 1);
        offCtx.quadraticCurveTo(size * 0.76, -3.5, size * 0.73, -2);
        offCtx.quadraticCurveTo(size * 0.8, -1, size * 0.83, 1);
        offCtx.fill();
      }

      if (!hasLeft) {
        offCtx.beginPath();
        offCtx.moveTo(0, 0);
        for (let gy = 0; gy <= size; gy += 5) {
          const wobble = 6 + Math.sin(gy * 0.35 + seed + 1.5) * 3.5;
          offCtx.lineTo(wobble, gy);
        }
        offCtx.lineTo(0, size);
        offCtx.closePath();
        offCtx.fillStyle = mossColor;
        offCtx.fill();
      }

      if (!hasRight) {
        offCtx.beginPath();
        offCtx.moveTo(size, 0);
        for (let gy = 0; gy <= size; gy += 5) {
          const wobble = size - (6 + Math.sin(gy * 0.35 + seed + 3) * 3.5);
          offCtx.lineTo(wobble, gy);
        }
        offCtx.lineTo(size, size);
        offCtx.closePath();
        offCtx.fillStyle = mossColor;
        offCtx.fill();
      }

      offCtx.strokeStyle = colors.border;
      offCtx.lineWidth = 2.5;

      if (!hasTop) {
        offCtx.beginPath();
        offCtx.moveTo(0, 0);
        const w = (getWobble(c * 17 + r * 31) - 0.5) * 5;
        offCtx.quadraticCurveTo(size / 2, w, size, 0);
        offCtx.stroke();
      }
      if (!hasRight) {
        offCtx.beginPath();
        offCtx.moveTo(size, 0);
        const w = (getWobble(c * 19 + r * 29) - 0.5) * 5;
        offCtx.quadraticCurveTo(size + w, size / 2, size, size);
        offCtx.stroke();
      }
      if (!hasBottom) {
        offCtx.beginPath();
        offCtx.moveTo(size, size);
        const w = (getWobble(c * 23 + r * 37) - 0.5) * 5;
        offCtx.quadraticCurveTo(size / 2, size + w, 0, size);
        offCtx.stroke();
      }
      if (!hasLeft) {
        offCtx.beginPath();
        offCtx.moveTo(0, size);
        const w = (getWobble(c * 13 + r * 41) - 0.5) * 5;
        offCtx.quadraticCurveTo(w, size / 2, 0, 0);
        offCtx.stroke();
      }

      this.earthCache.set(cacheKey, cachedCanvas);
    }

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    this.ctx.drawImage(cachedCanvas, x - 12, y - 12);
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
      case CONFIG.TOOL_EARTH:
        if (this.level.getTile(col, row) !== 7) {
          this.level.setTile(col, row, 7);
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
      case CONFIG.TOOL_LOCK:
        if (this.level.getTile(col, row) !== 8) {
          this.level.setTile(col, row, 8);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_MOVEABLE:
        if (this.level.getTile(col, row) !== 10) {
          this.level.setTile(col, row, 10);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_KEY:
        if (this.level.getTile(col, row) !== 9) {
          this.level.setTile(col, row, 9);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_SWITCH:
        if (this.level.getTile(col, row) !== 11) {
          this.level.setTile(col, row, 11);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_BLOCK_RED:
        if (this.level.getTile(col, row) !== 12) {
          this.level.setTile(col, row, 12);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_BLOCK_BLUE:
        if (this.level.getTile(col, row) !== 13) {
          this.level.setTile(col, row, 13);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_BLOCK_GHOST:
        if (this.level.getTile(col, row) !== 15) {
          this.level.setTile(col, row, 15);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_SPRING_BOOTS:
        if (this.level.getTile(col, row) !== 16) {
          this.level.setTile(col, row, 16);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_DOUBLE_JUMP:
        if (this.level.getTile(col, row) !== 24) {
          this.level.setTile(col, row, 24);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_BLOCK_ICE:
        if (this.level.getTile(col, row) !== 17) {
          this.level.setTile(col, row, 17);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_PORTAL_GRAVITY:
        if (this.level.getTile(col, row) !== 18) {
          this.level.setTile(col, row, 18);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_CONVEYOR_LEFT:
        if (this.level.getTile(col, row) !== 19) {
          this.level.setTile(col, row, 19);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_CONVEYOR_RIGHT:
        if (this.level.getTile(col, row) !== 20) {
          this.level.setTile(col, row, 20);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_TRIPWIRE:
        if (this.level.getTile(col, row) !== 21) {
          this.level.setTile(col, row, 21);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_CHECKPOINT:
        if (this.level.getTile(col, row) !== 25) {
          this.level.setTile(col, row, 25);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_FAKE_WALL:
        if (this.level.getTile(col, row) !== 26) {
          this.level.setTile(col, row, 26);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_SPEED_BOOST:
        if (this.level.getTile(col, row) !== 27) {
          this.level.setTile(col, row, 27);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_BLOCK_CRUMBLE:
        if (this.level.getTile(col, row) !== 22) {
          this.level.setTile(col, row, 22);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_MOVING_PLATFORM:
        if (this.level.addPlatform(col, row)) {
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_ENEMY:
        if (this.level.addEnemy(col, row, CONFIG.ENEMY_SPEED, CONFIG.ENEMY_PATROL_RANGE)) {
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_LAZER:
        if (this.level.addEnemy(col, row, 0, 0, 'lazer')) {
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
      case CONFIG.TOOL_PORTAL_SIZE:
        if (this.level.getTile(col, row) !== 14) {
          this.level.setTile(col, row, 14);
          audio.playTileSound();
        }
        break;
      case CONFIG.TOOL_PLAYER_CLASSIC:
        if (this.level.getTile(col, row) === 0 && !this.level.enemies.some(e => e.col === col && e.row === row) && (!this.level.portal1 || this.level.portal1.col !== col || this.level.portal1.row !== row) && (!this.level.portal2 || this.level.portal2.col !== col || this.level.portal2.row !== row)) {
          if (this.level.playerSpawn.col !== col || this.level.playerSpawn.row !== row || this.level.playerSpawn.charId !== 'classic') {
            this.level.setPlayerSpawn(col, row, 'classic');
            audio.playTileSound();
          }
        }
        break;
      case CONFIG.TOOL_PLAYER_GHIBLI:
        if (this.level.getTile(col, row) === 0 && !this.level.enemies.some(e => e.col === col && e.row === row) && (!this.level.portal1 || this.level.portal1.col !== col || this.level.portal1.row !== row) && (!this.level.portal2 || this.level.portal2.col !== col || this.level.portal2.row !== row)) {
          if (this.level.playerSpawn.col !== col || this.level.playerSpawn.row !== row || this.level.playerSpawn.charId !== 'ghibli') {
            this.level.setPlayerSpawn(col, row, 'ghibli');
            audio.playTileSound();
          }
        }
        break;
      case CONFIG.TOOL_PLAYER_BALL:
        if (this.level.getTile(col, row) === 0 && !this.level.enemies.some(e => e.col === col && e.row === row) && (!this.level.portal1 || this.level.portal1.col !== col || this.level.portal1.row !== row) && (!this.level.portal2 || this.level.portal2.col !== col || this.level.portal2.row !== row)) {
          if (this.level.playerSpawn.col !== col || this.level.playerSpawn.row !== row || this.level.playerSpawn.charId !== 'ball') {
            this.level.setPlayerSpawn(col, row, 'ball');
            audio.playTileSound();
          }
        }
        break;
      case CONFIG.TOOL_PLAYER_TOPDOWN:
        if (this.level.getTile(col, row) === 0 && !this.level.enemies.some(e => e.col === col && e.row === row) && (!this.level.portal1 || this.level.portal1.col !== col || this.level.portal1.row !== row) && (!this.level.portal2 || this.level.portal2.col !== col || this.level.portal2.row !== row)) {
          if (this.level.playerSpawn.col !== col || this.level.playerSpawn.row !== row || this.level.playerSpawn.charId !== 'topdown') {
            this.level.setPlayerSpawn(col, row, 'topdown');
            audio.playTileSound();
          }
        }
        break;
      case CONFIG.TOOL_PLAYER_PADDLE_H:
        if (this.level.getTile(col, row) === 0 && !this.level.enemies.some(e => e.col === col && e.row === row) && (!this.level.portal1 || this.level.portal1.col !== col || this.level.portal1.row !== row) && (!this.level.portal2 || this.level.portal2.col !== col || this.level.portal2.row !== row)) {
          if (this.level.playerSpawn.col !== col || this.level.playerSpawn.row !== row || this.level.playerSpawn.charId !== 'paddle_h') {
            this.level.setPlayerSpawn(col, row, 'paddle_h');
            audio.playTileSound();
          }
        }
        break;
      case CONFIG.TOOL_PLAYER_PADDLE_V:
        if (this.level.getTile(col, row) === 0 && !this.level.enemies.some(e => e.col === col && e.row === row) && (!this.level.portal1 || this.level.portal1.col !== col || this.level.portal1.row !== row) && (!this.level.portal2 || this.level.portal2.col !== col || this.level.portal2.row !== row)) {
          if (this.level.playerSpawn.col !== col || this.level.playerSpawn.row !== row || this.level.playerSpawn.charId !== 'paddle_v') {
            this.level.setPlayerSpawn(col, row, 'paddle_v');
            audio.playTileSound();
          }
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
        case CONFIG.TOOL_EARTH:
          this.renderEarthBlock(x, y, 0.5);
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
        case CONFIG.TOOL_LOCK:
          this.ctx.fillStyle = '#9e9e9e';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#616161';
          this.ctx.font = 'bold 20px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('L', x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          break;
        case CONFIG.TOOL_MOVEABLE:
          this.ctx.fillStyle = '#a87a51';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          // Draw a small inner box
          this.ctx.fillStyle = '#8a6039';
          this.ctx.fillRect(x + 4, y + 4, CONFIG.TILE_SIZE - 8, CONFIG.TILE_SIZE - 8);
          // And a cross
          this.ctx.fillStyle = '#5c3a21';
          this.ctx.fillRect(x + 18, y + 4, 4, CONFIG.TILE_SIZE - 8);
          this.ctx.fillRect(x + 4, y + 18, CONFIG.TILE_SIZE - 8, 4);
          break;
        case CONFIG.TOOL_SWITCH:
          this.ctx.fillStyle = '#f44336'; // Default red switch
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 20px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('R', x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          break;
        case CONFIG.TOOL_BLOCK_RED:
          this.ctx.fillStyle = '#f44336';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          break;
        case CONFIG.TOOL_BLOCK_BLUE:
          this.ctx.strokeStyle = '#2196f3';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x+2, y+2, CONFIG.TILE_SIZE-4, CONFIG.TILE_SIZE-4);
          break;
        case CONFIG.TOOL_BLOCK_GHOST:
          this.ctx.globalAlpha = 0.5;
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 2;
          this.ctx.setLineDash([4, 4]);
          this.ctx.strokeRect(x+2, y+2, CONFIG.TILE_SIZE-4, CONFIG.TILE_SIZE-4);
          this.ctx.setLineDash([]);
          this.ctx.globalAlpha = 1.0;
          break;
        case CONFIG.TOOL_SPRING_BOOTS:
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          this.ctx.fillStyle = '#4ade80';
          this.ctx.beginPath();
          this.ctx.moveTo(-5, 5);
          this.ctx.lineTo(5, 5);
          this.ctx.lineTo(8, -10);
          this.ctx.lineTo(0, -15);
          this.ctx.lineTo(-8, -10);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.strokeStyle = '#22c55e';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          // Spring
          this.ctx.beginPath();
          this.ctx.moveTo(-5, 5);
          this.ctx.lineTo(-5, 9);
          this.ctx.lineTo(5, 7);
          this.ctx.lineTo(-5, 11);
          this.ctx.lineTo(-5, 11);
          this.ctx.lineTo(5, 13);
          this.ctx.strokeStyle = '#a3a3a3';
          this.ctx.stroke();
          this.ctx.restore();
          break;
        case CONFIG.TOOL_DOUBLE_JUMP:
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          this.ctx.fillStyle = '#0ea5e9'; // Light Blue
          this.ctx.beginPath();
          this.ctx.arc(-8, -2, 6, 0, Math.PI * 2);
          this.ctx.arc(8, -2, 6, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#38bdf8';
          this.ctx.beginPath();
          this.ctx.moveTo(0, 10);
          this.ctx.lineTo(-12, -4);
          this.ctx.lineTo(-4, -4);
          this.ctx.lineTo(0, 4);
          this.ctx.lineTo(4, -4);
          this.ctx.lineTo(12, -4);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.restore();
          break;
        case CONFIG.TOOL_SPEED_BOOST:
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          this.ctx.fillStyle = '#f59e0b'; // Amber
          this.ctx.beginPath();
          this.ctx.moveTo(-10, 5);
          this.ctx.lineTo(5, 5);
          this.ctx.lineTo(-2, -5);
          this.ctx.lineTo(12, -5);
          this.ctx.lineTo(-5, -15);
          this.ctx.lineTo(2, -5);
          this.ctx.lineTo(-12, -5);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.restore();
          break;
        case CONFIG.TOOL_BLOCK_ICE:
          this.ctx.fillStyle = '#a5f3fc';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#cffafe';
          this.ctx.fillRect(x + 2, y + 2, CONFIG.TILE_SIZE - 4, 4);
          this.ctx.fillRect(x + 2, y + 6, 4, CONFIG.TILE_SIZE - 8);
          break;
        case CONFIG.TOOL_PORTAL_GRAVITY:
          const cxG = x + CONFIG.TILE_SIZE / 2;
          const cyG = y + CONFIG.TILE_SIZE / 2;
          this.ctx.fillStyle = 'rgba(139, 92, 246, 0.4)';
          this.ctx.beginPath();
          this.ctx.arc(cxG, cyG, CONFIG.TILE_SIZE * 0.4, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#c084fc';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(cxG, cyG, CONFIG.TILE_SIZE * 0.45, 0, Math.PI * 2);
          this.ctx.stroke();
          // Upward arrow
          this.ctx.fillStyle = '#c084fc';
          this.ctx.beginPath();
          this.ctx.moveTo(cxG, cyG - 10);
          this.ctx.lineTo(cxG - 6, cyG + 2);
          this.ctx.lineTo(cxG - 2, cyG + 2);
          this.ctx.lineTo(cxG - 2, cyG + 10);
          this.ctx.lineTo(cxG + 2, cyG + 10);
          this.ctx.lineTo(cxG + 2, cyG + 2);
          this.ctx.lineTo(cxG + 6, cyG + 2);
          this.ctx.closePath();
          this.ctx.fill();
          break;
        case CONFIG.TOOL_CONVEYOR_LEFT:
        case CONFIG.TOOL_CONVEYOR_RIGHT:
          this.ctx.fillStyle = '#64748b';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#94a3b8';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, 6);
          this.ctx.fillStyle = '#f8fafc';
          this.ctx.beginPath();
          if (this.currentTool === CONFIG.TOOL_CONVEYOR_LEFT) {
            this.ctx.moveTo(x + 25, y + 15);
            this.ctx.lineTo(x + 15, y + 20);
            this.ctx.lineTo(x + 25, y + 25);
          } else {
            this.ctx.moveTo(x + 15, y + 15);
            this.ctx.lineTo(x + 25, y + 20);
            this.ctx.lineTo(x + 15, y + 25);
          }
          this.ctx.fill();
          break;
        case CONFIG.TOOL_TRIPWIRE:
          this.ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.strokeStyle = '#ef4444';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(x, y + CONFIG.TILE_SIZE / 2);
          this.ctx.lineTo(x + CONFIG.TILE_SIZE, y + CONFIG.TILE_SIZE / 2);
          this.ctx.stroke();
          break;
        case CONFIG.TOOL_BLOCK_CRUMBLE:
          this.ctx.fillStyle = '#b45309';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.strokeStyle = '#78350f';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(x + 5, y);
          this.ctx.lineTo(x + 15, y + 15);
          this.ctx.lineTo(x + 10, y + 25);
          this.ctx.moveTo(x + 30, y + 10);
          this.ctx.lineTo(x + 20, y + 20);
          this.ctx.lineTo(x + 25, y + 40);
          this.ctx.stroke();
          break;
        case CONFIG.TOOL_MOVING_PLATFORM:
          this.ctx.fillStyle = '#f59e0b';
          this.ctx.fillRect(x, y + 10, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE / 2);
          this.ctx.fillStyle = '#d97706';
          this.ctx.fillRect(x, y + 10 + CONFIG.TILE_SIZE / 2, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE / 4);
          this.ctx.fillStyle = '#fef3c7';
          this.ctx.beginPath();
          this.ctx.moveTo(x + 5, y + 20);
          this.ctx.lineTo(x + 15, y + 20);
          this.ctx.moveTo(x + 25, y + 20);
          this.ctx.lineTo(x + 35, y + 20);
          this.ctx.stroke();
          break;
        case CONFIG.TOOL_KEY:
          this.ctx.fillStyle = '#ffeb3b';
          this.ctx.fillRect(x + 10, y + 15, 20, 10);
          this.ctx.fillStyle = '#c8b900';
          this.ctx.font = 'bold 20px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('K', x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
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
        case CONFIG.TOOL_PORTAL_SIZE:
          const cxS = x + CONFIG.TILE_SIZE / 2;
          const cyS = y + CONFIG.TILE_SIZE / 2;
          this.ctx.fillStyle = '#8bc34a';
          this.ctx.beginPath();
          this.ctx.ellipse(cxS, cyS, CONFIG.TILE_SIZE * 0.4, CONFIG.TILE_SIZE * 0.45, 0, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#cddc39';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.arc(cxS, cyS, CONFIG.TILE_SIZE * 0.2, 0, Math.PI * 1.5);
          this.ctx.stroke();
          break;
        case CONFIG.TOOL_PLAYER_CLASSIC:
        case CONFIG.TOOL_PLAYER_GHIBLI:
        case CONFIG.TOOL_PLAYER_BALL:
        case CONFIG.TOOL_PLAYER_TOPDOWN:
        case CONFIG.TOOL_PLAYER_PADDLE_H:
        case CONFIG.TOOL_PLAYER_PADDLE_V: {
          const tileVal = this.level.getTile(this.hoverCol, this.hoverRow);
          const isInvalid = tileVal !== 0 ||
            this.level.enemies.some(e => e.col === this.hoverCol && e.row === this.hoverRow) ||
            (this.level.portal1 && this.level.portal1.col === this.hoverCol && this.level.portal1.row === this.hoverRow) ||
            (this.level.portal2 && this.level.portal2.col === this.hoverCol && this.level.portal2.row === this.hoverRow);
            
          if (isInvalid) {
            this.ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            this.ctx.globalAlpha = 0.25;
          }

          if (this.currentTool === CONFIG.TOOL_PLAYER_CLASSIC) {
            if (this.engine) {
              const width = 28;
              const height = 28;
              const px = x + (CONFIG.TILE_SIZE - width) / 2;
              const py = y + (CONFIG.TILE_SIZE - height);
              this.engine.drawClassicBox(
                this.ctx,
                px,
                py,
                width,
                height,
                'right',
                1,
                1,
                0,
                isInvalid ? 0.25 : 0.55
              );
            } else {
              this.ctx.fillStyle = '#3498db';
              this.ctx.globalAlpha = isInvalid ? 0.25 : 0.55;
              this.ctx.fillRect(x + (CONFIG.TILE_SIZE - 28) / 2, y + (CONFIG.TILE_SIZE - 28), 28, 28);
            }
          } else if (this.currentTool === CONFIG.TOOL_PLAYER_GHIBLI) {
            if (this.engine) {
              const width = this.engine.player ? this.engine.player.width : 32;
              const height = this.engine.player ? this.engine.player.height : 38;
              const px = x + (CONFIG.TILE_SIZE - width) / 2;
              const py = y + (CONFIG.TILE_SIZE - height);
              this.engine.drawForestKid(
                this.ctx,
                px,
                py,
                width,
                height,
                'right',
                1,
                1,
                0,
                isInvalid ? 0.25 : 0.55
              );
            }
          } else if (this.currentTool === CONFIG.TOOL_PLAYER_BALL) {
            this.ctx.beginPath();
            const r = 12;
            const px = x + CONFIG.TILE_SIZE / 2;
            const py = y + CONFIG.TILE_SIZE - r;
            this.ctx.arc(px, py, r, 0, Math.PI * 2);
            this.ctx.fillStyle = '#ff9800';
            this.ctx.globalAlpha = isInvalid ? 0.25 : 0.55;
            this.ctx.fill();
            this.ctx.strokeStyle = '#e65100';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
          } else if (this.currentTool === CONFIG.TOOL_PLAYER_TOPDOWN) {
            this.ctx.fillStyle = '#9c27b0';
            this.ctx.globalAlpha = isInvalid ? 0.25 : 0.55;
            this.ctx.fillRect(x + (CONFIG.TILE_SIZE - 28) / 2, y + (CONFIG.TILE_SIZE - 28), 28, 28);
          } else if (this.currentTool === CONFIG.TOOL_PLAYER_PADDLE_H) {
            this.ctx.fillStyle = '#009688';
            this.ctx.globalAlpha = isInvalid ? 0.25 : 0.55;
            this.ctx.fillRect(x - 20, y + 10, 80, 20);
          } else if (this.currentTool === CONFIG.TOOL_PLAYER_PADDLE_V) {
            this.ctx.fillStyle = '#009688';
            this.ctx.globalAlpha = isInvalid ? 0.25 : 0.55;
            this.ctx.fillRect(x + 10, y - 20, 20, 80);
          }
          this.ctx.globalAlpha = 1;
          break;
        }
        case CONFIG.TOOL_GOAL:
          if (this.assets.goal) {
            this.ctx.drawImage(this.assets.goal, x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = '#e8b76c';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
          break;
        case CONFIG.TOOL_ENEMY:
        case CONFIG.TOOL_ENEMY_CHASER: {
          const tileVal = this.level.getTile(this.hoverCol, this.hoverRow);
          const isInvalid = (tileVal === 1 || tileVal === 3 || tileVal === 4 || tileVal === 5 || tileVal === 6 || tileVal === 7) ||
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
            this.ctx.fillStyle = this.currentTool === CONFIG.TOOL_ENEMY_CHASER ? 'rgba(150, 40, 40, 0.8)' : 'rgba(30,23,32,0.8)';
            this.ctx.beginPath();
            this.ctx.arc(cx2 + Math.cos(a) * r2 * 0.88, cy2 + Math.sin(a) * r2 * 0.88, r2 * 0.25, 0, Math.PI * 2);
            this.ctx.fill();
          }
          // Body
          this.ctx.fillStyle = this.currentTool === CONFIG.TOOL_ENEMY_CHASER ? 'rgba(180, 50, 50, 0.85)' : 'rgba(30,23,32,0.85)';
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
        case CONFIG.TOOL_LAZER: {
          const tileVal = this.level.getTile(this.hoverCol, this.hoverRow);
          const isInvalid = (tileVal === 1 || tileVal === 3 || tileVal === 4 || tileVal === 5 || tileVal === 6 || tileVal === 7);
          if (isInvalid) {
            this.ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
          this.ctx.globalAlpha = isInvalid ? 0.3 : 0.8;
          
          this.ctx.fillStyle = '#111';
          this.ctx.fillRect(x + 10, y + 10, 20, 20);
          this.ctx.fillStyle = '#e91e63';
          this.ctx.fillRect(x + 15, y + 15, 10, 10);
          this.ctx.globalAlpha = 1;
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
      if (this.currentTool === CONFIG.TOOL_ENEMY || this.currentTool === CONFIG.TOOL_ENEMY_CHASER || this.currentTool === CONFIG.TOOL_LAZER) {
        const tileVal = this.level.getTile(this.hoverCol, this.hoverRow);
        const isInvalid = (tileVal === 1 || tileVal === 3 || tileVal === 4 || tileVal === 6 || tileVal === 7) ||
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
