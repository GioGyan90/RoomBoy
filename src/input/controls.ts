import * as THREE from 'three';
import { clamp } from '../core/math';
import type { RoomToggle } from '../assets/procedural/roomV4/effects';
import type { Character } from '../assets/procedural/character';
import type { Actions } from '../game/actions';
import type { Seat } from '../game/types';
import type { PieMenu } from '../ui/pieMenu';
import type { createCameraController } from '../core/camera';

interface RoomInput {
  root: THREE.Group;
  half: number;
  frameScale(aspect: number): number;
  toggle(prop: RoomToggle): void;
  canWalk(): boolean;
}

type Target =
  | { kind: 'character' }
  | { kind: 'seat'; seat: Seat }
  | { kind: 'prop'; id: RoomToggle }
  | { kind: 'floor'; position: THREE.Vector3 };

export function bindControls(
  renderer: THREE.WebGLRenderer, character: Character, actions: Actions,
  menu: PieMenu, controller: ReturnType<typeof createCameraController>, room: RoomInput,
) {
  const { camState, camGoal } = controller;
  const { half } = room;
  const dom = renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag: { button: number; x: number; y: number; moved: number } | null = null;
  let lastHover = -Infinity;
  // One-finger orbit and two-finger pan/zoom on touchscreens.
  dom.style.touchAction = 'none';
  const touches = new Map<number, {x:number;y:number}>();
  let pinchDistance = 0;
  const distance = () => {const [a,b]=[...touches.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):0;};

  function orbit(dx: number, dy: number) {
    camGoal.theta -= dx * .0055;
    camGoal.phi = clamp(camGoal.phi - dy * .0055, .3, 1.65);
  }

  function pan(dx: number, dy: number) {
    const right = new THREE.Vector3().setFromMatrixColumn(controller.camera.matrix, 0);
    const forward = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), right).normalize();
    const scale = camState.radius * .0017;
    camGoal.target.addScaledVector(right, -dx * scale).addScaledVector(forward, dy * scale);
    camGoal.target.x = clamp(camGoal.target.x, -half, half);
    camGoal.target.z = clamp(camGoal.target.z, -half, half);
    camGoal.target.y = clamp(camGoal.target.y, .2, 2.2);
  }

  function pick(x: number, y: number): Target | undefined {
    if (!room.root.visible) return;
    ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, controller.camera);
    const walking = room.canWalk();
    const actor = walking ? raycaster.intersectObjects(character.charMeshes, false)[0] : undefined;
    const solid = raycaster.intersectObject(room.root, true)
      .find(hit => hit.object instanceof THREE.Mesh && !hit.object.userData.pickThrough);
    if (actor && (!solid || actor.distance < solid.distance)) return { kind: 'character' };
    if (!solid) return;

    for (let object: THREE.Object3D | null = solid.object; object; object = object.parent) {
      if (object.userData.interactive) return { kind: 'prop', id: object.userData.interactive.id };
      if (!walking) continue;
      if (object.name === 'bed' || object.name === 'chair' || object.name === 'toilet') {
        return { kind: 'seat', seat: object.name };
      }
      if (object.userData.walkable) {
        return { kind: 'floor', position: solid.point };
      }
    }
  }

  dom.addEventListener('contextmenu', event => event.preventDefault());
  dom.addEventListener('pointerdown', event => {
    dom.setPointerCapture(event.pointerId);
    if(event.pointerType==='touch'){
      touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(touches.size===2){pinchDistance=distance();drag=null;}
      else if(touches.size>2)drag=null;
      else drag={button:2,x:event.clientX,y:event.clientY,moved:0};
      return;
    }
    drag = { button: event.button, x: event.clientX, y: event.clientY, moved: 0 };
    if (event.button === 2 || event.button === 1) event.preventDefault();
  });
  dom.addEventListener('pointermove', event => {
    if(event.pointerType==='touch'){
      const previous=touches.get(event.pointerId);if(!previous)return;
      const dx=event.clientX-previous.x,dy=event.clientY-previous.y;
      touches.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(touches.size===1){orbit(dx,dy);if(drag)drag.moved+=Math.abs(dx)+Math.abs(dy);}
      else if(touches.size===2){pan(dx/2,dy/2);const next=distance();if(pinchDistance>0&&next>0)camGoal.radius=clamp(camGoal.radius*pinchDistance/next,2,16*room.frameScale(innerWidth/innerHeight));pinchDistance=next;}
      return;
    }
    if (drag) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.moved += Math.abs(dx) + Math.abs(dy);
      if (drag.button === 2 && !event.shiftKey) orbit(dx, dy);
      else if (drag.button === 2 || drag.button === 1) pan(dx, dy);
      drag.x = event.clientX;
      drag.y = event.clientY;
      return;
    }

    if (event.timeStamp - lastHover < 50) return;
    lastHover = event.timeStamp;
    const target = pick(event.clientX, event.clientY);
    dom.style.cursor = target && target.kind !== 'floor' ? 'pointer' : 'default';
  });
  dom.addEventListener('pointerup', event => {
    if(event.pointerType==='touch'){touches.delete(event.pointerId);pinchDistance=distance();drag=null;return;}
    const clicked = drag && drag.moved < 7 && drag.button === 0;
    drag = null;
    if (!clicked) return;
    const target = pick(event.clientX, event.clientY);
    if (target?.kind === 'character') {
      if (menu.isOpen()) menu.closePie();
      else menu.openPie(event.clientX, event.clientY);
      return;
    }
    menu.closePie();
    if (target?.kind === 'prop') room.toggle(target.id);
    if (target?.kind === 'seat') actions.sitAt(target.seat);
    if (target?.kind === 'floor') actions.walkTo(target.position);
  });
  dom.addEventListener('pointercancel', event => { touches.delete(event.pointerId); pinchDistance=distance(); drag = null; });
  dom.addEventListener('wheel', event => {
    event.preventDefault();
    camGoal.radius = clamp(camGoal.radius * Math.exp(event.deltaY * .0011), 2, 16 * room.frameScale(innerWidth / innerHeight));
  }, { passive: false });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') menu.closePie();
    if (event.key === 'q' || event.key === 'Q') camGoal.theta += .22;
    if (event.key === 'e' || event.key === 'E') camGoal.theta -= .22;
  });
}
