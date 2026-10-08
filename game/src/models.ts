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
};
function shadow(o:THREE.Object3D){o.traverse(x=>{if((x as THREE.Mesh).isMesh){const m=x as THREE.Mesh;m.castShadow=true;m.receiveShadow=true}});return o}
function box(w:number,h:number,d:number,m:THREE.Material){return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m)}
function cyl(r:number,len:number,m:THREE.Material,segments=16){const x=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,segments),m);x.rotation.z=Math.PI/2;return x}
function wheel(r=.35,w=.12){const g=new THREE.Group();const tyre=cyl(r,w,MAT.rubber,20);g.add(tyre);const rim=cyl(r*.58,w*1.04,MAT.steel,18);g.add(rim);return g}
function tubeBetween(a:THREE.Vector3,b:THREE.Vector3,r:number,m:THREE.Material){const d=new THREE.Vector3().subVectors(b,a),len=d.length(),mid=new THREE.Vector3().addVectors(a,b).multiplyScalar(.5);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,10),m);mesh.position.copy(mid);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return mesh}

export function createRoad(){const g=new THREE.Group();const slab=box(8.5,.16,60,MAT.road);slab.position.y=-.08;g.add(slab);for(const x of [-1.375,1.375])for(let z=-27;z<=27;z+=6){const dash=box(.11,.025,2.8,MAT.lane);dash.position.set(x,.015,z);g.add(dash)}for(const x of [-4.12,4.12]){const edge=box(.10,.028,60,MAT.lane);edge.position.set(x,.016,0);g.add(edge)}for(const [x,z,w,d] of [[-1.1,-10,1.4,4.4],[2.7,8,.9,5.4],[-2.8,20,1.1,3.1]] as const){const patch=box(w,.022,d,new THREE.MeshStandardMaterial({color:0x292827,roughness:1}));patch.position.set(x,.02,z);g.add(patch)}return shadow(g)}
export function createGuardrail(){const g=new THREE.Group();const beam=box(.14,.25,6,MAT.steel);beam.position.y=.65;g.add(beam);for(const z of [-2.6,0,2.6]){const post=box(.12,.8,.12,MAT.steel);post.position.set(0,.35,z);g.add(post)}return shadow(g)}
export function createPothole(){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.5,.64,.035,18),new THREE.MeshStandardMaterial({color:0x171615,roughness:1}));mesh.scale.z=.62;return shadow(mesh)}

export function createCar(color=0x345f78){const bodyMat=new THREE.MeshStandardMaterial({color,roughness:.58,metalness:.2});const g=new THREE.Group();const body=box(1.65,.52,3.65,bodyMat);body.position.y=.55;g.add(body);const cabin=box(1.45,.55,1.8,bodyMat);cabin.position.set(0,1.0,-.15);g.add(cabin);const windshield=box(1.32,.36,.04,MAT.glass);windshield.position.set(0,1.02,.77);windshield.rotation.x=-.32;g.add(windshield);for(const x of [-.72,.72])for(const z of [-1.18,1.18]){const w=wheel(.31,.18);w.position.set(x,.32,z);g.add(w)}const bumper=box(1.72,.16,.15,MAT.darkMetal);bumper.position.set(0,.42,1.83);g.add(bumper);return shadow(g)}
export function createTruck(){const g=new THREE.Group();const cab=box(2.05,1.25,1.7,MAT.rust);cab.position.set(0,.95,1.35);g.add(cab);const cargo=box(2.2,2.05,3.65,MAT.cream);cargo.position.set(0,1.38,-1.25);g.add(cargo);const wind=box(1.7,.48,.04,MAT.glass);wind.position.set(0,1.22,2.21);g.add(wind);for(const x of [-.92,.92])for(const z of [-2.0,.8,1.65]){const w=wheel(.39,.23);w.position.set(x,.39,z);g.add(w)}return shadow(g)}
export function createCivilianBike(){const g=new THREE.Group();const back=wheel(.34,.11),front=wheel(.34,.11);back.position.z=.74;front.position.z=-.78;g.add(back,front);g.add(tubeBetween(new THREE.Vector3(0,.42,.65),new THREE.Vector3(0,.68,-.55),.055,MAT.darkMetal));g.add(tubeBetween(new THREE.Vector3(0,.68,-.55),new THREE.Vector3(0,.42,-.78),.05,MAT.steel));const tank=box(.42,.3,.56,MAT.blue);tank.position.set(0,.73,-.2);g.add(tank);const seat=box(.34,.12,.56,MAT.darkMetal);seat.position.set(0,.78,.38);g.add(seat);const rider=box(.42,.72,.32,new THREE.MeshStandardMaterial({color:0x6e725f,roughness:.9}));rider.position.set(0,1.12,.20);rider.rotation.x=-.12;g.add(rider);const head=new THREE.Mesh(new THREE.SphereGeometry(.2,12,8),new THREE.MeshStandardMaterial({color:0x423c35,roughness:.85}));head.position.set(0,1.57,.05);g.add(head);return shadow(g)}
export function createPlayerBike(){const g=new THREE.Group();const back=wheel(.39,.15),front=wheel(.38,.14);back.position.z=.82;front.position.z=-.86;g.add(back,front);g.add(tubeBetween(new THREE.Vector3(0,.44,.72),new THREE.Vector3(0,.72,-.55),.065,MAT.darkMetal));g.add(tubeBetween(new THREE.Vector3(0,.72,-.55),new THREE.Vector3(0,.43,-.86),.055,MAT.steel));const engine=box(.48,.4,.52,MAT.steel);engine.position.set(0,.52,.05);g.add(engine);const tank=box(.55,.34,.72,MAT.rust);tank.position.set(0,.82,-.22);tank.rotation.x=-.04;g.add(tank);const cyanStrip=box(.565,.035,.34,MAT.cyan);cyanStrip.position.set(0,.99,-.30);g.add(cyanStrip);const seat=box(.45,.13,.72,new THREE.MeshStandardMaterial({color:0x44342d,roughness:.86}));seat.position.set(0,.86,.42);g.add(seat);const handle=box(.9,.055,.055,MAT.darkMetal);handle.position.set(0,1.08,-.72);g.add(handle);const exhaust=tubeBetween(new THREE.Vector3(.35,.48,.22),new THREE.Vector3(.42,.53,1.0),.065,MAT.steel);g.add(exhaust);return shadow(g)}

export const factories={player:createPlayerBike,bike:createCivilianBike,car:createCar,truck:createTruck,pothole:createPothole,road:createRoad,guardrail:createGuardrail};
export type ModelKey=keyof typeof factories;
export function createModel(key:ModelKey){return factories[key]();}
