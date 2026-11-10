export type WorkshopVariant = 'citrus' | 'burgundy' | 'blackgold';

export interface WorkshopPalette {
  frame: number;
  top: number;
  trim: number;
  drawer: number;
  board: number;
  machine: number;
  mat: number;
  cue: number;
  cueAccent: number;
  feet: number;
}

export const workshopVariants = {
  citrus: {
    label: '球杆工坊 · 橘黄绿',
    level: 1,
    drawers: 1,
    cues: 1,
    tools: 1,
    palette: {
      frame: 0xed982b, top: 0xf6a338, trim: 0xffcf4b, drawer: 0xffc744,
      board: 0x176b48, machine: 0x278752, mat: 0x27845b,
      cue: 0x59372f, cueAccent: 0xc96527, feet: 0x74513c,
    },
  },
  burgundy: {
    label: '球杆工坊 · 酒红白',
    level: 2,
    drawers: 2,
    cues: 2,
    tools: 2,
    palette: {
      frame: 0x762b3d, top: 0xf4e8d6, trim: 0xf9eedc, drawer: 0x8b2c43,
      board: 0x78293f, machine: 0x922e49, mat: 0x822b40,
      cue: 0x532e2d, cueAccent: 0xeee0c6, feet: 0x652337,
    },
  },
  blackgold: {
    label: '球杆工坊 · 黑金',
    level: 3,
    drawers: 2,
    cues: 2,
    tools: 3,
    palette: {
      frame: 0x33323b, top: 0x3d3b44, trim: 0xd6a84c, drawer: 0x34333c,
      board: 0x2c2c34, machine: 0x383740, mat: 0x34433e,
      cue: 0x292932, cueAccent: 0xd6a84c, feet: 0xd6a84c,
    },
  },
} as const;

// Metres; the parts share one origin and can be reused outside these spaces.
export const benchSize = {
  width: 3,
  depth: 1.32,
  top: 1.11,
  shelfTop: .265,
  axis: 1.455,
  shaftStart: -.745,
  shaftEnd: .655,
  rackX: 1.755,
  rackZ: .035,
} as const;

// Hidden camera stations used by the visual-review workflow, never scene props.
export const workshopReviewStations = [
  { id: 'overview', theta: .64, phi: .97, zoom: 1, target: [.20, 1.20, -.17] },
  { id: 'front', theta: 0, phi: 1.16, zoom: 1, target: [.20, 1.10, -.17] },
  { id: 'back', theta: 3.78, phi: 1.02, zoom: 1, target: [.20, 1.02, -.17] },
  { id: 'top', theta: .12, phi: .24, zoom: 1, target: [.20, .5, -.17] },
  { id: 'lathe', theta: .28, phi: 1.03, zoom: .64, target: [-.10, 1.48, -.57] },
  { id: 'rack', theta: .86, phi: 1.12, zoom: .54, target: [1.62, 1.15, -.22] },
] as const;
