import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const MODEL_PATHS = {
  player: '/models/rr_player_bike_proxy.glb',
  bike: '/models/rr_civilian_bike.glb',
  car: '/models/rr_traffic_car.glb',
  truck: '/models/rr_traffic_truck.glb',
  pothole: '/models/rr_pothole.glb',
  road: '/models/rr_road_3lane_60m.glb',
  guardrail: '/models/rr_guardrail_6m.glb',
} as const;

export type ModelKey = keyof typeof MODEL_PATHS;
export async function loadModels(){
  const out = {} as Record<ModelKey, Group>;
  await Promise.all((Object.keys(MODEL_PATHS) as ModelKey[]).map(async key => {
    const gltf = await loader.loadAsync(MODEL_PATHS[key]);
    gltf.scene.traverse(obj => {
      if ('isMesh' in obj && obj.isMesh) {
        const mesh = obj as import('three').Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    out[key] = gltf.scene;
  }));
  return out;
}
export function cloneModel(src: Group){ return src.clone(true); }
