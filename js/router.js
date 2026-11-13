// App flow: Start screen -> guided tour (first launch only) -> "Try it!" hook (js/studentFlow.js: move your body, then the joint definition)
//   -> Labels -> Activity -> Quiz -> score -> "What you learned" (Retake quiz / Play again).
// Labels and Activity unlock Next once all four joints have been explored there. Every screen is rebuilt when the language changes (see setLang).
import { state, later, clearTimers, setMode, setRedo, setScore, setSummaryOff } from './state.js';
import { LANGS, BCP47 } from './i18n.js';
import { t, say, stopAudio, OPUS } from './audio.js';
import { $, E, banner, panel, btn } from './dom.js';
import * as sc from './scene.js';
import { Tour } from './tour.js';
import { startTryIt, finish as finishTryIt } from './studentFlow.js';
import { openSort, sortDone } from './sort.js';
import { sfx } from './sfx.js';
import { fsSupported, isFullscreen, docFullscreen, isIOS, enterFullscreen, exitFullscreen, onFullscreenChange, standalone } from './fullscreen.js';
import { asset, preload, lessonFiles } from './preload.js';
import { XAPI, screen as xScreen, question as xQuestion, tapObj } from './xapi.js';

let tour = null;                         // guided tour (logic from the Sublimation project), created on first use
const TOUCH = matchMedia('(pointer: coarse)').matches;   // touch screens get "Tap ..." instead of "Click ..." hints
const fmt = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');

const GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon-img globe-icon"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
export function renderLangButton() {
  const b = $('#langb'); b.innerHTML = GLOBE;
  b.setAttribute('aria-label', t('btnLang') + ': ' + LANGS.find(x => x[0] === state.lang)[1]); b.setAttribute('aria-haspopup', 'dialog');
}
export function setLang(l) {
  stopAudio();                           // never let the old language keep talking (also on screens that have no redo, e.g. start screen / tour)
  state.lang = l; document.documentElement.lang = BCP47[l] || l; document.body.dataset.l = l;   // html lang = real tag (tl = Tamil -> ta-IN)
  if (state.ready && state.sizes) preload(lessonFiles(state.sizes, state.A, l, OPUS), state.sizes);   // language switched later: warm its voice + font in the background
  document.title = t('title');
  const loadText = $('#loadText'); if (loadText && !$('#load').dataset.err) loadText.textContent = t('loading');
  const retry = $('#loadRetry'); if (retry) retry.textContent = t('retry');
  renderLangButton(); updateButtonTitles(); renderChrome();
  $('#rotateTitle').textContent = t('rotateTitle');
  if (state.redo) {                      // re-render whatever is on screen in the new language and play its voice-over again
    state.langSwitch = true;             // lets screens that normally have no voice-over (recall / quiz question) read their text now
    try { state.redo(); } finally { state.langSwitch = false; }
  }
  if (tour && tour.active) { tour.spokenStep = -1; tour.render(); }   // re-read the current step in the new language
}

// Update button titles for accessibility and tooltips
export function updateButtonTitles() {
  $('#langb').setAttribute('title', t('btnLang'));
  $('#theme').setAttribute('title', t('btnTheme'));
  const fsKey = isFullscreen() ? 'btnFullscreenExit' : 'btnFullscreen';      // the full screen icon's title follows its state
  $('#fs').setAttribute('title', t(fsKey));
  $('#replay').setAttribute('title', t('btnReplay'));
  $('#langb').setAttribute('aria-label', t('btnLang') + ': ' + LANGS.find(x => x[0] === state.lang)[1]);
  [['#fs', fsKey], ['#replay', 'btnReplay'], ['#theme', 'btnTheme']].forEach(([s, k]) => $(s).setAttribute('aria-label', t(k)));
  $('#c').setAttribute('aria-label', t('a11yCanvas')); $('#tl').setAttribute('aria-label', t('a11ySettings')); $('#bl').setAttribute('aria-label', t('a11yNav'));
  const prev = $('#prev'), next = $('#next');
  if (prev) {
    prev.setAttribute('title', t('previous')); prev.setAttribute('aria-label', t('previous'));
    if (!prev.hidden) prev.textContent = t('previous');
  }
  if (next) {
    next.setAttribute('aria-label', t('next'));
    if (!next.hidden) next.textContent = t('next');
    next.title = next.disabled ? t('exploreAll') : t('next');
  }
}

// ---------------------------------------------------------------------------------------------------------------
let dots = [];                            // DOM overlays (label pills / markers) that follow 3D anchors
let sortOff = null;
let quietOnce = false;                    // return from a joint move: do not repeat the Activity intro voice                       // closes the Sort it board
function clearAll() {
  clearTimers(); stopAudio(); banner(); panel(); if (state.summaryOff) { state.summaryOff(); state.summaryOff = null; }
  dots.forEach(d => d.el.remove()); dots = []; $('#leaders') && $('#leaders').remove();
  document.querySelectorAll('#labels .hot').forEach(b => b.remove()); sc.onFrame.fn = null;     // Activity click targets must not survive a screen change
  sc.animate(null); sc.showModel(null); sc.showPieces(null); sc.showGlows(null); sc.resetPose();
  sc.lockCamera(false); sc.highlight(null); sc.demo(null);                                  // Replay from the Activity must not leave the camera locked
  if (sortOff) { sortOff(); sortOff = null; }
  setNav(null, null); setSteps(null); state.skip = null;                                   // section navigation is enabled only on Labels / Activity / Sort it / Quiz
}
function enter(mode, fn, homeMs) {
  clearAll(); setMode(mode); setRedo(() => enter(mode, fn)); setSteps(mode); sc.home(homeMs ?? 500); fn();   // home first: a screen restored after a language change (open label) flies on from there
  state.skip = DEV_NEXT[mode] || null;                                                         // ?dev=1: what the Skip button does here
  sc.lockCamera(mode === 'activity');                                                          // Activity: no zoom / rotation, the view stays as framed
}
// Bottom-left section navigation. Introduction intentionally has neither button. locked = Next shown but disabled (explore everything first).
function setNav(prevFn, nextFn, locked = false) {
  const pb = $('#prev'), nb = $('#next');
  const configure = (b, fn, label) => {
    if (!b) return;
    b.hidden = !fn;
    b.textContent = fn ? t(label) : '';
    b.setAttribute('aria-label', fn ? t(label) : '');
    b.title = fn ? t(label) : '';
    b.onclick = fn ? () => { stopAudio(); fn(); } : null;
  };
  configure(pb, prevFn, 'previous');
  configure(nb, nextFn, 'next');
  if (nb) { nb.disabled = !!nextFn && locked && !state.dev; if (nb.disabled) nb.title = t('exploreAll'); }   // ?dev=1: never locked
  syncDock();
}
// The bottom dock (Previous · stepper · Next) is hidden when it has nothing to show (start, recall, student flow, score cards).
const syncDock = () => { const d = $('#bl'); if (d) d.hidden = ['#prev', '#next', '#steps'].every(s => $(s).hidden); };
// Identity block (top-left on wide screens) + footer hint, rebuilt on language change.
function renderChrome() {
  $('#idTitle').textContent = t('title');
  $('#hint').textContent = t('hintOrbit');
  setSteps(state.mode);
}
// Thin 4-part progress bar at the top: Introduction / Labels / Activity / Quiz.
const SECTIONS = ['labels', 'activity', 'sort', 'quiz'];
function setSteps(mode) {
  const el = $('#steps'), i = SECTIONS.indexOf(mode), label = $('#stepLabel'), pn = $('#panel');
  document.body.dataset.mode = mode || '';
  el.hidden = label.hidden = i < 0;
  if (i < 0) { syncDock(); return; }
  label.textContent = t(mode);
  [...el.children].forEach((s, n) => { s.className = n < i ? 'done' : n === i ? 'on' : ''; });
  el.setAttribute('aria-valuenow', i + 1);
  el.setAttribute('aria-valuetext', fmt(t('stepOf'), { n: i + 1, t: SECTIONS.length, s: t(mode) }));
  el.title = el.getAttribute('aria-valuetext');
  syncDock();
}
const explored = where => sc.ORDER.filter(k => state.seen.has(where + ':' + k)).length;
const progressText = where => fmt(t('explored'), { n: explored(where), t: sc.ORDER.length });
const allExplored = where => explored(where) === sc.ORDER.length;

// small message under the toolbar (e.g. how to get full screen on iPhone)
let tipTimer = 0;
function showTip(text) {
  let el = $('#tip'); if (!el) { el = E('div', '', document.body); el.id = 'tip'; el.setAttribute('role', 'status'); el.onclick = () => { el.hidden = true; }; }
  el.textContent = text; el.hidden = false; clearTimeout(tipTimer); tipTimer = setTimeout(() => { el.hidden = true; }, 6000);
}
export function wireChrome() {
  // SVG icons copied from the Sublimation project: moon in dark mode, sun in light mode; expand / compress for fullscreen
  const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  const EXPAND = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
  const COMPRESS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>';
  const REPLAY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
  $('#theme').innerHTML = MOON; $('#fs').innerHTML = EXPAND; $('#replay').innerHTML = REPLAY;
  const applyTheme = light => {
    document.documentElement.dataset.theme = light ? 'light' : 'dark'; $('#theme').innerHTML = light ? SUN : MOON; sc.setTheme(!light);
    $('#theme').setAttribute('aria-pressed', String(light));
    document.querySelectorAll('img[data-logo]').forEach(i => { i.src = asset('assets/img/ConveGenius-logo-' + (light ? 'light' : 'dark') + '.webp'); });   // navy-text logo on light backgrounds
  };
  $('#theme').onclick = () => {
    const light = document.documentElement.dataset.theme !== 'light'; applyTheme(light);
    try { localStorage.setItem('joints-theme', light ? 'light' : 'dark'); } catch (e) {}   // remembered on this device only
  };
  applyTheme(document.documentElement.dataset.theme === 'light');
  // full screen button: always shown. Where pages cannot go full screen (iPhone Safari) it explains "Add to Home Screen";
  // opened from the home screen the game already runs full screen (manifest.webmanifest).
  const fsIcon = () => { const on = isFullscreen(); $('#fs').innerHTML = on ? COMPRESS : EXPAND; updateButtonTitles(); };
  $('#fs').onclick = () => {
    if (docFullscreen()) { exitFullscreen(); return; }                                         // full screen -> back to the normal screen
    if (standalone()) return;                                                                  // home-screen app: already full screen
    if (!fsSupported()) { showTip(t(isIOS() ? 'fsTipIOS' : 'fsTip')); return; }
    enterFullscreen();
  };
  onFullscreenChange(fsIcon); fsIcon();
  // Click feedback: brand yellow for 0.6 s (styles: .flash-gold in css/app.css); hover = light blue (mouse only)
  $('#replay').onclick = () => { replayStudentFlow(); };
  ['#langb', '#theme', '#fs', '#prev', '#next', '#replay'].forEach(sel => {
    const b = $(sel); if (!b) return;
    let tm; b.addEventListener('click', () => { b.classList.add('flash-gold'); clearTimeout(tm); tm = setTimeout(() => b.classList.remove('flash-gold'), 600); });
  });
  updateButtonTitles();
  if (state.dev) {
    const b = $('#devSkip'); b.hidden = false;
    b.onclick = () => { stopAudio(); if (tour && tour.active) tour.end(); else if (state.skip) state.skip(); };
  }
}
const overlay = () => { onFrameInit(); return $('#labels'); };
function onFrameInit() {
  sc.onFrame.fn = () => dots.forEach(d => { const p = sc.project(d.anchor); d.el.style.display = p.vis ? '' : 'none'; d.place(p); });
}

// ---------------------------------------------------------------------------------------------------------------
// Options + Submit: pick an option -> Submit -> the chosen option turns green / red.
//   opts.hints   : one hint per option (by ORIGINAL index). A wrong FIRST try only shows that hint and lets the student try again;
//                  the second wrong try (or a question without hints) reveals the right answer + explanation.
//   opts.explain : manifest key of the recorded explanation, played after the "correct" / "incorrect" clip
//   opts.shuffle : show the options in a random order (so the right answer is not always in the same place)
// done(firstTry) -> firstTry = right on the first attempt (that is what the score counts).
const shuffled = n => { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function choose(p, labels, correct, okTxt, noTxt, done, opts = {}) {
  // st = this question's progress (kept in state.quiz.cur): option order, selected option, tries, crossed-out option, answer.
  // A language change redraws the question from it: nothing the student picked or answered is lost.
  const st = opts.st || { order: null, sel: -1, tries: 0, crossed: -1, answered: -1 };
  if (!st.order) st.order = opts.shuffle ? shuffled(labels.length) : [...labels.keys()];
  const btns = [], fb = E('p', 'fb', p); fb.hidden = true; fb.setAttribute('role', 'status'); fb.setAttribute('aria-live', 'polite');
  const showHint = n => {                                         // first wrong try: that option crossed out + its hint
    btns[n].classList.remove('sel'); btns[n].classList.add('no'); btns[n].disabled = true;
    fb.hidden = false; fb.className = 'fb no'; fb.textContent = opts.hints[n] + ' ' + t('tryAgain') + '.';
  };
  const finish = (n, fresh) => {                                  // answered: only the chosen + the right option stay (css)
    const ok = n === correct;
    p.classList.add('answered'); btns.forEach(x => { x.disabled = true; x.classList.remove('sel'); });
    btns[n].classList.add(ok ? 'ok' : 'no'); if (!ok) btns[correct].classList.add('ok');
    fb.hidden = false; fb.className = 'fb ' + (ok ? 'ok' : 'no'); fb.textContent = ok ? okTxt : noTxt;
    sub.remove();
    const next = btn(p, t('cont'), () => done(ok && st.tries === 1));
    next.focus({ preventScroll: true });
    if (!fresh) return;                                           // redrawn after a language change: the caller plays the feedback voice
    sfx(ok ? 'correct' : 'wrong');
    // voice: the explanation that matches this answer (it already starts with "Yes!" / names the right joint); a plain "correct" / "incorrect" only when there is none
    if (opts.explain) say(opts.explain(ok), ok ? okTxt : noTxt); else say(ok ? 'correct' : 'incorrect', t(ok ? 'correct' : 'incorrect'));
  };
  const sub = btn(p, t('submit'), () => {
    if (st.sel < 0 || st.answered >= 0) return;
    st.tries++;
    const sel = st.sel, ok = sel === correct, hint = opts.hints && opts.hints[sel];
    if (opts.onAnswer) opts.onAnswer(sel, ok, st.tries, labels[sel], st.order.indexOf(sel));   // xAPI question_answered (every attempt)
    if (!ok && hint && st.tries === 1) {                          // first wrong try: hint + try again (that option stays crossed out)
      sfx('wrong'); st.crossed = sel; st.sel = -1; showHint(sel); sub.disabled = true;
      say(opts.hintKey ? opts.hintKey(sel) : 'incorrect', hint);  // recorded hint if there is one (manifest key), else text-to-speech
      return;
    }
    st.answered = sel; finish(sel, true);
  });
  st.order.forEach(n => {
    const b = E('button', 'opt', p, labels[n]); b.type = 'button'; p.insertBefore(b, fb); btns[n] = b;
    b.onclick = () => { if (st.answered >= 0) return; sfx('tap'); st.sel = n; btns.forEach((x, i) => x.classList.toggle('sel', i === n)); sub.disabled = false; };
  });
  sub.disabled = st.sel < 0;
  if (st.crossed >= 0 && st.answered < 0) showHint(st.crossed);   // restore after a language change
  if (st.sel >= 0 && st.answered < 0) btns[st.sel].classList.add('sel');
  if (st.answered >= 0) finish(st.answered, false);
  return st;
}

// First launch, after "Let's start": guided tour (only once) -> "Try it!" -> Labels -> Activity -> Quiz
export const startFlow = () => {
  $('#replay').classList.add('visible');                       // so the tour can point at it
  tour = tour || new Tour();
  setRedo(null);
  tour.onEnd = () => { state.tourDone = true; tryIt(); };
  tour.start();
};
// Replay (top-right button) and Play again (end card): a fresh start from the guided tour. Everything is reset - explored labels /
// joints, Sort it, quiz + score - so Next stays locked again until each section is completed.
function resetProgress() {
  state.seen = new Set(); state.quiz = null; setScore(0);
  state.sorted = {}; state.sortOrder = null; state.sortTries = {}; state.sortUi = null;
  pred = null; state.welcomed = false;
}
export const replayStudentFlow = () => {
  if (!state.startDone) return;
  if (tour && tour.active) { tour.onEnd = null; tour.end(); }  // Replay pressed during the tour: start it again from step 1
  resetProgress();
  clearAll(); setMode(''); setRedo(null); sc.home(600); sc.sitDown(1000);   // back onto the chair, then the tour ...
  later(startFlow, 1100);                                      // ... and after it the skeleton stands up again for Try it!
};
// After the tour (the first pop-up) the skeleton stands up from the chair in full view (~1.9 s), the chair fades, then
// "Try it!" starts beside the skeleton (it demonstrates the moves) and leads into Labels.
const STAND_MS = 1900;
function tryIt() {
  clearAll(); setMode(''); setRedo(null); sc.home(600); sc.standUp();
  const toLabels = () => { state.welcomed = true; enter('labels', labels); };
  state.skip = () => { clearTimers(); sc.hideChair(); toLabels(); };            // ?dev=1 Skip during the stand-up
  later(() => { sc.hideChair(); startTryIt(toLabels); state.skip = finishTryIt; }, STAND_MS);
}
// ?dev=1 (testing): a Skip button jumps past the current step, and Next is never locked.
const DEV_NEXT = {
  labels: () => enter('activity', activity),
  activity: () => enter('sort', sortIt),
  sort: () => enter('quiz', quiz),
  quiz: () => { if (!state.quiz) state.quiz = { i: 0, score: 0 }; summary(); }
};

// Two short fact rows for a joint: how it moves + where in the body.
function facts(p, k) {
  const dl = E('dl', 'facts', p);
  [['lblMove', k + 'S'], ['lblWhere', k + 'W']].forEach(([a, b]) => { E('dt', '', dl, t(a)); E('dd', '', dl, t(b)); });
}
function labels(selected = null) {
  if (!state.langSwitch) xScreen('labels', 'LABELS', 'explore');
  const nav = () => setNav(null, () => enter('activity', activity), !allExplored('labels'));   // Labels is the first section
  nav();
  const hint = () => banner(t(TOUCH ? 'labelsHintT' : 'labelsHint') + '  ' + progressText('labels'));
  hint(); if (!selected) say('labels', t('labelsHint'));
  // The joint models are NOT shown here: they overlapped the label pills and were never explained. They appear in the Activity,
  // next to the moving body part, with a caption saying the model moves the same way.
  const box = overlay(), NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg'); svg.id = 'leaders'; svg.setAttribute('aria-hidden', 'true'); box.prepend(svg);
  let chosen = null;
  const back = () => TOUCH ? 'labelsBack' : 'labelsBackM';       // "tap" on a touch screen, "click" with a mouse
  // the voice reads the joint, then "tap the highlighted label again to see all the labels"
  const read = k => {
    const v = say(k, t(k + 'D')), next = () => { if (chosen === k) say(back(), t(back())); };
    if (v && v.addEventListener) v.addEventListener('ended', next, { once: true }); else next();
  };
  const WORLD_SIDE = { pivotal: -1, fixed: 1, hinge: -1, ball: -1 };   // each label lives on a fixed side of the BODY (x axis): turn the model round and the label goes with it
  const items = sc.ORDER.map(k => {
    const el = E('button', 'lab' + (state.seen.has('labels:' + k) ? ' done' : ''), box, t(k)), g = document.createElementNS(NS, 'g'); el.type = 'button'; g.classList.add('leader');
    const ln = document.createElementNS(NS, 'line'), c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 4); g.append(ln, c); svg.append(g);
    el.onclick = () => open(k, true);
    dots.push({ el, anchor: sc.JOINTS[k].anchor, place() {} });
    return { k, el, g, ln, c, side: WORLD_SIDE[k] };
  });
  // open (or, tapped again, close) a label. fresh = a tap; false = drawn again after a language change (no sound, camera already there)
  function open(k, fresh) {
    const it = items.find(o => o.k === k), el = it.el, g = it.g;
    {
      dots.forEach(o => { o.el.classList.remove('on'); }); svg.querySelectorAll('.leader').forEach(l => l.classList.remove('on'));
      items.forEach(o => o.el.classList.remove('on'));
      if (fresh) sfx('tap');
      if (fresh && chosen === k) {                          // clicking the selected label again: deselect, close the card, zoom back out
        chosen = null; stopAudio(); panel(); sc.home(700); sc.highlight(null); hint(); return;   // ... and every label comes back
      }
      const first = !state.seen.has('labels:' + k);
      chosen = k; el.classList.add('on', 'done'); g.classList.add('on');
      state.seen.add('labels:' + k); nav();
      if (fresh && first && allExplored('labels')) later(() => sfx('sparkle'), 250);    // all four explored: Next unlocks
      sc.resetPose(); sc.showModel(null); sc.highlight(k);
      sc.focusJoint(k, fresh ? undefined : 1); banner();
      panel(p => {
        p.classList.add('tp'); E('h3', '', p, t(k)); facts(p, k);
        const fig = E('figure', 'ins', p); const im = E('img', '', fig); im.src = asset('assets/img/joints/' + k + '.webp'); im.alt = ''; fig.setAttribute('aria-hidden', 'true');   // illustrated close-up of the joint
        E('p', 'label-back', p, t(back()));                         // how to get every label back (as in Human Skeleton)
        E('p', 'progress', p, progressText('labels'));
      });
      read(k);                                              // a language change: description + "tap again ..." in the new language
    }
  }
  setRedo(() => enter('labels', () => labels(chosen)));     // language change: same label stays open
  if (selected) open(selected, false);
  // Every frame (so also while the model is rotated / zoomed): pin each label to its 3D joint, put it on its side of the body,
  // keep labels of one side from overlapping, and end the leader line exactly at the pill's edge.
  // Smoothness: no raycasting and no layout reads per frame; a dot hides behind the body GRADUALLY (sc.occlusion, 0..1): the dot fades +
  // shrinks and its line slides out to the body's edge in step with it; labels glide (never jump) when they change side or stack order.
  // Labels themselves are ALWAYS fully opaque (demo): never dimmed, even when the joint is behind the model.
  let frameNo = 0, tops = [];
  sc.onFrame.fn = () => {
    if (frameNo++ % 45 === 0) {                                                          // sizes cached: reading them every frame forced a layout per label
      items.forEach(it => { it.w = it.el.offsetWidth || 90; it.h = it.el.offsetHeight || 22; });
      // top chrome (toolbar, instruction, title): a label stack only starts below the parts that are really above it, so a label
      // next to a high joint (Fixed, on the skull) stays level with its dot - straight line - when that corner is free
      tops = ['#tl', '#banner', '#identity'].map(s => $(s)).filter(e => e && !e.hidden && e.getClientRects().length)
        .map(e => e.getBoundingClientRect()).filter(r => r.height && r.top < innerHeight / 3);
    }
    const rows = { '-1': [], '1': [] };
    items.forEach(it => {
      const a = sc.dotPos(it.k), p = it.p = sc.project(a);
      const out = sc.project([a[0] + WORLD_SIDE[it.k] * 6, a[1], a[2]]).x - p.x;          // on which side of the screen does the body's outer side lie right now?
      if (Math.abs(out) > 3) it.side = out > 0 ? 1 : -1;                                   // (straight side-on view: keep the previous side)
      const visible = p.vis && (!chosen || chosen === it.k) ? '1' : '0';                  // a label opened: only that one (+ its line) stays on screen
      it.el.style.display = '';
      it.el.style.opacity = visible;
      it.el.style.pointerEvents = visible === '1' ? 'auto' : 'none';
      it.el.tabIndex = visible === '1' ? 0 : -1;
      it.g.style.display = '';
      it.g.style.opacity = visible;
      it.occ = p.vis ? sc.occlusion(it.k) : 0;
      it.c.style.opacity = (1 - it.occ).toFixed(3);
      it.c.setAttribute('r', (4 * (1 - .35 * it.occ)).toFixed(2));
      if (visible === '1') rows[it.side].push(it);
    });
    // the description card (top-left column, or full width on narrow screens) is an obstacle: if the pills of one side would run
    // underneath it, that side's stack starts below the card, so no label ever slides under it
    const pr = sc.panelRect(), sideGap = Math.max(28, innerWidth * .025), card = sc.cardKind(pr);
    for (const s of [-1, 1]) {
      const side = rows[s].sort((a, b) => a.p.y - b.p.y);
      const hits = card && side.some(it => { const x = it.p.x + s * (sideGap + it.w / 2); return x - it.w / 2 < pr.right && x + it.w / 2 > pr.left; });
      const xs = side.map(it => it.p.x + s * (sideGap + it.w / 2)), x0 = Math.min(...xs.map((x, i) => x - side[i].w / 2)), x1 = Math.max(...xs.map((x, i) => x + side[i].w / 2));
      const chrome = tops.reduce((m, r) => r.left < x1 + 8 && r.right > x0 - 8 ? Math.max(m, r.bottom + 8) : m, 8);
      const top = Math.max(chrome, hits && card === 'top' ? pr.bottom + 8 : 0);
      const bottom = hits && card === 'bottom' ? pr.top - 8 : innerHeight - 84;
      const minX = card === 'left' ? pr.right + 8 : 0;                                  // left column (desktop / phone landscape): pills stay to its right
      const heights = side.map(it => it.h);
      const gap = side.length > 1 ? Math.max(4, Math.min(8, (bottom - top - heights.reduce((sum, h) => sum + h, 0)) / (side.length - 1))) : 0;
      let lastBottom = top;
      side.forEach((it, i) => {
        const w = it.w, h = heights[i];
        const remaining = heights.slice(i + 1).reduce((sum, height) => sum + height, 0) + gap * (side.length - i - 1);
        const maxTop = bottom - h - remaining;
        const labelTop = Math.max(lastBottom, Math.min(it.p.y - h / 2, maxTop));
        const ty = labelTop + h / 2;
        lastBottom = labelTop + h + gap;
        const tx = Math.max(minX + w / 2, w / 2 + 6, Math.min(innerWidth - w / 2 - 6, it.p.x + s * (sideGap + w / 2)));
        if (it.cx === undefined) { it.cx = tx; it.cy = ty; }                               // first frame: place directly
        else { it.cx += (tx - it.cx) * .4; it.cy += (ty - it.cy) * .4; }                   // afterwards: glide (side flip / re-stack no longer jumps)
        if (Math.abs(tx - it.cx) > .5 || Math.abs(ty - it.cy) > .5) sc.wake(100);           // keep drawing until the glide has settled
        it.el.style.left = it.cx.toFixed(1) + 'px'; it.el.style.top = it.cy.toFixed(1) + 'px';
        const ex = Math.max(it.cx - w / 2, Math.min(it.cx + w / 2, it.p.x)), ey = it.cy;   // pill edge nearest the dot (continuous even while the label glides across)
        let st = 0;                                                                         // fraction of the line hidden inside the body, grows with it.occ
        if (it.occ > .001) {
          const edge = sc.silhouetteX(it.k, s), gapPx = Math.abs(ex - it.p.x);
          if (edge !== null && gapPx > 1) st = it.occ * Math.min(.9, Math.max(0, (edge - it.p.x) * s) / gapPx);
        }
        it.ln.setAttribute('x1', (it.p.x + (ex - it.p.x) * st).toFixed(1)); it.ln.setAttribute('y1', (it.p.y + (ey - it.p.y) * st).toFixed(1));
        it.ln.setAttribute('x2', ex.toFixed(1)); it.ln.setAttribute('y2', ey.toFixed(1));
        it.c.setAttribute('cx', it.p.x.toFixed(1)); it.c.setAttribute('cy', it.p.y.toFixed(1));
      });
    }
  };
}

function activity() {
  xScreen('activity', 'ACTIVITY', 'explore');
  setNav(() => enter('labels', labels), () => enter('sort', sortIt), !allExplored('activity')); // Previous / Next (Next once all four were watched)
  banner(t(TOUCH ? 'actHintT' : 'actHint') + '  ' + progressText('activity')); if (!quietOnce) say('activity', t('actHint')); quietOnce = false;   // the intro voice plays on entering the Activity, not every time a joint move ends
  sc.showGlows(sc.ORDER);        // joint models are NOT shown here: each appears only after its glowing point is tapped. Blue discs live in the 3D scene (behind the bones); the .hot buttons on top are click targets with pulsing rings
  const box = overlay(), items = sc.ORDER.map(k => {
    const el = E('button', 'hot' + (state.seen.has('activity:' + k) ? ' done' : ''), box); el.type = 'button'; el.setAttribute('aria-label', t(k)); el.title = t(k); el.onclick = () => { sfx('tap'); predict(k); };
    return { el, k };
  });
  // keep every button on its blue disc; on small screens discs that sit closer than one finger (46px) are pushed apart a little,
  // so neighbouring targets (neck / skull) never overlap
  sc.onFrame.fn = () => {
    const pts = items.map(({ k }) => sc.project(sc.glowPos(k))), MIN = 46;
    for (let pass = 0; pass < 4; pass++) for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j]; let dx = b.x - a.x, dy = b.y - a.y; const d = Math.hypot(dx, dy);
      if (d >= MIN) continue;
      if (d < .01) { dx = 0; dy = 1; } else { dx /= d; dy /= d; }
      const push = (MIN - d) / 2; a.x -= dx * push; a.y -= dy * push; b.x += dx * push; b.y += dy * push;
    }
    items.forEach(({ el }, i) => { const p = pts[i]; el.style.display = p.vis ? '' : 'none'; el.style.left = p.x + 'px'; el.style.top = p.y + 'px'; });
  };
}
// Predict -> observe: before a joint moves, the student guesses HOW it will move (same four movement words as the concept screen).
const MOVE_TYPE = { fixed: 0, hinge: 1, pivotal: 2, ball: 3 };      // index into t('sfS'): No movement / Back-and-forth / Rotation / All directions
let pred = null;                                                     // { k, n }: the prediction on screen (kept when the language changes)
function predict(k) {
  const keep = state.langSwitch && pred && pred.k === k;
  if (!keep) pred = { k, n: -1 };
  stopAudio(); document.querySelectorAll('#labels .hot').forEach(b => b.remove()); sc.onFrame.fn = null; sc.showGlows([k]);
  banner(t(k)); setRedo(() => { enter('activity', activity); predict(k); });
  if (!keep) xQuestion('predict_' + k, 'MCQ', 'explore');
  panel(p => {
    p.classList.add('tp'); E('h3', '', p, t(k)); E('p', '', p, t('predictQ'));
    const fb = E('p', 'fb', p); fb.hidden = true; fb.setAttribute('role', 'status');
    const go = btn(p, t('watch'), () => showMove(k)); go.hidden = true;
    const pick = (n, fresh) => {
      const ok = n === MOVE_TYPE[k]; pred.n = n;
      p.querySelectorAll('.opt').forEach((x, i) => { x.disabled = true; x.classList.toggle('sel', i === n); });
      if (fresh) { sfx(ok ? 'correct' : 'wrong'); XAPI.answered(tapObj(`predict_${k}:${n}`, t('sfS')[n], n, n), ok, 1); }
      fb.hidden = false; fb.className = 'fb ' + (ok ? 'ok' : 'no'); fb.textContent = [t(ok ? 'predictYes' : 'predictNotQuite'), t('predictWhy_' + k), t('predictWatch')].join(' ');   // a real sentence about how this joint moves
      say((ok ? 'predictOk-' : 'predictNo-') + k, fb.textContent);     // also after a language change: the feedback in the new language
      go.hidden = false; go.focus({ preventScroll: true });
    };
    t('sfS').forEach((txt, n) => { const b = E('button', 'opt', p, txt); b.type = 'button'; p.insertBefore(b, fb); b.onclick = () => pick(n, true); });
    if (keep && pred.n >= 0) pick(pred.n, false);
  });
  if (!(keep && pred.n >= 0)) say('predict', t('predictQ'));
}
// Then everything runs by itself (demo): only that body part + its joint model stay on screen, the part moves (head turns / forearm
// bends / leg swings) while the camera frames it, then it eases back to rest and the full skeleton with the highlights returns.
// Nothing else is clickable while it plays (Previous / Next are hidden too, so the movement cannot be cut off half-way).
// Timing per joint (camera fly-in, clip start, fly-out) = sc.TIMING, measured on demo.mp4.
function showMove(k) {
  stopAudio(); dots.forEach(d => d.el.remove()); dots = []; banner(); panel(); sc.showGlows(null); setNav(null, null);
  document.querySelectorAll('#labels .hot').forEach(b => b.remove()); sc.onFrame.fn = null;
  const first = !state.seen.has('activity:' + k);
  state.seen.add('activity:' + k);
  const unlocked = first && allExplored('activity');               // this was the last joint: chime when Next unlocks
  const caption = () => { banner(t(k) + ' \u00b7 ' + t(k + 'S')); say(k + 'Name', t(k)); };   // caption = joint name + how it moves, so it also works without sound
  caption();
  setRedo(caption);                     // language changed mid-move: the movement carries on, only the caption + voice switch language
  const j = sc.JOINTS[k]; sc.showModel(j.parts); sc.showPieces([k]); sc.animate(k); sc.isolate(k); sc.frameMove(k);
  const T = sc.TIMING[k];
  later(() => sc.home(T.out), T.total);                                   // as in the demo: the camera pulls back while the part is still on screen ...
  later(() => { quietOnce = true; enter('activity', activity, 1); if (unlocked) sfx('sparkle'); }, T.total + T.out);   // ... and only when it is home the full skeleton + highlights come back
}

// Sort it: body parts into joint bins (js/sort.js). Next unlocks when everything is sorted; what was sorted stays sorted.
function sortIt() {
  xQuestion('sort', 'DRAG_SORT', 'practice');
  const nav = () => setNav(() => enter('activity', activity), () => enter('quiz', quiz), !sortDone());
  nav();
  sortOff = openSort(nav);
}

// Quiz: 5 questions (3 recall + 2 application), options shuffled, a hint + second try after a wrong first answer, final score.
// Progress (question + score) is kept in state.quiz, so Previous -> Activity -> Next comes back to the same question.
const QZ = [['q1', 3], ['q2', 2], ['q3', 2], ['q4', 1], ['q5', 0]];
// Recorded voice-over per question (keys in assets/audio/manifest.json). 'quiz-3-v2' = the new elbow / water-bottle question (the old
// 'quiz-3' clip asks about the gym). Keys without a recording yet fall back to text-to-speech; adding the file + manifest line is enough.
// Script for the voice artist: docs/voiceover-script.md
// Arrays = try in order: the shorter ESL question ('-v2') once recorded, else the original clip (same question, longer wording).
const QZ_AUDIO = ['quiz-1', 'quiz-2', 'quiz-3', 'quiz-4', 'quiz-5'];   // built by scripts/build-audio.mjs from the current text
function quiz() {
  if (!state.quiz || state.quiz.i >= QZ.length) state.quiz = { i: 0, score: 0 };
  setScore(state.quiz.score); setNav(() => enter('sort', sortIt), null); ask(state.quiz.i);
}
function ask(i) {
  if (i >= QZ.length) { summary(); return; }
  state.quiz.i = i;
  setRedo(() => { setNav(() => enter('sort', sortIt), null); setSteps('quiz'); ask(i); });
  const [q, c] = QZ[i];
  const keep = state.langSwitch && state.quiz.cur && state.quiz.cur.i === i;   // language changed: same question, same selection / answer
  const st = keep ? state.quiz.cur : (state.quiz.cur = { i, order: null, sel: -1, tries: 0, crossed: -1, answered: -1 });
  panel(p => {
    p.classList.add('tp');
    E('h3', '', p, t('question') + ' ' + (i + 1) + '/' + QZ.length); E('p', '', p, t(q));
    choose(p, t(q + 'o'), c, t(q + 'ok'), t(q + 'no'), firstTry => {
      if (firstTry) state.quiz.score++;
      state.quiz.cur = null; setScore(state.quiz.score); ask(i + 1);
    }, { st, hints: t(q + 'h'), hintKey: n => `hint-${q}-${n + 1}`, shuffle: true, explain: ok => `quiz-${i + 1}-${ok ? 'ok' : 'no'}`,   // the explanation that matches the answer
         onAnswer: (n, ok, tries, label, ui) => XAPI.answered(tapObj(`quiz_${q}:${n}`, label, ui, n), ok, tries) });
  });
  if (!keep) xQuestion('quiz_' + q, 'MCQ', 'assessment', i);
  stopAudio();
  // voice in the (new) language: the feedback the student is looking at, else the question
  if (keep && st.answered >= 0) { const ok = st.answered === c; say(`quiz-${i + 1}-${ok ? 'ok' : 'no'}`, t(q + (ok ? 'ok' : 'no'))); }
  else if (keep && st.crossed >= 0) say(`hint-${q}-${st.crossed + 1}`, t(q + 'h')[st.crossed]);
  else say(QZ_AUDIO[i], t(q));
}
function summary() {
  panel(); banner(); setNav(null, null); setSteps(null); if (state.summaryOff) { state.summaryOff(); setSummaryOff(null); } setRedo(summary);
  state.quiz.i = QZ.length;
  xScreen('score', 'CELEBRATION', 'assessment');
  const total = QZ.length, ok = state.score, bad = total - ok, pct = Math.round(ok / total * 100), stars = Math.round(ok / total * 5);
  const ov = E('div', 'qs-overlay', document.body), card = E('div', 'qs-card', ov);
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', t('qzSummary'));
  document.body.classList.add('qs-open');
  const off = () => { ov.remove(); document.body.classList.remove('qs-open'); if (state.redo === summary) setRedo(null); };
  setSummaryOff(off);
  E('h3', '', card, t('qzSummary'));
  const st = E('div', 'qs-stars', card); st.setAttribute('aria-label', stars + ' / 5');
  const starEls = []; for (let s = 0; s < 5; s++) starEls.push(E('span', '', st, '\u2605'));
  // stars fill in one by one; each one that fills sends out a burst of tiny stars
  starEls.slice(0, stars).forEach((el, i) => later(() => { el.classList.add('on'); burst(el); sfx('tap'); }, 450 + i * 380));
  const row = E('div', 'qs-row', card), ring = E('div', 'qs-ring', row); ring.style.background = 'conic-gradient(var(--accent) ' + pct + '%, var(--track) ' + pct + '% 100%)';
  const inner = E('div', '', ring); E('b', '', inner, pct + '%'); E('small', '', inner, t('qzAccuracy'));
  const stats = E('div', 'qs-stats', row);
  [['#22c55e', '✓', ok, 'qzCorrect'], ['#ef4444', '✗', bad, 'qzIncorrect']].forEach(([col, sym, n, key]) => {
    const d = E('div', '', stats), ic = E('span', '', d, sym); ic.style.cssText = 'border-color:' + col + ';color:' + col;
    const tx = E('div', '', d); E('b', '', tx, String(n).padStart(2, '0')); E('small', '', tx, t(key));
  });
  const go = E('button', 'qs-btn', card, t('cont')); go.type = 'button';
  go.onclick = () => { stopAudio(); off(); setSummaryOff(null); topicSummary(); };
  sfx('finish');
  go.focus({ preventScroll: true });
}
// tiny stars bursting out of a big star as it fills (no confetti); removed after the animation
function burst(star) {
  const b = E('i', 'burst', star); b.setAttribute('aria-hidden', 'true');
  for (let n = 0; n < 9; n++) {
    const a = (n / 9) * Math.PI * 2 + Math.random() * .4, d = 34 + Math.random() * 22;
    const sp = E('b', '', b, '\u2605'); sp.style.setProperty('--x', (Math.cos(a) * d).toFixed(0) + 'px'); sp.style.setProperty('--y', (Math.sin(a) * d).toFixed(0) + 'px');
    sp.style.animationDelay = (Math.random() * .08).toFixed(2) + 's'; sp.style.fontSize = (8 + Math.random() * 6).toFixed(0) + 'px';
  }
  later(() => b.remove(), 1100);
}
function topicSummary() {
  panel(); banner(); setNav(null, null);
  if (state.summaryOff) { state.summaryOff(); setSummaryOff(null); }
  setRedo(topicSummary);
  if (!state.langSwitch) { xScreen('summary', 'SUMMARY', 'summary'); XAPI.completed(); }   // activity_completed: the end screen (not again on a language switch)
  const ov = E('div', 'qs-overlay', document.body), card = E('div', 'qs-card', ov);
  card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', t('learned'));
  document.body.classList.add('qs-open');
  const off = () => { ov.remove(); document.body.classList.remove('qs-open'); if (state.redo === topicSummary) setRedo(null); };
  setSummaryOff(off);
  E('h3', '', card, t('learned'));
  E('p', 'qs-topic-summary', card, t('sfCExpl'));                 // ESL: one sentence + one row per joint; the narration reads the full summary
  const list = E('ul', 'qs-recap', card);
  sc.ORDER.forEach(k => { const li = E('li', '', list); const im = E('img', '', li); im.src = asset('assets/img/joints/' + k + '.webp'); im.alt = ''; const tx = E('div', '', li); E('b', '', tx, t(k)); E('span', '', tx, t(k + 'S')); });
  const row = E('div', 'qs-actions', card);                     // the lesson no longer ends on a dead end
  const again = E('button', 'qs-btn qs-btn-ghost', row, t('retakeQuiz')); again.type = 'button';
  again.onclick = () => { stopAudio(); off(); setSummaryOff(null); state.quiz = null; enter('quiz', quiz); };
  const play = E('button', 'qs-btn', row, t('playAgain')); play.type = 'button';
  play.onclick = () => { stopAudio(); off(); setSummaryOff(null); replayStudentFlow(); };
  play.focus({ preventScroll: true });
  say('topicSummary', [t('sfCExpl'), ...sc.ORDER.map(k => t('predictWhy_' + k))].join(' '));   // narration follows the table, top to bottom
}
