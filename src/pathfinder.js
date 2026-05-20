import { CONFIG } from './config.js';

/**
 * Solves the current level configuration from the player's current starting position.
 * Returns the sequence of actions to beat the level, or null if no solution is found.
 * 
 * @param {Engine} engine - The active game engine instance.
 * @returns {{ solution: Array<Object>|null, iterations: number }}
 */
export function solveLevel(engine) {
  engine.resetPlayer();
  const goalX = engine.level.goalPos.col * CONFIG.TILE_SIZE;
  const goalY = engine.level.goalPos.row * CONFIG.TILE_SIZE;

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
    isDead: engine.isDead,
    deathTimer: engine.deathTimer,
    portalCooldown: engine.portalCooldown,
    hasWon: engine.hasWon,
    enemies: engine.liveEnemies.map(e => ({ ...e }))
  });

  // Helper to restore the exact state of the engine
  const restoreEngine = (s) => {
    engine.player.x = s.x;
    engine.player.y = s.y;
    engine.player.vx = s.vx;
    engine.player.vy = s.vy;
    engine.player.isGrounded = s.isGrounded;
    engine.player.facing = s.facing;
    engine.isDead = s.isDead;
    engine.deathTimer = s.deathTimer;
    engine.portalCooldown = s.portalCooldown;
    engine.hasWon = s.hasWon;

    // Restore enemies to their exact stored positions and states
    engine.liveEnemies = s.enemies.map(se => ({ ...se }));
  };

  const startState = {
    ...saveEngine(),
    path: []
  };

  const openSet = [startState];
  const visited = new Set();

  const getDiscretizedKey = (s) => {
    // Round positions to nearest 5px and velocities to nearest 0.1 to allow state aggregation
    const playerPart = `${Math.round(s.x / 5)},${Math.round(s.y / 5)},${Math.round(s.vx * 10)},${Math.round(s.vy * 10)},${s.isGrounded}`;
    
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

    // Sort openSet by f(n) = g(n) + h(n)
    openSet.sort((a, b) => {
      const fA = a.path.length * 5 + getHeuristic(a);
      const fB = b.path.length * 5 + getHeuristic(b);
      return fA - fB;
    });

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
      if (act.jump && engine.player.isGrounded) {
        engine.player.vy = -CONFIG.JUMP_FORCE;
        engine.player.isGrounded = false;
      }

      // Step physics 5 frames for this action
      for (let f = 0; f < 5; f++) {
        engine.update();
        if (engine.isDead || engine.hasWon) break;
      }

      // If this action leads to death, discard it
      if (engine.isDead) continue;

      const nextState = {
        x: engine.player.x,
        y: engine.player.y,
        vx: engine.player.vx,
        vy: engine.player.vy,
        isGrounded: engine.player.isGrounded,
        facing: engine.player.facing,
        isDead: engine.isDead,
        deathTimer: engine.deathTimer,
        portalCooldown: engine.portalCooldown,
        hasWon: engine.hasWon,
        enemies: engine.liveEnemies.map(e => ({ ...e })),
        path: [...curr.path, act]
      };

      const nextKey = getDiscretizedKey(nextState);
      if (!visited.has(nextKey)) {
        openSet.push(nextState);
      }
    }
  }

  engine.liveEnemies = originalEnemies;

  return { solution, iterations };
}

export class AsyncPathfinder {
  constructor(engine) {
    engine.resetPlayer();
    this.engine = engine;
    this.goalX = engine.level.goalPos.col * CONFIG.TILE_SIZE;
    this.goalY = engine.level.goalPos.row * CONFIG.TILE_SIZE;

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
      isDead: engine.isDead,
      deathTimer: engine.deathTimer,
      portalCooldown: engine.portalCooldown,
      hasWon: engine.hasWon,
      enemies: engine.liveEnemies.map(e => ({ ...e }))
    });

    this.restoreEngine = (s) => {
      engine.player.x = s.x;
      engine.player.y = s.y;
      engine.player.vx = s.vx;
      engine.player.vy = s.vy;
      engine.player.isGrounded = s.isGrounded;
      engine.player.facing = s.facing;
      engine.isDead = s.isDead;
      engine.deathTimer = s.deathTimer;
      engine.portalCooldown = s.portalCooldown;
      engine.hasWon = s.hasWon;
      engine.liveEnemies = s.enemies.map(se => ({ ...se }));
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
      const playerPart = `${Math.round(s.x / 5)},${Math.round(s.y / 5)},${Math.round(s.vx * 10)},${Math.round(s.vy * 10)},${s.isGrounded}`;
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

    this.openSet = [startState];
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

      this.openSet.sort((a, b) => {
        const fA = a.path.length * 5 + this.getHeuristic(a);
        const fB = b.path.length * 5 + this.getHeuristic(b);
        return fA - fB;
      });

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
        if (act.jump && this.engine.player.isGrounded) {
          this.engine.player.vy = -CONFIG.JUMP_FORCE;
          this.engine.player.isGrounded = false;
        }

        for (let f = 0; f < 5; f++) {
          this.engine.update();
          if (this.engine.isDead || this.engine.hasWon) break;
        }

        if (this.engine.isDead) continue;

        const nextState = {
          x: this.engine.player.x,
          y: this.engine.player.y,
          vx: this.engine.player.vx,
          vy: this.engine.player.vy,
          isGrounded: this.engine.player.isGrounded,
          facing: this.engine.player.facing,
          isDead: this.engine.isDead,
          deathTimer: this.engine.deathTimer,
          portalCooldown: this.engine.portalCooldown,
          hasWon: this.engine.hasWon,
          enemies: this.engine.liveEnemies.map(e => ({ ...e })),
          path: [...curr.path, act]
        };

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
  }
}

