import re

with open('src/editor.js', 'r') as f:
    content = f.read()

# We need to find `renderEarthBlock(x, y, alpha = 1, col = null, row = null, engine = null) {`
# and its matching closing brace at line 619.

start_str = "  renderEarthBlock(x, y, alpha = 1, col = null, row = null, engine = null) {"
start_idx = content.find(start_str)

if start_idx == -1:
    print("Could not find renderEarthBlock")
    exit(1)

# Find the matching closing brace
brace_count = 0
end_idx = -1
for i in range(start_idx + len(start_str) - 1, len(content)):
    if content[i] == '{':
        brace_count += 1
    elif content[i] == '}':
        brace_count -= 1
        if brace_count == 0:
            end_idx = i + 1
            break

if end_idx == -1:
    print("Could not find end of renderEarthBlock")
    exit(1)

new_func = """  renderEarthBlock(x, y, alpha = 1, col = null, row = null, engine = null) {
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
  }"""

with open('src/editor.js', 'w') as f:
    f.write(content[:start_idx] + new_func + content[end_idx:])

print("Successfully replaced renderEarthBlock")
