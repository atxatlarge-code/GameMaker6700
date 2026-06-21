/**
 * TILE — Canonical tile type IDs for GameMaker 6700.
 *
 * Every magic number that appears in a grid cell should be referenced
 * through this object so the meaning is always clear.
 *
 * Usage:
 *   import { TILE } from './tiles.js';
 *   if (this.getTile(col, row) === TILE.FIRE) { … }
 */
export const TILE = {
  // ── Core ────────────────────────────────────────────────
  EMPTY:            0,
  SOLID:            1,   // Generic wall / concrete block
  TRAMPOLINE:       2,   // Bouncy mushroom
  FIRE:             3,   // Instant-kill fire hazard
  SPIKES:           4,   // Instant-kill spike hazard
  COIN:             5,   // Collectible coin
  BREAKABLE:        6,   // Breakable brick (destroyed by head-bump)
  EARTH:            7,   // Grass / earth block

  // ── Puzzle Blocks ──────────────────────────────────────
  LOCK:             8,   // Opened by KEY
  KEY:              9,   // Unlocks LOCK tiles
  MOVEABLE:        10,   // Pushable crate
  SWITCH:          11,   // Toggles red/blue switch state
  BLOCK_RED:       12,   // Solid when switch state is 'red'
  BLOCK_BLUE:      13,   // Solid when switch state is 'blue'
  SIZE_PORTAL:     14,   // Toggles player mini / normal size

  // ── Special Blocks ────────────────────────────────────
  // 15 is "ghost block" in editor, used as TOOL_BLOCK_GHOST → 15
  GHOST_BLOCK:     16,   // Collectable spring-boots tile (also acts as ghost block in some contexts)
  ICE:             17,   // Slippery ice surface
  ANTI_GRAVITY:    18,   // Reverses gravity for player inside
  CONVEYOR_LEFT:   19,   // Pushes entities left
  CONVEYOR_RIGHT:  20,   // Pushes entities right
  TRIPWIRE:        21,   // Toggles switch state on contact
  CRUMBLE:         22,   // Crumbles after being stood on, respawns
  DASH_PANEL_LEFT: 23,   // Launches player left at high speed
  DASH_PANEL_RIGHT:24,   // Launches player right at high speed (also used as double-jump powerup pickup)

  // ── Powerup Pickups (sub-100) ─────────────────────────
  CHECKPOINT:      25,   // Sets respawn point
  FAKE_WALL:       26,   // Pass-through wall (cosmetic)
  SPEED_BOOST:     27,   // Grants speed boost
  BUMPER:          28,   // Bouncy bumper (pinball-style)
  GRAVITY_SWITCH:  29,   // Flips gravity direction
  GRAVITY_WELL_ALIAS: 30, // Alias used in some level grids (same as 60)
  WATER:           31,   // Water tile
  SLIME:           32,   // Wall-slide surface
  BOOMERANG:       33,   // Grants boomerang attack
  MIRROR_PORTAL:   34,   // Spawns shadow clone
  STALACTITE:      35,   // Falls when player is below

  // ── Wind Zones ────────────────────────────────────────
  WIND_UP:         36,
  WIND_DOWN:       37,
  WIND_LEFT:       38,
  WIND_RIGHT:      39,

  // ── Bouncy Mushroom & Powerups ─────────────────────────
  BOUNCY_MUSHROOM: 40,   // Super-bounce mushroom
  DASH_POWERUP:    41,   // Grants dash ability
  MAGNETIC_SURFACE:42,   // Magnetic ceiling/wall surface
  MAGNETIC_BOOTS:  43,   // Grants magnetic boots
  GRAPPLE_POWERUP: 44,   // Grants grappling hook
  STOPWATCH:       45,   // Freezes time briefly

  // ── Doors ──────────────────────────────────────────────
  DOOR_RED:        46,
  DOOR_BLUE:       47,
  DOOR_GREEN:      48,

  // ── Bombs & Destruction ───────────────────────────────
  BOMB_POWERUP:    49,   // Grants bomb ability
  CRACKED_BLOCK:   50,   // Destroyed by bomb explosion
  GHOST_SWITCH:    51,   // Starts ghost recording

  // ── Advanced Mechanics ─────────────────────────────────
  JUMP_THROUGH:    52,   // One-way platform (pass up, stand on top)
  CANNON:          53,   // Enters player into barrel cannon
  TURRET:          54,   // Auto-firing turret enemy
  ROPE:            55,   // Swingable rope anchor
  MINECART:        56,   // Rideable minecart
  RAMP_RIGHT:      57,   // Slope ascending to the right (/)
  RAMP_LEFT:       58,   // Slope ascending to the left (\)
  REFLECTOR:       59,   // Reflects projectiles and lasers
  GRAVITY_WELL:    60,   // Pulls nearby entities

  // ── Powerups (100+) ───────────────────────────────────
  DOUBLE_JUMP:    100,   // Grants double-jump ability
  SPEED_BOOST_PU: 101,   // (reserved, see 27)
  SPRING_BOOTS:   102,   // (reserved, see 16)
  JETPACK:        103,   // Grants jetpack
  SHRINK_POTION:  104,   // Shrinks the player
  PAINT_BLOCK:    105,   // Reveals invisible blocks when hit
  INVISIBLE_BLOCK:106,   // Invisible until revealed by paint
  REVEALED_BLOCK: 107,   // Formerly invisible, now solid & visible
};
