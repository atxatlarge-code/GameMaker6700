const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Configuration
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8085;

// Parse CLI Arguments
const args = process.argv.slice(2);
const levelArg = args.find(a => a.startsWith('--level='));
const levelName = levelArg ? levelArg.split('=')[1] : 'The Gauntlet';
const headful = args.includes('--headful');

async function run() {
  console.log(`Starting Chaos Bot (Fuzzer) on level: "${levelName}"...`);

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
    
    let engineCrashed = false;
    page.on('pageerror', err => {
      console.error('\n[CRITICAL BROWSER ERROR CAUGHT BY CHAOS BOT]');
      console.error(err.message);
      engineCrashed = true;
    });

    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle2' });

    // Inject custom levels
    const localLevelsPath = path.join(__dirname, 'custom_levels.json');
    if (fs.existsSync(localLevelsPath)) {
      const localLevelsData = fs.readFileSync(localLevelsPath, 'utf8');
      await page.evaluate((data) => {
        localStorage.setItem('gm6700_custom_levels', data);
      }, localLevelsData);
    }
    
    // Wait for engine
    await page.waitForFunction(() => typeof window.engine !== 'undefined', { timeout: 10000 });

    // Load level
    const loadResult = await page.evaluate((targetName) => {
      const e = window.engine;
      const customStored = localStorage.getItem('gm6700_custom_levels');
      let allLevels = customStored ? JSON.parse(customStored) : [];
      let levelToLoad = allLevels.find(l => l.name === targetName);
      
      if (!levelToLoad) {
        return { success: false, message: `Level "${targetName}" not found.` };
      }

      e.level.load(levelToLoad);
      e.setMode('play');
      document.getElementById('win-overlay').classList.add('hidden');
      document.getElementById('menu-view').classList.add('hidden');
      document.getElementById('editor-view').classList.remove('hidden');
      e.start();
      
      return { success: true, message: `Loaded level "${targetName}".` };
    }, levelName);

    console.log(loadResult.message);
    if (!loadResult.success) {
      await browser.close();
      process.exit(1);
    }

    console.log('Fuzzing engine inputs...');

    const fuzzResult = await page.evaluate(async () => {
      const e = window.engine;
      
      return new Promise((resolve) => {
        let frameCount = 0;
        const maxFrames = 5000;
        let originalUpdate = e.update.bind(e);
        
        e.update = function() {
          // Chaos Logic: Randomize inputs every frame
          e.keys.left = Math.random() > 0.5;
          e.keys.right = Math.random() > 0.5;
          e.keys.up = Math.random() > 0.8; // jump 20% of the time
          
          if (Math.random() > 0.99) {
            // 1% chance to reset player (simulates death or panic restart)
            e.resetPlayer();
          }

          try {
            originalUpdate();
          } catch (err) {
            resolve({ success: false, error: err.message, frames: frameCount });
            return;
          }

          frameCount++;
          if (frameCount >= maxFrames) {
            e.update = originalUpdate; // restore
            resolve({ success: true, frames: frameCount });
          }
        };
      });
    });

    if (engineCrashed || !fuzzResult.success) {
      console.error(`\nCHAOS BOT FAILED: Engine crashed after ${fuzzResult ? fuzzResult.frames : '?'} frames.`);
      process.exit(1);
    } else {
      console.log(`\nCHAOS BOT SUCCESS: Engine survived ${fuzzResult.frames} frames of randomized fuzzing without crashing!`);
    }

  } catch (err) {
    console.error('Execution Error:', err);
  } finally {
    await browser.close();
  }
}

run();
