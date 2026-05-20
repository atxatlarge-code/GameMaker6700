import { CONFIG } from './config.js';

/**
 * Solves the current level configuration from the player's current starting position.
 * Returns the sequence of actions to beat the level, or null if no solution is found.
 * 
 * @param {Engine} engine - The active game engine instance.
 * @returns {{ solution: Array<Object>|null, iterations: number }}
 */
export function solveLevel(engine) {
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

  // Restore the engine to its clean starting state
  restoreEngine(originalState);
  engine.liveEnemies = originalEnemies;

  return { solution, iterations };
}
