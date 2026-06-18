import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  await page.goto('http://localhost:8085');
  const delay = ms => new Promise(res => setTimeout(res, ms));
  
  await delay(1000);
  
  // Click the player button group to open popup
  await page.click('#img-group-player');
  await delay(500);
  
  // Click the classic player tool
  await page.click('[data-tool="player_classic"]');
  await delay(500);
  
  // Click on the canvas at some grid position
  const canvas = await page.$('#game-canvas');
  const box = await canvas.boundingBox();
  // Click near the middle of the canvas
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await delay(500);
  
  await page.screenshot({ path: 'test_place.png' });
  console.log('Test completed, saved screenshot to test_place.png');
  await browser.close();
})();
