import * as T from "three";
import type { FixedBody } from "../../../game/navigation";
import { shadowRoof } from "../blueApartment/architecture";
import { obstacle } from "../blueApartment/plan";
import { box, disc, edges, frame, glass, plane, useWorldUV } from "../blueApartment/surfaces";
import { scenery } from "../gardenLoft/decor";
import { group } from "../gardenLoft/materials";
import { mesh, patch, rounded, tube, type P3 } from "../sculpt";
import { finish, type SuiteMaterials } from "./finishes";
import { plan as p, window as opening } from "./plan";

type Span = readonly [x0: number, x1: number, z0: number, z1: number];
const hw = p.wall / 2;
const frontDoor = { x: p.entryLeft + 1.73, z: 4.44, width: 1.105 };
const cutFaces = [finish.cut, finish.cut, finish.cap, finish.cut, finish.cut, finish.cut];

function wallX(parent: T.Group, x: number, z0: number, z1: number, top: number, bottom = 0, outer = false) {
  const faces = outer ? [finish.plaster, finish.cut, finish.cap, finish.cut, finish.cap, finish.cap]
    : [finish.plaster, finish.plaster, finish.cap, finish.cut, finish.cap, finish.cap];
  edges(box(parent, [p.wall, top - bottom, z1 - z0], faces, [x, (top + bottom) / 2, (z0 + z1) / 2]));
}

function wallZ(parent: T.Group, z: number, x0: number, x1: number, top: number, bottom = 0, cut = false) {
  const faces = cut ? cutFaces : [finish.cap, finish.cap, finish.cap, finish.cut, finish.plaster, finish.cut];
  edges(box(parent, [x1 - x0, top - bottom, p.wall], faces, [(x0 + x1) / 2, (top + bottom) / 2, z]));
}

function floor(parent: T.Group, [x0, x1, z0, z1]: Span, material: T.Material, repeat: number) {
  const surface = new T.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2)
    .translate((x0 + x1) / 2, .002, (z0 + z1) / 2);
  useWorldUV(surface, "x", "z", repeat, repeat);
  const object = mesh(parent, surface, material);
  object.castShadow = false;
  object.userData.walkable = true;
}

function stoneGrout(parent: T.Group, [x0, x1, z0, z1]: Span) {
  const points: T.Vector3[] = [];
  const tile = .695;
  for (let x = x0 + tile; x < x1; x += tile) points.push(new T.Vector3(x, .004, z0), new T.Vector3(x, .004, z1));
  for (let z = z0 + tile; z < z1; z += tile) points.push(new T.Vector3(x0, .004, z), new T.Vector3(x1, .004, z));
  const grout = new T.LineSegments(new T.BufferGeometry().setFromPoints(points),
    new T.LineBasicMaterial({ color: 0x967f68, transparent: true, opacity: .44 }));
  grout.raycast = () => {};
  parent.add(grout);
}

function door(parent: T.Group, name: string, at: P3, width: number, angle: number, materials: SuiteMaterials, peephole: boolean): FixedBody {
  const pivot = group(parent, name, at, angle);
  const height = p.doorHeight;
  const center = width / 2;
  rounded(pivot, [width, height, .056], materials.walnut, [center, height / 2 + .023, 0], .011);
  for (const side of [-1, 1]) {
    rounded(pivot, [width - .132, height - .153, .013], finish.walnutDark, [center, height / 2 + .026, side * .029], .009);
    rounded(pivot, [width - .181, height - .204, .012], materials.panel, [center, height / 2 + .025, side * .036], .009);
    const x = width - .106;
    rounded(pivot, [.066, .163, .014], finish.nickel, [x, .926, side * .042], .008);
    tube(pivot, [[x, .950, side * .044], [x, .950, side * .086], [x - .092, .950, side * .091],
      [x - .112, .950, side * .075]], .011, finish.nickel, 10);
    if (peephole) disc(pivot, .017, .009, finish.nickel, [center, 1.415, side * .045]).rotation.x = Math.PI / 2;
  }
  for (const y of [.29, 1.08, 1.74]) rounded(pivot, [.042, .088, .028], finish.darkBrass, [.023, y, .028], .009);
  return { id: name, x: at[0] + Math.cos(angle) * center, z: at[2] - Math.sin(angle) * center,
    halfWidth: center, halfDepth: .057, angle };
}

export function buildArchitecture(root: T.Group, materials: SuiteMaterials) {
  const shell = group(root, "hotel-suite-cutaway", [0, 0, 0]);
  const { left, backLeft, divider, right, back, leftBack, loungeBack, front, ceiling } = p;
  const outline = [
    [left - hw, leftBack - hw], [backLeft - hw, leftBack - hw], [backLeft - hw, back - hw],
    [divider + hw, back - hw], [divider + hw, loungeBack - hw], [right + hw, loungeBack - hw],
    [right + hw, front + hw], [p.entryRight + hw, front + hw], [p.entryRight + hw, p.entryFront + hw],
    [p.entryLeft - hw, p.entryFront + hw], [p.entryLeft - hw, p.bathFront + hw], [p.bathLeft - hw, p.bathFront + hw],
    [p.bathLeft - hw, p.bathBack - hw], [left - hw, p.bathBack - hw],
  ];
  const foundation = new T.Shape();
  outline.forEach(([x, z], i) => {
    if (i === 0) foundation.moveTo(x, -z);
    else foundation.lineTo(x, -z);
  });
  foundation.closePath();
  const slab = new T.Mesh(new T.ExtrudeGeometry(foundation, { depth: .45, bevelEnabled: false })
    .rotateX(-Math.PI / 2).translate(0, -.452, 0), [finish.cap, finish.cut]);
  slab.receiveShadow = true;
  shell.add(slab);

  const carpet: Span[] = [
    [backLeft, divider, back, leftBack], [left, divider, leftBack, loungeBack],
    [left, right, loungeBack, p.bathBack], [p.bathRight, right, p.bathBack, front],
  ];
  for (const span of carpet) floor(shell, span, materials.carpet, .63);
  const stone: Span[] = [
    [p.bathLeft, p.bathRight, p.bathBack, p.bathFront], [p.entryLeft, p.entryRight, front, p.entryFront],
  ];
  for (const span of stone) {
    floor(shell, span, materials.stoneFloor, 2.74);
    stoneGrout(shell, span);
  }

  wallZ(shell, back, backLeft - hw, divider + hw, ceiling);
  wallX(shell, backLeft, back + hw, leftBack - hw, ceiling, 0, true);
  wallZ(shell, leftBack, left - hw, backLeft + hw, ceiling);
  wallX(shell, left, leftBack + hw, p.leftCut, ceiling, 0, true);
  wallX(shell, left, p.leftCut, p.bathBack - hw, .23, 0, true);
  wallX(shell, divider, back + hw, loungeBack - hw, ceiling);
  wallZ(shell, loungeBack, divider - hw, opening.left, ceiling);
  wallZ(shell, loungeBack, opening.right, right + hw, ceiling);
  wallZ(shell, loungeBack, opening.left, opening.right, opening.sill);
  wallZ(shell, loungeBack, opening.left, opening.right, ceiling, opening.head);
  wallX(shell, right, loungeBack + hw, front + hw, ceiling);
  wallZ(shell, front, p.entryRight + hw, right - hw, .16, 0, true);

  box(shell, [divider - backLeft - .14, .090, .033], finish.baseboard, [(backLeft + divider) / 2, .047, back + hw + .017]);
  box(shell, [.033, .093, front - loungeBack - .22], finish.baseboard, [right - hw - .017, .048, (front + loungeBack) / 2]);

  const bath = group(shell, "bath-cutaway-walls", [0, 0, 0]);
  wallZ(bath, p.bathBack, p.bathLeft - hw, p.bathRight + hw, p.bathHeight);
  wallX(bath, p.bathLeft, p.bathBack + hw, p.bathFront + hw, .27, 0, true);
  wallZ(bath, p.bathFront, p.bathLeft + hw, p.bathRight + hw, .26, 0, true);
  const [from, to] = p.bathDoor;
  wallX(bath, p.bathRight, p.bathBack + hw, from, p.bathHeight);
  wallX(bath, p.bathRight, to, p.bathFront + hw, p.bathHeight);
  for (const z of [from + .016, to - .016]) {
    rounded(bath, [.252, 2.055, .064], materials.walnut, [p.bathRight, 1.028, z], .009);
  }
  box(bath, [.254, .073, to - from + .032], materials.walnut, [p.bathRight, 2.036, (from + to) / 2]);
  const bathDoor = door(bath, "hotel-bathroom-door", [p.bathRight + .136, 0, from + .020], 1.057, 1.49, materials, false);

  const entry = group(shell, "entry-cutaway-walls", [0, 0, 0]);
  wallX(entry, p.entryLeft, p.bathFront + hw, p.entryFront + hw, .33, 0, true);
  wallX(entry, p.entryRight, front - hw, p.entryFront + hw, 2.01);
  wallZ(entry, p.entryFront, p.entryLeft + hw, p.entryLeft + .90, .24, 0, true);
  wallZ(entry, p.entryFront, p.entryLeft + .90, p.entryRight - 1.34, .115, 0, true);
  wallZ(entry, p.entryFront, p.entryRight - 1.34, p.entryRight - hw, .26, 0, true);
  wallZ(entry, front, p.entryLeft, frontDoor.x - frontDoor.width / 2 - .045, .38, 0, true);
  const entryDoor = door(entry, "hotel-entry-door", [frontDoor.x + frontDoor.width / 2, 0, frontDoor.z],
    frontDoor.width, Math.PI, materials, true);
  for (const x of [frontDoor.x - frontDoor.width / 2 - .033, frontDoor.x + frontDoor.width / 2 + .033]) {
    rounded(entry, [.087, 2.075, .151], finish.cap, [x, 1.038, frontDoor.z], .012);
    box(entry, [.032, 2.035, .014], materials.panel, [x, 1.017, frontDoor.z + .079]);
  }
  box(entry, [frontDoor.width + .167, .072, .153], finish.cap, [frontDoor.x, 2.056, frontDoor.z]);
  box(entry, [p.entryRight - p.entryLeft - .23, .021, .115], materials.walnutLight,
    [(p.entryLeft + p.entryRight) / 2, .012, front]).userData.walkable = true;

  shadowRoof(shell, backLeft, divider, back, leftBack, ceiling);
  shadowRoof(shell, left, divider, leftBack, loungeBack, ceiling);
  shadowRoof(shell, left, right, loungeBack, front, ceiling);

  return [
    obstacle("bedroom-back-wall", backLeft, divider + hw, back - hw, back + hw),
    obstacle("outside-left-wall", p.bathLeft - hw, left + hw, back - hw, p.bathBack - hw),
    obstacle("rear-left-recess", left, backLeft + hw, back - hw, leftBack + hw),
    obstacle("behind-lounge", divider - hw, right, back - hw, loungeBack + hw),
    obstacle("bedroom-return", divider - hw, divider + hw, back, loungeBack),
    obstacle("bathroom-back-wall", p.bathLeft, p.bathRight + hw, p.bathBack - hw, p.bathBack + hw),
    obstacle("bathroom-rear-jamb", p.bathRight - hw, p.bathRight + hw, p.bathBack, from + .038),
    obstacle("bathroom-front-jamb", p.bathRight - hw, p.bathRight + hw, to - .038, p.bathFront + hw),
    obstacle("outside-bath", p.bathLeft, p.bathRight + hw, p.bathFront - hw, p.entryFront + hw),
    obstacle("outside-lounge", p.entryRight - hw, right, front - hw, p.entryFront + hw),
    obstacle("entry-wing", p.entryLeft - hw, frontDoor.x - frontDoor.width / 2 - .045, front - hw, front + hw),
    bathDoor, entryDoor,
  ];
}

export function buildWindow(root: T.Group) {
  const { left, right, sill, head } = opening;
  const w = right - left, h = head - sill;
  const window = group(root, "hotel-picture-window", [(left + right) / 2, (sill + head) / 2, p.loungeBack + .021]);
  const outdoor = new T.MeshBasicMaterial({ map: scenery(true) });
  plane(window, w - .046, h - .039, outdoor, [0, 0, -.096]).userData.pickThrough = true;
  glass(window, w - .072, h - .063, [0, 0, -.005], .076);
  frame(window, w, h, .132, .064, finish.walnutDark);
  for (const x of [-w / 4, 0, w / 4]) box(window, [.059, h - .058, .102], finish.walnutDark, [x, 0, .024]);
  for (const y of [-h * .255, .015, h * .285]) box(window, [w - .065, .051, .114], finish.walnutDark, [0, y, .031]);
  box(window, [w + .105, .065, .267], finish.baseboard, [0, -h / 2, .074]);
  disc(window, .028, w + .28, finish.darkBrass, [0, h / 2 + .053, .212]).rotation.z = Math.PI / 2;

  const burgundy = new T.MeshStandardMaterial({ color: 0x752824, side: T.DoubleSide, roughness: .93 });
  const sheer = new T.MeshStandardMaterial({ color: 0xffebcd, transparent: true, opacity: .87,
    side: T.DoubleSide, depthWrite: false, roughness: 1 });
  const curtains = [];
  for (const side of [-1, 1]) {
    const curtain = group(window, "hotel-burgundy-curtain", [side * (w / 2 + .073), 0, .257 + .005 * side]);
    curtain.userData.interactive = { id: "curtains" };
    const shape = (u: number, v: number, closed: boolean): P3 => {
      const draw = Math.exp(-(((v - .605) / .163) ** 2));
      const width = closed ? w * .5 + .11 : .89 - .465 * draw + .045 * v;
      const folds = Math.cos(u * Math.PI * 13 + .17) * (.051 + .018 * v - .021 * draw);
      return [-side * u * width, h / 2 + .048 - (h + .166) * v + .021 * Math.sin(u * 17) * v ** 6, folds];
    };
    const drape = patch(curtain, 46, 26, (u, v) => shape(u, v, false), burgundy);
    const extended = patch(curtain, 46, 26, (u, v) => shape(u, v, true), burgundy);
    drape.geometry.morphAttributes.position = [extended.geometry.getAttribute("position")];
    drape.geometry.morphAttributes.normal = [extended.geometry.getAttribute("normal")];
    drape.updateMorphTargets();
    extended.removeFromParent();
    extended.geometry.dispose();

    const tie = group(curtain, "braided-gold-tieback", [0, 0, 0]);
    const cord = Array.from({ length: 9 }, (_, i): P3 => {
      const [x, y] = shape(i / 8, .612 + .016 * Math.sin(i * .42), false);
      return [x, y, .066 - .020 * Math.abs(i - 4) / 4];
    });
    tube(tie, cord, .026, finish.brass, 24);
    const [x, y, z] = cord[6];
    tube(tie, [[x, y, z], [x + side * .046, y - .088, z + .023], [x + side * .046, y - .197, z + .031]], .010, finish.darkBrass, 10);
    rounded(tie, [.044, .133, .033], finish.brass, [x + side * .048, y - .243, z + .030], .010);

    const inner = group(window, "hotel-ivory-sheer", [side * (w / 2 - .557), 0, .158]);
    const liner = patch(inner, 34, 16, (u, v) => [-side * u * (.747 + v * .068), h / 2 - (h + .129) * v,
      Math.cos(u * 12 * Math.PI) * (.021 + v * .007)], sheer);
    liner.castShadow = false;
    liner.userData.pickThrough = true;
    curtains.push({ drape, tie });
  }
  return { outdoor, curtains };
}
