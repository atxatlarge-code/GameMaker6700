import re

with open('src/engine.js', 'r') as f:
    content = f.read()

# Ice & Conveyor
ground_logic = """
        // Ice block (18) and Conveyor (20, 21)
        const groundTile = this.getTile(Math.floor((this.player.x + this.player.width/2)/CONFIG.TILE_SIZE), Math.floor((this.player.y + this.player.height + 1)/CONFIG.TILE_SIZE));
        if (groundTile === 18) {
          this.player.friction = 0.98;
        } else {
          this.player.friction = CONFIG.FRICTION;
        }
        if (groundTile === 20) this.player.x -= 2;
        if (groundTile === 21) this.player.x += 2;
        
        // Crumbling block (22)
        if (groundTile === 22) {
          const col = Math.floor((this.player.x + this.player.width/2)/CONFIG.TILE_SIZE);
          const row = Math.floor((this.player.y + this.player.height + 1)/CONFIG.TILE_SIZE);
          let found = false;
          for (const b of this.crumblingBlocks) {
            if (b.col === col && b.row === row) { found = true; break; }
          }
          if (!found) this.crumblingBlocks.push({col, row, timer: 30});
        }
"""

content = re.sub(
    r'(this\.player\.isGrounded = true;)',
    r'\1' + '\n' + ground_logic,
    content
)

# Crumbling blocks update logic
update_logic = """
    // Update crumbling blocks
    for (let i = this.crumblingBlocks.length - 1; i >= 0; i--) {
      const b = this.crumblingBlocks[i];
      b.timer--;
      if (b.timer <= 0) {
        this.setTile(b.col, b.row, 0);
        this.crumblingBlocks.splice(i, 1);
        if (audio.playBreakSound && !this.isSimulation) audio.playBreakSound();
      }
    }
"""

content = re.sub(
    r'(this\.updateBoomerangs\(\);)',
    r'\1' + '\n' + update_logic,
    content
)

# Gravity portal logic (19)
gravity_logic = """
          if (tileVal === 19 && this.portalCooldown <= 0) {
            this.level.gravityDir = (this.level.gravityDir || 1) * -1;
            this.portalCooldown = 30;
            this.player.vy = 0;
            if (audio.playTileSound && !this.isSimulation) audio.playTileSound();
          }
"""
content = re.sub(
    r'(if \(tileVal === 5 \|\| tileVal === 9\) \{)',
    r'if (tileVal === 19 || tileVal === 5 || tileVal === 9) {\n' + gravity_logic + '\n          if (tileVal === 19) continue;\n          if (tileVal === 5 || tileVal === 9) {',
    content
)

with open('src/engine.js', 'w') as f:
    f.write(content)
print("Physics patched.")
