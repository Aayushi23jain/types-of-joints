# Types of Joints (HTML + CSS + JS) — en · hi · gu · te · tl (Tamil) · od (Odia) · mr

Sublimation project ka UI/CSS/flow + Types-of-Joints ka content, assets aur model.

Run: `npx serve -l 8000` (ya `python3 -m http.server 8000`) -> http://localhost:8000
Internet ki zaroorat nahi: Three.js (`vendor/three`, r160.1) aur Noto Sans Devanagari (`assets/fonts`) ab local hain. `file://` se nahi chalega (ES modules ke liye server chahiye).
Testing: `?dev=1` adds a red **DEV · Skip ›** button (jumps past the current step) and never locks Next.
Language URL se: `?lang=en | hi | gu | te | tl | od | mr` (`ta` = `tl`, `or` = `od` bhi chalta hai); globe button se bhi badal sakte hain.
Saara on-screen text: `assets/text/strings.json` (check: `node scripts/check-strings.mjs`). Textbook terms + sources: `docs/terminology.md`.

## Flow
Start screen (skeleton sits on the chair) -> guided tour (only first time; step 2 = Mouse / Touch controls card, icons from the design frame) -> tour closes: the skeleton **stands up** from the chair (STAND_MS in js/router.js) and the chair fades -> **Try it!** (side card, js/studentFlow.js: tap a move and the 3D skeleton shows it - head turn, elbow bend, arm circle - the student copies it; then "bend your arm in the middle", the upper arm glows red -> NCERT definition of a joint) -> Labels -> Activity (joint models appear only after a glowing point is tapped) -> **Sort it** (js/sort.js, layout of ref.png: progress pill, draggable chips, 2 x 2 joint cards with the game's own joint-model pictures assets/img/joints/model-*.webp and dashed drop zones; tap or drag; the chosen part glows on the skeleton) -> Quiz -> score -> "What you learned". Replay: skeleton sits back down, stands up again, Try it!.
Bottom dock: Previous · 4-step progress (Labels / Activity / Sort it / Quiz) · Next. Zoom is limited (as in Human Skeleton): never closer than the framed view (whole skeleton, or the selected label's joint), so the model is never cut off, and never so far out that it gets tiny (`setMin` / `maxFor` in js/scene.js); a camera headlight keeps the back of the model lit.
- Labels: 4 label pills (buttons, keyboard se bhi) + leader lines; click -> zoom + description + voice. Charon dekhne ke baad hi Next khulta hai (pill par ✓).
- Activity: highlighted (blue) joints; click -> pehle prediction ("how do you think this joint moves?"), phir part isolate hokar move karta hai, caption ke saath. Movement ke dauran Previous/Next chhupe rehte hain. Charon dekhne ke baad Next.
- Quiz: 5 questions (3 recall + 2 application), options shuffle hote hain; galat pehla jawab -> us option ke liye hint + dobara try; score sirf pehli koshish ka. Previous -> Next par quiz wahi se aage chalta hai.

## Files
- css/app.css : the whole UI in one file. Layout ideas from Human Atlas (identity block, glass cards, bottom dock), colours + circular icon buttons from the ConveGenius game kit; brand yellow only for the main action. Dark is the default; light mode overrides the same tokens (`:root[data-theme="light"]`, warm cream `#fffdde` page + 3D background, same as Human Skeleton). Icon buttons: hover = light blue, click = brand yellow for 0.6 s. The theme choice is remembered on the device.
- js/sfx.js : UI sounds made in the browser (tap, correct, wrong, sparkle when all four joints are explored, finish)
- 3D extras in js/scene.js: door-hinge joint model (replaces the '+' piece, driven by the same animation channel), motion trail + range fan during the Activity, soft glow on the selected joint's bones in Labels.
- assets/img/ConveGenius-logo-dark.webp / -light.webp : logo for dark / light backgrounds (light = white parts recoloured navy; replace with the official file when the brand team sends it).
- Loading screen = D1 design: grid room (inline SVG in index.html) + logo + real download progress bar.
- assets/img/joints/*.webp : illustrated joint close-ups (Labels card, end card); assets/img/riya-swing.webp : Try it! illustration; assets/models/hinge.glb : steel door hinge (normals computed on load).
- js/i18n.js : saara text, 4 languages (Gujarati Unicode mein dobara likha; Hindi/Marathi naye)
- js/router.js : screens + flow, js/scene.js : Three.js scene, js/main.js : boot (WebGL check + error screen with Retry)
- vendor/three : Three.js r160.1 (build + the 5 addons used), no CDN
- assets/models/skeleton.glb : meshopt-compressed, textures webp 2048 + 1024
- assets/models/head.glb, hand.glb, leg.glb : made from human_bones_*.fbx (skinned bones + gold joint model + 6.25 s movement clip). Labels/Activity show the joint model beside the skeleton; Activity plays the clip on the real bones (no split mesh, so no cracks)
- assets/audio : all 7 languages, sirf Ogg Opus (female voices: en/hi recorded with Narakeet Sheela / Rashmi, the rest + new lines built by scripts/build-audio.mjs). Jo browser Opus nahi chala sakta (iOS 18.3 ya purana) wahan text-to-speech bolta hai.
- (extracted-assets/ hata diya: size 3 MB ke liye; app mein use nahi hota tha)

## Screen text (ESL)
Students are ESL learners, so the screen shows short text and the voice-over explains in full (redundancy principle). Screen strings are in the `ESL` block at the end of `js/i18n.js` (short sentences, one idea each, same joint names everywhere); the longer narration strings (`introText`, `pivotalD`, `topicSummary` ...) are kept for the voice / text-to-speech. Labels cards show two fact rows ("Moves" / "Where") + the joint diagram instead of a paragraph.

## Known limits
- Fixed joint: skull + neck ko triangle position se split kiya jata hai (koi movement nahi).

## Open items from the QA review (Oct 2026) - need a person
Voice-over to re-record (the on-screen text changed; old clips still play unless noted):
- Full script with exact text per language, file names and delivery specs: **docs/voiceover-script.md** (9 must-have clips per language + 17 optional hints). Drop the files in `assets/audio/<lang>/` and add the manifest keys; no code change needed.
- `quiz-3-v2` - q3 is now the water-bottle / elbow question (the old `quiz-3` clip asks about the gym and is no longer played).
- New, no recording yet (text-to-speech where available): `quiz-4`, `quiz-5`, `quiz-4-explain`, `quiz-5-explain`, `predict`, wrong-answer hints.
- `pivotal` - text now says "around an axis" (clip says "around a single point").
- `sf1` - if it reads the options: option 2 is now "longer bones can always move more" (was "made of rubber").
- `intro` - the clip does not read the new linking sentence (shown on screen only).
- `labels` / `activity` - touch screens show "Tap ..." while the clip says "Click ...".
Subject-teacher review: the gu / hi / mr strings in the `REVIEW` block at the end of js/i18n.js are first drafts. Hindi uses "जोड़" (पिवट / कब्जा / गेंद-और-सॉकेट); NCERT Hindi uses "संधि" (e.g. कंदुक-खल्लिका संधि) - pick one per board and update text + recordings together.
Real devices: test on the oldest classroom tablet (frame rate, AAC fallback, touch targets) - the automated runs used software rendering.

## Activity movement = demo.mp4 (frame-by-frame match)
- Head / hand / leg GLB clips ke poses (head +60° / -90° turn, elbow ~105° bend, hip abduction -> flexion -> extension) video se match karte the, lekin
  GLB mein sirf 3-6 LINEAR keys hain (constant speed, sharp turn). Video mein movement smooth/eased hai aur har extreme par ruk ke hold karta hai.
- `js/motion.js`: same keys ke beech smooth (PCHIP) curve bake karta hai (60 fps). Video se fit: head skull-width error 2.9 px (linear: 6.7 px).
- Leg clip ke aakhri 2 poses video mein ~0.5 s late aate hain (leg back = 5.55 s, rest = 6.8 s) -> `RETIME` in `js/scene.js`.
- Timeline (click -> camera in -> clip -> camera out) `TIMING` in `js/scene.js` mein, demo.mp4 se naapa hua:
  head in 1.85 s / clip 2.2 s / out 8.8 s; hand 1.9 / 2.45 / 9.1; leg 2.25 / 2.55 / 9.5; fixed in 2.85 s, out 4.2 s.
  Clip camera ke pahunchne ke baad shuru hota hai; clip ke baad camera peeche hatta hai jabki part screen par rehta hai, phir full skeleton wapas.
- Purana behaviour chahiye to: `smoothClip(...)` ko `gltf.animations[0]` se badal do aur `TIMING` ke values (cam 900, lead .5) wapas kar do.

## Joint-piece pivots (fix: piece now moves like demo.mp4)
- head.glb / hand.glb / leg.glb clips hold the right ANGLES for the piece, but their translation keys were baked around another origin, and in hand.glb the
  '+' top bar (root mesh `polySurface2013`) is not a child of the animated node. Played as-is: head block flew away from the pipe, leg socket cap flew away
  from the ball, the '+' never moved.
- `js/scene.js` -> `PIECE`, `pivotClip()`, `hookPiece()`: only the rotation (relative to rest) is kept and it is applied about the real pin:
  head = pipe axis (-4.430, y, 4.160) | hinge = axle axis (y 20.892, z 2.706) | ball = ball centre (6.756, 16.525, 4.157).
  Pivots were measured from the GLB vertices (hinge sleeve is 0.34-0.42 from the axle axis, socket cap 0.96-1.19 from the ball centre).
- Timing / smoothing (`motion.js`, `TIMING`, `RETIME`) is unchanged; the piece uses the same clip time as the bones.

## Tour
- Tour order (`js/tour.js` STEPS): Welcome -> Explore (mouse / touch controls) -> Language -> Theme -> Fullscreen -> Replay -> All set. A step whose button is hidden (Fullscreen on iPhone) is skipped in both directions.

## Labels: dots + leader lines while rotating (smooth)
- Fixed joint dot ab skull ki surface par snap hota hai (`snapDots` in js/scene.js: skull ke asli vertices me se nearest outward-facing vertex). Pehle anchor hawa mein tha, isliye rotate karne par skeleton se alag dikhta tha.
- Dot / line ka chhupna ab continuous hai (`sc.occlusion(k)` = 0..1, js/occlusion.js): dot fade + chhota hota hai aur line uske saath body ke edge tak khisakti hai. Purana per-frame raycast (poore skeleton mesh par) hata diya -> rotation halka. Thresholds `VIS` in js/scene.js (hinge/ball: `show`/`hide` = camera ka side-ward component).
- Labels side badalte / stack order badalte waqt jump nahi karte (glide), aur pill sizes cache hote hain (har frame layout read nahi).


## Loading, assets, voice (Oct 2026)
- `js/preload.js`: everything a lesson needs (models, pictures, fonts, the language's voice clips) downloads behind the loading bar before "Let's start" appears; smallest first, 5 at a time, byte-accurate and never going backwards; failed / stalled files count as done (15 s stall timeout) and fall back to their normal path. After a language switch its clips warm in the background.
- After adding or changing any asset: `node scripts/asset-sizes.mjs` (writes `assets/asset-sizes.json`, the real sizes the bar uses).
- Voice-over: `node scripts/build-audio.mjs [langs] [--dry]` builds every MISSING clip (or one whose text changed) with a female voice: Edge neural voices via `edge-tts` (en Neerja, hi Swara, gu Dhwani, mr Aarohi, te Shruti, tl Pallavi) and, for Odia, the AI4Bharat Indic-TTS female speaker run locally (`ODIA_TTS_DIR`, see the script). Needs ffmpeg. Existing clips whose `.txt` still matches the text are kept. Then run `node scripts/asset-sizes.mjs`.
- Portrait is not supported: a "rotate your device" screen shows. Laptop, tablet and phone landscape layouts fit without scrolling.
- `.vercelignore` keeps `` (design sources), `scripts/`, `docs/` and the clip `.txt` files out of deployment.

## Events (same as the FLN math games)
- `index.html` contains the **SwiftPAL Platform Bridge** copied unchanged from MT01A01_L05_S02 (Android `window.Android.sendEvent`, iOS `webkit.messageHandlers.swiftpal`, web/electron `postMessage`, plus a local `swiftpal:sendEvent` CustomEvent).
- `js/xapi.js` is the math games' xAPI event layer (same 7 verbs and statement shape; context reads `medium`, `context_id`, `journey_id` from the URL). Lesson codes: `CARD` at the top of `js/xapi.js` (**set the official skill_code / lo_code**).
- Fired: `activity_launched` (Let's start), `screen_viewed` (tour, Try it!, Labels, Activity, score, summary), `question_started` / `question_answered` (Try it! challenge, predictions, every Sort it drop, every quiz attempt), `activity_completed` (the "What you learned" end screen; score = share of answers right on the first attempt). With `?dev=1` the statements are also kept in `window.XAPI.log`.
