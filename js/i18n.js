// All on-screen text lives in assets/text/strings.json (one object per language, same keys everywhere).
// This module only loads it and describes the languages; no learning text is kept in the code.
export let LANGS = [];     // [code, native name] in menu order
export let BCP47 = {};     // code -> BCP 47 tag (html lang, text-to-speech voice)
export let ALIASES = {};   // other codes accepted in ?lang= (e.g. ta -> tl, or -> od)

export async function loadStrings() {
  const res = await fetch('assets/text/strings.json');
  if (!res.ok) throw new Error('strings.json ' + res.status);
  const j = await res.json();
  LANGS = j.languages.map(l => [l.code, l.name]);
  BCP47 = Object.fromEntries(j.languages.map(l => [l.code, l.bcp47]));
  ALIASES = j.aliases || {};
  const S = {};
  for (const [code] of LANGS) S[code] = j[code];
  return S;
}
// ?lang= value -> a language we have ('en' when unknown)
export const resolveLang = (l, S) => { l = String(l || '').toLowerCase(); l = ALIASES[l] || l; return S[l] ? l : 'en'; };
