import * as THREE from 'three';
import type { TrafficKind } from './config';

export const CHASE={
  startGap:58,
  maxGap:96,
  visibleGap:36,
  dangerGap:18,
  criticalGap:8,
  escapePace:32,
  slowPace:25,
  restartDelay:2.15,
  hitPenalty:{bike:4.5,car:8.5,truck:13.5} satisfies Record<TrafficKind,number>,
  potholePenalty:3.0,
};

export type ChaseState={
  gap:number;
  busted:boolean;
  bustedFor:number;
  pressure:number;
  lastPenalty:number;
};

export function createChaseState():ChaseState{
  return {gap:CHASE.startGap,busted:false,bustedFor:0,pressure:0,lastPenalty:0};
}

export function resetChase(state:ChaseState){
  state.gap=CHASE.startGap;
  state.busted=false;
  state.bustedFor=0;
  state.pressure=0;
  state.lastPenalty=0;
}

export function applyTrafficPenalty(state:ChaseState,kind:TrafficKind,severity:number){
  if(state.busted)return 0;
  const penalty=CHASE.hitPenalty[kind]*THREE.MathUtils.clamp(.45+severity*.72,.45,1.15);
  state.gap=Math.max(0,state.gap-penalty);
  state.lastPenalty=penalty;
  if(state.gap<=0)state.busted=true;
  return penalty;
}

export function applyPotholePenalty(state:ChaseState){
  if(state.busted)return 0;
  state.gap=Math.max(0,state.gap-CHASE.potholePenalty);
  state.lastPenalty=CHASE.potholePenalty;
  if(state.gap<=0)state.busted=true;
  return CHASE.potholePenalty;
}

export function rewardNearMiss(state:ChaseState){
  if(state.busted)return;
  state.gap=Math.min(CHASE.maxGap,state.gap+.35);
}

export function updateChase(
  state:ChaseState,
  dt:number,
  speed:number,
  distanceMeters:number,
  nitro:boolean,
  braking:boolean,
){
  if(state.busted){state.bustedFor+=dt;return}

  // Difficulty rises gradually with run distance, but never spikes suddenly.
  const distancePressure=Math.min(.82,(distanceMeters/1000)*.055);
  let delta=0;
  if(speed>=CHASE.escapePace){
    const fast=THREE.MathUtils.clamp((speed-CHASE.escapePace)/20,0,1);
    delta=.38+fast*.9;
  }else if(speed<=CHASE.slowPace){
    const slow=THREE.MathUtils.clamp((CHASE.slowPace-speed)/15,0,1);
    delta=-(.85+slow*1.35);
  }else{
    const t=(speed-CHASE.slowPace)/(CHASE.escapePace-CHASE.slowPace);
    delta=THREE.MathUtils.lerp(-.45,.24,t);
  }

  if(nitro)delta+=.72;
  if(braking)delta-=.48;
  delta-=distancePressure;

  state.pressure=THREE.MathUtils.lerp(state.pressure,-delta,.08);
  state.gap=THREE.MathUtils.clamp(state.gap+delta*dt,0,CHASE.maxGap);
  state.lastPenalty=Math.max(0,state.lastPenalty-dt*7);
  if(state.gap<=0)state.busted=true;
}

export function chaseLevel(state:ChaseState){
  if(state.gap<=CHASE.criticalGap)return 'critical' as const;
  if(state.gap<=CHASE.dangerGap)return 'danger' as const;
  return 'safe' as const;
}
