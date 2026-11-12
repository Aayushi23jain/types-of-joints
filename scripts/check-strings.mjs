// Checks assets/text/strings.json: every language has the same keys as English, same array lengths, same pipe-separated parts,
// the same {placeholders} and <b> tags, and the quiz hints keep their empty slot on the correct answer.
//   node scripts/check-strings.mjs            -> report
//   node scripts/check-strings.mjs merge f.json code   -> validate f.json against English and merge it in as <code>
import fs from 'fs';
const FILE = new URL('../assets/text/strings.json', import.meta.url);
const J = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const EN = J.en;
const CORRECT = { q1: 3, q2: 2, q3: 2, q4: 1, q5: 0 };     // = QZ in js/router.js

function check(code, L) {
  const errs = [];
  const ph = s => (String(s).match(/\{\w+\}/g) || []).sort().join();
  const tags = s => (String(s).match(/<\/?b>/g) || []).length;
  for (const k of Object.keys(EN)) {
    if (!(k in L)) { errs.push(`missing ${k}`); continue; }
    const e = EN[k], v = L[k];
    if (Array.isArray(e) !== Array.isArray(v)) { errs.push(`${k}: array mismatch`); continue; }
    if (Array.isArray(e)) {
      if (e.length !== v.length) errs.push(`${k}: ${v.length} items, English has ${e.length}`);
      e.forEach((x, i) => { if ((x === '') !== (v[i] === '')) errs.push(`${k}[${i}]: empty slot moved`); });
      continue;
    }
    if (typeof v !== 'string' || !v.trim()) errs.push(`${k}: empty`);
    if (ph(e) !== ph(v)) errs.push(`${k}: placeholders ${ph(v) || '-'} vs ${ph(e)}`);
    if (tags(e) !== tags(v)) errs.push(`${k}: <b> tags ${tags(v)} vs ${tags(e)}`);
  }
  for (const k of Object.keys(L)) if (!(k in EN)) errs.push(`extra key ${k}`);
  for (const [q, c] of Object.entries(CORRECT)) if (L[q + 'h'] && L[q + 'h'][c] !== '') errs.push(`${q}h: correct option ${c} must have an empty hint`);
  return errs;
}

const [cmd, file, code] = process.argv.slice(2);
if (cmd === 'merge') {
  const L = JSON.parse(fs.readFileSync(file, 'utf8'));
  const errs = check(code, L);
  if (errs.length) { console.error(code + ': ' + errs.length + ' problem(s)\n  ' + errs.join('\n  ')); process.exit(1); }
  J[code] = Object.fromEntries(Object.keys(EN).map(k => [k, L[k]]));     // English key order
  fs.writeFileSync(FILE, JSON.stringify(J, null, 2) + '\n');
  console.log(code + ': merged, ' + Object.keys(EN).length + ' keys');
} else {
  let bad = 0;
  for (const { code } of J.languages) {
    const errs = J[code] ? check(code, J[code]) : ['language missing'];
    console.log(`${code}: ${errs.length ? errs.length + ' problem(s)\n  ' + errs.join('\n  ') : 'ok'}`); bad += errs.length;
  }
  process.exit(bad ? 1 : 0);
}
