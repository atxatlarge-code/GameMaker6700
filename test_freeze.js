const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:8000');
  await page.waitForSelector('#btn-demo-transition');
  console.log('Clicking demo button...');
  await page.click('#btn-demo-transition');
  await page.waitForTimeout(2000);
  console.log('Done.');
  await browser.close();
})();
