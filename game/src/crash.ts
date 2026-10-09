import * as THREE from 'three';

export type CrashPhase='mounted'|'airborne'|'sliding'|'recovering'|'running'|'remounting';

export type CrashState={
  phase:CrashPhase;
  timer:number;
  side:number;
  startX:number;
  rider:THREE.Group;
  crashes:number;
};

function mat(color:number,roughness=.85){return new THREE.MeshStandardMaterial({color,roughness})}
function box(w:number,h:number,d:number,m:THREE.Material){const x=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);x.castShadow=true;x.receiveShadow=true;return x}
function sphere(r:number,m:THREE.Material){const x=new THREE.Mesh(new THREE.SphereGeometry(r,16,10),m);x.castShadow=true;return x}

function createCrashRider(){
  const g=new THREE.Group();
  g.name='crash-rider';
  const fur=mat(0x5b5b59,.97),dark=mat(0x242322,.95),light=mat(0xd1c8bd,.98),jacket=mat(0x1d1b1a,.72),denim=mat(0x263b49,.9),orange=mat(0xb85c24,.88);
  const torso=box(.62,.72,.36,jacket);torso.position.y=1.12;g.add(torso);
  const waist=box(.5,.24,.32,denim);waist.position.y=.72;g.add(waist);
  const head=sphere(.31,fur);head.position.set(0,1.65,-.05);g.add(head);
  const muzzle=sphere(.15,light);muzzle.scale.set(1.15,.72,1);muzzle.position.set(0,1.58,-.28);g.add(muzzle);
  const nose=sphere(.06,dark);nose.position.set(0,1.61,-.40);g.add(nose);
  for(const x of [-.20,.20]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.12,.23,5),dark);ear.position.set(x,1.91,-.03);g.add(ear)}
  const scarf=box(.46,.11,.28,orange);scarf.position.set(0,1.39,.02);g.add(scarf);
  for(const x of [-.24,.24]){const arm=box(.14,.58,.16,jacket);arm.position.set(x,.98,0);arm.rotation.z=x<0?-.18:.18;g.add(arm)}
  for(const x of [-.16,.16]){const leg=box(.16,.62,.18,denim);leg.position.set(x,.38,.05);g.add(leg);const boot=box(.18,.18,.30,dark);boot.position.set(x,.08,-.03);g.add(boot)}
  const tail=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.85,6,10),fur);tail.position.set(.18,.67,.35);tail.rotation.x=Math.PI/2.9;tail.rotation.z=-.25;g.add(tail);
  g.visible=false;
  return g;
}

export function createCrashState(scene:THREE.Scene):CrashState{
  const rider=createCrashRider();
  scene.add(rider);
  return {phase:'mounted',timer:0,side:1,startX:0,rider,crashes:0};
}

export function crashActive(state:CrashState){return state.phase!=='mounted'}

export function startCrash(state:CrashState,player:THREE.Object3D,playerX:number,side:number){
  if(crashActive(state))return false;
  state.phase='airborne';state.timer=0;state.side=side||1;state.startX=playerX;state.crashes++;
  const mounted=player.getObjectByName('rider');if(mounted)mounted.visible=false;
  state.rider.visible=true;
  state.rider.position.set(playerX,.1,-.15);
  state.rider.rotation.set(0,0,-state.side*.18);
  player.position.z=-1.65;
  return true;
}

export type CrashUpdate={active:boolean;finished:boolean;label:string;speedCap:number};

export function updateCrash(state:CrashState,player:THREE.Object3D,dt:number):CrashUpdate{
  if(state.phase==='mounted')return {active:false,finished:false,label:'',speedCap:Infinity};
  state.timer+=dt;
  const r=state.rider;
  let label='WIPEOUT';

  if(state.phase==='airborne'){
    const t=Math.min(1,state.timer/.68);
    r.position.x=state.startX+state.side*(.45+1.05*t);
    r.position.z=-.15-3.2*t;
    r.position.y=.1+1.8*Math.sin(Math.PI*t);
    r.rotation.x=t*3.2;r.rotation.z=-state.side*(.25+t*1.9);
    if(t>=1){state.phase='sliding';state.timer=0}
    return {active:true,finished:false,label,speedCap:16};
  }

  if(state.phase==='sliding'){
    const t=Math.min(1,state.timer/.72);
    label='SLIDE';
    r.position.z=-3.35-.85*t;
    r.position.y=.10;
    r.rotation.x=3.2+t*.45;
    r.rotation.z=-state.side*(2.15-t*.35);
    if(t>=1){state.phase='recovering';state.timer=0}
    return {active:true,finished:false,label,speedCap:13};
  }

  if(state.phase==='recovering'){
    const t=Math.min(1,state.timer/.55);
    label='GET UP';
    r.position.y=.1+.58*t;
    r.rotation.x=THREE.MathUtils.lerp(3.65,0,t);
    r.rotation.z=THREE.MathUtils.lerp(-state.side*1.8,0,t);
    if(t>=1){state.phase='running';state.timer=0}
    return {active:true,finished:false,label,speedCap:12};
  }

  if(state.phase==='running'){
    const t=Math.min(1,state.timer/.95);
    label='RUN!';
    r.position.x=THREE.MathUtils.lerp(state.startX+state.side*1.5,player.position.x,t);
    r.position.z=THREE.MathUtils.lerp(-4.2,player.position.z+.25,t);
    r.position.y=.68+Math.abs(Math.sin(state.timer*13))*.08;
    r.rotation.y=Math.sin(state.timer*10)*.11;
    if(t>=1){state.phase='remounting';state.timer=0}
    return {active:true,finished:false,label,speedCap:14};
  }

  const t=Math.min(1,state.timer/.46);
  label='REMOUNT';
  r.position.x=THREE.MathUtils.lerp(r.position.x,player.position.x,t);
  r.position.z=THREE.MathUtils.lerp(r.position.z,player.position.z,t);
  r.position.y=THREE.MathUtils.lerp(r.position.y,1.0,t);
  player.position.z=THREE.MathUtils.lerp(player.position.z,0,t);
  if(t>=1){
    r.visible=false;
    state.phase='mounted';state.timer=0;
    player.position.z=0;
    const mounted=player.getObjectByName('rider');if(mounted)mounted.visible=true;
    return {active:false,finished:true,label:'',speedCap:Infinity};
  }
  return {active:true,finished:false,label,speedCap:16};
}

export function resetCrash(state:CrashState,player:THREE.Object3D){
  state.phase='mounted';state.timer=0;state.side=1;state.rider.visible=false;player.position.z=0;
  const mounted=player.getObjectByName('rider');if(mounted)mounted.visible=true;
}
