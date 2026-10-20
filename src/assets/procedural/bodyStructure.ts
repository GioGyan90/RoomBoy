import * as T from 'three';
import {referenceFrame as f,type SourceBand} from './bodyReference';
import type {BodyPart} from './bodyConstraints';
/** Low-poly anatomical planes integrated into closed cages, not attached spheres. */
export function shapeBodyStructure(part:BodyPart,bands:readonly SourceBand[],sides:number,geometry:T.BufferGeometry){
 const p=geometry.getAttribute('position');
 for(const [ring,[sy,l,r,front,back]] of bands.entries()){
  const cx=((l+r)/2-f.frontAxis)*f.scale,cz=(f.sideAxis-(front+back)/2)*f.scale,d=(back-front)*f.scale/2;
  for(let j=0;j<sides;j++){
   const i=ring*sides+j,a=j/sides*Math.PI*2,c=Math.cos(a),x=p.getX(i)-cx;
   if(part==='ribcage'&&c>0){
    const active=Math.exp(-(((sy-252)/29)**2)),arc=c+(Math.pow(c,.28)-c)*active;
    const sternum=.0105*Math.exp(-((x/.024)**2))*active;
    p.setZ(i,cz+d*arc-sternum);
   }
   if(part==='pelvis'&&c<0){
    const active=Math.exp(-(((sy-465)/34)**2)),arc=-c+(Math.pow(-c,.28)+c)*active;
    const sacralGroove=.009*Math.exp(-((x/.025)**2))*active;
    p.setZ(i,cz-d*arc+sacralGroove);
   }
   if(part==='neck'&&ring===0&&c<0){
    // Broaden and lower only the posterior collar into the trapezius shelf.
    const rear=-c;p.setY(i,p.getY(i)-.026*rear);p.setX(i,cx+x*(1+.35*rear));
   }
  }
 }
 geometry.computeVertexNormals();
}
