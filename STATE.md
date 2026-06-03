# State

PROJECT: Lanternfall — a small harbor town at dusk, rendered on an animated
HTML canvas, that grows by one considered addition each night.
NAME: Lanternfall (chosen Night 1 — keep forever).
CURRENT NIGHT: 2

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
- A "Last night" delta line (now Night 2) + a "Night 2" footer.

ARCHITECTURE NOTES (for future me):
- The world is a `town` object holding `horizon`, `lighthouse`, and now a
  populated `buildings` array (`lanterns` still empty). Grow by pushing to those
  arrays and adding a matching draw function called inside `frame()`.
- Cottages: each is `{x, baseY, w, h, body, roof, wins:[{wx,wy,cw,ch,onAt,seed}]}`.
  `drawBuildings(list, t)` renders land + bodies + roofs + windows. Window light
  level = clamp((t - onAt)/700) with a sin() flicker. `onAt` sequences the
  lighting; add cottages by pushing more specs in the seeding IIFE.
- The sky is cached to an offscreen canvas; only re-paint it if the palette or
  horizon changes.
- Coordinates are in the canvas's fixed 1280×720 space (CSS scales it).
- The window-lighting clock is tied to the animation timestamp, so it replays on
  every page load (intentional for now).

NEXT INTENTION: add the first MOVING thing — a small fishing boat that drifts in
from the headland (left) across the water toward the cottages, ideally with a
bow lantern that reflects on the sea. Tempting alternative/bigger swing: a real
day-night cycle that drives all the lights. Remember to move the "Last night"
delta marker + footer to Night 3.
