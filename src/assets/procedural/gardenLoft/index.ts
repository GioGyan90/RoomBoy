import * as T from "three";
import { damp } from "../../../core/math";
import { addContactShadows, footprint } from "../blueApartment";
import type { RoomEffects, RoomToggle } from "../roomV4/effects";
import { buildArchitecture } from "./architecture";
import { scenery } from "./decor";
import { buildBedroom, buildDining, buildLivingRoom, buildWorkspace } from "./furniture";
import { createLoftNavigation } from "./navigation";
import { plan } from "./plan";
import { buildBathroom, buildEntryAndExercise, buildKitchen } from "./serviceRooms";
import { buildWindows } from "./windows";

function environment(root: T.Group, windows: ReturnType<typeof buildWindows>, screen: T.MeshBasicMaterial,
  lamps: ReturnType<typeof buildWorkspace>["lamp"][], bath: ReturnType<typeof buildBathroom>): RoomEffects {
  const daySky = new T.Color(0xf0f0ff), nightSky = new T.Color(0x7185c0);
  const daySun = new T.Color(0xffe0b0), nightSun = new T.Color(0xa4b4ed);
  const dayView = new T.Color(0xffffff), nightView = new T.Color(0x40507b);
  const screenOff = new T.Color(0x252c29);

  const hemi = new T.HemisphereLight(daySky, 0xdec7b4, 1.61);
  const ambient = new T.AmbientLight(0xfff4e7, .55);
  const sun = new T.DirectionalLight(daySun, 2.29);
  sun.position.set(9.7, 8.1, -3.5);
  sun.target.position.set(-.4, 0, .52);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -7.6;
  sun.shadow.camera.right = sun.shadow.camera.top = 7.6;
  sun.shadow.camera.near = .5;
  sun.shadow.camera.far = 26;
  sun.shadow.bias = -.00023;
  sun.shadow.normalBias = .006;
  const fill = new T.DirectionalLight(0xfff4eb, 1.01);
  fill.position.set(-5.8, 8, 7.3);
  root.add(hemi, ambient, sun, sun.target, fill);

  const state: Partial<Record<RoomToggle, boolean>> = { night: false, lamps: false, television: true, curtains: true };
  const background = new T.Color(0x070708);
  let night = 0, light = 0, tv = 1, drape = 1;

  function toggle(id: RoomToggle) {
    if (state[id] === undefined) return;
    state[id] = !state[id];
    if (id === "night") state.lamps = state.night;
  }

  function update(dt: number) {
    night = damp(night, Number(state.night), 3.2, dt);
    light = damp(light, Number(state.lamps), 5.8, dt);
    tv = damp(tv, Number(state.television), 6, dt);
    drape = damp(drape, state.curtains ? 1 : 5.28, 5.3, dt);
    sun.intensity = T.MathUtils.lerp(2.29, .22, night);
    sun.color.copy(daySun).lerp(nightSun, night);
    hemi.intensity = T.MathUtils.lerp(1.61, .63, night);
    hemi.color.copy(daySky).lerp(nightSky, night);
    ambient.intensity = T.MathUtils.lerp(.55, .19, night);
    fill.intensity = T.MathUtils.lerp(1.01, .26, night);
    for (const window of windows.outdoor) window.color.copy(dayView).lerp(nightView, night);
    for (const { panel, hooks } of windows.curtains) {
      panel.scale.x = drape;
      for (const hook of hooks) hook.scale.y = 1 / drape;
    }
    for (const lamp of lamps) {
      lamp.light.intensity = .14 + light * 2.9;
      lamp.shade.emissiveIntensity = .15 + light * .67;
    }
    bath.light.intensity = .12 + light * 2.6;
    bath.wallLight.emissiveIntensity = .23 + light * 1.01;
    screen.color.copy(screenOff).lerp(dayView, tv);
  }

  return { state, background, toggle, update };
}

export function createGardenLoft() {
  const root = new T.Group();
  root.name = "garden-loft";
  const shell = buildArchitecture(root);
  const windows = buildWindows(root);
  const landscape = scenery(false);
  const bedroom = buildBedroom(root, landscape);
  const study = buildWorkspace(root);
  const kitchen = buildKitchen(root);
  const dining = buildDining(root);
  const living = buildLivingRoom(root, landscape);
  const bath = buildBathroom(root);
  const entry = buildEntryAndExercise(root);

  const groundFurniture = [
    study.table, study.seat, study.storage, kitchen.run, kitchen.fridge, dining.table, ...dining.chairs,
    living.sofa, living.coffee, living.console, entry.rubberPlant, entry.balconyPlant, entry.cupboard, bath.seat, bath.vanity,
  ].map(footprint);
  const upperFurniture = [bedroom.bed, bedroom.nightstand, bedroom.wardrobe].map(footprint);
  addContactShadows(root, groundFurniture);
  addContactShadows(root, upperFurniture, plan.deckY);
  const navigation = createLoftNavigation([
    ...shell.ground, ...groundFurniture, ...[living.divider, bath.screen, bath.front].map(footprint),
  ], [...shell.upper, ...upperFurniture]);
  const effects = environment(root, windows, living.screen, [bedroom.bedside, study.lamp], bath);
  return { root, navigation, effects };
}
