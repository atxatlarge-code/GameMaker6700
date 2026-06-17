import re

# 1. Update config.js
with open('src/config.js', 'r') as f:
    config_content = f.read()

if 'TOOL_PORTAL_MIRROR' not in config_content:
    config_content = re.sub(
        r"(TOOL_BOOMERANG:\s*'boomerang',)",
        r"\1\n  TOOL_PORTAL_MIRROR: 'portal_mirror',",
        config_content
    )
    with open('src/config.js', 'w') as f:
        f.write(config_content)

# 2. Update editor.js
with open('src/editor.js', 'r') as f:
    editor_content = f.read()

if 'portal_mirror:' not in editor_content:
    editor_content = re.sub(
        r"(boomerang:\s*33,)",
        r"\1\n  portal_mirror: 34,",
        editor_content
    )
    editor_content = re.sub(
        r"(case CONFIG\.TOOL_BOOMERANG:\s*return \[0, 200, 255\];)",
        r"\1\n      case CONFIG.TOOL_PORTAL_MIRROR: return [150, 0, 200];",
        editor_content
    )
    # Add drawing logic for mirror portal
    mirror_draw = """
      } else if (tool === CONFIG.TOOL_PORTAL_MIRROR) {
        ctx.fillStyle = '#800080';
        ctx.beginPath();
        ctx.ellipse(x + size/2, y + size/2, size/3, size/2, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#ddaadd';
        ctx.stroke();
"""
    editor_content = re.sub(
        r"(\} else if \(tool === CONFIG\.TOOL_BOOMERANG\) \{[^}]+\n      \})",
        r"\1" + mirror_draw,
        editor_content
    )
    with open('src/editor.js', 'w') as f:
        f.write(editor_content)

# 3. Update index.html
with open('index.html', 'r') as f:
    html_content = f.read()

if 'portal_mirror' not in html_content:
    html_content = re.sub(
        r'(<button class="tool-btn" data-tool="boomerang" title="Boomerang Projectile"><i class="fas fa-undo"></i></button>)',
        r'\1\n        <button class="tool-btn" data-tool="portal_mirror" title="Mirror Portal"><i class="fas fa-user-friends"></i></button>',
        html_content
    )
    with open('index.html', 'w') as f:
        f.write(html_content)

# 4. Update engine.js
with open('src/engine.js', 'r') as f:
    engine_content = f.read()

if 'this.shadowClone = null' not in engine_content:
    # Add to resetPlayer
    engine_content = re.sub(
        r'(this\.boomerangs = \[\];)',
        r'\1\n    this.shadowClone = null;',
        engine_content
    )

    # Add shadow clone update logic
    clone_logic = """
  updateShadowClone() {
    if (!this.shadowClone) return;
    
    // Symmetrical input
    const cloneKeys = {
      left: this.keys.right,
      right: this.keys.left,
      up: this.keys.up
    };

    const clone = this.shadowClone;
    
    // Gravity direction
    const gDir = this.level.gravityDir || 1;
    
    // Apply gravity
    if (clone.vy * gDir < CONFIG.MAX_FALL_SPEED) {
      clone.vy += CONFIG.GRAVITY * gDir;
    }

    // Horizontal movement
    let targetVx = 0;
    if (cloneKeys.left) targetVx = -CONFIG.MOVE_SPEED;
    if (cloneKeys.right) targetVx = -targetVx + CONFIG.MOVE_SPEED; // Wait, right is +MOVE_SPEED
    if (cloneKeys.left && !cloneKeys.right) targetVx = -CONFIG.MOVE_SPEED;
    else if (cloneKeys.right && !cloneKeys.left) targetVx = CONFIG.MOVE_SPEED;
    
    clone.vx += (targetVx - clone.vx) * CONFIG.ACCELERATION;
    
    if (cloneKeys.left) clone.facing = 'left';
    if (cloneKeys.right) clone.facing = 'right';

    // Jump
    if (cloneKeys.up && clone.isGrounded) {
      clone.vy = -CONFIG.JUMP_FORCE * gDir;
      clone.isGrounded = false;
      if (!this.isSimulation && audio.playJumpSound) audio.playJumpSound();
    }

    // Move X
    clone.x += clone.vx;
    
    // Resolve X collisions
    const minColX = Math.floor(clone.x / CONFIG.TILE_SIZE);
    const maxColX = Math.floor((clone.x + clone.width - 0.01) / CONFIG.TILE_SIZE);
    const minRowX = Math.floor(clone.y / CONFIG.TILE_SIZE);
    const maxRowX = Math.floor((clone.y + clone.height - 0.01) / CONFIG.TILE_SIZE);
    
    for (let r = minRowX; r <= maxRowX; r++) {
      for (let c = minColX; c <= maxColX; c++) {
        if (this.isSolid(c, r)) {
          if (clone.vx > 0) clone.x = c * CONFIG.TILE_SIZE - clone.width;
          else if (clone.vx < 0) clone.x = (c + 1) * CONFIG.TILE_SIZE;
          clone.vx = 0;
        }
      }
    }

    // Move Y
    clone.y += clone.vy;
    clone.isGrounded = false;
    
    // Resolve Y collisions
    const minColY = Math.floor(clone.x / CONFIG.TILE_SIZE);
    const maxColY = Math.floor((clone.x + clone.width - 0.01) / CONFIG.TILE_SIZE);
    const minRowY = Math.floor(clone.y / CONFIG.TILE_SIZE);
    const maxRowY = Math.floor((clone.y + clone.height - 0.01) / CONFIG.TILE_SIZE);
    
    for (let r = minRowY; r <= maxRowY; r++) {
      for (let c = minColY; c <= maxColY; c++) {
        if (this.isSolid(c, r)) {
          if (clone.vy > 0) {
            clone.y = r * CONFIG.TILE_SIZE - clone.height;
            clone.isGrounded = true;
          } else if (clone.vy < 0) {
            clone.y = (r + 1) * CONFIG.TILE_SIZE;
          }
          clone.vy = 0;
        }
      }
    }
  }
"""
    engine_content = re.sub(
        r'(updateBoomerangs\(\) \{)',
        clone_logic + r'\n  \1',
        engine_content
    )

    # Call updateShadowClone in update()
    engine_content = re.sub(
        r'(this\.updateBoomerangs\(\);)',
        r'\1\n    this.updateShadowClone();',
        engine_content
    )

    # Render shadow clone
    render_logic = """
    if (this.shadowClone) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.translate(this.shadowClone.x + this.shadowClone.width/2, this.shadowClone.y + this.shadowClone.height/2);
      if (this.shadowClone.facing === 'left') ctx.scale(-1, 1);
      ctx.fillStyle = '#000000';
      ctx.fillRect(-this.shadowClone.width/2, -this.shadowClone.height/2, this.shadowClone.width, this.shadowClone.height);
      ctx.restore();
    }
"""
    engine_content = re.sub(
        r'(this\.drawPlayer\(\);)',
        r'\1\n' + render_logic,
        engine_content
    )

    # Check for mirror portal (34)
    portal_logic = """
          if (tileVal === 34 && !this.shadowClone) {
            this.shadowClone = {
              x: c * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.width)/2,
              y: r * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - this.player.height),
              vx: 0, vy: 0, width: this.player.width, height: this.player.height,
              isGrounded: false, facing: 'right'
            };
            if (!this.isSimulation && audio.playTileSound) audio.playTileSound();
          }
"""
    engine_content = re.sub(
        r'(if \(tileVal === 19\) continue;)',
        r'\1\n' + portal_logic,
        engine_content
    )

    with open('src/engine.js', 'w') as f:
        f.write(engine_content)

print("Mirror Portal patched.")
