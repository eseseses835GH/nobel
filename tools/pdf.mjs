// ייצוא PDF גיבוי: npm run pdf  →  ai-lecture.pdf
// עמוד אחד לכל שקף, במצב "אחרי כל החשיפות". הערות הדובר לא נכללות (PDF_NOTES=1 כדי לכלול).
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const root = new URL('..', import.meta.url).pathname;
const PORT = 8124;
const server = spawn(process.execPath, [root + 'tools/serve.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));

async function launch() {
  const tries = [];
  if (process.env.CHROME_PATH) tries.push({ executablePath: process.env.CHROME_PATH });
  tries.push({}, { channel: 'chrome' }, { executablePath: '/opt/pw-browsers/chromium' });
  for (const opt of tries) { try { return await chromium.launch(opt); } catch {} }
  throw new Error('לא נמצא דפדפן. הרץ: npx playwright install chromium');
}

const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const notes = process.env.PDF_NOTES ? '&showNotes=separate-page' : '';
await page.goto(`http://localhost:${PORT}/?print-pdf${notes}`);
await page.waitForFunction(() => document.documentElement.dataset.mediaReady === '1', null, { timeout: 30000 });
await page.waitForTimeout(1500);
const out = process.env.PDF_OUT || root + 'ai-lecture.pdf';
await page.pdf({ path: out, width: '1280px', height: '720px', printBackground: true, preferCSSPageSize: true });
await browser.close();
server.kill();
console.log('✔ נשמר: ' + out);
