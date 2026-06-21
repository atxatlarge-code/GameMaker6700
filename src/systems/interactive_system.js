import { CONFIG } from '../config.js';
import { TILE } from '../tiles.js';
import { audio } from '../audio.js';

export class InteractiveSystem {
  constructor(engine) {
    this.engine = engine;
  }

  updateGhost() {
    if (this.engine.isDead || this.engine.hasWon) return;

    // Check collision with Ghost Switch (51) to start recording
    const pCx = this.engine.player.x + this.engine.player.width / 2;
    const pCy = this.engine.player.y + this.engine.player.height / 2;
    const col = Math.floor(pCx / CONFIG.TILE_SIZE);
    const row = Math.floor(pCy / CONFIG.TILE_SIZE);

    if (this.engine.getTile(col, row) === TILE.GHOST_SWITCH) {
      if (!this.engine.ghostRecording && !this.engine.ghostActive) {
        this.engine.ghostRecording = true;
        this.engine.ghostRecordTimer = 300; // 5 seconds
        this.engine.ghostFrames = [];
        if (!this.engine.isSimulation && window.audio && window.audio.playPowerupSound) window.audio.playPowerupSound();
      }
    }

    if (this.engine.ghostRecording) {
      this.engine.ghostFrames.push({
        x: this.engine.player.x,
        y: this.engine.player.y,
        facing: this.engine.player.facing,
        walkCycle: this.engine.player.walkCycle,
        width: this.engine.player.width,
        height: this.engine.player.height
      });
      
      this.engine.ghostRecordTimer--;
      if (this.engine.ghostRecordTimer <= 0) {
        this.engine.ghostRecording = false;
        this.engine.ghostActive = true;
        this.engine.ghostPlaybackIndex = 0;
        if (!this.engine.isSimulation && window.audio && window.audio.playJumpSound) window.audio.playJumpSound();
      }
    }

    if (this.engine.ghostActive && this.engine.ghostFrames.length > 0) {
      const frame = this.engine.ghostFrames[this.engine.ghostPlaybackIndex];
      this.engine.ghost = { ...frame }; // active ghost entity for collision checking
      
      const gCx = this.engine.ghost.x + this.engine.ghost.width / 2;
      const gCy = this.engine.ghost.y + this.engine.ghost.height / 2;
      const gCol = Math.floor(gCx / CONFIG.TILE_SIZE);
      const gRow = Math.floor(gCy / CONFIG.TILE_SIZE);
      
      // The ghost can step on Tripwires (20) and Switch Blocks (11) if we implement collision logic for it.
      // Actually Switch Blocks (11) require side collisions. The tripwire is easier.
      // Let's implement ghost hitting switch block 11
      const gTiles = this.engine.getOverlappingTiles({
        left: this.engine.ghost.x,
        right: this.engine.ghost.x + this.engine.ghost.width,
        top: this.engine.ghost.y,
        bottom: this.engine.ghost.y + this.engine.ghost.height
      });
      for (const t of gTiles) {
        if (t.type === TILE.SWITCH) {
          if (!this.engine.switchCooldown) {
            this.engine.level.switchState = this.engine.level.switchState === 'red' ? 'blue' : 'red';
            this.engine.switchCooldown = 20;
            if (!this.engine.isSimulation && window.audio && window.audio.playTileSound) window.audio.playTileSound();
          }
        }
      }
      
      this.engine.ghostPlaybackIndex++;
      if (this.engine.ghostPlaybackIndex >= this.engine.ghostFrames.length) {
        this.engine.ghostPlaybackIndex = 0; // Loop the ghost
      }
    } else {
      this.engine.ghost = null;
    }
  }

  updateBombs() {
    for (let i = this.engine.bombs.length - 1; i >= 0; i--) {
      const b = this.engine.bombs[i];
      b.timer--;
      if (b.timer <= 0) {
        this.engine.bombs.splice(i, 1);
        this.engine.explodeBomb(b.col, b.row);
      }
    }
    
    // Update visual explosions
    for (let i = this.engine.explosions.length - 1; i >= 0; i--) {
      this.engine.explosions[i].timer--;
      if (this.engine.explosions[i].timer <= 0) {
        this.engine.explosions.splice(i, 1);
      }
    }
  }

  updateTurrets() {
    if (!this.engine.turrets) return;

    // Update turret firing cooldowns
    for (const t of this.engine.turrets) {
      t.timer++;
      if (t.timer >= t.interval) {
        t.timer = 0;
        // Fire projectile to the left
        this.engine.turretProjectiles.push({
          x: t.col * CONFIG.TILE_SIZE, // Spawn on left edge
          y: t.row * CONFIG.TILE_SIZE + 10,
          vx: -3,
          vy: 0,
          width: 8,
          height: 8,
          isDeadly: true
        });
        if (typeof audio !== 'undefined' && audio.playTileSound) {
          audio.playTileSound();
        }
      }
    }

    // Update projectiles
    if (!this.engine.turretProjectiles) return;
    for (let i = this.engine.turretProjectiles.length - 1; i >= 0; i--) {
      const p = this.engine.turretProjectiles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Check collision with walls
      const col = Math.floor(p.x / CONFIG.TILE_SIZE);
      const row = Math.floor(p.y / CONFIG.TILE_SIZE);
      const rightCol = Math.floor((p.x + p.width) / CONFIG.TILE_SIZE);
      const bottomRow = Math.floor((p.y + p.height) / CONFIG.TILE_SIZE);

      if (this.engine.isSolid(col, row) || this.engine.isSolid(rightCol, row) || this.engine.isSolid(col, bottomRow) || this.engine.isSolid(rightCol, bottomRow) || p.x < 0 || p.x > CONFIG.GRID_COLS * CONFIG.TILE_SIZE) {
        if (this.engine.getTile(col, row) === TILE.REFLECTOR || this.engine.getTile(rightCol, row) === TILE.REFLECTOR || this.engine.getTile(col, bottomRow) === TILE.REFLECTOR || this.engine.getTile(rightCol, bottomRow) === TILE.REFLECTOR) {
          p.vx *= -1;
          p.reflected = true;
          p.isDeadly = false; // Harmless to player now
          p.x += p.vx * 2; // Bump out of wall to prevent getting stuck
          if (!this.engine.isSimulation && window.audio && window.audio.playTileSound) window.audio.playTileSound();
          continue;
        }

        this.engine.turretProjectiles.splice(i, 1);
        continue;
      }

      // Check collision with player
      if (p.isDeadly && !this.engine.isDead && !this.engine.hasWon && this.engine.checkCollision(p, this.engine.player)) {
        this.engine.die(); // Or whatever it was before
        this.engine.turretProjectiles.splice(i, 1);
        continue;
      }

      // Check collision with enemies
      if (p.reflected) {
        let hitEnemy = false;
        for (let j = this.engine.liveEnemies.length - 1; j >= 0; j--) {
          const enemy = this.engine.liveEnemies[j];
          if (this.engine.checkCollision(p, enemy)) {
            this.engine.liveEnemies.splice(j, 1);
            if (!this.engine.isSimulation && window.audio && window.audio.playEnemyDeathSound) window.audio.playEnemyDeathSound();
            // Visual explosion
            this.engine.explosions.push({ col: Math.floor((enemy.x + enemy.width/2)/CONFIG.TILE_SIZE), row: Math.floor((enemy.y + enemy.height/2)/CONFIG.TILE_SIZE), timer: 15 });
            hitEnemy = true;
            break;
          }
        }
        if (hitEnemy) {
          this.engine.turretProjectiles.splice(i, 1);
          continue;
        }
      }
    }
  }

  updateGravityWells() {
    if (!this.engine.gravityWells || this.engine.gravityWells.length === 0) return;

    const pullRadius = 180;
    const maxPullForce = 0.5;

    for (const gw of this.engine.gravityWells) {
      // 1. Pull Player
      if (!this.engine.isDead && !this.engine.hasWon) {
        const px = this.engine.player.x + this.engine.player.width / 2;
        const py = this.engine.player.y + this.engine.player.height / 2;
        const dx = gw.x - px;
        const dy = gw.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist < pullRadius) {
          const force = (pullRadius - dist) / pullRadius * maxPullForce;
          this.engine.player.vx += (dx / dist) * force;
          this.engine.player.vy += (dy / dist) * force;
        }
      }

      // 2. Pull Enemies
      if (this.engine.enemies) {
        for (const e of this.engine.enemies) {
          if (e.dead) continue;
          if (e.type === 'lazer' || e.type === 'thwomp') continue; // Static enemies
          if (e.type === 'mimic' && e.state === 'hidden') continue; // Hidden mimics
          const ex = e.x + e.width / 2;
          const ey = e.y + e.height / 2;
          const dx = gw.x - ex;
          const dy = gw.y - ey;
          const dist = Math.hypot(dx, dy);
          if (dist < pullRadius) {
            // Apply a slight pull to enemies (less force)
            const force = (pullRadius - dist) / pullRadius * maxPullForce * 0.8;
            e.vx = (e.vx || 0) + (dx / dist) * force;
            e.vy = (e.vy || 0) + (dy / dist) * force;
          }
        }
      }

      // 3. Pull Projectiles (Turret shots)
      if (this.engine.turretProjectiles) {
        for (const p of this.engine.turretProjectiles) {
          const px = p.x + p.width / 2;
          const py = p.y + p.height / 2;
          const dx = gw.x - px;
          const dy = gw.y - py;
          const dist = Math.hypot(dx, dy);
          if (dist < pullRadius) {
            const force = (pullRadius - dist) / pullRadius * maxPullForce * 0.4;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }
      }
    }
  }

  updateMinecarts() {
    if (!this.engine.minecarts) return;

    for (let i = this.engine.minecarts.length - 1; i >= 0; i--) {
      const m = this.engine.minecarts[i];

      // Gravity
      m.vy += CONFIG.GRAVITY;
      if (m.vy > 12) m.vy = 12;

      // Apply horizontal velocity
      if (m.isOccupied) {
        if (this.engine.keys.up) {
          // Player jumps out
          m.isOccupied = false;
          this.engine.player.isInsideMinecart = false;
          this.engine.player.vy = -CONFIG.JUMP_FORCE;
          this.engine.player.vx = m.vx;
          this.engine.keys.up = false;
          if (window.audio && window.audio.playJumpSound) window.audio.playJumpSound();
        } else {
          // Lock player to cart
          this.engine.player.x = m.x;
          this.engine.player.y = m.y - this.engine.player.height + 10; // Sit inside it
          this.engine.player.vx = 0;
          this.engine.player.vy = 0;
          this.engine.player.isGrounded = true;
          this.engine.applyGroundEffects();

          this.engine.player.isSwinging = false; // Just in case
          
          // Apply continuous rolling force based on player's facing direction
          const maxSpeed = CONFIG.MOVE_SPEED * 1.5;
          const targetVx = this.engine.player.facing === 'left' ? -maxSpeed : maxSpeed;
          m.vx += (targetVx - m.vx) * 0.1;
        }
      } else {
        // Friction when unoccupied
        m.vx *= 0.95;
        if (Math.abs(m.vx) < 0.1) m.vx = 0;
      }

      // Move X
      m.x += m.vx;

      // Check wall collisions
      let mCol = Math.floor((m.x + m.width / 2) / CONFIG.TILE_SIZE);
      let mRow = Math.floor((m.y + m.height / 2) / CONFIG.TILE_SIZE);
      
      if (m.vx > 0) {
        const rightTileCol = Math.floor((m.x + m.width) / CONFIG.TILE_SIZE);
        if (this.engine.isSolid(rightTileCol, mRow)) {
          m.x = rightTileCol * CONFIG.TILE_SIZE - m.width;
          m.vx = 0;
        }
      } else if (m.vx < 0) {
        const leftTileCol = Math.floor(m.x / CONFIG.TILE_SIZE);
        if (this.engine.isSolid(leftTileCol, mRow)) {
          m.x = leftTileCol * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE;
          m.vx = 0;
        }
      }

      // Move Y
      m.y += m.vy;
      mCol = Math.floor((m.x + m.width / 2) / CONFIG.TILE_SIZE);
      const bottomRow = Math.floor((m.y + m.height) / CONFIG.TILE_SIZE);
      const bottomTile = this.engine.getTile(mCol, bottomRow);

      if (this.engine.isSolid(mCol, bottomRow) || bottomTile === TILE.JUMP_THROUGH || bottomTile === TILE.RAMP_RIGHT || bottomTile === TILE.RAMP_LEFT) {
        // Floor collision
        m.y = bottomRow * CONFIG.TILE_SIZE - m.height;
        m.vy = 0;
        m.isGrounded = true;

        // Ramp logic
        if (bottomTile === TILE.RAMP_RIGHT && m.vx > 2) { // RAMP RIGHT
          m.vy = -16;
          m.y -= 10;
          m.isGrounded = false;
        } else if (bottomTile === TILE.RAMP_LEFT && m.vx < -2) { // RAMP LEFT
          m.vy = -16;
          m.y -= 10;
          m.isGrounded = false;
        }
      } else {
        m.isGrounded = false;
      }

      // Player enter check
      if (!m.isOccupied && !this.engine.player.isInsideMinecart && !this.engine.isDead && !this.engine.hasWon) {
        if (this.engine.checkCollision(m, this.engine.player) && this.engine.player.vy >= 0 && this.engine.player.y < m.y) {
          // Jumped into it from above
          m.isOccupied = true;
          this.engine.player.isInsideMinecart = m;
          // Kickstart it
          m.vx = this.engine.player.vx;
          if (Math.abs(m.vx) < CONFIG.MOVE_SPEED) m.vx = this.engine.player.facing === 'left' ? -CONFIG.MOVE_SPEED : CONFIG.MOVE_SPEED;
        }
      }

      // Destroy if it falls off screen
      if (m.y > CONFIG.GRID_ROWS * CONFIG.TILE_SIZE + 200) {
        if (m.isOccupied) {
          this.engine.die(); // Player dies with it
        }
        this.engine.minecarts.splice(i, 1);
      }
    }
  }

  updateRopes() {
    if (!this.engine.ropes) return;
    const gravityAccel = 0.005;
    const damping = 0.99;

    for (const r of this.engine.ropes) {
      // Calculate angular acceleration from gravity
      const angularAccel = -gravityAccel * Math.sin(r.angle);
      r.velocity += angularAccel;
      
      // Add player momentum if swinging on this rope
      if (this.engine.player.isSwinging && this.engine.player.swingAnchor === r) {
        if (this.engine.keys.left) {
          r.velocity -= 0.002;
        } else if (this.engine.keys.right) {
          r.velocity += 0.002;
        }
      }

      r.velocity *= damping;
      r.angle += r.velocity;

      // Cap maximum swing angle
      if (r.angle > Math.PI / 2.2) r.angle = Math.PI / 2.2;
      if (r.angle < -Math.PI / 2.2) r.angle = -Math.PI / 2.2;

      // Calculate end position of rope
      const anchorX = r.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      const anchorY = r.row * CONFIG.TILE_SIZE + 10;
      const endX = anchorX + Math.sin(r.angle) * r.length;
      const endY = anchorY + Math.cos(r.angle) * r.length;

      // Check if player grabs it
      if (!this.engine.player.isSwinging && !this.engine.isDead && !this.engine.hasWon) {
        const pCenterX = this.engine.player.x + this.engine.player.width / 2;
        const pCenterY = this.engine.player.y + this.engine.player.height / 2;
        const dist = Math.hypot(pCenterX - endX, pCenterY - endY);
        
        if (dist < 20 && this.engine.player.vy >= 0 && !this.engine.player.isInsideCannon) { // Only grab if falling or touching
          this.engine.player.isSwinging = true;
          this.engine.player.swingAnchor = r;
          this.engine.player.isGrounded = false;
          // transfer momentum
          r.velocity += (this.engine.player.vx * 0.005);
          if (typeof audio !== 'undefined' && audio.playJumpSound) {
            audio.playJumpSound();
          }
        }
      }

      // If player is swinging on this rope
      if (this.engine.player.isSwinging && this.engine.player.swingAnchor === r) {
        this.engine.player.vx = 0;
        this.engine.player.vy = 0;
        this.engine.player.x = endX - this.engine.player.width / 2;
        this.engine.player.y = endY - this.engine.player.height / 2;

        // Jump to release
        if (this.engine.keys.up && !this.engine.player.isDashing) {
          this.engine.player.isSwinging = false;
          this.engine.player.swingAnchor = null;
          this.engine.player.isGrounded = false;
          this.engine.keys.up = false; // consume jump
          // Launch velocity
          this.engine.player.vx = r.velocity * 50 + (Math.sin(r.angle) * 5);
          this.engine.player.vy = -CONFIG.JUMP_FORCE;
          if (typeof audio !== 'undefined' && audio.playJumpSound) {
            audio.playJumpSound();
          }
        }
      }
    }
  }

  updateBoomerangs() {
    for (let i = this.engine.boomerangs.length - 1; i >= 0; i--) {
      const b = this.engine.boomerangs[i];
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
          if (this.engine.isSolid(col, r)) {
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
        const dx = (this.engine.player.x + this.engine.player.width / 2) - (b.x + b.width / 2);
        const dy = (this.engine.player.y + this.engine.player.height / 2) - (b.y + b.height / 2);
        const dist = Math.hypot(dx, dy);
        
        if (dist < 20) {
          this.engine.boomerangs.splice(i, 1);
          continue;
        }
        
        const returnSpeed = 14;
        b.vx = (dx / dist) * returnSpeed;
        b.vy = (dy / dist) * returnSpeed;
        b.x += b.vx;
        b.y += b.vy;
      }
      
      const bLeft = b.x, bRight = b.x + b.width, bTop = b.y, bBot = b.y + b.height;
      for (let j = this.engine.liveEnemies.length - 1; j >= 0; j--) {
        const e = this.engine.liveEnemies[j];
        if (e.isDead) continue;
        if (bRight > e.x && bLeft < e.x + e.width && bBot > e.y && bTop < e.y + e.height) {
          e.isDead = true;
          this.engine.spawnEnemyDeathParticles(e);
          if (audio.playBreakSound && !this.engine.isSimulation) audio.playBreakSound();
        }
      }

      const minCol = Math.max(0, Math.floor(bLeft / CONFIG.TILE_SIZE));
      const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((bRight - 0.01) / CONFIG.TILE_SIZE));
      const minRow = Math.max(0, Math.floor(bTop / CONFIG.TILE_SIZE));
      const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((bBot - 0.01) / CONFIG.TILE_SIZE));

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (this.engine.getTile(c, r) === TILE.COIN) {
            this.engine.setTile(c, r, TILE.EMPTY);
            this.engine.coinsCollected++;
            if (!this.engine.isSimulation) {
              if (audio.playCoinSound) audio.playCoinSound();
              const hudVal = document.getElementById('hud-coins-collected');
              if (hudVal) hudVal.textContent = this.engine.coinsCollected.toString();
              this.engine.spawnCoinParticles(c * CONFIG.TILE_SIZE + 20, r * CONFIG.TILE_SIZE + 20);
            }
          }
        }
      }
    }
  }

  processCrumblingTiles() {
    if (this.engine.isDead || this.engine.hasWon) return;
    
    for (const [key, data] of this.engine.crumblingTiles.entries()) {
      data.timer--;
      const [col, row] = key.split(',').map(Number);
      if (data.state === 'shaking' && data.timer <= 0) {
        // Break the block
        this.engine.setTile(col, row, TILE.EMPTY);
        data.state = 'broken';
        data.timer = 180; // 3 seconds to respawn
        this.engine.breakBlock(col, row);
        if (!this.engine.isSimulation && audio.playBreakSound) audio.playBreakSound();
      } else if (data.state === 'broken' && data.timer <= 0) {
        // Respawn the block
        this.engine.setTile(col, row, TILE.CRUMBLE);
        this.engine.crumblingTiles.delete(key);
        if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
      }
    }
  }

  checkCoins() {
    if (this.engine.isDead || this.engine.hasWon) return;

    const inset = 2;
    const playerBox = {
      left: this.engine.player.x + inset,
      right: this.engine.player.x + this.engine.player.width - inset,
      top: this.engine.player.y + inset,
      bottom: this.engine.player.y + this.engine.player.height - inset,
    };

    const minCol = Math.max(0, Math.floor(playerBox.left / CONFIG.TILE_SIZE));
    const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((playerBox.right - 0.01) / CONFIG.TILE_SIZE));
    const minRow = Math.max(0, Math.floor(playerBox.top / CONFIG.TILE_SIZE));
    const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((playerBox.bottom - 0.01) / CONFIG.TILE_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tileVal = this.engine.getTile(c, r);
        if (tileVal === TILE.CONVEYOR_LEFT || tileVal === TILE.COIN || tileVal === TILE.KEY || tileVal === TILE.MIRROR_PORTAL) {

          if (tileVal === TILE.CONVEYOR_LEFT && this.engine.portalCooldown <= 0) {
            this.engine.level.gravityDir = (this.engine.level.gravityDir || 1) * -1;
            this.engine.portalCooldown = 30;
            this.engine.player.vy = 0;
            if (audio.playTileSound && !this.engine.isSimulation) audio.playTileSound();
          }

          if (tileVal === TILE.MIRROR_PORTAL && !this.engine.shadowClone) {
            this.engine.shadowClone = {
              x: c * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.engine.player.width)/2,
              y: r * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.engine.player.height),
              vx: 0, vy: 0, width: this.engine.player.width, height: this.engine.player.height,
              isGrounded: false, facing: 'right'
            };
            if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
          }

          if (tileVal === TILE.CONVEYOR_LEFT || tileVal === TILE.MIRROR_PORTAL) continue;
          if (tileVal === TILE.COIN || tileVal === TILE.KEY) {
            this.engine.setTile(c, r, TILE.EMPTY);
            
            if (tileVal === TILE.COIN) {
              this.engine.coinsCollected++;
            } else if (tileVal === TILE.KEY) {
              this.engine.hasKey = true;
            }
            
            if (this.engine.isSimulation) continue;

            if (tileVal === TILE.COIN) {
              audio.playCoinSound();
              const hudVal = document.getElementById('hud-coins-collected');
              if (hudVal) hudVal.textContent = this.engine.coinsCollected.toString();
            } else {
              if (audio.playCoinSound) audio.playCoinSound();
            }

            const coinCenterX = c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const coinCenterY = r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            this.engine.spawnCoinParticles(coinCenterX, coinCenterY);
          }
        }
      }
    }
  }

  updatePlatforms() {
    if (this.engine.isDead || this.engine.hasWon) return;

    for (const plat of this.engine.livePlatforms) {
      plat.x += plat.vx * plat.dir;
      plat.y += plat.vy * plat.dir;

      // Reverse direction if traveled too far
      if (plat.axis === 'x') {
        if (Math.abs(plat.x - plat.startX) >= plat.distance) {
          plat.dir *= -1;
        }
      } else {
        if (Math.abs(plat.y - plat.startY) >= plat.distance) {
          plat.dir *= -1;
        }
      }

      // If player is on top of this platform, carry them!
      // Must be falling or stationary vertically relative to the platform
      if (this.engine.player.vy >= 0) {
        const pBottom = this.engine.player.y + this.engine.player.height;
        const pBottomPrev = this.engine.player.y - this.engine.player.vy + this.engine.player.height;
        
        // Ensure player's X overlaps platform X
        if (this.engine.player.x + this.engine.player.width > plat.x && this.engine.player.x < plat.x + plat.width) {
          // Check if player landed on it this frame or was already on it
          // We allow a small tolerance for `plat.y` because the platform might be moving down
          if (pBottomPrev <= plat.y - (plat.vy * plat.dir) + 1 && pBottom + 2 >= plat.y) {
            this.engine.player.isGrounded = true;
            this.engine.applyGroundEffects();

            if (this.engine.player.hasDoubleJump) this.engine.player.doubleJumpAvailable = true;
            this.engine.player.y = plat.y - this.engine.player.height;
            this.engine.player.vy = plat.vy * plat.dir; // Move with platform vertically
            
            // Carry horizontally (unless walking against a wall, but we resolve wall collision later)
            this.engine.player.x += plat.vx * plat.dir;
          }
        }
      }
    }
  }

  updateShadowClone() {
    if (!this.engine.shadowClone) return;
    
    // Symmetrical input
    const cloneKeys = {
      left: this.engine.keys.right,
      right: this.engine.keys.left,
      up: this.engine.keys.up,
      down: this.engine.keys.down
    };

    const clone = this.engine.shadowClone;
    
    // Gravity direction
    const gDir = this.engine.level.gravityDir || 1;
    
    // Apply gravity
    if (clone.vy * gDir < CONFIG.MAX_FALL_SPEED) {
      clone.vy += CONFIG.GRAVITY * gDir;
    }

    // Horizontal movement
    let targetVx = 0;
    if (cloneKeys.left) targetVx = -CONFIG.MOVE_SPEED;
    if (cloneKeys.right) targetVx = -targetVx + CONFIG.MOVE_SPEED; // Wait, right is +MOVE_SPEED
    if (cloneKeys.left && !cloneKeys.right) targetVx = -CONFIG.MOVE_SPEED;
    else if (cloneKeys.right && !cloneKeys.left) targetVx = CONFIG.MOVE_SPEED;
    
    clone.vx += (targetVx - clone.vx) * CONFIG.ACCELERATION;
    
    if (cloneKeys.left) clone.facing = 'left';
    if (cloneKeys.right) clone.facing = 'right';

    // Jump
    if (cloneKeys.up && clone.isGrounded) {
      clone.vy = -CONFIG.JUMP_FORCE * gDir;
      clone.isGrounded = false;
      if (!this.engine.isSimulation && audio.playJumpSound) audio.playJumpSound();
    }

    // Move X
    clone.x += clone.vx;
    
    // Resolve X collisions
    const minColX = Math.floor(clone.x / CONFIG.TILE_SIZE);
    const maxColX = Math.floor((clone.x + clone.width - 0.01) / CONFIG.TILE_SIZE);
    const minRowX = Math.floor(clone.y / CONFIG.TILE_SIZE);
    const maxRowX = Math.floor((clone.y + clone.height - 0.01) / CONFIG.TILE_SIZE);
    
    for (let r = minRowX; r <= maxRowX; r++) {
      for (let c = minColX; c <= maxColX; c++) {
        if (this.engine.isSolid(c, r)) {
          if (clone.vx > 0) clone.x = c * CONFIG.TILE_SIZE - clone.width;
          else if (clone.vx < 0) clone.x = (c + 1) * CONFIG.TILE_SIZE;
          clone.vx = 0;
        }
      }
    }

    // Move Y
    clone.y += clone.vy;
    clone.isGrounded = false;
    
    // Resolve Y collisions
    const minColY = Math.floor(clone.x / CONFIG.TILE_SIZE);
    const maxColY = Math.floor((clone.x + clone.width - 0.01) / CONFIG.TILE_SIZE);
    const minRowY = Math.floor(clone.y / CONFIG.TILE_SIZE);
    const maxRowY = Math.floor((clone.y + clone.height - 0.01) / CONFIG.TILE_SIZE);
    
    for (let r = minRowY; r <= maxRowY; r++) {
      for (let c = minColY; c <= maxColY; c++) {
        if (this.engine.isSolid(c, r)) {
          if (clone.vy > 0) {
            clone.y = r * CONFIG.TILE_SIZE - clone.height;
            clone.isGrounded = true;
          } else if (clone.vy < 0) {
            clone.y = (r + 1) * CONFIG.TILE_SIZE;
          }
          clone.vy = 0;
        }
      }
    }
  }


}
