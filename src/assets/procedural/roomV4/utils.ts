import * as THREE from "three";
import { ROOM_SCALE } from "./definitions";

/* ------------------------------------------------------------------ */
/*  Deterministic pseudo random                                        */
/* ------------------------------------------------------------------ */
let seed = 20240607;
export function rand(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}
export function randRange(min: number, max: number): number {
  return min + (max - min) * rand();
}

/* ------------------------------------------------------------------ */
/*  Toon shading                                                       */
/* ------------------------------------------------------------------ */
let gradientTexture: THREE.DataTexture | null = null;

export function toonGradient(): THREE.DataTexture {
  if (gradientTexture) return gradientTexture;
  const data = new Uint8Array([92, 158, 214, 255]);
  const texture = new THREE.DataTexture(data, data.length, 1, THREE.RedFormat);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  gradientTexture = texture;
  return texture;
}

const toonCache = new Map<string, THREE.MeshToonMaterial>();

export function toon(
  color: THREE.ColorRepresentation,
  opts: THREE.MeshToonMaterialParameters = {},
): THREE.MeshToonMaterial {
  if (Object.keys(opts).length === 0) {
    const key = String(color);
    const cached = toonCache.get(key);
    if (cached) return cached;
    const material = new THREE.MeshToonMaterial({ color, gradientMap: toonGradient() });
    toonCache.set(key, material);
    return material;
  }
  return new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), ...opts });
}

/* ------------------------------------------------------------------ */
/*  Cartoon outlines                                                   */
/* ------------------------------------------------------------------ */
const outlineMaterials = new Map<number, THREE.ShaderMaterial>();

export function outlineMaterial(thickness: number): THREE.ShaderMaterial {
  const cached = outlineMaterials.get(thickness);
  if (cached) return cached;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uThickness: { value: thickness * ROOM_SCALE },
      uColor: { value: new THREE.Color(0x2b2438) },
    },
    vertexShader: /* glsl */ `
      uniform float uThickness;
      void main() {
        vec3 n = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        mv.xyz += n * uThickness;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      void main() {
        gl_FragColor = vec4(uColor, 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  outlineMaterials.set(thickness, material);
  return material;
}

export function addOutline(mesh: THREE.Mesh, thickness = 0.03): void {
  const outline = new THREE.Mesh(mesh.geometry, outlineMaterial(thickness));
  outline.raycast = () => {};
  outline.castShadow = false;
  outline.receiveShadow = false;
  mesh.add(outline);
}

/* ------------------------------------------------------------------ */
/*  Geometry helpers                                                   */
/* ------------------------------------------------------------------ */
export interface MeshOpts {
  cast?: boolean;
  receive?: boolean;
  outline?: number;
}

function finish(mesh: THREE.Mesh, opts: MeshOpts): THREE.Mesh {
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  if (opts.outline && opts.outline > 0) addOutline(mesh, opts.outline);
  return mesh;
}

export function bmesh(
  w: number,
  h: number,
  d: number,
  materialOrColor: THREE.Material | THREE.ColorRepresentation,
  x = 0,
  y = 0,
  z = 0,
  opts: MeshOpts = {},
): THREE.Mesh {
  const material =
    materialOrColor instanceof THREE.Material ? materialOrColor : toon(materialOrColor);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  return finish(mesh, opts);
}

export function cyl(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  segments: number,
  materialOrColor: THREE.Material | THREE.ColorRepresentation,
  x = 0,
  y = 0,
  z = 0,
  opts: MeshOpts = {},
): THREE.Mesh {
  const material =
    materialOrColor instanceof THREE.Material ? materialOrColor : toon(materialOrColor);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material,
  );
  mesh.position.set(x, y, z);
  return finish(mesh, opts);
}

export function sph(
  radius: number,
  segments: number,
  materialOrColor: THREE.Material | THREE.ColorRepresentation,
  x = 0,
  y = 0,
  z = 0,
  opts: MeshOpts = {},
): THREE.Mesh {
  const material =
    materialOrColor instanceof THREE.Material ? materialOrColor : toon(materialOrColor);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, Math.max(4, segments / 2)), material);
  mesh.position.set(x, y, z);
  return finish(mesh, opts);
}

/* ------------------------------------------------------------------ */
/*  Extruded walls (single clean mesh, real window / door holes)       */
/* ------------------------------------------------------------------ */
export function wallShape(
  points: [number, number][],
  holes: [number, number][][] = [],
): THREE.Shape {
  const shape = new THREE.Shape();
  points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
  shape.closePath();
  for (const hole of holes) {
    const path = new THREE.Path();
    hole.forEach(([x, y], i) => (i === 0 ? path.moveTo(x, y) : path.lineTo(x, y)));
    path.closePath();
    shape.holes.push(path);
  }
  return shape;
}

export function extrudeWall(
  shape: THREE.Shape,
  depth: number,
  material: THREE.Material,
  outline = 0,
): THREE.Mesh {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    steps: 1,
    curveSegments: 1,
  });
  geometry.translate(0, 0, -depth / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (outline > 0) addOutline(mesh, outline);
  return mesh;
}

/* ------------------------------------------------------------------ */
/*  Curtains (pleated plane)                                           */
/* ------------------------------------------------------------------ */
export function curtainMesh(
  width: number,
  height: number,
  folds: number,
  material: THREE.Material,
): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, height, Math.max(10, folds * 4), 4);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const u = x / width + 0.5;
    const t = (height / 2 - y) / height;
    const amplitude = 0.085 * (0.4 + t * 0.6);
    position.setZ(i, Math.sin(u * Math.PI * 2 * folds) * amplitude);
  }
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/* ------------------------------------------------------------------ */
/*  Canvas textures                                                    */
/* ------------------------------------------------------------------ */
export function makeCanvas(w: number, h: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  return { canvas, ctx };
}

export function canvasTexture(canvas: HTMLCanvasElement, rx = 1, ry = 1): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(rx, ry);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

export function makeWoodFloorTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = "#b07c47";
  ctx.fillRect(0, 0, 512, 512);
  const rowHeight = 64;
  for (let row = 0; row < 8; row++) {
    const y = row * rowHeight;
    const offset = (row % 2) * 96;
    for (let col = -1; col < 4; col++) {
      const x = col * 176 + offset;
      const f = 0.87 + rand() * 0.26;
      ctx.fillStyle = `rgb(${(214 * f) | 0}, ${(166 * f) | 0}, ${(108 * f) | 0})`;
      ctx.fillRect(x + 1.5, y + 1.5, 173, rowHeight - 3);
      ctx.strokeStyle = "rgba(126, 84, 44, 0.16)";
      ctx.lineWidth = 1.4;
      for (let g = 0; g < 3; g++) {
        const gy = y + 14 + g * 16 + rand() * 4;
        ctx.beginPath();
        ctx.moveTo(x + 8, gy);
        ctx.bezierCurveTo(x + 60, gy - 5, x + 112, gy + 5, x + 168, gy - 1);
        ctx.stroke();
      }
    }
    ctx.fillStyle = "rgba(96, 60, 30, 0.30)";
    ctx.fillRect(0, y, 512, 2);
  }
  return canvasTexture(canvas, 3, 3);
}

export function makePlaidTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = "#7cbdd1";
  ctx.fillRect(0, 0, 256, 256);
  const bands = (color: string, size: number, gap: number, offset: number) => {
    ctx.fillStyle = color;
    for (let i = offset; i < 256 + size; i += gap) {
      ctx.fillRect(i, 0, size, 256);
      ctx.fillRect(0, i, 256, size);
    }
  };
  bands("rgba(255, 255, 255, 0.30)", 22, 64, 6);
  bands("rgba(46, 104, 132, 0.34)", 10, 64, 34);
  bands("rgba(255, 255, 255, 0.55)", 3, 64, 52);
  return canvasTexture(canvas, 2, 2);
}

export function makeRugTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = "#e2c69f";
  ctx.fillRect(0, 0, 256, 256);
  let y = 0;
  while (y < 256) {
    const h = 6 + rand() * 16;
    ctx.fillStyle = rand() > 0.5 ? "rgba(196, 154, 116, 0.55)" : "rgba(247, 232, 210, 0.7)";
    ctx.fillRect(0, y, 256, h);
    y += h + 5;
  }
  ctx.strokeStyle = "rgba(160, 118, 84, 0.65)";
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, 246, 246);
  return canvasTexture(canvas, 1, 1);
}

export function makeTileTexture(repeat = 2): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 256);
  ctx.fillStyle = "#e8f2f2";
  ctx.fillRect(0, 0, 256, 256);
  const size = 64;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const f = 0.94 + rand() * 0.08;
      ctx.fillStyle = `rgb(${(222 * f) | 0}, ${(236 * f) | 0}, ${(238 * f) | 0})`;
      ctx.fillRect(x * size + 2, y * size + 2, size - 4, size - 4);
    }
  }
  ctx.strokeStyle = "rgba(150, 178, 186, 0.75)";
  ctx.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(i * size, 0);
    ctx.lineTo(i * size, 256);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * size);
    ctx.lineTo(256, i * size);
    ctx.stroke();
  }
  return canvasTexture(canvas, repeat, repeat);
}

export function makeScreenTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 192);
  ctx.fillStyle = "#16222c";
  ctx.fillRect(0, 0, 256, 192);

  ctx.fillStyle = "#2b4a5e";
  ctx.fillRect(18, 16, 220, 132);
  ctx.fillStyle = "#3d6880";
  ctx.fillRect(18, 16, 220, 17);

  ctx.fillStyle = "#9ff0cf";
  ctx.fillRect(24, 21, 34, 7);
  ctx.fillStyle = "#7f9bb0";
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(150 + i * 22, 21, 12, 7);
  }

  ctx.fillStyle = "#8be3c0";
  const lines = [34, 52, 70, 88, 106, 124];
  for (let i = 0; i < lines.length; i++) {
    const w = 60 + ((i * 37) % 90);
    ctx.globalAlpha = 0.85;
    ctx.fillRect(30, lines[i], w, 6);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#f2c860";
  ctx.fillRect(30, 124, 40, 6);
  ctx.fillStyle = "#e6846a";
  ctx.fillRect(96, 124, 24, 6);

  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  for (let y = 0; y < 192; y += 4) {
    ctx.fillRect(0, y, 256, 2);
  }

  ctx.fillStyle = "#101c24";
  ctx.fillRect(0, 158, 256, 34);
  ctx.fillStyle = "#2a4152";
  ctx.fillRect(10, 164, 40, 22);
  ctx.fillStyle = "#9ff0cf";
  ctx.fillRect(62, 170, 80, 8);

  return canvasTexture(canvas, 1, 1);
}

export function makeGlowTexture(): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(128, 128);
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.32, "rgba(255, 244, 208, 0.55)");
  gradient.addColorStop(1, "rgba(255, 240, 200, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makePosterTexture(kind: number): THREE.CanvasTexture {
  const { canvas, ctx } = makeCanvas(256, 192);
  if (kind === 0) {
    const sky = ctx.createLinearGradient(0, 0, 0, 192);
    sky.addColorStop(0, "#f7b98c");
    sky.addColorStop(0.55, "#f2d6a6");
    sky.addColorStop(1, "#cfe6d4");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 256, 192);

    ctx.fillStyle = "#fdf3d0";
    ctx.beginPath();
    ctx.arc(178, 74, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#8fa8bb";
    ctx.beginPath();
    ctx.moveTo(-10, 192);
    ctx.lineTo(70, 84);
    ctx.lineTo(150, 192);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#6f8ba3";
    ctx.beginPath();
    ctx.moveTo(90, 192);
    ctx.lineTo(180, 100);
    ctx.lineTo(268, 192);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#f8f2e2";
    ctx.beginPath();
    ctx.moveTo(70, 84);
    ctx.lineTo(88, 110);
    ctx.lineTo(52, 110);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#7fae7d";
    ctx.fillRect(0, 170, 256, 22);
  } else {
    ctx.fillStyle = "#2c3350";
    ctx.fillRect(0, 0, 256, 192);
    ctx.fillStyle = "#f7ecc9";
    ctx.beginPath();
    ctx.arc(196, 52, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2c3350";
    ctx.beginPath();
    ctx.arc(184, 44, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f8e3c4";
    ctx.beginPath();
    ctx.arc(110, 128, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(78, 92);
    ctx.lineTo(88, 62);
    ctx.lineTo(106, 90);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(142, 92);
    ctx.lineTo(132, 62);
    ctx.lineTo(114, 90);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#2c3350";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(96, 126, 8, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(124, 126, 8, 0.15, Math.PI - 0.15);
    ctx.stroke();

    ctx.fillStyle = "#7ef0cd";
    for (let i = 0; i < 22; i++) {
      const x = (i * 73) % 256;
      const y = (i * 41) % 60;
      ctx.globalAlpha = 0.35 + ((i * 13) % 50) / 100;
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  return canvasTexture(canvas, 1, 1);
}
