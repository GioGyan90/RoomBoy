import * as T from "three";
import { buildToilet, counterWithBasin } from "../blueApartment/serviceRooms";
import { box, disc, matte, plane, tiles, useWorldUV } from "../blueApartment/surfaces";
import { mug } from "../gardenLoft/decor";
import { group } from "../gardenLoft/materials";
import { mesh, patch, rounded, tube, type P3 } from "../sculpt";
import { canvasTexture, makeCanvas } from "../roomV4/utils";
import { cabinetPanel, feet, flowers, handle, lamp, rug } from "./decor";
import { finish, type SuiteMaterials } from "./finishes";
import { plan as p, toilet, tub as basin } from "./plan";

function bathtubGeometry() {
  // Outer base to the rolled rim, then down the inner wall into the basin.
  const profile = [
    [.024, .326, .657], [.047, .382, .735], [.127, .416, .806], [.344, .471, .905],
    [.530, .512, .967], [.613, .531, .994], [.645, .527, 1.006], [.663, .512, 1.001],
    [.665, .494, .987], [.650, .471, .965], [.620, .462, .947], [.535, .442, .906],
    [.373, .404, .823], [.217, .358, .707], [.141, .306, .596], [.119, .249, .482],
  ];
  const segments = 56;
  const vertices: number[] = [];
  const triangles: number[] = [];
  for (const [y, rx, rz] of profile) {
    for (let i = 0; i < segments; i++) {
      const a = i / segments * Math.PI * 2;
      const x = Math.cos(a), z = Math.sin(a);
      vertices.push(Math.sign(x) * Math.abs(x) ** .832 * rx, y, Math.sign(z) * Math.abs(z) ** .86 * rz);
    }
  }
  for (let row = 0; row < profile.length - 1; row++) {
    for (let i = 0; i < segments; i++) {
      const a = row * segments + i, b = row * segments + (i + 1) % segments;
      triangles.push(a, a + segments, b, b, a + segments, b + segments);
    }
  }
  const last = (profile.length - 1) * segments;
  const bottom = vertices.length / 3;
  vertices.push(0, profile[0][0], 0, 0, profile.at(-1)![0], 0);
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    triangles.push(bottom, i, next, bottom + 1, last + next, last + i);
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(triangles);
  geometry.computeVertexNormals();
  return geometry;
}

function buildBathtub(parent: T.Group) {
  const bath = group(parent, "hotel-freestanding-bathtub", [basin.x, 0, basin.z], .050);
  mesh(bath, bathtubGeometry(), finish.porcelain).name = "hotel-hollow-tub-shell";
  disc(bath, .036, .006, finish.darkBrass, [0, .125, -.231]);
  disc(bath, .023, .006, finish.nickel, [0, .130, -.231]);
  disc(bath, .028, .009, finish.darkBrass, [.031, .469, -.859]).rotation.x = 1.29;

  const faucet = group(bath, "hotel-floor-mounted-tub-faucet", [-.617, 0, -.676]);
  disc(faucet, .090, .031, finish.darkBrass, [0, .016, 0]);
  disc(faucet, .031, .657, finish.brass, [0, .344, 0]);
  tube(faucet, [[0, .634, 0], [0, .822, 0], [.126, .939, 0], [.241, .904, .009], [.271, .827, .009]], .021, finish.brass, 22);
  disc(faucet, .030, .029, finish.darkBrass, [.271, .817, .009]);
  tube(faucet, [[0, .658, .014], [-.093, .664, .015], [-.137, .674, .040]], .016, finish.brass, 9);
  disc(faucet, .024, .041, finish.darkBrass, [-.125, .673, .038]);
  tube(faucet, [[-.040, .509, .001], [-.103, .266, .092], [-.077, .120, .251],
    [.027, .254, .285], [.053, .591, .251], [.052, .726, .244]], .010, finish.darkBrass, 30);
  tube(faucet, [[.052, .638, .244], [.057, .793, .240], [.097, .846, .212]], .018, finish.brass, 10);
  disc(faucet, .044, .027, finish.brass, [.104, .849, .209]).rotation.z = -.60;

  const towel = new T.MeshStandardMaterial({ color: 0xffedcc, side: T.DoubleSide, roughness: .96 });
  const hem = new T.CatmullRomCurve3([
    new T.Vector3(0, .570, .862), new T.Vector3(0, .647, .948), new T.Vector3(0, .681, 1.003),
    new T.Vector3(0, .596, 1.024), new T.Vector3(0, .383, .946),
  ]);
  patch(bath, 15, 25, (u, v) => {
    const edge = 2 * u - 1;
    const { y, z } = hem.getPoint(v);
    return [.054 + edge * .168, y - .016 * edge ** 2 + Math.sin(12 * u) * .006, z - .035 * edge ** 2];
  }, towel).name = "hotel-draped-bath-towel";
  return bath;
}

function bathroomWall(parent: T.Group, wood: SuiteMaterials) {
  const face = p.bathBack + p.wall / 2 + .003;
  const left = p.bathLeft + p.wall / 2, seam = p.bathLeft + 1.742, right = p.bathRight - p.wall / 2;
  const height = p.bathHeight - .097;
  const marble = plane(parent, seam - left, height, wood.marble, [(left + seam) / 2, height / 2 + .007, face]);
  marble.name = "hotel-marble-bath-accent";
  marble.receiveShadow = true;
  useWorldUV(marble.geometry, "x", "y", 1.71, 2.19);
  const tileMap = tiles("#bca692", ["#dac5af", "#e3ccb3", "#ddc7ac", "#e0c8af"]);
  tileMap.wrapS = tileMap.wrapT = T.RepeatWrapping;
  tileMap.repeat.set((right - seam) / .565, height / .565);
  const tileMaterial = new T.MeshStandardMaterial({ map: tileMap, roughness: .73 });
  plane(parent, right - seam, height, tileMaterial, [(seam + right) / 2, height / 2 + .007, face]).receiveShadow = true;
  const backZ = face;
  const sideZ = p.bathDoor[0] - .044;
  const sideTileMap = tileMap.clone();
  sideTileMap.repeat.x = (sideZ - backZ) / .565;
  const side = plane(parent, sideZ - backZ, height, new T.MeshStandardMaterial({ map: sideTileMap, roughness: .73 }),
    [right - .005, height / 2 + .007, (sideZ + backZ) / 2]);
  side.rotation.y = -Math.PI / 2;
  side.receiveShadow = true;

  const towelBar = group(parent, "hotel-brass-towel-rail", [p.bathLeft + .871, 1.533, face + .069]);
  disc(towelBar, .024, .756, finish.brass, [0, 0, .050]).rotation.z = Math.PI / 2;
  for (const x of [-.386, .386]) disc(towelBar, .035, .071, finish.darkBrass, [x, 0, .009]).rotation.x = Math.PI / 2;
  for (const x of [-.168, .132]) {
    rounded(towelBar, [.234, .354, .057], finish.linen, [x, -.164, .065], .017);
    rounded(towelBar, [.209, .318, .020], finish.cream, [x + .010, -.179, .095], .008);
    box(towelBar, [.191, .014, .003], finish.baseboard, [x + .010, -.298, .107]);
  }
}

function buildMirror(parent: T.Group, at: P3) {
  const mirror = group(parent, "hotel-brass-framed-mirror", at);
  rounded(mirror, [.758, .920, .044], finish.darkBrass, [0, 0, 0], .052);
  rounded(mirror, [.726, .884, .032], finish.brass, [0, 0, .019], .043);
  const { canvas, ctx } = makeCanvas(176, 208);
  const gradient = ctx.createLinearGradient(0, 0, 176, 208);
  gradient.addColorStop(0, "#8ca4a4");
  gradient.addColorStop(.56, "#b6bdb4");
  gradient.addColorStop(1, "#dfc6ac");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 176, 208);
  ctx.translate(82, 98);
  ctx.rotate(.676);
  ctx.fillStyle = "rgba(255,243,218,.54)";
  ctx.fillRect(-22, -190, 17, 380);
  ctx.fillStyle = "rgba(255,249,232,.35)";
  ctx.fillRect(5, -190, 5, 380);
  rounded(mirror, [.675, .835, .022], new T.MeshBasicMaterial({ map: canvasTexture(canvas) }), [0, 0, .039], .035);
}

export function buildBathroom(root: T.Group, wood: SuiteMaterials) {
  const room = group(root, "hotel-bathroom", [0, 0, 0]);
  const tub = buildBathtub(room);
  bathroomWall(room, wood);
  const seat = buildToilet(room, toilet);

  const face = p.bathBack + p.wall / 2;
  const x = p.bathRight - 1.975;
  const vanity = group(room, "hotel-marble-vanity", [x, 0, face + .403]);
  feet(vanity, 1.309, .523, .211, wood.walnut, .085);
  rounded(vanity, [1.435, .062, .625], wood.walnutLight, [0, .199, -.014], .012);
  box(vanity, [1.325, .596, .040], wood.panel, [0, .502, -.292]);
  for (const side of [-1, 1]) box(vanity, [.071, .593, .610], wood.walnut, [side * .665, .502, 0]);
  rounded(vanity, [1.423, .217, .597], wood.walnut, [0, .642, 0], .016);
  rounded(vanity, [1.305, .170, .043], wood.panel, [0, .651, .306], .010);
  handle(vanity, [0, .650, .331], .273);
  const bowl = new T.MeshStandardMaterial({ color: 0xf2dfc4, side: T.DoubleSide, roughness: .36 });
  counterWithBasin(vanity, 1.482, .715, .884, 0, .601, .405, wood.marble, bowl);
  disc(vanity, .039, .018, finish.darkBrass, [0, .894, -.245]);
  tube(vanity, [[0, .897, -.245], [0, 1.036, -.245], [0, 1.066, -.188], [0, 1.028, -.125]], .018, finish.brass, 16);
  for (const side of [-1, 1]) {
    disc(vanity, .033, .027, finish.brass, [side * .121, .898, -.247]);
    rounded(vanity, [.063, .021, .030], finish.brass, [side * .121, .925, -.247], .008);
    for (let i = 0; i < 2; i++) rounded(vanity, [.361 - .014 * i, .077, .280 - i * .012], i ? finish.cream : finish.linen,
      [side * .218, .267 + i * .067, .013 - i * .017], .031);
  }
  flowers(vanity, [-.548, .888, -.083], "wine", .53);
  rounded(vanity, [.094, .144, .073], finish.cream, [.483, .959, -.228], .022);
  disc(vanity, .022, .032, finish.brass, [.483, 1.044, -.228]);
  rounded(vanity, [.087, .174, .079], matte(0xa09165), [.591, .970, -.207], .020);
  disc(vanity, .018, .038, finish.darkBrass, [.591, 1.077, -.207]);
  buildMirror(room, [x, 1.466, face + .026]);
  const lights = [-1, 1].map(side => lamp(room, [x + side * .592, 1.167, face + .033], "vanity", side < 0));
  return { tub, seat, vanity, lights };
}

function teaService(parent: T.Group) {
  const silver = new T.MeshStandardMaterial({ color: 0xc9b194, metalness: .44, roughness: .29 });
  const kettle = group(parent, "hotel-electric-kettle", [.119, .933, -.097], .27);
  const profile = [[0, .012], [.117, .012], [.134, .039], [.136, .091], [.102, .303],
    [.086, .332], [.040, .348], [0, .348]].map(([x, y]) => new T.Vector2(x, y));
  mesh(kettle, new T.LatheGeometry(profile, 26), silver);
  disc(kettle, .124, .020, finish.walnutDark, [0, .010, 0]);
  disc(kettle, .088, .020, finish.darkBrass, [0, .342, 0]);
  disc(kettle, .026, .023, finish.walnutDark, [0, .364, 0]);
  tube(kettle, [[.088, .284, 0], [.165, .289, 0], [.182, .207, 0], [.157, .121, 0], [.118, .096, 0]], .022, finish.walnutDark, 18);
  tube(kettle, [[-.112, .166, 0], [-.145, .212, 0], [-.168, .257, .006], [-.205, .267, .010]], .029, silver, 11);
  const pitcher = group(parent, "hotel-small-carafe", [-.241, .930, -.054]);
  const carafe = [[0, 0], [.079, 0], [.081, .045], [.057, .166], [.049, .204], [.033, .218], [0, .218]]
    .map(([x, y]) => new T.Vector2(x, y));
  mesh(pitcher, new T.LatheGeometry(carafe, 20), silver);
  disc(pitcher, .031, .023, finish.darkBrass, [0, .224, 0]);
  for (const x of [-.209, .098]) {
    const service = group(parent, "hotel-tea-cup-and-saucer", [x, .935, .152], x * .93);
    service.scale.setScalar(.71);
    disc(service, .120, .020, finish.cream, [0, .009, 0]);
    mug(service, [0, .019, 0], finish.porcelain);
  }
}

export function buildEntry(root: T.Group, wood: SuiteMaterials) {
  const room = group(root, "hotel-entry", [0, 0, 0]);
  rug(room, "entry", 1.72, .874, [p.entryLeft + 1.835, .004, 5.235]);
  const service = group(room, "hotel-tea-cabinet", [p.entryLeft + .629, 0, 4.812]);
  feet(service, .654, .375, .115, wood.walnut, .061);
  rounded(service, [.808, .798, .469], wood.walnut, [0, .498, 0], .022);
  rounded(service, [.855, .061, .520], wood.marble, [0, .901, 0], .020);
  rounded(service, [.737, .122, .029], wood.panel, [0, .805, .240], .010);
  handle(service, [0, .804, .260], .148);
  for (const side of [-1, 1]) {
    cabinetPanel(service, .348, .507, [side * .186, .465, .242], wood);
    handle(service, [side * .063, .513, .274], .109, false);
  }
  teaService(service);

  const wardrobe = group(room, "hotel-entry-wardrobe", [p.entryRight - 1.17, 0, 4.753]);
  feet(wardrobe, 1.192, .493, .129, wood.walnut, .073);
  rounded(wardrobe, [1.361, 1.920, .635], wood.walnut, [0, 1.037, 0], .023);
  rounded(wardrobe, [1.419, .071, .682], wood.walnutLight, [0, 2.005, 0], .018);
  for (const side of [-1, 1]) {
    cabinetPanel(wardrobe, .632, 1.711, [side * .321, 1.035, .328], wood);
    handle(wardrobe, [side * .078, 1.002, .371], .315, false);
  }

  const rack = group(room, "hotel-folding-luggage-rack", [p.entryRight - .583, 0, 5.346], -.14);
  for (const x of [-.312, .312]) {
    for (const side of [-1, 1]) {
      rounded(rack, [.060, .655, .052], wood.walnut, [x, .265, 0], .010).rotation.x = side * .66;
    }
    disc(rack, .034, .021, finish.darkBrass, [x, .269, 0]).rotation.z = Math.PI / 2;
  }
  for (const z of [-.216, .216]) rounded(rack, [.754, .054, .057], wood.walnutLight, [0, .536, z], .012);
  for (let i = 0; i < 6; i++) {
    const x = (i - 2.5) * .121;
    rounded(rack, [.068, .028, .452], matte(i % 2 ? 0xa97e57 : 0x815639), [x, .562, 0], .008);
    for (const z of [-.141, .141]) box(rack, [.049, .002, .008], finish.baseboard, [x, .578, z]);
  }
  return { service, wardrobe, rack };
}
