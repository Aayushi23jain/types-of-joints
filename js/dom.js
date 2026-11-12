// Tiny DOM helpers shared by every mode.
import { stopAudio } from './audio.js';

export const $ = s => document.querySelector(s);

export const E = (tag, cls, par, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  if (par) par.append(e);
  return e;
};

// Top instruction strip. Call with no argument (or '') to hide it.
export const banner = (s) => {
  const b = $('#banner');
  b.hidden = !s;
  b.textContent = s || '';
};

// Bottom content card. Pass a render function to show it, or nothing to hide it.
// Optional second parameter: skipCameraShift = true to prevent camera from shifting
export const panel = (fn, skipCameraShift = false) => {
  const p = $('#panel');
  p.innerHTML = '';
  p.className = ''; // clear any per-mode styling (e.g. the Introduction panel's full-height layout) left over from before
  p.hidden = !fn;
  if (fn) {
    p.dataset.skipCameraShift = skipCameraShift;
    fn(p);
  }
};

export const btn = (p, txt, fn) => {
  // buttons of the content card live in its footer, which stays visible at the bottom while the card scrolls
  const host = p.id === 'panel' ? (p.querySelector(':scope > .actions') || E('div', 'actions', p)) : p;
  const b = E('button', 'btn', host, txt); b.type = 'button';
  // Any Continue / Next / Submit / Ok button silences the current voice-over
  // first; the handler may then start the next clip.
  b.onclick = (e) => { stopAudio(); fn(e); };
  return b;
};
// Toolbar / start-screen icon tapped: yellow for 0.6 s, then back to normal (plain setTimeout: screen changes must not cancel it)
const flashTimers = new WeakMap();
export const flashGold = el => {
  clearTimeout(flashTimers.get(el)); el.classList.add('flash-gold');
  flashTimers.set(el, setTimeout(() => el.classList.remove('flash-gold'), 600));
};
// The top-right icons stay above overlays (tour mask, cards): if `el` overlaps them, the y (px) just below them, else 0 (as in Human Skeleton).
export const belowToolbar = (el) => {
  const tl = $('#tl'); if (!tl || !el || !tl.getClientRects().length) return 0;
  const a = tl.getBoundingClientRect(), b = el.getBoundingClientRect();
  return (b.left < a.right && b.right > a.left && b.top < a.bottom && b.bottom > a.top) ? Math.ceil(a.bottom + 8) : 0;
};
