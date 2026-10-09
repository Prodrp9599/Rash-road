# Rash Roads v0.9.1 — External Playtest Candidate

This build is intentionally feature-frozen for first external playtests. The goal is to validate the endless chase loop before adding more systems.

## Locked playtest rules

- Steering remains keyboard-first: A/D or arrow keys.
- Brake remains available on S / Down Arrow. It is an emergency control, not the main loop.
- Nitro remains Shift.
- Passive nitro refill stays deliberately slow.
- Near miss feedback is qualitative in the HUD (`NITRO +`), while the internal reward remains tuned numerically.
- Heat rises exactly once per completed kilometre and caps at Heat 8.
- Heat 7 and Heat 8 make the K9 patrol effectively match normal top-speed riding. Clean driving should mostly preserve the pursuit gap rather than expand it.
- Nitro is the primary reliable way to open meaningful pursuit distance at Heat 7–8.
- Small mistakes at max Heat should therefore compound quickly because ordinary riding no longer rebuilds a large safety buffer.
- Collision/ejection, escape-corridor protection, traffic weaving and remount recovery remain enabled.

## External test questions

1. Is steering immediately understandable and satisfying?
2. Is the K9 pursuit pressure readable without explanation?
3. Does Heat progression feel noticeably harder each kilometre?
4. At Heat 7–8, does nitro feel important rather than optional?
5. Are crashes dramatic but recoverable?
6. Does braking feel useful, unnecessary, or confusing?
7. Do any traffic formations feel impossible or unfair?
8. What ends most runs: bad decisions, collisions, lack of nitro, or unclear hazards?

## Deferred until after feedback

- Mouse steering
- Gyroscope / accelerometer steering
- Rival combat
- Economy / upgrades
- Additional characters / environments
- More pickups and powerups
