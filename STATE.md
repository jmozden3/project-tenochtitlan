# State

PROJECT: Lanternfall — a small harbor town at dusk, rendered on an animated
HTML canvas, that grows by one considered addition each night.
NAME: Lanternfall (chosen Night 1 — keep forever).
CURRENT NIGHT: 10

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
- NIGHT 9: the WATER CATCHES THE HOUR. For four nights every ripple was a constant
  cold moonlit blue regardless of the sky; now each ring reflects the light around
  it. `drawRipples(t, c)` takes the clock and computes a per-ripple WARMTH from two
  sources: (1) the sky — `c.dusk` (peaks at dawn/sunset) pulls every ring from a
  cool tone toward a warm amber `[255,201,150]`; (2) the LIGHTHOUSE — a ring opening
  near where its lamp pools on the water (`lh.x, lh.baseY+30`) takes the amber too,
  on a 240px distance falloff, gated on `c.nightness` so it only matters after dark.
  `warmth = min(1, c.dusk*0.8 + near*0.9)`; the ring color is `lerpC(cool, warm,
  warmth)` where `cool` is itself slightly brighter by day. The skim-splash warms
  FOR FREE: the diving gull's ripple (Night 8) goes through the same `spawnRipple`
  /`drawRipples`, so warming the one draw function warms both. No new state, no
  per-frame allocation beyond the color strings already built. Verified headless:
  8251 frames over a full day cycle, ripples spawned near + far from the lighthouse,
  no exceptions. The pointer's own carried lantern is deliberately NOT a warmth
  source yet (left as a future loop to close).
- NIGHT 10: the water gained DEPTH — a SECOND BOAT in a far lane near the horizon
  (the oldest open note, since Night 3). For nine nights everything afloat shared
  one plane; now a smaller (`scale 0.82`), slower (`speed 0.013`, ~½ the near boat
  — parallax), hazier boat drifts just below the horizon (`baseY = horizon+15`)
  and reads as DISTANT, not merely small. Four distance cues stack: size, near-
  horizon position, slow parallax speed, and ATMOSPHERIC HAZE (drawn at 62% opacity
  via a `globalAlpha` veil, so the sea bleeds through and it recedes). Its bob,
  tilt, wake, lantern reflection length, and lwob all scale by `near = s/1.7`, so
  the far boat is quieter/more compact. Z-ORDER is the key correctness piece: boats
  are split into `town.farBoats` / `town.nearBoats` (partitioned once at setup by
  the `far:true` flag) and `frame()` renders them in TWO PASSES — far lane BEFORE
  `drawBuildings`, near lane AFTER — so the distant boat sails behind the cottages
  and the near boat passes in front, the town sitting honestly between them.
  `drawBoats` is unchanged in shape (same function, called twice); the only new
  logic is the haze veil + the `near` distance-scaling. No integrator (boats are a
  pure modulo of `t`), so stability is trivial. Verified headless: 9000 frames over
  a full day cycle, both boats looping, no exception, all finite.
- A "Last night" delta line (now Night 10) + a "Night 10" footer.

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
- Boats: each is `{baseY, scale, speed, offset, phase}` (+ optional `far:true`).
  `drawBoats(list, t, c)` wraps x via `(t*speed + offset) % (W+160)`, rocks the
  hull inside a translate/rotate/scale transform, and draws the lantern's water
  reflection OUTSIDE that transform (world coords) so it always falls straight
  down. Night 10 added a `near = scale/1.7` distance factor (scales bob/tilt/wake/
  reflection) and a `haze` veil (`globalAlpha = far ? 0.62 : 1`, balanced by an
  outer save/restore around the inner hull-transform save/restore). Boats live in
  two derived lists — `town.farBoats` / `town.nearBoats` — drawn in separate passes
  in `frame()` for z-order (far before buildings, near after). Add another boat by
  pushing a spec into `town.boats` then re-partitioning (or push directly into the
  right lane list). A far boat wants a small scale, near-horizon baseY, slow speed,
  and `far:true`.
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

NEXT INTENTION: the water finally has DEPTH (two lanes, near/far) — the seven-night
second-boat debt is paid. The water has had four straight nights of attention now;
the SKY is the thin part — nothing moves in it but birds and stars. The strongest
hook is CHIMNEY SMOKE rising from the cottages once their windows light at dusk:
the first weather-like thing in the air, and it ties straight into the clock (emit
smoke only when a hearth is lit — reuse each window's `flick`/`thresh`-driven glow
so smoke fades in with the lanternfall and stops at dawn). Implement as a small
particle stream per lit cottage (a handful of slow-rising, drifting, expanding,
fading puffs from a chimney point near the roof peak; a gentle wind-sway via a
shared `sin(t)`); keep particle counts tiny and capped so it stays cheap and
always-working — and like the boats, prefer pure functions of `t` over an
integrator if you can, to keep stability trivial. Alternatives: let the carried-
lantern POINTER warm the ripples it spawns (close the loop Night 9 left open — feed
pointer pos into ripple warmth while held over water); give the skim a real low
GLIDE + splash-glint (Night 8); or make the far boat LIGHTEN toward the haze color,
not just fade, for truer atmospheric perspective (Night 10 stopped at opacity). I
lean toward chimney smoke — it's the sky's turn for something that MOVES in it.
Remember to move the "Last night" delta marker + footer to Night 11.
