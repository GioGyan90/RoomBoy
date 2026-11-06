import * as T from "three";
import { damp } from "../../../core/math";
import { createNavigation } from "../../../game/navigation";
import { addContactShadows, footprint } from "../blueApartment";
import { scenery } from "../gardenLoft/decor";
import type { RoomEffects, RoomToggle } from "../roomV4/effects";
import { buildArchitecture, buildWindow } from "./architecture";
import type { lamp } from "./decor";
import { suiteMaterials } from "./finishes";
import { buildBedroom, buildLounge, buildPartition, buildStudy } from "./furniture";
import { plan as p } from "./plan";
import { buildBathroom, buildEntry } from "./serviceRooms";

function environment(root: T.Group, window: ReturnType<typeof buildWindow>, screen: T.MeshBasicMaterial,
  lights: ReturnType<typeof lamp>[]): RoomEffects {
  const daySky = new T.Color(0xfff1e4), nightSky = new T.Color(0x7d89be);
  const daySun = new T.Color(0xffe4bf), nightSun = new T.Color(0xaab7f2);
  const bright = new T.Color(0xffffff), darkWindow = new T.Color(0x364b76);
  const screenOff = new T.Color(0x1d2527);
  const hemi = new T.HemisphereLight(daySky, 0xbca395, 1.56);
  const ambient = new T.AmbientLight(0xfff4ed, .51);
  const fill = new T.DirectionalLight(0xfff2e8, .84);
  fill.position.set(-5, 6, 8);
  const sun = new T.DirectionalLight(daySun, 2.35);
  sun.position.set(-.78, 8.65, -10.65);
  sun.target.position.set(3.18, 0, 1.01);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -8;
  sun.shadow.camera.right = sun.shadow.camera.top = 8;
  sun.shadow.camera.near = .35;
  sun.shadow.camera.far = 28;
  sun.shadow.bias = -.00018;
  sun.shadow.normalBias = .006;
  root.add(hemi, ambient, fill, sun, sun.target);

  const state: Partial<Record<RoomToggle, boolean>> = { night: false, lamps: true, television: true, curtains: true };
  let night = 0, glow = 1, drape = 0, tv = 1;
  function toggle(id: RoomToggle) {
    if (state[id] === undefined) return;
    state[id] = !state[id];
    if (id === "night" && state.night) state.lamps = true;
  }
  function update(dt: number) {
    night = damp(night, Number(state.night), 3.1, dt);
    glow = damp(glow, Number(state.lamps), 5.1, dt);
    drape = damp(drape, Number(!state.curtains), 4.4, dt);
    tv = damp(tv, Number(state.television), 5.7, dt);
    sun.color.copy(daySun).lerp(nightSun, night);
    sun.intensity = T.MathUtils.lerp(2.35, .19, night);
    hemi.color.copy(daySky).lerp(nightSky, night);
    hemi.intensity = T.MathUtils.lerp(1.56, .55, night);
    ambient.intensity = T.MathUtils.lerp(.51, .22, night);
    fill.intensity = T.MathUtils.lerp(.84, .28, night);
    window.outdoor.color.copy(bright).lerp(darkWindow, night);
    screen.color.copy(screenOff).lerp(bright, tv);
    for (const { drape: panel, tie } of window.curtains) {
      panel.morphTargetInfluences![0] = drape;
      tie.scale.setScalar(1 - drape * .90);
      tie.visible = drape < .58;
    }
    for (const { shade, light } of lights) {
      shade.emissiveIntensity = .09 + glow * .35;
      if (light) light.intensity = glow * (.66 + night * 1.63);
    }
  }
  update(0);
  return { state, background: new T.Color(0x080708), toggle, update };
}

export function createHotelSuite() {
  const root = new T.Group();
  root.name = "hotel-suite";
  const materials = suiteMaterials();
  const walls = buildArchitecture(root, materials);
  const window = buildWindow(root);
  const art = scenery(false);
  const bedroom = buildBedroom(root, materials, art);
  const divider = buildPartition(root, materials);
  const study = buildStudy(root, materials);
  const lounge = buildLounge(root, materials, art);
  const bath = buildBathroom(root, materials);
  const entry = buildEntry(root, materials);

  const furniture = [
    bedroom.bed, ...bedroom.nightstands, study.table, study.seat, lounge.sofa, lounge.armchair,
    lounge.table, lounge.console, lounge.rubber, bath.tub, bath.vanity, bath.seat, entry.service, entry.wardrobe, entry.rack,
  ].map(footprint);
  addContactShadows(root, furniture);
  const navigation = createNavigation([...walls, footprint(divider), ...furniture], {
    minX: p.bathLeft + p.wall / 2, maxX: p.right - p.wall / 2, minZ: p.back + p.wall / 2, maxZ: p.entryFront - p.wall / 2,
  });
  const effects = environment(root, window, lounge.screen, [...bedroom.sconces, study.deskLamp, ...bath.lights]);
  return { root, navigation, effects };
}
