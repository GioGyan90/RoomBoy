import * as T from "three";
import { rounded, tube } from "../sculpt";
import { extrudeWall, wallShape } from "../roomV4/utils";
import type { FixedBody } from "../../../game/navigation";
import { obstacle, plan as p, windowOpening as win } from "./plan";
import { box, edges, frame, glass, landscape, matte, paint, plane, tiles, timber, useWorldUV } from "./surfaces";

const halfWall = p.wall / 2;

function wallX(root: T.Group, x: number, from: number, to: number, height: number, exterior = 0) {
  return edges(box(root, [p.wall, height, to - from], [
    exterior === 1 ? paint.cut : paint.plaster, exterior === -1 ? paint.cut : paint.plaster,
    paint.cap, paint.cut, paint.cap, paint.cap,
  ], [x, height / 2, (from + to) / 2]));
}

function wallZ(root: T.Group, z: number, from: number, to: number, height: number, exterior = 0) {
  return edges(box(root, [to - from, height, p.wall], [
    paint.cap, paint.cap, paint.cap, paint.cut,
    exterior === 1 ? paint.cut : paint.plaster, exterior === -1 ? paint.cut : paint.plaster,
  ], [(from + to) / 2, height / 2, z]));
}

function floor(root: T.Group, x0: number, x1: number, z0: number, z1: number,
  material: T.Material, tileWidth: number, tileDepth: number) {
  const geometry = new T.PlaneGeometry(x1 - x0, z1 - z0)
    .rotateX(-Math.PI / 2).translate((x0 + x1) / 2, .001, (z0 + z1) / 2);
  useWorldUV(geometry, "x", "z", tileWidth, tileDepth);
  const surface = new T.Mesh(geometry, material);
  surface.receiveShadow = true;
  surface.userData.walkable = true;
  root.add(surface);
}

function shadowRoof(root: T.Group, x0: number, x1: number, z0: number, z1: number) {
  // The removed ceiling still shades the interior, leaving the actual window openings to form the sun patches.
  const roof = plane(root, x1 - x0, z1 - z0, new T.MeshBasicMaterial({
    colorWrite: false, depthWrite: false, side: T.DoubleSide,
  }), [(x0 + x1) / 2, p.ceiling - .006, (z0 + z1) / 2]);
  roof.rotation.x = -Math.PI / 2;
  roof.castShadow = true;
  roof.raycast = () => {};
}

function buildDoor(root: T.Group, id: string, x: number, z: number, width: number, angle: number, entry = false): FixedBody {
  const pivot = new T.Group();
  pivot.name = id;
  pivot.position.set(x, 0, z);
  pivot.rotation.y = angle;
  root.add(pivot);
  const height = p.doorHeight;
  const leaf = rounded(pivot, [width, height, .052], paint.door, [width / 2, height / 2 + .014, 0], .012);
  leaf.name = id + "-leaf";
  for (const side of [-1, 1]) {
    rounded(pivot, [width - .103, height - .13, .016], paint.oakDark,
      [width / 2, height / 2 + .014, side * .026], .015);
    rounded(pivot, [width - .13, height - .155, .014], paint.door,
      [width / 2, height / 2 + .014, side * .034], .012);
    rounded(pivot, [.049, .158, .018], paint.steel, [width - .11, .93, side * .042], .009);
    tube(pivot, [[width - .11, .95, side * .047], [width - .11, .95, side * .085],
      [width - .22, .95, side * .088]], .013, paint.chrome, 8);
  }
  if (entry) {
    for (const side of [-1, 1]) {
      rounded(pivot, [.030, .030, .014], paint.chrome, [width * .46, 1.40, side * .044], .013);
    }
  }
  for (const y of [.25, 1.04, 1.75]) {
    rounded(pivot, [.029, .105, .036], paint.steel, [.024, y, .033], .011);
  }
  return { id, x: x + Math.cos(angle) * width / 2, z: z - Math.sin(angle) * width / 2,
    halfWidth: width / 2, halfDepth: .037, angle };
}

export function buildArchitecture(root: T.Group): FixedBody[] {
  const x0 = p.left - halfWall, x1 = p.right + halfWall;
  const balconyX = p.balconyRight + halfWall;
  const entryX = p.entryRight + halfWall;
  const bathWallHeight = 1.84;
  const kitchenWallHeight = 1.52;
  const slab = wallShape([
    [x0, -p.notch + halfWall], [p.backLeft - halfWall, -p.notch + halfWall],
    [p.backLeft - halfWall, -p.back + halfWall], [p.divider - halfWall, -p.back + halfWall],
    [p.divider - halfWall, -p.balconyBack + halfWall], [balconyX, -p.balconyBack + halfWall],
    [balconyX, -p.kitchenBack - halfWall], [x1, -p.kitchenBack - halfWall],
    [x1, -p.kitchenFront - halfWall], [p.divider + halfWall, -p.kitchenFront - halfWall],
    [p.divider + halfWall, -p.bathFront - halfWall], [entryX, -p.bathFront - halfWall],
    [entryX, -p.entryFront - halfWall], [p.entryLeft - halfWall, -p.entryFront - halfWall],
    [p.entryLeft - halfWall, -p.bathFront - halfWall], [x0, -p.bathFront - halfWall],
  ]);
  const slabGeometry = new T.ExtrudeGeometry(slab, { depth: .36, bevelEnabled: false })
    .rotateX(-Math.PI / 2).translate(0, -.37, 0);
  const plinth = new T.Mesh(slabGeometry, [paint.cap, paint.cut]);
  plinth.receiveShadow = true;
  root.add(edges(plinth));

  const boards = new T.MeshStandardMaterial({ map: timber(), roughness: .8 });
  const kitchenTile = new T.MeshStandardMaterial({ map: tiles("#a4a5b4", ["#c6c5d2", "#cbcbd7", "#c4c3d1", "#c9c8d3"]), roughness: .74 });
  const balconyTile = new T.MeshStandardMaterial({ map: tiles("#a6a4aa", ["#c9c3c3", "#d6cdca", "#cbc5c9", "#d2ccca"]), roughness: .8 });
  const bathTile = new T.MeshStandardMaterial({ map: tiles("#a6a7b5", ["#c1bfcd", "#cbcad6", "#c5c2d0", "#cac9d4"]), roughness: .72 });
  floor(root, p.backLeft, p.divider, p.back, p.notch, boards, 4.8, 1.6);
  floor(root, p.left, p.divider, p.notch, p.bathBack, boards, 4.8, 1.6);
  floor(root, p.bathRight, p.divider, p.bathBack, p.bathFront, boards, 4.8, 1.6);
  floor(root, p.entryLeft, p.entryRight, p.bathFront, p.entryFront, balconyTile, .75, .75);
  floor(root, p.left, p.bathRight, p.bathBack, p.bathFront, bathTile, .74, .74);
  floor(root, p.divider, p.right, p.kitchenBack, p.kitchenFront, kitchenTile, .79, .79);
  floor(root, p.divider, p.balconyRight, p.balconyBack, p.kitchenBack, balconyTile, .72, .72);
  box(root, [p.entryRight - p.bathRight - p.wall, .045, .095], paint.trim,
    [(p.entryRight + p.bathRight) / 2, .018, p.bathFront]).userData.walkable = true;

  const backWall = extrudeWall(wallShape([
    [p.backLeft - halfWall, 0], [p.divider + halfWall, 0],
    [p.divider + halfWall, p.ceiling], [p.backLeft - halfWall, p.ceiling],
  ], [[[win.left, win.sill], [win.right, win.sill], [win.right, win.head], [win.left, win.head]]]),
    p.wall, paint.plaster);
  backWall.position.z = p.back;
  root.add(edges(backWall));
  box(root, [p.divider - p.backLeft + p.wall, .028, p.wall], paint.cap,
    [(p.divider + p.backLeft) / 2, p.ceiling - .012, p.back]);

  wallX(root, p.backLeft, p.back + halfWall, p.notch + halfWall, p.ceiling, -1);
  wallZ(root, p.notch, p.left - halfWall, p.backLeft - halfWall, p.ceiling, -1);
  wallX(root, p.left, p.notch + halfWall, -1.43, p.ceiling, -1);
  wallX(root, p.left, -1.43, p.bathBack - halfWall, .29, -1);
  wallX(root, p.divider, p.back + halfWall, p.bedroomDividerEnd + halfWall, p.ceiling);
  wallX(root, p.divider, p.balconyBack, p.back + halfWall, 1.08);
  wallX(root, p.balconyRight, p.balconyBack - halfWall, p.kitchenBack + halfWall, 1.66, 1);
  wallZ(root, p.kitchenBack, p.right - halfWall, p.balconyRight - halfWall, 1.61, 1);
  wallX(root, p.right, p.kitchenBack + halfWall, p.kitchenFront + halfWall, kitchenWallHeight, 1);
  wallZ(root, p.kitchenFront, p.divider + halfWall, p.right - halfWall, .28, 1);
  wallX(root, p.divider, p.bedroomDividerEnd + halfWall, p.kitchenDoor[0], .88);
  wallX(root, p.divider, p.kitchenDoor[1], p.kitchenFront + halfWall, .88, 1);
  wallX(root, p.divider, p.kitchenFront + halfWall, p.bathFront + halfWall, .38, 1);
  wallZ(root, p.bathFront, p.entryRight + halfWall, p.divider - halfWall, .38, 1);
  wallX(root, p.entryRight, p.bathFront + halfWall, p.entryFront + halfWall, 1.37, 1);

  wallZ(root, p.bathBack, p.left - halfWall, p.bathRight + halfWall, bathWallHeight);
  const bathCorner = p.bathBack + .56;
  wallX(root, p.left, p.bathBack + halfWall, bathCorner, 1.66, -1);
  wallX(root, p.left, bathCorner, p.bathFront + halfWall, .28, -1);
  wallX(root, p.bathRight, p.bathBack + halfWall, p.bathDoor[0], bathWallHeight);
  wallX(root, p.bathRight, p.bathDoor[1], p.bathFront + halfWall, 2.02);
  wallZ(root, p.bathFront, p.left + halfWall, p.bathRight - halfWall, .26, 1);
  wallX(root, p.entryLeft, p.bathFront + halfWall, p.entryFront + halfWall, .26, -1);
  wallZ(root, p.entryFront, p.entryLeft + halfWall, -1.14, .20, 1);
  wallZ(root, p.entryFront, -.29, p.entryRight - halfWall, .25, 1);

  const wallTiles = new T.MeshStandardMaterial({
    map: tiles("#b2acb5", ["#d9d4d9", "#e1dadc", "#dcd7dd", "#ddd7da"]), roughness: .7,
  });
  const tileWall = (width: number, height: number, x: number, z: number, yaw = 0) => {
    const tile = plane(root, width, height, wallTiles, [x, height / 2, z]);
    tile.rotation.y = yaw;
    useWorldUV(tile.geometry, "x", "y", .53, .53);
  };
  tileWall(p.bathRight - p.left - p.wall, bathWallHeight - .007, (p.left + p.bathRight) / 2, p.bathBack + halfWall + .002);
  tileWall(bathCorner - p.bathBack - halfWall, 1.653, p.left + halfWall + .002,
    (p.bathBack + halfWall + bathCorner) / 2, Math.PI / 2);
  tileWall(p.bathDoor[0] - p.bathBack - halfWall, bathWallHeight - .007, p.bathRight - halfWall - .002,
    (p.bathDoor[0] + p.bathBack + halfWall) / 2, -Math.PI / 2);
  tileWall(p.kitchenFront - p.kitchenBack - p.wall, kitchenWallHeight - .008, p.right - halfWall - .002,
    (p.kitchenFront + p.kitchenBack) / 2, -Math.PI / 2);

  box(root, [p.divider - p.backLeft - p.wall, .083, .033], paint.trim,
    [(p.divider + p.backLeft) / 2, .0415, p.back + halfWall + .017]);
  box(root, [.032, .083, p.bedroomDividerEnd - p.back - p.wall], paint.trim,
    [p.divider - halfWall - .017, .0415, (p.bedroomDividerEnd + p.back) / 2]);
  box(root, [p.bathRight - p.left - p.wall, .083, .033], paint.trim,
    [(p.bathRight + p.left) / 2, .0415, p.bathBack - halfWall - .016]);

  shadowRoof(root, p.backLeft, p.divider, p.back, p.bathBack);
  shadowRoof(root, p.left, p.backLeft, p.notch, p.bathBack);
  shadowRoof(root, p.divider, p.right, p.kitchenBack, p.kitchenFront);

  const bathDoor = buildDoor(root, "bath-door", p.bathRight + .017, p.bathDoor[1] - .043, .925, .76);
  const kitchenDoor = buildDoor(root, "kitchen-door", p.divider + .06, p.kitchenDoor[0] + .03, .94, 1.43);
  const bedroomHingeX = p.bathRight + .32;
  const bedroomHingeZ = p.bathBack - .76;
  const bedroomDoor = buildDoor(root, "bedroom-door", bedroomHingeX, bedroomHingeZ, .91, -1.43);
  const frontDoor = buildDoor(root, "entry-door", -.29, p.entryFront, .814, Math.PI + .135, true);
  const frameTrim = matte(0xbd9a7c);
  box(root, [.064, p.doorHeight + .046, .076], frameTrim, [bedroomHingeX - .022, 1.008, bedroomHingeZ]);
  for (const [x, z, height] of [
    [p.bathRight, p.bathDoor[0], bathWallHeight], [p.bathRight, p.bathDoor[1], 2.02],
    [p.divider, p.kitchenDoor[0], p.doorHeight + .03], [p.divider, p.kitchenDoor[1], .88],
  ]) {
    box(root, [p.wall + .025, height, .048], frameTrim, [x, height / 2, z]);
  }
  for (const x of [-1.14, -.29]) {
    box(root, [.05, p.doorHeight + .06, .17], frameTrim, [x, (p.doorHeight + .06) / 2, p.entryFront]);
  }

  return [
    obstacle("left-notch", x0, p.backLeft + halfWall, p.balconyBack - .1, p.notch + halfWall),
    obstacle("entry-left-cut", x0, p.entryLeft + halfWall, p.bathFront, p.entryFront + halfWall),
    obstacle("entry-right-cut", p.entryRight - halfWall, x1, p.bathFront - halfWall, p.entryFront + halfWall),
    obstacle("bath-front-rim", x0, p.bathRight + halfWall, p.bathFront - halfWall, p.bathFront + halfWall),
    obstacle("kitchen-front-cut", p.divider - halfWall, x1, p.kitchenFront - halfWall, p.entryFront + halfWall),
    obstacle("kitchen-east-wall", p.right - halfWall, balconyX, p.kitchenBack, p.kitchenFront),
    obstacle("bedroom-back", p.backLeft - halfWall, p.divider + halfWall, p.back - halfWall, p.back + halfWall),
    obstacle("bath-back-wall", x0, p.bathRight + halfWall, p.bathBack - halfWall, p.bathBack + halfWall),
    obstacle("bath-divider", p.bathRight - halfWall, p.bathRight + halfWall, p.bathBack, p.bathDoor[0] + .025),
    obstacle("bath-jamb", p.bathRight - halfWall, p.bathRight + halfWall, p.bathDoor[1] - .025, p.bathFront),
    obstacle("bedroom-kitchen-wall", p.divider - halfWall, p.divider + halfWall, p.balconyBack, p.kitchenDoor[0] + .025),
    obstacle("entry-kitchen-wall", p.divider - halfWall, p.divider + halfWall, p.kitchenDoor[1] - .025, p.bathFront),
    bathDoor, kitchenDoor, bedroomDoor, frontDoor,
  ];
}

export function buildBalconyFront(root: T.Group) {
  const left = p.divider + halfWall;
  const right = p.right - halfWall;
  const width = right - left;
  const z = p.kitchenBack;
  const rail = paint.steel;
  box(root, [width, .053, .12], rail, [(left + right) / 2, .03, z]).userData.walkable = true;
  box(root, [width, .062, .134], rail, [(left + right) / 2, 2.055, z]);
  const panelWidth = width / 2 + .025;
  const panelHeight = 1.974;
  const rightCenter = right - panelWidth / 2;
  for (const [x, dz] of [[rightCenter, .036], [rightCenter - .106, -.041]]) {
    const panel = new T.Group();
    panel.name = "balcony-glass-panel";
    panel.position.set(x, 1.043, z + dz);
    root.add(panel);
    frame(panel, panelWidth, panelHeight, .044, .051, rail);
    frame(panel, panelWidth - .08, panelHeight - .08, .049, .016, paint.chrome);
    glass(panel, panelWidth - .086, panelHeight - .088, [0, 0, 0], .18);
    tube(panel, [[-panelWidth / 2 + .077, -.10, .019], [-panelWidth / 2 + .077, -.09, .057],
      [-panelWidth / 2 + .077, .12, .057], [-panelWidth / 2 + .077, .13, .019]], .010, paint.chrome, 8);
  }

  const back = p.balconyBack;
  const railingWidth = p.balconyRight - halfWall - left;
  for (const [y, height] of [[.23, .032], [.92, .042], [1.12, .067]]) {
    box(root, [railingWidth, height, .067], y === 1.12 ? paint.chrome : rail, [left + railingWidth / 2, y, back]);
  }
  for (let i = 0; i <= 10; i++) {
    const post = i % 5 === 0;
    box(root, [post ? .045 : .027, post ? 1.11 : .70, .041], paint.steel,
      [left + i * railingWidth / 10, post ? .56 : .575, back]);
  }
  const leaves = landscape();
  leaves.repeat.y = .43;
  leaves.offset.y = .04;
  const outside = new T.MeshBasicMaterial({ map: leaves, color: 0x8caf93 });
  const greenery = plane(root, railingWidth, .76, outside, [left + railingWidth / 2, .40, back - .036]);
  greenery.raycast = () => {};

  return { outside, barrier: obstacle("balcony-glass", right - panelWidth - .106, right, z - .073, z + .070) };
}
