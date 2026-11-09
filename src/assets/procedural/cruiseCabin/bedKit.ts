import * as T from 'three';
import {block,cylinder,palette} from './architecture';
import {createDuvetGeometry} from './lowpolyAssets';
import {createCruiseFabricMaterials,createCruiseRugPrint,createCruiseMarblePrint} from './surfacePatterns';

/**
 * Bed-zone kit built as six independently addressable production modules.
 * All local coordinates are RoomBoy cruise-cabin coordinates before the
 * +0.72 x shift applied by the caller. Surface patterns are UV textures.
 */
const linen=new T.MeshStandardMaterial({color:0xfff2e3,roughness:.91});
const velvet=new T.MeshStandardMaterial({color:0x211c23,roughness:.88});
const darkGold=new T.MeshStandardMaterial({color:0xc99a53,roughness:.32,metalness:.53});
const lightGold=new T.MeshStandardMaterial({color:0xffd4a0,emissive:0xffa348,emissiveIntensity:1.05,roughness:.4});
const marbleMat=new T.MeshStandardMaterial({map:createCruiseMarblePrint(),roughness:.38});
const prints=createCruiseFabricMaterials();
const rugPrint=new T.MeshStandardMaterial({map:createCruiseRugPrint(),roughness:.92});
function assembly(parent:T.Group,name:string){const g=new T.Group();g.name=name;parent.add(g);return g;}
function cushion(g:T.Group,name:string,w:number,h:number,d:number,x:number,y:number,z:number,material:T.Material){
 const geometry=new T.BoxGeometry(w,h,d,8,2,5);
 const pos=geometry.getAttribute('position') as T.BufferAttribute;
 // Round the edges with a soft top crown and gently dropped corners.
 for(let i=0;i<pos.count;i++){
  const px=pos.getX(i),py=pos.getY(i),pz=pos.getZ(i);
  const nx=Math.abs(px)/(w/2),nz=Math.abs(pz)/(d/2);
  const top=py>0;
  const fold=Math.sin((pz/d+.5)*Math.PI*2+px*2.2)*.012;
  const drop=top?-.045*Math.pow(Math.max(nx,nz),5)+.042*(1-nx*nx)*(1-nz*nz)+fold:0;
  pos.setY(i,py+drop);
 }
 geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,material);mesh.name=name;mesh.position.set(x,y,z);
 mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
}
function segmentedUpholstery(g:T.Group){
 // Real upholstery ribs; gold perimeter is an extruded, arched frame, not an image.
 const s=new T.Shape();
 s.moveTo(-1.63,-.72);s.lineTo(-1.63,.39);
 s.bezierCurveTo(-1.63,.81,-1.33,.95,-.92,.96);
 s.lineTo(.92,.96);s.bezierCurveTo(1.33,.95,1.63,.81,1.63,.39);
 s.lineTo(1.63,-.72);s.lineTo(1.55,-.72);s.lineTo(1.55,.39);
 s.bezierCurveTo(1.55,.75,1.28,.87,.92,.88);
 s.lineTo(-.92,.88);s.bezierCurveTo(-1.28,.87,-1.55,.75,-1.55,.39);
 s.lineTo(-1.55,-.72);s.closePath();
 const gold=new T.Mesh(new T.ExtrudeGeometry(s,{depth:.06,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.01,bevelThickness:.012,curveSegments:7}),darkGold);
 gold.name='headboard-art-deco-gold-arch';gold.position.set(-1.05,1.49,-3.335);g.add(gold);
 const halo=new T.Mesh(new T.ExtrudeGeometry(s,{depth:.011,steps:1,bevelEnabled:false,curveSegments:7}),lightGold);
 halo.name='headboard-warm-halo';halo.position.set(-1.05,1.49,-3.266);g.add(halo);
}
export function buildCruiseSleepingKit(bedZone:T.Group){
 const floor=assembly(bedZone,'bed-kit-rug-and-underlight');
 block(floor,'bed-rug',[3.60,.024,4.05],[-1.05,.022,-1.44],rugPrint);
 const frame=assembly(bedZone,'bed-kit-frame-and-slats');
 // Low bed frame, a visible wooden support rail, and a set of inset slats.
 block(frame,'king-bed-frame',[2.62,.36,3.57],[-1.05,.31,-1.595],palette.wood);
 for(const x of [-2.28,.18])block(frame,'bed-frame-edge',[.045,.15,3.57],[x,.47,-1.595],palette.onyx);
 for(let i=0;i<12;i++){
  const z=-3.10+i*.255;
  block(frame,'bed-frame-slat',[2.32,.035,.105],[-1.05,.504,z],palette.wood);
 }
 block(frame,'bed-brass-base',[2.66,.045,3.60],[-1.05,.17,-1.595],darkGold);
 const underlight=assembly(frame,'bed-underframe-lighting');
 block(underlight,'floating-bed-gold-footrail',[2.55,.032,.045],[-1.05,.152,.18],darkGold);
 block(underlight,'floating-bed-amber-footlight',[2.45,.025,.023],[-1.05,.139,.212],lightGold);
 for(const x of [-2.30,.20]){
  block(underlight,'bed-side-recessed-light',[.018,.023,3.36],[x,.135,-1.59],lightGold);
 }
 const mattress=assembly(bedZone,'bed-kit-mattress');
 cushion(mattress,'pillowtop-mattress',2.42,.26,3.43,-1.05,.65,-1.585,linen);
 const bedding=assembly(bedZone,'bed-kit-duvet-and-pillows');
 const quilt=new T.Mesh(createDuvetGeometry(2.37,2.52,.12,'ivoryCloth'),prints.ivory);
 quilt.name='quilt-ivory';quilt.position.set(-1.05,.84,-1.18);
 quilt.castShadow=true;quilt.receiveShadow=true;bedding.add(quilt);
 const runner=new T.Mesh(createDuvetGeometry(2.42,.72,.045,'midnightCloth'),prints.dark);
 runner.name='quilt-burgundy-runner';runner.position.set(-1.05,.91,-.19);
 runner.castShadow=true;runner.receiveShadow=true;bedding.add(runner);
 for(const x of [-1.69,-.41])cushion(bedding,'sleeping-pillow',1.05,.19,.56,x,.88,-2.89,linen);
 const headboard=assembly(bedZone,'bed-kit-upholstered-headboard');
 block(headboard,'headboard-wood-frame',[3.42,1.76,.20],[-1.05,1.44,-3.57],palette.wood);
 block(headboard,'headboard-brass-cap',[3.44,.045,.22],[-1.05,2.33,-3.57],darkGold);
 for(let i=0;i<8;i++){
  cushion(headboard,'headboard-vertical-tuft',.35,1.46,.11,-2.39+i*.383,1.46,-3.375,velvet);
 }
 segmentedUpholstery(headboard);
 const nightstands=assembly(bedZone,'bed-kit-two-nightstands');
 for(const [side,x] of [['left',-2.87],['right',.77]] as const){
  const unit=assembly(nightstands,'bedside-'+side);
  // Open recessed shelf below a real drawer: not a blank wood cube.
  block(unit,'walnut-nightstand',[.55,.11,.62],[x,.145,-3.06],palette.wood);
  for(const dx of [-.255,.255])block(unit,'nightstand-side',[.04,.56,.61],[x+dx,.435,-3.06],palette.wood);
  block(unit,'nightstand-rear',[.46,.49,.038],[x,.43,-3.347],palette.wood);
  block(unit,'nightstand-drawer-box',[.47,.23,.54],[x,.535,-3.05],palette.wood);
  block(unit,'nightstand-drawer',[.45,.225,.022],[x,.535,-2.767],palette.wood);
  block(unit,'nightstand-marble-top',[.61,.055,.68],[x,.75,-3.06],marbleMat);
  block(unit,'nightstand-gold-footrail',[.57,.026,.64],[x,.087,-3.06],darkGold);
  block(unit,'drawer-pull',[.17,.023,.035],[x,.535,-2.742],darkGold);
 }
 const lamps=assembly(bedZone,'bed-kit-reading-lamps-and-controls');
 for(const x of [-2.59,.49]){
  const reading=assembly(lamps,'bed-reading-lamp');
  // Gold wall plate touches rear walnut panel; angled reading arm and lamp body.
  cylinder(reading,'reading-lamp-wall-plate',.095,.028,[x,1.70,-3.426],darkGold,'z');
  const arm=block(reading,'reading-lamp-arm',[.038,.35,.038],[x,1.55,-3.33],darkGold);
  arm.rotation.z=x<0?.32:-.32;
  const head=cylinder(reading,'reading-lamp-head',.082,.20,[x+(x<0?.07:-.07),1.39,-3.22],darkGold);
  head.rotation.z=x<0?.4:-.4;
  cylinder(reading,'reading-lamp-diffuser',.058,.015,[x+(x<0?.13:-.13),1.29,-3.22],lightGold);
  block(lamps,'reading-control-panel',[.19,.23,.026],[x,1.09,-3.449],palette.onyx);
  for(const dx of [-.048,.048])for(const dy of [-.06,.02,.095]){
   cylinder(lamps,'reading-control-dot',.010,.008,[x+dx,1.09+dy,-3.429],darkGold,'z');
  }
 }
 return bedZone;
}
