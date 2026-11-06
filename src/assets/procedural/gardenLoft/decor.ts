import * as T from "three";
import { box, disc, matte, paint, plane, ring } from "../blueApartment/surfaces";
import { ellipsoid, mesh, rounded, tube, type P3 } from "../sculpt";
import { canvasTexture, makeCanvas } from "../roomV4/utils";
import { finish, group } from "./materials";

const foliage = [0x4c6b32, 0x69833a, 0x839847, 0x596e38].map(color =>
  new T.MeshStandardMaterial({ color, side: T.DoubleSide, roughness: .85 }));
const vein = new T.LineBasicMaterial({ color: 0xadc06f, transparent: true, opacity: .64 });

function leaf(parent: T.Object3D, at: P3, angle: number, length: number, width: number, rise: number, tint: number) {
  const w = width / 2;
  const vertices = [0, 0, 0, -w, rise * .44, length * .42, -.69 * w, rise * .82, length * .73,
    0, rise, length, .69 * w, rise * .82, length * .73, w, rise * .44, length * .42, 0, rise * .63 + .022, length * .51];
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geometry.setIndex([0, 1, 6, 1, 2, 6, 2, 3, 6, 3, 4, 6, 4, 5, 6, 5, 0, 6]);
  geometry.computeVertexNormals();
  const blade = mesh(parent, geometry, foliage[tint % foliage.length], at);
  blade.rotation.y = angle;
  const rib = new T.Line(new T.BufferGeometry().setFromPoints([
    new T.Vector3(0, .003, .017), new T.Vector3(0, rise * .63 + .026, length * .51),
    new T.Vector3(0, rise + .003, length * .94),
  ]), vein);
  rib.raycast = () => {};
  blade.add(rib);
}

export function plant(parent: T.Object3D, at: P3, size: number, trailing = false, potMaterial: T.Material = finish.ivory) {
  const pot = group(parent, trailing ? "trailing-pothos" : "potted-rubber-plant", at);
  pot.scale.setScalar(size);
  const profile = [[0, .012], [.171, .012], [.195, .034], [.231, .322], [.241, .34], [.232, .365],
    [.211, .365], [.198, .328], [.188, .29], [0, .29]].map(([x, y]) => new T.Vector2(x, y));
  mesh(pot, new T.LatheGeometry(profile, 26), potMaterial);
  disc(pot, .196, .012, matte(0x674b34), [0, .310, 0]);
  const stems = matte(0x667346);
  const layers = trailing ? 10 : 16;
  const stemTop = trailing ? .64 : 1.26;
  tube(pot, [[0, .32, 0], [-.023, .53, -.015], [.019, stemTop - .04, -.012], [.018, stemTop, .014]], .018, stems, 12);
  for (let i = 0; i < layers; i++) {
    const angle = i * 2.4 + .4;
    const y = .42 + (stemTop - .39) * i / layers;
    const x = Math.sin(angle) * .052, z = Math.cos(angle) * .052;
    leaf(pot, [x, y, z], angle, .22 + (i % 4) * .038, .16 + (i % 3) * .029, .06 + (i % 3) * .035, i);
  }
  if (trailing) {
    for (const [shift, length] of [[-.12, 1.0], [.13, 1.43]]) {
      const vine = (u: number): P3 => [shift + Math.sin(u * 7) * .072, .47 - length * u, .12 + .29 * Math.sin(u * 1.72)];
      tube(pot, Array.from({ length: 7 }, (_, i) => vine(i / 6)), .013, stems, 18);
      for (let i = 1; i < 11; i++) leaf(pot, vine(i / 11), i % 2 ? .91 : -.91, .13 + (i % 3) * .018, .135, -.12, i);
    }
  }
  return pot;
}

export function mug(parent: T.Object3D, at: P3, color = finish.ivory) {
  const cup = group(parent, "ceramic-mug", at);
  const points = [[0, 0], [.066, 0], [.075, .012], [.078, .132], [.071, .137],
    [.066, .121], [.062, .023], [0, .023]].map(([x, y]) => new T.Vector2(x, y));
  mesh(cup, new T.LatheGeometry(points, 22), color);
  ring(cup, .043, .009, color, [.086, .073, 0]);
  disc(cup, .062, .003, matte(0xa0744e), [0, .101, 0]);
}

export function bouquet(parent: T.Object3D, at: P3) {
  const vase = group(parent, "vase-of-white-flowers", at);
  const profile = [[0, 0], [.081, 0], [.104, .047], [.101, .121], [.057, .228], [.061, .245],
    [.045, .247], [.038, .212], [0, .18]].map(([x, y]) => new T.Vector2(x, y));
  mesh(vase, new T.LatheGeometry(profile, 21), finish.ivory);
  for (let i = 0; i < 7; i++) {
    const angle = i * 2.4;
    const x = Math.sin(angle) * .15, z = Math.cos(angle) * .13;
    const y = .41 + (i % 4) * .056;
    tube(vase, [[0, .17, 0], [x * .54, .31, z * .45], [x, y, z]], .012, finish.oliveLight, 9);
    leaf(vase, [x * .54, .32 + (i % 3) * .027, z * .45], angle, .14, .085, .07, i);
    for (let j = 0; j < 5; j++) {
      const a = j * Math.PI * 2 / 5;
      ellipsoid(vase, [.045, .039, .046], paint.white, [x + Math.cos(a) * .032, y, z + Math.sin(a) * .032]);
    }
    ellipsoid(vase, [.026, .019, .025], matte(0xe1cc89), [x, y + .032, z]);
  }
}

export function fabricMat(parent: T.Object3D, name: string, width: number, depth: number, at: P3,
  body: T.Material, seam: T.Material, thickness = .020) {
  const mat = group(parent, name, at);
  mat.userData.walkable = true;
  rounded(mat, [width, thickness, depth], body, [0, thickness / 2, 0], thickness / 2);
  for (const side of [-1, 1]) {
    box(mat, [width - .064, .001, .009], seam, [0, thickness + .001, side * (depth / 2 - .027)]);
    box(mat, [.009, .001, depth - .064], seam, [side * (width / 2 - .027), thickness + .001, 0]);
  }
  return mat;
}

export function scenery(treetops: boolean) {
  const { canvas, ctx } = makeCanvas(768, 448);
  const sky = ctx.createLinearGradient(0, 0, 0, 448);
  sky.addColorStop(0, "#5aacf1");
  sky.addColorStop(.65, "#b7dcf5");
  sky.addColorStop(1, "#edf0ce");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 768, 448);

  for (const [x, y, size] of [[52, 112, 1.1], [272, 94, .65], [464, 173, 1.34], [699, 73, .82]]) {
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(x + size * i * 18, y - size * Math.sin(i * .65) * 12,
        size * (25 - i * 1.5), size * (7 + (i % 3) * 6), -.13, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 ? "#f5f9ef" : "#dcedf1";
      ctx.fill();
    }
  }

  for (const [row, color] of ["#8caeb4", "#5d958a", "#779c58", "#a5b96a"].entries()) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 448);
    for (let i = 0; i <= 16; i++) {
      const y = 248 + row * 29 + Math.cos(i * .66 + row * .92) * 26 + Math.sin(i * 1.48 - row * .81) * 14;
      ctx.lineTo(i * 48, y + (treetops ? 27 : 0));
    }
    ctx.lineTo(768, 448);
    ctx.closePath();
    ctx.fill();
  }

  if (treetops) {
    for (let i = 0; i < 24; i++) {
      const x = i * 34 - 10;
      const height = 17 + ((i * 23) % 61);
      ctx.fillStyle = ["#b5c4bd", "#d4d6c5", "#c4ceca"][i % 3];
      ctx.fillRect(x, 313 - height, 13 + (i % 4) * 4, height);
      ctx.fillStyle = "rgba(250,247,221,.60)";
      ctx.fillRect(x + 2, 315 - height, 4, height - 2);
    }
    const colors = ["#76934d", "#86a75a", "#9bb762", "#aec771", "#bfd37d", "#d2dc8c"];
    for (let i = 0; i < 520; i++) {
      const x = (i * 193.7) % 798 - 15;
      const top = 310 + 29 * Math.sin(x / 54) + 24 * Math.cos(x / 111);
      const y = top + ((i * 44.9) % (464 - top));
      ctx.fillStyle = colors[Math.floor((i * 1.71 + y * .015) % colors.length)];
      ctx.beginPath();
      ctx.ellipse(x, y, 5 + (i % 11), 5 + (i % 8), i * .6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return canvasTexture(canvas);
}

export function picture(parent: T.Object3D, at: P3, width: number, height: number, view: T.Texture) {
  const frame = group(parent, "framed-landscape", at);
  rounded(frame, [width, height, .036], finish.oakEdge, [0, 0, 0], .012);
  rounded(frame, [width - .052, height - .052, .016], finish.ivory, [0, 0, .022], .005);
  plane(frame, width - .124, height - .111, new T.MeshBasicMaterial({ map: view }), [0, 0, .032]);
}
