import type { Object3D } from 'three';
import type { TrafficKind } from './config';

export type TrafficEntity = {
  kind: TrafficKind;
  lane: number;
  targetLane: number;
  pendingLane: number | null;
  indicatorDir: -1 | 0 | 1;
  indicatorTimer: number;
  x: number;
  z: number;
  speed: number;
  desiredSpeed: number;
  hit: boolean;
  near: boolean;
  veerPhase: number;
  veerRate: number;
  veerAmp: number;
  veerCooldown: number;
  object: Object3D;
};

export type PotholeEntity = {
  x: number;
  z: number;
  hit: boolean;
  object: Object3D;
};
