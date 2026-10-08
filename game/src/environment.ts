import * as THREE from 'three';

function mat(color:number, roughness=.9, metalness=.05){return new THREE.MeshStandardMaterial({color,roughness,metalness})}
function box(w:number,h:number,d:number,color:number){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.castShadow=true;m.receiveShadow=true;return m}

export type EnvironmentController = {
  root: THREE.Group;
  update: (dt:number, speed:number) => void;
};

function addSky(scene:THREE.Scene){
  const geo=new THREE.SphereGeometry(260,32,18);
  const material=new THREE.ShaderMaterial({
    side:THREE.BackSide,
    depthWrite:false,
    uniforms:{
      top:{value:new THREE.Color(0x84b6c9)},
      horizon:{value:new THREE.Color(0xf3c685)},
      ground:{value:new THREE.Color(0xcf7649)},
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

  // Ground is genuinely under the road. Repeating roadside geometry supplies motion/parallax;
  // there is no nearby background card.
  const desert=new THREE.Mesh(new THREE.PlaneGeometry(220,1200),new THREE.MeshStandardMaterial({color:0xc49259,roughness:1}));
  desert.rotation.x=-Math.PI/2;desert.position.set(0,-.07,-430);desert.receiveShadow=true;root.add(desert);

  const shoulderL=box(2.2,.08,620,0x8f704d);shoulderL.position.set(-5.35,-.02,-285);root.add(shoulderL);
  const shoulderR=shoulderL.clone();shoulderR.position.x=5.35;root.add(shoulderR);

  const poleMat=mat(0x56483a,.96);
  const cactusMat=mat(0x5d7444,.96);
  const rockMats=[mat(0x9a5f41,1),mat(0xb16b46,1),mat(0x7e4e37,1)];
  const scrollables:THREE.Object3D[]=[];
  const WRAP_MIN=-555,WRAP_MAX=45,WRAP_RANGE=WRAP_MAX-WRAP_MIN;

  for(let i=0;i<38;i++){
    const cluster=new THREE.Group();
    cluster.position.z=-20-i*15;
    const side=i%2===0?-1:1;

    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,5.7,8),poleMat);pole.position.set(side*8.0,2.8,0);pole.castShadow=true;cluster.add(pole);
    const arm=box(2.0,.08,.08,0x56483a);arm.position.set(side*7.45,5.45,0);cluster.add(arm);

    const cactus=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.19,.24,2.0,9),cactusMat);trunk.position.y=1;trunk.castShadow=true;cactus.add(trunk);
    const branch=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,1.1,8),cactusMat);branch.rotation.z=Math.PI/2.8;branch.position.set(.38,1.25,0);branch.castShadow=true;cactus.add(branch);
    cactus.position.set(-side*(7.4+(i%3)*1.25),0,-4.5);cactus.scale.setScalar(.78+(i%4)*.14);cluster.add(cactus);

    const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.75+(i%5)*.14,0),rockMats[i%rockMats.length]);
    rock.scale.set(1.8,.8,1.15);rock.position.set(side*(11+(i%4)*2),.45,-2.4);rock.rotation.set(.15,i*.8,.1);rock.castShadow=true;cluster.add(rock);

    const scrub=box(.8,.03,2.5,i%2?0x8b6642:0x76583c);scrub.position.set(-side*(9+(i%5)),.01,4);scrub.rotation.y=.3*i;cluster.add(scrub);
    root.add(cluster);scrollables.push(cluster);
  }

  // Large volumetric mesas give real parallax and fog depth rather than looking painted on.
  for(let i=0;i<12;i++){
    const group=new THREE.Group();
    group.position.z=-72-i*45;
    const side=i%2?-1:1;
    const mesa=new THREE.Mesh(new THREE.CylinderGeometry(4+i%3,5+i%3,4+(i%2)*2,7),rockMats[i%rockMats.length]);
    mesa.scale.set(1.7+(i%3)*.5,1,1);mesa.position.set(side*(18+(i%4)*7),2.1,0);mesa.rotation.y=i*.41;mesa.castShadow=true;mesa.receiveShadow=true;group.add(mesa);
    const shelf=new THREE.Mesh(new THREE.CylinderGeometry(2.8+i%2,4.4+i%2,1.5,7),rockMats[(i+1)%rockMats.length]);
    shelf.position.set(side*(21+(i%4)*7),4.3,-1.2);shelf.rotation.y=.2+i*.33;group.add(shelf);
    root.add(group);scrollables.push(group);
  }

  // Physical gantries occlude the road and pass over the camera's line of sight.
  for(let i=0;i<4;i++){
    const gantry=new THREE.Group();gantry.position.z=-110-i*145;
    const postL=box(.22,5.5,.25,0x50504b);postL.position.set(-5,2.75,0);gantry.add(postL);
    const postR=postL.clone();postR.position.x=5;gantry.add(postR);
    const beam=box(10.2,.22,.28,0x50504b);beam.position.set(0,5.25,0);gantry.add(beam);
    const sign=box(5.7,1.25,.14,0x3f5f4f);sign.position.set(.7,4.55,.02);gantry.add(sign);
    const signAccent=box(1.15,.08,.16,0xb85c24);signAccent.position.set(-1.1,5.08,.04);gantry.add(signAccent);
    root.add(gantry);scrollables.push(gantry);
  }

  scene.add(root);

  return {
    root,
    update(dt:number,speed:number){
      const dz=speed*dt;
      for(const object of scrollables){
        object.position.z+=dz;
        if(object.position.z>WRAP_MAX)object.position.z-=WRAP_RANGE;
      }
    },
  };
}

export function addLighting(scene:THREE.Scene){
  scene.fog=new THREE.FogExp2(0xd9bd8c,0.0044);
  const hemi=new THREE.HemisphereLight(0xd9ebf0,0x8e5535,1.58);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe0b0,3.45);sun.position.set(-18,26,16);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-20;sun.shadow.camera.right=20;sun.shadow.camera.top=22;sun.shadow.camera.bottom=-12;sun.shadow.camera.near=.5;sun.shadow.camera.far=90;sun.shadow.bias=-.0005;scene.add(sun);
  const warm=new THREE.DirectionalLight(0xff7a3a,.48);warm.position.set(25,8,-35);scene.add(warm);
}
