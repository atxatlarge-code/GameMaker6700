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
const levelName = levelArg ? levelArg.split('=')[1] : 'Mushroom Forest (Custom)';
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
      const CONFIG = {
        TILE_SIZE: 40,
        JUMP_FORCE: 11,
      };
      
      const goalX = e.level.goalPos.col * CONFIG.TILE_SIZE;
      const goalY = e.level.goalPos.row * CONFIG.TILE_SIZE;
      
      const startState = {
        x: e.player.x,
        y: e.player.y,
        vx: e.player.vx,
        vy: e.player.vy,
        isGrounded: e.player.isGrounded,
        facing: e.player.facing,
        isDead: e.isDead,
        deathTimer: e.deathTimer,
        portalCooldown: e.portalCooldown,
        hasWon: e.hasWon,
        path: []
      };
      
      const openSet = [startState];
      const visited = new Set();
      
      const getDiscretizedKey = (s) => {
        return `${Math.round(s.x / 5)},${Math.round(s.y / 5)},${Math.round(s.vx * 10)},${Math.round(s.vy * 10)}`;
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
      const maxIterations = 20000;
      
      const saveEngine = () => ({
        x: e.player.x,
        y: e.player.y,
        vx: e.player.vx,
        vy: e.player.vy,
        isGrounded: e.player.isGrounded,
        facing: e.player.facing,
        isDead: e.isDead,
        deathTimer: e.deathTimer,
        portalCooldown: e.portalCooldown,
        hasWon: e.hasWon
      });
      
      const restoreEngine = (s) => {
        e.player.x = s.x;
        e.player.y = s.y;
        e.player.vx = s.vx;
        e.player.vy = s.vy;
        e.player.isGrounded = s.isGrounded;
        e.player.facing = s.facing;
        e.isDead = s.isDead;
        e.deathTimer = s.deathTimer;
        e.portalCooldown = s.portalCooldown;
        e.hasWon = s.hasWon;
      };
      
      const originalState = saveEngine();
      let solution = null;
      
      while (openSet.length > 0 && iterations < maxIterations) {
        iterations++;
        
        openSet.sort((a, b) => {
          const fA = a.path.length * 5 + getHeuristic(a);
          const fB = b.path.length * 5 + getHeuristic(b);
          return fA - fB;
        });
        
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
          if (act.jump && e.player.isGrounded) {
            e.player.vy = -CONFIG.JUMP_FORCE;
            e.player.isGrounded = false;
          }
          
          for (let f = 0; f < 5; f++) {
            e.update();
            if (e.isDead || e.hasWon) break;
          }
          
          if (e.isDead) continue;
          
          const nextState = {
            x: e.player.x,
            y: e.player.y,
            vx: e.player.vx,
            vy: e.player.vy,
            isGrounded: e.player.isGrounded,
            facing: e.player.facing,
            isDead: e.isDead,
            deathTimer: e.deathTimer,
            portalCooldown: e.portalCooldown,
            hasWon: e.hasWon,
            path: [...curr.path, act]
          };
          
          const nextKey = getDiscretizedKey(nextState);
          if (!visited.has(nextKey)) {
            openSet.push(nextState);
          }
        }
      }
      
      restoreEngine(originalState);
      
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

      if (!e.originalUpdate) {
        e.originalUpdate = e.update;
      }

      e.update = function() {
        if (this.autoplayPath && this.autoplayIndex < this.autoplayPath.length) {
          const act = this.autoplayPath[this.autoplayIndex];
          this.keys.left = act.left;
          this.keys.right = act.right;

          if (act.jump && this.player.isGrounded) {
            this.player.vy = -11; // JUMP_FORCE
            this.player.isGrounded = false;
          }

          this.autoplayFrameCount++;
          if (this.autoplayFrameCount >= 5) {
            this.autoplayFrameCount = 0;
            this.autoplayIndex++;
          }
        } else {
          this.keys.left = false;
          this.keys.right = false;
        }
        this.originalUpdate();
      };
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
