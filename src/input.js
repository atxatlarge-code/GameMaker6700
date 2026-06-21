import { CONFIG } from './config.js';
import { audio } from './audio.js';

export class InputManager {
  constructor(engine) {
    this.engine = engine;
    this.keys = { left: false, right: false, up: false, down: false };
    this.panKeys = { left: false, right: false, up: false, down: false };
    this.prevGamepadState = { left: false, right: false, down: false, jump: false, dash: false, grapple: false, bomb: false };
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      if (this.engine.mode === CONFIG.MODE_EDIT) {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.panKeys.up = true;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') this.panKeys.down = true;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.panKeys.left = true;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') this.panKeys.right = true;
        return;
      }
      if (this.engine.mode !== CONFIG.MODE_PLAY || (this.engine.hasWon && window.transitionStyle !== 'none')) return;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = true;
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
        case 'Space':
          this.keys.up = true;
          this.engine.player.jumpBufferTimer = CONFIG.JUMP_BUFFER;
          if (this.engine.player.hasGrapple && this.engine.player.grappleHook && this.engine.player.grappleHook.attached) {
            this.engine.player.grappleHook = null;
          }
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          if (this.engine.player.hasDash && this.engine.player.dashAvailable && !this.engine.player.isDashing && !this.engine.isDead) {
            this.engine.player.isDashing = true;
            this.engine.player.dashTimer = 15; // 15 frames dash
            this.engine.player.dashAvailable = false;
            this.engine.player.vy = 0;
            if (this.engine.player.facing === 'left') {
              this.engine.player.vx = -12;
            } else {
              this.engine.player.vx = 12;
            }
            if (!this.engine.isSimulation && audio.playPowerupSound) audio.playPowerupSound();
          }
          this.engine.throwBoomerang();
          break;
        case 'KeyE':
          if (this.engine.player.hasGrapple && !this.engine.isDead && !this.engine.hasWon) {
            if (this.engine.player.grappleHook && this.engine.player.grappleHook.attached) {
              this.engine.player.grappleHook = null;
            } else if (!this.engine.player.grappleHook) {
              this.engine.fireGrapple();
            }
          }
          break;
        case 'KeyB':
          this.engine.dropBomb();
          break;
        case 'KeyF':
          this.engine.throwBoomerang();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return;
      }
      if (this.engine.mode === CONFIG.MODE_EDIT) {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.panKeys.up = false;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') this.panKeys.down = false;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.panKeys.left = false;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') this.panKeys.right = false;
        return;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        this.keys.up = false;
      }
    });

    const panBtns = document.querySelectorAll('.pan-btn');
    panBtns.forEach((btn) => {
      btn.addEventListener('mousedown', () => {
        const dir = btn.getAttribute('data-dir');
        if (dir) this.panKeys[dir] = true;
      });
      btn.addEventListener('mouseup', () => {
        const dir = btn.getAttribute('data-dir');
        if (dir) this.panKeys[dir] = false;
      });
      btn.addEventListener('mouseleave', () => {
        const dir = btn.getAttribute('data-dir');
        if (dir) this.panKeys[dir] = false;
      });
    });
  }

  pollGamepad() {
    if (this.engine.mode !== CONFIG.MODE_PLAY || (this.engine.hasWon && window.transitionStyle !== 'none')) return;
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp = null;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        gp = gamepads[i];
        break;
      }
    }
    if (!gp) return;

    const left = gp.axes[0] < -0.3 || gp.buttons[14].pressed;
    const right = gp.axes[0] > 0.3 || gp.buttons[15].pressed;
    const down = gp.axes[1] > 0.3 || gp.buttons[13].pressed;
    const jump = gp.buttons[0].pressed;
    const dash = gp.buttons[2].pressed;
    const grapple = gp.buttons[3].pressed || gp.buttons[7].pressed;
    const bomb = gp.buttons[1].pressed || gp.buttons[6].pressed;

    this.keys.left = left;
    this.keys.right = right;
    this.keys.down = down;

    if (jump && !this.prevGamepadState.jump) {
      this.engine.player.jumpBufferTimer = CONFIG.JUMP_BUFFER;
      if (this.engine.player.hasGrapple && this.engine.player.grappleHook && this.engine.player.grappleHook.attached) {
        this.engine.player.grappleHook = null;
      }
    }
    
    if (dash && !this.prevGamepadState.dash) {
      if (this.engine.player.hasDash && this.engine.player.dashAvailable && !this.engine.player.isDashing && !this.engine.isDead) {
        this.engine.player.isDashing = true;
        this.engine.player.dashTimer = 15;
        this.engine.player.dashAvailable = false;
        this.engine.player.vy = 0;
        if (this.engine.player.facing === 'left') {
          this.engine.player.vx = -12;
        } else {
          this.engine.player.vx = 12;
        }
        if (!this.engine.isSimulation && audio.playPowerupSound) audio.playPowerupSound();
      }
      this.engine.throwBoomerang();
    }
    
    if (grapple && !this.prevGamepadState.grapple) {
      if (this.engine.player.hasGrapple && !this.engine.isDead && !this.engine.hasWon) {
        if (this.engine.player.grappleHook && this.engine.player.grappleHook.attached) {
          this.engine.player.grappleHook = null;
        } else if (!this.engine.player.grappleHook) {
          this.engine.fireGrapple();
        }
      }
    }
    
    if (bomb && !this.prevGamepadState.bomb) {
      this.engine.dropBomb();
    }

    if (!jump && this.prevGamepadState.jump) {
      this.keys.up = false;
    } else if (jump) {
      this.keys.up = true;
    }

    this.prevGamepadState = { left, right, down, jump, dash, grapple, bomb };
  }
}
