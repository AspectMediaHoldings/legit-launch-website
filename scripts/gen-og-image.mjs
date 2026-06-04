import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const templatePath = resolve(join(__dirname, '..', 'public', 'og-image-template.html'));
const outputPath = resolve(join(__dirname, '..', 'public', 'og-image.png'));

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.goto(`file:///${templatePath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle2', timeout: 15000 });

await page.screenshot({
  path: outputPath,
  type: 'png',
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});

await browser.close();
console.log('Generated: public/og-image.png');
