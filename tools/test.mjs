// בדיקה אוטומטית בדפדפן אמיתי: כל השקפים, כל החשיפות, כמה גדלי מסך.
// מריצים:  npm test            (צריך שהשרת לא ירוץ על אותו פורט — הבדיקה מרימה שרת משלה)
// אופציות: SHOTS=1  שומר צילום מסך של כל שקף אחרי כל החשיפות בתיקייה test-shots/
//          CHROME_PATH=/path/to/chrome   (ברירת מחדל: Chrome המותקן במחשב, או Chromium של Playwright)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname;
const PORT = 8123;
const server = spawn(process.execPath, [root + 'tools/serve.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));

async function launch() {
  const tries = [];
  if (process.env.CHROME_PATH) tries.push({ executablePath: process.env.CHROME_PATH });
  tries.push({}, { channel: 'chrome' }, { executablePath: '/opt/pw-browsers/chromium' });
  for (const opt of tries) { try { return await chromium.launch(opt); } catch {} }
  throw new Error('לא נמצא דפדפן. הרץ: npx playwright install chromium');
}

const SIZES = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1024x768 (מקרן 4:3)', width: 1024, height: 768 },
  { name: '1440x900 (מקבוק)', width: 1440, height: 900 },
  { name: '800x600', width: 800, height: 600 },
];
const shots = !!process.env.SHOTS;
if (shots) mkdirSync(root + 'test-shots', { recursive: true });

const browser = await launch();
const problems = [];
let checkedSteps = 0;

for (const size of SIZES) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('JS: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForFunction(() => document.documentElement.dataset.mediaReady === '1', null, { timeout: 20000 });

  const total = await page.evaluate(() => Reveal.getTotalSlides());
  // עוברים קדימה עם Reveal.next() — כמו לחיצה על הקליקר — עד הסוף
  await page.evaluate(() => Reveal.slide(0, 0, -1));
  let guard = 0, prevKey = '';
  while (guard++ < 2000) {
    await page.waitForTimeout(450); // מחכים שהאנימציה של החשיפה תסתיים
    const info = await page.evaluate(() => {
      const slide = Reveal.getCurrentSlide();
      const box = document.querySelector('.reveal .slides').getBoundingClientRect();
      const scale = Reveal.getScale();
      const W = 1280 * scale, H = 720 * scale;
      // גבולות השקף על המסך
      const L = box.left + (box.width - W) / 2, T = box.top + (box.height - H) / 2;
      const over = [];
      slide.querySelectorAll('*').forEach((el) => {
        if (el.closest('.m.full, .m > *, [data-demo="ambient"], .flying, aside, .private-slot, .video-trigger')) return;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('.fragment:not(.visible)')) return;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const tol = 3;
        if (r.left < L - tol || r.right > L + W + tol || r.top < T - tol || r.bottom > T + H + tol) {
          over.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${(el.textContent || '').trim().slice(0, 30)}"`);
        }
      });
      // גלילה אופקית בעמוד
      const hscroll = document.documentElement.scrollWidth > window.innerWidth + 1;
      const idx = Reveal.getIndices();
      return { id: slide.dataset.id, h: idx.h, f: idx.f ?? -1, over: over.slice(0, 4), hscroll, isLast: Reveal.isLastSlide() && !Reveal.availableFragments().next };
    });
    checkedSteps++;
    const key = `${info.h}:${info.f}`;
    if (key === prevKey) break;
    prevKey = key;
    if (info.over.length) problems.push(`[${size.name}] שקף ${info.h + 1} (${info.id}) חשיפה ${info.f}: חורג מהמסגרת → ${info.over.join(' | ')}`);
    if (info.hscroll) problems.push(`[${size.name}] שקף ${info.id}: גלילה אופקית`);
    if (shots && size.name === '1280x720') {
      const nextIsNewSlide = await page.evaluate(() => !Reveal.availableFragments().next);
      if (nextIsNewSlide) { await page.waitForTimeout(900); await page.screenshot({ path: `${root}test-shots/${String(info.h + 1).padStart(2, '0')}-${info.id}.png` }); }
    }
    if (info.isLast) break;
    await page.evaluate(() => Reveal.next());
  }
  const reached = await page.evaluate(() => Reveal.getIndices().h + 1);
  if (reached !== total) problems.push(`[${size.name}] הגיע רק לשקף ${reached} מתוך ${total}`);
  for (const e of errs) problems.push(`[${size.name}] ${e}`);
  console.log(`✔ ${size.name}: ${total} שקפים, ${guard} צעדים`);
  await page.close();
}

// בדיקות פונקציונליות
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`http://localhost:${PORT}/#/my-problems`);
  await page.waitForFunction(() => document.documentElement.dataset.mediaReady === '1');
  const hidden = await page.evaluate(() => getComputedStyle(document.querySelector('.private-slot')).display);
  await page.keyboard.press('d');
  const shown = await page.evaluate(() => getComputedStyle(document.querySelector('.private-slot')).display);
  await page.keyboard.press('d');
  const hiddenAgain = await page.evaluate(() => getComputedStyle(document.querySelector('.private-slot')).display);
  if (!(hidden === 'none' && shown === 'flex' && hiddenAgain === 'none')) problems.push(`קלף אישי (D): ${hidden} → ${shown} → ${hiddenAgain}`);
  else console.log('✔ מקש D מציג ומסתיר את הקלף האישי');

  // קיר הבעיות
  await page.evaluate(() => { const s = document.querySelector('section[data-id="your-problems"]'); const i = Reveal.getIndices(s); Reveal.slide(i.h); });
  await page.fill('section[data-id="your-problems"] .wall-input input', 'אין לי כוח לקום בבוקר');
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowRight'); // שדה ריק + חץ = יוצאים מהשדה וממשיכים לשקף הבא
  const leftField = await page.evaluate(() => Reveal.getCurrentSlide().dataset.id);
  if (leftField !== 'my-problems') problems.push('חץ מתוך שדה ריק לא העביר שקף: ' + leftField);
  await page.keyboard.press('ArrowLeft');
  const notes = await page.evaluate(() => document.querySelectorAll('section[data-id="unsolvable"] .wall .note').length);
  const stillHere = await page.evaluate(() => Reveal.getCurrentSlide().dataset.id);
  if (notes < 1 || stillHere !== 'your-problems') problems.push(`קיר הבעיות: notes=${notes} slide=${stillHere}`);
  else console.log('✔ קיר הבעיות: הקלדה + Enter מוסיפה פתק, ומופיע גם בשקף הסיום; Enter לא מעביר שקף');
  await page.evaluate(() => localStorage.clear());

  // מקשים: B (שחור), O (סקירה), F (מסך מלא — לא נבדק ב-headless), T, M
  await page.keyboard.press('b'); const paused = await page.evaluate(() => Reveal.isPaused()); await page.keyboard.press('b');
  await page.keyboard.press('o'); const ov = await page.evaluate(() => Reveal.isOverview()); await page.keyboard.press('o');
  await page.keyboard.press('t'); const hud = await page.evaluate(() => document.body.classList.contains('show-hud')); await page.keyboard.press('t');
  await page.keyboard.press('m'); const mp = await page.evaluate(() => document.querySelector('#media-panel').textContent.includes('media/')); await page.keyboard.press('m');
  if (paused && ov && hud && mp) console.log('✔ מקשים: B מסך שחור, O סקירה, T שעון, M מצב מדיה');
  else problems.push(`מקשים: B=${paused} O=${ov} T=${hud} M=${mp}`);

  // לחיצה על השקף = הבא
  await page.evaluate(() => { const s = document.querySelector('section[data-id="ironman-q"]'); const i = Reveal.getIndices(s); Reveal.slide(i.h, 0, -1); });
  await page.mouse.click(640, 200);
  const afterClick = await page.evaluate(() => Reveal.getIndices().f);
  if (afterClick !== 0) problems.push('לחיצה על השקף לא חשפה את האלמנט הבא'); else console.log('✔ לחיצת עכבר על השקף = הבא');

  // הדגמות
  await page.goto(`http://localhost:${PORT}/#/train`); await page.waitForTimeout(500);
  const before = await page.evaluate(() => document.querySelector('[data-demo="train"] [data-guess]').textContent);
  await page.click('[data-demo="train"] [data-act="run"]'); await page.waitForTimeout(3200);
  const after = await page.evaluate(() => document.querySelector('[data-demo="train"] [data-guess]').textContent);
  console.log(`✔ אימון: "${before}" → "${after}"`);
  if (!/גזר/.test(after)) problems.push(`האימון לא הגיע ל"גזר": ${after}`);
  await page.goto(`http://localhost:${PORT}/#/tokens`); await page.waitForTimeout(400);
  await page.fill('[data-demo="tokens"] input', 'שלום לכולם, היום נלמד על בינה מלאכותית');
  const ntok = await page.evaluate(() => document.querySelectorAll('[data-demo="tokens"] .tok').length);
  if (ntok < 6) problems.push('טוקנים: מעט מדי'); else console.log(`✔ טוקנים: ${ntok} חתיכות`);
  await page.goto(`http://localhost:${PORT}/#/nextword`); await page.waitForTimeout(400);
  for (let i = 0; i < 6; i++) { await page.click('[data-demo="nextword"] [data-act="next"]'); await page.waitForTimeout(550); }
  const story = await page.evaluate(() => document.querySelector('.nw-sentence').textContent);
  console.log(`✔ המילה הבאה: "${story}"`);
  if (errs.length) problems.push('JS: ' + errs.join(' | '));
  await page.close();
}

await browser.close();
server.kill();
console.log(`\nנבדקו ${checkedSteps} מצבים (שקף+חשיפה) ב-${SIZES.length} גדלי מסך.`);
if (problems.length) { console.log(`\n✘ ${problems.length} בעיות:\n` + problems.join('\n')); process.exit(1); }
console.log('✔ הכל תקין');
