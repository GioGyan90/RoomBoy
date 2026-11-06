import * as T from 'three';

type Side = 'l' | 'r';
export type JointName = 'pelvis' | 'spine' | 'chest' | 'neck' | 'head'
  | `${Side}${'Shoulder' | 'UpperArm' | 'ForeArm' | 'Hand' | 'Thigh' | 'Shin' | 'Foot'}`;
export type Bindings = Record<JointName, { index: number; position: T.Vector3 }>;

type Ring = T.Vector3[];
type Section = { height: number; points: Ring };
type Weight = readonly [first: JointName, second: JointName, amount: number];
type Weights = (point: T.Vector3) => Weight;
const SIDES = 24;
const SKIN = 0;
const VEST = 1;
const SHORTS = 2;
const BINDING = 3;

function center(points: Ring): T.Vector3 {
  return points.reduce((sum, point) => sum.add(point), new T.Vector3()).divideScalar(points.length);
}

// Resample the measured section polygons. The same profile drives the skin and garment.
function readSections(study: T.Group, name: string, sides = SIDES): Section[] {
  const mesh = study.getObjectByName(name) as T.Mesh;
  const positions = mesh.geometry.getAttribute('position');
  const { radialSides, bandCount } = mesh.userData;
  return Array.from({ length: bandCount }, (_, row) => {
    const vertices = Array.from({ length: radialSides }, (_, column) =>
      new T.Vector3().fromBufferAttribute(positions, row * radialSides + column));
    const curve = new T.CatmullRomCurve3(vertices, true, 'catmullrom', 0.3);
    const points = Array.from({ length: sides }, (_, column) => curve.getPoint(column / sides));
    return { height: center(vertices).y, points };
  });
}

function sectionAt(profile: Section[], height: number): Ring {
  const index = profile.findIndex(section => section.height >= height);
  if (index <= 0) {
    const end = index === 0 ? profile[0] : profile.at(-1)!;
    return end.points.map(point => point.clone().add(new T.Vector3(0, height - end.height, 0)));
  }
  const lower = profile[index - 1];
  const upper = profile[index];
  const mix = (height - lower.height) / (upper.height - lower.height);
  return lower.points.map((point, column) => point.clone().lerp(upper.points[column], mix));
}

function softenSections(sections: Ring[]): Ring[] {
  const last = sections.length - 1;
  const columns = sections[0].map((_, column) =>
    new T.CatmullRomCurve3(sections.map(ring => ring[column]), false, 'catmullrom', .32));
  return sections.flatMap((ring, row) =>
    row === last ? [ring] : [ring, columns.map(curve => curve.getPoint((row + .5) / last))]);
}

function eased(point: T.Vector3, first: JointName, second: JointName, low: number, high: number): Weight {
  return [first, second, T.MathUtils.smoothstep(point.y, low, high)];
}

function expanded(points: Ring, clearance: number): Ring {
  const pivot = center(points);
  return points.map(point => {
    const direction = new T.Vector3(point.x - pivot.x, 0, point.z - pivot.z).normalize();
    return point.clone().addScaledVector(direction, clearance);
  });
}

function meshSurface(origin: T.Vector3, bindings: Bindings) {
  const points: Ring = [];
  const weights: Weight[] = [];
  const faces: number[][] = [[], [], [], []];

  function addPoint(point: T.Vector3, weight: Weight) {
    weights.push(weight);
    return points.push(point) - 1;
  }

  function ring(section: Ring, weight: Weights) {
    return section.map(point => addPoint(point, weight(point)));
  }

  function connect(a: number[], b: number[], material: number, opening?: (column: number) => boolean) {
    for (let column = 0; column < a.length; column++) {
      if (opening?.(column)) continue;
      const next = (column + 1) % a.length;
      faces[material].push(a[column], a[next], b[column], a[next], b[next], b[column]);
    }
  }

  function close(ring: number[], point: T.Vector3, weight: Weight, upwards: boolean) {
    const cap = addPoint(point, weight);
    for (let i = 0; i < ring.length; i++) {
      const next = (i + 1) % ring.length;
      faces[SKIN].push(cap, ring[upwards ? i : next], ring[upwards ? next : i]);
    }
  }

  function alignment(start: number[], target: Ring, reversed = false) {
    const ordered = reversed ? [...target].reverse() : target;
    let offset = 0;
    let best = Infinity;
    for (let i = 0; i < start.length; i++) {
      const distance = start.reduce((sum, vertex, j) =>
        sum + points[vertex].distanceToSquared(ordered[(i + j) % start.length]), 0);
      if (distance < best) {
        best = distance;
        offset = i;
      }
    }
    return (ring: Ring) => {
      const ordered = reversed ? [...ring].reverse() : ring;
      return start.map((_, column) => ordered[(offset + column) % start.length]);
    };
  }

  function geometry() {
    const positions: number[] = [];
    const skinIndices: number[] = [];
    const skinWeights: number[] = [];
    const vertices = new Map<number, number>();
    const indices: number[] = [];
    const mesh = new T.BufferGeometry();
    for (const [material, triangles] of faces.entries()) {
      const start = indices.length;
      for (const id of triangles) {
        if (!vertices.has(id)) {
          vertices.set(id, positions.length / 3);
          const point = points[id].clone().sub(origin);
          const [first, second, amount] = weights[id];
          positions.push(...point.toArray());
          skinIndices.push(bindings[first].index, bindings[second].index, 0, 0);
          skinWeights.push(1 - amount, amount, 0, 0);
        }
        indices.push(vertices.get(id)!);
      }
      if (indices.length > start) mesh.addGroup(start, indices.length - start, material);
    }
    mesh.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
    mesh.setAttribute('skinIndex', new T.Uint16BufferAttribute(skinIndices, 4));
    mesh.setAttribute('skinWeight', new T.Float32BufferAttribute(skinWeights, 4));
    mesh.setIndex(indices);
    mesh.computeVertexNormals();
    return mesh;
  }

  return { points, addPoint, ring, connect, close, alignment, geometry };
}

export function buildCharacterSurface(study: T.Group, origin: T.Vector3, bindings: Bindings) {
  const surface = meshSurface(origin, bindings);
  const profile = [...readSections(study, 'abdomen').slice(0, -1), ...readSections(study, 'ribcage')];
  const waist = 1.085;
  const torsoWeight: Weights = point => point.y < 1.165
    ? eased(point, 'pelvis', 'spine', 1.04, 1.17)
    : eased(point, 'spine', 'chest', 1.165, 1.38);
  const neckWeight: Weights = point => point.y < 1.565
    ? eased(point, 'chest', 'neck', 1.495, 1.565)
    : eased(point, 'neck', 'head', 1.565, 1.645);
  const sockets = [{ side: 'l', source: 'left', column: 6 }, { side: 'r', source: 'right', column: 18 }] as const;
  const armBottom = 6;
  const armTop = 9;
  const socketHalfWidth = 3;
  const neckline = Array.from({ length: SIDES }, (_, column) => {
    const angle = column / SIDES * 2 * Math.PI;
    const back = Math.max(0, -Math.cos(angle));
    const shoulder = Math.abs(Math.sin(angle));
    return T.MathUtils.lerp(1.388 + 0.052 * back, 1.505, T.MathUtils.smoothstep(shoulder, .28, .92));
  });
  const underarm = 1.336;
  const hems = [waist, 1.1, 1.145, 1.195, 1.24, 1.29, underarm]
    .map(height => sectionAt(profile, height));
  for (const fraction of [.29, .55, .76, 1]) {
    hems.push(neckline.map((height, column) =>
      sectionAt(profile, T.MathUtils.lerp(underarm, height, fraction))[column]));
  }
  for (const socket of sockets) {
    const start = socket.column - socketHalfWidth;
    const end = socket.column + socketHalfWidth;
    for (let column = start; column <= end; column++) {
      const corners = ((column - socket.column) / socketHalfWidth) ** 2;
      const top = T.MathUtils.lerp(underarm, neckline[column], .76);
      hems[armBottom][column] = sectionAt(profile, underarm + .021 * corners)[column];
      hems[armTop][column] = sectionAt(profile, top - .012 * corners)[column];
    }
    for (const row of [armBottom + 1, armTop - 1]) {
      hems[row][start].lerp(hems[row][start - 1], .30);
      hems[row][end].lerp(hems[row][end + 1], .30);
    }
  }
  const vest = hems.map((points, row) => surface.ring(expanded(points, row === 0 ? .008 : .0055), torsoWeight));
  for (let row = 0; row < vest.length - 1; row++) {
    surface.connect(vest[row], vest[row + 1], VEST, column =>
      row >= armBottom && row < armTop &&
      sockets.some(socket => column >= socket.column - socketHalfWidth && column < socket.column + socketHalfWidth));
  }

  // Real openings at the neck and shoulders. No second torso is drawn beneath the vest.
  const neckEdge = surface.ring(hems.at(-1)!, torsoWeight);
  surface.connect(vest.at(-1)!, neckEdge, BINDING);
  const neck = readSections(study, 'neck');
  let upper = neckEdge;
  const neckBase = neck[0].points;
  const neckJoin = sectionAt(neck, 1.555);
  for (const section of [neckBase, neckJoin]) {
    const next = surface.ring(section, neckWeight);
    surface.connect(upper, next, SKIN);
    upper = next;
  }

  const head = readSections(study, 'head').map(section => section.points);
  const occiput = [.071, .060, .045, .027];
  const headSections = head.slice(1).map((section, row) => section.map((point, column) => {
    const facing = Math.cos(column / SIDES * 2 * Math.PI);
    const next = point.clone();
    next.x *= 1.11;
    next.z -= occiput[row] * Math.max(0, -facing);
    next.z += [0, -.007, -.006, .013][row] * Math.max(0, facing);
    return next;
  }));
  const jaw = head[0].map((point, column) => {
    const facing = Math.cos(column / SIDES * 2 * Math.PI);
    const chin = point.clone().setX(point.x * 1.18);
    const side = 1 - Math.max(0, facing) ** 1.6;
    const next = chin.lerp(headSections[0][column], .61 * side);
    const nape = neckJoin[column].clone().lerp(headSections[0][column], .55);
    return next.lerp(nape, Math.max(0, -facing));
  });
  const scalp = headSections.at(-1)!;
  const crownCenter = center(scalp);
  const crown = [.82, .55, .26].map((radius, row) => scalp.map(point => {
    const next = crownCenter.clone().lerp(point, radius);
    next.y = crownCenter.y + [.013, .024, .032][row];
    return next;
  }));
  for (const points of softenSections([neckJoin, jaw, ...headSections, ...crown]).slice(1)) {
    const next = surface.ring(points, neckWeight);
    surface.connect(upper, next, SKIN);
    upper = next;
  }
  const crownTip = crownCenter.clone().setY(crownCenter.y + .035);
  surface.close(upper, crownTip, ['head', 'head', 0], true);

  for (const { side, source, column } of sockets) {
    const start = column - socketHalfWidth;
    const end = column + socketHalfWidth;
    const opening: number[] = [];
    for (let i = start; i <= end; i++) opening.push(vest[armBottom][i]);
    for (let row = armBottom + 1; row <= armTop; row++) opening.push(vest[row][end]);
    for (let i = end - 1; i >= start; i--) opening.push(vest[armTop][i]);
    for (let row = armTop - 1; row > armBottom; row--) opening.push(vest[row][start]);

    const upperArm = `${side}UpperArm` as const;
    const forearm = `${side}ForeArm` as const;
    const hand = `${side}Hand` as const;
    const elbowY = bindings[forearm].position.y;
    const wristY = bindings[hand].position.y;
    const sections = ['deltoid', 'upper-arm', 'forearm', 'hand'].map(part =>
      readSections(study, source + '-' + part, opening.length));
    const [deltoid, bicep, fore, palm] = sections;
    const bicepTop = 1.312;
    const align = surface.alignment(opening, sectionAt(bicep, bicepTop), true);
    const topRing = align(sectionAt(bicep, bicepTop));
    const deltoidRing = align(sectionAt(deltoid, 1.395));
    const seam = opening.map(vertex => {
      const point = surface.points[vertex];
      const theta = Math.atan2(point.x, point.z - .025);
      return point.clone().add(new T.Vector3(-.004 * Math.sin(theta), 0, -.004 * Math.cos(theta)));
    });
    let last = surface.ring(seam, torsoWeight);
    surface.connect(opening, last, BINDING);
    const shoulder = topRing.map((point, i) => {
      const near = seam[i].clone().lerp(point, .55);
      near.x = T.MathUtils.lerp(near.x, deltoidRing[i].x, .38);
      near.z = T.MathUtils.lerp(near.z, deltoidRing[i].z, .28);
      near.y += .013 * T.MathUtils.smoothstep(seam[i].y, 1.395, 1.46);
      return near;
    });
    const shoulderRing = surface.ring(shoulder, () => ['chest', upperArm, .56]);
    surface.connect(last, shoulderRing, SKIN);
    last = shoulderRing;

    const armWeight: Weights = point => point.y > (elbowY + wristY) / 2
      ? eased(point, forearm, upperArm, elbowY - .062, elbowY + .06)
      : eased(point, hand, forearm, wristY - .034, wristY + .042);
    const armSections = [
      topRing,
      ...bicep.filter(section => section.height < bicepTop - .006 && section.height > elbowY + .047).reverse().map(section => align(section.points)),
      align(sectionAt(bicep, elbowY + .043)),
      align(sectionAt(fore, elbowY)),
      align(sectionAt(fore, elbowY - .055)),
      ...fore.filter(section => section.height < elbowY - .065 && section.height > wristY + .052).reverse().map(section => align(section.points)),
      align(sectionAt(fore, wristY + .032)),
      align(sectionAt(palm, wristY)),
      ...palm.slice(0, -1).reverse().map(section => align(section.points)),
    ];
    for (const points of armSections) {
      const next = surface.ring(points, armWeight);
      surface.connect(last, next, SKIN);
      last = next;
    }
    const palmTip = center(armSections.at(-1)!);
    surface.close(last, palmTip, [hand, hand, 0], true);
  }

  // Split the hip hem at the crotch. Each leg tube shares the outer hip ring
  // and the same interior crotch edge, so the shorts bend as a single surface.
  const hips = readSections(study, 'pelvis');
  const hipWeight: Weights = point => {
    const joint = point.x > 0 ? 'lThigh' : 'rThigh';
    const spread = T.MathUtils.smoothstep(Math.abs(point.x), .012, .115);
    return ['pelvis', joint, .45 * spread * (1 - T.MathUtils.smoothstep(point.y, .94, 1.045))];
  };
  const forkPoints = expanded(hips[0].points, .008);
  const seat = hips[1].points.map((point, column) => {
    const rear = Math.max(0, -Math.cos(column / SIDES * 2 * Math.PI));
    const next = point.clone();
    next.z = T.MathUtils.lerp(next.z, (hips[0].points[column].z + hips[2].points[column].z) / 2, .40 * rear);
    return next;
  });
  const fork = surface.ring(forkPoints, hipWeight);
  let hipRing = fork;
  const hipSections = [forkPoints, ...[seat, hips[2].points, sectionAt(profile, waist - .017)]
    .map(points => expanded(points, .008))];
  for (const points of softenSections(hipSections).slice(1)) {
    const next = surface.ring(points, hipWeight);
    surface.connect(hipRing, next, SHORTS);
    hipRing = next;
  }
  surface.connect(hipRing, vest[0], SHORTS);
  const half = SIDES / 2;
  const crotch = Array.from({ length: half - 1 }, (_, i) => {
    const t = (i + 1) / half;
    const point = forkPoints[half].clone().lerp(forkPoints[0], t);
    point.x = 0;
    point.y -= .023 * Math.sin(t * Math.PI);
    return surface.addPoint(point, ['pelvis', 'pelvis', 0]);
  });

  for (const { side, source } of sockets) {
    const join = side === 'l'
      ? [...fork.slice(0, half + 1), ...crotch]
      : [...fork.slice(half), fork[0], ...[...crotch].reverse()];
    const thigh = `${side}Thigh` as const;
    const shin = `${side}Shin` as const;
    const foot = `${side}Foot` as const;
    const kneeY = bindings[shin].position.y;
    const ankleY = bindings[foot].position.y;
    const [upper, lower, sole] = ['thigh', 'shin', 'foot'].map(part => readSections(study, source + '-' + part));
    const legWeight: Weights = point => point.y > (kneeY + ankleY) / 2
      ? eased(point, shin, thigh, kneeY - .071, kneeY + .075)
      : eased(point, foot, shin, ankleY - .038, ankleY + .062);
    const cuffY = .716;
    const legTop = .821;
    const align = surface.alignment(join, sectionAt(upper, legTop));
    let last = join;
    for (const height of [legTop, .764, cuffY + .014, cuffY]) {
      const points = align(expanded(sectionAt(upper, height), .009));
      const next = surface.ring(points, point => eased(point, thigh, 'pelvis', .795, .936));
      surface.connect(next, last, height === cuffY ? BINDING : SHORTS);
      last = next;
    }
    const cuff = surface.ring(align(sectionAt(upper, cuffY - .002)), legWeight);
    surface.connect(cuff, last, BINDING);
    last = cuff;
    const legSections = [
      ...upper.filter(section => section.height < cuffY - .015 && section.height > kneeY + .057).reverse().map(section => section.points),
      sectionAt(upper, kneeY + .047),
      sectionAt(upper, kneeY),
      sectionAt(lower, kneeY - .053),
      ...lower.filter(section => section.height < kneeY - .062 && section.height > ankleY + .071).reverse().map(section => section.points),
      sectionAt(lower, ankleY + .053),
      sectionAt(sole, ankleY),
      ...sole.slice(0, -1).reverse().map(section => section.points),
    ];
    for (const points of softenSections([sectionAt(upper, cuffY - .002), ...legSections]).slice(1)) {
      const next = surface.ring(align(points), legWeight);
      surface.connect(next, last, SKIN);
      last = next;
    }
    surface.close(last, center(legSections.at(-1)!), [foot, foot, 0], false);
  }

  return surface.geometry();
}
