import * as THREE from "three";
import { CSG } from "three-csg-ts";
import { addOutline, bmesh, toon, wallShape } from "./utils";

function carve(
  blank: THREE.BufferGeometry,
  cutter: THREE.Mesh,
  outside: THREE.Material,
  inside: THREE.Material,
  outline: number,
) {
  cutter.updateMatrix();
  const solid = CSG.fromGeometry(blank, 0).subtract(CSG.fromMesh(cutter, 1));
  const mesh = solid.toMesh(new THREE.Matrix4(), [outside, inside]);
  mesh.castShadow = mesh.receiveShadow = true;
  addOutline(mesh, outline);
  blank.dispose();
  cutter.geometry.dispose();
  return mesh;
}

function shoePrism(depth: number, bevel: number) {
  // A broad, rounded toe and a tighter heel. The profile is shared by upper and sole.
  const outline = new THREE.Shape();
  outline.moveTo(-.106, -.247);
  outline.quadraticCurveTo(-.153, -.243, -.151, -.185);
  outline.quadraticCurveTo(-.148, -.085, -.159, .095);
  outline.quadraticCurveTo(-.163, .237, -.082, .281);
  outline.quadraticCurveTo(.036, .319, .126, .259);
  outline.quadraticCurveTo(.179, .212, .158, .095);
  outline.quadraticCurveTo(.112, -.102, .123, -.177);
  outline.quadraticCurveTo(.131, -.253, .064, -.253);
  outline.closePath();
  return new THREE.ExtrudeGeometry(outline, {
    depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1,
    curveSegments: 2,
  }).rotateX(-Math.PI / 2);
}

function buildShoe(color: number) {
  const shoe = new THREE.Group();
  shoe.name = "entry-shoe";
  const sole = new THREE.Mesh(shoePrism(.047, .012), toon(0xe3d8c4));
  sole.position.y = .012;
  sole.castShadow = sole.receiveShadow = true;
  addOutline(sole, .005);
  shoe.add(sole);

  const blank = shoePrism(.186, .018);
  const points = blank.getAttribute("position");
  for (let i = 0; i < points.count; i++) {
    const rise = points.getY(i);
    const z = points.getZ(i);
    const taper = THREE.MathUtils.smoothstep(rise, 0, .186);
    const toeSlope = THREE.MathUtils.lerp(.58, 1, THREE.MathUtils.smoothstep(z, -.24, .13));
    points.setXYZ(i, points.getX(i) * (1 - .17 * taper), .067 + rise * toeSlope, z * (1 - .095 * taper));
  }
  blank.computeVertexNormals();

  const opening = new THREE.Mesh(new THREE.CylinderGeometry(.109, .081, .232, 12));
  opening.position.set(.009, .226, .072);
  opening.scale.z = 1.27;
  opening.rotation.x = -.15;
  const upper = carve(blank, opening, toon(color), toon(0x444656), .006);
  upper.name = "carved-shoe-upper";
  shoe.add(upper);

  for (const [z, y, angle] of [[-.13, .21, .07], [-.176, .191, -.07]]) {
    const lace = bmesh(.158, .015, .024, toon(0xe5ddd1), .007, y, z, { cast: false });
    lace.rotation.y = angle;
    shoe.add(lace);
  }
  return shoe;
}

export function buildEntryShoes() {
  const shoes = new THREE.Group();
  shoes.name = "entry-shoes";
  for (const [z, color, angle] of [[3.79, 0x576d8a, .20], [4.46, 0xa17b61, -.17]]) {
    const left = buildShoe(color);
    const right = left.clone(true);
    right.scale.x = -1;
    left.position.set(-4.86, .055, z);
    right.position.set(-4.47, .055, z + .035);
    left.rotation.y = angle + .055;
    right.rotation.y = angle - .045;
    shoes.add(left, right);
  }
  return shoes;
}

export function buildHangingJacket() {
  const jacket = new THREE.Group();
  jacket.name = "entry-jacket";
  const silhouette = wallShape([
    [-.16, .71], [-.36, .66], [-.52, .53], [-.66, -.18],
    [-.47, -.26], [-.36, .045], [-.39, -.64], [-.20, -.69],
    [.20, -.68], [.37, -.62], [.34, .03], [.47, -.29],
    [.66, -.20], [.54, .51], [.37, .64], [.16, .72],
  ]);
  const blank = new THREE.ExtrudeGeometry(silhouette, {
    depth: .117, bevelEnabled: true, bevelThickness: .022, bevelSize: .021, bevelSegments: 1,
  }).translate(0, 0, -.0585);
  const collar = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8));
  collar.position.set(.012, .714, .024);
  collar.scale.set(.205, .205, .22);
  collar.rotation.z = -.13;

  const blue = toon(0x719cc5);
  const cuff = toon(0x557da2);
  const shell = carve(blank, collar, blue, cuff, .011);
  shell.name = "carved-jacket";
  jacket.add(shell);
  const hanger = toon(0xb7a58e);
  const hook = new THREE.Mesh(new THREE.TorusGeometry(.066, .014, 5, 12, Math.PI * 1.42), hanger);
  hook.position.set(.014, .732, -.050);
  hook.rotation.z = -.18;
  jacket.add(hook, bmesh(.024, .153, .026, hanger, .014, .648, -.050, { cast: false }));
  jacket.add(bmesh(.021, 1.06, .025, cuff, .008, -.047, .081, { cast: false }));
  jacket.add(bmesh(.045, .064, .023, toon(0xd8dbe0), .008, .43, .099, { cast: false }));
  for (const side of [-1, 1]) {
    const pocket = bmesh(.21, .036, .025, cuff, side * .237, -.225, .078, { cast: false });
    pocket.rotation.z = side * -.22;
    const sleeveEnd = bmesh(.19, .076, .141, cuff, side * .55, -.199 - .025 * side, 0, { cast: false });
    sleeveEnd.rotation.z = side * .32;
    jacket.add(pocket, sleeveEnd);
  }
  jacket.position.set(-5.55, 2.54, 1.74);
  jacket.rotation.set(0, Math.PI / 2 + .03, -.035);
  return jacket;
}
