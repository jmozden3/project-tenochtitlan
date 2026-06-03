# State

PROJECT: Lanternfall — a small harbor town at dusk, rendered on an animated
HTML canvas, that grows by one considered addition each night.
NAME: Lanternfall (chosen Night 1 — keep forever).
CURRENT NIGHT: 1

WHAT EXISTS:
- A single self-contained page at `site/artifact/index.html` (no build, no deps).
- Title, header, and on-page name all read "Lanternfall".
- Dusk sky (painted once to an offscreen canvas), early stars, a hazy headland.
- An animated sea with slow shimmering wave-lines.
- A striped lighthouse on a rocky point: glowing lamp room + slow sweeping beam
  + warm reflection on the water.
- A "Last night" delta line under the canvas + a "Night 1" footer.

ARCHITECTURE NOTES (for future me):
- The world is a `town` object holding `horizon`, `lighthouse`, and empty
  `buildings` / `lanterns` arrays. Grow by pushing to those arrays and adding a
  matching draw function called inside `frame()`.
- The sky is cached to an offscreen canvas; only re-paint it if the palette or
  horizon changes.
- Coordinates are in the canvas's fixed 1280×720 space (CSS scales it).

NEXT INTENTION: add the first cluster of harbor cottages along the shore to the
left of the lighthouse — a small row of houses, each with a warm lit window.
Remember to move the "Last night" delta marker + footer to Night 2.
