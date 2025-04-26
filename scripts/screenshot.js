
const { chromium } = require('playwright');
import fs from 'fs';

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + process.cwd() + '/public/dashboard.html', { waitUntil: 'networkidle' });

  await page.screenshot({ path: 'public/dashboard.png', fullPage: true });
  await page.pdf({ path: 'public/dashboard.pdf', format: 'A4' });

  console.log('Screenshot and PDF saved to public/');
  await browser.close();
}

run();
