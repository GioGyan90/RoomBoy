import * as THREE from 'three';
import { createBodyBlockout } from './bodyBlockout';
import type { MeshLandmarks } from './bodyConstraints';
import { buildCharacterSurface, type Bindings, type JointName } from './characterSurface';

export function createCharacter(scene: THREE.Scene) {
  const charRoot = new THREE.Group();
  charRoot.name = 'haru';
  const body = new THREE.Group();
  charRoot.add(body);

  const study = createBodyBlockout('planes');
  const landmarks = study.userData.landmarks as MeshLandmarks;
  const lHip = new THREE.Vector3(...landmarks.leftHip);
  const rHip = new THREE.Vector3(...landmarks.rightHip);
  const origin = lHip.clone().lerp(rHip, .5);
  origin.x = 0;
  const hipHeight = origin.y;

  const J: Record<string, THREE.Bone> = {};
  const bindings = {} as Bindings;
  const bones: THREE.Bone[] = [];

  function joint(name: JointName, parent: JointName | null, position: THREE.Vector3) {
    const bone = new THREE.Bone();
    bone.name = name;
    bone.position.copy(position).sub(parent ? bindings[parent].position : origin);
    (parent ? J[parent] : body).add(bone);
    J[name] = bone;
    bindings[name] = { index: bones.length, position };
    bones.push(bone);
  }

  joint('pelvis', null, origin);
  joint('spine', 'pelvis', new THREE.Vector3(0, 1.10, .038));
  joint('chest', 'spine', new THREE.Vector3(0, 1.286, .038));
  joint('neck', 'chest', new THREE.Vector3(...landmarks.neck));
  joint('head', 'neck', new THREE.Vector3(0, 1.58, .048));
  for (const [side, source] of [['l', 'left'], ['r', 'right']] as const) {
    const shoulder = new THREE.Vector3(...landmarks[`${source}Shoulder`]);
    joint(`${side}Shoulder`, 'chest', shoulder);
    joint(`${side}UpperArm`, `${side}Shoulder`, shoulder);
    joint(`${side}ForeArm`, `${side}UpperArm`, new THREE.Vector3(...landmarks[`${source}Elbow`]));
    joint(`${side}Hand`, `${side}ForeArm`, new THREE.Vector3(...landmarks[`${source}Wrist`]));
    joint(`${side}Thigh`, 'pelvis', new THREE.Vector3(...landmarks[`${source}Hip`]));
    joint(`${side}Shin`, `${side}Thigh`, new THREE.Vector3(...landmarks[`${source}Knee`]));
    joint(`${side}Foot`, `${side}Shin`, new THREE.Vector3(...landmarks[`${source}Ankle`]));
  }

  const geometry = buildCharacterSurface(study, origin, bindings);
  study.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
  });

  const ramp = new THREE.DataTexture(new Uint8Array([90, 148, 200, 232, 255]), 5, 1, THREE.RedFormat);
  ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
  ramp.needsUpdate = true;
  const material = (name: string, color: number) =>
    new THREE.MeshToonMaterial({ name, color, gradientMap: ramp });
  const skin = new THREE.SkinnedMesh(geometry, [
    material('Skin', 0xd9af91),
    material('Tank top', 0x384250),
    material('Shorts', 0x647589),
    material('Fabric binding', 0x394552),
  ]);
  skin.name = 'haru-structure-surface';
  skin.castShadow = skin.receiveShadow = true;
  // The moving limbs must stay pickable outside the bind-pose bounds.
  skin.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.4);
  body.add(skin);
  charRoot.updateMatrixWorld(true);
  skin.bind(new THREE.Skeleton(bones));
  body.position.y = hipHeight;

  const plumbob = new THREE.Mesh(
    new THREE.OctahedronGeometry(.062),
    new THREE.MeshStandardMaterial({
      color: 0x4ff08a, emissive: 0x22a74e, emissiveIntensity: 1.4,
      transparent: true, opacity: .9, roughness: .25,
    }),
  );
  const plumbobLight = new THREE.PointLight(0x54ff9a, .08, 1.4, 2);
  scene.add(plumbob, plumbobLight);

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.font = 'bold 96px sans-serif';
  context.fillStyle = '#fff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('Z', 64, 68);
  const sleepTexture = new THREE.CanvasTexture(canvas);
  sleepTexture.colorSpace = THREE.SRGBColorSpace;
  const zzz = Array.from({ length: 3 }, () => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sleepTexture, transparent: true, opacity: 0, depthWrite: false,
    }));
    sprite.scale.setScalar(.14);
    scene.add(sprite);
    return sprite;
  });

  return { charRoot, body, J, hipHeight, charMeshes: [skin], plumbob, plumbobLight, zzz };
}

export type Character = ReturnType<typeof createCharacter>;
