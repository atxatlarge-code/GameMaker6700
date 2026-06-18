// src/factory.js

const CH_FACTORY_STORAGE_KEY = 'gm6700_custom_characters';

export class CharacterFactory {
  constructor() {
    this.characters = [];
    try {
      const stored = localStorage.getItem(CH_FACTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.characters = parsed;
        } else {
          console.warn('Custom characters is not an array, resetting to empty list');
        }
      }
    } catch (e) {
      console.error('Error loading custom characters from localStorage', e);
    }
    
    this.currentMode = 'pixel'; // 'pixel', 'mix', 'ai'
    this.currentColor = '#ff0000';
    this.currentPixelTool = 'pen'; // 'pen', 'eraser', 'fill'
    this.isDrawing = false;
    
    this.initUI();
    this.initPixelEditor();
    this.initMixAndMatch();
    this.initAIGenerator();
    this.renderSavedList();
  }

  initUI() {
    // Tabs
    const tabs = document.querySelectorAll('.factory-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.switchMode(tab.dataset.tab);
      });
    });

    // Save button
    const btnSave = document.getElementById('btn-factory-save');
    if (btnSave) {
      btnSave.addEventListener('click', () => this.saveCharacter());
    }
    
    const charNameInput = document.getElementById('factory-char-name');
    if (charNameInput) {
      charNameInput.addEventListener('input', () => this.updateFinalPreview());
    }
  }

  switchMode(mode) {
    this.currentMode = mode;
    document.querySelectorAll('.factory-mode-panel').forEach(p => p.classList.remove('active', 'hidden'));
    
    const pixelPanel = document.getElementById('factory-pixel-mode');
    const mixPanel = document.getElementById('factory-mix-mode');
    const aiPanel = document.getElementById('factory-ai-mode');
    
    pixelPanel.classList.add('hidden');
    mixPanel.classList.add('hidden');
    aiPanel.classList.add('hidden');
    
    if (mode === 'pixel') pixelPanel.classList.replace('hidden', 'active');
    if (mode === 'mix') mixPanel.classList.replace('hidden', 'active');
    if (mode === 'ai') aiPanel.classList.replace('hidden', 'active');
    
    this.updateFinalPreview();
  }

  initPixelEditor() {
    this.pixelCanvas = document.getElementById('pixel-canvas');
    if (!this.pixelCanvas) return;
    this.pixelCtx = this.pixelCanvas.getContext('2d', { willReadFrequently: true });
    
    // Clear to transparent
    this.pixelCtx.clearRect(0, 0, 32, 32);

    // Tools
    const toolBtns = document.querySelectorAll('.pixel-tool-btn[data-tool]');
    toolBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentPixelTool = btn.dataset.tool;
      });
    });

    const btnClear = document.getElementById('btn-pixel-clear');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.pixelCtx.clearRect(0, 0, 32, 32);
        this.updateFinalPreview();
      });
    }

    // Color picker
    const colorPicker = document.getElementById('pixel-color-picker');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        this.currentColor = e.target.value;
      });
    }

    // Drawing events
    const getPos = (e) => {
      const rect = this.pixelCanvas.getBoundingClientRect();
      const scaleX = this.pixelCanvas.width / rect.width;
      const scaleY = this.pixelCanvas.height / rect.height;
      return {
        x: Math.floor((e.clientX - rect.left) * scaleX),
        y: Math.floor((e.clientY - rect.top) * scaleY)
      };
    };

    const draw = (e) => {
      if (!this.isDrawing) return;
      const pos = getPos(e);
      if (pos.x < 0 || pos.x >= 32 || pos.y < 0 || pos.y >= 32) return;

      if (this.currentPixelTool === 'pen') {
        this.pixelCtx.fillStyle = this.currentColor;
        this.pixelCtx.fillRect(pos.x, pos.y, 1, 1);
      } else if (this.currentPixelTool === 'eraser') {
        this.pixelCtx.clearRect(pos.x, pos.y, 1, 1);
      } else if (this.currentPixelTool === 'fill') {
        this.floodFill(pos.x, pos.y, this.currentColor);
      }
      this.updateFinalPreview();
    };

    this.pixelCanvas.addEventListener('mousedown', (e) => {
      this.isDrawing = true;
      draw(e);
    });
    this.pixelCanvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', () => {
      this.isDrawing = false;
    });
  }

  floodFill(startX, startY, fillColorHex) {
    const targetColorData = this.pixelCtx.getImageData(startX, startY, 1, 1).data;
    const targetColor = { r: targetColorData[0], g: targetColorData[1], b: targetColorData[2], a: targetColorData[3] };
    
    // Parse fill color hex to rgba
    const r = parseInt(fillColorHex.slice(1, 3), 16);
    const g = parseInt(fillColorHex.slice(3, 5), 16);
    const b = parseInt(fillColorHex.slice(5, 7), 16);
    const fillRGBA = { r, g, b, a: 255 };

    if (targetColor.r === fillRGBA.r && targetColor.g === fillRGBA.g && targetColor.b === fillRGBA.b && targetColor.a === fillRGBA.a) return;

    const imgData = this.pixelCtx.getImageData(0, 0, 32, 32);
    const data = imgData.data;
    
    const stack = [[startX, startY]];
    
    const matchColor = (x, y) => {
      const i = (y * 32 + x) * 4;
      return data[i] === targetColor.r && data[i+1] === targetColor.g && data[i+2] === targetColor.b && data[i+3] === targetColor.a;
    };
    
    const setColor = (x, y) => {
      const i = (y * 32 + x) * 4;
      data[i] = fillRGBA.r;
      data[i+1] = fillRGBA.g;
      data[i+2] = fillRGBA.b;
      data[i+3] = fillRGBA.a;
    };

    while(stack.length > 0) {
      const [x, y] = stack.pop();
      if (x < 0 || x >= 32 || y < 0 || y >= 32) continue;
      if (!matchColor(x, y)) continue;
      
      setColor(x, y);
      
      stack.push([x+1, y]);
      stack.push([x-1, y]);
      stack.push([x, y+1]);
      stack.push([x, y-1]);
    }
    
    this.pixelCtx.putImageData(imgData, 0, 0);
  }

  initMixAndMatch() {
    this.mixCanvas = document.getElementById('mix-preview-canvas');
    if (!this.mixCanvas) return;
    this.mixCtx = this.mixCanvas.getContext('2d');
    
    this.mixOptions = {
      head: ['Classic', 'Round', 'Square'],
      body: ['Classic', 'Slim', 'Bulky'],
      legs: ['Classic', 'Long', 'Short'],
      hair: ['None', 'Spiky', 'Bowl', 'Flat'],
      helmet: ['None', 'Knight', 'Space', 'Cap'],
      clothes: ['None', 'Shirt', 'Overalls', 'Suit']
    };

    this.mixState = {
      head: 0,
      body: 0,
      legs: 0,
      hair: 0,
      helmet: 0,
      clothes: 0
    };
    
    // Initial render
    this.renderMixAndMatch();
    
    // Listeners for mix changes
    const mixBtns = document.querySelectorAll('.mix-btn');
    mixBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const part = btn.dataset.part;
        const dir = btn.classList.contains('next') ? 1 : -1;
        
        if (this.mixOptions[part]) {
          let idx = this.mixState[part] + dir;
          if (idx < 0) idx = this.mixOptions[part].length - 1;
          if (idx >= this.mixOptions[part].length) idx = 0;
          this.mixState[part] = idx;
          
          const valEl = document.getElementById(`mix-val-${part}`);
          if (valEl) {
            valEl.textContent = this.mixOptions[part][idx];
          }
        }
        
        this.renderMixAndMatch();
        this.updateFinalPreview();
      });
    });
    
    const colorInputs = document.querySelectorAll('.mix-section input[type="color"]');
    colorInputs.forEach(input => {
      input.addEventListener('input', () => {
        this.renderMixAndMatch();
        this.updateFinalPreview();
      });
    });
  }
  
  renderMixAndMatch() {
    if (!this.mixCtx) return;
    this.mixCtx.clearRect(0, 0, 128, 128);
    
    // Read colors
    const cHead = document.getElementById('mix-color-head') ? document.getElementById('mix-color-head').value : '#cccccc';
    const cBody = document.getElementById('mix-color-body') ? document.getElementById('mix-color-body').value : '#ff0000';
    const cLegs = document.getElementById('mix-color-legs') ? document.getElementById('mix-color-legs').value : '#0000ff';
    const cHair = document.getElementById('mix-color-hair') ? document.getElementById('mix-color-hair').value : '#8b4513';
    const cHelmet = document.getElementById('mix-color-helmet') ? document.getElementById('mix-color-helmet').value : '#aaaaaa';
    const cClothes = document.getElementById('mix-color-clothes') ? document.getElementById('mix-color-clothes').value : '#00aa00';
    
    const valHead = document.getElementById('mix-val-head') ? document.getElementById('mix-val-head').textContent : 'Classic';
    const valBody = document.getElementById('mix-val-body') ? document.getElementById('mix-val-body').textContent : 'Classic';
    const valLegs = document.getElementById('mix-val-legs') ? document.getElementById('mix-val-legs').textContent : 'Classic';
    const valHair = document.getElementById('mix-val-hair') ? document.getElementById('mix-val-hair').textContent : 'None';
    const valHelmet = document.getElementById('mix-val-helmet') ? document.getElementById('mix-val-helmet').textContent : 'None';
    const valClothes = document.getElementById('mix-val-clothes') ? document.getElementById('mix-val-clothes').textContent : 'None';

    // Legs
    this.mixCtx.fillStyle = cLegs;
    if (valLegs === 'Long') {
      this.mixCtx.fillRect(40, 80, 12, 48);
      this.mixCtx.fillRect(76, 80, 12, 48);
    } else if (valLegs === 'Short') {
      this.mixCtx.fillRect(40, 80, 16, 24);
      this.mixCtx.fillRect(72, 80, 16, 24);
    } else {
      this.mixCtx.fillRect(40, 80, 16, 48);
      this.mixCtx.fillRect(72, 80, 16, 48);
    }
    
    // Body
    this.mixCtx.fillStyle = cBody;
    if (valBody === 'Slim') {
      this.mixCtx.fillRect(40, 48, 48, 48);
    } else if (valBody === 'Bulky') {
      this.mixCtx.fillRect(24, 48, 80, 48);
    } else {
      this.mixCtx.fillRect(32, 48, 64, 48);
    }
    
    // Clothes
    if (valClothes !== 'None') {
      this.mixCtx.fillStyle = cClothes;
      let bx = 32, by = 48, bw = 64, bh = 48;
      if (valBody === 'Slim') { bx = 40; bw = 48; }
      else if (valBody === 'Bulky') { bx = 24; bw = 80; }

      if (valClothes === 'Shirt') {
        this.mixCtx.fillRect(bx, by, bw, 32); 
      } else if (valClothes === 'Overalls') {
        this.mixCtx.fillRect(bx + 8, by + 16, bw - 16, 32); 
      } else if (valClothes === 'Suit') {
        this.mixCtx.fillRect(bx, by, bw, 48);
        this.mixCtx.fillStyle = '#ffffff'; // Tie or shirt underneath
        this.mixCtx.fillRect(60, by, 8, 24);
      }
    }

    // Head
    this.mixCtx.fillStyle = cHead;
    if (valHead === 'Round') {
      this.mixCtx.beginPath();
      this.mixCtx.arc(64, 40, 24, 0, Math.PI * 2);
      this.mixCtx.fill();
    } else if (valHead === 'Square') {
      this.mixCtx.fillRect(32, 16, 64, 40);
    } else {
      this.mixCtx.fillRect(40, 16, 48, 48);
    }
    
    // Eyes
    this.mixCtx.fillStyle = '#ffffff';
    this.mixCtx.fillRect(50, 30, 8, 8);
    this.mixCtx.fillRect(70, 30, 8, 8);
    this.mixCtx.fillStyle = '#000000';
    this.mixCtx.fillRect(52, 32, 4, 4);
    this.mixCtx.fillRect(72, 32, 4, 4);

    // Hair
    if (valHair !== 'None') {
      this.mixCtx.fillStyle = cHair;
      if (valHair === 'Spiky') {
        this.mixCtx.beginPath();
        this.mixCtx.moveTo(40, 16);
        this.mixCtx.lineTo(48, 0);
        this.mixCtx.lineTo(56, 16);
        this.mixCtx.lineTo(64, 0);
        this.mixCtx.lineTo(72, 16);
        this.mixCtx.lineTo(80, 0);
        this.mixCtx.lineTo(88, 16);
        this.mixCtx.fill();
      } else if (valHair === 'Bowl') {
        this.mixCtx.beginPath();
        this.mixCtx.arc(64, 16, 24, Math.PI, 0);
        this.mixCtx.fill();
      } else if (valHair === 'Flat') {
        this.mixCtx.fillRect(36, 8, 56, 12);
      }
    }

    // Helmet
    if (valHelmet !== 'None') {
      this.mixCtx.fillStyle = cHelmet;
      if (valHelmet === 'Knight') {
        this.mixCtx.fillRect(36, 12, 56, 24);
        this.mixCtx.fillRect(60, 12, 8, 48); // middle part down
      } else if (valHelmet === 'Space') {
        this.mixCtx.beginPath();
        this.mixCtx.arc(64, 40, 32, Math.PI, 0);
        this.mixCtx.lineWidth = 4;
        this.mixCtx.strokeStyle = cHelmet;
        this.mixCtx.stroke();
        this.mixCtx.fillStyle = 'rgba(255,255,255,0.3)';
        this.mixCtx.fill();
        this.mixCtx.lineWidth = 1;
      } else if (valHelmet === 'Cap') {
        this.mixCtx.beginPath();
        this.mixCtx.arc(64, 16, 24, Math.PI, 0);
        this.mixCtx.fill();
        this.mixCtx.fillRect(64, 12, 32, 4); // brim
      }
    }
  }

  initAIGenerator() {
    this.aiCanvas = document.getElementById('ai-preview-canvas');
    if (!this.aiCanvas) return;
    this.aiCtx = this.aiCanvas.getContext('2d');
    
    const btnGen = document.getElementById('btn-ai-generate');
    const inputPrompt = document.getElementById('ai-prompt-input');
    const emptyState = document.getElementById('ai-empty-state');
    const statusMsg = document.getElementById('ai-status-msg');
    
    if (btnGen) {
      btnGen.addEventListener('click', () => {
        if (!inputPrompt.value.trim()) return;
        
        // Mock generation delay
        statusMsg.classList.remove('hidden');
        btnGen.disabled = true;
        emptyState.style.display = 'none';
        
        setTimeout(() => {
          statusMsg.classList.add('hidden');
          btnGen.disabled = false;
          this.generateProceduralAICharacter(inputPrompt.value);
          this.updateFinalPreview();
        }, 1500);
      });
    }
  }
  
  generateProceduralAICharacter(prompt) {
    if (!this.aiCtx) return;
    this.aiCtx.clearRect(0, 0, 128, 128);
    
    // Generate a chaotic, procedurally generated pixel sprite based on a hash of the prompt
    let hash = 0;
    for (let i = 0; i < prompt.length; i++) {
      hash = prompt.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const seededRandom = () => {
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x);
    };
    
    // Generate 16x16 symmetric sprite then scale to 128x128
    const baseColors = [
      `hsl(${Math.floor(seededRandom() * 360)}, 80%, 60%)`,
      `hsl(${Math.floor(seededRandom() * 360)}, 70%, 40%)`,
      `hsl(${Math.floor(seededRandom() * 360)}, 90%, 80%)`,
      '#ffffff',
      '#222222'
    ];
    
    const gridSize = 16;
    const pixelSize = 128 / gridSize;
    
    for (let x = 0; x < gridSize / 2; x++) {
      for (let y = 0; y < gridSize; y++) {
        if (seededRandom() > 0.4) {
          const color = baseColors[Math.floor(seededRandom() * baseColors.length)];
          this.aiCtx.fillStyle = color;
          // Left side
          this.aiCtx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
          // Right side
          this.aiCtx.fillRect((gridSize - 1 - x) * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  }

  updateFinalPreview() {
    const finalCanvas = document.getElementById('factory-final-preview');
    if (!finalCanvas) return;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.clearRect(0, 0, 32, 32);
    
    if (this.currentMode === 'pixel' && this.pixelCanvas) {
      finalCtx.drawImage(this.pixelCanvas, 0, 0, 32, 32);
    } else if (this.currentMode === 'mix' && this.mixCanvas) {
      // mix canvas is 128x128, scale down to 32x32
      finalCtx.drawImage(this.mixCanvas, 0, 0, 128, 128, 0, 0, 32, 32);
    } else if (this.currentMode === 'ai' && this.aiCanvas) {
      finalCtx.drawImage(this.aiCanvas, 0, 0, 128, 128, 0, 0, 32, 32);
    }
  }

  saveCharacter() {
    const nameInput = document.getElementById('factory-char-name');
    const name = nameInput ? nameInput.value.trim() : 'Custom';
    
    const finalCanvas = document.getElementById('factory-final-preview');
    if (!finalCanvas) return;
    
    const dataUrl = finalCanvas.toDataURL();
    
    const charData = {
      id: 'custom_' + Date.now(),
      name: name || 'Custom Character',
      dataUrl: dataUrl
    };
    
    this.characters.push(charData);
    localStorage.setItem(CH_FACTORY_STORAGE_KEY, JSON.stringify(this.characters));
    
    this.renderSavedList();
    
    // Dispatch event so engine/editor can update player icons list
    const event = new CustomEvent('gm_character_saved', { detail: charData });
    window.dispatchEvent(event);
  }

  renderSavedList() {
    const listEl = document.getElementById('factory-saved-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    
    if (this.characters.length > 0) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'secondary-btn danger';
      clearBtn.style.gridColumn = '1 / -1';
      clearBtn.style.marginBottom = '10px';
      clearBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete All';
      clearBtn.addEventListener('click', () => {
        if (confirm('Delete all your characters?')) {
          this.characters = [];
          localStorage.setItem(CH_FACTORY_STORAGE_KEY, JSON.stringify(this.characters));
          this.renderSavedList();
        }
      });
      listEl.appendChild(clearBtn);
    }
    
    this.characters.forEach((char, index) => {
      const charCard = document.createElement('div');
      charCard.className = 'saved-char-card';
      
      const btn = document.createElement('button');
      btn.className = 'saved-char-btn';
      btn.innerHTML = `
        <img src="${char.dataUrl}" alt="${char.name}">
        <span>${char.name}</span>
      `;
      btn.addEventListener('click', () => {
        // In the future: load this character into the editor to edit it
      });
      
      const delBtn = document.createElement('button');
      delBtn.className = 'delete-char-btn';
      delBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      delBtn.title = 'Delete Character';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Delete character "${char.name}"?`)) {
          this.characters.splice(index, 1);
          localStorage.setItem(CH_FACTORY_STORAGE_KEY, JSON.stringify(this.characters));
          this.renderSavedList();
        }
      });
      
      charCard.appendChild(btn);
      charCard.appendChild(delBtn);
      listEl.appendChild(charCard);
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.characterFactory = new CharacterFactory();
});
