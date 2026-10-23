/* ============================================================
   מנוע המצגת: מדיה, קלף אישי, קיר בעיות, טיימרים, מקשים
   ============================================================ */
(function () {
  const P = window.PERSONAL || {};
  const MEDIA = window.MEDIA || {};
  const isPrint = /print-pdf/i.test(location.search);
  const isReceiver = /receiver/i.test(location.search); // תצוגות מקדימות בחלון הדובר
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ai-lecture:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('ai-lecture:' + k, JSON.stringify(v)); } catch {} },
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); if (!t || isReceiver) return;
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 1600);
  }

  // ---------- סנכרון בין החלון הראשי לחלון הדובר ----------
  let chan = null;
  try { chan = new BroadcastChannel('ai-lecture'); } catch {}
  const handlers = {};
  function broadcast(type, data) { try { chan && chan.postMessage({ type, data }); } catch {} }
  if (chan) chan.onmessage = (e) => { const h = handlers[e.data && e.data.type]; if (h) h(e.data.data, true); };

  // ---------- תוכן אישי ----------
  function renderPersonal() {
    $$('[data-personal="name"]').forEach((el) => (el.textContent = P.name || ''));
    const about = $('#about-list');
    if (about) about.innerHTML = (P.about || []).map((a, i) =>
      `<div class="card fragment rise" style="display:flex;gap:18px;align-items:center"><span style="font-size:52px">${esc(a.emoji)}</span><span style="font-size:32px;font-weight:600">${esc(a.text)}</span></div>`).join('');
    const probs = $('#my-problems-cards');
    if (probs) {
      probs.innerHTML = (P.problems || []).map((p) =>
        `<div class="pcard fragment"><span class="emoji">${esc(p.emoji)}</span><span class="t">${esc(p.text)}</span></div>`).join('') +
        (P.privateCard ? `<div class="pcard private private-slot"><div class="m" data-m="dad_photo"></div><span class="emoji">${esc(P.privateCard.emoji)}</span><span class="t">${esc(P.privateCard.text)}</span></div>` : '');
    }
  }

  // ---------- קלף אישי (D) ----------
  function setPrivate(on, fromRemote) {
    document.body.classList.toggle('show-private', !!on);
    try { sessionStorage.setItem('ai-lecture:private', on ? '1' : '0'); } catch {}
    if (!fromRemote) { broadcast('private', !!on); toast(on ? 'הקלף האישי מוצג' : 'הקלף האישי מוסתר'); }
  }
  handlers.private = setPrivate;
  function togglePrivate() { setPrivate(!document.body.classList.contains('show-private')); }

  // ---------- מדיה ----------
  function mediaUrl(entry) { return 'media/' + entry.file; }
  function placeholder(el, id, entry) {
    el.classList.add('missing');
    el.innerHTML = `<div class="missing-card"><b>חסר קובץ</b> · ${esc(entry ? entry.slide || '' : '')}<br>
      <code>media/${esc(entry ? entry.file : id)}</code><br>${esc(entry ? entry.what : 'מזהה לא מוכר: ' + id)}
      ${entry && entry.why ? `<div class="why">${esc(entry.why)}</div>` : ''}</div>`;
  }
  const mediaState = {}; // id -> 'ok' | 'missing'
  function loadMedia(el) {
    return new Promise((resolve) => {
      const id = el.dataset.m;
      const entry = MEDIA[id];
      if (!entry) { placeholder(el, id, null); mediaState[id] = 'missing'; return resolve(false); }
      let done = false;
      const finish = (ok) => {
        if (done) return; done = true; mediaState[id] = ok ? 'ok' : 'missing';
        if (!ok) {
          const fb = el.dataset.fallback && MEDIA[el.dataset.fallback];
          if (fb && !el.dataset.triedFallback) {
            el.dataset.triedFallback = '1'; el.classList.remove('video');
            const img = new Image(); img.alt = '';
            img.onload = () => { mediaState[el.dataset.fallback] = 'ok'; el.innerHTML = ''; el.appendChild(img); resolve(false); };
            img.onerror = () => { mediaState[el.dataset.fallback] = 'missing'; placeholder(el, id, entry); resolve(false); };
            img.src = mediaUrl(fb);
            return;
          }
          if (entry.optional) el.classList.add('missing-optional'); else placeholder(el, id, entry);
        }
        resolve(ok);
      };
      if (entry.kind === 'video') {
        el.classList.add('video');
        const v = document.createElement('video');
        v.preload = 'auto'; v.playsInline = true; v.muted = el.hasAttribute('data-muted');
        if (el.hasAttribute('data-loop')) v.loop = true;
        v.addEventListener('loadedmetadata', () => { el.innerHTML = ''; el.appendChild(v); finish(true); }, { once: true });
        v.addEventListener('error', () => finish(false), { once: true });
        v.addEventListener('play', () => el.classList.add('playing'));
        v.addEventListener('pause', () => el.classList.remove('playing'));
        v.src = mediaUrl(entry);
        setTimeout(() => finish(!!v.videoWidth), 6000);
      } else {
        const img = new Image(); img.alt = entry.what || ''; img.decoding = 'async';
        img.onload = () => { el.innerHTML = ''; el.appendChild(img); finish(true); };
        img.onerror = () => finish(false);
        img.src = mediaUrl(entry);
      }
    });
  }

  function videosIn(slide, which) {
    return $$('.m.video', slide).filter((m) => !which || which === 'all' || m.dataset.m === which).map((m) => $('video', m)).filter(Boolean);
  }
  function playVideo(v) { if (!v) return; const p = v.play(); if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => {}); }); }

  // ---------- קיר הבעיות ----------
  let wall = store.get('wall', []);
  function renderWalls() {
    $$('.wall').forEach((w) => {
      const final = w.classList.contains('final');
      w.innerHTML = wall.map((n, i) => `<div class="note${n.u && final ? ' unsolvable' : ''}" style="--r:${((i * 37) % 7) - 3}deg" data-i="${i}">${esc(n.t)}${final ? '' : '<span class="x" title="מחק">×</span>'}</div>`).join('') ||
        `<div class="muted" style="font-size:24px;align-self:center">${final ? 'הקיר ריק — לא נכתבו בעיות בתחילת השיעור' : 'הקלד בעיה ולחץ Enter'}</div>`;
    });
  }
  function saveWall(fromRemote) { store.set('wall', wall); renderWalls(); if (!fromRemote) broadcast('wall', wall); }
  handlers.wall = (data) => { wall = data || []; saveWall(true); };
  function initWall() {
    $$('.wall-input').forEach((box) => {
      const input = $('input', box);
      const add = () => { const t = input.value.trim(); if (!t) return; wall.push({ t }); input.value = ''; saveWall(); };
      input.addEventListener('keydown', (e) => {
        // קליקר (PageUp/PageDown) או חץ כשהשדה ריק → יוצאים מהשדה וממשיכים לנווט כרגיל
        if (['PageDown', 'PageUp'].includes(e.key) || (!input.value && ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key))) { input.blur(); return; }
        e.stopPropagation();
        if (e.key === 'Enter') add();
        if (e.key === 'Escape') input.blur();
      });
      $('[data-act="add"]', box).addEventListener('click', add);
      $('[data-act="clear"]', box).addEventListener('click', () => { if (confirm('למחוק את כל הבעיות מהקיר?')) { wall = []; saveWall(); } });
    });
    document.addEventListener('click', (e) => {
      const x = e.target.closest('.wall .note .x');
      if (x) { wall.splice(Number(x.parentElement.dataset.i), 1); saveWall(); e.stopPropagation(); return; }
      const n = e.target.closest('.wall.final .note');
      if (n) { const it = wall[Number(n.dataset.i)]; it.u = !it.u; saveWall(); }
    }, true);
    renderWalls();
  }

  // ---------- טיימר ספירה לאחור (לחיצה מפעילה/עוצרת) ----------
  function initCountdowns() {
    $$('.countdown').forEach((el) => {
      const minutes = Number(el.dataset.minutes || P[el.dataset.minutesFrom] || 20);
      let left = minutes * 60, timer = null;
      const draw = () => { const m = Math.floor(left / 60), s = left % 60; el.textContent = `${m}:${String(s).padStart(2, '0')}`; el.classList.toggle('done', left <= 0); };
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (left <= 0) { left = minutes * 60; draw(); return; }
        if (timer) { clearInterval(timer); timer = null; toast('השעון נעצר'); }
        else { timer = setInterval(() => { left = Math.max(0, left - 1); draw(); if (!left) { clearInterval(timer); timer = null; } }, 1000); toast('השעון רץ'); }
      });
      draw();
    });
  }

  // ---------- QR ----------
  function initQR() {
    $$('[data-qr]').forEach((el) => {
      const url = P.factoryUrl || '';
      try { const qr = qrcode(0, 'M'); qr.addData(url); qr.make(); el.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 0, scalable: true }); } catch (e) { el.textContent = 'QR'; }
    });
    $$('[data-url]').forEach((el) => (el.textContent = (P.factoryUrl || '').replace(/^https?:\/\//, '')));
    if (/example\.com/.test(P.factoryUrl || '')) $$('[data-url]').forEach((el) => (el.innerHTML += '<div class="hint" style="color:var(--pink)">לעדכן את factoryUrl ב-js/personal.js</div>'));
  }

  // ---------- HUD: שעון + זמן שעבר (T) ----------
  const t0 = Date.now();
  let hudStart = t0;
  function hudTick() {
    const hud = $('#hud'); if (!hud) return;
    const el = Math.floor((Date.now() - hudStart) / 1000);
    const now = new Date();
    const idx = window.Reveal && Reveal.isReady() ? Reveal.getSlidePastCount() + 1 : 0;
    const tot = window.Reveal && Reveal.isReady() ? Reveal.getTotalSlides() : 0;
    hud.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}  ·  ⏱ ${Math.floor(el / 60)}:${String(el % 60).padStart(2, '0')}  ·  ${idx}/${tot}`;
  }

  // ---------- לוח מדיה (M) ----------
  function renderMediaPanel() {
    const panel = $('#media-panel'); if (!panel) return;
    const rows = Object.entries(MEDIA).map(([id, e]) => {
      const st = mediaState[id];
      const ok = st === 'ok';
      const label = ok ? '<span class="ok">✔ קיים</span>' : st === 'missing' ? `<span class="no">✘ חסר</span>${e.optional ? ' <small>(לא חובה)</small>' : ''}` : '<small>לא נבדק</small>';
      return `<tr><td>${label}</td><td><code>media/${esc(e.file)}</code></td><td>${esc(e.slide || '')}</td><td>${esc(e.what)}</td></tr>`;
    }).join('');
    const missing = Object.entries(MEDIA).filter(([id, e]) => mediaState[id] !== 'ok' && !e.optional).length;
    panel.innerHTML = `<h2>מדיה: ${missing} קבצי חובה חסרים</h2><div>שים את הקבצים בתיקייה <code>media/</code> בדיוק בשמות האלה ורענן (Cmd+R). M לסגירה. <b>H</b> מסתיר את כרטיסי ה״חסר״ על המסך.</div>
      <table><tr><th>מצב</th><th>קובץ</th><th>שקף</th><th>מה לשים</th></tr>${rows}</table>`;
  }

  // ---------- התחלה ----------
  renderPersonal();
  initWall();
  initCountdowns();
  initQR();
  try { if (sessionStorage.getItem('ai-lecture:private') === '1') document.body.classList.add('show-private'); } catch {}

  const mediaEls = $$('.m[data-m]');

  Reveal.initialize({
    hash: true,
    rtl: true,
    width: 1280,
    height: 720,
    margin: 0.04,
    minScale: 0.2,
    maxScale: 2.5,
    center: false,
    display: 'flex',
    controls: true,
    controlsTutorial: false,
    progress: true,
    slideNumber: false,
    transition: 'fade',
    transitionSpeed: 'fast',
    backgroundTransition: 'fade',
    navigationMode: 'linear',
    autoPlayMedia: false,
    preloadIframes: false,
    viewDistance: 4,
    pdfSeparateFragments: false,
    pdfMaxPagesPerSlide: 1,
    showNotes: false,
    help: true,
    keyboard: {
      39: 'next', 37: 'prev',                                                    // → תמיד "הבא", ← תמיד "הקודם" (גם במצב RTL וגם בקליקר)
      68: () => togglePrivate(),                                                // D — קלף אישי
      84: (e) => { if (e && e.shiftKey) { hudStart = Date.now(); toast('השעון אופס'); } else document.body.classList.toggle('show-hud'); hudTick(); }, // T / Shift+T
      77: () => { renderMediaPanel(); document.body.classList.toggle('show-media-panel'); }, // M — מצב המדיה
      72: () => { document.body.classList.toggle('hide-missing'); toast(document.body.classList.contains('hide-missing') ? 'כרטיסי "חסר" מוסתרים' : 'כרטיסי "חסר" מוצגים'); }, // H
    },
    plugins: [window.RevealNotes].filter(Boolean),
  }).then(() => {
    Promise.all(mediaEls.map(loadMedia)).then(() => {
      // וידאו חסר → מסירים את לחיצת ה״נגן״ כדי לא לבזבז לחיצה
      $$('.video-trigger').forEach((t) => {
        const id = t.dataset.play; const ok = id === 'all' ? $$('.m.video video', t.closest('section')).length : mediaState[id] === 'ok';
        if (!ok) t.classList.remove('fragment');
      });
      Reveal.sync();
      Reveal.layout();
      document.documentElement.dataset.mediaReady = '1';
      if (document.body.classList.contains('show-media-panel')) renderMediaPanel();
    });
    setInterval(hudTick, 1000); hudTick();
    if (isPrint) window.Demos && window.Demos.printAll(); else window.Demos && window.Demos.enter(Reveal.getCurrentSlide());
    document.documentElement.dataset.ready = '1';
  });

  Reveal.on('fragmentshown', (e) => {
    const f = e.fragment;
    if (f.classList.contains('video-trigger')) videosIn(f.closest('section'), f.dataset.play).forEach(playVideo);
    $$('.m.video[data-play-on-show] video', f).forEach(playVideo);
    window.Demos && window.Demos.fragment(f, true);
  });
  Reveal.on('fragmenthidden', (e) => {
    const f = e.fragment;
    if (f.classList.contains('video-trigger')) videosIn(f.closest('section'), f.dataset.play).forEach((v) => v.pause());
    window.Demos && window.Demos.fragment(f, false);
  });
  Reveal.on('slidechanged', (e) => {
    if (e.previousSlide) { videosIn(e.previousSlide).forEach((v) => v.pause()); window.Demos && window.Demos.leave(e.previousSlide); }
    if (document.activeElement && document.activeElement !== document.body && e.previousSlide && e.previousSlide.contains(document.activeElement)) document.activeElement.blur();
    window.Demos && window.Demos.enter(e.currentSlide);
    hudTick();
  });

  // לחיצה על וידאו = נגן/עצור (בלי לעבור שקף)
  document.addEventListener('click', (e) => {
    const m = e.target.closest('.m.video');
    if (m) { const v = $('video', m); if (v) { v.paused ? playVideo(v) : v.pause(); } e.stopPropagation(); }
  }, true);

  // לחיצה על השקף = הבא, לחיצה ימנית = הקודם (חוץ מאלמנטים אינטראקטיביים)
  const interactive = 'a,button,input,textarea,select,label,video,canvas,.m.video,.interactive,.note,.countdown,.controls,.navigate-left,.navigate-right,.navigate-up,.navigate-down,#media-panel';
  document.querySelector('.reveal').addEventListener('click', (e) => {
    if (isReceiver || isPrint || Reveal.isOverview()) return;
    if (e.target.closest(interactive)) return;
    if (window.getSelection && String(window.getSelection())) return;
    Reveal.next();
  });
  document.querySelector('.reveal').addEventListener('contextmenu', (e) => {
    if (isReceiver || e.target.closest(interactive)) return;
    e.preventDefault(); Reveal.prev();
  });

  window.Deck = { toast, store, broadcast, handlers, mediaState, togglePrivate };
})();
