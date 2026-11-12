# 3D Simulation Playbook — everything done to "Types of Joints"

Written for: the developers, designers and content leads who will bring other 3D science simulations to the same standard.

This document records every change made to the *Types of Joints* simulation in one working session (October 2026), in order, with the reasoning, the implementation, real code from the project, the tools and online sources used, and a porting checklist. Code paths refer to this repository. Snippets are copied from the current code; `…` marks lines left out.

---

## Contents
1. [How to use this playbook](#1-how-to-use-this-playbook)
2. [Chronological changelog](#2-chronological-changelog)
3. [Initial review method and findings](#3-initial-review-method-and-findings)
4. [Learning design and pedagogy](#4-learning-design-and-pedagogy)
5. [Curriculum alignment (NCERT and state boards)](#5-curriculum-alignment-ncert-and-state-boards)
6. [Text: one JSON file, ESL writing rules, 7 languages](#6-text-one-json-file-esl-writing-rules-7-languages)
7. [UI design system](#7-ui-design-system)
8. [Layout: landscape-only, no scrolling, rotate screen](#8-layout-landscape-only-no-scrolling-rotate-screen)
9. [3D scene techniques](#9-3d-scene-techniques)
10. [Activities: Try it!, Labels, Activity, Sort it, Quiz, end screens](#10-activities)
11. [Feedback that teaches](#11-feedback-that-teaches)
12. [Audio: voice-over, text-to-speech fallback, UI sounds](#12-audio)
13. [Loading: preload everything behind the bar](#13-loading-preload-everything-behind-the-bar)
14. [Robustness: watchdogs, fallbacks, error screens](#14-robustness-watchdogs-fallbacks-error-screens)
15. [Full screen, installable web app, iPhone](#15-full-screen-installable-web-app-iphone)
16. [Events: SwiftPAL bridge and xAPI layer](#16-events-swiftpal-bridge-and-xapi-layer)
17. [Size and compression](#17-size-and-compression)
18. [Accessibility](#18-accessibility)
19. [Developer tools: ?dev=1, ?lang=](#19-developer-tools)
20. [Deployment (Netlify) and its pitfalls](#20-deployment-netlify-and-its-pitfalls)
21. [Testing and QA method](#21-testing-and-qa-method)
22. [Assets: what was made, what was replaced, prompts](#22-assets)
23. [Online resources referred to](#23-online-resources-referred-to)
24. [File map](#24-file-map)
25. [Porting checklist for another 3D sim](#25-porting-checklist-for-another-3d-sim)
26. [Open items](#26-open-items)

---

## 1. How to use this playbook

- **Section 2** is the full history (what changed when, including things that were later reverted, so nobody re-introduces them).
- **Sections 4–20** are the reusable patterns. Each has: *why*, *what we did*, *code*, *pitfalls*.
- **Section 25** is the checklist to apply to another sim, in order.
- Decisions that were made by the product owner (not just engineering) are marked **Decision**.

---

## 2. Chronological changelog

| # | Request | What was done | Status now |
|---|---|---|---|
| 1 | End-to-end review (pedagogy, learning design, functional, usability, visual, performance, compatibility) | Read every file, ran the full flow in headless Chromium and WebKit at 5 screen sizes and 4 languages; wrote a prioritised report (§3) | Basis for everything below |
| 2 | "Fix all the issues" | Vendored Three.js and fonts (no CDN); boot watchdog + error screen with Retry; WebGL check; AAC copies of every voice clip; text-to-speech fallback; moved the fixed-joint dot to the cranium; hinge label to the left elbow (same elbow the activity moves); three-quarter camera for hinge / hip moves; on-demand rendering; adaptive pixel ratio; cached overlay rectangles (no layout per frame); predict-then-watch in Activity; Next locked until all joints explored; section progress; quiz 3→5 questions, shuffled, hint + second try, first-try scoring, resume after Previous; end screen buttons; keyboard access; 44 px hotspots; "Tap" wording on touch; mute button; README | Kept, except mute (removed in #24) |
| 3 | Refined UI from `human-atlas-main` + ConveGenius `deploy-…` kit, light/dark toggle | New single stylesheet `css/app.css` with tokens; glass cards; identity block; bottom dock with stepper; circular icon buttons; theme remembered in `localStorage`; 3D scene colours per theme; light-mode logo | Kept (refined later) |
| 4 | "Can you generate the assets?" | Built: door-hinge model (code), SVG "inside the joint" diagrams, bone glow, motion trails + range fan, Web Audio UI sounds, confetti, swing SVG, light logo; wrote prompts for voice-over / illustration / logo | Glow, trails, sounds, light logo kept; door hinge, SVG diagrams, swing SVG, confetti later replaced |
| 5 | ESL: too much text | Short screen text, full narration (redundancy principle); fact rows "Moves / Where" | Kept |
| 6 | NCERT / state-board alignment; languages en, hi, gu, te, tl, od, mr | Research by sub-agents (§5); four NCERT joints only; textbook terms per language; all text moved to `assets/text/strings.json`; 3 new script fonts; terminology doc; string checker | Kept |
| 7 | All text in a separate JSON | `assets/text/strings.json` + loader `js/i18n.js`; checker `scripts/check-strings.mjs` | Kept |
| 8 | Remove lesson path from start screen; use the new design images | D1 loading screen (grid room + progress bar); collage split into 4 joint illustrations; Riya swing illustration; steel hinge GLB; controls icons | D1 + illustrations kept; Riya and steel hinge later removed |
| 9 | Playground puzzle / flow critique | Replaced recall + puzzle + concept + intro with **Try it!** (embodied hook) | Kept (rebuilt in #11) |
| 10 | Chair stand-up after the first pop-up; controls icons exactly as the frame | Skeleton stands up when the tour closes; controls card rendered from the frame SVG | Kept |
| 11 | Remove Riya, rethink Try it!, 3D demos, no label ticks, zoom in, dark back side, hinges only on tap, sorting activity | Try it! runs beside the 3D skeleton which demonstrates each move; shoulder pivots; headlight; zoom-in limits; joint models only after a point is tapped; **Sort it** | Kept |
| 12 | Original joints; simpler sort; fix arm circle; `?dev=1`; `?lan=gu` | Restored original "+" hinge piece; sort in side card; arm bones assigned as whole connected pieces; dev Skip button; `lan` alias | Kept |
| 13 | Sort layout from `ref.png` with original joint model images | 2×2 joint cards with rendered model pictures, progress pill, dashed drop zones | Kept |
| 14 | Remove emojis; remove mute; fix pinch icon | Emojis stripped from all strings; ▶ glyph → CSS triangle; mute removed; pinch icon from frame PNG | Kept |
| 15 | No scrolling anywhere; landscape only; rotate screen | Height-based layout tiers; automated fit audit at 13 sizes; portrait blocker | Kept |
| 16 | Meaningful feedback | Specific reasons per body part / option / joint in 7 languages | Kept |
| 17 | Full screen on phones; bigger stars; simpler rotate screen; fix language dialog; Narakeet voices (Sheela en, Rashmi hi) | Full screen on first tap; language list inline; all clips regenerated; old clips deleted | Kept |
| 18 | Optimisation brief (preload, formats, dead code, verification) | `js/preload.js`; size table; blob URLs; failure paths; dead CSS/fonts/images removed; deploy ignore; throttled-network verification | Kept |
| 19 | Netlify error screen | `vendor/three/build` was skipped by Netlify → renamed to `vendor/three/core`; stall-based watchdog | Kept |
| 20 | Full-screen button on phones; tour narration | `js/fullscreen.js` with WebKit fallbacks; web-app manifest; iPhone "Add to Home Screen" tip; one narrated line per tour step | Kept |
| 21 | Star burst instead of confetti; event integration "exactly as the math games" | Stars fill one by one with tiny-star bursts; SwiftPAL bridge copied byte-for-byte; xAPI layer copied | Kept |
| 22 | End narration order = table order | Narration built from the same per-joint sentences in table order | Kept |
| 23 | Compress further without quality loss | Fonts subset to used characters; Three.js tree-shaken; add-ons minified; pictures sized to 2× display | Kept |
| 24 | Delete `_design` | Moved backups out of the project to `../typesofjoints-design/` | Kept |

Things that were tried and **removed** (do not re-add without a reason): Riya playground puzzle, recall question, concept screen, Introduction section, 3-group classification (immovable / slightly / freely movable), steel door-hinge model, code-built door hinge, SVG "inside the joint" diagrams, confetti, mute button, lesson path on the start screen, label ticks, emojis.

---

## 3. Initial review method and findings

**Method.** Read all JS/CSS/HTML and content; served locally; drove headless Chromium and WebKit with Playwright at 1366×768, 1024×768, 768×1024, 375×667, 667×375 in en/hi/gu/mr; tested CDN blocked, keyboard-only, Replay during the tour; measured frame times, layout counts, payload.

**Findings that should be checked in every sim:**
- Dead-end last screen (no button).
- Endless "Loading…" when a CDN or WebGL fails.
- Auto-playing voice with no way to stop it in class (we added mute, later the product owner removed it — **Decision**).
- Content errors visible in 3D (a label dot on a joint that moves, a bone bent past its real range).
- Learning design: long reading before any interaction; passive "watch" activity; recall-only quiz; feedback identical for right and wrong.
- Two clashing classification schemes (Class 6 vs Class 11).
- Accessibility: clickable `div`s, no `aria-live`, no canvas label.
- Performance: rendering every frame while idle; `getBoundingClientRect` every frame after DOM writes (layout thrash).
- Compatibility: Ogg Opus only (older Safari silent), iPhone has no Fullscreen API.

---

## 4. Learning design and pedagogy

### Final flow
```
Loading (D1) → Start ("Let's start") → Tour (first launch only, narrated)
→ skeleton stands up from the chair → Try it! (3D demo + challenge → definition)
→ Labels → Activity (predict → watch) → Sort it → Quiz (5) → Score → What you learned (Retake / Play again)
```
Bottom dock: Previous · 4-step progress (Labels / Activity / Sort it / Quiz) · Next.

### Principles applied
| Principle | How it shows up |
|---|---|
| Embodied hook (NCERT opens with moving your own body) | Try it!: the 3D skeleton turns its head / bends its elbow / circles its arm, the student copies; then "bend your arm in the middle" → cannot → definition of a joint |
| Prior knowledge before new content | The old recall screen came after the hook; the whole opening was rebuilt so the definition is *discovered* |
| Predict → observe | Activity: "How does it move? Guess!" before each joint moves |
| Explore everything before moving on | Next is disabled until all four joints are explored in Labels and Activity (`state.seen`) |
| Application over recall | Quiz has 2 application questions (head-shake, knee vs hip) and 1 rewritten elbow question; Sort it applies the categories to body parts |
| Elaborated feedback | Each wrong option has its own hint; first wrong try → hint + second try; score counts first tries only |
| Redundancy principle (ESL) | Screen shows key words; narration explains in full |
| No dead ends | End screen has Retake quiz / Play again; Replay sits the skeleton back down |

### Gating and progress (router)
```js
// js/router.js
const explored = where => sc.ORDER.filter(k => state.seen.has(where + ':' + k)).length;
const allExplored = where => explored(where) === sc.ORDER.length;
function labels() {
  const nav = () => setNav(null, () => enter('activity', activity), !allExplored('labels'));   // Next locked until all 4 explored
  …
}
function setNav(prevFn, nextFn, locked = false) {
  …
  if (nb) { nb.disabled = !!nextFn && locked && !state.dev; … }   // ?dev=1: never locked
}
```

### Quiz engine (`choose()` in `js/router.js`)
- Options shuffled; correct answer index stays fixed in data (`QZ = [['q1', 3], …]`).
- First wrong answer with a hint → shows the hint for *that* option, crosses it out, lets the student try again.
- Second wrong (or no hint) → reveals the right answer and the matching explanation (`q*ok` / `q*no`).
- After the final answer only the chosen + right options stay visible (saves space, focuses attention).
- Score = number right on the first attempt.

```js
const sub = btn(p, t('submit'), () => {
  if (sel < 0) return;
  tries++;
  const ok = sel === correct, hint = opts.hints && opts.hints[sel];
  if (opts.onAnswer) opts.onAnswer(sel, ok, tries, labels[sel], order.indexOf(sel));   // events
  if (!ok && hint && tries === 1) { /* hint, cross out, try again */ … return; }
  locked = true; p.classList.add('answered'); … sfx(sel === correct ? 'correct' : 'wrong');
  …
  if (opts.explain) say(opts.explain(ok), ok ? okTxt : noTxt);    // voice = the explanation that matches the answer
});
```

---

## 5. Curriculum alignment (NCERT and state boards)

**Key finding:** NCERT's new NCF-2023 *Curiosity* books (Class 6 2024, Class 7 2025, Class 8) have **no joints chapter**. The authoritative content is the **previous NCERT Class 6 Science, Ch 8 "Body Movements"**, which Gujarat (GSEB Std 6) still teaches.

**What the game teaches now (NCERT Class 6 wording):**
- A joint is a place where two bones meet; we can bend or move only at joints.
- Exactly four joints: **ball and socket** (shoulder, hip; rounded end of one bone in the hollow of another; all directions), **pivotal** (where the neck joins the head; a cylindrical bone turns in a ring), **hinge** (elbow, knee; back and forth, like a door), **fixed** (skull bones, upper jaw and head; no movement).
- **Removed:** immovable / slightly movable / freely movable, gliding joint, ankle example — these are Class 11 Biology (Ch 17 Locomotion and Movement).

**Terms per language** (full table and sources in `docs/terminology.md`):

| | Ball and socket | Pivotal | Hinge | Fixed | Source |
|---|---|---|---|---|---|
| hi | कंदुक-खल्लिका संधि | धुराग्र संधि | हिंज संधि | अचल संधि | NCERT Hindi fhsc108 |
| gu | ખલ-દસ્તો સાંધો | ઊખળી સાંધો | મિજાગરા સાંધો | અચલ સાંધો | GSEB Std 6 Ch 8 |
| mr | उखळीचा सांधा | आस सांधा (not in book) | बिजागिरीचा सांधा | अचल सांधा | Balbharati Std 6 Ch 8 |
| te | బంతి గిన్నె కీలు | బొంగరపు కీలు | మడతబందు కీలు | కదలని కీలు | Telangana SCERT Cl 6 Ch 14 |
| tl (Tamil) | பந்துக் கிண்ண மூட்டு | முளை அச்சு மூட்டு | கீல் மூட்டு | அசையா மூட்டு | TN Samacheer Cl 8 U19 (copy) |
| od | ବଲ୍ ଓ ସକେଟ୍ ଗଣ୍ଠି | ପିଭଟ୍ ଗଣ୍ଠି | କବ୍ଜା ଗଣ୍ଠି | ଅଚଳ ଗଣ୍ଠି | **unverified** |

Corrections found: Hindi used "जोड़" (NCERT uses संधि); Gujarati pivotal was ધરી (book: ઊખળી); Gujarati backbone was કરોડરજ્જુ = *spinal cord* (book: મેરુદંડ). Watch out: Gujarati **ઊખળી** = pivotal, Marathi **उखळीचा** = ball and socket.

**Process that worked (repeat it per sim):**
1. Research agents in parallel: (a) NCERT English + Hindi chapter, current status in new books, Class 11 source of any extra content; (b) Gujarat + Maharashtra books; (c) Telangana/AP, Tamil Nadu, Odisha books. Each returns a term table **with source URL and a "not verified" flag**.
2. Write a glossary per language from the verified terms.
3. Translators (one agent per language) get a fixed **brief** (audience, ESL style, format rules, the glossary, NCERT content limits) and must validate their file with a script before returning.
4. Merge through `scripts/check-strings.mjs`, then sweep for banned old terms.
5. A subject teacher reviews every language before release.

Translation brief (abridged, `BRIEF.md` used for all languages):
```
- Students 10–12, ESL. Short sentences, one idea each; not longer than the English.
- Narration keys (introText, *D, topicSummary) may be fuller.
- Use ONLY the glossary terms, the same way every time.
- Keep {placeholders}, <b> tags, | separators, array lengths and positions (empty hint "" stays empty).
- Only NCERT's four joints; no immovable/slightly/freely movable.
- Return the path and a list of words you were not sure about.
```

---

## 6. Text: one JSON file, ESL writing rules, 7 languages

### Structure — `assets/text/strings.json`
```json
{
  "_readme": "All on-screen text … same keys in every language …",
  "languages": [ { "code": "en", "name": "English", "bcp47": "en-IN" }, { "code": "hi", "name": "हिंदी", "bcp47": "hi-IN" }, …,
                 { "code": "tl", "name": "தமிழ்", "bcp47": "ta-IN" }, { "code": "od", "name": "ଓଡ଼ିଆ", "bcp47": "or-IN" }, … ],
  "aliases": { "ta": "tl", "or": "od" },
  "en": { "title": "Types of Joints", … }, "hi": { … }, …
}
```
- Codes used by the product: `en hi gu te tl od mr` (`tl` = Tamil, `od` = Odia — **Decision**); real BCP-47 tags are used for `<html lang>` and voices.
- No learning text in code. Even error messages and screen-reader labels are keys (`errLoad`, `a11yCanvas`, …). The boot error screen reads the JSON itself so it shows in the student's language even when the app modules fail.

### Loader — `js/i18n.js`
```js
export async function loadStrings() {
  const j = await (await fetch('assets/text/strings.json')).json();
  LANGS = j.languages.map(l => [l.code, l.name]);
  BCP47 = Object.fromEntries(j.languages.map(l => [l.code, l.bcp47]));
  ALIASES = j.aliases || {};
  const S = {}; for (const [code] of LANGS) S[code] = j[code]; return S;
}
export const resolveLang = (l, S) => { l = String(l || '').toLowerCase(); l = ALIASES[l] || l; return S[l] ? l : 'en'; };
// js/audio.js
export const t = k => (state.S ? state.S[state.lang][k] ?? state.S.en[k] ?? '' : '');
```

### Checker — `scripts/check-strings.mjs`
Run `node scripts/check-strings.mjs` after every text edit. It checks, per language: same keys as English, same array lengths, empty-hint slots in the same positions, same `{placeholders}`, same `<b>` count, and that the correct quiz option has an empty hint. `merge f.json code` validates a translator's file before merging it.

### ESL writing rules (used for every string)
- One idea per sentence; everyday words; the same joint name everywhere.
- Screen text ≤ the English length; narration may be fuller (redundancy principle).
- Labels as fact rows instead of paragraphs: **Moves:** *Back and forth, like a door* / **Where:** *Elbow, knee*.
- Never build sentences by plugging a phrase into a template if the phrase is a label (bad: "A fixed joint moves: no movement"). Write a full sentence per case instead (`predictWhy_<joint>`).
- Hints = 1–2 short sentences tied to the option the student chose.
- No emojis anywhere (some phones render them as colour images; ▶ was replaced by a CSS triangle).

### Fonts per script
Each Indic font has a `unicode-range`, so a student only downloads the font for the script on screen:
```css
@font-face { font-family: TE; font-weight: 400 700; font-display: swap; src: url(../assets/fonts/noto-telugu.woff2) format('woff2');
  unicode-range: U+0951-0952, U+0964-0965, U+0C00-0C7F, U+1CDA, U+1CF2, U+200C-200D, U+25CC; }
:root { --font: Poppins, 'Noto Sans Devanagari', GU, TE, TA, OR, 'Nirmala UI', system-ui, sans-serif; }
```
Font files came from the Google Fonts CSS2 API (fetched with a desktop Chrome user-agent so it returns WOFF2 and per-subset URLs), then were subset (§17).

---

## 7. UI design system

**References.** Layout language from *Human Atlas* (`human-atlas-main`, live: human-atlas-seven.vercel.app): identity block top-left, glass cards, quiet type, bottom dock, detail sheet. Colours and circular outline icon buttons from the ConveGenius game kit (`deploy-6a1921b57dbd6cc47271bb70`): navy `#030c29`, primary `hsl(225 92% 58%)`, accent cyan `hsl(187 92% 50%)`, `game-icon-hover`. Brand yellow `#ffb81c` only for the single main action on each screen.

**One stylesheet** (`css/app.css`) replaced five overlapping legacy files (~75 KB with `!important` wars). Everything is a token; light mode overrides the same tokens:
```css
:root {
  color-scheme: dark;
  --bg: #030c29; --surface: rgba(9, 20, 54, .78); --surface-strong: rgba(9, 20, 54, .94);
  --border: rgba(118, 148, 230, .22); --text: #e6ebf5; --muted: #94a0b8;
  --primary: #3b6ef5; --accent: #0dd3ef; --cta: #ffb81c; --ok: #22c55e; --no: #f05252; …
  --blur: blur(22px) saturate(1.2);
}
:root[data-theme="light"] { color-scheme: light; --bg: #eef4ff; --surface: rgba(255,255,255,.82); --text: #14213d; --accent: #0b8fa6; … }
```
**Components:** `.btn` (yellow pill, primary), `.btn-ghost` (outline pill), circular icon buttons in `#tl`, glass card `#panel` with accent bar above the heading and a sticky footer `.actions` that fades content behind it, option rows `.opt` with `.sel/.ok/.no` states (✓/✕ badges, shake on wrong, pop on right), feedback `p.fb.ok/.no` with icon, chips, joint cards.

**Theme toggle** — remembered per device, applied before first paint:
```html
<script>try { var th = localStorage.getItem("joints-theme"); if (th === "light" || th === "dark") document.documentElement.dataset.theme = th; } catch (e) {}</script>
```
The 3D scene follows the theme (`sc.setTheme(dark)`: background, fog, grid colour, accent of glows and trails). The logo swaps between a dark and a light version (`img[data-logo]`), not a CSS filter.

**Loading screen (D1 design):** a perspective grid "room" generated as one inline SVG path (no image download), the logo, a progress bar.

**Start screen:** logo, title, tagline, "Let's start" (pops in when loading reaches 100 %). No lesson path (**Decision**: students don't need the structure).

**Score screen:** stars fill one by one; each emits a burst of tiny stars (no confetti — **Decision**):
```js
starEls.slice(0, stars).forEach((el, i) => later(() => { el.classList.add('on'); burst(el); sfx('tap'); }, 450 + i * 380));
function burst(star) {
  const b = E('i', 'burst', star);
  for (let n = 0; n < 9; n++) {
    const a = (n / 9) * Math.PI * 2 + Math.random() * .4, d = 34 + Math.random() * 22;
    const sp = E('b', '', b, '★'); sp.style.setProperty('--x', (Math.cos(a) * d).toFixed(0) + 'px'); sp.style.setProperty('--y', (Math.sin(a) * d).toFixed(0) + 'px');
  }
  later(() => b.remove(), 1100);
}
```
```css
@keyframes starBurst { 0% { opacity: 1; transform: translate(-50%,-50%) scale(.4); } 70% { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1) rotate(90deg); } }
```

**Tour "Turn and zoom" card:** the six icons from the design frame (`Frame 1410085669.svg`) rendered at 3× with headless Chromium from the SVG (background rects removed), each cropped to its bounding box; **the pinch icon** was taken from the frame PNG instead because the SVG pattern rendered it wrongly (background colour keyed out and un-premultiplied). Layout = the frame: "Mouse Controls" row, "Touch Controls" row, no boxes.

**Language dialog:** title, subtitle, a toggle that opens the list **inside** the dialog (no overlap, no scrolling; 2 columns on short screens), Cancel / Apply; close button with a single circle (the icon SVG must not draw its own circle).

---

## 8. Layout: landscape-only, no scrolling, rotate screen

**Decision:** the sim must work perfectly on laptop, tablet and phone **landscape**; portrait shows a rotate screen.

```html
<div id="rotate" role="alertdialog" aria-live="assertive">
  <svg class="rotate-ico" viewBox="0 0 64 64"><rect class="ph" x="22" y="10" width="20" height="36" rx="4"/></svg>
  <h2 id="rotateTitle">Please rotate your device</h2></div>
```
```css
#rotate { display: none; position: fixed; inset: 0; z-index: 200; … }
@media (orientation: portrait) { #rotate { display: flex; } }
@keyframes turnPhone { 0%, 25% { transform: rotate(0); } 55%, 100% { transform: rotate(-90deg); } }
```

**Height-based tiers** (width-based phone rules were gated to portrait so they stop interfering):
- default (tall laptops/tablets): left column card `#panel { top: 92px; max-height: calc(100dvh - 92px - 100px); }`
- `@media (max-height: 860px) and (min-height: 521px)`: tighter type and option heights
- `@media (max-height: 740px) and (min-height: 521px)`: tighter still
- `@media (max-height: 520px) and (orientation: landscape)`: phones — card `clamp(300px, 54vw, 470px)` from the top, options in **2 columns**, identity hidden, logo bottom-right, compact dock, Sort it full width with the four joints in one row
- `@media (max-height: 360px)`: very small phones

**Answered state** keeps only the chosen + correct option: `#panel.answered > .opt:not(.ok):not(.no) { display: none; }`.

**The card is an obstacle for the 3D labels and camera** (`cardKind()` in `js/scene.js`): labels on a side that would run under a left column / top card / bottom sheet are stacked beside or above it; the camera view offset centres the model in the free space. Card rectangles are cached by `ResizeObserver` + `MutationObserver` + `animationend` (measured again after the entrance animation lands — otherwise the cache is ~10 px off).

**Fit audit** (§21) at 13 landscape sizes × 3–4 languages reports any card that scrolls, leaves the screen, or overlaps the toolbar/dock. Acceptance: all `ok`.

---

## 9. 3D scene techniques

All in `js/scene.js` (Three.js r160.1, vendored).

### 9.1 Render on demand + adaptive resolution
Idle screens cost no GPU. A frame is drawn only while something can change; `wake(ms)` keeps drawing for a while after input.
```js
let awakeUntil = 0;
export const wake = (ms = 1200) => { awakeUntil = Math.max(awakeUntil, performance.now() + ms); };
controls.addEventListener('change', () => wake()); controls.addEventListener('start', () => wake(60000)); controls.addEventListener('end', () => wake());
['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => wake(), { passive: true }));
function tick() {
  …
  const busy = tw || f || hiOn || S.demo || S.sitTw || (c && c.op !== c.target) || Object.values(S.glows).some(g => g.visible) || now < awakeUntil;
  if (!busy) { DPR.last = 0; return; }                 // nothing can change on screen: skip the frame
  …; renderer.render(scene, camera); onFrame.fn && onFrame.fn(); adapt(now);
}
// pixel ratio capped at 1.5 on touch devices; drops by 0.25 while 60 frames average > 45 ms
DPR.max = Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2);
function adapt(now) { … if (avg > 45 && DPR.cur > 1) { DPR.cur = Math.max(1, DPR.cur - .25); renderer.setPixelRatio(DPR.cur); renderer.setSize(innerWidth, innerHeight, false); } }
```
Measured: start-screen idle = 0 WebGL draws; Labels idle = 0 layouts/s (was 26).

### 9.2 No layout reads per frame
The label overlay (pills + leader lines that follow 3D anchors) caches pill sizes every 45 frames and reads card rectangles from the observer cache — never `getBoundingClientRect` in the frame loop.

### 9.3 Lighting: model never dark from behind
A soft headlight travels with the camera (the back used to be lit only by a faint blue rim):
```js
const head = new THREE.DirectionalLight(0xffffff, 1.25); head.position.set(0, 4, 10); head.target.position.set(0, 0, -10);
camera.add(head, head.target); scene.add(camera);
```

### 9.4 Zoom limits that allow zooming in
```js
const ZOOM_IN = { home: .38, focus: .5 };   // how much closer than the framed view a student may zoom
const setMin = (d, isHome = false) => { S.lim.min = d * (isHome ? ZOOM_IN.home : ZOOM_IN.focus); S.lim.max = Math.max(d, maxFor(d, isHome)); S.lim.home = isHome; };
// limits are relaxed while the camera flies, enforced when it arrives
controls.minDistance = tw ? 0 : S.lim.min; controls.maxDistance = tw ? 1e4 : S.lim.max;
```

### 9.5 Splitting one skeleton mesh into movable parts — by connected pieces
Per-triangle height/width cut-offs left fingertips on the thigh and slivers of the humerus on the torso (they "stayed behind" when the arm moved). Fix: weld vertex positions, union-find triangles into connected pieces (= bones), assign each **whole** piece by its centre.
```js
function armPieces(P, idx) {
  const n = P.count, parent = new Int32Array(n).map((_, i) => i), key = new Map();
  const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const join = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
  for (let i = 0; i < n; i++) { const k = Math.round(P.getX(i) * 500) + ',' + Math.round(P.getY(i) * 500) + ',' + Math.round(P.getZ(i) * 500);
    const o = key.get(k); if (o === undefined) key.set(k, i); else join(i, o); }                        // weld UV/normal seams
  for (let i = 0; i < idx.length; i += 3) { join(idx[i], idx[i + 1]); join(idx[i], idx[i + 2]); }
  // per piece: centre + x extent; skip pieces that cross the middle (ribs, pelvis, spine) or sit behind (shoulder blade)
  … if (ax > 2.45 && y > 16.4 && y < 21.6) part.set(r, 'upperArm' + side); else if (ax > 2.2 && y > 6.5 && y <= 16.4 && Math.abs(z) < 1.8) part.set(r, 'forearm' + side);
  return i => part.get(find(i)) || null;
}
```
Pivots: shoulder at the head of the humerus (measured from the mesh: `[±2.8, 20.8, -0.35]`); the forearm group is a child of the upper-arm group so the arm circle carries the hand.

### 9.6 "Copy me" demos on the real skeleton
```js
const DEMO = { head: 3.2, elbow: 3.2, circle: 3.6 };   // seconds
export const demo = (name, done, hold) => { S.demo = name && DEMO[name] ? { name, s: performance.now(), dur: DEMO[name] * 1000, done, hold } : null; resetDemo(); wake(); };
function playDemo(p) {
  const d = S.demo; if (!d) return;
  const k = d.hold != null ? d.hold : Math.min(1, (performance.now() - d.s) / d.dur), env = Math.sin(Math.PI * Math.min(1, k * 1.15));
  if (d.name === 'head') p.head.rotation.y = .75 * Math.sin(k * Math.PI * 4) * env;
  if (d.name === 'elbow') S.pivots.forearmL.rotation.x = -2.1 * (.5 - .5 * Math.cos(k * Math.PI * 4));          // ~120° bend, twice
  if (d.name === 'circle') { const e = k * k * (3 - 2 * k); S.pivots.upperArmL.rotation.set(-Math.PI * 4 * e, 0, -.3 * Math.sin(Math.PI * k)); }   // two forward circles, slightly out from the body
  if (k >= 1 && d.hold == null) { S.demo = null; resetDemo(); d.done && d.done(); }
}
```
`hold` freezes a pose at a phase (0..1) — used by tests to screenshot the motion frame by frame.

### 9.7 Sit → stand from the chair
The skeleton starts seated on a procedural chair; it stands up (smoothstep tween ~1.8 s) when the first pop-up (tour) closes, then the chair fades, then Try it! opens. Replay sits it back down (`sitDown()`), then stands it again.

### 9.8 Highlights
- **Bone glow:** selected joint's bones get a cloned material with a pulsing emissive in the theme accent. **Red** variant (`highlightParts(['upperArmL'], 0xf05252)`) = "this bone cannot bend" in the Try it! challenge. In Sort it, the body part being sorted glows.
- **Motion trail + range fan** during the Activity: the path of the moving end (hand / knee / face) sampled from the real animation clip (120 samples) → `TubeGeometry` + a translucent triangle fan from the joint, revealed with `setDrawRange` as the clip plays.

### 9.9 Joint models (original pieces)
The original "+" hinge, pivot block and ball-and-stick models are **only shown after a glowing point is tapped** in the Activity (not from the start — **Decision**), and not in Labels. For Sort it, each piece (and the skull for "fixed") was rendered once to a transparent PNG with an offscreen `WebGLRenderer` (`preserveDrawingBuffer`, transparent clear), cropped, saved as WebP (`assets/img/joints/model-*.webp`). Pitfall: the skull mesh shares the whole skeleton's vertex buffer, so `Box3.expandByObject` returns the whole body — pass a measured box.

### 9.10 Camera framing per joint
- Labels: camera swings to the joint's side (`JOINTS[k].az`) and frames a box that must stay fully visible (`FOCUS`).
- Activity moves: three-quarter view for joints that move toward the camera (hinge −40°, ball 35°) so the bend is readable.
- Try it!: `frameUpper()` — upper body from front-left.
- Labels + activity use the **same** (left) elbow and hip as the animation.

---

## 10. Activities

### Try it! (`js/studentFlow.js`) — side card, 3D skeleton demonstrates
1. Three move tiles (Turn your head / Bend your elbow / Swing your arm in a circle). Tap → skeleton performs it (`sc.demo`) → tile ticked when done. A **watchdog** ticks it anyway after `DEMO_MS + 2.5 s` (animation loop pauses in background tabs).
2. Challenge: "Now bend your arm in the middle. Can you?" — upper arm glows red; Yes/No → feedback + NCERT definition.

### Labels
Pills with leader lines on each joint; click → camera focuses, bones glow, card shows **Moves / Where** fact rows + illustrated close-up (`assets/img/joints/<k>.webp`); `n/4` progress. No ticks on labels (**Decision**).

### Activity
Glowing points (44 px hit targets, pushed apart if closer than 46 px on small screens). Tap → predict card ("How does it move? Guess!", 4 movement options) → specific feedback → Watch → part isolates, joint model appears beside it, trail draws, camera returns. Intro voice plays once on entry, not after each move.

### Sort it (`js/sort.js`) — layout from `ref.png`
- Title + hint | progress pill `n/7` with bar.
- Chips with grip dots: Shoulder, Hip, Neck, Elbow, Knee, Skull, Upper jaw (shuffled once).
- 2×2 joint cards: model picture, name, "how it moves", dashed drop zone "Drop body part here".
- Drag (pointer events, ghost chip follows the finger) **or** tap chip then card (touch + keyboard). Right → chip moves into the zone with a check; wrong → shake + specific reason. Next unlocks when all 7 are sorted.
```js
const startDrag = (e, c, k) => {
  const x0 = e.clientX, y0 = e.clientY; let ghost = null;
  const over = ev => document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.sort-bin');
  const move = ev => { if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;   // < 8 px = a tap
    if (!ghost) { ghost = c.cloneNode(true); ghost.classList.add('ghost'); document.body.append(ghost); … }
    ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; … };
  const up = ev => { …; c.addEventListener('click', ev2 => ev2.stopImmediatePropagation(), { once: true, capture: true });   // no tap after a drag
    if (bin) drop(k, bin.dataset.bin); };
  addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
};
```

### Quiz
5 questions (q3 rewritten: elbow lifting a water bottle; q4 head shake; q5 knee vs hip), shuffled options, hint + second try, explanations voiced. Previous → Sort it → Next returns to the same question.

### Score + What you learned
Score: stars (fill one by one + bursts), accuracy ring, correct/incorrect. What you learned: "A joint is where bones meet." + a row per joint (picture, name, how it moves) + **Retake quiz / Play again**. The narration reads the rows **in table order** (§12).

---

## 11. Feedback that teaches

| Where | Right | Wrong |
|---|---|---|
| Activity predict | "Yes! A hinge joint bends only back and forth, like a door. Now watch." | "Not quite. A fixed joint does not move at all. Watch!" |
| Sort it | "Yes! Upper jaw: Fixed Joint." | "Not this one. Your elbow bends only back and forth, like a door." |
| Quiz (final) | "Yes! The elbow is a hinge joint. It bends back and forth, like a door, but it cannot turn round." | "The elbow is a hinge joint. It bends only back and forth, like a door." |
| Quiz (first wrong) | — | Option-specific hint: "A pivotal joint turns around. Your elbow does not turn." + Try again |

Implementation: predict feedback is composed from three full-sentence keys, never a label template:
```js
fb.textContent = [t(ok ? 'predictYes' : 'predictNotQuite'), t('predictWhy_' + k), t('predictWatch')].join(' ');
say((ok ? 'predictOk-' : 'predictNo-') + k, fb.textContent);
```
Sort reasons are keyed per body part: `sortWhy_bpElbow`, … The voice always plays the clip that matches the text on screen.

---

## 12. Audio

### `say(key, text)` — `js/audio.js`
- Voice clips are **Ogg Opus only** (Chrome, Edge, Firefox, Android, Safari / iOS 18.4+). Where Opus cannot play (iOS 18.3 and older) the sentence is spoken with the device's text-to-speech voice. The AAC `.m4a` copies were removed (**Decision**: −5.2 MB).
- Plays the preloaded local copy (`asset(src)`); if that blob fails, retries the real file once.
- If there is no clip or it cannot play, speaks `text` with the device's text-to-speech voice for the language (only if such a voice exists).
- If autoplay is blocked, retries on the next tap/key.
```js
export const OPUS = !!probe && probe.canPlayType('audio/ogg; codecs="opus"') !== '';
export const say = (k, text) => {
  stopAudio(); if (state.muted) return null;
  const A = state.A && state.A[state.lang], key = Array.isArray(k) ? k.find(x => A && A[x]) : k, f = A && key && A[key];
  if (!f || !OPUS) return speak(text);                            // no clip, or no Opus (iOS ≤ 18.3): text-to-speech
  const src = 'assets/audio/' + f;
  const a = state.cur = new Audio(asset(src));
  a.addEventListener('error', () => { if (state.cur !== a) return;
    if (a.src.startsWith('blob:') && !a.dataset.fb) { a.dataset.fb = 1; a.src = src; a.play().catch(() => {}); return; }
    const s = speak(text); if (s) s.addEventListener('ended', () => a.dispatchEvent(new Event('ended')), { once: true }); }, { once: true });
  a.play().catch(err => { if (err && err.name !== 'NotAllowedError') return;
    const retry = () => { if (state.cur === a) a.play().catch(() => {}); };
    ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, retry, { once: true, capture: true })); });
  return a;
};
```
`Speech` is a small `EventTarget` wrapper around `SpeechSynthesisUtterance` so callers can treat TTS like an `<audio>` (pause, `ended`, `error`).

### Generating the voice-over — `scripts/build-audio.mjs` (Narakeet)
- `clipTexts(L)` is the single list of everything spoken, built from `strings.json` (labels, joints, predict feedback, Try it!, every quiz question/explanation/hint, Sort it intro/right/wrong per part, end summary, tour lines).
- Voices: **Sheela** (Indian English), **Rashmi** (Hindi). Key passed as an environment variable only.
- Each clip stores a `.txt` signature (voice + text); unchanged clips are skipped, changed ones regenerated.
- Outputs `.opus` only (32 kbps mono, `libopus`); Narakeet's `.m4a` download is converted and deleted; updates `assets/audio/manifest.json`.
```js
// short texts come straight back; longer ones use the task/polling API
const r = await fetch(`https://api.narakeet.com/text-to-speech/m4a?voice=${voice}`,
  { method: 'POST', headers: { 'x-api-key': KEY, 'Content-Type': 'text/plain', accept: 'application/octet-stream' }, body: text });
…
execFileSync('ffmpeg', ['-loglevel','error','-y','-i', base + '.tmp.m4a', '-c:a','libopus','-b:a','32k','-ac','1', base + '.opus']);
fs.unlinkSync(base + '.tmp.m4a');   // only the .opus is kept
```
Run: `NARAKEET_KEY=… node scripts/build-audio.mjs en hi`. 83 clips per language. All old recordings were deleted (**Decision**); gu/te/tl/od/mr use device TTS until recorded.

Rules learned:
- End-screen narration must follow the on-screen table order (built from the same per-joint sentences in `ORDER`).
- The "Activity" intro voice plays once on entry, not after every joint move (`quietOnce`).
- When an explanation exists, play it directly (it already starts with "Yes!" / names the right answer) instead of "Correct!" + explanation.
- Tour: one short line per step, once per step (not on resize), re-read after a language switch, stopped when the tour ends.

### UI sounds — `js/sfx.js` (no files)
Web Audio oscillators: tap, correct (rising fifth), wrong (soft falling step, not a buzzer), sparkle (all explored), finish. Quiet master gain 0.22; silent when muted.
```js
function note(c, freq, at, dur = .18, type = 'sine', gain = 1) {
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
}
```

---

## 13. Loading: preload everything behind the bar

`js/preload.js` + `assets/asset-sizes.json` (generated by `node scripts/asset-sizes.mjs`).
- **What:** all models, all pictures, Poppins, the student's script font, and the student's language voice clips (Opus; none when the browser cannot play Opus).
- **How:** streaming `fetch` readers → byte-accurate progress weighted by real sizes (refined by `Content-Length`); bar never goes backwards; **smallest first**; 5 at a time; each finished file becomes a `blob:` URL used via `asset(path)`.
- **Never blocks:** a failed / stalled (15 s without bytes) / aborted transfer counts as done; the element keeps the normal path.
- "Let's start" appears only at 100 %; the start handler is guarded (`state.ready`).
- After a language switch, that language's clips and font warm in the background.
```js
async function fetchOne(p, expected, onBytes) {
  const ctl = new AbortController(); let timer = setTimeout(() => ctl.abort(), STALL_MS);
  const poke = () => { clearTimeout(timer); timer = setTimeout(() => ctl.abort(), STALL_MS); };
  try {
    const r = await fetch(p, { signal: ctl.signal }); if (!r.ok || !r.body) throw new Error(r.status);
    const len = +r.headers.get('content-length') || expected, chunks = []; let got = 0; onBytes(0, len);
    const reader = r.body.getReader();
    for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; poke(); onBytes(got, len); }
    blobs.set(p, URL.createObjectURL(new Blob(chunks, { type: MIME[p.split('.').pop()] || '' })));
  } catch (e) { /* counts as done */ } finally { clearTimeout(timer); onBytes(Infinity); }
}
```
Boot (`js/main.js`): strings → manifest + size table → `preload(lessonFiles(...))` → `sc.init()` from blobs → hide loader → start screen. A capture-phase `error` listener reverts any broken `blob:` image to its real file once.

Measured: normal network — Let's start after 1.4 s, ~4 MB per student; throttled "slow 4G" (1.6 Mbps, 150 ms) — steady progress, pictures before models, start ≈ 22 s; one failed + one missing + one stalled file — still starts, zero errors; zero 4xx/5xx; nothing re-downloaded during play.

---

## 14. Robustness: watchdogs, fallbacks, error screens

- **Boot watchdog** (inline in `index.html`, works even if modules fail): shows a localized error + Retry. It fires only when loading **stalls** for 45 s (`bootPoke()` on every progress tick) — a fixed 45 s limit failed on slow connections once everything was preloaded.
- `<script type="module" … onerror="bootFail()">` catches a missing module.
- WebGL check before anything: clear message ("This device or browser cannot show 3D graphics…").
- `?dev=1` appends the real error reason to the error screen.
- Media-driven UI: every wait has a watchdog (Try it! tiles), audio has error → TTS, blob → real file.
- Replay from any screen unlocks the camera and clears highlights/demos (`clearAll()`).

---

## 15. Full screen, installable web app, iPhone

`js/fullscreen.js` wraps the standard and the prefixed WebKit API:
```js
export const fsSupported = () => !!(d.fullscreenEnabled || d.webkitFullscreenEnabled);
export const standalone = () => matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
export function enterFullscreen() {
  const p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null;
  Promise.resolve(p).then(() => { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); }).catch(() => {});
}
```
- Touch devices go full screen on the **"Let's start" tap** (browsers require a user gesture).
- The toolbar button is always visible. Where pages cannot go full screen (**iPhone Safari**), it shows a tip: "To play full screen on iPhone: tap Share, then 'Add to Home Screen', and open the game from there."
- `manifest.webmanifest` (`display: fullscreen`, `orientation: landscape`, icons 192/512) + `apple-mobile-web-app-capable`, `apple-touch-icon` (180), `viewport-fit=cover`, `theme-color` → from the home screen the game runs full screen in landscape on iPhone and Android.

---

## 16. Events: SwiftPAL bridge and xAPI layer

**Decision:** use exactly what the FLN math games use (`FLN 2/CacheBust-Fix/Maths/MT01A01_L05_S02`), keep the xAPI statements as they are.

1. **SwiftPAL Platform Bridge** — the inline `<script>` from the math game's `index.html`, copied **byte for byte** (verified identical). It declares a bare top-level `const SwiftPAL` with `sendEvent(payload)`, `invoke(name, …args)`, `query(name, timeout, …args)` and routes to Android (`window.Android.sendEvent`), iOS (`window.webkit.messageHandlers.swiftpal.postMessage({fn, args})`), web/electron (`parent/opener.postMessage({source:'swiftpal', fn, args}, '*')`), and always fires a local `CustomEvent('swiftpal:<fn>')`. ES modules can call the bare `SwiftPAL` because top-level `const` in a classic script lives in the global lexical scope.
2. **xAPI event layer** — `js/xapi.js`, the math game's `XAPI` factory unchanged (7 verbs, `{verb, object, result, context}`); only the "current slide" source changed: the router calls `setSlide({id, type, phase, index})`.

```js
function ctx(){ const s = current; return {
  skill_code: CARD.skill_code, lo_code: CARD.lo_code || String(CARD.skill_code || "").split("_S")[0],
  medium: qs.get("medium") || "hi", session_ms: Date.now() - t0,
  question_id: s ? s.id : null, question_index: s ? (s.index ?? null) : null, template: s ? s.type : null,
  question_format: s ? fmt(s.type) : "mcq", phase: s ? s.phase : null,
  context_id: qs.get("context_id") || null, journey_id: qs.get("journey_id") || null }; }
completed(){ send("activity_completed", { type: "activity", id: CARD.skill_code },
  { completed: true, progress: 100, score: answered ? Math.round((firstTry / answered) * 100) / 100 : 0, duration_ms: Date.now() - t0 }); }
```

| Verb | Fired when | object / result |
|---|---|---|
| `activity_launched` | "Let's start" | `{type:'activity', id: skill_code}` |
| `screen_viewed` | tour, try_moves, labels, activity, score, summary | `{type:'screen', id}` |
| `question_started` | try_challenge, predict_<joint>, sort, quiz_q1…q5 | `{type:'question', id}` |
| `question_answered` | every attempt (challenge, prediction, each sort drop, each quiz try) | object `{type:'text', id, text, mediaUrl:null, ui_index, original_index}`; result `{score: 1 only if right on attempt 1, attempt, is_correct}` |
| `activity_completed` | the "What you learned" end screen (not again on a language switch) | `{completed:true, progress:100, score: first-try ratio, duration_ms}` |
| `hint_used`, `audio_replayed` | kept for parity; this game has no hint bulb / replay chip | — |

Template → `question_format`: `DRAG_SORT` → `drag`, everything else → `mcq`. With `?dev=1`, statements are also kept in `window.XAPI.log`. **Set the official `skill_code` / `lo_code`** in `CARD` at the top of `js/xapi.js`.

Verified by listening to `swiftpal:sendEvent` in a full playthrough: launched 1, screen_viewed 9, question_started 11, question_answered 17, activity_completed 1 (score 0.65 = 11/17 first-try).

---

## 17. Size and compression

| Item | Before | After | Method (no visible change) |
|---|---|---|---|
| Three.js core | 670 KB | 556 KB | esbuild bundle exporting only the 88 symbols used by `js/*.js` and the add-ons (gzip 166 → 144 KB) |
| Three.js add-ons | 194 KB | 98 KB | `esbuild --minify` per file (imports unchanged) |
| Indic fonts | 505 KB | 371 KB | `fontTools.subset` to characters used in `strings.json` + ZWJ/ZWNJ/◌/danda, `--layout-features=*` (shaping intact) |
| Pictures | 305 KB | 205 KB | resized to 2× their largest on-screen size, WebP q90 |
| Voice clips | Opus + AAC copies (8.4 MB) | Opus only (3.1 MB for en + hi) | AAC copies removed; iOS ≤ 18.3 falls back to text-to-speech |
| Unused | 7 legacy images, Poppins Light, dead CSS (~8 KB), old audio (140 files) | removed | inventory script cross-referencing code |
| Models | already meshopt + quantized | unchanged | — |

Tree-shaken Three.js (run in a scratch folder with `npm i three@0.160.1 esbuild`):
```bash
# names = every THREE.X in js/*.js + every { … } from 'three' in the add-ons
echo "export { AnimationClip, AnimationMixer, …, WebGLRenderer } from 'three/src/Three.js';" > entry.js
npx esbuild entry.js --bundle --format=esm --minify --tree-shaking=true --legal-comments=none --target=es2020 --outfile=three.custom.min.js
cp three.custom.min.js vendor/three/core/three.module.min.js   # same path: the import map does not change
```
**When you add a new `THREE.Something`, rebuild the bundle** (or the game will throw "not exported"). Font subset: `python3 scripts/subset-fonts.py` after any text change (full fonts kept in `../typesofjoints-design/fonts-full/`).

---

## 18. Accessibility
- Every control is a `<button>`; label pills are buttons (Tab reaches all 4).
- `aria-live` on the banner and feedback; `role=status` on loading text; progress bars with `aria-valuenow`; `role=img` + label on the canvas; dialog roles on tour/score/language.
- Visible focus rings (`:focus-visible` yellow outline); focus moves to Continue after answering.
- 44 px touch targets; hotspots spread apart on small screens.
- `prefers-reduced-motion` turns animations into instant changes.
- Screen-reader labels come from `strings.json` (translated).

---

## 19. Developer tools
- `?dev=1` — red "DEV · Skip ›" button jumps past the current step (tour, stand-up, Try it!, Labels, Activity, Sort it, Quiz → score); Next is never locked; error screen shows the real reason; `window.XAPI.log`.
- `?lang=` / `?lan=` / `?lng=` — `en hi gu te tl od mr`, plus `ta` → `tl`, `or` → `od`.
- `?medium=`, `?context_id=`, `?journey_id=` — read by the event layer.

---

## 20. Deployment (Netlify) and its pitfalls
- **Netlify skips folders named `build`.** `vendor/three/build/three.module.min.js` returned 404 and the game showed "Could not load the simulation". Fix: renamed to `vendor/three/core/` and updated the import map. **Never put runtime files in a `build/` folder.**
- Netlify (Linux) is case-sensitive; macOS is not — a case-mismatch audit found none, but run it for every sim.
- Upload the folder that contains `index.html` itself.
- Keep design files, backups and tooling **outside** the deploy folder (Netlify drag-and-drop has no ignore file). `.vercelignore` exists for Vercel.
- Netlify compresses text (JS/CSS/JSON/HTML) with Brotli automatically; binary assets must be small already.
- Remove `<link rel="preload">` for files the preloader fetches itself (otherwise double download + console warning).

---

## 21. Testing and QA method

All tests are Playwright scripts (Chromium with SwiftShader WebGL, and WebKit = Safari engine) run against `python3 -m http.server`.

| Script | Checks |
|---|---|
| flow | Full lesson at desktop / tablet / phone landscape, every language, both themes: tour, stand-up, Try it! (gating, definition), Labels (buttons, gating, no pill under the card), Activity (models hidden until tap, hotspot size/spacing, gating), Sort it (wrong bounce, drag + tap, 4 pictures loaded), Quiz (hint + retry, resume after Previous, first-try score), score, end buttons, retake, no emoji, no sideways scroll, zero JS errors, no external requests |
| fit audit | 13 landscape sizes (1366×768, 1280×720, 1440×900, 1536×864, 1024×768, 1180×820, 1112×834, 1366×1024, 667×375, 740×360, 844×390, 915×412, 568×320) × languages: every screen, any card that scrolls / is off-screen / overlaps toolbar or dock |
| verify (loading) | Bar shows intermediate progress, monotonic, 100 % before start, smallest-first order, nothing re-downloaded, zero errors / 4xx, normal + throttled (CDP `Network.emulateNetworkConditions`) |
| failure paths | One aborted picture, one 404 clip, one never-answering transfer → still starts, zero errors |
| robustness | Module load failure → Retry; no WebGL → message; no Opus → AAC loaded; idle = 0 draws; keyboard-only Try it! and Tab to all labels; 0 layouts/s in Labels |
| dev | `?dev=1` skip walk, `?lan=` works, no Skip button without dev |
| events | Records every `swiftpal:sendEvent` in a full playthrough |
| fullscreen | Android-like phone enters full screen on Let's start; iPhone (no API) keeps the button and shows the tip; tour clips requested |

**Make tests silent.** Headless WebKit ignores `--mute-audio`; muting `<audio>` is not enough because Web Audio beeps still play. Test pages must stub playback completely:
```js
export const silence = async ctx => ctx.addInitScript(() => {
  HTMLMediaElement.prototype.play = function () { this.muted = true; setTimeout(() => this.dispatchEvent(new Event('ended')), 300); return Promise.resolve(); };
  if (window.speechSynthesis) speechSynthesis.speak = () => {};
  window.AudioContext = undefined; window.webkitAudioContext = undefined;   // the game's beeps are skipped
});
```
Always look at screenshots of key states (light + dark, each language, phone landscape) — several defects (sticky button over text, card under labels, wrong pinch icon) were only visible there.

---

## 22. Assets

| Asset | Source | Where used |
|---|---|---|
| Skeleton + joint models (`skeleton.glb`, `head/hand/leg.glb`) | original project (meshopt + quantized) | 3D scene |
| Joint illustrations (`assets/img/joints/{ball,pivotal,hinge,fixed}.webp`) | "Four-Part Joint and Bone Anatomy Collage" split by connected regions (not quadrants — the elbow's forearm crossed into the hip quarter), alpha cleaned (threshold + 1 px erode to remove matte halo) | Labels card, end table |
| Model pictures (`model-*.webp`) | rendered from the original 3D pieces (skull for fixed) | Sort it cards |
| Controls icons (`assets/img/controls/*`) | design frame SVG at 3× (pinch from the PNG) | Tour "Turn and zoom" |
| Loader | D1 design recreated as SVG grid + logo + bar | Loading screen |
| Logos dark/light | ConveGenius logo; light = white parts recoloured navy | toolbar, start, loader |
| Icons 180/192/512 | favicon on navy | home-screen app |
| Voice | Narakeet (Sheela en, Rashmi hi) | all narration |
| UI sounds | synthesised (Web Audio) | taps, right/wrong, finish |

Replaced/removed: steel door-hinge GLB (`brushed_steel_butt_hinge.glb`; needed normals computed on load, steel env map), code-built door hinge, SVG joint diagrams, Riya swing (SVG then illustration), confetti, legacy UI images.

Prompts written for external creation (kept for reuse): voice-over direction (warm teacher, ~140 wpm, read text exactly, mono 48 kHz, ≤150 ms lead silence), student illustration (flat vector, brand colours, joint dots, layered SVG), official light-background logo request, low-poly hinge GLB spec, illustrated joint plates spec.

---

## 23. Online resources referred to

**Curriculum**
- NCERT Class 6 Science Ch 8 "Body Movements" (English, archived): https://web.archive.org/web/20190710221734/https://ncert.nic.in/textbook/pdf/fesc108.pdf
- NCERT Class 6 विज्ञान Ch 8 "शरीर में गति" (Hindi, archived): https://web.archive.org/web/20211018061508/https://ncert.nic.in/textbook/pdf/fhsc108.pdf
- NCERT Class 11 Biology Ch 17 Locomotion and Movement: https://ncert.nic.in/textbook/pdf/kebo117.pdf
- NCERT new *Curiosity* books (Class 6 `fecu1xx`, Class 7 `gecu1xx`, Class 8 `hecu1xx`) on ncert.nic.in — checked: no joints chapter
- NCERT/CIET translation cell: https://ciet.ncert.gov.in/translation_cell?lang=en
- GSEB Std 6 Science (Gujarati): https://www.selfstudys.com/books/gujarat/state-books/class-6th/x/x-text-book/369746
- Balbharati Std 6 सामान्य विज्ञान (Marathi): https://ebooks.ebalbharati.in/pdfs/601020012.pdf (catalogue https://books.ebalbharati.in/)
- Telangana SCERT Class 6 General Science Part 2: https://scert.telangana.gov.in/pdf/publication/ebooks2019/6%20gen%20science%20part-2%202022-23.pdf
- Tamil Nadu Class 8 Science (textbook copy): https://www.brainkart.in/article/Joints_43568/ and https://www.brainkart.in/article/Skeleton-System_43569/
- Odisha Class 6 *Jigyansa*: https://eduodia.in/class-6 (no joints chapter)

**Design / code references**
- Human Atlas (local `human-atlas-main`; live https://human-atlas-seven.vercel.app; BodyParts3D CC BY 4.0) — layout language and skeleton comparison
- ConveGenius game kit (local `deploy-6a1921b57dbd6cc47271bb70`) — colours, icon buttons, loader GIF
- FLN math game `MT01A01_L05_S02` (local) — SwiftPAL bridge + xAPI layer
- Three.js r160.1: https://cdn.jsdelivr.net/npm/three@0.160.1/ (vendored)
- Google Fonts CSS2 API: https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700 (and Telugu / Tamil / Oriya / Poppins)
- Narakeet text-to-speech API: https://api.narakeet.com/text-to-speech/{format}?voice={voice}
- Pedagogy: Mayer's multimedia learning — redundancy principle (screen key words + spoken explanation); predict–observe–explain.

**Tools**: Playwright (Chromium, WebKit), ffmpeg (opus/aac), Pillow (image processing), fontTools (subsetting), esbuild (tree-shaking/minify), Python http.server.

---

## 24. File map

```
index.html                 boot watchdog, import map, SwiftPAL bridge (verbatim), DOM shells
manifest.webmanifest       installable full-screen landscape app
css/app.css                the whole UI (tokens, components, layout tiers)
js/main.js                 boot: strings → preload → scene → start
js/router.js               flow, screens, quiz engine, labels overlay, score/end
js/scene.js                Three.js scene, split, demos, highlights, camera, render-on-demand
js/studentFlow.js          Try it!
js/sort.js                 Sort it
js/tour.js                 guided tour (+ controls card, narration)
js/langModal.js            language dialog
js/startScreen.js          start screen (+ full screen on first tap)
js/audio.js                say(), TTS fallback, OPUS detection
js/sfx.js                  synthesised UI sounds
js/preload.js              preloader + asset()
js/fullscreen.js           full screen helpers
js/xapi.js                 events (math-game xAPI layer)
js/i18n.js                 strings loader
js/motion.js, js/occlusion.js, js/dom.js, js/state.js
assets/text/strings.json   ALL text, 7 languages
assets/audio/<lang>/       clips (.opus + .txt signature), manifest.json
assets/asset-sizes.json    real sizes for the loading bar
assets/models, assets/img, assets/fonts
vendor/three/core          tree-shaken three.module.min.js   (never name a folder "build")
vendor/three/examples/jsm  minified add-ons
scripts/                   check-strings.mjs, build-audio.mjs, asset-sizes.mjs, subset-fonts.py
docs/                      terminology.md, voiceover-script.md (older), this playbook
../typesofjoints-design/   backups: full fonts, original images, original Three.js (not deployed)
```

---

## 25. Porting checklist for another 3D sim

**Content and learning**
- [ ] Find the NCERT chapter (check old vs new *Curiosity* books) and each state book; build a verified glossary per language with sources.
- [ ] Remove content beyond the class level; align examples and wording to the book.
- [ ] Flow: tour (first launch) → embodied hook with the 3D model → explore (labels) → predict-then-observe activity → apply (sort/match) → quiz (≥ 2 application questions) → score → summary with Retake / Play again.
- [ ] Gate Next until everything is explored; progress stepper.
- [ ] Specific feedback per option / item; hints + second try; first-try scoring.

**Text and languages**
- [ ] All text in `assets/text/strings.json`; languages list with BCP-47 tags; aliases.
- [ ] ESL screen text + fuller narration; full sentences instead of label templates; no emojis.
- [ ] `node scripts/check-strings.mjs` passes; teacher review per language.
- [ ] Script fonts with `unicode-range`; subset with `scripts/subset-fonts.py`.

**UI and layout**
- [ ] Use `css/app.css` tokens and components; theme toggle with `localStorage`; scene colours per theme.
- [ ] Landscape only + rotate screen; height tiers; answered-state trimming; card as obstacle for 3D labels/camera.
- [ ] Run the fit audit at the 13 sizes in the longest language → all ok.

**3D**
- [ ] Render on demand + `wake()`; adaptive DPR; no layout reads per frame.
- [ ] Camera headlight; zoom limits that allow zooming in.
- [ ] Split movable parts by connected pieces, not by cut-offs; real anatomical pivots.
- [ ] Demos on the real model with a watchdog; highlights; trails for motion.

**Audio**
- [ ] `say(key, text)` with Opus/AAC + TTS fallback; voice keys for every spoken line in `clipTexts()`; generate with Narakeet; narration order = screen order.
- [ ] `sfx.js` for UI sounds.

**Loading, robustness, platform**
- [ ] Preloader with size table, smallest first, blobs, never blocking; start only at 100 %.
- [ ] Stall-based boot watchdog, WebGL check, localized error + Retry, blob fallbacks.
- [ ] Full screen on first tap; manifest + iPhone tip.
- [ ] SwiftPAL bridge copied verbatim; `js/xapi.js` with the sim's `skill_code`; call `screen/question/answered/completed` at the right places.

**Size and deploy**
- [ ] Tree-shake Three.js for the symbols used; minify add-ons; WebP at 2× display size; remove unused files.
- [ ] No `build/` folders; case-correct paths; backups outside the deploy folder.
- [ ] Verify on a throttled network; zero JS errors; zero 4xx.

---

## 26. Open items
- Official `skill_code` / `lo_code` in `js/xapi.js`.
- Subject-teacher review of gu / hi / mr / te / tl / od text; Odia terms and Marathi "pivotal" are unverified.
- Voice recordings for gu, te, tl, od, mr (currently device TTS).
- Test on the oldest classroom tablets (real GPU frame rate, AAC fallback).
- Optional: Opus at 24 kbps speech mode would save ~25 % of audio (slight quality trade-off, not applied).
