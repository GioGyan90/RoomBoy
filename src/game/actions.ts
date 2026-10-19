import * as THREE from 'three';
import {angleLerp,damp} from '../core/math';
import {element} from '../ui/dom';
import type {Character} from '../assets/procedural/character';
import type {Animation} from './animation';
import type {Step,Posture,Action} from './types';
export function createActions(scene:THREE.Scene,character:Character,animation:Animation){
const {charRoot}=character;const {st,HIP}=animation;
/* =========================================================
   8 · action runner
   ========================================================= */
const runner = { steps:[] as Step[], i:-1, t:0 };
const statusEl = element('status');
function setStatus(txt:string){ statusEl.innerHTML = txt; }

const V = (x:number,z:number)=>new THREE.Vector3(x,0,z);

const DESK_STAND = { x:1.52, z:-0.80, rot:0 };
const BED_STAND  = { x:-1.05, z:-0.95, rot:0 };

function postureStandSpot(){
  if (st.posture === 'sitDesk') return DESK_STAND;
  if (st.posture === 'sitBed' || st.posture === 'lieBed') return BED_STAND;
  return null;
}
function standStep():Step|null{
  const s = postureStandSpot();
  if (!s) return null;
  return { type:'pose', posture:'stand', pos:V(s.x, s.z), rot:s.rot, bodyY:HIP, rotX:0, duration:0.85 };
}
function withStand(steps:Step[], targetPosture?:Posture){
  if (st.posture === targetPosture) return steps;
  const s = standStep();
  return s ? [s, ...steps] : steps;
}

function beginStep(){
  const s = runner.steps[runner.i];
  if (!s){ finishSteps(); return; }
  runner.t = 0;
  if (s.type === 'walk'){
    st.mode = 'walk';
  } else {
    st.mode = 'pose';
    st.posture = s.posture;
    st.poseTime = 0;
    st.bodyYTarget = s.bodyY ?? HIP;
    st.bodyRotXTarget = s.rotX ?? 0;
    st.posTarget.copy(s.pos);
    st.rotTarget = s.rot ?? 0;
    if (!s.hold && s.duration == null) s.duration = 0.9;
  }
}
function nextStep(){
  runner.i++;
  if (runner.i >= runner.steps.length){ finishSteps(); return; }
  beginStep();
}
function startSteps(steps:Step[]){
  runner.steps = steps; runner.i = 0; runner.t = 0;
  beginStep();
}
function finishSteps(){
  runner.steps = []; runner.i = -1;
  st.mode = 'idle';
  st.posture = 'stand';
  st.napping = false;
  st.bodyYTarget = HIP;
  st.bodyRotXTarget = 0;
  setStatus('Idle');
}

function updateRunner(dt:number){
  if (runner.i < 0) return;
  const s = runner.steps[runner.i];
  if (!s) return;
  runner.t += dt;

  if (s.type === 'walk'){
    const p = charRoot.position;
    const dx = s.pos.x - p.x, dz = s.pos.z - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.045){
      const spd = 1.15;
      const stepLen = Math.min(dist, spd*dt);
      p.x += dx/dist*stepLen;
      p.z += dz/dist*stepLen;
      const want = Math.atan2(dx, dz);
      charRoot.rotation.y = angleLerp(charRoot.rotation.y, want, 1-Math.exp(-10*dt));
      st.walkPhase += dt*7.4;
      st.mode = 'walk';
    } else {
      nextStep();
    }
  } else {
    st.poseTime += dt;
    charRoot.position.x = damp(charRoot.position.x, s.pos.x, 5.0, dt);
    charRoot.position.z = damp(charRoot.position.z, s.pos.z, 5.0, dt);
    charRoot.rotation.y = angleLerp(charRoot.rotation.y, s.rot ?? 0, 1-Math.exp(-6*dt));
    if (!s.hold && s.duration != null && runner.t >= s.duration) nextStep();
  }
}

/* ---------------- actions ---------------- */
const ACTIONS:Action[] = [
  { id:'computer', icon:'💻', label:'Use Computer',
    steps: () => withStand([
      { type:'walk', pos:V(1.52,-0.80) },
      { type:'pose', posture:'sitDesk', pos:V(1.52,-1.13), rot:Math.PI, bodyY:0.47, rotX:0, duration:1.0 },
      { type:'pose', posture:'sitDesk', pos:V(1.52,-1.13), rot:Math.PI, bodyY:0.47, rotX:0, hold:true },
    ], 'sitDesk'),
    status:'Surfing the web 💻' },

  { id:'lie', icon:'🛏️', label:'Lie on Bed',
    steps: () => withStand([
      { type:'walk', pos:V(-1.05,-0.95) },
      { type:'pose', posture:'lieBed', pos:V(-1.72,-0.95), rot:0, bodyY:0.72, rotX:-Math.PI/2, hold:true },
    ], 'lieBed'),
    status:'Lying on the bed' },

  { id:'nap', icon:'😴', label:'Take a Nap', nap:true,
    steps: () => withStand([
      { type:'walk', pos:V(-1.05,-0.95) },
      { type:'pose', posture:'lieBed', pos:V(-1.72,-0.95), rot:0, bodyY:0.72, rotX:-Math.PI/2, hold:true },
    ], 'lieBed'),
    status:'Napping 😴' },

  { id:'sitBed', icon:'🪑', label:'Sit on Bed',
    steps: () => withStand([
      { type:'walk', pos:V(-1.02,-0.95) },
      { type:'pose', posture:'sitBed', pos:V(-1.29,-0.95), rot:Math.PI/2, bodyY:0.60, rotX:0, hold:true },
    ], 'sitBed'),
    status:'Sitting on the bed' },

  { id:'stretch', icon:'🙆', label:'Stretch',
    steps: () => withStand([
      { type:'pose', posture:'stretch', pos:charRoot.position.clone(), rot:charRoot.rotation.y, bodyY:HIP, rotX:0, duration:2.6 },
    ]),
    status:'Stretching 🙆' },

  { id:'stand', icon:'🧍', label:'Stand Here',
    steps: () => withStand([
      { type:'pose', posture:'stand', pos:charRoot.position.clone(), rot:charRoot.rotation.y, bodyY:HIP, rotX:0, duration:0.6 },
    ]),
    status:'Standing around' },
];

function runAction(action:Action){
  startSteps(action.steps());
  st.napping = !!action.nap;
  setStatus(action.status);
}

/* ---------------- ground walk command ---------------- */
const marker = new THREE.Mesh(
  new THREE.RingGeometry(0.16, 0.22, 36),
  new THREE.MeshBasicMaterial({ color:0x8fd3ff, transparent:true, opacity:0, side:THREE.DoubleSide, depthWrite:false })
);
marker.rotation.x = -Math.PI/2;
marker.position.y = 0.015;
scene.add(marker);
let markerLife = 0;

function walkTo(p:THREE.Vector3){
  const steps:Step[] = [];
  const s = standStep();
  if (s) steps.push(s);
  steps.push({ type:'walk', pos:p.clone() });
  startSteps(steps);
  st.napping = false;
  setStatus('Walking');
  marker.position.set(p.x, 0.015, p.z);
  markerLife = 1;
}


function updateMarker(dt:number){
 if(markerLife>0){markerLife=Math.max(0,markerLife-dt*1.4);marker.material.opacity=markerLife*.85;marker.scale.setScalar(1+(1-markerLife)*1.2);}
}
return {ACTIONS,runAction,walkTo,updateRunner,updateMarker,setStatus};
}
export type Actions=ReturnType<typeof createActions>;
