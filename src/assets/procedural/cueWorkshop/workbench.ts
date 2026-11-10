import * as T from 'three';
import { box, cylinder, ferrule, group, modelStats, rackBoard, wedge } from './geometry';
import { benchSize as b, workshopVariants, type WorkshopPalette, type WorkshopVariant } from './variants';

function materials(palette: WorkshopPalette, gold: boolean) {
  const paint = (color: number, metalness = 0) => new T.MeshStandardMaterial({
    color, roughness: metalness ? .48 : .80, metalness, flatShading: true,
  });
  return {
    frame: paint(palette.frame), top: paint(palette.top), trim: paint(palette.trim, gold ? .18 : 0),
    drawer: paint(palette.drawer), board: paint(palette.board), machine: paint(palette.machine),
    mat: paint(palette.mat), cue: paint(palette.cue), cueAccent: paint(palette.cueAccent), feet: paint(palette.feet),
    steel: paint(0xacaab0, .12), rail: paint(0x77757e, .12), maple: paint(0xefd6a0),
    cream: paint(0xf2e3bd), leather: paint(0x8f5539), chalk: paint(0x3599c4),
    sandpaper: paint(0xb96562), glue: paint(0xf2dfa9),
  };
}
type Materials = ReturnType<typeof materials>;

function buildFrame(root: T.Group, variant: WorkshopVariant, m: Materials) {
  const frame = group(root, 'bench-frame');
  box(frame, 'tabletop', [b.width, .14, b.depth], m.top, [0, 1.04, 0]);
  for (const x of [-1.30, 1.30]) for (const z of [-.47, .47]) {
    box(frame, 'square-leg', [.14, .90, .14], m.frame, [x, .525, z]);
    box(frame, 'foot-cap', [.17, .075, .17], m.feet, [x, .0375, z]);
  }
  box(frame, 'lower-shelf', [2.72, .09, 1.08], m.frame, [0, .22, 0]);
  box(frame, 'drawer-backing', [2.53, .23, .24], m.frame, [0, .835, .43]);
  const count = workshopVariants[variant].drawers;
  const width = count === 1 ? 2.50 : 1.235;
  for (let i = 0; i < count; i++) {
    const x = count === 1 ? 0 : (i === 0 ? -.6375 : .6375);
    const drawer = group(frame, `drawer-${i + 1}`);
    box(drawer, 'drawer-front', [width, .235, .045], m.drawer, [x, .835, .5875]);
    box(drawer, 'block-handle', [.29, .055, .055], m.trim, [x, .835, .6375]);
  }
  return frame;
}

function file(parent: T.Group, x: number, z: number, m: Materials) {
  const tool = group(parent, 'hanging-file');
  cylinder(tool, 'file-handle', .029, .024, .14, m.trim, [x, 1.972, z]);
  box(tool, 'file-blade', [.073, .21, .022], m.steel, [x, 1.788, z]);
  box(tool, 'file-tang', [.018, .035, .016], m.steel, [x, 1.9025, z]);
}

function buildToolBoard(root: T.Group, variant: WorkshopVariant, m: Materials) {
  const board = group(root, 'tool-board');
  box(board, 'plain-tool-panel', [2.56, 1.02, .055], m.board, [0, 1.62, -.6125]);
  for (const x of [-1.34, 1.34]) box(board, 'panel-post', [.13, 1.17, .13], m.trim, [x, 1.625, -.61]);
  box(board, 'panel-top-rail', [2.81, .11, .13], m.trim, [0, 2.155, -.61]);
  const z = -.57;
  const level = workshopVariants[variant].level;
  file(board, level === 1 ? 0 : level === 2 ? .20 : -.02, z, m);
  if (level >= 2) {
    const square = group(board, 'hanging-square');
    box(square, 'square-vertical', [.058, .29, .026], m.steel, [-.67, 1.865, z]);
    box(square, 'square-head', [.21, .065, .026], m.steel, [-.594, 2.0425, z]);
  }
  if (level === 3) {
    const plane = group(board, 'hanging-hand-plane');
    wedge(plane, 'plane-body', m.trim, [.66, 1.83, -.546]);
    box(plane, 'plane-sole', [.34, .025, .09], m.trim, [.66, 1.82, -.546]);
    cylinder(plane, 'plane-knob', .024, .029, .06, m.trim, [.57, 1.965, -.546]);
  }
  return board;
}

function buildLathe(root: T.Group, variant: WorkshopVariant, m: Materials) {
  const lathe = group(root, 'cue-lathe');
  const z = -.285;
  box(lathe, 'lathe-bed', [2.40, .07, .32], m.rail, [-.14, b.top + .035, z]);
  box(lathe, 'lathe-rail', [1.96, .045, .18], m.steel, [-.12, 1.2025, z]);
  box(lathe, 'headstock', [.34, .38, .34], m.machine, [-1.05, 1.37, z]);
  box(lathe, 'headstock-badge', [.17, .095, .009], m.trim, [-1.05, 1.40, z + .1745]);
  const chuck = variant === 'blackgold' ? m.trim : m.steel;
  cylinder(lathe, 'headstock-collar', .068, .068, .045, m.rail, [-.8575, b.axis, z], 'x');
  cylinder(lathe, 'headstock-chuck', .086, .086, .09, chuck, [-.79, b.axis, z], 'x');
  box(lathe, 'tailstock-foot', [.35, .08, .31], m.machine, [.82, 1.22, z]);
  box(lathe, 'tailstock-support', [.20, .10, .24], m.machine, [.82, 1.31, z]);
  box(lathe, 'tailstock', [.27, .20, .29], m.machine, [.82, 1.43, z]);
  cylinder(lathe, 'tailstock-center', .053, .040, .08, chuck, [.645, b.axis, z], 'x');
  // The shaft endpoints sit inside the centers, avoiding visible floating gaps.
  const shaft = cylinder(lathe, 'mounted-cue-shaft', .012, .018, b.shaftEnd - b.shaftStart,
    m.maple, [(b.shaftEnd + b.shaftStart) / 2, b.axis, z], 'x');
  shaft.userData.repairShaft = true;
  lathe.userData.axis = [0, b.axis, z];
  return lathe;
}

function buildVise(root: T.Group, m: Materials) {
  const vise = group(root, 'bench-vise');
  const x = -1.15, z = .26;
  box(vise, 'vise-base', [.36, .04, .30], m.machine, [x, 1.13, z]);
  box(vise, 'vise-body', [.27, .13, .23], m.machine, [x, 1.215, z]);
  for (const dz of [-.075, .075]) {
    box(vise, 'vise-jaw', [.25, .075, .075], m.machine, [x, 1.3175, z + dz]);
    box(vise, 'soft-jaw-pad', [.25, .022, .075], m.cream, [x, 1.366, z + dz]);
  }
  cylinder(vise, 'vise-screw', .025, .025, .12, m.steel, [x, 1.235, .435], 'z');
  cylinder(vise, 'vise-handle-hub', .033, .033, .04, m.steel, [x, 1.235, .505], 'z');
  cylinder(vise, 'vise-handle', .013, .013, .17, m.steel, [x, 1.235, .525]);
  return vise;
}

function looseButt(parent: T.Group, m: Materials) {
  const butt = group(parent, 'detached-cue-butt');
  const y = b.top + .012 + .028, z = .205;
  const segments = [
    { x: -.638, length: .024, radius: .020, mat: m.steel },
    { x: -.603, length: .046, radius: .024, mat: m.cream },
    { x: -.355, length: .45, radius: .026, mat: m.cue },
    { x: -.105, length: .05, radius: .027, mat: m.cueAccent },
    { x: .18, length: .52, radius: .028, mat: m.cueAccent },
    { x: .465, length: .05, radius: .028, mat: m.cream },
  ];
  for (const [i, part] of segments.entries()) cylinder(butt, `butt-segment-${i}`, part.radius, part.radius,
    part.length, part.mat, [part.x, y, z], 'x');
  return butt;
}

function caliper(parent: T.Group, m: Materials) {
  const tool = group(parent, 'precision-caliper');
  const y = b.top + .022;
  box(tool, 'caliper-beam', [.46, .018, .038], m.steel, [-.43, y, .445]);
  for (const x of [-.64, -.48]) {
    box(tool, 'caliper-jaw', [.025, .018, .14], m.steel, [x, y, .414]);
    box(tool, 'caliper-jaw-tip', [.055, .018, .025], m.steel, [x + (x < -.5 ? .015 : -.015), y, .3565]);
  }
}

function partsTray(parent: T.Group, full: boolean, m: Materials) {
  const tray = group(parent, 'cue-parts-tray');
  const x = 1.12, z = .18, w = .43, d = .33;
  const material = full ? m.trim : m.top;
  box(tray, 'tray-floor', [w, .025, d], material, [x, b.top + .0125, z]);
  for (const sign of [-1, 1]) {
    box(tray, 'tray-side', [.022, .055, d], material, [x + sign * (w / 2 - .011), 1.1625, z]);
    box(tray, 'tray-end', [w - .044, .055, .022], material, [x, 1.1625, z + sign * (d / 2 - .011)]);
  }
  const tips = full ? [[-.12, -.06], [-.035, -.06], [-.12, .055], [-.035, .055]] : [[-.12, 0], [0, 0], [.12, 0]];
  for (const [dx, dz] of tips) cylinder(tray, 'leather-tip', .036, .036, .045, m.leather, [x + dx, 1.1575, z + dz]);
  if (full) for (const [dx, dz] of [[.075, -.06], [.15, -.06], [.075, .055]]) {
    ferrule(tray, m.cream, [x + dx, 1.135, z + dz]);
  }
  return tray;
}

function buildSurface(root: T.Group, variant: WorkshopVariant, m: Materials) {
  const surface = group(root, 'work-surface');
  const level = workshopVariants[variant].level;
  box(surface, 'protective-mat', [1.77, .012, .68], m.mat, [-.08, b.top + .006, .255]);
  looseButt(surface, m);
  if (level === 3) cylinder(surface, 'spare-maple-shaft', .012, .017, 1.45, m.maple, [-.02, 1.139, .075], 'x');
  box(surface, 'sandpaper', [.245, level === 1 ? .035 : .009, .155], m.sandpaper,
    [.51, b.top + .012 + (level === 1 ? .0175 : .0045), .445]);
  if (level >= 2) {
    buildVise(root, m);
    caliper(surface, m);
    partsTray(surface, level === 3, m);
  }
  if (level === 1) box(surface, 'chalk-cube', [.075, .075, .075], m.chalk, [.746, 1.1595, .448]);
  if (level === 3) {
    for (const x of [1.02, 1.15]) box(surface, 'chalk-cube', [.082, .082, .082], m.chalk, [x, b.top + .041, .503]);
    const glue = group(surface, 'cue-glue-bottle');
    cylinder(glue, 'glue-bottle', .059, .059, .18, m.glue, [1.19, b.top + .09, -.228]);
    cylinder(glue, 'glue-shoulder', .025, .059, .045, m.glue, [1.19, b.top + .2025, -.228]);
    cylinder(glue, 'glue-nozzle', .007, .025, .085, m.glue, [1.19, b.top + .2675, -.228]);
  }
  return surface;
}

function uprightCue(parent: T.Group, x: number, z: number, i: number, m: Materials, gold: boolean) {
  const cue = group(parent, `standing-cue-${i + 1}`);
  const bottom = b.shelfTop;
  const segments = [
    { h: .045, r0: .029, r1: .029, mat: m.cue },
    { h: .045, r0: .028, r1: .028, mat: m.cream },
    { h: .625, r0: .025, r1: .028, mat: i === 0 ? m.cue : m.cueAccent },
    { h: .035, r0: .025, r1: .025, mat: gold ? m.trim : m.cue },
    { h: 1.15, r0: .013, r1: .025, mat: m.maple },
    { h: .022, r0: .013, r1: .013, mat: m.leather },
  ];
  let y = bottom;
  for (const [index, part] of segments.entries()) {
    cylinder(cue, `cue-section-${index}`, part.r0, part.r1, part.h, part.mat, [x, y + part.h / 2, z]);
    y += part.h;
  }
  return cue;
}

function buildRack(root: T.Group, variant: WorkshopVariant, m: Materials) {
  const rack = group(root, 'cue-rack');
  const count = workshopVariants[variant].cues;
  const width = count === 1 ? .27 : .51;
  const sockets = count === 1 ? [0] : [-.11, .11];
  const x = b.rackX, z = b.rackZ;
  box(rack, 'rack-bottom-board', [width, .09, .36], m.trim, [x, .22, z]);
  box(rack, 'rack-lower-bracket', [.53, .075, .13], m.frame, [1.49, .22, z - .10]);
  box(rack, 'rack-upper-bracket', [.47, .075, .13], m.frame, [1.49, .9525, z - .10]);
  for (const dx of [-width / 2 + .035, width / 2 - .035]) {
    box(rack, 'rack-post', [.055, .715, .055], m.frame, [x + dx, .6225, z - .14]);
  }
  rackBoard(rack, width, sockets, m.trim, [x, .98, z]);
  for (const [i, dx] of sockets.entries()) uprightCue(rack, x + dx, z, i, m, variant === 'blackgold');
  return rack;
}

function caseHandle(parent: T.Group, x: number, y: number, z: number, m: Materials) {
  for (const dx of [-.09, .09]) box(parent, 'handle-post', [.035, .055, .027], m.trim, [x + dx, y, z]);
  box(parent, 'handle-bridge', [.215, .025, .027], m.trim, [x, y - .0275, z]);
}

function buildStorage(root: T.Group, variant: WorkshopVariant, m: Materials) {
  const storage = group(root, 'storage');
  if (variant === 'citrus') return storage;
  const full = variant === 'blackgold';
  const x = full ? .29 : 0;
  const caseGroup = group(storage, 'long-cue-case');
  box(caseGroup, 'case-body', [1.66, .17, .43], full ? m.frame : m.top, [x, .35, .135]);
  box(caseGroup, 'case-lid', [1.68, .06, .45], m.machine, [x, .465, .135]);
  if (full) box(caseGroup, 'case-gold-edge', [1.685, .016, .455], m.trim, [x, .435, .135]);
  caseHandle(caseGroup, x, .39, .366, m);
  if (full) {
    const toolbox = group(storage, 'tool-box');
    box(toolbox, 'toolbox-body', [.49, .32, .43], m.machine, [-.99, .425, .075]);
    box(toolbox, 'toolbox-lid', [.51, .045, .45], m.frame, [-.99, .6075, .075]);
    for (const dx of [-.085, .085]) box(toolbox, 'toolbox-handle-foot', [.03, .05, .04], m.trim, [-.99 + dx, .655, .075]);
    box(toolbox, 'toolbox-handle', [.20, .025, .04], m.trim, [-.99, .6925, .075]);
  }
  return storage;
}

export function createCueWorkbench(variant: WorkshopVariant) {
  const root = new T.Group();
  root.name = `cue-workbench-${variant}`;
  const spec = workshopVariants[variant];
  const m = materials(spec.palette, variant === 'blackgold');
  buildFrame(root, variant, m);
  buildToolBoard(root, variant, m);
  buildLathe(root, variant, m);
  buildSurface(root, variant, m);
  buildRack(root, variant, m);
  buildStorage(root, variant, m);
  root.userData.variant = variant;
  root.userData.level = spec.level;
  root.userData.stats = modelStats(root);
  return root;
}
