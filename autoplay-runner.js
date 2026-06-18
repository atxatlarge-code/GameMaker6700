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
const levelName = levelArg ? levelArg.split('=')[1] : 'Mushroom Forest';
const headful = args.includes('--headful');

async function run() {
  console.log(`Starting autoplay for level: "${levelName}"...`);
  
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR);
    console.log(`Created directory: ${SCREENSHOT_DIR}`);
  } else {
    // Clear old screenshots
    fs.readdirSync(SCREENSHOT_DIR).forEach(file => {
      if (file.endsWith('.png')) {
        fs.unlinkSync(path.join(SCREENSHOT_DIR, file));
      }
    });
    console.log('Cleared previous screenshots.');
  }

  // Launch browser
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: !headful,
    defaultViewport: { width: 1200, height: 800 }
  });

  const page = await browser.newPage();
  
  try {
    console.log(`Navigating to http://localhost:${PORT}...`);
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => {
    console.error('BROWSER ERROR:', err.message);
    console.error(err.stack);
  });
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

    // Check if custom_levels.json exists locally and inject it into localStorage
    const localLevelsPath = path.join(__dirname, 'custom_levels.json');
    if (fs.existsSync(localLevelsPath)) {
      console.log('Found local custom_levels.json, injecting into browser localStorage...');
      const localLevelsData = fs.readFileSync(localLevelsPath, 'utf8');
      await page.evaluate((data) => {
        localStorage.setItem('gm6700_custom_levels', data);
      }, localLevelsData);
    }
    
    // Wait for the game engine to be initialized on the window
    await page.waitForFunction(() => typeof window.engine !== 'undefined', { timeout: 10000 });
    console.log('Game engine found!');

    // Load the target level
    const loadResult = await page.evaluate((targetName) => {
      const e = window.engine;
      // Get all custom and preset levels
      const customStored = localStorage.getItem('gm6700_custom_levels');
      let allLevels = [];
      if (customStored) {
        allLevels = JSON.parse(customStored);
      }
      
      // We can't access LevelManager directly, but we can look for the cartridge names in the DOM or select level
      // Let's search inside localStorage custom levels first
      let levelToLoad = allLevels.find(l => l.name === targetName);
      
      if (!levelToLoad) {
        // If not found in custom, let's search if engine has a loaded level or check levels by name in DOM
        const carts = Array.from(document.querySelectorAll('.mini-cartridge'));
        const targetCart = carts.find(c => {
          const bottom = c.querySelector('.mini-bottom');
          return bottom && bottom.textContent.toLowerCase() === targetName.toLowerCase();
        });
        if (targetCart) {
          targetCart.click();
          const btnPlay = document.getElementById('btn-menu-play');
          if (btnPlay) btnPlay.click();
          return { success: true, message: `Loaded level "${targetName}" via menu click.` };
        }
        return { success: false, message: `Level "${targetName}" not found.` };
      }

      e.level.load(levelToLoad);
      e.setMode('play');
      document.getElementById('win-overlay').classList.add('hidden');
      // Hide menu and show game view
      document.getElementById('menu-view').classList.add('hidden');
      document.getElementById('editor-view').classList.remove('hidden');
      e.start();
      
      return { success: true, message: `Loaded custom level "${targetName}" from localStorage directly.` };
    }, levelName);

    console.log(loadResult.message);
    if (!loadResult.success) {
      await browser.close();
      process.exit(1);
    }

    // Give the engine a frame to initialize play state
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('Running pathfinder solver in the browser...');
    const solverResult = await page.evaluate(() => {
      const e = window.engine;
      
      // Helper for binary search insertion to maintain sorted order in A* open set
      function insertSorted(array, item, compareFn) {
        let low = 0;
        let high = array.length;
        while (low < high) {
          const mid = (low + high) >>> 1;
          if (compareFn(array[mid], item) < 0) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        array.splice(low, 0, item);
      }

      const CONFIG = {
        TILE_SIZE: 40,
        JUMP_FORCE: 11,
        JUMP_BUFFER: 5
      };
      
      // Reset player position so they start from the spawn point visually and simulation-wise
      e.resetPlayer();
      e.hasWon = false;
      e.isDead = false;

      const goalX = e.level.goalPos.col * CONFIG.TILE_SIZE;
      const goalY = e.level.goalPos.row * CONFIG.TILE_SIZE;
      
      // Temporarily initialize live enemies for the simulation if they aren't already initialized
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

      const saveEngine = () => ({
        player: { ...e.player, grappleHook: e.player.grappleHook ? { ...e.player.grappleHook } : null },
        isDead: e.isDead,
        deathTimer: e.deathTimer,
        portalCooldown: e.portalCooldown,
        hasWon: e.hasWon,
        enemies: e.liveEnemies.map(en => ({ ...en })),
        // ⚡ Bolt: Fast 2D array cloning instead of expensive JSON serialization
        playGrid: e.playGrid ? e.playGrid.map(row => row.slice()) : null,
        coinsCollected: e.coinsCollected
      });
      
      const restoreEngine = (s) => {
        Object.assign(e.player, s.player);
        if (s.player.grappleHook) {
          e.player.grappleHook = { ...s.player.grappleHook };
        } else {
          e.player.grappleHook = null;
        }
        
        e.isDead = s.isDead;
        e.deathTimer = s.deathTimer;
        e.portalCooldown = s.portalCooldown;
        e.hasWon = s.hasWon;
        e.liveEnemies = s.enemies.map(en => ({ ...en }));
        e.playGrid = s.playGrid ? s.playGrid.map(row => row.slice()) : null;
        e.coinsCollected = s.coinsCollected;
      };
      
      const originalMode = e.mode;
      const originalAutoplay = e.isAutoplay;
      const originalIsSimulation = e.isSimulation;

      e.mode = 'play';
      e.isAutoplay = false;
      e.isSimulation = true;

      const startState = {
        ...saveEngine(),
        path: []
      };
      
      const openSet = [startState];
      const visited = new Set();
      
      const getDiscretizedKey = (s) => {
        const playerPart = `${Math.round(s.player.x / 5)},${Math.round(s.player.y / 5)},${Math.round(s.player.vx * 2)},${Math.round(s.player.vy * 2)},${s.player.isGrounded ? 1 : 0},${s.player.coyoteTimer > 0 ? 1 : 0},${s.player.jumpBufferTimer > 0 ? 1 : 0}`;
        const enemyPart = s.enemies.map(en => `${Math.round(en.x / 10)},${Math.round(en.y / 10)}`).join('|');
        return `${playerPart}|${enemyPart}`;
      };
      
      const getHeuristic = (s) => {
        const dx = goalX - s.player.x;
        const dy = goalY - s.player.y;
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
      const maxIterations = 200000;
      
      const originalState = saveEngine();
      let solution = null;
      
      while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;
        
        const curr = openSet.shift();
        
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
          e.keys.up = act.jump;
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
            insertSorted(openSet, nextState, (a, b) => {
              const fA = a.path.length * 5 + getHeuristic(a);
              const fB = b.path.length * 5 + getHeuristic(b);
              return fA - fB;
            });
          }
        }
      }
      
      restoreEngine(originalState);
      e.liveEnemies = originalEnemies;
      e.mode = originalMode;
      e.isAutoplay = originalAutoplay;
      e.isSimulation = originalIsSimulation;
      
      return {
        success: solution !== null,
        iterations,
        pathLength: solution ? solution.length : 0,
        path: solution
      };
    });

    if (!solverResult.success) {
      console.error(`Pathfinder failed after ${solverResult.iterations} iterations.`);
      await browser.close();
      process.exit(1);
    }

    console.log(`Pathfinder succeeded! Iterations: ${solverResult.iterations}, Path Length: ${solverResult.pathLength} actions (approx. ${(solverResult.pathLength * 5 / 60).toFixed(2)}s)`);

    // Hook the action path into the running engine for real-time play playback
    await page.evaluate((solutionPath) => {
      const e = window.engine;
      e.resetPlayer();
      e.hasWon = false;
      document.getElementById('win-overlay').classList.add('hidden');

      e.autoplayPath = solutionPath;
      e.autoplayIndex = 0;
      e.autoplayFrameCount = 0;
      e.isAutoplay = true;

      if (e.originalUpdate) {
        e.update = e.originalUpdate;
      }
    }, solverResult.path);

    console.log('Starting playback and capturing screenshots...');

    // Take screenshots at 0%, 25%, 50%, 75%, and 100% of the path length
    const totalActions = solverResult.pathLength;
    const targets = [
      { pct: 0, index: 0, name: 'step_0_spawn.png' },
      { pct: 25, index: Math.floor(totalActions * 0.25), name: 'step_1_quarter.png' },
      { pct: 50, index: Math.floor(totalActions * 0.50), name: 'step_2_half.png' },
      { pct: 75, index: Math.floor(totalActions * 0.75), name: 'step_3_three_quarters.png' }
    ];

    for (const target of targets) {
      // Wait until the engine's autoplayIndex reaches target.index
      await page.waitForFunction((idx) => {
        return window.engine.autoplayIndex >= idx;
      }, { timeout: 15000 }, target.index);

      const pState = await page.evaluate(() => ({
        x: window.engine.player.x,
        y: window.engine.player.y,
        vx: window.engine.player.vx,
        vy: window.engine.player.vy
      }));

      const filePath = path.join(SCREENSHOT_DIR, target.name);
      await page.screenshot({ path: filePath });
      console.log(`[${target.pct}%] Captured screenshot: ${target.name} at player position (${pState.x.toFixed(1)}, ${pState.y.toFixed(1)})`);
    }

    // Wait for the victory overlay to show (win condition reached)
    console.log('Waiting for victory screen...');
    await page.waitForFunction(() => window.engine.hasWon === true, { timeout: 15000 });
    
    // Capture final victory screenshot
    const victoryPath = path.join(SCREENSHOT_DIR, 'step_4_victory.png');
    await page.screenshot({ path: victoryPath });
    console.log('[100%] Captured victory screenshot: step_4_victory.png');

    console.log('\nAutoplay completed successfully! All screenshots saved in ./screenshots_autoplay/');

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await browser.close();
  }
}

run();
