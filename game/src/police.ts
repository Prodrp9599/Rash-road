import * as THREE from 'three';
import { CHASE, type ChaseState } from './chase';

const mat=(color:number,roughness=.8,metalness=.05,emissive?:number)=>new THREE.MeshStandardMaterial({color,roughness,metalness,emissive:emissive??0,emissiveIntensity:emissive?2.8:0});
const box=(w:number,h:number,d:number,m:THREE.Material)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
const sphere=(r:number,m:THREE.Material,s=18)=>new THREE.Mesh(new THREE.SphereGeometry(r,s,Math.max(10,s/2)),m);
function cyl(r:number,len:number,m:THREE.Material,s=16){const x=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,s),m);x.rotation.z=Math.PI/2;return x}
function tube(a:THREE.Vector3,b:THREE.Vector3,r:number,m:THREE.Material){const d=new THREE.Vector3().subVectors(b,a),len=d.length(),mid=new THREE.Vector3().addVectors(a,b).multiplyScalar(.5);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),m);mesh.position.copy(mid);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return mesh}

export function createPolicePursuer(){
  const g=new THREE.Group();g.name='k9-pursuer';
  const rubber=mat(0x151515,.96),steel=mat(0x777b7e,.45,.65),navy=mat(0x172d3c,.58,.28),cream=mat(0xe1d6b7,.78),dark=mat(0x171717,.86),tan=mat(0x9a673d,.94),tanLight=mat(0xc89a65,.95),blue=mat(0x2ebcff,.28,.18,0x1688ff),red=mat(0xff413e,.3,.18,0xff1d13);
  for(const z of [.82,-.86]){
    const wheel=new THREE.Group();wheel.name='police-wheel';wheel.userData.radius=.38;
    wheel.add(cyl(.38,.15,rubber,22));wheel.add(cyl(.22,.16,steel,18));wheel.position.z=z;g.add(wheel);
  }
  g.add(tube(new THREE.Vector3(0,.44,.72),new THREE.Vector3(0,.72,-.55),.065,navy));
  g.add(tube(new THREE.Vector3(0,.72,-.55),new THREE.Vector3(0,.43,-.86),.055,steel));
  const engine=box(.48,.4,.52,steel);engine.position.set(0,.52,.04);g.add(engine);
  const tank=box(.56,.34,.72,navy);tank.position.set(0,.82,-.22);g.add(tank);
  const panel=box(.58,.09,.32,cream);panel.position.set(0,.88,-.12);g.add(panel);
  const seat=box(.46,.13,.70,dark);seat.position.set(0,.86,.42);g.add(seat);
  const handle=box(.9,.055,.055,dark);handle.position.set(0,1.08,-.72);g.add(handle);
  const lightL=box(.14,.10,.15,red);lightL.position.set(-.15,.97,.62);lightL.name='police-red';g.add(lightL);
  const lightR=box(.14,.10,.15,blue);lightR.position.set(.15,.97,.62);lightR.name='police-blue';g.add(lightR);

  const rider=new THREE.Group();rider.name='police-rider';
  const torso=box(.64,.72,.37,navy);torso.position.set(0,1.48,.10);torso.rotation.x=-.28;rider.add(torso);
  const belt=box(.57,.10,.37,dark);belt.position.set(0,1.15,.20);rider.add(belt);
  const head=sphere(.33,tan,22);head.scale.set(.92,1,.90);head.position.set(0,1.95,-.18);rider.add(head);
  const muzzle=sphere(.17,tanLight,16);muzzle.scale.set(1.1,.68,1);muzzle.position.set(0,1.87,-.47);rider.add(muzzle);
  const nose=sphere(.065,dark,12);nose.position.set(0,1.90,-.61);rider.add(nose);
  for(const x of [-.21,.21]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.12,.29,5),dark);ear.position.set(x,2.24,-.15);ear.rotation.z=x<0?.15:-.15;rider.add(ear)}
  const brow=box(.36,.08,.03,dark);brow.position.set(0,2.02,-.48);rider.add(brow);
  const badge=new THREE.Mesh(new THREE.OctahedronGeometry(.07,0),mat(0xd9b64b,.35,.8));badge.scale.y=1.35;badge.position.set(.18,1.55,-.105);rider.add(badge);
  const handL=new THREE.Vector3(-.38,1.09,-.73),handR=new THREE.Vector3(.38,1.09,-.73);
  rider.add(tube(new THREE.Vector3(-.27,1.66,-.02),handL,.075,navy),tube(new THREE.Vector3(.27,1.66,-.02),handR,.075,navy));
  const gloveL=sphere(.085,dark,12);gloveL.position.copy(handL);rider.add(gloveL);const gloveR=gloveL.clone();gloveR.position.copy(handR);rider.add(gloveR);
  rider.add(tube(new THREE.Vector3(-.19,1.12,.28),new THREE.Vector3(-.26,.56,.30),.09,navy),tube(new THREE.Vector3(.19,1.12,.28),new THREE.Vector3(.26,.56,.30),.09,navy));
  g.add(rider);

  g.traverse(o=>{if((o as THREE.Mesh).isMesh){const m=o as THREE.Mesh;m.castShadow=true;m.receiveShadow=true}});
  g.visible=false;
  return g;
}

export function updatePolicePursuer(root:THREE.Object3D,state:ChaseState,playerX:number,time:number,dt:number,speed:number){
  const visible=state.gap<CHASE.visibleGap||state.busted;
  root.visible=visible;
  if(!visible)return;

  // Subway-Surfers-style visual staging: the gameplay gap is abstract metres, while the cop
  // is compressed into the camera volume only when close enough to matter emotionally.
  const normalized=THREE.MathUtils.clamp(state.gap/CHASE.visibleGap,0,1);
  const targetZ=THREE.MathUtils.lerp(2.15,8.35,normalized);
  root.position.z=THREE.MathUtils.lerp(root.position.z,targetZ,1-Math.exp(-5*dt));
  root.position.x=THREE.MathUtils.lerp(root.position.x,playerX*.90,1-Math.exp(-2.9*dt));
  root.position.y=.02+Math.sin(time*11)*.008;
  root.rotation.z=THREE.MathUtils.lerp(root.rotation.z,(playerX-root.position.x)*-.035,.12);

  root.traverse(o=>{
    if(o.name==='police-wheel'){
      const r=(o.userData.radius as number)||.38;
      o.rotation.x-=speed*dt/r;
    }
  });
  const red=root.getObjectByName('police-red') as THREE.Mesh|undefined;
  const blue=root.getObjectByName('police-blue') as THREE.Mesh|undefined;
  const redMat=red?.material as THREE.MeshStandardMaterial|undefined;
  const blueMat=blue?.material as THREE.MeshStandardMaterial|undefined;
  if(redMat)redMat.emissiveIntensity=Math.sin(time*17)>0?5:.45;
  if(blueMat)blueMat.emissiveIntensity=Math.sin(time*17)<=0?5:.45;
}
