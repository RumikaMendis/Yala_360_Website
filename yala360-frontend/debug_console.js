import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error')
      console.log(`ERROR: ${msg.text()}`);
    else
      console.log(`LOG: ${msg.text()}`);
  });
  page.on('pageerror', error => {
    console.log(`PAGE EXCEPTION: ${error.message}`);
  });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await browser.close();
})();
