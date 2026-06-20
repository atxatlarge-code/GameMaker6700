import { CONFIG } from './config.js';
import { Level } from './level.js';
import { Editor } from './editor.js';
import { Engine } from './engine.js';
import { LevelManager } from './levels.js';
import { audio } from './audio.js';

// Asset loader helper
const assets = {
  ground: null,
  player: null,
  goal: null,
  trampoline: null,
  fire: null,
  spikes: null,
};

// On mobile, canvas pixel manipulation (getImageData) causes SecurityError/taint
// on iOS Safari and other browsers. Load images directly instead.
function loadImage(src, callback) {
  const img = new Image();
  img.onerror = () => callback(null);
  img.onload = () => {
    // Try white-bg removal, but fall back to raw image if canvas is tainted
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
            data[i + 3] = 0;
          } else if (data[i + 3] > 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      ctx.putImageData(imgData, 0, 0);

      let finalCanvas = canvas;
      if (maxX >= minX && maxY >= minY) {
        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;
        finalCanvas = document.createElement('canvas');
        finalCanvas.width = cropW;
        finalCanvas.height = cropH;
        const cropCtx = finalCanvas.getContext('2d');
        cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
      }

      const processedImg = new Image();
      processedImg.onload = () => callback(processedImg);
      processedImg.src = finalCanvas.toDataURL();
    } catch (e) {
      // Canvas tainted (SecurityError on mobile) — use raw image directly
      callback(img);
    }
  };
  // crossOrigin attribute helps avoid taint when served with CORS headers
  img.crossOrigin = 'anonymous';
  img.src = src;
}

window.addEventListener('DOMContentLoaded', () => {
  // Load assets
  loadImage('assets/ground.png', (img) => { if (img) assets.ground = img; });
  loadImage('assets/player.png', (img) => { if (img) assets.player = img; });
  loadImage('assets/goal.png', (img) => { if (img) assets.goal = img; });
  loadImage('assets/trampoline.png', (img) => { if (img) assets.trampoline = img; });
  loadImage('assets/spikes.png', (img) => { if (img) assets.spikes = img; });

  // Parse URL parameter for level ID
  const urlParams = new URLSearchParams(window.location.search);
  const levelId = urlParams.get('level') || 'preset-1';
  const targetLevelData = LevelManager.getLevel(levelId);

  // DOM Elements
  const gameCanvas = document.getElementById('game-canvas');
  const levelTitleEl = document.getElementById('mobile-level-title');
  const winOverlay = document.getElementById('win-overlay');
  const btnRestart = document.getElementById('btn-mobile-restart');
  const btnMusic = document.getElementById('btn-mobile-music');
  const btnWinRestart = document.getElementById('btn-win-restart');

  if (levelTitleEl && targetLevelData) {
    levelTitleEl.textContent = targetLevelData.name;
  }

  // Resize canvas to zoom in exactly 10 squares tall while keeping precise screen dimensions/proportions
  function resizeCanvas() {
    const wrapper = document.querySelector('.mobile-canvas-wrapper');
    if (!wrapper || wrapper.clientHeight === 0) return;
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    // Exactly 10 squares tall (10 * CONFIG.TILE_SIZE = 400px)
    gameCanvas.height = 10 * CONFIG.TILE_SIZE;
    gameCanvas.width = Math.round(gameCanvas.height * (w / h));
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Initialize Game Objects
  const level = new Level();
  level.load(targetLevelData);

  const editor = new Editor(gameCanvas, level, assets);
  const engine = new Engine(gameCanvas, level, editor, assets, () => {
    audio.playWinSound();
    winOverlay.classList.remove('hidden');
  });

  // Start directly in Play Mode
  engine.setMode(CONFIG.MODE_PLAY);
  engine.start();

  // HUD Button Listeners
  btnRestart.addEventListener('click', () => {
    winOverlay.classList.add('hidden');
    level.load(targetLevelData);
    engine.setMode(CONFIG.MODE_PLAY);
    btnRestart.blur();
  });

  btnWinRestart.addEventListener('click', () => {
    winOverlay.classList.add('hidden');
    const allLevels = LevelManager.getLevels();
    const currentIndex = allLevels.findIndex(l => l.id === targetLevelData.id);
    let nextIndex = currentIndex + 1;
    if (nextIndex >= allLevels.length) {
      nextIndex = 0;
    }
    targetLevelData = allLevels[nextIndex];
    level.load(targetLevelData);
    if (levelTitleEl && targetLevelData) {
      levelTitleEl.textContent = targetLevelData.name;
    }
    engine.setMode(CONFIG.MODE_PLAY);
  });

  // Music toggle
  audio.onStateChange = (isPlaying) => {
    if (btnMusic) {
      btnMusic.innerHTML = isPlaying ? '<i class="fa-solid fa-music"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';
      btnMusic.classList.toggle('playing', isPlaying);
    }
  };

  btnMusic.addEventListener('click', () => {
    audio.toggleMusic();
    btnMusic.blur();
  });

  // Mode Toggle (Play / Edit)
  const btnModeToggle = document.getElementById('btn-mobile-mode-toggle');
  const touchControlsOverlay = document.getElementById('touch-controls-overlay');

  if (btnModeToggle) {
    btnModeToggle.addEventListener('click', () => {
      if (engine.mode === CONFIG.MODE_PLAY) {
        engine.setMode(CONFIG.MODE_EDIT);
        btnModeToggle.innerHTML = '<i class="fa-solid fa-play"></i>';
        btnModeToggle.classList.add('edit-active');
        if (touchControlsOverlay) touchControlsOverlay.style.display = 'none';
      } else {
        engine.setMode(CONFIG.MODE_PLAY);
        btnModeToggle.innerHTML = '<i class="fa-solid fa-pen"></i>';
        btnModeToggle.classList.remove('edit-active');
        if (touchControlsOverlay) touchControlsOverlay.style.display = 'flex';
      }
      btnModeToggle.blur();
    });
  }

  // ==========================================
  // MULTI-TOUCH LAWSON SPHERES CONTROLLER
  // ==========================================
  const joystickSphere = document.getElementById('joystick-sphere');
  const joystickInner = document.getElementById('joystick-inner');
  const jumpSphere = document.getElementById('jump-sphere');

  let activeJoystickTouchId = null;
  let joystickBaseX = 0;

  function updateJoystickRect() {
    const rect = joystickSphere.getBoundingClientRect();
    joystickBaseX = rect.left + rect.width / 2;
  }

  function handleJoystickMove(clientX) {
    const dx = clientX - joystickBaseX;
    const maxDist = 38; // Max visual displacement of inner puck
    const clampedDx = Math.max(-maxDist, Math.min(maxDist, dx));
    
    if (joystickInner) {
      joystickInner.style.transform = `translateX(${clampedDx}px)`;
    }

    if (dx < -15) {
      engine.keys.left = true;
      engine.keys.right = false;
    } else if (dx > 15) {
      engine.keys.right = true;
      engine.keys.left = false;
    } else {
      engine.keys.left = false;
      engine.keys.right = false;
    }
  }

  joystickSphere.addEventListener('touchstart', (e) => {
    e.preventDefault();
    updateJoystickRect();
    if (activeJoystickTouchId === null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      activeJoystickTouchId = touch.identifier;
      handleJoystickMove(touch.clientX);
    }
  }, { passive: false });

  window.addEventListener('touchmove', (e) => {
    if (activeJoystickTouchId !== null) {
      for (let touch of e.changedTouches) {
        if (touch.identifier === activeJoystickTouchId) {
          handleJoystickMove(touch.clientX);
          break;
        }
      }
    }
  }, { passive: false });

  function endJoystickTouch(e) {
    if (activeJoystickTouchId !== null) {
      for (let touch of e.changedTouches) {
        if (touch.identifier === activeJoystickTouchId) {
          activeJoystickTouchId = null;
          if (joystickInner) {
            joystickInner.style.transform = 'translateX(0px)';
          }
          engine.keys.left = false;
          engine.keys.right = false;
          break;
        }
      }
    }
  }

  window.addEventListener('touchend', endJoystickTouch);
  window.addEventListener('touchcancel', endJoystickTouch);

  // Jump Button Touch Handler
  jumpSphere.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (engine.player && engine.player.isGrounded) {
      engine.player.vy = -CONFIG.JUMP_FORCE;
      engine.player.isGrounded = false;
      audio.playJumpSound();
    }
  }, { passive: false });
});
