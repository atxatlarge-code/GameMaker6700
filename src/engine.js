import { EnemySystem } from './systems/enemy_system.js';
import { HazardSystem } from './systems/hazard_system.js';
import { InteractiveSystem } from './systems/interactive_system.js';
import { PhysicsEngine } from './physics.js';
import { InputManager } from './input.js';
import { drawBlob } from './art/blob.js';
import { drawForestKid } from './art/forest_kid.js';
import { drawRobot } from './art/robot.js';
import { drawTopDownPlayer } from './art/top_down_player.js';
import { drawClassicBox } from './art/classic_box.js';
import { CONFIG } from './config.js';
import { audio } from './audio.js';
import { World } from './ecs/world.js';
import { Components, createTransform, createVelocity, createCollider, createRenderable, createPlayerControl, createGravity } from './ecs/components.js';
import { MovementSystem, GravitySystem, RenderSystem } from './ecs/systems.js';
import { TILE } from './tiles.js';

export class Engine {

  saveState() {
    return {
      player: { ...this.player, grappleHook: this.player.grappleHook ? { ...this.player.grappleHook } : null },
      isDead: this.isDead,
      deathTimer: this.deathTimer,
      portalCooldown: this.portalCooldown,
      lastPortalExited: this.lastPortalExited,
      lastDoorExited: this.lastDoorExited ? { ...this.lastDoorExited } : null,
      hasWon: this.hasWon,
      liveEnemies: this.liveEnemies ? this.liveEnemies.map(e => ({ ...e })) : [],
      playGrid: this.playGrid ? this.playGrid.map(row => row.slice()) : null,
      coinsCollected: this.coinsCollected,
      stalactites: this.stalactites ? this.stalactites.map(s => ({ ...s })) : [],
      boomerangs: this.boomerangs ? this.boomerangs.map(b => ({ ...b })) : [],
      bombs: this.bombs ? this.bombs.map(b => ({ ...b })) : [],
      explosions: this.explosions ? this.explosions.map(e => ({ ...e })) : [],
      livePlatforms: this.livePlatforms ? this.livePlatforms.map(p => ({ ...p })) : [],
      crumblingTiles: this.crumblingTiles ? new Map(Array.from(this.crumblingTiles.entries()).map(([k, v]) => [k, { ...v }])) : new Map(),
      shadowClone: this.shadowClone ? { ...this.shadowClone } : null,
      gravityDir: this.level ? this.level.gravityDir : 1,
      tickCount: this.tickCount,
      ghostTimer: this.ghostTimer,
      ghostIsSolid: this.ghostIsSolid,
      ghostRecording: this.ghostRecording,
      ghostRecordTimer: this.ghostRecordTimer,
      ghostFrames: this.ghostFrames ? [...this.ghostFrames] : [],
      ghostActive: this.ghostActive,
      ghostPlaybackIndex: this.ghostPlaybackIndex,
      ghostData: this.ghost ? { ...this.ghost } : null
    };
  }

  restoreState(s) {
    Object.assign(this.player, s.player);
    if (s.player.grappleHook) {
      this.player.grappleHook = { ...s.player.grappleHook };
    } else {
      this.player.grappleHook = null;
    }
    
    this.isDead = s.isDead;
    this.deathTimer = s.deathTimer;
    this.portalCooldown = s.portalCooldown;
    this.lastPortalExited = s.lastPortalExited;
    this.lastDoorExited = s.lastDoorExited ? { ...s.lastDoorExited } : null;
    this.hasWon = s.hasWon;
    this.liveEnemies = s.liveEnemies ? s.liveEnemies.map(e => ({ ...e })) : [];
    this.playGrid = s.playGrid ? s.playGrid.map(row => row.slice()) : null;
    this.coinsCollected = s.coinsCollected;
    this.stalactites = s.stalactites ? s.stalactites.map(st => ({ ...st })) : [];
    this.boomerangs = s.boomerangs ? s.boomerangs.map(b => ({ ...b })) : [];
    this.bombs = s.bombs ? s.bombs.map(b => ({ ...b })) : [];
    this.explosions = s.explosions ? s.explosions.map(e => ({ ...e })) : [];
    this.livePlatforms = s.livePlatforms ? s.livePlatforms.map(p => ({ ...p })) : [];
    this.crumblingTiles = s.crumblingTiles ? new Map(Array.from(s.crumblingTiles.entries()).map(([k, v]) => [k, { ...v }])) : new Map();
    this.shadowClone = s.shadowClone ? { ...s.shadowClone } : null;
    if (this.level) this.level.gravityDir = s.gravityDir;
    this.tickCount = s.tickCount;
    this.ghostTimer = s.ghostTimer;
    this.ghostIsSolid = s.ghostIsSolid;
    this.ghostRecording = s.ghostRecording;
    this.ghostRecordTimer = s.ghostRecordTimer;
    this.ghostFrames = s.ghostFrames ? [...s.ghostFrames] : [];
    this.ghostActive = s.ghostActive;
    this.ghostPlaybackIndex = s.ghostPlaybackIndex;
    this.ghost = s.ghostData ? { ...s.ghostData } : null;
  }

  constructor(canvas, level, editor, assets, onWin) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.level = level;
    this.editor = editor;
    this.assets = assets;
    this.onWin = onWin;

    // ECS Initialization
    this.ecsWorld = new World();

    this.mode = CONFIG.MODE_EDIT;
    this.isRunning = false;
    this.hasWon = false;

    this.bombs = [];
    this.explosions = [];
    this.theme = 'default';
    this.camera = { x: 0, y: 0 };
    this.liveEnemies = [];

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
      hasBombs: false,
    };

    this.isDead = false;
    this.deathTimer = 0;
    this.deathParticles = [];
    this.portalCooldown = 0;
    this.teleportParticles = [];
    this.timeFreezeTimer = 0;
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

    this.ghostRecording = false;
    this.ghostRecordTimer = 0;
    this.ghostFrames = [];
    this.ghostActive = false;
    this.ghostPlaybackIndex = 0;
    this.ghost = null;

    // Live enemy instances (created when entering play mode)
    this.liveEnemies = [];

this.bounceAnims = new Map();
this.inputManager = new InputManager(this);
    this.physics = new PhysicsEngine(this);
    this.enemySystem = new EnemySystem(this);
    this.hazardSystem = new HazardSystem(this);
    this.interactiveSystem = new InteractiveSystem(this);
    this.keys = this.inputManager.keys;
    this.panKeys = this.inputManager.panKeys;
    this.inputManager.initListeners();
    this.resetPlayer();
  }

  setMode(mode) {
    this.mode = mode;
    const panControls = document.getElementById('pan-controls');
    const playHud = document.getElementById('play-hud');
    if (mode === CONFIG.MODE_PLAY) {
      if (panControls) panControls.classList.add('hidden');
      if (playHud) playHud.classList.remove('hidden');
      this.levelStartTime = performance.now();
      this.levelTimeElapsed = 0;
      this.levelTimeElapsed = 0;
      this.deathCount = 0; // Reset death count when starting a new level session
      this.resetPlayer();
      this.hasWon = false;
      this.transitionActive = false;
      this.transitionComplete = false;
      this.irisRadius = null;
      this.beamAlpha = 0;
      this.beamParallaxOffset = 0;
      
      const canvas = document.getElementById('game-canvas');
      if (canvas) {
        canvas.classList.remove('canvas-zoom-in');
        canvas.style.transform = '';
        canvas.style.filter = '';
        canvas.style.transformOrigin = '';
      }
      if (this.editor) {
        this.editor.isMouseDown = false;
        this.editor.hoverCol = -1;
        this.editor.hoverRow = -1;
      }
    } else {
      if (panControls) panControls.classList.remove('hidden');
      if (playHud) playHud.classList.add('hidden');
    }
    this.keys = { left: false, right: false, up: false, down: false };
    this.panKeys = { up: false, down: false, left: false, right: false };
    this.prevGamepadState = { left: false, right: false, down: false, jump: false, dash: false, grapple: false, bomb: false };
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
    } else if (this.player.charId === 'blob') {
      this.player.width = 30;
      this.player.height = 30;
    } else if (this.player.charId === 'robot') {
      this.player.width = 28;
      this.player.height = 36;
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
    
    // Set base sizes for shrinking/growing
    this.player.baseWidth = this.player.width;
    this.player.baseHeight = this.player.height;

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
    this.player.hasDash = false;
    this.player.dashAvailable = false;
    this.player.isDashing = false;
    this.player.dashTimer = 0;
    this.player.hasMagneticBoots = false;
    this.player.isShrunk = false;
    this.player.magneticState = 'none';
    this.player.hasGrapple = false;
    this.player.grappleHook = null;
    this.player.coyoteTimer = 0;
    this.player.jumpBufferTimer = 0;
    this.player.scaleX = 1;
    this.player.scaleY = 1;
    this.player.tiltAngle = 0;
    this.player.isInsideCannon = false;
    this.player.cannonAngle = 0;
    this.player.cannonDir = 1;
    this.player.cannonCooldown = 0;
    this.player.isSwinging = false;
    this.player.swingAngle = 0;
    this.player.swingVelocity = 0;
    this.player.swingAnchor = null;
    this.player.blinkTimer = 0;
    this.player.blinkDuration = 0;
    this.player.walkCycle = 0;
    this.player.landSquishTimer = 0;
    
    // Level animations
    this.crumblingBlocks = [];
    this.ghostTimer = 0;
    this.screenShake = 0;
    this.cameraShake = 0;
    this.cameraLocked = false;
    this.timeFreezeTimer = 0;
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
      this.turrets = [];
      this.turretProjectiles = [];
      this.ropes = [];
      this.minecarts = [];
      this.gravityWells = [];
      for (let r = 0; r < CONFIG.GRID_ROWS; r++) {
        for (let c = 0; c < CONFIG.GRID_COLS; c++) {
          if (this.playGrid[r][c] === TILE.COIN) {
            this.totalCoins++;
          }
          if (this.playGrid[r][c] === TILE.TURRET) {
            this.turrets.push({
              col: c,
              row: r,
              timer: 0,
              interval: 150
            });
          }
          if (this.playGrid[r][c] === TILE.GRAVITY_WELL) {
            this.gravityWells.push({
              col: c,
              row: r,
              x: c * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2,
              y: r * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2
            });
          }
          if (this.playGrid[r][c] === TILE.ROPE) {
            this.ropes.push({
              col: c,
              row: r,
              angle: 0,
              velocity: 0,
              length: 120 // pixels
            });
          }
          if (this.playGrid[r][c] === TILE.MINECART) {
            this.minecarts.push({
              id: Date.now() + Math.random(),
              x: c * CONFIG.TILE_SIZE,
              y: r * CONFIG.TILE_SIZE,
              width: CONFIG.TILE_SIZE,
              height: CONFIG.TILE_SIZE,
              vx: 0,
              vy: 0,
              isOccupied: false,
              isGrounded: false
            });
            // We clear the tile so it doesn't render as a normal static tile
            this.playGrid[r][c] = TILE.EMPTY;
          }
        }
      }
      const hudVal = document.getElementById('hud-coins-collected');
      const hudTotal = document.getElementById('hud-total-coins');
      if (hudVal) hudVal.textContent = '0';
      if (hudTotal) hudTotal.textContent = this.totalCoins.toString();
    } else {
      this.playGrid = null;
      this.turrets = [];
      this.turretProjectiles = [];
      this.ropes = [];
      this.minecarts = [];
      this.gravityWells = [];
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
      patrolLeft: (e.col - (e.patrolRange || 0)) * CONFIG.TILE_SIZE,
      patrolRight: (e.col + (e.patrolRange || 0)) * CONFIG.TILE_SIZE,
      facing: 'right',
      walkFrame: 0,
      walkTimer: 0,
      type: e.type || 'basic',
      wormState: 'hidden', // 'hidden', 'popping_up', 'up', 'popping_down'
      wormTimer: 0,
      batState: 'sleeping', // 'sleeping', 'swooping', 'returning'
      batTimer: 0,
      mimicState: 'disguised', // 'disguised', 'revealing', 'chasing'
      mimicTimer: 0
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

    // ECS Player Entity Facade Sync
    if (this.ecsPlayerId !== undefined) {
      this.ecsWorld.destroyEntity(this.ecsPlayerId);
    }
    this.ecsPlayerId = this.ecsWorld.createEntity();
    this.ecsWorld.addComponent(this.ecsPlayerId, Components.Transform, createTransform(this.player.x, this.player.y, this.player.width, this.player.height));
    this.ecsWorld.addComponent(this.ecsPlayerId, Components.Velocity, createVelocity(0, 0));
    this.ecsWorld.addComponent(this.ecsPlayerId, Components.Collider, createCollider(true));
    this.ecsWorld.addComponent(this.ecsPlayerId, Components.Renderable, createRenderable(this.player.charId, 'right'));
    this.ecsWorld.addComponent(this.ecsPlayerId, Components.PlayerControl, createPlayerControl());
    this.ecsWorld.addComponent(this.ecsPlayerId, Components.Gravity, createGravity(1));
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
      // Speed-adaptive camera with look-ahead
      const speed = Math.hypot(this.player.vx, this.player.vy);
      
      // Look-ahead: offset camera in movement direction for better visibility
      let lookAheadX = this.player.vx * 12; // ~12 frames ahead
      let lookAheadY = Math.min(this.player.vy * 6, 60); // Less vertical look-ahead, capped
      
      // Disable lookahead during zoom so the player is perfectly centered
      if (this.hasWon && window.transitionStyle === 'zoom') {
        lookAheadX = 0;
        lookAheadY = 0;
      }
      
      const targetX = this.player.x + this.player.width / 2 - this.canvas.width / 2 + lookAheadX;
      const targetY = this.player.y + this.player.height / 2 - this.canvas.height / 2 + lookAheadY;
      
      // Faster lerp at higher speeds for responsive tracking during dashes
      const baseLerp = 0.08;
      const speedBoost = Math.min(0.12, speed * 0.008);
      const lerp = baseLerp + speedBoost;
      
      this.camera.x += (targetX - this.camera.x) * lerp;
      
      if (this.hasWon && window.transitionStyle === 'beam') {
        // Pan the camera up smoothly so the player escapes it
        this.camera.y -= 2.0;
        this.camera.x = Math.max(0, Math.min(maxCamX, this.camera.x));
        this.camera.y = Math.min(maxCamY, this.camera.y);
      } else if (this.hasWon && window.transitionStyle === 'zoom') {
        // Smoothly pan to the center of the player, DO NOT CLAMP out of bounds
        // This ensures the player slides perfectly into the center of the zoom!
        this.camera.y += (targetY - this.camera.y) * lerp;
      } else {
        this.camera.y += (targetY - this.camera.y) * lerp;
        this.camera.x = Math.max(0, Math.min(maxCamX, this.camera.x));
        this.camera.y = Math.max(0, Math.min(maxCamY, this.camera.y));
      }
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
      if (this.mode === CONFIG.MODE_PLAY) {
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
    this.inputManager.pollGamepad();

    // Cinematic transition update tick
    if (this.hasWon) {
      if (!this.isSimulation) {
        const style = window.transitionStyle || 'none';
        
        // Celebration Animation!
        if (style !== 'beam') {
          // Bounce and spin
          this.player.vy += CONFIG.GRAVITY;
          this.player.y += this.player.vy;
          this.physics.resolveVerticalCollisions();
          
          if (this.player.isGrounded) {
             this.player.vy = -7; // Jump!
             this.player.isGrounded = false;
             if (window.audio && window.audio.playJumpSound) window.audio.playJumpSound();
          }
          
          // Spin while in the air
          if (!this.player.isGrounded) {
             this.player.tiltAngle += 0.25; // Spin clockwise
          } else {
             this.player.tiltAngle = 0; // Reset
          }
        }

        if (this.transitionActive) {
          if (style === 'iris') {
            if (this.irisRadius > 0) this.irisRadius -= 8;
            if (this.irisRadius <= 0 && !this.transitionComplete) {
              this.transitionComplete = true;
              if (this.onWin) this.onWin();
            }
          } else if (style === 'beam') {
            this.player.vy = -6.0; // float up much faster
            this.player.y += this.player.vy;
            this.player.tiltAngle += 0.4; // Spin fast while beaming up
            this.beamAlpha = Math.min(0.4, (this.beamAlpha || 0) + 0.05); // more transparent
            this.beamParallaxOffset = (this.beamParallaxOffset || 0) + 5.0; // Accrue vertical parallax offset
            if (this.player.y < this.camera.y - 64 && !this.transitionComplete) {
              this.transitionComplete = true;
              // Fade to white
              const flash = document.getElementById('white-flash');
              if (flash) flash.classList.add('active');
              setTimeout(() => {
                if (!this.hasWon) return;
                if (this.onWin) this.onWin();
                if (flash) flash.classList.remove('active');
              }, 300);
            }
          }
        }
      }
      return; // Stop normal gameplay updates when won
    }

    // ECS Systems Tick
    MovementSystem(this.ecsWorld);
    GravitySystem(this.ecsWorld);

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

    if (this.timeFreezeTimer > 0) {
      this.timeFreezeTimer--;
    }
    
    if (this.player.cannonCooldown > 0) {
      this.player.cannonCooldown--;
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
      if (this.getTile(pCol, pRow) === TILE.SIZE_PORTAL && this.player.sizeCooldown === TILE.EMPTY) {
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
        this.keys.down = act.down;

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
        this.keys.up = false;
        this.keys.down = false;
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
          charId: this.player.charId
        });
      }

      // Blob trail
      if (this.player.charId === 'blob' && (Math.abs(this.player.vx) > 0.5 || Math.abs(this.player.vy) > 0.5)) {
        // Leave slime splats on the ground
        if (this.frameCount % 3 === 0) {
          this.dustParticles.push({
            x: this.player.x + this.player.width / 2 + (Math.random() - 0.5) * 16,
            y: this.player.y + this.player.height / 2 + (Math.random() - 0.5) * 16,
            vx: 0,
            vy: 0,
            radius: 3 + Math.random() * 4,
            alpha: 0.8,
            decay: 0.002 + Math.random() * 0.002, // very slow decay
            isSlime: true,
            color: 'rgba(50, 205, 50, 0.85)'
          });
        }
        // Faint ghost trails
        if (this.frameCount % 6 === 0) {
          this.playerTrails.push({
            x: this.player.x,
            y: this.player.y,
            facing: this.player.facing,
            scaleX: this.player.scaleX,
            scaleY: this.player.scaleY,
            tiltAngle: this.player.tiltAngle,
            alpha: 0.3,
            theme: this.theme,
            vy: this.player.vy,
            vx: this.player.vx,
            charId: 'blob'
          });
        }
      }

      // Update trails
      this.playerTrails.forEach(t => {
        t.alpha -= (t.charId === 'blob' ? 0.015 : 0.05);
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

    if (this.player.charId === 'topdown' || this.player.charId === 'blob' || this.player.charId === 'paddle_h' || this.player.charId === 'paddle_v') {
      const isV = this.player.charId === 'paddle_v';
      const isH = this.player.charId === 'paddle_h';
      const isBlob = this.player.charId === 'blob';
      const canMoveX = !isV;
      const canMoveY = !isH;

      const maxSpeed = isBlob ? 3.5 : CONFIG.MOVE_SPEED;

      const targetVx = (canMoveX && this.keys.left) ? -maxSpeed : ((canMoveX && this.keys.right) ? maxSpeed : 0);
      const targetVy = (canMoveY && this.keys.up) ? -maxSpeed : ((canMoveY && this.keys.down) ? maxSpeed : 0);
      
      if (this.keys.left) this.player.facing = 'left';
      if (this.keys.right) this.player.facing = 'right';

      if (targetVx !== 0) {
        this.player.vx += (targetVx - this.player.vx) * (isBlob ? 0.08 : CONFIG.ACCELERATION);
      } else {
        this.player.vx += (0 - this.player.vx) * (isBlob ? 0.05 : CONFIG.DECELERATION);
        if (Math.abs(this.player.vx) < 0.1) this.player.vx = 0;
      }

      if (targetVy !== 0) {
        this.player.vy += (targetVy - this.player.vy) * (isBlob ? 0.08 : CONFIG.ACCELERATION);
      } else {
        this.player.vy += (0 - this.player.vy) * (isBlob ? 0.05 : CONFIG.DECELERATION);
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
        if (tileBelow === TILE.ICE) {
          currentAccel *= 0.15;
          currentDecel *= 0.02;
        } else if (tileBelow === TILE.CONVEYOR_LEFT) {
          this.player.x -= 2;
        } else if (tileBelow === TILE.CONVEYOR_RIGHT) {
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
        let jForce = CONFIG.JUMP_FORCE;
        if (this.player.isShrunk) jForce *= 0.8;
        this.player.vy = -jForce;
        this.player.vx = this.player.wallDirection * CONFIG.MOVE_SPEED * 1.5;
        this.spawnJumpDust();
        if (!this.isSimulation && audio.playJumpSound) audio.playJumpSound();
        this.player.isWallSliding = false;
      } else
if (this.player.jumpBufferTimer > 0) {
        if (this.player.isGrounded || this.player.coyoteTimer > 0) {
          let jumpForce = this.player.hasSpringBoots ? CONFIG.JUMP_FORCE * 1.5 : CONFIG.JUMP_FORCE;
          if (this.player.isShrunk) jumpForce *= 0.8;
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
          let jumpForce = this.player.hasSpringBoots ? CONFIG.JUMP_FORCE * 1.5 : CONFIG.JUMP_FORCE;
          if (this.player.isShrunk) jumpForce *= 0.8;
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
      if (!this.keys.up && this.player.vy < -2.0) {
        this.player.vy *= 0.6; // reduce rise speed smoothly
      }

      // Apply Gravity
      const pColGravity = Math.floor((this.player.x + this.player.width / 2) / CONFIG.TILE_SIZE);
      const pRowGravity = Math.floor((this.player.y + this.player.height / 2) / CONFIG.TILE_SIZE);
      
      let gDir = 1;
      if (this.player.hasMagneticBoots && this.player.magneticState === 'attached') {
        gDir = -1;
      }
      this.gravityDir = gDir; // Store for other systems (like pathfinder)

      if (this.getTile(pColGravity, pRowGravity) === TILE.ANTI_GRAVITY) {
        this.player.vy -= CONFIG.GRAVITY * 1.5 * gDir;
        if (this.player.vy < -CONFIG.MOVE_SPEED * 1.5) this.player.vy = -CONFIG.MOVE_SPEED * 1.5;
        if (this.player.vy > CONFIG.MOVE_SPEED * 1.5) this.player.vy = CONFIG.MOVE_SPEED * 1.5;
      } else {
        this.player.vy += CONFIG.GRAVITY * gDir;
        if (this.player.vy > 12) this.player.vy = 12; // Terminal velocity
        if (this.player.vy < -12) this.player.vy = -12;
      }
      
      // Wind Zones (36=Up, 37=Down, 38=Left, 39=Right)
      const centerTile = this.getTile(pColGravity, pRowGravity);
      if (centerTile === TILE.WIND_UP) { // Wind Up
        if (this.player.vy > 0) this.player.vy *= 0.8;
        this.player.vy -= CONFIG.WIND_FORCE;
        if (this.player.vy < -CONFIG.MOVE_SPEED * 1.5) this.player.vy = -CONFIG.MOVE_SPEED * 1.5;
        if (Math.random() < 0.1 && !this.isSimulation) this.spawnDust(this.player.x + this.player.width/2 + (Math.random()-0.5)*10, this.player.y + this.player.height, 0, -2, 'rgba(255,255,255,0.6)', 3, 20);
      } else if (centerTile === TILE.WIND_DOWN) { // Wind Down
        if (this.player.vy < 0) this.player.vy *= 0.8;
        this.player.vy += CONFIG.WIND_FORCE;
        if (Math.random() < 0.1 && !this.isSimulation) this.spawnDust(this.player.x + this.player.width/2 + (Math.random()-0.5)*10, this.player.y, 0, 2, 'rgba(255,255,255,0.6)', 3, 20);
      } else if (centerTile === TILE.WIND_LEFT) { // Wind Left
        this.player.vy -= CONFIG.GRAVITY * gDir;
        this.player.vy *= 0.9;
        if (this.player.vx > 0) this.player.vx *= 0.8;
        this.player.vx -= CONFIG.WIND_FORCE;
        if (this.player.vx < -CONFIG.MOVE_SPEED * 1.5) this.player.vx = -CONFIG.MOVE_SPEED * 1.5;
        if (Math.random() < 0.1 && !this.isSimulation) this.spawnDust(this.player.x + this.player.width, this.player.y + this.player.height/2 + (Math.random()-0.5)*10, -2, 0, 'rgba(255,255,255,0.6)', 3, 20);
      } else if (centerTile === TILE.WIND_RIGHT) { // Wind Right
        this.player.vy -= CONFIG.GRAVITY * gDir;
        this.player.vy *= 0.9;
        if (this.player.vx < 0) this.player.vx *= 0.8;
        this.player.vx += CONFIG.WIND_FORCE;
        if (this.player.vx > CONFIG.MOVE_SPEED * 1.5) this.player.vx = CONFIG.MOVE_SPEED * 1.5;
        if (Math.random() < 0.1 && !this.isSimulation) this.spawnDust(this.player.x, this.player.y + this.player.height/2 + (Math.random()-0.5)*10, 2, 0, 'rgba(255,255,255,0.6)', 3, 20);
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

    // Dash Update
    if (this.player.isDashing) {
      if (this.player.dashTimer > 0) {
        this.player.dashTimer--;
        this.player.vy = 0; // lock y
      } else {
        this.player.isDashing = false;
        this.player.vy = 0;
      }
    }

    // Grapple Projectile & Spring Update
    if (this.player.hasGrapple && this.player.grappleHook) {
      const h = this.player.grappleHook;
      if (!h.attached) {
        // Fly through air
        h.x += h.vx;
        h.y += h.vy;
        const hc = Math.floor(h.x / CONFIG.TILE_SIZE);
        const hr = Math.floor(h.y / CONFIG.TILE_SIZE);
        const hTile = this.getTile(hc, hr);
        
        // If it hits a solid tile (1, 2, 6, 7, etc.), it attaches!
        if (hTile === TILE.SOLID || hTile === TILE.TRAMPOLINE || hTile === TILE.BREAKABLE || hTile === TILE.EARTH || hTile === TILE.LOCK || hTile === TILE.MOVEABLE || hTile === TILE.GHOST_BLOCK || hTile === TILE.ANTI_GRAVITY || hTile === TILE.CRUMBLE || hTile === TILE.SLIME || hTile === TILE.BOUNCY_MUSHROOM || hTile === TILE.MAGNETIC_SURFACE) {
          h.attached = true;
          // Snap to hit position exactly or center of tile
          h.x = hc * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          h.y = hr * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
          
          // Calculate rest length based on where player was when it attached
          const px = this.player.x + this.player.width / 2;
          const py = this.player.y + this.player.height / 2;
          h.length = Math.hypot(h.x - px, h.y - py);
          if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
        } else if (h.x < 0 || h.x > this.level.width || h.y < 0 || h.y > this.level.height) {
          this.player.grappleHook = null; // Missed and flew off screen
        }
      } else {
        // Spring Physics Constraint!
        const px = this.player.x + this.player.width / 2;
        const py = this.player.y + this.player.height / 2;
        const dx = h.x - px;
        const dy = h.y - py;
        const dist = Math.hypot(dx, dy);
        
        // If player moves further than rope length, pull them back!
        if (dist > h.length) {
          const stretch = dist - h.length;
          const fx = (dx / dist) * stretch * CONFIG.GRAPPLE_STIFFNESS;
          const fy = (dy / dist) * stretch * CONFIG.GRAPPLE_STIFFNESS;
          this.player.vx += fx;
          this.player.vy += fy;
        }
      }
    }

    // Update platforms first so player can move with them
    if (this.timeFreezeTimer <= 0) {
      this.interactiveSystem.updatePlatforms();
    }

    // Cannon Logic
    if (this.player.isInsideCannon) {
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.isGrounded = false;
      this.player.isWallSliding = false;
      this.player.isDashing = false;

      this.player.cannonAngle += this.player.cannonDir * 0.05;
      if (this.player.cannonAngle > Math.PI - 0.2) {
        this.player.cannonDir = -1;
      } else if (this.player.cannonAngle < 0.2) {
        this.player.cannonDir = 1;
      }

      if (this.keys.up) {
        this.player.isInsideCannon = false;
        this.player.cannonCooldown = 15;
        const launchForce = 22;
        this.player.vx = Math.cos(this.player.cannonAngle) * launchForce;
        this.player.vy = -Math.sin(this.player.cannonAngle) * launchForce;
        
        // Bump slightly so we leave tile
        this.player.x += Math.cos(this.player.cannonAngle) * 5;
        this.player.y -= Math.sin(this.player.cannonAngle) * 5;
        this.keys.up = false;
        if (!this.isSimulation && window.audio && audio.playJumpSound) audio.playJumpSound();
      }
    }

    if (this.player.isSwinging) {
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.isGrounded = false;
      this.player.isWallSliding = false;
      this.player.isDashing = false;
    }

    if (this.player.isInsideMinecart) {
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.isGrounded = true;
      this.applyGroundEffects();

      this.player.isWallSliding = false;
      this.player.isDashing = false;
    }

    // Handle Horizontal Collisions First
    this.player.x += this.player.vx;
    // Slime Wall physics
    this.player.isWallSliding = false;
    if (!this.player.isGrounded && this.player.vy > 0) {
      const inset = 2;
      const leftTile = this.getTile(Math.floor((this.player.x - 1) / CONFIG.TILE_SIZE), Math.floor((this.player.y + this.player.height / 2) / CONFIG.TILE_SIZE));
      const rightTile = this.getTile(Math.floor((this.player.x + this.player.width + 1) / CONFIG.TILE_SIZE), Math.floor((this.player.y + this.player.height / 2) / CONFIG.TILE_SIZE));
      
      if ((this.keys.left && leftTile === TILE.SLIME) || (this.keys.right && rightTile === TILE.SLIME)) {
        this.player.isWallSliding = true;
        this.player.wallDirection = this.keys.left ? 1 : -1;
        this.player.vy *= 0.8;
      }
    }

    this.physics.resolveHorizontalCollisions();

    // Handle Vertical Collisions Next
    this.player.isGrounded = false;
    this.player.y += this.player.vy;
    this.resolveVerticalCollisions();

    // Check for magnetic boots attachment (if tile 42 is touching top or bottom)
    if (this.player.hasMagneticBoots) {
      const topRow = Math.floor((this.player.y - 2) / CONFIG.TILE_SIZE);
      const bottomRow = Math.floor((this.player.y + this.player.height + 2) / CONFIG.TILE_SIZE);
      const colL = Math.floor((this.player.x + 2) / CONFIG.TILE_SIZE);
      const colR = Math.floor((this.player.x + this.player.width - 2) / CONFIG.TILE_SIZE);
      
      let isTouchingMagnet = false;
      if (this.getTile(colL, topRow) === TILE.MAGNETIC_SURFACE || this.getTile(colR, topRow) === TILE.MAGNETIC_SURFACE ||
          this.getTile(colL, bottomRow) === TILE.MAGNETIC_SURFACE || this.getTile(colR, bottomRow) === TILE.MAGNETIC_SURFACE) {
        isTouchingMagnet = true;
      }
      
      this.player.magneticState = isTouchingMagnet ? 'attached' : 'none';
      if (this.player.magneticState === 'attached') {
        this.player.isGrounded = true;
        this.applyGroundEffects();
        // allow jumping off ceiling
      }
    }

    // Check Win Condition
    this.checkWinCondition();

    // Check Hazards
    this.hazardSystem.checkHazards();

    // Check Tripwires
    this.hazardSystem.checkTripwires();

    // Check Portals
    this.hazardSystem.checkPortals();
    
    // Check Teleportation Doors
    this.hazardSystem.checkDoors();

    // Process Crumbling Tiles
    this.interactiveSystem.processCrumblingTiles();

    // Check coins
    this.interactiveSystem.checkCoins();

    // Update and check enemies
    if (this.timeFreezeTimer <= 0) {
      this.enemySystem.updateEnemies();
    }

    // Update boomerangs
    this.interactiveSystem.updateBoomerangs();

    // Update crumbling blocks
    for (let i = this.crumblingBlocks.length - 1; i >= 0; i--) {
      const b = this.crumblingBlocks[i];
      b.timer--;
      if (b.timer <= 0) {
        this.setTile(b.col, b.row, TILE.EMPTY);
        this.crumblingBlocks.splice(i, 1);
        if (audio.playBreakSound && !this.isSimulation) audio.playBreakSound();
      }
    }


    // Update bombs
    this.interactiveSystem.updateBombs();

    // Update turrets
    if (this.timeFreezeTimer <= 0) {
      this.interactiveSystem.updateTurrets();
      this.interactiveSystem.updateGravityWells();
      this.interactiveSystem.updateMinecarts();
      this.interactiveSystem.updateRopes();
    }

    // Update Ghost Recorder
    this.interactiveSystem.updateGhost();

    // Stalactite activation
    if (!this.isDead && !this.hasWon) {
      const pCol = Math.floor((this.player.x + this.player.width/2) / CONFIG.TILE_SIZE);
      const pRow = Math.floor((this.player.y + this.player.height/2) / CONFIG.TILE_SIZE);
      for (let r = pRow; r >= 0; r--) {
        if (this.getTile(pCol, r) === TILE.STALACTITE) {
          // Check line of sight (no solid blocks between player and stalactite)
          let clear = true;
          for (let checkR = r + 1; checkR < pRow; checkR++) {
            const tile = this.getTile(pCol, checkR);
            if (tile === TILE.SOLID || tile === TILE.BREAKABLE || tile === TILE.EARTH || tile === TILE.GHOST_BLOCK || tile === TILE.ANTI_GRAVITY) {
              clear = false;
              break;
            }
          }
          if (clear) {
            // Activate stalactite
            this.setTile(pCol, r, TILE.EMPTY);
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
    if (this.timeFreezeTimer <= 0) {
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
          
          // Check collision with player
          if (st.x < this.player.x + this.player.width && st.x + st.width > this.player.x &&
              st.y < this.player.y + this.player.height && st.y + st.height > this.player.y) {
            this.killPlayer();
          }

          // Check collision with ground
          const stCol = Math.floor((st.x + st.width/2) / CONFIG.TILE_SIZE);
          const stRow = Math.floor((st.y + st.height) / CONFIG.TILE_SIZE);
          const stTile = this.getTile(stCol, stRow);
          
          if (stTile === TILE.SOLID || stTile === TILE.BREAKABLE || stTile === TILE.EARTH || stTile === TILE.GHOST_BLOCK || stTile === TILE.ANTI_GRAVITY) {
            // Shatter
            this.stalactites.splice(i, 1);
            if (!this.isSimulation && window.audio && window.audio.playBreakSound) window.audio.playBreakSound();
            for(let p=0; p<5; p++) {
              this.breakParticles.push({
                x: st.x + st.width/2,
                y: st.y + st.height,
                vx: (Math.random()-0.5)*4,
                vy: (Math.random()-1)*4,
                vRotation: (Math.random()-0.5)*0.2,
                rotation: Math.random()*Math.PI*2,
                alpha: 1
              });
            }
          } else if (st.y > CONFIG.GRID_ROWS * CONFIG.TILE_SIZE) {
            this.stalactites.splice(i, 1);
          }
        }
      }
    }

    this.interactiveSystem.updateShadowClone();

    // Update sliding ice blocks
    if (this.slidingIceBlocks && this.timeFreezeTimer <= 0) {
      for (let i = this.slidingIceBlocks.length - 1; i >= 0; i--) {
        const block = this.slidingIceBlocks[i];
        block.x += block.vx;

        // Check bounds
        if (block.x < 0 || block.x > this.level.width) {
          this.slidingIceBlocks.splice(i, 1);
          continue;
        }

        // Check if hitting a solid wall
        const checkCol = block.vx > 0 ? Math.floor((block.x + block.width - 1) / CONFIG.TILE_SIZE) : Math.floor(block.x / CONFIG.TILE_SIZE);
        const checkRow = Math.floor((block.y + block.height / 2) / CONFIG.TILE_SIZE);
        const tileVal = this.getTile(checkCol, checkRow);
        
        if (tileVal === TILE.SOLID || tileVal === TILE.TRAMPOLINE || tileVal === TILE.BREAKABLE || tileVal === TILE.EARTH || tileVal === TILE.LOCK || tileVal === TILE.MOVEABLE || tileVal === TILE.ICE || tileVal === TILE.CONVEYOR_LEFT || tileVal === TILE.CONVEYOR_RIGHT || tileVal === TILE.CRUMBLE || tileVal === TILE.BOUNCY_MUSHROOM || tileVal === TILE.MAGNETIC_SURFACE) {
          // Snap back and turn solid
          const snapCol = block.vx > 0 ? checkCol - 1 : checkCol + 1;
          this.setTile(snapCol, checkRow, TILE.MAGNETIC_SURFACE); // Turned into frozen block
          this.slidingIceBlocks.splice(i, 1);
          
          if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
          continue;
        }

        // Check Switches (11)
        const centerCol = Math.floor((block.x + block.width / 2) / CONFIG.TILE_SIZE);
        if (this.getTile(centerCol, checkRow) === TILE.SWITCH) {
          if (!block.toggledSwitches) block.toggledSwitches = new Set();
          const switchKey = `${centerCol},${checkRow}`;
          if (!block.toggledSwitches.has(switchKey)) {
            block.toggledSwitches.add(switchKey);
            this.level.switchState = this.level.switchState === 'red' ? 'blue' : 'red';
            if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
          }
        }

        // Crush Enemies
        for (let e = this.liveEnemies.length - 1; e >= 0; e--) {
          const enemy = this.liveEnemies[e];
          if (block.x < enemy.x + enemy.width && block.x + block.width > enemy.x &&
              block.y < enemy.y + enemy.height && block.y + block.height > enemy.y) {
            this.spawnEnemyDeathParticles(enemy);
            if (!this.isSimulation && audio.playEnemyDeathSound) audio.playEnemyDeathSound();
            this.liveEnemies.splice(e, 1);
          }
        }
      }
    }
    for (let i = this.crumblingBlocks.length - 1; i >= 0; i--) {
      const b = this.crumblingBlocks[i];
      b.timer--;
      if (b.timer <= 0) {
        this.setTile(b.col, b.row, TILE.EMPTY);
        this.crumblingBlocks.splice(i, 1);
        if (audio.playBreakSound && !this.isSimulation) audio.playBreakSound();
      }
    }


    // Boundary check (if player falls off world bottom, kill with feedback)
    if (this.player.y > CONFIG.GRID_ROWS * CONFIG.TILE_SIZE + 100) {
      this.killPlayer();
    }
  }

  spawnDust(x, y, vx, vy, color, duration, size) {
    if (this.isSimulation) return;
    this.dustParticles.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      radius: size || (2 + Math.random() * 3),
      alpha: 1.0,
      decay: 1 / (duration || 30),
      color: color,
      isSquare: this.player.charId === 'classic',
    });
  }

  /**
   * Consolidated ground-tile effect handler.
   * Applies ice friction, conveyor movement, dash panels, and crumbling block activation
   * when the player is standing on a surface. Call this whenever isGrounded becomes true.
   */
  applyGroundEffects() {
    const tileCol = Math.floor((this.player.x + this.player.width / 2) / CONFIG.TILE_SIZE);
    const tileRow = Math.floor((this.player.y + this.player.height + 1) / CONFIG.TILE_SIZE);
    const groundTile = this.getTile(tileCol, tileRow);

    // Ice friction
    if (groundTile === TILE.ICE) {
      this.player.friction = 0.98;
    } else {
      this.player.friction = CONFIG.FRICTION;
    }

    // Conveyor movement
    if (groundTile === TILE.CONVEYOR_LEFT) this.player.x -= 2;
    if (groundTile === TILE.CONVEYOR_RIGHT) this.player.x += 2;

    // Dash Panels
    if (groundTile === TILE.DASH_PANEL_LEFT) {
      this.player.vx = -15;
      this.spawnJumpDust();
      if (!this.isSimulation && audio.playJumpSound) audio.playJumpSound();
    }
    if (groundTile === TILE.DASH_PANEL_RIGHT) {
      this.player.vx = 15;
      this.spawnJumpDust();
      if (!this.isSimulation && audio.playJumpSound) audio.playJumpSound();
    }

    // Crumbling block activation
    if (groundTile === TILE.CRUMBLE) {
      let found = false;
      for (const b of this.crumblingBlocks) {
        if (b.col === tileCol && b.row === tileRow) { found = true; break; }
      }
      if (!found) this.crumblingBlocks.push({ col: tileCol, row: tileRow, timer: 30 });
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

  fireGrapple() {
    this.player.grappleHook = {
      x: this.player.x + this.player.width / 2,
      y: this.player.y + this.player.height / 2,
      vx: this.player.facing === 'left' ? -CONFIG.GRAPPLE_SPEED : CONFIG.GRAPPLE_SPEED,
      vy: -CONFIG.GRAPPLE_SPEED,
      attached: false,
      length: 0
    };
    if (!this.isSimulation && audio.playPowerupSound) audio.playPowerupSound();
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





  explodeBomb(col, row) {
    if (!this.isSimulation && window.audio && window.audio.playBreakSound) window.audio.playBreakSound();

    // Visual explosion
    this.explosions.push({ col, row, timer: 15 });

    const blastRadius = 1; // 3x3 area
    const pCx = this.player.x + this.player.width / 2;
    const pCy = this.player.y + this.player.height / 2;
    const bCx = col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
    const bCy = row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;

    // Destroy cracked blocks
    for (let r = row - blastRadius; r <= row + blastRadius; r++) {
      for (let c = col - blastRadius; c <= col + blastRadius; c++) {
        if (this.getTile(c, r) === TILE.CRACKED_BLOCK) {
          this.setTile(c, r, TILE.EMPTY);
          this.breakBlock(c, r);
        }
      }
    }

    // Kill enemies
    for (let i = this.liveEnemies.length - 1; i >= 0; i--) {
      const e = this.liveEnemies[i];
      const eCx = e.x + e.width / 2;
      const eCy = e.y + e.height / 2;
      const dist = Math.hypot(bCx - eCx, bCy - eCy);
      if (dist <= CONFIG.TILE_SIZE * 1.5) {
        this.liveEnemies.splice(i, 1);
        if (!this.isSimulation && window.audio && window.audio.playEnemyDeathSound) window.audio.playEnemyDeathSound();
      }
    }

    // Kill player
    const pDist = Math.hypot(bCx - pCx, bCy - pCy);
    if (pDist <= CONFIG.TILE_SIZE * 1.5 && !this.isDead && !this.hasWon) {
      this.killPlayer();
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

  dropBomb() {
    if (!this.player.hasBombs) return;
    
    // Calculate current grid cell based on player center
    const cx = this.player.x + this.player.width / 2;
    const cy = this.player.y + this.player.height / 2;
    const col = Math.floor(cx / CONFIG.TILE_SIZE);
    const row = Math.floor(cy / CONFIG.TILE_SIZE);

    // Ensure we don't drop multiple bombs on the same spot
    if (this.bombs.some(b => b.col === col && b.row === row)) return;

    if (!this.isSimulation && audio.playPowerupSound) audio.playPowerupSound();

    this.bombs.push({
      col,
      row,
      timer: 120 // 2 seconds at 60fps
    });
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
    this.deathCount = (this.deathCount || 0) + 1;
    if (this.isSimulation) return;
    
    this.screenShake = 8; // Impact shake on death
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
      this.playGrid[row][col] = TILE.EMPTY;
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

    if (isOverlapping && !this.transitionActive) {
      this.hasWon = true;
      this.transitionActive = true;
      
      const style = window.transitionStyle || 'none';

      // Spawn confetti burst!
      if (!this.isSimulation && (style === 'none' || style === 'zoom' || style === 'letterbox')) {
        this.winConfetti = [];
        const colors = ['#ffb703', '#fb8500', '#ff006e', '#8338ec', '#3a86ff', '#06d6a0', '#ff595e'];
        const px = this.player.x + this.player.width / 2;
        const py = this.player.y + this.player.height / 2;
        for (let i = 0; i < 40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * 8;
          this.winConfetti.push({
            x: px,
            y: py,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 4,
            rotation: Math.random() * Math.PI * 2,
            vRotation: (Math.random() - 0.5) * 0.3,
            width: 4 + Math.random() * 6,
            height: 2 + Math.random() * 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            alpha: 1,
          });
        }
      }

      if (style === 'none') {
        if (this.onWin && !this.isSimulation) this.onWin();
      } else if (style === 'iris') {
        this.irisRadius = Math.max(this.canvas.width, this.canvas.height) * 1.5;
        this.transitionComplete = false;
      } else if (style === 'beam') {
        this.beamAlpha = 0;
        this.transitionComplete = false;
      } else if (style === 'letterbox') {
        const top = document.getElementById('letterbox-top');
        const bottom = document.getElementById('letterbox-bottom');
        const flash = document.getElementById('white-flash');
        if (top) top.classList.add('active');
        if (bottom) bottom.classList.add('active');
        
        setTimeout(() => {
          if (!this.hasWon) return;
          if (flash) flash.classList.add('active');
          setTimeout(() => {
            if (!this.hasWon) return;
            if (this.onWin && !this.isSimulation) this.onWin();
            setTimeout(() => {
              if (flash) flash.classList.remove('active');
              if (top) top.classList.remove('active');
              if (bottom) bottom.classList.remove('active');
            }, 100);
          }, 400); // 400ms flash duration
        }, 800); // 800ms letterbox transition
      } else if (style === 'zoom') {
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
          canvas.style.transformOrigin = 'center center';
          canvas.classList.add('canvas-zoom-in');
        }
        setTimeout(() => {
          if (!this.hasWon) return;
          if (this.onWin && !this.isSimulation) this.onWin();
          // We intentionally DO NOT remove the canvas zoom styles here!
          // They will remain active behind the Win Overlay and are cleared in setMode() when moving to the next level.
        }, 1200); // Wait for zoom to finish
      }
    }
  }

  render() {
    // ECS Rendering Phase
    RenderSystem(this.ecsWorld, this.ctx, this.camera);
    const now = Date.now();
    // Clear Canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw Parallax Backgrounds (only for default theme)
    if (this.theme === 'default') {
      const drawBgLayer = (img, pX, customOffsetY = 0) => {
        if (!img || !img.width) return;
        
        // Stretch the image horizontally by 2x to reduce repetition, but keep height matched to canvas
        const scaleX = (this.canvas.height / img.height) * 2.0;
        const scaleY = (this.canvas.height / img.height);
        
        const scaledWidth = img.width * scaleX;
        const scaledHeight = img.height * scaleY;
        
        let offsetY = customOffsetY;
        
        // Only apply vertical parallax to mountains and hills, NOT the sky/clouds
        if (img !== this.assets.bg_layer_sky) {
          // If camera goes above the level, or if beaming up, scroll parallax layers down!
          if (this.camera.y < 0) {
            offsetY -= this.camera.y * (pX * 0.8); 
          }
          if (this.hasWon && window.transitionStyle === 'beam' && this.beamParallaxOffset) {
            offsetY += this.beamParallaxOffset * (pX * 4.0); // Extreme vertical parallax!
          }
        }
        
        let offsetX = (this.camera.x * pX) % scaledWidth;
        if (offsetX < 0) offsetX += scaledWidth;
        
        for (let x = -offsetX; x < this.canvas.width; x += scaledWidth) {
          this.ctx.drawImage(img, x, offsetY, scaledWidth, scaledHeight);
        }
      };

      const p = this.level.parallax || { skyY: 0, mountainsY: 0, hillsY: 0 };
      drawBgLayer(this.assets.bg_layer_sky, 0.05, p.skyY || 0);
      drawBgLayer(this.assets.bg_layer_mountains, 0.2, p.mountainsY || 0);
      drawBgLayer(this.assets.bg_layer_hills, 0.4, p.hillsY || 0);
    }

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

        if (tileVal === TILE.SOLID) {
          this.editor.renderSolidBlock(x, y, 1, c, r, this);
        } else if (tileVal === TILE.TRAMPOLINE) {
          this.ctx.save();
          const anim = this.bounceAnims.get(`${c},${r}`);
          if (anim) {
            const progress = anim.timer / 15; // 1 to 0
            const scaleY = 1 - 0.5 * progress * Math.sin((1 - progress) * Math.PI * 3); // More jiggle
            const scaleX = 1 + 0.4 * progress * Math.sin((1 - progress) * Math.PI * 3);

            this.ctx.translate(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE);
            this.ctx.scale(scaleX, scaleY);
            this.ctx.translate(-(x + CONFIG.TILE_SIZE / 2), -(y + CONFIG.TILE_SIZE));
            
            // Spores
            if (anim.timer > 5 && !this.isSimulation) {
              this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              for (let i=0; i<3; i++) {
                const px = x + CONFIG.TILE_SIZE/2 + (Math.random()-0.5)*20;
                const py = y + CONFIG.TILE_SIZE/2 + (Math.random()-0.5)*10;
                this.ctx.beginPath();
                this.ctx.arc(px, py, Math.random()*1.5 + 0.5, 0, Math.PI*2);
                this.ctx.fill();
              }
            }
          }

          // Bouncy Mushroom (Procedural)
          this.ctx.translate(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE);
          
          // Drop Shadow
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          this.ctx.beginPath();
          this.ctx.ellipse(0, -2, 14, 4, 0, 0, Math.PI*2);
          this.ctx.fill();

          // Stem
          this.ctx.fillStyle = '#e2e8f0';
          this.ctx.fillRect(-6, -16, 12, 16);
          // Stem Shading
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          this.ctx.fillRect(0, -16, 6, 16);
          
          // 3D Cap Gradient
          const capGrad = this.ctx.createRadialGradient(-5, -22, 2, 0, -16, 20);
          capGrad.addColorStop(0, '#f87171'); // Light red highlight
          capGrad.addColorStop(0.7, '#ef4444'); // Standard red
          capGrad.addColorStop(1, '#991b1b'); // Dark red shadow
          this.ctx.fillStyle = capGrad;
          
          this.ctx.beginPath();
          this.ctx.ellipse(0, -16, 18, 12, 0, 0, Math.PI*2);
          this.ctx.fill();

          // Shiny Glint
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          this.ctx.beginPath();
          this.ctx.ellipse(-8, -20, 4, 2, Math.PI/6, 0, Math.PI*2);
          this.ctx.fill();
          
          // Spots
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          this.ctx.arc(-8, -20, 3, 0, Math.PI*2);
          this.ctx.arc(8, -18, 2.5, 0, Math.PI*2);
          this.ctx.arc(0, -24, 4, 0, Math.PI*2);
          this.ctx.fill();
          
          this.ctx.translate(-(x + CONFIG.TILE_SIZE / 2), -(y + CONFIG.TILE_SIZE));
          this.ctx.restore();
        } else if (tileVal === TILE.BOUNCY_MUSHROOM) {
          this.ctx.save();
          const anim = this.bounceAnims.get(`${c},${r}`);
          if (anim) {
            const progress = anim.timer / 15;
            const scaleY = 1 - 0.4 * progress * Math.sin((1 - progress) * Math.PI * 3);
            const scaleX = 1 + 0.3 * progress * Math.sin((1 - progress) * Math.PI * 3);
            this.ctx.translate(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE);
            this.ctx.scale(scaleX, scaleY);
            this.ctx.translate(-(x + CONFIG.TILE_SIZE / 2), -(y + CONFIG.TILE_SIZE));
          }
          this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE);
          // Stem
          this.ctx.fillStyle = '#fef08a';
          this.ctx.fillRect(-6, -14, 12, 14);
          // Cap
          this.ctx.fillStyle = '#ef4444';
          this.ctx.beginPath();
          this.ctx.ellipse(0, -16, 16, 10, 0, Math.PI, 0);
          this.ctx.fill();
          // Spots
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          this.ctx.arc(-8, -20, 3, 0, Math.PI*2);
          this.ctx.arc(0, -22, 4, 0, Math.PI*2);
          this.ctx.arc(8, -18, 2.5, 0, Math.PI*2);
          this.ctx.fill();
          this.ctx.restore();
        } else if (tileVal === TILE.JUMP_THROUGH) {
          this.ctx.fillStyle = '#8b5cf6';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, 10);
          this.ctx.fillStyle = '#6d28d9';
          this.ctx.fillRect(x, y + 10, CONFIG.TILE_SIZE, 4);
          this.ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
          this.ctx.fillRect(x, y + 14, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE - 14);
        } else if (tileVal === TILE.CANNON) {
          this.ctx.save();
          // Draw standard cannon base
          this.ctx.fillStyle = '#475569';
          this.ctx.beginPath();
          this.ctx.arc(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2, CONFIG.TILE_SIZE/2, 0, Math.PI * 2);
          this.ctx.fill();

          // Check if player is inside THIS cannon
          const pCol = Math.floor((this.player.x + this.player.width/2)/CONFIG.TILE_SIZE);
          const pRow = Math.floor((this.player.y + this.player.height/2)/CONFIG.TILE_SIZE);
          if (this.player.isInsideCannon && pCol === c && pRow === r) {
            // Draw rotating barrel with opening
            this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
            // player cannonAngle is standard 0=right, PI/2=up. Canvas rotate expects 0=right, but y is down.
            // Math.cos(angle), -Math.sin(angle) is used for velocity.
            // So visual rotation is -angle.
            this.ctx.rotate(-this.player.cannonAngle);
            this.ctx.translate(-(x + CONFIG.TILE_SIZE/2), -(y + CONFIG.TILE_SIZE/2));
          }

          this.ctx.fillStyle = '#0f172a'; // Inner black hole
          this.ctx.beginPath();
          this.ctx.arc(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2, CONFIG.TILE_SIZE/3, 0, Math.PI * 2);
          this.ctx.fill();

          // Draw opening indicator (right side visually if unrotated, but since player angle starts at PI/2, it will point up)
          this.ctx.fillStyle = '#f59e0b';
          this.ctx.beginPath();
          this.ctx.arc(x + CONFIG.TILE_SIZE/2 + 10, y + CONFIG.TILE_SIZE/2, 4, 0, Math.PI * 2);
          this.ctx.fill();

          this.ctx.restore();
        } else if (tileVal === TILE.TURRET) {
          // Render Turret Shooter
          this.ctx.fillStyle = '#ef4444'; // Base red color
          this.ctx.beginPath();
          // Draw a futuristic angled base
          this.ctx.moveTo(x + CONFIG.TILE_SIZE / 2, y + 5);
          this.ctx.lineTo(x + 5, y + CONFIG.TILE_SIZE - 5);
          this.ctx.lineTo(x + CONFIG.TILE_SIZE - 5, y + CONFIG.TILE_SIZE - 5);
          this.ctx.fill();
          
          // Draw the central glowing orb/eye
          this.ctx.fillStyle = '#f87171';
          this.ctx.beginPath();
          this.ctx.arc(x + CONFIG.TILE_SIZE / 2, y + 20, 6, 0, Math.PI * 2);
          this.ctx.fill();
          
          // Draw the barrel pointing left
          this.ctx.fillStyle = '#991b1b';
          this.ctx.fillRect(x, y + 16, CONFIG.TILE_SIZE / 2, 8);
        } else if (tileVal === TILE.FIRE) {
          // Render Fire purely procedural
          this.ctx.save();
          this.ctx.translate(x, y);
          
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
          
          // Floating sparks
          this.ctx.fillStyle = '#fef08a'; // yellow sparks
          for (let i = 0; i < 4; i++) {
            const sparkY = CONFIG.TILE_SIZE - ((now * 0.05 + i * 15) % (CONFIG.TILE_SIZE + 10));
            const sparkX = 4 + (i * 8) + Math.sin(now * 0.01 + i) * 6;
            const size = Math.max(0, 2 - (CONFIG.TILE_SIZE - sparkY) * 0.05);
            if (size > 0 && sparkY < CONFIG.TILE_SIZE - 5) {
              this.ctx.beginPath();
              this.ctx.arc(sparkX, sparkY, size, 0, Math.PI * 2);
              this.ctx.fill();
            }
          }
          this.ctx.restore();
        } else if (tileVal === TILE.SPIKES) {
          // Render Spikes
          this.ctx.save();
          this.ctx.translate(x, y);
          // Organic Thorns
          this.ctx.fillStyle = '#27272a'; // Dark root
          this.ctx.fillRect(0, CONFIG.TILE_SIZE - 6, CONFIG.TILE_SIZE, 6);
          
          this.ctx.fillStyle = '#18181b'; // Very dark thorns
          const spikeW = CONFIG.TILE_SIZE / 3;
          for (let i = 0; i < 3; i++) {
            const sx = i * spikeW + 2;
            this.ctx.beginPath();
            this.ctx.moveTo(sx, CONFIG.TILE_SIZE - 6);
            // Curved organic thorn
            this.ctx.quadraticCurveTo(sx + spikeW/2 + Math.sin(now*0.002 + i)*3, CONFIG.TILE_SIZE - 20, sx + spikeW/2, CONFIG.TILE_SIZE - 32);
            this.ctx.quadraticCurveTo(sx + spikeW/2 - 2, CONFIG.TILE_SIZE - 20, sx + spikeW - 2, CONFIG.TILE_SIZE - 6);
            this.ctx.fill();
            
            // Pulsing Toxic Vein
            const veinPulse = (Math.sin(now * 0.004 + i * 2) + 1) / 2;
            this.ctx.strokeStyle = `rgba(34, 197, 94, ${0.2 + veinPulse * 0.6})`; // Glowing green
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(sx + spikeW/2, CONFIG.TILE_SIZE - 32);
            // Trace the curve down the center
            this.ctx.quadraticCurveTo(sx + spikeW/2 - 1, CONFIG.TILE_SIZE - 20, sx + spikeW - 2, CONFIG.TILE_SIZE - 6);
            this.ctx.stroke();
            this.ctx.lineWidth = 1;
            
            // Poison Drip with Splash
            this.ctx.fillStyle = 'rgba(74, 222, 128, 0.8)'; // Toxic green
            const dripDrop = ((now * 0.05 + i*15) % 50); // 0 to 50
            if (dripDrop > 10 && dripDrop <= 38) {
                // Falling drop
                const dripSize = Math.max(0.5, 2 - (dripDrop - 10) * 0.04);
                this.ctx.beginPath();
                this.ctx.arc(sx + spikeW/2, CONFIG.TILE_SIZE - 32 + (dripDrop - 10), dripSize, 0, Math.PI*2);
                this.ctx.fill();
            } else if (dripDrop > 38 && dripDrop <= 45) {
                // Splash on the ground
                const splashProgress = (dripDrop - 38) / 7; // 0 to 1
                this.ctx.globalAlpha = 1 - splashProgress;
                this.ctx.beginPath();
                this.ctx.ellipse(sx + spikeW/2, CONFIG.TILE_SIZE - 4, 2 + splashProgress*4, 1, 0, 0, Math.PI*2);
                this.ctx.fill();
                this.ctx.globalAlpha = 1.0;
            }
          }
          this.ctx.restore();
        } else if (tileVal === TILE.COIN) {
          // Gold Coin
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE / 2);

          // Floaty bob
          const floatOffset = Math.sin(now * 0.004 + (c * 17) + (r * 23)) * 3;
          this.ctx.translate(0, floatOffset);

          // 3D Spin
          const spinScale = Math.cos(now * 0.006 + (c * 7) + (r * 11));
          this.ctx.scale(spinScale, 1);

          // Coin Thickness (3D Edge)
          if (spinScale > 0) {
            this.ctx.fillStyle = '#b45309'; // Dark gold edge
            this.ctx.beginPath();
            this.ctx.arc(-2, 0, CONFIG.TILE_SIZE * 0.32, 0, Math.PI * 2);
            this.ctx.fill();
          } else {
            this.ctx.fillStyle = '#b45309';
            this.ctx.beginPath();
            this.ctx.arc(2, 0, CONFIG.TILE_SIZE * 0.32, 0, Math.PI * 2);
            this.ctx.fill();
          }

          // Main Coin Face
          const coinGrad = this.ctx.createRadialGradient(0, -5, 2, 0, 0, CONFIG.TILE_SIZE * 0.35);
          coinGrad.addColorStop(0, '#fef08a');
          coinGrad.addColorStop(0.5, '#eab308');
          coinGrad.addColorStop(1, '#ca8a04');
          this.ctx.fillStyle = coinGrad;
          
          this.ctx.strokeStyle = '#fde047'; // Bright rim highlight
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, CONFIG.TILE_SIZE * 0.32, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.stroke();

          // Inner engraving ring
          this.ctx.strokeStyle = '#a16207';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.arc(0, 0, CONFIG.TILE_SIZE * 0.22, 0, Math.PI * 2);
          this.ctx.stroke();

          // Star engraving in the center
          this.ctx.fillStyle = '#fef08a';
          this.ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            this.ctx.lineTo(Math.cos( (18 + i * 72) / 180 * Math.PI ) * 6,
                            -Math.sin( (18 + i * 72) / 180 * Math.PI ) * 6);
            this.ctx.lineTo(Math.cos( (54 + i * 72) / 180 * Math.PI ) * 3,
                            -Math.sin( (54 + i * 72) / 180 * Math.PI ) * 3);
          }
          this.ctx.closePath();
          this.ctx.fill();

          // Shiny Glint passing over
          const glintOffset = (now * 0.05 + c*20) % 100;
          if (glintOffset < 20) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${1 - Math.abs(glintOffset - 10)/10})`;
            this.ctx.beginPath();
            this.ctx.ellipse(0, -CONFIG.TILE_SIZE * 0.2, 8, 2, Math.PI/4, 0, Math.PI*2);
            this.ctx.fill();
          }

          this.ctx.restore();
        } else if (tileVal === TILE.BREAKABLE) {
          this.editor.renderBreakableBlock(x, y, 1, c, r, this);
        } else if (tileVal === TILE.SLIME) {
          if (this.assets.slime) {
            this.ctx.drawImage(this.assets.slime, x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = 'rgba(74, 222, 128, 0.7)';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            this.ctx.strokeStyle = '#22c55e';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.beginPath();
            this.ctx.arc(x + 8, y + 8, 3, 0, Math.PI * 2);
            this.ctx.arc(x + 24, y + 16, 2, 0, Math.PI * 2);
            this.ctx.arc(x + 12, y + 24, 4, 0, Math.PI * 2);
            this.ctx.fill();
          }
        } else if (tileVal === TILE.EARTH) {
          this.editor.renderEarthBlock(x, y, 1, c, r, this);
        } else if (tileVal === TILE.LOCK) {
          // Lock Block (Procedural Vault Door)
          // Metallic base gradient
          const lockGrad = this.ctx.createLinearGradient(x, y, x + CONFIG.TILE_SIZE, y + CONFIG.TILE_SIZE);
          lockGrad.addColorStop(0, '#d1d5db'); // Light silver
          lockGrad.addColorStop(0.5, '#9ca3af'); // Mid grey
          lockGrad.addColorStop(1, '#4b5563'); // Dark slate
          this.ctx.fillStyle = lockGrad;
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          
          // Inner recessed panel
          this.ctx.fillStyle = '#374151';
          this.ctx.fillRect(x + 4, y + 4, CONFIG.TILE_SIZE - 8, CONFIG.TILE_SIZE - 8);
          this.ctx.fillStyle = '#6b7280';
          this.ctx.fillRect(x + 6, y + 6, CONFIG.TILE_SIZE - 12, CONFIG.TILE_SIZE - 12);

          // 4 Rivets in the corners
          this.ctx.fillStyle = '#1f2937';
          const rivetOffset = 8;
          [ [rivetOffset, rivetOffset], 
            [CONFIG.TILE_SIZE - rivetOffset, rivetOffset], 
            [rivetOffset, CONFIG.TILE_SIZE - rivetOffset], 
            [CONFIG.TILE_SIZE - rivetOffset, CONFIG.TILE_SIZE - rivetOffset] 
          ].forEach(([rx, ry]) => {
            this.ctx.beginPath();
            this.ctx.arc(x + rx, y + ry, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
          });

          // Keyhole
          this.ctx.fillStyle = '#111827'; // Near black
          const kx = x + CONFIG.TILE_SIZE / 2;
          const ky = y + CONFIG.TILE_SIZE / 2 - 2;
          this.ctx.beginPath();
          this.ctx.arc(kx, ky, 4, 0, Math.PI * 2); // Top round part
          this.ctx.moveTo(kx - 3, ky + 2);
          this.ctx.lineTo(kx + 3, ky + 2);
          this.ctx.lineTo(kx + 4, ky + 10); // Flare out at bottom
          this.ctx.lineTo(kx - 4, ky + 10);
          this.ctx.fill();
          
          // Magical locked aura
          const lockGlow = Math.sin(now * 0.004) * 2;
          this.ctx.strokeStyle = `rgba(239, 68, 68, ${0.3 + lockGlow * 0.1})`; // Red locked glow
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x + 2, y + 2, CONFIG.TILE_SIZE - 4, CONFIG.TILE_SIZE - 4);
        } else if (tileVal === TILE.KEY) {
          // Procedural Golden Key
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE / 2);
          const floatOffset = Math.sin(now * 0.005 + (c * 17) + (r * 23)) * 4;
          this.ctx.translate(0, floatOffset);
          
          // Slight rotation based on time to make it sway
          this.ctx.rotate(Math.sin(now * 0.003) * 0.2);

          // Glow behind the key
          this.ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 16 + Math.sin(now * 0.008) * 2, 0, Math.PI * 2);
          this.ctx.fill();

          // Key Base color
          this.ctx.fillStyle = '#fbbf24'; // Golden yellow
          
          // Shaft
          this.ctx.fillRect(0, -2, 12, 4);
          // Teeth
          this.ctx.fillRect(8, 2, 3, 4);
          this.ctx.fillRect(4, 2, 2, 3);
          
          // Bow (Handle)
          this.ctx.beginPath();
          this.ctx.arc(-6, 0, 6, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#000000'; // Hole in bow
          this.ctx.beginPath();
          this.ctx.arc(-6, 0, 3, 0, Math.PI * 2);
          this.ctx.fill();

          // Golden Glint
          const glintPos = (now * 0.05) % 100;
          if (glintPos < 20) {
             this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
             this.ctx.fillRect(-8 + glintPos, -3, 2, 6); // Sweep across
          }

          this.ctx.restore();
        } else if (tileVal === TILE.REFLECTOR) {
          // Reflector Shield (Energy Barrier)
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          
          // Outer pulsing energy field
          const shieldPulse = (Math.sin(now * 0.005) + 1) / 2; // 0 to 1
          this.ctx.fillStyle = `rgba(6, 182, 212, ${0.2 + shieldPulse * 0.2})`; // Cyan glow
          this.ctx.beginPath();
          // Draw a hexagonal forcefield
          this.ctx.moveTo(0, -14);
          this.ctx.lineTo(12, -8);
          this.ctx.lineTo(12, 8);
          this.ctx.lineTo(0, 14);
          this.ctx.lineTo(-12, 8);
          this.ctx.lineTo(-12, -8);
          this.ctx.closePath();
          this.ctx.fill();

          // Inner solid core
          this.ctx.fillStyle = 'rgba(8, 145, 178, 0.6)';
          this.ctx.beginPath();
          this.ctx.moveTo(0, -10);
          this.ctx.lineTo(8, -5);
          this.ctx.lineTo(8, 5);
          this.ctx.lineTo(0, 10);
          this.ctx.lineTo(-8, 5);
          this.ctx.lineTo(-8, -5);
          this.ctx.closePath();
          this.ctx.fill();

          // Deflector Chevron (Pulsing bright white)
          this.ctx.strokeStyle = `rgba(207, 250, 254, ${0.5 + shieldPulse * 0.5})`;
          this.ctx.lineWidth = 2.5;
          this.ctx.lineCap = 'round';
          this.ctx.lineJoin = 'round';
          this.ctx.beginPath();
          this.ctx.moveTo(-5, 2);
          this.ctx.lineTo(0, -4);
          this.ctx.lineTo(5, 2);
          this.ctx.stroke();

          // Scanning laser line across the shield
          const scanY = ((now * 0.02) % 28) - 14;
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          this.ctx.fillRect(-10, scanY, 20, 1.5);

          this.ctx.restore();
        } else if (tileVal === TILE.GRAVITY_WELL) {
          // Gravity Well (Black Hole)
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE / 2);
          
          // Outer accretion disk (Swirling purple/magenta)
          const wellGlow = (Math.sin(now * 0.002) + 1) / 2;
          this.ctx.fillStyle = `rgba(139, 92, 246, ${0.1 + wellGlow * 0.1})`; // Purple aura
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 18 + wellGlow * 4, 0, Math.PI * 2);
          this.ctx.fill();

          // Rapidly spinning inner matter
          this.ctx.rotate(now * 0.003); // Fast spin
          for (let i = 0; i < 3; i++) {
            this.ctx.strokeStyle = `rgba(192, 132, 252, ${0.4 + (i*0.2)})`; // Lighter purple
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            // Create elliptical squished rings for a 3D effect
            this.ctx.ellipse(0, 0, 14 - i*2, 6 - i, now * 0.001 * i, 0, Math.PI * 2);
            this.ctx.stroke();
          }

          // Particles getting sucked in
          this.ctx.fillStyle = '#ffffff';
          for(let p=0; p<4; p++) {
             const suckIn = (now * 0.005 + p * 5) % 15; // Moves from 15 down to 0
             const dist = 16 - suckIn;
             if (dist > 6) {
               this.ctx.beginPath();
               this.ctx.arc(dist, 0, 1.5, 0, Math.PI*2);
               this.ctx.fill();
             }
             this.ctx.rotate(Math.PI / 2); // Spread them out
          }

          // Event Horizon (Pitch black center)
          this.ctx.fillStyle = '#000000';
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 6 + Math.sin(now*0.01)*0.5, 0, Math.PI * 2); // Slightly throbbing center
          this.ctx.fill();
          
          this.ctx.restore();
        } else if (tileVal === TILE.PAINT_BLOCK) {
          // Paint Block
          this.ctx.fillStyle = '#f8fafc';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.strokeStyle = '#cbd5e1';
          this.ctx.strokeRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#06b6d4'; // Cyan
          this.ctx.beginPath(); this.ctx.arc(x + 10, y + 10, 4, 0, Math.PI * 2); this.ctx.fill();
          this.ctx.fillStyle = '#d946ef'; // Magenta
          this.ctx.beginPath(); this.ctx.arc(x + 30, y + 15, 5, 0, Math.PI * 2); this.ctx.fill();
          this.ctx.fillStyle = '#eab308'; // Yellow
          this.ctx.beginPath(); this.ctx.arc(x + 15, y + 30, 4, 0, Math.PI * 2); this.ctx.fill();
        } else if (tileVal === TILE.INVISIBLE_BLOCK) {
          // Invisible Block (only visible in edit mode)
          if (this.mode === CONFIG.MODE_EDIT) {
            this.ctx.strokeStyle = '#94a3b8';
            this.ctx.setLineDash([4, 4]);
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 2, y + 2, CONFIG.TILE_SIZE - 4, CONFIG.TILE_SIZE - 4);
            this.ctx.setLineDash([]);
            this.ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
        } else if (tileVal === TILE.REVEALED_BLOCK) {
          // Revealed Block
          this.ctx.fillStyle = '#334155'; // Dark slate base
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          // Splatters on it
          this.ctx.fillStyle = '#06b6d4';
          this.ctx.beginPath(); this.ctx.arc(x + 8, y + 12, 6, 0, Math.PI * 2); this.ctx.fill();
          this.ctx.fillStyle = '#d946ef';
          this.ctx.beginPath(); this.ctx.arc(x + 32, y + 25, 7, 0, Math.PI * 2); this.ctx.fill();
          this.ctx.fillStyle = '#eab308';
          this.ctx.beginPath(); this.ctx.arc(x + 20, y + 8, 5, 0, Math.PI * 2); this.ctx.fill();
        } else if (tileVal === TILE.MOVEABLE) {
          // Moveable block
          this.ctx.fillStyle = '#a87a51';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#8a6039';
          this.ctx.fillRect(x + 4, y + 4, CONFIG.TILE_SIZE - 8, CONFIG.TILE_SIZE - 8);
          this.ctx.fillStyle = '#5c3a21';
          this.ctx.fillRect(x + 18, y + 4, 4, CONFIG.TILE_SIZE - 8);
          this.ctx.fillRect(x + 4, y + 18, CONFIG.TILE_SIZE - 8, 4);
        } else if (tileVal === TILE.SWITCH) {
          // Switch block
          this.ctx.fillStyle = this.level.switchState === 'blue' ? '#2196f3' : '#f44336';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#ffffff';
          this.ctx.font = 'bold 20px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(this.level.switchState === 'blue' ? 'B' : 'R', x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
        } else if (tileVal === TILE.BLOCK_RED) {
          // Red Block
          if (this.level.switchState === 'red') {
            this.ctx.fillStyle = '#f44336';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.strokeStyle = '#f44336';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x+2, y+2, CONFIG.TILE_SIZE-4, CONFIG.TILE_SIZE-4);
          }
        } else if (tileVal === TILE.BLOCK_BLUE) {
          // Blue Block
          if (this.level.switchState === 'blue') {
            this.ctx.fillStyle = '#2196f3';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.strokeStyle = '#2196f3';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x+2, y+2, CONFIG.TILE_SIZE-4, CONFIG.TILE_SIZE-4);
          }
        } else if (tileVal === TILE.SIZE_PORTAL) {
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
        } else if (tileVal === TILE.GHOST_BLOCK) {
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
        } else if (tileVal === TILE.DASH_PANEL_RIGHT) {
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
        } else if (tileVal === TILE.JETPACK) {
          // Jetpack icon
          this.ctx.fillStyle = '#ef4444'; // Red pack
          this.ctx.fillRect(x + 10, y + 15, 20, 20);
          this.ctx.fillStyle = '#9ca3af'; // Grey nozzles
          this.ctx.fillRect(x + 12, y + 35, 6, 4);
          this.ctx.fillRect(x + 22, y + 35, 6, 4);
          this.ctx.fillStyle = '#fbbf24'; // Yellow flame
          this.ctx.beginPath();
          this.ctx.moveTo(x + 15, y + 39);
          this.ctx.lineTo(x + 12, y + 43);
          this.ctx.lineTo(x + 18, y + 43);
          this.ctx.fill();
        } else if (tileVal === TILE.SHRINK_POTION) {
          // Shrink Potion Icon
          this.ctx.fillStyle = '#e879f9'; // Pinkish purple fluid
          this.ctx.beginPath();
          this.ctx.arc(x + 20, y + 25, 8, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#fdf4ff'; // Glass highlight
          this.ctx.beginPath();
          this.ctx.arc(x + 18, y + 23, 3, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#d8b4fe'; // Potion neck
          this.ctx.fillRect(x + 17, y + 10, 6, 10);
          this.ctx.fillStyle = '#78716c'; // Cork
          this.ctx.fillRect(x + 16, y + 6, 8, 4);
        } else if (tileVal === TILE.SPEED_BOOST) {
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
        } else if (tileVal === TILE.DASH_POWERUP) {
          // Dash Powerup
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          const floatOffset = Math.sin(now * 0.005 + x) * 4;
          this.ctx.translate(0, floatOffset);
          this.ctx.strokeStyle = '#06b6d4'; // Cyan
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(-10, -5);
          this.ctx.lineTo(-5, -5);
          this.ctx.moveTo(-15, 0);
          this.ctx.lineTo(-3, 0);
          this.ctx.moveTo(-12, 5);
          this.ctx.lineTo(-6, 5);
          this.ctx.stroke();
          this.ctx.restore();
        } else if (tileVal === TILE.MAGNETIC_BOOTS) {
          // Magnetic Boots
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          const floatOffset = Math.sin(now * 0.005 + x) * 4;
          this.ctx.translate(0, floatOffset);
          this.ctx.fillStyle = '#9ca3af'; // Gray boot
          this.ctx.beginPath();
          this.ctx.moveTo(-6, -8);
          this.ctx.lineTo(6, -8);
          this.ctx.lineTo(6, 4);
          this.ctx.lineTo(10, 4);
          this.ctx.lineTo(10, 10);
          this.ctx.lineTo(-6, 10);
          this.ctx.closePath();
          this.ctx.fill();
          this.ctx.fillStyle = '#ef4444'; // Red
          this.ctx.fillRect(-4, 4, 4, 4);
          this.ctx.fillStyle = '#3b82f6'; // Blue
          this.ctx.fillRect(0, 4, 4, 4);
          this.ctx.restore();
        } else if (tileVal === TILE.GRAPPLE_POWERUP) {
          // Grapple Hook
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          const floatOffset = Math.sin(now * 0.005 + x) * 4;
          this.ctx.translate(0, floatOffset);
          this.ctx.fillStyle = '#6b7280';
          this.ctx.beginPath();
          this.ctx.moveTo(0, -8);
          this.ctx.lineTo(0, 6);
          this.ctx.arc(0, 4, 6, 0, Math.PI);
          this.ctx.lineWidth = 3;
          this.ctx.strokeStyle = '#4b5563';
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.arc(0, -10, 2, 0, Math.PI * 2);
          this.ctx.strokeStyle = '#d4d4d8';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          this.ctx.restore();
        } else if (tileVal === TILE.STOPWATCH) {
          // Stopwatch
          this.ctx.save();
          this.ctx.translate(x + CONFIG.TILE_SIZE/2, y + CONFIG.TILE_SIZE/2);
          const floatOffset = Math.sin(now * 0.005 + x) * 4;
          this.ctx.translate(0, floatOffset);
          this.ctx.fillStyle = '#eab308'; // Yellow
          this.ctx.beginPath();
          this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.strokeStyle = '#854d0e';
          this.ctx.lineWidth = 2;
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.moveTo(0, 0);
          this.ctx.lineTo(0, -7);
          this.ctx.stroke();
          this.ctx.restore();
        } else if (tileVal === TILE.ICE) {
          // Ice Block (Procedural Glassy Frost)
          this.ctx.save();
          this.ctx.translate(x, y);

          // Translucent frozen gradient
          const iceGrad = this.ctx.createLinearGradient(0, 0, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          iceGrad.addColorStop(0, 'rgba(207, 250, 254, 0.8)'); // Very light blue
          iceGrad.addColorStop(0.5, 'rgba(165, 243, 252, 0.6)');
          iceGrad.addColorStop(1, 'rgba(103, 232, 249, 0.9)'); // Deep frost
          this.ctx.fillStyle = iceGrad;
          this.ctx.fillRect(0, 0, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);

          // Frosty outer rim
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          this.ctx.lineWidth = 1.5;
          this.ctx.strokeRect(1, 1, CONFIG.TILE_SIZE - 2, CONFIG.TILE_SIZE - 2);

          // Inner frost fractures
          this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          // Fracture 1
          this.ctx.moveTo(CONFIG.TILE_SIZE * 0.2, 0);
          this.ctx.lineTo(CONFIG.TILE_SIZE * 0.4, CONFIG.TILE_SIZE * 0.3);
          this.ctx.lineTo(CONFIG.TILE_SIZE * 0.3, CONFIG.TILE_SIZE * 0.7);
          // Fracture 2
          this.ctx.moveTo(CONFIG.TILE_SIZE, CONFIG.TILE_SIZE * 0.4);
          this.ctx.lineTo(CONFIG.TILE_SIZE * 0.6, CONFIG.TILE_SIZE * 0.6);
          this.ctx.lineTo(CONFIG.TILE_SIZE * 0.8, CONFIG.TILE_SIZE);
          this.ctx.stroke();

          // Sweeping Glint
          const glintX = ((now * 0.05 + c * 30 + r * 15) % (CONFIG.TILE_SIZE * 3)) - CONFIG.TILE_SIZE;
          if (glintX > -CONFIG.TILE_SIZE && glintX < CONFIG.TILE_SIZE) {
            const glintGrad = this.ctx.createLinearGradient(glintX, 0, glintX + 15, 0);
            glintGrad.addColorStop(0, 'rgba(255,255,255,0)');
            glintGrad.addColorStop(0.5, 'rgba(255,255,255,0.7)');
            glintGrad.addColorStop(1, 'rgba(255,255,255,0)');
            
            this.ctx.fillStyle = glintGrad;
            // Draw diagonal glint
            this.ctx.beginPath();
            this.ctx.moveTo(glintX + 10, 0);
            this.ctx.lineTo(glintX + 25, 0);
            this.ctx.lineTo(glintX + 15, CONFIG.TILE_SIZE);
            this.ctx.lineTo(glintX, CONFIG.TILE_SIZE);
            this.ctx.fill();
          }

          this.ctx.restore();
        } else if (tileVal === TILE.ANTI_GRAVITY) {
          // Anti-Gravity Zone (Soot-Magic)
          const cxG = x + CONFIG.TILE_SIZE / 2;
          const cyG = y + CONFIG.TILE_SIZE / 2;
          
          // Player Reactivity
          let distToPlayer = 200;
          if (this.player) {
            const dx = cxG - (this.player.x + this.player.width/2);
            const dy = cyG - (this.player.y + this.player.height/2);
            distToPlayer = Math.sqrt(dx*dx + dy*dy);
          }
          const proximityFactor = Math.max(0, 1 - (distToPlayer / 100));
          const activeSpeed = 0.002 + (proximityFactor * 0.006); // Spins faster when near
          const pulseGlow = Math.sin(now * 0.005) * 3 * proximityFactor;
          
          // Shifting dark base circle
          const baseRadius = CONFIG.TILE_SIZE * 0.35 + Math.sin(now * 0.003) * 3 + pulseGlow;
          this.ctx.fillStyle = `rgba(${20 + proximityFactor*20}, 15, ${30 + proximityFactor*30}, 0.6)`;
          this.ctx.beginPath();
          this.ctx.arc(cxG, cyG, baseRadius, 0, Math.PI * 2);
          this.ctx.fill();

          // Magical Rune Ring (Outer Border)
          this.ctx.strokeStyle = `rgba(168, 85, 247, ${0.4 + proximityFactor * 0.4})`; // Purple ring
          this.ctx.lineWidth = 1.5;
          this.ctx.setLineDash([8, 4, 2, 4]); // Dashed rune pattern
          this.ctx.lineDashOffset = -now * activeSpeed * 20; // Rotate the dashed lines
          this.ctx.beginPath();
          this.ctx.arc(cxG, cyG, baseRadius + 4, 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.setLineDash([]); // Reset dash
          
          // Swirling soot particles around the center
          this.ctx.fillStyle = '#1e1720'; // Soot black
          const numSwarms = 10;
          for (let i = 0; i < numSwarms; i++) {
            const angle = (now * activeSpeed) + (i * Math.PI * 2 / numSwarms);
            const radiusOffset = Math.sin(now * 0.005 + i) * 6;
            const px = cxG + Math.cos(angle) * (12 + radiusOffset);
            const py = cyG + Math.sin(angle) * (12 + radiusOffset);
            this.ctx.beginPath();
            this.ctx.arc(px, py, 2.5 + Math.sin(now*0.01+i), 0, Math.PI * 2);
            this.ctx.fill();
          }

          // Floating magical embers going UP (anti-gravity cue)
          this.ctx.fillStyle = '#c084fc'; // Purple magic tint
          for(let i=0; i<5; i++) {
            const emberY = (y + CONFIG.TILE_SIZE) - ((now * (0.03 + proximityFactor*0.02) + i*15) % CONFIG.TILE_SIZE);
            const emberX = x + 8 + (i * 6) + Math.sin(now * 0.005 + i)*4;
            const size = Math.max(0.5, 2 - (emberY - y)/CONFIG.TILE_SIZE * 2 + proximityFactor);
            this.ctx.beginPath();
            this.ctx.arc(emberX, emberY, size, 0, Math.PI * 2);
            this.ctx.fill();
          }
        } else if (tileVal === TILE.CONVEYOR_LEFT || tileVal === TILE.CONVEYOR_RIGHT) {
          // Conveyor Belts (Shifting Dirt)
          // 3D cylindrical gradient for the main body
          const grad = this.ctx.createLinearGradient(x, y + 6, x, y + CONFIG.TILE_SIZE);
          grad.addColorStop(0, '#5c4a3d'); // Lighter top edge
          grad.addColorStop(0.5, '#4a3b32'); // Mid dirt
          grad.addColorStop(1, '#2c221c'); // Dark bottom edge
          this.ctx.fillStyle = grad;
          this.ctx.fillRect(x, y + 6, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE - 6);
          
          // Darker dirt top rim
          this.ctx.fillStyle = '#3a2b22'; 
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, 6);
          
          // Drop shadow under the rim
          this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
          this.ctx.fillRect(x, y + 6, CONFIG.TILE_SIZE, 2);
          
          // Draw shifting dirt clods
          this.ctx.fillStyle = '#654b38'; // Highlight dirt color
          const speed = 0.04;
          const direction = (tileVal === TILE.CONVEYOR_LEFT) ? -1 : 1;
          
          for(let i=0; i<4; i++) {
            // Calculate wrapping offset
            let rawOffset = ((now * speed * direction) + i * 10) % CONFIG.TILE_SIZE;
            if (rawOffset < 0) rawOffset += CONFIG.TILE_SIZE;
            
            // Draw a clump of dirt (angles/streaks)
            this.ctx.beginPath();
            this.ctx.arc(x + rawOffset, y + 15 + Math.sin(i)*4, 3, 0, Math.PI*2);
            this.ctx.arc(x + rawOffset + 4*direction, y + 17 + Math.sin(i)*4, 2, 0, Math.PI*2);
            this.ctx.fill();
            
            // Draw rolling clods on the top edge
            let topOffset = ((now * speed * 1.5 * direction) + i * 12) % CONFIG.TILE_SIZE;
            if (topOffset < 0) topOffset += CONFIG.TILE_SIZE;
            this.ctx.beginPath();
            this.ctx.arc(x + topOffset, y + 2, 2, 0, Math.PI*2);
            this.ctx.fill();
          }
          
          // Bumping pebbles
          this.ctx.fillStyle = '#1e1720'; // Dark pebbles
          for(let p=0; p<2; p++) {
            let pebbleOffset = ((now * speed * 1.2 * direction) + p * 20) % CONFIG.TILE_SIZE;
            if (pebbleOffset < 0) pebbleOffset += CONFIG.TILE_SIZE;
            const hop = Math.abs(Math.sin((pebbleOffset/CONFIG.TILE_SIZE)*Math.PI * 4)) * 3;
            this.ctx.beginPath();
            this.ctx.arc(x + pebbleOffset, y + 2 - hop, 1.5, 0, Math.PI*2);
            this.ctx.fill();
          }
        } else if (tileVal === TILE.DASH_PANEL_LEFT || tileVal === TILE.DASH_PANEL_RIGHT) {
          // Dash Panels
          this.ctx.fillStyle = '#eab308'; // Yellow base
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.fillStyle = '#ca8a04';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, 6);
          
          // Speed lines
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          const speedOffset = (now * 0.3) % CONFIG.TILE_SIZE;
          const direction = (tileVal === TILE.DASH_PANEL_LEFT) ? -1 : 1;
          for (let i = 0; i < 3; i++) {
            let lineX = (speedOffset * direction + i * 12) % CONFIG.TILE_SIZE;
            if (lineX < 0) lineX += CONFIG.TILE_SIZE;
            this.ctx.fillRect(x + lineX, y + 10 + i * 6, 8, 2);
          }

          // Arrows
          this.ctx.fillStyle = '#ffffff';
          this.ctx.beginPath();
          const offset = (now * 0.15) % 10; // Fast animation
          if (tileVal === TILE.DASH_PANEL_LEFT) {
            // Dash Left
            this.ctx.moveTo(x + 22 - offset, y + 12); this.ctx.lineTo(x + 12 - offset, y + 20); this.ctx.lineTo(x + 22 - offset, y + 28);
            this.ctx.moveTo(x + 30 - offset, y + 12); this.ctx.lineTo(x + 20 - offset, y + 20); this.ctx.lineTo(x + 30 - offset, y + 28);
          } else {
            // Dash Right
            this.ctx.moveTo(x + 18 + offset, y + 12); this.ctx.lineTo(x + 28 + offset, y + 20); this.ctx.lineTo(x + 18 + offset, y + 28);
            this.ctx.moveTo(x + 10 + offset, y + 12); this.ctx.lineTo(x + 20 + offset, y + 20); this.ctx.lineTo(x + 10 + offset, y + 28);
          }
          this.ctx.fill();
        } else if (tileVal === TILE.TRIPWIRE) {
          // Tripwire (Laser Emitter)
          // Metal emitter boxes on walls
          this.ctx.fillStyle = '#475569'; // dark grey metal
          this.ctx.fillRect(x, y + 10, 4, 12);
          this.ctx.fillRect(x + CONFIG.TILE_SIZE - 4, y + 10, 4, 12);

          // Glowing laser beam
          const laserAlpha = (Math.sin(now * 0.01) + 1) / 2;
          this.ctx.fillStyle = `rgba(239, 68, 68, ${0.2 + laserAlpha * 0.2})`;
          this.ctx.fillRect(x, y + 13, CONFIG.TILE_SIZE, 6); // soft outer glow
          
          this.ctx.strokeStyle = '#fca5a5'; // bright inner laser core
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(x + 4, y + 16);
          this.ctx.lineTo(x + CONFIG.TILE_SIZE - 4, y + 16);
          this.ctx.stroke();

          // Laser dust/sparks drifting along the beam
          this.ctx.fillStyle = '#f87171';
          for (let i = 0; i < 3; i++) {
             const sparkX = x + ((now * 0.05 + i*10) % CONFIG.TILE_SIZE);
             const sparkY = y + 16 + Math.sin(now * 0.02 + i) * 6;
             this.ctx.beginPath();
             this.ctx.arc(sparkX, sparkY, 1, 0, Math.PI * 2);
             this.ctx.fill();
          }
        } else if (tileVal === TILE.CRUMBLE) {
          // Crumble Block (Cracked Stone)
          const key = `${c},${r}`;
          const crumbleData = this.crumblingTiles.get(key);
          let offsetX = 0;
          let offsetY = 0;
          let isShaking = false;
          if (crumbleData && crumbleData.state === 'shaking') {
            offsetX = (Math.random() - 0.5) * 4;
            offsetY = (Math.random() - 0.5) * 4;
            isShaking = true;
          }

          this.ctx.save();
          this.ctx.translate(x + offsetX, y + offsetY);

          // 3D Stone Block Bevel
          const stoneGrad = this.ctx.createLinearGradient(0, 0, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          stoneGrad.addColorStop(0, '#d6d3d1'); // Light stone
          stoneGrad.addColorStop(1, '#a8a29e'); // Dark stone
          this.ctx.fillStyle = stoneGrad;
          this.ctx.fillRect(0, 0, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          
          // Stone edge shading
          this.ctx.strokeStyle = '#78716c';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(1, 1, CONFIG.TILE_SIZE - 2, CONFIG.TILE_SIZE - 2);

          // Web of deep cracks
          this.ctx.strokeStyle = '#44403c'; // Deep dark crack
          this.ctx.lineWidth = 1.5;
          this.ctx.lineJoin = 'bevel';
          this.ctx.beginPath();
          // Crack 1
          this.ctx.moveTo(5, 0);
          this.ctx.lineTo(12, 10);
          this.ctx.lineTo(8, 20);
          this.ctx.lineTo(15, 32);
          // Crack 2
          this.ctx.moveTo(32, 8);
          this.ctx.lineTo(20, 12);
          this.ctx.lineTo(22, 22);
          this.ctx.lineTo(28, 32);
          // Cross fracture
          this.ctx.moveTo(12, 10);
          this.ctx.lineTo(20, 12);
          this.ctx.stroke();

          // If shaking, spawn tiny dust particles randomly
          if (isShaking && Math.random() > 0.5) {
             this.ctx.fillStyle = 'rgba(168, 162, 158, 0.6)'; // Dust color
             this.ctx.beginPath();
             this.ctx.arc(Math.random() * CONFIG.TILE_SIZE, Math.random() * CONFIG.TILE_SIZE, Math.random() * 2, 0, Math.PI * 2);
             this.ctx.fill();
          }
          this.ctx.restore();
        } else if (tileVal === TILE.CHECKPOINT) {
          // Checkpoint Flag (Waving Procedural)
          this.ctx.save();
          this.ctx.translate(x, y);

          // Pole Base
          this.ctx.fillStyle = '#64748b';
          this.ctx.fillRect(4, 36, 12, 4);

          // Metallic Pole Gradient
          const poleGrad = this.ctx.createLinearGradient(8, 0, 12, 0);
          poleGrad.addColorStop(0, '#9ca3af');
          poleGrad.addColorStop(0.5, '#f3f4f6');
          poleGrad.addColorStop(1, '#4b5563');
          this.ctx.fillStyle = poleGrad;
          this.ctx.fillRect(8, 6, 4, 30);

          // Golden Finial (Ball on top)
          this.ctx.fillStyle = '#fbbf24';
          this.ctx.beginPath();
          this.ctx.arc(10, 4, 3.5, 0, Math.PI * 2);
          this.ctx.fill();

          // Waving Flag Cloth
          this.ctx.fillStyle = '#ef4444'; // Red flag
          this.ctx.beginPath();
          this.ctx.moveTo(12, 6);
          // Top edge waving
          const wave1 = Math.sin(now * 0.005) * 3;
          const wave2 = Math.sin(now * 0.005 - 1) * 4;
          this.ctx.quadraticCurveTo(20, 4 + wave1, 30, 8 + wave2);
          // Right edge
          this.ctx.lineTo(30, 18 + wave2);
          // Bottom edge waving back
          this.ctx.quadraticCurveTo(20, 14 + wave1, 12, 16);
          this.ctx.closePath();
          this.ctx.fill();

          // Flag shading/folds for depth
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          this.ctx.beginPath();
          this.ctx.moveTo(12, 6);
          this.ctx.quadraticCurveTo(16, 5 + wave1/2, 20, 6 + wave1);
          this.ctx.lineTo(20, 16 + wave1);
          this.ctx.quadraticCurveTo(16, 15 + wave1/2, 12, 16);
          this.ctx.closePath();
          this.ctx.fill();

          this.ctx.restore();
        } else if (tileVal === TILE.FAKE_WALL) {
          // Fake Wall (looks like Earth, tile 7)
          this.ctx.fillStyle = '#4ade80';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, 8);
          this.ctx.fillStyle = '#8b5a2b';
          this.ctx.fillRect(x, y + 8, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE - 8);
        } else if (tileVal >= 36 && tileVal <= 39) {
          // Wind Tunnels
          this.ctx.fillStyle = 'rgba(148, 163, 184, 0.2)'; // Faint background tint
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          
          this.ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
          this.ctx.lineWidth = 2;
          this.ctx.lineCap = 'round';
          
          const timeOffset = now * 0.05;
          this.ctx.save();
          this.ctx.beginPath();
          // Draw 3 flowing lines per tile
          for (let i = 0; i < 3; i++) {
            let lineStart = (timeOffset + i * 15) % CONFIG.TILE_SIZE;
            if (tileVal === TILE.WIND_UP) { // Up
              this.ctx.moveTo(x + 10 + i * 10, y + CONFIG.TILE_SIZE - lineStart);
              this.ctx.lineTo(x + 10 + i * 10, y + Math.max(0, CONFIG.TILE_SIZE - lineStart - 10));
            } else if (tileVal === TILE.WIND_DOWN) { // Down
              this.ctx.moveTo(x + 10 + i * 10, y + lineStart);
              this.ctx.lineTo(x + 10 + i * 10, y + Math.min(CONFIG.TILE_SIZE, lineStart + 10));
            } else if (tileVal === TILE.WIND_LEFT) { // Left
              this.ctx.moveTo(x + CONFIG.TILE_SIZE - lineStart, y + 10 + i * 10);
              this.ctx.lineTo(x + Math.max(0, CONFIG.TILE_SIZE - lineStart - 10), y + 10 + i * 10);
            } else if (tileVal === TILE.WIND_RIGHT) { // Right
              this.ctx.moveTo(x + lineStart, y + 10 + i * 10);
              this.ctx.lineTo(x + Math.min(CONFIG.TILE_SIZE, lineStart + 10), y + 10 + i * 10);
            }
          }
          this.ctx.stroke();
          this.ctx.restore();
        } else if (tileVal >= 46 && tileVal <= 48) {
          // Teleportation Doors
          let color = '#ef4444'; // Red
          let darkColor = '#b91c1c';
          if (tileVal === TILE.DOOR_BLUE) { color = '#3b82f6'; darkColor = '#1d4ed8'; } // Blue
          else if (tileVal === TILE.DOOR_GREEN) { color = '#22c55e'; darkColor = '#15803d'; } // Green

          this.ctx.fillStyle = color;
          this.ctx.fillRect(x + 4, y + 4, CONFIG.TILE_SIZE - 8, CONFIG.TILE_SIZE - 4);
          this.ctx.fillStyle = darkColor;
          this.ctx.beginPath();
          this.ctx.arc(x + CONFIG.TILE_SIZE - 10, y + CONFIG.TILE_SIZE / 2, 3, 0, Math.PI * 2);
          this.ctx.fill();

          // Draw a glowing portal inside
          this.ctx.save();
          this.ctx.globalAlpha = 0.5 + Math.sin(now * 0.005) * 0.2;
          this.ctx.fillStyle = '#ffffff';
          this.ctx.fillRect(x + 8, y + 8, CONFIG.TILE_SIZE - 16, CONFIG.TILE_SIZE - 8);
          this.ctx.restore();
        } else if (tileVal === TILE.BOMB_POWERUP) {
          // Bomb Powerup
          this.ctx.fillStyle = '#1c1917';
          this.ctx.beginPath();
          this.ctx.arc(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE / 2, 8, 0, Math.PI * 2);
          this.ctx.fill();
          this.ctx.fillStyle = '#78716c';
          this.ctx.fillRect(x + CONFIG.TILE_SIZE / 2 - 3, y + CONFIG.TILE_SIZE / 2 - 11, 6, 4);
          this.ctx.strokeStyle = '#ef4444';
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(x + CONFIG.TILE_SIZE / 2, y + CONFIG.TILE_SIZE / 2 - 11);
          this.ctx.quadraticCurveTo(x + CONFIG.TILE_SIZE / 2 + 5, y + 4, x + CONFIG.TILE_SIZE / 2 + 8, y + 6);
          this.ctx.stroke();
        } else if (tileVal === TILE.CRACKED_BLOCK) {
          // Cracked Block
          if (this.editor && this.editor.earthCache) {
            this.ctx.drawImage(this.editor.earthCache.get(`${c}_${r}_${this.theme}_0000`) || this.editor.earthCache.get(Array.from(this.editor.earthCache.keys())[0]), x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          } else {
            this.ctx.fillStyle = '#8c6239';
            this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          }
          this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          this.ctx.fillRect(x, y, CONFIG.TILE_SIZE, CONFIG.TILE_SIZE);
          this.ctx.strokeStyle = '#44403c';
          this.ctx.lineWidth = 1.5;
          this.ctx.beginPath();
          this.ctx.moveTo(x + 5, y + 5);
          this.ctx.lineTo(x + 12, y + 14);
          this.ctx.lineTo(x + 8, y + 25);
          this.ctx.moveTo(x + 12, y + 14);
          this.ctx.lineTo(x + 25, y + 18);
          this.ctx.stroke();
        } else if (tileVal === TILE.RAMP_RIGHT) {
          // Ramp Right
          this.ctx.fillStyle = '#71717a';
          this.ctx.beginPath();
          this.ctx.moveTo(x, y + CONFIG.TILE_SIZE);
          this.ctx.lineTo(x + CONFIG.TILE_SIZE, y);
          this.ctx.lineTo(x + CONFIG.TILE_SIZE, y + CONFIG.TILE_SIZE);
          this.ctx.fill();
        } else if (tileVal === TILE.RAMP_LEFT) {
          // Ramp Left
          this.ctx.fillStyle = '#71717a';
          this.ctx.beginPath();
          this.ctx.moveTo(x + CONFIG.TILE_SIZE, y + CONFIG.TILE_SIZE);
          this.ctx.lineTo(x, y);
          this.ctx.lineTo(x, y + CONFIG.TILE_SIZE);
          this.ctx.fill();
        }
      }
    }

    // 2. Render Goal Doorway
    const gx = this.level.goalPos.col * CONFIG.TILE_SIZE;
    const gy = this.level.goalPos.row * CONFIG.TILE_SIZE;
    // Mystical Archway Goal
    const glow = Math.sin(now * 0.005) * 4;
    this.ctx.fillStyle = 'rgba(234, 179, 8, 0.2)'; // Glowing aura
    this.ctx.beginPath();
    this.ctx.arc(gx + CONFIG.TILE_SIZE/2, gy + CONFIG.TILE_SIZE/2, 20 + glow, 0, Math.PI*2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#eab308'; // Gold arch
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.arc(gx + CONFIG.TILE_SIZE/2, gy + CONFIG.TILE_SIZE, 16, Math.PI, 0);
    this.ctx.stroke();
    
    // Magical Runes along the arch
    this.ctx.fillStyle = '#fef08a';
    for (let i = 1; i <= 3; i++) {
      const runeAngle = Math.PI + (Math.PI / 4) * i; // Angles along the arc
      const runeX = gx + CONFIG.TILE_SIZE/2 + Math.cos(runeAngle) * 16;
      const runeY = gy + CONFIG.TILE_SIZE + Math.sin(runeAngle) * 16;
      const runeGlow = (Math.sin(now * 0.003 + i) + 1) / 2; // 0 to 1
      this.ctx.globalAlpha = 0.3 + runeGlow * 0.7;
      this.ctx.beginPath();
      this.ctx.arc(runeX, runeY, 2.5, 0, Math.PI*2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
    
    // Inward-pulling vortex
    this.ctx.fillStyle = '#fef08a';
    for (let i = 0; i < 5; i++) {
      // Particles spawn far and spiral inward
      const pLife = (now * 0.001 + i * 0.2) % 1.0; // 0.0 to 1.0
      const radius = 20 * (1.0 - pLife); // shrinking radius
      const spiralAngle = now * 0.005 + i + (pLife * Math.PI * 4);
      const px = gx + CONFIG.TILE_SIZE/2 + Math.cos(spiralAngle) * radius;
      const py = gy + CONFIG.TILE_SIZE/2 + Math.sin(spiralAngle) * radius;
      
      this.ctx.beginPath();
      this.ctx.arc(px, py, 1.5 * (1.0 - pLife), 0, Math.PI*2);
      this.ctx.fill();
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

    // Render Turret Projectiles
    if (this.turretProjectiles) {
      this.turretProjectiles.forEach(p => {
        this.ctx.save();
        if (p.reflected) {
          this.ctx.fillStyle = '#06b6d4'; // Cyan
          this.ctx.shadowColor = '#0891b2';
        } else {
          this.ctx.fillStyle = '#f87171'; // Glowing red
          this.ctx.shadowColor = '#ef4444';
        }
        this.ctx.shadowBlur = 10;
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, 0, Math.PI * 2);
        this.ctx.fill();
        // Inner white core
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 0;
        this.ctx.beginPath();
        this.ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width / 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });
    }



    // Render Minecarts
    if (this.minecarts) {
      this.minecarts.forEach(m => {
        this.ctx.fillStyle = '#52525b'; // Zinc-600
        this.ctx.beginPath();
        this.ctx.moveTo(m.x + 5, m.y + 15);
        this.ctx.lineTo(m.x + m.width - 5, m.y + 15);
        this.ctx.lineTo(m.x + m.width - 10, m.y + m.height - 10);
        this.ctx.lineTo(m.x + 10, m.y + m.height - 10);
        this.ctx.fill();

        // Wheels
        this.ctx.fillStyle = '#3f3f46'; // Zinc-700
        const wheelSpin = m.x * 0.1;
        this.ctx.save();
        this.ctx.translate(m.x + 12, m.y + m.height - 8);
        this.ctx.rotate(wheelSpin);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#a1a1aa';
        this.ctx.fillRect(-2, -2, 4, 4);
        this.ctx.restore();

        this.ctx.save();
        this.ctx.translate(m.x + m.width - 12, m.y + m.height - 8);
        this.ctx.rotate(wheelSpin);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#a1a1aa';
        this.ctx.fillRect(-2, -2, 4, 4);
        this.ctx.restore();

        // If occupied, render player inside! Actually, player renders separately, 
        // but let's draw a front lip over the player to give depth
        if (m.isOccupied) {
          this.ctx.fillStyle = '#3f3f46';
          this.ctx.fillRect(m.x + 5, m.y + 20, m.width - 10, 10);
        }
      });
    }

    // Render Ropes
    if (this.ropes) {
      this.ropes.forEach(r => {
        const anchorX = r.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
        const anchorY = r.row * CONFIG.TILE_SIZE + 10;
        const endX = anchorX + Math.sin(r.angle) * r.length;
        const endY = anchorY + Math.cos(r.angle) * r.length;

        this.ctx.strokeStyle = '#22c55e'; // Bright green vine
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(anchorX, anchorY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Draw a knot at the end
        this.ctx.fillStyle = '#16a34a';
        this.ctx.beginPath();
        this.ctx.arc(endX, endY, 6, 0, Math.PI * 2);
        this.ctx.fill();
      });
    }

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
            if (t.charId === 'blob' || renderCharId === 'blob') {
              drawBlob(this.ctx, { x: t.x, y: t.y, width: this.player.width, height: this.player.height, facing: t.facing, vx: t.vx || 0, vy: t.vy || 0, alpha: t.alpha, skin: this.player.skin, theme: this.theme }, this.tickCount * 16.666, true);
            } else if (renderCharId === 'robot') {
              drawRobot(this.ctx, { x: t.x, y: t.y, width: this.player.width, height: this.player.height, facing: t.facing, scaleX: t.scaleX, scaleY: t.scaleY, tiltAngle: t.tiltAngle, alpha: t.alpha, skin: this.player.skin, theme: this.theme }, this.tickCount * 16.666, true);
            } else {
              drawForestKid(this.ctx, { x: t.x, y: t.y, width: this.player.width, height: this.player.height, facing: t.facing, scaleX: t.scaleX, scaleY: t.scaleY, tiltAngle: t.tiltAngle, alpha: t.alpha, skin: this.player.skin, theme: t.theme || this.theme }, this.tickCount * 16.666, true);
            }
          });
        }

        // Render Dust Particles
        this.dustParticles.forEach(p => {
          this.ctx.save();
          this.ctx.globalAlpha = p.alpha;
          this.ctx.fillStyle = p.color || (this.theme === 'spooky' ? 'rgba(0, 255, 204, 0.4)' : 'rgba(235, 230, 225, 0.55)');
          this.ctx.beginPath();
          if (p.isSquare) {
            this.ctx.fillRect(p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
            // Little highlight on square dust
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.fillRect(p.x - p.radius + 1, p.y - p.radius + 1, p.radius, p.radius);
          } else if (p.isSlime) {
            // Slime splat
            this.ctx.beginPath();
            this.ctx.ellipse(p.x, p.y, p.radius * 1.2, p.radius * 0.8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.ellipse(p.x - p.radius * 0.2, p.y - p.radius * 0.2, p.radius * 0.4, p.radius * 0.2, Math.PI/4, 0, Math.PI * 2);
            this.ctx.fill();
          } else {
            // Fluffy cloud dust
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.arc(p.x - p.radius * 0.6, p.y + p.radius * 0.3, p.radius * 0.8, 0, Math.PI * 2);
            this.ctx.arc(p.x + p.radius * 0.6, p.y + p.radius * 0.3, p.radius * 0.8, 0, Math.PI * 2);
            this.ctx.arc(p.x, p.y - p.radius * 0.5, p.radius * 0.9, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.restore();
        });
      }

      if (this.ghostActive && this.ghost) {
        const gx = Math.round(this.ghost.x - this.camera.x);
        const gy = Math.round(this.ghost.y - this.camera.y);
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        this.ctx.filter = 'hue-rotate(270deg) brightness(1.5)';
        
        if (renderCharId === 'classic') {
          drawClassicBox(this.ctx, { x: gx, y: gy, width: this.ghost.width, height: this.ghost.height, facing: this.ghost.facing, scaleX: 1, scaleY: 1, tiltAngle: 0, alpha: 0.5 }, this.tickCount * 16.666, false);
        } else if (renderCharId === 'robot') {
          drawRobot(this.ctx, { x: gx, y: gy, width: this.ghost.width, height: this.ghost.height, facing: this.ghost.facing, scaleX: 1, scaleY: 1, tiltAngle: 0, alpha: 0.5 }, this.tickCount * 16.666, false);
        } else if (renderCharId === 'ball') {
          this.ctx.translate(gx + this.ghost.width / 2, gy + this.ghost.height / 2);
          this.ctx.beginPath();
          this.ctx.arc(0, 0, this.ghost.width / 2, 0, Math.PI * 2);
          this.ctx.fillStyle = '#ff9800';
          this.ctx.fill();
        } else if (renderCharId === 'blob') {
          drawBlob(this.ctx, { x: gx, y: gy, width: this.ghost.width, height: this.ghost.height, facing: this.ghost.facing, vx: this.ghost.vx || 0, vy: this.ghost.vy || 0, alpha: 0.5 }, this.tickCount * 16.666, false);
        } else if (renderCharId === 'topdown' || renderCharId === 'paddle_h' || renderCharId === 'paddle_v') {
          this.ctx.fillStyle = renderCharId === 'topdown' ? '#9c27b0' : '#009688';
          this.ctx.fillRect(gx, gy, this.ghost.width, this.ghost.height);
        } else {
          drawForestKid(this.ctx, { x: gx, y: gy, width: this.ghost.width, height: this.ghost.height, facing: this.ghost.facing, scaleX: 1, scaleY: 1, tiltAngle: 0, alpha: 0.5 }, this.tickCount * 16.666, false);
        }
        this.ctx.restore();
      }

      if (this.player.isInsideCannon && !this.isDead) {
        // Player is hidden inside the cannon barrel
      } else if (renderCharId === 'classic') {
        drawClassicBox(this.ctx, { x: px, y: py, width: this.player.width, height: this.player.height, facing: isEdit ? 'right' : this.player.facing, scaleX: isEdit ? 1 : this.player.scaleX, scaleY: isEdit ? 1 : this.player.scaleY, tiltAngle: isEdit ? 0 : this.player.tiltAngle, alpha: 1.0, isGrounded: this.player.isGrounded, skin: this.player.skin, theme: this.theme }, this.tickCount * 16.666, false);
      } else if (renderCharId === 'robot') {
        drawRobot(this.ctx, { x: px, y: py, width: this.player.width, height: this.player.height, facing: isEdit ? 'right' : this.player.facing, scaleX: isEdit ? 1 : this.player.scaleX, scaleY: isEdit ? 1 : this.player.scaleY, tiltAngle: isEdit ? 0 : this.player.tiltAngle, alpha: 1.0, isGrounded: this.player.isGrounded, skin: this.player.skin, theme: this.theme }, this.tickCount * 16.666, false);
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
      } else if (renderCharId === 'blob') {
        drawBlob(this.ctx, { x: px, y: py, width: this.player.width, height: this.player.height, facing: isEdit ? 'right' : this.player.facing, vx: this.player.vx || 0, vy: this.player.vy || 0, alpha: 1.0, isGrounded: this.player.isGrounded, skin: this.player.skin, theme: this.theme }, this.tickCount * 16.666, false);
      } else if (renderCharId === 'topdown') {
        drawTopDownPlayer(this.ctx, { x: px, y: py, width: this.player.width, height: this.player.height, facing: isEdit ? 'right' : this.player.facing, scaleX: isEdit ? 1 : this.player.scaleX, scaleY: isEdit ? 1 : this.player.scaleY, tiltAngle: isEdit ? 0 : this.player.tiltAngle, alpha: 1.0, isGrounded: this.player.isGrounded, skin: this.player.skin, theme: this.theme }, this.tickCount * 16.666, false);
      } else if (renderCharId === 'paddle_h' || renderCharId === 'paddle_v') {
        this.ctx.fillStyle = '#009688';
        this.ctx.fillRect(px, py, this.player.width, this.player.height);
      } else {
        // Draw our custom Ghibli Forest Kid!
        drawForestKid(this.ctx, Object.assign({}, this.player, { x: px, y: py, facing: isEdit ? 'right' : this.player.facing, scaleX: isEdit ? 1 : this.player.scaleX, scaleY: isEdit ? 1 : this.player.scaleY, tiltAngle: isEdit ? 0 : this.player.tiltAngle, alpha: 1.0, theme: this.theme }), this.tickCount * 16.666, false);
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

      // ── Fluffy fuzzy spikes (Soot Sprite Hair) ─────────────────────────────
      // Draw dozens of little hair-like spikes around the edge
      const numHairs = 60;
      ctx.fillStyle = type === 'chaser' ? '#781414' : '#1a141e';
      ctx.beginPath();
      const startAngle = 0;
      ctx.moveTo(cx + Math.cos(startAngle) * (radius * 0.8), bodyY + Math.sin(startAngle) * (radius * 0.8));
      
      for (let i = 0; i < numHairs; i++) {
        const angle = (i / numHairs) * Math.PI * 2;
        const nextAngle = ((i + 1) / numHairs) * Math.PI * 2;
        
        // Hair flutter using Date.now() + walkFrame
        const flutter = Math.sin(Date.now() * 0.01 + i) * (radius * 0.1);
        // Vary the length of the hairs to make it look jagged and organic
        let bristleLen = radius * 1.15 + flutter + ((i % 3 === 0) ? radius * 0.2 : 0);
        
        // Trim the hairs on the bottom so the scurrying legs are visible!
        if (angle > Math.PI * 0.15 && angle < Math.PI * 0.85) {
          bristleLen = radius * 0.9 + flutter; // Shorter on the bottom
        }
        
        // Spike tip (pointy)
        ctx.lineTo(
          cx + Math.cos(angle + (Math.PI/numHairs)) * bristleLen, 
          bodyY + Math.sin(angle + (Math.PI/numHairs)) * bristleLen
        );
        // Spike base (back down to circle)
        ctx.lineTo(
          cx + Math.cos(nextAngle) * (radius * 0.8), 
          bodyY + Math.sin(nextAngle) * (radius * 0.8)
        );
      }
      ctx.closePath();
      ctx.fill();

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
        } else if (enemy.type === 'worm') {
          const cx = enemy.x + enemy.width / 2;
          const cy = enemy.y + enemy.height / 2;
          
          this.ctx.save();
          // Mound
          this.ctx.fillStyle = '#92400e';
          this.ctx.beginPath();
          this.ctx.ellipse(enemy.x + enemy.width/2, enemy.startY + enemy.height, enemy.width*0.7, enemy.height*0.25, 0, 0, Math.PI * 2);
          this.ctx.fill();

          if (enemy.wormState !== 'hidden') {
             // Clip below the mound (allow drawing above it)
             this.ctx.beginPath();
             this.ctx.rect(enemy.x - enemy.width, enemy.startY - 1000, enemy.width * 3, 1000 + enemy.height);
             this.ctx.clip();
             
             // Draw Worm Body
             this.ctx.fillStyle = '#f59e0b';
             this.ctx.beginPath();
             // A cylinder like body
             this.ctx.roundRect(enemy.x, enemy.y, enemy.width, enemy.height * 1.5, 10);
             this.ctx.fill();
             // Ribs
             this.ctx.strokeStyle = '#d97706';
             this.ctx.lineWidth = 2;
             for (let r = 10; r < enemy.height; r += 8) {
               this.ctx.beginPath();
               this.ctx.moveTo(enemy.x, enemy.y + r);
               this.ctx.lineTo(enemy.x + enemy.width, enemy.y + r);
               this.ctx.stroke();
             }
             // Eyes
             this.ctx.fillStyle = '#111';
             this.ctx.beginPath();
             this.ctx.arc(enemy.x + enemy.width*0.3, enemy.y + 10, 3, 0, Math.PI*2);
             this.ctx.arc(enemy.x + enemy.width*0.7, enemy.y + 10, 3, 0, Math.PI*2);
             this.ctx.fill();
             // Mouth
             if (enemy.wormState === 'up') {
                this.ctx.fillStyle = '#7f1d1d';
                this.ctx.beginPath();
                this.ctx.arc(enemy.x + enemy.width/2, enemy.y + 25, 6, 0, Math.PI, false);
                this.ctx.fill();
              }
          }
          this.ctx.restore();
        } else if (enemy.type === 'bat') {
          this.ctx.save();
          const cx = enemy.x + enemy.width / 2;
          const cy = enemy.y + enemy.height / 2;
          this.ctx.translate(cx, cy);
          
          this.ctx.fillStyle = '#52525b'; // zinc-600
          
          if (enemy.batState === 'sleeping') {
            // Hanging bat (wrapped)
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, enemy.width * 0.4, enemy.height * 0.4, 0, 0, Math.PI * 2);
            this.ctx.fill();
            // Wrapped wings
            this.ctx.fillStyle = '#3f3f46';
            this.ctx.beginPath();
            this.ctx.moveTo(-enemy.width*0.3, -enemy.height*0.2);
            this.ctx.lineTo(0, enemy.height*0.4);
            this.ctx.lineTo(enemy.width*0.3, -enemy.height*0.2);
            this.ctx.fill();
            // Hanging feet
            this.ctx.strokeStyle = '#18181b';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(-4, -enemy.height*0.4);
            this.ctx.lineTo(-4, -enemy.height*0.5);
            this.ctx.moveTo(4, -enemy.height*0.4);
            this.ctx.lineTo(4, -enemy.height*0.5);
            this.ctx.stroke();
          } else {
            // Flying bat
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, enemy.width * 0.3, enemy.height * 0.3, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Wings flap
            const wingY = enemy.walkFrame % 2 === 0 ? -10 : 10;
            this.ctx.beginPath();
            this.ctx.moveTo(-enemy.width*0.2, 0);
            this.ctx.lineTo(-enemy.width, wingY);
            this.ctx.lineTo(-enemy.width*0.5, 5);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.moveTo(enemy.width*0.2, 0);
            this.ctx.lineTo(enemy.width, wingY);
            this.ctx.lineTo(enemy.width*0.5, 5);
            this.ctx.fill();

            // Eyes
            this.ctx.fillStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(-4, -2, 2, 0, Math.PI * 2);
            this.ctx.arc(4, -2, 2, 0, Math.PI * 2);
            this.ctx.fill();
          }
          this.ctx.restore();
        } else if (enemy.type === 'mimic') {
          if (enemy.mimicState === 'disguised') {
            // Draw a coin block
            this.ctx.fillStyle = '#e8b76c';
            this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            this.ctx.fillStyle = '#d4a359';
            this.ctx.beginPath();
            this.ctx.arc(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.width * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fde047';
            this.ctx.font = 'bold 16px monospace';
            const tm = this.ctx.measureText('?');
            this.ctx.fillText('?', enemy.x + enemy.width/2 - tm.width/2, enemy.y + enemy.height/2 + 5);
          } else {
            // Draw an angry block
            // Shake effect if revealing
            let sx = enemy.x;
            let sy = enemy.y;
            if (enemy.mimicState === 'revealing') {
               sx += (Math.random() - 0.5) * 4;
               sy += (Math.random() - 0.5) * 4;
            }
            this.ctx.fillStyle = '#ca8a04'; // Darker gold/brown
            this.ctx.fillRect(sx, sy, enemy.width, enemy.height);
            this.ctx.fillStyle = '#713f12';
            this.ctx.beginPath();
            this.ctx.arc(sx + enemy.width / 2, sy + enemy.height / 2, enemy.width * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Angry eyes
            this.ctx.fillStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(sx + enemy.width*0.3, sy + enemy.height*0.4, 4, 0, Math.PI*2);
            this.ctx.arc(sx + enemy.width*0.7, sy + enemy.height*0.4, 4, 0, Math.PI*2);
            this.ctx.fill();
            
            // Teeth
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(sx + enemy.width*0.2, sy + enemy.height*0.7, enemy.width*0.6, 6);
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 1;
            for (let i=1; i<4; i++) {
              this.ctx.beginPath();
              this.ctx.moveTo(sx + enemy.width*0.2 + i*(enemy.width*0.6/4), sy + enemy.height*0.7);
              this.ctx.lineTo(sx + enemy.width*0.2 + i*(enemy.width*0.6/4), sy + enemy.height*0.7 + 6);
              this.ctx.stroke();
            }
          }
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

    // Draw Bombs
    for (const b of this.bombs) {
      const bx = b.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      const by = b.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      
      // Pulsate based on timer
      const scale = 1 + Math.sin(b.timer * 0.5) * 0.1;
      
      this.ctx.save();
      this.ctx.translate(bx, by);
      this.ctx.scale(scale, scale);
      
      this.ctx.fillStyle = '#1c1917'; // Black bomb body
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#78716c'; // Fuse cap
      this.ctx.fillRect(-4, -14, 8, 5);
      
      this.ctx.strokeStyle = '#ef4444'; // Red fuse
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -14);
      this.ctx.quadraticCurveTo(6, -20, 10, -16);
      this.ctx.stroke();

      // Spark
      if (b.timer % 10 < 5) {
        this.ctx.fillStyle = '#fef08a';
        this.ctx.beginPath();
        this.ctx.arc(10, -16, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    }

    // Draw Explosions
    for (const e of this.explosions) {
      const ex = e.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      const ey = e.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE / 2;
      
      // e.timer goes from 15 down to 0
      const progress = 1 - (e.timer / 15);
      const radius = progress * CONFIG.TILE_SIZE * 2;
      
      this.ctx.save();
      this.ctx.translate(ex, ey);
      this.ctx.globalAlpha = 1 - progress;
      
      this.ctx.fillStyle = '#ef4444'; // Red
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = '#f97316'; // Orange
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#fef08a'; // Yellow
      this.ctx.beginPath();
      this.ctx.arc(0, 0, radius * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    }

    // Draw Grappling Hook Line
    if (this.player.hasGrapple && this.player.grappleHook) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
      this.ctx.lineTo(this.player.grappleHook.x, this.player.grappleHook.y);
      this.ctx.strokeStyle = '#9ca3af';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Draw hook end
      this.ctx.fillStyle = '#6b7280';
      this.ctx.beginPath();
      this.ctx.arc(this.player.grappleHook.x, this.player.grappleHook.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Time Freeze Screen Tint
    if (this.timeFreezeTimer > 0) {
      // Restore camera temporarily so we can fill the screen
      this.ctx.restore();
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(234, 179, 8, 0.15)'; // Yellow tint
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Vignette effect
      const grad = this.ctx.createRadialGradient(
        this.canvas.width/2, this.canvas.height/2, this.canvas.height * 0.3,
        this.canvas.width/2, this.canvas.height/2, this.canvas.width * 0.7
      );
      grad.addColorStop(0, 'rgba(234, 179, 8, 0)');
      grad.addColorStop(1, 'rgba(202, 138, 4, 0.4)');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      // We must re-apply the camera transform since we restored it
      this.ctx.restore(); 
      this.ctx.save();
      this.ctx.translate(-this.camera.x, -this.camera.y);
    }

    // 5. Render Editor Overlay if in Edit Mode
    if (this.mode === CONFIG.MODE_EDIT) {
      this.editor.render();
    }

    if (this.onPostRender) {
      this.onPostRender(this.ctx);
    }

    // Render and update win confetti (screen-space, not camera-relative)
    if (this.winConfetti && this.winConfetti.length > 0) {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to screen coordinates
      for (let i = this.winConfetti.length - 1; i >= 0; i--) {
        const c = this.winConfetti[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.15; // Gravity
        c.vx *= 0.99; // Air resistance
        c.rotation += c.vRotation;
        c.alpha -= 0.008;

        if (c.alpha <= 0) {
          this.winConfetti.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = c.alpha;
        this.ctx.fillStyle = c.color;
        // Transform to camera-relative for confetti spawned at player position
        this.ctx.translate(c.x - this.camera.x, c.y - this.camera.y);
        this.ctx.rotate(c.rotation);
        this.ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
        this.ctx.restore();
      }
      this.ctx.restore();
    }

    // Cinematic Transitions Rendering
    const style = window.transitionStyle || 'none';
    if (this.hasWon && style === 'beam' && this.beamAlpha > 0) {
      this.ctx.save();
      
      const beamX = this.player.x + this.player.width / 2;
      const beamWidth = this.player.width + 60; // Wider to fully envelop the player
      
      // Volumetric cylinder gradient
      const grad = this.ctx.createLinearGradient(beamX - beamWidth/2, 0, beamX + beamWidth/2, 0);
      grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
      grad.addColorStop(0.3, `rgba(200, 240, 255, ${this.beamAlpha * 0.6})`);
      grad.addColorStop(0.5, `rgba(255, 255, 255, ${this.beamAlpha})`);
      grad.addColorStop(0.7, `rgba(200, 240, 255, ${this.beamAlpha * 0.6})`);
      grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

      this.ctx.globalCompositeOperation = 'screen'; // Lightens the player underneath
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(beamX - beamWidth/2, this.camera.y - 100, beamWidth, this.canvas.height + 200);
      
      this.ctx.restore();
    }

    this.ctx.restore(); // Restore main transform before screen-space effects

    if (this.hasWon && style === 'iris' && this.irisRadius !== undefined) {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); // screen space
      this.ctx.fillStyle = '#000';
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.beginPath();
      // Draw a rectangle over the whole screen
      this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
      // Cut out a circle for the iris (counter-clockwise arc)
      const px = this.player.x + this.player.width / 2 - this.camera.x;
      const py = this.player.y + this.player.height / 2 - this.camera.y;
      this.ctx.arc(px, py, Math.max(0, this.irisRadius), 0, Math.PI * 2, true);
      this.ctx.fill();
      this.ctx.restore();
    }
  }
}

