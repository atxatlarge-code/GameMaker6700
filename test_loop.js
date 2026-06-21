import fs from 'fs';
const engineCode = fs.readFileSync('src/engine.js', 'utf8');

global.CONFIG = {
  MODE_PLAY: 1, MODE_EDIT: 2, TILE_SIZE: 40, GRID_COLS: 60, GRID_ROWS: 30, GRAVITY: 0.45,
  TERMINAL_VELOCITY: 15, JUMP_FORCE: 10, ENEMY_SPEED: 1.8, ENEMY_PATROL_RANGE: 5
};
global.TILE = { SOLID: 1, EMPTY: 0, COIN: 2, TURRET: 3, GRAVITY_WELL: 4, ROPE: 5, MINECART: 6 };
global.audio = { playDeathSound: ()=>{}, playBounceSound: ()=>{} };
global.World = class {
  getEntitiesWith() { return []; }
  getComponent() { return {}; }
  createEntity() { return 1; }
  addComponent() {}
  get systemManager() { return { addSystem: () => {} }; }
};
global.Components = { Transform: {}, Velocity: {}, PlayerInput: {}, Gravity: {}, Jump: {} };
global.createTransform = () => ({});
global.createVelocity = () => ({});
global.createPlayerInput = () => ({});
global.createGravity = () => ({});
global.createJump = () => ({});

global.window = { audio: global.audio, addEventListener: () => {}, editor: { initEngine: () => {} } };
global.document = { addEventListener: () => {}, querySelectorAll: () => [], getElementById: () => null };

const module = { exports: {} };
const codeToEval = engineCode
  .replace(/import .*/g, '')
  .replace(/export class Engine/, 'class Engine')
  .replace(/this\.editor\.initEngine\(this\);/, '// removed');

eval(codeToEval + ';\nmodule.exports = { Engine };');

const mockCanvas = { getContext: () => ({}), width: 800, height: 600 };
const level = {
  grid: Array(30).fill(null).map((_, r) => Array(60).fill(r === 21 ? 1 : 0)),
  enemies: [{ id: 'e1', col: 5, row: 20, speed: 1.8, patrolRange: 5, type: 'patrol' }],
  playerSpawn: { col: 5, row: 20, charId: 'ghibli' },
  platforms: []
};
const mockEditor = { initEngine: () => {} };
const assets = { ghibli: {} };

const engine = new module.exports.Engine(mockCanvas, level, mockEditor, assets, () => {});

engine.setMode(CONFIG.MODE_PLAY);

for (let i = 0; i < 50; i++) {
  engine.updatePlayer();
  engine.updateEnemies();
  engine.checkEnemyCollisions();
  const e = engine.liveEnemies[0];
  if (!e) {
      console.log(`Frame ${i}: isDead=${engine.isDead}`);
      break;
  }
  const overlapping = !(
    engine.player.x + 4 >= e.x + e.width - 4 ||
    engine.player.x + engine.player.width - 4 <= e.x + 4 ||
    engine.player.y + 4 >= e.y + e.height - 4 ||
    engine.player.y + engine.player.height - 4 <= e.y + 4
  );
  if (i < 5 || i > 45) {
      console.log(`Frame ${i}: player(${engine.player.x.toFixed(2)}, ${engine.player.y.toFixed(2)}) enemy(${e.x.toFixed(2)}, ${e.y.toFixed(2)}) grounded=${e.isGrounded} overlapping=${overlapping} enemy.vx=${e.vx}`);
  }
}
