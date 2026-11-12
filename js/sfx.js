// UI sound effects, synthesised with Web Audio (no files to download).
// Short and quiet so they never compete with the voice-over; silenced by the same mute button (state.muted).
import { state } from './state.js';

let ctx = null, master = null;
function audio() {
  if (state.muted) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = .22; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (e) { return null; }
}
// one soft note: sine/triangle with a quick attack and exponential decay
function note(c, freq, at, dur = .18, type = 'sine', gain = 1) {
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
}
const SOUNDS = {
  tap: c => note(c, 1320, 0, .05, 'triangle', .35),                                                     // option / label / hotspot
  correct: c => { note(c, 880, 0, .22); note(c, 1318.5, .09, .32); },                                   // rising fifth
  wrong: c => { note(c, 311, 0, .18, 'triangle', .6); note(c, 262, .1, .26, 'triangle', .55); },      // soft falling step, not a buzzer
  sparkle: c => [1568, 1976, 2349].forEach((f, i) => note(c, f, i * .06, .2, 'sine', .45)),              // all four joints explored
  finish: c => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(c, f, i * .11, i === 3 ? .6 : .22, 'sine', .8))   // end of quiz
};
export function sfx(name) {
  const c = audio(), s = SOUNDS[name];
  if (c && s) { try { s(c); } catch (e) {} }
}
