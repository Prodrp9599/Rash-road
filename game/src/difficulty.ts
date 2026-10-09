import * as THREE from 'three';

export const DIFFICULTY={
  maxLevel:8,
  metersPerLevel:1000,
  laneChangeStart:5,
  aggressiveVeerStart:4,
};

// Pursuit pressure is deliberately hand-tuned per kilometre instead of being linear.
// Heat 7 is almost pace-matched with Rocco at normal top speed; Heat 8 slightly
// outpaces normal riding. Nitro remains the reliable way to reopen the gap.
export const CHASE_PRESSURE_BY_LEVEL=[0,.14,.30,.48,.68,.90,1.14,1.28] as const;

export type DifficultyState={
  level:number;
  maxLevel:number;
  progress:number;
  maxed:boolean;
  spawnMin:number;
  spawnJitter:number;
  chasePressure:number;
  weaveAmplitude:number;
  weaveRate:number;
  laneChangeChance:number;
  trafficReaction:number;
};

export function chasePressureForLevel(level:number){
  const index=THREE.MathUtils.clamp(Math.round(level),1,DIFFICULTY.maxLevel)-1;
  return CHASE_PRESSURE_BY_LEVEL[index];
}

export function difficultyForDistance(distanceMeters:number):DifficultyState{
  const level=Math.min(DIFFICULTY.maxLevel,Math.floor(Math.max(0,distanceMeters)/DIFFICULTY.metersPerLevel)+1);
  const progress=(level-1)/(DIFFICULTY.maxLevel-1);
  const laneProgress=level<DIFFICULTY.laneChangeStart?0:(level-DIFFICULTY.laneChangeStart)/(DIFFICULTY.maxLevel-DIFFICULTY.laneChangeStart);
  return {
    level,
    maxLevel:DIFFICULTY.maxLevel,
    progress,
    maxed:level===DIFFICULTY.maxLevel,
    // Level 1 retains the v0.8 traffic spacing. By max difficulty the road is busier,
    // but the escape-lane invariant in main.ts still prevents impossible three-lane walls.
    spawnMin:THREE.MathUtils.lerp(27,19,progress),
    spawnJitter:THREE.MathUtils.lerp(31,18,progress),
    chasePressure:chasePressureForLevel(level),
    weaveAmplitude:level<DIFFICULTY.aggressiveVeerStart?0:THREE.MathUtils.lerp(.10,.46,(level-DIFFICULTY.aggressiveVeerStart)/(DIFFICULTY.maxLevel-DIFFICULTY.aggressiveVeerStart)),
    weaveRate:THREE.MathUtils.lerp(.55,1.35,progress),
    laneChangeChance:level<DIFFICULTY.laneChangeStart?0:THREE.MathUtils.lerp(.08,.42,THREE.MathUtils.clamp(laneProgress,0,1)),
    trafficReaction:THREE.MathUtils.lerp(1,1.25,progress),
  };
}

export function difficultyLabel(distanceMeters:number){
  const d=difficultyForDistance(distanceMeters);
  return `HEAT ${d.level}/${d.maxLevel}`;
}
