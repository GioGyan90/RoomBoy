import * as T from "three";
import { createNavigation } from "../../../game/navigation";
import { obstacle } from "../blueApartment/plan";
export const cabin = { left:-5.8,right:5.8,back:-3.9,front:3.9,bathRight:-2.5,bathFront:0.65,wall:.18,height:3.15 };
export const palette = {
  cream:new T.MeshStandardMaterial({color:0xe9d8bf,roughness:.8}),
  burgundy:new T.MeshStandardMaterial({color:0x752d3b,roughness:.82}),
  gold:new T.MeshStandardMaterial({color:0xd5aa61,metalness:.52,roughness:.31}),
  wood:new T.MeshStandardMaterial({color:0x674338,roughness:.72}),
  marble:new T.MeshStandardMaterial({color:0x302b32,roughness:.38}),
  glass:new T.MeshStandardMaterial({color:0x7ac7db,roughness:.14,metalness:.13,transparent:true,opacity:.65}),
  sea:new T.MeshBasicMaterial({color:0x1686ba}),
};
export function block(parent:T.Group,name:string,size:[number,number,number],at:[number,number,number],mat:T.Material){
 const m=new T.Mesh(new T.BoxGeometry(...size),mat);m.name=name;m.position.set(...at);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function cylinder(parent:T.Group,name:string,r:number,depth:number,at:[number,number,number],mat:T.Material,axis:"x"|"z"="z"){
 const m=new T.Mesh(new T.CylinderGeometry(r,r,depth,32),mat);m.name=name;m.position.set(...at);m.rotation[axis==="x"?"z":"x"]=Math.PI/2;m.castShadow=true;parent.add(m);return m;
}
export function architecture(root:T.Group){
 const p=cabin, g=new T.Group();g.name="ship-architecture";root.add(g);
 block(g,"ship-hull-foundation",[11.9,.36,8.1],[0,-.2,0],palette.wood);
 block(g,"cabin-floor",[11.55,.06,7.8],[0,-.015,0],palette.marble).userData.walkable=true;
 block(g,"rear-bulkhead",[11.7,p.height,.18],[0,p.height/2,p.back],palette.cream);
 block(g,"left-bulkhead",[.18,p.height,7.8],[p.left,p.height/2,0],palette.cream);
 block(g,"right-hull",[.18,p.height,7.8],[p.right,p.height/2,0],palette.cream);
 block(g,"front-cutaway",[11.7,.32,.18],[0,.16,p.front],palette.cream);
 for(const y of [.18,2.82])block(g,"gold-trim",[11.5,.047,.07],[0,y,p.back+.14],palette.gold);
 for(let i=0;i<3;i++){
  const z=-2.3+i*2.2;
  cylinder(g,"porthole-brass-rim",.46,.065,[p.right+.105,1.82,z],palette.gold,"x");
  cylinder(g,"porthole-ocean",.365,.071,[p.right+.15,1.82,z],palette.sea,"x");
  for(let j=0;j<8;j++){const a=j*Math.PI/4;cylinder(g,"porthole-rivet",.022,.02,[p.right+.16,1.82+Math.cos(a)*.416,z+Math.sin(a)*.416],palette.gold,"x");}
 }
 for(let i=0;i<15;i++)cylinder(g,"hull-rivet",.023,.012,[p.right+.11,.35,p.back+.22+i*.51],palette.gold,"x");
 // Bath enclosure has an open doorway facing the bedroom.
 block(g,"bath-rear-wall",[3.32,2.38,.13],[-4.16,1.19,.66],palette.cream);
 block(g,"bath-divider",[.13,2.38,1.72],[-2.5,1.19,1.49],palette.cream);
 block(g,"bath-door-jamb",[.13,2.38,.36],[-2.5,1.19,3.72],palette.wood);
 block(g,"bath-front-cutaway",[3.32,.27,.13],[-4.16,.135,p.front],palette.cream);
 // Ocean-side balcony, visually beyond the rear window.
 block(g,"balcony-deck",[3.75,.14,.72],[3.45,-.1,p.back-.48],palette.wood);
 for(const x of [1.65,3.45,5.25])block(g,"balcony-post",[.04,.85,.04],[x,.4,p.back-.82],palette.gold);
 for(const y of [.44,.81])block(g,"balcony-rail",[3.65,.035,.035],[3.45,y,p.back-.82],palette.gold);
 block(g,"balcony-glass",[3.54,.58,.025],[3.45,.48,p.back-.82],palette.glass);
 // Rear glass balcony doors and brass mullions.
 block(g,"ocean-window",[3.75,2.34,.045],[3.45,1.55,p.back+.14],palette.glass);
 for(const x of [1.56,3.45,5.34])block(g,"window-mullion",[.065,2.43,.075],[x,1.55,p.back+.18],palette.gold);
 for(const y of [.34,2.76])block(g,"window-rail",[3.82,.065,.08],[3.45,y,p.back+.18],palette.gold);
 return createNavigation([
  obstacle("rear",-5.8,5.8,-4.05,-3.75),obstacle("left",-5.9,-5.7,-3.9,3.9),
  obstacle("right",5.7,5.9,-3.9,3.9),obstacle("bath-back",-5.8,-2.5,.59,.74),
  obstacle("bath-divider",-2.57,-2.43,.65,2.35),obstacle("bath-jamb",-2.57,-2.43,3.53,3.9),
  obstacle("king-bed",-2.4,.3,-3.4,-.71),
  obstacle("wardrobe",-5.47,-3.9,-3.7,-2.9),
  obstacle("minibar",.58,2.12,-3.56,-2.88),
  obstacle("lounge-sofa",2.7,4.94,.09,1.0),
  obstacle("coffee-table",3.0,4.1,1.3,2.4),
  obstacle("bathtub",-5.55,-4.05,1.68,3.48),
  obstacle("vanity",-3.52,-2.65,.91,1.6),
  obstacle("toilet",-3.3,-2.7,2.82,3.42)
 ],{minX:-5.65,maxX:5.65,minZ:-3.72,maxZ:3.72});
}
