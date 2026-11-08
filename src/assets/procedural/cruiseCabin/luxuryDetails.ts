import * as T from 'three';
import {block,cylinder,palette} from './architecture';
const dark=new T.MeshStandardMaterial({color:0x221b27,roughness:.35,metalness:.12});
const pearl=new T.MeshStandardMaterial({color:0xffefda,roughness:.62});
const wine=new T.MeshStandardMaterial({color:0x9b4252,roughness:.83});
const light=new T.MeshStandardMaterial({color:0xffdca1,emissive:0xf5a849,emissiveIntensity:.35,roughness:.5});
function sphere(g:T.Group,name:string,r:number,x:number,y:number,z:number,mat:T.Material){
 const m=new T.Mesh(new T.SphereGeometry(r,12,8),mat);m.name=name;m.position.set(x,y,z);g.add(m);
}
export function luxuryDetails(root:T.Group){
 const g=new T.Group();g.name='cruise-luxury-details';root.add(g);
 // Architectural layered walnut and gold: repeating pilasters are deliberately spaced.
 for(const x of [-5.53,-3.83,1.05]){
  block(g,'walnut-pilaster',[.11,2.72,.11],[x,1.55,-3.71],palette.wood);
  block(g,'pilaster-brass-inlay',[.025,2.52,.025],[x+.075,1.54,-3.645],palette.gold);
  block(g,'pilaster-cap',[.19,.055,.16],[x,2.93,-3.68],palette.gold);
 }
 // Continuous cornice only over the solid left portion of the rear wall.
 block(g,'rear-crown-wood',[7.46,.14,.24],[-1.96,3.01,-3.66],palette.wood);
 block(g,'rear-crown-gold',[7.48,.035,.26],[-1.96,2.91,-3.65],palette.gold);
 // Backlit, layered bedside wall sconces and pendant rods.
 for(const x of [-2.68,.58]){
  block(g,'sconce-wall-plate',[.22,.39,.055],[x,1.67,-3.59],palette.gold);
  block(g,'sconce-diffuser',[.15,.27,.07],[x,1.67,-3.53],light);
  cylinder(g,'sconce-pin',.026,.11,[x,1.49,-3.49],palette.gold);
 }
 // Bedrunner embroidery and parallel stitching; slight offsets prevent z fighting.
 for(const z of [-1.14,-.78]){
  block(g,'runner-gold-stitch',[2.50,.008,.013],[-1.05,.94,z],palette.gold);
 }
 for(let i=0;i<7;i++)block(g,'quilt-stitched-line',[2.44,.004,.006],[-1.05,.891,-1.97+i*.11],pearl);
 // Cushions: contrast welt piping and gold button tufts.
 for(const x of [-1.69,-.41]){
  for(const dx of [-.23,.23])sphere(g,'cushion-button',.026,x+dx,1.035,-2.53,palette.gold);
 }
 // Wardrobe recessed kickplate, cornice and decorative door pulls.
 block(g,'wardrobe-brass-kickplate',[1.61,.055,.72],[-4.69,.075,-3.30],palette.gold);
 block(g,'wardrobe-brass-crown',[1.63,.055,.73],[-4.69,2.47,-3.30],palette.gold);
 for(const x of [-5.07,-4.31]){
  block(g,'wardrobe-panel-crossbar',[.59,.018,.02],[x,1.86,-2.916],palette.gold);
  block(g,'wardrobe-panel-crossbar',[.59,.018,.02],[x,.56,-2.916],palette.gold);
 }
 // Mini bar: brass bottle shelf and a few glass decanters.
 block(g,'minibar-back-mirror',[1.42,.65,.025],[1.35,1.51,-3.71],palette.glass);
 block(g,'minibar-shelf',[1.43,.038,.35],[1.35,1.28,-3.48],palette.gold);
 for(const x of [.99,1.36,1.73]){
  cylinder(g,'decanter-body',.085,.26,[x,1.47,-3.47],palette.glass);
  cylinder(g,'decanter-neck',.036,.10,[x,1.65,-3.47],palette.gold);
 }
 // Cocktail table: concentric metallic edge and a compact decorative tray.
 cylinder(g,'table-tray',.22,.013,[3.75,.635,1.91],palette.gold);
 cylinder(g,'table-tray-inset',.19,.015,[3.75,.645,1.91],dark);
 sphere(g,'tray-pearl',.058,3.72,.71,1.91,pearl);
 sphere(g,'tray-pearl',.042,3.83,.70,1.86,wine);
 // Sofa piping and feet are visible from low-angle inspection cameras.
 for(const x of [2.79,4.79]){
  for(const z of [.21,.78])cylinder(g,'sofa-brass-foot',.055,.13,[x,.115,z],palette.gold);
 }
 // Piping follows the cushion front edge rather than cutting across its top.
 block(g,'sofa-front-piping',[2.17,.018,.019],[3.79,.57,.955],palette.gold);
 // Marble bathroom: mirror edging, towel rails and rolled towels.
 block(g,'vanity-lower-brass-edge',[.78,.035,.63],[-3.09,.12,1.24],palette.gold);
 for(const y of [1.52,1.68]){
  block(g,'bath-towel-rail',[.52,.035,.04],[-5.43,y,1.04],palette.gold);
 }
 for(const y of [1.38,1.47]){
  block(g,'folded-towel',[.38,.07,.22],[-5.29,y,1.08],pearl);
 }
 // Toilet flush hardware and sculpted ceramic seat rim.
 cylinder(g,'flush-button',.065,.025,[-3,1.058,3.48],palette.gold);
 // Avoid a solid gold disk covering the ceramic seat: use four small decorative rivets.
 for(const x of [-3.19,-2.81])for(const z of [2.98,3.22])sphere(g,'toilet-seat-rivet',.018,x,.629,z,palette.gold);
 // Bath tap bridge and a separate spout.
 block(g,'bath-faucet-spout',[.31,.042,.06],[-4.32,1.29,1.95],palette.gold);
 sphere(g,'bath-tap-knob',.065,-4.10,1.32,1.95,palette.gold);
 // Brass framed art deco floor medallion.
 cylinder(g,'floor-medallion',.34,.012,[.66,.035,2.58],palette.gold);
 cylinder(g,'floor-medallion-center',.27,.014,[.66,.046,2.58],dark);
 cylinder(g,'floor-medallion-pearl',.13,.015,[.66,.057,2.58],pearl);
}
