import * as T from 'three';
import { cage } from './bodyBlockout';
import { measureReprojection, type MeshLandmarks } from './bodyConstraints';
import { femaleBodyBands as bands, femaleCrotchY, femaleStudyCrops, femaleStudyJoints, femaleY, type FemaleBand } from './femaleBodyReference';

const TORSO_SIDES = 16;
const LIMB_SIDES = 8;
const THIGH_INNER_FRONT = LIMB_SIDES - 1;
const THIGH_INNER_BACK = LIMB_SIDES / 2 + 1;
const { front, side } = femaleStudyCrops;

function sectionGeometry(sections: readonly FemaleBand[], sides: number, centered = false) {
  const geometry = cage(sections.map(([y, left, right, anterior, posterior]) => [
    femaleY(y),
    (right - left) * front.scale / 2,
    (posterior - anterior) * side.scale / 2,
    (side.axis - (anterior + posterior) / 2) * side.scale,
    (left + right) * front.scale / 2,
  ]), sides);
  const positions = geometry.getAttribute('position');
  for (const [row, [, , , anterior, posterior, frontArc = 1, backArc = 1]] of sections.entries()) {
    const depth = (posterior - anterior) * side.scale / 2;
    const center = (side.axis - (anterior + posterior) / 2) * side.scale;
    for (let col = 0; col < sides; col++) {
      const angle = Math.min(col, sides - col) / sides * Math.PI * 2;
      const c = Math.cos(angle);
      const i = row * sides + col;
      positions.setZ(i, center + depth * Math.sign(c) * Math.abs(c) ** (c >= 0 ? frontArc : backArc));
      if (centered && col === sides / 2) positions.setX(i, 0);
      if (centered && col > sides / 2) positions.setX(i, -positions.getX(row * sides + sides - col));
    }
  }
  if (centered) {
    // Mirror the diagonal as well as the vertices on the other half.
    const index = geometry.index!;
    for (let row = 0; row < sections.length - 1; row++) {
      for (let col = sides / 2; col < sides; col++) {
        const a = row * sides + col;
        const b = row * sides + (col + 1) % sides;
        index.array.set([a, b, b + sides, a, b + sides, a + sides], a * 6);
      }
    }
  }
  return geometry;
}

function mesh(name: string, geometry: T.BufferGeometry) {
  geometry.computeVertexNormals();
  const part = new T.Mesh(geometry, new T.MeshStandardMaterial({ color: 0x9aaeb9, roughness: 1, flatShading: true }));
  part.name = name;
  return part;
}

function reflected(geometry: T.BufferGeometry) {
  const mirrored = geometry.clone().scale(-1, 1, 1);
  const indices = mirrored.index!.array;
  for (let i = 0; i < indices.length; i += 3) {
    [indices[i + 1], indices[i + 2]] = [indices[i + 2], indices[i + 1]];
  }
  return mirrored;
}

function vertex(geometry: T.BufferGeometry, i: number) {
  return new T.Vector3().fromBufferAttribute(geometry.getAttribute('position'), i);
}

function shapeThighCut(geometry: T.BufferGeometry) {
  const top = (bands.thigh.length - 1) * LIMB_SIDES;
  const [hipY] = bands.thigh.at(-1)!;
  const [kneeY] = bands.thigh[0];
  const positions = geometry.getAttribute('position');
  for (let i = 0; i < LIMB_SIDES; i++) {
    const across = Math.sin(i / LIMB_SIDES * Math.PI * 2);
    const medial = Math.min(1, Math.max(0, -across) / Math.SQRT1_2);
    const y = T.MathUtils.lerp(hipY, femaleCrotchY, medial) + Math.max(0, across) * 3.5;
    positions.setY(top + i, femaleY(y));
  }
  for (const [row, [y]] of bands.thigh.entries()) {
    const start = row * LIMB_SIDES;
    const plane = .76 * (1 - T.MathUtils.smoothstep(y, 321, kneeY));
    for (const [inner, extreme] of [[THIGH_INNER_FRONT, 0], [THIGH_INNER_BACK, LIMB_SIDES / 2]]) {
      const depth = T.MathUtils.lerp(positions.getZ(start + inner), positions.getZ(start + extreme), plane);
      positions.setZ(start + inner, depth);
    }
  }
}

/** Closed pelvis with two separate thigh collars. The visible join is
 * shared, and each cut stays closed when either part is inspected alone. */
function pelvisGeometry(leftThigh: T.BufferGeometry) {
  const trunk = sectionGeometry(bands.pelvis, TORSO_SIDES, true);
  const half = TORSO_SIDES / 2;
  const cap = bands.pelvis.length * TORSO_SIDES;
  const firstCapFace = (bands.pelvis.length - 1) * TORSO_SIDES * 6;
  const indices = Array.from(trunk.index!.array.slice(0, firstCapFace));
  const points = Array.from({ length: cap }, (_, i) => vertex(trunk, i));
  const top = points.push(vertex(trunk, cap + 1)) - 1;
  for (let i = 0; i < TORSO_SIDES; i++) {
    indices.push(top, cap - TORSO_SIDES + i, cap - TORSO_SIDES + (i + 1) % TORSO_SIDES);
  }
  trunk.dispose();

  // Extend both central planes down to the medial thigh corners. These seven
  // midline vertices form the flat opening between the separate leg rims.
  const thighTop = (bands.thigh.length - 1) * LIMB_SIDES;
  const frontLip = vertex(leftThigh, thighTop + THIGH_INNER_FRONT);
  const backLip = vertex(leftThigh, thighTop + THIGH_INNER_BACK);
  frontLip.x = backLip.x = 0;
  const frontIndex = points.push(frontLip) - 1;
  const backIndex = points.push(backLip) - 1;
  const outerHalf = Array.from({ length: half + 1 }, (_, i) => i);
  const saddle = Array.from({ length: half - 3 }, (_, i) => {
    const t = (i + 1) / (half - 2);
    return points.push(backLip.clone().lerp(frontLip, t)) - 1;
  });
  const upperRim = [frontIndex, ...outerHalf, backIndex, ...saddle];
  const lowerStart = points.length;
  for (let i = 0; i < LIMB_SIDES; i++) {
    points.push(vertex(leftThigh, thighTop + (i + THIGH_INNER_FRONT) % LIMB_SIDES));
  }
  const leftCap = points.push(vertex(leftThigh, bands.thigh.length * LIMB_SIDES + 1)) - 1;
  const rightStart = points.length;
  for (const point of points.slice(lowerStart)) points.push(point.clone().multiply(new T.Vector3(-1, 1, 1)));

  // Match the fork's front, outside, back, and inner turns to the thigh.
  const rimCuts = [0, 2, 4, 5, 6, 8, 10, 13, 16];
  const mirror = (i: number) => i >= lowerStart ? rightStart + i - lowerStart
    : i > 0 && i < half ? TORSO_SIDES - i : i;
  function triangle(a: number, b: number, c: number) {
    indices.push(a, b, c, mirror(a), mirror(c), mirror(b));
  }
  for (let i = 0; i < LIMB_SIDES; i++) {
    const a = lowerStart + i;
    const b = lowerStart + (i + 1) % LIMB_SIDES;
    triangle(leftCap, b, a);
    if (i === 0) {
      // Keep the front lip between the two level medial rims.
      triangle(a, b, upperRim[2]);
      triangle(a, upperRim[2], upperRim[1]);
      triangle(a, upperRim[1], upperRim[0]);
      continue;
    }
    triangle(a, b, upperRim[rimCuts[i]]);
    for (let j = rimCuts[i]; j < rimCuts[i + 1]; j++) {
      triangle(b, upperRim[(j + 1) % TORSO_SIDES], upperRim[j]);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(points.flatMap(p => p.toArray()), 3));
  geometry.setIndex(indices);
  return geometry;
}

const limbParts = ['deltoid', 'upper-arm', 'forearm', 'hand', 'thigh', 'shin', 'foot'] as const;
export const femalePartLabels: Record<string, string> = {
  head: '头部', neck: '颈部', ribcage: '胸廓', abdomen: '腹腰', pelvis: '骨盆',
  ...Object.fromEntries((['right', 'left'] as const).flatMap(side =>
    limbParts.map((part, i) => [side + '-' + part, (side === 'right' ? '右' : '左') +
      ['肩', '上臂', '前臂', '手', '大腿', '小腿', '足'][i]]))),
};

export function createFemaleBodyBlockout() {
  const root = new T.Group();
  root.name = 'female-body-blockout';
  const head = sectionGeometry(bands.head, 12, true);
  const jaw = head.getAttribute('position');
  for (let i = 0; i < 12; i++) {
    const rear = Math.max(0, -Math.cos(Math.min(i, 12 - i) / 12 * Math.PI * 2));
    jaw.setY(i, jaw.getY(i) + rear * 5 * front.scale);
  }
  const neck = sectionGeometry(bands.neck, TORSO_SIDES, true);
  const ribcage = sectionGeometry(bands.ribcage, TORSO_SIDES, true);
  const chest = ribcage.getAttribute('position');
  const chestBreak = bands.ribcage.findIndex(([y]) => y === 125) * TORSO_SIDES;
  for (let i = 0; i < TORSO_SIDES; i++) {
    const angle = Math.min(i, TORSO_SIDES - i) / TORSO_SIDES * Math.PI * 2;
    const anterior = Math.max(0, Math.cos(angle));
    const sternum = anterior ** 10;
    const vertex = chestBreak + i;
    chest.setY(vertex, chest.getY(vertex) + (1.5 * anterior - 3 * sternum) * front.scale);
    chest.setZ(vertex, chest.getZ(vertex) - 1.7 * sternum * side.scale);
  }
  root.add(mesh('head', head), mesh('neck', neck), mesh('ribcage', ribcage),
    mesh('abdomen', sectionGeometry(bands.abdomen, TORSO_SIDES, true)));

  const left = Object.fromEntries(limbParts.map(part => [part, sectionGeometry(bands[part], LIMB_SIDES)])) as
    Record<typeof limbParts[number], T.BufferGeometry>;
  shapeThighCut(left.thigh);
  root.add(mesh('pelvis', pelvisGeometry(left.thigh)));
  for (const part of limbParts) {
    root.add(mesh('left-' + part, left[part]), mesh('right-' + part, reflected(left[part])));
  }

  // Read actual cage vertices for the review markers, including both sides
  // of the seams. The hip marker is the thigh's top cut in this study.
  const shoulder = new T.Vector3();
  for (let i = 0; i < LIMB_SIDES; i++) shoulder.add(vertex(left.deltoid, 2 * LIMB_SIDES + i));
  const collarCenter = (part: typeof limbParts[number], top: boolean) =>
    vertex(left[part], bands[part].length * LIMB_SIDES + Number(top)).toArray();
  const leftShoulder = shoulder.divideScalar(LIMB_SIDES).toArray();
  const leftElbow = collarCenter('forearm', true), leftWrist = collarCenter('forearm', false);
  const leftHip = collarCenter('thigh', true), leftKnee = collarCenter('shin', true), leftAnkle = collarCenter('shin', false);
  const mirror = ([x, y, z]: T.Vector3Tuple): T.Vector3Tuple => [-x, y, z];
  const landmarks: MeshLandmarks = {
    crown: vertex(head, bands.head.length * 12 + 1).toArray(),
    chin: vertex(head, 0).toArray(),
    neck: vertex(neck, bands.neck.length * TORSO_SIDES).toArray(),
    leftShoulder, leftElbow, leftWrist, leftHip, leftKnee, leftAnkle,
    rightShoulder: mirror(leftShoulder), rightElbow: mirror(leftElbow), rightWrist: mirror(leftWrist),
    rightHip: mirror(leftHip), rightKnee: mirror(leftKnee), rightAnkle: mirror(leftAnkle),
  };
  root.userData.landmarks = landmarks;
  root.userData.fitReport = measureReprojection(landmarks, femaleStudyJoints, femaleStudyCrops);
  root.userData.triangles = (root.children as T.Mesh[]).reduce((sum, part) => sum + part.geometry.index!.count / 3, 0);
  return root;
}
