import * as THREE from 'three';

export const DIFFICULTY={
  // One hidden challenge tier per kilometre from 0 km through 15 km, then cap.
  maxLevel:16,
  maxHeat:8,
  metersPerLevel:1000,
  laneChangeStart:4,
  aggressiveVeerStart:4,
};

// A capped speed ramp avoids the endless-runner failure mode where a linear speed
// increase eventually becomes mathematically impossible. The first noticeable jump
// arrives around km 3-4; by km 15 the reaction window is substantially tighter.
export const SPEED_BY_LEVEL=[
  50.0,50.8,51.8,53.0,54.4,55.6,56.7,57.8,
  58.9,60.0,61.0,61.8,62.6,63.3,64.0,64.5,
] as const;

export type DifficultyState={
  level:number;
  maxLevel:number;
  heat:number;
  maxHeat:number;
  progress:number;
  maxed:boolean;
  spawnMin:number;
  spawnJitter:number;
  weaveAmplitude:number;
  weaveRate:number;
  laneChangeChance:number;
  trafficReaction:number;
  trafficSpeedScale:number;
  normalMaxSpeed:number;
  nitroMaxSpeed:number;
  safePace:number;
  recoveryRate:number;
};

export function difficultyForDistance(distanceMeters:number):DifficultyState{
  const level=Math.min(DIFFICULTY.maxLevel,Math.floor(Math.max(0,distanceMeters)/DIFFICULTY.metersPerLevel)+1);
  const progress=(level-1)/(DIFFICULTY.maxLevel-1);
  const heat=Math.min(DIFFICULTY.maxHeat,Math.ceil(level/2));
  const laneProgress=level<DIFFICULTY.laneChangeStart?0:(level-DIFFICULTY.laneChangeStart)/(DIFFICULTY.maxLevel-DIFFICULTY.laneChangeStart);
  const normalMaxSpeed=SPEED_BY_LEVEL[level-1];
  return {
    level,
    maxLevel:DIFFICULTY.maxLevel,
    heat,
    maxHeat:DIFFICULTY.maxHeat,
    progress,
    maxed:level===DIFFICULTY.maxLevel,
    // More consistent traffic presence than v0.9.1, while main.ts still enforces
    // same-lane spacing and the three-lane escape-corridor invariant.
    spawnMin:THREE.MathUtils.lerp(23,15.5,progress),
    spawnJitter:THREE.MathUtils.lerp(20,10.5,progress),
    weaveAmplitude:level<DIFFICULTY.aggressiveVeerStart?0:THREE.MathUtils.lerp(.08,.43,(level-DIFFICULTY.aggressiveVeerStart)/(DIFFICULTY.maxLevel-DIFFICULTY.aggressiveVeerStart)),
    weaveRate:THREE.MathUtils.lerp(.52,1.38,progress),
    laneChangeChance:level<DIFFICULTY.laneChangeStart?0:THREE.MathUtils.lerp(.07,.32,THREE.MathUtils.clamp(laneProgress,0,1)),
    trafficReaction:THREE.MathUtils.lerp(1,1.33,progress),
    trafficSpeedScale:THREE.MathUtils.lerp(1,1.12,progress),
    normalMaxSpeed,
    nitroMaxSpeed:normalMaxSpeed+8.5,
    // Clean riding at normal top speed always beats this pace, including after 15 km.
    // Late difficulty therefore comes from traffic/reflexes, not deterministic catch-up.
    safePace:normalMaxSpeed*THREE.MathUtils.lerp(.74,.88,progress),
    recoveryRate:THREE.MathUtils.lerp(.075,.05,progress),
  };
}

export function difficultyLabel(distanceMeters:number){
  const d=difficultyForDistance(distanceMeters);
  return `HEAT ${d.heat}/${d.maxHeat}`;
}
