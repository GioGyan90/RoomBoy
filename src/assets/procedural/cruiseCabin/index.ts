import * as T from "three";
import { createHotelSuite } from "../hotelSuite";
import { plan, bed } from "../hotelSuite/plan";

/**
 * 船舱卧室：沿用酒店套房已验证的碰撞、寻路、动作锚点及灯光，
 * 额外用独立的程序化船体构件表现邮轮舱壁、舷窗、甲板与黄铜装饰。
 * 所有附加构件都位于不可行走区域，不改变已有导航拓扑。
 */
export function createCruiseCabin() {
  const room = createHotelSuite();
  const root = room.root;
  root.name = "cruise-cabin";
  const hull = new T.Group();
  hull.name = "cruise-hull-and-deck";
  root.add(hull);
  const ivory = new T.MeshStandardMaterial({ color: 0xe9d6d0, roughness: .47, metalness: .10 });
  const brass = new T.MeshStandardMaterial({ color: 0xc18c42, metalness: .77, roughness: .24 });
  const dark = new T.MeshStandardMaterial({ color: 0x362727, roughness: .65 });
  const deckWood = new T.MeshStandardMaterial({ color: 0x9e6746, roughness: .82 });
  const sea = new T.MeshBasicMaterial({ color: 0x1684b6, side: T.DoubleSide });
  const sky = new T.MeshBasicMaterial({ color: 0x7bc7f2, side: T.DoubleSide });
  const box = (name: string, size: [number, number, number], pos: [number, number, number], mat: T.Material, parent: T.Object3D = hull) => {
    const mesh = new T.Mesh(new T.BoxGeometry(...size), mat);
    mesh.name = name;
    mesh.position.set(...pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (name: string, radius: number, depth: number, pos: [number, number, number], mat: T.Material, rotation: [number, number, number] = [0, 0, 0]) => {
    const mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, depth, 24), mat);
    mesh.name = name;
    mesh.position.set(...pos);
    mesh.rotation.set(...rotation);
    hull.add(mesh);
    return mesh;
  };
  // Outer cutaway hull; follow the right-hand wall and front lip without obstructing the room.
  const x = plan.right + .23;
  box("rounded-hull-side", [.24, 1.10, plan.front - plan.loungeBack + .55], [x, .52, (plan.front + plan.loungeBack) / 2], ivory);
  box("brass-hull-waterline", [.045, .048, plan.front - plan.loungeBack + .52], [x + .132, .43, (plan.front + plan.loungeBack) / 2], brass);
  box("cutaway-front-ivory", [plan.right - plan.entryRight + .25, .27, .23], [(plan.right + plan.entryRight) / 2, .12, plan.front + .20], ivory);
  box("cutaway-front-gold", [plan.right - plan.entryRight + .24, .025, .04], [(plan.right + plan.entryRight) / 2, .27, plan.front + .33], brass);
  for (let i = 0; i < 13; i++) {
    cylinder("hull-rivet-" + i, .029, .015, [x + .131, .71, plan.loungeBack + .18 + i * .48], brass, [0, 0, Math.PI / 2]);
  }
  // Decorative round portholes: inset into the exterior ship-side, away from interaction targets.
  for (const z of [-2.10, -.35, 1.40]) {
    const center: [number, number, number] = [x + .141, 1.47, z];
    cylinder("porthole-rim", .37, .044, center, brass, [0, 0, Math.PI / 2]);
    cylinder("porthole-glass", .294, .049, [center[0] + .032, center[1], z], sea, [0, 0, Math.PI / 2]);
    cylinder("porthole-highlight", .255, .051, [center[0] + .036, center[1] + .012, z], sky, [0, 0, Math.PI / 2]);
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      cylinder("porthole-bolt", .018, .018, [center[0] + .036, center[1] + .337 * Math.cos(a), z + .337 * Math.sin(a)], ivory, [0, 0, Math.PI / 2]);
    }
  }
  // Narrow observation balcony outside the window: it is scenic only, not a walkable area.
  const back = plan.loungeBack - .49;
  box("balcony-deck", [4.25, .15, .83], [3.20, -.075, back], deckWood);
  for (let i = 0; i < 9; i++) {
    const bx = 1.25 + i * .48;
    box("deck-plank-" + i, [.018, .004, .80], [bx, .007, back], brass);
  }
  for (const bx of [1.20, 3.12, 5.15]) {
    box("balcony-stanchion", [.038, .86, .038], [bx, .44, back - .38], brass);
  }
  for (const y of [.44, .82]) {
    box("balcony-rail", [3.99, .033, .033], [3.18, y, back - .38], brass);
  }
  // Crown-style brass bedhead detail; does not alter the mattress or pose anchors.
  const crown = new T.Group();
  crown.name = "cruise-cabin-bed-crown";
  crown.position.set(bed.x, 1.67, bed.z - bed.length / 2 + .21);
  root.add(crown);
  const points = [[-.29,0],[-.24,.20],[-.12,.09],[0,.29],[.12,.09],[.24,.20],[.29,0]] as const;
  const shape = new T.Shape();
  points.forEach(([px,py],i)=>i===0?shape.moveTo(px,py):shape.lineTo(px,py));
  shape.lineTo(-.29,0);
  const emblem = new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.016,bevelEnabled:false}),brass);
  crown.add(emblem);
  box("crown-base", [.65,.055,.027], [0,-.024,.012], brass,crown);
  // A compact ship's nameplate near the entry.
  box("cabin-plaque", [.73,.25,.035], [plan.entryLeft + .75,1.77,plan.front + .025], dark);
  box("cabin-plaque-trim", [.66,.018,.046], [plan.entryLeft + .75,1.88,plan.front + .052], brass);
  return room;
}
