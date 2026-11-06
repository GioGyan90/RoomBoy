import * as T from "three";
import { matte } from "../blueApartment/surfaces";
import { canvasTexture, makeCanvas } from "../roomV4/utils";

export const finish = {
  plaster: matte(0xeacbb0),
  cap: matte(0xe3cfc6),
  cut: matte(0x9f8d86),
  baseboard: matte(0xd3b395),
  walnutDark: matte(0x503322),
  oxblood: matte(0x772d2a),
  oxbloodShadow: matte(0x54201f),
  oxbloodSeam: matte(0x933b34),
  cream: matte(0xf3dfc2),
  linen: matte(0xf9e9d2),
  tanLeather: matte(0x9a603a),
  leatherSeam: matte(0xba8156),
  porcelain: new T.MeshStandardMaterial({ color: 0xf5e4ca, roughness: .36 }),
  brass: new T.MeshStandardMaterial({ color: 0xcda15a, metalness: .39, roughness: .29 }),
  darkBrass: new T.MeshStandardMaterial({ color: 0x8f683e, metalness: .31, roughness: .38 }),
  nickel: new T.MeshStandardMaterial({ color: 0xc1b6a6, metalness: .35, roughness: .30 }),
};

export function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function grain() {
  const { canvas, ctx } = makeCanvas(256, 512);
  const rand = random(276);
  ctx.fillStyle = "#bca28d";
  ctx.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 210; i++) {
    const x = rand() * 256;
    const swing = rand() * 16 - 8;
    ctx.strokeStyle = i % 4 === 0 ? `rgba(255,225,192,${.051 + rand() * .106})` : `rgba(48,29,18,${.033 + rand() * .149})`;
    ctx.lineWidth = .30 + rand() * 1.65;
    ctx.beginPath();
    ctx.moveTo(x, -4);
    ctx.bezierCurveTo(x + swing, 137, x - swing * 1.4, 337, x, 516);
    ctx.stroke();
  }
  for (const [x, y] of [[45, 166], [150, 391], [228, 62]]) {
    for (let i = 1; i <= 8; i++) {
      ctx.strokeStyle = `rgba(62,43,31,${.16 - i * .012})`;
      ctx.lineWidth = .72;
      ctx.beginPath();
      ctx.ellipse(x, y, .9 + i * 1.12, 7 + i * 6.5, .08, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  return canvasTexture(canvas);
}

export function marbleTexture() {
  const size = 768;
  const { canvas, ctx } = makeCanvas(size, size);
  const rand = random(59128);
  ctx.fillStyle = "#38312e";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 43; i++) {
    const x = rand() * size, y = rand() * size, r = 27 + rand() * 198;
    const hue = i % 3 === 0 ? "125,97,72" : i % 3 === 1 ? "13,16,16" : "103,96,84";
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        if (x + dx + r < 0 || x + dx - r > size || y + dy + r < 0 || y + dy - r > size) continue;
        const tint = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
        tint.addColorStop(0, `rgba(${hue},${.12 + (i % 5) * .051})`);
        tint.addColorStop(1, `rgba(${hue},0)`);
        ctx.fillStyle = tint;
        ctx.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
      }
    }
  }
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const trace = (points: [number, number][], color: string, weight: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    for (const offset of [-size, 0, size]) {
      ctx.beginPath();
      points.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y + offset);
        else ctx.lineTo(x, y + offset);
      });
      ctx.stroke();
    }
  };
  for (const [origin, opacity] of [[73, .88], [348, .52], [557, .74], [711, .28]]) {
    const vein: [number, number][] = [];
    for (let i = 0; i <= 56; i++) {
      const t = i / 56;
      const roughness = (rand() - .5) * 27 * Math.sin(t * Math.PI);
      vein.push([size * t, origin - size * t + 31 * Math.sin(t * Math.PI * 4) + 19 * Math.sin(t * Math.PI * 14) + roughness]);
    }
    trace(vein, `rgba(142,98,61,${opacity * .40})`, 8.4);
    trace(vein, `rgba(231,178,105,${opacity * .84})`, 2.8);
    for (let i = 0; i < vein.length - 1; i++) {
      const segment = vein.slice(i, i + 2);
      trace(segment, `rgba(251,237,218,${opacity * (.40 + rand() * .60)})`, .62 + rand() * 2.2);
      if (i % 6 !== 2) continue;
      const [x, y] = vein[i];
      const direction = i % 4 ? 1 : -1;
      const branch = Array.from({ length: 6 }, (_, j): [number, number] =>
        [x + j * (5 + rand() * 3), y + j * (3 + rand() * 7) * direction]);
      trace(branch, `rgba(237,215,183,${opacity * (.30 + rand() * .44)})`, .70 + rand() * .55);
    }
  }
  for (let i = 0; i < 5700; i++) {
    ctx.fillStyle = i % 3 ? "rgba(207,182,153,.055)" : "rgba(19,14,12,.13)";
    ctx.fillRect(rand() * size, rand() * size, .5 + rand() * 2, .45 + rand() * 1.2);
  }
  const map = canvasTexture(canvas);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}

function weave(ctx: CanvasRenderingContext2D, width: number, height: number, seed: number) {
  const rand = random(seed);
  for (let i = 0; i < width * height / 8; i++) {
    ctx.fillStyle = i % 3 ? "rgba(82,54,36,.095)" : "rgba(255,237,209,.16)";
    ctx.fillRect(rand() * width, rand() * height, .6 + rand() * 1.3, .9);
  }
}

function lozenge(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  ctx.moveTo(x - radius, y);
  ctx.lineTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.closePath();
  ctx.stroke();
}

export function carpetTexture() {
  const { canvas, ctx } = makeCanvas(160, 160);
  ctx.fillStyle = "#c9a788";
  ctx.fillRect(0, 0, 160, 160);
  ctx.strokeStyle = "rgba(122,87,62,.24)";
  ctx.lineWidth = .72;
  for (let y = 0; y <= 160; y += 20) {
    for (let x = (y % 40) / 2 - 10; x <= 170; x += 20) {
      lozenge(ctx, x, y, 10);
      lozenge(ctx, x, y, 4.2);
    }
  }
  weave(ctx, 160, 160, 997);
  const map = canvasTexture(canvas);
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.anisotropy = 4;
  return map;
}

export function rugTexture(kind: "lounge" | "bed" | "entry", width: number, depth: number) {
  const w = 640, h = Math.round(w * depth / width);
  const { canvas, ctx } = makeCanvas(w, h);
  const dark = kind === "bed" ? "#a98262" : "#702e2b";
  const line = kind === "bed" ? "#e0c19b" : "#e7c6a0";
  const border = kind === "lounge" ? 36 : 25;
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = kind === "bed" ? "#c59e7a" : "#d4b18b";
  ctx.fillRect(border, border, w - 2 * border, h - 2 * border);
  ctx.strokeStyle = line;
  ctx.lineWidth = 2.6;
  for (const inset of [5.5, border - 8, border + 3.5]) ctx.strokeRect(inset, inset, w - 2 * inset, h - 2 * inset);
  if (kind === "lounge") {
    ctx.lineWidth = 3.1;
    for (const x of [border, w - border]) {
      for (const y of [border, h - border]) {
        const sx = x === border ? 1 : -1, sy = y === border ? 1 : -1;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(sx, sy);
        ctx.strokeRect(-13, -13, 25, 25);
        ctx.strokeRect(-7, -7, 29, 29);
        ctx.restore();
      }
    }
  }
  ctx.strokeStyle = "rgba(139,95,69,.18)";
  ctx.lineWidth = .58;
  for (let y = border + 16; y < h - border - 12; y += 19) {
    for (let x = border + 17; x < w - border - 12; x += 22) lozenge(ctx, x, y, 6.5);
  }
  weave(ctx, w, h, 17);
  const map = canvasTexture(canvas);
  map.anisotropy = 4;
  return map;
}

export function suiteMaterials() {
  const wood = grain();
  const marble = marbleTexture();
  return {
    walnut: new T.MeshStandardMaterial({ color: 0xaa7852, map: wood, roughness: .68 }),
    walnutLight: new T.MeshStandardMaterial({ color: 0xc19166, map: wood, roughness: .64 }),
    panel: new T.MeshStandardMaterial({ color: 0x9e6d47, map: wood, roughness: .70 }),
    marble: new T.MeshStandardMaterial({ map: marble, roughness: .28, metalness: .075 }),
    stoneFloor: new T.MeshStandardMaterial({ map: marble, roughness: .51, metalness: .035 }),
    carpet: new T.MeshStandardMaterial({ map: carpetTexture(), roughness: 1 }),
  };
}

export type SuiteMaterials = ReturnType<typeof suiteMaterials>;
