const fs = require('fs');

const code = fs.readFileSync('src/engine.js', 'utf-8');

const TILE_SIZE = 40;

const enemy = {
  x: 200,
  y: 400,
  width: 32,
  height: 38,
  vx: 0,
  vy: 0.45,
  isGrounded: false,
  speed: 1.8,
  patrolLeft: 200,
  patrolRight: 200,
  type: 'patrol'
};

const EngineMock = {
  isSolid: (c, r) => r >= 11, // floor at y=440
  liveEnemies: [enemy],
  player: { x: 200, y: 400, width: 32, height: 38 },
  isDead: false,
  hasWon: false,
  killPlayer: () => { EngineMock.isDead = true; },
  camera: { x: 0, y: 0 },
  canvas: { width: 800 }
};

const updateEnemiesStr = code.substring(code.indexOf('updateEnemies() {'), code.indexOf('updateTurrets() {'));
const checkCollStr = code.substring(code.indexOf('checkEnemyCollisions() {'), code.indexOf('updateMinecarts() {'));

const CONFIG = {
  GRAVITY: 0.45,
  TERMINAL_VELOCITY: 15,
  TILE_SIZE: 40,
  GRID_COLS: 30,
  GRID_ROWS: 30
};

// Clean strings
let f1 = updateEnemiesStr.substring(updateEnemiesStr.indexOf('{') + 1);
f1 = f1.substring(0, f1.lastIndexOf('}'));
eval('EngineMock.updateEnemies = function() {' + f1 + '}');

let f2 = checkCollStr.substring(checkCollStr.indexOf('{') + 1);
f2 = f2.substring(0, f2.lastIndexOf('}'));
eval('EngineMock.checkEnemyCollisions = function() {' + f2 + '}');

console.log("Initial state:", JSON.stringify(enemy));
EngineMock.updateEnemies();
console.log("After update 1:", JSON.stringify(enemy));
EngineMock.checkEnemyCollisions();
console.log("Player dead?", EngineMock.isDead);

