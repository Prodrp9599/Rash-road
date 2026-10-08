import type { Object3D } from 'three';
import type { TrafficKind } from './config';
export type TrafficEntity = { kind: TrafficKind; lane:number; x:number; z:number; speed:number; hit:boolean; near:boolean; object:Object3D };
export type PotholeEntity = { x:number; z:number; hit:boolean; object:Object3D };
