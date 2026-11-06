import { MathUtils, Vector3 } from "three";
import { CHARACTER_RADIUS, createNavigation, type FixedBody, type NavigationPoint, type RoomNavigation } from "../../../game/navigation";
import { obstacle } from "../blueApartment/plan";
import { plan as p, stair } from "./plan";

const stairX = (stair.left + stair.right) / 2;
const clearance = CHARACTER_RADIUS + .035;
const landings = {
  ground: new Vector3(stairX, 0, stair.bottom + clearance),
  upper: new Vector3(stairX, p.deckY, stair.top - clearance),
};
const heightAt = (z: number) => MathUtils.clamp((stair.bottom - z) / (stair.bottom - stair.top), 0, 1) * p.deckY;
const atHeight = (point: NavigationPoint, height: number) => Math.abs((point.y ?? 0) - height) < .045;
type Level = keyof typeof landings;
type Surface = Level | "stairs";

function onStairs(point: NavigationPoint) {
  // A clicked tread is up to one riser above the continuous height used by the walking animation.
  return point.x >= stair.left + clearance && point.x <= stair.right - clearance &&
    point.z >= landings.upper.z && point.z <= landings.ground.z &&
    Math.abs((point.y ?? 0) - heightAt(point.z)) <= p.deckY / stair.steps + .01;
}

function stairsPath(from: NavigationPoint, to: NavigationPoint) {
  const descending = from.z < to.z;
  const limits = descending ? [stair.top, stair.bottom] : [stair.bottom, stair.top];
  const points: Vector3[] = [];
  for (const z of limits) {
    if (z <= Math.min(from.z, to.z) || z >= Math.max(from.z, to.z)) continue;
    const x = MathUtils.lerp(from.x, to.x, (z - from.z) / (to.z - from.z));
    points.push(new Vector3(x, heightAt(z), z));
  }
  points.push(new Vector3(to.x, heightAt(to.z), to.z));
  return points;
}

export function createLoftNavigation(groundBodies: FixedBody[], upperBodies: FixedBody[]): RoomNavigation {
  const ground = createNavigation([
    ...groundBodies,
    obstacle("stair-base", stair.left, stair.right, stair.top, stair.bottom),
  ], { minX: p.left + .09, maxX: p.right - .09, minZ: p.back + .09, maxZ: p.entryFront - .09 });
  const upper = createNavigation([
    ...upperBodies,
    obstacle("stairwell", p.left, stair.right, stair.top, p.deckFront),
  ], { minX: p.left + .09, maxX: p.divider - .035, minZ: p.back + .09, maxZ: p.deckFront - .035 }, p.deckY);
  const levels = { ground, upper };

  function surface(point: NavigationPoint): Surface | undefined {
    if (atHeight(point, 0) && ground.canStand(point)) return "ground";
    if (atHeight(point, p.deckY) && upper.canStand(point)) return "upper";
    if (onStairs(point)) return "stairs";
  }

  const canTraverse: RoomNavigation["canTraverse"] = (from, to, seat) =>
    (atHeight(from, 0) && atHeight(to, 0) && ground.canTraverse(from, to, seat)) ||
    (atHeight(from, p.deckY) && atHeight(to, p.deckY) && upper.canTraverse(from, to, seat)) ||
    (onStairs(from) && onStairs(to));

  function findPath(from: NavigationPoint, to: NavigationPoint) {
    const start = surface(from);
    const end = surface(to);
    if (!start || !end) return null;
    if (start === end && start !== "stairs") return levels[start].findPath(from, to);

    const stairEntry = start === "stairs" ? from : landings[start];
    const stairExit = end === "stairs" ? to : landings[end];
    const approach = start === "stairs" ? [] : levels[start].findPath(from, stairEntry);
    const departure = end === "stairs" ? [] : levels[end].findPath(stairExit, to);
    if (!approach || !departure) return null;
    return [...approach, ...stairsPath(stairEntry, stairExit), ...departure];
  }

  return { bodies: [...ground.bodies, ...upper.bodies], canStand: point => surface(point) !== undefined, canTraverse, findPath };
}
