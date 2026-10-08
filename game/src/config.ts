export const LANES = [-2.75, 0, 2.75] as const;
export const ROAD_HALF_WIDTH = 4.25;
export const PLAYER = {
  maxSpeed: 50,
  nitroMaxSpeed: 58,
  baseAcceleration: 4.2,
  nitroAcceleration: 18,
  brakeDeceleration: 28,
  minSpeed: 10,
  sideClamp: 4.02,
};
export type TrafficKind = 'bike' | 'car' | 'truck';
export const TRAFFIC = {
  bike: { width: .42, damage: 4, minSpeed: 16, maxSpeed: 27, postHitInv: .72 },
  car: { width: 1.03, damage: 10, minSpeed: 20, maxSpeed: 32, postHitInv: 1.0 },
  truck: { width: 1.30, damage: 16, minSpeed: 14, maxSpeed: 23, postHitInv: 1.2 },
} satisfies Record<TrafficKind, {width:number; damage:number; minSpeed:number; maxSpeed:number; postHitInv:number}>;
