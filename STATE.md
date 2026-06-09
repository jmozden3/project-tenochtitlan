# State

PROJECT: Lanternfall — a small harbor town at dusk, rendered on an animated
HTML canvas, that grows by one considered addition each night.
NAME: Lanternfall (chosen Night 1 — keep forever).
CURRENT NIGHT: 8

WHAT EXISTS:
- A single self-contained page at `site/artifact/index.html` (no build, no deps).
- Title, header, and on-page name all read "Lanternfall".
- Dusk sky (painted once to an offscreen canvas), early stars, a hazy headland.
- An animated sea with slow shimmering wave-lines.
- A striped lighthouse on a rocky point: glowing lamp room + slow sweeping beam
  + warm reflection on the water.
- NIGHT 2: a row of nine harbor cottages on a low spit of land along the western
  (left) shore. Each carries 1–2 warm windows that LIGHT ONE BY ONE after page
  load (the town's "lanternfall"), then flicker softly; each lit pane casts a
  halo and a wavering reflection on the water.
- NIGHT 3: the first MOVING thing — a small fishing boat that drifts left→right
  across the open water (~50s per crossing) and loops forever. It bobs and tilts
  on the swell, trails a faint wake, and carries a warm BOW LANTERN that pulses
  and casts a wavering reflection on the water; its cabin window glows too.
- NIGHT 4: a master DAY–NIGHT CYCLE (the spine). A 2-minute clock drives a sky
  that blends night↔day palettes (warm horizon at dawn/dusk), a SUN that arcs the
  day half and a MOON the night half (each glimmering on the water), stars that
  fade up at night, a sea that lightens by day. All town lights now ride the
  clock: cottage windows light one-by-one each dusk via per-window NIGHTNESS
  THRESHOLDS (and go dark at dawn — the lanternfall is now a property of time);
  boat lantern + lighthouse lamp/beam brighten after dark. A quiet phase word
  (afternoon/dusk/night/dawn) prints top-left. Page opens in late afternoon so
  the visitor catches dusk + the lanternfall live.
- NIGHT 5: the first INTERACTION — the world responds to the visitor's pointer.
  Click or drag the sea and it RIPPLES (expanding, foreshortened ellipse rings
  that fade); sweeping the cursor over water leaves a faint wake of small ripples.
  The cursor also carries a soft warm LANTERN-GLOW that follows the hover and
  casts a vertical reflection when held over the water. Pointer coords are mapped
  through `toScene()` (undoes CSS scale); ripples live in `ripples[]` (capped 60),
  spawned via `spawnRipple(x,y,strength)`, drawn by `drawRipples(t)`; the glow is
  `drawPointer()`.
- NIGHT 6: the first CREATURES — a flock of seven GULLS with a daily routine and
  a startle reflex. By day they wheel over the harbor on lazy ellipses; as night
  deepens they ROOST as small silhouettes on cottage roof-peaks + the lighthouse
  cap; at dawn they lift off again (driven by `c.daylight`, so they keep the same
  hours as the windows). CLICK near them and the nearby birds SCATTER up-and-away
  from the cursor. No physics integrator: each gull blends its position between a
  fixed perch (`home`) and a parametric wheeling sky-point by a smoothed `air`
  value (0 perched → 1 aloft) — can't destabilize. Lives in `gulls[]`; updated +
  drawn by `drawGulls(t, dt, c)`; startled by `startleGulls(x,y)` (wired into
  pointerdown alongside `spawnRipple`). `wheelCenter` is the shared flock anchor.
  The main loop now computes a clamped per-frame `dt` for the eased motion.
- NIGHT 7: the gulls became a FLOCK. The seven private wheeling ellipses are gone;
  each gull now carries a flight position (`fx,fy`) + velocity (`vx,vy`) and steers
  by classic boids — cohesion + alignment + separation over `gulls[]` (everyone is
  a neighbour, so they act as one flock) — plus a distance-scaled pull toward
  `wheelCenter` and a perpendicular SWIRL so the flock wheels around the harbor
  instead of wandering off. Motion lives in `stepGulls(t,dt,c)` (two passes:
  compute desired dir → ease velocity + integrate); `drawGulls(t,c)` is now
  render-only and banks each bird toward its climb/dive. STABILITY IS STRUCTURAL:
  velocity only ever eases toward a desired direction of FIXED magnitude (`cruise`)
  and hard-clamps to `maxV` — no unbounded acceleration exists, so it can't blow
  up (verified headless: pins to ~58px/s, stays <~180px from anchor over 3+ day
  cycles). Night 6's clock-driven roost/liftoff is untouched — the flock sim runs
  on the flight position, revealed by the perch↔air blend. Startle now propagates
  through the flock (a panic shove + speed boost on nearby birds; alignment drags
  neighbors, cohesion reels them back). Tuning lives in the `FLOCK` constants.
- NIGHT 8: the flock now TOUCHES the water — a gull SKIMS the sea. Every so often
  (in daylight only, one bird at a time) a gull peels off the flock, dives to kiss
  the surface, and at the bottom of the dive leaves a real RIPPLE via `spawnRipple`
  — the same rings the visitor's touch makes (Night 5). It then climbs back to
  rejoin the flock. Implemented as a temporary OVERRIDE of the bird's desired
  direction inside `stepGulls` (state machine on `g.skim = {stage:"dive"|"climb",
  tx, ty}`): while skimming, steering ignores the boids and aims at a sea-surface
  target; on arrival (within `SKIM.reach`) it spawns the ripple, retargets up to
  the harbor anchor, and climbs; clears once back above the horizon. Night 7's
  velocity easing + `maxV` clamp are UNTOUCHED, so structural stability holds (the
  worst a diving bird does is cruise; verified headless: 11 skims over 2 day
  cycles, all positions finite, speed pinned ~57px/s < 165 cap). A startle CANCELS
  a dive (panic wins). Scheduler is `skimTimer` + `tryStartSkim(c)`; tuning lives
  in the `SKIM` constants. Only fires when the candidate is aloft (`air>0.85`).
- A "Last night" delta line (now Night 8) + a "Night 8" footer.

ARCHITECTURE NOTES (for future me):
- THE CLOCK (Night 4): `clock(t)` is the master driver. It returns
  `{cycle, elev, daylight, nightness, dusk, phase}`. `frame()` calls it once and
  threads the result `c` into every draw function. Want anything to react to time
  of day? Read `c.nightness` (0 day → 1 night) or `c.daylight`. `DAY_MS` is the
  cycle length; `START` offsets where the page opens (currently 0.70 = late
  afternoon). Colors blend via `lerpC`/`rgb`; soft gates via `ss` (smoothstep).
- The world is a `town` object holding `horizon`, `lighthouse`, a populated
  `buildings` array, and now a populated `boats` array (`lanterns` still empty).
  Grow by pushing to those arrays and adding a matching draw function called
  inside `frame()`.
- Boats: each is `{baseY, scale, speed, offset, phase}`. `drawBoats(list, t)`
  wraps x via `(t*speed + offset) % (W+160)`, rocks the hull inside a
  translate/rotate/scale transform, and draws the lantern's water reflection
  OUTSIDE that transform (world coords) so it always falls straight down. Add a
  second boat by pushing another spec with a different speed/baseY/offset.
- Cottages: each is `{x, baseY, w, h, body, roof, wins:[{wx,wy,cw,ch,onAt,seed}]}`.
  `drawBuildings(list, t)` renders land + bodies + roofs + windows. Window light
  level = clamp((t - onAt)/700) with a sin() flicker. `onAt` sequences the
  lighting; add cottages by pushing more specs in the seeding IIFE.
- The sky is cached to an offscreen canvas; only re-paint it if the palette or
  horizon changes.
- Coordinates are in the canvas's fixed 1280×720 space (CSS scales it).
- Cottage windows are no longer time-based; each has a `thresh` and lights when
  `c.nightness` crosses it (see `drawBuildings`). The lanternfall now happens at
  every dusk and reverses at dawn — driven entirely by the clock.

NEXT INTENTION: the sea-skimming gull is done — the flock now touches the water.
The oldest unaddressed itch is the WARMTH OF THE WATER: ripples (and the new
skim-splash) are a constant cool moonlit-blue regardless of the hour, so at dusk
they read cold against the reddened sky. Lean toward tinting ripple color toward
the dusk/lighthouse palette via the clock (read `c.dusk`/`c.nightness` in
`drawRipples`, and likewise warm the skim ripple) so the surface finally agrees
with the sky. Implementation sketch: blend the ripple stroke color between a cool
night tone and a warm dusk tone by `c.dusk`; thread `c` into `drawRipples` (it
currently only takes `t`). Alternatives: give the skim a real low GLIDE along the
surface + a splash-glint where bird meets water (currently it taps and pulls up);
let the gull dive toward a fish-flash it actually chases; the long-standing second
boat in a far lane for water depth (Night 3); chimney smoke for the cottages.
Remember to move the "Last night" delta marker + footer to Night 9.
