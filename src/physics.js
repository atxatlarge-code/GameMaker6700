import { CONFIG } from './config.js';
import { TILE } from './tiles.js';
import { audio } from './audio.js';

export class PhysicsEngine {
  constructor(engine) {
    this.engine = engine;
  }

  getTile(col, row) {
    if (this.engine.mode === CONFIG.MODE_PLAY && this.engine.playGrid) {
      if (col < 0 || col >= CONFIG.GRID_COLS || row < 0 || row >= CONFIG.GRID_ROWS) {
        return TILE.SOLID;
      }
      return this.engine.playGrid[row][col];
    }
    return this.engine.level.getTile(col, row);
  }

  isSolid(col, row) {
    const t = this.getTile(col, row);
    // 59 is Reflector Shield
    return t === TILE.SOLID || t === TILE.TRAMPOLINE || t === TILE.EARTH || t === TILE.MOVEABLE || t === TILE.SWITCH || t === TILE.REFLECTOR ||
           t === TILE.PAINT_BLOCK || t === TILE.INVISIBLE_BLOCK || t === TILE.REVEALED_BLOCK || t === TILE.DASH_PANEL_LEFT || t === TILE.DASH_PANEL_RIGHT || t === TILE.CRACKED_BLOCK ||
           t === TILE.SLIME || t === TILE.BREAKABLE || t === TILE.ICE || t === TILE.CONVEYOR_LEFT || t === TILE.CONVEYOR_RIGHT ||
           (t === TILE.BLOCK_RED && this.engine.level.switchState === 'red') || 
           (t === TILE.BLOCK_BLUE && this.engine.level.switchState === 'blue');
  }

  getOverlappingTiles(box) {
    const minCol = Math.max(0, Math.floor(box.left / CONFIG.TILE_SIZE));
    const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((box.right - 0.01) / CONFIG.TILE_SIZE));
    const minRow = Math.max(0, Math.floor(box.top / CONFIG.TILE_SIZE));
    const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((box.bottom - 0.01) / CONFIG.TILE_SIZE));

    const tiles = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tileVal = this.getTile(c, r);
        if (tileVal === TILE.SOLID || tileVal === TILE.TRAMPOLINE || tileVal === TILE.BREAKABLE || tileVal === TILE.EARTH || tileVal === TILE.LOCK || tileVal === TILE.MOVEABLE || tileVal === TILE.SWITCH || tileVal === TILE.ICE || tileVal === TILE.CONVEYOR_LEFT || tileVal === TILE.CONVEYOR_RIGHT || tileVal === TILE.CRUMBLE || tileVal === TILE.DASH_PANEL_LEFT || tileVal === TILE.DASH_PANEL_RIGHT || tileVal === TILE.BOUNCY_MUSHROOM || tileVal === TILE.CRACKED_BLOCK || tileVal === TILE.JUMP_THROUGH || tileVal === TILE.RAMP_RIGHT || tileVal === TILE.RAMP_LEFT || tileVal === TILE.SLIME || tileVal === TILE.INVISIBLE_BLOCK || tileVal === TILE.PAINT_BLOCK || tileVal === TILE.REVEALED_BLOCK || tileVal === TILE.REFLECTOR) {
          tiles.push({ col: c, row: r, type: tileVal });
        } else if (tileVal === TILE.BLOCK_RED && this.engine.level.switchState === 'red') {
          tiles.push({ col: c, row: r, type: TILE.BLOCK_RED });
        } else if (tileVal === TILE.BLOCK_BLUE && this.engine.level.switchState === 'blue') {
          tiles.push({ col: c, row: r, type: TILE.BLOCK_BLUE });
        } else if (tileVal === TILE.GHOST_BLOCK) {
          tiles.push({ col: c, row: r, type: TILE.GHOST_BLOCK });
        } else if (tileVal === TILE.DASH_PANEL_RIGHT) {
          tiles.push({ col: c, row: r, type: TILE.DASH_PANEL_RIGHT });
        } else if (tileVal === TILE.CHECKPOINT) {
          tiles.push({ col: c, row: r, type: TILE.CHECKPOINT });
        } else if (tileVal === TILE.SPEED_BOOST) {
          tiles.push({ col: c, row: r, type: TILE.SPEED_BOOST });
        } else if (tileVal === TILE.DASH_POWERUP || tileVal === TILE.MAGNETIC_BOOTS || tileVal === TILE.GRAPPLE_POWERUP || tileVal === TILE.STOPWATCH || tileVal === TILE.BOMB_POWERUP) {
          tiles.push({ col: c, row: r, type: tileVal });
        } else if (tileVal === TILE.CANNON) {
          tiles.push({ col: c, row: r, type: TILE.CANNON });
        } else if (tileVal >= TILE.DOUBLE_JUMP && tileVal <= 110) {
          // Catch-all for new powerups (100-110)
          tiles.push({ col: c, row: r, type: tileVal });
        }
      }
    }
    return tiles;
  }

  resolveHorizontalCollisions() {
    const playerBox = {
      left: this.engine.player.x,
      right: this.engine.player.x + this.engine.player.width,
      top: this.engine.player.y,
      bottom: this.engine.player.y + this.engine.player.height,
    };

    const tiles = this.getOverlappingTiles(playerBox);

    for (const tile of tiles) {
      if (tile.type === TILE.SWITCH) {
        if (!this.engine.switchCooldown) {
          this.engine.level.switchState = this.engine.level.switchState === 'red' ? 'blue' : 'red';
          this.engine.switchCooldown = 20;
          if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
        }
      }
      if (tile.type === TILE.LOCK) {
        if (this.engine.hasKey) {
          this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
          this.engine.hasKey = false;
          if (!this.engine.isSimulation && audio.playBreakSound) audio.playBreakSound();
          this.engine.spawnJumpDust();
          continue;
        }
      }
      if (tile.type === TILE.GHOST_BLOCK) {
        this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
        this.engine.player.hasSpringBoots = true;
        this.engine.spawnJumpDust();
        if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === TILE.DASH_PANEL_RIGHT) {
        this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
        this.engine.player.hasDoubleJump = true;
        this.engine.spawnJumpDust();
        if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === TILE.SHRINK_POTION) {
        this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
        this.engine.player.isShrunk = true;
        // Shrink player
        this.engine.player.width = Math.max(10, this.engine.player.baseWidth * 0.5);
        this.engine.player.height = Math.max(10, this.engine.player.baseHeight * 0.5);
        this.engine.player.y += this.engine.player.baseHeight - this.engine.player.height;
        this.engine.spawnJumpDust();
        if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === TILE.CHECKPOINT) {
        // Collect checkpoint
        this.engine.level.playerSpawn = { col: tile.col, row: tile.row };
        // We do NOT remove the tile so they can see they got it, 
        // or we could replace it with a "checked" flag tile. Let's just remove it and spawn dust!
        this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
        this.engine.spawnJumpDust();
        if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === TILE.SPEED_BOOST) {
        this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
        this.engine.player.hasSpeedBoost = true;
        this.engine.spawnJumpDust();
        if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === TILE.DASH_POWERUP) {
        this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
        this.engine.player.hasDash = true;
        this.engine.spawnJumpDust();
        if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === TILE.MAGNETIC_BOOTS) {
        this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
        this.engine.player.hasMagneticBoots = true;
        this.engine.spawnJumpDust();
        if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === TILE.GRAPPLE_POWERUP) {
        this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
        this.engine.player.hasGrapple = true;
        this.engine.spawnJumpDust();
        if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === TILE.STOPWATCH) {
        this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
        this.engine.timeFreezeTimer = 180; // 3 seconds
        this.engine.spawnJumpDust();
        if (!this.engine.isSimulation && audio.playPowerupSound) audio.playPowerupSound();
        continue;
      }
      if (tile.type === TILE.BOMB_POWERUP) {
        this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
        this.engine.player.hasBombs = true;
        this.engine.spawnJumpDust();
        if (!this.engine.isSimulation && audio.playPowerupSound) audio.playPowerupSound();
        continue;
      }

      if (tile.type === TILE.MOVEABLE) {
        if (this.engine.player.vx > 0) {
          if (this.getTile(tile.col + 1, tile.row) === TILE.EMPTY) {
            this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
            this.engine.setTile(tile.col + 1, tile.row, TILE.MOVEABLE);
            this.engine.spawnJumpDust();
            if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
            continue;
          }
        } else if (this.engine.player.vx < 0) {
          if (this.getTile(tile.col - 1, tile.row) === TILE.EMPTY) {
            this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
            this.engine.setTile(tile.col - 1, tile.row, TILE.MOVEABLE);
            this.engine.spawnJumpDust();
            if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
            continue;
          }
        }
      }
      const tileLeft = tile.col * CONFIG.TILE_SIZE;
      const tileRight = tileLeft + CONFIG.TILE_SIZE;

      if (tile.type === TILE.CANNON) {
        if (!this.engine.player.isInsideCannon && this.engine.player.cannonCooldown <= 0) {
          this.engine.player.isInsideCannon = true;
          this.engine.player.cannonAngle = Math.PI / 2; // Pointing up
          this.engine.player.cannonDir = 1;
          this.engine.player.x = tile.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.engine.player.width) / 2;
          this.engine.player.y = tile.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.engine.player.height) / 2;
          this.engine.player.vx = 0;
          this.engine.player.vy = 0;
          if (!this.engine.isSimulation && window.audio && audio.playTileSound) audio.playTileSound();
        }
        continue;
      }

      if (tile.type === TILE.JUMP_THROUGH || tile.type === TILE.RAMP_RIGHT || tile.type === TILE.RAMP_LEFT) continue; // Jump-through platforms and slopes don't block horizontally

      if (this.engine.player.vx > 0) {
        // Moving right
        if (playerBox.right > tileLeft && playerBox.left < tileLeft) {
          this.engine.player.x = tileLeft - this.engine.player.width;
          this.engine.player.vx = 0;
          playerBox.left = this.engine.player.x;
          playerBox.right = this.engine.player.x + this.engine.player.width;
        }
      } else if (this.engine.player.vx < 0) {
        // Moving left
        if (playerBox.left < tileRight && playerBox.right > tileRight) {
          this.engine.player.x = tileRight;
          this.engine.player.vx = 0;
          playerBox.left = this.engine.player.x;
          playerBox.right = this.engine.player.x + this.engine.player.width;
        }
      }
    }
  }

  resolveVerticalCollisions() {
    const playerBox = {
      left: this.engine.player.x,
      right: this.engine.player.x + this.engine.player.width,
      top: this.engine.player.y,
      bottom: this.engine.player.y + this.engine.player.height,
    };

    const tiles = this.getOverlappingTiles(playerBox);

    for (const tile of tiles) {
      if (tile.type === TILE.SWITCH) {
        if (!this.engine.switchCooldown) {
          this.engine.level.switchState = this.engine.level.switchState === 'red' ? 'blue' : 'red';
          this.engine.switchCooldown = 20;
          if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
        }
      }
      if (tile.type === TILE.LOCK) {
        if (this.engine.hasKey) {
          this.engine.setTile(tile.col, tile.row, TILE.EMPTY);
          this.engine.hasKey = false;
          if (!this.engine.isSimulation && audio.playBreakSound) audio.playBreakSound();
          this.engine.spawnJumpDust();
          continue;
        }
      }
      const tileTop = tile.row * CONFIG.TILE_SIZE;
      const tileBottom = tileTop + CONFIG.TILE_SIZE;

      if (tile.type === TILE.CANNON) {
        if (!this.engine.player.isInsideCannon && this.engine.player.cannonCooldown <= 0) {
          this.engine.player.isInsideCannon = true;
          this.engine.player.cannonAngle = Math.PI / 2; // Pointing up
          this.engine.player.cannonDir = 1;
          this.engine.player.x = tile.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.engine.player.width) / 2;
          this.engine.player.y = tile.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.engine.player.height) / 2;
          this.engine.player.vx = 0;
          this.engine.player.vy = 0;
          if (!this.engine.isSimulation && window.audio && audio.playTileSound) audio.playTileSound();
        }
        continue;
      }

      if (this.engine.player.vy >= 0) {
        // Falling down
        if (tile.type === TILE.JUMP_THROUGH) {
          if (this.engine.keys && this.engine.keys.down) continue; // Drop down
          if (playerBox.bottom - this.engine.player.vy > tileTop + 0.1) continue; // Was already below top of tile
        }

        let effectiveTileTop = tileTop;
        if (tile.type === TILE.RAMP_RIGHT) { // Ramp Right (/)
          const intersectX = playerBox.right - (tile.col * CONFIG.TILE_SIZE);
          if (intersectX >= 0 && intersectX <= CONFIG.TILE_SIZE) {
            effectiveTileTop = tileBottom - intersectX;
          } else if (intersectX > CONFIG.TILE_SIZE) {
            effectiveTileTop = tileTop;
          } else {
            effectiveTileTop = tileBottom;
          }
        } else if (tile.type === TILE.RAMP_LEFT) { // Ramp Left (\)
          const intersectX = playerBox.left - (tile.col * CONFIG.TILE_SIZE);
          if (intersectX >= 0 && intersectX <= CONFIG.TILE_SIZE) {
            effectiveTileTop = tileTop + intersectX;
          } else if (intersectX > CONFIG.TILE_SIZE) {
            effectiveTileTop = tileBottom;
          } else {
            effectiveTileTop = tileTop;
          }
        }

        if (playerBox.bottom > effectiveTileTop && playerBox.top < effectiveTileTop) {
          // If we weren't grounded before, trigger a land squish!
          if (!this.engine.player.isGrounded && this.engine.player.vy > 1.5 && tile.type !== TILE.RAMP_RIGHT && tile.type !== TILE.RAMP_LEFT) {
            this.engine.player.landSquishTimer = 10;
            this.engine.spawnLandDust(this.engine.player.vy);
          }
          this.engine.player.y = effectiveTileTop - this.engine.player.height;
          
          if (this.engine.player.charId === 'ball') {
            this.engine.player.vy = Math.min(-6, -this.engine.player.vy * 0.85);
            this.engine.player.isGrounded = false;
            this.engine.player.jumpStretchTimer = 10;
            if (!this.engine.isSimulation && this.engine.player.vy < -2) audio.playBounceSound();
          } else {
            this.engine.player.vy = 0;
            this.engine.player.isGrounded = true;
            if (typeof this.engine.applyGroundEffects === 'function') {
              this.engine.applyGroundEffects();
            }

            if (this.engine.player.hasDoubleJump) this.engine.player.doubleJumpAvailable = true;
            this.engine.player.coyoteTimer = CONFIG.COYOTE_TIME;
          }

          playerBox.top = this.engine.player.y;
          playerBox.bottom = this.engine.player.y + this.engine.player.height;

          if (tile.type === TILE.TRAMPOLINE || tile.type === TILE.BOUNCY_MUSHROOM) {
            this.engine.player.vy = tile.type === TILE.BOUNCY_MUSHROOM ? -22 : -CONFIG.TRAMPOLINE_BOUNCE_FORCE;
            this.engine.player.isGrounded = false;
            this.engine.player.jumpStretchTimer = 14;
            this.engine.player.landSquishTimer = 0;
            this.engine.spawnJumpDust(); // extra dust burst on trampoline!
            
            if (!this.engine.isSimulation) {
              audio.playBounceSound();
              this.engine.bounceAnims.set(`${tile.col},${tile.row}`, { timer: 15 });
            }
          } else if (tile.type === TILE.CRUMBLE) {
            const key = `${tile.col},${tile.row}`;
            if (!this.engine.crumblingTiles.has(key)) {
              this.engine.crumblingTiles.set(key, { state: 'shaking', timer: 60 });
            }
          }
        }
      } else if (this.engine.player.vy < 0) {
        if (tile.type === TILE.JUMP_THROUGH || tile.type === TILE.RAMP_RIGHT || tile.type === TILE.RAMP_LEFT) continue; // Don't block jumping up through platforms or slopes
        // Jumping up
        if (playerBox.top < tileBottom && playerBox.bottom > tileBottom) {
          this.engine.player.y = tileBottom;
          this.engine.player.vy = 0;
          playerBox.top = this.engine.player.y;
          playerBox.bottom = this.engine.player.y + this.engine.player.height;

          if (tile.type === TILE.BREAKABLE) {
            this.engine.breakBlock(tile.col, tile.row);
          } else if (tile.type === TILE.PAINT_BLOCK) {
            // Paint Block hit from below!
            this.engine.setTile(tile.col, tile.row, TILE.EMPTY); // Destroy the paint block
            if (!this.engine.isSimulation && window.audio && audio.playBreakSound) audio.playBreakSound();
            
            // Explosion particles
            if (!this.engine.isSimulation) {
              const colors = ['#06b6d4', '#d946ef', '#eab308', '#f8fafc'];
              for (let i = 0; i < 20; i++) {
                this.engine.dustParticles.push({
                  x: tile.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2 + (Math.random() - 0.5) * 10,
                  y: tile.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2 + (Math.random() - 0.5) * 10,
                  vx: (Math.random() - 0.5) * 8,
                  vy: (Math.random() - 0.5) * 8,
                  radius: 3 + Math.random() * 4,
                  alpha: 1.0,
                  decay: 0.02 + Math.random() * 0.02,
                  color: colors[Math.floor(Math.random() * colors.length)],
                  isSquare: false,
                });
              }
            }

            // Reveal invisible blocks within a 4-tile radius
            const radius = 4;
            const cx = tile.col;
            const cy = tile.row;
            for (let r = Math.max(0, cy - radius); r <= Math.min(CONFIG.GRID_ROWS - 1, cy + radius); r++) {
              for (let c = Math.max(0, cx - radius); c <= Math.min(CONFIG.GRID_COLS - 1, cx + radius); c++) {
                if (this.getTile(c, r) === TILE.INVISIBLE_BLOCK) {
                  const dist = Math.sqrt(Math.pow(c - cx, 2) + Math.pow(r - cy, 2));
                  if (dist <= radius) {
                    this.engine.setTile(c, r, TILE.REVEALED_BLOCK); // Turn into Revealed Block
                  }
                }
              }
            }
          }
        }
      }
    }
  }

}
