const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new'
  });
  const page = await browser.newPage();
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.stack || err.toString());
  });
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR at', msg.location().url, 'line', msg.location().lineNumber, ':', msg.text());
    }
  });
  await page.goto('http://localhost:8085');
  await browser.close();
})();
