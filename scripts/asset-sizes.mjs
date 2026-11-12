// Writes assets/asset-sizes.json: the real on-disk size of every runtime asset, for the loading bar (js/preload.js).
// Run after adding / changing assets:  node scripts/asset-sizes.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = fileURLToPath(new URL('../', import.meta.url));   // pathname broke on Windows (drive letter twice) and with spaces (%20)
const out = {};
const walk = dir => fs.readdirSync(ROOT + dir, { withFileTypes: true }).forEach(d => {
  const p = dir + '/' + d.name;
  if (d.isDirectory()) return walk(p);
  if (/\.(glb|webp|woff2|opus|json)$/.test(d.name) && !p.endsWith('asset-sizes.json')) out[p] = fs.statSync(ROOT + p).size;
});
['assets/models', 'assets/img', 'assets/fonts', 'assets/audio', 'assets/text'].forEach(walk);
fs.writeFileSync(ROOT + 'assets/asset-sizes.json', JSON.stringify(out, null, 0) + '\n');
const total = Object.values(out).reduce((a, b) => a + b, 0);
console.log(Object.keys(out).length, 'files,', (total / 1048576).toFixed(2), 'MB');
