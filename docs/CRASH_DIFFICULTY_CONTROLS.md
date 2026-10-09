# Rash Roads — Crash, Difficulty & Controls v0.9

## Nitro economy

- Passive nitro refill: **1.25 units/sec** (reduced from 5.5).
- Near miss reward: **+12 nitro**.
- Near misses no longer increase the police pursuit gap.
- Nitro drain remains 23 units/sec for now.

The intent is to make nitro primarily something the player earns through risky clean driving, not something that passively refills between every obstacle.

## Kilometre difficulty ladder

Difficulty increases at each whole kilometre and caps at **Heat 8**.

- 0–0.99 km: Heat 1
- 1–1.99 km: Heat 2
- ...
- 7 km onward: Heat 8 (maximum)

Each step increases some combination of:

- K9 pursuit pressure
- traffic density
- traffic lateral movement
- civilian lane-change probability
- traffic reaction rate

Difficulty does not continue rising after Heat 8.

## Escape-path invariant

The traffic director must never intentionally generate an unavoidable three-lane wall.

At spawn time and before a civilian vehicle commits to a lane change, the director checks the nearby longitudinal slice. If the move would block all three lane corridors simultaneously, that spawn/move is rejected.

This does **not** guarantee safety if the player enters the wrong lane too late. The intended challenge is reading the road early enough to choose the available route.

## Civilian veering

- Heat 1–3: essentially stable civilian lane position.
- Heat 4: gentle lane wander begins.
- Heat 5+: selected bikes/cars may begin changing to adjacent lanes when there is physical space.
- Heat 8: maximum wander/lane-change pressure.
- Trucks remain much less likely to veer than bikes/cars.

The motion must look like believable civilian instability/lane changes, not arcade teleportation.

## Hard-crash state machine

First-pass crash sequence:

`mounted → airborne → sliding → recovering → running → remounting → mounted`

Hard ejection is reserved for sufficiently deep, high-speed frontal impacts. Side scrapes remain mounted contacts.

During an ejection:

- normal steering/brake/nitro control is locked;
- bike speed collapses;
- the K9 pursuit continues closing in;
- the police rider can catch the player during recovery;
- Rocco is visually separated from the bike;
- Rocco slides, gets up, runs toward the bike and remounts;
- remount grants a short collision-protection window.

This is a production prototype of the sequence, not final ragdoll/animation quality.

## Future controls — not active in v0.9

### Desktop target

Move away from keyboard-only steering toward **pointer/mouse steering** so the rider follows a continuous lateral intention rather than discrete A/D presses. Keyboard remains useful as fallback/accessibility input.

### Mobile target

Primary mobile steering should use device motion where supported:

- gyroscope / device orientation for steering intent;
- accelerometer can contribute to lean/gesture interpretation after testing;
- on-screen touch fallback is mandatory for devices/browsers that deny sensor permission.

Sensor input must be calibrated at run start and have dead-zone/sensitivity controls. The game must never assume gyro permission will be granted.

## Review order

1. Crash readability and recovery duration
2. Whether police pressure during a crash feels fair
3. Nitro scarcity and near-miss reward size
4. Heat-step pacing per kilometre
5. Veering readability
6. Escape-path fairness
7. Only after these are stable: mouse and mobile sensor controls
