import * as T from "three";
import { loft, mesh, rounded, tube } from "../sculpt";
import { buildShoe } from "../roomV4/entryProps";
import { canvasTexture, makeCanvas } from "../roomV4/utils";
import { plan as p, toilet as seat } from "./plan";
import { box, disc, frame, glass, matte, paint, plane, ring } from "./surfaces";

function rectangle(width: number, depth: number, radius: number, x = 0, z = 0) {
  const shape = new T.Shape();
  const a = x - width / 2, b = x + width / 2;
  const c = -z - depth / 2, d = -z + depth / 2;
  shape.moveTo(a + radius, c);
  shape.lineTo(b - radius, c);
  shape.quadraticCurveTo(b, c, b, c + radius);
  shape.lineTo(b, d - radius);
  shape.quadraticCurveTo(b, d, b - radius, d);
  shape.lineTo(a + radius, d);
  shape.quadraticCurveTo(a, d, a, d - radius);
  shape.lineTo(a, c + radius);
  shape.quadraticCurveTo(a, c, a + radius, c);
  return shape;
}

export function counterWithBasin(root: T.Group, width: number, depth: number, top: number,
  holeX: number, holeWidth: number, holeDepth: number, surface: T.Material, bowl: T.Material) {
  const opening = rectangle(holeWidth, holeDepth, .055, holeX);
  const topShape = rectangle(width, depth, .022);
  topShape.holes.push(opening);
  mesh(root, new T.ExtrudeGeometry(topShape, { depth: .042, bevelEnabled: false, curveSegments: 8 })
    .rotateX(-Math.PI / 2), surface, [0, top - .042, 0]);

  // The side walls taper into the bottom so the bowl has depth in both the room view and close-ups.
  const contour = opening.getPoints(7);
  const vertices: number[] = [];
  const indices: number[] = [];
  for (const [height, scale] of [[top + .001, 1.002], [top - .036, .98], [top - .118, .78]]) {
    for (const point of contour) vertices.push(holeX + (point.x - holeX) * scale, height, -point.y * scale);
  }
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < contour.length - 1; i++) {
      const a = row * contour.length + i;
      const b = a + contour.length;
      indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  mesh(root, geometry, bowl);
  const bottom = new T.ShapeGeometry(rectangle(holeWidth * .78, holeDepth * .78, .043))
    .rotateX(-Math.PI / 2);
  mesh(root, bottom, bowl, [holeX, top - .118, 0]);
  disc(root, .035, .006, paint.steel, [holeX + .028, top - .114, .023]);
  disc(root, .022, .006, paint.chrome, [holeX + .028, top - .112, .023]);
}

export function faucet(root: T.Group, x: number, y: number, z: number, tall: boolean) {
  disc(root, .045, .028, paint.chrome, [x, y + .013, z]);
  const height = tall ? .34 : .155;
  tube(root, [[x, y + .024, z], [x, y + height * .67, z], [x, y + height, z + .040],
    [x, y + height * .92, z + .128], [x, y + height * .62, z + .174]], .018, paint.chrome, 18);
  tube(root, [[x + .042, y + .066, z], [x + .085, y + .084, z]], .012, paint.chrome, 6);
}

export function buildKitchen(root: T.Group) {
  const run = new T.Group();
  run.name = "kitchen-cabinets";
  run.position.set(p.right - .435, 0, .37);
  run.rotation.y = -Math.PI / 2;
  root.add(run);
  rounded(run, [2.74, .11, .511], paint.steel, [0, .06, -.019], .009);
  box(run, [2.78, .64, .57], paint.cabinet, [0, .436, 0]);
  box(run, [2.78, .123, .046], paint.cabinet, [0, .814, -.269]);
  box(run, [2.78, .12, .048], paint.cabinet, [0, .814, .271]);
  for (const x of [-1.365, 1.365]) {
    box(run, [.049, .12, .55], paint.cabinet, [x, .814, 0]);
  }
  const panel = matte(0x8096b2);
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * .55;
    rounded(run, [.534, .54, .032], panel, [x, .394, .294], .008);
    rounded(run, [.534, .171, .035], panel, [x, .761, .294], .008);
    tube(run, [[x - .063, .760, .319], [x - .050, .760, .338],
      [x + .047, .760, .338], [x + .060, .760, .319]], .009, paint.chrome, 8);
    const pull = x + (i % 2 ? -.19 : .19);
    tube(run, [[pull, .556, .319], [pull, .546, .337],
      [pull, .452, .337], [pull, .442, .319]], .008, paint.chrome, 8);
  }
  const steelBowl = new T.MeshStandardMaterial({ color: 0x8c90a2, metalness: .22, roughness: .39, side: T.DoubleSide });
  counterWithBasin(run, 2.82, .652, .922, -.855, .47, .410, paint.white, steelBowl);
  faucet(run, -.855, .922, -.256, true);

  const hob = new T.Group();
  hob.name = "double-induction-hob";
  hob.position.set(.466, .933, 0);
  run.add(hob);
  const blackGlass = new T.MeshStandardMaterial({ color: 0x252533, roughness: .31 });
  rounded(hob, [.688, .028, .478], blackGlass, [0, 0, 0], .015);
  for (const x of [-.171, .160]) {
    for (const radius of [.109, .080]) {
      const circle = ring(hob, radius, .0038, matte(0x88889e), [x, .015, -.035]);
      circle.rotation.x = -Math.PI / 2;
    }
    box(hob, [.027, .002, .004], matte(0xa3a4b5), [x, .016, -.035]);
  }
  for (let i = 0; i < 5; i++) {
    disc(hob, .014, .006, paint.steel, [.064 * (i - 2), .016, .161]);
  }

  const fridge = new T.Group();
  fridge.name = "refrigerator";
  fridge.position.set(p.right - .447, 0, 2.186);
  fridge.rotation.y = -Math.PI / 2;
  root.add(fridge);
  rounded(fridge, [.755, 1.33, .639], matte(0xdcd4d6), [0, .665, 0], .033);
  for (const [y, h] of [[.423, .812], [1.084, .468]]) {
    rounded(fridge, [.722, h, .072], paint.white, [0, y, .322], .021);
    tube(fridge, [[-.278, y + .14, .36], [-.278, y + .125, .386],
      [-.278, y + .011, .386], [-.278, y - .003, .361]], .011, paint.steel, 8);
  }
  return { run, fridge };
}

export function buildToilet(root: T.Group, { x, z, seatY }: { x: number; z: number; seatY: number }) {
  const toilet = new T.Group();
  toilet.name = "toilet";
  toilet.position.set(x, 0, z);
  root.add(toilet);
  rounded(toilet, [.442, .63, .207], paint.ceramic, [0, .448, -.454], .053);
  rounded(toilet, [.455, .064, .223], paint.white, [0, .770, -.454], .022);
  disc(toilet, .039, .008, paint.chrome, [.026, .804, -.458]);
  mesh(toilet, loft([
    [.015, .166, .203, -.038], [.14, .161, .192, -.046], [.248, .179, .229, -.029],
    [.322, .222, .292, -.005], [.389, .238, .323, .002], [.420, .223, .311, .002],
  ], 28), paint.ceramic);
  const lid = new T.Shape();
  lid.absellipse(0, 0, .217, .306, 0, Math.PI * 2, false, 0);
  mesh(toilet, new T.ExtrudeGeometry(lid, {
    depth: .031, bevelEnabled: true, bevelThickness: .011, bevelSize: .011, bevelSegments: 3, curveSegments: 18,
  }).rotateX(-Math.PI / 2), paint.white, [0, seatY - .042, .007]);
  rounded(toilet, [.326, .055, .313], paint.ceramic, [0, .053, -.075], .022);

  return toilet;
}

export function buildBathroom(root: T.Group) {
  const face = p.bathBack + p.wall / 2;
  const toilet = buildToilet(root, seat);
  const sink = new T.Group();
  sink.name = "bath-sink";
  sink.position.set(-2.376, 0, face + .214);
  root.add(sink);
  const chinaBowl = new T.MeshStandardMaterial({ color: 0xd9d2d6, roughness: .44, side: T.DoubleSide });
  rounded(sink, [.56, .142, .365], paint.ceramic, [0, .760, .001], .058);
  counterWithBasin(sink, .682, .435, .894, 0, .486, .292, paint.ceramic, chinaBowl);
  faucet(sink, 0, .894, -.162, false);
  tube(sink, [[0, .720, .043], [0, .589, .044], [0, .574, -.004], [0, .630, -.087], [0, .625, -.202]],
    .022, paint.steel, 13);

  const mirror = new T.Group();
  mirror.position.set(-2.376, 1.488, face + .024);
  root.add(mirror);
  frame(mirror, .64, .666, .041, .025, paint.steel);
  const { canvas, ctx } = makeCanvas(160, 176);
  const reflected = ctx.createLinearGradient(0, 0, 160, 176);
  reflected.addColorStop(0, "#e7f6fc");
  reflected.addColorStop(.47, "#a1c3e4");
  reflected.addColorStop(1, "#82a4ca");
  ctx.fillStyle = reflected;
  ctx.fillRect(0, 0, 160, 176);
  ctx.save();
  ctx.translate(85, 76);
  ctx.rotate(.66);
  ctx.fillStyle = "rgba(236,250,255,.49)";
  ctx.fillRect(-23, -150, 15, 300);
  ctx.fillRect(3, -150, 4, 300);
  ctx.restore();
  plane(mirror, .593, .622, new T.MeshBasicMaterial({ map: canvasTexture(canvas) }), [0, 0, .006]);

  const showerX = -1.53;
  const pipeZ = face + .063;
  tube(root, [[showerX - .125, .97, pipeZ], [showerX - .122, 1.80, pipeZ]], .023, paint.chrome, 8);
  tube(root, [[showerX - .113, 1.12, pipeZ], [showerX - .117, .93, pipeZ + .056],
    [showerX - .025, .882, pipeZ + .092], [showerX + .071, 1.03, pipeZ + .108],
    [showerX + .028, 1.45, pipeZ + .094], [showerX + .027, 1.69, pipeZ + .096]], .013, paint.steel, 24);
  tube(root, [[showerX + .027, 1.59, pipeZ + .097], [showerX + .043, 1.735, pipeZ + .126]], .023, paint.chrome, 8);
  const head = disc(root, .072, .043, paint.chrome, [showerX + .051, 1.759, pipeZ + .13]);
  head.rotation.set(.83, 0, .39);
  rounded(root, [.198, .062, .053], paint.steel, [showerX - .064, 1.28, pipeZ + .018], .021);

  const showerScreen = new T.Group();
  showerScreen.name = "shower-screen";
  showerScreen.position.set(p.bathRight - .273, .879, p.bathBack + .340);
  showerScreen.rotation.y = -Math.PI / 2;
  root.add(showerScreen);
  frame(showerScreen, .544, 1.728, .033, .017, paint.chrome);
  glass(showerScreen, .511, 1.693, [0, 0, 0], .105);

  box(root, [.169, .009, .164], paint.steel, [-1.62, .006, p.bathBack + .852]).userData.walkable = true;
  for (let i = -2; i <= 2; i++) {
    box(root, [.012, .004, .125], paint.chrome, [-1.62 + i * .026, .012, p.bathBack + .852]).userData.walkable = true;
  }
  const light = new T.PointLight(0xffdfb4, 0, 4.3, 2);
  light.position.set(-2.01, 1.92, p.bathBack + .69);
  root.add(light);
  return { toilet, sink, showerScreen, light };
}

export function buildLaundry(root: T.Group) {
  const washer = new T.Group();
  washer.name = "washing-machine";
  washer.position.set(2.935, 0, -2.816);
  root.add(washer);
  rounded(washer, [.652, .902, .661], paint.white, [0, .451, 0], .030);
  rounded(washer, [.619, .048, .634], matte(0xe2dade), [0, .891, 0], .015);
  rounded(washer, [.591, .104, .026], matte(0xe6dfe2), [0, .813, .337], .012);
  rounded(washer, [.161, .049, .012], paint.white, [-.186, .811, .352], .006);
  rounded(washer, [.090, .035, .010], paint.steel, [.156, .811, .353], .006);
  const dial = disc(washer, .043, .021, paint.chrome, [.020, .811, .359]);
  dial.rotation.x = Math.PI / 2;
  const drum = disc(washer, .202, .027, matte(0x414d65), [0, .433, .349]);
  drum.rotation.x = Math.PI / 2;
  ring(washer, .209, .033, paint.ceramic, [0, .433, .373]);
  ring(washer, .177, .013, paint.steel, [0, .433, .385]);
  const window = mesh(washer, new T.SphereGeometry(1, 24, 14), new T.MeshStandardMaterial({
    color: 0x566782, roughness: .29, metalness: .20,
  }), [0, .433, .367]);
  window.scale.set(.173, .173, .037);
  rounded(washer, [.028, .081, .019], paint.chrome, [.185, .434, .402], .009);

  const plant = new T.Group();
  plant.name = "balcony-plant";
  plant.position.set(2.221, 0, -2.918);
  root.add(plant);
  const potProfile = [[0, .008], [.109, .008], [.132, .022], [.166, .237], [.165, .262],
    [.153, .264], [.150, .225], [0, .225]].map(([x, y]) => new T.Vector2(x, y));
  mesh(plant, new T.LatheGeometry(potProfile, 23), matte(0xd2b3a0));
  disc(plant, .15, .015, matte(0x6b513d), [0, .233, 0]);
  const leafGeometry = new T.SphereGeometry(1, 8, 5);
  const greens = [0x789b43, 0xa5bb5b, 0x90ac49, 0xb4c66a].map(matte);
  for (let i = 0; i < 13; i++) {
    const angle = i * 2.4;
    const height = .365 + (i % 6) * .071;
    const stem = new T.Vector3(Math.cos(angle) * .114, height, Math.sin(angle) * .114);
    const tip = new T.Vector3(Math.cos(angle) * .23, height + .055 + (i % 3) * .015, Math.sin(angle) * .23);
    tube(plant, [[0, .241, 0], [stem.x * .5, stem.y - .04, stem.z * .5], [stem.x, stem.y, stem.z]],
      .008, matte(0x7d8649), 6);
    const leaf = mesh(plant, leafGeometry, greens[i % greens.length], stem.clone().lerp(tip, .49).toArray());
    leaf.scale.set(.043, .103, .018);
    leaf.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), tip.sub(stem).normalize());
  }
  return { washer, plant };
}

export function buildEntry(root: T.Group) {
  const mat = rounded(root, [.63, .019, .49], matte(0x9e929a), [-.937, .013, 3.735], .009);
  mat.userData.walkable = true;
  for (let i = -3; i <= 3; i++) {
    const stripe = box(root, [.554, .002, .003], matte(0xb3a5ab), [-.937, .023, 3.735 + i * .057]);
    stripe.userData.walkable = true;
  }
  for (const [x, color, lace] of [[-1.679, 0xeee4df, 0xfff5ee], [-1.278, 0x536b99, 0x617a9c]]) {
    for (const side of [-1, 1]) {
      const shoe = buildShoe(color, lace);
      shoe.scale.set(.54 * side, .54, .54);
      shoe.position.set(x + side * .096, .003, 3.854 + side * .015);
      shoe.rotation.y = .17 + side * .09;
      root.add(shoe);
    }
  }

  const hooks = new T.Group();
  hooks.position.set(p.entryRight - p.wall / 2 - .017, 1.19, 3.808);
  hooks.rotation.y = -Math.PI / 2;
  root.add(hooks);
  for (const x of [-.205, 0, .205]) {
    rounded(hooks, [.049, .126, .018], paint.oakLight, [x, 0, 0], .020);
    tube(hooks, [[x, -.027, .018], [x, -.022, .058], [x, .020, .062]], .011, paint.oakDark, 8);
  }
  const bag = rounded(hooks, [.315, .390, .097], paint.deepBlue, [.022, -.465, .089], .042);
  bag.name = "entry-blue-tote";
  bag.rotation.z = -.08;
  rounded(hooks, [.230, .161, .021], paint.blue, [.032, -.476, .139], .017).rotation.z = -.08;
  for (const dz of [0, .034]) {
    tube(hooks, [[-.079, -.324, .102 + dz], [-.051, -.168, .104 + dz], [0, -.016, .066],
      [.061, -.129, .095 + dz], [.105, -.325, .095 + dz]], .010, paint.deepBlue, 18);
  }
}
