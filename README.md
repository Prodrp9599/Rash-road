# Rash Roads

A browser-first stylized 3D arcade motorcycle game: outlaw animal bikers, civilian highway traffic, physical collisions, and eventually Road-Rash-style combat/ejection/recovery.

## Current phase

**v0.6 — True 3D foundation**

The current production focus is deliberately narrow:

1. Real 3D road, traffic, environment and lighting.
2. Consistent camera scale and traffic readability.
3. Fair side/front/rear collision behavior.
4. Rocco + starter-bike hero asset pipeline.
5. No rival combat until the riding/rendering slice looks and feels convincing.

## Art direction

**Acid Asphalt** — dimensional stylized 3D, semi-realistic cartoon proportions, worn leather/metal/asphalt, dusty warm world tones, and controlled cyan/orange/punk accents.

The game should never look like flat artwork pasted over a road. Gameplay objects and important background elements should have depth, cast/receive light where practical, and sit coherently in the same world.

## Repo layout

- `game/` — browser game source
- `assets/` — production-ready models, textures, UI and audio
- `reference/` — canonical concept/modeling references
- `docs/` — visual, collision and production specifications
- `tests/` — deterministic gameplay/collision validation

## Studio rule

Define → build → test → play-review → update the source of truth → repeat.
