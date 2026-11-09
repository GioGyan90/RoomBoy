import * as T from "three";
import { createNavigation } from "../../../game/navigation";
import { obstacle } from "../blueApartment/plan";
import {createCruiseFloorPrint} from "./surfacePatterns";
import {bathroomStructure} from "./bathroomStructure";
export const cabin = { left:-5.8,right:5.8,back:-3.9,front:3.9,bathRight:-2.5,bathFront:0.65,wall:.18,height:3.15 };
export const palette = {
  cream:new T.MeshStandardMaterial({color:0xe9d8bf,roughness:.8}),
  burgundy:new T.MeshStandardMaterial({color:0x752d3b,roughness:.82}),
  gold:new T.MeshStandardMaterial({color:0xd5aa61,metalness:.52,roughness:.31}),
  wood:new T.MeshStandardMaterial({color:0x674338,roughness:.72}),
  marble:new T.MeshStandardMaterial({color:0x302b32,roughness:.38}),
  glass:new T.MeshStandardMaterial({color:0x7ac7db,roughness:.14,metalness:.13,transparent:true,opacity:.65}),
  sea:new T.MeshBasicMaterial({color:0x1686ba}),
  shell:new T.MeshStandardMaterial({color:0xf3d8dc,roughness:.53,metalness:.08}),
  ivory:new T.MeshStandardMaterial({color:0xfff0df,roughness:.81}),
  onyx:new T.MeshStandardMaterial({color:0x211d22,roughness:.33}),
};
export function block(parent:T.Group,name:string,size:[number,number,number],at:[number,number,number],mat:T.Material){
 const m=new T.Mesh(new T.BoxGeometry(...size),mat);m.name=name;m.position.set(...at);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function cylinder(parent:T.Group,name:string,r:number,depth:number,at:[number,number,number],mat:T.Material,axis:"x"|"y"|"z"="y"){
 const m=new T.Mesh(new T.CylinderGeometry(r,r,depth,32),mat);m.name=name;m.position.set(...at);if(axis==="x")m.rotation.z=Math.PI/2;else if(axis==="z")m.rotation.x=Math.PI/2;m.castShadow=true;parent.add(m);return m;
}
const printedFloor=new T.MeshStandardMaterial({map:createCruiseFloorPrint(),roughness:.42,color:0xffffff});
export function architecture(root:T.Group){
 const p=cabin, g=new T.Group();g.name="ship-architecture";root.add(g);
 block(g,"ship-hull-foundation",[11.9,.36,8.1],[0,-.2,0],palette.shell);
 block(g,"cabin-floor",[11.55,.06,7.8],[0,-.015,0],printedFloor).userData.walkable=true;
 // Floor fillet lines live inside the UV material; no raised rods on the floor.
 // Split the rear bulkhead around the balcony opening: no opaque wall behind the glass.
 block(g,"rear-bulkhead-left",[7.35,p.height,.18],[-2.125,p.height/2,p.back],palette.cream);
 // The reference has a solid walnut rear bulkhead; sea access is on the starboard curve.
 block(g,"rear-bulkhead-right",[4.24,p.height,.18],[3.675,p.height/2,p.back],palette.cream);
 block(g,"rear-wood-panel",[3.92,2.51,.057],[3.67,1.48,p.back+.12],palette.wood);
 for(const x of [1.78,3.36,5.28])block(g,"rear-panel-gold-reveal",[.035,2.48,.061],[x,1.49,p.back+.155],palette.gold);
 // Structural rhythm is provided by the dedicated luxury wall panels; no duplicate slats.
 for(const y of [.31,2.83])block(g,"rear-brass-rail",[7.22,.036,.10],[-2.12,y,p.back+.14],palette.gold);
 // Cutaway for the bathroom: the full-height exterior sidewall blocked the tub in isometric view.
 // Subtract the 1.25m entrance opening from the left shell by segmenting it
 // into four physical, watertight wall pieces (no opaque slab behind the door).
 const entryWall=new T.Group();entryWall.name="left-bulkhead-bedroom";g.add(entryWall);
 block(entryWall,"entry-wall-aft",[.18,p.height,1.045],[p.left,p.height/2,-3.3775],palette.shell);
 block(entryWall,"entry-wall-forward",[.18,p.height,2.255],[p.left,p.height/2,-.4775],palette.shell);
 block(entryWall,"entry-wall-header",[.18,.57,1.25],[p.left,2.865,-2.23],palette.shell);
 block(entryWall,"entry-wall-threshold",[.18,.12,1.25],[p.left,.06,-2.23],palette.shell);
 block(g,"left-bulkhead-bath-cutaway",[.18,.62,3.25],[p.left,.31,2.275],palette.shell);
 block(g,"left-bath-sill",[.23,.07,3.25],[p.left,.65,2.275],palette.shell);
 block(g,"left-bath-gold-hairline",[.022,.012,3.20],[p.left+.12,.689,2.275],palette.gold);
 // Actual side openings, not solid wall panels painted blue.
 block(g,"right-hull-aft",[.18,p.height,1.05],[p.right,p.height/2,-3.375],palette.shell);
 block(g,"right-hull-fore",[.18,p.height,2.75],[p.right,p.height/2,2.525],palette.shell);
 block(g,"right-window-sill",[.18,.55,2.60],[p.right,.275,-1.55],palette.shell);
 block(g,"right-window-lintel",[.18,.47,2.60],[p.right,2.915,-1.55],palette.shell);
 block(g,"right-balcony-sill",[.18,.15,1.40],[p.right,.075,.45],palette.shell);
 block(g,"right-balcony-lintel",[.18,.22,1.40],[p.right,3.04,.45],palette.shell);
 for(const z of [-2.85,-.25,1.15])block(g,"right-window-post",[.19,p.height,.10],[p.right,p.height/2,z],palette.shell);
 // Two rail runs either side of the balcony aperture; no metal line across glass.
 for(const y of [.35,2.84]){
  block(g,"hull-longitudinal-brass-aft",[.027,.048,3.55],[p.right+.104,y,-2.055],palette.gold);
  block(g,"hull-longitudinal-brass-fore",[.027,.048,2.69],[p.right+.104,y,2.515],palette.gold);
 }
 block(g,"front-cutaway",[11.7,.32,.18],[0,.16,p.front],palette.shell);
 for(const y of [.18,2.82])block(g,"gold-trim",[7.22,.047,.07],[-2.12,y,p.back+.14],palette.gold);
 // The giant side windows are assembled in referenceArchitecture.ts.
 // Independent bathroom shell: door/partition/threshold share a single module.
 bathroomStructure(root);
 // Starboard-side ocean window, side balcony and curved hull are authored separately.
 return createNavigation([
  obstacle("rear",-5.8,5.8,-4.05,-3.75),obstacle("left",-5.9,-5.7,-3.9,3.9),
  obstacle("right",5.7,5.9,-3.9,3.9),obstacle("bath-back",-5.8,-2.5,.59,.74),
  obstacle("bath-divider",-2.57,-2.43,.65,2.18),obstacle("bath-jamb",-2.57,-2.43,3.53,3.9),
  obstacle("king-bed",-2.4,.3,-3.4,.70),
  obstacle("wardrobe",-5.47,-3.9,-3.7,-2.9),
  obstacle("minibar",-5.50,-4.80,-1.80,-.24),
  obstacle("lounge-sofa",2.7,4.94,.09,1.0),
  obstacle("coffee-table",3.0,4.1,1.3,2.4),
  obstacle("bathtub",-5.55,-4.05,1.68,3.48),
  obstacle("vanity",-3.52,-2.65,.91,1.6),
  obstacle("toilet",-3.68,-3.02,2.72,3.53)
 ],{minX:-5.65,maxX:5.65,minZ:-3.72,maxZ:3.72});
}
