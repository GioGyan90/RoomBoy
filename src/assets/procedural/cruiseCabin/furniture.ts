import * as T from "three";
import {block,cylinder,palette} from "./architecture";
import {createDuvetGeometry} from "./lowpolyAssets";
import {createCruiseFabricMaterials,createCruiseRugPrint} from "./surfacePatterns";
const velvet=new T.MeshStandardMaterial({color:0x262127,roughness:.96});
const linen=new T.MeshStandardMaterial({color:0xfff0df,roughness:.91});
const gold=palette.gold;
const clothPrints=createCruiseFabricMaterials();
const rugPrint=new T.MeshStandardMaterial({map:createCruiseRugPrint(),color:0xffffff,roughness:.89});
function soft(parent:T.Group,name:string,size:[number,number,number],at:[number,number,number],mat:T.Material,r=.09){
 const s=new T.Shape();const w=size[0],d=size[2],x=-w/2,z=-d/2;
 s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);
 const geo=new T.ExtrudeGeometry(s,{depth:size[1],bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.016,bevelThickness:.016,curveSegments:5});
 geo.rotateX(-Math.PI/2);
 const m=new T.Mesh(geo,mat);m.name=name;m.position.set(at[0],at[1]-size[1]/2,at[2]);m.castShadow=true;parent.add(m);return m;
}
export function furniture(root:T.Group){
 const g=new T.Group();g.name="cruise-furniture";root.add(g);
 // Phase 1 circulation reflow: one self-contained bed assembly, moved right to free the entrance aisle.
 const bedZone=new T.Group();bedZone.name="cruise-sleeping-zone";bedZone.position.x=.72;g.add(bedZone);
 // Shorter bed preserves headboard alignment while opening the foreground turning zone.
 block(bedZone,"bed-rug",[3.60,.024,4.05],[-1.05,.022,-1.44],rugPrint);
 block(bedZone,"king-bed-frame",[2.62,.36,3.57],[-1.05,.31,-1.595],palette.wood);
 block(bedZone,"bed-brass-base",[2.66,.045,3.60],[-1.05,.17,-1.595],gold);
 soft(bedZone,"pillowtop-mattress",[2.42,.26,3.43],[-1.05,.65,-1.585],linen);
 // Draped low-poly fabric shells, authored with folds and hem UVs, rather than hard slabs.
 const quilt=new T.Mesh(createDuvetGeometry(2.37,2.52,.12,'ivoryCloth'),clothPrints.ivory);
 quilt.name='quilt-ivory';quilt.position.set(-1.05,.84,-1.18);quilt.castShadow=true;quilt.receiveShadow=true;bedZone.add(quilt);
 const runner=new T.Mesh(createDuvetGeometry(2.42,.72,.045,'midnightCloth'),clothPrints.dark);
 runner.name='quilt-burgundy-runner';runner.position.set(-1.05,.91,-.19);runner.castShadow=true;runner.receiveShadow=true;bedZone.add(runner);
 block(bedZone,"headboard-wood-frame",[3.42,1.70,.20],[-1.05,1.45,-3.57],palette.wood);
 block(bedZone,"headboard-brass-cap",[3.44,.045,.22],[-1.05,2.32,-3.57],gold);
 for(let i=0;i<8;i++)soft(bedZone,"headboard-vertical-tuft",[.35,1.47,.11],[-2.39+i*.383,1.48,-3.37],velvet,.065);
 for(const x of [-1.69,-.41]){
  soft(bedZone,"sleeping-pillow",[1.05,.16,.57],[x,.87,-2.88],linen);
 }
 // Keep the two nightstands clear of both the bed frame and headboard.
 for(const x of [-2.87,.77]){
  block(bedZone,"walnut-nightstand",[.55,.66,.62],[x,.38,-3.06],palette.wood);
  block(bedZone,"nightstand-marble-top",[.61,.055,.68],[x,.74,-3.06],palette.marble);
  block(bedZone,"nightstand-drawer",[.44,.22,.02],[x,.48,-2.736],palette.cream);
  block(bedZone,"drawer-pull",[.17,.026,.04],[x,.48,-2.705],gold);
  cylinder(bedZone,"brass-lamp-base",.085,.12,[x,.81,-3.06],gold);
  cylinder(bedZone,"brass-lamp-stem",.028,.23,[x,.93,-3.06],gold);
  cylinder(bedZone,"warm-lampshade",.18,.27,[x,1.04,-3.06],linen);
 }
 // Left wall wardrobe; the independent minibar is built by minibar.ts.
 block(g,"full-height-wardrobe",[1.55,2.43,.65],[-4.69,1.24,-3.32],palette.wood);
 for(const x of [-5.07,-4.31]){
  block(g,"wardrobe-door",[.71,2.23,.035],[x,1.26,-2.975],palette.gold);
  block(g,"wardrobe-inset",[.59,2.08,.039],[x,1.26,-2.947],palette.onyx);
  block(g,"wardrobe-gold-pull",[.024,.42,.05],[x+(x< -4.7?.22:-.22),1.19,-2.912],gold);
 }
 // Sofa: a real upholstered seat with distinct back, arms, cushions and piping.
 block(g,"lounge-carpet",[3.02,.025,2.65],[3.72,.025,1.18],rugPrint);
 soft(g,"sofa-seat-frame",[2.26,.31,.91],[3.79,.37,.50],palette.ivory,.16);
 // One continuous sculpted yacht settee: gently curved back instead of seven blocky overlaps.
 const curveShape=new T.Shape();
 curveShape.moveTo(-1.12,.01);
 curveShape.quadraticCurveTo(-.70,.31,0,.28);
 curveShape.quadraticCurveTo(.70,.31,1.12,.01);
 curveShape.lineTo(1.12,-.23);
 curveShape.quadraticCurveTo(.65,.055,0,.04);
 curveShape.quadraticCurveTo(-.65,.055,-1.12,-.23);
 curveShape.closePath();
 const curvedBackGeometry=new T.ExtrudeGeometry(curveShape,{depth:.72,steps:1,bevelEnabled:true,bevelThickness:.018,bevelSize:.015,bevelSegments:2,curveSegments:12});
 curvedBackGeometry.rotateX(-Math.PI/2);
 const curvedBack=new T.Mesh(curvedBackGeometry,palette.ivory);
 curvedBack.name='sofa-curved-backrest';
 curvedBack.position.set(3.79,.42,.16);curvedBack.castShadow=true;g.add(curvedBack);
 for(const x of [2.77,4.81])soft(g,"sofa-arm",[.28,.63,.91],[x,.61,.50],palette.ivory,.12);
 for(const x of [3.24,4.33]){
  soft(g,"sofa-seat-cushion",[1.02,.16,.72],[x,.61,.57],palette.ivory);
  soft(g,"sofa-pillow",[.39,.34,.16],[x,.90,.40],palette.ivory);
 }
 cylinder(g,"cocktail-table-marble",.58,.085,[3.53,.57,1.94],palette.marble);
 cylinder(g,"cocktail-table-gold-rim",.60,.025,[3.53,.52,1.94],gold);
 cylinder(g,"cocktail-table-pedestal",.095,.48,[3.53,.29,1.94],gold);
 cylinder(g,"cocktail-table-foot",.34,.04,[3.53,.06,1.94],gold);
 cylinder(g,"table-flower-vase",.10,.25,[3.39,.735,1.83],palette.cream);
 for(let i=0;i<5;i++)cylinder(g,"flower-stem",.014,.28,[3.33+i*.038,.99,1.83],palette.gold);
 // Wall art, stepped trim, and inset decorative panels.
 // The rear wall uses one coordinated pilaster system; avoid overlapping repeated slats.
 // No art over the headboard: the backlit leather arch is the reference focal point.
}
