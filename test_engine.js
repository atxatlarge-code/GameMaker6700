import fs from 'fs';
const engineCode = fs.readFileSync('src/engine.js', 'utf8');

// Mock dependencies
global.CONFIG = {
  MODE_PLAY: 1, MODE_EDIT: 2, TILE_SIZE: 40, GRID_COLS: 60, GRID_ROWS: 30, GRAVITY: 0.45,
  TERMINAL_VELOCITY: 15, JUMP_FORCE: 10, ENEMY_SPEED: 1.8, ENEMY_PATROL_RANGE: 5
};
global.TILE = { SOLID: 1, EMPTY: 0, COIN: 2, TURRET: 3, GRAVITY_WELL: 4, ROPE: 5, MINECART: 6 };
global.audio = { playDeathSound: ()=>{}, playBounceSound: ()=>{} };

// Create a minimal environment to eval engine
const module = { exports: {} };
const codeToEval = engineCode
  .replace(/import .*/g, '')
  .replace(/export class Engine/, 'class Engine');

eval(codeToEval + ';\nmodule.exports = { Engine };');

const mockCanvas = { getContext: () => ({}) };

const engine = new module.exports.Engine(mockCanvas, null, {
  grid: Array(30).fill(null).map(() => Array(60).fill(0)),
  enemies: [{ id: 'e1', col: 5, row: 20, speed: 1.8, patrolRange: 5, type: 'basic' }],
  playerSpawn: { col: 2, row: 20 },
  platforms: []
});

engine.setMode(CONFIG.MODE_PLAY);

console.log("Initial enemy:", engine.liveEnemies[0]);

// Make ground solid
for (let c = 0; c < 60; c++) engine.playGrid[21][c] = 1;

for (let i = 0; i < 5; i++) {
  engine.updatePlayer();
  engine.updateEnemies();
  console.log(`Frame ${i}: player.x=${engine.player.x.toFixed(2)}, player.y=${engine.player.y.toFixed(2)}, enemy.x=${engine.liveEnemies[0].x.toFixed(2)}, enemy.y=${engine.liveEnemies[0].y.toFixed(2)}, vx=${engine.liveEnemies[0].vx.toFixed(2)}, isGrounded=${engine.liveEnemies[0].isGrounded}`);
}
