const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Configuration
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8085;
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots_autoplay');

// Parse CLI Arguments
const args = process.argv.slice(2);
const levelArg = args.find(a => a.startsWith('--level='));
const levelName = levelArg ? levelArg.split('=')[1] : 'Sky Climb';
const headful = args.includes('--headful');

async function run() {
  console.log(`=== STARTING AGENT EDITOR ===`);
  console.log(`Level: "${levelName}"`);
  console.log(`Headful: ${headful}`);
  
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR);
    console.log(`Created directory: ${SCREENSHOT_DIR}`);
  }

  // Launch browser
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: !headful,
    defaultViewport: { width: 1200, height: 800 }
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  try {
    console.log(`Navigating to http://localhost:${PORT}...`);
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Check if custom_levels.json exists locally and inject it into localStorage
    const localLevelsPath = path.join(__dirname, 'custom_levels.json');
    if (fs.existsSync(localLevelsPath)) {
      console.log('Found local custom_levels.json, injecting into browser localStorage...');
      const localLevelsData = fs.readFileSync(localLevelsPath, 'utf8');
      await page.evaluate((data) => {
        localStorage.setItem('gm6700_custom_levels', data);
      }, localLevelsData);
    }

    await page.waitForFunction(() => typeof window.engine !== 'undefined', { timeout: 10000 });
    console.log('Game engine found!');
    
    // Give the page a moment to attach all event listeners
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Load the target level
    const loadResult = await page.evaluate((targetName) => {
      const e = window.engine;
      const carts = Array.from(document.querySelectorAll('.mini-cartridge'));
      const targetCart = carts.find(c => {
        const bottom = c.querySelector('.mini-bottom');
        return bottom && bottom.textContent.toLowerCase() === targetName.toLowerCase();
      });
      if (targetCart) {
        targetCart.click();
        const btnEdit = document.getElementById('btn-menu-edit');
        if (btnEdit) btnEdit.click();
        return { success: true, message: `Loaded level "${targetName}" into editor.` };
      }
      return { success: false, message: `Level "${targetName}" not found.` };
    }, levelName);

    if (!loadResult.success) {
      console.log(loadResult.message);
      await browser.close();
      return;
    }
    console.log(loadResult.message);

    // Wait a bit for editor UI to show
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Helper for clicking coordinates on canvas
    const clickCanvas = async (col, row) => {
      // Align/scroll camera so the target tile is visible and centered on canvas
      await page.evaluate((c, r) => {
        const e = window.engine;
        const targetCamX = Math.max(0, Math.min(60 * 40 - 1200, c * 40 - 600));
        const targetCamY = Math.max(0, Math.min(30 * 40 - 600, r * 40 - 300));
        e.camera.x = targetCamX;
        e.camera.y = targetCamY;
      }, col, row);

      await new Promise(resolve => setTimeout(resolve, 100));

      const cam = await page.evaluate(() => ({
        x: window.engine.camera.x,
        y: window.engine.camera.y
      }));

      const canvas = await page.$('#game-canvas');
      const box = await canvas.boundingBox();

      // Convert grid col/row to local canvas coordinates
      const localX = col * 40 + 20 - cam.x;
      const localY = row * 40 + 20 - cam.y;

      const clickX = box.x + localX;
      const clickY = box.y + localY;

      await page.mouse.move(clickX, clickY);
      await page.mouse.down();
      await page.mouse.up();
      console.log(`[Editor] Clicked canvas at grid (${col}, ${row}) -> viewport (${Math.round(clickX)}, ${Math.round(clickY)})`);
    };

    let editCount = 0;
    const maxEdits = 15;
    let solved = false;
    let solutionPath = null;

    // Capture initial state
    const initialScreenshotPath = path.join(SCREENSHOT_DIR, 'edit_step_0.png');
    await page.screenshot({ path: initialScreenshotPath });
    console.log('Saved initial state screenshot: edit_step_0.png');

    while (editCount < maxEdits && !solved) {
      console.log(`\n--- Loop Iteration ${editCount + 1} ---`);
      console.log('Running A* pathfinder simulation inside the browser...');

      const solverResult = await page.evaluate(() => {
        const e = window.engine;
        
        class MinHeap {
          constructor(scoreFn) {
            this.heap = [];
            this.scoreFn = scoreFn;
          }
          push(val) {
            this.heap.push(val);
            this.bubbleUp(this.heap.length - 1);
          }
          pop() {
            if (this.heap.length === 0) return null;
            const top = this.heap[0];
            const bottom = this.heap.pop();
            if (this.heap.length > 0) {
              this.heap[0] = bottom;
              this.sinkDown(0);
            }
            return top;
          }
          bubbleUp(n) {
            const el = this.heap[n];
            const score = this.scoreFn(el);
            while (n > 0) {
              const parentN = Math.floor((n + 1) / 2) - 1;
              const parent = this.heap[parentN];
              if (score >= this.scoreFn(parent)) break;
              this.heap[parentN] = el;
              this.heap[n] = parent;
              n = parentN;
            }
          }
          sinkDown(n) {
            const length = this.heap.length;
            const el = this.heap[n];
            const elScore = this.scoreFn(el);
            while (true) {
              const child2N = (n + 1) * 2;
              const child1N = child2N - 1;
              let swap = null;
              let child1Score;
              if (child1N < length) {
                const child1 = this.heap[child1N];
                child1Score = this.scoreFn(child1);
                if (child1Score < elScore) swap = child1N;
              }
              if (child2N < length) {
                const child2 = this.heap[child2N];
                const child2Score = this.scoreFn(child2);
                if (child2Score < (swap == null ? elScore : child1Score)) swap = child2N;
              }
              if (swap == null) break;
              this.heap[n] = this.heap[swap];
              this.heap[swap] = el;
              n = swap;
            }
          }
          get length() { return this.heap.length; }
        }

        const CONFIG = {
          TILE_SIZE: 40,
          JUMP_FORCE: 11,
          JUMP_BUFFER: 5
        };
        
        e.resetPlayer();
        e.hasWon = false;
        e.isDead = false;

        const goalX = e.level.goalPos.col * CONFIG.TILE_SIZE;
        const goalY = e.level.goalPos.row * CONFIG.TILE_SIZE;
        
        // Backup original enemy state and set live simulation enemies
        const originalEnemies = e.liveEnemies;
        e.liveEnemies = e.level.enemies ? e.level.enemies.map(en => ({
          id: en.id,
          x: en.col * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - 32) / 2,
          y: en.row * CONFIG.TILE_SIZE + (CONFIG.TILE_SIZE - 38),
          width: 32,
          height: 38,
          vx: en.speed,
          vy: 0,
          isGrounded: false,
          speed: en.speed,
          patrolLeft: (en.col - en.patrolRange) * CONFIG.TILE_SIZE,
          patrolRight: (en.col + en.patrolRange) * CONFIG.TILE_SIZE,
          facing: 'right',
          walkFrame: 0,
          walkTimer: 0,
        })) : [];

        const hasCoins = e.level.grid.some(row => row.includes(5));
        const saveEngine = () => ({
          x: e.player.x,
          y: e.player.y,
          vx: e.player.vx,
          vy: e.player.vy,
          isGrounded: e.player.isGrounded,
          facing: e.player.facing,
          coyoteTimer: e.player.coyoteTimer,
          jumpBufferTimer: e.player.jumpBufferTimer,
          isDead: e.isDead,
          deathTimer: e.deathTimer,
          portalCooldown: e.portalCooldown,
          hasWon: e.hasWon,
          enemies: e.liveEnemies.map(en => ({ ...en })),
          playGrid: (hasCoins && e.playGrid) ? e.playGrid.map(row => row.slice()) : null,
          coinsCollected: e.coinsCollected,
          isWallClinging: e.player.isWallClinging,
          wallJumpLockTimer: e.player.wallJumpLockTimer
        });
        
        const restoreEngine = (s) => {
          e.player.x = s.x;
          e.player.y = s.y;
          e.player.vx = s.vx;
          e.player.vy = s.vy;
          e.player.isGrounded = s.isGrounded;
          e.player.facing = s.facing;
          e.player.coyoteTimer = s.coyoteTimer;
          e.player.jumpBufferTimer = s.jumpBufferTimer;
          e.isDead = s.isDead;
          e.deathTimer = s.deathTimer;
          e.portalCooldown = s.portalCooldown;
          e.hasWon = s.hasWon;
          e.liveEnemies = s.enemies.map(se => ({ ...se }));
          if (hasCoins && s.playGrid) {
            e.playGrid = s.playGrid.map(row => row.slice());
          }
          e.coinsCollected = s.coinsCollected;
          e.player.isWallClinging = s.isWallClinging;
          e.player.wallJumpLockTimer = s.wallJumpLockTimer;
        };
        
        const originalMode = e.mode;
        const originalAutoplay = e.isAutoplay;
        const originalIsSimulation = e.isSimulation;

        e.mode = 'play';
        e.isAutoplay = false;
        e.isSimulation = true;

        const originalState = saveEngine();
        const startState = {
          ...originalState,
          path: []
        };
        
        const openSet = new MinHeap(a => a.path.length * 15 + getHeuristic(a));
        openSet.push(startState);
        const visited = new Set();
        const explored = [];
        
        const getDiscretizedKey = (s) => {
          const playerPart = `${Math.round(s.x / 5)},${Math.round(s.y / 5)},${Math.round(s.vx * 2)},${Math.round(s.vy * 2)},${s.isGrounded ? 1 : 0},${s.coyoteTimer || 0},${s.jumpBufferTimer || 0},${s.isWallClinging ? 1 : 0},${s.wallJumpLockTimer || 0}`;
          const enemyPart = s.enemies.map(en => `${Math.round(en.x / 10)},${Math.round(en.y / 10)}`).join('|');
          return `${playerPart}|${enemyPart}`;
        };
        
        const getHeuristic = (s) => {
          const dx = goalX - s.x;
          const dy = goalY - s.y;
          return Math.sqrt(dx * dx + dy * dy);
        };
        
        const actions = [
          { right: true, left: false, jump: false },
          { right: true, left: false, jump: true },
          { right: false, left: true, jump: false },
          { right: false, left: true, jump: true },
          { right: false, left: false, jump: false },
          { right: false, left: false, jump: true }
        ];
        
        let iterations = 0;
        const maxIterations = 10000;
        let solution = null;
        let bestState = startState;
        let minDistance = getHeuristic(startState);
        
        while (openSet.length > 0 && iterations < maxIterations) {
          iterations++;
          const curr = openSet.pop();
          
          const dist = getHeuristic(curr);
          if (dist < minDistance) {
            minDistance = dist;
            bestState = curr;
          }
          
           explored.push({
            x: curr.x,
            y: curr.y,
            distance: dist,
            pathLength: curr.path.length
          });
          
          if (curr.hasWon) {
            solution = curr.path;
            break;
          }
          
          const key = getDiscretizedKey(curr);
          if (visited.has(key)) continue;
          visited.add(key);
          
          for (const act of actions) {
            restoreEngine(curr);
            e.keys.left = act.left;
            e.keys.right = act.right;
            if (act.jump) {
              e.player.jumpBufferTimer = CONFIG.JUMP_BUFFER;
            }
            
            for (let f = 0; f < 5; f++) {
              e.update();
              if (e.isDead || e.hasWon) break;
            }
            
            if (e.isDead) continue;
            
            const nextState = {
              ...saveEngine(),
              path: [...curr.path, act]
            };
            
            const nextKey = getDiscretizedKey(nextState);
            if (!visited.has(nextKey)) {
              openSet.push(nextState);
            }
          }
        }
        
        restoreEngine(originalState);
        e.liveEnemies = originalEnemies;
        e.mode = originalMode;
        e.isAutoplay = originalAutoplay;
        e.isSimulation = originalIsSimulation;
        
        if (solution) {
          return {
            success: true,
            iterations,
            pathLength: solution.length,
            path: solution
          };
        } else {
          // Sort explored by progress score (prioritizing height if goal is higher)
          const goalIsHigher = e.level.goalPos.row < e.level.playerSpawn.row;
          const getScore = (s) => {
            if (goalIsHigher) {
              return s.y * 1000 - s.pathLength;
            }
            return s.distance;
          };
          explored.sort((a, b) => getScore(a) - getScore(b));
          
          const uniqueExplored = [];
          const seenCells = new Set();
          for (const s of explored) {
            const col = Math.round(s.x / 40);
            const row = Math.round(s.y / 40);
            const cellKey = `${col},${row}`;
            if (!seenCells.has(cellKey)) {
              seenCells.add(cellKey);
              uniqueExplored.push(s);
            }
          }
          
          return {
            success: false,
            iterations,
            explored: uniqueExplored.slice(0, 150)
          };
        }
      });

      if (solverResult.success) {
        console.log(`✅ Pathfinder succeeded in iteration ${editCount + 1}! Iterations: ${solverResult.iterations}, Path Length: ${solverResult.pathLength}`);
        solved = true;
        solutionPath = solverResult.path;
      } else {
        console.log(`❌ Pathfinder failed after ${solverResult.iterations} iterations.`);
        console.log("Top 5 explored states:", JSON.stringify(solverResult.explored.slice(0, 5), null, 2));
        
        // Find best position to place trampoline
        const targetTile = await page.evaluate((exploredStates) => {
          const e = window.engine;
          let tile = null;
          
          for (const state of exploredStates) {
            const col = Math.round(state.x / 40);
            const playerHeight = e.player.height || 38;
            const row = Math.floor((state.y + playerHeight) / 40);
            
            if (col < 0 || col >= 60 || row < 0 || row >= 30) continue;
            
            // Find the solid ground below the peak
            let groundRow = row;
            while (groundRow < 30 && e.level.grid[groundRow][col] === 0) {
              groundRow++;
            }
            
            let foundRow = row;
            const tileVal = groundRow < 30 ? e.level.grid[groundRow][col] : 0;
            const isSolid = tileVal === 1 || tileVal === 6 || tileVal === 7;
            if (isSolid) {
              // Place on top of solid ground
              foundRow = groundRow - 1;
            } else {
              // Place in mid-air below the peak
              foundRow = Math.min(27, row + 1);
            }
            
            if (foundRow < 0 || foundRow >= 30) continue;
            
            // If the calculated tile is occupied, go up
            if (e.level.grid[foundRow][col] !== 0 && e.level.grid[foundRow][col] !== 2) {
              while (foundRow >= 0 && e.level.grid[foundRow][col] !== 0) {
                foundRow--;
              }
            }
            
            if (foundRow >= 0) {
              // Ensure we don't place a trampoline close to another trampoline (horizontally or vertically)
              let hasTrampolineNearby = false;
              for (let c = Math.max(0, col - 3); c <= Math.min(59, col + 3); c++) {
                for (let r = Math.max(0, foundRow - 6); r <= Math.min(29, foundRow + 6); r++) {
                  if (e.level.grid[r][c] === 2) {
                    hasTrampolineNearby = true;
                    break;
                  }
                }
                if (hasTrampolineNearby) break;
              }
              if (hasTrampolineNearby) continue;
              
              tile = { col, row: foundRow };
              break;
            }
          }
          return tile;
        }, solverResult.explored);

        if (!targetTile) {
          console.log("Could not find a valid tile to place a trampoline. Stopping editing loop.");
          break;
        }

        console.log(`[Agent Editor] Placing trampoline at col ${targetTile.col}, row ${targetTile.row}`);
        
        // Select the trampoline tool in Edit Mode
        await page.evaluate(() => {
          const btn = document.querySelector('[data-tool="trampoline"]');
          if (btn) btn.click();
        });
        
        // Place the trampoline by clicking the canvas
        await clickCanvas(targetTile.col, targetTile.row);
        
        editCount++;
        
        // Capture screenshot of the edit
        const editScreenshotPath = path.join(SCREENSHOT_DIR, `edit_step_${editCount}.png`);
        await page.screenshot({ path: editScreenshotPath });
        console.log(`Saved screenshot: edit_step_${editCount}.png`);
        
        // Give UI a moment
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    if (solved && solutionPath) {
      console.log(`\n🎉 Level "${levelName}" successfully solved within ${editCount} edits!`);
    } else {
      console.log(`❌ Could not solve level "${levelName}" within ${maxEdits} edits.`);
    }

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
    console.log(`=== AGENT EDITOR COMPLETE ===`);
  }
}

run();
