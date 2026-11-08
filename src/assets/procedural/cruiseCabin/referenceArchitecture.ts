import * as T from 'three';
import {block,cylinder,palette,cabin} from './architecture';

// The reference suite's port-side doorway, broad ocean windows and curved cruise hull.
const sea=new T.MeshBasicMaterial({color:0x1b8dbb,side:T.DoubleSide});
const sky=new T.MeshBasicMaterial({color:0x70c5e8,side:T.DoubleSide});
const pale=new T.MeshStandardMaterial({color:0xffe6dc,metalness:.12,roughness:.57});
const marine=new T.MeshStandardMaterial({color:0x243747,roughness:.55});
function rounded(w:number,h:number,r:number){
 const s=new T.Shape(), x=-w/2, y=-h/2;
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
 s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
 s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
 return new T.ShapeGeometry(s,10);
}
function windowPane(g:T.Group,name:string,w:number,h:number,r:number,x:number,y:number,z:number,material:T.Material){
 const mesh=new T.Mesh(rounded(w,h,r),material);
 mesh.name=name;mesh.position.set(x,y,z);mesh.rotation.y=-Math.PI/2;
 g.add(mesh);return mesh;
}
function tube(g:T.Group,name:string,points:T.Vector3[],radius:number,material:T.Material){
 const curve=new T.CatmullRomCurve3(points);
 const m=new T.Mesh(new T.TubeGeometry(curve,Math.max(30,points.length*7),radius,7,false),material);
 m.name=name;g.add(m);return m;
}
export function referenceArchitecture(root:T.Group){
 const g=new T.Group();g.name='reference-cruise-architecture';root.add(g);
 // Large, gold-rimmed rounded-rectangle sea window on the exterior hull.
 windowPane(g,'side-window-brass-frame',2.52,1.94,.40,5.68,1.72,-1.55,palette.gold);
 windowPane(g,'side-window-black-gasket',2.42,1.84,.36,5.661,1.72,-1.55,marine);
 windowPane(g,'side-window-sea',2.30,1.72,.31,5.642,1.72,-1.55,sea);
 windowPane(g,'side-window-sky',2.15,.78,.24,5.625,2.13,-1.55,sky);
 // Faint sea horizon and glints, inset within the window, not over its rim.
 block(g,'window-horizon',[.009,.025,2.09],[5.614,1.69,-1.55],pale);
 for(let i=0;i<5;i++){
  block(g,'window-wave',[.008,.012,.22+i*.05],[5.606,1.13+i*.10,-2.30+i*.33],sky);
 }
 // A tall, separately framed sliding door beside the sea window.
 windowPane(g,'side-balcony-brass-frame',1.46,2.71,.18,5.68,1.52,.55,palette.gold);
 windowPane(g,'side-balcony-gasket',1.36,2.61,.15,5.658,1.52,.55,marine);
 windowPane(g,'side-balcony-sea',1.26,2.51,.14,5.637,1.52,.55,sea);
 windowPane(g,'side-balcony-sky',1.18,1.05,.10,5.622,2.22,.55,sky);
 block(g,'side-balcony-divider',[.035,2.58,.055],[5.585,1.52,.55],palette.gold);
 block(g,'side-balcony-pull',[.075,.43,.045],[5.538,1.34,.87],palette.gold);
 block(g,'side-balcony-handle-return',[.07,.045,.14],[5.525,1.56,.87],palette.gold);
 // Side service deck and glass guardrail, visually outside the glazed door.
 block(g,'side-balcony-deck',[.76,.12,1.53],[6.22,-.09,.58],palette.wood);
 block(g,'side-balcony-glass',[.025,.71,1.45],[6.60,.53,.58],palette.glass);
 for(const z of [-.14,1.30])block(g,'side-balcony-post',[.055,1.03,.055],[6.60,.52,z],palette.gold);
 block(g,'side-balcony-rail',[.065,.046,1.51],[6.60,1.04,.58],palette.gold);
 // Built-up cream shell: the upper section rolls down toward the stern.
 tube(g,'upper-hull-cream-curve',[
  new T.Vector3(5.53,3.19,-3.90),new T.Vector3(5.78,3.22,-3.1),
  new T.Vector3(5.93,3.15,-1.65),new T.Vector3(5.99,2.91,.40),
  new T.Vector3(5.90,2.68,1.45),new T.Vector3(5.83,2.58,2.32)
 ],.13,pale);
 tube(g,'hull-gold-longitudinal-band',[
  new T.Vector3(5.94,.45,-3.86),new T.Vector3(5.96,.47,-2.3),
  new T.Vector3(5.97,.48,-.48),new T.Vector3(5.95,.46,1.72),
  new T.Vector3(5.85,.43,3.74)
 ],.022,palette.gold);
 for(let i=0;i<15;i++){
  const z=-3.55+i*.51;
  cylinder(g,'outer-hull-rivet',.028,.02,[5.93,.27,z],palette.gold,'x');
 }
 // The entrance on the left wall reads as a real cabin door with a recessed dark panel.
 block(g,'suite-entry-door-frame',[.085,2.50,1.25],[-5.68,1.36,-2.23],palette.gold);
 block(g,'suite-entry-door',[.096,2.35,1.09],[-5.617,1.34,-2.23],palette.wood);
 block(g,'suite-entry-door-inset',[.012,1.95,.89],[-5.556,1.38,-2.23],marine);
 block(g,'suite-entry-door-knob',[.07,.055,.15],[-5.535,1.13,-1.89],palette.gold);
 cylinder(g,'suite-entry-peephole',.023,.025,[-5.531,1.80,-2.23],palette.gold,'x');
 // An inset TV on the rear wall: dark glass with a cinematic ocean-blue display.
 block(g,'wall-tv-brass-frame',[.84,1.05,.06],[1.065,1.79,-3.723],palette.gold);
 block(g,'wall-tv-screen',[.78,.98,.065],[1.065,1.79,-3.683],marine);
 block(g,'wall-tv-sea',[.70,.45,.008],[1.065,1.59,-3.641],sea);
 block(g,'wall-tv-sky',[.70,.43,.009],[1.065,2.04,-3.638],sky);
 block(g,'wall-tv-horizon',[.70,.015,.012],[1.065,1.81,-3.627],pale);
 // Tall cream drapes and tiebacks, restrained rather than competing with the glazing.
 for(const z of [-2.82,1.42]){
  block(g,'ocean-curtain',[.13,2.40,.25],[5.40,1.55,z],palette.cream);
  cylinder(g,'curtain-tieback',.055,.08,[5.39,1.31,z],palette.gold);
 }
 return g;
}
