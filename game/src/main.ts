import './style.css';
import * as THREE from 'three';
import { createModel } from './models';
import { addLighting, buildEnvironment } from './environment';
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
renderer.toneMappingExposure=1.05;
app.prepend(renderer.domElement);

const scene=new THREE.Scene();
addLighting(scene);
const environmentStrips=[buildEnvironment(scene),buildEnvironment(scene)];
environmentStrips[1].position.z=-510;
const camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.1,520);
camera.position.set(0,4.4,9.5);
const clock=new THREE.Clock();
const keys=new Set<string>();
let seed=8441;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};

addEventListener('keydown',e=>{keys.add(e.code);if(['ArrowLeft','ArrowRight','ArrowDown','Space'].includes(e.code))e.preventDefault()});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

const roadSegments:THREE.Object3D[]=[];
for(let i=0;i<10;i++){const road=createModel('road');road.position.set(0,0,-30-i*60);scene.add(road);roadSegments.push(road)}
const guardrails:THREE.Object3D[]=[];
for(let i=0;i<84;i++)for(const x of [-4.55,4.55]){const g=createModel('guardrail');g.position.set(x,0,-3-i*6);scene.add(g);guardrails.push(g)}

const player=createModel('player');player.scale.setScalar(1.06);scene.add(player);
const traffic:TrafficEntity[]=[];
const potholes:PotholeEntity[]=[];
const typeBag:TrafficKind[]=['bike','bike','car','car','car','truck'];

function resetTraffic(t:TrafficEntity,z:number){
  t.kind=typeBag[Math.floor(rnd()*typeBag.length)];
  t.lane=Math.floor(rnd()*3);
  t.x=LANES[t.lane]+(t.kind==='bike'?(rnd()-.5)*.34:(rnd()-.5)*.10);
  t.z=z-rnd()*45;
  t.speed=TRAFFIC[t.kind].minSpeed+rnd()*(TRAFFIC[t.kind].maxSpeed-TRAFFIC[t.kind].minSpeed);
  t.hit=false;t.near=false;
  if(t.object.parent)scene.remove(t.object);
  t.object=createModel(t.kind);
  t.object.position.set(t.x,0,t.z);
  t.object.userData.wobble=0;
  scene.add(t.object);
}
for(let i=0;i<18;i++){const t={} as TrafficEntity;t.object=new THREE.Group();resetTraffic(t,-42-i*16);traffic.push(t)}
for(let i=0;i<3;i++){
  const object=createModel('pothole');
  const p={x:LANES[Math.floor(rnd()*3)]+(rnd()-.5)*.5,z:-110-i*95,hit:false,object};
  object.position.set(p.x,.02,p.z);scene.add(object);potholes.push(p);
}

let playerX=0,speed=28,hp=100,n2o=100,distance=0,hits=0,near=0,inv=0,steer=0,wobble=0,cameraKick=0;
const ui={speed:el('speed'),distance:el('distance'),hits:el('hits'),near:el('near'),hp:el('hp'),nitro:el('nitro'),impact:el('impact')};
function el(id:string){return document.getElementById(id)!}
function flash(){ui.impact.classList.remove('on');void ui.impact.clientWidth;ui.impact.classList.add('on')}

function resolveContact(o:TrafficEntity){
  if(inv>0||o.hit)return;
  const s=TRAFFIC[o.kind],dx=Math.abs(playerX-o.x),threshold=.48+s.width;
  if(Math.abs(o.z)<1.68&&dx<threshold){
    const penetration=1-dx/threshold;
    const side=Math.abs(o.z)<.72&&penetration<.34;
    const mult=penetration<.18?.20:penetration<.55?.62:1;
    hp=Math.max(0,hp-s.damage*mult);
    const direction=Math.sign(playerX-o.x||1);
    const shove=o.kind==='truck'?.42:o.kind==='car'?.28:.18;
    playerX+=direction*shove*(.5+penetration);
    speed*=side?.92:o.kind==='truck'?(penetration>.55?.62:.82):o.kind==='car'?(penetration>.55?.74:.88):.92;
    wobble+=direction*(side?.10:.20)*(o.kind==='truck'?1.35:o.kind==='car'?1.0:.72);
    cameraKick=Math.max(cameraKick,side?.08:.18);
    o.object.userData.wobble=-direction*(side?.06:.14);
    hits++;o.hit=true;inv=s.postHitInv;flash();
  }else if(!o.near&&o.z>-1.1&&o.z<1.1&&speed>34&&dx<threshold+.55&&dx>=threshold){near++;o.near=true}
}
function recycle(){let far=Math.min(...traffic.map(o=>o.z),-150);for(const o of traffic)if(o.z>10){far-=24+rnd()*28;resetTraffic(o,far)}}
function effectiveTrafficSpeed(o:TrafficEntity){
  let v=o.speed;
  let nearestGap=Infinity;
  let leader:TrafficEntity|undefined;
  for(const other of traffic){
    if(other===o||other.lane!==o.lane||other.z>=o.z)continue;
    const gap=o.z-other.z;
    if(gap<nearestGap){nearestGap=gap;leader=other}
  }
  const desired=o.kind==='truck'?12:o.kind==='car'?10:8;
  if(leader&&nearestGap<desired){const blend=THREE.MathUtils.clamp((nearestGap-3)/(desired-3),0,1);v=THREE.MathUtils.lerp(Math.min(v,leader.speed*.86),v,blend)}
  return v;
}
function scrollWorld(dt:number){
  const dz=speed*dt;
  for(const r of roadSegments){r.position.z+=dz;if(r.position.z>30)r.position.z-=600}
  for(const g of guardrails){g.position.z+=dz;if(g.position.z>12)g.position.z-=504}
  for(const strip of environmentStrips){strip.position.z+=dz;if(strip.position.z>510)strip.position.z-=1020}
}

function update(dt:number){
  inv=Math.max(0,inv-dt);wobble*=Math.pow(.06,dt);cameraKick*=Math.pow(.025,dt);
  const left=keys.has('KeyA')||keys.has('ArrowLeft'),right=keys.has('KeyD')||keys.has('ArrowRight'),brake=keys.has('KeyS')||keys.has('ArrowDown');
  steer+=(right?1:0)-(left?1:0);steer*=.80;
  const steerRate=(2.45-1.15*Math.min(1,speed/PLAYER.maxSpeed));
  playerX+=steer*steerRate*dt;playerX=THREE.MathUtils.clamp(playerX,-PLAYER.sideClamp,PLAYER.sideClamp);
  const nitro=(keys.has('ShiftLeft')||keys.has('ShiftRight'))&&n2o>0;
  if(nitro){speed+=PLAYER.nitroAcceleration*dt;n2o=Math.max(0,n2o-23*dt)}else{n2o=Math.min(100,n2o+5.5*dt);speed+=PLAYER.baseAcceleration*dt}
  if(brake)speed-=PLAYER.brakeDeceleration*dt;
  speed=THREE.MathUtils.clamp(speed,PLAYER.minSpeed,nitro?PLAYER.nitroMaxSpeed:PLAYER.maxSpeed);
  distance+=speed*dt;
  scrollWorld(dt);

  for(const o of traffic){
    const trafficSpeed=effectiveTrafficSpeed(o);
    o.z+=(speed-trafficSpeed)*dt;
    o.object.position.z=o.z;o.object.position.x=o.x;
    o.object.rotation.z=THREE.MathUtils.lerp(o.object.rotation.z,o.object.userData.wobble||0,.18);
    o.object.userData.wobble=(o.object.userData.wobble||0)*.90;
    resolveContact(o);
  }
  recycle();
  for(const p of potholes){
    p.z+=speed*dt;
    if(p.z>8){p.z=Math.min(...potholes.map(x=>x.z))-90-rnd()*70;p.x=LANES[Math.floor(rnd()*3)]+(rnd()-.5)*.55;p.hit=false}
    p.object.position.set(p.x,.02,p.z);
    if(!p.hit&&inv<=0&&Math.abs(p.z)<1.1&&Math.abs(playerX-p.x)<.48){hp=Math.max(0,hp-2);speed*=.94;p.hit=true;inv=.4;wobble+=(rnd()>.5?1:-1)*.07;cameraKick=.07;flash()}
  }
  if(hp<=0){hp=100;speed=18;hits=0;near=0;distance=0;traffic.forEach((o,i)=>resetTraffic(o,-42-i*16))}

  player.position.x=THREE.MathUtils.lerp(player.position.x,playerX,.22);
  player.rotation.z=THREE.MathUtils.lerp(player.rotation.z,-steer*.09+wobble,.18);
  player.rotation.y=THREE.MathUtils.lerp(player.rotation.y,steer*.035,.18);

  camera.position.x=THREE.MathUtils.lerp(camera.position.x,playerX*.16,.08)+(Math.sin(performance.now()*.045)*cameraKick);
  camera.position.y=4.4+Math.min(.35,(speed-28)*.012)+cameraKick*.12;
  camera.position.z=9.5+cameraKick*.08;
  camera.lookAt(playerX*.24,.72,-24);
}
function drawUI(){
  ui.speed.textContent=String(Math.round(speed*3.6));
  ui.distance.textContent=(distance/1000).toFixed(2)+' km';
  ui.hits.textContent=String(hits);ui.near.textContent=String(near);
  (ui.hp as HTMLElement).style.width=hp+'%';(ui.nitro as HTMLElement).style.width=n2o+'%';
}
function frame(){const dt=Math.min(.033,clock.getDelta()||.016);update(dt);drawUI();renderer.render(scene,camera);requestAnimationFrame(frame)}
frame();

(window as any).__RR3D__={getState:()=>({playerX,speedKph:speed*3.6,hp,n2o,distanceKm:distance/1000,hits,near,traffic:traffic.map(o=>({kind:o.kind,x:o.x,z:o.z,speed:o.speed}))})};
