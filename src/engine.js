import { CONFIG } from './config.js';
import { audio } from './audio.js';

export class Engine {
  constructor(canvas, level, editor, assets, onWin) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = level;
    this.editor = editor;
    this.assets = assets;
    this.onWin = onWin;

    this.mode = CONFIG.MODE_EDIT;
    this.isRunning = false;
    this.hasWon = false;

    this.camera = { x: 0, y: 0 };
    this.panKeys = { up: false, down: false, left: false, right: false };

    // Pass engine reference to editor for camera coordinate offsets
    this.editor.initEngine(this);

    // Player physics entity (slightly smaller than tile size for smooth sliding)
    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      width: 32,
      height: 38,
      isGrounded: false,
      facing: 'right',
    };

    this.isDead = false;
    this.deathTimer = 0;
    this.deathParticles = [];
    this.portalCooldown = 0;
    this.teleportParticles = [];

    this.keys = {
      left: false,
      right: false,
      up: false,
    };

    this.bounceAnims = new Map();

    this.initListeners();
    this.resetPlayer();
  }

  setMode(mode) {
    this.mode = mode;
    const panControls = document.getElementById('pan-controls');
    if (mode === CONFIG.MODE_PLAY) {
      if (panControls) panControls.classList.add('hidden');
      this.resetPlayer();
      this.hasWon = false;
    } else {
      if (panControls) panControls.classList.remove('hidden');
    }
    this.keys = { left: false, right: false, up: false };
    this.panKeys = { up: false, down: false, left: false, right: false };
  }

  resetPlayer() {
    // Spawn player centered horizontally in their tile
    this.player.x = this.level.playerSpawn.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.width) / 2;
    this.player.y = this.level.playerSpawn.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.height);
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = false;
    this.player.facing = 'right';
    this.isDead = false;
    this.deathTimer = 0;
    this.deathParticles = [];
    this.portalCooldown = 0;
    this.teleportParticles = [];

    // Center camera near player spawn when resetting
    const maxCamX = Math.max(0, CONFIG.GRID_COLS * CONFIG.TILE_SIZE - CONFIG.CANVAS_WIDTH);
    const maxCamY = Math.max(0, CONFIG.GRID_ROWS * CONFIG.TILE_SIZE - CONFIG.CANVAS_HEIGHT);
    const targetX = this.player.x + this.player.width / 2 - CONFIG.CANVAS_WIDTH / 2;
    const targetY = this.player.y + this.player.height / 2 - CONFIG.CANVAS_HEIGHT / 2;
    this.camera.x = Math.max(0, Math.min(maxCamX, targetX));
    this.camera.y = Math.max(0, Math.min(maxCamY, targetY));
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (this.mode === CONFIG.MODE_EDIT) {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.panKeys.up = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') this.panKeys.down = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.panKeys.left = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') this.panKeys.right = true;
        return;
      }
      if (this.mode !== CONFIG.MODE_PLAY || this.hasWon) return;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        if (this.player.isGrounded) {
          this.player.vy = -CONFIG.JUMP_FORCE;
          this.player.isGrounded = false;
          audio.playJumpSound();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.mode === CONFIG.MODE_EDIT) {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.panKeys.up = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') this.panKeys.down = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.panKeys.left = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') this.panKeys.right = false;
        return;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
    });

    // Pan Buttons Mouse Listeners
    const panBtns = document.querySelectorAll('.pan-btn');
    panBtns.forEach((btn) => {
      btn.addEventListener('mousedown', () => {
        const dir = btn.getAttribute('data-dir');
        if (dir) this.panKeys[dir] = true;
      });
      btn.addEventListener('mouseup', () => {
        const dir = btn.getAttribute('data-dir');
        if (dir) this.panKeys[dir] = false;
      });
      btn.addEventListener('mouseleave', () => {
        const dir = btn.getAttribute('data-dir');
        if (dir) this.panKeys[dir] = false;
      });
    });
  }

  start() {
    if (!this.isRunning) {
      this.isRunning = true;
      requestAnimationFrame(() => this.loop());
    }
  }

  updateCamera() {
    const maxCamX = Math.max(0, CONFIG.GRID_COLS * CONFIG.TILE_SIZE - CONFIG.CANVAS_WIDTH);
    const maxCamY = Math.max(0, CONFIG.GRID_ROWS * CONFIG.TILE_SIZE - CONFIG.CANVAS_HEIGHT);

    if (this.mode === CONFIG.MODE_EDIT) {
      const speed = CONFIG.CAMERA_PAN_SPEED || 12;
      let camMoved = false;
      if (this.panKeys.left && this.camera.x > 0) { this.camera.x -= speed; camMoved = true; }
      if (this.panKeys.right && this.camera.x < maxCamX) { this.camera.x += speed; camMoved = true; }
      if (this.panKeys.up && this.camera.y > 0) { this.camera.y -= speed; camMoved = true; }
      if (this.panKeys.down && this.camera.y < maxCamY) { this.camera.y += speed; camMoved = true; }

      this.camera.x = Math.max(0, Math.min(maxCamX, this.camera.x));
      this.camera.y = Math.max(0, Math.min(maxCamY, this.camera.y));

      if (camMoved && this.editor) {
        this.editor.updateHover();
        if (this.editor.isMouseDown) {
          this.editor.handleInput();
        }
      }
    } else if (this.mode === CONFIG.MODE_PLAY) {
      // Smoothly track player
      const targetX = this.player.x + this.player.width / 2 - CONFIG.CANVAS_WIDTH / 2;
      const targetY = this.player.y + this.player.height / 2 - CONFIG.CANVAS_HEIGHT / 2;
      this.camera.x += (targetX - this.camera.x) * 0.1;
      this.camera.y += (targetY - this.camera.y) * 0.1;

      this.camera.x = Math.max(0, Math.min(maxCamX, this.camera.x));
      this.camera.y = Math.max(0, Math.min(maxCamY, this.camera.y));
    }
  }

  loop() {
    if (this.mode === CONFIG.MODE_PLAY && !this.hasWon) {
      this.update();
    }
    this.updateCamera();
    this.render();
    if (this.isRunning) {
      requestAnimationFrame(() => this.loop());
    }
  }

  update() {
    if (this.isDead) {
      this.deathTimer -= 1;
      this.deathParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = Math.max(0, p.alpha - 0.025);
      });
      if (this.deathTimer <= 0) {
        this.resetPlayer();
      }
      return;
    }

    // Update bounce animation timers
    for (const [key, anim] of this.bounceAnims.entries()) {
      anim.timer -= 1;
      if (anim.timer <= 0) {
        this.bounceAnims.delete(key);
      }
    }

    if (this.portalCooldown > 0) {
      this.portalCooldown -= 1;
    }

    // Update teleport particles
    this.teleportParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = Math.max(0, p.alpha - 0.03);
    });
    this.teleportParticles = this.teleportParticles.filter(p => p.alpha > 0);

    // Horizontal Movement
    if (this.keys.left) {
      this.player.vx = -CONFIG.MOVE_SPEED;
      this.player.facing = 'left';
    } else if (this.keys.right) {
      this.player.vx = CONFIG.MOVE_SPEED;
      this.player.facing = 'right';
    } else {
      this.player.vx *= CONFIG.FRICTION;
      if (Math.abs(this.player.vx) < 0.1) this.player.vx = 0;
    }

    // Apply Gravity
    this.player.vy += CONFIG.GRAVITY;
    if (this.player.vy > 12) this.player.vy = 12; // Terminal velocity

    // Handle Horizontal Collisions First
    this.player.x += this.player.vx;
    this.resolveHorizontalCollisions();

    // Handle Vertical Collisions Next
    this.player.isGrounded = false;
    this.player.y += this.player.vy;
    this.resolveVerticalCollisions();

    // Check Win Condition
    this.checkWinCondition();

    // Check Hazards
    this.checkHazards();

    // Check Portals
    this.checkPortals();

    // Boundary check (if player falls off world bottom, reset)
    if (this.player.y > CONFIG.GRID_ROWS * CONFIG.TILE_SIZE + 100) {
      this.resetPlayer();
    }
  }

  checkPortals() {
    if (this.isDead || this.hasWon || this.portalCooldown > 0) return;
    if (!this.level.portal1 || !this.level.portal2) return;

    const playerBox = {
      left: this.player.x,
      right: this.player.x + this.player.width,
      top: this.player.y,
      bottom: this.player.y + this.player.height,
    };

    const p1Box = {
      left: this.level.portal1.col * CONFIG.TILE_SIZE,
      right: this.level.portal1.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
      top: this.level.portal1.row * CONFIG.TILE_SIZE,
      bottom: this.level.portal1.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
    };

    const p2Box = {
      left: this.level.portal2.col * CONFIG.TILE_SIZE,
      right: this.level.portal2.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
      top: this.level.portal2.row * CONFIG.TILE_SIZE,
      bottom: this.level.portal2.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
    };

    const isOverlapping1 = !(
      playerBox.right < p1Box.left ||
      playerBox.left > p1Box.right ||
      playerBox.bottom < p1Box.top ||
      playerBox.top > p1Box.bottom
    );

    const isOverlapping2 = !(
      playerBox.right < p2Box.left ||
      playerBox.left > p2Box.right ||
      playerBox.bottom < p2Box.top ||
      playerBox.top > p2Box.bottom
    );

    if (isOverlapping1) {
      this.teleportPlayer(this.level.portal1, this.level.portal2, '#06b6d4', '#ec4899');
    } else if (isOverlapping2) {
      this.teleportPlayer(this.level.portal2, this.level.portal1, '#ec4899', '#06b6d4');
    }
  }

  teleportPlayer(fromPortal, toPortal, fromColor, toColor) {
    audio.playPortalSound();
    this.portalCooldown = 30;

    // Spawn departure particles
    this.spawnTeleportParticles(fromPortal.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2, fromPortal.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2, fromColor);
    
    // Teleport player
    this.player.x = toPortal.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.width) / 2;
    this.player.y = toPortal.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.height);
    this.player.vx = 0;
    this.player.vy = 0;

    // Spawn arrival particles
    this.spawnTeleportParticles(toPortal.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2, toPortal.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE/2, toColor);
  }

  spawnTeleportParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 5;
      this.teleportParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: color,
        alpha: 1,
      });
    }
  }

  checkHazards() {
    if (this.isDead || this.hasWon) return;

    const inset = 6;
    const hazardBox = {
      left: this.player.x + inset,
      right: this.player.x + this.player.width - inset,
      top: this.player.y + inset,
      bottom: this.player.y + this.player.height - inset,
    };

    const minCol = Math.max(0, Math.floor(hazardBox.left / CONFIG.TILE_SIZE));
    const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((hazardBox.right - 0.01) / CONFIG.TILE_SIZE));
    const minRow = Math.max(0, Math.floor(hazardBox.top / CONFIG.TILE_SIZE));
    const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((hazardBox.bottom - 0.01) / CONFIG.TILE_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tileVal = this.level.getTile(c, r);
        if (tileVal === 3 || tileVal === 4) {
          this.killPlayer();
          return;
        }
      }
    }
  }

  killPlayer() {
    if (this.isDead || this.hasWon) return;
    this.isDead = true;
    this.deathTimer = 40;
    this.deathParticles = [];
    audio.playDeathSound();

    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;

    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.deathParticles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: Math.random() > 0.5 ? '#d4a359' : '#cc635e',
        alpha: 1,
      });
    }
  }

  getOverlappingTiles(box) {
    const minCol = Math.max(0, Math.floor(box.left / CONFIG.TILE_SIZE));
    const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((box.right - 0.01) / CONFIG.TILE_SIZE));
    const minRow = Math.max(0, Math.floor(box.top / CONFIG.TILE_SIZE));
    const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((box.bottom - 0.01) / CONFIG.TILE_SIZE));

    const tiles = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tileVal = this.level.getTile(c, r);
        if (tileVal === 1 || tileVal === 2) {
          tiles.push({ col: c, row: r, type: tileVal });
        }
      }
    }
    return tiles;
  }

  resolveHorizontalCollisions() {
    const playerBox = {
      left: this.player.x,
      right: this.player.x + this.player.width,
      top: this.player.y,
      bottom: this.player.y + this.player.height,
    };

    const tiles = this.getOverlappingTiles(playerBox);

    for (const tile of tiles) {
      const tileLeft = tile.col * CONFIG.TILE_SIZE;
      const tileRight = tileLeft + CONFIG.TILE_SIZE;

      if (this.player.vx > 0) {
        // Moving right
        if (playerBox.right > tileLeft && playerBox.left < tileLeft) {
          this.player.x = tileLeft - this.player.width;
          this.player.vx = 0;
          playerBox.left = this.player.x;
          playerBox.right = this.player.x + this.player.width;
        }
      } else if (this.player.vx < 0) {
        // Moving left
        if (playerBox.left < tileRight && playerBox.right > tileRight) {
          this.player.x = tileRight;
          this.player.vx = 0;
          playerBox.left = this.player.x;
          playerBox.right = this.player.x + this.player.width;
        }
      }
    }
  }

  resolveVerticalCollisions() {
    const playerBox = {
      left: this.player.x,
      right: this.player.x + this.player.width,
      top: this.player.y,
      bottom: this.player.y + this.player.height,
    };

    const tiles = this.getOverlappingTiles(playerBox);

    for (const tile of tiles) {
      const tileTop = tile.row * CONFIG.TILE_SIZE;
      const tileBottom = tileTop + CONFIG.TILE_SIZE;

      if (this.player.vy > 0) {
        // Falling down
        if (playerBox.bottom > tileTop && playerBox.top < tileTop) {
          this.player.y = tileTop - this.player.height;
          this.player.vy = 0;
          this.player.isGrounded = true;
          playerBox.top = this.player.y;
          playerBox.bottom = this.player.y + this.player.height;

          if (tile.type === 2) {
            this.player.vy = -CONFIG.TRAMPOLINE_BOUNCE_FORCE;
            this.player.isGrounded = false;
            audio.playBounceSound();
            this.bounceAnims.set(`${tile.col},${tile.row}`, { timer: 15 });
          }
        }
      } else if (this.player.vy < 0) {
        // Jumping up
        if (playerBox.top < tileBottom && playerBox.bottom > tileBottom) {
          this.player.y = tileBottom;
          this.player.vy = 0;
          playerBox.top = this.player.y;
          playerBox.bottom = this.player.y + this.player.height;
        }
      }
    }
  }

  checkWinCondition() {
    if (this.hasWon) return;

    const playerBox = {
      left: this.player.x,
      right: this.player.x + this.player.width,
      top: this.player.y,
      bottom: this.player.y + this.player.height,
    };

    const goalBox = {
      left: this.level.goalPos.col * CONFIG.TILE_SIZE,
      right: this.level.goalPos.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
      top: this.level.goalPos.row * CONFIG.TILE_SIZE,
      bottom: this.level.goalPos.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
    };

    const isOverlapping = !(
      playerBox.right < goalBox.left ||
      playerBox.left > goalBox.right ||
      playerBox.bottom < goalBox.top ||
      playerBox.top > goalBox.bottom
    );

    if (isOverlapping) {
      this.hasWon = true;
      if (this.onWin) this.onWin();
    }
  }

  render() {
    // Clear Canvas
    this.ctx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    this.ctx.save();
    this.ctx.translate(-Math.floor(this.camera.x), -Math.floor(this.camera.y));

    // 1. Render Level Grid (only tiles in or near view)
    const minCol = Math.max(0, Math.floor(this.camera.x / CONFIG.TILE_SIZE));
    const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((this.camera.x + CONFIG.CANVAS_WIDTH) / CONFIG.TILE_SIZE));
    const minRow = Math.max(0, Math.floor(this.camera.y / CONFIG.TILE_SIZE));
    const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((this.camera.y + CONFIG.CANVAS_HEIGHT) / CONFIG.TILE_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tileVal = this.level.getTile(c, r);
        const x = c * CONFIG.TILE_SIZE;
        const y = r * CONFIG.TILE_SIZE;

        if (tileVal === 1) {
          if (this.assets.ground) {
            this.ctx.drawImage(this.assets.ground, x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = '#528c46';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
        } else if (tileVal === 2) {
          this.ctx.save();
          const anim = this.bounceAnims.get(`${c},${r}`);
          if (anim) {
            const progress = anim.timer / 15; // 1 to 0
            const scaleY = 1 - 0.3 * progress * Math.sin((1 - progress) * Math.PI * 3);
            const scaleX = 1 + 0.2 * progress * Math.sin((1 - progress) * Math.PI * 3);

            this.ctx.translate(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE);
            this.ctx.scale(scaleX, scaleY);
            this.ctx.translate(-(x + CONFIG.TILE_SIZE / 2), -(y + CONFIG.TILE_SIZE));
          }

          if (this.assets.trampoline) {
            this.ctx.drawImage(this.assets.trampoline, x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = '#cc635e';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
          this.ctx.restore();
        } else if (tileVal === 3) {
          // Render Fire
          this.ctx.save();
          this.ctx.translate(x, y);
          if (this.assets.fire) {
            this.ctx.drawImage(this.assets.fire, 0, 0, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            const time = Date.now() * 0.005;
            // Glowing embers
            const glow = this.ctx.createRadialGradient(CONFIG.TILE_SIZE/2, CONFIG.TILE_SIZE, 5, CONFIG.TILE_SIZE/2, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            glow.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
            glow.addColorStop(1, 'rgba(255, 0, 0, 0)');
            this.ctx.fillStyle = glow;
            this.ctx.fillRect(0, 0, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);

            // 3 animated flame peaks
            const flames = [
              { x: 4, baseW: 12, height: 26, freq: 2, phase: 0, col: '#ff3b30' },
              { x: 14, baseW: 14, height: 32, freq: 2.5, phase: 1, col: '#ff9500' },
              { x: 24, baseW: 12, height: 28, freq: 3, phase: 2, col: '#ffd60a' },
            ];
            flames.forEach(f => {
              const flameH = f.height + Math.sin(time * f.freq + f.phase) * 6;
              const tipX = f.x + f.baseW/2 + Math.cos(time * f.freq * 0.8 + f.phase) * 4;
              
              this.ctx.fillStyle = f.col;
              this.ctx.beginPath();
              this.ctx.moveTo(f.x, CONFIG.TILE_SIZE);
              this.ctx.quadraticCurveTo(f.x + f.baseW/4, CONFIG.TILE_SIZE - flameH/2, tipX, CONFIG.TILE_SIZE - flameH);
              this.ctx.quadraticCurveTo(f.x + f.baseW*0.75, CONFIG.TILE_SIZE - flameH/2, f.x + f.baseW, CONFIG.TILE_SIZE);
              this.ctx.closePath();
              this.ctx.fill();
            });
          }
          this.ctx.restore();
        } else if (tileVal === 4) {
          // Render Spikes
          this.ctx.save();
          this.ctx.translate(x, y);
          if (this.assets.spikes) {
            this.ctx.drawImage(this.assets.spikes, 0, 0, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            // Base
            this.ctx.fillStyle = '#3a3d45';
            this.ctx.fillRect(0, CONFIG.TILE_SIZE - 8, CONFIG.TILE_SIZE, 8);
            
            // 4 Spike teeth
            const spikeWidth = CONFIG.TILE_SIZE / 4;
            for (let i = 0; i < 4; i++) {
              const sx = i * spikeWidth;
              const grad = this.ctx.createLinearGradient(sx, CONFIG.TILE_SIZE - 8, sx + spikeWidth / 2, CONFIG.TILE_SIZE - 32);
              grad.addColorStop(0, '#717782');
              grad.addColorStop(1, '#dbe2ef');
              this.ctx.fillStyle = grad;
              this.ctx.beginPath();
              this.ctx.moveTo(sx, CONFIG.TILE_SIZE - 8);
              this.ctx.lineTo(sx + spikeWidth / 2, CONFIG.TILE_SIZE - 32);
              this.ctx.lineTo(sx + spikeWidth, CONFIG.TILE_SIZE - 8);
              this.ctx.closePath();
              this.ctx.fill();
              
              this.ctx.strokeStyle = '#ffffff';
              this.ctx.lineWidth = 1;
              this.ctx.beginPath();
              this.ctx.moveTo(sx + spikeWidth / 2, CONFIG.TILE_SIZE - 32);
              this.ctx.lineTo(sx + spikeWidth, CONFIG.TILE_SIZE - 8);
              this.ctx.stroke();
            }
          }
          this.ctx.restore();
        }
      }
    }

    // 2. Render Goal Doorway
    const gx = this.level.goalPos.col * CONFIG.TILE_SIZE;
    const gy = this.level.goalPos.row * CONFIG.TILE_SIZE;
    if (this.assets.goal) {
      this.ctx.drawImage(this.assets.goal, gx, gy, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
    } else {
      this.ctx.fillStyle = '#e8b76c';
      this.ctx.fillRect(gx, gy, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
    }

    // Render Portals if they exist
    const time = Date.now() * 0.003;
    const renderPortal = (portal, color1, color2) => {
      const cx = portal.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      const cy = portal.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      
      this.ctx.save();
      this.ctx.translate(cx, cy);

      // Outer glow
      const glow = this.ctx.createRadialGradient(0, 0, 5, 0, 0, CONFIG.TILE_SIZE);
      glow.addColorStop(0, color1);
      glow.addColorStop(0.5, color2);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, CONFIG.TILE_SIZE * 0.8, 0, Math.PI * 2);
      this.ctx.fill();

      // Swirling inner rings
      this.ctx.rotate(time);
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, CONFIG.TILE_SIZE * 0.4, CONFIG.TILE_SIZE * 0.15, 0, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.rotate(-time * 1.5);
      this.ctx.strokeStyle = color2;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, CONFIG.TILE_SIZE * 0.35, CONFIG.TILE_SIZE * 0.2, Math.PI/4, 0, Math.PI * 2);
      this.ctx.stroke();

      this.ctx.restore();
    };

    if (this.level.portal1) renderPortal(this.level.portal1, 'rgba(6, 182, 212, 0.9)', 'rgba(14, 165, 233, 0.6)'); // Blue/Cyan
    if (this.level.portal2) renderPortal(this.level.portal2, 'rgba(236, 72, 153, 0.9)', 'rgba(244, 63, 94, 0.6)'); // Pink/Magenta

    // Render Teleport Particles
    this.teleportParticles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 3. Render Player (Kid) or Death Particles
    if (this.isDead) {
      this.deathParticles.forEach(p => {
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });
    } else {
      let px = this.player.x;
      let py = this.player.y;
      if (this.mode === CONFIG.MODE_EDIT) {
        // In edit mode, render player at spawn location
        px = this.level.playerSpawn.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.width) / 2;
        py = this.level.playerSpawn.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.height);
      }

      if (this.assets.player) {
        this.ctx.save();
        if (this.player.facing === 'left') {
          this.ctx.translate(px + this.player.width, py);
          this.ctx.scale(-1, 1);
          this.ctx.drawImage(this.assets.player, 0, 0, this.player.width, this.player.height);
        } else {
          this.ctx.drawImage(this.assets.player, px, py, this.player.width, this.player.height);
        }
        this.ctx.restore();
      } else {
        this.ctx.fillStyle = '#d4a359';
        this.ctx.fillRect(px, py, this.player.width, this.player.height);
      }
    }

    // 4. Render Editor Overlay if in Edit Mode
    if (this.mode === CONFIG.MODE_EDIT) {
      this.editor.render();
    }

    this.ctx.restore();
  }
}
