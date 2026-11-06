import * as T from "three";
import { buildDoor, shadowRoof } from "../blueApartment/architecture";
import { obstacle } from "../blueApartment/plan";
import { box, edges, tiles, timber, useWorldUV } from "../blueApartment/surfaces";
import { mesh, type P3 } from "../sculpt";
import { finish, group } from "./materials";
import { plan as p, stair, tallWindow, upperWindow } from "./plan";

type Span = readonly [x0: number, x1: number, z0: number, z1: number];
const wallHalf = p.wall / 2;

function wallZ(parent: T.Group, z: number, x0: number, x1: number, top: number, bottom = 0, cutFront = false) {
  return edges(box(parent, [x1 - x0, top - bottom, p.wall], [
    finish.cap, finish.cap, finish.cap, finish.cut, cutFront ? finish.cut : finish.plaster, finish.cut,
  ], [(x0 + x1) / 2, (bottom + top) / 2, z]));
}

function wallX(parent: T.Group, x: number, z0: number, z1: number, top: number, bottom = 0, cutLeft = false) {
  return edges(box(parent, [p.wall, top - bottom, z1 - z0], [
    finish.plaster, cutLeft ? finish.cut : finish.plaster, finish.cap, finish.cut, finish.cap, finish.cap,
  ], [x, (bottom + top) / 2, (z0 + z1) / 2]));
}

function surface(parent: T.Group, span: Span, material: T.Material, y: number, u: number, v: number) {
  const [x0, x1, z0, z1] = span;
  const geometry = new T.PlaneGeometry(x1 - x0, z1 - z0)
    .rotateX(-Math.PI / 2).translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  useWorldUV(geometry, "x", "z", u, v);
  const floor = mesh(parent, geometry, material);
  floor.castShadow = false;
  floor.userData.walkable = true;
}

function slab(parent: T.Group, [x0, x1, z0, z1]: Span, top: number, thickness: number, material: T.Material) {
  box(parent, [x1 - x0, thickness, z1 - z0], material, [(x0 + x1) / 2, top - thickness / 2, (z0 + z1) / 2]);
}

function floorMaterial(map: T.Texture) {
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.anisotropy = 4;
  return new T.MeshStandardMaterial({ map, roughness: .88 });
}

function rail(parent: T.Group, a: P3, b: P3, material: T.Material) {
  const start = new T.Vector3(...a);
  const end = new T.Vector3(...b);
  const direction = end.clone().sub(start);
  const length = direction.length();
  const count = Math.ceil(Math.hypot(direction.x, direction.z) / .183);
  const posts = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), material, count + 1);
  const transform = new T.Matrix4();
  const at = new T.Vector3();
  for (let i = 0; i <= count; i++) {
    at.lerpVectors(start, end, i / count);
    const width = i === 0 || i === count ? .057 : .025;
    posts.setMatrixAt(i, transform.makeScale(width, .88, width).setPosition(at.x, at.y + .44, at.z));
  }
  posts.castShadow = posts.receiveShadow = true;
  parent.add(posts);
  const mid = start.clone().lerp(end, .5);
  for (const [height, size] of [[.095, .038], [.865, .057]]) {
    const bar = box(parent, [size, length + .048, size], material, [mid.x, mid.y + height, mid.z]);
    bar.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.clone().normalize());
  }
}

function buildStair(parent: T.Group) {
  const stairs = group(parent, "oak-staircase", [0, 0, 0]);
  const width = stair.right - stair.left;
  const run = (stair.bottom - stair.top) / stair.steps;
  const rise = p.deckY / stair.steps;
  const center = (stair.left + stair.right) / 2;
  for (let i = 0; i < stair.steps; i++) {
    const top = (i + 1) * rise;
    const z = stair.bottom - (i + .5) * run;
    box(stairs, [width - .04, top - .038, run], finish.oak, [center, (top - .038) / 2, z]);
    const tread = box(stairs, [width - .015, .038, run], finish.oakLight, [center, top - .019, z]);
    tread.name = `loft-tread-${i + 1}`;
    tread.userData.walkable = true;
  }
  const stringer = new T.Shape().moveTo(stair.top, 0).lineTo(stair.bottom + .045, 0)
    .lineTo(stair.bottom, .071).lineTo(stair.top, p.deckY - .07).closePath();
  const geometry = new T.ExtrudeGeometry(stringer, { depth: .046, bevelEnabled: false }).rotateY(-Math.PI / 2);
  mesh(stairs, geometry, finish.plaster, [stair.left + .037, 0, 0]);
  mesh(stairs, geometry, finish.plaster, [stair.right + .034, 0, 0]);
  rail(stairs, [stair.right - .005, p.deckY, stair.top], [stair.right - .005, .016, stair.bottom], finish.oliveDark);
}

export function buildArchitecture(root: T.Group) {
  const shell = group(root, "loft-cutaway", [0, 0, 0]);
  const { left, backLeft, divider, right, back, leftBack, kitchenBack, front, ceiling, deckY, deckFront } = p;
  const wood = floorMaterial(timber([218, 172, 123]));
  const bathTile = floorMaterial(tiles("#b7a999", ["#d5c6b4", "#ddcebb", "#d8c9b8", "#d3c3b1"]));
  const entryTile = floorMaterial(tiles("#baa891", ["#d8c5ab", "#ddcbb3", "#d5c0a5", "#ddc9b0"]));

  const main: Span[] = [
    [backLeft, divider, back, leftBack], [left, divider, leftBack, kitchenBack],
    [left, right, kitchenBack, p.bathBack], [p.bathRight, right, p.bathBack, front],
    [p.entryLeft, p.bathRight, p.bathFront, front],
  ];
  const service: [Span, T.Material, number][] = [
    [[left, p.bathRight, p.bathBack, p.bathFront], bathTile, .61],
    [[p.entryLeft, p.entryRight, front, p.entryFront], entryTile, .64],
    [[p.balconyLeft, right, front, p.balconyFront], bathTile, .62],
  ];
  for (const span of main) {
    slab(shell, span, 0, .43, finish.cut);
    surface(shell, span, wood, .002, 3.20, 1.42);
  }
  for (const [span, material, repeat] of service) {
    slab(shell, span, 0, .43, finish.cut);
    surface(shell, span, material, .002, repeat, repeat);
  }

  wallZ(shell, back, backLeft - wallHalf, divider + wallHalf, ceiling);
  wallX(shell, backLeft, back + wallHalf, leftBack - wallHalf, ceiling, 0, true);
  wallZ(shell, leftBack, left - wallHalf, backLeft + wallHalf, ceiling);
  const sideCut = leftBack + .36;
  wallX(shell, left, leftBack + wallHalf, sideCut, ceiling, 0, true);
  wallX(shell, left, sideCut, p.bathBack - wallHalf, .27, 0, true);
  wallZ(shell, kitchenBack, divider - wallHalf, right + wallHalf, ceiling);

  const window = tallWindow;
  wallX(shell, right, kitchenBack + wallHalf, window.from, ceiling);
  wallX(shell, right, window.to, front, ceiling);
  wallX(shell, right, window.from, window.to, window.sill);
  wallX(shell, right, window.from, window.to, ceiling, window.head);

  wallX(shell, divider, back + wallHalf, kitchenBack - wallHalf, upperWindow.sill);
  wallX(shell, divider, back + wallHalf, upperWindow.from, ceiling, upperWindow.sill);
  wallX(shell, divider, upperWindow.to, kitchenBack - wallHalf, ceiling, upperWindow.sill);
  wallX(shell, divider, upperWindow.from, upperWindow.to, ceiling, upperWindow.head);

  const deck = group(root, "mezzanine-deck", [0, 0, 0]);
  const mezzanine: Span[] = [
    [backLeft, divider, back, leftBack],
    [left, divider, leftBack, stair.top],
    [stair.right, divider, stair.top, deckFront],
  ];
  for (const span of mezzanine) {
    slab(deck, span, deckY, p.deckThickness, finish.plaster);
    surface(deck, span, wood, deckY + .002, 3.20, 1.42);
  }
  box(deck, [divider - stair.right + .045, .035, .079], finish.oakLight,
    [(stair.right + divider) / 2, deckY - .015, deckFront + .009]);
  box(deck, [.21, deckY - p.deckThickness, .28], finish.plaster,
    [-1.04, (deckY - p.deckThickness) / 2, deckFront - .16]);
  wallZ(deck, -2.78, stair.right, -1.05, deckY - p.deckThickness);
  rail(deck, [stair.right, deckY, deckFront], [divider, deckY, deckFront], finish.oliveDark);
  rail(deck, [stair.right, deckY, stair.top], [stair.right, deckY, deckFront], finish.oliveDark);
  rail(deck, [divider, deckY, kitchenBack], [divider, deckY, deckFront], finish.oliveDark);
  buildStair(root);

  const bath = group(shell, "bath-cutaway-walls", [0, 0, 0]);
  wallZ(bath, p.bathBack, left - wallHalf, p.bathRight + wallHalf, 2.09);
  wallX(bath, left, p.bathBack + wallHalf, p.bathFront + wallHalf, .33, 0, true);
  wallZ(bath, p.bathFront, left + wallHalf, p.bathRight - wallHalf, .27, 0, true);
  wallX(bath, p.entryLeft, p.bathFront + wallHalf, front + wallHalf, .25, 0, true);
  const [doorStart, doorEnd] = p.bathDoor;
  wallX(bath, p.bathRight, p.bathBack + wallHalf, doorStart, 2.09);
  wallX(bath, p.bathRight, doorEnd, p.bathFront + wallHalf, 2.09);
  const bathDoor = buildDoor(bath, "loft-bathroom-door", p.bathRight + .117, doorStart + .023, .97, 1.48, "wood", false);
  for (const z of [doorStart + .012, doorEnd - .012]) {
    box(bath, [.205, 1.992, .046], finish.cap, [p.bathRight, .996, z]);
  }

  const entry = group(shell, "entry-cutaway", [0, 0, 0]);
  const entryDoorX = -2.48, entryDoorWidth = 1.04;
  wallX(entry, p.entryLeft, front + wallHalf, p.entryFront + wallHalf, .38, 0, true);
  wallX(entry, p.entryRight, front - wallHalf, p.entryFront + wallHalf, .89);
  wallZ(entry, p.entryFront, p.entryLeft + wallHalf, entryDoorX - entryDoorWidth / 2, .24, 0, true);
  wallZ(entry, p.entryFront, entryDoorX + entryDoorWidth / 2, p.entryRight - wallHalf, .49, 0, true);
  buildDoor(entry, "loft-entry-door", entryDoorX + entryDoorWidth / 2, p.entryFront, entryDoorWidth, Math.PI, "wood");
  for (const x of [entryDoorX - entryDoorWidth / 2 - .025, entryDoorX + entryDoorWidth / 2 + .025]) {
    box(entry, [.082, 2.045, .13], finish.cap, [x, 1.0225, p.entryFront]);
  }
  box(entry, [entryDoorWidth + .18, .075, .13], finish.cap, [entryDoorX, 2.03, p.entryFront]);
  box(entry, [p.entryRight - p.entryLeft - .19, .024, .10], finish.oakLight,
    [(p.entryLeft + p.entryRight) / 2, .012, front]).userData.walkable = true;

  wallZ(shell, front, p.entryRight + wallHalf, p.balconyLeft, .12, 0, true);
  const balcony = group(shell, "loft-balcony", [0, 0, 0]);
  rail(balcony, [p.balconyLeft, 0, front], [p.balconyLeft, 0, p.balconyFront], finish.iron);
  rail(balcony, [p.balconyLeft, 0, p.balconyFront], [right, 0, p.balconyFront], finish.iron);
  rail(balcony, [right, 0, p.balconyFront], [right, 0, front], finish.iron);

  shadowRoof(shell, backLeft, divider, back, leftBack, ceiling);
  shadowRoof(shell, left, divider, leftBack, kitchenBack, ceiling);
  shadowRoof(shell, left, right, kitchenBack, front, ceiling);

  const ground = [
    obstacle("left-recess", left, backLeft + wallHalf, back, leftBack + wallHalf),
    obstacle("behind-kitchen", divider + wallHalf, right, back, kitchenBack + wallHalf),
    obstacle("kitchen-back-wall", divider, right, kitchenBack - wallHalf, kitchenBack + wallHalf),
    obstacle("under-loft-storage", left, -1.03, back, -2.69),
    obstacle("loft-return-wall", divider - wallHalf, divider + wallHalf, back, kitchenBack),
    obstacle("mezzanine-post", -1.15, -.94, deckFront - .30, deckFront - .02),
    obstacle("bath-back-wall", left, p.bathRight + wallHalf, p.bathBack - wallHalf, p.bathBack + wallHalf),
    obstacle("bath-door-jamb", p.bathRight - wallHalf, p.bathRight + wallHalf, p.bathBack, doorStart),
    obstacle("bath-front-jamb", p.bathRight - wallHalf, p.bathRight + wallHalf, doorEnd, p.bathFront + wallHalf),
    bathDoor,
    obstacle("bath-front-cut", left, p.bathRight - wallHalf, p.bathFront - wallHalf, p.bathFront + wallHalf),
    obstacle("outside-bath", left, p.entryLeft + wallHalf, p.bathFront + wallHalf, p.entryFront),
    obstacle("outside-living", p.entryRight - wallHalf, p.balconyLeft + .035, front, p.entryFront),
    obstacle("outside-balcony", p.balconyLeft, right, p.balconyFront - .027, p.entryFront),
  ];
  const upper = [obstacle("upper-recess", left, backLeft + wallHalf, back, leftBack + wallHalf)];
  return { ground, upper };
}
