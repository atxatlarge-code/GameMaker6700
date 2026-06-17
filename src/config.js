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
  ACCELERATION: 0.35,
  DECELERATION: 0.25,
  COYOTE_TIME: 6,
  JUMP_BUFFER: 5,

  // Modes
  MODE_EDIT: 'edit',
  MODE_PLAY: 'play',

  // Tools
  TOOL_WALL: 'wall',
  TOOL_PLAYER_CLASSIC: 'player_classic',
  TOOL_PLAYER_GHIBLI: 'player_ghibli',
  TOOL_PLAYER_BALL: 'player_ball',
  TOOL_PLAYER_TOPDOWN: 'player_topdown',
  TOOL_PLAYER_PADDLE_H: 'player_paddle_h',
  TOOL_PLAYER_PADDLE_V: 'player_paddle_v',
  TOOL_GOAL: 'goal',
  TOOL_TRAMPOLINE: 'trampoline',
  TOOL_FIRE: 'fire',
  TOOL_SPIKES: 'spikes',
  TOOL_PORTAL: 'portal',
  TOOL_PORTAL_SIZE: 'portal_size',
  TOOL_ERASE: 'erase',
  TOOL_ENEMY: 'enemy',
  TOOL_COIN: 'coin',
  TOOL_BREAKABLE: 'breakable',
  TOOL_EARTH: 'earth',
  TOOL_KEY: 'key',
  TOOL_LOCK: 'lock',
  TOOL_MOVEABLE: 'moveable',
  TOOL_THWOMP: 'thwomp',
  TOOL_SWITCH: 'switch',
  TOOL_BLOCK_RED: 'block_red',
  TOOL_BLOCK_BLUE: 'block_blue',
  TOOL_LAZER: 'lazer',
  TOOL_BLOCK_GHOST: 'block_ghost',
  TOOL_SPRING_BOOTS: 'spring_boots',

  // Enemy defaults
  ENEMY_SPEED: 1.8,
  ENEMY_PATROL_RANGE: 5, // tiles either side before turning
};
