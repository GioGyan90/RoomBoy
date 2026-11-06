import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createBodyBlockout } from '../src/assets/procedural/bodyBlockout';
import { createFemaleBodyBlockout } from '../src/assets/procedural/femaleBodyBlockout';
import { femaleBodyBands, femaleBodyPlan, femaleStudyCrops } from '../src/assets/procedural/femaleBodyReference';

function coordinates(geometry: T.BufferGeometry) {
  const positions = geometry.getAttribute('position');
  return Array.from({ length: positions.count }, (_, i) => new T.Vector3().fromBufferAttribute(positions, i));
}

const key = (point: T.Vector3) => [point.x, point.y, point.z].map(axis => Math.round(axis * 1e6)).join(',');

test('female study has closed, outward-facing mirrored cages at the male blockout density', () => {
  const body = createFemaleBodyBlockout();
  const male = createBodyBlockout('blockout');
  const box = new T.Box3().setFromObject(body);
  assert.equal(body.children.length, 19);
  assert.ok(Math.abs(box.min.y) < 1e-6);
  assert.ok(Math.abs(box.max.y - femaleBodyPlan.height) < 1e-6);
  assert.ok(Math.abs(body.userData.triangles / male.userData.triangles - 1) < .1);

  const facesByPart = new Map<string, Set<string>>();
  const reflectedFaces = new Map<string, string[]>();
  for (const part of body.children as T.Mesh[]) {
    const points = coordinates(part.geometry);
    const index = part.geometry.index!;
    const edges = new Map<string, { count: number; direction: number }>();
    const faces = new Set<string>();
    const mirrored: string[] = [];
    let volume = 0;
    for (let i = 0; i < index.count; i += 3) {
      const face = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
      const corners = face.map(vertex => points[vertex]);
      const [a, b, c] = corners;
      assert.ok(b.clone().sub(a).cross(c.clone().sub(a)).lengthSq() > 1e-15, part.name);
      volume += a.dot(b.clone().cross(c));
      faces.add(corners.map(key).sort().join('/'));
      mirrored.push(corners.map(point => key(new T.Vector3(-point.x, point.y, point.z))).sort().join('/'));
      for (let j = 0; j < 3; j++) {
        const start = face[j], end = face[(j + 1) % 3];
        const edgeKey = [Math.min(start, end), Math.max(start, end)].join(':');
        const edge = edges.get(edgeKey) ?? { count: 0, direction: 0 };
        edge.count++;
        edge.direction += start < end ? 1 : -1;
        edges.set(edgeKey, edge);
      }
    }
    assert.ok(volume > 0, part.name);
    for (const edge of edges.values()) {
      assert.deepEqual(edge, { count: 2, direction: 0 }, part.name);
    }
    facesByPart.set(part.name, faces);
    reflectedFaces.set(part.name, mirrored);
  }
  for (const [name, faces] of reflectedFaces) {
    const other = name.startsWith('left-') ? name.replace('left-', 'right-')
      : name.startsWith('right-') ? name.replace('right-', 'left-') : name;
    assert.ok(faces.every(face => facesByPart.get(other)!.has(face)), name);
  }
});

test('female joint cuts and pelvic sockets meet at the actual cage vertices', () => {
  const body = createFemaleBodyBlockout();
  const part = (name: string) => coordinates((body.getObjectByName(name) as T.Mesh).geometry);
  function rim(name: string, rows: number, sides: number, top: boolean) {
    const offset = top ? (rows - 1) * sides : 0;
    return part(name).slice(offset, offset + sides).map(key).sort();
  }
  assert.deepEqual(rim('neck', femaleBodyBands.neck.length, 16, false),
    rim('ribcage', femaleBodyBands.ribcage.length, 16, true));
  assert.deepEqual(rim('ribcage', femaleBodyBands.ribcage.length, 16, false),
    rim('abdomen', femaleBodyBands.abdomen.length, 16, true));
  assert.deepEqual(rim('abdomen', femaleBodyBands.abdomen.length, 16, false),
    rim('pelvis', femaleBodyBands.pelvis.length, 16, true));
  const pelvis = new Set(part('pelvis').map(key));
  for (const side of ['left', 'right'] as const) {
    for (const [upper, lower] of [
      ['deltoid', 'upper-arm'], ['upper-arm', 'forearm'], ['forearm', 'hand'],
      ['thigh', 'shin'], ['shin', 'foot'],
    ] as const) {
      assert.deepEqual(rim(side + '-' + upper, femaleBodyBands[upper].length, 8, false),
        rim(side + '-' + lower, femaleBodyBands[lower].length, 8, true));
    }
    assert.ok(rim(side + '-thigh', femaleBodyBands.thigh.length, 8, true).every(point => pelvis.has(point)));
  }
});

test('female meshes meet the independently read orthographic joint positions', () => {
  const { fitReport } = createFemaleBodyBlockout().userData;
  for (const view of ['front', 'side', 'back'] as const) {
    assert.ok(fitReport[view].rms < 3, view);
    assert.ok(fitReport[view].max < 5, view);
  }
});

test('female leg split matches the flat opening and inner thigh contours in the source views', () => {
  const body = createFemaleBodyBlockout();
  body.updateMatrixWorld(true);
  const ray = new T.Raycaster();
  const samples = {
    front: { opening: 258.3, edges: [[259.5, 6], [279, 7], [294.5, 7.5], [322.5, 12], [342.5, 16.5], [362.5, 22]] },
    back: { opening: 257.3, edges: [[258.5, 5.8], [279, 7.5], [294.5, 8], [322.5, 12.3], [342.5, 16.5], [362.5, 22.5]] },
  };
  for (const view of ['front', 'back'] as const) {
    const { ground, scale } = femaleStudyCrops[view];
    const direction = view === 'front' ? 1 : -1;
    const { opening, edges } = samples[view];
    function occupied(x: number, y: number) {
      ray.set(new T.Vector3(x * scale * direction, (ground - y) * scale, 2 * direction),
        new T.Vector3(0, 0, -direction));
      return ray.intersectObject(body, true).length > 0;
    }
    for (const x of [-4.5, 0, 4.5]) {
      assert.ok(occupied(x, opening - .7), `${view} pelvis above the opening`);
      assert.ok(!occupied(x, opening + .7), `${view} level opening at ${x}`);
    }
    for (const [y, edge] of edges) {
      assert.ok(!occupied(edge - 1.4, y), `${view} gap at row ${y}`);
      assert.ok(occupied(edge + 1.4, y), `${view} inner thigh at row ${y}`);
    }
  }
});
