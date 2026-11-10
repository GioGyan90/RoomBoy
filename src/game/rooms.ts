import { createCruiseCabin } from "../assets/procedural/cruiseCabin";
import { cruiseLayout } from "../assets/procedural/cruiseCabin/plan";
import { createHotelSuite } from "../assets/procedural/hotelSuite";
import { hotelLayout } from "../assets/procedural/hotelSuite/plan";
import { createGardenLoft } from "../assets/procedural/gardenLoft";
import { loftLayout } from "../assets/procedural/gardenLoft/plan";
import { createBlueApartment } from "../assets/procedural/blueApartment";
import { apartmentLayout } from "../assets/procedural/blueApartment/plan";
import { createRoomV4 } from "../assets/procedural/roomV4/entities";
import { createRoomNavigation } from "../assets/procedural/roomV4/colliders";
import { createRoomEffects } from "../assets/procedural/roomV4/effects";
import { GAME_LAYOUT, roomFrameScale } from "../assets/procedural/roomV4/definitions";
import { applyRoomOverrides } from "../assets/registry";
import { createCueWorkshop, workshopLayout } from "../assets/procedural/cueWorkshop";
import { workshopVariants, type WorkshopVariant } from "../assets/procedural/cueWorkshop/variants";
import type { Seat } from "./types";

type Spot = { x: number; y?: number; z: number; rot: number };
type SeatedSpot = Spot & { bodyY: number };
type SeatLayout = { stand: Spot; sit: SeatedSpot };

export interface RoomLayout {
  half: number;
  spawn: Spot;
  availableSeats?: readonly Seat[];
  desk: SeatLayout;
  bed: SeatLayout & { lie: SeatedSpot };
  toilet: SeatLayout;
}

function workshopProfile(variant: WorkshopVariant) {
  return {
    label: workshopVariants[variant].label,
    layout: workshopLayout,
    defaultView: 'room' as const,
    camera: { theta: .64, phi: .97, target: [.20, 1.02, -.17], gameRadius: 5.6, roomRadius: 4.35, orthographic: true },
    frameScale: (aspect: number) => Math.max(1, 1.38 / aspect),
    create: () => createCueWorkshop(variant),
  };
}

export const rooms = {
  v4: {
    label: "原版房间",
    layout: GAME_LAYOUT,
    camera: { theta: .57, phi: 1.03, target: [0, .65, 0], gameRadius: 11.3, roomRadius: 12, orthographic: false },
    frameScale: roomFrameScale,
    create() {
      const { root, registry, refs } = createRoomV4();
      applyRoomOverrides(root, registry);
      return { root, navigation: createRoomNavigation({ root, registry, refs }), effects: createRoomEffects(refs) };
    },
  },
  apartment: {
    label: "蓝灰公寓",
    layout: apartmentLayout,
    camera: { theta: -.341, phi: .910, target: [-.227, 1.085, .40], gameRadius: 10.05, roomRadius: 9.62, orthographic: true },
    frameScale: (aspect: number) => Math.max(1, 1.13 / aspect),
    create: createBlueApartment,
  },
  loft: {
    label: "米绿 Loft",
    layout: loftLayout,
    camera: { theta: -.438, phi: 1.07, target: [-.45, 1.79, .58], gameRadius: 13.35, roomRadius: 12.42, orthographic: true },
    frameScale: (aspect: number) => Math.max(1, 1.48 / aspect),
    create: createGardenLoft,
  },
  hotel: {
    label: "枣红酒店套房",
    layout: hotelLayout,
    camera: { theta: -.398, phi: 1.062, target: [-.80, 1.49, .34], gameRadius: 13.64, roomRadius: 12.8, orthographic: true },
    frameScale: (aspect: number) => Math.max(1, 1.49 / aspect),
    create: createHotelSuite,
  },
  cruise: {
    label: "船舱卧室",
    layout: cruiseLayout,
    camera: { theta: -.398, phi: 1.062, target: [0, 1.3, 0], gameRadius: 12.8, roomRadius: 12.3, orthographic: true },
    frameScale: (aspect: number) => Math.max(1, 1.45 / aspect),
    create: createCruiseCabin,
  },
  'workshop-citrus': workshopProfile('citrus'),
  'workshop-burgundy': workshopProfile('burgundy'),
  'workshop-blackgold': workshopProfile('blackgold'),
} as const;

export type RoomId = keyof typeof rooms;
