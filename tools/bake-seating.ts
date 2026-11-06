import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as THREE from 'three';
import { createCharacter } from '../src/assets/procedural/character';
import { GAME_LAYOUT } from '../src/assets/procedural/roomV4/definitions';

// Run with the Prompt2Rig vendor loader so the tool uses its own Three.js build.
const labPath = process.argv[2];
if (!labPath) throw new Error('Pass the path to 3D_AItool/experiments/prompt2rig');
const load = (path: string) => import(pathToFileURL(resolve(labPath, 'public', path)).href);
const [{ Rig }, { createCharacter: createDriver }, { prepareRig }, { planToTake, retargetTake }] =
  await Promise.all([load('retarget.js'), load('lab/character.js'), load('lab/rig-adapter.js'), load('lab/motion-plan.js')]);

const canvas = { getContext: () => ({ fillText() {} }) };
Object.assign(globalThis, { document: { createElement: () => ({ ...canvas }) } });
const { charRoot, body, J, hipHeight, charMeshes } = createCharacter(new THREE.Scene());
const mapping: Record<string, string> = { Hips: 'pelvis', Spine: 'spine', Spine1: '', Spine2: 'chest', Neck: 'neck', Head: 'head' };
for (const [side, short, sign] of [['Left', 'l', 1], ['Right', 'r', -1]] as const) {
  for (const [canonical, game] of [
    ['Shoulder', 'Shoulder'], ['Arm', 'UpperArm'], ['ForeArm', 'ForeArm'],
    ['Hand', 'Hand'], ['UpLeg', 'Thigh'], ['Leg', 'Shin'], ['Foot', 'Foot'],
  ]) mapping[side + canonical] = short + game;

  // A temporary palm-direction marker lets the tool retarget the hand's roll.
  // It has no skin weights and is excluded from the shipped tracks.
  const marker = new THREE.Bone();
  marker.name = 'mixamorig' + side + 'HandMiddle1';
  marker.position.set(-sign * .026, -.143, .041);
  J[short + 'Hand'].add(marker);
}
const { rig: target, missing } = prepareRig(charRoot, mapping);
if (!target) throw new Error('Haru skeleton mapping is incomplete: ' + missing.join(', '));
const driver = new Rig(createDriver());

function round(value: number) {
  return Number(value.toFixed(6));
}

function bake(id: 'chair' | 'bed') {
  const plan = JSON.parse(readFileSync(new URL('../assets/source/motions/sit-' + id + '.json', import.meta.url), 'utf8'));
  const take = planToTake(driver, plan);
  const clip: THREE.AnimationClip = retargetTake(driver, target, take);
  const hip = clip.tracks.find(track => track.name === 'pelvis.position');
  if (!hip) throw new Error('Missing root translation');
  const times = Array.from(hip.times, round);
  const axis = id === 'chair' ? 0 : 2;
  const end = (times.length - 1) * 3;
  const ratio = (start: number, finish: number, value: number) => {
    if (Math.abs(finish - start) < 1e-5) throw new Error('Degenerate seating translation');
    return round(THREE.MathUtils.clamp((value - start) / (finish - start), 0, 1));
  };
  const root = times.flatMap((_, i) => [
    ratio(hip.values[axis], hip.values[end + axis], hip.values[i * 3 + axis]),
    ratio(hip.values[1], hip.values[end + 1], hip.values[i * 3 + 1]),
    0,
  ]);
  const joints: Record<string, number[]> = {};
  for (const track of clip.tracks) {
    const name = track.name.replace(/\.quaternion$/, '');
    if (!J[name]) continue;
    joints[name] = Array.from(track.values, round);
  }
  if (Object.keys(joints).length !== Object.keys(J).length) throw new Error('Not every game joint was baked');
  // Check the actual Haru mesh after retargeting, not the source rig's ankle centres.
  const height = id === 'chair' ? GAME_LAYOUT.desk.sit.bodyY : GAME_LAYOUT.bed.sit.bodyY;
  const bounds = new THREE.Box3();
  for (let i = 1; i < times.length - 1; i++) {
    for (const [name, values] of Object.entries(joints)) {
      J[name].quaternion.fromArray(values, i * 4).normalize();
    }
    const intended = THREE.MathUtils.lerp(hipHeight, height, root[i * 3 + 1]);
    body.position.y = intended;
    charRoot.updateMatrixWorld(true);
    bounds.setFromObject(charMeshes[0], true);
    const grounded = intended + Math.max(0, .012 - bounds.min.y);
    root[i * 3 + 1] = ratio(hipHeight, height, grounded);
  }
  body.position.y = hipHeight;
  target.reset();
  console.log(id, times.length, 'frames', Object.keys(joints).length, 'joints', 'hips drop', round(hip.values[end + 1] - hip.values[1]));
  return { duration: round(clip.duration), times, root, joints };
}

const motions = { chair: bake('chair'), bed: bake('bed') };
writeFileSync(new URL('../src/assets/generated/seating.json', import.meta.url),
  '{\n' + Object.entries(motions).map(([id, data]) => '  "' + id + '": {\n' +
    '    "duration": ' + data.duration + ',\n' +
    '    "times": ' + JSON.stringify(data.times) + ',\n' +
    '    "root": ' + JSON.stringify(data.root) + ',\n' +
    '    "joints": {\n' + Object.entries(data.joints).map(([name, values]) =>
      '      "' + name + '": ' + JSON.stringify(values)).join(',\n') + '\n    }\n  }').join(',\n') + '\n}\n');
