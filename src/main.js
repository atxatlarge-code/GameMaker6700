import { CONFIG } from './config.js';
import { Level } from './level.js';
import { Editor } from './editor.js';
import { Engine } from './engine.js';
import { LevelManager } from './levels.js';
import { audio } from './audio.js';
import { messageService } from './messages.js';
import { solveLevel, AsyncPathfinder } from './pathfinder.js';

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
    // Try pixel-level white-bg removal; fall back to raw image if canvas is tainted
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
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
    } catch (e) {
      // Canvas tainted (SecurityError) — use raw image directly
      const previewEl = document.querySelector(previewSelector);
      if (previewEl) {
        previewEl.style.backgroundImage = `url(${img.src})`;
      }
      callback(img);
      if (window.updateMenuUI) window.updateMenuUI();
    }
  };
  // crossOrigin helps avoid canvas taint when served with proper CORS headers
  img.crossOrigin = 'anonymous';
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
      } else if (t === 5) {
        ctx.fillStyle = '#ffd60a';
        ctx.beginPath();
        ctx.arc((c + 0.5) * tileW, (r + 0.5) * tileH, tileW * 0.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (t === 6) {
        ctx.fillStyle = '#8c6239'; // Brown brick color
        ctx.fillRect(x, y, tileW + 0.5, tileH + 0.5);
      } else if (t === 7) {
        // Draw mini grass/earth block: bottom 70% brown, top 30% green
        ctx.fillStyle = '#8c6239'; // Earth brown
        ctx.fillRect(x, y, tileW + 0.5, tileH + 0.5);
        ctx.fillStyle = '#528c46'; // Grass green
        ctx.fillRect(x, y, tileW + 0.5, (tileH * 0.3) + 0.5);
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
  loadAndRemoveWhiteBg('assets/ground.png', '.ground-preview', (img) => {
    if (img) {
      assets.ground = img;
      const wallImg = document.getElementById('img-tool-wall');
      if (wallImg) wallImg.src = img.src;
      const groupImg = document.getElementById('img-group-blocks');
      if (groupImg && groupImg.src.includes('ground.png')) groupImg.src = img.src;
    }
  });
  loadAndRemoveWhiteBg('assets/player.png', '.player-preview', (img) => {
    if (img) {
      assets.player = img;
      const playerImg = document.getElementById('img-tool-player');
      if (playerImg) playerImg.src = img.src;
      const groupImg = document.getElementById('img-group-player');
      if (groupImg && groupImg.src.includes('player.png')) groupImg.src = img.src;
    }
  });
  loadAndRemoveWhiteBg('assets/goal.png', '.goal-preview', (img) => {
    if (img) {
      assets.goal = img;
      const goalImg = document.getElementById('img-tool-goal');
      if (goalImg) goalImg.src = img.src;
      const groupImg = document.getElementById('img-group-special');
      if (groupImg && groupImg.src.includes('goal.png')) groupImg.src = img.src;
    }
  });
  loadAndRemoveWhiteBg('assets/trampoline.png', '.trampoline-preview', (img) => {
    if (img) {
      assets.trampoline = img;
      const trampImg = document.getElementById('img-tool-trampoline');
      if (trampImg) trampImg.src = img.src;
      const groupImg = document.getElementById('img-group-special');
      if (groupImg && groupImg.src.includes('trampoline.png')) groupImg.src = img.src;
    }
  });
  loadAndRemoveWhiteBg('assets/spikes.png', '.spikes-preview', (img) => {
    if (img) {
      assets.spikes = img;
      const spikesImg = document.getElementById('img-tool-spikes');
      if (spikesImg) spikesImg.src = img.src;
    }
  });

  const menuView = document.getElementById('menu-view');
  const editorView = document.getElementById('editor-view');
  const winOverlay = document.getElementById('win-overlay');
  const renameOverlay = document.getElementById('rename-overlay');
  const inputLevelName = document.getElementById('input-level-name');

  const btnRestart = document.getElementById('btn-restart');
  const btnEditMode = document.getElementById('btn-edit-mode');
  const btnPlayMode = document.getElementById('btn-play-mode');
  const btnSolveMode = document.getElementById('btn-solve-mode');
  const btnMenu = document.getElementById('btn-menu');
  const btnRenameLevel = document.getElementById('btn-rename-level');
  const btnSaveName = document.getElementById('btn-save-name');
  const btnCancelName = document.getElementById('btn-cancel-name');

  const btnMenuPlay = document.getElementById('btn-menu-play');
  const btnMenuEdit = document.getElementById('btn-menu-edit');
  const btnDelLevel = document.getElementById('btn-del-level');
  const btnDupLevel = document.getElementById('btn-dup-level');
  const btnShareLevel = document.getElementById('btn-share-level');
  const btnMobileArcade = document.getElementById('btn-mobile-arcade');
  const btnMobileEditor = document.getElementById('btn-mobile-editor');
  const btnScrollUp = document.getElementById('btn-scroll-up');
  const btnScrollDown = document.getElementById('btn-scroll-down');

  const toolbar = document.getElementById('action-bar-container') || document.getElementById('editor-toolbar');
  const toolButtons = document.querySelectorAll('.tool-btn');
  const gameCanvas = document.getElementById('game-canvas');

  // Initialize Game Objects
  const level = new Level();
  const editor = new Editor(gameCanvas, level, assets);
  const engine = new Engine(gameCanvas, level, editor, assets, () => {
    audio.playWinSound();
    winOverlay.classList.remove('hidden');
  });
  window.engine = engine;

  // Music Selection Setup
  const musicSelect = document.getElementById('music-select');
  const btnToggleMusic = document.getElementById('btn-toggle-music');

  audio.onStateChange = (isPlaying, trackKey) => {
    if (musicSelect && trackKey) musicSelect.value = trackKey;
    
    const iconHtml = isPlaying ? '<i class="fa-solid fa-circle-pause"></i>' : '<i class="fa-solid fa-circle-play"></i>';
    if (btnToggleMusic) {
      btnToggleMusic.innerHTML = iconHtml;
      btnToggleMusic.classList.toggle('playing', isPlaying);
    }
  };

  function syncMusicSelection(val) {
    if (musicSelect) musicSelect.value = val;
    audio.setMusicTrack(val);
  }

  if (musicSelect) {
    musicSelect.addEventListener('change', (e) => {
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

  if (btnMobileArcade) {
    btnMobileArcade.addEventListener('click', () => {
      window.location.href = `mobile.html?level=${selectedLevel.id}`;
    });
  }

  if (btnMobileEditor) {
    btnMobileEditor.addEventListener('click', () => {
      window.location.href = `mobile.html?level=${level.id || selectedLevel.id}`;
    });
  }

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

  // Toast Alert Helper
  const toastContainer = document.getElementById('toast-container');
  const toastMessage = document.getElementById('toast-message');
  let toastTimeout = null;

  function showToast(msg) {
    if (!toastContainer || !toastMessage) return;
    toastMessage.innerText = msg;
    toastContainer.classList.remove('hidden');
    toastContainer.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastContainer.classList.remove('show');
      setTimeout(() => toastContainer.classList.add('hidden'), 300);
    }, 2000);
  }

  // Action Bar Group Popup Toggles
  const actionGroups = document.querySelectorAll('.action-group');
  const actionGroupButtons = document.querySelectorAll('.action-group-btn');

  actionGroupButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (engine.mode === CONFIG.MODE_PLAY) return;
      e.stopPropagation();

      const group = btn.closest('.action-group');
      if (!group) return;
      const isAlreadyOpen = group.classList.contains('open');

      // Close all open popups
      actionGroups.forEach(g => g.classList.remove('open'));

      // If it has a popup and wasn't already open, open it
      const popup = group.querySelector('.group-popup');
      if (popup && !isAlreadyOpen) {
        group.classList.add('open');
      }

      // If this button is Erase standalone, handle it
      if (btn.classList.contains('erase-action')) {
        actionGroupButtons.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.popup-item-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        editor.setTool('erase');
      }
    });
  });

  // Close dropups when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.action-group')) {
      actionGroups.forEach(g => g.classList.remove('open'));
    }
  });

  // Tool Popup Items Selection Handlers
  toolButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (engine.mode === CONFIG.MODE_PLAY) return;
      e.stopPropagation();

      const tool = btn.getAttribute('data-tool');
      if (!tool) return;

      // Update active states for item buttons
      document.querySelectorAll('.popup-item-btn, .action-group-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Update active states for group buttons
      const parentGroup = btn.closest('.action-group');
      if (parentGroup) {
        const groupBtn = parentGroup.querySelector('.action-group-btn');
        if (groupBtn) {
          groupBtn.classList.add('active');
          // If this is blocks, player, special, or barriers, dynamically update its icon to match the selected item
          if (parentGroup.id === 'group-blocks' || parentGroup.id === 'group-player' || parentGroup.id === 'group-special' || parentGroup.id === 'group-barriers') {
            const innerImgOrSvg = btn.querySelector('.tool-icon-img, .tool-icon-svg');
            if (innerImgOrSvg) {
              const clone = innerImgOrSvg.cloneNode(true);
              if (clone.classList.contains('tool-icon-img')) {
                clone.style.width = '40px';
                clone.style.height = '40px';
              } else if (clone.classList.contains('tool-icon-svg')) {
                clone.style.width = '40px';
                clone.style.height = '40px';
              }
              groupBtn.innerHTML = '';
              groupBtn.appendChild(clone);
            }
          }
        }
      }

      actionGroups.forEach(g => g.classList.remove('open'));
      editor.setTool(tool);
      btn.blur();
    });
  });

  // "Coming Soon" Buttons Handler
  const soonButtons = document.querySelectorAll('.popup-item-btn.soon');
  soonButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (engine.mode === CONFIG.MODE_PLAY) return;
      e.stopPropagation();
      const name = btn.getAttribute('data-name') || 'Item';
      showToast(`${name} is coming soon!`);
      actionGroups.forEach(g => g.classList.remove('open'));
    });
  });

  // Theme Switching Buttons
  const themeButtons = document.querySelectorAll('.theme-btn');

  themeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (engine.mode === CONFIG.MODE_PLAY) return;
      e.stopPropagation();

      const theme = btn.getAttribute('data-theme') || 'default';
      themeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (editorView) {
        // Remove existing theme classes
        editorView.classList.forEach(cls => {
          if (cls.startsWith('theme-')) editorView.classList.remove(cls);
        });
        editorView.classList.add(`theme-${theme}`);
      }
      engine.setTheme(theme);
      actionGroups.forEach(g => g.classList.remove('open'));
    });
  });

  // Undo Action Button
  const btnUndoAction = document.getElementById('btn-undo-action');
  if (btnUndoAction) {
    btnUndoAction.addEventListener('click', (e) => {
      if (engine.mode === CONFIG.MODE_PLAY) return;
      e.stopPropagation();

      if (level.undo()) {
        audio.playTileSound();
      } else {
        showToast('Nothing to undo!');
      }
      actionGroups.forEach(g => g.classList.remove('open'));
    });
  }

  // Mode Toggling
  btnEditMode.addEventListener('click', () => {
    btnPlayMode.classList.remove('active');
    btnSolveMode.classList.remove('active');
    btnEditMode.classList.add('active');
    toolbar.style.opacity = '1';
    toolbar.style.pointerEvents = 'auto';
    winOverlay.classList.add('hidden');
    engine.isAutoplay = false;
    engine.setMode(CONFIG.MODE_EDIT);
    btnEditMode.blur();
  });

  btnPlayMode.addEventListener('click', () => {
    btnEditMode.classList.remove('active');
    btnSolveMode.classList.remove('active');
    btnPlayMode.classList.add('active');
    toolbar.style.opacity = '0.5';
    toolbar.style.pointerEvents = 'none';
    winOverlay.classList.add('hidden');
    engine.isAutoplay = false;
    engine.setMode(CONFIG.MODE_PLAY);
    btnPlayMode.blur();
  });

  const pathfinderOverlay = document.getElementById('pathfinder-overlay');
  const pathfinderTitle = document.getElementById('pathfinder-title');
  const pathfinderStatus = document.getElementById('pathfinder-status');
  const solverProgressBar = document.getElementById('solver-progress-bar');
  const solverStats = document.getElementById('solver-stats');
  const btnCancelSolve = document.getElementById('btn-cancel-solve');
  const btnProceedSolve = document.getElementById('btn-proceed-solve');

  let isSolveCancelled = false;
  let currentAutoplayPath = null;

  btnCancelSolve.addEventListener('click', () => {
    isSolveCancelled = true;
    pathfinderOverlay.classList.add('hidden');
    engine.onPostRender = null;
    btnSolveMode.style.pointerEvents = 'auto';
    btnSolveMode.innerHTML = '<i class="fa-solid fa-robot"></i> Solve';
    btnProceedSolve.classList.add('hidden');
    currentAutoplayPath = null;
  });

  btnProceedSolve.addEventListener('click', () => {
    if (!currentAutoplayPath) return;

    // Hide overlay and clean up renderer
    pathfinderOverlay.classList.add('hidden');
    engine.onPostRender = null;

    // Set engine autoplay properties
    engine.isAutoplay = true;
    engine.autoplayPath = currentAutoplayPath;
    engine.autoplayIndex = 0;
    engine.autoplayFrameCount = 0;

    // Update UI buttons and toggle mode
    btnEditMode.classList.remove('active');
    btnPlayMode.classList.remove('active');
    btnSolveMode.classList.add('active');

    toolbar.style.opacity = '0.5';
    toolbar.style.pointerEvents = 'none';
    winOverlay.classList.add('hidden');

    engine.setMode(CONFIG.MODE_PLAY);
    engine.resetPlayer();
    engine.hasWon = false;

    // Reset Solve button UI
    btnSolveMode.innerHTML = '<i class="fa-solid fa-robot"></i> Solve';
    btnSolveMode.style.pointerEvents = 'auto';
    btnSolveMode.blur();

    // Clean up
    btnProceedSolve.classList.add('hidden');
    currentAutoplayPath = null;
  });

  btnSolveMode.addEventListener('click', () => {
    // Reset player position so they start from the spawn point visually and simulation-wise
    engine.resetPlayer();

    // Reset solve cancellation state
    isSolveCancelled = false;

    btnCancelSolve.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancel';
    btnProceedSolve.classList.add('hidden');
    currentAutoplayPath = null;

    // Get original HTML for solve button
    const originalHTML = btnSolveMode.innerHTML;
    btnSolveMode.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Solving...';
    btnSolveMode.style.pointerEvents = 'none';

    // Show pathfinder overlay UI
    pathfinderOverlay.classList.remove('hidden');
    if (pathfinderTitle) pathfinderTitle.textContent = 'Finding Pathway...';
    pathfinderStatus.innerHTML = 'Consulting the forest spirits...';
    pathfinderStatus.style.display = 'block';
    if (solverProgressBar) {
      solverProgressBar.style.width = '0%';
      solverProgressBar.style.background = 'linear-gradient(90deg, #6ba462, #4a7c59)';
    }
    solverStats.innerHTML = 'Paths explored: 0';

    // Instantiate Async Pathfinder
    const solver = new AsyncPathfinder(engine);

    // Register real-time search tree drawing hook (Warm golden firefly particles)
    engine.onPostRender = (ctx) => {
      ctx.fillStyle = 'rgba(212, 163, 89, 0.25)';
      for (const pt of solver.exploredPoints) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Run the step loop using requestAnimationFrame
    const runSolveStep = () => {
      if (isSolveCancelled) {
        solver.cleanup();
        btnSolveMode.innerHTML = originalHTML;
        btnSolveMode.style.pointerEvents = 'auto';
        return;
      }

      // Step the solver 350 iterations per frame
      const stepRes = solver.step(350);

      // Update progress UI
      const progress = Math.min(100, (solver.iterations / solver.maxIterations) * 100);
      if (solverProgressBar) solverProgressBar.style.width = `${progress}%`;
      solverStats.innerHTML = `Paths explored: ${solver.iterations}`;
      pathfinderStatus.innerHTML = 'Following the path of the wind...';

      if (stepRes.done) {
        if (stepRes.success) {
          // Success! Confirmed path found
          if (pathfinderTitle) pathfinderTitle.textContent = 'Pathway Confirmed';
          pathfinderStatus.innerHTML = '';
          pathfinderStatus.style.display = 'none';
          if (solverProgressBar) {
            solverProgressBar.style.width = '100%';
            solverProgressBar.style.background = '#4a7c59';
          }

          // Trace winning path coordinates for glowing visualization
          const winningPathPoints = solver.getWinningPathPoints();

          // Update drawing hook to display the winning glowing golden thread on top of the search cloud
          engine.onPostRender = (ctx) => {
            // 1. Draw cloud
            ctx.fillStyle = 'rgba(212, 163, 89, 0.12)';
            for (const pt of solver.exploredPoints) {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
              ctx.fill();
            }

            // 2. Draw winning path (Glowing golden thread)
            ctx.strokeStyle = 'rgba(212, 163, 89, 0.95)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = 'rgba(212, 163, 89, 0.8)';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(winningPathPoints[0].x, winningPathPoints[0].y);
            for (let i = 1; i < winningPathPoints.length; i++) {
              ctx.lineTo(winningPathPoints[i].x, winningPathPoints[i].y);
            }
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow effects
          };

          // Save path and display Proceed button
          currentAutoplayPath = stepRes.solution;
          btnProceedSolve.classList.remove('hidden');
          btnCancelSolve.innerHTML = '<i class="fa-solid fa-xmark"></i> Close';

          // Reset Solve button UI state (while keeping modal open with the path shown)
          btnSolveMode.innerHTML = '<i class="fa-solid fa-robot"></i> Solve';
          btnSolveMode.style.pointerEvents = 'auto';

        } else {
          // No solution found
          if (pathfinderTitle) pathfinderTitle.textContent = 'Pathway Blocked';
          pathfinderStatus.innerHTML = '';
          pathfinderStatus.style.display = 'none';
          if (solverProgressBar) {
            solverProgressBar.style.background = '#b85450';
          }
          
          btnSolveMode.innerHTML = '<i class="fa-solid fa-robot"></i> Solve';
          btnSolveMode.style.pointerEvents = 'auto';
          btnSolveMode.blur();
        }
        return;
      }

      requestAnimationFrame(runSolveStep);
    };

    // Begin async step loop
    requestAnimationFrame(runSolveStep);
  });

  btnRestart.addEventListener('click', () => {
    btnEditMode.click(); // Switch back to edit mode
    btnRestart.blur();
  });

  // =========================================
  // MESSAGING & CLOUD SYNC SYSTEM LOGIC
  // =========================================
  let currentPersona = 'player'; // 'player' | 'creator'
  let activeThreadId = null;
  let cachedThreads = [];

  const btnMessagesMenu = document.getElementById('btn-messages-menu');
  const btnMessagesEditor = document.getElementById('btn-messages-editor');
  const messagesOverlay = document.getElementById('messages-overlay');
  const cloudSettingsOverlay = document.getElementById('cloud-settings-overlay');
  
  const personaPlayer = document.getElementById('persona-player');
  const personaCreator = document.getElementById('persona-creator');
  const btnCloseMessages = document.getElementById('btn-close-messages');
  const btnCloudSettings = document.getElementById('btn-cloud-settings');

  const badgeMenu = document.getElementById('badge-menu');
  const badgeEditor = document.getElementById('badge-editor');

  const threadListContainer = document.getElementById('thread-list-container');
  const btnNewThread = document.getElementById('btn-new-thread');

  const chatEmptyState = document.getElementById('chat-empty-state');
  const chatActiveState = document.getElementById('chat-active-state');
  const newThreadState = document.getElementById('new-thread-state');

  const chatLevelBadge = document.getElementById('chat-level-badge');
  const chatTitle = document.getElementById('chat-title');
  const chatAuthorSub = document.getElementById('chat-author-sub');
  const chatMessagesContainer = document.getElementById('chat-messages-container');
  const inputReplyText = document.getElementById('input-reply-text');
  const btnSendReply = document.getElementById('btn-send-reply');
  const btnResolveThread = document.getElementById('btn-resolve-thread');

  const inputPlayerName = document.getElementById('input-player-name');
  const selectThreadLevel = document.getElementById('select-thread-level');
  const inputThreadTitle = document.getElementById('input-thread-title');
  const inputThreadMsg = document.getElementById('input-thread-msg');
  const btnSubmitThread = document.getElementById('btn-submit-thread');
  const btnCancelThread = document.getElementById('btn-cancel-thread');

  const inputSupabaseUrl = document.getElementById('input-supabase-url');
  const inputSupabaseKey = document.getElementById('input-supabase-key');
  const btnSaveCloud = document.getElementById('btn-save-cloud');
  const btnCancelCloud = document.getElementById('btn-cancel-cloud');

  function updateUnreadBadges() {
    const unreadCount = messageService.getUnreadCount(cachedThreads, currentPersona);

    const openCount = cachedThreads.filter(t => t.status === 'open').length;
    const badgeStudio = document.getElementById('badge-studio');
    if (badgeStudio) {
      if (openCount > 0) {
        badgeStudio.textContent = openCount;
        badgeStudio.classList.remove('hidden');
      } else {
        badgeStudio.classList.add('hidden');
      }
    }

    if (unreadCount > 0) {
      badgeMenu.textContent = unreadCount;
      badgeMenu.classList.remove('hidden');
      if (badgeEditor) {
        badgeEditor.textContent = unreadCount;
        badgeEditor.classList.remove('hidden');
      }
    } else {
      badgeMenu.classList.add('hidden');
      if (badgeEditor) badgeEditor.classList.add('hidden');
    }
  }

  function renderThreadsSidebar() {
    threadListContainer.innerHTML = '';
    cachedThreads.forEach(t => {
      const el = document.createElement('div');
      el.className = `thread-item ${t.id === activeThreadId ? 'active' : ''} ${t.status === 'resolved' ? 'resolved' : ''}`;
      
      const dateStr = new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const showUnreadDot = messageService.isThreadUnread(t, currentPersona);

      el.innerHTML = `
        <div class="thread-top">
          <span class="level-tag">${t.levelName}</span>
          <span class="thread-time">${dateStr}</span>
        </div>
        <div class="thread-title" title="${t.title}">${t.title}</div>
        <div class="thread-bottom">
          <span class="thread-author"><i class="fa-solid fa-user"></i> ${t.playerName}</span>
          ${showUnreadDot ? '<div class="unread-dot"></div>' : ''}
        </div>
      `;

      el.addEventListener('click', () => {
        activeThreadId = t.id;
        messageService.markThreadAsRead(activeThreadId, currentPersona);
        renderThreadsSidebar();
        renderChatView();
        updateUnreadBadges();
      });

      threadListContainer.appendChild(el);
    });
  }

  function renderChatView() {
    chatEmptyState.classList.add('hidden');
    chatActiveState.classList.add('hidden');
    newThreadState.classList.add('hidden');

    // Update visibility based on persona
    if (currentPersona === 'creator') {
      btnNewThread.style.display = 'none';
      btnResolveThread.style.display = 'inline-flex';
    } else {
      btnNewThread.style.display = 'inline-flex';
      btnResolveThread.style.display = 'none';
    }

    if (!activeThreadId) {
      chatEmptyState.classList.remove('hidden');
      return;
    }

    const thread = cachedThreads.find(t => t.id === activeThreadId);
    if (!thread) {
      chatEmptyState.classList.remove('hidden');
      return;
    }

    chatActiveState.classList.remove('hidden');
    chatLevelBadge.textContent = thread.levelName;
    chatTitle.textContent = thread.title;
    chatAuthorSub.textContent = `Started by ${thread.playerName} • ${new Date(thread.createdAt).toLocaleDateString()}`;
    
    if (thread.status === 'resolved') {
      btnResolveThread.style.display = 'none';
    } else if (currentPersona === 'creator') {
      btnResolveThread.style.display = 'inline-flex';
    }

    const wasAtBottom = chatMessagesContainer.scrollHeight - chatMessagesContainer.scrollTop <= chatMessagesContainer.clientHeight + 80;

    const inputCommentAuthor = document.getElementById('input-comment-author');
    if (inputCommentAuthor) {
      if (currentPersona === 'creator') {
        inputCommentAuthor.value = 'Game Creator';
        inputCommentAuthor.disabled = true;
      } else {
        inputCommentAuthor.disabled = false;
        if (!inputCommentAuthor.value || inputCommentAuthor.value === 'Game Creator') {
          inputCommentAuthor.value = localStorage.getItem('gm6700_last_handle') || '';
        }
      }
    }

    chatMessagesContainer.innerHTML = '';
    thread.messages.forEach(msg => {
      const b = document.createElement('div');
      b.className = `comment-line ${msg.senderRole}`;
      const senderName = msg.senderRole === 'creator' ? 'Game Creator' : (msg.senderName || thread.playerName);
      const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const badgeHtml = msg.senderRole === 'creator' ? '<span class="creator-badge">MOD</span>' : '';
      
      b.innerHTML = `
        <div class="comment-meta">
          <span class="comment-sender ${msg.senderRole}"><i class="fa-solid ${msg.senderRole === 'creator' ? 'fa-wand-magic-sparkles' : 'fa-user'}"></i> ${senderName} ${badgeHtml}</span>
          <span class="comment-time">${timeStr}</span>
        </div>
        <div class="comment-text">${msg.text}</div>
      `;
      chatMessagesContainer.appendChild(b);
    });

    setTimeout(() => {
      if (wasAtBottom || chatMessagesContainer.scrollTop === 0) {
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
      }
    }, 50);
  }

  function openMailbox() {
    messagesOverlay.classList.remove('hidden');
    if (!activeThreadId && cachedThreads.length > 0) {
      activeThreadId = cachedThreads[0].id;
    }
    if (activeThreadId) {
      messageService.markThreadAsRead(activeThreadId, currentPersona);
    }
    renderThreadsSidebar();
    renderChatView();
    updateUnreadBadges();

    messageService.fetchThreads().then(threads => {
      cachedThreads = threads;
      if (!activeThreadId && cachedThreads.length > 0) {
        activeThreadId = cachedThreads[0].id;
      }
      if (activeThreadId) {
        messageService.markThreadAsRead(activeThreadId, currentPersona);
      }
      renderThreadsSidebar();
      renderChatView();
      updateUnreadBadges();
    });
  }

  btnMessagesMenu.addEventListener('click', openMailbox);
  if (btnMessagesEditor) btnMessagesEditor.addEventListener('click', openMailbox);
  btnCloseMessages.addEventListener('click', () => {
    messagesOverlay.classList.add('hidden');
  });

  personaPlayer.addEventListener('click', () => {
    currentPersona = 'player';
    personaCreator.classList.remove('active');
    personaPlayer.classList.add('active');
    if (activeThreadId) {
      messageService.markThreadAsRead(activeThreadId, currentPersona);
    }
    renderThreadsSidebar();
    renderChatView();
    updateUnreadBadges();
  });

  personaCreator.addEventListener('click', () => {
    currentPersona = 'creator';
    personaPlayer.classList.remove('active');
    personaCreator.classList.add('active');
    if (activeThreadId) {
      messageService.markThreadAsRead(activeThreadId, currentPersona);
    }
    renderThreadsSidebar();
    renderChatView();
    updateUnreadBadges();
  });

  btnNewThread.addEventListener('click', () => {
    activeThreadId = null;
    renderThreadsSidebar();
    chatEmptyState.classList.add('hidden');
    chatActiveState.classList.add('hidden');
    newThreadState.classList.remove('hidden');

    // Populate level select
    selectThreadLevel.innerHTML = '';
    LevelManager.getLevels().forEach(lvl => {
      const opt = document.createElement('option');
      opt.value = lvl.id;
      opt.textContent = lvl.name;
      if (typeof selectedLevel !== 'undefined' && selectedLevel && selectedLevel.id === lvl.id) opt.selected = true;
      selectThreadLevel.appendChild(opt);
    });

    inputPlayerName.value = '';
    inputThreadTitle.value = '';
    inputThreadMsg.value = '';
  });

  btnCancelThread.addEventListener('click', () => {
    if (cachedThreads.length > 0) activeThreadId = cachedThreads[0].id;
    renderThreadsSidebar();
    renderChatView();
  });

  btnSubmitThread.addEventListener('click', async () => {
    const pName = inputPlayerName.value.trim() || 'Player';
    const lvlId = selectThreadLevel.value;
    const lvlOpt = selectThreadLevel.options[selectThreadLevel.selectedIndex];
    const lvlName = lvlOpt ? lvlOpt.textContent : 'Custom Level';
    const title = inputThreadTitle.value.trim() || 'General Feedback';
    const text = inputThreadMsg.value.trim();

    if (!text) {
      alert('Please enter a message.');
      return;
    }

    const created = await messageService.createThread(lvlId, lvlName, title, pName, text);
    cachedThreads = await messageService.fetchThreads();
    activeThreadId = created.id;
    messageService.markThreadAsRead(activeThreadId, currentPersona);
    
    newThreadState.classList.add('hidden');
    renderThreadsSidebar();
    renderChatView();
    updateUnreadBadges();
  });

  btnSendReply.addEventListener('click', async () => {
    const text = inputReplyText.value.trim();
    if (!text || !activeThreadId) return;

    const inputCommentAuthor = document.getElementById('input-comment-author');
    let authorName = 'Player';
    if (inputCommentAuthor && currentPersona !== 'creator') {
      authorName = inputCommentAuthor.value.trim() || 'Player';
      localStorage.setItem('gm6700_last_handle', authorName);
    }

    inputReplyText.value = '';
    await messageService.addReply(activeThreadId, currentPersona, text, authorName);
    cachedThreads = await messageService.fetchThreads();
    messageService.markThreadAsRead(activeThreadId, currentPersona);
    renderThreadsSidebar();
    renderChatView();
    updateUnreadBadges();
  });

  inputReplyText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnSendReply.click();
    }
  });

  const inputCommentAuthorEl = document.getElementById('input-comment-author');
  if (inputCommentAuthorEl) {
    inputCommentAuthorEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        inputReplyText.focus();
      }
    });
  }

  if (btnResolveThread) {
    btnResolveThread.addEventListener('click', async () => {
      if (!activeThreadId) return;
      await messageService.resolveThread(activeThreadId);
      cachedThreads = await messageService.fetchThreads();
      renderThreadsSidebar();
      renderChatView();
      updateUnreadBadges();
    });
  }

  btnCloudSettings.addEventListener('click', () => {
    cloudSettingsOverlay.classList.remove('hidden');
    const cfg = messageService.cloudConfig;
    inputSupabaseUrl.value = cfg.supabaseUrl || '';
    inputSupabaseKey.value = cfg.supabaseKey || '';
  });

  btnCancelCloud.addEventListener('click', () => {
    cloudSettingsOverlay.classList.add('hidden');
  });

  btnSaveCloud.addEventListener('click', async () => {
    const url = inputSupabaseUrl.value.trim();
    const key = inputSupabaseKey.value.trim();
    messageService.saveConfig(url, key);
    cloudSettingsOverlay.classList.add('hidden');
    alert('Cloud config saved! Synchronizing messages...');
    cachedThreads = await messageService.fetchThreads();
    if (!activeThreadId && cachedThreads.length > 0) activeThreadId = cachedThreads[0].id;
    if (activeThreadId) {
      messageService.markThreadAsRead(activeThreadId, currentPersona);
    }
    renderThreadsSidebar();
    renderChatView();
    updateUnreadBadges();
  });

  // Check if we need to auto-open level editor from URL query
  const params = new URLSearchParams(window.location.search);
  const editLevelId = params.get('edit');
  if (editLevelId) {
    let targetLvl = LevelManager.getLevel(editLevelId);
    if (!targetLvl) {
      targetLvl = LevelManager.getLevels().find(l => l.name.toLowerCase() === editLevelId.toLowerCase());
    }
    if (targetLvl) {
      selectedLevel = targetLvl;
      openLevelInMode(CONFIG.MODE_EDIT);
    }
  }

  // Initial badge check on load
  messageService.fetchThreads().then(threads => {
    cachedThreads = threads;
    updateUnreadBadges();
  });

  // Background auto-polling for real-time updates
  setInterval(async () => {
    if (!messageService.isCloudConfigured()) return;
    const fresh = await messageService.fetchThreads();
    const currentSummary = JSON.stringify(cachedThreads);
    const freshSummary = JSON.stringify(fresh);
    if (currentSummary !== freshSummary) {
      const prevTotalMessages = cachedThreads.reduce((sum, t) => sum + t.messages.length, 0);
      const newTotalMessages = fresh.reduce((sum, t) => sum + t.messages.length, 0);

      cachedThreads = fresh;
      if (!messagesOverlay.classList.contains('hidden') && activeThreadId) {
        messageService.markThreadAsRead(activeThreadId, currentPersona);
        renderThreadsSidebar();
        renderChatView();
      }
      updateUnreadBadges();

      if (newTotalMessages > prevTotalMessages) {
        audio.playTileSound();
      }
    }
  }, 3000);
});
