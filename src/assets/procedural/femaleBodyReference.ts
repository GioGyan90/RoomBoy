import type { JointName, StudyCrop, StudyJoints, StudyView } from './bodyReference';

// The three orthographic targets share a floor and crown. The sheet's near
// foot sets the profile floor; the farther foot is raised by perspective.
const height = 1.8;
export const femaleSheet = { width: 604, height: 512 };

function crop(axis: number, ground: number, crown: number, left: number, right: number): StudyCrop {
  return { axis, ground, scale: height / (ground - crown), left, top: 12, width: right - left, height: 498 };
}

export const femaleStudyCrops = {
  front: crop(243.5, 499, 20, 151, 334),
  side: crop(396, 506, 18, 339, 433),
  back: crop(514.5, 499, 18, 435, 597),
  quarter: crop(78, 492, 18, 4, 146),
} satisfies Record<StudyView | 'quarter', StudyCrop>;

export const femaleStudyJoints: StudyJoints = {
  crown: { front: [243.5, 20], side: [394, 18], back: [514.5, 18] },
  chin: { front: [243.5, 71], side: [375, 75] },
  neck: { front: [243.5, 94], side: [404, 92], back: [514.5, 87] },
  rightShoulder: { front: [205, 112], side: [406, 112], back: [554, 112] },
  leftShoulder: { front: [282, 112], side: [406, 112], back: [475, 112] },
  rightElbow: { front: [192, 180], side: [393, 182], back: [567, 180] },
  leftElbow: { front: [295, 180], side: [393, 182], back: [462, 180] },
  rightWrist: { front: [167, 249], side: [357, 249], back: [583, 249] },
  leftWrist: { front: [320, 249], side: [357, 249], back: [446, 249] },
  rightHip: { front: [217, 259], side: [395, 265], back: [540, 259] },
  leftHip: { front: [270, 259], side: [395, 265], back: [489, 259] },
  rightKnee: { front: [210, 367], side: [398, 365], back: [548, 361] },
  leftKnee: { front: [277, 367], side: [398, 365], back: [481, 361] },
  rightAnkle: { front: [210, 460], side: [414, 464], back: [552, 463] },
  leftAnkle: { front: [277, 460], side: [414, 464], back: [477, 463] },
};

// X is relative to the front midline, Y is in normalized front pixels, and
// the last two values are anterior/posterior pixel coordinates in the side view.
// The optional exponents adjust the breadth of the corresponding depth planes.
export type FemaleBand = readonly [
  y: number, left: number, right: number, anterior: number, posterior: number,
  frontArc?: number, backArc?: number,
];
const { front, side, back } = femaleStudyCrops;
export const femaleY = (y: number) => (front.ground - y) * front.scale;

function center(y: number, width: number, anterior: number, posterior: number, frontArc = 1, backArc = 1): FemaleBand {
  return [y, -width, width, anterior, posterior, frontArc, backArc];
}

type LeftJoint = Extract<JointName, `left${string}`>;
function collar(name: LeftJoint, halfWidth: number, halfDepth: number): FemaleBand {
  const measured = femaleStudyJoints[name];
  const [fx, fy] = measured.front!;
  const [sx, sy] = measured.side!;
  const [bx, by] = measured.back!;
  const x = ((fx - front.axis) + (back.axis - bx) * back.scale / front.scale) / 2;
  const y = front.ground - (femaleY(fy) + (side.ground - sy) * side.scale + (back.ground - by) * back.scale) / (3 * front.scale);
  return [y, x - halfWidth, x + halfWidth, sx - halfDepth, sx + halfDepth];
}

const neckBase = center(91.5, 15, 387, 420);
const ribBase = center(150, 27, 364, 414, .84);
const waist = center(195, 26, 362, 409, .88);
const shoulder = collar('leftShoulder', 11, 10.5);
const shoulderHem: FemaleBand = [132, 33, 50, 387, 411];
const elbow = collar('leftElbow', 9.2, 10.5);
const wrist = collar('leftWrist', 4.7, 6.1);
const hip = collar('leftHip', 20.8, 25.3);
const knee = collar('leftKnee', 9.8, 15);
const ankle = collar('leftAnkle', 6.3, 11.4);

// All rows run from the ground upwards. Neighbouring parts use the same
// station at their joint, and both sides are generated from these same rows.
export const femaleBodyBands = {
  head: [
    center(73, 10.6, 374.5, 405.5, .55),
    center(65, 13.6, 370, 409, .54),
    center(48, 18.5, 367.5, 415.5, .40),
    center(36, 17.2, 369.5, 416.2, .38),
    center(26, 15.4, 373, 412, .50),
    center(22, 12.5, 378, 407.5, .65),
    center(20, 7.4, 386, 402),
  ],
  neck: [
    neckBase,
    center(84, 12, 387, 415),
    center(77, 11.1, 382.5, 411.5),
    center(67.5, 10.6, 381, 409),
  ],
  ribcage: [
    ribBase,
    center(143, 28.0, 364.5, 419, .73),
    center(134, 29.2, 361, 423, .58),
    center(125, 30.0, 358, 425, .52),
    center(117, 32.4, 370, 426, .65),
    center(110, 37, 378.5, 426, .78, 1.2),
    center(104, 36.8, 382.5, 425, .86, 1.25),
    center(99, 31.8, 385, 423, .9, 1.2),
    neckBase,
  ],
  abdomen: [
    waist,
    center(185, 24.8, 361, 406.5, .88),
    center(173, 24.7, 360, 409, .85),
    center(162, 25.5, 361.5, 411, .85),
    ribBase,
  ],
  pelvis: [
    center(245, 46.4, 368, 421.5, .77, .66),
    center(236, 45.2, 367, 424.5, .82, .65),
    center(220, 42, 365, 423.5, .88, .73),
    center(207, 36.5, 363.5, 420, .89, .82),
    waist,
  ],
  deltoid: [
    shoulderHem,
    [124, 29.5, 50.8, 387.5, 416, .88, .76],
    shoulder,
    [104, 28.6, 45, 397, 416, .9, .78],
    [99, 28, 37, 400, 414],
  ],
  'upper-arm': [
    elbow,
    [168, 39.6, 58.4, 386, 407.5],
    [149, 36.8, 54.2, 388, 411],
    shoulderHem,
  ],
  forearm: [
    wrist,
    [234, 65.4, 78, 356, 372.5],
    [220, 59, 75.2, 363.5, 382],
    [201, 49.5, 70.5, 372.5, 396.5],
    elbow,
  ],
  hand: [
    [272.5, 72, 83, 342.5, 367, .47, .55],
    [268.5, 70.6, 85, 343.7, 367, .47, .55],
    [255, 71, 83.8, 347, 365, .57, .62],
    wrist,
  ],
  thigh: [
    knee,
    [343, 22.1, 43, 374.5, 412],
    [321, 13.8, 45.2, 370, 415.2],
    [294, 9.4, 47, 367.5, 418.5],
    [276, 7.2, 47.6, 368.5, 419.3],
    hip,
  ],
  shin: [
    ankle,
    [436, 27.6, 43.5, 398, 422.5],
    [403, 25.5, 51, 393, 425.6],
    [387, 25.4, 47.8, 386, 421.2],
    knee,
  ],
  foot: [
    [499, 28.5, 43, 362, 425.2, .60, .61],
    [496, 26.1, 48.6, 359, 428, .56, .60],
    [489, 26.1, 48.5, 363, 428, .63, .64],
    [480, 28, 47.9, 386, 426, .74, .71],
    [470, 29, 44, 401, 424],
    ankle,
  ],
} as const satisfies Record<string, readonly FemaleBand[]>;

export const femaleBodyPlan = {
  height,
  chin: femaleY(femaleBodyBands.head[0][0]),
  shoulder: femaleY(shoulder[0]),
  waist: femaleY(waist[0]),
  crotch: femaleY(257),
  knee: femaleY(knee[0]),
  ankle: femaleY(ankle[0]),
};
