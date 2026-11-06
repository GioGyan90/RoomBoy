import { Box3, Mesh, Vector3 } from "three";
import { createNavigation, type FixedBody } from "../../../game/navigation";
import { ROOM, ROOM_SCALE } from "./definitions";
import type { createRoomV4 } from "./entities";

export function createRoomNavigation({ root, registry }: ReturnType<typeof createRoomV4>) {
  root.updateMatrixWorld(true);
  const bodies: FixedBody[] = [];

  for (const id of ["bed", "desk", "chair", "wardrobe", "shelves", "nightstand", "fan", "laundry-basket", "bath-sink", "bath-toilet"]) {
    const model = registry.get(id) ?? root.getObjectByName(id);
    if (!model) continue;
    const footprint = model.getObjectByName(id + "-footprint") ?? model;
    const bounds = new Box3().setFromObject(footprint);
    if (bounds.isEmpty()) continue;
    const center = bounds.getCenter(new Vector3());
    const size = bounds.getSize(new Vector3());
    bodies.push({ id, x: center.x, z: center.z, halfWidth: size.x / 2, halfDepth: size.z / 2 });
  }

  function partition(id: string, minX: number, maxX: number, minZ: number, maxZ: number) {
    bodies.push({
      id,
      x: (minX + maxX) * ROOM_SCALE / 2,
      z: (minZ + maxZ) * ROOM_SCALE / 2,
      halfWidth: (maxX - minX) * ROOM_SCALE / 2,
      halfDepth: (maxZ - minZ) * ROOM_SCALE / 2,
    });
  }

  const bath = ROOM.bath;
  const halfWall = bath.wallT / 2;
  partition("bath-back-wall", bath.wallStart, bath.wallEnd, bath.z0 - halfWall, bath.z0 + halfWall + .08);
  partition("bath-side-wall", bath.x0 - halfWall, bath.x0 + halfWall + .08, bath.wallStart, bath.doorZ0);
  partition("bath-door-jamb", bath.x0 - halfWall, bath.x0 + halfWall + .08, bath.doorZ1, bath.wallEnd);

  const door = root.getObjectByName("bath-door-leaf");
  if (door instanceof Mesh) {
    door.geometry.computeBoundingBox();
    const box = door.geometry.boundingBox!;
    const size = box.getSize(new Vector3()).multiply(door.getWorldScale(new Vector3()));
    const center = door.localToWorld(box.getCenter(new Vector3()));
    const axis = new Vector3(1, 0, 0).transformDirection(door.matrixWorld);
    bodies.push({
      id: door.name, x: center.x, z: center.z,
      halfWidth: size.x / 2 + .014, halfDepth: size.z / 2,
      angle: Math.atan2(-axis.z, axis.x),
    });
  }

  const min = (-ROOM.half + ROOM.wallT / 2 + .07) * ROOM_SCALE;
  const max = ROOM.half * ROOM_SCALE;
  return createNavigation(bodies, { minX: min, maxX: max, minZ: min, maxZ: max });
}
