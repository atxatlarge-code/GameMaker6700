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
    this.coinParticles = [];
    this.breakParticles = [];
    this.screenShake = 0;

    if (this.mode === CONFIG.MODE_PLAY) {
      this.playGrid = JSON.parse(JSON.stringify(this.level.grid));
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
        if (this.player.isGrounded) {
          this.player.vy = -CONFIG.JUMP_FORCE;
          this.player.isGrounded = false;
          audio.playJumpSound();
        }
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
        if (this.isAutoplay) {
          this.autoplayIndex = 0;
          this.autoplayFrameCount = 0;
          this.hasWon = false;
        }
      }
      return;
    }

    // Autoplay action override
    if (this.isAutoplay) {
      if (this.autoplayPath && this.autoplayIndex < this.autoplayPath.length) {
        const act = this.autoplayPath[this.autoplayIndex];
        this.keys.left = act.left;
        this.keys.right = act.right;

        if (this.autoplayFrameCount === 0 && act.jump && this.player.isGrounded) {
          this.player.vy = -CONFIG.JUMP_FORCE;
          this.player.isGrounded = false;
          audio.playJumpSound();
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

    // Update screen shake
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 0.5);
    }

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

    // Check Coins
    this.checkCoins();

    // Update and check enemies
    this.updateEnemies();

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
        if (tileVal === 5) {
          this.setTile(c, r, 0);
          this.coinsCollected++;
          
          if (this.isSimulation) continue;

          audio.playCoinSound();
          const hudVal = document.getElementById('hud-coins-collected');
          if (hudVal) hudVal.textContent = this.coinsCollected.toString();

          const coinCenterX = c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          const coinCenterY = r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          this.spawnCoinParticles(coinCenterX, coinCenterY);
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

  // ── Enemy AI ─────────────────────────────────────────────────────────────
  updateEnemies() {
    if (this.isDead || this.hasWon) return;

    for (const enemy of this.liveEnemies) {

      // ── Gravity ────────────────────────────────────────────────────────────
      enemy.vy += CONFIG.GRAVITY;
      if (enemy.vy > 12) enemy.vy = 12; // terminal velocity

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

      // ── Horizontal patrol (only when on the ground) ────────────────────────
      if (enemy.isGrounded) {
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
            enemy.vx = -enemy.speed;
            enemy.facing = 'left';
          }
        } else {
          const leftCol = Math.floor(enemy.x / CONFIG.TILE_SIZE);
           // Reverse if hitting a wall OR if about to step off an edge
          const nextFloor = this.getTile(leftCol, footRow);
          const wallAhead = this.getTile(leftCol, row) === 1 || this.getTile(leftCol, row) === 7;
          const edgeAhead = nextFloor !== 1 && nextFloor !== 2 && nextFloor !== 7;
          if (wallAhead || edgeAhead) {
            enemy.x = (leftCol + 1) * CONFIG.TILE_SIZE;
            enemy.vx = enemy.speed;
            enemy.facing = 'right';
          }
        }

        // Patrol range edges
        if (enemy.x <= enemy.patrolLeft) {
          enemy.x = enemy.patrolLeft;
          enemy.vx = enemy.speed;
          enemy.facing = 'right';
        } else if (enemy.x + enemy.width >= enemy.patrolRight) {
          enemy.x = enemy.patrolRight - enemy.width;
          enemy.vx = -enemy.speed;
          enemy.facing = 'left';
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
        if (tileVal === 1 || tileVal === 2 || tileVal === 6 || tileVal === 7) {
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
            
            if (!this.isSimulation) {
              audio.playBounceSound();
              this.bounceAnims.set(`${tile.col},${tile.row}`, { timer: 15 });
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
        } else if (tileVal === 5) {
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE / 2);

          const floatOffset = Math.sin(Date.now() * 0.004 + (c * 17) + (r * 23)) * 3;
          this.ctx.translate(0, floatOffset);

          const spinScale = Math.cos(Date.now() * 0.006 + (c * 7) + (r * 11));
          this.ctx.scale(spinScale, 1);

          const outerGrad = this.ctx.createRadialGradient(0, 0, CONFIG.TILE_SIZE * 0.1, 0, 0, CONFIG.TILE_SIZE * 0.35);
          outerGrad.addColorStop(0, '#ffe57f');
          outerGrad.addColorStop(0.7, '#ffd60a');
          outerGrad.addColorStop(1, '#ffab00');
          this.ctx.fillStyle = outerGrad;
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

    // 4. Render Enemies – Ghibli Soot Sprite style (play mode = live; edit mode = spawn markers)
    const drawSootSprite = (ctx, cx, cy, radius, walkFrame, alpha = 1) => {
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
      bodyGrad.addColorStop(0, '#3d3035');   // warm highlight
      bodyGrad.addColorStop(0.45, '#1e1720');
      bodyGrad.addColorStop(1, '#0e0b10');   // deep shadow
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
        ctx.fillStyle = i % 2 === 0 ? '#221c25' : '#1a141e';
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
        ctx.fillStyle = '#0d0a0f';
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

    if (this.mode === CONFIG.MODE_PLAY) {
      for (const enemy of this.liveEnemies) {
        // Centre of the sprite
        const cx = enemy.x + enemy.width / 2;
        const cy = enemy.y + enemy.height / 2 - enemy.height * 0.05;
        const radius = enemy.width * 0.52;
        drawSootSprite(this.ctx, cx, cy, radius, enemy.walkFrame);
      }
    } else if (this.mode === CONFIG.MODE_EDIT) {
      // Ghost spawn markers in edit mode
      for (const e of this.level.enemies) {
        const cx = e.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const cy = e.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const radius = CONFIG.TILE_SIZE * 0.38;
        drawSootSprite(this.ctx, cx, cy, radius, 0, 0.6);
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
