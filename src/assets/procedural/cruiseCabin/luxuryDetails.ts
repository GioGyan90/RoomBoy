import * as T from 'three';
import {block,cylinder,palette} from './architecture';
const dark=new T.MeshStandardMaterial({color:0x221b27,roughness:.35,metalness:.12});
const pearl=new T.MeshStandardMaterial({color:0xffefda,roughness:.62});
const wine=new T.MeshStandardMaterial({color:0x9b4252,roughness:.83});
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
 block(g,'rear-crown-wood',[7.35,.14,.24],[-2.125,3.01,-3.66],palette.wood);
 block(g,'rear-crown-gold',[7.36,.035,.26],[-2.125,2.91,-3.65],palette.gold);
 // Bedside lamps now belong to the connected bedroom kit, not detached wall props.
 // Quilt and runner are deformable fabric meshes; no detached rigid stitching bars.
 // Future embroidery should be in the fabric UV atlas or conform to its vertices.
 // No floating gold studs: the reference bed uses smooth white pillows.
 // Wardrobe recessed kickplate, cornice and decorative door pulls.
 block(g,'wardrobe-brass-kickplate',[1.61,.055,.72],[-4.69,.075,-3.30],palette.gold);
 block(g,'wardrobe-brass-crown',[1.63,.055,.73],[-4.69,2.47,-3.30],palette.gold);
 for(const x of [-5.07,-4.31]){
  block(g,'wardrobe-panel-crossbar',[.59,.018,.02],[x,1.86,-2.916],palette.gold);
  block(g,'wardrobe-panel-crossbar',[.59,.018,.02],[x,.56,-2.916],palette.gold);
 }
 // Cocktail table: concentric metallic edge and a compact decorative tray.
 cylinder(g,'table-tray',.22,.013,[3.75,.62,1.91],palette.gold);
 cylinder(g,'table-tray-inset',.19,.015,[3.75,.63,1.91],dark);
 sphere(g,'tray-pearl',.058,3.72,.68,1.91,pearl);
 sphere(g,'tray-pearl',.042,3.83,.67,1.86,wine);
 // Sofa piping and feet are visible from low-angle inspection cameras.
 for(const x of [2.79,4.79]){
  for(const z of [.21,.78])cylinder(g,'sofa-brass-foot',.055,.13,[x,.115,z],palette.gold);
 }
 // Curved lounge segments replace the former straight gold rail.
 // Piping follows the cushion front edge rather than cutting across its top.
 block(g,'sofa-front-piping',[2.17,.018,.019],[3.79,.57,.955],palette.gold);
 // Bath fixtures live in serviceRooms.ts and are mounted to their parent asset.
 // No separate suspended towels, faucets, brackets or flush hardware.
 // Keep the central walking route free of decorative target disks.
}
