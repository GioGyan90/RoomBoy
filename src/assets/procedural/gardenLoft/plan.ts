import type { RoomLayout } from "../../../game/rooms";

// X follows the long back walls, and +Z runs from the kitchen and bedroom toward the entry.
export const plan = {
  left: -6.16, backLeft: -4.56, divider: .62, right: 5.10,
  back: -4.72, leftBack: -3.32, kitchenBack: -2.96, front: 4.36,
  wall: .18, ceiling: 4.32,
  deckY: 2.26, deckFront: -1.73, deckThickness: .25,
  bathBack: 1.31, bathFront: 3.68, bathRight: -3.18, bathDoor: [2.49, 3.54],
  entryLeft: -4.27, entryRight: -.53, entryFront: 5.63,
  balconyLeft: 3.52, balconyFront: 4.99,
} as const;

export const stair = { left: -6.07, right: -4.82, top: -2.66, bottom: .49, steps: 13 };
export const tallWindow = { from: -2.79, to: 3.96, sill: .13, head: 4.15 };
export const upperWindow = { from: -4.48, to: -3.17, sill: 3.05, head: 4.10 };
export const bed = { x: -2.25, z: -3.52, width: 1.76, length: 2.17, quiltTop: .61 };
export const desk = { x: -3.80, z: -2.34, width: 1.46, depth: .66 };
export const chair = { x: desk.x, z: -1.51, seatY: .461 };
export const toilet = { x: -5.55, z: 2.13, seatY: .47 };

const foot = bed.z + bed.length / 2;
export const loftLayout: RoomLayout = {
  half: 6.2,
  spawn: { x: -.95, z: 3.50, rot: -.32 },
  desk: {
    stand: { x: chair.x, z: chair.z + .62, rot: Math.PI },
    sit: { x: chair.x, z: chair.z, rot: Math.PI, bodyY: chair.seatY + .124 },
  },
  bed: {
    stand: { x: bed.x, y: plan.deckY, z: foot + .39, rot: 0 },
    sit: { x: bed.x, y: plan.deckY, z: foot - .078, rot: 0, bodyY: bed.quiltTop + .07 },
    lie: { x: bed.x, y: plan.deckY, z: bed.z - .16, rot: 0, bodyY: bed.quiltTop + .11 },
  },
  toilet: {
    stand: { x: toilet.x, z: toilet.z + .84, rot: 0 },
    sit: { x: toilet.x, z: toilet.z + .015, rot: 0, bodyY: toilet.seatY + .124 },
  },
};
