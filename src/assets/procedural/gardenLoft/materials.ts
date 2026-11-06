import * as T from "three";
import { matte, paint } from "../blueApartment/surfaces";
import { rounded, tube, type P3 } from "../sculpt";

export const finish = {
  plaster: matte(0xedd5bf),
  cut: matte(0x9c9190),
  cap: matte(0xe0d1c7),
  trim: matte(0xccac8d),
  oak: matte(0xb98148),
  oakLight: matte(0xdfaa69),
  oakEdge: matte(0xa57042),
  ivory: matte(0xf0ddc2),
  cotton: matte(0xe8d2b3),
  olive: matte(0x46533a),
  oliveLight: matte(0x566344),
  oliveDark: matte(0x364333),
  iron: matte(0x3e433d),
  stone: matte(0xe0d2c2),
};

export function group(parent: T.Object3D, name: string, at: P3, angle = 0) {
  const object = new T.Group();
  object.name = name;
  object.position.set(...at);
  object.rotation.y = angle;
  parent.add(object);
  return object;
}

export function pull(parent: T.Object3D, at: P3, length: number, horizontal = false) {
  const [x, y, z] = at;
  const dx = horizontal ? length / 2 : 0;
  const dy = horizontal ? 0 : length / 2;
  tube(parent, [[x - dx, y - dy, z], [x - dx, y - dy, z + .021],
    [x + dx, y + dy, z + .021], [x + dx, y + dy, z]], .0075, paint.chrome, 8);
}

export function cabinet(parent: T.Object3D, width: number, height: number, depth: number, doors: number,
  body: T.Material, fronts: T.Material) {
  const toe = .075;
  rounded(parent, [width - .05, toe, depth - .08], body, [0, toe / 2, -.016], .009);
  rounded(parent, [width, height - toe, depth], body, [0, (height + toe) / 2, 0], .018);
  const panel = width / doors;
  for (let i = 0; i < doors; i++) {
    const x = -width / 2 + panel * (i + .5);
    rounded(parent, [panel - .018, height - toe - .022, .039], fronts, [x, (height + toe) / 2, depth / 2 + .009], .009);
    pull(parent, [x + (i % 2 ? -1 : 1) * (panel / 2 - .065), height * .64, depth / 2 + .029], .12);
  }
}
