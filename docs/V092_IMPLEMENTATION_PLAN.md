# Rash Roads v0.9.2 — Fair Pressure

## Goal

Respond to the first external playtest without adding unrelated features. The version should become harder earlier, remain skill-based after long runs, and make mistakes easier to understand.

## Challenge curve

- One hidden challenge tier per completed kilometre from the start through km 15.
- Challenge caps after km 15 instead of scaling forever.
- Visible Heat remains 1–8 and advances more slowly than the hidden kilometre tier.
- Normal top speed ramps from 50 internal units at the start to 64.5 at the cap.
- Nitro cap remains 8.5 above the current normal cap.
- Traffic gets denser, reacts faster, weaves more, and changes lane more often as the run progresses.
- Perfect clean riding at normal top speed must always remain sustainable at the difficulty cap.

## K9 proximity system

The old metre economy is no longer the primary game-over model.

- Threat range: 0–3.
- `CLEAR`: threat < 1.
- `CLOSING`: threat >= 1.
- `ON YOU`: threat >= 2.
- `BUSTED`: threat reaches 3.
- An ordinary car collision is roughly one threat unit, so three ordinary mistakes in quick succession normally end the run.
- A heavy truck hit plus ejection can consume close to two units, making a second meaningful mistake dangerous.
- Side scrapes are intentionally much cheaper than full frontal/rear collisions.
- Potholes add a smaller amount of threat.
- Clean riding starts reducing threat after a five-second grace period.
- Nitro reduces threat faster and remains the strongest recovery resource.
- Driving well below the current safe pace slowly brings the K9 closer, but normal clean top-speed riding never creates automatic late-game capture.

## Traffic fairness

- Active traffic increased from 18 to 22 vehicles.
- Removed a duplicated random spawn offset that could add ~40 m of unintended empty road after recycle spacing had already been applied.
- Same-lane following and three-lane escape-corridor protection remain active.
- Lane changes start around km 3.
- Cars and trucks telegraph lane changes for roughly 0.4 seconds before beginning the move and keep blinking briefly while moving.
- Trucks remain much less likely to change lane than cars/bikes.

## Visual fixes

- Cars and trucks now face the same -Z forward direction as player/civilian motorcycles.
- Rear amber indicators are visible to the approaching player.
- Potholes have a higher-contrast dark center plus a stylized broken orange road-paint ring.
- The K9 HUD is now a segmented proximity/threat meter rather than a raw metre readout.

## Automated acceptance checks

CI asserts:

1. Difficulty increments once per kilometre and caps after km 15.
2. Top speed is higher by km 4 and does not increase beyond the km-15 cap.
3. Three ordinary car collisions in quick succession cause a bust; two do not.
4. Three light side scrapes do not equal three full crashes.
5. Clean riding substantially recovers proximity.
6. Nitro recovers proximity faster.
7. At maximum difficulty, one minute of perfect normal-top-speed riding produces zero unavoidable K9 threat.
8. Sustained slow riding still allows the K9 to close.
9. Crash/ejection recovery still returns the rider to the mounted state.
