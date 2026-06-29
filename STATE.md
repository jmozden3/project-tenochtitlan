# State

PROJECT: Lanternfall — a small harbor town at dusk, rendered on an animated
HTML canvas, that grows by one considered addition each night.
NAME: Lanternfall (chosen Night 1 — keep forever).
CURRENT NIGHT: 28
(NOTE: this file went stale at Night 22 — the Night 23 run crashed before updating it,
and Night 24 left it untouched. Night 25 brought it current and Nights 26–28 kept it so.
The JOURNAL is the authoritative record; Nights 23–25 below were reconstructed/added
from the code + journal.)

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
- NIGHT 15: the lamplighter is APPROACHABLE — the first time a PERSON in Lanternfall
  acknowledges the visitor. Since Night 5 the cursor carries its own warm lantern-glow
  (`drawPointer`); since Night 13 the lamplighter carries one too; now the two MEET.
  Bring the cursor near the walking figure and it STOPS, raises its lantern, and reaches
  it toward your glow (two carried lights on the shore); move away and it resumes its
  rounds. The figure's position is a pure function of `nightness` (Night 13), which has no
  memory, so a true pause needed exactly one number of state: `lamplighter.attend` (0→1,
  eased toward the pointer's nearness using the `dt` now threaded into `drawLamplighter`).
  While `attend≈0` the figure tracks the clock as before; the moment the cursor approaches,
  `heldX` freezes where it stood and the drawn x blends from the clock position toward
  `heldX`. When the cursor leaves, x GLIDES back to where the clock has since moved — a
  smooth catch-up, so a brief pause never visibly desyncs it from the lit row. Greeting =
  gait stills (stride/bob scale by `1-att`), lantern lifts (`lampY -= att*7`) and reaches
  toward the cursor (`lampX += att*9*dirToP`), glow brightens/widens; the arm + water
  reflection follow for free (already drawn to the lamp's point). Approach radius 96px;
  presence still rides `nightness` so the figure goes home on schedule regardless (can't
  be pinned). Stability is the boats'/smoke's: `att∈[0,1]` eased, `heldX` finite, drawn x
  a lerp of finite values — no integrator. Verified headless: 7,785 frames over a full day
  cycle with a cursor parked on the figure through dusk (greeting path forced), 0 exceptions,
  all gradient stops + rgba alphas finite and in [0,1].
- NIGHT 16: the lamplighter COMES HOME — his nightly walk finally has an ending. For
  three nights he reached the end of the row and just FADED; now he walks to the LAST
  cottage's DOOR and steps INSIDE. The home cottage (`town.home` = last/rightmost
  building, x=717) is also the cottage whose window lights LAST (highest thresh, 0.84 —
  the climax of the lanternfall), so he arrives home exactly as his own hearth blooms —
  a coincidence the existing clock-sync handed over, not engineered. `town.home.door =
  {cx: home.x-9, w:7, h:14}` (offset BESIDE the centered window so both fit the 38px
  cottage). Driven by ONE pure-clock value `enter = ss(0.78,0.92,c.nightness)` (no new
  state): `drawLamplighter` aims his walk at `door.cx`, fades him via `presence =
  ss(0.12,0.22,nightness)*(1-enter)` (the old 0.80→0.92 fade-out IS this entering now),
  and raises his y `enter*7` onto the doorstep; `drawBuildings` RECOMPUTES the same
  `enter` from the clock to swing the door open (`ow = d.w*(0.5+0.5*enter)`) and spill
  warm light onto the step — the two functions never talk, they just read the same clock
  (the Night-13 sync-for-free pattern again). Dawn reversal is FREE: nightness falls, so
  he emerges from the door and walks left snuffing the row. Verified headless: 16,250
  frames over ~2.1 day cycles, 0 exceptions, all coords finite, all alphas in [0,1]; he
  reaches exactly `door.cx` (707.8), is only ever "entering" at the door, and the home
  window is confirmed lit every time he steps through.
- NIGHT 17: the gull SKIM finally GLIDES — the oldest debt (Night 8, nine nights
  unscratched). For nine nights a diving gull tapped the water and pulled straight
  up; now the dive→climb state machine has a third middle stage, GLIDE. On first
  contact the bird still leaves its ripple, but instead of retargeting up it LEVELS
  OFF: the skim target is repointed to a moving spot just AHEAD at the waterline
  (`sk.tx = g.fx + sk.dir*60, sk.ty = surf`), so the steering holds it low and it
  skims along the surface for `SKIM.glide`=135px (direction `sk.dir = sign(g.vx)`
  captured at contact) before retargeting up to `wheelCenter` and climbing home. A
  gentler `SKIM.glideBoost`=12 (vs the dive's `boost`=26) makes it LINGER not bounce;
  a hard 135px cutoff guarantees the run ends. NO new force — it's the same
  desired-direction override Night 8 used, just aimed sideways for a stretch, so the
  Night-7 fixed-magnitude easing + maxV clamp keep stability STRUCTURAL (worst case:
  cruise). Along the run it drops a faint wake (`spawnRipple(...,0.3)` every 22px,
  warmed for free by Night 9's drawRipples) plus the night's NEW primitive: the
  SPLASH-GLINT. Glints live in `glints[]` (capped 24), spawned by `spawnGlint(x,y)`
  at contact + every other wake beat (`sk.wakeN`), drawn by `drawGlints(t,c)` as a
  quick `lighter`-composited flash (LIFE 520ms, alpha `min(1,p*8)*(1-p)*0.6` so it
  ramps in without a pop, swells `3+9p`, plus a thin horizontal streak = a specular
  highlight stretched flat on the water). Catches the hour like the ripples: cool-
  white at noon → warm amber through dusk (`lerpC([235,245,255],[255,224,176],
  c.dusk)`). `drawGlints` is called in `frame()` right after `drawRipples` (same
  water-surface layer). Verified headless: 22,000 frames over ~2.9 day cycles, 0
  exceptions, all coords finite, all alphas + gradient stops in [0,1]; new path
  exercised — 14 glides started, 13 completed to climb, 55 glints spawned.
- NIGHT 18: the first SECOND TOWNSFOLK — the FISHERMAN, the lamplighter's opposite
  number. For five nights the only person on the shore was the lamplighter, a creature
  of dusk/dawn; by full DAY the town emptied of people (only gulls worked the water).
  So this figure is a DAYTIME soul: a seated silhouette at the tip of the spit
  (`FISH.x = W*0.598`, on the spit edge at `town.horizon-2`), a rod held out over the
  harbor, who every so often RE-CASTS — the float arcs off the rod tip, sails out, and
  lands with a real RIPPLE (`spawnRipple(castTargetX, restY, 0.6)` — the Night-5 rings,
  warmed for free by Night-9 drawRipples); between casts the float bobs and he waits.
  HANDOFF FOR FREE: his presence is `ss(0.55,0.82,c.daylight)`, the INVERSE of the
  nightness band that brings the lamplighter out, so the two never wired together still
  hand off — he packs up as dusk falls and the lamplighter steps out to light the row,
  returns at dawn as the lamplighter walks home, with a brief deliberate overlap in late
  afternoon (both on the shore at once). The town is now peopled dawn→dark. Lives in
  `drawFisher(t, dt, c)`, called in `frame()` right after `drawLamplighter` (people layer:
  cottages behind, near boats can cross in front). Cast cycle is a bounded timer
  (`castT` -1=resting / ≥0=ms into a cast; `castTimer`/`castTargetX`) — no integrator, so
  stability is the boats'/lamplighter's calm. Verified headless: 22,000 frames (~3.1 day
  cycles, deterministic RNG), 0 non-finite coords, all rgba alphas in [0,1], cast ripples
  firing throughout; presence gate confirmed (drawn 862 noon frames, 0 midnight frames).
- NIGHT 19: the GULLS NOTICE THE FISHERMAN — the flock (Night 6/7) reacts to the
  town's NEWEST person (Night 18), mirroring Night 14 (gulls notice the lamplighter)
  but INVERTED: that was a startle (FEAR), this is a beg (APPETITE). Now and then, by
  day, one bird peels off the wheel, glides down to the spit, and CIRCLES low + hopeful
  over the fisherman's float before giving up and climbing home. Reuses the Night-8/17
  skim OVERRIDE pattern exactly — a new `g.beg` (parallel to `g.skim`) temporarily
  replaces the bird's boids steering with a pull toward a chosen point; Night-7's
  fixed-magnitude easing + maxV clamp are UNTOUCHED, so stability is structural (worst
  case: cruise). Three-stage machine: "approach" (aim at a hover anchor above his
  float, `town.horizon - BEG.hoverY`) → "hover" (chase a point WHEELING around the
  anchor on a flattened ellipse, a pure fn of `t`, so it circles; `dwell` counts down)
  → "leave" (climb to `wheelCenter`, clear `g.beg` once back up near the flock). NO
  extra cruise (unlike the skim's dive boost) so it LINGERS, not strafes. Gated like
  the skim: daylight only, AND only while `fisher.active` (so the clock hands off for
  free — begs can't happen at night when both the flock and the fisherman are gone). A
  startle CANCELS a beg (fear beats appetite); if he packs up at dusk mid-beg the bird
  abandons + rejoins (`g.beg=null` when `!fisher.active`). ONE special bird at a time
  across both behaviors: `tryStartBeg`/`tryStartSkim` each bail if any bird is skimming
  OR begging. Reads `fisher` (published by `drawFisher`, which runs before `stepGulls`
  — same-frame fresh, the Night-14 ordering). Scheduler is `begTimer` + `tryStartBeg(c)`;
  tuning lives in the `BEG` constants. Verified headless: 30,000 frames (~4 day cycles),
  0 exceptions, all coords finite, all alphas/gradient stops in [0,1]; new path
  exercised — 8 begs started, 7 reached hover, 7 dwelt-out, 5 climbed fully home (rest
  correctly abandoned at the dusk handoff).
- NIGHT 20: the fisherman gets a BITE — the missing half of Night 19, the night
  that makes the bird, the man and the water CONVERSE. While his float RESTS, a
  fish now and then takes the line: a bounded two-stage timer (`biteT` -1 idle /
  ≥0 ms into a bite) runs a NIBBLE (float yanks below the surface on a clamped
  half-sine `max(0,sin(biteT*0.02))*BITE.dip`, dropping a ring every ~200ms — the
  telegraph) then a REEL (the catch lerps from the float spot up to the rod tip,
  which lifts 7px as he plays it in; a small silver fish is drawn on the line). On
  the hook setting it rings + glints the surface (reused Night-5 ripple + Night-17
  glint, warmed by the hour for free); when the reel ends it casts straight back
  out, the arc continuing smoothly from the rod tip (no teleport). THE PAYOFF: the
  reeling catch publishes its LIVE position on `fisher.catch = {x,y,taken}`, and
  because `drawFisher` runs BEFORE `stepGulls` (Night-14 ordering), a BEGGING gull
  (Night 19) sees it the same frame — its beg's first branch then DARTS at the
  catch (skim's `SKIM.pull` + a dive's `+26` cruise boost, the Night-8 override a
  third time); reach within 16px and it flips `catch.taken`, rings the water, and
  peels into the beg's existing "leave" climb with the prize. The fisherman needs
  NO new logic to lose: once `taken` he stops drawing the fish and reels a bare
  line. Two systems, one published number — neither knows the other's code exists.
  Stability is the boats'/cast's calm (no integrator; the gull dart rides Night-7's
  fixed-magnitude easing + maxV clamp). Verified headless: 240k frames (0
  exceptions, all finite, all alphas in [0,1]); instrumented ~42-min run — 77
  catches surfaced, 75 landed by the fisherman, 2 STOLEN by a gull (rare but real
  + stable). Tuning lives in the `BITE` constants. Lives inside `drawFisher`; the
  steal branch sits atop the `g.beg` block in `stepGulls`.
- NIGHT 21: the first ALWAYS-PRESENT life — a HARBOR CAT, and the town's first
  LAND creature. For twenty nights everything intimate was hour-gated (lamplighter
  at dusk/dawn, fisherman + gull errands by day, lanternfall at nightfall) so a
  visitor at the wrong hour saw a thin slice; the cat answers that directly by
  prowling the spit at EVERY hour. It saunters the cottage shore on a loose
  wander state machine (`walk` → `sit` → pick a new target → `walk`), ambling toward
  `cat.target` at a fixed `CAT.speed` and clamped to its patrol range `CAT.minX..maxX`.
  The REACH is to the visitor (Night-15 'attend' pattern, now for a creature): bring
  the cursor-lantern within ~115px and the cat STOPS, turns to face the light, ears
  perk + tail lifts (`cat.attend` eases 0→1, freezing the wander while att>0.4); move
  off and it resumes. EYE-SHINE makes it always findable in the dark — two green-gold
  catchlights that brighten with `c.nightness` (the always-present heartbeat made
  legible against the near-black night spit); body tone also adapts pale-at-night ↔
  dark-by-day like the gulls. Gait (leg stride + bob + tail sway) is a PURE FUNCTION
  of distance walked (`cat.step`), so it never moonwalks; no integrator → boat/people
  stability. Lives in `drawCat(t, dt, c)` + the `CAT` constants + the `cat` object,
  called in `frame()` right after `drawFisher` (people layer: cottages behind, near
  boats can cross in front). Verified headless: 21,557 frames over 3 day cycles with
  the cursor parked on the cat (watch path forced), 0 exceptions, all coords finite,
  all rgba alphas in [0,1]; wander exercised (both states, 5 targets, 4 sits, attend
  hits 1.0).
- NIGHT 22: the cat WATCHES THE GULLS — the town's newest life (cat, Night 21)
  notices its oldest (the flock, Night 6), the first time it touches the world
  beyond the visitor. Each frame `drawCat` scans `gulls[]` for the most
  interesting LOW bird — scored `low * near`, where `low = ss(horizon-80, horizon,
  g.y)` (~0 for the wheeling flock high up, ~1 for a bird at the waterline) and
  `near = 1 - dist(g, cat)/220`. The dramatic case is the SKIM (Night 8/17): a
  gull kissing the water near the shore is prey to a shore cat. Reaction reuses
  the Night-15 `attend` pattern: two new eased fields on `cat`, `gaze` (toward the
  watched bird, freezes the wander + turns the cat to face it) and `crouch` (gated
  on a higher score `ss(0.34,0.7,watchScore)` — a bird LOW AND CLOSE earns a
  hunting stalk: body sinks `crouch*2.5`, tail drops `-crouch*7` and LASHES on a
  fast `sin(t*0.016)*crouch*5`, ears perk, eyes lock bright). The visitor wins
  ties: both `gaze`/`crouch` scale by `(1-att)`, so a hovering cursor pulls the
  cat's attention back to your light. DAYTIME-FOR-FREE: not gated to day in code,
  gated to LOW birds — but the flock only flies/skims by day and roosts ABOVE the
  horizon at night (low score 0), so the cat is alert/hunting through the bright
  hours and quiet at night, with no `if(daytime)`. `drawCat` runs before
  `stepGulls`, so it reads last frame's gull positions (the Night-14
  published-position trick). No integrator → boats'/people's stability. Verified
  headless: 60k frames with a moving in-scene pointer (0 exceptions, all coords
  finite, all rgba alphas in [0,1]) + a 120k-frame (~33min) run with NO pointer to
  prove the path fires autonomously — gaze reached 0.97, crouch 1.0, watching ~12.8k
  frames + stalking ~10k frames, all in daylight, none at night.
- NIGHT 23: the cat POUNCES (the Night-22 loop's resolution; the run CRASHED before
  journaling, so the entry was backfilled Night 24). When a low gull skims VERY close,
  the cat SPRINGS at it — a transient draw OFFSET (`cat.lunge` eased 0→…→0; `cat.x` and
  the patrol untouched, so no return-to-rest snap), forward + down toward the waterline
  with a slight scale stretch. If the bird crosses within `pounceReach`≈34px the pounce
  SPOOKS it: the same Night-6 `startle`/`scatter` a click fires, so the gull bolts off
  the water and abandons its skim (startle beats dive). `pounceArmed` (mirror of the
  lamplighter's `spookArmed`) fires once per close pass; the visitor still wins (`att`
  suppresses it). Hangs off Night-22's `watchScore`, so it's daytime-for-free (low birds
  only fly by day). Verified (Night-24-me): 200k frames, lunge fired 77×, one genuine
  spook, 0 exceptions, all finite.
- NIGHT 24: the first true WEATHER — SEA FOG (a haar), and the first ambient event NOT
  gated to an hour. A bank rolls in off the headland now and then (a pure-`t` tide,
  `fogLevel(t)`: a clean 0→1→0 hump occupying `FOG.frac`=26% of a `FOG.period`=116s cycle,
  decoupled from `DAY_MS` so it drifts the clock — any visit may catch one; phased so a
  bank is rolling in AT LOAD). It softens the town to silhouettes via two layers — a
  distance WASH thickest at the waterline (`FOG.veil`) + three lanes of drifting BANKS at
  parallax speeds (`FOG.bank`) — and catches the hour (cool blue-grey by night, dusty warm
  at dusk, pale by day). Drawn in `drawFog(t,c)`, called in `frame()` JUST BEFORE
  `drawLighthouse`, so the beam (additive, drawn after) glows VOLUMETRIC where it cuts the
  haar. No integrator → boats'/smoke's calm. Verified headless: 80k frames, present 26%,
  peak 1.0, 0 exceptions, all finite.
- NIGHT 25: the town's LIGHTS BLOOM through the fog — the half Night 24 left undone. Night
  24 drew the fog ON TOP of every light except the beam, so the windows + carried lanterns
  DIMMED into the mist instead of glowing OUT of it. Now every warm light PUBLISHES itself
  to a shared `bloomLights[]` as it draws (the Night-14 published-position trick): each lit
  cottage window (`0.55*flick`), the home doorway (`0.4*open`), the lamplighter's lantern
  (`0.5*nl*presence`), and both boats' bow lanterns (`0.55*nl*haze`, so the far boat blooms
  fainter). A new pass `drawFogBloom()` — called in `frame()` right AFTER `drawFog` (like the
  beam) — lays an ADDITIVE (`lighter`) halo at each, alpha `Math.min(0.6, str*fogNow)` and
  radius swelling `*(1+fogNow*1.1)`. The clear-weather scene is BYTE-IDENTICAL to before: the
  publish helper `bloom()` is gated on `fogNow>0.02` (set once per frame in `frame()` from
  `fogLevel(t)`), so when there's no fog nothing is pushed and nothing is drawn — and not a
  single object is allocated. Pure draw pass, no integrator → boats'/smoke's calm. Also fixed
  an INCIDENTAL pre-existing bad-alpha (the lamplighter's lantern CORE was `0.9*nl`, and `nl`
  is att-boosted to ~1.45 when greeting, so alpha could exceed 1 — latent since Night 15,
  invisible because browsers clamp; now `Math.min(1,0.9*nl)` to match its sibling glow).
  Verified headless: 120k frames (~32min, several fog banks) with a wandering in-scene pointer
  — 0 exceptions, all finite, all alphas in [0,1]; bloom list filled on ALL 31,286 fog frames
  and NONE of the clear ones (gate holds), up to 17 lights/frame, peak str 0.587.
- NIGHT 26: the fog finally changes the world's BEHAVIOUR, not just its look — the
  FLOCK HUNKERS in the haar. For two nights the fog (Night 24) and its blooming lights
  (Night 25) were pure rendering, drawn on top of the world; tonight the newest system
  reaches the oldest (the flock, Night 6). When a thick bank rolls in, every gull's
  want-to-fly is scaled down by `hunker = 1 - fogNow*0.75`, so the wheeling flock sinks
  low over the rooftops and quiets — and because `air` drops below the 0.85 gate the skim
  (`tryStartSkim`) and beg (`tryStartBeg`) both require, those errands STILL while the murk
  sits, resuming as it thins. The change is literally ONE MULTIPLY on the existing `dayFly`
  want in `stepGulls` pass 2 (`let want = dayFly * hunker;`), eased into `air` by the same
  Night-6 roosting machinery — so NO new force, no integrator, no new state, and Night 7's
  structural-stability guarantee is untouched (worst case: a bird sitting low). DAYTIME-FOR-
  FREE: at night `dayFly`≈0 already, so the multiply is a no-op and a midnight fog changes
  nothing. VISIBLE AT THE DEFAULT OPEN: at load (`daylight≈0.92`) the flock is fully aloft
  AND Night 24 phased a bank to roll in at load, so the visitor watches the gulls drop low +
  quiet in the first ~20s, then lift as it clears. `hunker` is computed once per frame just
  before pass 2's loop; it reads the module-level `fogNow` (set at frame top from `fogLevel(t)`,
  fresh because stepGulls runs after drawFog). Verified headless: 21,557 frames over 3 day
  cycles + several banks, 0 exceptions, all coords finite, all alphas in [0,1]; instrumented
  the flock — daytime-clear avg air 0.998 (high/wheeling) vs daytime-thick-fog 0.34 (min 0.25),
  sinking ~26px lower toward the roofs, still above the 0.14 draw-threshold (low-flying Vs, not
  fully perched).
- NIGHT 27: the FOGHORN — the lighthouse finally has a VOICE in the weather. For three
  nights the fog (Night 24) hid the town, bloomed its lights (Night 25), and stilled the
  flock (Night 26), but the harbor made no CALL about it. Now, while a thick bank sits, the
  lamp room SWELLS in a slow mournful blast and a soft RING of light pushes out into the
  murk — the foghorn rendered as LIGHT, not sound (deliberately NO autoplay-audio: a
  thicket that would break "always works"; this town speaks in light anyway). Pure function
  of `t` (a blast cycle: ~9s PERIOD, ~2.8s BLAST on a `sin(p·π)` envelope) gated on the
  module-level `fogNow`, exactly like the bloom — scaled by `thick = min(1,(fogNow-0.25)/0.5)`
  so it only sounds in a genuinely socked-in bank and ramps in gently. Two coordinated
  elements = one gesture: (1) an additive lamp-room glow swell, (2) a soft band in a radial
  gradient whose bright stop TRAVELS OUTWARD (`rr = 34 + p*250`) and fades as it spreads.
  No fog ⇒ early-return ⇒ clear scene byte-identical. No new state, no integrator → boats'/
  fog's calm. Lives in `drawFoghorn(t, c)` (defined right before `drawFogBloom`), called in
  `frame()` right AFTER `drawLighthouse` (so the blast sits over the beam near the lamp).
  TIMING-FOR-FREE: Night 24 phased a bank in at load, so a blast shows on open; and because
  the foghorn + the flock-hunker (Night 26) both read `fogNow`, a thick bank now STILLS the
  flock AND CALLS the beacon in the same breath. Verified headless: 60k frames idle + 60k
  with an in-scene pointer (0 exceptions, 0 non-finite, 0 bad alphas via the harness's global
  gradient-stop + rgba check), plus an 80k-frame instrumented run — foghorn active 5,555
  frames, fog-while-blasting range [0.255, 1.000] (NEVER below the 0.25 gate), peak alpha 0.55.
- NIGHT 28: the fog finally MUFFLES THE WATER — the last surface the haar hadn't
  touched. For four nights the fog hid the town (24), bloomed its lights (25), stilled
  the flock (26), and called the beacon (27), but ripples + glints still rang/sparked at
  full strength under a thick bank. The catch: `drawFog`'s veil is only 30% opacity (a
  bright ripple punches through), and glints are `lighter`-additive drawn BEFORE the fog
  (a translucent overlay can't subtract their light) — so the muffle had to happen AT THE
  SOURCE, not via the overlay. New module-level helper `fogMute(y)` (defined right after
  `bloom`, before `drawFoghorn`): returns a `[0,1]` factor multiplied into each ring's +
  spark's alpha. DEPTH-HONEST (mirrors Night-24's veil shape): `d=(y-horizon)/(H-horizon)`,
  `over=1-0.55*d` (1.0 far at waterline → 0.45 near shore), `return 1 - fogNow*0.85*over` —
  so at peak fog a far ring drops to ~0.15, a near-shore touch only to ~0.62. CLEAR-SCENE
  GUARANTEE: early-returns EXACTLY 1 when `fogNow<0.02`, so the 74%-clear clock is byte-
  identical (an identity, not a *0.99). Applied as `* fogMute(rp.y)` in `drawRipples` (the
  inner trailing ring rides `a` so it's free) and `* fogMute(gl.y)` in `drawGlints`. Reads
  the module-level `fogNow` (set in `frame()` before both draws — fresh). No new state, no
  integrator → boats'/fog's calm. Now SKY (hunker) + LIGHT (foghorn) + WATER (tonight) all
  answer the same `fogNow`. Verified: 22,000 headless frames over 3 fog periods, 0
  exceptions, 0 non-finite coords, 0 bad gradient stops / rgba alphas; factor math swept —
  clear=1.0 at all depths, peak-fog range [0.15, 0.62], nothing ever leaves [0,1].
- A "Last night" delta line (now Night 28) + a "Night 28" footer.

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
- Lamplighter approachability (Night 15): `drawLamplighter` now takes `dt` and the
  `lamplighter` object carries `attend`/`heldX`. The PAUSE pattern is the key idea: the
  figure's x is a memoryless pure function of the clock, so to pause it you must NOT mutate
  the clock — instead freeze a COPY (`heldX`) and blend the DRAWN x toward it by an eased
  proximity weight `att`, so releasing glides back to the live clock position (catch-up, no
  desync). `att` is the single knob for "how much is the figure attending to the visitor" —
  hang any richer greeting off it.
- Lamplighter homecoming (Night 16): the `fxClock` end-mapping now aims at `town.home.door.cx`
  (his front door, no longer a bare W*0.60), and a single pure-clock value
  `enter = ss(0.78,0.92,c.nightness)` drives the arrival. The TWO-FUNCTIONS-ONE-CLOCK pattern is
  the key idea: `drawLamplighter` uses `enter` to fade him (`presence *= 1-enter`) and step him
  onto the doorstep, while `drawBuildings` INDEPENDENTLY recomputes the same `enter` to open +
  light the door — they share no state, only the clock, so they stay in lockstep for free (and
  reverse at dawn for free). `town.home` is the last building; `town.home.door = {cx,w,h}`. To
  give the door a richer open (hinge swing, a visible figure in the gap), animate off `enter`;
  to move his home, repoint `town.home` and its `door.cx`.
- GEOMETRY CORRECTION (Night 13): the lighthouse beam's `aim = -0.15 + dir*0.9` keeps
  `cos(aim)` POSITIVE for all `dir∈[-1,1]`, so the beam ALWAYS points right, over the
  open water — it never crosses the chimney plumes (which are all left of the lighthouse).
  The long-standing "smoke-meets-beam" note is a DEAD END as written; it would need the
  beam's sweep widened to cross the town, changing a 12-night element. Don't rebuild on it
  without re-deriving.

- Skim glide + glints (Night 17): the gull skim (Night 8) is now a THREE-stage machine inside
  `stepGulls` — `g.skim.stage` is "dive" → "glide" → "climb". The GLIDE pattern is the key idea: to
  make the bird run the surface, you do NOT add a force — you just keep its existing desired-direction
  override aimed at a moving point AHEAD at the waterline (`sk.tx = g.fx + sk.dir*60, sk.ty = surf`)
  for a fixed run length (`SKIM.glide`), so the Night-7 easing/clamp keep it stable for free. Tuning:
  `SKIM.glide` (run px), `SKIM.glideBoost` (slower than `boost` so it lingers), the 22px wake spacing.
  Glints are a self-contained decay system parallel to ripples: `glints[]` + `spawnGlint(x,y)` +
  `drawGlints(t,c)` (`lighter` composite, hour-tinted via `c.dusk`, LIFE 520ms). To make MORE things
  sparkle on the water (the boat lanterns' reflections, the moon-glimmer), call `spawnGlint` from
  there; to sparkle the visitor's own touches, call it from `spawnRipple`.

- Fisherman (Night 18): `drawFisher(t, dt, c)` is a self-contained DAYTIME figure. The
  INVERSE-GATE HANDOFF is the key idea: presence rides `ss(0.55,0.82,c.daylight)` —
  complementary to the lamplighter's nightness band — so the two figures share the shore
  only at the dusk/dawn handoff without any code linking them (sync-for-free again, but
  *complementary* this time, not in-lockstep). The cast is the only stateful bit: `castT`
  (-1 resting / counts up to `FISH.castMs` during an arc), `castTimer` (ms to next cast,
  `FISH.every`+jitter), `castTargetX` (varied landing). On landing it calls `spawnRipple`
  — so the fisherman is the first AUTONOMOUS person to touch the water (the visitor and
  the gull already did). To give him a BITE: dip `floatY` sharply on a sub-timer and
  `spawnRipple` there. To make a gull beg at his spot: read `fisher.x/active` from
  stepGulls (mirror the Night-14 lamplighter-notice). To make him approachable like the
  lamplighter (Night 15): add an `attend` off pointer nearness and turn his head/rod.

- Begging gull (Night 19): a THIRD gull-override beside the skim. `g.beg` (init `null`)
  is the parallel to `g.skim`; the override block sits right AFTER the skim block in
  `stepGulls` pass 1 and replaces `dirX/dirY` the same way. The OVERRIDE-NOT-FORCE pattern
  is the key idea again: no new physics, just a temporary steering target, so Night-7's
  easing/clamp keep it stable. `tryStartBeg(c)` (scheduled by `begTimer`) gates on
  `fisher.active` + daylight + "no other special bird" — it reads the shared `fisher`
  object `drawFisher` publishes (ordering: drawFisher runs before stepGulls). Tuning is the
  `BEG` constants (`hoverY` height above horizon, `orbit` wheel radius, `dwellMs` loiter
  time, `pull` steering weight, `every/jitter` schedule). To give the beg a REASON, build
  the fisherman's BITE (float dips to a catch) and let the begging bird dart in to steal
  it — that's the missing half (see NEXT INTENTION). To make the bird chase the CAST splash
  instead of the resting float, anchor the hover on the live cast target rather than
  `fisher.floatX`. To make the FISHERMAN react to the bird, read a "gull near" flag in
  drawFisher (mirror of Night-14's published-position trick, the other direction).

- Harbor cat (Night 21): `drawCat(t, dt, c)` is a self-contained, ALWAYS-PRESENT figure
  (no clock gate — the deliberate point). State lives on the `cat` object
  (`x, target, facing, state:"walk"|"sit", timer, step, attend`); tuning is the `CAT`
  constants (`y` = the spit-edge level it walks at, `minX/maxX` patrol range, `speed`,
  `sitMin/sitMax` rest duration). The WANDER pattern: a target-seeking state machine, not
  a clock function — walk toward `cat.target` at fixed speed, on arrival `sit` for a random
  dwell, then pick a fresh target. Gait is a pure function of `cat.step` (distance walked),
  so it never moonwalks. NOTE: the cat's VERTICAL position is the constant `CAT.y`, NOT a
  `cat.y` field (there is none — reading `cat.y` returns undefined → NaN; that was the one
  bug tonight). The visitor-notice reuses the lamplighter's `attend` (Night 15): eased toward
  pointer nearness, freezes the wander + turns it to face you when att>0.4. To make the cat
  TOUCH the world (its open thread): read `gulls[]` to track/crouch at a low bird (the
  Night-14 published-position trick), or read `fisher.active/x` to sit by the fisherman, or
  `spawnRipple`-chase the skim-splash at the waterline. To give it a real sitting pose, morph
  the body off a `sit` factor (fragile at 15px — tail-lift currently signals rest instead).
- Cat watches gulls (Night 22): `drawCat` now scans `gulls[]` for the lowest+nearest bird and
  eases two new `cat` fields toward it — `gaze` (watch: freeze wander + face the bird) and
  `crouch` (stalk: body sinks, tail drops + lashes). The LOW-BIRD GATE is the key idea:
  `low = ss(town.horizon-80, town.horizon, g.y)` IS the whole day/night choreography for free —
  roosting birds sit above the horizon (low=0), only flying/skimming birds by day score, so the
  cat is alert by day and quiet at night with no `if(daytime)`. Visitor priority is `*(1-att)` on
  both. To give the watch a RESOLUTION, add a POUNCE: when watchScore is very high, lunge the cat
  a few px toward the bird (mind the return-to-rest), and optionally fire a Night-6
  `startle`/`scatter` on that gull so the cat finally disturbs the flock from the ground (Night-14
  inverted). To widen what it tracks, raise the `low` band's top toward the wheel; to make it sit
  by the fisherman, branch on `fisher.active`.

NEXT INTENTION: the fog is now a COMPLETE actor across all three layers — it hides the town (Night 24),
reveals its lights (Night 25), stills the flock (Night 26, SKY), calls the beacon (Night 27, LIGHT), AND
hushes the surface (Night 28, WATER). "The whole harbor goes quiet in a thick bank" is now fully built;
three systems all answer the same `fogNow`. The strongest next reach moves the fog from water/sky/light INTO
the PEOPLE: let the LAMPLIGHTER feel the weather — lantern held a beat higher + swung slower in a thick bank,
or his pace dragging — making him the first PERSON to register the haar. CRITICAL: his walk is pure-clock
(Night 13), so you must OVERLAY the weather reaction like the Night-15 `attend` (an eased factor off `fogNow`
that nudges `lampY`/swing/gait), NEVER touch the clock x-mapping or you desync him from the lit row. Other
fog reaches: a fog the BEAM visibly thins where it passes (already volumetric — could carve a clearer wedge);
fade the resting WAVE-LINE contrast in a bank too (Night 28 left this seam — the sea's shimmer still glints
at full strength through the fog, only the ripple/glint EVENTS are muffled). Quieter standing notes, all
still unbuilt: the cat SITTING BESIDE THE FISHERMAN by day (read `fisher.active/x`); the FISHERMAN
APPROACHABLE like the lamplighter (Night 15 — turn to nod at the cursor-glow); the OPPORTUNISTIC SWOOP to
make the gull's fish-theft less rare (Night 20); WIND TURBULENCE on the smoke so the plumes stop marching in
lockstep (Night 11); the far boat LIGHTENING toward the haze color, not just fading (Night 10).

CAVEATS for tomorrow-me: (1) The skim glide (Night 17) only fires in DAYLIGHT (when the flock is up),
one bird at a time, every 7–13s — so a visitor opening the page at DUSK to catch the lamplighter won't
see a skim until the sun climbs. Honest (gulls skim by day, lights fall at dusk) but it means two of the
town's loveliest moments sit at opposite ends of the clock; the on-page marker says "watch by day." Don't
mistake "no skim at dusk" for broken. (2) Glints are FAINT/small by design (a fast glancing flash, not
fireworks) — on a small screen they read as a shimmer more than distinct sparks; that's intended. (3) The
glide's wake spawns into the SAME `ripples[]` the visitor stirs (cap 60), so a very busy harbor could crowd
the cap — harmless (oldest drop), but remember it before adding more ripple sources. (4) Like every
lamplighter beat, the doorway/arrival (Night 16) only exists during dusk/dawn presence windows — at noon/
midnight the home cottage is an ordinary cottage with a dark shut door; the door is only 7px wide so the
"swing" is subtle (the SPILLED light sells it, not the geometry). (5) The home cottage (index 8) is also a
gull roost, so at dusk the lamplighter sometimes flushes the roosting bird — Night-14 startle firing for
free; intentional. (6) Night-14 loose end still open: the dawn flush mostly catches the RIGHTMOST roosts,
not the whole row. (7) DO NOT chase smoke-meets-beam without re-deriving — the beam points AWAY from the
chimneys (GEOMETRY CORRECTION above); dead end as written. (8) NEW (Night 18): the fisherman is a DAYTIME
figure — a visitor opening the page at dusk (the default open) sees the LAMPLIGHTER, not him; you must
linger for the sun to climb. The on-page marker says watch by day. More and more of the town's life is now
hour-gated (skim by day, lamplighter at dusk/dawn, fisherman by day) — honest, but piling up; a future
night might want an always-present anchor of life. (9) The fisherman's cast spawns into the same `ripples[]`
the visitor stirs (cap 60) — one ring per ~6–11s is gentle, but it's one more source against the cap
(see caveat 3). (10) NEW (Night 19): the begging gull only fires in DAYLIGHT while the fisherman is out,
one bird at a time, every ~11–20s — so like the skim, a dusk visitor won't see it; the on-page marker
says "watch by day." It's also MUTUALLY EXCLUSIVE with the skim (one special bird at a time), so a skim
and a beg never overlap — by design (keeps the harbor calm), but it means on a busy-feeling day only one
of the two gull errands runs at a time. (11) The beg is ONE-SIDED: the fisherman never reacts and never
has a catch for the gull to want — honest but unfinished; the BITE (NEXT INTENTION) is the other half.
(12) The hover anchor is `fisher.floatX` (the RESTING float spot, only updated when a cast lands), so a
begging bird ignores the float mid-cast-arc — calmer, but a livelier version would chase the splash.
(13) NEW (Night 21): the cat is ALWAYS present (no clock gate — finally a thing that is), but at ~15px
it leans on the TAIL + the eye-shine to read as specifically a cat; on a small screen it may read as
"a small moving thing" before "a cat." Intended trade (robust silhouette over a fussy one). It has no
distinct sitting POSE — "sit" just stops it standing with the tail upright; a haunches-down morph is
fragile at this size (left for later). And it's SOLITARY: it notices the visitor's cursor but ignores
the gulls and the people around it — honest but unfinished (the NEXT INTENTION). GOTCHA for editors:
the cat's y is the constant `CAT.y`, there is NO `cat.y` field — reading `cat.y` is undefined→NaN (the
one bug tonight; the headless harness only caught it once the pointer was simulated INSIDE the scene, so
always verify with a moving pointer, not an idle one).
(Each night: bump the on-page "Last night" delta marker + the footer to the current night — done through Night 28.)
(14) NEW (Night 26): the flock hunker is deliberately PARTIAL — at peak fog `air` bottoms ~0.25, so the
gulls drop low over the roofs but never fully PERCH (they stay above the 0.14 draw-threshold, drawn as
low-flying Vs, not roosted bodies). That's intentional (a hunker reads as "riding it out," not a daytime
midnight); if a future night wants them to actually touch down in the very thickest bank, push the `0.75`
factor past ~0.86 so `air` can dip under 0.14. Each bird hunkers toward its OWN roof perch, so in fog they
disperse to individual roofs rather than dropping as one mass — realistic but loses some flock cohesion; a
shared low wheel-anchor in fog would keep them clustered if that's wanted. (15) The hunker reads `fogNow`,
the module-level var set in `frame()` BEFORE the draws — stepGulls runs after drawFog so it's fresh; if you
ever reorder `frame()`, keep `fogNow = fogLevel(t)` set before `stepGulls`. (16) Like every fog beat, the
hunker is only visible when a bank is actually out (26% of the time) AND by day (at night the flock is
already roosted, so it's a no-op) — but unlike the hour-gated people, fog is un-hour-gated, so any DAYTIME
visit eventually catches it, and the default dusk open catches it at load (flock aloft + bank phased in).
(17) NEW (Night 28): the water-muffle (`fogMute`) STACKS on top of the fog veil that's still drawn over the
rings — so in the very thickest bank a far-out ripple/glint may vanish ALMOST completely (source-muffle ~0.15
× the ~0.7 veil transmission). Intended (you genuinely can't see far water in a haar), but if a returning eye
reads "the skim's ring disappeared / broke," ease the `0.85` factor in `fogMute` down toward ~0.7 so far rings
GHOST rather than vanish. Don't mistake a muffled far ring for a broken skim. Also a SEAM left open: `fogMute`
hushes the ripple/glint EVENTS but NOT the sea's resting wave-line shimmer (`drawSea`), which still glints
through the fog at full strength — a future night could fade the wave contrast in a bank for a truly dead,
fogbound sea. And `fogMute` reads the module-level `fogNow` (set in `frame()` before `drawRipples`/`drawGlints`)
— if you reorder `frame()`, keep `fogNow = fogLevel(t)` set before those two draws.
