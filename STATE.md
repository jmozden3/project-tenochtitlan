# State

PROJECT: Lanternfall — a small harbor town at dusk, rendered on an animated
HTML canvas, that grows by one considered addition each night.
NAME: Lanternfall (chosen Night 1 — keep forever).
CURRENT NIGHT: 14

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
- NIGHT 11: the SKY got WEATHER — CHIMNEY SMOKE, the first moving thing in the air
  besides birds/stars. Each cottage now has a small chimney stack (solved flush onto
  the roof's right slope at setup: `chim = {x, baseY, h, seed}` pushed into the
  building spec) and emits a thin plume once its hearth lights. Smoke is gated on the
  SAME trigger as the lanternfall: `hearth = ss(wins[0].thresh±0.06, c.nightness)` —
  the very window-glow that lights the row — so plumes fade in COLUMN BY COLUMN down
  the row as the windows sequence on, and stop again at dawn (verified: 0 smoking at
  midday, 9 at dusk + night). Each chimney emits PUFFS=5 capped puffs; every puff is a
  PURE FUNCTION of t — `p = (t*RATE + i/PUFFS + seed*0.11) % 1` (0 fresh → 1 spent) —
  and rises (`p*RISE`, RISE=84), swells (`2.2+7.5p`), sways (`sin`), leans on a shared
  two-term wind gust, and fades via `sin(πp)` (up from nothing, back to nothing, no
  pop). No state, no integrator → trivially stable like the boats. Smoke catches the
  hour (`lerpC([150,160,182],[205,184,165], c.dusk)`): cool grey by night, dusty amber
  through dusk. Lives in `drawSmoke(town.buildings, t, c)`, called in `frame()` right
  AFTER `drawBuildings` (so plumes layer above rooftops, below the gulls). Verified
  headless: 7813 frames over a full day cycle, no exception, all gradient alphas finite
  and in [0,1].
- NIGHT 12: the water catches the VISITOR'S OWN LIGHT — the pointer-warmth loop that
  Night 9 deliberately left open is now closed. Since Night 5 the pointer carries a warm
  lantern-glow; since Night 9 `drawRipples` warms each ring from two sources (the `c.dusk`
  sky + nearness to the lighthouse's pooled glow). Now a THIRD source: the carried lantern.
  Each ripple is STAMPED AT BIRTH with `pw` — its nearness to the hovering pointer when the
  water was struck — computed once in `spawnRipple` (`pw = max(0, 1 - dist(spawn, pointer)
  /150)`, gated on `pointer.inside && pointer.y>horizon`) and stored on the ripple. Stamped
  at spawn, NOT recomputed per-frame, because the pointer drifts on while the ripple sits
  (a reflection is set by the light present when the surface was struck). `drawRipples` adds
  `rp.pw*0.7` into `warmth = min(1, c.dusk*0.8 + near*0.9 + rp.pw*0.7)`. `pointerdown` now
  also sets `pointer.x/y/inside` before spawning, so a click's own ring is born under the
  lantern at distance 0 (full warmth) even on a first touch with no prior move. Drag-wake
  rings warm for free (spawned at the cursor); the gull skim-splash (Night 8) stays cold
  unless you're hovering where it dives — correctly the bird's light, not yours. 150px
  falloff (tighter than the lighthouse's 240 — a smaller, intimate light). No new
  accumulating state, no integrator → stability is the boats', not the birds'. Verified
  headless: 9000 frames over a full day cycle, pointer wandering + a click every ~0.6s
  spawning warmed rings, no exception, all gradient stops finite, all rgba alphas in [0,1].
- NIGHT 13: the first PERSON — the LAMPLIGHTER, a townsfolk with a routine. A small
  dark figure walks the shore along the cottage row at dusk, a lantern swinging from a
  pole, and the windows light in their wake. NOT coupled to the lanternfall in code, yet
  syncs to it for FREE: the figure's x is `lerp(W*0.03, W*0.60, ue)` where `ue` is an
  eased `u = clamp((c.nightness - 0.15)/0.62)` — the SAME `c.nightness` band the window
  thresholds (0.30→0.66) light across. Two things reading the same clock move as one, so
  the figure reaches each cottage just as its window blooms (verified: at the dusk where
  1/9 are lit the figure is at cottage 2, at 5/9 it's at cottage 5–6, at 9/9 it's past
  the row). DAWN REVERSAL IS FREE: position is a pure function of nightness, which FALLS
  at dawn, so the figure fades back in at the right end and walks left while the windows
  snuff in reverse — no extra code. Presence gate: `ss(0.12,0.22,nightness) *
  (1 - ss(0.80,0.92,nightness))` — fades in at dusk, out by deep night (gone home),
  absent by day. Gait (stride + body-bob) is a pure function of DISTANCE walked
  (`sin(fx*0.20)`, gated by a `moving` factor) so it never moonwalks; no integrator →
  boat/smoke-stable. Carried lantern casts a warm radial glow + a world-vertical water
  reflection (the boat-lantern trick). Lives in `drawLamplighter(t, c)`, called in
  `frame()` between `drawSmoke` and the near boats (so cottages sit behind it, a passing
  near boat crosses in front). Verified headless: 9037 frames over a full day-plus cycle,
  no exception, all coords finite, all alphas in [0,1].
- NIGHT 14: the GULLS NOTICE THE LAMPLIGHTER — the town's oldest creatures (the flock,
  Night 6/7) react to its newest person (the lamplighter, Night 13). When the figure
  walks beneath a gull ROOSTING on a cottage roof-peak, the bird STARTLES off the roof
  and lifts toward the flock, then resettles. No new effect: it reuses the Night-6
  startle (`g.startle` + `g.scatterX/Y`) that a click already triggers, fired when
  `|g.home.x - lamplighter.x| < 32 && g.air < 0.3` (roosting only — never a flying bird).
  One new boolean per gull, `spookArmed`: fires ONCE per pass then disarms, re-arming
  only after the figure is >80px clear, so a lingering figure can't pin a bird aloft.
  `drawLamplighter` now PUBLISHES the figure's live position to a shared
  `lamplighter = {active, x, y}` object (it runs before `stepGulls` in `frame()`, so the
  read is same-frame fresh); the startle loop lives at the top of `stepGulls`. SYNC IS A
  GIFT of the shared clock (again): at DAWN the gulls are still fully roosted as the
  lamplighter walks home snuffing the lights, so it FLUSHES them off the rooftops; at dusk
  it catches the last few to land. Lighthouse gulls (perches at 0.80W) are immune for free
  — the figure never passes 0.60W, so their gap stays >80px. Stability is the flock's
  existing structural guarantee (no new force/integrator; scatter decays, startle counts
  down). Verified headless: 18,000 frames over 2.4 day cycles, 0 exceptions, all coords
  finite, all rgba alphas in [0,1], lamplighter present 1775 frames, 4 startles fired —
  every one on a bird with air<0.3 (genuinely roosting), none on a flying bird.
- A "Last night" delta line (now Night 14) + a "Night 14" footer.

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
- Smoke (Night 11): each building now also carries a `chim = {x, baseY, h, seed}`
  (a roof-slope point + stack height, computed in the seeding IIFE). `drawBuildings`
  draws the stack; `drawSmoke(list, t, c)` draws the plume, gated on the cottage's
  first-window glow so it rides the lanternfall. Puffs are pure functions of `t` —
  to add wind turbulence give each chimney its own wind phase; to make smoke
  interact, read the gulls/beam where a plume rises. Tuning is the `PUFFS/RISE/RATE`
  locals + the wind expression at the top of `drawSmoke`.
- Lamplighter (Night 13): `drawLamplighter(t, c)` is a self-contained figure with NO
  state — position from `c.nightness`, gait from distance walked, presence from a
  nightness gate. The SYNC-FOR-FREE pattern is the key idea: it drives off the same
  clock value the windows do, so it tracks the lanternfall without being wired to it
  (and reverses at dawn for free). To give it a destination, change the x-mapping end;
  to slow it, you must slow the whole dusk (`ss(-0.15,0.35,elev)` width) — the figure
  deliberately matches the world's tempo rather than its own. To make creatures notice
  it, read its `fx`/`nightness` from `stepGulls` or a startle call.
- GEOMETRY CORRECTION (Night 13): the lighthouse beam's `aim = -0.15 + dir*0.9` keeps
  `cos(aim)` POSITIVE for all `dir∈[-1,1]`, so the beam ALWAYS points right, over the
  open water — it never crosses the chimney plumes (which are all left of the lighthouse).
  The long-standing "smoke-meets-beam" note is a DEAD END as written; it would need the
  beam's sweep widened to cross the town, changing a 12-night element. Don't rebuild on it
  without re-deriving.

NEXT INTENTION: the flock and the person touch now (Night 14), but the person still
doesn't notice the VISITOR. The strongest next move is making the lamplighter
APPROACHABLE: pause its walk (or turn its lantern toward you) when the visitor's
cursor-glow (Night 5, `pointer.x/y/inside`) comes near the figure's published
`lamplighter.x/y` — two carried lights meeting on the shore. That makes the figure
INTERACTIVE rather than ambient and closes the loop the other way (the world reacting to
the person reacting to the visitor). NOTE the figure's x is a pure function of nightness,
so a true "pause" means holding/slowing that mapping while the cursor is near — easiest is
to freeze `ue` (and the gait `moving` factor) when `pointer.inside && dist(pointer,
lamplighter) < R`, then resume; watch that freezing x doesn't desync it visibly from the
windows (a brief pause reads fine, a long one drifts). A close cousin: give the lamplighter
a real DESTINATION — step into a cottage DOORWAY at journey's end and make that window the
LAST to light, rather than the figure just fading past the row. Quieter standing notes, all
still unbuilt: the skim's low GLIDE + splash-glint (Night 8, six nights now); WIND
TURBULENCE on the smoke so the plumes stop marching in lockstep (Night 11); the far boat
LIGHTENING toward the haze color, not just fading (Night 10). Also a Night-14 loose end: the
dawn flush mostly catches the RIGHTMOST roosts (birds lift at ~the pace the figure walks),
not the whole row in sequence — fixing that means decoupling gull liftoff from daylight,
which trades away clock-honesty; left as-is on purpose. DO NOT chase smoke-meets-beam
without re-deriving — the beam points away from the chimneys (GEOMETRY CORRECTION above);
dead end as written. Remember to move the "Last night" delta marker + footer to Night 15.
