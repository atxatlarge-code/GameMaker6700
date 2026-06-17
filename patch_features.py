import re

with open('src/engine.js', 'r') as f:
    content = f.read()

# 1. Slime Walls
slime_logic = """
    // Slime Wall physics
    this.player.isWallSliding = false;
    if (!this.player.isGrounded && this.player.vy > 0) {
      const inset = 2;
      const leftTile = this.getTile(Math.floor((this.player.x - 1) / CONFIG.TILE_SIZE), Math.floor((this.player.y + this.player.height / 2) / CONFIG.TILE_SIZE));
      const rightTile = this.getTile(Math.floor((this.player.x + this.player.width + 1) / CONFIG.TILE_SIZE), Math.floor((this.player.y + this.player.height / 2) / CONFIG.TILE_SIZE));
      
      if ((this.keys.left && leftTile === 32) || (this.keys.right && rightTile === 32)) {
        this.player.isWallSliding = true;
        this.player.wallDirection = this.keys.left ? 1 : -1;
        this.player.vy *= 0.8;
      }
    }
"""
content = re.sub(r'(this\.player\.x \+= this\.player\.vx;)', lambda m: m.group(1) + slime_logic, content)

wall_jump = """
      if (this.player.isWallSliding) {
        this.player.vy = -CONFIG.JUMP_FORCE;
        this.player.vx = this.player.wallDirection * CONFIG.MOVE_SPEED * 1.5;
        this.spawnJumpDust();
        if (!this.isSimulation && audio.playJumpSound) audio.playJumpSound();
        this.player.isWallSliding = false;
      } else
"""
content = re.sub(r'(if \(this\.player\.jumpBufferTimer > 0)', lambda m: wall_jump + m.group(1), content)

# 2. Water Zone
water_logic = """
    // Water Zone
    const playerCx = this.player.x + this.player.width / 2;
    const playerCy = this.player.y + this.player.height / 2;
    const centerTile = this.getTile(Math.floor(playerCx / CONFIG.TILE_SIZE), Math.floor(playerCy / CONFIG.TILE_SIZE));
    if (centerTile === 31) {
      this.player.vx *= 0.85;
      this.player.vy *= 0.85;
      if (this.keys.up) this.player.vy -= CONFIG.GRAVITY * 0.8; // swim up
    }
"""
content = re.sub(r'(this\.player\.vy \+= CONFIG\.GRAVITY \* this\.level\.gravityDir;)', lambda m: m.group(1) + water_logic, content)

# 3. Skins
skins_logic = """
    const skin = this.player ? (this.player.skin || 'default') : 'default';
    if (skin === 'ninja') {
      capeColor = '#111111'; liningColor = '#e63946'; faceColor = '#ffe0e0'; eyeColor = '#111111';
    } else if (skin === 'knight') {
      capeColor = '#a8dadc'; liningColor = '#457b9d'; faceColor = '#f1faee'; eyeColor = '#1d3557';
    } else if (skin === 'gold') {
      capeColor = '#ffb703'; liningColor = '#fb8500'; faceColor = '#fff3b0'; eyeColor = '#023047';
    } else if (skin === 'void') {
      capeColor = '#000000'; liningColor = '#ff00ff'; faceColor = '#220022'; eyeColor = '#ff00ff';
    }
"""
content = re.sub(r'(capeColor = \'#4a5d4e\'; liningColor = \'#c29b68\'; faceColor = \'#f5f0eb\'; eyeColor = \'#2b2621\';\n    })', lambda m: m.group(1) + skins_logic, content)

# 4. Darkness
darkness_logic = """
    if (this.level.isDark && !this.isSimulation) {
      if (!this.darkCanvas) {
        this.darkCanvas = document.createElement('canvas');
        this.darkCanvas.width = this.canvas.width;
        this.darkCanvas.height = this.canvas.height;
        this.darkCtx = this.darkCanvas.getContext('2d');
      }
      this.darkCtx.globalCompositeOperation = 'source-over';
      this.darkCtx.fillStyle = '#0a0a14';
      this.darkCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.darkCtx.globalCompositeOperation = 'destination-out';
      
      const drawHole = (x, y, r) => {
        const sx = x - this.camera.x;
        const sy = y - this.camera.y;
        if (sx < -r || sx > this.canvas.width + r || sy < -r || sy > this.canvas.height + r) return;
        const g = this.darkCtx.createRadialGradient(sx, sy, 0, sx, sy, r);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        this.darkCtx.fillStyle = g;
        this.darkCtx.beginPath();
        this.darkCtx.arc(sx, sy, r, 0, Math.PI*2);
        this.darkCtx.fill();
      };
      
      // Player light
      drawHole(this.player.x + this.player.width/2, this.player.y + this.player.height/2, 120);
      
      // Fire and switches
      for (let r=0; r<CONFIG.GRID_ROWS; r++) {
        for (let c=0; c<CONFIG.GRID_COLS; c++) {
          const t = this.getTile(c, r);
          if (t === 14 || t === 15) drawHole(c*CONFIG.TILE_SIZE+20, r*CONFIG.TILE_SIZE+20, 80);
          if (t === 12 || t === 13) drawHole(c*CONFIG.TILE_SIZE+20, r*CONFIG.TILE_SIZE+20, 60);
        }
      }
      
      this.ctx.globalAlpha = 0.95;
      this.ctx.drawImage(this.darkCanvas, 0, 0);
      this.ctx.globalAlpha = 1.0;
    }
"""
content = re.sub(r'(this\.renderUI\(\);\n  })', lambda m: darkness_logic + m.group(1), content)

with open('src/engine.js', 'w') as f:
    f.write(content)

print("Features restored.")
