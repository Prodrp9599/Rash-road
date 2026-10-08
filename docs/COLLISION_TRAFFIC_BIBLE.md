# Rash Roads Collision & Traffic Bible — v1.2

## Principle
Visual mesh, collision hull and damage response are separate systems.

## Current classes
- Civilian bike: narrow, light, 4 base damage.
- Car: medium footprint, 10 base damage.
- Truck: wide/heavy, 16 base damage.
- Pothole: low damage, short suspension/speed penalty.

## Contact response
- **Scrape**: shallow side penetration. Small damage, small shove, minimal speed loss.
- **Side bump**: moderate lateral overlap. Medium shove and wobble.
- **Deep/front impact**: strong speed loss, damage and knockback.
- One continuous overlap may only deal one damage event until recovery/invulnerability completes.

## Future ejection system (reserved, not enabled)
`mounted -> ejected -> slide -> recover -> run_to_bike -> lift/remount -> mounted`

Ejection should trigger only for high-energy impacts or special combat, not ordinary side scrapes.

## Fairness
Collision hulls should generally be slightly tighter than visible geometry. Close visual misses should remain misses.
