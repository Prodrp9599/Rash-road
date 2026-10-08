import * as THREE from 'three';

type Particle={life:number;vx:number;vy:number;vz:number};

export function createDustSystem(scene:THREE.Scene,count=140){
  const positions=new Float32Array(count*3);
  const particles:Particle[]=Array.from({length:count},()=>({life:0,vx:0,vy:0,vz:0}));
  for(let i=0;i<count;i++){positions[i*3+1]=-100}
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const material=new THREE.PointsMaterial({color:0xcda77b,size:.16,transparent:true,opacity:.48,depthWrite:false,sizeAttenuation:true});
  const points=new THREE.Points(geometry,material);points.frustumCulled=false;scene.add(points);
  let cursor=0;

  function spawn(x:number,z:number,speed:number,steer:number,nitro:boolean){
    const amount=Math.max(1,Math.min(5,Math.floor(speed/15)+(nitro?2:0)));
    for(let n=0;n<amount;n++){
      const i=cursor++%count,p=particles[i];
      p.life=.45+Math.random()*.65;
      p.vx=(Math.random()-.5)*.75-steer*.08;
      p.vy=.12+Math.random()*.28;
      p.vz=1.2+Math.random()*2.2+speed*.018;
      positions[i*3]=x+(Math.random()-.5)*.45;
      positions[i*3+1]=.12+Math.random()*.12;
      positions[i*3+2]=z+.75+Math.random()*.38;
    }
  }

  function update(dt:number){
    for(let i=0;i<count;i++){
      const p=particles[i];
      if(p.life<=0)continue;
      p.life-=dt;
      const k=i*3;
      if(p.life<=0){positions[k+1]=-100;continue}
      positions[k]+=p.vx*dt;
      positions[k+1]+=p.vy*dt;
      positions[k+2]+=p.vz*dt;
      p.vx*=.985;
      p.vy+=.04*dt;
    }
    (geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate=true;
    material.opacity=.35+.15*Math.sin(performance.now()*.0025);
  }

  return {spawn,update,points};
}
