import * as THREE from 'three';

function mat(color:number, roughness=.9, metalness=.05){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
function box(w:number,h:number,d:number,color:number){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.castShadow=true;m.receiveShadow=true;return m}

export type EnvironmentController = {
  root: THREE.Group;
  update: (dt:number, speed:number) => void;
};

type ScrollEntry={object:THREE.Object3D;wrapMin:number;wrapMax:number};

function addSky(scene:THREE.Scene){
  const geo=new THREE.SphereGeometry(280,36,20);
  const material=new THREE.ShaderMaterial({
    side:THREE.BackSide,
    depthWrite:false,
    uniforms:{
      top:{value:new THREE.Color(0x78adc2)},
      horizon:{value:new THREE.Color(0xf2c783)},
      ground:{value:new THREE.Color(0xc97045)},
    },
    vertexShader:`varying vec3 vWorld; void main(){vec4 w=modelMatrix*vec4(position,1.0);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vWorld;uniform vec3 top;uniform vec3 horizon;uniform vec3 ground;void main(){float h=normalize(vWorld).y;vec3 c=h>0.0?mix(horizon,top,smoothstep(0.02,.72,h)):mix(horizon,ground,smoothstep(-.02,-.42,h));gl_FragColor=vec4(c,1.0);}`,
  });
  const sky=new THREE.Mesh(geo,material);sky.name='sky';scene.add(sky);
}

export function buildEnvironment(scene:THREE.Scene):EnvironmentController{
  const root=new THREE.Group();
  root.name='environment';
  addSky(scene);

  const desert=new THREE.Mesh(new THREE.PlaneGeometry(240,1250),new THREE.MeshStandardMaterial({color:0xc39158,roughness:1}));
  desert.rotation.x=-Math.PI/2;desert.position.set(0,-.075,-450);desert.receiveShadow=true;root.add(desert);

  const shoulderL=box(2.4,.08,650,0x8b6c49);shoulderL.position.set(-5.45,-.02,-300);root.add(shoulderL);
  const shoulderR=shoulderL.clone();shoulderR.position.x=5.45;root.add(shoulderR);

  const poleMat=mat(0x56483a,.96);
  const cactusMat=mat(0x5d7444,.96);
  const rockMats=[mat(0x925a3f,1),mat(0xa96747,1),mat(0x774a36,1)];
  const scrollables:ScrollEntry[]=[];
  const register=(object:THREE.Object3D,wrapMin:number,wrapMax:number)=>scrollables.push({object,wrapMin,wrapMax});

  for(let i=0;i<40;i++){
    const cluster=new THREE.Group();
    cluster.position.z=-24-i*15;
    const side=i%2===0?-1:1;

    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,5.7,8),poleMat);pole.position.set(side*8.25,2.8,0);pole.castShadow=true;cluster.add(pole);
    const arm=box(1.65,.08,.08,0x56483a);arm.position.set(side*7.72,5.45,0);cluster.add(arm);

    const cactus=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.19,.24,2.0,9),cactusMat);trunk.position.y=1;trunk.castShadow=true;cactus.add(trunk);
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,1.1,8),cactusMat);branch.rotation.z=Math.PI/2.8;branch.position.set(.38,1.25,0);branch.castShadow=true;cactus.add(branch);
    cactus.position.set(-side*(8.1+(i%3)*1.35),0,-4.5);cactus.scale.setScalar(.78+(i%4)*.14);cluster.add(cactus);

    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.70+(i%5)*.12,0),rockMats[i%rockMats.length]);
    rock.scale.set(1.55,.72,1.05);rock.position.set(side*(12+(i%4)*2.2),.4,-2.4);rock.rotation.set(.15,i*.8,.1);rock.castShadow=true;cluster.add(rock);

    const scrubMat=mat(i%2?0x78613f:0x6b583c,1);
    for(let n=0;n<3;n++){
      const scrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.32+n*.05,0),scrubMat);
      scrub.scale.set(1.5,.45,1);scrub.position.set(-side*(9.4+(i%5)+n*.35),.13,3.7+n*.35);scrub.rotation.y=.3*i+n;cluster.add(scrub);
    }

    root.add(cluster);register(cluster,-600,18);
  }

  // Mesas remain far outside the road corridor, so they can safely pass the player.
  // Recycle only after they are behind the chase camera; this removes the visible pop
  // that testers saw when the old -48 m wrap point deleted scenery in front of them.
  for(let i=0;i<14;i++){
    const group=new THREE.Group();
    group.position.z=-85-i*42;
    const side=i%2?-1:1;
    const lateral=30+(i%4)*7;
    const mesa=new THREE.Mesh(new THREE.CylinderGeometry(4+i%3,5+i%3,4+(i%2)*2,7),rockMats[i%rockMats.length]);
    mesa.scale.set(1.45+(i%3)*.35,1,1.05);mesa.position.set(side*lateral,2.1,0);mesa.rotation.y=i*.41;mesa.castShadow=true;mesa.receiveShadow=true;group.add(mesa);
    const shelf=new THREE.Mesh(new THREE.CylinderGeometry(2.6+i%2,4.0+i%2,1.4,7),rockMats[(i+1)%rockMats.length]);
    shelf.position.set(side*(lateral+3.8),4.2,-1.2);shelf.rotation.y=.2+i*.33;group.add(shelf);
    root.add(group);register(group,-650,48);
  }

  for(let i=0;i<4;i++){
    const gantry=new THREE.Group();gantry.position.z=-125-i*150;
    const postL=box(.24,8.2,.28,0x50504b);postL.position.set(-5.15,4.1,0);gantry.add(postL);
    const postR=postL.clone();postR.position.x=5.15;gantry.add(postR);
    const beam=box(10.6,.24,.30,0x50504b);beam.position.set(0,8.05,0);gantry.add(beam);
    const sign=box(4.0,1.05,.16,0x3f5f4f);sign.position.set(1.7,7.35,.02);gantry.add(sign);
    const signAccent=box(.95,.08,.18,0xb85c24);signAccent.position.set(.62,7.77,.04);gantry.add(signAccent);
    root.add(gantry);register(gantry,-640,4.0);
  }

  scene.add(root);

  return {
    root,
    update(dt:number,speed:number){
      const dz=speed*dt;
      for(const entry of scrollables){
        entry.object.position.z+=dz;
        if(entry.object.position.z>entry.wrapMax){
          entry.object.position.z-=entry.wrapMax-entry.wrapMin;
        }
      }
    },
  };
}

export function addLighting(scene:THREE.Scene){
  scene.fog=new THREE.FogExp2(0xd9bd8c,0.00435);
  const hemi=new THREE.HemisphereLight(0xd9ebf0,0x8e5535,1.56);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe0b0,3.45);sun.position.set(-18,26,16);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-12;sun.shadow.camera.near=.5;sun.shadow.camera.far=90;sun.shadow.bias=-.0005;scene.add(sun);
  const warm=new THREE.DirectionalLight(0xff7a3a,.46);warm.position.set(25,8,-35);scene.add(warm);
}
