// Preloader: everything the lesson needs is downloaded behind the loading bar BEFORE "Let's start" appears.
//  - files are weighted by their real sizes (assets/asset-sizes.json, made by scripts/asset-sizes.mjs), refined by Content-Length;
//    streaming readers give byte-accurate progress; the bar never goes backwards
//  - smallest first (pictures land in the first seconds, never starved behind models), 5 at a time
//  - a finished file becomes a local blob: URL (asset(path) returns it), so "loaded" really means local
//  - nothing can block: a failed / stalled / aborted transfer (or file://) counts as done and the original path is used
// Formats: images WebP, voice Ogg Opus (Chrome, Edge, Firefox, Android, Safari 18.4+; older Safari uses text-to-speech, js/audio.js).
const blobs = new Map();
export const asset = p => blobs.get(p) || p;
export const original = u => { for (const [p, b] of blobs) if (b === u) return p; return u; };

const STALL_MS = 15000, PARALLEL = 5;
const MIME = { glb: 'model/gltf-binary', webp: 'image/webp', woff2: 'font/woff2', opus: 'audio/ogg', json: 'application/json' };

async function fetchOne(p, expected, onBytes) {
  const ctl = new AbortController(); let timer = setTimeout(() => ctl.abort(), STALL_MS);
  const poke = () => { clearTimeout(timer); timer = setTimeout(() => ctl.abort(), STALL_MS); };   // abort only when no bytes arrive for a while
  try {
    const r = await fetch(p, { signal: ctl.signal });
    if (!r.ok || !r.body) throw new Error(r.status);
    const len = +r.headers.get('content-length') || expected, chunks = []; let got = 0;
    onBytes(0, len);
    const reader = r.body.getReader();
    for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; poke(); onBytes(got, len); }
    blobs.set(p, URL.createObjectURL(new Blob(chunks, { type: MIME[p.split('.').pop()] || '' })));
  } catch (e) { /* counts as done: the element keeps the normal path */ }
  finally { clearTimeout(timer); onBytes(Infinity); }
}

// files: [path], sizes: {path: bytes}; onProgress(0..1)
export async function preload(files, sizes, onProgress = () => {}) {
  const list = [...new Set(files)].filter(p => !blobs.has(p)).sort((a, b) => (sizes[a] || 0) - (sizes[b] || 0));
  const st = new Map(list.map(p => [p, { got: 0, total: sizes[p] || 1 }]));
  let shown = 0;
  const report = () => {
    let got = 0, total = 0; for (const v of st.values()) { got += Math.min(v.got, v.total); total += v.total; }
    shown = Math.max(shown, total ? got / total : 1); onProgress(shown);
  };
  let next = 0;
  const worker = async () => {
    while (next < list.length) {
      const p = list[next++], s = st.get(p);
      await fetchOne(p, s.total, (got, len) => { if (got === Infinity) s.got = s.total; else { if (len) s.total = len; s.got = got; } report(); });
    }
  };
  report();
  await Promise.all(Array.from({ length: Math.min(PARALLEL, list.length) }, worker));
  onProgress(1);
}

// What a lesson in language `lang` needs (opus = the browser plays Ogg Opus).
const SCRIPT_FONT = { hi: 'noto-devanagari', mr: 'noto-devanagari', gu: 'noto-gujarati', te: 'noto-telugu', tl: 'noto-tamil', od: 'noto-odia' };
export function lessonFiles(sizes, manifest, lang, opus) {
  const all = Object.keys(sizes), f = [];
  f.push(...all.filter(p => p.startsWith('assets/models/') || p.startsWith('assets/img/')));
  f.push(...all.filter(p => p.includes('/fonts/poppins-')));
  if (SCRIPT_FONT[lang]) f.push(`assets/fonts/${SCRIPT_FONT[lang]}.woff2`);
  if (opus) for (const clip of Object.values((manifest && manifest[lang]) || {})) f.push('assets/audio/' + clip);   // no Opus: no clips to fetch (text-to-speech)
  return f.filter(p => p in sizes);
}
