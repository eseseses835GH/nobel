/* ============================================================
   הדגמות אינטראקטיביות. כל הדגמה: <div data-demo="name">
   enter/leave נקראים כשנכנסים/יוצאים מהשקף.
   ============================================================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const isPrint = /print-pdf/i.test(location.search);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const registry = {};
  const inited = new WeakSet();
  const def = (name, impl) => (registry[name] = impl);

  function each(slide, fn) {
    if (!slide) return;
    $$('[data-demo]', slide).forEach((el) => {
      const d = registry[el.dataset.demo]; if (!d) return;
      if (!inited.has(el)) { inited.add(el); d.init && d.init(el); }
      fn(d, el);
    });
  }
  window.Demos = {
    enter: (s) => each(s, (d, el) => d.enter && d.enter(el)),
    leave: (s) => each(s, (d, el) => d.leave && d.leave(el)),
    fragment: (f, shown) => each(f.closest('section'), (d, el) => d.fragment && d.fragment(el, f, shown)),
  };
  // הדפסה ל-PDF: מאתחלים הכל במצב התחלתי
  window.Demos.printAll = () => $$('[data-demo]').forEach((el) => { const d = registry[el.dataset.demo]; if (d && !inited.has(el)) { inited.add(el); d.init && d.init(el); } if (d && d.print) d.print(el); });

  // עוזר: מכפיל קנה המידה של reveal (המסך מוקטן/מוגדל)
  function scaleOf(el) { const r = el.getBoundingClientRect(); return r.width / (el.offsetWidth || 1) || 1; }

  // ---------------------------------------------------------
  // רשת עצבית ברקע (שקפי פתיחה ומעבר)
  // ---------------------------------------------------------
  def('ambient', {
    init(el) {
      const c = document.createElement('canvas'); c.className = 'ambient'; c.width = 1280; c.height = 720; el.appendChild(c);
      const ctx = c.getContext('2d');
      const N = 70, pts = [];
      let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < N; i++) pts.push({ x: rnd() * 1280, y: rnd() * 720, vx: (rnd() - .5) * .35, vy: (rnd() - .5) * .35, p: rnd() });
      el._draw = (t) => {
        ctx.clearRect(0, 0, 1280, 720);
        for (const p of pts) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > 1280) p.vx *= -1; if (p.y < 0 || p.y > 720) p.vy *= -1; }
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
          const a = pts[i], b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
          if (d < 22000) {
            const k = 1 - d / 22000;
            const pulse = (Math.sin(t / 600 + (a.p + b.p) * 10) + 1) / 2;
            ctx.strokeStyle = `rgba(${pulse > .92 ? '255,201,51' : '77,225,255'},${k * (.18 + pulse * .25)})`;
            ctx.lineWidth = 1 + (pulse > .92 ? 1.5 : 0);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        for (const p of pts) { ctx.fillStyle = 'rgba(200,230,255,.7)'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.2, 0, 7); ctx.fill(); }
      };
      el._draw(0);
    },
    enter(el) { const loop = (t) => { el._draw(t); el._raf = requestAnimationFrame(loop); }; cancelAnimationFrame(el._raf); el._raf = requestAnimationFrame(loop); },
    leave(el) { cancelAnimationFrame(el._raf); },
  });

  // ---------------------------------------------------------
  // טוקנים: חותך טקסט לחתיכות (המחשה — כל מודל חותך קצת אחרת)
  // ---------------------------------------------------------
  const VOCAB = new Set(('the of and to in is you that it for on with are this be as at have was what my me how can not will do your all one ' +
    'hello world love ai game pizza play school friend i a an'
  ).split(' '));
  const HE_PREFIX = ['וכש', 'כש', 'וה', 'וב', 'ול', 'ומ', 'שה', 'מה', 'לה', 'בה', 'ה', 'ו', 'ב', 'ל', 'מ', 'ש', 'כ'];
  const HE_SUFFIX = ['ים', 'ות', 'תי', 'נו', 'תם', 'כם', 'הם', 'ה', 'ת', 'י'];
  const HE_WORDS = new Set('אני אתה את הוא היא אנחנו של עם לא כן מה מי זה זאת יש אין גם רק כל היום מחר אתמול טוב שלום תודה בית ספר חבר אוהב אוהבת רוצה פיצה משחק מחשב שמש ים כלב חתול'.split(' '));
  function tokenize(text) {
    const out = [];
    const parts = text.match(/\s+|[A-Za-z]+|[֐-׿]+|\d+|[^\s\w֐-׿]/g) || [];
    let lead = '';
    for (const part of parts) {
      if (/^\s+$/.test(part)) { lead = part.replace(/\n/g, ' '); continue; }
      if (/^[A-Za-z]+$/.test(part)) {
        const low = part.toLowerCase();
        if (VOCAB.has(low) || part.length <= 3) out.push(lead + part);
        else { for (let i = 0; i < part.length; i += 4) out.push((i ? '' : lead) + part.slice(i, i + 4)); }
      } else if (/^[֐-׿]+$/.test(part)) {
        let w = part, first = true;
        if (!HE_WORDS.has(w) && w.length > 3) {
          const pre = HE_PREFIX.find((p) => w.startsWith(p) && w.length - p.length >= 3);
          if (pre) { out.push(lead + pre); w = w.slice(pre.length); first = false; }
        }
        if (!HE_WORDS.has(w) && w.length > 4) {
          const suf = HE_SUFFIX.find((s) => w.endsWith(s) && w.length - s.length >= 3);
          if (suf) { const stem = w.slice(0, -suf.length); pushChunks(stem, first ? lead : ''); out.push(suf); }
          else pushChunks(w, first ? lead : '');
        } else out.push((first ? lead : '') + w);
      } else if (/^\d+$/.test(part)) { for (let i = 0; i < part.length; i += 3) out.push((i ? '' : lead) + part.slice(i, i + 3)); }
      else out.push(lead + part);
      lead = '';
    }
    function pushChunks(w, ld) { if (w.length <= 4) { out.push(ld + w); return; } const cut = Math.ceil(w.length / 2); out.push(ld + w.slice(0, cut)); out.push(w.slice(cut)); }
    return out;
  }
  function tokId(t) { let h = 2166136261; for (const ch of t) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) % 100000; }
  const TOK_COLORS = ['#4de1ff', '#ffc933', '#ff8fb0', '#a78bfa', '#4ade80', '#ffa94d', '#7dd3fc', '#f0abfc'];
  def('tokens', {
    init(el) {
      const input = $('input', el), out = $('.tok-out', el), n = $('[data-n]', el), c = $('[data-c]', el), w = $('[data-w]', el);
      const draw = () => {
        const toks = tokenize(input.value);
        out.innerHTML = toks.map((t, i) => `<span class="tok" style="background:${TOK_COLORS[i % TOK_COLORS.length]}">${esc(t)}<i>${tokId(t)}</i></span>`).join('');
        n.textContent = toks.length; c.textContent = input.value.length; w.textContent = (input.value.trim().match(/\S+/g) || []).length;
      };
      input.addEventListener('input', draw);
      input.addEventListener('keydown', (e) => e.stopPropagation());
      $$('[data-sample]', el).forEach((b) => b.addEventListener('click', () => { input.value = b.dataset.sample; draw(); }));
      draw();
    },
  });

  // ---------------------------------------------------------
  // המילה הבאה: הסתברויות + טמפרטורה (המחשה, מספרים שהמצאתי לצורך ההדגמה)
  // ---------------------------------------------------------
  const STORY = {
    start: 'פעם אחת, ביער קסום, חי',
    steps: [
      () => [['דרקון', 34], ['ילד', 22], ['שועל', 16], ['קוסם', 12], ['רובוט', 9], ['מקרר', 2]],
      (prev) => prev === 'מקרר' ? [['ענק', 40], ['מדבר', 30], ['ישן', 20], ['כחול', 10]] : [['קטן', 38], ['ירוק', 22], ['זקן', 18], ['ביישן', 14], ['סגול', 8]],
      () => [['שאהב', 36], ['שחלם', 28], ['שפחד', 18], ['שידע', 12], ['שרקד', 6]],
      (prev) => prev === 'שפחד' ? [['מהחושך', 46], ['מעכבישים', 30], ['מבחנים', 16], ['מפיצה', 8]] : [['לשיר', 30], ['לעוף', 26], ['פיצה', 20], ['מתמטיקה', 14], ['לישון', 10]],
      () => [['.', 55], ['בלילה', 25], ['כל היום', 15], ['בשקט', 5]],
    ],
  };
  const RAIN = { start: 'אחרי הגשם, בשמיים מופיעה', steps: [() => [['קשת', 64], ['שמש', 16], ['ציפור', 10], ['חללית', 6], ['פיצה', 4]], () => [['צבעונית', 52], ['גדולה', 28], ['כפולה', 14], ['מצחיקה', 6]], () => [['.', 70], ['ומחייכת', 18], ['מעל הים', 12]]] };
  def('nextword', {
    init(el) {
      const sent = $('.nw-sentence', el), bars = $('.bars', el), temp = $('input[type=range]', el), tv = $('[data-temp]', el);
      let story = STORY, words = [];
      const dist = () => {
        const step = story.steps[words.length]; if (!step) return [];
        const raw = step(words[words.length - 1]);
        const T = Number(temp.value);
        const ws = raw.map(([w, p]) => [w, Math.pow(p, 1 / T)]);
        const s = ws.reduce((a, [, p]) => a + p, 0);
        return ws.map(([w, p]) => [w, p / s]);
      };
      const draw = (picked) => {
        sent.innerHTML = esc(story.start) + ' ' + words.map((w) => `<span class="gen">${esc(w)}</span>`).join(' ') + '<span class="cursor"></span>';
        const d = dist();
        bars.innerHTML = d.length ? d.map(([w, p]) => `<div class="bar${w === picked ? ' picked' : ''}" data-w="${esc(w)}"><span class="w">${esc(w)}</span><span class="track"><span class="fill" style="width:${(p * 100).toFixed(1)}%"></span></span><span class="p">${Math.round(p * 100)}%</span></div>`).join('')
          : '<div class="muted" style="font-size:26px">הסיפור נגמר. ↺ להתחיל מחדש</div>';
        tv.textContent = Number(temp.value).toFixed(1);
      };
      const pick = (w) => { words.push(w); draw(); };
      const sample = () => {
        const d = dist(); if (!d.length) return;
        let r = Math.random(), w = d[d.length - 1][0];
        for (const [x, p] of d) { if ((r -= p) <= 0) { w = x; break; } }
        draw(w); setTimeout(() => pick(w), 450);
      };
      bars.addEventListener('click', (e) => { const b = e.target.closest('.bar'); if (b) pick(b.dataset.w); });
      $('[data-act="next"]', el).addEventListener('click', sample);
      $('[data-act="reset"]', el).addEventListener('click', () => { words = []; draw(); });
      $('[data-act="swap"]', el).addEventListener('click', () => { story = story === STORY ? RAIN : STORY; words = []; draw(); });
      temp.addEventListener('input', () => draw());
      temp.addEventListener('keydown', (e) => e.stopPropagation());
      draw();
    },
  });

  // ---------------------------------------------------------
  // אימון אמיתי (זעיר): מודל שלומד לנחש את המילה הבאה לפי שתי המילים הקודמות.
  // רגרסיה סופטמקס + ירידה בגרדיאנט. המספרים כאן אמיתיים — זה באמת לומד.
  // ---------------------------------------------------------
  const CORPUS = ['החתול שותה חלב', 'התינוק שותה חלב', 'הכלב שותה מים', 'הסוס שותה מים', 'החתול אוכל דג', 'הכלב אוכל עצם', 'הארנב אוכל גזר', 'הפרה אוכלת דשא', 'השמש זורחת בבוקר', 'הירח זורח בלילה', 'הציפור שרה בבוקר', 'הינשוף ער בלילה'];
  def('train', {
    init(el) {
      const words = [...new Set(CORPUS.join(' ').split(' ').concat(['<s>']))];
      const outWords = [...new Set(CORPUS.flatMap((s) => s.split(' ')))];
      const V = words.length, O = outWords.length;
      const ix = Object.fromEntries(words.map((w, i) => [w, i])), ox = Object.fromEntries(outWords.map((w, i) => [w, i]));
      const data = [];
      for (const s of CORPUS) { const t = ['<s>', '<s>', ...s.split(' ')]; for (let i = 2; i < t.length; i++) data.push([ix[t[i - 2]], ix[t[i - 1]], ox[t[i]]]); }
      let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      let W1, W2, b, steps, losses, order = [];
      const reset = () => { seed = 3; W1 = Array.from({ length: V }, () => Array.from({ length: O }, () => (rnd() - .5) * .6)); W2 = Array.from({ length: V }, () => Array.from({ length: O }, () => (rnd() - .5) * .6)); b = new Array(O).fill(0); steps = 0; order = []; losses = [avgLoss()]; };
      const probs = (a, c) => { const z = b.map((bb, k) => bb + W1[a][k] + W2[c][k]); const m = Math.max(...z); const e = z.map((x) => Math.exp(x - m)); const s = e.reduce((x, y) => x + y, 0); return e.map((x) => x / s); };
      function avgLoss() { let L = 0; for (const [a, c, y] of data) L -= Math.log(probs(a, c)[y] + 1e-9); return L / data.length; }
      const lr = 0.6;
      let last = null;
      const step = () => {
        // עוברים על כל המשפטים בסדר מעורבב (תמיד אותו סדר) — כך כל משפט נלמד, וההדגמה צפויה מול הכיתה
        if (!order.length) { order = data.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } }
        const [a, c, y] = data[order.pop()];
        const p = probs(a, c);
        const guess = p.indexOf(Math.max(...p));
        for (let k = 0; k < O; k++) { const g = p[k] - (k === y ? 1 : 0); W1[a][k] -= lr * g; W2[c][k] -= lr * g * 1.4; b[k] -= lr * g * .1; }
        steps++; last = { a, c, y, guess };
        if (steps % 2 === 0) losses.push(avgLoss());
      };
      const q = $('select', el), guessEl = $('[data-guess]', el), barsEl = $('.bars', el), stepsEl = $('[data-steps]', el), lastEl = $('[data-last]', el);
      const canvas = $('canvas.loss', el), ctx = canvas.getContext('2d');
      const knobs = $('.knobs', el);
      const knobPairs = [['אוכל', 'גזר'], ['אוכל', 'עצם'], ['שותה', 'חלב'], ['שותה', 'מים'], ['זורחת', 'בבוקר'], ['זורח', 'בלילה'], ['הארנב', 'גזר'], ['הכלב', 'עצם'], ['החתול', 'חלב'], ['הסוס', 'מים'], ['ער', 'בלילה'], ['שרה', 'בבוקר']];
      knobs.innerHTML = knobPairs.map((_, i) => `<div class="knob" style="--c:${['#4de1ff', '#ffc933', '#ff8fb0', '#a78bfa'][i % 4]}"></div>`).join('');
      const draw = () => {
        const [w1, w2] = q.value.split(' ');
        const p = probs(ix[w1], ix[w2]);
        const top = p.map((x, k) => [outWords[k], x]).sort((x, y) => y[1] - x[1]).slice(0, 4);
        guessEl.innerHTML = `${esc(q.value)} <span class="cyan">${esc(top[0][0])}</span>`;
        barsEl.innerHTML = top.map(([w, x]) => `<div class="bar"><span class="w">${esc(w)}</span><span class="track"><span class="fill" style="width:${(x * 100).toFixed(1)}%"></span></span><span class="p">${Math.round(x * 100)}%</span></div>`).join('');
        stepsEl.textContent = steps;
        lastEl.innerHTML = last ? `תרגול אחרון: ניחש <b>${esc(outWords[last.guess])}</b> אחרי „${esc(words[last.a] === '<s>' ? '' : words[last.a])} ${esc(words[last.c] === '<s>' ? '' : words[last.c])}״ — ${last.guess === last.y ? '<span class="ok">צדק ✔</span>' : `<span class="no">טעה ✘</span> (נכון: ${esc(outWords[last.y])}) → מכוונן את הכפתורים`}` : 'עוד לא התאמן. לחצו "צעד אימון".';
        const ks = $$('.knob', knobs);
        knobPairs.forEach(([pw, nw], i) => { const v = W2[ix[pw]] ? W2[ix[pw]][ox[nw]] : 0; ks[i].style.setProperty('--v', (1 / (1 + Math.exp(-v))).toFixed(3)); });
        // גרף שגיאה
        const Wd = canvas.width, H = canvas.height; ctx.clearRect(0, 0, Wd, H);
        const max = Math.max(losses[0], 0.1);
        ctx.strokeStyle = '#2a3156'; ctx.lineWidth = 1; for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, H * i / 4); ctx.lineTo(Wd, H * i / 4); ctx.stroke(); }
        ctx.strokeStyle = '#ffc933'; ctx.lineWidth = 4; ctx.beginPath();
        const n = Math.max(losses.length - 1, 1);
        losses.forEach((L, i) => { const x = 10 + (Wd - 20) * i / Math.max(n, 40); const y = H - 10 - (H - 20) * (L / max); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.stroke();
        ctx.fillStyle = '#9aa3bd'; ctx.font = '22px Heebo'; ctx.textAlign = 'right'; ctx.fillText('כמה הוא טועה', Wd - 12, 28);
      };
      let anim = null;
      const run = (n) => { clearInterval(anim); let k = 0; anim = setInterval(() => { step(); draw(); if (++k >= n) clearInterval(anim); }, 25); };
      $('[data-act="step"]', el).addEventListener('click', () => { clearInterval(anim); step(); draw(); });
      $('[data-act="run"]', el).addEventListener('click', () => run(108)); // 3 סבבים על כל המשפטים
      $('[data-act="reset"]', el).addEventListener('click', () => { clearInterval(anim); reset(); last = null; draw(); });
      q.addEventListener('change', draw); q.addEventListener('keydown', (e) => e.stopPropagation());
      el._stop = () => clearInterval(anim);
      canvas.width = 560; canvas.height = 190;
      reset(); draw();
    },
    leave(el) { el._stop && el._stop(); },
  });

  // ---------------------------------------------------------
  // משוב אנושי: איזו תשובה טובה יותר?
  // ---------------------------------------------------------
  const PAIRS = [
    { q: 'מה זה פוטוסינתזה?', a: 'צמחים משתמשים באור השמש, מים ופחמן דו־חמצני כדי לייצר סוכר — ומשחררים חמצן. 🌱', b: 'פוטוסינתזה זה תהליך. תחפש בגוגל.' },
    { q: 'אני עצוב היום.', a: 'סבבה. עוד משהו?', b: 'מצטער לשמוע 💛 רוצה לספר מה קרה? ואם זה כבד — כדאי לדבר גם עם מישהו קרוב.' },
    { q: 'איך פורצים לחשבון של חבר?', a: 'בקלות! קודם כל תנחש את הסיסמה שלו…', b: 'בזה אני לא אעזור — זה פוגע בו ולא חוקי. אם שכחת סיסמה שלך, אפשר לשחזר אותה דרך "שכחתי סיסמה".' },
  ];
  def('rlhf', {
    init(el) {
      let i = 0, votes = 0, voted = false;
      const q = $('[data-q]', el), A = $('[data-a]', el), B = $('[data-b]', el), cnt = $('[data-count]', el), msg = $('[data-msg]', el);
      const nextBtn = $('[data-act="next"]', el);
      const draw = () => {
        const p = PAIRS[i]; voted = false; q.textContent = `(${i + 1}/${PAIRS.length}) ${p.q}`; A.textContent = p.a; B.textContent = p.b;
        [A, B].forEach((x) => x.closest('.card').classList.remove('win', 'lose')); msg.innerHTML = '&nbsp;'; cnt.textContent = votes;
        nextBtn.textContent = i < PAIRS.length - 1 ? 'שאלה הבאה ←' : '';
        nextBtn.style.visibility = i < PAIRS.length - 1 ? 'visible' : 'hidden';
      };
      [A, B].forEach((x) => x.closest('.card').addEventListener('click', (e) => {
        const card = e.currentTarget; const other = card === A.closest('.card') ? B.closest('.card') : A.closest('.card');
        if (voted) return; // כל שאלה מדורגת פעם אחת
        voted = true;
        card.classList.add('win'); other.classList.add('lose'); votes++; cnt.textContent = votes;
        msg.innerHTML = '👍 המודל מקבל "נקודה" על התשובה הזאת → לומד להעדיף תשובות כאלה';
      }));
      nextBtn.addEventListener('click', () => { if (i < PAIRS.length - 1) { i++; draw(); } });
      draw();
    },
  });

  // ---------------------------------------------------------
  // כל שאלה עולה כסף: שבבים נדלקים, מטבעות מצטברים
  // ---------------------------------------------------------
  def('cost', {
    init(el) {
      const chips = $('.chips', el); chips.innerHTML = '<span class="chip"></span>'.repeat(36);
      const cs = $$('.chip', chips), coins = $('.coins', el), line = $('.pulse-line', el);
      let total = 0;
      const fire = (n, ms, add) => {
        line.style.visibility = 'visible';
        const order = cs.map((_, i) => i).sort(() => Math.random() - .5).slice(0, n);
        order.forEach((k, j) => setTimeout(() => cs[k].classList.add('on'), j * 18));
        setTimeout(() => { cs.forEach((c) => c.classList.remove('on')); line.style.visibility = 'hidden'; total += add; coins.textContent = '🪙'.repeat(Math.min(total, 24)) + (total > 24 ? ' …' : ''); }, ms);
      };
      const press = (act, n, ms, add) => $(`[data-act="${act}"]`, el).addEventListener('click', (e) => {
        const b = e.currentTarget; b.classList.add('flash'); setTimeout(() => b.classList.remove('flash'), ms); fire(n, ms, add);
      });
      press('short', 6, 700, 1); press('image', 30, 1600, 4); press('long', 36, 2200, 6);
      $('[data-act="clear"]', el).addEventListener('click', () => { total = 0; coins.textContent = ''; });
      line.style.visibility = 'hidden';
    },
  });

  // ---------------------------------------------------------
  // תשומת לב (Transformer): לחיצה על מילה מראה למי היא "מקשיבה" (המחשה)
  // ---------------------------------------------------------
  const ATTN_WORDS = ['הכלב', 'רדף', 'אחרי', 'החתול', 'כי', 'הוא', 'היה', 'רעב'];
  const ATTN = { 5: { 0: .62, 3: .22, 7: .1, 1: .06 }, 7: { 5: .5, 0: .3, 6: .2 }, 1: { 0: .55, 3: .35, 2: .1 }, 3: { 1: .5, 2: .3, 0: .2 } };
  def('attention', {
    init(el) {
      const words = $('.words', el), svg = $('svg', el);
      words.innerHTML = ATTN_WORDS.map((w, i) => `<span class="wd" data-i="${i}">${w}</span>`).join('');
      const draw = (i) => {
        $$('.wd', words).forEach((w) => w.classList.toggle('focus', Number(w.dataset.i) === i));
        svg.innerHTML = '';
        const links = ATTN[i] || {}; const base = el.getBoundingClientRect(); const s = scaleOf(el);
        const pos = (k) => { const r = $(`.wd[data-i="${k}"]`, words).getBoundingClientRect(); return [(r.left + r.width / 2 - base.left) / s, (r.top - base.top) / s]; };
        const [x0, y0] = pos(i);
        for (const [k, wgt] of Object.entries(links)) {
          const [x1, y1] = pos(Number(k)); const h = 60 + Math.abs(x1 - x0) * .45;
          const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          p.setAttribute('d', `M${x0},${y0 - 4} C${x0},${y0 - h} ${x1},${y1 - h} ${x1},${y1 - 4}`);
          p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#ffc933'); p.setAttribute('stroke-width', String(2 + wgt * 22)); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('opacity', String(.35 + wgt * .65));
          svg.appendChild(p);
        }
      };
      words.addEventListener('click', (e) => { const w = e.target.closest('.wd'); if (w) draw(Number(w.dataset.i)); });
      el._draw = draw;
    },
    enter(el) { setTimeout(() => el._draw(5), 350); },
    print(el) { setTimeout(() => el._draw(5), 300); },
  });

  // ---------------------------------------------------------
  // מונה (ChatGPT): 0 → 100,000,000
  // ---------------------------------------------------------
  def('counter', {
    init(el) { el._target = Number(el.dataset.target); el.textContent = isPrint ? el._target.toLocaleString('en-US') : '0'; },
    enter(el) {
      cancelAnimationFrame(el._raf); const t0 = performance.now(), D = 2600;
      const tick = (t) => { const k = Math.min(1, (t - t0) / D); const e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(el._target * e).toLocaleString('en-US'); if (k < 1) el._raf = requestAnimationFrame(tick); };
      el._raf = requestAnimationFrame(tick);
    },
    leave(el) { cancelAnimationFrame(el._raf); },
  });

  // ---------------------------------------------------------
  // לולאת סוכן: מטרה → תכנון → כלים → בדיקה → סיום
  // ---------------------------------------------------------
  def('agent', {
    init(el) { el._st = $$('.st', el); },
    enter(el) { let i = 0; clearInterval(el._t); const go = () => { el._st.forEach((s, k) => s.classList.toggle('on', k === i)); i = (i + 1) % el._st.length; }; go(); el._t = setInterval(go, 1300); },
    leave(el) { clearInterval(el._t); },
  });

  // ---------------------------------------------------------
  // משחק קטן שנבנה בשיחה: אוספים 💡 עובדות, נזהרים מ-👻 הזיות
  // ---------------------------------------------------------
  def('game', {
    init(el) {
      const c = $('canvas', el), ctx = c.getContext('2d'); c.width = 1100; c.height = 560;
      const hudS = $('[data-score]', el), hudT = $('[data-time]', el), msg = $('.game-msg', el);
      let items = [], px = 550, score = 0, best = 0, tLeft = 0, running = false, last = 0, spawn = 0, stars = [];
      for (let i = 0; i < 90; i++) stars.push([Math.random() * 1100, Math.random() * 560, Math.random() * 1.6 + .3]);
      const setX = (clientX) => { const r = c.getBoundingClientRect(); px = Math.max(30, Math.min(1070, (clientX - r.left) / r.width * 1100)); };
      c.addEventListener('mousemove', (e) => setX(e.clientX));
      c.addEventListener('touchmove', (e) => { setX(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
      const start = () => { items = []; score = 0; tLeft = 30; running = true; last = performance.now(); msg.style.display = 'none'; loop(last); };
      msg.addEventListener('click', (e) => { e.stopPropagation(); start(); });
      const frame = (dt) => {
        ctx.fillStyle = '#070a18'; ctx.fillRect(0, 0, 1100, 560);
        for (const s of stars) { s[1] += s[2] * dt * 40; if (s[1] > 560) s[1] = 0; ctx.fillStyle = `rgba(200,220,255,${s[2] / 2})`; ctx.fillRect(s[0], s[1], s[2] * 1.5, s[2] * 1.5); }
        ctx.font = '46px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (const it of items) { it.y += it.v * dt; ctx.fillText(it.good ? '💡' : '👻', it.x, it.y); }
        ctx.font = '60px serif'; ctx.fillText('🤖', px, 505);
        for (const it of items) if (!it.hit && Math.abs(it.x - px) < 48 && Math.abs(it.y - 505) < 42) { it.hit = true; score += it.good ? 1 : -2; }
        items = items.filter((it) => !it.hit && it.y < 600);
        hudS.textContent = `נקודות: ${score}`; hudT.textContent = `⏱ ${Math.ceil(tLeft)}`;
      };
      const loop = (t) => {
        if (!running) return;
        const dt = Math.min(.05, (t - last) / 1000); last = t; tLeft -= dt; spawn -= dt;
        if (spawn <= 0) { spawn = .45 - Math.min(.25, (30 - tLeft) / 120); items.push({ x: 40 + Math.random() * 1020, y: -30, v: 170 + Math.random() * 170 + (30 - tLeft) * 6, good: Math.random() > .35 }); }
        frame(dt);
        if (tLeft <= 0) { running = false; best = Math.max(best, score); msg.innerHTML = `<div style="font-size:60px;font-weight:900">${score} נקודות</div><div>שיא: ${best} · לחצו לשחק שוב</div>`; msg.style.display = 'flex'; return; }
        el._raf = requestAnimationFrame(loop);
      };
      el._stop = () => { running = false; cancelAnimationFrame(el._raf); msg.style.display = 'flex'; };
      frame(0);
    },
    leave(el) { el._stop && el._stop(); },
  });
})();
