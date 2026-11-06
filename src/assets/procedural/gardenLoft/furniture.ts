import * as T from "three";
import { buildBook, buildLamp } from "../blueApartment/bedroom";
import { box, disc, edges, matte, paint, plane } from "../blueApartment/surfaces";
import { patch, rounded, type P3 } from "../sculpt";
import { bouquet, fabricMat, mug, picture, plant } from "./decor";
import { cabinet, finish, group, pull } from "./materials";
import { bed as b, chair, desk, plan as p } from "./plan";

function legs(parent: T.Group, width: number, depth: number, height: number, size = .054) {
  for (const x of [-width / 2, width / 2]) {
    for (const z of [-depth / 2, depth / 2]) {
      const leg = rounded(parent, [size, height, size], finish.oakEdge, [x, height / 2, z], .012);
      leg.rotation.set(Math.sign(z) * -.044, 0, Math.sign(x) * .045);
    }
  }
}

export function chairModel(parent: T.Group, name: string, at: P3, angle: number, cushion: T.Material) {
  const seat = group(parent, name, at, angle);
  legs(seat, .42, .40, .414, .046);
  rounded(seat, [.49, .061, .474], finish.oak, [0, .397, 0], .016);
  rounded(seat, [.461, .059, .438], cushion, [0, chair.seatY - .0295, -.013], .027);
  for (const x of [-.211, .211]) {
    rounded(seat, [.049, .485, .047], finish.oak, [x, .636, .225], .013).rotation.x = .10;
  }
  rounded(seat, [.472, .172, .065], cushion, [0, .802, .246], .028).rotation.x = .10;
  return seat;
}

export function buildBedroom(root: T.Group, landscape: T.Texture) {
  const room = group(root, "loft-bedroom", [0, p.deckY, 0]);
  fabricMat(room, "bedroom-rug", 2.25, 2.52, [b.x, .004, b.z + .16], matte(0xd4b799), finish.cotton);
  const bed = group(room, "bed", [b.x, 0, b.z]);
  const { width, length } = b;
  const head = -length / 2;
  legs(bed, width - .19, length - .17, .23, .085);
  rounded(bed, [width, .183, length], finish.oak, [0, .258, 0], .031);
  edges(rounded(bed, [width + .013, .917, .085], finish.oakLight, [0, .517, head + .014], .034), 50);
  rounded(bed, [width - .105, .746, .028], finish.oak, [0, .543, head + .064], .021);
  const mattress = rounded(bed, [width - .067, .219, length - .133], finish.ivory, [0, .439, .033], .078);
  mattress.name = "loft-mattress";
  const pillow = rounded(bed, [.83, .138, .438], finish.cotton, [0, .619, head + .40], .064);
  pillow.rotation.set(.055, -.095, 0);
  pillow.name = "loft-pillow";

  const quiltStart = -.382;
  const quiltEnd = length / 2 + .014;
  const cloth = new T.MeshStandardMaterial({ color: 0x4e5b3b, side: T.DoubleSide, roughness: .96 });
  const corner = (s: number, z: number, fall: number, roll: number): P3 => {
    const edge = T.MathUtils.smoothstep(Math.abs(s), .91, 1);
    return [s * width * .518, b.quiltTop - .205 * Math.max(fall, edge) + roll +
      .003 * Math.cos(s * 18 + z * 5) * edge, z - .039 * Math.abs(s) ** 8];
  };
  patch(bed, 36, 40, (u, v) => corner(u * 2 - 1, T.MathUtils.lerp(quiltStart, quiltEnd, v),
    T.MathUtils.smoothstep(v, .969, 1), .008 * Math.sin(v * Math.PI)), cloth).name = "olive-duvet";
  const fold = new T.MeshStandardMaterial({ color: 0xffefd9, side: T.DoubleSide, roughness: .94 });
  patch(bed, 36, 11, (u, v) => corner(u * 2 - 1, T.MathUtils.lerp(quiltStart - .259, quiltStart, v),
    0, .021 * Math.sin(v * Math.PI)), fold).name = "cream-folded-sheet";

  const nightstand = group(room, "loft-nightstand", [-3.56, 0, -4.18]);
  legs(nightstand, .423, .378, .122, .045);
  rounded(nightstand, [.527, .462, .445], finish.oak, [0, .346, 0], .023);
  rounded(nightstand, [.566, .060, .482], finish.oakLight, [0, .601, 0], .018);
  for (const y of [.264, .465]) {
    rounded(nightstand, [.489, .179, .037], finish.oakLight, [0, y, .228], .010);
    pull(nightstand, [0, y, .251], .101, true);
  }
  const bedside = buildLamp(nightstand, [-.049, .635, -.061]);
  bedside.group.scale.setScalar(.87);
  plant(nightstand, [.121, .631, .112], .47, true);

  const wardrobe = group(room, "loft-wardrobe", [-.176, 0, -4.22]);
  cabinet(wardrobe, 1.17, 1.91, .66, 2, finish.trim, finish.ivory);
  rounded(wardrobe, [1.20, .041, .69], finish.cotton, [0, 1.905, 0], .013);
  picture(room, [-2.44, 1.525, p.back + .116], 1.10, .65, landscape);
  return { bed, nightstand, wardrobe, bedside };
}

export function buildWorkspace(root: T.Group) {
  const table = group(root, "loft-writing-desk", [desk.x, 0, desk.z]);
  legs(table, desk.width - .136, desk.depth - .12, .763);
  rounded(table, [desk.width, .073, desk.depth], finish.oakLight, [0, .80, 0], .021);
  box(table, [desk.width - .12, .102, .048], finish.oak, [0, .716, desk.depth / 2 - .068]);
  const lamp = buildLamp(table, [-.51, .837, -.123]);
  lamp.group.scale.setScalar(.68);
  const tablet = group(table, "desk-tablet", [.012, .846, .026], -.18);
  rounded(tablet, [.464, .024, .291], paint.steel, [0, .005, 0], .014);
  rounded(tablet, [.419, .004, .251], matte(0x9ca7a4), [0, .019, 0], .011);
  const cup = group(table, "pencil-cup", [.505, .837, -.125]);
  disc(cup, .064, .108, finish.cotton, [0, .054, 0]);
  for (const [i, tint] of [0x92734f, 0x42533c, 0xc3a573, 0x7b4f38].entries()) {
    const pencil = disc(cup, .008, .142 + .012 * i, matte(tint), [-.035 + .02 * i, .141, .019 * Math.sin(i)]);
    pencil.rotation.z = .11 * (i - 1.5);
  }
  rounded(table, [.116, .025, .094], finish.ivory, [-.354, .847, .172], .012);

  const seat = chairModel(root, "chair", [chair.x, 0, chair.z], 0, finish.oliveLight);
  const storage = group(root, "loft-study-sideboard", [-2.10, 0, -2.377]);
  cabinet(storage, 1.65, .80, .62, 3, finish.oakEdge, finish.ivory);
  rounded(storage, [1.70, .051, .66], finish.oakLight, [0, .816, 0], .014);
  for (const [i, color] of [0x526851, 0xc8b699, 0x717d5b, 0x446449, 0x8a795f].entries()) {
    const upright = group(storage, "upright-book", [-.57 + i * .111, 1.026 + (i % 2) * .018, -.102]);
    upright.rotation.z = Math.PI / 2 + i * .021;
    buildBook(upright, 0, 0, 0, color, 0);
  }
  plant(storage, [.523, .841, .047], .64, true);
  return { table, seat, storage, lamp };
}

export function buildDining(root: T.Group) {
  const table = group(root, "dining-table", [2.14, 0, -1.274]);
  legs(table, 1.12, .65, .75);
  rounded(table, [1.37, .069, .92], finish.oakLight, [0, .761, 0], .064);
  box(table, [1.18, .103, .69], finish.oak, [0, .697, 0]);
  mug(table, [-.43, .797, .175]);
  mug(table, [.42, .797, .080]);
  bouquet(table, [.015, .797, -.10]);
  const chairs = [
    chairModel(root, "dining-chair-left", [1.14, 0, -1.212], -Math.PI / 2 + .12, finish.ivory),
    chairModel(root, "dining-chair-right", [3.16, 0, -1.26], Math.PI / 2 - .21, finish.ivory),
  ];
  return { table, chairs };
}

export function buildLivingRoom(root: T.Group, landscape: T.Texture) {
  const living = group(root, "loft-living-room", [0, 0, 0]);
  fabricMat(living, "living-room-rug", 3.14, 2.79, [-.51, .003, 1.49], matte(0xddc9ad), finish.ivory);
  const sofa = group(living, "cream-sofa", [-1.68, 0, 1.49], Math.PI / 2);
  legs(sofa, 2.39, .76, .16, .079);
  rounded(sofa, [2.68, .27, 1.03], finish.cotton, [0, .24, 0], .069);
  rounded(sofa, [2.62, .73, .236], finish.cotton, [0, .57, -.392], .093);
  for (const x of [-.748, 0, .748]) {
    rounded(sofa, [.728, .173, .725], finish.ivory, [x, .433, .048], .069);
    rounded(sofa, [.725, .589, .186], finish.ivory, [x, .697, -.256], .076).rotation.x = -.18;
  }
  for (const side of [-1, 1]) {
    rounded(sofa, [.204, .53, 1.055], finish.ivory, [side * 1.228, .465, .028], .062);
    rounded(sofa, [.427, .407, .163], finish.olive, [side * .84, .684, -.063], .079)
      .rotation.set(-.37, -.13 * side, side * .18);
  }

  const coffee = group(living, "coffee-table", [.27, 0, 1.49]);
  legs(coffee, .57, 1.26, .475, .051);
  rounded(coffee, [.782, .073, 1.50], finish.oakLight, [0, .509, 0], .086);
  buildBook(coffee, .024, .585, .268, 0x826748, -.11);
  buildBook(coffee, .037, .650, .241, 0x4f6747, -.22);
  mug(coffee, [-.086, .548, -.491]);

  const divider = group(living, "tv-low-divider", [2.42, 0, 1.63]);
  edges(box(divider, [.156, 1.29, 2.10], finish.plaster, [0, .645, 0]));
  box(divider, [.182, .045, 2.15], finish.cap, [0, 1.307, 0]);
  const console = group(living, "oak-media-console", [2.026, 0, 1.68], -Math.PI / 2);
  legs(console, 2.02, .432, .146);
  rounded(console, [2.18, .381, .536], finish.oak, [0, .317, 0], .032);
  rounded(console, [2.23, .056, .566], finish.oakLight, [0, .535, 0], .017);
  for (const x of [-.704, 0, .704]) {
    rounded(console, [.682, .291, .038], finish.ivory, [x, .322, .266], .012);
    pull(console, [x, .323, .292], .094, true);
  }
  const television = group(console, "flat-screen-television", [-.19, .564, -.047]);
  television.userData.interactive = { id: "television" };
  rounded(television, [.725, .038, .251], finish.iron, [0, .020, 0], .015);
  rounded(television, [.124, .155, .074], finish.iron, [0, .100, -.021], .014);
  rounded(television, [1.65, .966, .070], matte(0x2d312f), [0, .638, 0], .022);
  const screen = new T.MeshBasicMaterial({ map: landscape });
  plane(television, 1.565, .883, screen, [0, .643, .036]);
  disc(television, .010, .005, matte(0x89a068), [.739, .177, .038]).rotation.x = Math.PI / 2;
  plant(console, [.859, .563, .036], .57, true);
  return { sofa, coffee, divider, console, screen };
}
