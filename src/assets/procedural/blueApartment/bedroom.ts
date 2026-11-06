import * as T from "three";
import { mesh, patch, rounded, tube } from "../sculpt";
import { bed, chair, desk, plan as p, windowOpening as win } from "./plan";
import { box, disc, edges, frame, glass, landscape, matte, paint, plane, plaid, ring, useWorldUV } from "./surfaces";

export function buildBedroomWindow(root: T.Group) {
  const group = new T.Group();
  group.name = "bedroom-window";
  root.add(group);
  const width = win.right - win.left;
  const height = win.head - win.sill;
  const cx = (win.left + win.right) / 2;
  const cy = (win.sill + win.head) / 2;
  const outside = new T.MeshBasicMaterial({ map: landscape() });
  plane(group, width + .011, height + .011, outside, [cx, cy, p.back - .112]).raycast = () => {};

  const surround = new T.Group();
  surround.position.set(cx, cy, p.back + .045);
  group.add(surround);
  frame(surround, width + .055, height + .055, .128, .064, paint.steel);
  for (const sign of [-1, 1]) {
    const sash = new T.Group();
    sash.position.set(sign * width / 4, 0, .064 + sign * .016);
    surround.add(sash);
    const sashWidth = width / 2 - .048;
    const sashHeight = height - .073;
    frame(sash, sashWidth, sashHeight, .043, .037, paint.chrome);
    for (const offset of [-1, 1]) {
      box(sash, [.026, sashHeight, .040], paint.chrome, [offset * sashWidth / 6, 0, .006]);
      box(sash, [sashWidth, .026, .040], paint.chrome, [0, offset * sashHeight / 6, .006]);
    }
    glass(sash, sashWidth - .045, sashHeight - .045, [0, 0, -.005], .095);
    rounded(sash, [.032, .126, .028], paint.steel, [-sign * (sashWidth / 2 - .073), -.032, .035], .012);
  }
  edges(box(group, [width + .22, .066, .25], paint.white, [cx, win.sill - .037, p.back + .112]));

  const rodY = win.head + .13;
  const rodZ = p.back + .301;
  const rod = disc(group, .022, width + .44, paint.steel, [cx, rodY, rodZ]);
  rod.rotation.z = Math.PI / 2;
  for (const sign of [-1, 1]) {
    const knob = disc(group, .049, .036, paint.steel, [cx + sign * (width / 2 + .226), rodY, rodZ]);
    knob.rotation.z = Math.PI / 2;
  }

  const curtainMaterial = new T.MeshStandardMaterial({ color: 0x819fc9, roughness: .92, side: T.DoubleSide });
  const curtains = [1, -1].map(direction => {
    const curtain = new T.Group();
    curtain.name = direction === 1 ? "curtain-left" : "curtain-right";
    curtain.position.set(direction === 1 ? win.left - .12 : win.right + .12, rodY - .056, rodZ + .015);
    curtain.userData.interactive = { id: "curtains" };
    const w = .54;
    const h = 1.49;
    patch(curtain, 42, 11, (u, v) => {
      const pleat = Math.cos(u * Math.PI * 12);
      return [direction * (u * w + (u - .5) * v * .032), -v * h + v ** 6 * (.021 + pleat * .013),
        (.022 + v * .014) * pleat];
    }, curtainMaterial);
    for (let i = 0; i <= 6; i++) {
      const loop = ring(curtain, .037, .008, paint.steel, [direction * w * i / 6, .05, -.010]);
      loop.rotation.y = Math.PI / 2;
    }
    group.add(curtain);
    return curtain;
  });
  return { curtains, outside };
}

export function buildBed(root: T.Group) {
  const group = new T.Group();
  group.name = "bed";
  group.position.set(bed.x, 0, bed.z);
  root.add(group);
  const { width, length } = bed;
  const head = -length / 2 + .029;
  rounded(group, [width, .20, length], paint.oak, [0, .279, 0], .033);
  for (const x of [-width / 2 + .07, width / 2 - .07]) {
    for (const z of [head + .044, length / 2 - .062]) {
      rounded(group, [.079, .29, .079], paint.oakDark, [x, .145, z], .012);
    }
  }
  rounded(group, [width + .038, 1.06, .104], paint.oakLight, [0, .569, head - .028], .045);
  rounded(group, [width - .058, .91, .024], paint.oak, [0, .59, head + .027], .023);
  rounded(group, [width - .074, .23, length - .136], paint.white, [0, .465, .035], .083);

  const cloth = new T.MeshStandardMaterial({ map: plaid(), roughness: .95, side: T.DoubleSide });
  const quiltStart = -.527;
  const quiltEnd = length / 2 + .037;
  const cover = (s: number, z: number, turnDown: number, lift = 0): [number, number, number] => {
    const side = T.MathUtils.smoothstep(Math.abs(s), .81, 1);
    const ripple = Math.cos(s * 20 + z * 5) * .004 * Math.max(side, turnDown);
    return [s * .692 * (1 - .038 * turnDown), bed.quiltTop - .197 * Math.max(side, turnDown) + ripple + lift,
      z - Math.abs(s) ** 8 * .021];
  };
  const duvet = patch(group, 40, 49, (u, v) =>
    cover(2 * u - 1, T.MathUtils.lerp(quiltStart, quiltEnd, v), T.MathUtils.smoothstep(v, .943, 1)), cloth);
  duvet.name = "blue-checked-duvet";
  useWorldUV(duvet.geometry, "x", "z", .325, .31);

  const fold = patch(group, 40, 12, (u, v) =>
    cover(2 * u - 1, T.MathUtils.lerp(quiltStart - .29, quiltStart, v), 0, .020 * Math.sin(v * Math.PI)),
    new T.MeshStandardMaterial({ color: 0xfff6eb, roughness: .92, side: T.DoubleSide }));
  fold.name = "turned-white-sheet";

  const pillow = rounded(group, [.93, .144, .482], cloth, [0, .636, head + .314], .071);
  pillow.name = "blue-checked-pillow";
  pillow.rotation.y = -.065;
  useWorldUV(pillow.geometry, "x", "z", .30, .28);
  return group;
}

function buildBook(root: T.Group, x: number, y: number, z: number, color: number, angle: number) {
  const book = new T.Group();
  book.position.set(x, y, z);
  book.rotation.y = angle;
  root.add(book);
  rounded(book, [.333, .050, .246], paint.white, [0, 0, 0], .011);
  for (const sign of [-1, 1]) {
    rounded(book, [.358, .017, .263], matte(color), [0, sign * .028, 0], .008);
  }
  rounded(book, [.021, .064, .265], matte(color), [-.169, 0, 0], .010);
  for (const [width, zz] of [[.069, -.044], [.045, -.029]]) {
    box(book, [width, .002, .004], paint.oakLight, [.032, .038, zz]);
  }
}

export function buildDeskAndChair(root: T.Group) {
  const table = new T.Group();
  table.name = "desk";
  table.position.set(desk.x, 0, desk.z);
  root.add(table);
  rounded(table, [1.50, .083, .77], paint.oakLight, [0, .804, 0], .023);
  for (const z of [-.32, .32]) {
    rounded(table, [1.37, .115, .053], paint.oak, [0, .724, z], .011);
    for (const x of [-.668, .668]) {
      const leg = rounded(table, [.059, .76, .062], paint.oak, [x, .38, z], .013);
      leg.rotation.z = Math.sign(x) * .022;
    }
  }
  buildBook(table, -.32, .881, .022, 0x526d99, -.17);
  buildBook(table, -.31, .948, .004, 0x86a5cc, -.12);
  const cup = new T.Group();
  cup.position.set(.436, .846, -.052);
  table.add(cup);
  const profile = [[0, 0], [.064, 0], [.075, .012], [.084, .151], [.077, .156],
    [.069, .144], [.061, .025], [0, .025]].map(([x, y]) => new T.Vector2(x, y));
  mesh(cup, new T.LatheGeometry(profile, 24), paint.ceramic);
  disc(cup, .069, .003, matte(0x9d6a50), [0, .126, 0]);
  const handle = ring(cup, .043, .010, paint.ceramic, [.087, .095, 0], Math.PI * 1.32);
  handle.rotation.z = -Math.PI * .65;

  const seat = new T.Group();
  seat.name = "chair";
  seat.position.set(chair.x, 0, chair.z);
  root.add(seat);
  rounded(seat, [.561, .083, .532], paint.oak, [0, .392, 0], .022);
  rounded(seat, [.516, .066, .482], paint.blue, [0, chair.seatY - .033, -.01], .029);
  for (const x of [-.235, .235]) {
    const frontLeg = rounded(seat, [.048, .41, .050], paint.oak, [x, .205, -.216], .010);
    frontLeg.rotation.z = x * .16;
    const backLeg = rounded(seat, [.052, .90, .053], paint.oak, [x, .454, .237], .014);
    backLeg.rotation.x = .067;
  }
  const backrest = rounded(seat, [.515, .157, .060], paint.oakLight, [0, .807, .265], .023);
  const positions = backrest.geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    positions.setZ(i, positions.getZ(i) - .040 * (x / .26) ** 2);
  }
  backrest.geometry.computeVertexNormals();
  return { table, seat };
}

export function buildWardrobe(root: T.Group) {
  const group = new T.Group();
  group.name = "wardrobe";
  group.position.set(.740, 0, -2.48);
  group.rotation.y = -Math.PI / 2;
  root.add(group);
  rounded(group, [1.14, 2.12, .62], matte(0xe2d8d6), [0, 1.09, 0], .022);
  rounded(group, [1.10, .068, .61], paint.trim, [0, .035, .003], .009);
  for (const sign of [-1, 1]) {
    rounded(group, [.544, 2.053, .049], paint.white, [sign * .277, 1.099, .315], .015);
    tube(group, [[sign * .068, .965, .342], [sign * .068, .974, .369],
      [sign * .068, 1.123, .369], [sign * .068, 1.133, .342]], .013, paint.steel, 8);
  }
  return group;
}

export function buildNightstand(root: T.Group) {
  const group = new T.Group();
  group.name = "nightstand";
  group.position.set(-3.23, 0, -1.976);
  group.scale.y = 1.12;
  root.add(group);
  rounded(group, [.52, .375, .518], paint.oak, [0, .353, 0], .021);
  rounded(group, [.562, .057, .552], paint.oakLight, [0, .55, .006], .013);
  rounded(group, [.462, .28, .027], paint.oakLight, [0, .366, .262], .013);
  for (const x of [-.203, .203]) {
    for (const z of [-.210, .210]) rounded(group, [.048, .19, .048], paint.oakDark, [x, .095, z], .009);
  }
  tube(group, [[-.087, .374, .277], [-.055, .363, .301], [.058, .363, .301], [.086, .374, .277]], .010, paint.chrome, 8);

  const lamp = new T.Group();
  lamp.name = "bedside-lamp";
  lamp.position.set(-.025, .581, -.023);
  lamp.userData.interactive = { id: "lamps" };
  group.add(lamp);
  disc(lamp, .122, .038, paint.white, [0, .02, 0]);
  disc(lamp, .028, .199, paint.chrome, [0, .131, 0]);
  const shade = new T.MeshStandardMaterial({ color: 0xffedd7, emissive: 0xffc88f, emissiveIntensity: .15,
    roughness: .9, side: T.DoubleSide });
  const profile = [[.198, .211], [.20, .229], [.183, .284], [.143, .363], [.105, .405], [.055, .421]]
    .map(([x, y]) => new T.Vector2(x, y));
  mesh(lamp, new T.LatheGeometry(profile, 28), shade);
  disc(lamp, .051, .011, paint.white, [0, .421, 0]);
  const light = new T.PointLight(0xffcb8c, .14, 3.3, 2);
  light.position.set(0, .25, 0);
  lamp.add(light);
  return { group, light, shade };
}
