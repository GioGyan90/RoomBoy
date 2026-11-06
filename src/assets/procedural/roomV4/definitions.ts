// The diorama is authored at twice the scale used by Haru's rig.
export const ROOM_SCALE = 0.5;

export const ROOM = {
  half: 6,
  wallH: 5.6,
  wallT: 0.35,
  bath: {
    x0: 1.4,
    z0: 1.4,
    wallH: 3.0,
    doorZ0: 4.0,
    doorZ1: 5.5,
    doorH: 2.55,
  },
};

export const WINDOW = {
  x0: -2.6,
  x1: 0.6,
  y0: 2.8,
  y1: 4.8,
};

export const COLORS = {
  cream: 0xf7e7cc,
  creamDark: 0xe3cda9,
  mint: 0xa9d8c3,
  mintDark: 0x6fa992,
  cut: 0xbdb7d2,
  wood: 0xc48c53,
  woodLight: 0xdcae75,
  woodDark: 0x8a5a30,
  white: 0xfbf6ea,
  ceramic: 0xf4faf8,
  metal: 0xc6ccd4,
  fabric: 0x7fbdd1,
  fabricDeep: 0x4a88a3,
  rug: 0xdcbb92,
  leaf: 0x74b06a,
  leafDeep: 0x4c8448,
  accent: 0xea8b68,
  accentYellow: 0xf3c860,
  ink: 0x2a2338,
  tile: 0xdfecec,
};

export const BED = { x: -3.85, z: -1.95, length: 3.6, depth: 2.9, blanketY: 1.14, blanketHeight: 0.3 };
export const DESK = { x: -0.9, z: -5.15 };
export const CHAIR = { x: DESK.x, z: -3.78, rotation: Math.PI, cushionY: 1.14, cushionHeight: 0.1, heightScale: 0.8 };

const bedFoot = (BED.x + BED.length / 2) * ROOM_SCALE;
const bedZ = BED.z * ROOM_SCALE;
const blanketTop = (BED.blanketY + BED.blanketHeight / 2) * ROOM_SCALE;
const chairX = CHAIR.x * ROOM_SCALE;
const chairZ = CHAIR.z * ROOM_SCALE;
const chairTop = (CHAIR.cushionY + CHAIR.cushionHeight / 2) * CHAIR.heightScale * ROOM_SCALE;

export const GAME_LAYOUT = {
  half: ROOM.half * ROOM_SCALE,
  spawn: { x: -0.86, z: 0.4, rot: 0.45 },
  desk: {
    stand: { x: chairX + 0.43, z: chairZ + 0.25, rot: Math.PI },
    sit: { x: chairX, z: chairZ, rot: CHAIR.rotation, bodyY: chairTop + 0.124 },
  },
  bed: {
    stand: { x: bedFoot + 0.36, z: bedZ, rot: Math.PI / 2 },
    sit: { x: bedFoot - 0.09, z: bedZ, rot: Math.PI / 2, bodyY: blanketTop + 0.07 },
    lie: { x: BED.x * ROOM_SCALE - 0.05, z: bedZ, rot: Math.PI / 2, bodyY: blanketTop + 0.11 },
  },
};

export function roomFrameScale(aspect: number): number {
  return Math.max(1, 0.95 / aspect);
}
