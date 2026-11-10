import * as T from 'three';
import {createCruiseMarblePrint} from '../surfacePatterns';
export const bathMaterials={
 mirror:new T.MeshStandardMaterial({color:0xb5b2a9,metalness:.72,roughness:.19}),
 water:new T.MeshStandardMaterial({color:0xc8e3e9,roughness:.17,metalness:.06,transparent:true,opacity:.30,depthWrite:false}),
 marble:new T.MeshStandardMaterial({map:createCruiseMarblePrint(),roughness:.4,color:0xffffff}),
 innerCeramic:new T.MeshStandardMaterial({color:0xd0d5d2,roughness:.67}),
 brass:new T.MeshStandardMaterial({color:0xe6b873,metalness:.62,roughness:.29}),
};
export function ovalOpening(outerX:number,outerZ:number,innerX:number,innerZ:number,depth:number){
 const s=new T.Shape();
 s.absellipse(0,0,outerX,outerZ,0,Math.PI*2,false,0);
 const hole=new T.Path();
 hole.absellipse(0,0,innerX,innerZ,0,Math.PI*2,true,0);
 s.holes.push(hole);
 const geo=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.015,bevelThickness:.012,curveSegments:24});
 geo.rotateX(-Math.PI/2);
 return geo;
}

/** Beveled low-poly mirror / service plate with an actual rounded perimeter. */
export function roundedPanelGeometry(width:number,height:number,radius:number,thickness=.018){
 const s=new T.Shape(),x=-width/2,y=-height/2,w=width,h=height,r=Math.min(radius,width*.48,height*.48);
 s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
 s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);
 s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);s.closePath();
 return new T.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:2,curveSegments:7});
}
