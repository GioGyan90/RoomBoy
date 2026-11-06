import * as T from "three";
import { mesh, type P3 } from "../sculpt";
import { canvasTexture, makeCanvas } from "../roomV4/utils";

const materials = new Map<number, T.MeshStandardMaterial>();
export function matte(color: number) {
  let material = materials.get(color);
  if (!material) {
    material = new T.MeshStandardMaterial({ color, roughness: .82 });
    materials.set(color, material);
  }
  return material;
}

export const paint = {
  plaster: matte(0xe0d9dc),
  cap: matte(0xc5bfd7),
  cut: matte(0x9693b5),
  trim: matte(0xc4b7b2),
  oak: matte(0xc58a58),
  oakLight: matte(0xe6b982),
  oakDark: matte(0xa16b48),
  door: matte(0xa97250),
  white: matte(0xf3eae6),
  ceramic: new T.MeshStandardMaterial({ color: 0xf4eceb, roughness: .36 }),
  chrome: new T.MeshStandardMaterial({ color: 0xadb8cb, metalness: .28, roughness: .32 }),
  steel: new T.MeshStandardMaterial({ color: 0x626d84, metalness: .12, roughness: .46 }),
  cabinet: matte(0x7187a4),
  blue: matte(0x7d9cc8),
  deepBlue: matte(0x435d88),
};

const ink = new T.LineBasicMaterial({ color: 0x484258, transparent: true, opacity: .34 });
export function edges(object: T.Mesh, angle = 35) {
  const lines = new T.LineSegments(new T.EdgesGeometry(object.geometry, angle), ink);
  lines.raycast = () => {};
  object.add(lines);
  return object;
}

export function box(parent: T.Object3D, size: P3, material: T.Material | T.Material[], at: P3) {
  const object = new T.Mesh(new T.BoxGeometry(...size), material);
  object.position.set(...at);
  object.castShadow = object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function plane(parent: T.Object3D, width: number, height: number, material: T.Material, at: P3) {
  const object = mesh(parent, new T.PlaneGeometry(width, height), material, at);
  object.castShadow = false;
  return object;
}

export function glass(parent: T.Object3D, width: number, height: number, at: P3, opacity = .22) {
  const object = plane(parent, width, height, new T.MeshBasicMaterial({
    color: 0x9fc3e4, transparent: true, opacity, side: T.DoubleSide, depthWrite: false,
  }), at);
  object.userData.pickThrough = true;
  return object;
}

function noise(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function timber() {
  const { canvas, ctx } = makeCanvas(1024, 256);
  const rand = noise(22);
  ctx.fillStyle = "#b99a8a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let row = 0; row < 8; row++) {
    const y = row * 32;
    const offset = (row * 131) % 350;
    for (let col = -1; col < 4; col++) {
      const x = col * 350 + offset;
      const tint = Math.round(rand() * 14);
      ctx.fillStyle = `rgb(${215 + tint},${169 + tint},${148 + tint})`;
      ctx.fillRect(x + .8, y + .8, 348.4, 30.4);
      for (let grain = 0; grain < 9; grain++) {
        const gy = y + 3 + rand() * 26;
        const from = x + 5 + rand() * 90;
        ctx.lineWidth = .5 + rand();
        ctx.strokeStyle = `rgba(127,79,56,${.025 + rand() * .07})`;
        ctx.beginPath();
        ctx.moveTo(from, gy);
        ctx.bezierCurveTo(from + 60, gy + 1, x + 234, gy - 1.6, x + 343, gy + .4);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,227,199,.23)";
      ctx.fillRect(x + 2, y + 1, 346, 1);
    }
  }
  return canvasTexture(canvas);
}

export function tiles(grout: string, tones: readonly [string, string, string, string]) {
  const { canvas, ctx } = makeCanvas(128, 128);
  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, 128, 128);
  tones.forEach((tone, i) => {
    const x = (i % 2) * 64;
    const y = Math.floor(i / 2) * 64;
    ctx.fillStyle = tone;
    ctx.fillRect(x + 1, y + 1, 62, 62);
    ctx.fillStyle = "rgba(255,255,255,.24)";
    ctx.fillRect(x + 1, y + 1, 62, 1);
    ctx.fillRect(x + 1, y + 1, 1, 62);
  });
  return canvasTexture(canvas);
}

export function plaid() {
  const { canvas, ctx } = makeCanvas(128, 128);
  const shade = ctx.createLinearGradient(0, 0, 128, 128);
  shade.addColorStop(0, "#9eb7df");
  shade.addColorStop(1, "#93afd9");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "rgba(255,245,229,.86)";
  ctx.fillRect(0, 0, 1.65, 128);
  ctx.fillRect(0, 0, 128, 1.65);
  return canvasTexture(canvas);
}

export function landscape() {
  const { canvas, ctx } = makeCanvas(768, 384);
  const rand = noise(731);
  const sky = ctx.createLinearGradient(0, 0, 0, 384);
  sky.addColorStop(0, "#90cce9");
  sky.addColorStop(.60, "#e4f6eb");
  sky.addColorStop(1, "#4e9b84");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, 768, 384);

  for (const [x, y, width] of [[103, 85, 116], [420, 108, 146], [653, 57, 97]]) {
    ctx.fillStyle = "rgba(255,254,236,.83)";
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.ellipse(x + i * width / 10, y - Math.sin(i) * 6, width / 5, 5 + rand() * 12, -.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const groves = [
    [5, 306, 216, 217], [151, 315, 135, 163], [325, 373, 165, 153],
    [568, 392, 161, 178], [769, 329, 176, 197],
  ];
  const colors = ["#3f8a78", "#5aa384", "#75b67c", "#98c97c", "#b9d982", "#d6e58e", "#edf0ae"];
  for (const [x, y, rx, ry] of groves) {
    ctx.fillStyle = colors[0];
    ctx.beginPath();
    ctx.ellipse(x, y + 33, rx * .90, ry * .87, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 460; i++) {
      const angle = rand() * Math.PI * 2;
      const r = Math.sqrt(rand());
      const px = x + Math.cos(angle) * rx * r;
      const py = y + Math.sin(angle) * ry * r;
      const light = Math.max(0, Math.min(colors.length - 1, Math.floor((y + ry - py) / ry * 2.4 + rand() * 2.1)));
      ctx.fillStyle = colors[light];
      ctx.beginPath();
      ctx.ellipse(px, py, 3 + rand() * 12, 2 + rand() * 7, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return canvasTexture(canvas);
}

export function useWorldUV(geometry: T.BufferGeometry, uAxis: "x" | "z", vAxis: "y" | "z", uSize: number, vSize: number) {
  const positions = geometry.getAttribute("position");
  const uv = new T.Float32BufferAttribute(new Float32Array(positions.count * 2), 2);
  for (let i = 0; i < positions.count; i++) {
    const u = uAxis === "x" ? positions.getX(i) : positions.getZ(i);
    const v = vAxis === "y" ? positions.getY(i) : positions.getZ(i);
    uv.setXY(i, u / uSize, v / vSize);
  }
  geometry.setAttribute("uv", uv);
}

export function frame(parent: T.Object3D, width: number, height: number, depth: number, rail: number, material: T.Material) {
  for (const sign of [-1, 1]) {
    box(parent, [width, rail, depth], material, [0, sign * (height - rail) / 2, 0]);
    box(parent, [rail, height - 2 * rail, depth], material, [sign * (width - rail) / 2, 0, 0]);
  }
}

export function disc(parent: T.Object3D, radius: number, depth: number, material: T.Material, at: P3) {
  return mesh(parent, new T.CylinderGeometry(radius, radius, depth, 24), material, at);
}

export function ring(parent: T.Object3D, radius: number, thickness: number, material: T.Material, at: P3, arc = Math.PI * 2) {
  return mesh(parent, new T.TorusGeometry(radius, thickness, 6, 28, arc), material, at);
}
