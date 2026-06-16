import { CONFIG } from './config.js';
import { audio } from './audio.js';

class PriorityQueue {
  constructor(compareFn) {
    this.data = [];
    this.compareFn = compareFn;
  }
  push(item) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }
  shift() {
    if (this.data.length === 0) return undefined;
    if (this.data.length === 1) return this.data.pop();
    const top = this.data[0];
    this.data[0] = this.data.pop();
    this._sinkDown(0);
    return top;
  }
  _bubbleUp(index) {
    while (index > 0) {
      const parentIndex = (index - 1) >>> 1;
      if (this.compareFn(this.data[index], this.data[parentIndex]) >= 0) break;
      const tmp = this.data[index];
      this.data[index] = this.data[parentIndex];
      this.data[parentIndex] = tmp;
      index = parentIndex;
    }
  }
  _sinkDown(index) {
    const length = this.data.length;
    while (true) {
      const leftIndex = (index << 1) + 1;
      const rightIndex = leftIndex + 1;
      let smallest = index;
      if (leftIndex < length && this.compareFn(this.data[leftIndex], this.data[smallest]) < 0) {
        smallest = leftIndex;
      }
      if (rightIndex < length && this.compareFn(this.data[rightIndex], this.data[smallest]) < 0) {
        smallest = rightIndex;
      }
      if (smallest === index) break;
      const tmp = this.data[index];
      this.data[index] = this.data[smallest];
      this.data[smallest] = tmp;
      index = smallest;
    }
  }
  get length() {
    return this.data.length;
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
    facing: engine.player.facing,
    coyoteTimer: engine.player.coyoteTimer,
    jumpBufferTimer: engine.player.jumpBufferTimer,
    isDead: engine.isDead,
    deathTimer: engine.deathTimer,
    portalCooldown: engine.portalCooldown,
    hasWon: engine.hasWon,
    enemies: engine.liveEnemies.map(e => ({ ...e })),
    // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
    playGrid: engine.playGrid ? engine.playGrid.map(row => row.slice()) : null,
    coinsCollected: engine.coinsCollected
  });

  // Helper to restore the exact state of the engine
  const restoreEngine = (s) => {
    engine.player.x = s.x;
    engine.player.y = s.y;
    engine.player.vx = s.vx;
    engine.player.vy = s.vy;
    engine.player.isGrounded = s.isGrounded;
    engine.player.facing = s.facing;
    engine.player.coyoteTimer = s.coyoteTimer;
    engine.player.jumpBufferTimer = s.jumpBufferTimer;
    engine.isDead = s.isDead;
    engine.deathTimer = s.deathTimer;
    engine.portalCooldown = s.portalCooldown;
    engine.hasWon = s.hasWon;

    // Restore enemies to their exact stored positions and states
    engine.liveEnemies = s.enemies.map(se => ({ ...se }));
    // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
    engine.playGrid = s.playGrid ? s.playGrid.map(row => row.slice()) : null;
    engine.coinsCollected = s.coinsCollected;
  };

  const startState = {
    ...saveEngine(),
    path: []
  };
  startState.fScore = getHeuristic(startState);

  const openSet = new PriorityQueue((a, b) => a.fScore - b.fScore);
  openSet.push(startState);
  const visited = new Set();

  const getDiscretizedKey = (s) => {
    // Round positions to nearest 5px and velocities to nearest 0.5 to allow state aggregation
    const playerPart = `${Math.round(s.x / 5)},${Math.round(s.y / 5)},${Math.round(s.vx * 2)},${Math.round(s.vy * 2)},${s.isGrounded ? 1 : 0},${s.coyoteTimer || 0},${s.jumpBufferTimer || 0}`;
    
    // Include enemy positions rounded to nearest 10px to prevent pruning valid stomp/patrol paths
    const enemyPart = s.enemies.map(e => `${Math.round(e.x / 10)},${Math.round(e.y / 10)}`).join('|');
    
    return `${playerPart}|${enemyPart}`;
  };

  const getHeuristic = (s) => {
    const dx = goalX - s.x;
    const dy = goalY - s.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Possible actions the bot can make
  const actions = [
    { right: true, left: false, jump: false },
    { right: true, left: false, jump: true },
    { right: false, left: true, jump: false },
    { right: false, left: true, jump: true },
    { right: false, left: false, jump: false },
    { right: false, left: false, jump: true }
  ];

  let iterations = 0;
  const maxIterations = 25000;
  const originalState = saveEngine();
  let solution = null;

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;

    const curr = openSet.shift();

    if (curr.hasWon) {
      solution = curr.path;
      break;
    }

    const key = getDiscretizedKey(curr);
    if (visited.has(key)) continue;
    visited.add(key);

    for (const act of actions) {
      restoreEngine(curr);

      engine.keys.left = act.left;
      engine.keys.right = act.right;
      if (act.jump) {
        engine.player.jumpBufferTimer = CONFIG.JUMP_BUFFER;
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

    this.saveEngine = () => ({
      x: engine.player.x,
      y: engine.player.y,
      vx: engine.player.vx,
      vy: engine.player.vy,
      isGrounded: engine.player.isGrounded,
      facing: engine.player.facing,
      coyoteTimer: engine.player.coyoteTimer,
      jumpBufferTimer: engine.player.jumpBufferTimer,
      isDead: engine.isDead,
      deathTimer: engine.deathTimer,
      portalCooldown: engine.portalCooldown,
      hasWon: engine.hasWon,
      enemies: engine.liveEnemies.map(e => ({ ...e })),
      // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
      playGrid: engine.playGrid ? engine.playGrid.map(row => row.slice()) : null,
      coinsCollected: engine.coinsCollected
    });

    this.restoreEngine = (s) => {
      engine.player.x = s.x;
      engine.player.y = s.y;
      engine.player.vx = s.vx;
      engine.player.vy = s.vy;
      engine.player.isGrounded = s.isGrounded;
      engine.player.facing = s.facing;
      engine.player.coyoteTimer = s.coyoteTimer;
      engine.player.jumpBufferTimer = s.jumpBufferTimer;
      engine.isDead = s.isDead;
      engine.deathTimer = s.deathTimer;
      engine.portalCooldown = s.portalCooldown;
      engine.hasWon = s.hasWon;
      engine.liveEnemies = s.enemies.map(se => ({ ...se }));
      // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
      engine.playGrid = s.playGrid ? s.playGrid.map(row => row.slice()) : null;
      engine.coinsCollected = s.coinsCollected;
    };

    this.originalState = this.saveEngine();

    this.actions = [
      { right: true, left: false, jump: false },
      { right: true, left: false, jump: true },
      { right: false, left: true, jump: false },
      { right: false, left: true, jump: true },
      { right: false, left: false, jump: false },
      { right: false, left: false, jump: true }
    ];

    this.getDiscretizedKey = (s) => {
      const playerPart = `${Math.round(s.x / 5)},${Math.round(s.y / 5)},${Math.round(s.vx * 2)},${Math.round(s.vy * 2)},${s.isGrounded ? 1 : 0},${s.coyoteTimer || 0},${s.jumpBufferTimer || 0}`;
      const enemyPart = s.enemies.map(e => `${Math.round(e.x / 10)},${Math.round(e.y / 10)}`).join('|');
      return `${playerPart}|${enemyPart}`;
    };

    this.getHeuristic = (s) => {
      const dx = this.goalX - s.x;
      const dy = this.goalY - s.y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const startState = {
      ...this.saveEngine(),
      path: []
    };
    startState.fScore = this.getHeuristic(startState);

    this.openSet = new PriorityQueue((a, b) => a.fScore - b.fScore);
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



      const curr = this.openSet.shift();
      this.exploredPoints.push({ x: curr.x, y: curr.y });

      if (curr.hasWon) {
        this.solution = curr.path;
        this.cleanup();
        return { done: true, success: true, solution: this.solution, iterations: this.iterations, exploredPoints: this.exploredPoints };
      }

      const key = this.getDiscretizedKey(curr);
      if (this.visited.has(key)) continue;
      this.visited.add(key);

      for (const act of this.actions) {
        this.restoreEngine(curr);

        this.engine.keys.left = act.left;
        this.engine.keys.right = act.right;
        if (act.jump) {
          this.engine.player.jumpBufferTimer = CONFIG.JUMP_BUFFER;
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

