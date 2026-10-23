// מייצר את MEDIA_GUIDE.md מתוך js/media.js (המקור היחיד לרשימת הקבצים)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const root = new URL('..', import.meta.url).pathname;
const src = readFileSync(root + 'js/media.js', 'utf8');
const window = {}; new Function('window', src)(window);
const M = window.MEDIA;
const SRC = { you: 'אתה מצלם/מייצר', commons: 'Wikimedia Commons (רישיון פתוח)', clip: '⚠️ קטע מוגן — רק באישורך', 'ai-you': 'אתה מייצר בכלי AI' };
const head = readFileSync(root + 'tools/media-guide-head.md', 'utf8');
let rows = [];
const groups = {};
for (const [id, e] of Object.entries(M)) {
  const have = existsSync(root + 'media/' + e.file);
  (groups[e.source] ||= []).push(`| ${have ? '✅' : e.optional ? '➖' : '❌'} | \`media/${e.file}\` | ${e.slide} | ${e.what}${e.why ? ' <br>_' + e.why + '_' : ''}${e.optional ? ' **(לא חובה)**' : ''} |`);
}
for (const k of ['you', 'ai-you', 'commons', 'clip']) {
  if (!groups[k]) continue;
  rows.push(`\n### ${SRC[k]}\n\n| מצב | קובץ | שקף | מה לשים |\n|---|---|---|---|\n` + groups[k].join('\n'));
}
const total = Object.values(M).filter((e) => !e.optional).length;
const have = Object.values(M).filter((e) => !e.optional && existsSync(root + 'media/' + e.file)).length;
writeFileSync(root + 'MEDIA_GUIDE.md', head.replace('{{STATUS}}', `**מצב נוכחי: ${have} מתוך ${total} קבצי חובה קיימים.** (✅ קיים · ❌ חסר · ➖ לא חובה וחסר)`) + rows.join('\n') + '\n');
console.log(`MEDIA_GUIDE.md: ${have}/${total}`);
