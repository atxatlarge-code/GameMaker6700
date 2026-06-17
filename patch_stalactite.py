import re
import os

def patch():
    editor_path = 'src/editor.js'
    with open(editor_path, 'r') as f:
        editor_content = f.read()

    # Add stalactite tool to editor
    if "case 'stalactite':" not in editor_content:
        editor_content = re.sub(
            r"(case 'spikes':\s*this\.level\.setTile\(col, row, 4\);\s*break;)",
            r"\1\n      case 'stalactite':\n        this.level.setTile(col, row, 35);\n        break;",
            editor_content
        )
        editor_content = re.sub(
            r"(case 4:\n\s*this\.currentTool = 'spikes';\n\s*break;)",
            r"\1\n        case 35:\n          this.currentTool = 'stalactite';\n          break;",
            editor_content
        )

    with open(editor_path, 'w') as f:
        f.write(editor_content)

    index_path = 'index.html'
    with open(index_path, 'r') as f:
        index_content = f.read()

    if 'data-tool="stalactite"' not in index_content:
        index_content = re.sub(
            r'(<button class="popup-item-btn" data-tool="spikes">.*?<i class="fa-solid fa-mountain"></i> Spikes</button>)',
            r'\1\n                <button class="popup-item-btn" data-tool="stalactite"><i class="fa-solid fa-caret-down" style="color:#e2e8f0"></i> Stalactite</button>',
            index_content
        )

    with open(index_path, 'w') as f:
        f.write(index_content)

    engine_path = 'src/engine.js'
    with open(engine_path, 'r') as f:
        engine_content = f.read()

    if 'this.stalactites = [];' not in engine_content:
        engine_content = re.sub(
            r'(this\.boomerangs = \[\];)',
            r'\1\n    this.stalactites = [];',
            engine_content
        )

    # In update(), scan for stalactites above player
    stalactite_logic = """
    // Stalactite activation
    if (!this.isDead && !this.hasWon) {
      const pCol = Math.floor((this.player.x + this.player.width/2) / CONFIG.TILE_SIZE);
      const pRow = Math.floor((this.player.y + this.player.height/2) / CONFIG.TILE_SIZE);
      for (let r = pRow; r >= 0; r--) {
        if (this.getTile(pCol, r) === 35) {
          // Check line of sight (no solid blocks between player and stalactite)
          let clear = true;
          for (let checkR = r + 1; checkR < pRow; checkR++) {
            const tile = this.getTile(pCol, checkR);
            if (tile === 1 || tile === 6 || tile === 7 || tile === 16 || tile === 18) {
              clear = false;
              break;
            }
          }
          if (clear) {
            // Activate stalactite
            this.setTile(pCol, r, 0);
            this.stalactites.push({
              x: pCol * CONFIG.TILE_SIZE,
              y: r * CONFIG.TILE_SIZE,
              width: CONFIG.TILE_SIZE,
              height: CONFIG.TILE_SIZE,
              vy: 0,
              state: 'shaking',
              timer: 30
            });
          }
        }
      }
    }

    // Update stalactites
    for (let i = this.stalactites.length - 1; i >= 0; i--) {
      const st = this.stalactites[i];
      if (st.state === 'shaking') {
        st.timer--;
        if (st.timer <= 0) {
          st.state = 'falling';
          if (!this.isSimulation && window.audio && window.audio.playTileSound) window.audio.playTileSound();
        }
      } else if (st.state === 'falling') {
        st.vy += 0.5; // Gravity
        st.y += st.vy;
        
        // Collision with player
        if (!this.isDead && !this.hasWon &&
            this.player.x < st.x + st.width - 4 &&
            this.player.x + this.player.width > st.x + 4 &&
            this.player.y < st.y + st.height - 4 &&
            this.player.y + this.player.height > st.y + 4) {
          this.killPlayer();
        }
        
        // Collision with ground
        const bottomRow = Math.floor((st.y + st.height) / CONFIG.TILE_SIZE);
        const col = Math.floor((st.x + st.width/2) / CONFIG.TILE_SIZE);
        const tile = this.getTile(col, bottomRow);
        if (tile === 1 || tile === 6 || tile === 7 || tile === 18) {
          // Shatter
          this.stalactites.splice(i, 1);
          if (!this.isSimulation && window.audio && window.audio.playTileSound) window.audio.playTileSound();
        } else if (st.y > CONFIG.GRID_ROWS * CONFIG.TILE_SIZE) {
          this.stalactites.splice(i, 1);
        }
      }
    }
"""
    if '// Stalactite activation' not in engine_content:
        engine_content = re.sub(
            r'(this\.updateBoomerangs\(\);)',
            r'\1\n' + stalactite_logic,
            engine_content
        )

    # Drawing stalactites
    if "case 35: // Stalactite" not in engine_content:
        draw_logic = """
        case 35: // Stalactite
          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + w, y);
          ctx.lineTo(x + w/2, y + h);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + w/2, y);
          ctx.lineTo(x + w/2, y + h);
          ctx.closePath();
          ctx.fill();
          break;
"""
        engine_content = re.sub(
            r'(case 34: // Mirror Portal.*?\n\s*break;)',
            r'\1\n' + draw_logic,
            engine_content,
            flags=re.DOTALL
        )

    # Draw dynamic stalactites
    dynamic_draw = """
    for (const st of this.stalactites) {
      let drawX = st.x;
      let drawY = st.y;
      if (st.state === 'shaking') {
        drawX += (Math.random() - 0.5) * 4;
      }
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX + st.width, drawY);
      ctx.lineTo(drawX + st.width/2, drawY + st.height);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(drawX, drawY);
      ctx.lineTo(drawX + st.width/2, drawY);
      ctx.lineTo(drawX + st.width/2, drawY + st.height);
      ctx.closePath();
      ctx.fill();
    }
"""
    if 'for (const st of this.stalactites)' not in engine_content:
        engine_content = re.sub(
            r'(// Draw boomerangs)',
            dynamic_draw + r'\n    \1',
            engine_content
        )

    with open(engine_path, 'w') as f:
        f.write(engine_content)
        
    pathfinder_path = 'src/pathfinder.js'
    with open(pathfinder_path, 'r') as f:
        pf_content = f.read()
        
    # Patch pathfinder to save/restore stalactites
    if 'stalactites: engine.stalactites.map(s => ({ ...s })),' not in pf_content:
        pf_content = re.sub(
            r'(coinsCollected: engine\.coinsCollected)',
            r'\1,\n      stalactites: engine.stalactites ? engine.stalactites.map(s => ({ ...s })) : []',
            pf_content
        )
        pf_content = re.sub(
            r'(engine\.coinsCollected = s\.coinsCollected;)',
            r'\1\n      engine.stalactites = s.stalactites ? s.stalactites.map(st => ({ ...st })) : [];',
            pf_content
        )
        
    with open(pathfinder_path, 'w') as f:
        f.write(pf_content)

if __name__ == '__main__':
    patch()
    print("Stalactite patch applied.")
