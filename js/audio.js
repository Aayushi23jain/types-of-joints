import { state } from './state.js';
import { BCP47 } from './i18n.js';
import { asset } from './preload.js';
export const t = k => (state.S ? state.S[state.lang][k] ?? state.S.en[k] ?? '' : '');

// Voice clips are Ogg Opus only (Chrome, Edge, Firefox, Android, Safari / iOS 18.4+). Where Opus cannot play (iOS 18.3 and older)
// the same sentence is spoken with the device's text-to-speech voice instead.
const probe = typeof Audio !== 'undefined' ? new Audio() : null;
export const OPUS = !!probe && probe.canPlayType('audio/ogg; codecs="opus"') !== '';

// Text-to-speech stand-in for a missing / unplayable recording. Looks like an Audio element to callers
// (pause(), currentTime, 'ended' / 'error' events), so choose() can chain the explanation after it.
class Speech extends EventTarget {
  constructor(text, lang) {
    super();
    const u = this.u = new SpeechSynthesisUtterance(text);
    u.lang = BCP47[lang] || lang;
    const v = femaleVoice(lang); if (v) u.voice = v;
    u.onend = () => this.dispatchEvent(new Event('ended'));
    u.onerror = () => this.dispatchEvent(new Event('error'));
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }
  pause() { this.u.onend = this.u.onerror = null; speechSynthesis.cancel(); }
  set currentTime(v) {}
  set muted(v) { if (v) this.pause(); }
}
// Same voice as the recordings where the device has it: a FEMALE voice of the language (known female voice names on Windows / Android /
// iOS / Chrome), else the device's default voice for that language.
const FEMALE = /female|woman|neerja|swara|heera|kalpana|dhwani|aarohi|shruti|pallavi|sukanya|lekha|veena|zira|aria|jenny|google (हिन्दी|ગુજરાતી|తెలుగు|தமிழ்|मराठी)/i;
const femaleVoice = lang => {
  if (typeof speechSynthesis === 'undefined') return null;
  const want = (BCP47[lang] || lang).toLowerCase(), base = want.slice(0, 2), all = speechSynthesis.getVoices();
  const same = all.filter(v => v.lang.toLowerCase().replace('_', '-').startsWith(base));
  return same.find(v => FEMALE.test(v.name) && v.lang.toLowerCase().replace('_', '-') === want) || same.find(v => FEMALE.test(v.name)) || null;
};
const voiceFor = lang => {
  if (typeof speechSynthesis === 'undefined') return false;
  const want = (BCP47[lang] || lang).slice(0, 2);
  return speechSynthesis.getVoices().some(v => v.lang.toLowerCase().startsWith(want));
};
const plain = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\|/g, ' ');
const speak = text => (text && voiceFor(state.lang) ? (state.cur = new Speech(plain(text), state.lang)) : null);

export const stopAudio = () => {
  if (state.cur) { try { state.cur.pause(); state.cur.currentTime = 0; } catch (e) {} state.cur = null; }
};

export const setMuted = on => {
  state.muted = !!on;
  if (state.muted) stopAudio();
};

// k = manifest key; text = what the clip says (used for text-to-speech when there is no recording or it cannot play)
export const say = (k, text) => {
  stopAudio();
  if (state.muted) return null;
  const A = state.A && state.A[state.lang], key = Array.isArray(k) ? k.find(x => A && A[x]) : k;   // list = first key that has a recording
  const f = A && key && A[key];
  if (!f || !OPUS) return speak(text);
  const src = 'assets/audio/' + f;
  const a = state.cur = new Audio(asset(src));                      // local copy from the preloader when there is one
  a.addEventListener('error', () => {               // file missing / codec not supported -> speak the text instead
    if (state.cur !== a) return;
    if (a.src.startsWith('blob:') && !a.dataset.fb) { a.dataset.fb = 1; a.src = src; a.play().catch(() => {}); return; }   // local copy broken: retry the real file once
    const s = speak(text);
    if (s) s.addEventListener('ended', () => a.dispatchEvent(new Event('ended')), { once: true });
  }, { once: true });
  a.play().catch(err => {
    if (err && err.name !== 'NotAllowedError') return;   // other failures are handled by the 'error' event
    const retry = () => { if (state.cur === a) a.play().catch(() => {}); };
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, retry, { once: true, capture: true }));
  });
  return a;
};
