import * as THREE from 'three';
import { CHASE, createChaseState, updateChase } from './chase';
import { PLAYER } from './config';
import { createCrashState, startCrash, updateCrash } from './crash';
import { DIFFICULTY, difficultyForDistance } from './difficulty';

function assert(condition:boolean,message:string){if(!condition)throw new Error(message)}

// Difficulty must step exactly once per kilometre and then cap.
for(let km=0;km<DIFFICULTY.maxLevel+3;km++){
  const d=difficultyForDistance(km*1000+.01);
  const expected=Math.min(DIFFICULTY.maxLevel,km+1);
  assert(d.level===expected,`difficulty ${km}km expected ${expected}, got ${d.level}`);
}
assert(difficultyForDistance(99_000).maxed,'difficulty must cap at max level');

// High heat must close the police gap faster than level 1 at the same cruising speed.
const easy=createChaseState(),hard=createChaseState();
for(let i=0;i<600;i++){
  updateChase(easy,1/60,31,1,false,false);
  updateChase(hard,1/60,31,DIFFICULTY.maxLevel,false,false);
}
assert(hard.gap<easy.gap,'max heat must apply more pursuit pressure');
assert(easy.gap>=0&&easy.gap<=CHASE.maxGap,'easy chase gap out of bounds');
assert(hard.gap>=0&&hard.gap<=CHASE.maxGap,'hard chase gap out of bounds');

// External playtest tuning: by Heat 7-8, normal max-speed riding should no longer
// rebuild a large safety buffer. Heat 8 should slowly lose gap without nitro.
const heat7=createChaseState(),heat8=createChaseState(),heat8Nitro=createChaseState();
const start7=heat7.gap,start8=heat8.gap,start8Nitro=heat8Nitro.gap;
for(let i=0;i<300;i++){
  updateChase(heat7,1/60,PLAYER.maxSpeed,7,false,false);
  updateChase(heat8,1/60,PLAYER.maxSpeed,8,false,false);
  updateChase(heat8Nitro,1/60,PLAYER.nitroMaxSpeed,8,true,false);
}
assert(heat7.gap-start7<1.0,'Heat 7 normal top speed should only barely open the gap');
assert(heat8.gap<start8,'Heat 8 normal top speed should slowly lose pursuit gap');
assert(heat8Nitro.gap>start8Nitro,'Heat 8 nitro must still open pursuit distance');

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

console.log('Rash Roads logic checks passed:',{
  maxDifficulty:DIFFICULTY.maxLevel,
  easyGap:Number(easy.gap.toFixed(2)),
  hardGap:Number(hard.gap.toFixed(2)),
  heat7TopSpeedGap:Number(heat7.gap.toFixed(2)),
  heat8TopSpeedGap:Number(heat8.gap.toFixed(2)),
  heat8NitroGap:Number(heat8Nitro.gap.toFixed(2)),
  crashRecovery:'mounted',
});
