import { CONFIG } from '../config.js';
import { TILE } from '../tiles.js';
import { audio } from '../audio.js';

export class HazardSystem {
  constructor(engine) {
    this.engine = engine;
  }

  checkHazards() {
    if (this.engine.isDead || this.engine.hasWon) return;

    const inset = 6;
    const hazardBox = {
      left: this.engine.player.x + inset,
      right: this.engine.player.x + this.engine.player.width - inset,
      top: this.engine.player.y + inset,
      bottom: this.engine.player.y + this.engine.player.height - inset,
    };

    const minCol = Math.max(0, Math.floor(hazardBox.left / CONFIG.TILE_SIZE));
    const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((hazardBox.right - 0.01) / CONFIG.TILE_SIZE));
    const minRow = Math.max(0, Math.floor(hazardBox.top / CONFIG.TILE_SIZE));
    const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((hazardBox.bottom - 0.01) / CONFIG.TILE_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const tileVal = this.engine.getTile(c, r);
        if (tileVal === TILE.FIRE || tileVal === TILE.SPIKES) {
          this.engine.killPlayer();
          return;
        }
      }
    }
  }

  checkTripwires() {
    if (this.engine.isDead || this.engine.hasWon) return;

    const box = {
      left: this.engine.player.x,
      right: this.engine.player.x + this.engine.player.width,
      top: this.engine.player.y,
      bottom: this.engine.player.y + this.engine.player.height,
    };

    const minCol = Math.max(0, Math.floor(box.left / CONFIG.TILE_SIZE));
    const maxCol = Math.min(CONFIG.GRID_COLS - 1, Math.floor((box.right - 0.01) / CONFIG.TILE_SIZE));
    const minRow = Math.max(0, Math.floor(box.top / CONFIG.TILE_SIZE));
    const maxRow = Math.min(CONFIG.GRID_ROWS - 1, Math.floor((box.bottom - 0.01) / CONFIG.TILE_SIZE));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (this.engine.getTile(c, r) === TILE.TRIPWIRE) {
          if (!this.engine.switchCooldown) {
            this.engine.level.switchState = this.engine.level.switchState === 'red' ? 'blue' : 'red';
            this.engine.switchCooldown = 30;
            if (!this.engine.isSimulation && audio.playTileSound) audio.playTileSound();
          }
        }
      }
    }
  }

  checkPortals() {
    if (this.engine.isDead || this.engine.hasWon) return;
    if (!this.engine.level.portal1 || !this.engine.level.portal2) return;

    const playerBox = {
      left: this.engine.player.x,
      right: this.engine.player.x + this.engine.player.width,
      top: this.engine.player.y,
      bottom: this.engine.player.y + this.engine.player.height,
    };

    const p1Box = {
      left: this.engine.level.portal1.col * CONFIG.TILE_SIZE,
      right: this.engine.level.portal1.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
      top: this.engine.level.portal1.row * CONFIG.TILE_SIZE,
      bottom: this.engine.level.portal1.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
    };

    const p2Box = {
      left: this.engine.level.portal2.col * CONFIG.TILE_SIZE,
      right: this.engine.level.portal2.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
      top: this.engine.level.portal2.row * CONFIG.TILE_SIZE,
      bottom: this.engine.level.portal2.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
    };

    const isOverlapping1 = !(
      playerBox.right < p1Box.left ||
      playerBox.left > p1Box.right ||
      playerBox.bottom < p1Box.top ||
      playerBox.top > p1Box.bottom
    );

    const isOverlapping2 = !(
      playerBox.right < p2Box.left ||
      playerBox.left > p2Box.right ||
      playerBox.bottom < p2Box.top ||
      playerBox.top > p2Box.bottom
    );

    // If the player isn't touching any portals, clear the exclusion memory
    if (!isOverlapping1 && !isOverlapping2) {
      this.engine.lastPortalExited = null;
    }

    if (this.engine.portalCooldown > 0) return;

    if (isOverlapping1 && this.engine.lastPortalExited !== 1) {
      this.engine.lastPortalExited = 2; // Prevent immediately teleporting back from portal 2
      this.engine.teleportPlayer(this.engine.level.portal1, this.engine.level.portal2, '#06b6d4', '#ec4899');
    } else if (isOverlapping2 && this.engine.lastPortalExited !== TILE.TRAMPOLINE) {
      this.engine.lastPortalExited = 1; // Prevent immediately teleporting back from portal 1
      this.engine.teleportPlayer(this.engine.level.portal2, this.engine.level.portal1, '#ec4899', '#06b6d4');
    }
  }

  checkDoors() {
    if (this.engine.isDead || this.engine.hasWon || this.engine.portalCooldown > 0) return;

    // Player bounding box
    const playerBox = {
      left: this.engine.player.x,
      right: this.engine.player.x + this.engine.player.width,
      top: this.engine.player.y,
      bottom: this.engine.player.y + this.engine.player.height,
    };

    // Find all doors in the level
    const doors = [];
    for (let row = 0; row < CONFIG.GRID_ROWS; row++) {
      for (let col = 0; col < CONFIG.GRID_COLS; col++) {
        const tileVal = this.engine.level.grid[row][col];
        if (tileVal >= TILE.DOOR_RED && tileVal <= TILE.DOOR_GREEN) {
          doors.push({ col, row, type: tileVal });
        }
      }
    }

    // Check collision with any door
    let overlappingDoor = null;
    for (const door of doors) {
      const doorBox = {
        left: door.col * CONFIG.TILE_SIZE,
        right: door.col * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
        top: door.row * CONFIG.TILE_SIZE,
        bottom: door.row * CONFIG.TILE_SIZE + CONFIG.TILE_SIZE,
      };

      if (!(
        playerBox.right < doorBox.left ||
        playerBox.left > doorBox.right ||
        playerBox.bottom < doorBox.top ||
        playerBox.top > doorBox.bottom
      )) {
        overlappingDoor = door;
        break;
      }
    }

    if (!overlappingDoor) {
      this.engine.lastDoorExited = null;
      return;
    }

    // If we're already overlapping a door we just exited, ignore it
    if (this.engine.lastDoorExited && this.engine.lastDoorExited.col === overlappingDoor.col && this.engine.lastDoorExited.row === overlappingDoor.row) {
      return;
    }

    // Find the matching door of the same type
    const matchingDoor = doors.find(d => d.type === overlappingDoor.type && (d.col !== overlappingDoor.col || d.row !== overlappingDoor.row));
    
    if (matchingDoor) {
      this.engine.lastDoorExited = { col: matchingDoor.col, row: matchingDoor.row };
      
      let color = '#ef4444';
      if (overlappingDoor.type === TILE.DOOR_BLUE) color = '#3b82f6';
      else if (overlappingDoor.type === TILE.DOOR_GREEN) color = '#22c55e';
      
      this.engine.teleportPlayer(overlappingDoor, matchingDoor, color, color);
    }
  }

}
