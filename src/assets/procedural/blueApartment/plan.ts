import type { FixedBody } from "../../../game/navigation";

// All dimensions are in Haru's world units. X runs across the back wall and +Z points toward the entry.
export const plan = {
  left: -3.79,
  backLeft: -2.84,
  back: -3.24,
  notch: -2.25,
  divider: 1.17,
  right: 3.04,
  bathBack: 1.76,
  bathRight: -1.16,
  bathFront: 3.43,
  bathDoor: [2.13, 3.23],
  bedroomDividerEnd: -1.58,
  kitchenBack: -1.16,
  kitchenFront: 2.75,
  kitchenDoor: [.60, 1.68],
  balconyBack: -3.44,
  balconyRight: 3.39,
  entryLeft: -1.97,
  entryRight: .35,
  entryFront: 4.29,
  wall: .22,
  ceiling: 2.77,
  doorHeight: 1.97,
} as const;

export const windowOpening = { left: -2.33, right: .29, sill: 1.20, head: 2.45 };
export const bed = { x: -2.04, z: -1.29, width: 1.32, length: 2.82, quiltTop: .647 };
export const desk = { x: -.39, z: -2.84 };
export const chair = { x: desk.x, z: -2.02, seatY: .463 };
export const toilet = { x: -3.17, z: 2.44, seatY: .47 };

const bedFoot = bed.z + bed.length / 2;
export const apartmentLayout = {
  half: 4.25,
  spawn: { x: .24, z: -.24, rot: -.28 },
  desk: {
    stand: { x: chair.x, z: chair.z + .61, rot: Math.PI },
    sit: { x: chair.x, z: chair.z, rot: Math.PI, bodyY: chair.seatY + .124 },
  },
  bed: {
    stand: { x: bed.x, z: bedFoot + .32, rot: 0 },
    sit: { x: bed.x, z: bedFoot - .085, rot: 0, bodyY: bed.quiltTop + .07 },
    lie: { x: bed.x, z: bed.z - .24, rot: 0, bodyY: bed.quiltTop + .11 },
  },
  toilet: {
    stand: { x: toilet.x, z: toilet.z + .60, rot: 0 },
    sit: { x: toilet.x, z: toilet.z + .015, rot: 0, bodyY: toilet.seatY + .124 },
  },
};

export function obstacle(id: string, x0: number, x1: number, z0: number, z1: number): FixedBody {
  return { id, x: (x0 + x1) / 2, z: (z0 + z1) / 2, halfWidth: (x1 - x0) / 2, halfDepth: (z1 - z0) / 2 };
}
