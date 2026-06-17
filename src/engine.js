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
    this.theme = 'default';

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
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      scaleX: 1,
      scaleY: 1,
      tiltAngle: 0,
      blinkTimer: 0,
      blinkDuration: 0,
      walkCycle: 0,
      landSquishTimer: 0,
      jumpStretchTimer: 0,
      charId: 'ghibli',
    };

    this.isDead = false;
    this.deathTimer = 0;
    this.deathParticles = [];
    this.portalCooldown = 0;
    this.teleportParticles = [];
    this.playGrid = null;
    this.coinsCollected = 0;
    this.totalCoins = 0;
    this.coinParticles = [];
    this.breakParticles = [];
    this.playerTrails = [];
    this.dustParticles = [];
    this.screenShake = 0;
    this.isSimulation = false;

    this.isAutoplay = false;
    this.autoplayPath = null;
    this.autoplayIndex = 0;
    this.autoplayFrameCount = 0;

    // Live enemy instances (created when entering play mode)
    this.liveEnemies = [];

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
    const playHud = document.getElementById('play-hud');
    if (mode === CONFIG.MODE_PLAY) {
      if (panControls) panControls.classList.add('hidden');
      if (playHud) playHud.classList.remove('hidden');
      this.resetPlayer();
      this.hasWon = false;
      if (this.editor) {
        this.editor.isMouseDown = false;
        this.editor.hoverCol = -1;
        this.editor.hoverRow = -1;
      }
    } else {
      if (panControls) panControls.classList.remove('hidden');
      if (playHud) playHud.classList.add('hidden');
    }
    this.keys = { left: false, right: false, up: false };
    this.panKeys = { up: false, down: false, left: false, right: false };
  }

  getTile(col, row) {
    if (this.mode === CONFIG.MODE_PLAY && this.playGrid) {
      if (col < 0 || col >= CONFIG.GRID_COLS || row < 0 || row >= CONFIG.GRID_ROWS) {
        return 1;
      }
      return this.playGrid[row][col];
    }
    return this.level.getTile(col, row);
  }

  setTile(col, row, value) {
    if (this.mode === CONFIG.MODE_PLAY && this.playGrid) {
      if (col >= 0 && col < CONFIG.GRID_COLS && row >= 0 && row < CONFIG.GRID_ROWS) {
        this.playGrid[row][col] = value;
      }
    } else {
      this.level.setTile(col, row, value);
    }
  }

  setTheme(theme) {
    this.theme = theme;
    if (this.editor) this.editor.setTheme(theme);
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

  resetPlayer() {
    this.player.charId = this.level.playerSpawn.charId || 'ghibli';
    if (this.player.charId === 'classic') {
      this.player.width = 28;
      this.player.height = 28;
    } else if (this.player.charId === 'ball') {
      this.player.width = 24;
      this.player.height = 24;
    } else if (this.player.charId === 'paddle_h') {
      this.player.width = 80;
      this.player.height = 20;
    } else if (this.player.charId === 'paddle_v') {
      this.player.width = 20;
      this.player.height = 80;
    } else {
      this.player.width = 32;
      this.player.height = 38;
    }
    // Spawn player centered horizontally in their tile
    this.player.x = this.level.playerSpawn.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.width) / 2;
    this.player.y = this.level.playerSpawn.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.height);
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isGrounded = false;
    this.player.facing = 'right';
    this.player.hasSpeedBoost = false;
    this.player.hasDoubleJump = false;
    this.player.doubleJumpAvailable = false;
    this.player.hasSpringBoots = false;
    this.player.hasBoomerang = false;
    this.player.coyoteTimer = 0;
    this.player.jumpBufferTimer = 0;
    this.player.scaleX = 1;
    this.player.scaleY = 1;
    this.player.tiltAngle = 0;
    this.player.blinkTimer = 0;
    this.player.blinkDuration = 0;
    this.player.walkCycle = 0;
    this.player.landSquishTimer = 0;
    
    // Level animations
    this.crumblingBlocks = [];
    this.ghostTimer = 0;
    this.boomerangs = [];
    this.stalactites = [];
    this.shadowClone = null;
    this.player.jumpStretchTimer = 0;
    this.isDead = false;
    this.deathTimer = 0;
    this.deathParticles = [];
    this.portalCooldown = 0;
    this.teleportParticles = [];
    this.coinParticles = [];
    this.breakParticles = [];
    this.playerTrails = [];
    this.dustParticles = [];
    this.screenShake = 0;
    this.hasKey = false;
    this.crumblingTiles = new Map();

    if (this.mode === CONFIG.MODE_PLAY) {
      // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
      this.playGrid = this.level.grid.map(row => row.slice());
      this.coinsCollected = 0;
      this.totalCoins = 0;
      for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
        for (let c = 0; c < CONFIG.GRID_COLS; c++) {
          if (this.playGrid[r][c] === 5) {
            this.totalCoins++;
          }
        }
      }
      const hudVal = document.getElementById('hud-coins-collected');
      const hudTotal = document.getElementById('hud-total-coins');
      if (hudVal) hudVal.textContent = '0';
      if (hudTotal) hudTotal.textContent = this.totalCoins.toString();
    } else {
      this.playGrid = null;
    }

    // Re-initialise live enemies from level definition
    this.liveEnemies = this.level.enemies.map(e => ({
      id: e.id,
      // Pixel position – centre of spawn tile
      x: e.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - 32) / 2,
      y: e.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - 38),
      width: 32,
      height: 38,
      vx: e.speed,
      vy: 0,
      isGrounded: false,
      speed: e.speed,
      // Patrol bounds in pixels
      patrolLeft: (e.col - e.patrolRange) * CONFIG.TILE_SIZE,
      patrolRight: (e.col + e.patrolRange) * CONFIG.TILE_SIZE,
      facing: 'right',
      walkFrame: 0,
      walkTimer: 0,
    }));

    this.livePlatforms = this.level.platforms.map(p => ({
      id: p.id,
      x: p.col * CONFIG.TILE_SIZE,
      y: p.row * CONFIG.TILE_SIZE + 10,
      width: CONFIG.TILE_SIZE,
      height: CONFIG.TILE_SIZE / 2,
      vx: p.axis === 'x' ? 1.5 : 0,
      vy: p.axis === 'y' ? 1.5 : 0,
      startX: p.col * CONFIG.TILE_SIZE,
      startY: p.row * CONFIG.TILE_SIZE + 10,
      distance: p.distance * CONFIG.TILE_SIZE,
      axis: p.axis,
      dir: 1
    }));

    // Center camera near player spawn when resetting
    const maxCamX = Math.max(0, CONFIG.GRID_COLS * CONFIG.TILE_SIZE - this.canvas.width);
    const maxCamY = Math.max(0, CONFIG.GRID_ROWS * CONFIG.TILE_SIZE - this.canvas.height);
    const targetX = this.player.x + this.player.width / 2 - this.canvas.width / 2;
    const targetY = this.player.y + this.player.height / 2 - this.canvas.height / 2;
    this.camera.x = Math.max(0, Math.min(maxCamX, targetX));
    this.camera.y = Math.max(0, Math.min(maxCamY, targetY));
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }
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
        this.keys.up = true;
        this.player.jumpBufferTimer = CONFIG.JUMP_BUFFER;
      }
      if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.throwBoomerang();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      if (this.mode === CONFIG.MODE_EDIT) {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.panKeys.up = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') this.panKeys.down = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.panKeys.left = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') this.panKeys.right = false;
        return;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        this.keys.up = false;
      }
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
      this.lastFrameTime = performance.now();
      this.accumulator = 0;
      requestAnimationFrame((time) => this.loop(time));
    }
  }

  updateCamera() {
    const maxCamX = Math.max(0, CONFIG.GRID_COLS * CONFIG.TILE_SIZE - this.canvas.width);
    const maxCamY = Math.max(0, CONFIG.GRID_ROWS * CONFIG.TILE_SIZE - this.canvas.height);

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
      const targetX = this.player.x + this.player.width / 2 - this.canvas.width / 2;
      const targetY = this.player.y + this.player.height / 2 - this.canvas.height / 2;
      this.camera.x += (targetX - this.camera.x) * 0.1;
      this.camera.y += (targetY - this.camera.y) * 0.1;

      this.camera.x = Math.max(0, Math.min(maxCamX, this.camera.x));
      this.camera.y = Math.max(0, Math.min(maxCamY, this.camera.y));
    }
  }

  loop(currentTime) {
    if (!this.isRunning) return;
    
    if (!currentTime) currentTime = performance.now();
    let deltaTime = currentTime - (this.lastFrameTime || currentTime);
    this.lastFrameTime = currentTime;

    // Prevent spiral of death if the tab was inactive
    if (deltaTime > 250) deltaTime = 250;

    if (this.accumulator === undefined) this.accumulator = 0;
    this.accumulator += deltaTime;

    const timestep = 1000 / 60; // 16.666ms per update

    // Fixed timestep update
    while (this.accumulator >= timestep) {
      if (this.mode === CONFIG.MODE_PLAY && !this.hasWon) {
        this.update();
      }
      this.updateCamera();
      this.accumulator -= timestep;
    }

    // Always render as fast as the monitor refreshes (up to 120Hz/144Hz)
    // The physics will cleanly run exactly 60 times a second.
    this.render();

    requestAnimationFrame((time) => this.loop(time));
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
        if (this.isAutoplay) {
          this.autoplayIndex = 0;
          this.autoplayFrameCount = 0;
          this.hasWon = false;
        }
      }
      return;
    }

    if (!this.level.switchState) this.level.switchState = 'red';
    if (this.switchCooldown > 0) this.switchCooldown--;

    if (this.ghostTimer === undefined) {
      this.ghostTimer = 0;
      this.ghostIsSolid = true;
    }
    this.ghostTimer++;
    if (this.ghostTimer >= 150) {
      this.ghostIsSolid = !this.ghostIsSolid;
      this.ghostTimer = 0;
      if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
    }

    if (this.player.sizeCooldown > 0) {
      this.player.sizeCooldown--;
    }

    if (this.mode === CONFIG.MODE_PLAY) {
      const pCol = Math.floor((this.player.x + this.player.width / 2) / CONFIG.TILE_SIZE);
      const pRow = Math.floor((this.player.y + this.player.height / 2) / CONFIG.TILE_SIZE);
      if (this.getTile(pCol, pRow) === 14 && this.player.sizeCooldown === 0) {
        this.player.isMini = !this.player.isMini;
        this.player.sizeCooldown = 60;
        if (this.player.isMini) {
          this.player.width = Math.max(10, this.player.baseWidth * 0.5);
          this.player.height = Math.max(10, this.player.baseHeight * 0.5);
          this.player.y += this.player.baseHeight - this.player.height;
        } else {
          this.player.width = this.player.baseWidth;
          this.player.height = this.player.baseHeight;
          this.player.y -= this.player.height - this.player.baseHeight * 0.5;
        }
        this.spawnJumpDust();
        if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
      }
    }

    // Autoplay action override
    if (this.isAutoplay) {
      if (this.autoplayPath && this.autoplayIndex < this.autoplayPath.length) {
        const act = this.autoplayPath[this.autoplayIndex];
        this.keys.left = act.left;
        this.keys.right = act.right;
        this.keys.up = act.jump;

        if (this.autoplayFrameCount === 0 && act.jump) {
          this.player.jumpBufferTimer = CONFIG.JUMP_BUFFER;
          if (this.isAutoplay) {
            // Cinematic burst
            for (let i = 0; i < 8; i++) {
              this.dustParticles.push({
                x: this.player.x + this.player.width / 2 + (Math.random() - 0.5) * 15,
                y: this.player.y + this.player.height,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * -3,
                size: Math.random() * 5 + 3,
                life: 1.0
              });
            }
          }
        }

        this.autoplayFrameCount++;
        if (this.autoplayFrameCount >= 5) {
          this.autoplayFrameCount = 0;
          this.autoplayIndex++;
        }
      } else {
        this.keys.left = false;
        this.keys.right = false;
      }
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

    // Update coin particles
    this.coinParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // slight gravity
      p.alpha = Math.max(0, p.alpha - 0.04);
    });
    this.coinParticles = this.coinParticles.filter(p => p.alpha > 0);

    // Update break particles
    this.breakParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += CONFIG.GRAVITY * 0.3;
      p.rotation += p.vRotation;
      p.alpha = Math.max(0, p.alpha - 0.03);
    });
    this.breakParticles = this.breakParticles.filter(p => p.alpha > 0);

    // Update dust particles
    if (!this.isSimulation) {
      this.dustParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95; // drag
        p.alpha = Math.max(0, p.alpha - p.decay);
        p.radius = Math.max(0.2, p.radius * 0.98);
      });
      this.dustParticles = this.dustParticles.filter(p => p.alpha > 0);

      // Speed trails (ghosting) at high speed
      const isHighSpeed = Math.abs(this.player.vx) > CONFIG.MOVE_SPEED * 1.15 || Math.abs(this.player.vy) > 8.5;
      if (isHighSpeed && Math.random() < 0.45) {
        this.playerTrails.push({
          x: this.player.x,
          y: this.player.y,
          facing: this.player.facing,
          scaleX: this.player.scaleX,
          scaleY: this.player.scaleY,
          tiltAngle: this.player.tiltAngle,
          alpha: 0.5,
          theme: this.theme,
          vy: this.player.vy,
        });
      }

      // Update trails
      this.playerTrails.forEach(t => {
        t.alpha -= 0.05;
      });
      this.playerTrails = this.playerTrails.filter(t => t.alpha > 0);
    }

    // Decrement coyote and jump buffer timers
    if (this.player.isGrounded) {
      this.player.coyoteTimer = CONFIG.COYOTE_TIME;
    } else {
      this.player.coyoteTimer = Math.max(0, this.player.coyoteTimer - 1);
    }
    this.player.jumpBufferTimer = Math.max(0, this.player.jumpBufferTimer - 1);

    if (this.player.landSquishTimer > 0) this.player.landSquishTimer--;
    if (this.player.jumpStretchTimer > 0) this.player.jumpStretchTimer--;

    // Update screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 0.5);
    }

    if (this.player.charId === 'topdown' || this.player.charId === 'paddle_h' || this.player.charId === 'paddle_v') {
      const isV = this.player.charId === 'paddle_v';
      const isH = this.player.charId === 'paddle_h';
      const canMoveX = !isV;
      const canMoveY = !isH;

      const targetVx = (canMoveX && this.keys.left) ? -CONFIG.MOVE_SPEED : ((canMoveX && this.keys.right) ? CONFIG.MOVE_SPEED : 0);
      const targetVy = (canMoveY && this.keys.up) ? -CONFIG.MOVE_SPEED : ((canMoveY && this.keys.down) ? CONFIG.MOVE_SPEED : 0);
      
      if (this.keys.left) this.player.facing = 'left';
      if (this.keys.right) this.player.facing = 'right';

      if (targetVx !== 0) {
        this.player.vx += (targetVx - this.player.vx) * CONFIG.ACCELERATION;
      } else {
        this.player.vx += (0 - this.player.vx) * CONFIG.DECELERATION;
        if (Math.abs(this.player.vx) < 0.1) this.player.vx = 0;
      }

      if (targetVy !== 0) {
        this.player.vy += (targetVy - this.player.vy) * CONFIG.ACCELERATION;
      } else {
        this.player.vy += (0 - this.player.vy) * CONFIG.DECELERATION;
        if (Math.abs(this.player.vy) < 0.1) this.player.vy = 0;
      }
    } else {
      // Horizontal Movement
      const maxSpeed = this.player.hasSpeedBoost ? CONFIG.MOVE_SPEED * 1.5 : CONFIG.MOVE_SPEED;
      const targetVx = this.keys.left ? -maxSpeed : (this.keys.right ? maxSpeed : 0);
      if (this.keys.left) this.player.facing = 'left';
      if (this.keys.right) this.player.facing = 'right';

      let currentAccel = CONFIG.ACCELERATION;
      let currentDecel = CONFIG.DECELERATION;
      if (this.player.isGrounded) {
        const pCol = Math.floor((this.player.x + this.player.width / 2) / CONFIG.TILE_SIZE);
        const pRow = Math.floor((this.player.y + this.player.height + 2) / CONFIG.TILE_SIZE);
        const tileBelow = this.getTile(pCol, pRow);
        if (tileBelow === 17) {
          currentAccel *= 0.15;
          currentDecel *= 0.02;
        } else if (tileBelow === 19) {
          this.player.x -= 2;
        } else if (tileBelow === 20) {
          this.player.x += 2;
        }
      }

      if (targetVx !== 0) {
        this.player.vx += (targetVx - this.player.vx) * currentAccel;
        // Spawn running dust
        if (this.player.isGrounded && Math.abs(this.player.vx) > CONFIG.MOVE_SPEED * 0.4) {
          if (Math.random() < 0.25) {
            this.spawnRunDust();
          }
        }
      } else {
        this.player.vx += (0 - this.player.vx) * currentDecel;
        if (Math.abs(this.player.vx) < 0.1) this.player.vx = 0;
      }

      // Jump check (coyote time and jump buffering)
      
      if (this.player.isWallSliding) {
        this.player.vy = -CONFIG.JUMP_FORCE;
        this.player.vx = this.player.wallDirection * CONFIG.MOVE_SPEED * 1.5;
        this.spawnJumpDust();
        if (!this.isSimulation && audio.playJumpSound) audio.playJumpSound();
        this.player.isWallSliding = false;
      } else
if (this.player.jumpBufferTimer > 0) {
        if (this.player.isGrounded || this.player.coyoteTimer > 0) {
          const jumpForce = this.player.hasSpringBoots ? CONFIG.JUMP_FORCE * 1.5 : CONFIG.JUMP_FORCE;
          this.player.vy = -jumpForce;
          this.player.isGrounded = false;
          this.player.coyoteTimer = 0;
          this.player.jumpBufferTimer = 0;
          this.player.jumpStretchTimer = 10;
          this.player.landSquishTimer = 0;
          if (this.player.hasDoubleJump) this.player.doubleJumpAvailable = true;
          audio.playJumpSound();
          this.spawnJumpDust();
        } else if (this.player.hasDoubleJump && this.player.doubleJumpAvailable) {
          // Double jump
          const jumpForce = this.player.hasSpringBoots ? CONFIG.JUMP_FORCE * 1.5 : CONFIG.JUMP_FORCE;
          this.player.vy = -jumpForce;
          this.player.jumpBufferTimer = 0;
          this.player.doubleJumpAvailable = false;
          this.player.jumpStretchTimer = 10;
          this.player.landSquishTimer = 0;
          audio.playJumpSound();
          // Optional: A distinct effect for mid-air jump
          this.spawnJumpDust();
        }
      }

      // Variable Jump Height (cut upward velocity when jump key is released early)
      if (!this.isSimulation && !this.keys.up && this.player.vy < -2.0) {
        this.player.vy *= 0.6; // reduce rise speed smoothly
      }

      // Apply Gravity
      const pColGravity = Math.floor((this.player.x + this.player.width / 2) / CONFIG.TILE_SIZE);
      const pRowGravity = Math.floor((this.player.y + this.player.height / 2) / CONFIG.TILE_SIZE);
      if (this.getTile(pColGravity, pRowGravity) === 18) {
        this.player.vy -= CONFIG.GRAVITY * 1.5;
        if (this.player.vy < -CONFIG.MOVE_SPEED * 1.5) this.player.vy = -CONFIG.MOVE_SPEED * 1.5;
      } else {
        this.player.vy += CONFIG.GRAVITY;
        if (this.player.vy > 12) this.player.vy = 12; // Terminal velocity
      }
    }

    // Calculate Squash & Stretch Scale Factors
    let sqX = 1;
    let sqY = 1;
    
    if (this.player.jumpStretchTimer > 0) {
      // Stretched out (jump takeoff)
      const t = this.player.jumpStretchTimer / 10; // 1 down to 0
      sqY = 1 + t * 0.25;
      sqX = 1 - t * 0.15;
    } else if (this.player.landSquishTimer > 0) {
      // Squashed (landing impact)
      const t = this.player.landSquishTimer / 10; // 1 down to 0
      sqY = 1 - t * 0.32;
      sqX = 1 + t * 0.22;
    } else if (!this.player.isGrounded) {
      // In air - dynamic stretch based on falling velocity
      if (this.player.vy > 2.0) {
        const fallFactor = Math.min(0.2, (this.player.vy - 2.0) / 20);
        sqY = 1 + fallFactor;
        sqX = 1 - fallFactor * 0.6;
      }
    } else if (Math.abs(this.player.vx) > 0.1) {
      // Subtle running stretch
      const runSpeedRatio = Math.abs(this.player.vx) / CONFIG.MOVE_SPEED;
      sqY = 1 - Math.sin(Date.now() * 0.016) * 0.04 * runSpeedRatio;
      sqX = 1 + Math.sin(Date.now() * 0.016) * 0.03 * runSpeedRatio;
    } else {
      // Idle bobbing / breathing
      const idleBob = Math.sin(Date.now() * 0.005);
      sqY = 1 + idleBob * 0.025;
      sqX = 1 - idleBob * 0.015;
    }

    this.player.scaleX = sqX;
    this.player.scaleY = sqY;

    // Calculate dynamic tilt/lean based on horizontal speed
    if (this.player.isGrounded && Math.abs(this.player.vx) > 0.1) {
      const runSpeedRatio = Math.abs(this.player.vx) / CONFIG.MOVE_SPEED;
      this.player.tiltAngle = 0.08 * runSpeedRatio; // tilt forward
    } else if (!this.player.isGrounded) {
      // In air tilt based on vertical speed
      this.player.tiltAngle = Math.min(0.12, Math.max(-0.08, this.player.vx * 0.015));
    } else {
      this.player.tiltAngle = 0;
    }

    // Update platforms first so player can move with them
    this.updatePlatforms();

    // Handle Horizontal Collisions First
    this.player.x += this.player.vx;
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

    this.resolveHorizontalCollisions();

    // Handle Vertical Collisions Next
    this.player.isGrounded = false;
    this.player.y += this.player.vy;
    this.resolveVerticalCollisions();

    // Check Win Condition
    this.checkWinCondition();

    // Check Hazards
    this.checkHazards();

    // Check Tripwires
    this.checkTripwires();

    // Check Portals
    this.checkPortals();

    // Process Crumbling Tiles
    this.processCrumblingTiles();

    // Check coins
    this.checkCoins();

    // Update and check enemies
    this.updateEnemies();

    // Update boomerangs
    this.updateBoomerangs();

    // Stalactite activation
    if (!this.isDead && !this.hasWon) {
      const pCol = Math.floor((this.player.x + this.player.width/2) / CONFIG.TILE_SIZE);
      const pRow = Math.floor((this.player.y + this.player.height/2) / CONFIG.TILE_SIZE);
      for (let r = pRow; r >= 0; r--) {
        if (this.getTile(pCol, r) === 35) {
          // Check line of sight (no solid blocks between player and stalactite)
          let clear = true;
          for (let checkR = r + 1; checkR < pRow; checkR++) {
            const tile = this.getTile(pCol, checkR);
            if (tile === 1 || tile === 6 || tile === 7 || tile === 16 || tile === 18) {
              clear = false;
              break;
            }
          }
          if (clear) {
            // Activate stalactite
            this.setTile(pCol, r, 0);
            this.stalactites.push({
              x: pCol * CONFIG.TILE_SIZE,
              y: r * CONFIG.TILE_SIZE,
              width: CONFIG.TILE_SIZE,
              height: CONFIG.TILE_SIZE,
              vy: 0,
              state: 'shaking',
              timer: 30
            });
          }
        }
      }
    }

    // Update stalactites
    for (let i = this.stalactites.length - 1; i >= 0; i--) {
      const st = this.stalactites[i];
      if (st.state === 'shaking') {
        st.timer--;
        if (st.timer <= 0) {
          st.state = 'falling';
          if (!this.isSimulation && window.audio && window.audio.playTileSound) window.audio.playTileSound();
        }
      } else if (st.state === 'falling') {
        st.vy += 0.5; // Gravity
        st.y += st.vy;
        
        // Collision with player
        if (!this.isDead && !this.hasWon &&
            this.player.x < st.x + st.width - 4 &&
            this.player.x + this.player.width > st.x + 4 &&
            this.player.y < st.y + st.height - 4 &&
            this.player.y + this.player.height > st.y + 4) {
          this.killPlayer();
        }
        
        // Collision with ground
        const bottomRow = Math.floor((st.y + st.height) / CONFIG.TILE_SIZE);
        const col = Math.floor((st.x + st.width/2) / CONFIG.TILE_SIZE);
        const tile = this.getTile(col, bottomRow);
        if (tile === 1 || tile === 6 || tile === 7 || tile === 18) {
          // Shatter
          this.stalactites.splice(i, 1);
          if (!this.isSimulation && window.audio && window.audio.playTileSound) window.audio.playTileSound();
        } else if (st.y > CONFIG.GRID_ROWS * CONFIG.TILE_SIZE) {
          this.stalactites.splice(i, 1);
        }
      }
    }

    this.updateShadowClone();

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


    // Boundary check (if player falls off world bottom, reset)
    if (this.player.y > CONFIG.GRID_ROWS * CONFIG.TILE_SIZE + 100) {
      this.resetPlayer();
    }
  }

  spawnRunDust() {
    if (this.isSimulation) return;
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height;
    const dir = this.player.facing === 'left' ? 1 : -1;
    this.dustParticles.push({
      x: px + (Math.random() - 0.5) * 6,
      y: py - 2 + (Math.random() - 0.5) * 2,
      vx: dir * (0.5 + Math.random() * 1.5),
      vy: -0.2 - Math.random() * 0.8,
      radius: 2 + Math.random() * 3,
      alpha: 0.6 + Math.random() * 0.2,
      decay: 0.025 + Math.random() * 0.02,
      isSquare: this.player.charId === 'classic',
    });
  }

  updatePlatforms() {
    if (this.isDead || this.hasWon) return;

    for (const plat of this.livePlatforms) {
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
      if (this.player.vy >= 0) {
        const pBottom = this.player.y + this.player.height;
        const pBottomPrev = this.player.y - this.player.vy + this.player.height;
        
        // Ensure player's X overlaps platform X
        if (this.player.x + this.player.width > plat.x && this.player.x < plat.x + plat.width) {
          // Check if player landed on it this frame or was already on it
          // We allow a small tolerance for `plat.y` because the platform might be moving down
          if (pBottomPrev <= plat.y - (plat.vy * plat.dir) + 1 && pBottom + 2 >= plat.y) {
            this.player.isGrounded = true;

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

            if (this.player.hasDoubleJump) this.player.doubleJumpAvailable = true;
            this.player.y = plat.y - this.player.height;
            this.player.vy = plat.vy * plat.dir; // Move with platform vertically
            
            // Carry horizontally (unless walking against a wall, but we resolve wall collision later)
            this.player.x += plat.vx * plat.dir;
          }
        }
      }
    }
  }

  spawnJumpDust() {
    if (this.isSimulation) return;
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height;
    for (let i = 0; i < 6; i++) {
      const angle = Math.PI + (i / 5) * Math.PI;
      const speed = 1.0 + Math.random() * 2.0;
      this.dustParticles.push({
        x: px + (Math.random() - 0.5) * 10,
        y: py - 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.4 - 0.2,
        radius: 3 + Math.random() * 3,
        alpha: 0.7 + Math.random() * 0.3,
        decay: 0.03 + Math.random() * 0.02,
        isSquare: this.player.charId === 'classic',
      });
    }
  }

  spawnLandDust(fallSpeed) {
    if (this.isSimulation) return;
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height;
    const intensity = Math.min(8, Math.max(4, Math.floor(fallSpeed * 0.8)));
    for (let i = 0; i < intensity; i++) {
      const speed = 1.0 + Math.random() * (fallSpeed * 0.3);
      const dir = i % 2 === 0 ? 1 : -1;
      this.dustParticles.push({
        x: px + dir * 6 + (Math.random() - 0.5) * 6,
        y: py - 2,
        vx: dir * speed,
        vy: -0.1 - Math.random() * 0.5,
        radius: 2 + Math.random() * 4,
        alpha: 0.8,
        decay: 0.03 + Math.random() * 0.02,
        isSquare: this.player.charId === 'classic',
      });
    }
  }

  drawForestKid(ctx, x, y, width, height, facing, scaleX, scaleY, tiltAngle, alpha, isTrail = false, customTheme = null) {
    ctx.save();
    ctx.globalAlpha = isTrail ? alpha : (ctx.globalAlpha * alpha);

    // Position bottom-center of the box
    ctx.translate(x + width / 2, y + height);
    ctx.scale(facing === 'left' ? -1 : 1, 1);

    // Breathing animation
    let breathScaleY = 1;
    let breathScaleX = 1;
    if (this.player && this.player.isGrounded && Math.abs(this.player.vx) < 0.1 && !isTrail && alpha === 1.0) {
      const breath = Math.sin(Date.now() * 0.003) * 0.03;
      breathScaleY = 1 + breath;
      breathScaleX = 1 - breath * 0.5;
    }
    ctx.scale(scaleX * breathScaleX, scaleY * breathScaleY);
    ctx.rotate(tiltAngle);

    // Color definitions
    const themeName = customTheme || this.theme;
    let capeColor, liningColor, faceColor, eyeColor;
    if (themeName === 'spooky') {
      capeColor = '#3d2b56'; liningColor = '#706fd3'; faceColor = '#1e1720'; eyeColor = '#00ffcc';
    } else if (themeName === 'butterflies') {
      capeColor = '#ec4899'; liningColor = '#ffd60a'; faceColor = '#fefefe'; eyeColor = '#3d2b56';
    } else if (themeName === 'icecream') {
      capeColor = '#ffb3c1'; liningColor = '#ffe5ec'; faceColor = '#fff0f5'; eyeColor = '#fb6f92';
    } else if (themeName === '16bit') {
      capeColor = '#b85c27'; liningColor = '#ffd60a'; faceColor = '#ffe57f'; eyeColor = '#1e1720';
    } else {
      capeColor = '#4a5d4e'; liningColor = '#c29b68'; faceColor = '#f5f0eb'; eyeColor = '#2b2621';
    }
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


    if (isTrail) {
      ctx.fillStyle = themeName === 'spooky' ? '#00ffcc' : '#c29b68';
      ctx.beginPath();
      ctx.roundRect(-10, -20, 20, 20, 6);
      ctx.fill();
      ctx.restore();
      return;
    }

    // 12fps Hand-drawn wiggle boil effect
    const step = Math.floor(Date.now() / 90);
    const w = (seed, sc = 1) => {
      if (isTrail) return 0; // Trails don't boil/wiggle to look cleaner
      return Math.sin(step * 17.3 + seed * 23.7) * 0.8 * sc;
    };

    // Draw little cute legs
    let legOffset1 = 0;
    let legOffset2 = 0;
    if (this.player.isGrounded && Math.abs(this.player.vx) > 0.1) {
      const cycle = (Date.now() * 0.012) % (Math.PI * 2);
      legOffset1 = Math.sin(cycle) * 6;
      legOffset2 = -Math.sin(cycle) * 6;
    } else if (!this.player.isGrounded) {
      if (this.player.vy < 0) {
        legOffset1 = -2;
        legOffset2 = -1;
      } else {
        legOffset1 = 1;
        legOffset2 = 3;
      }
    }

    ctx.strokeStyle = '#1e1720';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    // Left leg
    ctx.beginPath();
    ctx.moveTo(-6 + w(91), -5 + w(92));
    ctx.lineTo(-6 + legOffset1 + w(93), (legOffset1 > 0 ? 0 : -2) + w(94));
    ctx.stroke();

    // Right leg
    ctx.beginPath();
    ctx.moveTo(6 + w(95), -5 + w(96));
    ctx.lineTo(6 + legOffset2 + w(97), (legOffset2 > 0 ? 0 : -2) + w(98));
    ctx.stroke();

    // Satchel Bag (bouncing slightly offset from the body)
    if (!isTrail && this.player) {
      ctx.fillStyle = '#6e4b3a'; // brown leather
      ctx.strokeStyle = '#1e1720';
      ctx.lineWidth = 2.5;
      
      const bounce = this.player.isGrounded && Math.abs(this.player.vx) > 0.1 ? Math.sin(Date.now() * 0.015) * 2 : 0;
      const jumpFloat = !this.player.isGrounded ? (this.player.vy < 0 ? 3 : -3) : 0;
      
      ctx.beginPath();
      ctx.roundRect(-2 + w(101), -18 + bounce + jumpFloat + w(102), 10, 8, 2);
      ctx.fill();
      ctx.stroke();
      
      // Satchel strap
      ctx.beginPath();
      ctx.moveTo(-2 + w(101), -15 + bounce + jumpFloat + w(103));
      ctx.lineTo(-6 + w(104), -22 + w(105));
      ctx.stroke();
    }

    // Cape / Cloak (flowing to the left)
    ctx.fillStyle = capeColor;
    ctx.strokeStyle = '#1e1720';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(0 + w(3), -height + 14 + w(4)); // Neck attachment
    
    // Wind drag pulling cloak back & Falling hood
    const runPull = this.player ? Math.min(12, Math.abs(this.player.vx) * 2.2) : 0;
    const fallUp = (this.player && !this.player.isGrounded && this.player.vy > 2) ? -Math.min(10, this.player.vy * 1.2) : 0;

    const cpx1 = -12 - runPull + w(5);
    const cpy1 = -height / 2 + w(6) + fallUp;
    const cpx2 = -20 - runPull + w(7);
    const cpy2 = -6 + w(8) + fallUp;
    
    ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, -18 - runPull + w(9), -2 + fallUp * 0.5 + w(10));
    ctx.lineTo(-4 + w(11), -4 + w(12));
    ctx.quadraticCurveTo(-2 + w(13), -height / 2 + w(14), 0 + w(15), -height + 14 + w(16));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw Main Hood
    ctx.fillStyle = capeColor;
    ctx.beginPath();
    ctx.moveTo(-10 + w(17), -18 + w(18));
    ctx.quadraticCurveTo(-16 + w(19), -height + 8 + w(20), -7 + w(21), -height + w(22)); // cute cap tip
    ctx.quadraticCurveTo(0 + w(23), -height - 3 + w(24), 10 + w(25), -height + 4 + w(26)); // crown
    ctx.quadraticCurveTo(16 + w(27), -height + 16 + w(28), 12 + w(29), -14 + w(30)); // face opening
    ctx.quadraticCurveTo(8 + w(31), -4 + w(32), 0 + w(33), -4 + w(34)); // base
    ctx.quadraticCurveTo(-10 + w(35), -6 + w(36), -10 + w(37), -18 + w(38));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hood Opening / Lining
    ctx.fillStyle = liningColor;
    ctx.beginPath();
    ctx.moveTo(11 + w(49), -height + 14 + w(50));
    ctx.bezierCurveTo(15 + w(51), -height + 22 + w(52), 8 + w(53), -6 + w(54), 1 + w(55), -10 + w(56));
    ctx.bezierCurveTo(-4 + w(57), -14 + w(58), 2 + w(59), -height + 6 + w(60), 11 + w(61), -height + 14 + w(62));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Face Mask (cute round circle inside the lining)
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.arc(6 + w(39), -height + 22 + w(40), 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Blinking Eyes
    let isBlinking = false;
    if (!isTrail) {
      if (this.player.blinkTimer <= 0) {
        if (Math.random() < 0.012) {
          this.player.blinkTimer = 110 + Math.random() * 190;
          this.player.blinkDuration = 6 + Math.random() * 6;
        }
      } else {
        this.player.blinkTimer--;
        if (this.player.blinkTimer < this.player.blinkDuration) {
          isBlinking = true;
        }
      }
    }

    if (isBlinking) {
      ctx.strokeStyle = eyeColor;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      // Right Eye closed
      ctx.moveTo(3.5 + w(71), -height + 22 + w(72));
      ctx.lineTo(6.5 + w(73), -height + 22 + w(74));
      // Left Eye closed
      ctx.moveTo(7.5 + w(75), -height + 22 + w(76));
      ctx.lineTo(10.5 + w(77), -height + 22 + w(78));
      ctx.stroke();
    } else {
      // Look direction
      let lookX = 0.6;
      let lookY = 0;
      if (this.player.vy < -1.5) lookY = -0.6;
      else if (this.player.vy > 1.5) lookY = 0.6;

      // Draw Sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(4.2 + w(79), -height + 22 + w(80), 2.2, 0, Math.PI * 2);
      ctx.arc(8.2 + w(81), -height + 22 + w(82), 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Irises
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(4.2 + lookX + w(83), -height + 22 + lookY + w(84), 1.2, 0, Math.PI * 2);
      ctx.arc(8.2 + lookX + w(85), -height + 22 + lookY + w(86), 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Ghibli catchlight shines
      if (!isTrail) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(4.2 + lookX - 0.4, -height + 22 + lookY - 0.4, 0.45, 0, Math.PI * 2);
        ctx.arc(8.2 + lookX - 0.4, -height + 22 + lookY - 0.4, 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  drawClassicBox(ctx, x, y, width, height, facing, scaleX, scaleY, tiltAngle, alpha, isTrail = false) {
    ctx.save();
    ctx.globalAlpha = isTrail ? alpha : (ctx.globalAlpha * alpha);

    // Position bottom-center
    ctx.translate(x + width / 2, y + height);
    
    // Calculate dynamic squish based on velocity if not in trail
    let dynamicScaleX = scaleX;
    let dynamicScaleY = scaleY;
    
    if (!isTrail && this.player && this.mode === CONFIG.MODE_PLAY) {
      if (!this.player.isGrounded) {
        const stretch = Math.min(0.2, Math.abs(this.player.vy) * 0.02);
        dynamicScaleX -= stretch;
        dynamicScaleY += stretch;
      } else if (Math.abs(this.player.vx) > 0.5) {
        const runSquish = Math.sin(Date.now() * 0.02) * 0.05;
        dynamicScaleY -= Math.abs(runSquish);
        dynamicScaleX += Math.abs(runSquish) * 0.5;
      }
    }

    ctx.scale(facing === 'left' ? -1 : 1, 1);
    ctx.scale(dynamicScaleX, dynamicScaleY);
    ctx.rotate(tiltAngle);

    // Dynamic Theme Color
    let themeColor = '#3498db';
    if (this.theme === 'spooky') themeColor = '#9b59b6';
    else if (this.theme === 'butterflies') themeColor = '#e84393';
    else if (this.theme === 'icecream') themeColor = '#00cec9';
    else if (this.theme === '16bit') themeColor = '#e67e22';
    
    // Draw tiny stubby legs if moving and grounded
    if (!isTrail && this.player) {
      let legOffset = 0;
      if (this.player.isGrounded && Math.abs(this.player.vx) > 0.1) {
        legOffset = Math.sin(Date.now() * 0.03) * 3;
      } else if (!this.player.isGrounded) {
        legOffset = this.player.vy < 0 ? -2 : 1;
      }
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.roundRect(-width / 4 - 3, -4, 6, 8 + (legOffset > 0 ? legOffset : 0), 2);
      ctx.roundRect(width / 4 - 3, -4, 6, 8 - (legOffset < 0 ? legOffset : 0), 2);
      ctx.fill();
    }

    // Draw main box
    ctx.fillStyle = themeColor;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height, width, height, 6);
    ctx.fill();

    // Shading/Highlight & Face
    if (!isTrail) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-width / 2 + 2, -height + 2, width - 4, height - 4, 4);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height, width, height, 6);
      ctx.stroke();

      ctx.fillStyle = '#1e1720'; 
      let lookX = 0;
      let lookY = 0;
      if (this.player && this.mode === CONFIG.MODE_PLAY) {
        if (this.player.vy < -1) lookY = -2;
        else if (this.player.vy > 1) lookY = 2;
        if (Math.abs(this.player.vx) > 1) lookX = 1;
      }
      
      let isBlinking = false;
      if (this.player) {
        if (this.player.blinkTimer <= 0 && Math.random() < 0.01) {
          this.player.blinkTimer = 100 + Math.random() * 150;
          this.player.blinkDuration = 5 + Math.random() * 5;
        } else if (this.player.blinkTimer > 0) {
          this.player.blinkTimer--;
          if (this.player.blinkTimer < this.player.blinkDuration) isBlinking = true;
        }
      }

      const eyeY = -height / 2 - 2 + lookY;
      
      if (isBlinking) {
        ctx.strokeStyle = '#1e1720';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6 + lookX, eyeY); ctx.lineTo(-2 + lookX, eyeY);
        ctx.moveTo(2 + lookX, eyeY); ctx.lineTo(6 + lookX, eyeY);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(-4 + lookX, eyeY, 2.5, 0, Math.PI * 2);
        ctx.arc(4 + lookX, eyeY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4.5 + lookX, eyeY - 0.5, 0.8, 0, Math.PI * 2);
        ctx.arc(3.5 + lookX, eyeY - 0.5, 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.strokeStyle = '#1e1720';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0 + lookX, eyeY + 4, 2, 0, Math.PI, false);
      ctx.stroke();
    }

    ctx.restore();
  }

  checkPortals() {
    if (this.isDead || this.hasWon) return;
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

    // If the player isn't touching any portals, clear the exclusion memory
    if (!isOverlapping1 && !isOverlapping2) {
      this.lastPortalExited = null;
    }

    if (this.portalCooldown > 0) return;

    if (isOverlapping1 && this.lastPortalExited !== 1) {
      this.lastPortalExited = 2; // Prevent immediately teleporting back from portal 2
      this.teleportPlayer(this.level.portal1, this.level.portal2, '#06b6d4', '#ec4899');
    } else if (isOverlapping2 && this.lastPortalExited !== 2) {
      this.lastPortalExited = 1; // Prevent immediately teleporting back from portal 1
      this.teleportPlayer(this.level.portal2, this.level.portal1, '#ec4899', '#06b6d4');
    }
  }

  teleportPlayer(fromPortal, toPortal, fromColor, toColor) {
    if (this.isSimulation) {
      this.portalCooldown = 30;
      this.player.x = toPortal.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.width) / 2;
      this.player.y = toPortal.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.height);
      this.player.vx = 0;
      this.player.vy = 0;
      return;
    }
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

  checkCoins() {
    if (this.isDead || this.hasWon) return;

    const inset = 2;
    const playerBox = {
      left: this.player.x + inset,
      right: this.player.x + this.player.width - inset,
      top: this.player.y + inset,
      bottom: this.player.y + this.player.height - inset,
    };

    const minCol = Math.max(0, Math.floor(playerBox.left / CONFIG.TILE_SIZE));
    const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((playerBox.right - 0.01) / CONFIG.TILE_SIZE));
    const minRow = Math.max(0, Math.floor(playerBox.top / CONFIG.TILE_SIZE));
    const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((playerBox.bottom - 0.01) / CONFIG.TILE_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tileVal = this.getTile(c, r);
        if (tileVal === 19 || tileVal === 5 || tileVal === 9 || tileVal === 34) {

          if (tileVal === 19 && this.portalCooldown <= 0) {
            this.level.gravityDir = (this.level.gravityDir || 1) * -1;
            this.portalCooldown = 30;
            this.player.vy = 0;
            if (audio.playTileSound && !this.isSimulation) audio.playTileSound();
          }

          if (tileVal === 19) continue;

          if (tileVal === 34 && !this.shadowClone) {
            this.shadowClone = {
              x: c * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.width)/2,
              y: r * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.height),
              vx: 0, vy: 0, width: this.player.width, height: this.player.height,
              isGrounded: false, facing: 'right'
            };
            if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
          }

          if (tileVal === 5 || tileVal === 9) {
            this.setTile(c, r, 0);
            
            if (tileVal === 5) {
              this.coinsCollected++;
            } else if (tileVal === 9) {
              this.hasKey = true;
            }
            
            if (this.isSimulation) continue;

            if (tileVal === 5) {
              audio.playCoinSound();
              const hudVal = document.getElementById('hud-coins-collected');
              if (hudVal) hudVal.textContent = this.coinsCollected.toString();
            } else {
              if (audio.playCoinSound) audio.playCoinSound();
            }

            const coinCenterX = c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            const coinCenterY = r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
            this.spawnCoinParticles(coinCenterX, coinCenterY);
          }
        }
      }
    }
  }

  spawnCoinParticles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.coinParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 2 + Math.random() * 3,
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
        const tileVal = this.getTile(c, r);
        if (tileVal === 3 || tileVal === 4) {
          this.killPlayer();
          return;
        }
      }
    }
  }

  checkTripwires() {
    if (this.isDead || this.hasWon) return;

    const box = {
      left: this.player.x,
      right: this.player.x + this.player.width,
      top: this.player.y,
      bottom: this.player.y + this.player.height,
    };

    const minCol = Math.max(0, Math.floor(box.left / CONFIG.TILE_SIZE));
    const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((box.right - 0.01) / CONFIG.TILE_SIZE));
    const minRow = Math.max(0, Math.floor(box.top / CONFIG.TILE_SIZE));
    const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((box.bottom - 0.01) / CONFIG.TILE_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (this.getTile(c, r) === 21) {
          if (!this.switchCooldown) {
            this.level.switchState = this.level.switchState === 'red' ? 'blue' : 'red';
            this.switchCooldown = 30;
            if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
          }
        }
      }
    }
  }

  processCrumblingTiles() {
    if (this.isDead || this.hasWon) return;
    
    for (const [key, data] of this.crumblingTiles.entries()) {
      data.timer--;
      const [col, row] = key.split(',').map(Number);
      if (data.state === 'shaking' && data.timer <= 0) {
        // Break the block
        this.level.setTile(col, row, 0);
        data.state = 'broken';
        data.timer = 180; // 3 seconds to respawn
        this.breakBlock(col, row);
        if (!this.isSimulation && audio.playBreakSound) audio.playBreakSound();
      } else if (data.state === 'broken' && data.timer <= 0) {
        // Respawn the block
        this.level.setTile(col, row, 22);
        this.crumblingTiles.delete(key);
        if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
      }
    }
  }

  // ── Enemy AI ─────────────────────────────────────────────────────────────
  
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

  
  updateShadowClone() {
    if (!this.shadowClone) return;
    
    // Symmetrical input
    const cloneKeys = {
      left: this.keys.right,
      right: this.keys.left,
      up: this.keys.up
    };

    const clone = this.shadowClone;
    
    // Gravity direction
    const gDir = this.level.gravityDir || 1;
    
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
      if (!this.isSimulation && audio.playJumpSound) audio.playJumpSound();
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
        if (this.isSolid(c, r)) {
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
        if (this.isSolid(c, r)) {
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

  updateEnemies() {
    if (this.isDead || this.hasWon) return;

    for (const enemy of this.liveEnemies) {

      // ── Gravity ────────────────────────────────────────────────────────────
      if ((enemy.type !== 'thwomp' && enemy.type !== 'lazer') || enemy.state === 'falling') {
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
          const tv = this.getTile(c, r);
          if (tv !== 1 && tv !== 2 && tv !== 7) continue;
          const tileTop = r * CONFIG.TILE_SIZE;
          const tileBot = tileTop + CONFIG.TILE_SIZE;
          if (enemy.vy > 0 && eBoxV.bottom > tileTop && (eBoxV.bottom - enemy.vy) <= tileTop) {
            enemy.y = tileTop - enemy.height;
            enemy.vy = 0;
            enemy.isGrounded = true;
            
            if (enemy.type === 'thwomp' && enemy.state === 'falling') {
              enemy.state = 'returning';
              this.cameraShake = 15;
              if (audio.playBreakSound && !this.isSimulation) audio.playBreakSound();
              // Spawn dust around the thwomp base
              if (!this.isSimulation) {
                for(let i=0; i<10; i++){
                  this.spawnLandDust(6); // reusing land dust for big impact
                }
              }
            }

            if (tv === 2) {
              enemy.vy = -CONFIG.TRAMPOLINE_BOUNCE_FORCE * 0.85;
              enemy.isGrounded = false;
              if (!this.isSimulation) {
                audio.playBounceSound();
                this.bounceAnims.set(`${c},${r}`, { timer: 15 });
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
          if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
          this.cameraShake = 5;
        } else if (enemy.state === 'fire' && enemy.timer > 30) {
          enemy.state = 'idle';
          enemy.timer = 0;
        }

        if (enemy.state === 'warn' || enemy.state === 'fire') {
          // Pre-calculate beam bounds
          enemy.beams = { up: 0, down: 0, left: 0, right: 0 };
          const eCol = Math.floor(enemy.x / CONFIG.TILE_SIZE);
          const eRow = Math.floor(enemy.y / CONFIG.TILE_SIZE);
          const isSolid = (c, r) => {
            const t = this.getTile(c, r);
            return t === 1 || t === 2 || t === 7 || t === 10 || t === 11 ||
                   (t === 12 && this.level.switchState === 'red') || 
                   (t === 13 && this.level.switchState === 'blue');
          };

          for (let r = eRow - 1; r >= 0; r--) { if (isSolid(eCol, r)) break; enemy.beams.up++; }
          for (let r = eRow + 1; r < CONFIG.GRID_ROWS; r++) { if (isSolid(eCol, r)) break; enemy.beams.down++; }
          for (let c = eCol - 1; c >= 0; c--) { if (isSolid(c, eRow)) break; enemy.beams.left++; }
          for (let c = eCol + 1; c < CONFIG.GRID_COLS; c++) { if (isSolid(c, eRow)) break; enemy.beams.right++; }

          if (enemy.state === 'fire' && !this.isDead) {
            const pxBox = {
              left: this.player.x + 4, right: this.player.x + this.player.width - 4,
              top: this.player.y + 4, bottom: this.player.y + this.player.height - 4
            };
            
            const bX = enemy.x + 10;
            const bY = enemy.y + 10;
            const bW = 20;
            const bH = 20;

            const checkHit = (rL, rR, rT, rB) => {
               if (pxBox.left < rR && pxBox.right > rL && pxBox.top < rB && pxBox.bottom > rT) {
                 this.killPlayer();
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
          const pxC = this.player.x + this.player.width / 2;
          const exC = enemy.x + enemy.width / 2;
          if (Math.abs(pxC - exC) < CONFIG.TILE_SIZE * 1.5 && this.player.y > enemy.y) {
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

      // ── Horizontal patrol (only when on the ground) ────────────────────────
      if (enemy.isGrounded) {
        if (enemy.type === 'chaser') {
          if (this.player.x + this.player.width/2 < enemy.x + enemy.width/2) {
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
          const nextFloor = this.getTile(rightCol, footRow);
          const wallAhead = this.getTile(rightCol, row) === 1 || this.getTile(rightCol, row) === 7;
          const edgeAhead = nextFloor !== 1 && nextFloor !== 2 && nextFloor !== 7;
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
          const nextFloor = this.getTile(leftCol, footRow);
          const wallAhead = this.getTile(leftCol, row) === 1 || this.getTile(leftCol, row) === 7;
          const edgeAhead = nextFloor !== 1 && nextFloor !== 2 && nextFloor !== 7;
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
          if (enemy.x <= enemy.patrolLeft) {
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
    this.checkEnemyCollisions();
  }

  checkEnemyCollisions() {
    if (this.isDead || this.hasWon) return;
    const inset = 4;
    const playerBox = {
      left: this.player.x + inset,
      right: this.player.x + this.player.width - inset,
      top: this.player.y + inset,
      bottom: this.player.y + this.player.height - inset,
    };

    for (const enemy of this.liveEnemies) {
      const eBox = {
        left: enemy.x + inset,
        right: enemy.x + enemy.width - inset,
        top: enemy.y + inset,
        bottom: enemy.y + enemy.height - inset,
      };
      const overlapping = !(
        playerBox.right < eBox.left ||
        playerBox.left > eBox.right ||
        playerBox.bottom < eBox.top ||
        playerBox.top > eBox.bottom
      );
      if (overlapping) {
        // Stomp condition: player is falling and their feet (previous frame) were above the enemy's upper half
        const isStomp = this.player.vy > 0 && (this.player.y + this.player.height - this.player.vy) <= enemy.y + 16;
        if (isStomp) {
          // Bounce player upwards
          this.player.vy = -CONFIG.JUMP_FORCE * 0.85;
          this.player.isGrounded = false;
          
          if (!this.isSimulation) {
            // Spawn dark soot particles
            this.spawnTeleportParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#1e1720');
            audio.playBounceSound();
          }
          
          // Remove this enemy
          this.liveEnemies = this.liveEnemies.filter(le => le.id !== enemy.id);
          return;
        } else {
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
    if (this.isSimulation) return;
    
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

  breakBlock(col, row) {
    // Clear tile value to 0 in playGrid
    if (this.playGrid) {
      this.playGrid[row][col] = 0;
    }
    if (this.isSimulation) return;

    // 1. Play break SFX
    audio.playBreakSound();

    // 3. Trigger screen shake (removed)
    this.screenShake = 0;

    // 4. Generate break particles
    const px = (col + 0.5) * CONFIG.TILE_SIZE;
    const py = (row + 0.5) * CONFIG.TILE_SIZE;

    // Get color themes for breakable block
    const themeColors = {
      '16bit': ['#b85c27', '#d3733c', '#ac5827', '#5c2a0f'],
      'butterflies': ['#ea698b', '#ff8da1', '#c75175', '#9b2247'],
      'icecream': ['#ffb3c6', '#ffe5ec', '#f8ad9d', '#e07a5f'],
      'spooky': ['#5c3d91', '#704da8', '#482e78', '#2e1954'],
      'default': ['#ab7a4e', '#c69c6d', '#8c6239', '#5c3a21']
    };
    const colors = themeColors[this.theme] || themeColors['default'];

    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.breakParticles.push({
        x: px + (Math.random() - 0.5) * 20,
        y: py + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRotation: (Math.random() - 0.5) * 0.2,
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
        const tileVal = this.getTile(c, r);
        if (tileVal === 1 || tileVal === 2 || tileVal === 6 || tileVal === 7 || tileVal === 8 || tileVal === 10 || tileVal === 11 || tileVal === 17 || tileVal === 19 || tileVal === 20 || tileVal === 22) {
          tiles.push({ col: c, row: r, type: tileVal });
        } else if (tileVal === 12 && this.level.switchState === 'red') {
          tiles.push({ col: c, row: r, type: 12 });
        } else if (tileVal === 13 && this.level.switchState === 'blue') {
          tiles.push({ col: c, row: r, type: 13 });
        } else if (tileVal === 16) {
          tiles.push({ col: c, row: r, type: 16 });
        } else if (tileVal === 24) {
          tiles.push({ col: c, row: r, type: 24 });
        } else if (tileVal === 25) {
          tiles.push({ col: c, row: r, type: 25 });
        } else if (tileVal === 27) {
          tiles.push({ col: c, row: r, type: 27 });
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
      if (tile.type === 11) {
        if (!this.switchCooldown) {
          this.level.switchState = this.level.switchState === 'red' ? 'blue' : 'red';
          this.switchCooldown = 20;
          if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
        }
      }
      if (tile.type === 8) {
        if (this.hasKey) {
          this.level.setTile(tile.col, tile.row, 0);
          this.hasKey = false;
          if (!this.isSimulation && audio.playBreakSound) audio.playBreakSound();
          this.spawnJumpDust();
          continue;
        }
      }
      if (tile.type === 16) {
        this.level.setTile(tile.col, tile.row, 0);
        this.player.hasSpringBoots = true;
        this.spawnJumpDust();
        if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === 24) {
        this.level.setTile(tile.col, tile.row, 0);
        this.player.hasDoubleJump = true;
        this.spawnJumpDust();
        if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === 25) {
        // Collect checkpoint
        this.level.playerSpawn = { col: tile.col, row: tile.row };
        // We do NOT remove the tile so they can see they got it, 
        // or we could replace it with a "checked" flag tile. Let's just remove it and spawn dust!
        this.level.setTile(tile.col, tile.row, 0);
        this.spawnJumpDust();
        if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === 27) {
        this.level.setTile(tile.col, tile.row, 0);
        this.player.hasSpeedBoost = true;
        this.spawnJumpDust();
        if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
        continue;
      }
      if (tile.type === 10) {
        if (this.player.vx > 0) {
          if (this.getTile(tile.col + 1, tile.row) === 0) {
            this.level.setTile(tile.col, tile.row, 0);
            this.level.setTile(tile.col + 1, tile.row, 10);
            this.spawnJumpDust();
            if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
            continue;
          }
        } else if (this.player.vx < 0) {
          if (this.getTile(tile.col - 1, tile.row) === 0) {
            this.level.setTile(tile.col, tile.row, 0);
            this.level.setTile(tile.col - 1, tile.row, 10);
            this.spawnJumpDust();
            if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
            continue;
          }
        }
      }
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
      if (tile.type === 11) {
        if (!this.switchCooldown) {
          this.level.switchState = this.level.switchState === 'red' ? 'blue' : 'red';
          this.switchCooldown = 20;
          if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
        }
      }
      if (tile.type === 8) {
        if (this.hasKey) {
          this.level.setTile(tile.col, tile.row, 0);
          this.hasKey = false;
          if (!this.isSimulation && audio.playBreakSound) audio.playBreakSound();
          this.spawnJumpDust();
          continue;
        }
      }
      const tileTop = tile.row * CONFIG.TILE_SIZE;
      const tileBottom = tileTop + CONFIG.TILE_SIZE;

      if (this.player.vy > 0) {
        // Falling down
        if (playerBox.bottom > tileTop && playerBox.top < tileTop) {
          // If we weren't grounded before, trigger a land squish!
          if (!this.player.isGrounded && this.player.vy > 1.5) {
            this.player.landSquishTimer = 10;
            this.spawnLandDust(this.player.vy);
          }
          this.player.y = tileTop - this.player.height;
          
          if (this.player.charId === 'ball') {
            this.player.vy = Math.min(-6, -this.player.vy * 0.85);
            this.player.isGrounded = false;
            this.player.jumpStretchTimer = 10;
            if (!this.isSimulation && this.player.vy < -2) audio.playBounceSound();
          } else {
            this.player.vy = 0;
            this.player.isGrounded = true;

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

            if (this.player.hasDoubleJump) this.player.doubleJumpAvailable = true;
            this.player.coyoteTimer = CONFIG.COYOTE_TIME;
          }

          playerBox.top = this.player.y;
          playerBox.bottom = this.player.y + this.player.height;

          if (tile.type === 2) {
            this.player.vy = -CONFIG.TRAMPOLINE_BOUNCE_FORCE;
            this.player.isGrounded = false;
            this.player.jumpStretchTimer = 14;
            this.player.landSquishTimer = 0;
            this.spawnJumpDust(); // extra dust burst on trampoline!
            
            if (!this.isSimulation) {
              audio.playBounceSound();
              this.bounceAnims.set(`${tile.col},${tile.row}`, { timer: 15 });
            }
          } else if (tile.type === 22) {
            const key = `${tile.col},${tile.row}`;
            if (!this.crumblingTiles.has(key)) {
              this.crumblingTiles.set(key, { state: 'shaking', timer: 60 });
            }
          }
        }
      } else if (this.player.vy < 0) {
        // Jumping up
        if (playerBox.top < tileBottom && playerBox.bottom > tileBottom) {
          this.player.y = tileBottom;
          this.player.vy = 0;
          playerBox.top = this.player.y;
          playerBox.bottom = this.player.y + this.player.height;

          if (tile.type === 6) {
            this.breakBlock(tile.col, tile.row);
          }
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
      if (this.onWin && !this.isSimulation) this.onWin();
    }
  }

  render() {
    const now = Date.now();
    // Clear Canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake > 0) {
      shakeX = (Math.random() - 0.5) * this.screenShake;
      shakeY = (Math.random() - 0.5) * this.screenShake;
    }
    this.ctx.translate(-Math.floor(this.camera.x) + shakeX, -Math.floor(this.camera.y) + shakeY);

    // 1. Render Level Grid (only tiles in or near view)
    const minCol = Math.max(0, Math.floor(this.camera.x / CONFIG.TILE_SIZE));
    const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((this.camera.x + this.canvas.width) / CONFIG.TILE_SIZE));
    const minRow = Math.max(0, Math.floor(this.camera.y / CONFIG.TILE_SIZE));
    const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((this.camera.y + this.canvas.height) / CONFIG.TILE_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tileVal = this.getTile(c, r);
        const x = c * CONFIG.TILE_SIZE;
        const y = r * CONFIG.TILE_SIZE;

        if (tileVal === 1) {
          if (this.assets.ground && this.theme === 'default') {
            this.ctx.drawImage(this.assets.ground, x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = this.getGroundColor();
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
            const time = now * 0.005;
            // Glowing embers
            if (!this._fireGlow) {
              this._fireGlow = this.ctx.createRadialGradient(CONFIG.TILE_SIZE/2, CONFIG.TILE_SIZE, 5, CONFIG.TILE_SIZE/2, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
              this._fireGlow.addColorStop(0, 'rgba(255, 100, 0, 0.6)');
              this._fireGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
            }
            this.ctx.fillStyle = this._fireGlow;
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
        } else if (tileVal === 5) {
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE / 2);

          const floatOffset = Math.sin(now * 0.004 + (c * 17) + (r * 23)) * 3;
          this.ctx.translate(0, floatOffset);

          const spinScale = Math.cos(now * 0.006 + (c * 7) + (r * 11));
          this.ctx.scale(spinScale, 1);

          if (!this._coinOuterGrad) {
            this._coinOuterGrad = this.ctx.createRadialGradient(0, 0, CONFIG.TILE_SIZE * 0.1, 0, 0, CONFIG.TILE_SIZE * 0.35);
            this._coinOuterGrad.addColorStop(0, '#ffe57f');
            this._coinOuterGrad.addColorStop(0.7, '#ffd60a');
            this._coinOuterGrad.addColorStop(1, '#ffab00');
          }
          this.ctx.fillStyle = this._coinOuterGrad;
          this.ctx.strokeStyle = '#d4a359';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, CONFIG.TILE_SIZE * 0.32, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.fillStyle = '#ffd60a';
          this.ctx.strokeStyle = '#ffe57f';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, CONFIG.TILE_SIZE * 0.22, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();

          this.ctx.fillStyle = '#ffab00';
          this.ctx.font = 'bold 13px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('$', 0, 0.5);

          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.arc(-2, -2, CONFIG.TILE_SIZE * 0.2, Math.PI, Math.PI * 1.5);
          this.ctx.stroke();

          this.ctx.restore();
        } else if (tileVal === 6) {
          this.editor.renderBreakableBlock(x, y, 1, c, r, this);
        } else if (tileVal === 7) {
          this.editor.renderEarthBlock(x, y, 1, c, r, this);
        } else if (tileVal === 8) {
          // Lock Block
          this.ctx.fillStyle = '#9e9e9e';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#616161';
          this.ctx.font = 'bold 20px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('L', x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
        } else if (tileVal === 9) {
          // Key
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE / 2);
          const floatOffset = Math.sin(now * 0.005 + (c * 17) + (r * 23)) * 4;
          this.ctx.translate(0, floatOffset);
          this.ctx.fillStyle = '#ffeb3b';
          this.ctx.fillRect(-10, -5, 20, 10);
          this.ctx.fillStyle = '#c8b900';
          this.ctx.font = 'bold 20px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('K', 0, 0);
          this.ctx.restore();
        } else if (tileVal === 10) {
          // Moveable block
          this.ctx.fillStyle = '#a87a51';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#8a6039';
          this.ctx.fillRect(x + 4, y + 4, CONFIG.TILE_SIZE - 8, CONFIG.TILE_SIZE - 8);
          this.ctx.fillStyle = '#5c3a21';
          this.ctx.fillRect(x + 18, y + 4, 4, CONFIG.TILE_SIZE - 8);
          this.ctx.fillRect(x + 4, y + 18, CONFIG.TILE_SIZE - 8, 4);
        } else if (tileVal === 11) {
          // Switch block
          this.ctx.fillStyle = this.level.switchState === 'blue' ? '#2196f3' : '#f44336';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 20px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(this.level.switchState === 'blue' ? 'B' : 'R', x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
        } else if (tileVal === 12) {
          // Red Block
          if (this.level.switchState === 'red') {
            this.ctx.fillStyle = '#f44336';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.strokeStyle = '#f44336';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x+2, y+2, CONFIG.TILE_SIZE-4, CONFIG.TILE_SIZE-4);
          }
        } else if (tileVal === 13) {
          // Blue Block
          if (this.level.switchState === 'blue') {
            this.ctx.fillStyle = '#2196f3';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.strokeStyle = '#2196f3';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x+2, y+2, CONFIG.TILE_SIZE-4, CONFIG.TILE_SIZE-4);
          }
        } else if (tileVal === 14) {
          // Size Portal
          const cxS = x + CONFIG.TILE_SIZE / 2;
          const cyS = y + CONFIG.TILE_SIZE / 2;
          this.ctx.fillStyle = '#8bc34a';
          this.ctx.beginPath();
          this.ctx.ellipse(cxS, cyS, CONFIG.TILE_SIZE * 0.4, CONFIG.TILE_SIZE * 0.45, 0, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#cddc39';
          this.ctx.lineWidth = 2;
          const rotation = (now * 0.002) % (Math.PI * 2);
          this.ctx.save();
          this.ctx.translate(cxS, cyS);
          this.ctx.rotate(rotation);
          this.ctx.beginPath();
          this.ctx.arc(0, 0, CONFIG.TILE_SIZE * 0.2, 0, Math.PI * 1.5);
          this.ctx.stroke();
          this.ctx.restore();
        } else if (tileVal === 15) {
          // Ghost Block
          this.ctx.save();
          if (!this.ghostIsSolid) {
            this.ctx.globalAlpha = 0.25;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([4, 4]);
            this.ctx.strokeRect(x+2, y+2, CONFIG.TILE_SIZE-4, CONFIG.TILE_SIZE-4);
          } else {
            this.ctx.fillStyle = '#e5e7eb';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            this.ctx.fillStyle = '#9ca3af';
            this.ctx.beginPath();
            this.ctx.arc(x + 10, y + 10, 3, 0, Math.PI * 2);
            this.ctx.arc(x + 22, y + 10, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(x + 16, y + 20, 4, 0, Math.PI, true);
            this.ctx.stroke();
          }
          this.ctx.restore();
        } else if (tileVal === 16) {
          // Spring Boots
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          const floatOffset = Math.sin(now * 0.005 + x) * 4;
          this.ctx.translate(0, floatOffset);
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
          this.ctx.lineTo(5, 9);
          this.ctx.lineTo(5, 13);
          this.ctx.strokeStyle = '#a3a3a3';
          this.ctx.stroke();
          this.ctx.restore();
        } else if (tileVal === 24) {
          // Double Jump Powerup
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          this.ctx.fillStyle = '#0ea5e9'; // Light Blue
          // Small wings icon
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
        } else if (tileVal === 27) {
          // Speed Boost Powerup
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
        } else if (tileVal === 17) {
          // Ice Block
          this.ctx.fillStyle = '#a5f3fc';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#cffafe';
          this.ctx.fillRect(x + 2, y + 2, CONFIG.TILE_SIZE - 4, 4);
          this.ctx.fillRect(x + 2, y + 6, 4, CONFIG.TILE_SIZE - 8);
        } else if (tileVal === 18) {
          // Anti-Gravity Zone
          const cxG = x + CONFIG.TILE_SIZE / 2;
          const cyG = y + CONFIG.TILE_SIZE / 2;
          this.ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
          this.ctx.beginPath();
          this.ctx.arc(cxG, cyG, CONFIG.TILE_SIZE * 0.4, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#c084fc';
          this.ctx.lineWidth = 2;
          const pulse = Math.sin(now * 0.005) * 2;
          this.ctx.beginPath();
          this.ctx.arc(cxG, cyG, CONFIG.TILE_SIZE * 0.3 + pulse, 0, Math.PI * 2);
          this.ctx.stroke();
          // Floating particles effect
          this.ctx.fillStyle = '#d8b4fe';
          this.ctx.beginPath();
          this.ctx.arc(x + CONFIG.TILE_SIZE * 0.3, y + CONFIG.TILE_SIZE - ((now * 0.02) % CONFIG.TILE_SIZE), 2, 0, Math.PI * 2);
          this.ctx.arc(x + CONFIG.TILE_SIZE * 0.7, y + CONFIG.TILE_SIZE - ((now * 0.015 + 10) % CONFIG.TILE_SIZE), 1.5, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (tileVal === 19 || tileVal === 20) {
          // Conveyor Belts
          this.ctx.fillStyle = '#64748b';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#94a3b8';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, 6);
          this.ctx.fillStyle = '#f8fafc';
          this.ctx.beginPath();
          const offset = (now * 0.05) % 10;
          if (tileVal === 19) {
            // Left Conveyor
            this.ctx.moveTo(x + 25 - offset, y + 15);
            this.ctx.lineTo(x + 15 - offset, y + 20);
            this.ctx.lineTo(x + 25 - offset, y + 25);
          } else {
            // Right Conveyor
            this.ctx.moveTo(x + 15 + offset, y + 15);
            this.ctx.lineTo(x + 25 + offset, y + 20);
            this.ctx.lineTo(x + 15 + offset, y + 25);
          }
          this.ctx.fill();
        } else if (tileVal === 21) {
          // Tripwire
          this.ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.strokeStyle = '#ef4444';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          // Pulsing line
          const glow = Math.sin(now * 0.01) * 2;
          this.ctx.moveTo(x, y + CONFIG.TILE_SIZE / 2 + glow);
          this.ctx.lineTo(x + CONFIG.TILE_SIZE, y + CONFIG.TILE_SIZE / 2 + glow);
          this.ctx.stroke();
        } else if (tileVal === 22) {
          // Crumble Block
          const key = `${c},${r}`;
          const crumbleData = this.crumblingTiles.get(key);
          let offsetX = 0;
          let offsetY = 0;
          if (crumbleData && crumbleData.state === 'shaking') {
            offsetX = (Math.random() - 0.5) * 4;
            offsetY = (Math.random() - 0.5) * 4;
          }
          this.ctx.fillStyle = '#b45309';
          this.ctx.fillRect(x + offsetX, y + offsetY, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.strokeStyle = '#78350f';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(x + offsetX + 5, y + offsetY);
          this.ctx.lineTo(x + offsetX + 15, y + offsetY + 15);
          this.ctx.lineTo(x + offsetX + 10, y + offsetY + 25);
          this.ctx.moveTo(x + offsetX + 30, y + offsetY + 10);
          this.ctx.lineTo(x + offsetX + 20, y + offsetY + 20);
          this.ctx.lineTo(x + offsetX + 25, y + offsetY + 40);
          this.ctx.stroke();
        } else if (tileVal === 25) {
          // Checkpoint Flag
          this.ctx.fillStyle = '#ef4444'; // Red flag
          this.ctx.beginPath();
          this.ctx.moveTo(x + 10, y + 5);
          this.ctx.lineTo(x + 30, y + 12);
          this.ctx.lineTo(x + 10, y + 20);
          this.ctx.fill();
          this.ctx.strokeStyle = '#d4d4d8'; // Pole
          this.ctx.lineWidth = 4;
          this.ctx.beginPath();
          this.ctx.moveTo(x + 10, y + 5);
          this.ctx.lineTo(x + 10, y + 40);
          this.ctx.stroke();
        } else if (tileVal === 26) {
          // Fake Wall (looks like Earth, tile 7)
          this.ctx.fillStyle = '#4ade80';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, 8);
          this.ctx.fillStyle = '#8b5a2b';
          this.ctx.fillRect(x, y + 8, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE - 8);
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
    const time = now * 0.003;
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

    // Render Coin Particles
    this.coinParticles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = '#ffe57f';
      this.ctx.strokeStyle = '#ffd60a';
      this.ctx.lineWidth = 1;
      this.ctx.translate(p.x, p.y);
      this.ctx.beginPath();
      this.ctx.moveTo(0, -p.size);
      this.ctx.lineTo(p.size * 0.7, 0);
      this.ctx.lineTo(0, p.size);
      this.ctx.lineTo(-p.size * 0.7, 0);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();
      this.ctx.restore();
    });

    // Render Break Particles
    this.breakParticles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
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
      let isEdit = this.mode === CONFIG.MODE_EDIT;
      let renderCharId = this.player.charId;
      
      if (isEdit) {
        // In edit mode, render player at spawn location
        px = this.level.playerSpawn.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.width) / 2;
        py = this.level.playerSpawn.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.height);
        renderCharId = this.level.playerSpawn.charId || 'ghibli';
      }

      // Render Player Trails (Ghosting)
      if (!this.isSimulation && !isEdit) {
        if (renderCharId !== 'classic') {
          this.playerTrails.forEach(t => {
            this.drawForestKid(
              this.ctx,
              t.x,
              t.y,
              this.player.width,
              this.player.height,
              t.facing,
              t.scaleX,
              t.scaleY,
              t.tiltAngle,
              t.alpha,
              true, // isTrail
              t.theme
            );
          });
        }

        // Render Dust Particles
        this.dustParticles.forEach(p => {
          this.ctx.save();
          this.ctx.globalAlpha = p.alpha;
          this.ctx.fillStyle = this.theme === 'spooky' ? 'rgba(0, 255, 204, 0.4)' : 'rgba(235, 230, 225, 0.55)';
          this.ctx.beginPath();
          if (p.isSquare) {
            this.ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
          } else {
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.restore();
        });
      }

      if (renderCharId === 'classic') {
        this.drawClassicBox(
          this.ctx,
          px,
          py,
          this.player.width,
          this.player.height,
          isEdit ? 'right' : this.player.facing,
          isEdit ? 1 : this.player.scaleX,
          isEdit ? 1 : this.player.scaleY,
          isEdit ? 0 : this.player.tiltAngle,
          1.0
        );
      } else if (renderCharId === 'ball') {
        this.ctx.save();
        this.ctx.translate(px + this.player.width / 2, py + this.player.height / 2);
        const sx = isEdit ? 1 : this.player.scaleX;
        const sy = isEdit ? 1 : this.player.scaleY;
        this.ctx.scale(sx, sy);
        this.ctx.beginPath();
        const r = this.player.width / 2;
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ff9800';
        this.ctx.fill();
        this.ctx.strokeStyle = '#e65100';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.restore();
      } else if (renderCharId === 'topdown') {
        this.ctx.fillStyle = '#9c27b0';
        this.ctx.fillRect(px, py, this.player.width, this.player.height);
      } else if (renderCharId === 'paddle_h' || renderCharId === 'paddle_v') {
        this.ctx.fillStyle = '#009688';
        this.ctx.fillRect(px, py, this.player.width, this.player.height);
      } else {
        // Draw our custom Ghibli Forest Kid!
        this.drawForestKid(
          this.ctx,
          px,
          py,
          this.player.width,
          this.player.height,
          isEdit ? 'right' : this.player.facing,
          isEdit ? 1 : this.player.scaleX,
          isEdit ? 1 : this.player.scaleY,
          isEdit ? 0 : this.player.tiltAngle,
          1.0
        );
      }
    }

    // 6.5 Render Platforms
    if (this.livePlatforms) {
      for (const plat of this.livePlatforms) {
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        this.ctx.fillStyle = '#d97706';
        this.ctx.fillRect(plat.x, plat.y + plat.height, plat.width, plat.height / 2);
        this.ctx.fillStyle = '#fef3c7';
        this.ctx.beginPath();
        this.ctx.moveTo(plat.x + 5, plat.y + 10);
        this.ctx.lineTo(plat.x + plat.width - 5, plat.y + 10);
        this.ctx.stroke();
      }
    }

    // 7. Render Particles – Ghibli Soot Sprite style (play mode = live; edit mode = spawn markers)
    const drawSootSprite = (ctx, cx, cy, radius, walkFrame, alpha = 1, type = 'patrol') => {
      ctx.save();
      ctx.globalAlpha = alpha;

      // ── Soft shadow ────────────────────────────────────────────────────────
      ctx.save();
      ctx.globalAlpha = alpha * 0.22;
      const shadowGrad = ctx.createRadialGradient(cx, cy + radius + 2, 0, cx, cy + radius + 2, radius * 0.9);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy + radius + 3, radius * 0.85, radius * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // ── Fluffy body (main round blob) ──────────────────────────────────────
      // Slight vertical bob driven by walkFrame
      const bob = Math.sin(walkFrame * Math.PI / 2) * (radius * 0.06);
      const bodyY = cy + bob;

      // Outer glow / soft aura – warm charcoal
      const aura = ctx.createRadialGradient(cx - radius * 0.15, bodyY - radius * 0.1, 0, cx, bodyY, radius * 1.35);
      aura.addColorStop(0, 'rgba(60,45,55,0)');
      aura.addColorStop(0.6, 'rgba(30,22,28,0)');
      aura.addColorStop(1, 'rgba(20,12,18,0.18)');
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(cx, bodyY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Main body – slightly warm dark charcoal gradient
      const bodyGrad = ctx.createRadialGradient(cx - radius * 0.25, bodyY - radius * 0.25, radius * 0.05, cx, bodyY, radius);
      if (type === 'chaser') {
        bodyGrad.addColorStop(0, '#b43232');   // highlight
        bodyGrad.addColorStop(0.45, '#8c1919'); // midtone
        bodyGrad.addColorStop(1, '#3c0000');   // deep shadow
      } else {
        bodyGrad.addColorStop(0, '#3d3035');   // warm highlight
        bodyGrad.addColorStop(0.45, '#1e1720');
        bodyGrad.addColorStop(1, '#0e0b10');   // deep shadow
      }
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(cx, bodyY, radius, 0, Math.PI * 2);
      ctx.fill();

      // ── Fluffy bumps around silhouette (hand-drawn Ghibli feel) ────────────
      const bumps = 9;
      const bumpR = radius * 0.28;
      for (let i = 0; i < bumps; i++) {
        const angle = (i / bumps) * Math.PI * 2 - Math.PI * 0.5;
        const bx = cx + Math.cos(angle) * (radius * 0.88);
        const by = bodyY + Math.sin(angle) * (radius * 0.88);
        // Each bump has a slightly different size for organic feel
        const br = bumpR * (0.75 + 0.35 * Math.sin(i * 2.3 + 1.1));
        if (type === 'chaser') {
          ctx.fillStyle = i % 2 === 0 ? '#962828' : '#781414';
        } else {
          ctx.fillStyle = i % 2 === 0 ? '#221c25' : '#1a141e';
        }
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Large Ghibli eyes ──────────────────────────────────────────────────
      const eyeOffsetX = radius * 0.38;
      const eyeOffsetY = radius * 0.05;
      const eyeR = radius * 0.38;

      // Eye whites – very soft, slightly warm
      [-1, 1].forEach(side => {
        const ex = cx + side * eyeOffsetX;
        const ey2 = bodyY + eyeOffsetY;

        // Soft outer ring for the eye
        ctx.fillStyle = 'rgba(245,240,235,0.96)';
        ctx.beginPath();
        ctx.arc(ex, ey2, eyeR, 0, Math.PI * 2);
        ctx.fill();

        // Deep black iris / pupil
        ctx.fillStyle = type === 'chaser' ? '#ffe000' : '#0d0a0f';
        ctx.beginPath();
        ctx.arc(ex, ey2 + eyeR * 0.08, eyeR * 0.62, 0, Math.PI * 2);
        ctx.fill();

        // Large warm-brown iris ring (Ghibli eyes have depth)
        ctx.strokeStyle = 'rgba(90,55,30,0.5)';
        ctx.lineWidth = eyeR * 0.18;
        ctx.beginPath();
        ctx.arc(ex, ey2 + eyeR * 0.08, eyeR * 0.44, 0, Math.PI * 2);
        ctx.stroke();

        // Primary white catchlight (big, upper-left – classic Ghibli)
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.beginPath();
        ctx.arc(ex - eyeR * 0.22, ey2 - eyeR * 0.22, eyeR * 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Secondary tiny catchlight (lower-right)
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(ex + eyeR * 0.22, ey2 + eyeR * 0.18, eyeR * 0.09, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Scurrying thin Ghibli legs ─────────────────────────────────────────
      // 4 legs, alternating up/down with walkFrame
      const legY = bodyY + radius * 0.72;
      const legSpacing = radius * 0.38;
      const legLen = radius * 0.52;
      ctx.strokeStyle = '#1e1720';
      ctx.lineWidth = Math.max(1.5, radius * 0.12);
      ctx.lineCap = 'round';
      for (let i = -1; i <= 2; i++) {
        const lx = cx + (i - 0.5) * legSpacing;
        // Alt legs bob opposite phase
        const phase = (i + walkFrame) % 2 === 0 ? 1 : -1;
        const footY = legY + legLen + phase * (radius * 0.15);
        ctx.beginPath();
        ctx.moveTo(lx, legY);
        ctx.quadraticCurveTo(lx + phase * (radius * 0.1), legY + legLen * 0.5, lx, footY);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawThwomp = (ctx, cx, cy, width, height, state) => {
      ctx.save();
      const x = cx - width / 2;
      const y = cy - height / 2;
      ctx.fillStyle = '#607d8b';
      ctx.fillRect(x, y, width, height);
      // draw angry eyes
      ctx.fillStyle = state === 'falling' ? '#ff5252' : '#263238';
      ctx.fillRect(x + 8, y + 15, 6, 6);
      ctx.fillRect(x + 26, y + 15, 6, 6);
      // draw spikes on bottom
      ctx.fillStyle = '#cfd8dc';
      ctx.beginPath();
      ctx.moveTo(x, y + height);
      ctx.lineTo(x + 10, y + height + 10);
      ctx.lineTo(x + 20, y + height);
      ctx.lineTo(x + 30, y + height + 10);
      ctx.lineTo(x + 40, y + height);
      ctx.fill();
      ctx.restore();
    };

    const drawLazer = (ctx, cx, cy, width, height, state, beams) => {
      ctx.save();
      const x = cx - width / 2;
      const y = cy - height / 2;
      
      // Draw beams
      if (state === 'warn' || state === 'fire') {
        const bX = x + 10;
        const bY = y + 10;
        const bW = 20;
        const bH = 20;
        ctx.fillStyle = state === 'warn' ? 'rgba(233, 30, 99, 0.3)' : 'rgba(233, 30, 99, 0.9)';
        if (state === 'fire') {
          ctx.shadowColor = '#e91e63';
          ctx.shadowBlur = 10;
        }
        
        if (beams) {
          // up
          ctx.fillRect(bX, y - beams.up * CONFIG.TILE_SIZE, bW, beams.up * CONFIG.TILE_SIZE);
          // down
          ctx.fillRect(bX, y + CONFIG.TILE_SIZE, bW, beams.down * CONFIG.TILE_SIZE);
          // left
          ctx.fillRect(x - beams.left * CONFIG.TILE_SIZE, bY, beams.left * CONFIG.TILE_SIZE, bH);
          // right
          ctx.fillRect(x + CONFIG.TILE_SIZE, bY, beams.right * CONFIG.TILE_SIZE, bH);
        }
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = '#111';
      ctx.fillRect(x + 10, y + 10, 20, 20);
      
      if (state === 'fire') {
         ctx.fillStyle = '#fff';
      } else if (state === 'warn') {
         // Blink
         ctx.fillStyle = Math.floor(now / 100) % 2 === 0 ? '#e91e63' : '#111';
      } else {
         ctx.fillStyle = '#e91e63';
      }
      ctx.fillRect(x + 15, y + 15, 10, 10);

      ctx.restore();
    };

    if (this.mode === CONFIG.MODE_PLAY) {
      for (const enemy of this.liveEnemies) {
        if (enemy.type === 'thwomp') {
          const cx = enemy.x + enemy.width / 2;
          const cy = enemy.y + enemy.height / 2;
          drawThwomp(this.ctx, cx, cy, enemy.width, enemy.height, enemy.state);
        } else if (enemy.type === 'lazer') {
          const cx = enemy.x + enemy.width / 2;
          const cy = enemy.y + enemy.height / 2;
          drawLazer(this.ctx, cx, cy, enemy.width, enemy.height, enemy.state, enemy.beams);
        } else {
          // Centre of the sprite
          const cx = enemy.x + enemy.width / 2;
          const cy = enemy.y + enemy.height / 2 - enemy.height * 0.05;
          const radius = enemy.width * 0.52;
          drawSootSprite(this.ctx, cx, cy, radius, enemy.walkFrame, 1, enemy.type);
        }
      }
    } else if (this.mode === CONFIG.MODE_EDIT) {
      // Ghost spawn markers in edit mode
      for (const e of this.level.enemies) {
        if (e.type === 'thwomp') {
          const cx = e.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          const cy = e.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          this.ctx.globalAlpha = 0.6;
          drawThwomp(this.ctx, cx, cy, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, 'idle');
          this.ctx.globalAlpha = 1.0;
        } else if (e.type === 'lazer') {
          const cx = e.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          const cy = e.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          this.ctx.globalAlpha = 0.6;
          drawLazer(this.ctx, cx, cy, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE, 'idle');
          this.ctx.globalAlpha = 1.0;
        } else {
          const cx = e.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          const cy = e.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          const radius = CONFIG.TILE_SIZE * 0.38;
          drawSootSprite(this.ctx, cx, cy, radius, 0, 0.6, e.type);
        }
        // Patrol range dashed line
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(180,150,180,0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([4, 4]);
        this.ctx.strokeRect(
          (e.col - e.patrolRange) * CONFIG.TILE_SIZE,
          e.row * CONFIG.TILE_SIZE,
          e.patrolRange * 2 * CONFIG.TILE_SIZE,
          CONFIG.TILE_SIZE
        );
        this.ctx.setLineDash([]);
        this.ctx.restore();
      }
    }


    // 5. Render Editor Overlay if in Edit Mode
    if (this.mode === CONFIG.MODE_EDIT) {
      this.editor.render();
    }

    if (this.onPostRender) {
      this.onPostRender(this.ctx);
    }

    this.ctx.restore();
  }
}
