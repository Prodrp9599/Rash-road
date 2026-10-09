# Rash Roads v0.9.3 — Polish & Replay Loop

## Goal
Ship a cleaner external-test build that fixes visible glitches and adds the first repeat-play loop without bloating the game.

## Bug and cosmetic pass
- Keep continuous road coverage behind the chase camera; road tiles must not wrap while they are still the only tile under/behind the rider.
- Distant mesas pass the player and recycle behind the camera rather than disappearing in front of the player.
- N2O has a depletion cooldown when the tank is fully drained.
- Add browser-safe procedural engine/wind/nitro/impact/near-miss/game-over audio, enabled by the start interaction.
- Add multiple deterministic civilian car, truck, and bike visual variants.

## Replay loop
- Explicit start screen instead of immediately dropping into the run.
- Explicit game-over screen instead of silently auto-restarting.
- Persist best distance and best score locally.
- Near-miss streaks build a score multiplier; collisions reset the streak.
- One-button/one-click instant retry from game over.
- Kilometre milestone feedback makes the difficulty ramp visible.

## Design principle
Replayability should come from readable skill growth, personal-best pressure, short feedback loops, and meaningful risk/reward rather than unavoidable loss or arbitrary punishment.

## Next layer after validation
If the basic loop tests well, add meta-progression gradually: bolts/currency, short missions, rider/bike unlocks, and rotating challenges. Do not add these before the core run/retry loop is fun.
