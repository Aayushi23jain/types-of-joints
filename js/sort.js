// "Sort it": put each body part into its joint (NCERT examples: shoulder + hip = ball and socket, neck = pivotal,
// elbow + knee = hinge, skull + upper jaw = fixed). Lives in the same side card as the quiz (no pictures): body-part chips on top,
// the four joints as answer rows below. Tap a chip, then a row (or drag the chip onto a row). The chosen body part glows on the
// 3D skeleton. A right answer moves the chip into its row; a wrong one shakes it back with a short hint. Sorted stays sorted.
import { state } from './state.js';
import { t, say } from './audio.js';
import { E, panel } from './dom.js';
import { sfx } from './sfx.js';
import * as sc from './scene.js';
import { asset } from './preload.js';
import { XAPI, tapObj } from './xapi.js';

const ITEMS = [['bpShoulder', 'ball'], ['bpHip', 'ball'], ['bpNeck', 'pivotal'], ['bpElbow', 'hinge'], ['bpKnee', 'hinge'], ['bpSkull', 'fixed'], ['bpUpperJaw', 'fixed']];
const BINS = ['ball', 'pivotal', 'hinge', 'fixed'];
const GLOW = { bpShoulder: ['upperArmL'], bpHip: ['legL'], bpNeck: ['neck'], bpElbow: ['forearmL'], bpKnee: ['shinL'], bpSkull: ['skull'], bpUpperJaw: ['skull'] };
const answerOf = Object.fromEntries(ITEMS);
export const sortDone = () => ITEMS.every(([k]) => state.sorted && state.sorted[k]);

export function openSort(onAllDone) {
  state.sorted = state.sorted || {};
  if (!state.sortOrder) { const a = ITEMS.map(([k]) => k); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } state.sortOrder = a; }
  // ui = what is on screen: picked chip + last feedback { k, bin, ok }. Kept in state.sortUi, so a language change redraws the same
  // board (chip still picked, feedback re-written in the new language and read again); a fresh visit starts clean.
  const keep = state.langSwitch && state.sortUi;
  const ui = state.sortUi = keep ? state.sortUi : { picked: null, fb: null };
  let wrong = null;
  const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
  const fbText = f => f.ok ? fill(t('sortRight'), { part: t(f.k), joint: t(f.bin) }) : t('sortWrong') + ' ' + t('sortWhy_' + f.k);

  // layout = ref.png: title + hint | progress pill; chips; 2 x 2 joint cards (model picture, name, how it moves, dashed drop zone)
  const render = () => panel(p => {
    p.classList.add('tp', 'sortp');
    const done = Object.keys(state.sorted).length;
    const head = E('div', 'sort-head', p), ht = E('div', '', head);
    E('h3', '', ht, t('sortTitle')); E('p', '', ht, sortDone() ? t('sortDone') : t('sortHint'));
    const pill = E('div', 'sort-count', head); E('b', '', pill, done + '/' + ITEMS.length);
    E('i', '', E('span', 'sort-bar', pill)).style.width = (done / ITEMS.length * 100) + '%';
    if (!sortDone()) {
      const tray = E('div', 'sort-tray', p);
      state.sortOrder.filter(k => !state.sorted[k]).forEach(k => {
        const c = E('button', 'sort-chip' + (ui.picked === k ? ' sel' : '') + (wrong === k ? ' shake' : ''), tray); c.type = 'button'; c.dataset.k = k;
        E('span', 'grip', c).setAttribute('aria-hidden', 'true'); c.append(t(k));
        c.onclick = () => pick(ui.picked === k ? null : k);
        c.onpointerdown = e => startDrag(e, c, k);
      });
    }
    const grid = E('div', 'sort-grid', p);
    BINS.forEach(b => {
      const bin = E('button', 'sort-bin' + (ui.picked ? ' ready' : ''), grid); bin.type = 'button'; bin.dataset.bin = b;
      const top = E('span', 'sort-bin-top', bin);
      const im = E('img', '', top); im.src = asset('assets/img/joints/model-' + b + '.webp'); im.alt = '';   // the game's own joint model (fixed: the skull)
      const tx = E('span', 'sort-bin-text', top); E('b', '', tx, t(b)); E('small', '', tx, t(b + 'S'));
      const zone = E('span', 'sort-zone', bin), got = ITEMS.filter(([k]) => state.sorted[k] === b);
      if (!got.length) E('span', 'sort-empty', zone, t('sortDrop'));
      got.forEach(([k]) => E('span', 'sort-chip in', zone, t(k)));
      bin.onclick = () => { if (ui.picked) drop(ui.picked, b); };
    });
    const f = ui.fb, m = E('p', 'fb' + (f ? (f.ok ? ' ok' : ' no') : ''), p, f ? fbText(f) : ''); m.hidden = !f; m.setAttribute('role', 'status');
  });
  const pick = k => { ui.picked = k; wrong = null; ui.fb = null; sfx('tap'); sc.highlightParts(k ? GLOW[k] : null); render(); };
  const tries = state.sortTries = state.sortTries || {};
  const drop = (k, bin) => {
    ui.picked = null; sc.highlightParts(null);
    tries[k] = (tries[k] || 0) + 1;
    XAPI.answered(tapObj(`sort:${k}>${bin}`, t(k) + ' > ' + t(bin), BINS.indexOf(bin), ITEMS.findIndex(([x]) => x === k)), answerOf[k] === bin, tries[k]);   // one answer per drop
    if (answerOf[k] === bin) {
      state.sorted[k] = bin; wrong = null; ui.fb = { k, bin, ok: true }; sfx('correct'); say('sortRight-' + k, fbText(ui.fb)); render();   // confirm WHAT was matched
      if (sortDone()) { sfx('sparkle'); say('sortDone', t('sortDone')); onAllDone && onAllDone(); }
    } else { wrong = k; ui.fb = { k, bin, ok: false }; sfx('wrong'); say('sortWrong-' + k, fbText(ui.fb)); render(); }   // say WHY: how that body part moves
  };
  // drag: the chip follows the finger / mouse; dropping on a joint row places it (a short press without moving = tap)
  const startDrag = (e, c, k) => {
    if (e.button > 0) return;
    const x0 = e.clientX, y0 = e.clientY; let ghost = null;
    const over = ev => document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.sort-bin');
    const move = ev => {
      if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
      if (!ghost) { ghost = c.cloneNode(true); ghost.classList.add('ghost'); document.body.append(ghost); c.classList.add('lifted'); sc.highlightParts(GLOW[k]); }
      ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
      const o = over(ev); document.querySelectorAll('.sort-bin').forEach(b => b.classList.toggle('over', b === o));
    };
    const up = ev => {
      removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
      if (!ghost) return;                                                   // it was a tap: onclick handles it
      ghost.remove(); c.classList.remove('lifted');
      const bin = over(ev);
      c.addEventListener('click', ev2 => ev2.stopImmediatePropagation(), { once: true, capture: true });   // no tap after a drag
      if (bin) drop(k, bin.dataset.bin); else { sc.highlightParts(null); render(); }
    };
    addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  };

  render();
  if (ui.picked) sc.highlightParts(GLOW[ui.picked]);
  // voice in the (new) language: the feedback on screen, else "all sorted", else the instructions
  if (keep && ui.fb) say((ui.fb.ok ? 'sortRight-' : 'sortWrong-') + ui.fb.k, fbText(ui.fb));
  else if (sortDone()) say('sortDone', t('sortDone'));
  else say('sortIntro', t('sortTitle') + '. ' + t('sortHint'));
  return () => sc.highlightParts(null);
}
