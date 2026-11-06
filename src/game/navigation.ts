import { Vector3 } from 'three';
import type { Seat } from './types';

export const CHARACTER_RADIUS = .24;

export interface FixedBody {
  id: string;
  x: number;
  z: number;
  halfWidth: number;
  halfDepth: number;
  angle?: number;
}

interface FloorBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

type Point = Pick<Vector3, 'x' | 'z'>;

export function createNavigation(bodies: FixedBody[], bounds: FloorBounds) {
  const solids = bodies.map(body => ({
    ...body,
    cos: Math.cos(body.angle ?? 0),
    sin: Math.sin(body.angle ?? 0),
    width: body.halfWidth + CHARACTER_RADIUS,
    depth: body.halfDepth + CHARACTER_RADIUS,
  }));
  const minX = bounds.minX + CHARACTER_RADIUS;
  const maxX = bounds.maxX - CHARACTER_RADIUS;
  const minZ = bounds.minZ + CHARACTER_RADIUS;
  const maxZ = bounds.maxZ - CHARACTER_RADIUS;
  const withinFloor = (p: Point) => p.x >= minX && p.x <= maxX && p.z >= minZ && p.z <= maxZ;

  // Sweep Haru's horizontal footprint against each fixed body in that body's local axes.
  // This rejects the whole swept segment, including both endpoints.
  function intersects(solid: typeof solids[number], from: Point, to: Point) {
    const x = from.x - solid.x;
    const z = from.z - solid.z;
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const a = x * solid.cos - z * solid.sin;
    const b = x * solid.sin + z * solid.cos;
    const da = dx * solid.cos - dz * solid.sin;
    const db = dx * solid.sin + dz * solid.cos;
    let enter = 0;
    let exit = 1;
    for (const [start, delta, half] of [[a, da, solid.width], [b, db, solid.depth]]) {
      if (Math.abs(delta) < 1e-9) {
        if (Math.abs(start) > half) return false;
        continue;
      }
      const left = (-half - start) / delta;
      const right = (half - start) / delta;
      enter = Math.max(enter, Math.min(left, right));
      exit = Math.min(exit, Math.max(left, right));
      if (enter > exit) return false;
    }
    return true;
  }

  function canTraverse(from: Point, to: Point, occupiedSeat?: Seat) {
    return withinFloor(from) && withinFloor(to) &&
      !solids.some(solid => solid.id !== occupiedSeat && intersects(solid, from, to));
  }

  function canStand(point: Point) {
    return canTraverse(point, point);
  }

  const corners: Vector3[] = [];
  for (const solid of solids) {
    for (const x of [-solid.width - .016, solid.width + .016]) {
      for (const z of [-solid.depth - .016, solid.depth + .016]) {
        const corner = new Vector3(
          solid.x + x * solid.cos + z * solid.sin,
          0,
          solid.z - x * solid.sin + z * solid.cos,
        );
        if (canStand(corner)) corners.push(corner);
      }
    }
  }

  const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);

  function findPath(from: Point, to: Point): Vector3[] | null {
    if (!canStand(from) || !canStand(to)) return null;
    const goal = new Vector3(to.x, 0, to.z);
    if (canTraverse(from, goal)) return [goal];

    // The corners form a small visibility graph for the room, including the open door leaf.
    const points = [new Vector3(from.x, 0, from.z), goal, ...corners];
    const costs = Array<number>(points.length).fill(Infinity);
    const closed = Array<boolean>(points.length).fill(false);
    const parent = Array<number>(points.length).fill(-1);
    costs[0] = 0;
    for (;;) {
      let current = -1;
      let priority = Infinity;
      for (let i = 0; i < points.length; i++) {
        const score = costs[i] + distance(points[i], goal);
        if (!closed[i] && score < priority) {
          current = i;
          priority = score;
        }
      }
      if (current < 0) return null;
      if (current === 1) break;
      closed[current] = true;
      for (let i = 1; i < points.length; i++) {
        if (closed[i]) continue;
        const candidate = costs[current] + distance(points[current], points[i]);
        if (candidate < costs[i] && canTraverse(points[current], points[i])) {
          costs[i] = candidate;
          parent[i] = current;
        }
      }
    }

    const path: Vector3[] = [];
    for (let at = 1; at !== 0; at = parent[at]) path.push(points[at].clone());
    return path.reverse();
  }

  return { bodies, canStand, canTraverse, findPath };
}

export type RoomNavigation = ReturnType<typeof createNavigation>;
