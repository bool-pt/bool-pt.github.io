import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PAGES = [
  { path: '/contacts', name: 'contacts' },
  { path: '/about', name: 'about' },
  { path: '/services', name: 'services' },
  { path: '/people', name: 'people' },
  { path: '/portfolio', name: 'portfolio' },
  { path: '/blog', name: 'blog' },
];

const BASE_URL = 'http://localhost:4321';
const OUT_DIR = join(__dirname, 'screenshots');

mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch();

  for (const { path, name } of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    console.log(`Screenshotting ${path}...`);
    await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: 30_000 });
    // Disable content-visibility so all sections render for screenshot
    await page.evaluate(() => {
      document.querySelectorAll('*').forEach((el) => {
        el.style.contentVisibility = 'visible';
      });
    });
    // Scroll to bottom to trigger any lazy loading, then back to top
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 500;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }
        }, 50);
      });
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: join(OUT_DIR, `${name}.png`),
      fullPage: true,
    });
    await page.close();
    console.log(`  ✓ ${name}.png`);
  }

  await browser.close();
  console.log('\nAll screenshots saved to tooling/scripts/screenshots/');
}

run().catch(console.error);
