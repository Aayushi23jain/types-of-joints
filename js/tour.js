// Guided tour (logic taken from the Sublimation project; shown once, right after "Let's start"): a dark mask with a "spotlight" cut-out around the UI
// element of the current step, plus a tooltip card explaining it. Texts come from i18n.js (en, gu, hi, mr).
import { t, say, stopAudio } from './audio.js';
import { asset } from './preload.js';
import { isFullscreen, onFullscreenChange } from './fullscreen.js';
import { screen as xScreen } from './xapi.js';
import { belowToolbar } from './dom.js';

// Controls card for the "turn and zoom" step: the mouse + touch icons from the design frame (assets/img/controls), same layout as the
// frame (two rows: Mouse Controls / Touch Controls, each rotate - interact - zoom); every caption comes from strings.json.
const CTRL = [['rotate', 'ctrlRotate'], ['tap', 'ctrlTap'], ['zoom', 'ctrlZoom']];
const ctrlRow = (dev, title, subs) => `<div class="ctrl-row"><h4>${t(title)}</h4><div class="ctrl-grid">` + CTRL.map(([k, cap], i) =>
  `<div><img src="${asset(`assets/img/controls/${dev}-${k}.webp`)}" alt=""><b>${t(cap)}</b><i>${t(subs[i])}</i></div>`).join('') + '</div></div>';
// Mouse + touch rows on EVERY screen (phones / tablets too), as in Xerophytic Habitat; if the card does not fit, it scrolls inside
// (css .tour-tooltip.wide) with Skip / Back / Next pinned at the bottom.
const gestures = () => '<div class="controls">'
  + ctrlRow('mouse', 'ctrlMouse', ['ctrlMouseRotate', 'ctrlMouseTap', 'ctrlMouseZoom'])
  + ctrlRow('touch', 'ctrlTouch', ['ctrlTouchRotate', 'ctrlTouchTap', 'ctrlTouchZoom']) + '</div>';

const STEPS = [
  { target: null, voice: () => 'tour-welcome', title: () => t('tWelcome'), body: () => t('tWelcomeB') },
  { target: '#c', shape: 'full', voice: () => matchMedia('(pointer: coarse)').matches ? 'tour-controls-touch' : 'tour-controls-mouse', title: () => t('tExplore'), html: gestures },
  { target: '#langb', voice: () => 'tour-lang', title: () => t('tLang'), body: () => t('tLangB') },
  { target: '#theme', voice: () => 'tour-theme', title: () => t('tTheme'), body: () => t('tThemeB') },
  { target: '#fs', voice: () => isFullscreen() ? 'tour-fs-exit' : 'tour-fs', title: () => isFullscreen() ? t('tNormal') : t('tFs'),
    body: () => isFullscreen() ? t('tFsExitB') : t('tFsB') },
  { target: '#replay', voice: () => 'tour-replay', title: () => t('tReplay'), body: () => t('tReplayB') }
];

export class Tour {
  constructor() {
    this.overlay    = document.getElementById('tourOverlay');
    this.spotlight  = document.getElementById('tourSpotlight');
    this.tooltip    = document.getElementById('tourTooltip');
    this.progressEl = document.getElementById('tourProgress');
    this.titleEl    = document.getElementById('tourTitle');
    this.bodyEl     = document.getElementById('tourBody');
    this.backBtn    = document.getElementById('tourBackBtn');
    this.nextBtn    = document.getElementById('tourNextBtn');
    this.skipBtn    = document.getElementById('tourSkipBtn');

    this.index = 0;
    this.active = false;
    this.onEnd = null; // one-shot callback, fired when the tour closes

    this.backBtn.onclick = () => { stopAudio(); this.prev(); };
    this.nextBtn.onclick = () => { stopAudio(); this.next(); };
    this.skipBtn.onclick = () => { stopAudio(); this.end(); };

    // Keep the spotlight/tooltip glued to their target across resizes.
    let resizeTimeout;
    addEventListener('resize', () => {
      if (this.active) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => this.render(), 50);
      }
    });

    // Live-swap the fullscreen step's wording if the student toggles
    // fullscreen while looking at that step.
    onFullscreenChange(() => {
      if (this.active && STEPS[this.index].target === '#fs') {
        this.render();
      }
    });
  }

  start() {
    xScreen('tour', 'TOUR', 'tutorial');
    this.index = 0; this.spokenStep = -1;
    this.active = true;
    document.body.classList.add('tour-active'); // un-dims locked buttons (menu/sound) so they highlight like the rest
    this.overlay.hidden = false;
    this.render();
  }

  end() {
    const wasActive = this.active;
    this.active = false;
    document.body.classList.remove('tour-active');
    this.overlay.hidden = true;
    stopAudio();
    const cb = this.onEnd;
    this.onEnd = null;
    if (wasActive && cb) cb();
  }

  next() {
    if (this.index >= STEPS.length - 1) { this.end(); return; }
    this.index++;
    this.render(1);
  }

  prev() {
    if (this.index === 0) return;
    this.index--;
    this.render(-1);
  }

  // dir = the way the student is moving (+1 Next, -1 Back): a step whose button is not on screen (e.g. Fullscreen on iPhone)
  // is skipped in THAT direction (Back used to bounce forward again).
  render(dir = 1) {
    const step = STEPS[this.index];
    const el = step.target && document.querySelector(step.target);
    if (step.target && (!el || !el.getClientRects().length)) {
      const n = this.index + dir;
      if (n < 0 || n >= STEPS.length) { this.index = Math.max(0, Math.min(STEPS.length - 1, n)); if (n >= STEPS.length) { this.end(); return; } }
      else { this.index = n; }
      this.render(dir); return;
    }

    // minimal narration: each step's line plays once when the step opens (not again on resize); text-to-speech if there is no clip
    if (this.spokenStep !== this.index) { this.spokenStep = this.index; say(step.voice(), (typeof step.title === 'function' ? step.title() : step.title) + '. ' + (step.body ? step.body() : '')); }
    this.progressEl.textContent = `${this.index + 1} / ${STEPS.length}`;
    this.titleEl.textContent = typeof step.title === 'function' ? step.title() : step.title;
    if (step.html) this.bodyEl.innerHTML = step.html(); else this.bodyEl.textContent = typeof step.body === 'function' ? step.body() : step.body;
    this.tooltip.classList.toggle('wide', !!step.html);                       // the controls card needs room for its two rows

    this.backBtn.style.visibility = this.index === 0 ? 'hidden' : 'visible';
    this.backBtn.textContent = t('tBack');
    this.nextBtn.textContent = this.index === STEPS.length - 1 ? t('tDone') : t('tNext');
    this.skipBtn.textContent = t('tSkip');
    this.skipBtn.style.visibility = this.index === STEPS.length - 1 ? 'hidden' : 'visible';

    this.tooltip.style.maxHeight = '';                                         // reset the below-the-toolbar fit of centerTooltip()
    const targetEl = step.target ? document.querySelector(step.target) : null;

    if (targetEl && step.shape !== 'full') {
      this.positionSpotlightOn(targetEl);
      this.positionTooltipNear(targetEl.getBoundingClientRect());
    } else if (targetEl && step.shape === 'full') {
      // Frame the whole area (canvas / labels overlay) rather than one small element.
      this.spotlight.style.opacity = '1';
      this.spotlight.style.top = '8px';
      this.spotlight.style.left = '8px';
      this.spotlight.style.width = 'calc(100% - 16px)';
      this.spotlight.style.height = 'calc(100% - 16px)';
      this.spotlight.style.borderRadius = '16px';
      this.centerTooltip();
    } else {
      this.spotlight.style.opacity = '0';
      this.centerTooltip();
    }
  }

  positionSpotlightOn(el) {
    const r = el.getBoundingClientRect();
    // The highlight ring must stay inside the gap between neighbouring buttons,
    // otherwise it also lights up part of the next button. So the padding is
    // derived from the real gap of the button row (#tl / #bl), which changes per
    // screen size (mobile / tablet / desktop): at most half the gap, minus 1px.
    const row = el.closest('#tl, #bl');
    const gap = row ? (parseFloat(getComputedStyle(row).columnGap) || 0) : 0;
    const pad = row ? Math.max(1, Math.min(6, gap / 2 - 1)) : 10;
    this.spotlight.style.opacity = '1';
    this.spotlight.style.top = (r.top - pad) + 'px';
    this.spotlight.style.left = (r.left - pad) + 'px';
    this.spotlight.style.width = (r.width + pad * 2) + 'px';
    this.spotlight.style.height = (r.height + pad * 2) + 'px';
    const br = getComputedStyle(el).borderRadius;
    this.spotlight.style.borderRadius = br.includes('%') ? br : (Math.max(parseFloat(br) || 12, 10) + pad) + 'px';
  }

  positionTooltipNear(rect) {
    this.tooltip.style.transform = 'none';
    const tw = this.tooltip.offsetWidth || 300;
    const th = this.tooltip.offsetHeight || 180;
    const margin = 16;

    let top = rect.bottom + margin;
    let left = rect.left;

    // Not enough room below — place above instead.
    if (top + th > innerHeight - margin) top = rect.top - th - margin;
    // Still nowhere good vertically (very small screen) — just center.
    if (top < margin) { this.centerTooltip(); return; }

    if (left + tw > innerWidth - margin) left = innerWidth - tw - margin;
    if (left < margin) left = margin;

    this.tooltip.style.top = top + 'px';
    this.tooltip.style.left = left + 'px';
    const r = this.tooltip.getBoundingClientRect();                          // keep it fully on screen (very small phones)
    if (r.bottom > innerHeight - 4) this.tooltip.style.top = Math.max(4, innerHeight - r.height - 4) + 'px';
    if (r.right > innerWidth - 4) this.tooltip.style.left = Math.max(4, innerWidth - r.width - 4) + 'px';
    if (r.left < 4) this.tooltip.style.left = '4px';
    if (r.top < 4) this.tooltip.style.top = '4px';
  }

  centerTooltip() {
    this.tooltip.style.top = '50%';
    this.tooltip.style.left = '50%';
    this.tooltip.style.transform = 'translate(-50%, -50%)';
    // the toolbar stays above the tour mask (enabled, clickable): on small screens start the card below it instead of under it, and let
    // it scroll inside if the rest of the screen is too short
    const y = belowToolbar(this.tooltip);
    if (y) { this.tooltip.style.top = y + 'px'; this.tooltip.style.transform = 'translateX(-50%)'; this.tooltip.style.maxHeight = (innerHeight - y - Math.max(20, innerHeight * .05)) + 'px'; }   // clear gap at the bottom: the card never touches the screen edge, its content scrolls inside
  }
}