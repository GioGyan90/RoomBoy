import * as THREE from 'three';
import {refineRoom} from './roomDetails';
import {rand} from '../../core/math';
import {createMaterials} from './materials';
import {skyTexture,calendarTexture} from './textures';
import {ROOM,HW,HD,RH,WIN,BED,DESK,CHAIR} from '../layout';
export function createRoom(){
const MAT=createMaterials();
const registry=new Map<string,THREE.Group>();
let active:THREE.Group;
/* =========================================================
   4 · room
   ========================================================= */


const room = new THREE.Group();
room.name="room";

function addBox(w:number,h:number,d:number,mat:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=active){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
  m.position.set(x,y,z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

active = new THREE.Group(); active.name="shell"; room.add(active); registry.set("shell",active);
/* --- floor & ceiling --- */
{
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w+3, ROOM.d+3), MAT.floor);
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  active.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), new THREE.MeshStandardMaterial({color:0xfbf4ea, roughness:1, side:THREE.DoubleSide}));
  ceil.rotation.x = Math.PI/2;
  ceil.position.y = RH;
  ceil.receiveShadow = true;
  active.add(ceil);
  room.userData.ceiling = ceil;
}

/* --- back wall with a real window hole (so sunlight pours in) --- */

{
  const shape = new THREE.Shape();
  shape.moveTo(-HW, 0); shape.lineTo(HW, 0); shape.lineTo(HW, RH); shape.lineTo(-HW, RH); shape.lineTo(-HW, 0);
  const hole = new THREE.Path();
  hole.moveTo(WIN.x0, WIN.y0); hole.lineTo(WIN.x0, WIN.y1);
  hole.lineTo(WIN.x1, WIN.y1); hole.lineTo(WIN.x1, WIN.y0); hole.lineTo(WIN.x0, WIN.y0);
  shape.holes.push(hole);
  const geo = new THREE.ShapeGeometry(shape, 8);
  const wall = new THREE.Mesh(geo, MAT.wall);
  wall.position.z = -HD;
  wall.castShadow = true; wall.receiveShadow = true;
  active.add(wall);
}
/* side walls */
{
  const left = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.d, RH), MAT.wall);
  left.rotation.y = Math.PI/2; left.position.set(-HW, RH/2, 0);
  left.receiveShadow = true; left.castShadow = true;
  active.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.d, RH), MAT.wall);
  right.rotation.y = -Math.PI/2; right.position.set(HW, RH/2, 0);
  right.receiveShadow = true; right.castShadow = true;
  active.add(right);
}
/* baseboards */
addBox(ROOM.w, 0.09, 0.04, MAT.woodDark, 0, 0.045, -HD+0.02);
addBox(0.04, 0.09, ROOM.d, MAT.woodDark, -HW+0.02, 0.045, 0);
addBox(0.04, 0.09, ROOM.d, MAT.woodDark,  HW-0.02, 0.045, 0);

active = new THREE.Group(); active.name="window"; room.add(active); registry.set("window",active);
/* --- window frame, glass, curtains --- */
{
  const cx = (WIN.x0+WIN.x1)/2, cy = (WIN.y0+WIN.y1)/2;
  const w  = WIN.x1-WIN.x0, h = WIN.y1-WIN.y0;
  const z  = -HD + 0.02;
  addBox(w+0.14, 0.07, 0.15, MAT.white, cx, WIN.y0-0.01, z+0.02);   // sill
  addBox(w+0.14, 0.06, 0.10, MAT.white, cx, WIN.y1+0.02, z);        // head
  addBox(0.06, h+0.06, 0.10, MAT.white, WIN.x0-0.02, cy, z);
  addBox(0.06, h+0.06, 0.10, MAT.white, WIN.x1+0.02, cy, z);
  addBox(0.05, h, 0.08, MAT.white, cx, cy, z+0.005);                // mullion
  addBox(w, 0.045, 0.08, MAT.white, cx, WIN.y0 + h*0.42, z+0.005);  // lower rail

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), MAT.glass);
  glass.position.set(cx, cy, -HD - 0.015);
  active.add(glass);

  // curtain rod
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014, 2.35, 10), MAT.metal);
  rod.rotation.z = Math.PI/2;
  rod.position.set(cx, WIN.y1+0.16, -HD+0.10);
  active.add(rod);

  // wavy curtains
  function curtainMesh(wid:number, hei:number){
    const g = new THREE.PlaneGeometry(wid, hei, 26, 8);
    const p = g.attributes.position;
    for (let i=0;i<p.count;i++){
      const x = p.getX(i), y = p.getY(i);
      const t = (y + hei/2)/hei;
      p.setZ(i, Math.sin(x*34)*0.022*(0.35+0.65*t) + Math.sin(x*12+1.3)*0.012);
      p.setX(i, x*(0.86 + 0.14*t));
    }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, MAT.blue);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  const ch = 1.52;
  const cL = curtainMesh(0.36, ch); cL.position.set(WIN.x0-0.08, WIN.y1+0.14-ch/2, -HD+0.11); active.add(cL);
  const cR = curtainMesh(0.36, ch); cR.position.set(WIN.x1+0.08, WIN.y1+0.14-ch/2, -HD+0.11); active.add(cR);
}

active = new THREE.Group(); active.name="outside"; room.add(active); registry.set("outside",active);
/* --- the world outside the window --- */
{
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(26, 15), new THREE.MeshBasicMaterial({ map:skyTexture() }));
  sky.position.set(0, 5, -11);
  active.add(sky);

  const houseMat = new THREE.MeshBasicMaterial({ color:0xd8dbe0 });
  const roofMat  = new THREE.MeshBasicMaterial({ color:0x8f9aa8 });
  const treeMat  = new THREE.MeshBasicMaterial({ color:0x6fa860 });
  for (let i=0;i<6;i++){
    const x = -7 + i*3.1 + rand(-0.6,0.6);
    const h = rand(1.2,2.4);
    const b = addBox(rand(1.6,2.6), h, 1.4, houseMat, x, h/2, -8.5 + rand(-0.5,0.5));
    b.castShadow = false; b.receiveShadow = false;
    const r = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.8, 4), roofMat);
    r.rotation.y = Math.PI/4; r.position.set(x, h+0.4, b.position.z);
    active.add(r);
  }
  for (let i=0;i<10;i++){
    const s = new THREE.Mesh(new THREE.SphereGeometry(rand(0.5,1.1), 8, 6), treeMat);
    s.position.set(rand(-8,8), rand(0.6,1.6), -7.2 + rand(-0.6,0.4));
    active.add(s);
  }
}

active = new THREE.Group(); active.name="decor"; room.add(active); registry.set("decor",active);
/* --- air conditioner + wall decor --- */
{
  addBox(0.78, 0.24, 0.20, MAT.white, 0.30, 2.52, -HD+0.11);
  addBox(0.62, 0.03, 0.02, MAT.dark, 0.30, 2.44, -HD+0.215);
  // clock
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.11,0.035,24), MAT.white);
  clock.rotation.x = Math.PI/2; clock.position.set(0.95, 2.16, -HD+0.03);
  clock.castShadow = true; active.add(clock);
  const hand = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.075, 0.008), MAT.dark);
  hand.position.set(0.95, 2.19, -HD+0.052); active.add(hand);
  // calendar
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.30, 0.40), new THREE.MeshStandardMaterial({ map:calendarTexture(), roughness:0.9 }));
  cal.position.set(0.95, 1.66, -HD+0.015);
  active.add(cal);
  // light switch
  addBox(0.07,0.11,0.012, MAT.white, 0.55, 1.35, -HD+0.01);
}

active = new THREE.Group(); active.name="bed"; room.add(active); registry.set("bed",active);
/* --- bed (left wall) --- */

{
  const bx = BED.x;
  addBox(1.06, 0.26, 2.02, MAT.wood, bx, 0.27, BED.z);                 // frame
  for (const sx of [-0.48, 0.48]) for (const sz of [-0.94, 0.94])
    addBox(0.09, 0.15, 0.09, MAT.woodDark, bx+sx, 0.075, BED.z+sz);     // legs
  addBox(1.14, 0.82, 0.07, MAT.wood, bx, 0.42, -1.99);                  // headboard
  addBox(0.98, 0.18, 1.96, MAT.fabric, bx, 0.49, BED.z);                // mattress
  addBox(1.02, 0.02, 2.00, MAT.white, bx, 0.588, BED.z);                // sheet
  // blanket
  const bl = addBox(1.05, 0.075, 1.20, MAT.blueSoft, bx, 0.60, BED.z+0.36);
  bl.rotation.z = 0.004;
  addBox(1.05, 0.05, 0.22, MAT.blue, bx, 0.635, BED.z-0.18);            // folded edge
  // pillows
  const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), MAT.fabric);
  p1.scale.set(1.0, 0.30, 0.62); p1.position.set(bx, 0.66, -1.70);
  p1.castShadow = true; p1.receiveShadow = true; active.add(p1);
  const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 20, 14), MAT.fabric);
  p2.scale.set(1.0, 0.28, 0.6); p2.position.set(bx, 0.70, -1.78);
  p2.castShadow = true; p2.receiveShadow = true; active.add(p2);
  // storage boxes under bed
  addBox(0.42, 0.22, 0.5, MAT.woodLight, bx-0.25, 0.12, BED.z+0.5);
  addBox(0.42, 0.22, 0.5, MAT.woodLight, bx+0.25, 0.12, BED.z+0.5);
}

active = new THREE.Group(); active.name="desk"; room.add(active); registry.set("desk",active);
/* --- desk (back wall, right side) --- */

{
  addBox(1.40, 0.045, 0.62, MAT.woodLight, DESK.x, 0.735, DESK.z);
  addBox(0.045, 0.72, 0.58, MAT.woodLight, DESK.x-0.66, 0.36, DESK.z);
  addBox(0.045, 0.72, 0.58, MAT.woodLight, DESK.x+0.66, 0.36, DESK.z);
  // drawer unit
  addBox(0.44, 0.50, 0.56, MAT.woodLight, DESK.x+0.42, 0.25, DESK.z);
  for (let i=0;i<3;i++){
    addBox(0.40, 0.14, 0.02, MAT.wood, DESK.x+0.42, 0.11+i*0.16, DESK.z+0.29);
    addBox(0.14, 0.02, 0.02, MAT.metal, DESK.x+0.42, 0.11+i*0.16, DESK.z+0.30);
  }
  // laptop
  addBox(0.36, 0.018, 0.25, MAT.dark, DESK.x-0.05, 0.767, DESK.z+0.07);
  const scr = addBox(0.36, 0.23, 0.012, MAT.dark, DESK.x-0.05, 0.878, DESK.z-0.06);
  scr.rotation.x = -0.22;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.33,0.20), MAT.screen);
  face.position.set(DESK.x-0.05, 0.879, DESK.z-0.052); face.rotation.x = -0.22;
  active.add(face);
  // lamp
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.085,0.02,18), MAT.dark);
  base.position.set(DESK.x+0.5, 0.765, DESK.z-0.16); base.castShadow = true; active.add(base);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.44,8), MAT.dark);
  arm.position.set(DESK.x+0.5, 0.97, DESK.z-0.16); arm.rotation.z = 0.28; arm.rotation.x = -0.18;
  arm.castShadow = true; active.add(arm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.10, 0.16, 16, 1, true),
    new THREE.MeshStandardMaterial({ color:0x2f3238, roughness:0.6, side:THREE.DoubleSide }));
  shade.position.set(DESK.x+0.38, 1.14, DESK.z-0.06); shade.rotation.set(-0.7, 0, 0.4);
  shade.castShadow = true; active.add(shade);
  const lampLight = new THREE.PointLight(0xffd9a3, 2.4, 3.4, 2);
  lampLight.position.set(DESK.x+0.36, 1.06, DESK.z-0.02);
  active.add(lampLight);
  // props
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.036,0.032,0.095,14), MAT.white);
  mug.position.set(DESK.x+0.22, 0.805, DESK.z+0.14); mug.castShadow = true; active.add(mug);
  addBox(0.22,0.035,0.16, MAT.blueDeep, DESK.x-0.42, 0.775, DESK.z+0.16);
  addBox(0.20,0.03,0.15,  MAT.wood,     DESK.x-0.42, 0.808, DESK.z+0.16);
  const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.10,12), MAT.dark);
  pen.position.set(DESK.x+0.30, 0.80, DESK.z-0.14); active.add(pen);
}

active = new THREE.Group(); active.name="chair"; room.add(active); registry.set("chair",active);
/* --- office chair --- */

{
  const cx = CHAIR.x, cz = CHAIR.z;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.06,14), MAT.dark);
  hub.position.set(cx, 0.07, cz); hub.castShadow = true; active.add(hub);
  for (let i=0;i<5;i++){
    const a = i*Math.PI*2/5;
    const arm = addBox(0.30, 0.035, 0.055, MAT.dark, cx + Math.cos(a)*0.15, 0.06, cz + Math.sin(a)*0.15);
    arm.rotation.y = -a;
    const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.035,10,8), MAT.black);
    wheel.position.set(cx + Math.cos(a)*0.29, 0.035, cz + Math.sin(a)*0.29);
    wheel.castShadow = true; active.add(wheel);
  }
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.03,0.35,12), MAT.metal);
  col.position.set(cx, 0.25, cz); col.castShadow = true; active.add(col);
  addBox(0.50, 0.075, 0.48, MAT.black, cx, 0.4225, cz);
  const back = addBox(0.46, 0.52, 0.07, MAT.black, cx, 0.76, cz-0.22);
  back.rotation.x = 0.10;
  for (const s of [-1,1]){
    addBox(0.05, 0.035, 0.30, MAT.black, cx+s*0.25, 0.63, cz-0.03);
    addBox(0.035, 0.16, 0.035, MAT.black, cx+s*0.25, 0.54, cz-0.10);
  }
}

active = new THREE.Group(); active.name="wardrobe"; room.add(active); registry.set("wardrobe",active);
/* --- wardrobe (right wall, open front) --- */
{
  const wx = 2.12, wz = 0.05, wd = 0.56, ww = 2.4, wh = 2.3;
  addBox(0.04, wh, ww, MAT.wood, wx+wd/2-0.02, wh/2, wz);            // back
  addBox(wd, 0.05, ww, MAT.wood, wx, wh-0.025, wz);                  // top
  addBox(wd, 0.07, ww, MAT.wood, wx, 0.035, wz);                     // bottom
  addBox(wd, wh, 0.04, MAT.wood, wx, wh/2, wz-ww/2+0.02);            // side
  addBox(wd, wh, 0.04, MAT.wood, wx, wh/2, wz+ww/2-0.02);            // side
  addBox(wd, wh, 0.03, MAT.wood, wx, wh/2, wz-0.35);                 // divider
  addBox(0.02, 0.02, ww-0.1, MAT.metal, wx+0.06, 1.98, wz);          // rod

  // hanging clothes
  const clothColors = [0x2c3e56, 0xd9d5cc, 0x6f7f95, 0x1f2933, 0xa8b8c8, 0x3d5a80];
  for (let i=0;i<9;i++){
    const cz = wz - 1.08 + i*0.19 + rand(-0.02,0.02);
    if (cz > wz-0.36 && cz < wz-0.32) continue;
    const col = clothColors[i % clothColors.length];
    const m = new THREE.MeshStandardMaterial({ color:col, roughness:0.95 });
    const item = addBox(0.34, rand(0.75,1.0), 0.07, m, wx+0.02, 1.50, cz);
    item.rotation.z = rand(-0.02,0.02);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.03,0.007,6,10, Math.PI), MAT.metal);
    hook.position.set(wx+0.06, 1.985, cz); hook.rotation.y = Math.PI/2; active.add(hook);
  }
  // drawers at the bottom
  for (let i=0;i<3;i++){
    addBox(0.5, 0.22, 0.4, MAT.woodLight, wx-0.02, 0.16 + i*0.26, wz+0.72);
    addBox(0.16, 0.025, 0.03, MAT.metal, wx-0.28, 0.16 + i*0.26, wz+0.72);
  }
}

active = new THREE.Group(); active.name="shelves"; room.add(active); registry.set("shelves",active);
/* --- shelves above the desk --- */
{
  for (const y of [1.72, 2.02]){
    addBox(1.15, 0.035, 0.24, MAT.woodLight, 1.72, y, -HD+0.14);
  }
  const colors = [0x7c3f3f, 0x35566b, 0xc4a35a, 0x2f4f3f, 0x8b5e83, 0xb9663f];
  let px = 1.20;
  for (let i=0;i<9;i++){
    const h = rand(0.16,0.24);
    addBox(0.035, h, 0.17, new THREE.MeshStandardMaterial({ color:colors[i%colors.length], roughness:0.9 }),
      px, 1.735 + h/2, -HD+0.14);
    px += rand(0.045,0.07);
  }
  for (let i=0;i<5;i++){
    const h = rand(0.16,0.22);
    addBox(0.035, h, 0.17, new THREE.MeshStandardMaterial({ color:colors[i%colors.length], roughness:0.9 }),
      2.05 + i*0.055, 2.035 + h/2, -HD+0.14);
  }
  // little plant
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.045,0.09,12), MAT.pot);
  pot.position.set(1.24, 2.08, -HD+0.14); pot.castShadow = true; active.add(pot);
  for (let i=0;i<7;i++){
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(rand(0.035,0.055), 8, 6), i%2 ? MAT.green : MAT.green2);
    leaf.position.set(1.24 + rand(-0.07,0.07), 2.14 + rand(0,0.12), -HD+0.14 + rand(-0.05,0.05));
    leaf.scale.set(1, 1.5, 1);
    leaf.castShadow = true; active.add(leaf);
  }
}

active = new THREE.Group(); active.name="props"; room.add(active); registry.set("props",active);
/* --- rug, bin, backpack --- */
{
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), MAT.rug);
  rug.rotation.x = -Math.PI/2; rug.position.set(-0.15, 0.008, 0.55);
  rug.receiveShadow = true; active.add(rug);

  const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.11,0.30,16), MAT.white);
  bin.position.set(0.92, 0.15, -1.28); bin.castShadow = true; bin.receiveShadow = true; active.add(bin);

  // backpack
  const pack = addBox(0.34, 0.42, 0.20, MAT.blueDeep, 2.02, 0.24, 1.55);
  pack.rotation.y = -0.3;
  addBox(0.10, 0.30, 0.05, MAT.dark, 1.90, 0.30, 1.52);
  addBox(0.10, 0.30, 0.05, MAT.dark, 2.14, 0.30, 1.60);
}


refineRoom(room,registry);
return {root:room,registry,ceiling:room.userData.ceiling as THREE.Mesh};
}
