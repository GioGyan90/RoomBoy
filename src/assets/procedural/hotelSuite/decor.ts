import * as T from "three";
import { box, disc, matte, ring } from "../blueApartment/surfaces";
import { group } from "../gardenLoft/materials";
import { mesh, rounded, tube, type P3 } from "../sculpt";
import { finish, random, rugTexture, type SuiteMaterials } from "./finishes";

export function rug(parent: T.Group, kind: "lounge" | "bed" | "entry", width: number, depth: number, at: P3) {
  const fabric = group(parent, `hotel-${kind}-rug`, at);
  fabric.userData.walkable = true;
  rounded(fabric, [width, .024, depth], kind === "bed" ? finish.baseboard : finish.oxbloodShadow, [0, .012, 0], .009);
  const surface = mesh(fabric, new T.PlaneGeometry(width - .013, depth - .013).rotateX(-Math.PI / 2),
    new T.MeshStandardMaterial({ map: rugTexture(kind, width, depth), roughness: 1 }), [0, .0246, 0]);
  surface.castShadow = false;
  return fabric;
}

export function handle(parent: T.Group, at: P3, length: number, horizontal = true) {
  const [x, y, z] = at;
  const dx = horizontal ? length / 2 : 0, dy = horizontal ? 0 : length / 2;
  tube(parent, [[x - dx, y - dy, z], [x - dx, y - dy, z + .023],
    [x + dx, y + dy, z + .023], [x + dx, y + dy, z]], .009, finish.brass, 10);
}

export function feet(parent: T.Group, width: number, depth: number, height: number, material: T.Material, size = .057) {
  for (const x of [-width / 2, width / 2]) {
    for (const z of [-depth / 2, depth / 2]) {
      const foot = rounded(parent, [size, height, size], material, [x, height / 2, z], .012);
      foot.rotation.set(-Math.sign(z) * .035, 0, Math.sign(x) * .045);
    }
  }
}

export function cabinetPanel(parent: T.Group, width: number, height: number, at: P3, materials: SuiteMaterials) {
  const [x, y, z] = at;
  rounded(parent, [width, height, .041], materials.walnut, at, .009);
  rounded(parent, [width - .075, height - .082, .015], finish.walnutDark, [x, y, z + .020], .007);
  rounded(parent, [width - .103, height - .108, .013], materials.panel, [x, y, z + .028], .006);
}

export function lamp(parent: T.Group, at: P3, kind: "table" | "wall" | "vanity", lit = true) {
  const lampshade = new T.MeshStandardMaterial({ color: 0xffe8bc, emissive: 0xffc984, emissiveIntensity: .33,
    side: T.DoubleSide, roughness: .94 });
  const fixture = group(parent, `hotel-${kind}-lamp`, at);
  fixture.userData.interactive = { id: "lamps" };
  const isWall = kind !== "table";
  const vanity = kind === "vanity";
  const z = isWall ? .135 : 0;
  if (isWall) {
    rounded(fixture, [vanity ? .135 : .216, vanity ? .322 : .308, .045], finish.darkBrass, [0, .193, 0], .024);
    tube(fixture, [[0, .144, .018], [0, .134, .112], [0, .187, z]], .018, finish.brass, 13);
  } else {
    disc(fixture, .127, .032, finish.darkBrass, [0, .017, 0]);
    disc(fixture, .107, .021, finish.brass, [0, .037, 0]);
    tube(fixture, [[0, .038, 0], [0, .176, 0], [0, .222, 0]], .023, finish.brass, 12);
  }
  const shadeY = vanity ? .192 : .226;
  const profiles = vanity ? [[.064, 0], [.073, .028], [.073, .297], [.064, .328]]
    : [[.178, 0], [.191, .021], [.184, .069], [.158, .187], [.147, .254], [.136, .267]];
  const profile = profiles.map(([x, y]) => new T.Vector2(x, y));
  const shade = mesh(fixture, new T.LatheGeometry(profile, 28), lampshade, [0, shadeY, z]);
  shade.castShadow = false;
  for (const [i, [radius, y]] of [profiles[0], profiles.at(-1)!].entries()) {
    const rim = ring(fixture, radius, i === 0 ? .009 : .0065, finish.brass, [0, y + shadeY, z]);
    rim.rotation.x = -Math.PI / 2;
  }
  if (!lit) return { shade: lampshade };
  const light = new T.PointLight(0xffd6a3, .8, 3.05, 2);
  light.position.set(0, shadeY + .157, z + (isWall ? .094 : 0));
  fixture.add(light);
  return { shade: lampshade, light };
}

export function flowers(parent: T.Group, at: P3, kind: "wine" | "lily", size = 1) {
  const bouquet = group(parent, `hotel-${kind}-bouquet`, at);
  bouquet.scale.setScalar(size);
  const lily = kind === "lily";
  const vase = new T.LatheGeometry([[0, .007], [.073, .007], [.089, .032], [.103, .107], [.084, .193],
    [.071, .213], [.059, .216], [.056, .174], [0, .14]].map(([x, y]) => new T.Vector2(x, y)), 22);
  mesh(bouquet, vase, lily ? finish.brass : matte(0x727955));
  const stemMaterial = matte(0x566841);
  const petalMaterials = lily ? [matte(0xffeed2), matte(0xe9ce9f)] : [matte(0x9a4040), matte(0xc86b64)];
  const petalCount = 7 * 5;
  const geometry = new T.SphereGeometry(1, 10, 7);
  const petalMesh = new T.InstancedMesh(geometry, petalMaterials[0], petalCount);
  const centerMesh = new T.InstancedMesh(geometry, petalMaterials[1], 7);
  const transform = new T.Object3D();
  const rand = random(lily ? 738 : 713);
  for (let i = 0; i < 7; i++) {
    const direction = i * 2.40;
    const x = Math.sin(direction) * (lily ? .155 : .119) * (i ? 1 : .15);
    const z = Math.cos(direction) * .11 * (i ? 1 : .15);
    const y = (lily ? .405 : .325) + (i % 4) * .025;
    tube(bouquet, [[0, .17, 0], [x * .46, y - .085, z * .40], [x, y, z]], .009, stemMaterial, 8);
    if (lily && i % 2 === 0) {
      const leaf = mesh(bouquet, geometry, stemMaterial, [x * .62, y - .107, z * .8]);
      leaf.scale.set(.078, .014, .026);
      leaf.rotation.set(.41, direction, .37);
    }
    for (let j = 0; j < 5; j++) {
      const a = direction + j * Math.PI * .4;
      const offset = lily ? .036 : .026;
      transform.position.set(x + Math.sin(a) * offset, y + rand() * .013, z + Math.cos(a) * offset);
      transform.rotation.set(.29, a, .09);
      transform.scale.set(lily ? .022 : .028, lily ? .014 : .027, lily ? .055 : .030);
      transform.updateMatrix();
      petalMesh.setMatrixAt(i * 5 + j, transform.matrix);
    }
    transform.position.set(x, y + .019, z);
    transform.rotation.set(0, 0, 0);
    transform.scale.set(.022, .019, .022);
    transform.updateMatrix();
    centerMesh.setMatrixAt(i, transform.matrix);
  }
  petalMesh.castShadow = centerMesh.castShadow = true;
  petalMesh.receiveShadow = centerMesh.receiveShadow = true;
  bouquet.add(petalMesh, centerMesh);
  return bouquet;
}

export function guestBook(parent: T.Group, at: P3) {
  const book = group(parent, "open-guest-book", at, -.13);
  rounded(book, [.613, .035, .377], finish.walnutDark, [0, .012, 0], .011);
  for (const side of [-1, 1]) {
    const page = group(book, "parchment-page", [side * .144, .035, 0]);
    page.rotation.z = -side * .074;
    rounded(page, [.276, .022, .344], finish.linen, [0, 0, 0], .008);
    for (let row = 0; row < 6; row++) {
      box(page, [.171 - (row % 3) * .018, .0018, .0028], finish.baseboard, [-.014, .0119, -.102 + row * .036]);
    }
  }
}
