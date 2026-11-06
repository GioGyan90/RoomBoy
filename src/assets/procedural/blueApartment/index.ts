import * as T from "three";
import { canvasTexture, makeCanvas } from "../roomV4/utils";
import { plane } from "./surfaces";
import { damp } from "../../../core/math";
import { createNavigation, type FixedBody } from "../../../game/navigation";
import type { RoomEffects, RoomToggle } from "../roomV4/effects";
import { buildArchitecture, buildBalconyFront } from "./architecture";
import { buildBed, buildBedroomWindow, buildDeskAndChair, buildNightstand, buildWardrobe } from "./bedroom";
import { obstacle, plan as p } from "./plan";
import { buildBathroom, buildEntry, buildKitchen, buildLaundry } from "./serviceRooms";

const daySky = new T.Color(0xe6edff);
const nightSky = new T.Color(0x8b9acc);
const sunWarm = new T.Color(0xffdeb5);
const sunCool = new T.Color(0x9fb5ea);
const dayWindow = new T.Color(0xffffff);
const nightWindow = new T.Color(0x3f507f);
const dayBalcony = new T.Color(0x8caf93);

function environment(root: T.Group, window: ReturnType<typeof buildBedroomWindow>, balcony: T.MeshBasicMaterial,
  lamp: ReturnType<typeof buildNightstand>, bathLight: T.PointLight): RoomEffects {
  const hemi = new T.HemisphereLight(daySky, 0xe0c4bd, 1.62);
  const ambient = new T.AmbientLight(0xf2efff, .59);
  const sun = new T.DirectionalLight(sunWarm, 2.65);
  sun.position.set(-2.65, 7.3, -9.1);
  sun.target.position.set(-.34, 0, -1.55);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const camera = sun.shadow.camera;
  camera.left = camera.bottom = -6.2;
  camera.right = camera.top = 6.2;
  camera.near = .5;
  camera.far = 23;
  sun.shadow.bias = -.00018;
  sun.shadow.normalBias = .007;
  const fill = new T.DirectionalLight(0xdce4ff, .76);
  fill.position.set(-3.6, 6, 7);
  root.add(hemi, ambient, sun, sun.target, fill);

  const state: Partial<Record<RoomToggle, boolean>> = { night: false, lamps: false, curtains: true };
  const background = new T.Color(0x070709);
  let night = 0, lamps = 0, curtains = 1;
  function toggle(id: RoomToggle) {
    if (state[id] === undefined) return;
    state[id] = !state[id];
    if (id === "night") state.lamps = state.night;
  }

  function update(dt: number) {
    night = damp(night, Number(state.night), 3.4, dt);
    lamps = damp(lamps, Number(state.lamps), 6, dt);
    curtains = damp(curtains, state.curtains ? 1 : 2.67, 5, dt);
    sun.intensity = T.MathUtils.lerp(2.65, .18, night);
    sun.color.copy(sunWarm).lerp(sunCool, night);
    hemi.intensity = T.MathUtils.lerp(1.62, .68, night);
    hemi.color.copy(daySky).lerp(nightSky, night);
    fill.intensity = T.MathUtils.lerp(.76, .26, night);
    ambient.intensity = T.MathUtils.lerp(.59, .24, night);
    window.outside.color.copy(dayWindow).lerp(nightWindow, night);
    balcony.color.copy(dayBalcony).lerp(nightWindow, night);
    lamp.light.intensity = .14 + lamps * 3.6;
    lamp.shade.emissiveIntensity = .15 + lamps * .55;
    bathLight.intensity = lamps * 2.45;
    for (const panel of window.curtains) panel.scale.x = curtains;
  }

  return { state, background, toggle, update };
}

export function addContactShadows(root: T.Group, bodies: FixedBody[], floorY = 0) {
  const { canvas, ctx } = makeCanvas(96, 96);
  const gradient = ctx.createRadialGradient(48, 48, 5, 48, 48, 48);
  gradient.addColorStop(0, "rgba(48,37,54,.42)");
  gradient.addColorStop(.58, "rgba(48,37,54,.25)");
  gradient.addColorStop(1, "rgba(48,37,54,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 96, 96);
  const material = new T.MeshBasicMaterial({ map: canvasTexture(canvas), transparent: true, depthWrite: false });
  for (const { x, z, halfWidth, halfDepth } of bodies) {
    const shadow = plane(root, (halfWidth + .14) * 2.4, (halfDepth + .14) * 2.4, material, [x, floorY + .004, z]);
    shadow.rotation.x = -Math.PI / 2;
    shadow.raycast = () => {};
  }
}

export function footprint(object: T.Object3D): FixedBody {
  const { min, max } = new T.Box3().setFromObject(object);
  return obstacle(object.name, min.x, max.x, min.z, max.z);
}

export function createBlueApartment() {
  const root = new T.Group();
  root.name = "blue-apartment";
  const walls = buildArchitecture(root);
  const balcony = buildBalconyFront(root);
  const window = buildBedroomWindow(root);
  const bed = buildBed(root);
  const { table, seat } = buildDeskAndChair(root);
  const wardrobe = buildWardrobe(root);
  const lamp = buildNightstand(root);
  const { run, fridge } = buildKitchen(root);
  const bath = buildBathroom(root);
  const { washer, plant } = buildLaundry(root);
  buildEntry(root);
  const effects = environment(root, window, balcony.outside, lamp, bath.light);

  const furniture = [bed, table, seat, wardrobe, lamp.group, run, fridge, bath.toilet, bath.sink, bath.showerScreen, washer, plant];
  const bodies = furniture.map(footprint);
  addContactShadows(root, bodies.filter(body => body.id !== "shower-screen" && body.id !== "bath-sink"));
  const navigation = createNavigation([...walls, balcony.barrier, ...bodies], {
    minX: p.left + p.wall / 2, maxX: p.balconyRight - p.wall / 2,
    minZ: p.balconyBack + .055, maxZ: p.entryFront - p.wall / 2,
  });
  return { root, navigation, effects };
}
