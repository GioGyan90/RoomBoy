import * as THREE from "three";
import { BED, CHAIR, COLORS, DESK, ROOM, ROOM_SCALE, WINDOW } from "./definitions";
import {
  bmesh,
  curtainMesh,
  cyl,
  extrudeWall,
  makeGlowTexture,
  makePlaidTexture,
  makePosterTexture,
  makeRugTexture,
  makeScreenTexture,
  makeTileTexture,
  makeWoodFloorTexture,
  rand,
  randRange,
  sph,
  toon,
  wallShape,
} from "./utils";

export type RoomProp = "lamps" | "monitor" | "curtains";
type InteractInfo = { id: RoomProp; label: string; hint: string };

export interface LampRig {
  group: THREE.Group;
  shade: THREE.Mesh;
  light: THREE.PointLight;
  halo: THREE.Sprite;
}

export interface Refs {
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  ambient: THREE.AmbientLight;
  deskLamp: LampRig;
  nightLamp: LampRig;
  bathLight: THREE.PointLight;
  monitorScreen: THREE.Mesh;
  monitorLight: THREE.PointLight;
  monitorHalo: THREE.Sprite;
  curtainL: THREE.Group;
  curtainR: THREE.Group;
  fanBlades: THREE.Group;
  dust: THREE.Points;
}

/* ------------------------------------------------------------------ */
/*  Small shared builders                                              */
/* ------------------------------------------------------------------ */
function makeGlowHalo(color: number, size: number): THREE.Sprite {
  const material = new THREE.SpriteMaterial({
    map: makeGlowTexture(),
    color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.setScalar(size);
  return sprite;
}

function buildTableLamp(shadeColor: number): LampRig {
  const group = new THREE.Group();

  group.add(cyl(0.15, 0.19, 0.07, 10, toon(COLORS.woodDark), 0, 0.035, 0, { outline: 0.012 }));
  group.add(cyl(0.035, 0.035, 0.5, 8, toon(COLORS.metal), 0, 0.32, 0));

  const shadeMaterial = toon(shadeColor, {
    emissive: new THREE.Color(0xffca7a),
    emissiveIntensity: 0,
    side: THREE.DoubleSide,
  });
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.32, 12, 1, true), shadeMaterial);
  shade.position.y = 0.7;
  shade.castShadow = true;
  group.add(shade);

  group.add(cyl(0.055, 0.055, 0.04, 10, toon(0xfff3d0), 0, 0.66, 0));

  const light = new THREE.PointLight(0xffcf96, 0, 6.5 * ROOM_SCALE, 2);
  light.position.set(0, 0.6, 0);
  group.add(light);

  const halo = makeGlowHalo(0xffd9a0, 1.7);
  halo.position.y = 0.68;
  group.add(halo);

  return { group, shade, light, halo };
}

function buildPlant(potColor: number, scale = 1): THREE.Group {
  const group = new THREE.Group();
  group.add(cyl(0.2, 0.15, 0.28, 8, toon(potColor), 0, 0.14, 0, { outline: 0.014 }));
  group.add(cyl(0.22, 0.22, 0.06, 8, toon(potColor), 0, 0.31, 0));
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const leaf = sph(0.18, 7, toon(i % 2 ? COLORS.leaf : COLORS.leafDeep));
    leaf.scale.set(1.1, 0.34, 0.68);
    leaf.position.set(
      Math.cos(angle) * 0.16,
      0.4 + (i % 3) * 0.07,
      Math.sin(angle) * 0.16,
    );
    leaf.rotation.set(0.32, angle, 0.22);
    group.add(leaf);
  }
  group.scale.setScalar(scale);
  return group;
}

function setInteractive(object: THREE.Object3D, info: InteractInfo): void {
  object.userData.interactive = info;
}

/* ------------------------------------------------------------------ */
/*  Shell : floor, walls, window, curtains                             */
/* ------------------------------------------------------------------ */
function buildShell(root: THREE.Group): void {
  const half = ROOM.half;
  const height = ROOM.wallH;
  const thickness = ROOM.wallT;
  const outer = half * 2 + thickness;
  const inner = half - thickness / 2;

  const cream = toon(COLORS.cream);
  const mint = toon(COLORS.mint);
  const mintDark = toon(COLORS.mintDark);
  const creamDark = toon(COLORS.creamDark);

  /* base slab ------------------------------------------------------ */
  root.add(
    bmesh(outer + 0.75, 0.62, outer + 0.75, toon(COLORS.cut), 0, -0.31, 0, { outline: 0.06 }),
  );
  root.add(
    bmesh(outer + 0.42, 0.14, outer + 0.42, toon(0xa9a2c4), 0, -0.06, 0, {
      outline: 0.0,
      cast: false,
    }),
  );

  /* wooden floor --------------------------------------------------- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(outer - thickness, outer - thickness),
    toon(0xffffff, { map: makeWoodFloorTexture() }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.012;
  floor.receiveShadow = true;
  root.add(floor);

  /* back wall with window hole ------------------------------------- */
  const backShape = wallShape(
    [
      [-outer / 2, 0],
      [outer / 2, 0],
      [outer / 2, height],
      [-outer / 2, height],
    ],
    [
      [
        [WINDOW.x0, WINDOW.y0],
        [WINDOW.x1, WINDOW.y0],
        [WINDOW.x1, WINDOW.y1],
        [WINDOW.x0, WINDOW.y1],
      ],
    ],
  );
  const backWall = extrudeWall(backShape, thickness, cream, 0.055);
  backWall.position.set(0, 0, -half);
  root.add(backWall);

  /* left wall ------------------------------------------------------ */
  const leftShape = wallShape([
    [-outer / 2, 0],
    [outer / 2, 0],
    [outer / 2, height],
    [-outer / 2, height],
  ]);
  const leftWall = extrudeWall(leftShape, thickness, cream, 0.055);
  leftWall.rotation.y = -Math.PI / 2;
  leftWall.position.set(-half, 0, 0);
  root.add(leftWall);

  /* wainscot + trim + skirting ------------------------------------- */
  const wainscotH = 1.8;
  root.add(bmesh(outer - thickness, wainscotH, 0.04, mint, 0, wainscotH / 2, -inner + 0.03));
  root.add(bmesh(0.04, wainscotH, outer - thickness, mint, -inner + 0.03, wainscotH / 2, 0));
  root.add(bmesh(outer - thickness, 0.09, 0.08, mintDark, 0, wainscotH, -inner + 0.045));
  root.add(bmesh(0.08, 0.09, outer - thickness, mintDark, -inner + 0.045, wainscotH, 0));
  root.add(bmesh(outer - thickness, 0.17, 0.09, creamDark, 0, 0.085, -inner + 0.05));
  root.add(bmesh(0.09, 0.17, outer - thickness, creamDark, -inner + 0.05, 0.085, 0));
}

function buildWindow(root: THREE.Group, refs: Refs): void {
  const frameMat = toon(0xfdf8ee);
  /* window frame --------------------------------------------------- */
  const winW = WINDOW.x1 - WINDOW.x0;
  const winH = WINDOW.y1 - WINDOW.y0;
  const winCX = (WINDOW.x0 + WINDOW.x1) / 2;
  const winCY = (WINDOW.y0 + WINDOW.y1) / 2;
  const zc = -ROOM.half;
  const bar = 0.11;

  root.add(bmesh(winW + 0.42, bar, 0.46, frameMat, winCX, WINDOW.y1 + bar / 2, zc, { outline: 0.02 }));
  root.add(bmesh(winW + 0.42, bar, 0.46, frameMat, winCX, WINDOW.y0 - bar / 2, zc, { outline: 0.02 }));
  root.add(bmesh(bar, winH + 0.22, 0.46, frameMat, WINDOW.x0 - bar / 2, winCY, zc, { outline: 0.02 }));
  root.add(bmesh(bar, winH + 0.22, 0.46, frameMat, WINDOW.x1 + bar / 2, winCY, zc, { outline: 0.02 }));
  root.add(bmesh(winW + 0.9, 0.13, 0.42, frameMat, winCX, WINDOW.y0 - 0.06, zc + 0.36, { outline: 0.02 }));

  for (let i = 1; i < 4; i++) {
    root.add(bmesh(0.07, winH, 0.12, frameMat, WINDOW.x0 + (winW / 4) * i, winCY, zc));
  }
  for (let j = 1; j < 3; j++) {
    root.add(bmesh(winW, 0.07, 0.12, frameMat, winCX, WINDOW.y0 + (winH / 3) * j, zc));
  }

  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(winW, winH),
    new THREE.MeshBasicMaterial({
      color: 0xe6f5ff,
      transparent: true,
      opacity: 0.13,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  glass.position.set(winCX, winCY, zc);
  root.add(glass);

  /* curtain rod + curtains ------------------------------------------ */
  const rod = cyl(0.05, 0.05, winW + 1.6, 8, toon(COLORS.woodDark), winCX, WINDOW.y1 + 0.35, zc + 0.46);
  rod.rotation.z = Math.PI / 2;
  root.add(rod);
  for (const side of [-1, 1]) {
    const cap = sph(0.09, 8, toon(COLORS.woodDark), winCX + side * (winW / 2 + 0.8), WINDOW.y1 + 0.35, zc + 0.46);
    root.add(cap);
  }

  const curtainMaterial = toon(0xf6e9d2, { side: THREE.DoubleSide });
  const curtainW = 2.0;
  const curtainH = 2.95;
  const curtainY = WINDOW.y1 + 0.3 - curtainH / 2;

  const leftCurtain = new THREE.Group();
  const leftMesh = curtainMesh(curtainW, curtainH, 6, curtainMaterial);
  leftMesh.position.x = curtainW / 2;
  leftCurtain.add(leftMesh);
  leftCurtain.position.set(winCX - 1.95, curtainY, zc + 0.5);

  const rightCurtain = new THREE.Group();
  const rightMesh = curtainMesh(curtainW, curtainH, 6, curtainMaterial);
  rightMesh.position.x = -curtainW / 2;
  rightCurtain.add(rightMesh);
  rightCurtain.position.set(winCX + 1.95, curtainY, zc + 0.5);

  setInteractive(leftCurtain, { id: "curtains", label: "Curtains", hint: "Click to draw" });
  setInteractive(rightCurtain, { id: "curtains", label: "Curtains", hint: "Click to draw" });
  root.add(leftCurtain, rightCurtain);
  refs.curtainL = leftCurtain;
  refs.curtainR = rightCurtain;
}

/* ------------------------------------------------------------------ */
/*  Bed                                                                */
/* ------------------------------------------------------------------ */
function buildBed(root: THREE.Group): void {
  const wood = toon(COLORS.wood);
  const woodDark = toon(COLORS.woodDark);

  root.add(bmesh(BED.length, 0.44, BED.depth, wood, BED.x, 0.46, BED.z, { outline: 0.03 }));
  for (const sx of [-5.5, -2.2]) {
    for (const sz of [-3.2, -0.7]) {
      root.add(bmesh(0.22, 0.5, 0.22, woodDark, sx, 0.25, sz));
    }
  }
  root.add(bmesh(0.22, 1.75, 2.9, wood, -5.66, 0.87, -1.95, { outline: 0.03 }));
  root.add(bmesh(0.26, 0.12, 3.0, toon(COLORS.woodLight), -5.66, 1.78, -1.95));

  root.add(bmesh(3.4, 0.42, 2.76, toon(0xf8f2e4), -3.82, 0.88, -1.95, { outline: 0.02 }));
  root.add(bmesh(3.42, 0.08, 2.78, toon(0xfffbf1), -3.82, 1.09, -1.95));

  const blanket = bmesh(2.35, BED.blanketHeight, 2.88, toon(0xffffff, { map: makePlaidTexture() }), -3.25, BED.blanketY, BED.z, {
    outline: 0.022,
  });
  root.add(blanket);
  root.add(bmesh(0.34, 0.2, 2.88, toon(0xeef6f7), -4.52, 1.2, -1.95));

  const pillow = bmesh(0.95, 0.36, 2.05, toon(0xfdfaf2), -5.05, 1.27, -1.95, { outline: 0.022 });
  pillow.rotation.z = 0.07;
  root.add(pillow);

  const pillow2 = bmesh(0.62, 0.24, 0.9, toon(0xf6dfc4), -4.78, 1.28, -2.65, { outline: 0.016 });
  pillow2.rotation.z = -0.18;
  root.add(pillow2);
}

/* ------------------------------------------------------------------ */
/*  Nightstand + lamp                                                  */
/* ------------------------------------------------------------------ */
function buildNightstand(root: THREE.Group, refs: Refs): void {
  const group = new THREE.Group();
  group.position.set(-5.12, 0, 0.62);

  group.add(bmesh(1.24, 1.3, 1.2, toon(COLORS.wood), 0, 0.68, 0, { outline: 0.028 }));
  group.add(bmesh(1.34, 0.1, 1.3, toon(COLORS.woodLight), 0, 1.38, 0, { outline: 0.02 }));
  for (const sz of [-0.5, 0.5]) {
    for (const sx of [-0.5, 0.5]) {
      group.add(bmesh(0.13, 0.2, 0.13, toon(COLORS.woodDark), sx, 0.1, sz));
    }
  }
  for (let i = 0; i < 2; i++) {
    group.add(bmesh(0.08, 0.42, 1.05, toon(COLORS.woodLight), 0.62, 0.95 - i * 0.56, 0));
    group.add(sph(0.055, 8, toon(COLORS.metal), 0.68, 0.95 - i * 0.56, 0));
  }

  const lamp = buildTableLamp(COLORS.accentYellow);
  lamp.group.position.set(0, 1.43, -0.2);
  group.add(lamp.group);
  setInteractive(lamp.group, { id: "lamps", label: "Night Lamp", hint: "Click to toggle" });
  refs.nightLamp = lamp;

  const clock = new THREE.Group();
  clock.add(bmesh(0.32, 0.2, 0.12, toon(0xe9e3d6), 0, 0, 0, { outline: 0.01 }));
  clock.add(bmesh(0.24, 0.13, 0.02, new THREE.MeshBasicMaterial({ color: 0x4ad6a8 }), 0.02, 0, 0.07));
  clock.position.set(0.02, 1.53, 0.38);
  clock.rotation.y = -0.3;
  group.add(clock);

  const bookColors = [0xd9534f, 0x5b8ec4, 0xefc25b];
  for (let i = 0; i < 3; i++) {
    const book = bmesh(0.5, 0.07, 0.36, toon(bookColors[i]), -0.05, 1.46 + i * 0.075, 0.34);
    book.rotation.y = 0.1 * i;
    group.add(book);
  }

  const mug = cyl(0.1, 0.09, 0.18, 10, toon(0xfbf3e6), 0.35, 1.52, 0.34, { outline: 0.01 });
  group.add(mug);

  root.add(group);
}

/* ------------------------------------------------------------------ */
/*  Desk + monitor + desk lamp + chair                                 */
/* ------------------------------------------------------------------ */
function buildDesk(root: THREE.Group, refs: Refs): void {
  const wood = toon(COLORS.wood);
  const woodLight = toon(COLORS.woodLight);
  const woodDark = toon(COLORS.woodDark);

  const desk = new THREE.Group();
  desk.position.set(DESK.x, 0, DESK.z);

  desk.add(bmesh(3.5, 0.14, 1.42, woodLight, 0, 1.82, 0, { outline: 0.028 }));
  desk.add(bmesh(0.13, 1.8, 1.3, wood, -1.66, 0.9, 0, { outline: 0.02 }));
  desk.add(bmesh(0.13, 1.8, 1.3, wood, 1.66, 0.9, 0, { outline: 0.02 }));
  desk.add(bmesh(3.3, 0.1, 0.1, wood, 0, 1.0, -0.6));

  desk.add(bmesh(0.92, 0.52, 1.2, wood, -1.12, 1.52, 0, { outline: 0.02 }));
  desk.add(bmesh(0.05, 0.34, 0.9, woodDark, -0.64, 1.52, 0));
  desk.add(sph(0.05, 8, toon(COLORS.metal), -0.62, 1.52, 0));

  /* monitor -------------------------------------------------------- */
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(-1.1, 0, -0.42);

  monitorGroup.add(bmesh(0.62, 0.2, 0.52, toon(0xe7dcc4), 0, 2.03, 0, { outline: 0.02 }));
  monitorGroup.add(bmesh(0.4, 0.34, 0.34, toon(0xd8cbb0), 0, 2.22, 0.02));
  monitorGroup.add(bmesh(1.5, 1.18, 1.14, toon(0xece2cc), 0, 2.92, 0, { outline: 0.03 }));

  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.26, 0.94),
    new THREE.MeshBasicMaterial({ map: makeScreenTexture(), toneMapped: false }),
  );
  screen.position.set(0, 2.92, 0.58);
  monitorGroup.add(screen);
  refs.monitorScreen = screen;

  monitorGroup.add(bmesh(1.36, 0.05, 0.06, toon(0xd4c9b2), 0, 2.42, 0.585));
  monitorGroup.add(bmesh(0.06, 0.03, 0.02, new THREE.MeshBasicMaterial({ color: 0x8ef3c1 }), 0.6, 2.36, 0.585));

  const monitorLight = new THREE.PointLight(0x9fd9ff, 0, 4.5 * ROOM_SCALE, 2);
  monitorLight.position.set(0, 2.9, 1.2);
  monitorGroup.add(monitorLight);
  refs.monitorLight = monitorLight;

  const halo = makeGlowHalo(0x9fd9ff, 2.4);
  halo.position.set(0, 2.92, 0.72);
  monitorGroup.add(halo);
  refs.monitorHalo = halo;

  setInteractive(monitorGroup, { id: "monitor", label: "CRT Monitor", hint: "Click to toggle" });
  desk.add(monitorGroup);

  /* keyboard + mouse ----------------------------------------------- */
  const keyboard = bmesh(1.26, 0.09, 0.42, toon(0xe8dfc9), 0, 1.94, 0.42, { outline: 0.014 });
  keyboard.rotation.x = -0.04;
  desk.add(keyboard);
  desk.add(bmesh(1.14, 0.02, 0.32, toon(0xcfc4ab), 0, 1.98, 0.42));

  desk.add(bmesh(0.62, 0.02, 0.46, toon(0x7fbdd1), 1.0, 1.9, 0.44));
  desk.add(bmesh(0.18, 0.09, 0.26, toon(0xf4ecdc), 1.0, 1.96, 0.44, { outline: 0.012 }));

  /* desk lamp ------------------------------------------------------ */
  const deskLamp = buildTableLamp(COLORS.accent);
  deskLamp.group.position.set(1.32, 1.89, -0.42);
  deskLamp.group.rotation.y = -0.5;
  desk.add(deskLamp.group);
  setInteractive(deskLamp.group, { id: "lamps", label: "Desk Lamp", hint: "Click to toggle" });
  refs.deskLamp = deskLamp;

  /* books, mug, papers, plant -------------------------------------- */
  const bookColors = [0xd9534f, 0x5b8ec4, 0xefc25b, 0x7fb08a];
  for (let i = 0; i < 4; i++) {
    const book = bmesh(0.56, 0.09, 0.4, toon(bookColors[i]), -1.32, 1.94 + i * 0.095, 0.36);
    book.rotation.y = -0.12 + i * 0.08;
    desk.add(book);
  }

  desk.add(bmesh(0.55, 0.012, 0.72, toon(0xfaf4e6), 0.55, 1.9, 0.18));
  desk.add(bmesh(0.5, 0.012, 0.66, toon(0xfdf8ec), 0.62, 1.905, 0.24));

  const mug = cyl(0.11, 0.1, 0.2, 10, toon(0xea8b68), 0.12, 1.99, 0.5, { outline: 0.012 });
  desk.add(mug);
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.06, 0.018, 6, 10),
    toon(0xea8b68),
  );
  handle.position.set(0.24, 2.0, 0.5);
  handle.rotation.y = Math.PI / 2;
  desk.add(handle);

  const plant = buildPlant(0xc9b08a, 0.62);
  plant.position.set(-2.02, 1.89, 0.28);
  desk.add(plant);

  root.add(desk);
}

function buildChair(root: THREE.Group): void {
  const wood = toon(COLORS.wood);
  const woodDark = toon(COLORS.woodDark);
  const chair = new THREE.Group();
  chair.position.set(CHAIR.x, 0, CHAIR.z);
  chair.rotation.y = CHAIR.rotation;
  chair.scale.y = CHAIR.heightScale;

  chair.add(bmesh(1.02, 0.12, 1.0, wood, 0, 1.06, 0, { outline: 0.024 }));
  chair.add(bmesh(0.92, CHAIR.cushionHeight, 0.9, toon(COLORS.fabric), 0, CHAIR.cushionY, 0, { outline: 0.018 }));
  for (const sx of [-0.42, 0.42]) {
    for (const sz of [-0.4, 0.4]) {
      chair.add(bmesh(0.1, 1.06, 0.1, woodDark, sx, 0.53, sz));
    }
  }

  /* backrest + cushion share one tilted frame, so the cushion sits
     flat against the back panel instead of crossing it at 90°       */
  const backFrame = new THREE.Group();
  backFrame.position.set(0, 1.62, -0.45);
  backFrame.rotation.x = -0.09;

  backFrame.add(bmesh(1.02, 0.92, 0.11, wood, 0, 0, 0, { outline: 0.024 }));

  const backCushion = bmesh(0.84, 0.72, 0.13, toon(COLORS.fabricDeep), 0, -0.03, 0.12, {
    outline: 0.016,
  });
  backFrame.add(backCushion);

  /* piping / seam detail on the cushion face ------------------------ */
  backFrame.add(bmesh(0.74, 0.05, 0.03, toon(COLORS.fabric), 0, 0.28, 0.19));

  chair.add(backFrame);

  root.add(chair);
}

/* ------------------------------------------------------------------ */
/*  Wardrobe                                                           */
/* ------------------------------------------------------------------ */
function buildWardrobe(root: THREE.Group): void {
  const group = new THREE.Group();
  group.position.set(3.32, 0, -5.12);

  const wood = toon(COLORS.wood);

  group.add(bmesh(2.3, 4.8, 1.58, wood, 0, 2.4, 0, { outline: 0.035 }));
  group.add(bmesh(2.42, 0.14, 1.68, toon(COLORS.woodLight), 0, 4.86, 0, { outline: 0.025 }));

  for (const sx of [-0.56, 0.56]) {
    group.add(bmesh(1.06, 4.3, 0.09, toon(COLORS.woodLight), sx, 2.5, 0.82, { outline: 0.02 }));
    group.add(bmesh(0.8, 3.6, 0.05, toon(0xb57d47), sx, 2.55, 0.88));
    group.add(cyl(0.035, 0.035, 0.34, 8, toon(COLORS.metal), sx + (sx < 0 ? 0.42 : -0.42), 2.5, 0.92));
  }

  for (const sx of [-0.9, 0.9]) {
    for (const sz of [-0.55, 0.55]) {
      group.add(bmesh(0.16, 0.22, 0.16, toon(COLORS.woodDark), sx, 0.11, sz));
    }
  }

  const box1 = bmesh(0.95, 0.58, 0.85, toon(0xf0dcc0), -0.5, 5.22, 0.05, { outline: 0.018 });
  group.add(box1);
  group.add(bmesh(0.99, 0.1, 0.16, toon(0xe8a68a), -0.5, 5.25, 0.05));
  group.add(bmesh(0.16, 0.6, 0.89, toon(0xe8a68a), -0.5, 5.22, 0.05));

  const box2 = bmesh(0.7, 0.5, 0.66, toon(0x7fbdd1), 0.5, 5.18, 0.02, { outline: 0.018 });
  group.add(box2);
  group.add(bmesh(0.74, 0.08, 0.12, toon(0xf7f2e6), 0.5, 5.18, 0.02));

  root.add(group);
}

/* ------------------------------------------------------------------ */
/*  Bookshelf                                                          */
/* ------------------------------------------------------------------ */
function buildBookshelf(root: THREE.Group): void {
  const group = new THREE.Group();
  group.position.set(5.15, 0, -5.0);

  const wood = toon(COLORS.wood);
  const shelfWood = toon(COLORS.woodLight);

  group.add(bmesh(0.1, 3.3, 1.2, wood, -0.62, 1.65, 0, { outline: 0.022 }));
  group.add(bmesh(0.1, 3.3, 1.2, wood, 0.62, 1.65, 0, { outline: 0.022 }));
  group.add(bmesh(1.34, 0.09, 1.2, shelfWood, 0, 3.28, 0, { outline: 0.022 }));
  group.add(bmesh(1.24, 3.3, 0.08, toon(0xb57d47), 0, 1.65, -0.56));

  const shelfY = [0.12, 1.16, 2.2];
  for (const y of shelfY) {
    group.add(bmesh(1.24, 0.07, 1.14, shelfWood, 0, y, 0.02));
  }

  const bookColors = [0xd9534f, 0x5b8ec4, 0xefc25b, 0x7fb08a, 0xb98bc9, 0xe89a6a, 0x6bb7c4];
  for (const y of shelfY) {
    let x = -0.52;
    while (x < 0.44) {
      const w = randRange(0.08, 0.14);
      const h = randRange(0.52, 0.78);
      const color = bookColors[Math.floor(rand() * bookColors.length)];
      const book = bmesh(w, h, 0.62, toon(color), x, y + 0.035 + h / 2, 0.05);
      if (rand() < 0.12) book.rotation.z = randRange(-0.24, 0.24);
      group.add(book);
      x += w + 0.014;
      if (rand() < 0.16) x += 0.05;
    }
  }

  const plant = buildPlant(0xc07a5a, 0.95);
  plant.position.set(-0.25, 3.32, 0.0);
  group.add(plant);

  const frame = bmesh(0.4, 0.5, 0.06, toon(0xf0e4cd), 0.3, 3.56, -0.1, { outline: 0.012 });
  frame.rotation.y = 0.18;
  group.add(frame);
  group.add(bmesh(0.3, 0.4, 0.02, toon(0x8fbcd1), 0.3, 3.56, -0.06));

  root.add(group);
}

/* ------------------------------------------------------------------ */
/*  Floor fan + laundry basket                                         */
/* ------------------------------------------------------------------ */
function buildFan(root: THREE.Group, refs: Refs): void {
  const group = new THREE.Group();
  group.position.set(4.72, 0, -3.15);
  group.rotation.y = -0.55;

  group.add(cyl(0.36, 0.42, 0.12, 12, toon(0xe4ecef), 0, 0.06, 0, { outline: 0.02 }));
  group.add(cyl(0.055, 0.055, 1.24, 8, toon(0xd7e0e4), 0, 0.68, 0));

  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  head.rotation.x = -0.12;

  const backDisc = cyl(0.46, 0.46, 0.16, 16, toon(0xdde6ea), 0, 0, -0.12);
  backDisc.rotation.x = Math.PI / 2;
  head.add(backDisc);

  const blades = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const blade = bmesh(0.18, 0.62, 0.03, toon(0xf6e9cd), Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0.02, {
      outline: 0.01,
    });
    blade.rotation.z = angle - Math.PI / 2;
    blades.add(blade);
  }
  head.add(blades);
  refs.fanBlades = blades;

  head.add(cyl(0.11, 0.11, 0.12, 10, toon(0xc9d5db), 0, 0, 0.06));
  head.add(cyl(0.09, 0.09, 0.05, 8, toon(COLORS.metal), 0, 0, 0.13));

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.035, 6, 22), toon(0xeef4f6));
  ring.position.z = 0.14;
  head.add(ring);
  for (let i = 0; i < 6; i++) {
    const spoke = bmesh(0.02, 0.98, 0.02, toon(0xeef4f6), 0, 0, 0.14);
    spoke.rotation.z = (i / 6) * Math.PI;
    head.add(spoke);
  }

  group.add(head);
  root.add(group);
}

function buildLaundryBasket(root: THREE.Group): void {
  const group = new THREE.Group();
  group.position.set(5.24, 0, -0.85);
  group.rotation.y = 0.3;

  group.add(cyl(0.44, 0.36, 0.86, 12, toon(0xe8d9bd), 0, 0.43, 0, { outline: 0.024 }));
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.44 - i * 0.03, 0.022, 5, 16), toon(0xcbb391));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.2 + i * 0.26;
    group.add(ring);
  }
  const towel1 = bmesh(0.34, 0.3, 0.24, toon(0x7fbdd1), -0.06, 0.9, 0.02, { outline: 0.012 });
  towel1.rotation.z = 0.2;
  group.add(towel1);
  const towel2 = bmesh(0.26, 0.24, 0.2, toon(0xf3c860), 0.12, 0.94, -0.08, { outline: 0.012 });
  towel2.rotation.z = -0.3;
  group.add(towel2);

  root.add(group);
}

/* ------------------------------------------------------------------ */
/*  Rug + slippers                                                     */
/* ------------------------------------------------------------------ */
function buildRug(root: THREE.Group): void {
  const rug = bmesh(3.2, 0.06, 2.1, toon(0xffffff, { map: makeRugTexture() }), -3.0, 0.035, 2.15, {
    outline: 0.02,
  });
  root.add(rug);

  /* softly rounded, oval house slippers ----------------------------- */
  const slipper = (x: number, z: number, rot: number, soleColor: number, strapColor: number) => {
    const group = new THREE.Group();

    /* sole : a low cylinder squashed into an ellipse ----------------- */
    const sole = cyl(0.155, 0.15, 0.085, 16, toon(soleColor), 0, 0.045, 0, { outline: 0.012 });
    sole.scale.set(1, 1, 2.1);
    group.add(sole);

    /* thin inner footbed -------------------------------------------- */
    const footbed = cyl(0.135, 0.135, 0.016, 16, toon(0xfdf6ea), 0, 0.092, 0);
    footbed.scale.set(1, 1, 2.14);
    group.add(footbed);

    /* arched strap over the toes ------------------------------------ */
    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.045, 6, 12, Math.PI),
      toon(strapColor),
    );
    strap.position.set(0, 0.081, -0.13);
    strap.scale.set(1.02, 0.92, 1);
    strap.castShadow = true;
    group.add(strap);

    /* fluffy trim where the strap meets the sole ---------------------- */
    const trimL = sph(0.05, 6, toon(0xfffaf0), -0.14, 0.1, -0.13);
    trimL.scale.set(0.9, 0.8, 1.1);
    group.add(trimL);
    const trimR = sph(0.05, 6, toon(0xfffaf0), 0.14, 0.1, -0.13);
    trimR.scale.set(0.9, 0.8, 1.1);
    group.add(trimR);

    group.position.set(x, 0, z);
    group.rotation.y = rot;
    root.add(group);
  };

  slipper(-2.7, 2.5, 0.22, 0x6ba8c4, 0x8fc7db);
  slipper(-2.2, 2.62, -0.14, 0x6ba8c4, 0x8fc7db);
}

/* ------------------------------------------------------------------ */
/*  Entry : door, mat, shoes, coat rack                                */
/* ------------------------------------------------------------------ */
function buildEntry(root: THREE.Group): void {
  const doorZ = 4.1;
  const doorW = 1.78;
  const doorH = 4.35;
  const x = -5.78;

  const frame = toon(COLORS.woodDark);
  root.add(bmesh(0.22, doorH + 0.2, 0.14, frame, x, (doorH + 0.2) / 2, doorZ - doorW / 2 - 0.07, { outline: 0.02 }));
  root.add(bmesh(0.22, doorH + 0.2, 0.14, frame, x, (doorH + 0.2) / 2, doorZ + doorW / 2 + 0.07, { outline: 0.02 }));
  root.add(bmesh(0.22, 0.16, doorW + 0.28, frame, x, doorH + 0.16, doorZ, { outline: 0.02 }));

  const door = bmesh(0.12, doorH, doorW, toon(COLORS.wood), x + 0.02, doorH / 2, doorZ, { outline: 0.026 });
  root.add(door);

  for (const dz of [-0.4, 0.4]) {
    root.add(bmesh(0.04, 1.4, 0.6, toon(COLORS.woodLight), x + 0.09, 3.0, doorZ + dz));
    root.add(bmesh(0.04, 1.2, 0.6, toon(COLORS.woodLight), x + 0.09, 1.3, doorZ + dz));
  }
  root.add(sph(0.1, 10, toon(COLORS.metal), x + 0.14, 2.25, doorZ + 0.64));
  root.add(cyl(0.04, 0.04, 0.22, 8, toon(COLORS.metal), x + 0.1, 2.25, doorZ + 0.72));

  root.add(bmesh(1.7, 0.05, 1.9, toon(0x5b8fa3), -5.0, 0.03, doorZ, { outline: 0.014 }));

  const shoe = (sx: number, sz: number, rot: number, color: number) => {
    const group = new THREE.Group();
    const sole = cyl(0.13, 0.12, 0.07, 14, toon(0xece4d4), 0, 0.035, 0);
    sole.scale.set(1, 1, 2.2);
    group.add(sole);
    group.add(bmesh(0.24, 0.16, 0.4, toon(color), 0, 0.12, -0.05));
    group.add(bmesh(0.24, 0.11, 0.18, toon(color), 0, 0.1, 0.19));
    group.position.set(sx, 0, sz);
    group.rotation.y = rot;
    root.add(group);
  };
  shoe(-4.72, 3.9, 0.15, 0x4a5b76);
  shoe(-4.45, 3.95, 0.05, 0x4a5b76);
  shoe(-4.75, 4.45, -0.2, 0x8a6b56);
  shoe(-4.5, 4.5, -0.1, 0x8a6b56);
  shoe(-4.9, 3.35, 0.35, 0x6ba8c4);

  /* coat rack ------------------------------------------------------ */
  root.add(bmesh(0.12, 0.16, 1.5, toon(COLORS.woodDark), -5.74, 3.22, 2.3, { outline: 0.018 }));
  for (const pz of [1.78, 2.3, 2.82]) {
    const peg = cyl(0.045, 0.045, 0.28, 6, toon(COLORS.woodDark), -5.62, 3.24, pz);
    peg.rotation.z = Math.PI / 2;
    root.add(peg);
  }

  const coat = new THREE.Group();
  coat.add(bmesh(0.16, 1.5, 0.86, toon(0x6f9ec9), 0, 0, 0, { outline: 0.02 }));
  coat.add(bmesh(0.14, 0.9, 0.22, toon(0x6f9ec9), 0.02, -0.1, -0.5));
  coat.add(bmesh(0.14, 0.9, 0.22, toon(0x6f9ec9), 0.02, -0.1, 0.5));
  coat.position.set(-5.6, 2.5, 1.85);
  coat.rotation.y = 0.04;
  root.add(coat);

  const bag = new THREE.Group();
  bag.add(bmesh(0.2, 0.72, 0.62, toon(0xd9c4a3), 0, 0, 0, { outline: 0.018 }));
  bag.add(bmesh(0.22, 0.12, 0.64, toon(0xbfa888), 0, 0.38, 0));
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 6, 14, Math.PI), toon(0xbfa888));
  strap.position.set(0, 0.4, 0);
  strap.rotation.y = Math.PI / 2;
  bag.add(strap);
  bag.position.set(-5.6, 2.05, 2.8);
  root.add(bag);
}

/* ------------------------------------------------------------------ */
/*  Bathroom                                                           */
/* ------------------------------------------------------------------ */
function buildBathroom(root: THREE.Group, refs: Refs): void {
  const bath = ROOM.bath;
  const cream = toon(COLORS.cream);
  const ceramic = toon(COLORS.ceramic);
  const metal = toon(COLORS.metal);

  const doorwayZ0 = bath.doorZ0;
  const doorwayZ1 = bath.doorZ1;
  const wallEnd = 5.9;

  /* partition along z = bath.z0 ------------------------------------ */
  const partA = extrudeWall(
    wallShape([
      [1.25, 0],
      [5.9, 0],
      [5.9, bath.wallH],
      [1.25, bath.wallH],
    ]),
    0.3,
    cream,
    0.045,
  );
  partA.position.set(0, 0, bath.z0);
  root.add(partA);

  /* partition along x = bath.x0 with doorway ------------------------ */
  const partBShape = wallShape([
    [1.25, 0],
    [doorwayZ0, 0],
    [doorwayZ0, bath.doorH],
    [doorwayZ1, bath.doorH],
    [doorwayZ1, 0],
    [wallEnd, 0],
    [wallEnd, bath.wallH],
    [1.25, bath.wallH],
  ]);
  const partB = extrudeWall(partBShape, 0.3, cream, 0.045);
  partB.rotation.y = -Math.PI / 2;
  partB.position.set(bath.x0, 0, 0);
  root.add(partB);

  root.add(
    bmesh(0.34, 0.06, doorwayZ1 - doorwayZ0, toon(0xc9d5d8), bath.x0, 0.03, (doorwayZ0 + doorwayZ1) / 2),
  );

  /* tiles ----------------------------------------------------------- */
  const wallTiles = toon(0xffffff, { map: makeTileTexture(2.4) });
  const trim = toon(COLORS.mintDark);
  const tileH = 2.0;

  /* wall A : unbroken run */
  root.add(bmesh(4.5, tileH, 0.03, wallTiles, 3.6, tileH / 2, bath.z0 + 0.16, { cast: false }));
  root.add(bmesh(4.5, 0.1, 0.08, trim, 3.6, tileH, bath.z0 + 0.19, { cast: false }));

  /* wall B : split into two panels so the doorway stays completely
     clear (the old single 4.2-unit panel covered the entrance)       */
  const tileX = bath.x0 + 0.16;
  const nearLen = doorwayZ0 - 1.45;
  const farLen = wallEnd - doorwayZ1;

  root.add(bmesh(0.03, tileH, nearLen, wallTiles, tileX, tileH / 2, 1.45 + nearLen / 2, { cast: false }));
  root.add(bmesh(0.03, tileH, farLen, wallTiles, tileX, tileH / 2, doorwayZ1 + farLen / 2, { cast: false }));

  root.add(bmesh(0.08, 0.1, nearLen, trim, bath.x0 + 0.19, tileH, 1.45 + nearLen / 2, { cast: false }));
  root.add(bmesh(0.08, 0.1, farLen, trim, bath.x0 + 0.19, tileH, doorwayZ1 + farLen / 2, { cast: false }));

  /* door frame ------------------------------------------------------ */
  const frameMat = toon(COLORS.woodLight);
  const jambH = bath.doorH + 0.08;
  root.add(bmesh(0.44, jambH, 0.12, frameMat, bath.x0, jambH / 2, doorwayZ0 - 0.06, { outline: 0.016 }));
  root.add(bmesh(0.44, jambH, 0.12, frameMat, bath.x0, jambH / 2, doorwayZ1 + 0.06, { outline: 0.016 }));
  root.add(
    bmesh(0.44, 0.14, doorwayZ1 - doorwayZ0 + 0.24, frameMat, bath.x0, bath.doorH + 0.07,
      (doorwayZ0 + doorwayZ1) / 2, { outline: 0.016 }),
  );

  /* door leaf, swung open into the bathroom -------------------------- */
  const hinge = new THREE.Group();
  hinge.position.set(bath.x0, 0, doorwayZ1 - 0.04);
  hinge.rotation.y = -1.15;

  const leafLen = doorwayZ1 - doorwayZ0 - 0.12;
  hinge.add(bmesh(0.08, bath.doorH - 0.1, leafLen, toon(COLORS.wood), 0, (bath.doorH - 0.1) / 2, -leafLen / 2, {
    outline: 0.02,
  }));
  hinge.add(bmesh(0.1, 0.66, leafLen - 0.34, toon(COLORS.woodLight), 0, 1.9, -leafLen / 2));
  hinge.add(bmesh(0.1, 0.66, leafLen - 0.34, toon(COLORS.woodLight), 0, 0.8, -leafLen / 2));
  hinge.add(sph(0.055, 8, toon(COLORS.metal), 0.08, 1.08, -leafLen + 0.2));
  hinge.add(sph(0.055, 8, toon(COLORS.metal), -0.08, 1.08, -leafLen + 0.2));
  root.add(hinge);

  const bathFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(4.28, 4.28),
    toon(0xffffff, { map: makeTileTexture(3) }),
  );
  bathFloor.rotation.x = -Math.PI / 2;
  bathFloor.position.set(3.68, 0.02, 3.68);
  bathFloor.receiveShadow = true;
  root.add(bathFloor);

  /* sink ------------------------------------------------------------ */
  root.add(cyl(0.16, 0.23, 0.8, 8, ceramic, 2.6, 0.4, 1.96, { outline: 0.02 }));
  root.add(bmesh(0.96, 0.3, 0.64, ceramic, 2.6, 0.95, 1.96, { outline: 0.024 }));
  root.add(bmesh(1.04, 0.07, 0.7, ceramic, 2.6, 1.13, 1.96));
  root.add(bmesh(0.8, 0.04, 0.48, toon(0xdfeef1), 2.6, 1.17, 1.98, { cast: false }));

  root.add(cyl(0.035, 0.035, 0.3, 8, metal, 2.6, 1.31, 1.8));
  const spout = cyl(0.032, 0.032, 0.28, 8, metal, 2.6, 1.45, 1.9);
  spout.rotation.x = Math.PI / 2;
  root.add(spout);
  root.add(cyl(0.05, 0.05, 0.05, 8, metal, 2.6, 1.31, 1.8));

  root.add(bmesh(1.0, 1.06, 0.05, toon(COLORS.woodLight), 2.6, 2.25, bath.z0 + 0.18, { outline: 0.018 }));
  root.add(bmesh(0.88, 0.94, 0.04, new THREE.MeshBasicMaterial({ color: 0xcfe8f0 }), 2.6, 2.25, bath.z0 + 0.21));
  root.add(bmesh(0.5, 0.04, 0.04, new THREE.MeshBasicMaterial({ color: 0xffffff }), 2.75, 2.5, bath.z0 + 0.23));

  root.add(cyl(0.06, 0.055, 0.18, 8, toon(0xf2e2c9), 2.15, 1.26, 2.1, { outline: 0.01 }));
  root.add(cyl(0.06, 0.05, 0.12, 8, toon(0x8fc7db), 3.05, 1.23, 2.12, { outline: 0.01 }));

  /* towel ring on partition B --------------------------------------- */
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 6, 14), metal);
  ring.position.set(bath.x0 + 0.24, 1.75, 2.9);
  ring.rotation.y = Math.PI / 2;
  root.add(ring);
  root.add(bmesh(0.06, 0.72, 0.44, toon(0xf3c860), bath.x0 + 0.26, 1.34, 2.9, { outline: 0.014 }));

  /* toilet ---------------------------------------------------------- */
  root.add(bmesh(0.86, 0.95, 0.36, ceramic, 4.25, 1.6, 1.8, { outline: 0.024 }));
  root.add(bmesh(0.94, 0.1, 0.42, ceramic, 4.25, 2.1, 1.8));
  root.add(cyl(0.08, 0.08, 0.04, 10, metal, 4.25, 2.17, 1.8));
  root.add(bmesh(0.5, 0.72, 0.6, ceramic, 4.25, 0.36, 2.35, { outline: 0.02 }));
  root.add(cyl(0.44, 0.32, 0.42, 12, ceramic, 4.25, 0.92, 2.45, { outline: 0.024 }));
  root.add(cyl(0.49, 0.49, 0.1, 14, ceramic, 4.25, 1.16, 2.45, { outline: 0.02 }));
  root.add(cyl(0.47, 0.47, 0.07, 14, toon(0xeaf4f4), 4.25, 1.24, 2.45));
  root.add(bmesh(0.14, 0.18, 0.3, ceramic, 4.25, 0.75, 1.95));

  /* paper holder ---------------------------------------------------- */
  root.add(bmesh(0.05, 0.3, 0.05, metal, 3.55, 1.75, bath.z0 + 0.2));
  const paper = cyl(0.14, 0.14, 0.2, 10, toon(0xfdfaf2), 3.55, 1.6, bath.z0 + 0.35, { outline: 0.01 });
  paper.rotation.z = Math.PI / 2;
  root.add(paper);

  /* shower ---------------------------------------------------------- */
  root.add(cyl(0.04, 0.04, 1.3, 8, metal, 5.3, 2.45, bath.z0 + 0.2));
  const arm = cyl(0.035, 0.035, 0.42, 8, metal, 5.3, 3.05, bath.z0 + 0.38);
  arm.rotation.x = Math.PI / 2;
  root.add(arm);
  const head = cyl(0.24, 0.11, 0.13, 12, metal, 5.3, 3.0, bath.z0 + 0.6, { outline: 0.014 });
  root.add(head);
  root.add(cyl(0.1, 0.1, 0.08, 8, metal, 5.3, 1.35, bath.z0 + 0.24));

  root.add(cyl(0.17, 0.17, 0.02, 12, toon(0x9fb2b8), 4.6, 0.03, 3.2));
  root.add(bmesh(1.3, 0.03, 0.85, toon(0xd7e9ec), 3.5, 0.045, 3.4, { outline: 0.012 }));

  /* bathroom light -------------------------------------------------- */
  const bathLight = new THREE.PointLight(0xffe6bd, 0, 7 * ROOM_SCALE, 2);
  bathLight.position.set(3.6, 2.7, 3.6);
  root.add(bathLight);
  refs.bathLight = bathLight;
}

/* ------------------------------------------------------------------ */
/*  Posters                                                            */
/* ------------------------------------------------------------------ */
function buildPosters(root: THREE.Group): void {
  const makePoster = (kind: number, y: number, z: number, w: number, h: number) => {
    const group = new THREE.Group();
    group.add(bmesh(0.06, h + 0.12, w + 0.12, toon(COLORS.woodDark), 0, 0, 0, { outline: 0.014 }));
    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      toon(0xffffff, { map: makePosterTexture(kind) }),
    );
    art.rotation.y = Math.PI / 2;
    art.position.x = 0.04;
    group.add(art);
    group.position.set(-5.79, y, z);
    root.add(group);
  };
  makePoster(0, 4.05, -3.35, 1.25, 0.92);
  makePoster(1, 3.85, -1.95, 1.0, 0.76);
}

/* ------------------------------------------------------------------ */
/*  Dust motes                                                         */
/* ------------------------------------------------------------------ */
function buildDust(root: THREE.Group, refs: Refs): void {
  const count = 190;
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = randRange(-4.6, 1.6);
    positions[i * 3 + 1] = randRange(0.2, 5.2);
    positions[i * 3 + 2] = randRange(-5.6, -0.4);
    speeds[i] = randRange(0.05, 0.24);
    phases[i] = randRange(0, Math.PI * 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.userData.speeds = speeds;
  geometry.userData.phases = phases;

  const material = new THREE.PointsMaterial({
    size: 0.09,
    map: makeGlowTexture(),
    color: 0xfff0c8,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  root.add(points);
  refs.dust = points;
}

/* ------------------------------------------------------------------ */
/*  Lights                                                             */
/* ------------------------------------------------------------------ */
function buildLights(root: THREE.Group, refs: Refs): void {
  const hemi = new THREE.HemisphereLight(0xd6ecff, 0xf0d7b4, 1.55);
  hemi.position.set(0, 14, 0);
  root.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.42);
  root.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff0cf, 2.75);
  sun.position.set(5, 11, -14);
  sun.target.position.set(-1, 0, -1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const cam = sun.shadow.camera;
  cam.left = -12 * ROOM_SCALE;
  cam.right = 12 * ROOM_SCALE;
  cam.top = 12 * ROOM_SCALE;
  cam.bottom = -12 * ROOM_SCALE;
  cam.near = ROOM_SCALE;
  cam.far = 48 * ROOM_SCALE;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.028 * ROOM_SCALE;
  root.add(sun);
  root.add(sun.target);

  const fill = new THREE.DirectionalLight(0xbfd4ff, 0.4);
  fill.position.set(11, 7, 13);
  root.add(fill);

  refs.hemi = hemi;
  refs.ambient = ambient;
  refs.sun = sun;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */
export function createRoomV4() {
  const root = new THREE.Group();
  root.name = "room-v4";
  const refs = {} as Refs;

  // Keep the room root in world units so registered replacement assets keep their scale.
  function addGroup(name: string, build?: (group: THREE.Group) => void): THREE.Group {
    const group = new THREE.Group();
    group.name = name;
    group.scale.setScalar(ROOM_SCALE);
    build?.(group);
    root.add(group);
    return group;
  }

  const registry = new Map([
    ["shell", addGroup("shell", buildShell)],
    ["window", addGroup("window", group => buildWindow(group, refs))],
    ["outside", addGroup("outside")],
    ["bed", addGroup("bed", buildBed)],
    ["desk", addGroup("desk", group => buildDesk(group, refs))],
    ["chair", addGroup("chair", buildChair)],
    ["wardrobe", addGroup("wardrobe", buildWardrobe)],
    ["shelves", addGroup("shelves", buildBookshelf)],
    ["decor", addGroup("decor", buildPosters)],
    ["props", addGroup("props", group => {
      buildNightstand(group, refs);
      buildFan(group, refs);
      buildLaundryBasket(group);
      buildRug(group);
    })],
  ]);
  addGroup("entry", buildEntry);
  addGroup("bathroom", group => buildBathroom(group, refs));
  addGroup("environment", group => {
    buildDust(group, refs);
    buildLights(group, refs);
  });

  return { root, registry, refs };
}
