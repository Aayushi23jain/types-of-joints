// Full screen with the prefixed WebKit API as a fallback (older Safari / iPad). iPhone Safari has no full screen for pages at all:
// there the game can only run full screen when it is opened from the home screen (manifest.webmanifest, display: fullscreen),
// so the button shows a short "Add to Home Screen" tip instead.
const d = document, el = d.documentElement;
export const fsSupported = () => !!(d.fullscreenEnabled || d.webkitFullscreenEnabled);
export const docFullscreen = () => !!(d.fullscreenElement || d.webkitFullscreenElement);   // full screen started by the button
export const isFullscreen = () => docFullscreen() || standalone();
// opened from the home screen (always full screen). Chrome also reports display-mode: fullscreen while the PAGE is full screen,
// so that only counts when no element is full screen (otherwise the button could never leave full screen again).
export const standalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || (matchMedia('(display-mode: fullscreen)').matches && !docFullscreen());
export const isIOS = () => /iP(hone|od|ad)/.test(navigator.platform) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function enterFullscreen() {
  try {
    const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null;
    Promise.resolve(p).then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {});
  } catch (e) {}
}
export function exitFullscreen() { try { (d.exitFullscreen || d.webkitExitFullscreen).call(d); } catch (e) {} }
export const onFullscreenChange = fn => ['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => d.addEventListener(ev, fn));
