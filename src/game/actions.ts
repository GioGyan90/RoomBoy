import * as THREE from 'three';
import { GAME_LAYOUT } from '../assets/procedural/roomV4/definitions';
import type { Character } from '../assets/procedural/character';
import { angleLerp, damp } from '../core/math';
import { element } from '../ui/dom';
import type { Animation } from './animation';
import type { RoomNavigation } from './navigation';
import { seats } from './seating';
import type { Action, PoseStep, Seat, Step } from './types';
import type { RoomLayout } from './rooms';

export function createActions(
  scene: THREE.Scene, character: Character, animation: Animation, navigation: RoomNavigation,
  layout: RoomLayout = GAME_LAYOUT, hasComputer = true,
) {
  const { charRoot } = character;
  const { st, HIP } = animation;
  const { desk, bed, toilet } = layout;
  const seatLayouts = {
    chair: { ...desk, posture: 'sitChair' },
    bed: { ...bed, posture: 'sitBed' },
    toilet: { ...toilet, posture: 'sitToilet' },
  } as const;
  const statusEl = element('status');
  const position = (spot: { x: number; z: number }) => new THREE.Vector3(spot.x, 0, spot.z);
  const nextPosition = new THREE.Vector3();
  let occupied: Seat | undefined;
  let steps: Step[] = [];
  let stepIndex = -1;
  let elapsed = 0;
  let route: THREE.Vector3[] = [];
  let waypoint = 0;
  let seatMove: { from: THREE.Vector3; height: number; start: number; end: number } | undefined;

  function setStatus(text: string) {
    statusEl.textContent = text;
  }

  function finish() {
    steps = [];
    stepIndex = -1;
    occupied = undefined;
    st.mode = 'idle';
    st.posture = 'stand';
    st.seating = null;
    st.napping = false;
    st.bodyYTarget = HIP;
    st.bodyRotXTarget = 0;
    setStatus('Idle');
  }

  function blocked() {
    if (occupied) {
      steps = [];
      stepIndex = -1;
    } else finish();
    setStatus('Path blocked');
    return false;
  }

  function standStep(): PoseStep | undefined {
    if (!occupied) return;
    const spot = seatLayouts[occupied].stand;
    return {
      type: 'pose', posture: 'stand', pos: position(spot), rot: spot.rot, duration: .95,
      seat: occupied, exitSeat: true, motion: st.posture === 'lieBed' ? undefined : 'rise',
    };
  }

  function withStand(next: Step[]) {
    const stand = standStep();
    return stand ? [stand, ...next] : next;
  }

  function begin(): boolean {
    const step = steps[stepIndex];
    if (!step) {
      finish();
      return true;
    }
    elapsed = 0;
    seatMove = undefined;
    if (step.type === 'walk') {
      const path = navigation.findPath(charRoot.position, step.pos);
      if (!path) return blocked();
      route = path;
      waypoint = 0;
      st.seating = null;
      st.mode = 'walk';
      return true;
    }

    if (!navigation.canTraverse(charRoot.position, step.pos, step.seat)) return blocked();
    if (step.motion && step.seat) {
      const kind = step.seat;
      const end = step.motion === 'rise' ? 0 : seats[kind].duration;
      const previous = st.seating?.kind === kind ? st.seating.time : undefined;
      const seated = occupied === kind && st.posture === 'sitDesk';
      const start = previous ?? (step.motion === 'rise' || seated ? seats[kind].duration : 0);
      seatMove = { from: charRoot.position.clone(), height: character.body.position.y, start, end };
      st.seating = { kind, time: start };
    } else {
      st.seating = null;
    }
    if (step.seat) occupied = step.seat;
    st.mode = 'pose';
    st.posture = step.posture;
    st.poseTime = 0;
    st.bodyRotXTarget = step.rotX ?? 0;
    if (!seatMove) st.bodyYTarget = step.bodyY ?? HIP;
    return true;
  }

  function advance() {
    stepIndex++;
    begin();
  }

  function start(next: Step[], status: string, napping = false) {
    steps = next;
    stepIndex = 0;
    if (!begin()) return;
    st.napping = napping;
    setStatus(status);
  }

  function updateWalk(dt: number) {
    const target = route[waypoint];
    const p = charRoot.position;
    const dx = target.x - p.x;
    const dz = target.z - p.z;
    const distance = Math.hypot(dx, dz);
    const length = Math.min(distance, 1.15 * dt);
    const portion = distance > 0 ? length / distance : 1;
    nextPosition.set(p.x + dx * portion, 0, p.z + dz * portion);
    if (!navigation.canTraverse(p, nextPosition)) {
      blocked();
      return;
    }
    p.copy(nextPosition);
    if (distance > 1e-6) {
      charRoot.rotation.y = angleLerp(charRoot.rotation.y, Math.atan2(dx, dz), 1 - Math.exp(-10 * dt));
      st.walkPhase += length * (7.4 / 1.15);
    }
    if (length === distance && ++waypoint >= route.length) advance();
  }

  function updatePose(step: PoseStep, dt: number) {
    st.poseTime += dt;
    let duration = step.duration ?? .9;
    const p = charRoot.position;
    if (seatMove && st.seating) {
      const clip = seats[st.seating.kind];
      const { from, height, start, end } = seatMove;
      duration = Math.max(.16, Math.abs(end - start));
      const fraction = Math.min(1, elapsed / duration);
      const time = THREE.MathUtils.lerp(start, end, fraction);
      const a = clip.placement(start);
      const b = clip.placement(end);
      const c = clip.placement(time);
      const progress = (value: number, low: number, high: number) =>
        Math.abs(high - low) < 1e-5 ? fraction : THREE.MathUtils.clamp((value - low) / (high - low), 0, 1);
      nextPosition.lerpVectors(from, step.pos, progress(c.horizontal, a.horizontal, b.horizontal));
      st.bodyYTarget = THREE.MathUtils.lerp(height, step.bodyY ?? HIP, progress(c.height, a.height, b.height));
      st.seating.time = time;
    } else {
      nextPosition.set(damp(p.x, step.pos.x, 5, dt), 0, damp(p.z, step.pos.z, 5, dt));
    }

    const complete = !step.hold && elapsed >= duration;
    if (complete) nextPosition.copy(step.pos);
    if (!navigation.canTraverse(p, nextPosition, step.seat)) {
      blocked();
      return;
    }
    p.copy(nextPosition);
    charRoot.rotation.y = angleLerp(charRoot.rotation.y, step.rot, 1 - Math.exp(-12 * dt));
    if (complete) {
      if (step.exitSeat) occupied = undefined;
      advance();
    }
  }

  function updateRunner(dt: number) {
    const step = steps[stepIndex];
    if (!step) return;
    elapsed += dt;
    if (step.type === 'walk') updateWalk(dt);
    else updatePose(step, dt);
  }

  function sitStep(kind: Seat, hold: boolean): PoseStep {
    const { sit, posture } = seatLayouts[kind];
    return {
      type: 'pose', posture, seat: kind, motion: 'sit',
      pos: position(sit), rot: sit.rot, bodyY: sit.bodyY, hold,
    };
  }

  function seatSteps(kind: Seat, next: PoseStep[]) {
    if (occupied === kind && st.posture !== 'lieBed') return next;
    return withStand([{ type: 'walk', pos: position(seatLayouts[kind].stand) }, ...next]);
  }

  function lieSteps(): Step[] {
    const lie: PoseStep = {
      type: 'pose', posture: 'lieBed', seat: 'bed', pos: position(bed.lie), rot: bed.lie.rot,
      bodyY: bed.lie.bodyY, rotX: -Math.PI / 2, hold: true,
    };
    if (st.posture === 'lieBed') return [lie];
    return withStand([{ type: 'walk', pos: position(bed.stand) }, lie]);
  }

  const ACTIONS: Action[] = [
    { id: 'computer', icon: '💻', label: 'Use Computer', status: 'Surfing the web 💻', steps: () => {
      const typing: PoseStep = {
        type: 'pose', posture: 'sitDesk', seat: 'chair', pos: position(desk.sit), rot: desk.sit.rot,
        bodyY: desk.sit.bodyY, hold: true,
      };
      return occupied === 'chair' && st.posture === 'sitDesk'
        ? [typing] : seatSteps('chair', [sitStep('chair', false), typing]);
    } },
    { id: 'sitChair', icon: '🪑', label: 'Sit on Chair', status: 'Sitting on the chair',
      steps: () => seatSteps('chair', [sitStep('chair', true)]) },
    { id: 'sitBed', icon: '🛏️', label: 'Sit on Bed', status: 'Sitting on the bed',
      steps: () => seatSteps('bed', [sitStep('bed', true)]) },
    { id: 'sitToilet', icon: '🚽', label: 'Sit on Toilet', status: 'Sitting on the toilet',
      steps: () => seatSteps('toilet', [sitStep('toilet', true)]) },
    { id: 'nap', icon: '😴', label: 'Take a Nap', nap: true, steps: lieSteps, status: 'Napping 😴' },
    { id: 'stretch', icon: '🙆', label: 'Stretch', status: 'Stretching 🙆', steps: () => {
      const spot = occupied ? seatLayouts[occupied].stand : undefined;
      return withStand([{
        type: 'pose', posture: 'stretch', pos: spot ? position(spot) : charRoot.position.clone(),
        rot: spot?.rot ?? charRoot.rotation.y, duration: 2.6,
      }]);
    } },
    { id: 'stand', icon: '🧍', label: 'Stand Here', status: 'Standing around', steps: () => [
      standStep() ?? {
        type: 'pose', posture: 'stand', pos: charRoot.position.clone(), rot: charRoot.rotation.y, duration: .6,
      },
    ] },
  ];

  function runAction(action: Action) {
    start(action.steps(), action.status, !!action.nap);
  }

  function sitAt(seat: Seat) {
    runAction(ACTIONS.find(action => action.id === seatLayouts[seat].posture)!);
  }

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(.16, .22, 36),
    new THREE.MeshBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  );
  marker.rotation.x = -Math.PI / 2;
  scene.add(marker);
  let markerLife = 0;

  function walkTo(p: THREE.Vector3) {
    const origin = occupied ? seatLayouts[occupied].stand : charRoot.position;
    if (!navigation.findPath(origin, p)) {
      setStatus('Path blocked');
      return;
    }
    start(withStand([{ type: 'walk', pos: p.clone() }]), 'Walking');
    marker.position.set(p.x, .015, p.z);
    markerLife = 1;
  }

  function updateMarker(dt: number) {
    if (markerLife <= 0) return;
    markerLife = Math.max(0, markerLife - dt * 1.4);
    marker.material.opacity = markerLife * .85;
    marker.scale.setScalar(1 + (1 - markerLife) * 1.2);
  }

  return {
    ACTIONS: hasComputer ? ACTIONS : ACTIONS.filter(action => action.id !== 'computer'),
    runAction, sitAt, walkTo, updateRunner, updateMarker, cancel: finish,
  };
}

export type Actions = ReturnType<typeof createActions>;
