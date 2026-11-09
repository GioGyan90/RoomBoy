import * as T from 'three';
import {block,cylinder,palette} from './architecture';
import {createRoundedFrameGeometry,createWallApertureCornerGeometry} from './lowpolyAssets';

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
 const geo=isRim?createRoundedFrameGeometry(w,h,r,name.endsWith('gasket')?.045:.072,name.endsWith('brass-frame')?(name.includes('inner-')?.035:.235):.045):rounded(w,h,r);
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
 // Boolean rounded aperture infills close triangular gaps at each corner.
 for(const item of [
  {name:'window-hull-corner-infill',rectW:2.60,rectH:2.13,cutW:2.54,cutH:2.105,r:.40,y:1.615,z:-1.55},
  {name:'door-hull-corner-infill',rectW:1.40,rectH:2.78,cutW:1.365,cutH:2.755,r:.16,y:1.54,z:.45}
 ]){
  const geom=createWallApertureCornerGeometry(item.rectW,item.rectH,item.cutW,item.cutH,item.r,.18);
  const mesh=new T.Mesh(geom,palette.shell);
  mesh.name=item.name;mesh.position.set(5.89,item.y,item.z);
  mesh.rotation.y=-Math.PI/2;mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);
 }
 // Starboard modules occupy the ACTUAL cutouts in the .18-thick hull:
 // outer x=5.94, through-wall reveal to x=5.705, inner trim x=5.71.
 // The window opening spans z [-2.85,-.25], y [.55,2.68].
 windowPane(g,'side-window-brass-frame',2.56,2.14,.40,5.94,1.62,-1.55,palette.gold);
 windowPane(g,'side-window-black-gasket',2.46,2.035,.36,5.915,1.62,-1.55,marine);
 windowPane(g,'side-window-inner-brass-frame',2.56,2.14,.40,5.705,1.62,-1.55,palette.gold);
 windowPane(g,'side-window-sea',2.365,1.92,.31,5.83,1.62,-1.55,sea);
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
 // The wall corner infills themselves seal the window-to-post connection.
 // Side service deck and glass guardrail, visually outside the glazed door.
 block(g,'side-balcony-deck',[.76,.12,1.53],[6.22,-.09,.45],palette.wood);
 block(g,'side-balcony-glass',[.025,.71,1.45],[6.60,.53,.45],palette.glass);
 for(const z of [-.20,1.10])block(g,'side-balcony-post',[.055,1.03,.055],[6.60,.52,z],palette.gold);
 block(g,'side-balcony-rail',[.065,.046,1.51],[6.60,1.04,.45],palette.gold);
 // Built-up cream shell: the upper section rolls down toward the stern.
 // Sculpted shell lip touches the wall instead of floating as a fat cylinder.
 tube(g,'upper-hull-cream-curve',[
  new T.Vector3(5.83,3.15,-3.90),new T.Vector3(5.89,3.14,-3.1),
  new T.Vector3(5.92,3.13,-1.65),new T.Vector3(5.93,3.12,.40),
  new T.Vector3(5.90,3.08,1.45),new T.Vector3(5.86,3.04,3.86)
 ],.062,pale);
 // Longitudinal gold piping stops cleanly at the balcony aperture.
 tube(g,'hull-gold-longitudinal-band-aft',[
  new T.Vector3(5.925,.45,-3.84),new T.Vector3(5.932,.45,-2.2),
  new T.Vector3(5.932,.45,-.27)
 ],.018,palette.gold);
 tube(g,'hull-gold-longitudinal-band-fore',[
  new T.Vector3(5.932,.45,1.18),new T.Vector3(5.925,.45,2.35),
  new T.Vector3(5.915,.45,3.80)
 ],.018,palette.gold);
 for(let i=0;i<15;i++){
  const z=-3.55+i*.51;
  if(z>-.30&&z<1.20)continue;
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
 // The media unit is on the FOOT wall (+Z) directly opposite the bed.
 // Its tall, thin wall panel is supported by the cabin floor and kept within the front boundary.
 // Screen front faces -Z, toward the headboard, not the sea-facing side wall.
 const media=new T.Group();media.name='bed-foot-media-wall';g.add(media);
 block(media,'bed-foot-media-panel',[2.52,2.34,.11],[-.33,1.17,3.65],palette.wood);
 block(media,'bed-foot-media-inset',[2.40,2.23,.018],[-.33,1.17,3.588],palette.onyx);
 const off=new T.MeshStandardMaterial({color:0x15161b,metalness:.35,roughness:.21,emissive:0x000000});
 const darkGlass=new T.MeshStandardMaterial({color:0x28272a,metalness:.48,roughness:.22});
 block(media,'wall-tv-brass-frame',[1.84,1.06,.064],[-.33,1.52,3.55],palette.gold);
 block(media,'wall-tv-screen',[1.75,.98,.070],[-.33,1.52,3.51],off);
 block(media,'wall-tv-black-glass-reflection',[.64,.025,.007],[-.78,1.77,3.469],darkGlass);
 block(media,'wall-tv-mount',[.36,.25,.035],[-.33,1.48,3.61],palette.wood);
 // Tall cream drapes and tiebacks, restrained rather than competing with the glazing.
 for(const z of [-2.82,1.42]){
  block(g,'ocean-curtain',[.13,2.40,.25],[5.40,1.55,z],palette.cream);
  cylinder(g,'curtain-tieback',.055,.08,[5.39,1.31,z],palette.gold);
 }
 return g;
}
