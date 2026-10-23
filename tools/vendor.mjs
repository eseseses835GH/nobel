// מעתיק את הספריות מ-node_modules לתיקיית vendor/ כדי שהמצגת תעבוד בלי אינטרנט ובלי npm.
// מריצים פעם אחת אחרי npm install:  npm run vendor
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const nm = join(root, 'node_modules');
const out = join(root, 'vendor');

const copy = (from, to) => { mkdirSync(join(out, to, '..'), { recursive: true }); cpSync(join(nm, from), join(out, to)); };

copy('reveal.js/dist/reveal.css', 'reveal/reveal.css');
copy('reveal.js/dist/reset.css', 'reveal/reset.css');
copy('reveal.js/dist/reveal.js', 'reveal/reveal.js');
copy('reveal.js/dist/plugin/notes.js', 'reveal/plugin/notes.js');
copy('reveal.js/LICENSE', 'reveal/LICENSE');
copy('qrcode-generator/dist/qrcode.js', 'qrcode/qrcode.js');
copy('qrcode-generator/README.md', 'qrcode/README-MIT.md');

for (const fam of ['heebo', 'rubik']) {
  const dir = join(nm, '@fontsource', fam, 'files');
  for (const f of readdirSync(dir)) {
    if (/-(hebrew|latin)-(300|400|500|700|800|900)-normal\.woff2$/.test(f)) copy(`@fontsource/${fam}/files/${f}`, `fonts/${f}`);
  }
  copy(`@fontsource/${fam}/LICENSE`, `fonts/LICENSE-${fam}`);
}
console.log('vendor/ updated');
