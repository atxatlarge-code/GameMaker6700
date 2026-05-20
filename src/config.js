export const CONFIG = {
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 600,
  TILE_SIZE: 40,
  GRID_COLS: 60,
  GRID_ROWS: 30,
  CAMERA_PAN_SPEED: 12,

  // Physics
  GRAVITY: 0.45,
  JUMP_FORCE: 11,
  TRAMPOLINE_BOUNCE_FORCE: 16.5,
  MOVE_SPEED: 4.5,
  FRICTION: 0.82,

  // Modes
  MODE_EDIT: 'edit',
  MODE_PLAY: 'play',

  // Tools
  TOOL_WALL: 'wall',
  TOOL_PLAYER: 'player',
  TOOL_GOAL: 'goal',
  TOOL_TRAMPOLINE: 'trampoline',
  TOOL_FIRE: 'fire',
  TOOL_SPIKES: 'spikes',
  TOOL_PORTAL: 'portal',
  TOOL_ERASE: 'erase',
  TOOL_ENEMY: 'enemy',

  // Enemy defaults
  ENEMY_SPEED: 1.8,
  ENEMY_PATROL_RANGE: 5, // tiles either side before turning
};

