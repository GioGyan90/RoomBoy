import * as T from "three";
import { buildBook } from "../blueApartment/bedroom";
import { box, disc, edges, matte, plane, ring } from "../blueApartment/surfaces";
import { picture, plant } from "../gardenLoft/decor";
import { group } from "../gardenLoft/materials";
import { patch, rounded, type P3 } from "../sculpt";
import { cabinetPanel, feet, flowers, guestBook, handle, lamp, rug } from "./decor";
import { finish, type SuiteMaterials } from "./finishes";
import { bed as b, chair, desk, partition as div, plan as p } from "./plan";

function nightstand(parent: T.Group, at: P3, wood: SuiteMaterials) {
  const table = group(parent, "hotel-nightstand", at);
  const w = .693, d = .606;
  feet(table, w - .103, d - .106, .225, wood.walnut, .060);
  rounded(table, [w, .056, d], wood.walnutLight, [0, .697, 0], .015);
  box(table, [w - .068, .065, d - .071], wood.panel, [0, .201, -.012]);
  box(table, [w - .09, .405, .052], wood.panel, [0, .411, -d / 2 + .039]);
  for (const x of [-w / 2 + .051, w / 2 - .051]) box(table, [.066, .46, d - .061], wood.walnut, [x, .453, -.010]);
  rounded(table, [w - .105, .172, .052], wood.walnut, [0, .557, d / 2 - .025], .009);
  handle(table, [0, .557, d / 2 + .004], .148);
  return table;
}

export function buildBedroom(root: T.Group, wood: SuiteMaterials, art: T.Texture) {
  const room = group(root, "hotel-bedroom", [0, 0, 0]);
  rug(room, "bed", 3.44, 3.51, [b.x, .003, b.z + .385]);
  const bed = group(room, "bed", [b.x, 0, b.z]);
  const { width, length } = b;
  const head = -length / 2;
  feet(bed, width - .206, length - .201, .242, wood.walnut, .079);
  rounded(bed, [width + .035, .234, length], wood.walnut, [0, .247, 0], .033);
  edges(rounded(bed, [width + .176, 1.767, .152], wood.walnut, [0, .964, head + .012], .030), 58);
  rounded(bed, [width + .098, .062, .183], wood.walnutLight, [0, 1.847, head + .019], .018);
  rounded(bed, [width - .064, 1.449, .111], finish.oxbloodShadow, [0, 1.008, head + .107], .046);
  for (let i = 0; i < 6; i++) {
    const x = (i - 2.5) * (width - .126) / 6;
    rounded(bed, [(width - .145) / 6, 1.357, .113], i % 2 === 0 ? finish.oxblood : matte(0x6f2925),
      [x, 1.048, head + .138], .043);
  }
  rounded(bed, [width - .073, .222, length - .132], finish.cream, [0, .442, .027], .074).name = "hotel-mattress";

  const cover = (s: number, z: number, lift: number): P3 => {
    const side = T.MathUtils.smoothstep(Math.abs(s), .915, 1);
    const foot = T.MathUtils.smoothstep(z, length / 2 - .057, length / 2 + .077);
    const fold = Math.max(side, foot);
    return [s * (width / 2 + .037), b.quiltTop - fold * .234 + lift +
      .013 * (1 - foot) * Math.cos(s * 10 + z * 3) * side, z - .031 * Math.abs(s) ** 10];
  };
  const duvet = new T.MeshStandardMaterial({ color: 0xf1dac0, roughness: .94, side: T.DoubleSide });
  patch(bed, 42, 45, (u, v) => cover(2 * u - 1,
    T.MathUtils.lerp(head + .618, length / 2 + .077, v), .004 * Math.sin(v * 17)), duvet).name = "hotel-ivory-duvet";
  const band = new T.MeshStandardMaterial({ color: 0x80352c, roughness: .88, side: T.DoubleSide });
  patch(bed, 42, 16, (u, v) => cover(2 * u - 1, T.MathUtils.lerp(.305, .961, v),
    .012 + .011 * Math.sin(v * Math.PI)), band).name = "hotel-burgundy-bed-runner";
  const seam = new T.MeshStandardMaterial({ color: 0xa35444, roughness: .93, side: T.DoubleSide });
  for (const z of [.334, .929]) patch(bed, 42, 2, (u, v) => cover(2 * u - 1, z + .014 * v, .019), seam);
  for (const side of [-1, 1]) {
    const pillow = rounded(bed, [1.047, .166, .563], finish.linen, [side * .553, .649, head + .418], .080);
    pillow.name = side < 0 ? "hotel-pillow-left" : "hotel-pillow-right";
    pillow.rotation.set(.089, side * .056, side * .026);
  }

  const bedside = b.width / 2 + .468;
  const left = nightstand(room, [b.x - bedside, 0, p.back + .48], wood);
  const right = nightstand(room, [b.x + bedside, 0, p.back + .48], wood);
  flowers(left, [.037, .726, -.071], "wine", .83);
  buildBook(right, .036, .761, .063, 0xb38b58, .16);
  const sconces = [-1, 1].map(side => lamp(room, [b.x + side * bedside, 1.746, p.back + p.wall / 2 + .018], "wall"));
  picture(room, [b.x, 2.454, p.back + .129], 1.45, .830, art);
  return { bed, nightstands: [left, right], sconces };
}

export function buildPartition(root: T.Group, wood: SuiteMaterials) {
  const divider = group(root, "walnut-slat-divider", [div.x, 0, 0]);
  const length = div.end - div.back;
  const upperEnd = div.end - .58;
  const upperLength = upperEnd - div.back;
  const base = div.baseHeight;
  const center = (div.end + div.back) / 2;
  rounded(divider, [.286, base - .092, length], wood.walnut, [0, (base + .063) / 2, center], .023);
  box(divider, [.324, .078, length + .043], finish.walnutDark, [0, .042, center]);
  box(divider, [.319, .046, upperLength + .039], wood.walnutLight, [0, base - .011, (div.back + upperEnd) / 2]);
  const top = div.height;
  const slats = 15;
  const uprights = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), wood.walnut, slats);
  const transform = new T.Matrix4();
  for (let i = 0; i < slats; i++) {
    const post = i === 0 || i === slats - 1;
    const z = T.MathUtils.lerp(div.back + .056, upperEnd - .053, i / (slats - 1));
    uprights.setMatrixAt(i, transform.makeScale(post ? .254 : .064, top - base - .055, post ? .132 : .089)
      .setPosition(0, (top + base) / 2, z));
  }
  uprights.castShadow = uprights.receiveShadow = true;
  divider.add(uprights);
  edges(rounded(divider, [.276, .108, upperLength + .024], wood.walnutLight, [0, top - .019, (upperEnd + div.back) / 2], .018), 54);
  rounded(divider, [.322, .047, .594], wood.marble, [0, base + .003, div.end - .286], .016);
  flowers(divider, [-.022, base + .029, div.end - .275], "lily", .80);
  return divider;
}

export function buildStudy(root: T.Group, wood: SuiteMaterials) {
  const table = group(root, "hotel-writing-desk", [desk.x, 0, desk.z]);
  feet(table, desk.width - .22, desk.depth - .134, .750, wood.walnut, .067);
  rounded(table, [desk.width, .074, desk.depth], wood.walnutLight, [0, .794, 0], .019);
  rounded(table, [desk.width - .142, .155, desk.depth - .102], wood.walnut, [0, .690, 0], .013);
  for (const side of [-1, 1]) {
    const x = side * .474;
    rounded(table, [.874, .123, .027], wood.panel, [x, .696, desk.depth / 2 - .044], .007);
    handle(table, [x, .698, desk.depth / 2 - .024], .157);
  }
  buildBook(table, -.636, .865, .055, 0xae8153, -.19);
  buildBook(table, -.627, .929, .047, 0xccaa79, -.12);
  guestBook(table, [-.014, .830, .073]);
  const deskLamp = lamp(table, [.614, .833, -.114], "table");

  const seat = group(root, "chair", [chair.x, 0, chair.z]);
  feet(seat, .425, .389, .417, wood.walnut, .052);
  rounded(seat, [.519, .061, .499], wood.walnut, [0, .393, 0], .018);
  rounded(seat, [.505, .071, .465], finish.linen, [0, chair.seatY - .0355, -.014], .031);
  for (const side of [-1, 1]) {
    const rod = rounded(seat, [.049, .451, .053], wood.walnut, [side * .209, .620, .229], .012);
    rod.rotation.x = .092;
  }
  rounded(seat, [.536, .363, .107], finish.cream, [0, .727, .232], .041).rotation.x = .116;
  return { table, seat, deskLamp };
}

export function buildLounge(root: T.Group, wood: SuiteMaterials, art: T.Texture) {
  const room = group(root, "hotel-lounge", [0, 0, 0]);
  rug(room, "lounge", 4.66, 4.12, [2.67, .003, .823]);
  const sofa = group(room, "hotel-red-sofa", [1.18, 0, .804], Math.PI / 2);
  const leather = new T.MeshStandardMaterial({ color: 0x782d29, roughness: .60 });
  const piping = finish.oxbloodSeam;
  feet(sofa, 2.545, .756, .156, wood.walnut, .078);
  rounded(sofa, [2.86, .276, 1.009], finish.oxbloodShadow, [0, .258, -.020], .061);
  rounded(sofa, [2.82, .728, .264], leather, [0, .583, -.391], .086).rotation.x = -.048;
  for (const side of [-1, 1]) {
    rounded(sofa, [.243, .530, 1.034], leather, [side * 1.312, .462, .022], .057);
    rounded(sofa, [.190, .048, .887], piping, [side * 1.313, .714, -.008], .022);
    rounded(sofa, [1.169, .179, .708], leather, [side * .599, .429, .040], .065);
    rounded(sofa, [1.145, .620, .193], leather, [side * .596, .677, -.267], .069).rotation.x = -.157;
    rounded(sofa, [1.049, .013, .026], piping, [side * .596, .476, .383], .006);
    rounded(sofa, [.431, .416, .169], finish.linen, [side * .827, .674, -.087], .079)
      .rotation.set(-.395, side * -.139, side * .235);
  }

  const armchair = group(room, "hotel-tobacco-armchair", [4.20, 0, -.656], -.535);
  feet(armchair, .792, .655, .188, wood.walnut, .063);
  rounded(armchair, [1.041, .241, .906], wood.panel, [0, .235, 0], .057);
  rounded(armchair, [.998, .678, .205], finish.tanLeather, [0, .582, -.375], .091).rotation.x = -.119;
  rounded(armchair, [.811, .514, .155], finish.tanLeather, [0, .623, -.261], .056).rotation.x = -.146;
  rounded(armchair, [.786, .160, .680], finish.leatherSeam, [0, .401, .035], .060);
  for (const side of [-1, 1]) {
    const arm = rounded(armchair, [.161, .408, .812], finish.tanLeather, [side * .443, .454, .001], .071);
    arm.rotation.x = .084;
  }

  const table = group(room, "hotel-marble-coffee-table", [3.018, 0, .905]);
  feet(table, .759, 1.391, .457, wood.walnut, .077);
  rounded(table, [1.105, .125, 1.793], wood.walnut, [0, .472, 0], .059);
  rounded(table, [1.105, .030, 1.793], finish.darkBrass, [0, .542, 0], .014);
  rounded(table, [1.078, .047, 1.770], wood.marble, [0, .563, 0], .023);
  flowers(table, [-.050, .589, -.378], "wine", 1.0);
  buildBook(table, .055, .622, .410, 0xc29d6b, -.22);
  buildBook(table, .046, .689, .398, 0xd9bc89, -.13);

  const console = group(room, "hotel-walnut-media-console", [5.006, 0, 1.088], -Math.PI / 2);
  feet(console, 2.97, .565, .182, wood.walnut, .069);
  rounded(console, [3.197, .663, .687], wood.walnut, [0, .476, 0], .023);
  rounded(console, [3.246, .069, .736], wood.walnutLight, [0, .829, 0], .019);
  for (let i = 0; i < 6; i++) {
    const x = (i - 2.5) * .523;
    cabinetPanel(console, .504, .584, [x, .477, .348], wood);
    handle(console, [x + (i % 2 === 0 ? .171 : -.171), .547, .381], .154, false);
  }
  for (const x of [-1.601, 1.601]) {
    const end = group(console, "console-end-panel", [x, .463, 0], Math.sign(x) * Math.PI / 2);
    cabinetPanel(end, .584, .539, [0, 0, 0], wood);
  }
  const tv = group(console, "hotel-television", [-.101, .868, -.066]);
  tv.userData.interactive = { id: "television" };
  const black = matte(0x292c2b);
  rounded(tv, [1.12, .034, .312], black, [0, .015, .008], .012);
  rounded(tv, [.161, .173, .074], black, [0, .108, -.025], .014);
  rounded(tv, [2.519, 1.400, .075], black, [0, .854, 0], .026);
  const screen = new T.MeshBasicMaterial({ map: art });
  plane(tv, 2.425, 1.306, screen, [0, .862, .039]);
  disc(tv, .013, .006, matte(0xb1b791), [1.133, .181, .039]).rotation.x = Math.PI / 2;

  const rubber = plant(room, [1.065, .003, -2.102], 1.45, false, matte(0x423225));
  for (const [radius, y, size] of [[.211, .049, .015], [.236, .343, .009]]) {
    ring(rubber, radius, size, finish.darkBrass, [0, y, 0]).rotation.x = -Math.PI / 2;
  }
  return { sofa, armchair, table, console, rubber, screen };
}
