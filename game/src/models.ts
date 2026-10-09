import * as THREE from 'three';

const MAT={
  rubber:new THREE.MeshStandardMaterial({color:0x161513,roughness:.96}),
  darkMetal:new THREE.MeshStandardMaterial({color:0x34312e,roughness:.56,metalness:.55}),
  steel:new THREE.MeshStandardMaterial({color:0x817d76,roughness:.42,metalness:.72}),
  rust:new THREE.MeshStandardMaterial({color:0x9f512f,roughness:.74,metalness:.16}),
  cyan:new THREE.MeshStandardMaterial({color:0x22bfc9,roughness:.4,metalness:.25}),
  glass:new THREE.MeshStandardMaterial({color:0x55717b,roughness:.2,metalness:.05}),
  red:new THREE.MeshStandardMaterial({color:0xa84232,roughness:.55,metalness:.18}),
  blue:new THREE.MeshStandardMaterial({color:0x345f78,roughness:.55,metalness:.18}),
  cream:new THREE.MeshStandardMaterial({color:0xb8aa91,roughness:.7}),
  road:new THREE.MeshStandardMaterial({color:0x353332,roughness:1}),
  lane:new THREE.MeshStandardMaterial({color:0xd7cfb8,roughness:.88}),
  jacket:new THREE.MeshStandardMaterial({color:0x1d1c1b,roughness:.72,metalness:.04}),
  denim:new THREE.MeshStandardMaterial({color:0x263b49,roughness:.9}),
  fur:new THREE.MeshStandardMaterial({color:0x5a5a58,roughness:.95}),
  furDark:new THREE.MeshStandardMaterial({color:0x252525,roughness:.96}),
  furLight:new THREE.MeshStandardMaterial({color:0xd2cbc1,roughness:.97}),
  orange:new THREE.MeshStandardMaterial({color:0xb85c24,roughness:.86}),
};

const CAR_COLORS=[0x345f78,0x8c4b38,0x77705f,0x31584a,0xb08b50,0x555268];
const TRUCK_CABS=[0x9f512f,0x345f78,0x6d654f,0x365745,0x8c4037];
const TRUCK_BOXES=[0xb8aa91,0x9b9b91,0xbca86e,0x7d8b87,0xa18772];
const BIKE_COLORS=[0x345f78,0x9f512f,0x405c42,0x75623a,0x5c4a68,0x8a704d];
const RIDER_COLORS=[0x6e725f,0x5b4e48,0x334a5b,0x655c3e,0x493f56,0x765343];

function shadow(o:THREE.Object3D){
  o.traverse(x=>{if((x as THREE.Mesh).isMesh){const m=x as THREE.Mesh;m.castShadow=true;m.receiveShadow=true;}});
  return o;
}
function box(w:number,h:number,d:number,m:THREE.Material){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m)}
function cyl(r:number,len:number,m:THREE.Material,segments=16){const x=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,segments),m);x.rotation.z=Math.PI/2;return x}
function wheel(r=.35,w=.12){
  const g=new THREE.Group();g.name='wheel';g.userData.radius=r;
  const tyre=cyl(r,w,MAT.rubber,24);g.add(tyre);const rim=cyl(r*.58,w*1.04,MAT.steel,20);g.add(rim);const hub=cyl(r*.14,w*1.15,MAT.darkMetal,12);g.add(hub);return g;
}
function tubeBetween(a:THREE.Vector3,b:THREE.Vector3,r:number,m:THREE.Material,segments=10){
  const d=new THREE.Vector3().subVectors(b,a),len=d.length(),mid=new THREE.Vector3().addVectors(a,b).multiplyScalar(.5);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,segments),m);mesh.position.copy(mid);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return mesh;
}
function sphere(r:number,m:THREE.Material,segments=20){return new THREE.Mesh(new THREE.SphereGeometry(r,segments,Math.max(10,segments/2)),m)}
function indicator(name:string,x:number,y:number,z:number){
  const material=new THREE.MeshStandardMaterial({color:0xd78322,roughness:.38,metalness:.12,emissive:0xff8a18,emissiveIntensity:.12});
  const light=box(.22,.12,.055,material);light.name=name;light.position.set(x,y,z);return light;
}

export function createRoad(){
  const g=new THREE.Group();
  const slab=box(8.5,.16,60,MAT.road);slab.position.y=-.08;g.add(slab);
  for(const x of [-1.375,1.375])for(let z=-27;z<=27;z+=6){const dash=box(.11,.025,2.8,MAT.lane);dash.position.set(x,.015,z);g.add(dash)}
  for(const x of [-4.12,4.12]){const edge=box(.10,.028,60,MAT.lane);edge.position.set(x,.016,0);g.add(edge)}
  for(const [x,z,w,d] of [[-1.1,-10,1.4,4.4],[2.7,8,.9,5.4],[-2.8,20,1.1,3.1],[.6,25,.6,2.2]] as const){const patch=box(w,.022,d,new THREE.MeshStandardMaterial({color:0x292827,roughness:1}));patch.position.set(x,.02,z);g.add(patch)}
  return shadow(g);
}

export function createGuardrail(){
  const g=new THREE.Group();const beam=box(.14,.25,6,MAT.steel);beam.position.y=.65;g.add(beam);
  for(const z of [-2.6,0,2.6]){const post=box(.12,.8,.12,MAT.steel);post.position.set(0,.35,z);g.add(post)}return shadow(g);
}

export function createPothole(){
  const g=new THREE.Group();
  const hole=new THREE.Mesh(new THREE.CylinderGeometry(.52,.68,.04,22),new THREE.MeshStandardMaterial({color:0x11100f,roughness:1}));hole.scale.z=.64;hole.position.y=.004;g.add(hole);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.55,.07,8,22),new THREE.MeshStandardMaterial({color:0x514137,roughness:1}));rim.rotation.x=Math.PI/2;rim.scale.z=.66;rim.position.y=.028;g.add(rim);
  const hazardMat=new THREE.MeshStandardMaterial({color:0xe69a3b,roughness:.9,emissive:0x6f2d08,emissiveIntensity:.28});
  for(let i=0;i<12;i++){if(i%2===1)continue;const a=i/12*Math.PI*2;const chip=box(.28,.026,.08,hazardMat);chip.position.set(Math.cos(a)*.76,.038,Math.sin(a)*.50);chip.rotation.y=-a;g.add(chip)}
  return shadow(g);
}

export function createCar(color=0x345f78,style=0){
  const bodyMat=new THREE.MeshStandardMaterial({color,roughness:.58,metalness:.2});
  const g=new THREE.Group();
  const compact=style%3===1,tall=style%3===2;
  const body=box(1.65,tall?.58:.52,3.65,bodyMat);body.position.y=tall?.58:.55;g.add(body);
  const cabin=box(compact?1.42:1.45,tall?.64:.55,compact?1.55:1.8,bodyMat);cabin.position.set(0,tall?1.08:1.0,compact?.30:.15);g.add(cabin);
  const windshield=box(1.32,.36,.04,MAT.glass);windshield.position.set(0,tall?1.10:1.02,compact?-.60:-.77);windshield.rotation.x=.32;g.add(windshield);
  const rearGlass=box(1.25,.3,.04,MAT.glass);rearGlass.position.set(0,tall?1.08:1.0,compact?.98:1.06);rearGlass.rotation.x=-.3;g.add(rearGlass);
  for(const x of [-.72,.72])for(const z of [-1.18,1.18]){const w=wheel(.31,.18);w.position.set(x,.32,z);g.add(w)}
  const frontBumper=box(1.72,.16,.15,MAT.darkMetal);frontBumper.position.set(0,.42,-1.83);g.add(frontBumper);
  const rearBumper=box(1.70,.12,.12,MAT.darkMetal);rearBumper.position.set(0,.40,1.83);g.add(rearBumper);
  if(style%2){const stripe=box(1.20,.035,1.45,new THREE.MeshStandardMaterial({color:0xc6b16e,roughness:.68}));stripe.position.set(0,tall?1.405:1.29,.25);g.add(stripe)}
  g.add(indicator('indicator-left',-.58,.63,1.86),indicator('indicator-right',.58,.63,1.86));
  return shadow(g);
}

export function createTruck(variant=0){
  const cabMat=new THREE.MeshStandardMaterial({color:TRUCK_CABS[variant%TRUCK_CABS.length],roughness:.67,metalness:.18});
  const boxMat=new THREE.MeshStandardMaterial({color:TRUCK_BOXES[(variant*3+1)%TRUCK_BOXES.length],roughness:.78,metalness:.06});
  const g=new THREE.Group();
  const cab=box(2.05,1.25,1.7,cabMat);cab.position.set(0,.95,-1.35);g.add(cab);
  const cargo=box(2.2,2.05,3.65,boxMat);cargo.position.set(0,1.38,1.25);g.add(cargo);
  const wind=box(1.7,.48,.04,MAT.glass);wind.position.set(0,1.22,-2.21);g.add(wind);
  for(const x of [-.92,.92])for(const z of [2.0,-.8,-1.65]){const w=wheel(.39,.23);w.position.set(x,.39,z);g.add(w)}
  if(variant%2===1){const band=box(2.21,.18,3.68,new THREE.MeshStandardMaterial({color:0x5a5548,roughness:.82}));band.position.set(0,.62,1.25);g.add(band)}
  if(variant%3===2){const cap=box(1.9,.18,1.15,MAT.darkMetal);cap.position.set(0,1.66,-1.35);g.add(cap)}
  g.add(indicator('indicator-left',-.78,.72,3.08),indicator('indicator-right',.78,.72,3.08));
  return shadow(g);
}

export function createCivilianBike(variant=0){
  const tankMat=new THREE.MeshStandardMaterial({color:BIKE_COLORS[variant%BIKE_COLORS.length],roughness:.58,metalness:.18});
  const riderMat=new THREE.MeshStandardMaterial({color:RIDER_COLORS[(variant*2+1)%RIDER_COLORS.length],roughness:.9});
  const helmetMat=new THREE.MeshStandardMaterial({color:variant%2?0x2f2e2a:0x5a5145,roughness:.76,metalness:.08});
  const g=new THREE.Group();
  const back=wheel(.34,.11),front=wheel(.34,.11);back.position.z=.74;front.position.z=-.78;g.add(back,front);
  g.add(tubeBetween(new THREE.Vector3(0,.42,.65),new THREE.Vector3(0,.68,-.55),.055,MAT.darkMetal));g.add(tubeBetween(new THREE.Vector3(0,.68,-.55),new THREE.Vector3(0,.42,-.78),.05,MAT.steel));
  const tank=box(.42,.3,.56,tankMat);tank.position.set(0,.73,-.2);g.add(tank);const seat=box(.34,.12,.56,MAT.darkMetal);seat.position.set(0,.78,.38);g.add(seat);
  const torso=box(.42,.62,.28,riderMat);torso.position.set(0,1.16,.14);torso.rotation.x=-.32;g.add(torso);
  const head=sphere(.20,helmetMat,14);head.position.set(0,1.56,-.06);g.add(head);
  g.add(tubeBetween(new THREE.Vector3(-.15,1.34,.02),new THREE.Vector3(-.28,.98,-.62),.045,MAT.darkMetal));g.add(tubeBetween(new THREE.Vector3(.15,1.34,.02),new THREE.Vector3(.28,.98,-.62),.045,MAT.darkMetal));
  return shadow(g);
}

function createRoccoRider(){
  const r=new THREE.Group();r.name='rider';
  const torso=box(.66,.74,.38,MAT.jacket);torso.position.set(0,1.48,.10);torso.rotation.x=-.28;r.add(torso);const waist=box(.54,.25,.34,MAT.denim);waist.position.set(0,1.10,.28);r.add(waist);
  const head=sphere(.34,MAT.fur,24);head.scale.set(1,.92,.9);head.position.set(0,1.95,-.18);r.add(head);const muzzle=sphere(.17,MAT.furLight,18);muzzle.scale.set(1.15,.72,1.0);muzzle.position.set(0,1.87,-.47);r.add(muzzle);const nose=sphere(.07,MAT.furDark,16);nose.position.set(0,1.91,-.61);r.add(nose);
  const leftMask=box(.18,.11,.035,MAT.furDark);leftMask.position.set(-.12,2.00,-.49);leftMask.rotation.z=-.18;r.add(leftMask);const rightMask=leftMask.clone();rightMask.position.x=.12;rightMask.rotation.z=.18;r.add(rightMask);
  for(const x of [-.12,.12]){const eye=sphere(.027,new THREE.MeshStandardMaterial({color:0xe7a35c,roughness:.55}),12);eye.position.set(x,2.015,-.515);r.add(eye)}
  for(const x of [-.22,.22]){const ear=new THREE.Mesh(new THREE.ConeGeometry(.13,.26,5),MAT.furDark);ear.position.set(x,2.24,-.16);ear.rotation.z=x<0?.18:-.18;ear.rotation.x=-.08;r.add(ear)}
  const bandana=box(.48,.12,.30,MAT.orange);bandana.position.set(0,1.68,.02);bandana.rotation.x=-.18;r.add(bandana);const scarfTail=box(.14,.06,.42,MAT.orange);scarfTail.position.set(.22,1.68,.35);scarfTail.rotation.z=.22;r.add(scarfTail);
  const shoulderL=new THREE.Vector3(-.28,1.66,-.02), shoulderR=new THREE.Vector3(.28,1.66,-.02),handL=new THREE.Vector3(-.38,1.09,-.73), handR=new THREE.Vector3(.38,1.09,-.73);
  r.add(tubeBetween(shoulderL,handL,.075,MAT.jacket,12));r.add(tubeBetween(shoulderR,handR,.075,MAT.jacket,12));const gloveL=sphere(.09,MAT.furDark,12);gloveL.position.copy(handL);r.add(gloveL);const gloveR=sphere(.09,MAT.furDark,12);gloveR.position.copy(handR);r.add(gloveR);
  const hipL=new THREE.Vector3(-.19,1.12,.28), hipR=new THREE.Vector3(.19,1.12,.28),footL=new THREE.Vector3(-.26,.56,.30), footR=new THREE.Vector3(.26,.56,.30);
  r.add(tubeBetween(hipL,footL,.09,MAT.denim,12));r.add(tubeBetween(hipR,footR,.09,MAT.denim,12));const bootL=box(.16,.15,.28,MAT.furDark);bootL.position.copy(footL);bootL.position.z-=.04;r.add(bootL);const bootR=bootL.clone();bootR.position.copy(footR);bootR.position.z-=.04;r.add(bootR);
  const tailCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,1.18,.44),new THREE.Vector3(.08,1.06,.78),new THREE.Vector3(.26,.96,1.02),new THREE.Vector3(.18,.86,1.28)]);const tail=new THREE.Mesh(new THREE.TubeGeometry(tailCurve,16,.115,9,false),MAT.fur);tail.name='tail';r.add(tail);
  for(const z of [.78,1.02,1.22]){const band=new THREE.Mesh(new THREE.TorusGeometry(.12,.025,7,14),MAT.furDark);band.rotation.y=Math.PI/2;band.position.set(.17,1.0,z);r.add(band)}return r;
}

export function createPlayerBike(){
  const g=new THREE.Group();g.name='player-bike';const back=wheel(.39,.15),front=wheel(.38,.14);back.position.z=.82;front.position.z=-.86;g.add(back,front);
  g.add(tubeBetween(new THREE.Vector3(0,.44,.72),new THREE.Vector3(0,.72,-.55),.065,MAT.darkMetal));g.add(tubeBetween(new THREE.Vector3(0,.72,-.55),new THREE.Vector3(0,.43,-.86),.055,MAT.steel));
  const engine=box(.48,.4,.52,MAT.steel);engine.position.set(0,.52,.05);g.add(engine);const tank=box(.55,.34,.72,MAT.rust);tank.position.set(0,.82,-.22);tank.rotation.x=-.04;g.add(tank);const cyanStrip=box(.565,.035,.34,MAT.cyan);cyanStrip.position.set(0,.99,-.30);g.add(cyanStrip);
  const seat=box(.45,.13,.72,new THREE.MeshStandardMaterial({color:0x44342d,roughness:.86}));seat.position.set(0,.86,.42);g.add(seat);const handle=box(.9,.055,.055,MAT.darkMetal);handle.position.set(0,1.08,-.72);g.add(handle);const exhaust=tubeBetween(new THREE.Vector3(.35,.48,.22),new THREE.Vector3(.42,.53,1.0),.065,MAT.steel);g.add(exhaust);
  const flameMat=new THREE.MeshStandardMaterial({color:0x57eaff,emissive:0x168cff,emissiveIntensity:5,roughness:.2,transparent:true,opacity:.86});const flame=new THREE.Mesh(new THREE.ConeGeometry(.12,.62,14),flameMat);flame.name='nitroFlame';flame.rotation.x=-Math.PI/2;flame.position.set(.42,.53,1.28);flame.visible=false;g.add(flame);
  g.add(createRoccoRider());return shadow(g);
}

export function spinWheels(root:THREE.Object3D,distance:number){root.traverse(o=>{if(o.name==='wheel'){const r=(o.userData.radius as number)||.35;o.rotation.x-=distance/r}})}
export function setNitroVisual(root:THREE.Object3D,active:boolean,pulse=1){const flame=root.getObjectByName('nitroFlame') as THREE.Mesh|undefined;if(!flame)return;flame.visible=active;if(active)flame.scale.setScalar(.85+.28*pulse)}
export function setTurnIndicator(root:THREE.Object3D,dir:-1|0|1,lit:boolean){for(const [name,side] of [['indicator-left',-1],['indicator-right',1]] as const){const light=root.getObjectByName(name) as THREE.Mesh|undefined;const material=light?.material as THREE.MeshStandardMaterial|undefined;if(material)material.emissiveIntensity=lit&&dir===side?5.2:.12}}
export function animateRider(root:THREE.Object3D,time:number,steer:number,speed:number){const rider=root.getObjectByName('rider');const tail=root.getObjectByName('tail');if(rider){rider.rotation.z=THREE.MathUtils.lerp(rider.rotation.z,-steer*.055,.18);rider.position.y=Math.sin(time*10)*Math.min(.014,speed*.00032)}if(tail){tail.rotation.y=Math.sin(time*4.6)*.09+steer*.035;tail.rotation.x=Math.sin(time*6.1)*.035}}

export function createTrafficModel(kind:'bike'|'car'|'truck',variant=0){
  if(kind==='bike')return createCivilianBike(variant);
  if(kind==='car')return createCar(CAR_COLORS[variant%CAR_COLORS.length],variant);
  return createTruck(variant);
}

export const factories={player:createPlayerBike,bike:createCivilianBike,car:createCar,truck:createTruck,pothole:createPothole,road:createRoad,guardrail:createGuardrail};
export type ModelKey=keyof typeof factories;
export function createModel(key:ModelKey){return factories[key]();}
