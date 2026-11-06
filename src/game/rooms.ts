import { createBlueApartment } from "../assets/procedural/blueApartment";
import { apartmentLayout } from "../assets/procedural/blueApartment/plan";
import { createRoomV4 } from "../assets/procedural/roomV4/entities";
import { createRoomNavigation } from "../assets/procedural/roomV4/colliders";
import { createRoomEffects } from "../assets/procedural/roomV4/effects";
import { GAME_LAYOUT, roomFrameScale } from "../assets/procedural/roomV4/definitions";
import { applyRoomOverrides } from "../assets/registry";

export type RoomLayout = typeof GAME_LAYOUT;

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
} as const;

export type RoomId = keyof typeof rooms;
