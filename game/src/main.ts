import './style.css';
import * as THREE from 'three';
import { animateRider, createModel, setNitroVisual, spinWheels } from './models';
import { addLighting, buildEnvironment } from './environment';
import { createDustSystem } from './effects';
import { CHASE, applyPotholePenalty, applyTrafficPenalty, chaseLevel, createChaseState, resetChase, rewardNearMiss, updateChase } from './chase';
import { createPolicePursuer, updatePolicePursuer } from './police';
import { LANES, PLAYER, TRAFFIC, type TrafficKind } from './config';
import type { TrafficEntity, PotholeEntity } from './types';

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
const dust=createDustSystem(scene);

const traffic:TrafficEntity[]=[];
const potholes:PotholeEntity[]=[];
const typeBag:TrafficKind[]=['bike','bike','car','car','car','truck'];

function chooseSpawn(t:TrafficEntity,baseZ:number){
  let lane=0,z=baseZ;
  for(let attempt=0;attempt<8;attempt++){
    lane=Math.floor(rnd()*3);
    z=baseZ-rnd()*40;
    const candidateLength=TRAFFIC[t.kind].length;
    const blocked=traffic.some(other=>{
      if(other===t||other.lane!==lane)return false;
      const safe=(candidateLength+TRAFFIC[other.kind].length)*.5+7;
      return Math.abs(other.z-z)<safe;
    });
    if(!blocked)break;
    z-=10+attempt*3;
  }
  return {lane,z};
}

function resetTraffic(t:TrafficEntity,baseZ:number){
  t.kind=typeBag[Math.floor(rnd()*typeBag.length)];
  const spawn=chooseSpawn(t,baseZ);
  t.lane=spawn.lane;
  t.x=LANES[t.lane]+(t.kind==='bike'?(rnd()-.5)*.34:(rnd()-.5)*.10);
  t.z=spawn.z;
  t.desiredSpeed=TRAFFIC[t.kind].minSpeed+rnd()*(TRAFFIC[t.kind].maxSpeed-TRAFFIC[t.kind].minSpeed);
  t.speed=t.desiredSpeed;
  t.hit=false;
  t.near=false;
  if(t.object.parent)scene.remove(t.object);
  t.object=createModel(t.kind);
  t.object.position.set(t.x,0,t.z);
  t.object.userData.wobble=0;
  scene.add(t.object);
}

for(let i=0;i<18;i++){
  const t={} as TrafficEntity;
  t.object=new THREE.Group();
  t.kind='car';t.lane=0;t.x=0;t.z=0;t.speed=0;t.desiredSpeed=0;t.hit=false;t.near=false;
  resetTraffic(t,-45-i*19);
  traffic.push(t);
}
for(let i=0;i<3;i++){
  const object=createModel('pothole');
  const p={x:LANES[Math.floor(rnd()*3)]+(rnd()-.5)*.5,z:-125-i*115,hit:false,object};
  object.position.set(p.x,.02,p.z);scene.add(object);potholes.push(p);
}

let playerX=0,speed=28,n2o=100,distance=0,hits=0,near=0,inv=0,steer=0,wobble=0,cameraKick=0,impactSide=0;
const chase=createChaseState();
const ui={
  speed:el('speed'),distance:el('distance'),hits:el('hits'),near:el('near'),nitro:el('nitro'),impact:el('impact'),
  pursuit:el('pursuit'),pursuitLabel:el('pursuitLabel'),pursuitFill:el('pursuitFill'),busted:el('busted'),
};
function el(id:string){return document.getElementById(id)!}
function flash(){ui.impact.classList.remove('on');void ui.impact.clientWidth;ui.impact.classList.add('on')}

function resolveContact(o:TrafficEntity){
  if(chase.busted||inv>0||o.hit)return;
  const s=TRAFFIC[o.kind];
  const dx=Math.abs(playerX-o.x);
  const lateralThreshold=PLAYER.width+s.width;
  const longitudinalThreshold=(PLAYER.length+s.length)*.42;

  if(Math.abs(o.z)<longitudinalThreshold&&dx<lateralThreshold){
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
    applyTrafficPenalty(chase,o.kind,side?.15+penetration*.25:penetration);
    hits++;
    o.hit=true;
    inv=s.postHitInv;
    flash();
  }else if(!o.near&&o.z>-1.15&&o.z<1.15&&speed>34&&dx<lateralThreshold+.55&&dx>=lateralThreshold){
    near++;
    o.near=true;
    rewardNearMiss(chase);
  }
}

function updateTrafficFollowing(dt:number){
  for(const o of traffic){
    let target=o.desiredSpeed;
    let leader:TrafficEntity|undefined;
    let bestGap=Infinity;
    for(const other of traffic){
      if(other===o||other.lane!==o.lane||other.z>=o.z)continue;
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
    const response=target<o.speed?5.5:1.8;
    o.speed=THREE.MathUtils.lerp(o.speed,THREE.MathUtils.clamp(target,TRAFFIC[o.kind].minSpeed*.72,TRAFFIC[o.kind].maxSpeed),1-Math.exp(-response*dt));
  }
}

function recycle(){
  let far=Math.min(...traffic.map(o=>o.z),-170);
  for(const o of traffic)if(o.z>12){far-=27+rnd()*31;resetTraffic(o,far)}
}

function scrollWorld(dt:number){
  const dz=speed*dt;
  for(const road of roadSegments){road.position.z+=dz;if(road.position.z>30)road.position.z-=660}
  for(const rail of guardrails){rail.position.z+=dz;if(rail.position.z>12)rail.position.z-=564}
  environment.update(dt,speed);
}

function resetRun(){
  resetChase(chase);n2o=100;speed=24;distance=0;hits=0;near=0;playerX=0;steer=0;wobble=0;cameraKick=0;impactSide=0;inv=.9;
  police.visible=false;police.position.set(0,0,8.2);
  traffic.forEach((o,i)=>resetTraffic(o,-48-i*20));
  potholes.forEach((p,i)=>{p.z=-125-i*115;p.x=LANES[Math.floor(rnd()*3)]+(rnd()-.5)*.5;p.hit=false});
}

function update(dt:number){
  inv=Math.max(0,inv-dt);
  wobble*=Math.pow(.055,dt);
  cameraKick*=Math.pow(.028,dt);

  const left=!chase.busted&&(keys.has('KeyA')||keys.has('ArrowLeft'));
  const right=!chase.busted&&(keys.has('KeyD')||keys.has('ArrowRight'));
  const brake=!chase.busted&&(keys.has('KeyS')||keys.has('ArrowDown'));
  steer+=(right?1:0)-(left?1:0);
  steer*=.80;

  const steerRate=2.45-1.15*Math.min(1,speed/PLAYER.maxSpeed);
  playerX+=steer*steerRate*dt;
  playerX=THREE.MathUtils.clamp(playerX,-PLAYER.sideClamp,PLAYER.sideClamp);

  const nitro=!chase.busted&&(keys.has('ShiftLeft')||keys.has('ShiftRight'))&&n2o>0;
  if(chase.busted){
    speed=Math.max(8,speed-22*dt);
  }else{
    if(nitro){speed+=PLAYER.nitroAcceleration*dt;n2o=Math.max(0,n2o-23*dt)}
    else{n2o=Math.min(100,n2o+5.5*dt);speed+=PLAYER.baseAcceleration*dt}
    if(brake)speed-=PLAYER.brakeDeceleration*dt;
    speed=THREE.MathUtils.clamp(speed,PLAYER.minSpeed,nitro?PLAYER.nitroMaxSpeed:PLAYER.maxSpeed);
  }
  distance+=speed*dt;

  updateChase(chase,dt,speed,distance,nitro,brake);
  scrollWorld(dt);
  updateTrafficFollowing(dt);

  for(const o of traffic){
    o.z+=(speed-o.speed)*dt;
    o.object.position.z=o.z;
    o.object.position.x=o.x;
    o.object.rotation.z=THREE.MathUtils.lerp(o.object.rotation.z,o.object.userData.wobble||0,.18);
    o.object.userData.wobble=(o.object.userData.wobble||0)*.90;
    spinWheels(o.object,o.speed*dt);
    resolveContact(o);
  }
  recycle();

  for(const p of potholes){
    p.z+=speed*dt;
    if(p.z>8){p.z=Math.min(...potholes.map(x=>x.z))-105-rnd()*85;p.x=LANES[Math.floor(rnd()*3)]+(rnd()-.5)*.55;p.hit=false}
    p.object.position.set(p.x,.02,p.z);
    if(!chase.busted&&!p.hit&&inv<=0&&Math.abs(p.z)<1.05&&Math.abs(playerX-p.x)<.48){
      speed*=.94;p.hit=true;inv=.4;wobble+=(rnd()>.5?1:-1)*.07;cameraKick=.07;applyPotholePenalty(chase);flash();
    }
  }

  const now=performance.now()/1000;
  const speedN=THREE.MathUtils.clamp((speed-PLAYER.minSpeed)/(PLAYER.nitroMaxSpeed-PLAYER.minSpeed),0,1);
  const suspension=Math.sin(now*(7.5+speedN*8))*(.004+.012*speedN);
  player.position.x=THREE.MathUtils.lerp(player.position.x,playerX,.22);
  player.position.y=.02+suspension+cameraKick*.025;
  player.rotation.z=THREE.MathUtils.lerp(player.rotation.z,-steer*.09+wobble,.18);
  player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,steer*.035,.18);
  player.rotation.x=THREE.MathUtils.lerp(player.rotation.x,(brake?.025:0)+(nitro?-.018:0),.12);
  spinWheels(player,speed*dt);
  animateRider(player,now,steer,speed);
  setNitroVisual(player,nitro,.5+.5*Math.sin(now*24));

  if(speed>18&&rnd()<dt*(7+speed*.22))dust.spawn(player.position.x,player.position.z,speed,steer,nitro);
  dust.update(dt);
  updatePolicePursuer(police,chase,playerX,now,dt,Math.max(speed,28));

  camera.position.x=THREE.MathUtils.lerp(camera.position.x,playerX*.16,.08)+Math.sin(now*43)*cameraKick*impactSide;
  camera.position.y=4.55+Math.min(.43,(speed-28)*.014)+cameraKick*.12;
  camera.position.z=9.8+cameraKick*.09;
  camera.lookAt(playerX*.24,.80,-24.5);
  const targetFov=56+speedN*5.5+(nitro?2.2:0);
  if(Math.abs(camera.fov-targetFov)>.04){camera.fov=THREE.MathUtils.lerp(camera.fov,targetFov,.08);camera.updateProjectionMatrix()}

  if(chase.busted&&chase.bustedFor>=CHASE.restartDelay)resetRun();
}

function drawUI(){
  ui.speed.textContent=String(Math.round(speed*3.6));
  ui.distance.textContent=(distance/1000).toFixed(2)+' km';
  ui.hits.textContent=String(hits);
  ui.near.textContent=String(near);
  (ui.nitro as HTMLElement).style.width=n2o+'%';
  const level=chaseLevel(chase);
  ui.pursuit.className='pursuit-card '+level;
  ui.pursuitLabel.textContent=Math.max(0,Math.round(chase.gap))+' m';
  (ui.pursuitFill as HTMLElement).style.width=(chase.gap/CHASE.maxGap*100).toFixed(1)+'%';
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
    hits,near,
    pursuitGap:chase.gap,
    pursuitLevel:chaseLevel(chase),
    busted:chase.busted,
    traffic:traffic.map(o=>({kind:o.kind,lane:o.lane,x:o.x,z:o.z,speed:o.speed,desiredSpeed:o.desiredSpeed})),
  }),
  reset:resetRun,
};
