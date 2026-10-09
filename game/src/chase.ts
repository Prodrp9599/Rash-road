import * as THREE from 'three';
import type { TrafficKind } from './config';

export const CHASE={
  maxThreat:3,
  startGap:56,
  maxGap:56,
  visibleGap:40,
  restartDelay:2.15,
  cleanGrace:5.0,
  hitThreat:{bike:.85,car:1.05,truck:1.25} satisfies Record<TrafficKind,number>,
  sideThreat:{bike:.28,car:.36,truck:.46} satisfies Record<TrafficKind,number>,
  potholeThreat:.48,
  ejectionThreat:.55,
  nitroRecovery:.20,
};

export type ChaseState={
  gap:number;
  threat:number;
  busted:boolean;
  bustedFor:number;
  pressure:number;
  lastPenalty:number;
  sinceMistake:number;
  mistakes:number;
};

function gapForThreat(threat:number){
  const t=THREE.MathUtils.clamp(threat/CHASE.maxThreat,0,1);
  return THREE.MathUtils.lerp(CHASE.maxGap,4,t);
}

function addThreat(state:ChaseState,amount:number){
  if(state.busted)return 0;
  state.threat=THREE.MathUtils.clamp(state.threat+amount,0,CHASE.maxThreat);
  state.lastPenalty=amount;
  state.sinceMistake=0;
  state.mistakes++;
  state.gap=gapForThreat(state.threat);
  if(state.threat>=CHASE.maxThreat)state.busted=true;
  return amount;
}

export function createChaseState():ChaseState{
  return {gap:CHASE.startGap,threat:0,busted:false,bustedFor:0,pressure:0,lastPenalty:0,sinceMistake:99,mistakes:0};
}

export function resetChase(state:ChaseState){
  state.gap=CHASE.startGap;
  state.threat=0;
  state.busted=false;
  state.bustedFor=0;
  state.pressure=0;
  state.lastPenalty=0;
  state.sinceMistake=99;
  state.mistakes=0;
}

export function applyTrafficPenalty(state:ChaseState,kind:TrafficKind,severity:number,side=false){
  if(state.busted)return 0;
  const s=THREE.MathUtils.clamp(severity,0,1.2);
  const base=side?CHASE.sideThreat[kind]:CHASE.hitThreat[kind];
  const amount=side?base*(.82+s*.45):base*(.82+s*.28);
  return addThreat(state,amount);
}

export function applyPotholePenalty(state:ChaseState){
  return addThreat(state,CHASE.potholeThreat);
}

export function applyEjectionPenalty(state:ChaseState){
  return addThreat(state,CHASE.ejectionThreat);
}

export function updateChase(
  state:ChaseState,
  dt:number,
  speed:number,
  safePace:number,
  recoveryRate:number,
  nitro:boolean,
  braking:boolean,
){
  if(state.busted){state.bustedFor+=dt;return}

  state.sinceMistake+=dt;

  // The K9 no longer wins just because the run lasted long enough. The police only
  // gain meaningful proximity when the player is slowed below the current safe pace
  // or makes contact mistakes. Normal clean top-speed riding is always sustainable.
  const paceDeficit=THREE.MathUtils.clamp((safePace-speed)/Math.max(1,safePace),0,1);
  let build=0;
  if(paceDeficit>0)build=(.035+paceDeficit*.24)*dt;
  if(braking)build+=.025*dt;
  state.threat=Math.min(CHASE.maxThreat,state.threat+build);

  const clean=state.sinceMistake>=CHASE.cleanGrace&&speed>=safePace*.94&&!braking;
  if(clean)state.threat=Math.max(0,state.threat-recoveryRate*dt);
  if(nitro)state.threat=Math.max(0,state.threat-CHASE.nitroRecovery*dt);

  state.pressure=THREE.MathUtils.lerp(state.pressure,state.threat/CHASE.maxThreat,.08);
  state.gap=THREE.MathUtils.lerp(state.gap,gapForThreat(state.threat),1-Math.exp(-5.5*dt));
  state.lastPenalty=Math.max(0,state.lastPenalty-dt*2.4);
  if(state.threat>=CHASE.maxThreat)state.busted=true;
}

export function chaseLevel(state:ChaseState){
  if(state.threat>=2)return 'critical' as const;
  if(state.threat>=1)return 'danger' as const;
  return 'safe' as const;
}

export function proximityLabel(state:ChaseState){
  if(state.busted)return 'BUSTED';
  if(state.threat>=2)return 'ON YOU';
  if(state.threat>=1)return 'CLOSING';
  return 'CLEAR';
}
