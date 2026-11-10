import * as T from 'three';
import { createNavigation } from '../../../game/navigation';
import type { RoomLayout } from '../../../game/rooms';
import type { RoomEffects, RoomToggle } from '../roomV4/effects';
import { box } from './geometry';
import { createCueWorkbench } from './workbench';
import type { WorkshopVariant } from './variants';

// These inspection spaces have no seats. The shared action runner's unused
// anchors stay on the floor; availableSeats suppresses every furniture action.
const anchor = { x: -.85, z: 1.02, rot: Math.PI };
const seated = { ...anchor, bodyY: .65 };
export const workshopLayout: RoomLayout = {
  half: 2.7,
  spawn: anchor,
  availableSeats: [],
  desk: { stand: anchor, sit: seated },
  bed: { stand: anchor, sit: seated, lie: seated },
  toilet: { stand: anchor, sit: seated },
};

function lighting(root: T.Group): RoomEffects {
  const background = new T.Color(0xeee8e0);
  const hemi = new T.HemisphereLight(0xfff8ed, 0xb9a69b, 1.30);
  const ambient = new T.AmbientLight(0xffffff, .28);
  const key = new T.DirectionalLight(0xfff1d9, 2.40);
  key.position.set(-3, 6, 5);
  key.target.position.set(0, .85, -.2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -3.7, right: 3.7, top: 3.7, bottom: -3.7, near: .2, far: 16 });
  key.shadow.normalBias = .012;
  key.shadow.bias = -.00015;
  key.shadow.radius = 3;
  const fill = new T.DirectionalLight(0xdce8ff, .58);
  fill.position.set(4, 3, -3);
  root.add(hemi, ambient, key, key.target, fill);
  const state: Partial<Record<RoomToggle, boolean>> = { night: false, lamps: true };
  let night = 0, lamps = 1;
  const day = new T.Color(0xeee8e0), dark = new T.Color(0x404451);
  return {
    state, background,
    toggle(id) { if (state[id] !== undefined) state[id] = !state[id]; },
    update(dt) {
      const blend = 1 - Math.exp(-dt * 4);
      night = T.MathUtils.lerp(night, Number(state.night), blend);
      lamps = T.MathUtils.lerp(lamps, Number(state.lamps), blend);
      background.copy(day).lerp(dark, night);
      hemi.intensity = T.MathUtils.lerp(1.30, .65, night);
      ambient.intensity = T.MathUtils.lerp(.28, .17, night);
      key.intensity = T.MathUtils.lerp(2.40, .55, night) * T.MathUtils.lerp(.4, 1, lamps);
      fill.intensity = T.MathUtils.lerp(.58, .25, night);
    },
  };
}

export function createCueWorkshop(variant: WorkshopVariant) {
  const root = new T.Group();
  root.name = `cue-workshop-${variant}`;
  const floor = box(root, 'workshop-floor', [4.9, .12, 3.6],
    new T.MeshStandardMaterial({ color: 0xe2d9c9, roughness: 1 }), [.18, -.06, .18]);
  floor.userData.walkable = true;
  const bench = createCueWorkbench(variant);
  bench.position.z = -.25;
  root.add(bench);
  const navigation = createNavigation([
    { id: 'workbench', x: 0, z: -.25, halfWidth: 1.50, halfDepth: .68 },
    { id: 'cue-rack', x: 1.755, z: -.215, halfWidth: .26, halfDepth: .20 },
  ], { minX: -2.27, maxX: 2.63, minZ: -1.62, maxZ: 1.98 });
  return { root, navigation, effects: lighting(root) };
}
