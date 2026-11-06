import * as T from "three";
import { buildToilet, counterWithBasin, faucet } from "../blueApartment/serviceRooms";
import { box, disc, frame, glass, matte, paint, plane, ring, tiles } from "../blueApartment/surfaces";
import { mesh, rounded, tube, type P3 } from "../sculpt";
import { buildShoe } from "../roomV4/entryProps";
import { canvasTexture, makeCanvas } from "../roomV4/utils";
import { fabricMat, plant } from "./decor";
import { cabinet, finish, group, pull } from "./materials";
import { plan as p, toilet } from "./plan";

const tileTones = ["#e4d3be", "#eadac8", "#e5d4c2", "#e8d8c5"] as const;

function tiledWall(root: T.Group, width: number, height: number, at: P3, square: number) {
  const map = tiles("#cbb8a4", tileTones);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.repeat.set(width / (square * 2), height / (square * 2));
  const wall = plane(root, width, height, new T.MeshStandardMaterial({ map, roughness: .78 }), at);
  wall.receiveShadow = true;
  return wall;
}

function dispenser(parent: T.Group, at: P3, color: T.Material) {
  const pump = group(parent, "soap-dispenser", at);
  rounded(pump, [.091, .147, .073], color, [0, .077, 0], .021);
  disc(pump, .022, .035, paint.chrome, [0, .162, 0]);
  tube(pump, [[0, .166, 0], [0, .191, 0], [.037, .191, 0], [.048, .185, 0]], .007, paint.steel, 8);
}

function choppingBoard(parent: T.Group, at: P3, angle: number, light: boolean) {
  const board = group(parent, "chopping-board", at);
  board.rotation.set(-.18, 0, angle);
  rounded(board, [.266, .343, .030], light ? finish.oakLight : finish.oak, [0, .174, 0], .035);
  rounded(board, [.090, .131, .032], finish.oakLight, [0, .361, 0], .031);
  disc(board, .013, .007, finish.oakEdge, [0, .393, .017]).rotation.x = Math.PI / 2;
}

export function buildKitchen(root: T.Group) {
  const kitchen = group(root, "loft-kitchen", [0, 0, 0]);
  const run = group(kitchen, "olive-kitchen-base", [2.25, 0, p.kitchenBack + .441]);
  const left = group(run, "sink-base", [-.994, 0, 0]);
  cabinet(left, .96, .78, .614, 2, finish.oliveDark, finish.olive);
  rounded(left, [.942, .112, .055], finish.olive, [0, .836, .284], .009);
  const drawers = group(run, "hob-drawers", [0, 0, 0]);
  rounded(drawers, [.986, .815, .609], finish.oliveDark, [0, .443, 0], .012);
  for (const y of [.213, .463, .709]) {
    rounded(drawers, [.964, .233, .043], finish.olive, [0, y, .315], .010);
    pull(drawers, [0, y + .062, .341], .167, true);
  }
  const right = group(run, "right-kitchen-base", [.99, 0, 0]);
  cabinet(right, .96, .886, .616, 2, finish.oliveDark, finish.olive);
  const steelBowl = new T.MeshStandardMaterial({ color: 0xaba9a0, metalness: .28, roughness: .39, side: T.DoubleSide });
  counterWithBasin(run, 3.00, .709, .929, -.994, .527, .43, finish.ivory, steelBowl);
  faucet(run, -.994, .929, -.270, true);
  dispenser(run, [-.579, .93, -.242], finish.oliveLight);
  choppingBoard(run, [1.195, .933, -.237], .14, false);
  choppingBoard(run, [1.009, .933, -.179], -.12, true);

  const hob = group(run, "four-ring-induction", [.240, .943, .034]);
  rounded(hob, [.872, .027, .487], matte(0x302e29), [0, 0, 0], .014);
  for (const x of [-.218, .201]) {
    for (const z of [-.126, .088]) {
      for (const radius of [.083, .063]) {
        ring(hob, radius, .0035, matte(0x797365), [x, .015, z]).rotation.x = -Math.PI / 2;
      }
    }
  }
  for (let i = -2; i <= 2; i++) disc(hob, .012, .004, paint.steel, [.064 * i, .015, .199]);

  tiledWall(kitchen, 2.998, 1.31, [2.25, 1.527, p.kitchenBack + .094], .158);
  const uppers = group(kitchen, "olive-wall-cabinets", [2.25, 2.104, p.kitchenBack + .280]);
  cabinet(uppers, 2.99, .967, .373, 6, finish.oliveDark, finish.olive);
  box(uppers, [3.0, .024, .391], finish.oliveLight, [0, .979, .004]);
  const hood = group(kitchen, "stainless-range-hood", [2.49, 2.008, p.kitchenBack + .354]);
  const metal = new T.MeshStandardMaterial({ color: 0xbeb4a4, roughness: .38, metalness: .32 });
  const top = new T.Shape().moveTo(-.32, 0).lineTo(.32, 0).lineTo(.255, .147).lineTo(-.255, .147).closePath();
  mesh(hood, new T.ExtrudeGeometry(top, { depth: .397, bevelEnabled: false }).translate(0, 0, -.175), metal);
  rounded(hood, [.674, .076, .430], metal, [0, -.025, .035], .013);
  box(hood, [.192, .025, .003], finish.iron, [.143, -.020, .252]);
  for (let i = 0; i < 5; i++) disc(hood, .009, .004, paint.chrome, [.073 + i * .028, -.019, .256]).rotation.x = Math.PI / 2;

  const fridge = group(kitchen, "cream-refrigerator", [4.31, 0, p.kitchenBack + .484]);
  rounded(fridge, [.832, 1.875, .718], finish.cotton, [0, .963, 0], .038);
  box(fridge, [.767, .043, .636], finish.oakEdge, [0, .028, -.014]);
  for (const [y, h] of [[.604, 1.123], [1.533, .702]]) {
    rounded(fridge, [.820, h, .086], finish.ivory, [0, y, .359], .027);
    pull(fridge, [-.298, y + h * .283, .405], .177);
  }
  return { run, fridge };
}

function mirror(parent: T.Group, at: P3) {
  const object = group(parent, "bathroom-mirror", at);
  const { canvas, ctx } = makeCanvas(160, 176);
  const reflection = ctx.createLinearGradient(0, 0, 160, 176);
  reflection.addColorStop(0, "#dbeef3");
  reflection.addColorStop(.53, "#9abed8");
  reflection.addColorStop(1, "#7499b8");
  ctx.fillStyle = reflection;
  ctx.fillRect(0, 0, 160, 176);
  ctx.translate(78, 87);
  ctx.rotate(.63);
  ctx.fillStyle = "rgba(235,249,249,.59)";
  ctx.fillRect(-21, -155, 20, 320);
  ctx.fillRect(7, -155, 5, 320);
  frame(object, .792, .693, .041, .031, paint.steel);
  plane(object, .743, .641, new T.MeshBasicMaterial({ map: canvasTexture(canvas) }), [0, 0, .010]);
  const light = new T.MeshStandardMaterial({ color: 0xffebd2, emissive: 0xffdfab, emissiveIntensity: .23 });
  rounded(object, [.678, .063, .102], light, [0, .409, .042], .024);
  object.userData.interactive = { id: "lamps" };
  return light;
}

export function buildBathroom(root: T.Group) {
  const room = group(root, "loft-bathroom", [0, 0, 0]);
  const face = p.bathBack + p.wall / 2;
  const seat = buildToilet(room, toilet);
  tiledWall(room, p.bathRight - p.left - .18, 2.02, [(p.bathRight + p.left) / 2, 1.015, face + .004], .259);
  const wallLight = mirror(room, [-4.672, 1.421, face + .025]);

  const vanity = group(room, "olive-bathroom-vanity", [-4.672, 0, face + .278]);
  cabinet(vanity, .84, .704, .464, 2, finish.oliveDark, finish.olive);
  rounded(vanity, [.81, .108, .06], finish.olive, [0, .752, .214], .010);
  pull(vanity, [0, .76, .247], .128, true);
  const bowl = new T.MeshStandardMaterial({ color: 0xe9e0d3, side: T.DoubleSide, roughness: .40 });
  counterWithBasin(vanity, .893, .543, .849, 0, .535, .364, paint.ceramic, bowl);
  faucet(vanity, 0, .849, -.214, false);
  dispenser(vanity, [-.334, .849, -.139], finish.olive);
  rounded(vanity, [.137, .045, .103], finish.oakLight, [.313, .875, -.143], .015);
  rounded(vanity, [.105, .024, .079], finish.ivory, [.313, .907, -.143], .014);

  const shelf = group(room, "bath-plant-shelf", [-5.675, 1.201, face + .154]);
  rounded(shelf, [.611, .047, .303], finish.oakLight, [0, 0, 0], .011);
  plant(shelf, [-.044, .024, -.023], .55, true);

  const screen = group(room, "shower-side-glass", [-4.126, 1.001, face + .61], -Math.PI / 2);
  frame(screen, 1.12, 1.99, .040, .027, paint.chrome);
  glass(screen, 1.065, 1.932, [0, 0, 0], .109);
  const front = group(room, "shower-front-glass", [-3.964, 1.001, face + 1.17]);
  frame(front, .335, 1.99, .040, .025, paint.chrome);
  glass(front, .283, 1.937, [0, 0, 0], .103);
  const tray = rounded(room, [.817, .019, 1.12], finish.stone, [-3.696, .015, face + .61], .009);
  tray.userData.walkable = true;
  const x = -3.692, z = face + .063;
  tube(room, [[x - .081, 1.042, z], [x - .081, 1.855, z]], .019, paint.chrome, 8);
  tube(room, [[x - .104, 1.139, z], [x - .141, .954, z + .081], [x - .048, .883, z + .116],
    [x + .048, 1.058, z + .136], [x + .051, 1.512, z + .100], [x + .046, 1.753, z + .114]], .011, paint.steel, 22);
  tube(room, [[x + .046, 1.721, z + .113], [x + .091, 1.844, z + .166]], .025, paint.chrome, 8);
  disc(room, .059, .030, paint.chrome, [x + .097, 1.850, z + .174]).rotation.set(.82, 0, .39);
  rounded(room, [.230, .064, .064], paint.steel, [x - .06, 1.182, z + .022], .019);
  rounded(room, [.344, .032, .201], paint.chrome, [x + .078, 1.027, z + .102], .013);
  dispenser(room, [x + .153, 1.044, z + .112], finish.ivory);
  disc(room, .040, .131, finish.cotton, [x + .035, 1.111, z + .131]);
  const drain = group(room, "shower-drain", [-3.64, .029, face + 1.006]);
  drain.userData.walkable = true;
  rounded(drain, [.159, .006, .140], paint.steel, [0, 0, 0], .006);
  for (let i = -2; i <= 2; i++) box(drain, [.009, .003, .104], paint.chrome, [i * .026, .005, 0]);

  const light = new T.PointLight(0xffddae, .12, 3.25, 2);
  light.position.set(-4.674, 1.89, face + .316);
  room.add(light);
  return { seat, vanity, screen, front, light, wallLight };
}

export function buildEntryAndExercise(root: T.Group) {
  const entry = group(root, "loft-entrance-props", [0, 0, 0]);
  fabricMat(entry, "woven-doormat", .793, .437, [-3.64, .004, 5.289], finish.oakLight, finish.oakEdge);
  for (const [x, color, lace, angle] of [[-3.755, 0xece0c7, 0xfff3db, -.19], [-3.215, 0x526145, 0x9a9e72, -.21]]) {
    for (const side of [-1, 1]) {
      const shoe = buildShoe(color, lace);
      shoe.scale.set(.59 * side, .59, .59);
      shoe.position.set(x + side * .115, .005, 4.810 + side * .041);
      shoe.rotation.y = angle + side * .08;
      entry.add(shoe);
    }
  }
  const cupboard = group(entry, "olive-shoe-cupboard", [-1.04, 0, 5.141]);
  cabinet(cupboard, .797, .831, .459, 2, finish.oliveDark, finish.olive);
  rounded(cupboard, [.829, .055, .485], finish.oakLight, [0, .834, 0], .012);
  plant(cupboard, [.098, .864, -.041], .58, true);

  const gym = group(root, "window-exercise-area", [0, 0, 0]);
  fabricMat(gym, "olive-exercise-mat", .908, 2.09, [4.07, .004, 1.315], finish.olive, finish.oliveLight, .031);
  for (const [x, z, angle] of [[3.65, 2.83, -.36], [3.74, 3.05, .19]]) {
    const weight = group(gym, "dumbbell", [x, .072, z], angle);
    disc(weight, .023, .225, finish.iron, [0, 0, 0]).rotation.z = Math.PI / 2;
    for (const end of [-.109, .109]) {
      mesh(weight, new T.CylinderGeometry(.071, .071, .071, 8), finish.oliveDark, [end, 0, 0]).rotation.z = Math.PI / 2;
    }
  }
  const towel = group(gym, "folded-workout-towel", [4.35, 0, 2.98], -.18);
  rounded(towel, [.341, .035, .237], finish.cotton, [0, .026, 0], .017);
  rounded(towel, [.325, .034, .229], finish.ivory, [0, .056, -.011], .017);
  const bottle = group(gym, "sage-water-bottle", [4.73, 0, 2.78]);
  const body = new T.MeshStandardMaterial({ color: 0x728c70, roughness: .37 });
  rounded(bottle, [.134, .308, .126], body, [0, .158, 0], .049);
  disc(bottle, .063, .041, finish.iron, [0, .324, 0]);
  const handle = ring(bottle, .031, .007, finish.iron, [0, .345, -.027], Math.PI);
  handle.rotation.y = Math.PI / 2;
  tube(gym, [[3.99, .027, 2.84], [4.064, .027, 2.93], [4.025, .027, 3.024], [3.948, .027, 2.997],
    [3.971, .027, 2.921], [4.01, .027, 2.85]], .014, finish.olive, 16);
  const rubberPlant = plant(root, [4.55, .003, -.90], 1.12);
  const balconyPlant = plant(root, [4.63, .003, 4.68], .62);
  return { cupboard, rubberPlant, balconyPlant };
}
