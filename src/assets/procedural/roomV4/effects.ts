import * as THREE from "three";
import { ROOM_SCALE } from "./definitions";
import type { Refs, RoomProp } from "./entities";

export type RoomToggle = RoomProp | "night" | "television";

export interface RoomEffects {
  state: Partial<Record<RoomToggle, boolean>>;
  background: THREE.Color;
  toggle(id: RoomToggle): void;
  update(dt: number, time: number): void;
}

const DAY_SUN = new THREE.Color(0xfff0cf);
const NIGHT_SUN = new THREE.Color(0x8fa8e8);
const DAY_SKY = new THREE.Color(0xd8ecff);
const NIGHT_SKY = new THREE.Color(0x33406e);
const DAY_GROUND = new THREE.Color(0xf0d7b4);
const NIGHT_GROUND = new THREE.Color(0x1b1c2c);
const DAY_BACKGROUND = new THREE.Color(0x35405c);
const NIGHT_BACKGROUND = new THREE.Color(0x101729);
const POINT_LIGHT_SCALE = ROOM_SCALE ** 2;

export function createRoomEffects(refs: Refs) {
  const state: Record<RoomProp | "night", boolean> = {
    night: false,
    lamps: false,
    monitor: true,
    curtains: true,
  };
  const background = DAY_BACKGROUND.clone();
  const lamps = [refs.deskLamp, refs.nightLamp];
  const screen = refs.monitorScreen.material as THREE.MeshBasicMaterial;
  const monitorHalo = refs.monitorHalo.material as THREE.SpriteMaterial;
  let nightBlend = 0;
  let lampBlend = 0;
  let monitorBlend = 1;
  let curtainBlend = 0.42;

  function toggle(id: RoomToggle) {
    if (id === "television") return;
    state[id] = !state[id];
    if (id === "night") state.lamps = state.night;
  }

  function update(dt: number, time: number) {
    const blend = (value: number, target: number, speed: number) =>
      THREE.MathUtils.lerp(value, target, 1 - Math.exp(-dt * speed));

    nightBlend = blend(nightBlend, Number(state.night), 2.6);
    background.copy(DAY_BACKGROUND).lerp(NIGHT_BACKGROUND, nightBlend);
    refs.sun.intensity = THREE.MathUtils.lerp(2.75, 0.32, nightBlend);
    refs.sun.color.copy(DAY_SUN).lerp(NIGHT_SUN, nightBlend);
    refs.hemi.intensity = THREE.MathUtils.lerp(1.55, 0.62, nightBlend);
    refs.hemi.color.copy(DAY_SKY).lerp(NIGHT_SKY, nightBlend);
    refs.hemi.groundColor.copy(DAY_GROUND).lerp(NIGHT_GROUND, nightBlend);
    refs.ambient.intensity = THREE.MathUtils.lerp(0.42, 0.24, nightBlend);

    lampBlend = blend(lampBlend, Number(state.lamps), 6);
    for (const lamp of lamps) {
      lamp.light.intensity = 7.5 * POINT_LIGHT_SCALE * lampBlend;
      (lamp.shade.material as THREE.MeshToonMaterial).emissiveIntensity = 1.35 * lampBlend;
      (lamp.halo.material as THREE.SpriteMaterial).opacity = 0.5 * lampBlend;
    }
    refs.bathLight.intensity = 4.5 * POINT_LIGHT_SCALE * lampBlend;

    monitorBlend = blend(monitorBlend, Number(state.monitor), 6);
    screen.color.setRGB(
      THREE.MathUtils.lerp(0.16, 1, monitorBlend),
      THREE.MathUtils.lerp(0.18, 1, monitorBlend),
      THREE.MathUtils.lerp(0.22, 1, monitorBlend),
    );
    refs.monitorLight.intensity = 2.6 * POINT_LIGHT_SCALE * monitorBlend * (1 + 1.4 * nightBlend);
    monitorHalo.opacity = 0.28 * monitorBlend;

    curtainBlend = blend(curtainBlend, state.curtains ? 0.42 : 1, 4);
    refs.curtainL.scale.x = curtainBlend;
    refs.curtainR.scale.x = curtainBlend;
    refs.fanBlades.rotation.z -= dt * 7.5;

    const daylight = THREE.MathUtils.lerp(.75, .12, nightBlend);
    const exposure = THREE.MathUtils.lerp(1, .44, (curtainBlend - .42) / .58);
    refs.dust.update(time, daylight * exposure);
  }

  return { state, background, toggle, update };
}
