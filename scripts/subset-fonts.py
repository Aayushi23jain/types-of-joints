"""Subsets the Indic script fonts to the characters the game's text actually uses (assets/text/strings.json).
All OpenType shaping features are kept, so conjuncts and matras render exactly as with the full font.
Run again after changing the text:   python3 -m pip install fonttools brotli ;  python3 scripts/subset-fonts.py
Full fonts live in ../typesofjoints-design/fonts-full/ (outside the project, so they are never deployed)."""
import json, os, subprocess, sys
ROOT = os.path.join(os.path.dirname(__file__), '..')
FULL = os.path.join(ROOT, '..', 'typesofjoints-design', 'fonts-full')   # full fonts are kept OUTSIDE the project (not deployed)
J = json.load(open(os.path.join(ROOT, 'assets', 'text', 'strings.json'), encoding='utf-8'))
FONTS = {'noto-devanagari': ['hi', 'mr'], 'noto-gujarati': ['gu'], 'noto-telugu': ['te'], 'noto-tamil': ['tl'], 'noto-odia': ['od']}

def texts(v):
    if isinstance(v, str): yield v
    elif isinstance(v, list):
        for x in v: yield from texts(x)
    elif isinstance(v, dict):
        for x in v.values(): yield from texts(x)

for font, langs in FONTS.items():
    chars = set()
    for l in langs: chars |= set(''.join(texts(J[l])))
    for l in J['languages']:
        if l['code'] in langs: chars |= set(l['name'])          # language menu shows the native names
    chars |= set('‌‍◌।॥')                 # ZWNJ, ZWJ, dotted circle, danda, double danda
    chars = ''.join(sorted(c for c in chars if ord(c) > 0x7f))     # Latin comes from Poppins
    src, out = os.path.join(FULL, font + '.woff2'), os.path.join(ROOT, 'assets', 'fonts', font + '.woff2')
    subprocess.run([sys.executable, '-m', 'fontTools.subset', src, '--text=' + chars, '--layout-features=*', '--flavor=woff2',
                    '--output-file=' + out, '--desubroutinize'], check=True)
    print(f'{font}: {os.path.getsize(src) // 1024} KB -> {os.path.getsize(out) // 1024} KB ({len(chars)} characters)')
