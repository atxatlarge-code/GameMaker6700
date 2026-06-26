import { CONFIG } from './config.js';
import { audio } from './audio.js';
import { TILE } from './tiles.js';

// ⚡ Bolt: Replace A* Open Set Array Splice with Min-Heap for O(log N) inserts
class MinHeap {
  constructor() {
    this.heap = [];
    this.insertCount = 0;
  }
  push(item) {
    item._insertId = ++this.insertCount;
    this.heap.push(item);
    this._siftUp(this.heap.length - 1);
  }
  pop() {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._siftDown(0);
    }
    return top;
  }
  _compare(a, b) {
    // Preserve LIFO tie-breaking for equal fScores (as `insertSorted` did naturally)
    if (a.fScore === b.fScore) return b._insertId - a._insertId;
    return a.fScore - b.fScore;
  }
  _siftUp(idx) {
    let parent = (idx - 1) >>> 1;
    while (idx > 0 && this._compare(this.heap[idx], this.heap[parent]) < 0) {
      const temp = this.heap[idx];
      this.heap[idx] = this.heap[parent];
      this.heap[parent] = temp;
      idx = parent;
      parent = (idx - 1) >>> 1;
    }
  }
  _siftDown(idx) {
    const len = this.heap.length;
    while (true) {
      let left = (idx << 1) + 1;
      let right = left + 1;
      let smallest = idx;
      if (left < len && this._compare(this.heap[left], this.heap[smallest]) < 0) smallest = left;
      if (right < len && this._compare(this.heap[right], this.heap[smallest]) < 0) smallest = right;
      if (smallest !== idx) {
        const temp = this.heap[idx];
        this.heap[idx] = this.heap[smallest];
        this.heap[smallest] = temp;
        idx = smallest;
      } else {
        break;
      }
    }
  }
  get length() {
    return this.heap.length;
  }
}

/**
 * Solves the current level configuration from the player's current starting position.
 * Returns the sequence of actions to beat the level, or null if no solution is found.
 * 
 * @param {Engine} engine - The active game engine instance.
 * @returns {{ solution: Array<Object>|null, iterations: number }}
 */
export function solveLevel(engine) {
  const originalMode = engine.mode;
  const originalAutoplay = engine.isAutoplay;
  engine.mode = CONFIG.MODE_PLAY;
  engine.isAutoplay = false;
  engine.resetPlayer();
  engine.hasWon = false;

  const goalX = engine.level.goalPos.col * CONFIG.TILE_SIZE;
  const goalY = engine.level.goalPos.row * CONFIG.TILE_SIZE;

  // Set simulation flags
  audio.isSimulation = true;
  engine.isSimulation = true;

  // Temporarily initialize live enemies for the simulation if they aren't already initialized
  const originalEnemies = engine.liveEnemies;
  engine.liveEnemies = engine.level.enemies.map(e => ({
    id: e.id,
    x: e.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - 32) / 2,
    y: e.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - 38),
    width: 32,
    height: 38,
    vx: e.speed,
    vy: 0,
    isGrounded: false,
    speed: e.speed,
    patrolLeft: (e.col - e.patrolRange) * CONFIG.TILE_SIZE,
    patrolRight: (e.col + e.patrolRange) * CONFIG.TILE_SIZE,
    facing: 'right',
    walkFrame: 0,
    walkTimer: 0,
  }));

  // Helper to save the exact state of the engine
  const saveEngine = () => ({
    x: engine.player.x,
    y: engine.player.y,
    vx: engine.player.vx,
    vy: engine.player.vy,
    isGrounded: engine.player.isGrounded,
    hasDash: engine.player.hasDash,
    dashAvailable: engine.player.dashAvailable,
    isDashing: engine.player.isDashing,
    dashTimer: engine.player.dashTimer,
    facing: engine.player.facing,
    coyoteTimer: engine.player.coyoteTimer,
    jumpBufferTimer: engine.player.jumpBufferTimer,
    hasMagneticBoots: engine.player.hasMagneticBoots,
    magneticState: engine.player.magneticState,
    hasGrapple: engine.player.hasGrapple,
    grappleHook: engine.player.grappleHook ? { ...engine.player.grappleHook } : null,
    
    // Engine State
    switchState: engine.level.switchState,
    timeFreezeTimer: engine.timeFreezeTimer || 0,
    
    isDead: engine.isDead,
    deathTimer: engine.deathTimer,
    portalCooldown: engine.portalCooldown,
    gravityDir: engine.level ? engine.level.gravityDir : 1,
    hasWon: engine.hasWon,
    enemies: engine.liveEnemies.map(e => ({ ...e })),
    // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
    playGrid: engine.playGrid ? engine.playGrid.map(row => row.slice()) : null,
    coinsCollected: engine.coinsCollected,
    stalactites: engine.stalactites ? engine.stalactites.map(s => ({ ...s })) : [],
    slidingIceBlocks: engine.slidingIceBlocks ? engine.slidingIceBlocks.map(b => ({ ...b, toggledSwitches: b.toggledSwitches ? new Set(b.toggledSwitches) : new Set() })) : [],
    hasBombs: engine.player.hasBombs,
    bombs: engine.bombs ? engine.bombs.map(b => ({ ...b })) : [],
    ghostRecording: engine.ghostRecording,
    ghostRecordTimer: engine.ghostRecordTimer,
    ghostFrames: engine.ghostFrames ? [...engine.ghostFrames] : [],
    ghostActive: engine.ghostActive,
    ghostPlaybackIndex: engine.ghostPlaybackIndex,
    ghostData: engine.ghost ? { ...engine.ghost } : null
  });

  // Helper to restore the exact state of the engine
  const restoreEngine = (s) => {
    engine.player.x = s.x;
    engine.player.y = s.y;
    engine.player.vx = s.vx;
    engine.player.vy = s.vy;
    engine.player.isGrounded = s.isGrounded;
    engine.player.hasDash = s.hasDash;
    engine.player.dashAvailable = s.dashAvailable;
    engine.player.isDashing = s.isDashing;
    engine.player.dashTimer = s.dashTimer;
    engine.player.facing = s.facing;
    engine.player.coyoteTimer = s.coyoteTimer;
    engine.player.jumpBufferTimer = s.jumpBufferTimer;
    engine.player.hasMagneticBoots = s.hasMagneticBoots;
    engine.player.magneticState = s.magneticState;
    engine.player.hasGrapple = s.hasGrapple;
    engine.player.grappleHook = s.grappleHook ? { ...s.grappleHook } : null;
    
    // Engine State
    engine.level.switchState = s.switchState;
    engine.timeFreezeTimer = s.timeFreezeTimer;
    
    engine.isDead = s.isDead;
    engine.deathTimer = s.deathTimer;
    engine.portalCooldown = s.portalCooldown;
    if (engine.level) engine.level.gravityDir = s.gravityDir;
    engine.hasWon = s.hasWon;

    // Restore enemies to their exact stored positions and states
    engine.liveEnemies = s.enemies.map(se => ({ ...se }));
    // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
    engine.playGrid = s.playGrid ? s.playGrid.map(row => row.slice()) : null;
    engine.coinsCollected = s.coinsCollected;
    engine.stalactites = s.stalactites ? s.stalactites.map(st => ({ ...st })) : [];
    engine.slidingIceBlocks = s.slidingIceBlocks ? s.slidingIceBlocks.map(b => ({ ...b, toggledSwitches: b.toggledSwitches ? new Set(b.toggledSwitches) : new Set() })) : [];
    engine.player.hasBombs = s.hasBombs;
    engine.bombs = s.bombs ? s.bombs.map(b => ({ ...b })) : [];
    engine.ghostRecording = s.ghostRecording;
    engine.ghostRecordTimer = s.ghostRecordTimer;
    engine.ghostFrames = s.ghostFrames ? [...s.ghostFrames] : [];
    engine.ghostActive = s.ghostActive;
    engine.ghostPlaybackIndex = s.ghostPlaybackIndex;
    engine.ghost = s.ghostData ? { ...s.ghostData } : null;
  };

  const startState = {
    ...saveEngine(),
    path: []
  };
  startState.fScore = getHeuristic(startState);

  const openSet = new MinHeap();
  openSet.push(startState);
  const visited = new Set();

  const getDiscretizedKey = (s) => {
    // Round positions to nearest 5px and velocities to nearest 0.5 to allow state aggregation
    const playerPart = `${Math.round(s.x / 5)},${Math.round(s.y / 5)},${Math.round(s.vx * 2)},${Math.round(s.vy * 2)},${s.isGrounded ? 1 : 0},${s.coyoteTimer || 0},${s.jumpBufferTimer || 0},${s.gravityDir || 1},${s.hasDash ? 1 : 0},${s.dashAvailable ? 1 : 0},${s.isDashing ? 1 : 0},${s.hasBombs ? 1 : 0},${s.magneticState || 'none'},${s.grappleHook ? `${Math.round(s.grappleHook.x/5)},${Math.round(s.grappleHook.y/5)},${s.grappleHook.attached?1:0}` : '0'},${s.timeFreezeTimer > 0 ? 1 : 0},${s.portalCooldown > 0 ? 1 : 0},${s.lastDoorExited ? `${s.lastDoorExited.col},${s.lastDoorExited.row}` : '0'},${s.lastPortalExited || 0}`;
    const levelPart = `${s.coinsCollected},${s.switchState}`;
    
    // Include bomb positions and timers
    const bombPart = s.bombs ? s.bombs.map(b => `${b.col},${b.row},${Math.round(b.timer/10)}`).join('|') : '';

    // Include enemy positions rounded to nearest 10px to prevent pruning valid stomp/patrol paths
    const enemyPart = s.enemies.map(e => `${Math.round(e.x / 10)},${Math.round(e.y / 10)}`).join('|');
    
    // Include sliding ice blocks positions rounded to 5px
    const icePart = s.slidingIceBlocks ? s.slidingIceBlocks.map(b => `${Math.round(b.x / 5)},${Math.round(b.y / 5)}`).join('|') : '';
    
    // Include ghost state
    const ghostPart = `${s.ghostRecording?1:0},${s.ghostActive?1:0},${s.ghostPlaybackIndex||0}`;
    
    return `${playerPart}_${levelPart}_${bombPart}_${enemyPart}_${icePart}_${ghostPart}`;
  };

  const getHeuristic = (s) => {
    const dx = goalX - s.x;
    const dy = goalY - s.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Possible actions the bot can make
  const baseActions = [
    { right: true, left: false, jump: false, dash: false, down: false, up: false },
    { right: true, left: false, jump: true, dash: false, down: false, up: false },
    { right: false, left: true, jump: false, dash: false, down: false, up: false },
    { right: false, left: true, jump: true, dash: false, down: false, up: false },
    { right: false, left: false, jump: false, dash: false, down: false, up: false },
    { right: false, left: false, jump: true, dash: false, down: false, up: false },
    { right: true, left: false, jump: false, dash: false, down: true, up: false },
    { right: false, left: true, jump: false, dash: false, down: true, up: false },
    { right: false, left: false, jump: false, dash: false, down: true, up: false }
  ];

  let iterations = 0;
  const maxIterations = 25000;
  const originalState = saveEngine();
  let solution = null;

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;

    const curr = openSet.pop();

    if (curr.hasWon) {
      solution = curr.path;
      break;
    }

    const key = getDiscretizedKey(curr);
    if (visited.has(key)) continue;
    visited.add(key);

    let currentActions = baseActions;
    if (curr.hasDash && curr.dashAvailable && !curr.isGrounded && !curr.isDashing) {
      currentActions = currentActions.concat([
        { right: true, left: false, jump: false, dash: true, down: false, up: false },
        { right: false, left: true, jump: false, dash: true, down: false, up: false }
      ]);
    }
    if (curr.hasMagneticBoots && (curr.magneticState === 'left' || curr.magneticState === 'right')) {
      currentActions = currentActions.concat([
        { right: false, left: false, jump: false, dash: false, down: true, up: false },
        { right: false, left: false, jump: false, dash: false, down: false, up: true },
        { right: false, left: false, jump: true, dash: false, down: false, up: false } // Jump off the wall
      ]);
    }
    if (curr.hasBombs) {
      currentActions = currentActions.concat([
        { right: false, left: false, jump: false, dash: false, down: false, up: false, bomb: true }
      ]);
    }

    for (const act of currentActions) {
      restoreEngine(curr);

      engine.keys.left = act.left;
      engine.keys.right = act.right;
      engine.keys.dash = act.dash;
      engine.keys.down = act.down || false;
      engine.keys.up = act.up || false;
      if (act.jump) {
        engine.player.jumpBufferTimer = CONFIG.JUMP_BUFFER;
        engine.keys.up = true; // Ensure up is set for jump logic
      }
      if (act.bomb) {
        engine.dropBomb();
      }

      // Step physics 5 frames for this action
      for (let f = 0; f < 5; f++) {
        engine.update();
        if (engine.isDead || engine.hasWon) break;
      }

      // If this action leads to death, discard it
      if (engine.isDead) continue;

      // ⚡ Bolt: Cache fScore on state to prevent recomputing heuristic in sort loop
      const nextState = {
        ...saveEngine(),
        path: [...curr.path, act]
      };
      nextState.fScore = nextState.path.length * 5 + getHeuristic(nextState);

      const nextKey = getDiscretizedKey(nextState);
      if (!visited.has(nextKey)) {
        openSet.push(nextState);
      }
    }
  }

  engine.liveEnemies = originalEnemies;

  // Reset simulation flags
  audio.isSimulation = false;
  engine.isSimulation = false;

  // Restore mode and autoplay
  engine.mode = originalMode;
  engine.isAutoplay = originalAutoplay;

  return { solution, iterations };
}

export class AsyncPathfinder {
  constructor(engine) {
    this.originalMode = engine.mode;
    this.originalAutoplay = engine.isAutoplay;
    engine.mode = CONFIG.MODE_PLAY;
    engine.isAutoplay = false;
    engine.resetPlayer();
    engine.hasWon = false;
    this.engine = engine;
    this.goalX = engine.level.goalPos.col * CONFIG.TILE_SIZE;
    this.goalY = engine.level.goalPos.row * CONFIG.TILE_SIZE;

    // Set simulation flags
    audio.isSimulation = true;
    engine.isSimulation = true;

    // Temporarily initialize live enemies for the simulation if they aren't already initialized
    this.originalEnemies = engine.liveEnemies;
    engine.liveEnemies = engine.level.enemies.map(e => ({
      id: e.id,
      x: e.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - 32) / 2,
      y: e.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - 38),
      width: 32,
      height: 38,
      vx: e.speed,
      vy: 0,
      isGrounded: false,
      speed: e.speed,
      patrolLeft: (e.col - e.patrolRange) * CONFIG.TILE_SIZE,
      patrolRight: (e.col + e.patrolRange) * CONFIG.TILE_SIZE,
      facing: 'right',
      walkFrame: 0,
      walkTimer: 0,
    }));

    this.saveEngine = () => engine.saveState();

    this.restoreEngine = (s) => engine.restoreState(s);

    this.originalState = this.saveEngine();

    this.actions = [
      { right: true, left: false, jump: false, down: false, up: false },
      { right: true, left: false, jump: true, down: false, up: false },
      { right: false, left: true, jump: false, down: false, up: false },
      { right: false, left: true, jump: true, down: false, up: false },
      { right: false, left: false, jump: false, down: false, up: false },
      { right: false, left: false, jump: true, down: false, up: false }
    ];

    this.getDiscretizedKey = (s) => {
      const playerPart = `${Math.round(s.player.x / 5)},${Math.round(s.player.y / 5)},${Math.round(s.player.vx * 2)},${Math.round(s.player.vy * 2)},${s.player.isGrounded ? 1 : 0},${s.player.coyoteTimer || 0},${s.player.jumpBufferTimer || 0},${s.player.magneticState || 'none'},${s.portalCooldown > 0 ? 1 : 0},${s.lastDoorExited ? `${s.lastDoorExited.col},${s.lastDoorExited.row}` : '0'},${s.lastPortalExited || 0}`;
      const enemyPart = s.liveEnemies.map(e => `${Math.round(e.x / 10)},${Math.round(e.y / 10)}`).join('|');
      return `${playerPart}|${enemyPart}`;
    };

    this.getHeuristic = (s) => {
      const dx = this.goalX - s.player.x;
      const dy = this.goalY - s.player.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const startState = {
      ...this.saveEngine(),
      path: []
    };
    startState.fScore = this.getHeuristic(startState);

    this.openSet = new MinHeap();
    this.openSet.push(startState);
    this.visited = new Set();
    this.exploredPoints = [];
    this.iterations = 0;
    this.maxIterations = 20000; // Cap search space
    this.solution = null;
  }

  step(chunkSize = 300) {
    let stepsCount = 0;
    while (this.openSet.length > 0 && stepsCount < chunkSize && this.iterations < this.maxIterations) {
      this.iterations++;
      stepsCount++;



      const curr = this.openSet.pop();
      this.exploredPoints.push({ x: curr.player.x, y: curr.player.y });

      if (curr.hasWon) {
        this.solution = curr.path;
        this.cleanup();
        return { done: true, success: true, solution: this.solution, iterations: this.iterations, exploredPoints: this.exploredPoints };
      }

      const key = this.getDiscretizedKey(curr);
      if (this.visited.has(key)) continue;
      this.visited.add(key);

        let currentActions = this.actions;
        if (curr.player.hasMagneticBoots && (curr.player.magneticState === 'left' || curr.player.magneticState === 'right')) {
          currentActions = currentActions.concat([
            { right: false, left: false, jump: false, down: true, up: false },
            { right: false, left: false, jump: false, down: false, up: true },
            { right: false, left: false, jump: true, down: false, up: false } // Jump off the wall
          ]);
        }

        for (const act of currentActions) {
          this.restoreEngine(curr);

          this.engine.keys.left = act.left;
          this.engine.keys.right = act.right;
          this.engine.keys.down = act.down || false;
          this.engine.keys.up = act.up || false;
          if (act.jump) {
            this.engine.player.jumpBufferTimer = CONFIG.JUMP_BUFFER;
            this.engine.keys.up = true; // Ensure up is set for jump logic
          }

        for (let f = 0; f < 5; f++) {
          this.engine.update();
          if (this.engine.isDead || this.engine.hasWon) break;
        }

        if (this.engine.isDead) continue;

        // ⚡ Bolt: Cache fScore on state to prevent recomputing heuristic in sort loop
        const nextState = {
          ...this.saveEngine(),
          path: [...curr.path, act]
        };
        nextState.fScore = nextState.path.length * 5 + this.getHeuristic(nextState);

        const nextKey = this.getDiscretizedKey(nextState);
        if (!this.visited.has(nextKey)) {
          this.openSet.push(nextState);
        }
      }
    }

    if (this.iterations >= this.maxIterations || this.openSet.length === 0) {
      this.cleanup();
      return { done: true, success: false, solution: null, iterations: this.iterations, exploredPoints: this.exploredPoints };
    }

    return { done: false, success: false, iterations: this.iterations, exploredPoints: this.exploredPoints };
  }

  cleanup() {
    this.restoreEngine(this.originalState);
    this.engine.liveEnemies = this.originalEnemies;

    // Reset simulation flags
    audio.isSimulation = false;
    this.engine.isSimulation = false;

    // Restore mode and autoplay
    this.engine.mode = this.originalMode;
    this.engine.isAutoplay = this.originalAutoplay;
  }

  getWinningPathPoints() {
    if (!this.solution) return [];
    const points = [];
    
    // Temporarily set simulation flags
    const wasSimulation = audio.isSimulation;
    audio.isSimulation = true;
    this.engine.isSimulation = true;
    const prevMode = this.engine.mode;
    this.engine.mode = CONFIG.MODE_PLAY;
    
    const originalState = this.saveEngine();
    this.restoreEngine(this.originalState);
    
    points.push({ x: this.engine.player.x, y: this.engine.player.y });
    for (const act of this.solution) {
      this.engine.keys.left = act.left;
      this.engine.keys.right = act.right;
      if (act.jump) {
        this.engine.player.jumpBufferTimer = CONFIG.JUMP_BUFFER;
      }
      for (let f = 0; f < 5; f++) {
        this.engine.update();
      }
      points.push({ x: this.engine.player.x, y: this.engine.player.y });
    }
    
    this.restoreEngine(originalState);
    audio.isSimulation = wasSimulation;
    this.engine.isSimulation = wasSimulation;
    this.engine.mode = prevMode;
    
    return points;
  }
}

