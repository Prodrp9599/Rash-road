# Rash Roads — Endless Chase Loop v0.8

## Product goal

The first complete game loop is an endless, score-chasing highway escape. The player is already in trouble when the run starts. A K9 highway patrol officer is pursuing Rocco from behind.

The run does **not** use a traditional health bar. The central failure state is the **pursuit gap** between Rocco and the cop.

## Pursuer

**Archetype:** German Shepherd highway patrol officer on a police motorcycle.

Why this works:
- instantly readable as law-enforcement / K9 imagery;
- strong silhouette behind Rocco;
- grounded enough for the semi-realistic animal direction;
- easy to evolve into a recurring antagonist later.

The current v0.8 pursuer is a dimensional production proxy, not final character art.

## Core state

- Start gap: **58 m**
- Maximum gap: **96 m**
- Danger: **18 m or less**
- Critical: **8 m or less**
- Caught/Busted: **0 m**

The HUD always communicates this distance.

## How the chase changes

### Player creates distance

- maintaining high speed;
- using nitro;
- very small reward for near misses.

### Cop gains distance

- low sustained speed;
- braking for too long;
- collisions with traffic;
- hitting potholes;
- gradual difficulty pressure as total run distance increases.

## Collision chase penalties

Baseline immediate penalties before severity scaling:

- Civilian bike: **4.5 m**
- Car: **8.5 m**
- Truck: **13.5 m**
- Pothole: **3 m**

A collision also reduces motorcycle speed, so mistakes create both an immediate pursuit penalty and a short-term secondary penalty while Rocco accelerates again.

Side scrapes receive a smaller severity multiplier than deep/front collisions.

## Difficulty curve

The first kilometres should be forgiving enough to learn the road.

Pursuit pressure rises continuously with run distance, capped so the system never suddenly becomes impossible. Later versions can also increase:

- traffic density;
- average traffic speed variance;
- hazard frequency;
- police behavior;
- road complexity.

## Visual staging of the cop

The pursuit gap is gameplay state measured in abstract metres. The chase camera cannot physically show a motorcycle 50 metres behind the player.

Therefore, like an endless-runner chase, the cop becomes visible in the camera volume only when the pursuit gap becomes dangerous. His on-screen separation is compressed for drama while the HUD remains the authoritative numerical distance.

- Far/safe: cop not visible.
- Closing: cop appears behind Rocco.
- Critical: cop is visibly close, lights alternate, pursuit UI pulses.
- Zero gap: BUSTED state.

The police proxy is not collidable in v0.8.

## Busted flow

At zero pursuit gap:

1. controls are disabled;
2. Rocco decelerates;
3. police closes visually;
4. BUSTED overlay appears;
5. run automatically restarts after ~2.15 seconds.

`R` manually restarts at any time.

## Explicitly deferred

Not part of v0.8:

- rider ejection;
- ragdoll;
- running back to the motorcycle;
- lifting/remounting the motorcycle;
- police physical takedown animation;
- rival biker combat;
- permanent progression/economy.

These systems should be added only after the endless pursuit loop feels fair and addictive.

## Next validation questions

1. Does 58 m feel like the right starting pressure?
2. Are car/truck mistakes costly without feeling run-ending?
3. Can a skilled player recover from ~10–15 m?
4. Does high speed reliably feel like escape progress?
5. Does nitro meaningfully help without trivialising pursuit?
6. Does the cop appearing at close range increase pressure without blocking traffic visibility?
7. Does the difficulty ramp support multi-minute runs?
