import { CONFIG } from '../config.js';
import { TILE } from '../tiles.js';
import { audio } from '../audio.js';

export class EnemySystem {
  constructor(engine) {
    this.engine = engine;
  }

  updateEnemies() {
    if (this.engine.isDead || this.engine.hasWon) return;

    for (const enemy of this.engine.liveEnemies) {

      // ── Gravity ────────────────────────────────────────────────────────────
      if ((enemy.type !== 'thwomp' && enemy.type !== 'lazer' && enemy.type !== 'worm' && enemy.type !== 'bat') || enemy.state === 'falling') {
        enemy.vy += (enemy.type === 'thwomp') ? CONFIG.GRAVITY * 1.5 : CONFIG.GRAVITY;
        if (enemy.vy > 15) enemy.vy = 15; // terminal velocity
      } else {
        enemy.vy = 0;
      }

      // ── Vertical movement & ground collision ───────────────────────────────
      enemy.isGrounded = false;
      enemy.y += enemy.vy;

      // Resolve vertical tile collisions
      const eBoxV = {
        left: enemy.x + 2,
        right: enemy.x + enemy.width - 2,
        top: enemy.y,
        bottom: enemy.y + enemy.height,
      };
      const minColV = Math.max(0, Math.floor(eBoxV.left / CONFIG.TILE_SIZE));
      const maxColV = Math.min(CONFIG.GRID_COLS - 1, Math.floor((eBoxV.right - 0.01) / CONFIG.TILE_SIZE));
      const minRowV = Math.max(0, Math.floor(eBoxV.top / CONFIG.TILE_SIZE));
      const maxRowV = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((eBoxV.bottom - 0.01) / CONFIG.TILE_SIZE));

      for (let r = minRowV; r <= maxRowV; r++) {
        for (let c = minColV; c <= maxColV; c++) {
          if (!this.engine.isSolid(c, r)) continue;
          const tv = this.engine.getTile(c, r);
          const tileTop = r * CONFIG.TILE_SIZE;
          const tileBot = tileTop + CONFIG.TILE_SIZE;
          if (enemy.vy > 0 && eBoxV.bottom > tileTop && (eBoxV.bottom - enemy.vy) <= tileTop) {
            enemy.y = tileTop - enemy.height;
            enemy.vy = 0;
            enemy.isGrounded = true;
            
            if (enemy.type === 'thwomp' && enemy.state === 'falling') {
              enemy.state = 'returning';
              this.engine.cameraShake = 15;
              if (audio.playBreakSound && !this.engine.isSimulation) audio.playBreakSound();
              // Spawn dust around the thwomp base
              if (!this.engine.isSimulation) {
                for(let i=0; i<10; i++){
                  this.engine.spawnLandDust(6); // reusing land dust for big impact
                }
              }
            }

            if (tv === TILE.TRAMPOLINE) {
              enemy.vy = -CONFIG.TRAMPOLINE_BOUNCE_FORCE * 0.85;
              enemy.isGrounded = false;
              if (!this.engine.isSimulation) {
                audio.playBounceSound();
                this.engine.bounceAnims.set(`${c},${r}`, { timer: 15 });
              }
            }

            eBoxV.top = enemy.y;
            eBoxV.bottom = enemy.y + enemy.height;
          } else if (enemy.vy < 0 && eBoxV.top < tileBot && (eBoxV.top - enemy.vy) >= tileBot) {
            enemy.y = tileBot;
            enemy.vy = 0;
            eBoxV.top = enemy.y;
            eBoxV.bottom = enemy.y + enemy.height;
          }
        }
      }

      // ── Lazer AI ─────────────────────────────────────────────────────────
      if (enemy.type === 'lazer') {
        if (!enemy.state) {
          enemy.state = 'idle';
          enemy.timer = 0;
        }
        enemy.timer++;
        
        if (enemy.state === 'idle' && enemy.timer > 120) {
          enemy.state = 'warn';
          enemy.timer = 0;
        } else if (enemy.state === 'warn' && enemy.timer > 40) {
          enemy.state = 'fire';
          enemy.timer = 0;
          if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
          this.engine.cameraShake = 5;
        } else if (enemy.state === 'fire' && enemy.timer > 30) {
          enemy.state = 'idle';
          enemy.timer = 0;
        }

        if (enemy.state === 'warn' || enemy.state === 'fire') {
          // Pre-calculate beam bounds
          enemy.beams = { up: 0, down: 0, left: 0, right: 0 };
          const eCol = Math.floor(enemy.x / CONFIG.TILE_SIZE);
          const eRow = Math.floor(enemy.y / CONFIG.TILE_SIZE);
          let hitReflector = false;

          for (let r = eRow - 1; r >= 0; r--) { 
            if (this.engine.isSolid(eCol, r)) {
              if (this.engine.getTile(eCol, r) === TILE.REFLECTOR) hitReflector = true;
              break; 
            } 
            enemy.beams.up++; 
          }
          for (let r = eRow + 1; r < CONFIG.GRID_ROWS; r++) { 
            if (this.engine.isSolid(eCol, r)) {
              if (this.engine.getTile(eCol, r) === TILE.REFLECTOR) hitReflector = true;
              break; 
            } 
            enemy.beams.down++; 
          }
          for (let c = eCol - 1; c >= 0; c--) { 
            if (this.engine.isSolid(c, eRow)) {
              if (this.engine.getTile(c, eRow) === TILE.REFLECTOR) hitReflector = true;
              break; 
            } 
            enemy.beams.left++; 
          }
          for (let c = eCol + 1; c < CONFIG.GRID_COLS; c++) { 
            if (this.engine.isSolid(c, eRow)) {
              if (this.engine.getTile(c, eRow) === TILE.REFLECTOR) hitReflector = true;
              break; 
            } 
            enemy.beams.right++; 
          }

          if (hitReflector && enemy.state === 'fire') {
            // Instantly destroyed by reflected laser!
            this.engine.liveEnemies.splice(i, 1);
            if (!this.engine.isSimulation && window.audio && window.audio.playEnemyDeathSound) window.audio.playEnemyDeathSound();
            
            // Visual explosion
            this.engine.explosions.push({ col: eCol, row: eRow, timer: 15 });
            continue;
          }

          if (enemy.state === 'fire' && !this.engine.isDead) {
            const pxBox = {
              left: this.engine.player.x + 4, right: this.engine.player.x + this.engine.player.width - 4,
              top: this.engine.player.y + 4, bottom: this.engine.player.y + this.engine.player.height - 4
            };
            
            const bX = enemy.x + 10;
            const bY = enemy.y + 10;
            const bW = 20;
            const bH = 20;

            const checkHit = (rL, rR, rT, rB) => {
               if (pxBox.left < rR && pxBox.right > rL && pxBox.top < rB && pxBox.bottom > rT) {
                 this.engine.killPlayer();
               }
            };

            // Up beam
            checkHit(bX, bX + bW, enemy.y - enemy.beams.up * CONFIG.TILE_SIZE, enemy.y);
            // Down beam
            checkHit(bX, bX + bW, enemy.y + CONFIG.TILE_SIZE, enemy.y + (enemy.beams.down + 1) * CONFIG.TILE_SIZE);
            // Left beam
            checkHit(enemy.x - enemy.beams.left * CONFIG.TILE_SIZE, enemy.x, bY, bY + bH);
            // Right beam
            checkHit(enemy.x + CONFIG.TILE_SIZE, enemy.x + (enemy.beams.right + 1) * CONFIG.TILE_SIZE, bY, bY + bH);
          }
        }
        continue;
      }

      // ── Thwomp AI ─────────────────────────────────────────────────────────
      if (enemy.type === 'thwomp') {
        if (!enemy.state) {
          enemy.state = 'idle';
          enemy.startY = enemy.y;
        }
        if (enemy.state === 'idle') {
          // Check if player is directly below
          const pxC = this.engine.player.x + this.engine.player.width / 2;
          const exC = enemy.x + enemy.width / 2;
          if (Math.abs(pxC - exC) < CONFIG.TILE_SIZE * 1.5 && this.engine.player.y > enemy.y) {
            enemy.state = 'falling';
            enemy.shakeTimer = 0;
          }
        } else if (enemy.state === 'returning') {
          enemy.shakeTimer++;
          if (enemy.shakeTimer > 30) {
            enemy.y -= 2; // slow return
            if (enemy.y <= enemy.startY) {
              enemy.y = enemy.startY;
              enemy.state = 'idle';
            }
          }
        }
        continue; // skip horizontal movement entirely
      }

      // ── Worm AI ───────────────────────────────────────────────────────────
      if (enemy.type === 'worm') {
        if (!enemy.startY) enemy.startY = enemy.y;
        const pxC = this.engine.player.x + this.engine.player.width / 2;
        const exC = enemy.x + enemy.width / 2;
        const dist = Math.abs(pxC - exC);

        if (enemy.wormState === 'hidden') {
          // If player is near (within 3 tiles), pop up
          if (dist < CONFIG.TILE_SIZE * 3) {
            enemy.wormState = 'popping_up';
            if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound(); // Maybe a dirt sound
          }
        } else if (enemy.wormState === 'popping_up') {
          enemy.y -= 2;
          if (enemy.y <= enemy.startY - 38) { // Pop out fully
            enemy.y = enemy.startY - 38;
            enemy.wormState = 'up';
            enemy.wormTimer = 0;
          }
        } else if (enemy.wormState === 'up') {
          enemy.wormTimer++;
          if (enemy.wormTimer > 60) { // Stay up for 1 second
            enemy.wormState = 'popping_down';
          }
        } else if (enemy.wormState === 'popping_down') {
          enemy.y += 2;
          if (enemy.y >= enemy.startY) {
            enemy.y = enemy.startY;
            enemy.wormState = 'hidden';
          }
        }
        
        // Only hit the player if it's popping up or up
        if (enemy.wormState === 'popping_up' || enemy.wormState === 'up') {
          const eBox = {
            left: enemy.x + 4, right: enemy.x + enemy.width - 4,
            top: enemy.y + 4, bottom: enemy.y + enemy.height - 4
          };
          const pBox = {
            left: this.engine.player.x, right: this.engine.player.x + this.engine.player.width,
            top: this.engine.player.y, bottom: this.engine.player.y + this.engine.player.height
          };
          if (!this.engine.isDead && pBox.left < eBox.right && pBox.right > eBox.left &&
              pBox.top < eBox.bottom && pBox.bottom > eBox.top) {
            this.engine.killPlayer();
          }
        }
        
        continue; // skip horizontal movement entirely
      }

      // ── Bat AI ────────────────────────────────────────────────────────────
      if (enemy.type === 'bat') {
        if (!enemy.startY) enemy.startY = enemy.y;
        if (!enemy.startX) enemy.startX = enemy.x;
        
        const pxC = this.engine.player.x + this.engine.player.width / 2;
        const exC = enemy.x + enemy.width / 2;
        const distX = Math.abs(pxC - exC);

        if (enemy.batState === 'sleeping') {
          if (distX < CONFIG.TILE_SIZE * 3 && this.engine.player.y > enemy.y) {
            enemy.batState = 'swooping';
            // Aim at the player's current position plus some lead
            enemy.targetX = this.engine.player.x + (this.engine.player.vx * 10);
            enemy.targetY = this.engine.player.y + 20; // Aim slightly below center
            
            const dx = enemy.targetX - enemy.x;
            const dy = enemy.targetY - enemy.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const speed = 7;
            enemy.vx = (dx / dist) * speed;
            enemy.vy = (dy / dist) * speed;
            if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound(); // Swoop sound
          }
        } else if (enemy.batState === 'swooping') {
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;
          // Check if it reached or passed target Y
          if (enemy.y >= enemy.targetY || enemy.vy <= 0) {
            enemy.batState = 'returning';
          }
          // Floor collision check
          const botRow = Math.floor((enemy.y + enemy.height) / CONFIG.TILE_SIZE);
          const colC = Math.floor((enemy.x + enemy.width/2) / CONFIG.TILE_SIZE);
          if (botRow < CONFIG.GRID_ROWS && botRow >= 0 && colC >= 0 && colC < CONFIG.GRID_COLS) {
            const tv = this.engine.getTile(colC, botRow);
            if (tv === TILE.SOLID || tv === TILE.TRAMPOLINE || tv === TILE.EARTH || tv === TILE.MOVEABLE || tv === TILE.SWITCH) {
              enemy.batState = 'returning';
              enemy.y = botRow * CONFIG.TILE_SIZE - enemy.height;
            }
          }
        } else if (enemy.batState === 'returning') {
          const dx = enemy.startX - enemy.x;
          const dy = enemy.startY - enemy.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 4) {
            enemy.x = enemy.startX;
            enemy.y = enemy.startY;
            enemy.batState = 'sleeping';
            enemy.vx = 0;
            enemy.vy = 0;
          } else {
            const speed = 3;
            enemy.x += (dx / dist) * speed;
            enemy.y += (dy / dist) * speed;
          }
        }
        
        // Bat hit box
        const eBox = { left: enemy.x + 4, right: enemy.x + enemy.width - 4, top: enemy.y + 4, bottom: enemy.y + enemy.height - 4 };
        const pBox = { left: this.engine.player.x, right: this.engine.player.x + this.engine.player.width, top: this.engine.player.y, bottom: this.engine.player.y + this.engine.player.height };
        if (!this.engine.isDead && pBox.left < eBox.right && pBox.right > eBox.left && pBox.top < eBox.bottom && pBox.bottom > eBox.top) {
          this.engine.killPlayer();
        }
        
        // Advance animation
        if (!enemy.batTimer) enemy.batTimer = 0;
        enemy.batTimer++;
        if (enemy.batTimer > (enemy.batState === 'sleeping' ? 15 : 4)) {
          enemy.batTimer = 0;
          enemy.walkFrame = (enemy.walkFrame + 1) % 4; // Flap animation
        }

        continue;
      }

      // ── Mimic Block AI ────────────────────────────────────────────────────────────
      if (enemy.type === 'mimic') {
        const pxC = this.engine.player.x + this.engine.player.width / 2;
        const exC = enemy.x + enemy.width / 2;
        const pYc = this.engine.player.y + this.engine.player.height / 2;
        const eYc = enemy.y + enemy.height / 2;
        const dist = Math.sqrt((pxC-exC)*(pxC-exC) + (pYc-eYc)*(pYc-eYc));

        if (enemy.mimicState === 'disguised') {
          enemy.vx = 0;
          if (dist < CONFIG.TILE_SIZE * 3) {
            enemy.mimicState = 'revealing';
            enemy.mimicTimer = 0;
            if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
          }
        } else if (enemy.mimicState === 'revealing') {
          enemy.vx = 0;
          enemy.mimicTimer++;
          if (enemy.mimicTimer > 30) {
            enemy.mimicState = 'chasing';
          }
        } else if (enemy.mimicState === 'chasing') {
          // Acts like a chaser
          if (this.engine.player.x + this.engine.player.width/2 < enemy.x + enemy.width/2) {
            enemy.vx = -enemy.speed * 1.5; // Fast!
            enemy.facing = 'left';
          } else {
            enemy.vx = enemy.speed * 1.5;
            enemy.facing = 'right';
          }
        }
        
        // Mimic hit box (always deadly)
        const eBox = { left: enemy.x + 4, right: enemy.x + enemy.width - 4, top: enemy.y + 4, bottom: enemy.y + enemy.height - 4 };
        const pBox = { left: this.engine.player.x, right: this.engine.player.x + this.engine.player.width, top: this.engine.player.y, bottom: this.engine.player.y + this.engine.player.height };
        if (!this.engine.isDead && pBox.left < eBox.right && pBox.right > eBox.left && pBox.top < eBox.bottom && pBox.bottom > eBox.top) {
          this.engine.killPlayer();
        }
        
        if (enemy.mimicState === 'disguised' || enemy.mimicState === 'revealing') {
          continue; // skip horizontal movement
        }
      }

      // ── Horizontal patrol (only when on the ground) ────────────────────────
      if (enemy.isGrounded) {
        if (enemy.type === 'chaser') {
          if (this.engine.player.x + this.engine.player.width/2 < enemy.x + enemy.width/2) {
            enemy.vx = -enemy.speed;
            enemy.facing = 'left';
          } else {
            enemy.vx = enemy.speed;
            enemy.facing = 'right';
          }
        }

        // Advance walk animation
        enemy.walkTimer++;
        if (enemy.walkTimer >= 8) {
          enemy.walkTimer = 0;
          enemy.walkFrame = (enemy.walkFrame + 1) % 4;
        }

        enemy.x += enemy.vx;

        // Wall collision: check mid-body row
        const checkY = enemy.y + enemy.height * 0.5;
        const row = Math.floor(checkY / CONFIG.TILE_SIZE);
        // Ground row = row directly below enemy's feet
        const footRow = Math.floor((enemy.y + enemy.height + 1) / CONFIG.TILE_SIZE);

        if (enemy.vx > 0) {
          const rightCol = Math.floor((enemy.x + enemy.width) / CONFIG.TILE_SIZE);
           // Reverse if hitting a wall OR if about to step off an edge
          const wallAhead = this.engine.isSolid(rightCol, row);
          const edgeAhead = !this.engine.isSolid(rightCol, footRow);
          if (wallAhead || edgeAhead) {
            enemy.x = rightCol * CONFIG.TILE_SIZE - enemy.width;
            if (enemy.type === 'chaser') {
              enemy.vy = -6; // Jump!
              enemy.isGrounded = false;
            } else {
              enemy.vx = -enemy.speed;
              enemy.facing = 'left';
            }
          }
        } else {
          const leftCol = Math.floor(enemy.x / CONFIG.TILE_SIZE);
           // Reverse if hitting a wall OR if about to step off an edge
          const wallAhead = this.engine.isSolid(leftCol, row);
          const edgeAhead = !this.engine.isSolid(leftCol, footRow);
          if (wallAhead || edgeAhead) {
            enemy.x = (leftCol + 1) * CONFIG.TILE_SIZE;
            if (enemy.type === 'chaser') {
              enemy.vy = -6; // Jump!
              enemy.isGrounded = false;
            } else {
              enemy.vx = enemy.speed;
              enemy.facing = 'right';
            }
          }
        }

        // Patrol range edges
        if (enemy.type !== 'chaser') {
          if (enemy.patrolLeft >= enemy.patrolRight) {
            enemy.vx = 0;
            enemy.walkFrame = 0;
          } else if (enemy.x <= enemy.patrolLeft) {
            enemy.x = enemy.patrolLeft;
            enemy.vx = enemy.speed;
            enemy.facing = 'right';
          } else if (enemy.x + enemy.width >= enemy.patrolRight) {
            enemy.x = enemy.patrolRight - enemy.width;
            enemy.vx = -enemy.speed;
            enemy.facing = 'left';
          }
        }
      } else {
        // Airborne – freeze walk animation so legs don't flail in the air
        enemy.walkFrame = 0;
      }

      // Reset if enemy falls off the world
      if (enemy.y > CONFIG.GRID_ROWS * CONFIG.TILE_SIZE + 100) {
        enemy.y = enemy.height * -1;
        enemy.vy = 0;
      }
    }

    // Check player collision with any enemy
    this.engine.checkEnemyCollisions();
  }

}
