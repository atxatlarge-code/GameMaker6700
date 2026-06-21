const puppeteer = require('puppeteer-core');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:8085', { waitUntil: 'networkidle2' });
  
  const levels = await page.evaluate(() => {
    return window.LevelManager ? window.LevelManager.getLevels().map(l => l.name) : 'LevelManager not found';
  });
  
  console.log('Levels loaded:', levels);
  await browser.close();
})();
