import * as THREE from 'three';
import {damp} from '../core/math';
import type {Character} from '../assets/procedural/character';
import type {Posture} from './types';
import {standPose,walkPose,sitDeskPose,sitBedPose,liePose,stretchPose,type Pose} from './poses';
export function createAnimation(character:Character){
const {body,J,plumbob,plumbobLight,zzz}=character;
/* =========================================================
   7 · state, poses, animation
   ========================================================= */
const HIP = 0.95;               // hip height standing
const st = {
  mode:'idle' as 'idle'|'walk'|'pose',                  // idle | walk | pose
  posture:'stand' as Posture,              // stand | sitDesk | sitBed | lieBed | stretch
  poseTime:0,
  walkPhase:0,
  bodyYTarget:HIP,
  bodyRotXTarget:0,
  posTarget:new THREE.Vector3(0,0,0),
  rotTarget:0,
  napping:false,
};

const JOINTS = ['pelvis','spine','chest','neck','head',
  'lUpperArm','lForeArm','lHand','rUpperArm','rForeArm','rHand',
  'lThigh','lShin','lFoot','rThigh','rShin','rFoot'];

function currentPose(t:number):Pose{
  if (st.mode === 'walk') return walkPose(st.walkPhase);
  switch(st.posture){
    case 'sitDesk':  return sitDeskPose(t);
    case 'sitBed':   return sitBedPose(t);
    case 'lieBed':   return liePose(t);
    case 'stretch':  return stretchPose(st.poseTime);
    default:         return standPose(t);
  }
}

const ZERO = [0,0,0];


function updateAnimation(dt:number, t:number){
  const pose = currentPose(t);
  const k = st.mode === 'walk' ? 22 : (st.posture === 'stretch' ? 9 : 8);
  for (const name of JOINTS){
    const j = J[name];
    if (!j) continue;
    const tg = pose[name] || ZERO;
    j.rotation.x = damp(j.rotation.x, tg[0], k, dt);
    j.rotation.y = damp(j.rotation.y, tg[1], k, dt);
    j.rotation.z = damp(j.rotation.z, tg[2], k, dt);
  }
  const bob = st.mode === 'walk' ? -0.018 + 0.018*Math.cos(st.walkPhase*2) : 0;
  body.position.y = damp(body.position.y, st.bodyYTarget + bob, 10, dt);
  body.rotation.x = damp(body.rotation.x, st.bodyRotXTarget, 7, dt);

  // plumbob follows the head
  const hp = new THREE.Vector3();
  J.head.getWorldPosition(hp);
  plumbob.position.set(hp.x, hp.y + 0.34 + Math.sin(t*2.2)*0.02, hp.z);
  plumbob.rotation.y += dt*1.7;
  plumbobLight.position.copy(plumbob.position);
  plumbobLight.intensity = 0.45 + Math.sin(t*3)*0.12;

  // Zzz
  const sleep = st.napping && st.posture === 'lieBed';
  zzz.forEach((sp,i)=>{
    if (!sleep){ sp.material.opacity = 0; return; }
    const ph = ((t*0.45) + i*0.33) % 1;
    sp.position.set(hp.x + 0.16 + Math.sin(ph*6.0 + i*2)*0.08,
                    hp.y + 0.10 + ph*0.55,
                    hp.z + 0.18);
    sp.material.opacity = Math.sin(ph*Math.PI) * 0.95;
    sp.scale.setScalar(0.11 + ph*0.12);
  });
}


return {st,HIP,updateAnimation};
}
export type Animation = ReturnType<typeof createAnimation>;
