import * as T from "three";
import {block,cylinder,palette} from "./architecture";
const velvet=new T.MeshStandardMaterial({color:0x823642,roughness:.96});
const linen=new T.MeshStandardMaterial({color:0xffe9d4,roughness:.94});
const gold=palette.gold;
function soft(parent:T.Group,name:string,size:[number,number,number],at:[number,number,number],mat:T.Material,r=.09){
 const s=new T.Shape();const w=size[0],d=size[2],x=-w/2,z=-d/2;
 s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);
 const geo=new T.ExtrudeGeometry(s,{depth:size[1],bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.016,bevelThickness:.016,curveSegments:5});
 geo.rotateX(-Math.PI/2);
 const m=new T.Mesh(geo,mat);m.name=name;m.position.set(at[0],at[1]-size[1]/2,at[2]);m.castShadow=true;parent.add(m);return m;
}
export function furniture(root:T.Group){
 const g=new T.Group();g.name="cruise-furniture";root.add(g);
 // Black marble with cream and burgundy rugs; layered luxury bed and pleated upholstered headboard.
 block(g,"bed-rug",[3.58,.024,3.13],[-1.05,.022,-1.67],velvet);
 block(g,"bed-rug-border",[3.43,.027,2.97],[-1.05,.038,-1.67],gold);
 block(g,"bed-rug-inner",[3.37,.031,2.91],[-1.05,.041,-1.67],linen);
 block(g,"king-bed-frame",[2.82,.36,2.7],[-1.05,.31,-2.03],palette.wood);
 block(g,"bed-brass-base",[2.86,.045,2.73],[-1.05,.17,-2.03],gold);
 soft(g,"pillowtop-mattress",[2.61,.26,2.55],[-1.05,.65,-2.03],linen);
 soft(g,"quilt-ivory",[2.58,.12,1.66],[-1.05,.82,-1.43],linen);
 soft(g,"quilt-burgundy-runner",[2.62,.045,.48],[-1.05,.91,-.93],velvet);
 block(g,"headboard-wood-frame",[3.24,1.46,.24],[-1.05,1.28,-3.54],palette.wood);
 block(g,"headboard-brass-cap",[3.29,.065,.28],[-1.05,2.04,-3.54],gold);
 for(let i=0;i<8;i++)soft(g,"headboard-vertical-tuft",[.35,1.26,.11],[-2.39+i*.383,1.27,-3.36],i%2?velvet:palette.burgundy,.07);
 for(const x of [-1.69,-.41]){
  soft(g,"sleeping-pillow",[1.05,.16,.57],[x,.87,-2.88],linen);
  soft(g,"accent-pillow",[.63,.16,.35],[x,.94,-2.54],velvet);
 }
 // Keep the two nightstands clear of both the bed frame and headboard.\n for(const x of [-2.87,.77]){
  block(g,"walnut-nightstand",[.55,.66,.62],[x,.38,-3.06],palette.wood);
  block(g,"nightstand-marble-top",[.61,.055,.68],[x,.74,-3.06],palette.marble);
  block(g,"nightstand-drawer",[.44,.22,.02],[x,.48,-2.736],palette.cream);
  block(g,"drawer-pull",[.17,.026,.04],[x,.48,-2.705],gold);
  cylinder(g,"brass-lamp-base",.085,.12,[x,.85,-3.06],gold);
  cylinder(g,"warm-lampshade",.18,.27,[x,1.04,-3.06],linen);
 }
 // Left wall wardrobe; the independent minibar is built by minibar.ts.
 block(g,"full-height-wardrobe",[1.55,2.43,.65],[-4.69,1.24,-3.32],palette.wood);
 for(const x of [-5.07,-4.31]){
  block(g,"wardrobe-door",[.71,2.23,.035],[x,1.26,-2.975],palette.cream);
  block(g,"wardrobe-inset",[.59,2.08,.039],[x,1.26,-2.947],palette.wood);
  block(g,"wardrobe-gold-pull",[.024,.42,.05],[x+(x< -4.7?.22:-.22),1.19,-2.912],gold);
 }
 // Sofa: a real upholstered seat with distinct back, arms, cushions and piping.
 block(g,"lounge-carpet",[3.02,.025,2.65],[3.72,.025,1.18],palette.burgundy);
 block(g,"carpet-gold-inlay",[2.87,.027,2.5],[3.72,.028,1.18],gold);
 block(g,"carpet-center",[2.77,.03,2.4],[3.72,.03,1.18],linen);
 soft(g,"sofa-seat-frame",[2.26,.31,.91],[3.79,.37,.50],velvet);
 soft(g,"sofa-backrest",[2.26,.83,.25],[3.79,.76,.09],velvet);
 for(const x of [2.77,4.81])soft(g,"sofa-arm",[.23,.58,.91],[x,.61,.50],velvet);
 for(const x of [3.24,4.33]){
  soft(g,"sofa-seat-cushion",[1.02,.16,.72],[x,.61,.57],palette.burgundy);
  soft(g,"sofa-back-cushion",[.93,.51,.17],[x,.83,.23],palette.burgundy);
  soft(g,"sofa-pillow",[.39,.39,.16],[x,.94,.32],linen);
 }
 cylinder(g,"cocktail-table-marble",.58,.085,[3.53,.57,1.94],palette.marble);
 cylinder(g,"cocktail-table-gold-rim",.60,.025,[3.53,.52,1.94],gold);
 cylinder(g,"cocktail-table-pedestal",.095,.48,[3.53,.29,1.94],gold);
 cylinder(g,"cocktail-table-foot",.34,.04,[3.53,.06,1.94],gold);
 cylinder(g,"table-flower-vase",.10,.25,[3.39,.75,1.83],palette.cream);
 for(let i=0;i<5;i++)cylinder(g,"flower-stem",.014,.28,[3.33+i*.038,.99,1.83],palette.gold);
 // Wall art, stepped trim, and inset decorative panels.
 for(let i=0;i<7;i++)block(g,"walnut-wall-slat",[.055,2.46,.09],[-3.50+i*.79,1.54,-3.72],palette.wood);
 block(g,"bed-wall-art-frame",[1.42,.77,.08],[-1.05,2.63,-3.72],gold);
 block(g,"bed-wall-art",[1.30,.65,.085],[-1.05,2.63,-3.66],palette.burgundy);
 for(const x of [-1.40,-1.05,-.70])block(g,"art-gold-ray",[.025,.48,.09],[x,2.63,-3.60],gold);
}
