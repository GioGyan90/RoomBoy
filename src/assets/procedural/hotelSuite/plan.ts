import type { RoomLayout } from "../../../game/rooms";

export const plan = {
  left: -7.05, backLeft: -5.25, divider: -.10, right: 5.55,
  back: -4.43, leftBack: -3.26, loungeBack: -3.10, front: 3.70,
  leftCut: -1.73, wall: .22, ceiling: 3.78,
  bathLeft: -8.01, bathBack: 1.19, bathFront: 4.47, bathRight: -3.69, bathHeight: 2.23, bathDoor: [2.60, 3.83],
  entryLeft: -3.69, entryRight: 1.20, entryFront: 5.75, doorHeight: 1.97,
} as const;

export const window = { left: .85, right: 5.36, sill: .15, head: 3.60 };
export const partition = { x: -.28, back: plan.back + .16, end: .18, baseHeight: .85, height: 3.31 };
export const bed = { x: -2.69, z: -3.021, width: 2.40, length: 2.52, quiltTop: .617 };
export const desk = { x: 3.18, z: -2.534, width: 1.93, depth: .675 };
export const chair = { x: desk.x - .13, z: -1.743, seatY: .455 };
export const toilet = { x: plan.bathRight - .74, z: 1.988, seatY: .47 };
export const tub = { x: plan.bathLeft + .978, z: 3.071 };

const foot = bed.z + bed.length / 2;
export const hotelLayout: RoomLayout = {
  half: 8.2,
  spawn: { x: -.91, z: 2.47, rot: -.34 },
  desk: {
    stand: { x: chair.x, z: chair.z + .63, rot: Math.PI },
    sit: { x: chair.x, z: chair.z, rot: Math.PI, bodyY: chair.seatY + .124 },
  },
  bed: {
    stand: { x: bed.x, z: foot + .43, rot: 0 },
    sit: { x: bed.x, z: foot - .105, rot: 0, bodyY: bed.quiltTop + .077 },
    lie: { x: bed.x, z: bed.z - .145, rot: 0, bodyY: bed.quiltTop + .103 },
  },
  toilet: {
    stand: { x: toilet.x, z: toilet.z + .80, rot: 0 },
    sit: { x: toilet.x, z: toilet.z + .015, rot: 0, bodyY: toilet.seatY + .124 },
  },
};
