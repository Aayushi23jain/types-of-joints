import { state } from './state.js';
import { loadStrings, resolveLang } from './i18n.js';
import { $ } from './dom.js';
import { t, OPUS } from './audio.js';
import { asset, original, preload, lessonFiles } from './preload.js';
import { showStartScreen } from './startScreen.js';
import { openLangModal } from './langModal.js';
import { setLang, wireChrome, startFlow } from './router.js';
import * as sc from './scene.js';
import { XAPI } from './xapi.js';

// a local (blob:) picture that fails falls back to its real file once
addEventListener('error', e => { const el = e.target; if (el && el.tagName === 'IMG' && el.src.startsWith('blob:') && !el.dataset.fb) { el.dataset.fb = 1; el.src = original(el.src); } }, true);

const hasWebGL = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } };

(async () => {
  try {
    state.S = await loadStrings();                                         // all on-screen text: assets/text/strings.json
    // ?lang= / ?lan= / ?lng= picks the launch language (en, hi, gu, mr, te, tl, od; ta / or also accepted)
    const q = new URLSearchParams(location.search);
    state.lang = resolveLang(q.get('lang') || q.get('lan') || q.get('lng') || 'en', state.S);   // e.g. ?lan=gu
    state.dev = q.get('dev') === '1';                                    // ?dev=1: Skip button + Next never locked (testing)
    if (!hasWebGL()) { clearTimeout(window.bootTimer); window.bootFail(t('errWebGL')); return; }
    const [A, sizes] = await Promise.all([fetch('assets/audio/manifest.json').then(r => r.json()), fetch('assets/asset-sizes.json').then(r => r.json()).catch(() => ({}))]);
    state.A = A; state.sizes = sizes;
    wireChrome(); setLang(state.lang);
    $('#langb').onclick = openLangModal;
    // everything the lesson needs comes down behind the bar (models, pictures, fonts, this language's voice) - the bar is the
    // only progress shown; "Let's start" appears only at 100 %
    const bar = $('#loadBar');
    await preload(lessonFiles(sizes, A, state.lang, OPUS), sizes, f => { window.bootPoke && window.bootPoke(); bar.style.width = (4 + f * 96).toFixed(1) + '%'; bar.parentElement.setAttribute('aria-valuenow', Math.round(f * 100)); });
    document.querySelectorAll('img[data-logo]').forEach(i => { i.src = asset(original(i.getAttribute('src'))); });
    await sc.init();                                                       // builds the scene from the local copies
    clearTimeout(window.bootTimer);
    $('#load').classList.add('h');
    state.ready = true;
    showStartScreen(() => { if (!state.ready) return; state.startDone = true; XAPI.launched(); startFlow(); });   // guard: nothing starts before everything is loaded
  } catch (e) {
    console.error('[boot]', e);
    clearTimeout(window.bootTimer);
    window.bootFail(t('errLoad') + (new URLSearchParams(location.search).get('dev') === '1' ? ' [' + (e && (e.message || e)) + ']' : ''));   // ?dev=1 shows the real reason
  }
})();
