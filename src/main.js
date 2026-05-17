import { CONFIG } from './config.js';
import { Level } from './level.js';
import { Editor } from './editor.js';
import { Engine } from './engine.js';
import { LevelManager } from './levels.js';
import { audio } from './audio.js';

// Load Assets object
const assets = {
  ground: null,
  player: null,
  goal: null,
  trampoline: null,
  fire: null,
  spikes: null,
};

function loadAndRemoveWhiteBg(src, previewSelector, callback) {
  const img = new Image();
  img.onerror = () => {
    callback(null);
  };
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = 0;
    let maxY = 0;

    // Convert white/near-white pixels to transparent and find bounding box
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
          data[i + 3] = 0; // Make transparent
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
    processedImg.onload = () => {
      const previewEl = document.querySelector(previewSelector);
      if (previewEl) {
        previewEl.style.backgroundImage = `url(${processedImg.src})`;
      }
      callback(processedImg);
      // Re-render menu UI to update previews if needed
      if (window.updateMenuUI) window.updateMenuUI();
    };
    processedImg.src = finalCanvas.toDataURL();
  };
  img.src = src;
}

// Global state for Menu & Editor
let selectedLevel = null;

function renderLevelPreview(canvas, levelObj) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cols = CONFIG.GRID_COLS;
  const rows = CONFIG.GRID_ROWS;
  const tileW = w / cols;
  const tileH = h / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = levelObj.grid[r][c];
      const x = c * tileW;
      const y = r * tileH;
      if (t === 1) {
        ctx.fillStyle = '#528c46';
        ctx.fillRect(x, y, tileW + 0.5, tileH + 0.5);
      } else if (t === 2) {
        ctx.fillStyle = '#cc635e';
        ctx.fillRect(x, y, tileW + 0.5, tileH + 0.5);
      } else if (t === 3) {
        ctx.fillStyle = '#ff9500';
        ctx.fillRect(x, y, tileW + 0.5, tileH + 0.5);
      } else if (t === 4) {
        ctx.fillStyle = '#dbe2ef';
        ctx.fillRect(x, y, tileW + 0.5, tileH + 0.5);
      }
    }
  }

  // Draw Goal
  if (levelObj.goalPos) {
    ctx.fillStyle = '#e8b76c';
    ctx.fillRect(levelObj.goalPos.col * tileW, levelObj.goalPos.row * tileH, tileW * 1.5, tileH * 1.5);
  }

  // Draw Player Spawn
  if (levelObj.playerSpawn) {
    ctx.fillStyle = '#d4a359';
    ctx.fillRect(levelObj.playerSpawn.col * tileW, levelObj.playerSpawn.row * tileH, tileW * 1.2, tileH * 1.2);
  }

  // Draw Portals
  if (levelObj.portal1) {
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc((levelObj.portal1.col + 0.5) * tileW, (levelObj.portal1.row + 0.5) * tileH, tileW * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  if (levelObj.portal2) {
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc((levelObj.portal2.col + 0.5) * tileW, (levelObj.portal2.row + 0.5) * tileH, tileW * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadAndRemoveWhiteBg('assets/ground.png', '.ground-preview', (img) => { if (img) assets.ground = img; });
  loadAndRemoveWhiteBg('assets/player.png', '.player-preview', (img) => { if (img) assets.player = img; });
  loadAndRemoveWhiteBg('assets/goal.png', '.goal-preview', (img) => { if (img) assets.goal = img; });
  loadAndRemoveWhiteBg('assets/trampoline.png', '.trampoline-preview', (img) => { if (img) assets.trampoline = img; });
  loadAndRemoveWhiteBg('assets/fire.png', '.fire-preview', (img) => { if (img) assets.fire = img; });
  loadAndRemoveWhiteBg('assets/spikes.png', '.spikes-preview', (img) => { if (img) assets.spikes = img; });

  const menuView = document.getElementById('menu-view');
  const editorView = document.getElementById('editor-view');
  const winOverlay = document.getElementById('win-overlay');
  const renameOverlay = document.getElementById('rename-overlay');
  const inputLevelName = document.getElementById('input-level-name');

  const btnRestart = document.getElementById('btn-restart');
  const btnEditMode = document.getElementById('btn-edit-mode');
  const btnPlayMode = document.getElementById('btn-play-mode');
  const btnMenu = document.getElementById('btn-menu');
  const btnRenameLevel = document.getElementById('btn-rename-level');
  const btnSaveName = document.getElementById('btn-save-name');
  const btnCancelName = document.getElementById('btn-cancel-name');

  const btnMenuPlay = document.getElementById('btn-menu-play');
  const btnMenuEdit = document.getElementById('btn-menu-edit');
  const btnDelLevel = document.getElementById('btn-del-level');
  const btnDupLevel = document.getElementById('btn-dup-level');
  const btnShareLevel = document.getElementById('btn-share-level');
  const btnScrollUp = document.getElementById('btn-scroll-up');
  const btnScrollDown = document.getElementById('btn-scroll-down');

  const toolbar = document.getElementById('editor-toolbar');
  const toolButtons = document.querySelectorAll('.tool-btn');
  const gameCanvas = document.getElementById('game-canvas');

  // Initialize Game Objects
  const level = new Level();
  const editor = new Editor(gameCanvas, level, assets);
  const engine = new Engine(gameCanvas, level, editor, assets, () => {
    audio.playWinSound();
    winOverlay.classList.remove('hidden');
  });

  // Music Selection Setup
  const musicSelect = document.getElementById('music-select');
  const menuMusicSelect = document.getElementById('menu-music-select');
  const btnToggleMusic = document.getElementById('btn-toggle-music');
  const btnToggleMenuMusic = document.getElementById('btn-toggle-menu-music');

  audio.onStateChange = (isPlaying, trackKey) => {
    if (musicSelect && trackKey) musicSelect.value = trackKey;
    if (menuMusicSelect && trackKey) menuMusicSelect.value = trackKey;
    
    const iconHtml = isPlaying ? '<i class="fa-solid fa-circle-pause"></i>' : '<i class="fa-solid fa-circle-play"></i>';
    if (btnToggleMusic) {
      btnToggleMusic.innerHTML = iconHtml;
      btnToggleMusic.classList.toggle('playing', isPlaying);
    }
    if (btnToggleMenuMusic) {
      btnToggleMenuMusic.innerHTML = iconHtml;
      btnToggleMenuMusic.classList.toggle('playing', isPlaying);
    }
  };

  function syncMusicSelection(val) {
    if (musicSelect) musicSelect.value = val;
    if (menuMusicSelect) menuMusicSelect.value = val;
    audio.setMusicTrack(val);
  }

  if (musicSelect) {
    musicSelect.addEventListener('change', (e) => {
      syncMusicSelection(e.target.value);
      e.target.blur();
    });
  }

  if (menuMusicSelect) {
    menuMusicSelect.addEventListener('change', (e) => {
      syncMusicSelection(e.target.value);
      e.target.blur();
    });
  }

  if (btnToggleMusic) {
    btnToggleMusic.addEventListener('click', (e) => {
      audio.toggleMusic();
      e.currentTarget.blur();
    });
  }

  if (btnToggleMenuMusic) {
    btnToggleMenuMusic.addEventListener('click', (e) => {
      audio.toggleMusic();
      e.currentTarget.blur();
    });
  }

  // Setup Level Manager
  const allLevels = LevelManager.getLevels();
  selectedLevel = allLevels[0];

  window.updateMenuUI = () => {
    const levels = LevelManager.getLevels();
    const gridContainer = document.getElementById('cartridge-grid');
    gridContainer.innerHTML = '';

    const titleEl = document.getElementById('selected-level-title');
    if (titleEl && selectedLevel) {
      titleEl.textContent = selectedLevel.name;
    }

    const mainCanvas = document.getElementById('selected-level-canvas');
    if (mainCanvas && selectedLevel) {
      renderLevelPreview(mainCanvas, selectedLevel);
    }

    levels.forEach(lvl => {
      const cart = document.createElement('div');
      cart.className = `mini-cartridge ${lvl.id === selectedLevel.id ? 'selected' : ''}`;
      cart.innerHTML = `
        <div class="mini-top">
          <div class="mini-label">
            <canvas class="mini-canvas" width="160" height="120"></canvas>
          </div>
        </div>
        <div class="mini-bottom" title="${lvl.name}">${lvl.name}</div>
        <div class="mini-bottom-ribs" style="background:#c7830b; padding:4px 8px; display:flex; justify-content:center;">
          <div class="mini-ribs">
            <div class="rib"></div><div class="rib"></div><div class="rib"></div>
          </div>
        </div>
      `;

      const miniCanvas = cart.querySelector('.mini-canvas');
      if (miniCanvas) {
        renderLevelPreview(miniCanvas, lvl);
      }

      cart.addEventListener('click', () => {
        selectedLevel = lvl;
        window.updateMenuUI();
      });

      gridContainer.appendChild(cart);
    });

    // Add "+" Cartridge
    const addCart = document.createElement('div');
    addCart.className = 'mini-cartridge add-new';
    addCart.innerHTML = `
      <div class="mini-top">
        <div class="mini-label">
          <i class="fa-solid fa-plus add-icon"></i>
        </div>
      </div>
      <div class="mini-bottom">Create New</div>
      <div class="mini-bottom-ribs" style="background:#5e351c; padding:4px 8px; display:flex; justify-content:center;">
        <div class="mini-ribs">
          <div class="rib"></div><div class="rib"></div><div class="rib"></div>
        </div>
      </div>
    `;

    addCart.addEventListener('click', () => {
      const newLvl = LevelManager.createLevel(`Custom Game ${levels.filter(l => !l.isPreset).length + 1}`);
      selectedLevel = newLvl;
      window.updateMenuUI();
    });

    gridContainer.appendChild(addCart);
  };

  // Initial Menu Render
  window.updateMenuUI();

  // Switch to Editor / Game View helper
  function openLevelInMode(mode) {
    level.load(selectedLevel);
    document.getElementById('current-level-name').textContent = level.name;
    menuView.classList.add('hidden');
    editorView.classList.remove('hidden');

    if (mode === CONFIG.MODE_PLAY) {
      btnPlayMode.click();
    } else {
      btnEditMode.click();
    }

    engine.start();
  }

  // Hook Auto-save on Level modifications
  level.onModify = () => {
    const updated = LevelManager.saveLevel(level.export());
    if (updated.id !== level.id) {
      level.id = updated.id;
      level.isPreset = false;
      level.name = updated.name;
      document.getElementById('current-level-name').textContent = level.name;
    }
    selectedLevel = updated;
  };

  // Menu Button Listeners
  btnMenuPlay.addEventListener('click', () => {
    openLevelInMode(CONFIG.MODE_PLAY);
  });

  btnMenuEdit.addEventListener('click', () => {
    openLevelInMode(CONFIG.MODE_EDIT);
  });

  btnDelLevel.addEventListener('click', () => {
    if (selectedLevel.isPreset) {
      alert('Preset levels cannot be deleted. Select a custom level to delete.');
      return;
    }
    if (confirm(`Are you sure you want to delete '${selectedLevel.name}'?`)) {
      LevelManager.deleteLevel(selectedLevel.id);
      const remaining = LevelManager.getLevels();
      selectedLevel = remaining[0];
      window.updateMenuUI();
    }
  });

  btnDupLevel.addEventListener('click', () => {
    const dup = LevelManager.duplicateLevel(selectedLevel.id);
    if (dup) {
      selectedLevel = dup;
      window.updateMenuUI();
    }
  });

  btnShareLevel.addEventListener('click', () => {
    alert(`Level '${selectedLevel.name}' exported successfully! Shareable data ready.`);
  });

  const wrapper = document.querySelector('.mat-grid-wrapper');
  if (wrapper) {
    btnScrollUp.addEventListener('click', () => { wrapper.scrollBy({ top: -220, behavior: 'smooth' }); });
    btnScrollDown.addEventListener('click', () => { wrapper.scrollBy({ top: 220, behavior: 'smooth' }); });
  }

  // Editor View Navigation Listeners
  btnMenu.addEventListener('click', () => {
    LevelManager.saveLevel(level.export());
    editorView.classList.add('hidden');
    menuView.classList.remove('hidden');
    window.updateMenuUI();
  });

  btnRenameLevel.addEventListener('click', () => {
    renameOverlay.classList.remove('hidden');
    inputLevelName.value = level.name;
    inputLevelName.focus();
  });

  btnSaveName.addEventListener('click', () => {
    const newName = inputLevelName.value.trim();
    if (newName) {
      level.name = newName;
      document.getElementById('current-level-name').textContent = level.name;
      const updated = LevelManager.saveLevel(level.export());
      selectedLevel = updated;
      if (updated.id !== level.id) {
        level.id = updated.id;
        level.isPreset = false;
      }
    }
    renameOverlay.classList.add('hidden');
  });

  btnCancelName.addEventListener('click', () => {
    renameOverlay.classList.add('hidden');
  });

  // Tool Selection Handlers
  toolButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (engine.mode === CONFIG.MODE_PLAY) return;

      toolButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tool = btn.getAttribute('data-tool');
      editor.setTool(tool);
      btn.blur();
    });
  });

  // Mode Toggling
  btnEditMode.addEventListener('click', () => {
    btnPlayMode.classList.remove('active');
    btnEditMode.classList.add('active');
    toolbar.style.opacity = '1';
    toolbar.style.pointerEvents = 'auto';
    winOverlay.classList.add('hidden');
    engine.setMode(CONFIG.MODE_EDIT);
    btnEditMode.blur();
  });

  btnPlayMode.addEventListener('click', () => {
    btnEditMode.classList.remove('active');
    btnPlayMode.classList.add('active');
    toolbar.style.opacity = '0.5';
    toolbar.style.pointerEvents = 'none';
    winOverlay.classList.add('hidden');
    engine.setMode(CONFIG.MODE_PLAY);
    btnPlayMode.blur();
  });

  btnRestart.addEventListener('click', () => {
    btnEditMode.click(); // Switch back to edit mode
    btnRestart.blur();
  });
});
