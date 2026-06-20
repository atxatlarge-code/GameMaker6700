import re

with open('src/engine.js', 'r') as f:
    content = f.read()

# 1. Resolve conflict in updateEnemies()
conflict_pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)>>>>>>> [^\n]+', re.DOTALL)
match = conflict_pattern.search(content)

if match:
    # the second group is my branch's monolithic block
    monolithic_block = match.group(2)
    
    # We will keep the abstraction but add updateThwompAI
    new_update_enemies = """      if (enemy.type === 'thwomp') {
        this.updateThwompAI(enemy);
      }
      this.applyEnemyGravity(enemy);
      this.handleEnemyVerticalCollision(enemy);
      if (enemy.type !== 'thwomp') {
        this.handleEnemyHorizontalPatrol(enemy);
      }
      this.checkEnemyBounds(enemy);"""
    
    content = content[:match.start()] + new_update_enemies + content[match.end():]

# 2. Modify applyEnemyGravity
old_gravity = """  applyEnemyGravity(enemy) {
    enemy.vy += CONFIG.GRAVITY;
    if (enemy.vy > 12) enemy.vy = 12; // terminal velocity
  }"""
new_gravity = """  applyEnemyGravity(enemy) {
    if (enemy.type !== 'thwomp' || enemy.state === 'falling') {
      enemy.vy += (enemy.type === 'thwomp') ? CONFIG.GRAVITY * 1.5 : CONFIG.GRAVITY;
      if (enemy.vy > 15) enemy.vy = 15; // terminal velocity
    } else {
      enemy.vy = 0;
    }
  }"""
content = content.replace(old_gravity, new_gravity)

# 3. Add updateThwompAI to the class
thwomp_ai = """
  updateThwompAI(enemy) {
    if (!enemy.state) {
      enemy.state = 'idle';
      enemy.startY = enemy.y;
    }
    if (enemy.state === 'idle') {
      // Check if player is directly below
      const pxC = this.player.x + this.player.width / 2;
      const exC = enemy.x + enemy.width / 2;
      if (Math.abs(pxC - exC) < CONFIG.TILE_SIZE * 1.5 && this.player.y > enemy.y) {
        enemy.state = 'falling';
        enemy.shakeTimer = 0;
      }
    } else if (enemy.state === 'returning') {
      enemy.shakeTimer++;
      if (enemy.shakeTimer > 30) {
        enemy.y -= 2; // slow return
        if (enemy.y <= enemy.startY) {
          enemy.y = enemy.startY;
          enemy.state = 'idle';
        }
      }
    }
  }
"""

content = content.replace("  checkEnemyBounds(enemy) {", thwomp_ai + "\n  checkEnemyBounds(enemy) {")

# 4. Modify handleEnemyVerticalCollision to support thwomp effects and tramopline bounce
old_vert_col = """        if (enemy.vy > 0 && eBoxV.bottom > tileTop && (eBoxV.bottom - enemy.vy) <= tileTop) {
          enemy.y = tileTop - enemy.height;
          enemy.vy = 0;
          enemy.isGrounded = true;
          eBoxV.top = enemy.y;
          eBoxV.bottom = enemy.y + enemy.height;
        } else if (enemy.vy < 0 && eBoxV.top < tileBot && (eBoxV.top - enemy.vy) >= tileBot) {"""
new_vert_col = """        if (enemy.vy > 0 && eBoxV.bottom > tileTop && (eBoxV.bottom - enemy.vy) <= tileTop) {
          enemy.y = tileTop - enemy.height;
          enemy.vy = 0;
          enemy.isGrounded = true;
          
          if (enemy.type === 'thwomp' && enemy.state === 'falling') {
            enemy.state = 'returning';
            this.cameraShake = 15;
            if (audio.playBreakSound && !this.isSimulation) audio.playBreakSound();
            if (!this.isSimulation) {
              for(let i=0; i<10; i++){
                this.spawnLandDust(6);
              }
            }
          }
          
          if (tv === 2) {
            enemy.vy = -CONFIG.TRAMPOLINE_BOUNCE_FORCE * 0.85;
            enemy.isGrounded = false;
            if (!this.isSimulation) {
              audio.playBounceSound();
              this.bounceAnims.set(`${c},${r}`, { timer: 15 });
            }
          }
          
          eBoxV.top = enemy.y;
          eBoxV.bottom = enemy.y + enemy.height;
        } else if (enemy.vy < 0 && eBoxV.top < tileBot && (eBoxV.top - enemy.vy) >= tileBot) {"""
content = content.replace(old_vert_col, new_vert_col)

# 5. Modify handleEnemyHorizontalPatrol to support chaser logic
# I need to add chaser targeting before walking, and jumping on walls.
old_horiz = """  handleEnemyHorizontalPatrol(enemy) {
    if (enemy.isGrounded) {
      // Advance walk animation
      enemy.walkTimer++;"""
new_horiz = """  handleEnemyHorizontalPatrol(enemy) {
    if (enemy.isGrounded) {
      if (enemy.type === 'chaser') {
        if (this.player.x + this.player.width/2 < enemy.x + enemy.width/2) {
          enemy.vx = -enemy.speed;
          enemy.facing = 'left';
        } else {
          enemy.vx = enemy.speed;
          enemy.facing = 'right';
        }
      }

      // Advance walk animation
      enemy.walkTimer++;"""
content = content.replace(old_horiz, new_horiz)

old_horiz_left_wall = """        if (wallAhead || edgeAhead) {
          enemy.x = rightCol * CONFIG.TILE_SIZE - enemy.width;
          enemy.vx = -enemy.speed;
          enemy.facing = 'left';
        }"""
new_horiz_left_wall = """        if (wallAhead || edgeAhead) {
          enemy.x = rightCol * CONFIG.TILE_SIZE - enemy.width;
          if (enemy.type === 'chaser') {
            enemy.vy = -6; // Jump!
            enemy.isGrounded = false;
          } else {
            enemy.vx = -enemy.speed;
            enemy.facing = 'left';
          }
        }"""
content = content.replace(old_horiz_left_wall, new_horiz_left_wall)

old_horiz_right_wall = """        if (wallAhead || edgeAhead) {
          enemy.x = (leftCol + 1) * CONFIG.TILE_SIZE;
          enemy.vx = enemy.speed;
          enemy.facing = 'right';
        }"""
new_horiz_right_wall = """        if (wallAhead || edgeAhead) {
          enemy.x = (leftCol + 1) * CONFIG.TILE_SIZE;
          if (enemy.type === 'chaser') {
            enemy.vy = -6; // Jump!
            enemy.isGrounded = false;
          } else {
            enemy.vx = enemy.speed;
            enemy.facing = 'right';
          }
        }"""
content = content.replace(old_horiz_right_wall, new_horiz_right_wall)

old_horiz_edges = """      // Patrol range edges
      if (enemy.x <= enemy.patrolLeft) {"""
new_horiz_edges = """      // Patrol range edges
      if (enemy.type !== 'chaser') {
        if (enemy.x <= enemy.patrolLeft) {"""
content = content.replace(old_horiz_edges, new_horiz_edges)

# Fix the closing brace for the added if statement
old_horiz_end = """        enemy.vx = -enemy.speed;
        enemy.facing = 'left';
      }
    } else {"""
new_horiz_end = """        enemy.vx = -enemy.speed;
        enemy.facing = 'left';
      }
      }
    } else {"""
content = content.replace(old_horiz_end, new_horiz_end)


with open('src/engine.js', 'w') as f:
    f.write(content)

