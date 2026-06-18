import puppeteer from 'puppeteer-core';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  const delay = ms => new Promise(res => setTimeout(res, ms));
  
  await page.goto('http://localhost:8085');
  await delay(1000);
  
  // Enter play mode
  await page.click('#btn-play');
  await delay(500);
  
  // Press Right arrow for a bit to move fast and generate trails
  await page.keyboard.down('ArrowRight');
  await delay(200);
  await page.keyboard.down('ArrowUp');
  await delay(100);
  await page.keyboard.up('ArrowUp');
  await delay(200);
  
  await page.screenshot({ path: 'test_play.png' });
  console.log('Saved screenshot test_play.png');
  
  await page.keyboard.up('ArrowRight');
  await browser.close();
})();
