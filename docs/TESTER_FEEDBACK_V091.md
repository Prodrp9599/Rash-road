# v0.9.1 External Tester Feedback

## Repeated themes

- Speed should increase over the run instead of staying fixed.
- Early game is too forgiving; the challenge should become noticeable by kilometre 3–4.
- Late game is too punishing if the police catch-up is mathematically unavoidable.
- Past ~15 km, difficulty should come from traffic density, faster reaction windows and readable lane changes rather than automatic police catch-up.
- Replace the highly forgiving metre-based chase economy with a proximity / mistake-pressure model closer to classic endless runners: a few meaningful mistakes bring the K9 onto the player, another mistake gets the player caught, and clean play can recover.
- Initial kilometres should generally tolerate about 2–3 meaningful mistakes, not 5–6.
- There are too many empty road stretches.
- Potholes need stronger visual readability.
- Cars need turn indicators before changing lanes.
- Trucks are visually facing the wrong direction.

## v0.9.2 response

- Add a capped distance-based speed ramp through kilometre 15.
- Extend difficulty in one-kilometre tiers through kilometre 15, while keeping an 8-step visible Heat display.
- Convert police pursuit to a proximity/threat system. Normal clean top-speed riding never causes unavoidable late-game capture.
- Collisions add threat. Three ordinary car mistakes in quick succession are enough to end a run; heavy truck/ejection combinations can end a run in two.
- Clean riding slowly reduces threat after a grace window; nitro accelerates recovery.
- Add more traffic and tighter but escape-safe spawn spacing.
- Telegraph car/truck lane changes before movement with blinking amber indicators.
- Increase pothole contrast with a broken warm hazard rim.
- Correct road-vehicle orientation so cars and trucks face the same forward direction as motorcycles.
