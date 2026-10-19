import * as THREE from 'three';
import {clamp} from '../core/math';
import {HW,HD} from '../assets/layout';
import type {Character} from '../assets/procedural/character';
import type {Actions} from '../game/actions';
import type {PieMenu} from '../ui/pieMenu';
import type {createCameraController} from '../core/camera';
export function bindControls(renderer:THREE.WebGLRenderer,camera:THREE.PerspectiveCamera,character:Character,actions:Actions,menu:PieMenu,controller:ReturnType<typeof createCameraController>){
const {charMeshes}=character;const {walkTo}=actions;const {openPie,closePie,isOpen}=menu;const {camState,camGoal}=controller;
/* =========================================================
   9 · interaction
   ========================================================= */
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);

/* --- camera controls --- */
let hoverChar=false;
let drag:{button:number;x:number;y:number;moved:number;shift:boolean}|null=null;

function orbit(dx:number, dy:number){
  camGoal.theta -= dx*0.0055;
  camGoal.phi = clamp(camGoal.phi - dy*0.0055, 0.30, 1.44);
}
function pan(dx:number, dy:number){
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
  const fwd   = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0), right).normalize();
  const s = camState.radius * 0.0017;
  camGoal.target.addScaledVector(right, -dx*s);
  camGoal.target.addScaledVector(fwd,   dy*s);
  camGoal.target.x = clamp(camGoal.target.x, -HW, HW);
  camGoal.target.z = clamp(camGoal.target.z, -HD, HD);
  camGoal.target.y = clamp(camGoal.target.y, 0.2, 2.2);
}

const dom = renderer.domElement;
dom.addEventListener('contextmenu', e=> e.preventDefault());

dom.addEventListener('pointerdown', (e)=>{
  dom.setPointerCapture(e.pointerId);
  drag = { button:e.button, x:e.clientX, y:e.clientY, moved:0, shift:e.shiftKey };
  if (e.button === 2 || e.button === 1) e.preventDefault();
});

dom.addEventListener('pointermove', (e)=>{
  if (drag){
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.button === 2 && !e.shiftKey){ orbit(dx, dy); drag.x = e.clientX; drag.y = e.clientY; }
    else if (drag.button === 2 || drag.button === 1){ pan(dx, dy); drag.x = e.clientX; drag.y = e.clientY; }
    return;
  }
  // hover detection
  ndc.x = (e.clientX / innerWidth) * 2 - 1;
  ndc.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(charMeshes, false).length > 0;
  if (hit !== hoverChar){
    hoverChar = hit;
    dom.style.cursor = hit ? 'pointer' : 'default';
  }
});

dom.addEventListener('pointerup', (e)=>{
  if (!drag) return;
  const wasClick = drag.moved < 7 && drag.button === 0;
  drag = null;
  if (!wasClick) return;

  ndc.x = (e.clientX / innerWidth) * 2 - 1;
  ndc.y = -(e.clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(ndc, camera);

  if (raycaster.intersectObjects(charMeshes, false).length > 0){
    if (isOpen()) closePie();
    else openPie(e.clientX, e.clientY);
    return;
  }
  const p = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(groundPlane, p)){
    p.x = clamp(p.x, -HW + 0.3, HW - 0.3);
    p.z = clamp(p.z, -HD + 0.3, HD - 0.3);
    closePie();
    walkTo(p);
  }
});

dom.addEventListener('wheel', (e)=>{
  e.preventDefault();
  camGoal.radius = clamp(camGoal.radius * Math.exp(e.deltaY * 0.0011), 2.0, 11.0);
}, { passive:false });

window.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape') closePie();
  if (e.key === 'q' || e.key === 'Q') camGoal.theta += 0.22;
  if (e.key === 'e' || e.key === 'E') camGoal.theta -= 0.22;
});


dom.addEventListener('pointercancel',()=>{drag=null;});

}
