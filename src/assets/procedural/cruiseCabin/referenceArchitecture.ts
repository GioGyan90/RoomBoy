import * as T from 'three';
import {block,cylinder,palette} from './architecture';
import {createRoundedFrameGeometry} from './lowpolyAssets';

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
 const isRim=name.endsWith('brass-frame')||name.endsWith('gasket');
 const geo=isRim?createRoundedFrameGeometry(w,h,r,name.endsWith('gasket')?.045:.072,name.endsWith('brass-frame')?.235:.045):rounded(w,h,r);
 const mesh=new T.Mesh(geo,material);
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
 // Starboard modules occupy the ACTUAL cutouts in the .18-thick hull:
 // outer x=5.94, through-wall reveal to x=5.705, inner trim x=5.71.
 // The window opening spans z [-2.85,-.25], y [.55,2.68].
 windowPane(g,'side-window-brass-frame',2.56,2.14,.40,5.94,1.62,-1.55,palette.gold);
 windowPane(g,'side-window-black-gasket',2.46,2.035,.36,5.915,1.62,-1.55,marine);
 windowPane(g,'side-window-inner-brass-frame',2.56,2.14,.40,5.705,1.62,-1.55,palette.gold);
 windowPane(g,'side-window-sea',2.365,1.945,.31,5.83,1.62,-1.55,sea);
 windowPane(g,'side-window-sky',2.32,.87,.24,5.836,2.14,-1.55,sky);
 // Painted horizon and distant sea streaks sit directly on the glazing plane.
 block(g,'window-horizon',[.009,.018,2.29],[5.844,1.705,-1.55],pale);
 for(let i=0;i<4;i++){
  block(g,'window-wave',[.008,.009,.14+i*.05],[5.846,1.10+i*.12,-2.30+i*.38],sky);
 }
 // Balcony aperture spans z [-.25,1.15], y [.15,2.93], centered z=.45.
 windowPane(g,'side-balcony-brass-frame',1.38,2.78,.16,5.94,1.54,.45,palette.gold);
 windowPane(g,'side-balcony-gasket',1.28,2.665,.14,5.915,1.54,.45,marine);
 windowPane(g,'side-balcony-inner-brass-frame',1.38,2.78,.16,5.705,1.54,.45,palette.gold);
 windowPane(g,'side-balcony-sea',1.19,2.56,.12,5.83,1.54,.45,sea);
 windowPane(g,'side-balcony-sky',1.17,1.09,.10,5.836,2.275,.45,sky);
 block(g,'side-balcony-divider',[.025,2.54,.045],[5.85,1.54,.45],palette.gold);
 block(g,'side-balcony-pull',[.053,.43,.035],[5.89,1.36,.75],palette.gold);
 block(g,'side-balcony-handle-return',[.052,.03,.12],[5.89,1.56,.75],palette.gold);
 // Outside cap trims make the frame-to-wall contacts visible without a gap.
 for(const z of [-2.825,-.275,1.125]){
  block(g,'hull-reveal-post',[.24,.11,.036],[5.82,2.64,z],palette.shell);
 }
 // Side service deck and glass guardrail, visually outside the glazed door.
 block(g,'side-balcony-deck',[.76,.12,1.53],[6.22,-.09,.45],palette.wood);
 block(g,'side-balcony-glass',[.025,.71,1.45],[6.60,.53,.45],palette.glass);
 for(const z of [-.20,1.10])block(g,'side-balcony-post',[.055,1.03,.055],[6.60,.52,z],palette.gold);
 block(g,'side-balcony-rail',[.065,.046,1.51],[6.60,1.04,.45],palette.gold);
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
 // Port-side entrance is physically cut from the shell in architecture.ts.
 // Reveal edges run through its thickness; no full-height gold plate hides the door.
 const entryFrame=new T.Group();entryFrame.name='suite-entry-door-frame';g.add(entryFrame);
 for(const z of [-2.845,-1.615]){
  block(entryFrame,'entry-jamb',[.25,2.49,.050],[-5.79,1.355,z],palette.gold);
 }
 block(entryFrame,'entry-lintel',[.25,.065,1.29],[-5.79,2.575,-2.23],palette.gold);
 block(entryFrame,'entry-threshold',[.25,.05,1.29],[-5.79,.135,-2.23],palette.gold);
 block(g,'suite-entry-door',[.065,2.35,1.09],[-5.8,1.34,-2.23],palette.wood);
 block(g,'suite-entry-door-inset',[.009,1.95,.89],[-5.75,1.38,-2.23],marine);
 block(g,'suite-entry-door-knob',[.050,.055,.15],[-5.73,1.13,-1.89],palette.gold);
 cylinder(g,'suite-entry-peephole',.023,.025,[-5.72,1.80,-2.23],palette.gold,'x');
 // An inset TV on the rear wall: dark glass with a cinematic ocean-blue display.
 block(g,'wall-tv-brass-frame',[1.48,1.02,.06],[2.49,1.75,-3.715],palette.gold);
 block(g,'wall-tv-screen',[1.39,.94,.065],[2.49,1.75,-3.678],marine);
 block(g,'wall-tv-sea',[1.30,.44,.008],[2.49,1.55,-3.636],sea);
 block(g,'wall-tv-sky',[1.30,.40,.009],[2.49,1.98,-3.634],sky);
 block(g,'wall-tv-horizon',[1.30,.014,.012],[2.49,1.76,-3.622],pale);
 // Tall cream drapes and tiebacks, restrained rather than competing with the glazing.
 for(const z of [-2.82,1.42]){
  block(g,'ocean-curtain',[.13,2.40,.25],[5.40,1.55,z],palette.cream);
  cylinder(g,'curtain-tieback',.055,.08,[5.39,1.31,z],palette.gold);
 }
 return g;
}
