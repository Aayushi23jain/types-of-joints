// Three.js scene: skeleton (split into movable parts), grid floor, joint pieces, camera tweening, labels/markers projection.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { smoothClip } from './motion.js';
import { asset } from './preload.js';
import { nearestOutside, lateralOcc, facingOcc } from './occlusion.js';

// pivotal / hinge / ball are driven by the GLB models made from the FBX files (head.glb, hand.glb, leg.glb): each holds the real bone(s)
// AND the joint model that stands beside the skeleton, plus one 6.25 s movement clip.  rest = where the joint model stands next to the
// skeleton (Labels + Activity), move = where it stands next to the opened body part while it moves.  fixed has no model and nothing moves.
export const JOINTS = {
  pivotal: { anchor: [0, 22.5, -0.45], dot: [-0.75, 22.45, -0.45], zoom: 9, parts: [], fbx: 'head', rest: [-4.4, 22.7, 0], move: [-6.2, 23.0, 0], scale: 1.05, az: 32 },
  fixed:   { anchor: [1.25, 25.1, 0.2], dot: [1.1, 25.1, 0.2], zoom: 7, parts: ['skull', 'neck'], az: 80 },                        // side of the cranium (sutures), well above the jaw joint (which DOES move); skull + neck, nothing moves
  hinge:   { anchor: [-3.2, 16.6, -0.8], dot: [-3.3, 16.6, -0.8], zoom: 10, parts: [], fbx: 'hand', rest: [-9.4, 18.4, 0], move: [-10, 16.6, 0], scale: 1.05, az: -38 },   // label + activity: the same (left) elbow
  ball:    { anchor: [-1.9, 13.3, 0.4], dot: [-2.0, 13.2, 0.4], zoom: 12, parts: [], fbx: 'leg', rest: [-7.6, 11.4, 0], move: [4.7, 10.7, 0], scale: .85, az: -20 }   // left hip: the leg the Activity swings
};
export const ORDER = ['pivotal', 'fixed', 'hinge', 'ball'];
// One camera angle for every screen (intro, labels, activity, quiz...): a little ABOVE the model (9 degrees of elevation), looking down at it.
// All framing goes through elevated() / fitDist() so the same angle is kept and nothing gets cut off by the screen edge.
const EL = 9 * Math.PI / 180, TAN = Math.tan(16 * Math.PI / 180);       // camera fov = 32 deg
const HOME = { d: 56, tgt: new THREE.Vector3(0, 13.2, 0) };              // d = distance, whole skeleton (26 tall) fits with margin
const elevated = (c, d) => new THREE.Vector3(c.x, c.y + d * Math.sin(EL), c.z + d * Math.cos(EL));
const homePos = () => elevated(HOME.tgt, HOME.d);
// Distance at which a box of half-size (w, h) around the target is fully visible (with margin), for the current aspect ratio.
const fitDist = (w, h) => Math.max(h / TAN, w / (TAN * Math.min(1.6, camera.aspect))) * 1.15 + 2.5;

const $ = s => document.querySelector(s);
export const S = { parts: {}, pivots: {}, fx: {}, anim: null, tween: null, ready: null, sit: 1, sitTw: null, pose: null, chair: null };   // starts seated on the chair
let renderer, scene, camera, controls, grid, clock = new THREE.Clock(), mats = {};
const DPR = { max: 2, cur: 2, n: 0, sum: 0, last: 0 };               // adaptive resolution: drop the pixel ratio step by step while frames stay slow
// Render on demand: the scene is only drawn while something can change (camera tween / user input / clip / sit-up / chair fade / pulsing
// Activity discs / overlays gliding). Idle screens (start screen, student flow, reading a card) cost no GPU time -> less heat + battery on tablets.
let awakeUntil = 0;
export const wake = (ms = 1200) => { awakeUntil = Math.max(awakeUntil, performance.now() + ms); };

// Loading progress for the start screen: each model file reports its bytes; expected sizes stand in until the real totals are known.
const LOAD = { skeleton: [0, 698236], head: [0, 175220], hand: [0, 81400], leg: [0, 204312] };
let onLoadProgress = null;
const progress = name => e => {
  if (e && e.lengthComputable) LOAD[name] = [e.loaded, e.total]; else if (e) LOAD[name][0] = e.loaded;
  const v = Object.values(LOAD), done = v.reduce((a, [l]) => a + l, 0), all = v.reduce((a, [, t]) => a + t, 0);
  onLoadProgress && onLoadProgress(Math.min(1, done / all));
};
export async function init(onProgress) {
  onLoadProgress = onProgress;
  const canvas = $('#c');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  DPR.max = Math.min(devicePixelRatio, matchMedia('(pointer: coarse)').matches ? 1.5 : 2); DPR.cur = DPR.max; renderer.setPixelRatio(DPR.cur);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, .5, 400);
  controls = new OrbitControls(camera, canvas);
  controls.target.copy(HOME.tgt); controls.enableDamping = true; controls.enablePan = false;
  controls.addEventListener('change', () => wake()); controls.addEventListener('start', () => wake(60000)); controls.addEventListener('end', () => wake());
  ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach(ev => addEventListener(ev, () => wake(), { passive: true }));
  controls.minDistance = HOME.d; controls.maxDistance = HOME.d * 1.6; controls.minPolarAngle = Math.PI * .3; controls.maxPolarAngle = Math.PI * .5;   // no straight-from-above view (labels would pile up)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223355, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(10, 30, 30); scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, .8); rim.position.set(-20, 10, -20); scene.add(rim);
  // headlight: follows the camera, so the model is lit from whatever side the student turns it to (the back used to be dark)
  const head = new THREE.DirectionalLight(0xffffff, 1.25); head.position.set(0, 4, 10); head.target.position.set(0, 0, -10);
  camera.add(head, head.target); scene.add(camera);
  grid = new THREE.GridHelper(300, 100, 0x2f4fa8, 0x2f4fa8);
  grid.material.transparent = true; grid.material.opacity = .42;
  scene.fog = new THREE.Fog(0x030c29, 80, 150);              // grid fades out towards the horizon
  scene.background = new THREE.Color(0x030c29);
  scene.add(grid); setTheme(S.dark !== false);
  buildChair(); buildGlows();
  addEventListener('resize', resize); resize(); setMin(HOME.d, true); camera.position.copy(homePos()); watchOverlays();
  renderer.setAnimationLoop(tick);
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);            // the .glb files are meshopt-compressed (small download)
  const sk = await loader.loadAsync(asset('assets/models/skeleton.glb'), progress('skeleton')); split(sk.scene.children[0]);
  await loadFx(loader);

}

// Theme colours match css/app.css: dark = ConveGenius navy + blue grid, light = pale blue-white + soft blue-grey grid.
const ACCENT = () => S.dark === false ? 0x0b8fa6 : 0x0dd3ef;     // = --accent in css/app.css
export function setTheme(dark) {
  S.dark = dark;
  if (!grid) return;
  for (const k in S.fx) { const tr = S.fx[k].trail; if (tr) { tr.tube.material.color.setHex(ACCENT()); tr.fan.material.color.setHex(ACCENT()); } }
  if (hiMat && !hiRed) hiMat.emissive.setHex(ACCENT());
  for (const k in S.glows) S.glows[k].material.color.setHex(ACCENT());                         // called before init(): init() applies it once the scene exists
  wake();
  const c = new THREE.Color(dark ? 0x2f4fa8 : 0xd4cfa8), col = grid.geometry.attributes.color;
  for (let i = 0; i < col.count; i++) col.setXYZ(i, c.r, c.g, c.b);                  // GridHelper draws with vertex colours, so change those
  col.needsUpdate = true; grid.material.color.set(0xffffff); grid.material.opacity = dark ? .42 : .55;
  const bgColor = dark ? 0x030c29 : 0xfffdde;                    // = --bg in css/app.css (light: warm cream, as in Human Skeleton)
  scene.fog.color.setHex(bgColor);
  scene.background.setHex(bgColor);
  applyTone();
}
function applyTone() {                    // light background made the bone texture look dull: add a soft white glow to the material
  const light = S.dark === false;
  [mats.full].forEach(m => { if (m) { 
    // In dark mode, make bones white; in light mode, make bones off-white
    if (light) {
      m.color.setHex(0xe2ddd3); // Warm off-white bones stay distinct from the pale background
      m.emissive.setHex(0x000000);
      m.emissiveIntensity = 0;
    } else {
      m.color.setHex(0xffffff); // White color for bones in dark mode
      m.emissive.setHex(0x000000);
      m.emissiveIntensity = 0;
    }
  }});
  // joint-model GLBs (head / hand / leg): warm tan bone with a fine grain + pale blue-grey joint (cartilage), as in the reference screenshot
  if (hiMat && mats.full) hiMat.color.copy(mats.full.color);
  if (S.fxBone) S.fxBone.color.setHex(light ? 0xb9a79a : 0xccb9ab);
  if (S.fxJoint) S.fxJoint.color.setHex(light ? 0xb9a79a : 0xccb9ab);      // piece body: same light brown/tan with grain as in demo.mp4
  if (S.fxWhite) S.fxWhite.color.setHex(light ? 0xe2e8ef : 0xf1f5fa);      // white part: head pipe, hinge stripe, ball
}

// --- split the single skeleton mesh into movable parts by triangle centroid -------------------------------
// Measured from skeleton.glb: hip joint y~13, knee y~7, feet on y=0, front = +z.
const HIP = 13, KNEE = 7, SIT_DROP = HIP - KNEE;             // seated: thigh horizontal, shins vertical -> pelvis drops 6 units
const T = [0, HIP, .45];                                     // torso pivot (hip level)
// The .glb is stored quantized (int16 positions + node scale, int8 normals, uint16 uv/indices) to stay small; decode to plain float32 here.
function dequantize(mesh) {
  const g = mesh.geometry; mesh.updateMatrix();
  for (const name of ['position', 'normal', 'uv']) {
    const a = g.attributes[name], n = a.count, sz = a.itemSize, out = new Float32Array(n * sz), get = ['getX', 'getY', 'getZ'];
    for (let i = 0; i < n; i++) for (let k = 0; k < sz; k++) out[i * sz + k] = a[get[k]](i);   // getX/Y/Z undo the normalisation
    g.setAttribute(name, new THREE.BufferAttribute(out, sz));
  }
  g.applyMatrix4(mesh.matrix);                                  // node scale / translation -> real model units (also fixes normals)
  mesh.position.set(0, 0, 0); mesh.scale.set(1, 1, 1); mesh.updateMatrix();
}
// Connected pieces of the skeleton mesh -> arm part by the piece's centre: humerus = upperArm, radius / ulna / wrist / hand = forearm.
// Shoulder blade and collar bone stay on the torso (behind the arm / near the middle).
function armPieces(P, idx) {
  const n = P.count, parent = new Int32Array(n).map((_, i) => i), key = new Map();
  const find = i => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  const join = (a, b) => { a = find(a); b = find(b); if (a !== b) parent[a] = b; };
  for (let i = 0; i < n; i++) { const k = Math.round(P.getX(i) * 500) + ',' + Math.round(P.getY(i) * 500) + ',' + Math.round(P.getZ(i) * 500); const o = key.get(k); if (o === undefined) key.set(k, i); else join(i, o); }   // weld seams
  for (let i = 0; i < idx.length; i += 3) { join(idx[i], idx[i + 1]); join(idx[i], idx[i + 2]); }
  const acc = new Map();
  for (let i = 0; i < n; i++) { const r = find(i); let a = acc.get(r); if (!a) acc.set(r, a = { x: 0, y: 0, z: 0, c: 0, x0: 1e9, x1: -1e9 }); const x = P.getX(i); a.x += x; a.y += P.getY(i); a.z += P.getZ(i); a.c++; a.x0 = Math.min(a.x0, x); a.x1 = Math.max(a.x1, x); }
  const part = new Map();
  for (const [r, a] of acc) {
    const x = a.x / a.c, y = a.y / a.c, z = a.z / a.c, side = x > 0 ? '' : 'L', ax = Math.abs(x);
    const spansMiddle = a.x0 < -1 && a.x1 > 1;                                  // ribs / pelvis / spine cross the middle
    if (spansMiddle || z < -1.25) continue;                                      // shoulder blade sits behind the ribs
    if (ax > 2.45 && y > 16.4 && y < 21.6) part.set(r, 'upperArm' + side);      // humerus
    else if (ax > 2.2 && y > 6.5 && y <= 16.4 && Math.abs(z) < 1.8) part.set(r, 'forearm' + side);   // radius, ulna, wrist and hand bones
  }
  return i => part.get(find(i)) || null;
}
function split(mesh) {
  dequantize(mesh);
  const g = mesh.geometry, P = g.attributes.position, idx = g.index.array;
  const buckets = { neck: [], skull: [], upperArm: [], forearm: [], upperArmL: [], forearmL: [], body: [], leg: [], legL: [], shin: [], shinL: [] };
  // Arm bones are assigned WHOLE (connected pieces of mesh = one bone each): a per-triangle cut left finger tips on the thigh and
  // slivers of the humerus on the torso, which stayed behind when the arm moved. Pieces are found by welding vertex positions.
  const comp = armPieces(P, idx);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i], b = idx[i + 1], c = idx[i + 2];
    const x = (P.getX(a) + P.getX(b) + P.getX(c)) / 3, y = (P.getY(a) + P.getY(b) + P.getY(c)) / 3, z = (P.getZ(a) + P.getZ(b) + P.getZ(c)) / 3;
    const arm = comp(a);
    let k = 'body';
    if (arm) k = arm;
    else if (y >= 22.6) k = 'skull';
    else if (y >= 20.9 && Math.abs(x) < .75 && z < .35) k = 'neck';      // last neck vertebrae: stay still while the skull turns
    else if (y < HIP) k = y < KNEE ? (x > 0 ? 'shin' : 'shinL') : (x > 0 ? 'leg' : 'legL');
    buckets[k].push(a, b, c);
  }
  snapDots(g, buckets);
  mats.full = mesh.material; applyTone();
  const root = new THREE.Group(); scene.add(root); S.root = root;
  const grp = (parent, world, parentOrigin) => { const n = new THREE.Group(); n.position.set(world[0] - parentOrigin[0], world[1] - parentOrigin[1], world[2] - parentOrigin[2]); parent.add(n); return n; };
  const part = (k, parent, world, parentOrigin) => {          // pivot group at `world`; mesh keeps its original (world) vertex positions
    const geo = new THREE.BufferGeometry();
    for (const n in g.attributes) geo.setAttribute(n, g.attributes[n]);
    geo.setIndex(buckets[k]); geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, mats.full); m.frustumCulled = false; m.position.set(-world[0], -world[1], -world[2]);
    const piv = grp(parent, world, parentOrigin); piv.add(m); S.parts[k] = m; S.pivots[k] = piv; return piv;
  };
  const NECK = [0, 22.5, -.45], HIPR = [1.5, HIP, .4], HIPL = [-1.5, HIP, .4], KR = [1.6, KNEE, .15], KL = [-1.6, KNEE, .15];
  // Elbow hinge = centre of the rounded lower end of the humerus (circle fitted to it in a side view of skeleton.glb: y 17.13, z -.96),
  // same as Human Skeleton. The forearm must turn about THIS point; the old pivot (y 16.6, z -.8) sat half a unit too low, so on a full
  // bend the radius / ulna slid off the humerus and the arm looked broken.
  const ELBOWR = [2.82, 17.13, -.96], ELBOWL = [-2.85, 17.13, -.96];
  const torso = grp(root, T, [0, 0, 0]);                      // leans forward when seated
  const head = grp(torso, NECK, T);                           // head drops forward when seated
  // Shoulder = centre of the ball of the humerus (sphere fitted to the top 1.3 units of each humerus in skeleton.glb, radius .47).
  // The arm circles about THIS point; the old pivot (x 2.8, y 20.8) sat ~.24 off it, so a full circle swung the ball out of the
  // socket and the humerus came away from the shoulder.
  const SHR = [2.58, 20.94, -.38], SHL = [-2.61, 20.94, -.38];
  part('body', torso, T, T); part('neck', torso, T, T);
  const armR = part('upperArm', torso, SHR, T), armL = part('upperArmL', torso, SHL, T);
  part('forearm', armR, ELBOWR, SHR); part('forearmL', armL, ELBOWL, SHL); part('skull', head, NECK, NECK);
  const hipR = grp(root, HIPR, [0, 0, 0]), hipL = grp(root, HIPL, [0, 0, 0]);        // thighs swing forward when seated
  const legR = part('leg', hipR, HIPR, HIPR), legL = part('legL', hipL, HIPL, HIPL);
  const kneeR = grp(legR, KR, HIPR), kneeL = grp(legL, KL, HIPL);                     // shins hang down again
  part('shin', kneeR, KR, KR); part('shinL', kneeL, KL, KL);
  S.pose = { torso, head, hipR, hipL, kneeR, kneeL };
}

// --- chair (procedural, wooden) + sit / stand pose --------------------------------------------------------
function buildChair() {
  const wood = new THREE.MeshStandardMaterial({ color: 0x9a6a3a, roughness: .85, transparent: true });
  const ch = new THREE.Group(), add = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wood); m.position.set(x, y, z); ch.add(m); };
  const seatY = 5.85;
  add(7.4, .5, 7.6, 0, seatY, 1.6);                                            // seat (top at ~6.1)
  [[-3.3, -2.3], [3.3, -2.3], [-3.3, 4.9], [3.3, 4.9]].forEach(([x, z]) => add(.5, seatY - .25, .5, x, (seatY - .25) / 2, z));   // legs
  add(.5, 9.6, .5, -3.3, seatY + 4.6, -2.3); add(.5, 9.6, .5, 3.3, seatY + 4.6, -2.3);                                            // back posts
  add(7.1, 1.3, .45, 0, 14.6, -2.3); add(7.1, .8, .4, 0, 11.4, -2.3); add(7.1, .8, .4, 0, 8.6, -2.3);                              // back rails
  scene.add(ch); S.chair = { g: ch, mat: wood, op: 1, target: 1 };
}
const CHAIR_BACK = 8.5;                                       // seat front (z 5.4) ends up at z -3.1, behind the standing skeleton (z >= -1.5)
export const sitTo = (v, ms = 1600) => { wake(ms + 300); S.sitTw = { from: S.sit, to: v, s: performance.now(), ms }; };
export const standUp = () => { if (S.sit > 0 && !(S.sitTw && S.sitTw.to === 0)) sitTo(0, 1800); };
export const hideChair = () => { S.chair.target = 0; wake(1500); };
export const sitDown = (ms = 1200) => { S.chair.target = 1; if (S.sit < 1 && !(S.sitTw && S.sitTw.to === 1)) sitTo(1, ms); wake(ms + 1500); };   // Replay: back onto the chair
function applyPose() {
  const tw = S.sitTw;
  if (tw) { let k = Math.min(1, (performance.now() - tw.s) / tw.ms); k = k * k * (3 - 2 * k); S.sit = tw.from + (tw.to - tw.from) * k; if (k >= 1) S.sitTw = null; }
  const c = S.chair; if (c) { c.g.position.z = -CHAIR_BACK * (1 - S.sit);   // standing: chair sits well behind the skeleton (not through its legs)
     c.op += (c.target - c.op) * .12; if (Math.abs(c.target - c.op) < .01) c.op = c.target; c.mat.opacity = c.op; c.g.visible = c.op > .01; }
  if (!S.pose) return;
  const s = S.sit, p = S.pose;
  S.root.position.y = -SIT_DROP * s; p.torso.rotation.x = .35 * s; p.head.rotation.x = .5 * s;
  p.hipR.rotation.x = p.hipL.rotation.x = -Math.PI / 2 * s; p.kneeR.rotation.x = p.kneeL.rotation.x = Math.PI / 2 * s;
  playDemo(p);
}
// --- Try it!: "copy me" moves on the real skeleton -----------------------------------------------------------------------------
//   head   : turn left and right (pivotal)        elbow : bend and straighten twice (hinge)        circle : arm circles at the shoulder (ball and socket)
const DEMO = { head: 3.2, elbow: 2.4, circle: 3.6 };
export const DEMO_MS = Object.fromEntries(Object.entries(DEMO).map(([k, v]) => [k, v * 1000]));
export const demo = (name, done, hold) => { S.demo = name && DEMO[name] ? { name, s: performance.now(), dur: DEMO[name] * 1000, done, hold } : null; resetDemo(); wake(); };   // hold = freeze at that phase (0..1), for checking poses
function resetDemo() { if (!S.pose) return; S.pose.head.rotation.y = 0; S.pivots.forearmL.rotation.x = 0; S.pivots.upperArmL.rotation.set(0, 0, 0); }
function playDemo(p) {
  const d = S.demo; if (!d) return;
  const k = d.hold != null ? d.hold : Math.min(1, (performance.now() - d.s) / d.dur), env = Math.sin(Math.PI * Math.min(1, k * 1.15));   // ease in and out
  if (d.name === 'head') p.head.rotation.y = .75 * Math.sin(k * Math.PI * 4) * env;
  if (d.name === 'elbow') S.pivots.forearmL.rotation.x = -1.9 * Math.sin(k * Math.PI);                         // one bend and back (as in Human Skeleton): forearm swings forward and up, ~110 deg
  if (d.name === 'circle') {                       // two forward circles about the ball of the humerus, arm held out from the side the whole way
    const e = k * k * (3 - 2 * k), out = Math.min(1, Math.sin(Math.PI * k) * 4);   // tilt out eases in / out, so it also clears the head overhead
    S.pivots.upperArmL.rotation.set(-Math.PI * 4 * e, 0, -.42 * out);
  }
  if (k >= 1 && d.hold == null) { S.demo = null; resetDemo(); d.done && d.done(); }
}
// camera for Try it!: upper body from the front-left, so head turn, elbow bend and arm circle all read clearly
export function frameUpper(ms = 1200) {
  const c = new THREE.Vector3(-1.2, 17.2, 0), az = -38 * Math.PI / 180, d = fitDist(7.5, 8.5);
  setMin(d); flyTo(new THREE.Vector3(c.x + d * Math.cos(EL) * Math.sin(az), c.y + d * Math.sin(EL), c.z + d * Math.cos(EL) * Math.cos(az)), c, ms);
}

// --- joint models from the FBX -> GLB files ---------------------------------------------------------------------
// Every GLB is cloned twice: `side` (only the gold joint model, stands beside the skeleton in Labels / Activity) and `body` (only the real
// bones: skull / left arm / both legs + pelvis, skinned, so they bend smoothly - no torn mesh - shown while the movement plays).
// Both clones are driven by the same clip time, so the joint model and the bones always move together.
// The joint pieces in head/hand/leg.glb all share ONE material ('joint'), so the two colours of demo.mp4 are picked by mesh name:
//   head.glb polySurface156 = pipe inside the block | hand.glb polySurface2012 = thin stripe on the bar | leg.glb polySurface219 = ball.
// Everything else in the piece (block, bars, socket cap, stick) is the light-brown grain colour.
const WHITE_PARTS = new Set(['polySurface156', 'polySurface2012', 'polySurface219']);
// Activity timeline, measured frame by frame on demo.mp4 (seconds after the click unless noted):
//   cam   = camera fly-in (ms)            lead = the clip starts (camera has arrived + a short beat)
//   total = the camera starts to leave (ms) out  = camera fly-out (ms); the part stays on screen while the camera pulls back
// pivotal (head): in 1.85 s, clip 2.2 -> 8.45 s, out at 8.8 s for 1.7 s.   fixed: nothing moves, in 2.85 s, out at 4.2 s for 1.95 s.
// hinge (elbow):  in 1.9 s,  clip 2.45 -> 8.7 s, out at 9.1 s for 1.65 s.  ball (hip): in 2.25 s, clip 2.55 -> 9.35 s, out at 9.5 s for 1.55 s.
export const TIMING = {
  pivotal: { cam: 1850, lead: 2.2,  total: 8800, out: 1700 },
  fixed:   { cam: 2850, lead: 0,    total: 4200, out: 1950 },
  hinge:   { cam: 1900, lead: 2.45, total: 9100, out: 1650 },
  ball:    { cam: 2250, lead: 2.55, total: 9500, out: 1550 }
};
// The GLB clips are smoothed (js/motion.js) to the eased curves of the video.  Only the hip clip is also re-timed: in the video its last
// two poses (leg swung back, then back to rest) come ~0.5 s later than the keys stored in leg.glb.  [old key time, new key time] pairs:
const RETIME = { ball: [[0.0417, 0.0417], [1.25, 1.25], [2.0833, 2.05], [3.3333, 3.5], [5.0, 5.55], [6.25, 6.8]] };
function loadFx(loader) {
  const grain = makeGrain();
  S.fxBone = new THREE.MeshStandardMaterial({ color: 0xccb9ab, roughness: .85, map: grain, bumpMap: grain, bumpScale: .6 });
  S.fxJoint = new THREE.MeshStandardMaterial({ color: 0xccb9ab, roughness: .85, map: grain, bumpMap: grain, bumpScale: .6 });   // tan block / socket / pipe body (grain)
  S.fxWhite = new THREE.MeshStandardMaterial({ color: 0xf1f5fa, roughness: .45 });                                               // smooth white part
  applyTone();
  return Promise.all(ORDER.filter(k => JOINTS[k].fbx).map(k => { const f = { head: 'head', hand: 'hand', leg: 'leg' }[JOINTS[k].fbx];
    return loader.loadAsync(asset('assets/models/' + f + '.glb'), progress(f)).then(g => buildFx(k, g)); }));
}
// The head / hand / leg GLBs have no UVs, so: a small tileable speckle texture (mean ~0.94 grey) + box-projected UVs (ensureUV).
function makeGrain() {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N;
  const ctx = c.getContext('2d'), im = ctx.createImageData(N, N);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;   // seeded: same grain on every load
  for (let i = 0; i < N * N; i++) {
    const v = 240 + (rnd() - .5) * 24 - (rnd() < .035 ? 28 : 0);
    im.data[4 * i] = im.data[4 * i + 1] = im.data[4 * i + 2] = v; im.data[4 * i + 3] = 255;
  }
  ctx.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function ensureUV(root) {
  root.updateMatrixWorld(true);
  const sz = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()), k = 10 / Math.max(sz.x, sz.y, sz.z, 1e-6);
  const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
  root.traverse(o => {
    if (!o.isMesh || o.geometry.attributes.uv) return;
    const g = o.geometry, P = g.attributes.position, Nr = g.attributes.normal, uv = new Float32Array(P.count * 2);
    nm.getNormalMatrix(o.matrixWorld);
    for (let i = 0; i < P.count; i++) {
      v.set(P.getX(i), P.getY(i), P.getZ(i)).applyMatrix4(o.matrixWorld);
      n.set(Nr.getX(i), Nr.getY(i), Nr.getZ(i)).applyMatrix3(nm);
      const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
      const [u, w] = ax >= ay && ax >= az ? [v.y, v.z] : ay >= az ? [v.x, v.z] : [v.x, v.y];   // project along the dominant normal axis
      uv[2 * i] = u * k; uv[2 * i + 1] = w * k;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  });
}
// --- joint-piece pivots ---------------------------------------------------------------------------------------------------------
// The clips in head/hand/leg.glb carry the right ANGLES for the joint piece, but their translation keys were baked around a different origin
// (Maya pivot offset) and, in hand.glb, the '+' mesh is not even a child of the animated node.  Played as-is the head block flew away from its
// pipe, the socket cap flew away from the ball and the '+' never moved.  demo.mp4 turns every moving piece IN PLACE about its pin, so:
//   src   = node whose rotation keys are used (only the ROTATION relative to its rest pose is kept, the translation keys are dropped)
//   mesh  = the piece is a Mesh node (hand: the top bar is a root-level mesh, the animated node with the same name is an empty transform)
//   pivot = the point the piece turns about, in model units (measured from the GLB vertices):
//     head  pipe axis of the pivot joint  |  hand  axis of the hinge pin (through the horizontal bar)  |  leg  centre of the ball
const PIECE = {
  pivotal: { src: 'polySurface155', mesh: false, pivot: [-4.4304, 27.5844, 4.1598] },
  hinge:   { src: 'polySurface2013', mesh: true, pivot: [-10.3742, 20.8918, 2.7064], peak: 90 },   // peak = bend (deg) of the '+' top bar at the clip's extreme (the GLB key only has 38.5 deg; demo.mp4 bends 90)
  ball:    { src: 'polySurface218', mesh: false, pivot: [6.7563, 16.5245, 4.1565] }
};
// three.js renames duplicate node names (hand.glb has TWO nodes called polySurface2013: the empty animated transform and the real mesh -> 'polySurface2013_1'),
// so match by base name + type (mesh / not mesh), never by the exact name.
const baseRe = P => new RegExp('^' + P.src + '(_\\d+)?$');
const findPiece = (root, P) => { let n = null; const re = baseRe(P); root.traverse(o => { if (!n && re.test(o.name) && !!o.isMesh === P.mesh) n = o; }); return n; };
function pivotClip(gltf, k) {                     // -> clip whose piece track is 'pv_<k>.quaternion' (rotation relative to rest, about the pivot)
  const base = gltf.animations[0], P = PIECE[k]; if (!P) return base;
  const re = new RegExp('^' + P.src + '(_\\d+)?\\.quaternion$'), tr = base.tracks.find(t => re.test(t.name)), node = findPiece(gltf.scene, P);
  if (!tr || !node) { console.warn('joint piece not hooked:', k, !!tr, !!node); return base; }
  const restInv = node.quaternion.clone().invert(), vals = [], prev = new THREE.Quaternion();
  for (let i = 0; i < tr.times.length; i++) {
    const q = new THREE.Quaternion().fromArray(tr.values, 4 * i).multiply(restInv);
    if (i && q.dot(prev) < 0) { q.x = -q.x; q.y = -q.y; q.z = -q.z; q.w = -q.w; }      // keep neighbouring keys in one hemisphere (short way round)
    prev.copy(q); vals.push(q.x, q.y, q.z, q.w);
  }
  if (P.peak) {                                   // stretch every key's angle so the biggest one equals P.peak degrees (axis unchanged)
    let mx = 0; for (let i = 0; i < vals.length; i += 4) mx = Math.max(mx, 2 * Math.acos(Math.min(1, Math.abs(vals[i + 3]))));
    const f = mx > 1e-6 ? P.peak * Math.PI / 180 / mx : 1;
    for (let i = 0; i < vals.length; i += 4) {
      const w = vals[i + 3] < 0 ? -1 : 1, x = vals[i] * w, y = vals[i + 1] * w, z = vals[i + 2] * w, sn = Math.hypot(x, y, z);
      if (sn < 1e-9) { vals[i] = vals[i + 1] = vals[i + 2] = 0; vals[i + 3] = 1; continue; }
      const a = 2 * Math.atan2(sn, w * vals[i + 3]) * f, k = Math.sin(a / 2) / sn;
      vals[i] = x * k; vals[i + 1] = y * k; vals[i + 2] = z * k; vals[i + 3] = Math.cos(a / 2);
    }
  }
  const keep = base.tracks.filter(t => !new RegExp('^' + P.src + '(_\\d+)?\\.').test(t.name));
  return new THREE.AnimationClip(base.name, base.duration, keep.concat(new THREE.QuaternionKeyframeTrack('pv_' + k + '.quaternion', Array.from(tr.times), vals)));
}
function hookPiece(r, k) {                        // put the piece under a pivot group at its pin (world pose unchanged), the clip turns the group
  const P = PIECE[k], node = P && findPiece(r, P); if (!node) { console.warn('joint piece mesh not found:', k); return; }
  r.updateMatrixWorld(true);
  const pv = new THREE.Group(); pv.name = 'pv_' + k; pv.position.fromArray(P.pivot); r.add(pv); pv.updateMatrixWorld(true);
  pv.attach(node);
}
function buildFx(k, gltf) {
  ensureUV(gltf.scene);
  const clip = smoothClip(THREE, pivotClip(gltf, k), RETIME[k]);      // same angles as the GLB keys, about the right pin, eased like demo.mp4
  const make = jointOnly => {
    const r = SkeletonUtils.clone(gltf.scene); hookPiece(r, k);
    r.traverse(o => { if (!o.isMesh) return; const isJoint = o.material.name === 'joint'; o.material = !isJoint ? S.fxBone : WHITE_PARTS.has(o.name) ? S.fxWhite : S.fxJoint; o.frustumCulled = false; o.visible = isJoint === jointOnly; });
    const mix = new THREE.AnimationMixer(r); mix.clipAction(clip).play(); mix.setTime(0); r.updateMatrixWorld(true);
    return { r, mix };
  };
  const side = make(true), body = make(false), box = new THREE.Box3();
  side.r.traverse(o => { if (o.isMesh && o.visible) box.expandByObject(o); });
  const holder = new THREE.Group(); holder.add(side.r); holder.visible = false; scene.add(holder);
  body.r.visible = false; scene.add(body.r);
  S.fx[k] = { holder, body: body.r, sideMix: side.mix, bodyMix: body.mix, center: box.getCenter(new THREE.Vector3()), dur: clip.duration };
  S.fx[k].trail = buildTrail(k, body.r, body.mix, clip.duration);
  placeFx(k, 'rest');
}
// --- motion trail: the path of the moving end (hand / knee / face) through the real clip, and the fan it sweeps from the joint ---------
// Revealed as the clip plays, so the student sees the range of motion build up: one plane (hinge), a horizontal arc (pivot),
// several directions (ball and socket).
const TRAIL = { pivotal: { tip: 'joint6', pivot: 'joint1', axis: true }, hinge: { tip: 'joint5', pivot: 'joint3' }, ball: { tip: 'joint3', pivot: 'joint2' } };
function buildTrail(k, body, mix, dur) {
  const T = TRAIL[k], tip = T && body.getObjectByName(T.tip), piv = T && body.getObjectByName(T.pivot); if (!tip || !piv) return null;
  const N = 120, pts = [], c = new THREE.Vector3(), v = new THREE.Vector3();
  for (let i = 0; i <= N; i++) { mix.setTime(dur * i / N); body.updateMatrixWorld(true); tip.getWorldPosition(v); pts.push(v.clone()); }
  mix.setTime(0); body.updateMatrixWorld(true); piv.getWorldPosition(c);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N, .07, 6, false),
    new THREE.MeshBasicMaterial({ color: ACCENT(), transparent: true, opacity: .95, depthTest: false }));
  const fanPos = new Float32Array(N * 9);
  for (let i = 0; i < N; i++) {
    const o = T.axis ? [c.x, pts[i].y, c.z] : [c.x, c.y, c.z];                  // pivot: fan round the vertical neck axis (head turning)
    fanPos.set([...o, pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z], i * 9);
  }
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fanPos, 3));
  const fan = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: ACCENT(), transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false, depthTest: false }));
  const g = new THREE.Group(); g.add(fan, tube); g.visible = false; tube.renderOrder = 3; fan.renderOrder = 2; scene.add(g);
  return { g, tube, fan, N, max: 0, per: 6 * 6 };
}
function showTrail(f, tt) {
  const tr = f.trail; if (!tr) return;
  const i = Math.min(tr.N, Math.floor(tt / f.dur * tr.N)); tr.max = Math.max(tr.max, i);
  tr.g.visible = tr.max > 0; tr.tube.geometry.setDrawRange(0, tr.max * tr.per); tr.fan.geometry.setDrawRange(0, tr.max * 3);
}
// --- Labels: the bones that form the selected joint glow softly ---------------------------------------------------------------
const GLOW_PARTS = { pivotal: ['neck'], fixed: ['skull'], hinge: ['upperArmL', 'forearmL'], ball: ['legL'] };
let hiMat = null, hiOn = null;
export const highlight = k => highlightParts(k && GLOW_PARTS[k], null);
let hiRed = false;
export function highlightParts(parts, color) {               // color: null = theme accent, or a hex (e.g. red for "cannot bend")
  for (const n in S.parts) S.parts[n].material = mats.full;
  hiOn = parts && parts.length && mats.full ? parts : null;
  if (!hiOn) return;
  if (!hiMat) hiMat = mats.full.clone();
  hiRed = color != null; hiMat.emissive.setHex(hiRed ? color : ACCENT()); hiMat.color.copy(mats.full.color);
  parts.forEach(n => { if (S.parts[n]) S.parts[n].material = hiMat; });
  wake();
}
function placeFx(k, where) {                                   // put the joint model's centre on JOINTS[k][where] (scaled about that centre)
  const f = S.fx[k], j = JOINTS[k], sc = j.scale || 1, t = j[where];
  f.holder.scale.setScalar(sc); f.holder.position.set(t[0] - sc * f.center.x, t[1] - sc * f.center.y, t[2] - sc * f.center.z);
}

// --- Activity highlights: soft blue discs placed just behind each joint, so the bones cover part of them (like the demo) -----------
// The expanding rings around them are CSS on the invisible click buttons (.hot in css/joints.css).
export const glowPos = k => { const d = JOINTS[k].dot; return [d[0], d[1], d[2] - 1.1]; };
function buildGlows() {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.55, 'rgba(255,255,255,.9)'); gr.addColorStop(.8, 'rgba(255,255,255,.4)'); gr.addColorStop(1, 'rgba(255,255,255,0)');   // white: tinted with the theme accent below
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c); S.glows = {};
  ORDER.forEach((k, i) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: ACCENT(), transparent: true, depthWrite: false, depthTest: true }));
    sp.position.set(...glowPos(k)); sp.visible = false; sp.userData.ph = i * .8; scene.add(sp); S.glows[k] = sp;
  });
}
export const showGlows = names => { for (const k in S.glows) S.glows[k].visible = !!names && names.includes(k); wake(); };
function pulseGlows(T) {
  for (const k in S.glows) {
    const sp = S.glows[k]; if (!sp.visible) continue;
    const p = .5 + .5 * Math.sin(T * 3 + sp.userData.ph);
    sp.scale.setScalar(.95 + .2 * p); sp.material.opacity = .85 + .15 * p;
  }
}

// --- visibility helpers -------------------------------------------------------------------------------------
export function showModel(parts) {   // parts: array of skeleton part names, or null for the whole skeleton (the movable GLB bones are always hidden here)
  for (const k in S.parts) S.parts[k].visible = !parts || parts.includes(k);
  for (const k in S.fx) S.fx[k].body.visible = false;
}
export const showPieces = names => { for (const k in S.fx) S.fx[k].holder.visible = !!names && names.includes(k); };
export const isolate = k => { const f = S.fx[k]; if (f) { placeFx(k, 'move'); f.body.visible = true; } };   // open the body part next to its joint model
export function resetPose() {
  for (const k in S.pivots) S.pivots[k].rotation.set(0, 0, 0);
  for (const k in S.fx) { const f = S.fx[k]; f.sideMix.setTime(0); f.bodyMix.setTime(0); f.body.visible = false; placeFx(k, 'rest'); if (f.trail) { f.trail.max = 0; f.trail.g.visible = false; } }
}
export const animate = name => { resetPose(); S.anim = name ? { name, t0: clock.elapsedTime } : null; wake(); };

// --- camera ---------------------------------------------------------------------------------------------------
export function flyTo(pos, tgt, ms = 900) {
  wake(ms + 1200);
  S.tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: tgt.clone(), s: performance.now(), ms };
}
// --- zoom / rotate limits: the user can never zoom in so far that part of the subject is cut off. The closest allowed distance
// is the distance at which the current subject (whole skeleton, or the selected joint's area) just fits the screen.
// In the Activity the camera is fixed altogether (no zoom, no rotation): the view stays exactly as framed.
S.lim = { min: 56, max: 90, home: true };      // real values are set by setMin() below (init() calls it for the whole-skeleton view)
// Zoom-in limit = the distance where the current subject still fits fully (nothing truncated).
// Zoom-out limit = a bit further than the framed view, but never further than the whole-skeleton view (+ margin), so the model never becomes tiny.
const maxFor = (d, isHome) => isHome ? d * 1.6 : Math.min(d * 2.2, HOME.d * 1.3);
const setMin = (d, isHome = false) => { S.lim.min = d; S.lim.max = Math.max(d, maxFor(d, isHome)); S.lim.home = isHome; };   // never closer than the framed view (as in Human Skeleton)
export function lockCamera(on) { S.locked = !!on; controls.enableZoom = controls.enableRotate = !S.locked; }
export const home = ms => {
  controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
  setMin(HOME.d, true); flyTo(homePos(), HOME.tgt, ms);
};
// Half-size (model units) of the area that must stay fully visible around each joint when its label is selected. The user cannot zoom in closer than that.
const FOCUS = { pivotal: { w: 4.5, h: 4.5 }, fixed: { w: 3.8, h: 3.8 }, hinge: { w: 5.5, h: 5.5 }, ball: { w: 6, h: 6.5 } };
export function focusJoint(name, ms) {          // camera swings round to the joint's side (JOINTS[name].az) and zooms in, like the demo
  const j = JOINTS[name], a = new THREE.Vector3(...j.anchor), f = FOCUS[name], d = fitDist(f.w, f.h), az = (j.az || 0) * Math.PI / 180;
  controls.minAzimuthAngle = az - Math.PI / 3; controls.maxAzimuthAngle = az + Math.PI / 3;
  setMin(d);                                     // zooming closer than this would cut the selected part off
  flyTo(new THREE.Vector3(a.x + d * Math.cos(EL) * Math.sin(az), a.y + d * Math.sin(EL), a.z + d * Math.cos(EL) * Math.cos(az)), a, ms);
}
// Activity: body part + joint model side by side. Box = world-space area the part(s) and the joint piece cover while moving.
const MOVE = { pivotal: [-11.5, 3.6, 19.5, 26.6], fixed: [-3.6, 3.6, 20.2, 26.4], hinge: [-12.6, .5, 9.5, 23.5], ball: [-15.5, 9.5, -.3, 18] };
// MOVE_AZ: three-quarter view (deg) for joints that move forward / back, so the bend is readable; the limb swings AWAY from its joint model.
const MOVE_AZ = { hinge: -40, ball: 35 };
export function frameMove(name) {
  const [x0, x1, y0, y1] = MOVE[name], c = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, 0), az = (MOVE_AZ[name] || 0) * Math.PI / 180;
  const d = fitDist((x1 - x0) / 2 * Math.cos(az) + 3 * Math.abs(Math.sin(az)), (y1 - y0) / 2);
  const p = new THREE.Vector3(c.x + d * Math.cos(EL) * Math.sin(az), c.y + d * Math.sin(EL), c.z + d * Math.cos(EL) * Math.cos(az));
  setMin(d); flyTo(p, c, TIMING[name].cam);                          // fly-in takes as long as in demo.mp4 (see TIMING)
}
export const project = (arr, off = 0) => {
  const v = new THREE.Vector3(...arr).project(camera), w = innerWidth, h = innerHeight;
  return { x: (v.x * .5 + .5) * w, y: (-v.y * .5 + .5) * h + off, vis: v.z > -1 && v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 };
};
// --- Labels: where each dot sits + how much of it is hidden behind the body (smooth, no raycasting) ---------------------------------
// SURF: the dot of a joint snapped ONTO the skeleton surface (the fixed joint's old anchor floated in the air beside the skull, so it looked
// detached as soon as the model was rotated).  Computed once in split() from the real skull vertices.
const SURF = {};
export const dotPos = k => SURF[k] ? SURF[k].p : JOINTS[k].anchor;
function snapDots(g, B) {
  const P = g.attributes.position.array, N = g.attributes.normal.array;
  const s = nearestOutside(P, N, B.skull, JOINTS.fixed.anchor);
  if (s) SURF.fixed = s;
}
// How the dot of each joint is hidden when the model is turned (all values are continuous, so dot + line fade in and out):
//   hinge / ball : the joint sits on one side of the model (ball: right, hinge: left elbow); once the camera goes round to the other side, the body covers it.
//                  fully visible while the camera's sideways component u.x >= -show, fully hidden at u.x <= -hide.
//   fixed        : dot lies on the skull surface: visible while that surface faces the camera (see facingOcc), fades once it turns away.
//   pivotal      : neck axis, never covered.
const VIS = { hinge: { show: .6, hide: .9, side: -1 }, ball: { show: .3, hide: .7, side: -1 }, fixed: { face: true } };   // side -1: joint on the body's left (camera must go round to the RIGHT to hide it)
export function occlusion(k) {                 // 0 = dot fully visible ... 1 = fully hidden behind the body
  const v = VIS[k]; if (!v) return 0;
  const a = dotPos(k), cx = camera.position.x - a[0], cy = camera.position.y - a[1], cz = camera.position.z - a[2];
  if (v.face) { const n = SURF[k] && SURF[k].n; return n ? facingOcc((n[0] * cx + n[1] * cy + n[2] * cz) / (Math.hypot(cx, cy, cz) || 1)) : 0; }
  return lateralOcc((v.side || 1) * cx / (Math.hypot(cx, cz) || 1), v.show, v.hide);
}
// While a dot is hidden its leader line only starts where it leaves the body (demo).  Screen x of that silhouette edge on the label's
// side (side = +1 label to the right of the dot, -1 to the left); body half-widths in model units.
const R_BODY = { fixed: 1.25, hinge: 2.4, ball: 2.9 };
export function silhouetteX(k, side) {
  const r = R_BODY[k]; if (!r) return null;
  const a = dotPos(k), dx = camera.position.x - a[0], dz = camera.position.z - a[2], l = Math.hypot(dx, dz) || 1;
  return project([(dz / l) * r * side, a[1], .1 - (dx / l) * r * side]).x;      // body axis (x 0, z .1) + camera-right * r
}
// Get camera viewing direction: 1=front, -1=back, 2=right side, -2=left side
export const getViewDirection = () => {
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  const angle = Math.atan2(camDir.x, camDir.z);
  // Convert angle to quadrant: front (0), right (PI/2), back (PI), left (-PI/2)
  const deg = angle * 180 / Math.PI;
  if (Math.abs(deg) < 45) return 1; // front
  if (Math.abs(deg) > 135) return -1; // back
  if (deg > 0) return 2; // right side
  return -2; // left side
};
// --- keep the model in the FREE area: the top instruction banner and the content card (quiz / description / intro) must never
// cover it. Only the vertical direction is used (phones: banner / top card -> model below); the model always stays horizontally centred.
const cur = { t: 0, b: 0, l: 0 };
const RECT = { banner: null, panel: null };
export const panelRect = () => RECT.panel;                   // cached for the Labels overlay too (no layout read per frame)
function watchOverlays() {
  const read = () => {
    const bn = $('#banner'), pn = $('#panel');
    RECT.banner = bn && !bn.hidden ? bn.getBoundingClientRect() : null;
    RECT.panel = pn && !pn.hidden ? pn.getBoundingClientRect() : null;
    wake();
  };
  const ro = new ResizeObserver(read), mo = new MutationObserver(read);
  ['#banner', '#panel'].forEach(s => { ro.observe($(s)); mo.observe($(s), { attributes: true, attributeFilter: ['hidden', 'class'] }); $(s).addEventListener('animationend', read); });   // entrance animation moves the card: measure again once it has landed
  addEventListener('resize', read); read();
}
// Which screen edge the content card is attached to: 'left' column (desktop, phone landscape), 'bottom' sheet (phones), 'top' card, or null.
export const cardKind = r => {
  if (!r) return null;
  const W = innerWidth, H = innerHeight;
  if (r.width > W * .8) return r.bottom > H * .7 && r.top > H * .15 ? 'bottom' : 'top';
  if (r.left < 60 && r.right < W * .62) return 'left';
  return null;
};
function reserveTarget() {
  const W = innerWidth, o = { t: 0, b: 0, l: 0 }, bn = RECT.banner, r = RECT.panel, kind = cardKind(r);
  if (bn) o.t = Math.max(o.t, bn.bottom + 6);
  if (kind === 'bottom') o.b = innerHeight - r.top + 6;
  else if (kind === 'top') o.t = Math.max(o.t, r.bottom + 6);
  else if (kind === 'left' && W > 560) o.l = r.right + 12;                  // card in a left column: centre the model in the space beside it
  return o;
}
function applyReserve() {
  const W = innerWidth, H = innerHeight, tg = reserveTarget();
  for (const k in cur) { if (cur[k] !== tg[k]) wake(100); cur[k] += (tg[k] - cur[k]) * .18; if (Math.abs(tg[k] - cur[k]) < .5) cur[k] = tg[k]; }
  if (cur.t < .5 && cur.b < .5 && cur.l < .5) { if (camera.view && camera.view.enabled) camera.clearViewOffset(); return; }
  const freeW = Math.max(120, W - cur.l), freeH = Math.max(120, H - cur.t - cur.b), k = Math.max(.35, Math.min(1, freeW / W / .6, freeH / H));   // a side column only shifts the (narrow) skeleton; it shrinks only when really short of room
  const cx = cur.l + freeW / 2, cy = cur.t + freeH / 2, fw = W * k, fh = H * k;
  camera.setViewOffset(fw, fh, fw / 2 - cx, fh / 2 - cy, W, H);
}
function resize() { wake(); renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); fit(); }
function fit() { HOME.d = camera.aspect < .8 ? 56 / Math.min(1, camera.aspect * 1.25) : 56; if (S.lim.home) setMin(HOME.d, true); }   // whole-skeleton zoom limit follows the screen shape
export const onFrame = { fn: null };
export const camFront = () => (camera.position.z - controls.target.z) >= 0 ? 1 : -1;   // 1 = looking at the front of the skeleton

function tick() {
  const T = clock.getElapsedTime(), tw = S.tween;      // getElapsedTime() ADVANCES the clock; reading .elapsedTime alone stays 0 forever (nothing would ever move)
  if (tw) {
    let k = Math.min(1, (performance.now() - tw.s) / tw.ms); k = k * k * (3 - 2 * k);
    camera.position.lerpVectors(tw.p0, tw.p1, k); controls.target.lerpVectors(tw.t0, tw.t1, k);
    if (k >= 1) S.tween = null;
  }
  // Zoom limits: relaxed while the camera flies (so a flight from a close view is not clamped mid-way), enforced once it has arrived.
  controls.minDistance = tw ? 0 : S.lim.min; controls.maxDistance = tw ? 1e4 : S.lim.max;
  const a = S.anim, f = a && S.fx[a.name];
  if (f) { const tt = Math.min(f.dur, Math.max(0, clock.elapsedTime - a.t0 - TIMING[a.name].lead)); f.sideMix.setTime(tt); f.bodyMix.setTime(tt); showTrail(f, tt); }   // 'fixed' has no clip: nothing moves
  if (hiOn) hiMat.emissiveIntensity = hiRed ? .25 + .2 * (.5 + .5 * Math.sin(T * 4)) : .05 + .09 * (.5 + .5 * Math.sin(T * 3.2));                 // soft pulse on the selected joint's bones
  const now = performance.now(), c = S.chair;
  const busy = tw || f || hiOn || S.demo || S.sitTw || (c && c.op !== c.target) || Object.values(S.glows).some(g => g.visible) || now < awakeUntil;
  if (!busy) { DPR.last = 0; return; }                 // nothing can change on screen: skip the frame entirely
  pulseGlows(T); applyPose(); applyReserve(); controls.update(); renderer.render(scene, camera);
  onFrame.fn && onFrame.fn();
  adapt(now);
}
function adapt(now) {                                   // ~60 frames averaging > 45 ms -> lower the resolution one step (never below 1)
  if (DPR.last) { DPR.sum += now - DPR.last; DPR.n++; }
  DPR.last = now;
  if (DPR.n < 60) return;
  const avg = DPR.sum / DPR.n; DPR.n = DPR.sum = 0;
  if (avg > 45 && DPR.cur > 1) { DPR.cur = Math.max(1, DPR.cur - .25); renderer.setPixelRatio(DPR.cur); renderer.setSize(innerWidth, innerHeight, false); }
}