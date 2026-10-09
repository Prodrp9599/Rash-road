import * as THREE from 'three';

export const DIFFICULTY={
  maxLevel:8,
  metersPerLevel:1000,
  laneChangeStart:5,
  aggressiveVeerStart:4,
};

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
    // Step pressure: changes only when the kilometre level changes.
    chasePressure:(level-1)*.11,
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
