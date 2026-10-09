import './style.css';
import * as THREE from 'three';
import { animateRider, createModel, setNitroVisual, setTurnIndicator, spinWheels } from './models';
import { addLighting, buildEnvironment } from './environment';
import { createDustSystem } from './effects';
import { CHASE, applyEjectionPenalty, applyPotholePenalty, applyTrafficPenalty, chaseLevel, createChaseState, proximityLabel, resetChase, updateChase } from './chase';
import { createPolicePursuer, updatePolicePursuer } from './police';
import { crashActive, createCrashState, resetCrash, startCrash, updateCrash } from './crash';
import { difficultyForDistance } from './difficulty';
import { LANES, PLAYER, TRAFFIC, type TrafficKind } from './config';
import type { TrafficEntity, PotholeEntity } from './types';

const NITRO={passiveRefill:1.25,nearMissReward:12,drain:23};

const app=document.querySelector<HTMLDivElement>('#app')!;
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.04;
app.prepend(renderer.domElement);

const scene=new THREE.Scene();
addLighting(scene);
const environment=buildEnvironment(scene);
const camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,560);
camera.position.set(0,4.55,9.8);
const clock=new THREE.Clock();
const keys=new Set<string>();
let seed=8441;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};

addEventListener('keydown',e=>{
  keys.add(e.code);
  if(['ArrowLeft','ArrowRight','ArrowDown','Space'].includes(e.code))e.preventDefault();
  if(e.code==='KeyR')resetRun();
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

const roadSegments:THREE.Object3D[]=[];
for(let i=0;i<11;i++){
  const road=createModel('road');road.position.set(0,0,-30-i*60);scene.add(road);roadSegments.push(road);
}
const guardrails:THREE.Object3D[]=[];
for(let i=0;i<94;i++)for(const x of [-4.55,4.55]){
  const rail=createModel('guardrail');rail.position.set(x,0,-3-i*6);scene.add(rail);guardrails.push(rail);
}

const player=createModel('player');
player.scale.setScalar(1.06);
player.position.y=.02;
scene.add(player);
const police=createPolicePursuer();
scene.add(police);
const crash=createCrashState(scene);
const dust=createDustSystem(scene);

const traffic:TrafficEntity[]=[];
const potholes:PotholeEntity[]=[];
const typeBag:TrafficKind[]=['bike','bike','car','car','car','truck'];

let playerX=0,speed=28,n2o=100,distance=0,hits=0,near=0,inv=0,steer=0,wobble=0,cameraKick=0,impactSide=0,nearBonusFor=0;
const chase=createChaseState();
const ui={
  speed:el('speed'),distance:el('distance'),hits:el('hits'),near:el('near'),nitro:el('nitro'),impact:el('impact'),
  pursuit:el('pursuit'),pursuitLabel:el('pursuitLabel'),pursuitFill:el('pursuitFill'),busted:el('busted'),
  heat:el('heat'),bonus:el('bonus'),crashStatus:el('crashStatus'),
};
function el(id:string){return document.getElementById(id)!}
function flash(){ui.impact.classList.remove('on');void ui.impact.clientWidth;ui.impact.classList.add('on')}
function flashNearMiss(){nearBonusFor=.85;ui.bonus.classList.remove('on');void ui.bonus.clientWidth;ui.bonus.classList.add('on')}

function nearestLane(x:number){
  let best=0,bestD=Infinity;
  for(let i=0;i<LANES.length;i++){const d=Math.abs(x-LANES[i]);if(d<bestD){best=i;bestD=d}}
  return best;
}
function plannedLane(o:TrafficEntity){return o.pendingLane ?? o.targetLane ?? o.lane}

function blockedLanesNear(z:number,except?:TrafficEntity){
  const blocked=new Set<number>();
  for(const other of traffic){
    if(other===except||Math.abs(other.z-z)>8.5)continue;
    blocked.add(plannedLane(other));
  }
  return blocked;
}

function wouldSealRoad(candidateLane:number,z:number,except?:TrafficEntity){
  const blocked=blockedLanesNear(z,except);
  blocked.add(candidateLane);
  return blocked.size>=3;
}

function laneClear(candidateLane:number,z:number,except?:TrafficEntity){
  return !traffic.some(other=>other!==except&&plannedLane(other)===candidateLane&&Math.abs(other.z-z)<10.5);
}

function chooseSpawn(t:TrafficEntity,baseZ:number){
  let lane=0,z=baseZ;
  // v0.9.1 accidentally added up to another 40 m of random spacing here after
  // recycle() had already applied its spawn gap, creating long empty stretches.
  // Keep the requested base position and only move farther back to resolve conflicts.
  for(let attempt=0;attempt<12;attempt++){
    lane=Math.floor(rnd()*3);
    z=baseZ-attempt*5.5;
    const candidateLength=TRAFFIC[t.kind].length;
    const blockedSameLane=traffic.some(other=>{
      if(other===t||plannedLane(other)!==lane)return false;
      const safe=(candidateLength+TRAFFIC[other.kind].length)*.5+7;
      return Math.abs(other.z-z)<safe;
    });
    if(!blockedSameLane&&!wouldSealRoad(lane,z,t))break;
  }
  return {lane,z};
}

function resetTraffic(t:TrafficEntity,baseZ:number){
  const d=difficultyForDistance(distance);
  t.kind=typeBag[Math.floor(rnd()*typeBag.length)];
  const spawn=chooseSpawn(t,baseZ);
  t.lane=spawn.lane;
  t.targetLane=spawn.lane;
  t.pendingLane=null;
  t.indicatorDir=0;
  t.indicatorTimer=0;
  t.x=LANES[t.lane]+(t.kind==='bike'?(rnd()-.5)*.30:(rnd()-.5)*.08);
  t.z=spawn.z;
  const rawSpeed=TRAFFIC[t.kind].minSpeed+rnd()*(TRAFFIC[t.kind].maxSpeed-TRAFFIC[t.kind].minSpeed);
  t.desiredSpeed=rawSpeed*d.trafficSpeedScale;
  t.speed=t.desiredSpeed;
  t.hit=false;t.near=false;
  t.veerPhase=rnd()*Math.PI*2;
  t.veerRate=d.weaveRate*(.75+rnd()*.5);
  t.veerAmp=d.weaveAmplitude*(t.kind==='bike'?1:t.kind==='car'?.68:.12)*(.65+rnd()*.5);
  t.veerCooldown=1.4+rnd()*4.2;
  if(t.object.parent)scene.remove(t.object);
  t.object=createModel(t.kind);
  t.object.position.set(t.x,0,t.z);
  t.object.userData.wobble=0;
  scene.add(t.object);
}

for(let i=0;i<22;i++){
  const t={} as TrafficEntity;
  t.object=new THREE.Group();
  t.kind='car';t.lane=0;t.targetLane=0;t.pendingLane=null;t.indicatorDir=0;t.indicatorTimer=0;
  t.x=0;t.z=0;t.speed=0;t.desiredSpeed=0;t.hit=false;t.near=false;
  t.veerPhase=0;t.veerRate=0;t.veerAmp=0;t.veerCooldown=0;
  resetTraffic(t,-38-i*17);
  traffic.push(t);
}
for(let i=0;i<3;i++){
  const object=createModel('pothole');
  const p={x:LANES[Math.floor(rnd()*3)]+(rnd()-.5)*.5,z:-125-i*115,hit:false,object};
  object.position.set(p.x,.02,p.z);scene.add(object);potholes.push(p);
}

function shouldEject(kind:TrafficKind,side:boolean,penetration:number,impactSpeed:number){
  if(side)return false;
  if(kind==='truck')return impactSpeed>34&&penetration>.46;
  if(kind==='car')return impactSpeed>39&&penetration>.68;
  return impactSpeed>47&&penetration>.84;
}

function resolveContact(o:TrafficEntity){
  if(chase.busted||crashActive(crash)||inv>0||o.hit)return;
  const s=TRAFFIC[o.kind];
  const dx=Math.abs(playerX-o.x);
  const lateralThreshold=PLAYER.width+s.width;
  const longitudinalThreshold=(PLAYER.length+s.length)*.42;

  if(Math.abs(o.z)<longitudinalThreshold&&dx<lateralThreshold){
    const impactSpeed=speed;
    const penetration=1-dx/lateralThreshold;
    const side=Math.abs(o.z)<Math.min(.95,longitudinalThreshold*.42)&&penetration<.38;
    const direction=Math.sign(playerX-o.x||1);
    const shove=o.kind==='truck'?.44:o.kind==='car'?.29:.18;
    playerX+=direction*shove*(.48+penetration);
    speed*=side?.93:o.kind==='truck'?(penetration>.55?.63:.82):o.kind==='car'?(penetration>.55?.75:.88):.92;

    wobble+=direction*(side?.09:.19)*(o.kind==='truck'?1.35:o.kind==='car'?1:.72);
    cameraKick=Math.max(cameraKick,side?.07:.17);
    impactSide=direction;
    o.object.userData.wobble=-direction*(side?.055:.13);
    applyTrafficPenalty(chase,o.kind,side?.15+penetration*.25:penetration,side);
    hits++;
    o.hit=true;
    inv=s.postHitInv;
    flash();

    if(shouldEject(o.kind,side,penetration,impactSpeed)&&startCrash(crash,player,playerX,direction)){
      applyEjectionPenalty(chase);
      speed=Math.min(16,Math.max(11,speed*.40));
      inv=3.6;
      cameraKick=.28;
    }
  }else if(!o.near&&o.z>-1.15&&o.z<1.15&&speed>34&&dx<lateralThreshold+.55&&dx>=lateralThreshold){
    near++;
    o.near=true;
    n2o=Math.min(100,n2o+NITRO.nearMissReward);
    flashNearMiss();
  }
}

function updateTrafficBehavior(dt:number){
  const d=difficultyForDistance(distance);
  const blinkOn=Math.sin(performance.now()/1000*12)>0;
  for(const o of traffic){
    o.veerCooldown-=dt;
    o.veerPhase+=dt*o.veerRate;
    o.veerAmp=THREE.MathUtils.lerp(o.veerAmp,d.weaveAmplitude*(o.kind==='bike'?1:o.kind==='car'?.68:.12),.015);
    o.veerRate=THREE.MathUtils.lerp(o.veerRate,d.weaveRate,.01);

    if(o.indicatorTimer>0){
      o.indicatorTimer=Math.max(0,o.indicatorTimer-dt);
      // Cars/trucks signal before committing to the lateral move.
      if(o.pendingLane!==null&&o.indicatorTimer<=.55){o.targetLane=o.pendingLane;o.pendingLane=null}
      if(o.indicatorTimer<=0)o.indicatorDir=0;
    }

    if(o.veerCooldown<=0&&o.pendingLane===null&&o.indicatorTimer<=0){
      o.veerCooldown=2.0+rnd()*3.2;
      const vehicleChance=o.kind==='truck'?.10:1;
      if(rnd()<d.laneChangeChance*vehicleChance){
        const dir=(rnd()<.5?-1:1) as -1|1;
        const candidate=o.targetLane+dir;
        if(candidate>=0&&candidate<LANES.length&&laneClear(candidate,o.z,o)&&!wouldSealRoad(candidate,o.z,o)){
          if(o.kind==='car'||o.kind==='truck'){
            o.pendingLane=candidate;
            o.indicatorDir=dir;
            o.indicatorTimer=.95;
          }else{
            o.targetLane=candidate;
          }
        }
      }
    }

    setTurnIndicator(o.object,o.indicatorDir,o.indicatorTimer>0&&blinkOn);
    const weave=Math.sin(o.veerPhase)*o.veerAmp;
    const targetX=LANES[o.targetLane]+weave;
    o.x=THREE.MathUtils.lerp(o.x,targetX,1-Math.exp(-dt*(.8+d.progress*.7)));
    o.lane=nearestLane(o.x);
  }
}

function updateTrafficFollowing(dt:number){
  const d=difficultyForDistance(distance);
  for(const o of traffic){
    let target=o.desiredSpeed;
    let leader:TrafficEntity|undefined;
    let bestGap=Infinity;
    for(const other of traffic){
      if(other===o||plannedLane(other)!==plannedLane(o)||other.z>=o.z)continue;
      const centerGap=o.z-other.z;
      const clearGap=centerGap-(TRAFFIC[o.kind].length+TRAFFIC[other.kind].length)*.5;
      if(clearGap<bestGap){bestGap=clearGap;leader=other}
    }
    if(leader){
      const desiredGap=TRAFFIC[o.kind].followGap+o.speed*.12;
      if(bestGap<desiredGap){
        const pressure=THREE.MathUtils.clamp(1-bestGap/Math.max(1,desiredGap),0,1);
        target=Math.min(target,leader.speed-1.1*pressure);
      }
    }
    const response=(target<o.speed?5.5:1.8)*d.trafficReaction;
    const minSpeed=TRAFFIC[o.kind].minSpeed*.72*d.trafficSpeedScale;
    const maxSpeed=TRAFFIC[o.kind].maxSpeed*d.trafficSpeedScale;
    o.speed=THREE.MathUtils.lerp(o.speed,THREE.MathUtils.clamp(target,minSpeed,maxSpeed),1-Math.exp(-response*dt));
  }
}

function recycle(){
  const d=difficultyForDistance(distance);
  let far=Math.min(...traffic.map(o=>o.z),-150);
  for(const o of traffic)if(o.z>12){far-=d.spawnMin+rnd()*d.spawnJitter;resetTraffic(o,far)}
}

function scrollWorld(dt:number){
  const dz=speed*dt;
  for(const road of roadSegments){road.position.z+=dz;if(road.position.z>30)road.position.z-=660}
  for(const rail of guardrails){rail.position.z+=dz;if(rail.position.z>12)rail.position.z-=564}
  environment.update(dt,speed);
}

function resetRun(){
  resetChase(chase);resetCrash(crash,player);n2o=100;speed=24;distance=0;hits=0;near=0;playerX=0;steer=0;wobble=0;cameraKick=0;impactSide=0;inv=.9;nearBonusFor=0;
  police.visible=false;police.position.set(0,0,8.2);
  traffic.forEach((o,i)=>resetTraffic(o,-38-i*17));
  potholes.forEach((p,i)=>{p.z=-125-i*115;p.x=LANES[Math.floor(rnd()*3)]+(rnd()-.5)*.5;p.hit=false});
  ui.crashStatus.classList.remove('on');
}

function update(dt:number){
  inv=Math.max(0,inv-dt);
  wobble*=Math.pow(.055,dt);
  cameraKick*=Math.pow(.028,dt);
  nearBonusFor=Math.max(0,nearBonusFor-dt);

  let difficulty=difficultyForDistance(distance);
  const crashed=crashActive(crash);
  const controllable=!chase.busted&&!crashed;
  const left=controllable&&(keys.has('KeyA')||keys.has('ArrowLeft'));
  const right=controllable&&(keys.has('KeyD')||keys.has('ArrowRight'));
  const brake=controllable&&(keys.has('KeyS')||keys.has('ArrowDown'));
  steer+=(right?1:0)-(left?1:0);
  steer*=crashed?.65:.80;

  const steerRate=2.45-1.15*Math.min(1,speed/difficulty.normalMaxSpeed);
  if(controllable)playerX+=steer*steerRate*dt;
  playerX=THREE.MathUtils.clamp(playerX,-PLAYER.sideClamp,PLAYER.sideClamp);

  const nitro=controllable&&(keys.has('ShiftLeft')||keys.has('ShiftRight'))&&n2o>0;
  let crashUpdate={active:false,finished:false,label:'',speedCap:Infinity};
  if(crashed)crashUpdate=updateCrash(crash,player,dt);

  if(chase.busted){
    speed=Math.max(8,speed-22*dt);
  }else if(crashed){
    speed=Math.max(10,Math.min(crashUpdate.speedCap,speed-6.5*dt));
  }else{
    if(nitro){speed+=PLAYER.nitroAcceleration*dt;n2o=Math.max(0,n2o-NITRO.drain*dt)}
    else{n2o=Math.min(100,n2o+NITRO.passiveRefill*dt);speed+=PLAYER.baseAcceleration*dt}
    if(brake)speed-=PLAYER.brakeDeceleration*dt;
    speed=THREE.MathUtils.clamp(speed,PLAYER.minSpeed,nitro?difficulty.nitroMaxSpeed:difficulty.normalMaxSpeed);
  }
  if(crashUpdate.finished){speed=Math.max(speed,20);inv=Math.max(inv,1.15)}
  distance+=speed*dt;

  difficulty=difficultyForDistance(distance);
  updateChase(chase,dt,speed,difficulty.safePace,difficulty.recoveryRate,nitro,brake||crashed);
  scrollWorld(dt);
  updateTrafficBehavior(dt);
  updateTrafficFollowing(dt);

  for(const o of traffic){
    o.z+=(speed-o.speed)*dt;
    o.object.position.z=o.z;
    o.object.position.x=o.x;
    o.object.rotation.z=THREE.MathUtils.lerp(o.object.rotation.z,(o.object.userData.wobble||0)-Math.sin(o.veerPhase)*o.veerAmp*.045,.18);
    o.object.userData.wobble=(o.object.userData.wobble||0)*.90;
    spinWheels(o.object,o.speed*dt);
    resolveContact(o);
  }
  recycle();

  for(const p of potholes){
    p.z+=speed*dt;
    if(p.z>8){p.z=Math.min(...potholes.map(x=>x.z))-105-rnd()*85;p.x=LANES[Math.floor(rnd()*3)]+(rnd()-.5)*.55;p.hit=false}
    p.object.position.set(p.x,.02,p.z);
    if(!chase.busted&&!crashActive(crash)&&!p.hit&&inv<=0&&Math.abs(p.z)<1.05&&Math.abs(playerX-p.x)<.48){
      speed*=.94;p.hit=true;inv=.4;wobble+=(rnd()>.5?1:-1)*.07;cameraKick=.07;applyPotholePenalty(chase);flash();
    }
  }

  const now=performance.now()/1000;
  const speedN=THREE.MathUtils.clamp((speed-PLAYER.minSpeed)/(difficulty.nitroMaxSpeed-PLAYER.minSpeed),0,1);
  const suspension=Math.sin(now*(7.5+speedN*8))*(.004+.012*speedN);
  player.position.x=THREE.MathUtils.lerp(player.position.x,playerX,.22);
  player.position.y=.02+suspension+cameraKick*.025;
  player.rotation.z=THREE.MathUtils.lerp(player.rotation.z,-steer*.09+wobble,.18);
  player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,steer*.035,.18);
  player.rotation.x=THREE.MathUtils.lerp(player.rotation.x,(brake?.025:0)+(nitro?-.018:0),.12);
  spinWheels(player,speed*dt);
  animateRider(player,now,steer,speed);
  setNitroVisual(player,nitro,.5+.5*Math.sin(now*24));

  if(!crashActive(crash)&&speed>18&&rnd()<dt*(7+speed*.22))dust.spawn(player.position.x,player.position.z,speed,steer,nitro);
  dust.update(dt);
  updatePolicePursuer(police,chase,playerX,now,dt,Math.max(speed,28));

  camera.position.x=THREE.MathUtils.lerp(camera.position.x,playerX*.16,.08)+Math.sin(now*43)*cameraKick*impactSide;
  camera.position.y=4.55+Math.min(.48,(speed-28)*.014)+cameraKick*.12;
  camera.position.z=9.8+cameraKick*.09;
  camera.lookAt(playerX*.24,.80,-24.5);
  const targetFov=56+speedN*6.3+(nitro?2.2:0);
  if(Math.abs(camera.fov-targetFov)>.04){camera.fov=THREE.MathUtils.lerp(camera.fov,targetFov,.08);camera.updateProjectionMatrix()}

  ui.crashStatus.textContent=crashUpdate.label;
  ui.crashStatus.classList.toggle('on',crashUpdate.active&&!chase.busted);
  ui.bonus.classList.toggle('on',nearBonusFor>0);
  if(chase.busted&&chase.bustedFor>=CHASE.restartDelay)resetRun();
}

function drawUI(){
  const difficulty=difficultyForDistance(distance);
  ui.speed.textContent=String(Math.round(speed*3.6));
  ui.distance.textContent=(distance/1000).toFixed(2)+' km';
  ui.hits.textContent=String(hits);
  ui.near.textContent=String(near);
  ui.heat.textContent=`${difficulty.heat}/${difficulty.maxHeat}`;
  (ui.nitro as HTMLElement).style.width=n2o+'%';
  const level=chaseLevel(chase);
  ui.pursuit.className='pursuit-card '+level;
  ui.pursuitLabel.textContent=proximityLabel(chase);
  (ui.pursuitFill as HTMLElement).style.width=(chase.threat/CHASE.maxThreat*100).toFixed(1)+'%';
  ui.busted.classList.toggle('on',chase.busted);
}

function frame(){
  const dt=Math.min(.033,clock.getDelta()||.016);
  update(dt);
  drawUI();
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
frame();

(window as any).__RR3D__={
  getState:()=>({
    playerX,
    speedKph:speed*3.6,
    n2o,
    distanceKm:distance/1000,
    difficulty:difficultyForDistance(distance),
    hits,near,
    pursuitGap:chase.gap,
    pursuitThreat:chase.threat,
    pursuitStatus:proximityLabel(chase),
    pursuitLevel:chaseLevel(chase),
    busted:chase.busted,
    crashPhase:crash.phase,
    crashCount:crash.crashes,
    traffic:traffic.map(o=>({kind:o.kind,lane:o.lane,targetLane:o.targetLane,pendingLane:o.pendingLane,indicator:o.indicatorDir,x:o.x,z:o.z,speed:o.speed,desiredSpeed:o.desiredSpeed})),
  }),
  reset:resetRun,
};
