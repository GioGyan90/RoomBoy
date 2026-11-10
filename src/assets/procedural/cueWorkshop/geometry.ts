import * as T from 'three';

export type Point = readonly [number, number, number];

export function group(parent: T.Object3D, name: string) {
  const result = new T.Group();
  result.name = name;
  parent.add(result);
  return result;
}

function add(parent: T.Object3D, name: string, geometry: T.BufferGeometry, material: T.Material, at: Point) {
  const mesh = new T.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...at);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function box(parent: T.Object3D, name: string, size: Point, material: T.Material, at: Point) {
  return add(parent, name, new T.BoxGeometry(...size), material, at);
}

export function cylinder(parent: T.Object3D, name: string, radiusTop: number, radiusBottom: number,
  height: number, material: T.Material, at: Point, axis: 'x' | 'y' | 'z' = 'y') {
  const mesh = add(parent, name, new T.CylinderGeometry(radiusTop, radiusBottom, height, 8), material, at);
  if (axis === 'x') mesh.rotation.z = -Math.PI / 2;
  if (axis === 'z') mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function hole(shape: T.Shape, x: number, z: number, radius: number) {
  const path = new T.Path();
  // Clockwise hole in the counterclockwise outer contour.
  for (let i = 0; i < 8; i++) {
    const a = -i * Math.PI / 4;
    const px = x + Math.cos(a) * radius, py = -z + Math.sin(a) * radius;
    if (i === 0) path.moveTo(px, py); else path.lineTo(px, py);
  }
  path.closePath();
  shape.holes.push(path);
}

/** A horizontal, genuinely perforated board. Cues pass through clear apertures. */
export function rackBoard(parent: T.Object3D, width: number, sockets: readonly number[],
  material: T.Material, at: Point) {
  const shape = new T.Shape();
  shape.moveTo(-width / 2, -.18);
  shape.lineTo(width / 2, -.18);
  shape.lineTo(width / 2, .18);
  shape.lineTo(-width / 2, .18);
  shape.closePath();
  for (const x of sockets) hole(shape, x, 0, .047);
  const geometry = new T.ExtrudeGeometry(shape, { depth: .07, bevelEnabled: false, curveSegments: 1, steps: 1 });
  geometry.rotateX(-Math.PI / 2);
  return add(parent, 'rack-aperture-board', geometry, material, at);
}

/** An eight-sided ferrule with an open bore, rather than a solid white plug. */
export function ferrule(parent: T.Object3D, material: T.Material, at: Point) {
  const shape = new T.Shape();
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    if (i === 0) shape.moveTo(Math.cos(a) * .031, Math.sin(a) * .031);
    else shape.lineTo(Math.cos(a) * .031, Math.sin(a) * .031);
  }
  shape.closePath();
  hole(shape, 0, 0, .019);
  const geometry = new T.ExtrudeGeometry(shape, { depth: .052, bevelEnabled: false, curveSegments: 1, steps: 1 });
  geometry.rotateX(-Math.PI / 2);
  return add(parent, 'spare-ferrule', geometry, material, at);
}

/** Closed prism used for the small hand-plane body, with no hidden high-density mesh. */
export function wedge(parent: T.Object3D, name: string, material: T.Material, at: Point) {
  const shape = new T.Shape();
  shape.moveTo(-.16, 0);
  shape.lineTo(.16, 0);
  shape.lineTo(.105, .09);
  shape.lineTo(-.08, .14);
  shape.closePath();
  const geometry = new T.ExtrudeGeometry(shape, { depth: .07, bevelEnabled: false, curveSegments: 1 });
  geometry.translate(0, 0, -.035);
  return add(parent, name, geometry, material, at);
}

export function modelStats(root: T.Object3D) {
  let meshes = 0, triangles = 0;
  root.traverse(object => {
    if (!(object instanceof T.Mesh)) return;
    meshes++;
    const geometry = object.geometry;
    triangles += (geometry.index?.count ?? geometry.getAttribute('position').count) / 3;
  });
  return { meshes, triangles };
}
