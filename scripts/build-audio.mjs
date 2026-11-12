// Builds the voice-over from assets/text/strings.json with one FEMALE voice per language and ffmpeg (same pipeline as Human Skeleton).
//   node scripts/build-audio.mjs                 -> every language: only clips that are missing or whose text changed
//   node scripts/build-audio.mjs gu od           -> only these languages
//   node scripts/build-audio.mjs --dry           -> list what would be built, build nothing
//   node scripts/build-audio.mjs en hi --force   -> rebuild EVERY clip of these languages (one voice for the whole language)
// Voices: Microsoft Edge neural voices via the `edge-tts` CLI (pip install edge-tts). Odia (od) has no edge voice, so it uses the free
// AI4Bharat Indic-TTS female speaker (CC-BY-4.0), run locally: ODIA_TTS_DIR (default C:/Users/rajat/odia-tts: tts_od.py + indic/or model)
// and ODIA_TTS_PYTHON (default <dir>/venv-coqui/Scripts/python.exe). ~10-60 s per clip on a CPU.
// Output: assets/audio/<lang>/<key>.opus (mono Ogg Opus 32 kbps) + <key>.txt (voice + exact text = what the clip says; a clip is rebuilt
// only when that text changes, so recorded / earlier clips are kept) and assets/audio/manifest.json.
// The clip keys are the ones js/*.js passes to say(); clipTexts() is the single list of what is spoken, so screen and voice match.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const VOICE = {
  en: 'en-IN-NeerjaNeural', hi: 'hi-IN-SwaraNeural', gu: 'gu-IN-DhwaniNeural', mr: 'mr-IN-AarohiNeural',
  te: 'te-IN-ShrutiNeural', tl: 'ta-IN-PallaviNeural', od: 'indictts:female'
};
const RATE = '-6%';                                           // a little slower than default: 10-12 year olds, unhurried
const strip = s => String(s).replace(/<[^>]+>/g, '').replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? '');
const dot = s => /[.!?।]$/.test(String(s).trim()) ? s : s + '.';
const JOINTS = ['pivotal', 'fixed', 'hinge', 'ball'];
const PARTS = { bpShoulder: 'ball', bpHip: 'ball', bpNeck: 'pivotal', bpElbow: 'hinge', bpKnee: 'hinge', bpSkull: 'fixed', bpUpperJaw: 'fixed' };

export function clipTexts(L) {
  const c = {};
  c.labels = L.labelsHint; c.activity = L.actHint; c.predict = L.predictQ;
  c.labelsBack = L.labelsBack; c.labelsBackM = L.labelsBackM;     // touch / mouse: after a label's text, "tap the highlighted label again ..."
  c.correct = L.correct; c.incorrect = L.incorrect;
  c.topicSummary = [L.sfCExpl, ...JOINTS.map(k => L['predictWhy_' + k])].join(' ');   // same order as the end-screen table (JOINTS = scene ORDER)
  for (const k of JOINTS) {
    c[k] = L[k + 'D']; c[k + 'Name'] = L[k];
    c['predictOk-' + k] = [L.predictYes, L['predictWhy_' + k], L.predictWatch].join(' ');
    c['predictNo-' + k] = [L.predictNotQuite, L['predictWhy_' + k], L.predictWatch].join(' ');
  }
  c.try1 = L.tryLead; c.tryMove1 = L.tryMove1; c.tryMove2 = L.tryMove2; c.tryMove3 = L.tryMove3;
  c.try2 = L.tryChalQ + ' ' + L.tryChalSub;
  c.tryRespNo = L.tryRespNo + ' ' + L.tryKey; c.tryRespYes = L.tryRespYes + ' ' + L.tryKey;
  for (let i = 1; i <= 5; i++) {
    const q = 'q' + i; c['quiz-' + i] = L[q]; c['quiz-' + i + '-ok'] = L[q + 'ok']; c['quiz-' + i + '-no'] = L[q + 'no'];
    L[q + 'h'].forEach((h, n) => { if (h) c[`hint-${q}-${n + 1}`] = h; });
  }
  c.sortIntro = L.sortTitle + '. ' + L.sortHint; c.sortDone = L.sortDone;
  // guided tour: one short line per step (the controls step has a mouse and a touch version)
  c['tour-welcome'] = dot(L.tWelcome) + ' ' + L.tWelcomeB;
  c['tour-controls-mouse'] = dot(L.tExplore) + ' ' + [L.ctrlMouseRotate, L.ctrlMouseTap, L.ctrlMouseZoom].map(dot).join(' ');
  c['tour-controls-touch'] = dot(L.tExplore) + ' ' + [L.ctrlTouchRotate, L.ctrlTouchTap, L.ctrlTouchZoom].map(dot).join(' ');
  c['tour-lang'] = dot(L.tLang) + ' ' + L.tLangB; c['tour-theme'] = dot(L.tTheme) + ' ' + L.tThemeB;
  c['tour-fs'] = dot(L.tFs) + ' ' + L.tFsB; c['tour-fs-exit'] = dot(L.tNormal) + ' ' + L.tFsExitB;
  c['tour-replay'] = dot(L.tReplay) + ' ' + L.tReplayB;
  for (const [p, j] of Object.entries(PARTS)) { c['sortRight-' + p] = fill(L.sortRight, { part: L[p], joint: L[j] }); c['sortWrong-' + p] = L.sortWrong + ' ' + L['sortWhy_' + p]; }
  for (const k in c) c[k] = strip(c[k]);
  return c;
}

// trim leading / trailing silence, then mono 48 kHz Opus 32 kbps
const TO_OPUS = (src, out) => run('ffmpeg', ['-loglevel', 'error', '-y', '-i', src,
  '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,adelay=60,apad=pad_dur=0.25',
  '-ac', '1', '-ar', '48000', '-c:a', 'libopus', '-b:a', '32k', out], { windowsHide: true });

async function edge(text, voice, out) {
  const tmp = path.join(os.tmpdir(), `toj-${process.pid}-${Math.random().toString(36).slice(2)}.mp3`);
  try {
    await run('edge-tts', ['--voice', voice, '--rate=' + RATE, '--text', text, '--write-media', tmp], { windowsHide: true, maxBuffer: 1 << 24 });
    await TO_OPUS(tmp, out);
  } finally { fs.rmSync(tmp, { force: true }); }
}

async function pool(jobs, n) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < jobs.length) await jobs[i++](); }));
}

// Odia: the model knows no Latin letters / digits -> numbers are written out (tts_od.py also turns any digit into a word).
// All clips go to ONE Python run (the model loads once); wavs are kept, so a stopped run carries on where it left off.
const OD_SAY = [['3D', 'ଥ୍ରୀ-ଡି']];
async function indicTTS(list, done, failed) {
  const dir = process.env.ODIA_TTS_DIR || 'C:/Users/rajat/odia-tts', py = process.env.ODIA_TTS_PYTHON || dir + '/venv-coqui/Scripts/python.exe';
  const wavs = dir + '/out-types-of-joints', jobFile = wavs + '.jobs.json', todo = {};
  if (!fs.existsSync(py) || !fs.existsSync(dir + '/tts_od.py')) { console.warn('od: Indic-TTS not found at ' + dir + ' - skipped'); list.forEach(j => failed.push(j.id + ': no Indic-TTS')); return; }
  fs.mkdirSync(wavs, { recursive: true });
  const old = fs.existsSync(jobFile) ? JSON.parse(fs.readFileSync(jobFile, 'utf8')) : {};
  for (const j of list) {
    let t = j.text; for (const [a, b] of OD_SAY) t = t.split(a).join(b);
    todo[j.key] = t; if (old[j.key] !== t) fs.rmSync(`${wavs}/${j.key}.wav`, { force: true });   // text changed: make it again
  }
  fs.writeFileSync(jobFile, JSON.stringify(todo, null, 1));
  console.log(`od: ${list.length} clips -> Indic-TTS (female)`);
  await new Promise((ok, no) => { const p = spawn(py, [dir + '/tts_od.py', jobFile, wavs], { stdio: 'inherit', env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, windowsHide: true }); p.on('close', c => c ? no(new Error('tts_od.py exit ' + c)) : ok()); });
  for (const j of list) {
    const wav = `${wavs}/${j.key}.wav`;
    if (!fs.existsSync(wav)) { failed.push(j.id + ': no wav'); continue; }
    await TO_OPUS(wav, j.out); done(j);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2), dry = args.includes('--dry'), force = args.includes('--force'), langArgs = args.filter(a => !a.startsWith('--'));
  const J = JSON.parse(fs.readFileSync(ROOT + 'assets/text/strings.json', 'utf8'));
  const langs = langArgs.length ? langArgs : J.languages.map(l => l.code);
  const manifestFile = ROOT + 'assets/audio/manifest.json';
  const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
  const save = () => {
    const sorted = Object.fromEntries(J.languages.map(l => l.code).filter(l => manifest[l]).map(l => [l, manifest[l]]));
    fs.writeFileSync(manifestFile, JSON.stringify(sorted, null, 2) + '\n');
  };
  const jobs = [], failed = [], indic = [];
  const done = j => { fs.writeFileSync(j.base + '.txt', j.voice + '\n' + j.text); (manifest[j.lang] ||= {})[j.key] = `${j.lang}/${j.key}.opus`; };
  for (const lang of langs) {
    if (!VOICE[lang]) { console.warn(`${lang}: no voice configured - skipped`); continue; }
    const dir = ROOT + 'assets/audio/' + lang + '/', clips = clipTexts(J[lang]);
    fs.mkdirSync(dir, { recursive: true });
    manifest[lang] = Object.fromEntries(Object.entries(manifest[lang] || {}).filter(([k]) => k in clips));   // keys no longer spoken
    for (const [key, text] of Object.entries(clips)) {
      const base = dir + key, out = base + '.opus', sig = base + '.txt';
      const said = fs.existsSync(sig) ? fs.readFileSync(sig, 'utf8').split('\n').slice(1).join('\n').trim() : null;
      const sameVoice = !fs.existsSync(sig) || fs.readFileSync(sig, 'utf8').split('\n')[0] === VOICE[lang];   // one voice per language
      if (!force && fs.existsSync(out) && (said === null || said === text) && sameVoice) { manifest[lang][key] = `${lang}/${key}.opus`; continue; }   // there and up to date: keep
      const j = { id: lang + '/' + key, lang, key, text, base, out, voice: VOICE[lang] };
      if (dry) { console.log(j.id, fs.existsSync(out) ? '(text changed)' : '(missing)'); continue; }
      if (VOICE[lang].startsWith('indictts:')) { indic.push(j); continue; }
      jobs.push(async () => {
        for (let tries = 0; ; tries++) {
          try { await edge(text, VOICE[lang], out); done(j); process.stdout.write('.'); return; }
          catch (e) { if (tries >= 2) { failed.push(j.id + ': ' + String(e.message || e).slice(0, 160)); return; } await new Promise(r => setTimeout(r, 2000)); }
        }
      });
    }
  }
  if (dry) process.exit(0);
  console.log(`${jobs.length + indic.length} clips to build`);
  await pool(jobs, 6); save();
  if (indic.length) { try { await indicTTS(indic, done, failed); } catch (e) { failed.push('od: ' + e.message); } save(); }
  console.log('\n' + (failed.length ? 'FAILED:\n  ' + failed.join('\n  ') : 'all clips built'));
  if (failed.length) process.exitCode = 1;
}
