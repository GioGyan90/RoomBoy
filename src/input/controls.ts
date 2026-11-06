import * as THREE from 'three';
import { clamp } from '../core/math';
import { GAME_LAYOUT, roomFrameScale } from '../assets/procedural/roomV4/definitions';
import type { RoomProp } from '../assets/procedural/roomV4/entities';
import type { Character } from '../assets/procedural/character';
import type { Actions } from '../game/actions';
import type { Seat } from '../game/types';
import type { PieMenu } from '../ui/pieMenu';
import type { createCameraController } from '../core/camera';

interface RoomInput {
  root: THREE.Group;
  toggle(prop: RoomProp): void;
  canWalk(): boolean;
}

type Target =
  | { kind: 'character' }
  | { kind: 'seat'; seat: Seat }
  | { kind: 'prop'; id: RoomProp }
  | { kind: 'floor'; position: THREE.Vector3 };

export function bindControls(
  renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera, character: Character, actions: Actions,
  menu: PieMenu, controller: ReturnType<typeof createCameraController>, room: RoomInput,
) {
  const { camState, camGoal } = controller;
  const { half } = GAME_LAYOUT;
  const dom = renderer.domElement;
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag: { button: number; x: number; y: number; moved: number } | null = null;
  let lastHover = -Infinity;

  function orbit(dx: number, dy: number) {
    camGoal.theta -= dx * .0055;
    camGoal.phi = clamp(camGoal.phi - dy * .0055, .3, 1.65);
  }

  function pan(dx: number, dy: number) {
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
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
    raycaster.setFromCamera(ndc, camera);
    const walking = room.canWalk();
    const actor = walking ? raycaster.intersectObjects(character.charMeshes, false)[0] : undefined;
    const solid = raycaster.intersectObject(room.root, true)
      .find(hit => hit.object instanceof THREE.Mesh);
    if (actor && (!solid || actor.distance < solid.distance)) return { kind: 'character' };
    if (!solid) return;

    for (let object: THREE.Object3D | null = solid.object; object; object = object.parent) {
      if (object.userData.interactive) return { kind: 'prop', id: object.userData.interactive.id };
      if (!walking) continue;
      if (object.name === 'bed' || object.name === 'chair') return { kind: 'seat', seat: object.name };
      if (object.userData.walkable) {
        const p = solid.point.clone();
        p.y = 0;
        return { kind: 'floor', position: p };
      }
    }
  }

  dom.addEventListener('contextmenu', event => event.preventDefault());
  dom.addEventListener('pointerdown', event => {
    dom.setPointerCapture(event.pointerId);
    drag = { button: event.button, x: event.clientX, y: event.clientY, moved: 0 };
    if (event.button === 2 || event.button === 1) event.preventDefault();
  });
  dom.addEventListener('pointermove', event => {
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
  dom.addEventListener('pointercancel', () => { drag = null; });
  dom.addEventListener('wheel', event => {
    event.preventDefault();
    camGoal.radius = clamp(camGoal.radius * Math.exp(event.deltaY * .0011), 2, 16 * roomFrameScale(camera.aspect));
  }, { passive: false });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape') menu.closePie();
    if (event.key === 'q' || event.key === 'Q') camGoal.theta += .22;
    if (event.key === 'e' || event.key === 'E') camGoal.theta -= .22;
  });
}
