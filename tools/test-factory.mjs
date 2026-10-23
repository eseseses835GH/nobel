// בדיקה של מפעל הפרומפטים: טלפון וגם מחשב, מסנן מידע אישי, מד איכות, העתקה
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const root = new URL('..', import.meta.url).pathname;
const PORT = 8125;
const server = spawn(process.execPath, [root + 'tools/serve.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
let browser;
for (const opt of [process.env.CHROME_PATH && { executablePath: process.env.CHROME_PATH }, {}, { channel: 'chrome' }, { executablePath: '/opt/pw-browsers/chromium' }].filter(Boolean)) { try { browser = await chromium.launch(opt); break; } catch {} }
const problems = [];
for (const vp of [{ width: 390, height: 844, name: 'טלפון' }, { width: 1366, height: 768, name: 'מחשב' }]) {
  const ctx = await browser.newContext({ viewport: vp, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`http://localhost:${PORT}/factory.html`);
  const s0 = Number(await p.textContent('#scoreN'));
  await p.fill('#nick', 'דני כהן');
  const nickWarn = await p.isVisible('section:nth-of-type(1) .warn.on');
  await p.fill('#goal', 'מלמד ילדים על כוכבי הלכת, תתקשרו אליי 054-1234567 או dani@mail.com');
  const goalVal = await p.inputValue('#goal');
  if (/054|@/.test(goalVal)) problems.push(`[${vp.name}] טלפון/מייל לא נמחקו: ${goalVal}`);
  if (!nickWarn) problems.push(`[${vp.name}] אין אזהרה על שם מלא`);
  await p.fill('#nick', 'דני');
  await p.click('[data-group="type"] >> text=חידון');
  await p.click('[data-group="audience"] >> text=לכיתה');
  await p.click('[data-group="likes"] >> text=חלל');
  await p.fill('#title', 'מסע בין הכוכבים');
  await p.fill('#sections', 'עמוד בית\nכוכבי הלכת\nחידון\nעובדות');
  await p.fill('#facts', 'צדק הוא הכוכב הכי גדול במערכת השמש');
  await p.click('[data-group="palette"] >> text=לילה');
  await p.click('[data-group="mood"] >> text=חללי');
  await p.click('[data-group="features"] >> text=חידון עם ניקוד');
  await p.click('[data-group="features"] >> text=מצב לילה');
  await p.fill('#example', 'איזה כוכב לכת הכי חם? א. מאדים ב. נוגה ג. כוכב חמה');
  const s1 = Number(await p.textContent('#scoreN'));
  const prompt = await p.textContent('#prompt');
  if (!(s0 < 45 && s1 >= 90)) problems.push(`[${vp.name}] מד איכות: ${s0} → ${s1}`);
  for (const k of ['תפקיד', 'מטרה', 'הקשר', 'אילוצים', 'פורמט', 'דוגמה']) if (!prompt.includes(k)) problems.push(`[${vp.name}] חסר רכיב בפרומפט: ${k}`);
  await p.click('#copy');
  await p.waitForFunction(() => document.querySelector('#copied').textContent.length > 0, null, { timeout: 3000 }).catch(() => {});
  const copied = await p.textContent('#copied');
  if (!/הועתק|ידנית/.test(copied)) problems.push(`[${vp.name}] העתקה: ${copied}`);
  const hscroll = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  if (hscroll) problems.push(`[${vp.name}] גלילה אופקית`);
  await p.reload();
  const kept = await p.inputValue('#title');
  if (kept !== 'מסע בין הכוכבים') problems.push(`[${vp.name}] התשובות לא נשמרו אחרי רענון`);
  if (process.env.SHOTS) await p.screenshot({ path: `${root}test-shots/factory-${vp.width}.png`, fullPage: vp.width > 1000 });
  console.log(`✔ ${vp.name}: מד איכות ${s0} → ${s1}, אורך פרומפט ${prompt.length} תווים`);
  problems.push(...errs.map((e) => `[${vp.name}] JS: ${e}`));
  await ctx.close();
}
await browser.close(); server.kill();
if (problems.length) { console.log('✘\n' + problems.join('\n')); process.exit(1); }
console.log('✔ מפעל הפרומפטים תקין');
