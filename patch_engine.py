import re

with open('src/engine.js', 'r') as f:
    content = f.read()

# 1. Add boomerangs array to constructor or resetPlayer
content = re.sub(
    r'(this\.player\.hasSpringBoots = false;)',
    r'\1\n    this.player.hasBoomerang = false;',
    content
)

content = re.sub(
    r'(this\.ghostTimer = 0;\n    })',
    r'\1\n    this.boomerangs = [];\n    this.crumblingBlocks = [];',
    content
)

# 2. Add throwBoomerang input
content = re.sub(
    r'(this\.keys\.up = true;\n\s*this\.player\.jumpBufferTimer = CONFIG\.JUMP_BUFFER;\n\s*})',
    r"\1\n      if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {\n        this.throwBoomerang();\n      }",
    content
)

# 3. Add updateBoomerangs() call
content = re.sub(
    r'(// Update and check enemies\n\s*this\.updateEnemies\(\);)',
    r'\1\n\n    // Update boomerangs\n    this.updateBoomerangs();',
    content
)

# 4. Add collect boomerang logic
content = re.sub(
    r'(if \(tile\.type === 30\) \{.*?\n\s*continue;\n\s*\})',
    r'\1\n      if (tile.type === 33) {\n        this.level.setTile(tile.col, tile.row, 0);\n        this.player.hasBoomerang = true;\n        this.spawnJumpDust();\n        if (!this.isSimulation && audio.playTileSound) audio.playTileSound();\n        continue;\n      }',
    content,
    flags=re.DOTALL
)

# 5. Add throwBoomerang and updateBoomerangs functions
functions = """
  throwBoomerang() {
    if (!this.player.hasBoomerang) return;
    if (this.boomerangs.length > 0) return;

    if (audio.playTileSound && !this.isSimulation) audio.playTileSound();

    this.boomerangs.push({
      x: this.player.x + this.player.width / 2 - 8,
      y: this.player.y + this.player.height / 2 - 8,
      vx: this.player.facing === 'left' ? -12 : 12,
      vy: 0,
      width: 16,
      height: 16,
      state: 'outward',
      timer: 20,
      rotation: 0
    });
  }

  updateBoomerangs() {
    for (let i = this.boomerangs.length - 1; i >= 0; i--) {
      const b = this.boomerangs[i];
      b.rotation += 0.4;
      
      if (b.state === 'outward') {
        b.timer--;
        if (b.timer <= 0) b.state = 'returning';
        
        const nextX = b.x + b.vx;
        const col = Math.floor((nextX + (b.vx > 0 ? b.width : 0)) / CONFIG.TILE_SIZE);
        const rowTop = Math.floor(b.y / CONFIG.TILE_SIZE);
        const rowBot = Math.floor((b.y + b.height - 0.1) / CONFIG.TILE_SIZE);
        
        let hitWall = false;
        for (let r = rowTop; r <= rowBot; r++) {
          if (this.isSolid(col, r)) {
            hitWall = true;
            break;
          }
        }
        
        if (hitWall) {
          b.state = 'returning';
        } else {
          b.x += b.vx;
          b.y += b.vy;
        }
      } else {
        const dx = (this.player.x + this.player.width / 2) - (b.x + b.width / 2);
        const dy = (this.player.y + this.player.height / 2) - (b.y + b.height / 2);
        const dist = Math.hypot(dx, dy);
        
        if (dist < 20) {
          this.boomerangs.splice(i, 1);
          continue;
        }
        
        const returnSpeed = 14;
        b.vx = (dx / dist) * returnSpeed;
        b.vy = (dy / dist) * returnSpeed;
        b.x += b.vx;
        b.y += b.vy;
      }
      
      const bLeft = b.x, bRight = b.x + b.width, bTop = b.y, bBot = b.y + b.height;
      for (let j = this.liveEnemies.length - 1; j >= 0; j--) {
        const e = this.liveEnemies[j];
        if (e.isDead) continue;
        if (bRight > e.x && bLeft < e.x + e.width && bBot > e.y && bTop < e.y + e.height) {
          e.isDead = true;
          this.spawnEnemyDeathParticles(e);
          if (audio.playBreakSound && !this.isSimulation) audio.playBreakSound();
        }
      }

      const minCol = Math.max(0, Math.floor(bLeft / CONFIG.TILE_SIZE));
      const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((bRight - 0.01) / CONFIG.TILE_SIZE));
      const minRow = Math.max(0, Math.floor(bTop / CONFIG.TILE_SIZE));
      const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((bBot - 0.01) / CONFIG.TILE_SIZE));

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (this.getTile(c, r) === 5) {
            this.setTile(c, r, 0);
            this.coinsCollected++;
            if (!this.isSimulation) {
              if (audio.playCoinSound) audio.playCoinSound();
              const hudVal = document.getElementById('hud-coins-collected');
              if (hudVal) hudVal.textContent = this.coinsCollected.toString();
              this.spawnCoinParticles(c * CONFIG.TILE_SIZE + 20, r * CONFIG.TILE_SIZE + 20);
            }
          }
        }
      }
    }
  }
"""
content = re.sub(
    r'(updateEnemies\(\) \{)',
    lambda m: functions + '\n  ' + m.group(1),
    content
)

# 6. Add renderBoomerangs()
render_func = """
    // Render Boomerangs
    if (this.boomerangs) {
      for (const b of this.boomerangs) {
        this.ctx.save();
        this.ctx.translate(b.x + b.width/2 - this.camera.x, b.y + b.height/2 - this.camera.y);
        this.ctx.rotate(b.rotation);
        this.ctx.fillStyle = '#a855f7';
        this.ctx.beginPath();
        this.ctx.moveTo(-b.width/2, b.height/2);
        this.ctx.quadraticCurveTo(0, -b.height/2, b.width/2, b.height/2);
        this.ctx.quadraticCurveTo(0, 0, -b.width/2, b.height/2);
        this.ctx.fill();
        this.ctx.restore();
      }
    }
"""
content = re.sub(
    r'(// Draw player)',
    lambda m: render_func + '\n    ' + m.group(1),
    content
)

with open('src/engine.js', 'w') as f:
    f.write(content)
print("Patched successfully!")
