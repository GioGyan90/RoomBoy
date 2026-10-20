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
    const sternum=.0125*Math.exp(-((x/.024)**2))*active;
    // Separate the shallow clavicular shelf from the fuller pectoral plane.
    const clavicle=.004*Math.exp(-(((sy-232)/12)**2))*(1-Math.exp(-((x/.035)**2)))*c;
    p.setZ(i,cz+d*arc-sternum+clavicle);
   }
   if(part.endsWith('Deltoid')){
    // Broad anterior/posterior facets wrap the shoulder cap; its lower tip
    // narrows into the upper arm instead of ending in a horizontal cylinder.
    const active=Math.exp(-(((sy-258)/27)**2));
    const arc=Math.sign(c)*Math.pow(Math.abs(c),1-.28*active);
    p.setZ(i,cz+d*arc);
   }
   if(part==='pelvis'&&c<0){
    const active=Math.exp(-(((sy-465)/34)**2)),arc=-c+(Math.pow(-c,.28)+c)*active;
    const sacralGroove=.009*Math.exp(-((x/.025)**2))*active;
    p.setZ(i,cz-d*arc+sacralGroove);
   }
   if(part==='neck'&&c>0){
    // Paired sternocleidomastoid planes converge toward the suprasternal
    // notch instead of reading as horizontal rings on a flared tube.
    const t=Math.max(0,Math.min(1,(sy-138)/(205-138))),ridge=(14-6*t)*f.scale;
    const q=Math.min(j,sides-j);
    if(q===1)p.setX(i,cx+Math.sign(Math.sin(a))*ridge*.45);
    if(q===2)p.setX(i,cx+Math.sign(Math.sin(a))*ridge);
    p.setZ(i,cz+d*Math.pow(c,.35)+(q===2?.006:q===0?-.004:0));
   }
   if(part==='neck'&&ring===0&&c<0){
    // Broaden and lower only the posterior collar into the trapezius shelf.
    const rear=-c;p.setY(i,p.getY(i)-.026*rear);p.setX(i,cx+x*(1+.35*rear));
   }
  }
 }
 geometry.computeVertexNormals();
}
