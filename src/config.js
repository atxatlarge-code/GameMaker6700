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
  TOOL_PLAYER_ROBOT: 'player_robot',
  TOOL_PLAYER_BALL: 'player_ball',
  TOOL_PLAYER_TOPDOWN: 'player_topdown',
  TOOL_PLAYER_PADDLE_H: 'player_paddle_h',
  TOOL_PLAYER_PADDLE_V: 'player_paddle_v',
  TOOL_GOAL: 'goal',
  TOOL_TRAMPOLINE: 'trampoline',
  TOOL_FIRE: 'fire',
  TOOL_SPIKES: 'spikes',
  TOOL_MIMIC: 'mimic',
  TOOL_ROPE: 'rope',
  TOOL_TURRET: 'turret_shooter',
  TOOL_PORTAL: 'portal',
  TOOL_PORTAL_SIZE: 'portal_size',
  TOOL_ERASE: 'erase',
  TOOL_ENEMY: 'enemy',
  TOOL_COIN: 'coin',
  TOOL_BREAKABLE: 'breakable',
  // Wind
  WIND_FORCE: 0.48,

  // Tool Selection Constants
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
  TOOL_BLOCK_ICE: 'block_ice',
  TOOL_PORTAL_GRAVITY: 'portal_gravity',
  TOOL_CONVEYOR_LEFT: 'conveyor_left',
  TOOL_CONVEYOR_RIGHT: 'conveyor_right',
  TOOL_DASH_PANEL_RIGHT: 'dash_panel_right',
  TOOL_DASH_PANEL_LEFT: 'dash_panel_left',
  TOOL_TRIPWIRE: 'tripwire',
  TOOL_BLOCK_CRUMBLE: 'block_crumble',
  TOOL_MOVING_PLATFORM: 'moving_platform',
  TOOL_DOUBLE_JUMP: 'double_jump',
  TOOL_CHECKPOINT: 'checkpoint',
  TOOL_FAKE_WALL: 'fake_wall',
  TOOL_SPEED_BOOST: 'speed_boost',
  TOOL_BUMPER: 'bumper',
  TOOL_GRAVITY_SWITCH: 'gravity_switch',
  TOOL_JETPACK: 'jetpack',
  TOOL_BOUNCY_MUSHROOM: 'bouncy_mushroom',
  TOOL_ENEMY_TELEPORT: 'enemy_teleport',
  TOOL_WATER: 'water',
  TOOL_SLIME: 'slime',
  TOOL_BOOMERANG: 'boomerang',
  TOOL_PORTAL_MIRROR: 'portal_mirror',
  TOOL_STALACTITE: 'stalactite',
  TOOL_WIND_UP: 'wind_up',
  TOOL_WIND_DOWN: 'wind_down',
  TOOL_WIND_LEFT: 'wind_left',
  TOOL_WIND_RIGHT: 'wind_right',
  TOOL_ENEMY_WORM: 'enemy_worm',
  TOOL_ENEMY_BAT: 'enemy_bat',
  TOOL_ENEMY_MIMIC: 'enemy_mimic',
  TOOL_DASH_POWERUP: 'dash_powerup',
  TOOL_PUSHABLE_ICE_BLOCK: 'pushable_ice_block',
  TOOL_MAGNETIC_BOOTS: 'magnetic_boots',
  TOOL_GRAPPLE: 'grapple',
  TOOL_STOPWATCH: 'stopwatch',
  TOOL_DOOR_RED: 'door_red',
  TOOL_DOOR_BLUE: 'door_blue',
  TOOL_DOOR_GREEN: 'door_green',
  TOOL_BOMB_POWERUP: 'bomb_powerup',
  TOOL_CRACKED_BLOCK: 'cracked_block',
  TOOL_GHOST_SWITCH: 'ghost_switch',
  TOOL_JUMP_THROUGH: 'jump_through',
  TOOL_CANNON_BARREL: 'cannon_barrel',
  TOOL_TURRET: 'turret',
  TOOL_MINECART: 'minecart',
  TOOL_RAMP_RIGHT: 'ramp_right',
  TOOL_RAMP_LEFT: 'ramp_left',
  TOOL_REFLECTOR: 'reflector',
  TOOL_GRAVITY_WELL: 'gravity_well',
  
  // Powerups (Starting from 100)
  TOOL_DOUBLE_JUMP: 'double_jump', // 100
  TOOL_SPEED_BOOST: 'speed_boost', // 101
  TOOL_SPRING_BOOTS: 'spring_boots', // 102
  TOOL_JETPACK: 'jetpack', // 103
  TOOL_SHRINK_POTION: 'shrink_potion', // 104
  TOOL_PAINT_BLOCK: 'paint_block', // 105
  TOOL_INVISIBLE_BLOCK: 'invisible_block', // 106
  TOOL_REVEALED_BLOCK: 'revealed_block', // 107
  
  // Grapple Physics
  GRAPPLE_SPEED: 25,
  GRAPPLE_STIFFNESS: 0.1,

  // Stopwatch
  STOPWATCH_DURATION: 180,

  // Enemy defaults
  ENEMY_SPEED: 1.8,
  ENEMY_PATROL_RANGE: 5, // tiles either side before turning
};
