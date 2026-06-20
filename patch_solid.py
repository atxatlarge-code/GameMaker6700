import re

with open("src/editor.js", "r") as f:
    content = f.read()

# We need to insert renderSolidBlock right after renderEarthBlock
# renderEarthBlock ends with:
#     this.ctx.drawImage(cachedCanvas, x - 12, y - 12);
#     this.ctx.restore();
#   }
#
#   initListeners() {

method_code = """
  renderSolidBlock(x, y, alpha = 1, col = null, row = null, engine = null) {
    if (!this.solidCache) this.solidCache = new Map();

    const c = col !== null ? col : 0;
    const r = row !== null ? row : 0;

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

    const hasTopLeft = col !== null && row !== null && isSolid(c - 1, r - 1);
    const hasTopRight = col !== null && row !== null && isSolid(c + 1, r - 1);
    const hasBottomLeft = col !== null && row !== null && isSolid(c - 1, r + 1);
    const hasBottomRight = col !== null && row !== null && isSolid(c + 1, r + 1);

    const cacheKey = `${c}_${r}_${hasLeft ? 1 : 0}${hasRight ? 1 : 0}${hasTop ? 1 : 0}${hasBottom ? 1 : 0}_${hasTopLeft ? 1 : 0}${hasTopRight ? 1 : 0}${hasBottomLeft ? 1 : 0}${hasBottomRight ? 1 : 0}`;

    let cachedCanvas = this.solidCache.get(cacheKey);

    if (!cachedCanvas) {
      cachedCanvas = document.createElement('canvas');
      const padding = 12;
      const size = CONFIG.TILE_SIZE;
      cachedCanvas.width = size + padding * 2;
      cachedCanvas.height = size + padding * 2;
      const offCtx = cachedCanvas.getContext('2d');

      offCtx.translate(padding, padding);

      // --- Draw Smooth Concrete Block ---
      
      // Base color
      offCtx.fillStyle = '#9ca3af'; // light concrete gray
      offCtx.fillRect(0, 0, size, size);

      // Subtle texture (noise/scratches)
      offCtx.fillStyle = 'rgba(0,0,0,0.03)';
      const seed = (c * 13.37 + r * 42.1) % 100;
      for (let i = 0; i < 15; i++) {
        const px = (seed * i * 3.1) % size;
        const py = (seed * i * 7.2) % size;
        offCtx.fillRect(px, py, 4, 1);
        offCtx.fillRect(px, py, 1, 3);
      }

      // Draw Bevels (Highlights and Shadows)
      const bevelSize = 4;
      
      // Highlight (Top/Left)
      offCtx.fillStyle = 'rgba(255,255,255,0.4)';
      if (!hasTop) {
        offCtx.beginPath(); offCtx.moveTo(0,0); offCtx.lineTo(size,0); offCtx.lineTo(size-bevelSize,bevelSize); offCtx.lineTo(bevelSize,bevelSize); offCtx.fill();
      }
      if (!hasLeft) {
        offCtx.beginPath(); offCtx.moveTo(0,0); offCtx.lineTo(0,size); offCtx.lineTo(bevelSize,size-bevelSize); offCtx.lineTo(bevelSize,bevelSize); offCtx.fill();
      }

      // Shadow (Bottom/Right)
      offCtx.fillStyle = 'rgba(0,0,0,0.3)';
      if (!hasBottom) {
        offCtx.beginPath(); offCtx.moveTo(0,size); offCtx.lineTo(size,size); offCtx.lineTo(size-bevelSize,size-bevelSize); offCtx.lineTo(bevelSize,size-bevelSize); offCtx.fill();
      }
      if (!hasRight) {
        offCtx.beginPath(); offCtx.moveTo(size,0); offCtx.lineTo(size,size); offCtx.lineTo(size-bevelSize,size-bevelSize); offCtx.lineTo(size-bevelSize,bevelSize); offCtx.fill();
      }

      // Inner Corners (If neighbors exist but diagonal doesn't)
      const innerTL = hasTop && hasLeft && !hasTopLeft;
      const innerTR = hasTop && hasRight && !hasTopRight;
      const innerBL = hasBottom && hasLeft && !hasBottomLeft;
      const innerBR = hasBottom && hasRight && !hasBottomRight;

      if (innerTL || innerTR || innerBL || innerBR) {
        offCtx.fillStyle = 'rgba(0,0,0,0.2)';
        if (innerTL) offCtx.fillRect(0, 0, bevelSize, bevelSize);
        if (innerTR) offCtx.fillRect(size-bevelSize, 0, bevelSize, bevelSize);
        if (innerBL) offCtx.fillRect(0, size-bevelSize, bevelSize, bevelSize);
        if (innerBR) offCtx.fillRect(size-bevelSize, size-bevelSize, bevelSize, bevelSize);
      }

      // Rivets on exposed corners
      offCtx.fillStyle = '#4b5563'; // Dark rivet color
      const drawRivet = (rx, ry) => {
        offCtx.beginPath();
        offCtx.arc(rx, ry, 2, 0, Math.PI*2);
        offCtx.fill();
        offCtx.fillStyle = 'rgba(255,255,255,0.5)';
        offCtx.beginPath();
        offCtx.arc(rx-0.5, ry-0.5, 1, 0, Math.PI*2);
        offCtx.fill();
        offCtx.fillStyle = '#4b5563';
      };

      const ro = bevelSize + 2; // Rivet offset
      if (!hasTop && !hasLeft) drawRivet(ro, ro);
      if (!hasTop && !hasRight) drawRivet(size-ro, ro);
      if (!hasBottom && !hasLeft) drawRivet(ro, size-ro);
      if (!hasBottom && !hasRight) drawRivet(size-ro, size-ro);

      this.solidCache.set(cacheKey, cachedCanvas);
    }

    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    if (x !== -1000) {
      this.ctx.drawImage(cachedCanvas, x - 12, y - 12);
    }
    this.ctx.restore();
  }
"""

content = re.sub(
    r"(    this\.ctx\.drawImage\(cachedCanvas, x - 12, y - 12\);\n    this\.ctx\.restore\(\);\n  })",
    r"\1\n" + method_code,
    content
)

with open("src/editor.js", "w") as f:
    f.write(content)
