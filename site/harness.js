// Headless verification harness for Lanternfall (Night 23 — the pounce).
// Stubs canvas/document, drives frames, asserts everything stays finite and
// instruments the new pounce path so we know it actually fires (not just that
// it doesn't crash). Deterministic-ish: we DON'T override Math.random (so the
// scheduler jitters), but we run long enough to exercise the path many times.
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/artifact/index.html', 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];

let nonFinite = 0, badAlpha = 0, exceptions = 0;
function checkNum(label, v) {
  if (typeof v === 'number' && !Number.isFinite(v)) { nonFinite++; if (nonFinite <= 5) console.log('NON-FINITE', label, v); }
}
function checkColor(s) {
  if (typeof s !== 'string') return;
  const m = s.match(/rgba?\([^)]*\)/g);
  if (!m) return;
  for (const c of m) {
    const parts = c.replace(/rgba?\(|\)/g, '').split(',').map(x => parseFloat(x));
    for (const p of parts) if (!Number.isFinite(p)) { nonFinite++; }
    if (parts.length === 4) { const a = parts[3]; if (!(a >= 0 && a <= 1)) { badAlpha++; if (badAlpha <= 5) console.log('BAD ALPHA', c); } }
  }
}

const grad = { addColorStop: (o, col) => { checkNum('stop', o); checkColor(col); } };
const numMethods = ['clearRect','fillRect','arc','ellipse','moveTo','lineTo','quadraticCurveTo','rotate','scale','translate','rect','fillText'];
const ctx = new Proxy({}, {
  get(_, prop) {
    if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return (...a) => { a.forEach(v => checkNum(prop, v)); return grad; };
    if (numMethods.includes(prop)) return (...a) => a.forEach(v => { if (typeof v === 'number') checkNum(prop, v); });
    if (['beginPath','closePath','fill','stroke','save','restore','clip'].includes(prop)) return () => {};
    return undefined; // property reads
  },
  set(_, prop, val) {
    if (prop === 'fillStyle' || prop === 'strokeStyle') checkColor(val);
    if (prop === 'globalAlpha' || prop === 'lineWidth') checkNum(prop, val);
    return true;
  }
});

const canvas = {
  width: 1280, height: 720,
  getContext: () => ctx,
  addEventListener: (ev, fn) => { canvas['on_' + ev] = fn; },
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 720 }),
};
global.document = { getElementById: () => canvas };
let nowMs = 0;
global.performance = { now: () => nowMs };
let frameCb = null;
global.requestAnimationFrame = (cb) => { frameCb = cb; };

// Instrumentation hooks: we monkeypatch nothing inside; instead we observe the
// `cat` and `gulls` via globals the IIFE doesn't expose... so we eval the script
// with a tail that leaks them out for inspection.
const marker = '})();';
const li = script.lastIndexOf(marker);
const leaky = script.slice(0, li) + '\n  global.__lf = { cat, gulls, town, pointer, CAT };\n' + script.slice(li);
try { eval(leaky); } catch (e) { console.log('SETUP EXCEPTION', e.message); process.exit(1); }

const { cat, gulls, town, pointer } = global.__lf;

// Drive frames. Pointer kept OUTSIDE the scene (idle) so the pounce path isn't
// suppressed by the visitor — we want to prove it fires autonomously.
let lunges = 0, spooks = 0, maxLunge = 0, maxCrouch = 0, maxGaze = 0;
let pounceWhileNight = 0;
let prevArmed = cat.pounceArmed;
let prevStartle = gulls.map(g => g.startle);
const STEP = 16;
const FRAMES = parseInt(process.argv[2] || '120000', 10);
const usePointer = process.argv[3] === 'pointer';
for (let i = 0; i < FRAMES; i++) {
  nowMs += STEP;
  // Night-21 lesson: verify with the pointer IN the scene (not idle) — a NaN once
  // hid until a pointer appeared inside the canvas. Sweep it over the spit near
  // the cat so the att path (visitor priority over the pounce) is exercised too.
  if (usePointer && canvas.on_pointermove) {
    const px = 200 + 500 * (0.5 + 0.5 * Math.sin(nowMs * 0.0007));
    const py = town.horizon + 10 + 30 * Math.sin(nowMs * 0.0013);
    canvas.on_pointermove({ clientX: px, clientY: py });
  }
  try { frameCb(nowMs); } catch (e) { exceptions++; if (exceptions <= 3) console.log('FRAME EXCEPTION', e.message, e.stack.split('\n')[1]); }
  if (cat.lunge > 0.9) maxLunge = Math.max(maxLunge, cat.lunge);
  maxCrouch = Math.max(maxCrouch, cat.crouch);
  maxGaze = Math.max(maxGaze, cat.gaze);
  // a pounce EDGE: pounceArmed flips true→false the frame a lunge fires.
  if (prevArmed && !cat.pounceArmed) {
    lunges++;
    // confirm it's daytime: at night the gulls roost above the horizon, so no
    // low bird exists to pounce at. Any gull below horizon means it's flying (day).
    if (!gulls.some(g => g.y > town.horizon - 80)) pounceWhileNight++;
  }
  prevArmed = cat.pounceArmed;
  // detect a spook the cat caused: a gull's startle jumped up this frame while a
  // bird was low (the cat is the only daytime non-click startle source besides the
  // lamplighter, who isn't out by day) — approximate by startle rising sharply.
  for (let k = 0; k < gulls.length; k++) {
    if (gulls[k].startle > prevStartle[k] + 1000 && gulls[k].y > town.horizon - 80) spooks++;
    prevStartle[k] = gulls[k].startle;
  }
}

// Count distinct lunge events by re-running a light edge counter is overkill;
// peak-frame count / typical peak-duration is a proxy. Report raw signal instead.
console.log(`frames=${FRAMES}  exceptions=${exceptions}  nonFinite=${nonFinite}  badAlpha=${badAlpha}`);
console.log(`maxGaze=${maxGaze.toFixed(3)}  maxCrouch=${maxCrouch.toFixed(3)}  maxLunge=${maxLunge.toFixed(3)}`);
console.log(`pounce-events=${lunges}  of-those-at-night=${pounceWhileNight}  cat-caused-spooks(approx)=${spooks}`);
console.log((exceptions || nonFinite || badAlpha) ? 'FAIL' : 'PASS');
