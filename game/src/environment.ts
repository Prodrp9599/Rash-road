import * as THREE from 'three';

function mat(color:number, roughness=.9, metalness=.05){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
function box(w:number,h:number,d:number,color:number){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.castShadow=true;m.receiveShadow=true;return m}

export function buildEnvironment(scene:THREE.Scene){
  const root = new THREE.Group();
  root.name = 'environment';

  // Real terrain around the highway: never use a nearby flat backdrop card.
  const desert = new THREE.Mesh(new THREE.PlaneGeometry(220,1000), new THREE.MeshStandardMaterial({color:0xc49259,roughness:1}));
  desert.rotation.x = -Math.PI/2; desert.position.set(0,-.06,-380); desert.receiveShadow=true; root.add(desert);

  // Road shoulders add physical thickness and contact with the surrounding world.
  const shoulderL = box(2.2,.08,520,0x8f704d); shoulderL.position.set(-5.35,-.02,-245); root.add(shoulderL);
  const shoulderR = shoulderL.clone(); shoulderR.position.x = 5.35; root.add(shoulderR);

  const poleMat=mat(0x56483a,.96); const cactusMat=mat(0x5d7444,.96); const rockMats=[mat(0x9a5f41,1),mat(0xb16b46,1),mat(0x7e4e37,1)];
  for(let i=0;i<34;i++){
    const z=-24-i*15; const side=i%2===0?-1:1;
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,5.7,8),poleMat);pole.position.set(side*8.0,2.8,z);pole.castShadow=true;root.add(pole);
    const arm=box(2.0,.08,.08,0x56483a);arm.position.set(side*7.45,5.45,z);root.add(arm);

    const cactus=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.19,.24,2.0,9),cactusMat);trunk.position.y=1;trunk.castShadow=true;cactus.add(trunk);
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,1.1,8),cactusMat);branch.rotation.z=Math.PI/2.8;branch.position.set(.38,1.25,0);branch.castShadow=true;cactus.add(branch);
    cactus.position.set(-side*(7.5+(i%3)*1.3),0,z-5);cactus.scale.setScalar(.8+(i%4)*.14);root.add(cactus);

    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.75+(i%5)*.14,0),rockMats[i%rockMats.length]);
    rock.scale.set(1.8,.8,1.15);rock.position.set(side*(11+(i%4)*2),.45,z-3);rock.rotation.set(.15,i*.8,.1);rock.castShadow=true;root.add(rock);
  }

  // Distant mesas are volumetric geometry so they respond to parallax/fog instead of reading like a poster.
  for(let i=0;i<10;i++){
    const mesa=new THREE.Mesh(new THREE.CylinderGeometry(4+i%3,5+i%3,4+(i%2)*2,7),rockMats[i%rockMats.length]);
    mesa.scale.set(1.6+(i%3)*.5,1,1);mesa.position.set((i%2?-1:1)*(17+(i%4)*8),2,-65-i*48);mesa.rotation.y=i*.41;mesa.castShadow=true;mesa.receiveShadow=true;root.add(mesa);
  }

  // Physical overhead gantries produce foreground occlusion and real spatial interaction.
  for(let i=0;i<3;i++){
    const z=-115-i*145;
    const postL=box(.22,5.5,.25,0x50504b);postL.position.set(-5,2.75,z);root.add(postL);
    const postR=postL.clone();postR.position.x=5;root.add(postR);
    const beam=box(10.2,.22,.28,0x50504b);beam.position.set(0,5.25,z);root.add(beam);
    const sign=box(5.6,1.25,.14,0x3f5f4f);sign.position.set(.7,4.55,z+.02);root.add(sign);
  }
  scene.add(root);return root;
}

export function addLighting(scene:THREE.Scene){
  scene.fog = new THREE.FogExp2(0xd9bd8c,0.0046);
  scene.background = new THREE.Color(0xaac8d3);
  const hemi = new THREE.HemisphereLight(0xd9ebf0,0x9a5f39,1.65);scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe0b0,3.4);sun.position.set(-18,26,16);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-12;sun.shadow.camera.near=.5;sun.shadow.camera.far=85;sun.shadow.bias=-.0005;scene.add(sun);
  const warm = new THREE.DirectionalLight(0xff7a3a,.48);warm.position.set(25,8,-35);scene.add(warm);
}
