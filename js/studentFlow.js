// "Try it!" - the hook (NCERT Class 6 Ch 8 opens the same way: move your own body first). Runs in the side card, so the
// real 3D skeleton stays in view and demonstrates:
//   Step 1: tap a move -> the skeleton does it (turns its head / bends its elbow / circles its arm) -> the student copies it.
//   Step 2: "bend your arm in the middle" - the upper arm glows red on the skeleton (no joint there) -> Yes / No
//           -> "We bend only where two bones meet. This place is a joint."
import { state } from './state.js';
import { t, say, stopAudio } from './audio.js';
import { E, panel, btn } from './dom.js';
import { sfx } from './sfx.js';
import * as sc from './scene.js';
import { XAPI, screen as xScreen, question as xQuestion, tapObj } from './xapi.js';

const MOVES = [['tryMove1', 'head'], ['tryMove2', 'elbow'], ['tryMove3', 'circle']];   // tile text + skeleton demo
let onDone = null, step = 0, done = new Set(), answer = null, playing = null;

export function startTryIt(cb) {
  onDone = cb; step = 0; done = new Set(); answer = null; playing = null;
  state.redo = () => render(true);                          // language change -> redraw + read again
  sc.frameUpper(1400);
  render(true);
}

export function finish() {                                  // also used by the dev Skip button
  stopAudio(); sc.demo(null); sc.highlightParts(null); panel(); state.redo = null;
  const cb = onDone; onDone = null; cb && cb();
}

function render(read) {
  panel(p => { p.classList.add('tp', 'try'); if (step === 0) moves(p, read); else challenge(p, read); }, true);
}

// Step 1: three moves, each shown by the skeleton
function moves(p, read) {
  if (read && !state.langSwitch) xScreen('try_moves', 'TRY_IT', 'tutorial');
  E('h3', '', p, t('tryTitle')); E('p', '', p, t('tryLead'));
  const list = E('div', 'try-moves', p);
  MOVES.forEach(([key, name]) => {
    const b = E('button', 'try-move' + (done.has(key) ? ' done' : '') + (playing === key ? ' playing' : ''), list); b.type = 'button';
    E('span', 'try-play', b);                              // play triangle / tick are drawn in CSS (no emoji-prone glyph)
    E('span', 'try-text', b, t(key));
    b.disabled = !!playing && playing !== key;
    b.onclick = () => {
      if (playing) return;
      playing = key; sfx('tap'); say(key, t(key)); render(false);
      let fired = false;
      const ticked = () => {
        if (fired || onDone === null) return;
        fired = true; clearTimeout(dog); playing = null; done.add(key); sc.highlightParts(null);
        sfx(done.size === MOVES.length ? 'sparkle' : 'correct');                     // all three moves seen -> sparkle
        render(false);
      };
      const dog = setTimeout(ticked, sc.DEMO_MS[name] + 2500);   // watchdog: never stuck if the animation loop pauses (hidden tab)
      sc.demo(name, ticked);                                    // the tile is ticked once the skeleton has shown the move
    };
  });
  const next = btn(p, t('tNext'), () => { sc.demo(null); step = 1; render(true); });
  next.disabled = (done.size < MOVES.length || !!playing) && !state.dev;
  if (read) { if (playing) say(playing, t(playing)); else say('try1', t('tryLead')); }   // language changed while a move plays: that move's line
}

// Step 2: the challenge that leads to the definition
let chalTries = 0;
function challenge(p, read) {
  if (read && !state.langSwitch) { chalTries = 0; xQuestion('try_challenge', 'MCQ', 'tutorial'); }
  E('h3', '', p, t('tryChalQ')); E('p', '', p, t('tryChalSub'));
  sc.highlightParts(['upperArmL'], 0xf05252);               // the bone between shoulder and elbow: no joint, it cannot bend
  const opts = E('div', 'sf-opts row', p);
  [['tryYes', 'yes'], ['tryNo', 'no']].forEach(([key, v]) => {
    // answered, like a quiz option: the right one ("No") always green + tick (also after a wrong pick), a wrong pick red + cross
    const b = E('button', 'sf-opt' + (answer && v === 'no' ? ' ok' : answer === v ? ' no' : ''), opts, t(key)); b.type = 'button';
    b.disabled = !!answer;                                  // one answer only: once picked, neither option can be picked again
    b.onclick = () => { if (answer) return; chalTries++; XAPI.answered(tapObj('try_challenge:' + v, t(key), v === 'yes' ? 0 : 1, v === 'yes' ? 0 : 1), v === 'no', chalTries); answer = v; sfx(v === 'no' ? 'correct' : 'wrong'); render(false); say(v === 'no' ? 'tryRespNo' : 'tryRespYes', t(v === 'no' ? 'tryRespNo' : 'tryRespYes') + ' ' + t('tryKey')); };
  });
  if (answer) {
    const r = E('p', 'fb ' + (answer === 'no' ? 'ok' : 'no'), p, t(answer === 'no' ? 'tryRespNo' : 'tryRespYes')); r.setAttribute('role', 'status');
    E('p', 'try-key', p, t('tryKey'));                      // NCERT: "We can bend or move our body only at those points where bones meet."
  }
  const go = btn(p, t('cont'), finish); go.disabled = !answer && !state.dev;
  if (!read) return;
  // already answered (language changed): the feedback in the new language, else the question
  if (answer) say(answer === 'no' ? 'tryRespNo' : 'tryRespYes', t(answer === 'no' ? 'tryRespNo' : 'tryRespYes') + ' ' + t('tryKey'));
  else say('try2', t('tryChalQ') + ' ' + t('tryChalSub'));
}
