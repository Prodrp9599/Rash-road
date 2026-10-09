import * as THREE from 'three';
import { applyTrafficPenalty, createChaseState, updateChase } from './chase';
import { createCrashState, startCrash, updateCrash } from './crash';
import { DIFFICULTY, difficultyForDistance } from './difficulty';

function assert(condition:boolean,message:string){if(!condition)throw new Error(message)}

// Difficulty must step once per kilometre through km 15 and then cap.
for(let km=0;km<22;km++){
  const d=difficultyForDistance(km*1000+.01);
  const expected=Math.min(DIFFICULTY.maxLevel,km+1);
  assert(d.level===expected,`difficulty ${km}km expected ${expected}, got ${d.level}`);
}
const start=difficultyForDistance(0);
const km4=difficultyForDistance(4_001);
const km15=difficultyForDistance(15_001);
const km40=difficultyForDistance(40_000);
assert(km4.normalMaxSpeed>start.normalMaxSpeed,'speed must noticeably ramp by km 4');
assert(km15.normalMaxSpeed===km40.normalMaxSpeed,'speed must cap after km 15');
assert(km15.heat===DIFFICULTY.maxHeat,'visible Heat must reach its cap by the late game');
assert(km15.spawnMin<start.spawnMin,'late traffic spacing must be denser than early traffic spacing');

// Proximity system: roughly three ordinary car mistakes in quick succession end a run.
const strikes=createChaseState();
applyTrafficPenalty(strikes,'car',.6,false);
assert(!strikes.busted,'one ordinary car mistake must not bust the player');
applyTrafficPenalty(strikes,'car',.6,false);
assert(!strikes.busted,'two ordinary car mistakes must remain recoverable');
applyTrafficPenalty(strikes,'car',.6,false);
assert(strikes.busted,'three ordinary car mistakes should be enough to get caught');

// Glancing side scrapes are forgiving and should not behave like full crashes.
const scrapes=createChaseState();
for(let i=0;i<3;i++)applyTrafficPenalty(scrapes,'car',.2,true);
assert(!scrapes.busted,'three light side scrapes should not equal three full crashes');

// Clean riding recovers proximity after the grace period; nitro accelerates recovery.
const clean=createChaseState();
applyTrafficPenalty(clean,'car',.6,false);
const afterHit=clean.threat;
for(let i=0;i<1200;i++)updateChase(clean,1/60,start.normalMaxSpeed,start.safePace,start.recoveryRate,false,false);
assert(clean.threat<afterHit*.25,'sustained clean riding should substantially recover pursuit proximity');

const nitro=createChaseState();
applyTrafficPenalty(nitro,'car',.6,false);
for(let i=0;i<300;i++)updateChase(nitro,1/60,start.nitroMaxSpeed,start.safePace,start.recoveryRate,true,false);
assert(nitro.threat<afterHit*.35,'nitro should quickly create breathing room after a mistake');

// Critical late-game fairness rule: max difficulty never catches perfect normal-top-speed play by itself.
const late=createChaseState();
for(let i=0;i<3600;i++)updateChase(late,1/60,km15.normalMaxSpeed,km15.safePace,km15.recoveryRate,false,false);
assert(!late.busted&&late.threat<.01,'late game must not contain unavoidable police catch-up at normal top speed');

// Slowing well below the safe pace still lets the K9 close in.
const slow=createChaseState();
for(let i=0;i<1200;i++)updateChase(slow,1/60,20,km4.safePace,km4.recoveryRate,false,false);
assert(slow.threat>1,'sustained slow riding must increase police proximity');

// Ejection lifecycle must always recover back to mounted without external intervention.
const scene=new THREE.Scene();
const player=new THREE.Group();
const mountedRider=new THREE.Group();mountedRider.name='rider';player.add(mountedRider);scene.add(player);
const crash=createCrashState(scene);
assert(startCrash(crash,player,0,1),'crash should start from mounted');
let finished=false;
for(let i=0;i<420;i++){
  const result=updateCrash(crash,player,1/60);
  if(result.finished){finished=true;break}
}
assert(finished,'crash recovery did not complete within seven seconds');
assert(crash.phase==='mounted','crash recovery must end mounted');
assert(mountedRider.visible,'mounted rider must be restored after recovery');
assert(Math.abs(player.position.z)<.001,'bike must return to gameplay anchor after remount');

console.log('Rash Roads v0.9.2 logic checks passed:',{
  startTopSpeed:start.normalMaxSpeed,
  km4TopSpeed:km4.normalMaxSpeed,
  cappedTopSpeed:km15.normalMaxSpeed,
  threeMistakesBust:strikes.busted,
  cleanRecovery:Number(clean.threat.toFixed(2)),
  nitroRecovery:Number(nitro.threat.toFixed(2)),
  latePerfectThreat:Number(late.threat.toFixed(2)),
  crashRecovery:'mounted',
});
