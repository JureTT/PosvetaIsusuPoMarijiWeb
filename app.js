'use strict';
/* Posveta Isusu Kristu po Mariji – web verzija (PWA). Sve se čuva na uređaju (localStorage). */

const PALETTES = [
  ['light','Svjetlost','#FFFFFF','#F2F3F7','#171923','#686B78','#4053B8','#FFFFFF','#4053B8','#D9DCE7'],
  ['parchment','Pergament','#F8F0DF','#F1E4C8','#392D24','#796B5B','#922F2D','#FFFFFF','#A33A35','#E3D2B2'],
  ['sky','Nebo','#DCEFFA','#EFF7FC','#173653','#58738D','#1768B9','#FFFFFF','#2479C8','#BBD9EF'],
  ['dark','Tišina','#08090D','#191B22','#F5F5F7','#A7A9B4','#83B2FF','#10131A','#83B2FF','#30333D'],
  ['tt_classic','TT Klasično','#102D50','#1A3D64','#FFFFFF','#C5D7E9','#FFFFFF','#102D50','#8FC5F5','#315779'],
  ['getsemani','Getsemani','#E9EBDD','#DDE3CD','#303A29','#68745D','#536B3E','#FFFFFF','#71864F','#C9D2B6'],
  ['kalvarija','Kalvarija','#7A1F2B','#922D3A','#FFF7F2','#E8C9C9','#F0B8BC','#4A1119','#D98A91','#A94A55']
].map(a => ({id:a[0], name:a[1], bg:a[2], surface:a[3], text:a[4], sec:a[5], primary:a[6], onprimary:a[7], accent:a[8], border:a[9]}));

const SCALES = [0.85, 1, 1.15, 1.3, 1.5];
const SPEEDS = [0.85, 1, 1.2];
const FEASTS = [
  [3, 25, '25. ožujka – Navještenje Gospodinovo'],
  [5, 31, '31. svibnja – Pohod Blažene Djevice Marije'],
  [8, 15, '15. kolovoza – Uznesenje Blažene Djevice Marije'],
  [9, 8, '8. rujna – Rođenje Blažene Djevice Marije'],
  [12, 8, '8. prosinca – Bezgrješno začeće Blažene Djevice Marije']
];

/* ---------- storage ---------- */
const store = {
  get(k, def) { try { const v = localStorage.getItem('p_' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem('p_' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  del(k) { try { localStorage.removeItem('p_' + k); } catch (e) { /* ignore */ } }
};

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const epochOf = (y, m, d) => Math.round(Date.UTC(y, m - 1, d) / 86400000);
const todayEpoch = () => { const n = new Date(); return epochOf(n.getFullYear(), n.getMonth() + 1, n.getDate()); };
const fmtDate = e => { const d = new Date(e * 86400000); return d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.' + d.getUTCFullYear() + '.'; };
const WD = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'];
const fmtDateWd = e => { const d = new Date(e * 86400000); return WD[d.getUTCDay()] + ', ' + d.getUTCDate() + '. ' + (d.getUTCMonth() + 1) + '. ' + d.getUTCFullYear() + '.'; };
const isoOf = e => new Date(e * 86400000).toISOString().slice(0, 10);

let DAYS = [], INTRO = [], PRAYERS = [], BOOK_TITLE = 'Posveta Isusu Kristu po Mariji';

const startDay = () => store.get('start', null);
const total = () => DAYS.length;
const begun = () => { const s = startDay(); return s !== null && todayEpoch() >= s; };
const inSeries = () => { const s = startDay(); if (s === null) return false; const d = todayEpoch() - s; return d >= 0 && d < total(); };
const todayIndex = () => { const s = startDay(); if (s === null) return 0; return Math.min(Math.max(todayEpoch() - s, 0), Math.max(total() - 1, 0)); };
const doneSet = () => new Set(store.get('done', []));
const isDone = i => doneSet().has(i);
const setDone = (i, v) => { const s = doneSet(); v ? s.add(i) : s.delete(i); store.set('done', [...s]); };
const doneCount = () => { const s = doneSet(); let n = 0; for (let i = 0; i < total(); i++) if (s.has(i)) n++; return n; };
const missedDays = () => { if (!begun()) return []; const t = todayIndex(), s = doneSet(), out = []; for (let i = 0; i < t; i++) if (!s.has(i)) out.push(i); return out; };

/* ---------- theme ---------- */
function applyTheme() {
  const p = PALETTES.find(x => x.id === store.get('theme', 'light')) || PALETTES[0];
  const r = document.documentElement.style;
  r.setProperty('--bg', p.bg); r.setProperty('--surface', p.surface); r.setProperty('--text', p.text);
  r.setProperty('--sec', p.sec); r.setProperty('--primary', p.primary); r.setProperty('--onprimary', p.onprimary);
  r.setProperty('--accent', p.accent); r.setProperty('--border', p.border);
  r.setProperty('--scale', SCALES[scaleIndex()]);
  document.body.classList.toggle('justify', store.get('justify', true));
  let m = document.querySelector('meta[name=theme-color]');
  if (m) m.setAttribute('content', p.bg);
}
const scaleIndex = () => Math.min(Math.max(store.get('scale', 1), 0), SCALES.length - 1);

/* ---------- text ---------- */
function paragraphs(text) {
  return text.split('\n\n').map(p => p.startsWith('## ') ? {h: true, t: p.slice(3).trim()} : {h: false, t: p.trim()}).filter(p => p.t);
}
function bodyHtml(text) {
  return paragraphs(text).map((p, i) => p.h ? `<h3 data-p="${i}">${esc(p.t)}</h3>` : `<p data-p="${i}">${esc(p.t)}</p>`).join('');
}

/* ---------- read aloud (Web Speech API) ---------- */
const TTS = {
  segs: [], i: 0, state: 'idle', gen: 0, key: '', pars: [],
  load(key, text) {
    if (this.key === key && this.segs.length) return;
    this.stop();
    this.key = key;
    this.pars = paragraphs(text);
    this.segs = [];
    this.pars.forEach((p, pi) => {
      const sentences = p.t.match(/[^.!?…]+[.!?…]*["”“»)]*\s*|[^.!?…]+$/g) || [p.t];
      let cur = '';
      sentences.forEach(s => {
        if (cur && (cur + s).length > 220) { this.segs.push({par: pi, t: cur.trim()}); cur = ''; }
        cur += s;
      });
      if (cur.trim()) this.segs.push({par: pi, t: cur.trim()});
    });
    const savedPar = store.get('ri_' + key, 0);
    const idx = this.segs.findIndex(s => s.par >= savedPar);
    this.i = idx < 0 ? 0 : idx;
  },
  supported() { return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; },
  vkey(v) { return (v.voiceURI || '') + '|' + v.name + '|' + v.lang; },
  voices() {
    try {
      const seen = new Set(), out = [];
      speechSynthesis.getVoices().filter(v => /^hr/i.test(v.lang)).forEach(v => { const k = this.vkey(v); if (!seen.has(k)) { seen.add(k); out.push(v); } });
      return out.slice(0, 5);
    } catch (e) { return []; }
  },
  vindex() { const l = this.voices(), n = store.get('voice', null); const i = l.findIndex(v => this.vkey(v) === n || v.name === n); return i < 0 ? 0 : i; },
  voice() { const l = this.voices(); return l[this.vindex()] || null; },
  rate() { return SPEEDS[Math.min(Math.max(store.get('speed', 1), 0), SPEEDS.length - 1)]; },
  par() { return this.segs.length ? this.segs[this.i].par : 0; },
  speak(i) {
    if (!this.segs.length) return;
    this.gen++;
    const g = this.gen;
    this.i = Math.min(Math.max(i, 0), this.segs.length - 1);
    const seg = this.segs[this.i];
    const u = new SpeechSynthesisUtterance(seg.t);
    u.lang = 'hr-HR';
    const v = this.voice();
    if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = this.rate();
    const idx = this.i;
    u.onend = () => {
      if (g !== this.gen || this.state !== 'playing') return;
      if (idx + 1 < this.segs.length) this.speak(idx + 1);
      else { this.state = 'idle'; this.i = 0; store.set('ri_' + this.key, 0); this.notify(); }
    };
    u.onerror = e => {
      if (g !== this.gen) return;
      if (e && (e.error === 'canceled' || e.error === 'interrupted')) return;
      this.state = 'error'; this.notify();
    };
    window.__utterance = u; // keeps a reference (some browsers drop the end event otherwise)
    try { speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { this.state = 'error'; }
    store.set('ri_' + this.key, seg.par);
    this.notify();
  },
  play() { if (!this.segs.length) return; this.state = 'playing'; this.speak(this.i); },
  pause() { this.state = 'paused'; this.gen++; try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } this.notify(); },
  toggle() { this.state === 'playing' ? this.pause() : this.play(); },
  stop() { this.state = 'idle'; this.gen++; try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } },
  restart() { this.i = 0; store.set('ri_' + this.key, 0); this.play(); },
  skip(d) {
    if (!this.segs.length) return;
    const target = Math.min(Math.max(this.par() + d, 0), this.pars.length - 1);
    let idx = this.segs.findIndex(s => s.par >= target);
    if (idx < 0) idx = this.segs.length - 1;
    if (this.state === 'playing') this.speak(idx); else { this.i = idx; store.set('ri_' + this.key, this.segs[idx].par); this.notify(); }
  },
  cycleSpeed() { store.set('speed', (store.get('speed', 1) + 1) % SPEEDS.length); if (this.state === 'playing') this.speak(this.i); else this.notify(); },
  cycleVoice() {
    const l = this.voices(); if (l.length < 2) return;
    const cur = l.indexOf(this.voice());
    store.set('voice', l[(cur + 1) % l.length].name);
    if (this.state === 'playing') this.speak(this.i); else this.notify();
  },
  notify() { updateTtsUi(); }
};


/* ---------- recordings (streamed from the recordings site) ---------- */
const AUDIO = {
  base: 'https://jurett.github.io/Posveta-snimke/audio/mp3/',
  days: 33, /* dan 34 nema snimke */
  intro: {priprema: 'uvod_priprema', razmatranje: 'uvod_razmatranje', krunica: 'uvod_napomena_za_krunicu'}
};
const dayAudio = i => (i >= 0 && i < AUDIO.days) ? AUDIO.base + 'dan' + String(i + 1).padStart(2, '0') + '.mp3' : null;
const introAudio = id => AUDIO.intro[id] ? AUDIO.base + AUDIO.intro[id] + '.mp3' : null;
const fmtTime = t => { t = Math.max(0, Math.floor(t || 0)); const m = Math.floor(t / 60), s = t % 60; return m + ':' + String(s).padStart(2, '0'); };
let PAGE = {key: '', text: '', audio: null, title: ''};

const REC = {
  a: null, key: '', url: '', state: 'idle', pos: 0, pendingSeek: null, lastSave: 0,
  load(key, url) {
    if (this.key === key && this.url === url) return;
    this.stop();
    this.key = key; this.url = url;
    this.pos = store.get('rp_' + key, 0);
  },
  rate() { return SPEEDS[Math.min(Math.max(store.get('speed', 1), 0), SPEEDS.length - 1)]; },
  ensure() {
    if (this.a) return this.a;
    const a = new Audio();
    a.preload = 'none';
    a.addEventListener('loadedmetadata', () => {
      if (this.pendingSeek !== null) {
        const t = this.pendingSeek; this.pendingSeek = null;
        if (t > 1 && (!isFinite(a.duration) || t < a.duration - 3)) { try { a.currentTime = t; } catch (e) { /* ignore */ } }
      }
      this.notify();
    });
    a.addEventListener('playing', () => { this.state = 'playing'; this.notify(); });
    a.addEventListener('waiting', () => { if (this.state === 'playing') { this.state = 'loading'; this.notify(); } });
    a.addEventListener('pause', () => { if (this.state === 'playing' || this.state === 'loading') { this.state = 'paused'; this.savePos(true); this.notify(); } });
    a.addEventListener('ended', () => { this.state = 'idle'; this.pos = 0; store.set('rp_' + this.key, 0); this.notify(); });
    a.addEventListener('error', () => { if (this.url) { this.state = 'error'; this.notify(); } });
    a.addEventListener('timeupdate', () => { this.savePos(false); updateProgress(); });
    this.a = a;
    try {
      if ('mediaSession' in navigator) {
        const ms = navigator.mediaSession;
        ms.setActionHandler('play', () => this.play());
        ms.setActionHandler('pause', () => this.pause());
        ms.setActionHandler('seekbackward', () => this.skip(-15));
        ms.setActionHandler('seekforward', () => this.skip(15));
      }
    } catch (e) { /* ignore */ }
    return a;
  },
  loaded() { return !!(this.a && this.a.dataset.url === this.url && this.a.readyState > 0); },
  savePos(force) {
    if (!this.a || this.a.dataset.url !== this.url) return;
    const now = Date.now();
    if (!force && now - this.lastSave < 3000) return;
    this.lastSave = now;
    this.pos = this.a.currentTime || 0;
    store.set('rp_' + this.key, Math.floor(this.pos));
  },
  play() {
    if (!this.url) return;
    const a = this.ensure();
    if (a.dataset.url !== this.url) {
      this.pendingSeek = this.pos;
      a.dataset.url = this.url;
      a.src = this.url;
    }
    a.playbackRate = this.rate();
    this.state = 'loading'; this.notify();
    try {
      if ('mediaSession' in navigator) navigator.mediaSession.metadata = new MediaMetadata({title: PAGE.title || 'Snimka', artist: BOOK_TITLE});
    } catch (e) { /* ignore */ }
    const pr = a.play();
    if (pr && pr.catch) pr.catch(err => { if (err && err.name === 'AbortError') return; this.state = 'error'; this.notify(); });
  },
  pause() { this.state = 'paused'; if (this.a) { this.a.pause(); this.savePos(true); } this.notify(); },
  toggle() { (this.state === 'playing' || this.state === 'loading') ? this.pause() : this.play(); },
  stop() {
    this.state = 'idle';
    if (this.a && this.a.dataset.url === this.url) { this.savePos(true); }
    if (this.a) this.a.pause();
  },
  restart() {
    this.pos = 0; store.set('rp_' + this.key, 0);
    if (this.loaded()) { this.a.currentTime = 0; this.pendingSeek = null; } else this.pendingSeek = null;
    this.play();
  },
  skip(d) {
    if (this.loaded()) {
      const dur = isFinite(this.a.duration) ? this.a.duration : Infinity;
      this.a.currentTime = Math.min(Math.max(this.a.currentTime + d, 0), dur);
      this.savePos(true);
    } else {
      this.pos = Math.max(0, this.pos + d);
      store.set('rp_' + this.key, Math.floor(this.pos));
    }
    this.notify();
  },
  applyRate() { if (this.a) this.a.playbackRate = this.rate(); this.notify(); },
  notify() { updateTtsUi(); }
};

const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  restart: '<svg viewBox="0 0 24 24"><path d="M12 5V2L7 6.5 12 11V8a5 5 0 1 1-5 5H5a7 7 0 1 0 7-8z"/></svg>',
  prev: '<svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zM20 6v12L9.5 12z"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M16 6h2v12h-2zM4 6l10.5 6L4 18z"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11z"/></svg>'
};

function ttsHtml() {
  if (!TTS.supported() && !PAGE.audio) return '<div class="hint">Čitanje naglas nije dostupno u ovom pregledniku.</div>';
  return `<div class="tts" id="tts">
    <button class="main primary" data-act="tts-toggle" id="ttsPlay" aria-label="Čitaj naglas">${ICON.play}</button>
    <button data-act="tts-restart" aria-label="Čitaj od početka">${ICON.restart}</button>
    <button data-act="tts-prev" aria-label="Prethodni odlomak">${ICON.prev}</button>
    <button data-act="tts-next" aria-label="Sljedeći odlomak">${ICON.next}</button>
    <button class="small" data-act="tts-speed" id="ttsSpeed"></button>
    <button class="small" data-act="tts-voice" id="ttsVoice" style="display:none"></button>
  </div><div class="pbar" aria-hidden="true"><div id="pbarFill"></div></div><div class="ttsStatus" id="ttsStatus"></div>`;
}

const hasRec = () => !!PAGE.audio;
function curMode() {
  if (!hasRec()) return 'tts';
  if (!TTS.supported() || !TTS.voices().length) return 'rec';
  return store.get('mode', 'rec') === 'tts' ? 'tts' : 'rec';
}
const eng = () => curMode() === 'rec' ? REC : TTS;
const optionCount = () => (TTS.supported() ? TTS.voices().length : 0) + (hasRec() ? 1 : 0);

function cycleSource() {
  const vs = TTS.supported() ? TTS.voices() : [];
  const n = vs.length + (hasRec() ? 1 : 0);
  if (n < 2) return;
  const cur = curMode() === 'rec' ? vs.length : TTS.vindex();   /* indeks: glasovi 0..n-1, snimka zadnja */
  const next = (cur + 1) % n;
  const e = eng();
  const wasPlaying = e.state === 'playing' || e.state === 'loading';
  e.stop();
  if (next === vs.length && hasRec()) store.set('mode', 'rec');
  else { store.set('mode', 'tts'); store.set('voice', TTS.vkey(vs[next])); }
  if (wasPlaying) eng().play(); else updateTtsUi();
}

function updateProgress() {
  const fill = document.getElementById('pbarFill');
  if (!fill) return;
  let f = 0;
  if (curMode() === 'rec') {
    const a = REC.a;
    if (REC.loaded() && isFinite(a.duration) && a.duration > 0) f = a.currentTime / a.duration;
  } else if (TTS.pars.length) f = (TTS.par() + (TTS.state === 'idle' ? 0 : 1)) / TTS.pars.length;
  fill.style.width = Math.min(Math.max(f, 0), 1) * 100 + '%';
  if (curMode() === 'rec' && (REC.state === 'playing' || REC.state === 'paused')) {
    const st = document.getElementById('ttsStatus');
    if (st && REC.loaded()) st.textContent = 'Snimka · ' + fmtTime(REC.a.currentTime) + (isFinite(REC.a.duration) ? ' / ' + fmtTime(REC.a.duration) : '');
  }
}

function updateTtsUi() {
  const play = document.getElementById('ttsPlay');
  if (!play) return;
  const m = curMode(), e = eng();
  const playing = e.state === 'playing' || (m === 'rec' && e.state === 'loading');
  play.innerHTML = playing ? ICON.pause : ICON.play;
  play.setAttribute('aria-label', playing ? 'Pauza' : (m === 'rec' ? 'Slušaj snimku' : 'Čitaj naglas'));
  const prev = document.querySelector('[data-act=tts-prev]'), next = document.querySelector('[data-act=tts-next]');
  if (prev) prev.setAttribute('aria-label', m === 'rec' ? 'Natrag 15 sekundi' : 'Prethodni odlomak');
  if (next) next.setAttribute('aria-label', m === 'rec' ? 'Naprijed 15 sekundi' : 'Sljedeći odlomak');
  document.getElementById('ttsSpeed').textContent = TTS.rate() + '×';
  const vs = TTS.supported() ? TTS.voices() : [], vb = document.getElementById('ttsVoice');
  vb.style.display = optionCount() > 1 ? '' : 'none';
  if (m === 'rec') { vb.innerHTML = ICON.mic; vb.setAttribute('aria-label', 'Izvor: snimka'); }
  else { vb.textContent = '♪ ' + (TTS.vindex() + 1); vb.setAttribute('aria-label', 'Izvor: računalni glas'); }
  let msg = '';
  if (m === 'rec') {
    if (REC.state === 'error') msg = 'Snimka se ne može učitati. Provjerite internetsku vezu ili odaberite računalni glas.';
    else if (REC.state === 'loading') msg = 'Učitavam snimku…';
    else if (REC.state === 'playing' || REC.state === 'paused') msg = REC.loaded() ? 'Snimka · ' + fmtTime(REC.a.currentTime) + (isFinite(REC.a.duration) ? ' / ' + fmtTime(REC.a.duration) : '') : 'Snimka';
    else msg = 'Snimka' + (REC.pos > 1 ? ' · nastavak od ' + fmtTime(REC.pos) : '');
  } else {
    if (TTS.state === 'playing' || TTS.state === 'paused') msg = 'Odlomak ' + (TTS.par() + 1) + ' od ' + TTS.pars.length;
    else if (TTS.state === 'error') msg = 'Čitanje naglas nije uspjelo.';
    else if (!vs.length && TTS.supported() && speechSynthesis.getVoices().length) msg = 'Hrvatski glas nije pronađen. Na iPhoneu: Postavke → Pristupačnost → Izgovoreni sadržaj → Glasovi → Hrvatski.';
  }
  document.getElementById('ttsStatus').textContent = msg;
  updateProgress();
  document.querySelectorAll('.body .cur').forEach(x => x.classList.remove('cur'));
  if (m === 'tts' && (TTS.state === 'playing' || TTS.state === 'paused')) {
    const el = document.querySelector(`.body [data-p="${TTS.par()}"]`);
    if (el) { el.classList.add('cur'); if (TTS.state === 'playing') el.scrollIntoView({block: 'center', behavior: 'smooth'}); }
  }
}
if (TTS.supported()) { try { speechSynthesis.onvoiceschanged = () => updateTtsUi(); } catch (e) { /* ignore */ } }
document.addEventListener('visibilitychange', () => { if (document.hidden && TTS.state === 'playing') TTS.pause(); });

/* ---------- pages ---------- */
const app = () => document.getElementById('app');
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = () => window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

function renderHome() {
  const n = total(), s = startDay();
  let status, startLabel;
  if (s === null) { status = 'Prije početka pročitajte uvod. Kad ste spremni, pritisnite „Započni posvetu“ (prvi dan je danas) ili niže odaberite datum početka.'; startLabel = 'Započni posvetu'; }
  else if (begun()) { const i = todayIndex(); status = `Danas: dan ${i + 1} od ${n} – ${DAYS[i].title}`; startLabel = `Nastavi: dan ${i + 1}`; }
  else { status = `Posveta počinje ${fmtDate(s)}`; startLabel = 'Otvori: dan 1'; }
  const missed = missedDays(), done = doneCount();
  const prog = s === null ? '' : `<div class="progress"><div style="width:${n ? done * 100 / n : 0}%"></div></div><div class="muted" style="margin-top:4px">Završeno ${done} od ${n} dana</div>` +
    (missed.length ? `<div style="margin-top:6px;font-size:.92em">Propušteno dana: ${missed.length}. Možete nastaviti od dana ${missed[0] + 1}.</div>` : '');
  const cur = store.get('theme', 'light');
  const sw = PALETTES.map(p => `<button class="sw ${p.id === cur ? 'sel' : ''}" data-act="theme" data-id="${p.id}" aria-label="${esc(p.name)}" style="background:linear-gradient(135deg,${p.bg} 50%,${p.accent} 50%)"></button>`).join('');
  const links = (arr, kind) => arr.map(p => `<button class="link" data-go="#/page/${kind}/${esc(p.id)}">› ${esc(p.title)}</button>`).join('');
  const install = isIOS && !standalone() ? '<div class="hint">Za instalaciju na iPhone: otvorite ovu stranicu u Safariju, dodirnite Dijeli, pa „Dodaj na početni zaslon“.</div>' : '';
  app().innerHTML = `
    <h1>${esc(BOOK_TITLE)}</h1>
    <div class="muted">Sv. Ljudevit Marija Grignion Montfortski</div>
    <div class="quote">„Budite apostoli slave Marijine nasljedujući sv. Ljudevita Grigniona Montfortskog i bit ćete pobjednici u ovom boju koji nadilazi ljudske snage.“</div>
    <div class="muted">Blaženi kardinal Alojzije Stepinac</div>
    ${install}
    <p style="margin:24px 0 0">${esc(status)}</p>${prog}
    <button class="primary block" data-act="start">${esc(startLabel)}</button>
    <button class="block" data-go="#/days">Svi dani</button>
    <div class="row" style="align-items:center;margin-top:14px"><span style="flex:1">Datum početka</span>
      <input type="date" id="startDate" value="${s === null ? '' : isoOf(s)}" style="flex:1"></div>
    <button class="block" data-act="feasts">Početak prema Marijinom blagdanu</button>
    <div id="feastBox"></div>
    <div class="row" style="align-items:center;margin-top:14px"><span style="flex:1">Veličina slova</span>
      <button data-act="font-" aria-label="Manja slova">A−</button><button data-act="font+" aria-label="Veća slova">A+</button></div>
    <div class="row" style="align-items:center;margin-top:14px"><span style="flex:1">Obostrano poravnanje teksta</span>
      <button data-act="justify" style="flex:0 0 auto;min-width:110px">${store.get('justify', true) ? 'Uključeno' : 'Isključeno'}</button></div>
    <div class="swatches">${sw}</div>
    <div class="box"><div class="sec">UVOD</div>${links(INTRO, 'intro')}</div>
    <div class="box"><div class="sec">MOLITVE</div>${links(PRAYERS, 'prayer')}</div>
    <button class="link" data-act="share-notes">Podijeli bilješke</button>
    <button class="link" data-act="reset">Započni iznova</button>`;
}

function renderDays() {
  const t = todayIndex(), inS = inSeries(), ds = doneSet();
  app().innerHTML = `<div class="top"><button data-act="back">‹ Natrag</button></div><h2 class="day">Svi dani</h2>
    <div class="box daylist">${DAYS.map((d, i) => `<button class="link" data-go="#/day/${i}"><span>${ds.has(i) ? '✓' : (inS && i === t ? '●' : '○')}</span><span>${i + 1}. ${esc(d.title)}</span></button>`).join('')}</div>`;
}

function renderDay(i, toReading) {
  if (!(i >= 0 && i < total())) { location.hash = '#/'; return; }
  const d = DAYS[i], isToday = i === todayIndex() && inSeries();
  const sd = startDay(), dateTxt = sd === null ? '' : ' · ' + fmtDateWd(sd + i);
  PAGE = {key: 'day:' + i, text: d.text, audio: dayAudio(i), title: d.title};
  const prayers = (d.prayers || []).map(id => PRAYERS.find(p => p.id === id)).filter(Boolean);
  const pbox = prayers.length ? `<div class="box"><div class="muted">Molitve za danas:</div>${prayers.map(p => `<button class="link" data-go="#/page/prayer/${esc(p.id)}?day=${i}">› ${esc(p.title)}</button>`).join('')}</div>` : '';
  app().innerHTML = `
    <div class="top"><button data-act="back">‹ Natrag</button></div>
    <div class="muted">Dan ${i + 1} od ${total()}${dateTxt}${isToday ? ' · danas' : ''}</div>
    <h2 class="day">${esc(d.title)}</h2>
    ${pbox}
    <div class="box">${ttsHtml()}</div>
    <div class="body jok">${bodyHtml(d.text)}</div>
    <div class="sec" style="margin-top:20px">MOJE BILJEŠKE</div>
    <textarea id="note" placeholder="Zapišite svoje misli uz današnju duhovnu vježbu">${esc(store.get('note_' + i, ''))}</textarea>
    <button class="primary block" data-act="done" data-i="${i}">${isDone(i) ? '✓ Završeno' : 'Označi kao završeno'}</button>
    <div class="row"><button data-go="#/day/${i - 1}" ${i === 0 ? 'disabled' : ''}>‹ Prethodni</button><button data-go="#/day/${i + 1}" ${i === total() - 1 ? 'disabled' : ''}>Sljedeći ›</button></div>
    <div class="row"><button data-go="#/">Naslovnica</button><button data-go="#/days">Svi dani</button></div>`;
  TTS.load('day:' + i, d.text);
  if (PAGE.audio) REC.load(PAGE.key, PAGE.audio);
  updateTtsUi();
  const y = store.get('scroll_' + i, 0);
  if (toReading) { const t = document.getElementById('tts'); if (t) window.scrollTo(0, Math.max(t.getBoundingClientRect().top + window.scrollY - 16, 0)); }
  else if (y > 0) window.scrollTo(0, y);
}

function nextTarget(kind, id, dayCtx) {
  if (kind !== 'prayer' || dayCtx === null || !(dayCtx >= 0 && dayCtx < total())) return null;
  const ids = (DAYS[dayCtx].prayers || []).filter(x => PRAYERS.some(p => p.id === x));
  const k = ids.indexOf(id);
  if (k < 0) return null;
  return k + 1 < ids.length ? '#/page/prayer/' + ids[k + 1] + '?day=' + dayCtx : '#/day/' + dayCtx + '?r=1';
}
function navHtml(kind, id, dayCtx) {
  const nx = nextTarget(kind, id, dayCtx);
  if (!nx) return '<button class="block" data-act="back">‹ Natrag</button>';
  return `<div class="row"><button data-act="back">‹ Natrag</button><button class="primary" data-go="${esc(nx)}">Naprijed ›</button></div>`;
}

function renderPage(kind, id, dayCtx) {
  const page = (kind === 'intro' ? INTRO : PRAYERS).find(p => p.id === id);
  if (!page) { location.hash = '#/'; return; }
  PAGE = {key: 'page:' + kind + ':' + id, text: page.text, audio: kind === 'intro' ? introAudio(id) : null, title: page.title};
  app().innerHTML = `
    <div class="top"><button data-act="back">‹ Natrag</button></div>
    <h2 class="day">${esc(page.title)}</h2>
    <div class="box">${ttsHtml()}</div>
    <div class="body${kind === 'intro' ? ' jok' : ''}">${bodyHtml(page.text)}</div>
    ${navHtml(kind, id, dayCtx)}`;
  TTS.load('page:' + kind + ':' + id, page.text);
  if (PAGE.audio) REC.load(PAGE.key, PAGE.audio);
  updateTtsUi();
}

/* ---------- router ---------- */
let currentRoute = '';
function saveScroll() {
  const m = /^#\/day\/(\d+)(?:\?.*)?$/.exec(currentRoute);
  if (m) store.set('scroll_' + m[1], Math.round(window.scrollY));
}
function saveNote() {
  const m = /^#\/day\/(\d+)(?:\?.*)?$/.exec(currentRoute), ta = document.getElementById('note');
  if (m && ta) { ta.value.trim() ? store.set('note_' + m[1], ta.value) : store.del('note_' + m[1]); }
}
function route() {
  saveScroll(); saveNote();
  TTS.stop(); REC.stop();
  PAGE = {key: '', text: '', audio: null, title: ''};
  const h = location.hash || '#/';
  currentRoute = h;
  window.scrollTo(0, 0);
  let m;
  if (h === '#/' || h === '') renderHome();
  else if (h === '#/days') renderDays();
  else if ((m = /^#\/day\/(\d+)(\?r=1)?$/.exec(h))) renderDay(parseInt(m[1], 10), !!m[2]);
  else if ((m = /^#\/page\/(intro|prayer)\/([\w-]+)(?:\?day=(\d+))?$/.exec(h))) renderPage(m[1], m[2], m[3] === undefined ? null : parseInt(m[3], 10));
  else renderHome();
}
window.addEventListener('hashchange', route);
window.addEventListener('pagehide', () => { saveScroll(); saveNote(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { saveScroll(); saveNote(); } });

/* ---------- actions ---------- */
function shareNotes() {
  const lines = [];
  DAYS.forEach((d, i) => { const n = (store.get('note_' + i, '') || '').trim(); if (n) lines.push(`Dan ${i + 1} – ${d.title}\n${n}`); });
  if (!lines.length) { alert('Još nema zapisanih bilješki.'); return; }
  const text = 'Bilješke – ' + BOOK_TITLE + '\n\n' + lines.join('\n\n');
  if (navigator.share) navigator.share({title: 'Bilješke', text}).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => alert('Bilješke su kopirane.'));
  else alert(text);
}

function showFeasts() {
  const box = document.getElementById('feastBox');
  if (box.innerHTML) { box.innerHTML = ''; return; }
  const today = todayEpoch(), t = new Date().getFullYear();
  box.innerHTML = '<div class="box"><div class="muted">Dan posvete na blagdan:</div>' + FEASTS.map((f, k) => {
    let feast = epochOf(t, f[0], f[1]), start = feast - (total() - 1);
    if (start < today) { feast = epochOf(t + 1, f[0], f[1]); start = feast - (total() - 1); }
    return `<button class="link" style="flex-direction:column;align-items:flex-start;height:auto;padding:8px 4px" data-act="feast" data-start="${start}"><span>${esc(f[2])}</span><span class="muted">početak ${fmtDate(start)}</span></button>`;
  }).join('') + '</div>';
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act],[data-go]');
  if (!el) return;
  if (el.dataset.go) { location.hash = el.dataset.go; return; }
  switch (el.dataset.act) {
    case 'back': history.length > 1 ? history.back() : (location.hash = '#/'); break;
    case 'start': {
      if (!total()) return;
      if (startDay() === null) store.set('start', todayEpoch());
      location.hash = '#/day/' + todayIndex(); break;
    }
    case 'feasts': showFeasts(); break;
    case 'feast': store.set('start', parseInt(el.dataset.start, 10)); renderHome(); break;
    case 'theme': store.set('theme', el.dataset.id); applyTheme(); renderHome(); break;
    case 'font+': store.set('scale', Math.min(scaleIndex() + 1, SCALES.length - 1)); applyTheme(); break;
    case 'justify': store.set('justify', !store.get('justify', true)); applyTheme(); renderHome(); break;
    case 'font-': store.set('scale', Math.max(scaleIndex() - 1, 0)); applyTheme(); break;
    case 'done': { const i = parseInt(el.dataset.i, 10), v = !isDone(i); setDone(i, v); el.textContent = v ? '✓ Završeno' : 'Označi kao završeno'; break; }
    case 'share-notes': shareNotes(); break;
    case 'reset': if (confirm('Počinjete iznova? Datum početka i oznake završenih dana bit će obrisani (bilješke ostaju).')) { store.del('start'); store.del('done'); renderHome(); } break;
    case 'tts-toggle': eng().toggle(); break;
    case 'tts-restart': eng().restart(); break;
    case 'tts-prev': curMode() === 'rec' ? REC.skip(-15) : TTS.skip(-1); break;
    case 'tts-next': curMode() === 'rec' ? REC.skip(15) : TTS.skip(1); break;
    case 'tts-speed': store.set('speed', (store.get('speed', 1) + 1) % SPEEDS.length); curMode() === 'rec' ? REC.applyRate() : (TTS.state === 'playing' ? TTS.speak(TTS.i) : TTS.notify()); break;
    case 'tts-voice': cycleSource(); break;
  }
});
document.addEventListener('change', e => {
  if (e.target && e.target.id === 'startDate' && e.target.value) {
    const [y, m, d] = e.target.value.split('-').map(Number);
    store.set('start', epochOf(y, m, d)); renderHome();
  }
});
document.addEventListener('input', e => { if (e.target && e.target.id === 'note') saveNote(); });

/* ---------- start ---------- */
async function load(name) { const r = await fetch('content/' + name + '.json'); if (!r.ok) throw new Error(name); return r.json(); }

async function init() {
  applyTheme();
  try {
    const [d, i, p] = await Promise.all([load('days'), load('intro'), load('prayers')]);
    DAYS = d.days || []; BOOK_TITLE = d.title || BOOK_TITLE; INTRO = i.pages || []; PRAYERS = p.pages || [];
  } catch (err) {
    app().innerHTML = '<p>Sadržaj se nije mogao učitati. Provjerite internetsku vezu i osvježite stranicu.</p>';
    return;
  }
  route();
}
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
init();
