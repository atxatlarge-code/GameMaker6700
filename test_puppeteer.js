import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Expose a function to get console logs
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  await page.goto('file:///Users/jaketrigg/Projects/GameMaker6700/index.html');
  
  // Wait for game to load
  await page.waitForTimeout(1000);
  
  // Start game
  await page.evaluate(() => {
    document.getElementById('btnPlay').click();
  });
  
  await page.waitForTimeout(500);
  
  // Inspect enemy state
  const state = await page.evaluate(() => {
    if (!window.engine) return 'No engine';
    if (!window.engine.liveEnemies[0]) return 'No enemies';
    const e = window.engine.liveEnemies[0];
    return `Enemy 0: x=${e.x}, y=${e.y}, vx=${e.vx}, vy=${e.vy}, grounded=${e.isGrounded}, type=${e.type}, width=${e.width}`;
  });
  
  console.log(state);
  
  // Inspect collision check
  const overlap = await page.evaluate(() => {
    const p = window.engine.player;
    const e = window.engine.liveEnemies[0];
    const inset = 4;
    const playerBox = {
      left: p.x + inset, right: p.x + p.width - inset,
      top: p.y + inset, bottom: p.y + p.height - inset,
    };
    const eBox = {
      left: e.x + inset, right: e.x + e.width - inset,
      top: e.y + inset, bottom: e.y + e.height - inset,
    };
    const overlapping = !(
      playerBox.right < eBox.left ||
      playerBox.left > eBox.right ||
      playerBox.bottom < eBox.top ||
      playerBox.top > eBox.bottom
    );
    return `Overlap=${overlapping}, pBox=${JSON.stringify(playerBox)}, eBox=${JSON.stringify(eBox)}`;
  });
  
  console.log(overlap);
  
  await browser.close();
})();
