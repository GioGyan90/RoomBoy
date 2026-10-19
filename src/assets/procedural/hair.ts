import * as T from 'three';
import type {P3} from './sculpt';
/** Radial blade frame keeps each lock broad against the skull and thin in profile. */
function lock(parent:T.Object3D,points:P3[],width:number,mat:T.Material,highlight:T.Material){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),rows=32,cols=10;
 const vertices:number[]=[],indices:number[]=[];const streak:P3[]=[];
 for(let i=0;i<=rows;i++){
  const t=i/rows,p=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
  const radial=p.clone().sub(new T.Vector3(0,.15,-.02)).normalize();
  let axis=new T.Vector3().crossVectors(tangent,radial);if(axis.lengthSq()<.01)axis.set(1,0,0);axis.normalize();
  const normal=new T.Vector3().crossVectors(axis,tangent).normalize();if(normal.dot(radial)<0)normal.negate();
  const taper=Math.pow(Math.max(.001,1-t),.68),w=width*(.48+.70*Math.sin(Math.PI*t))*taper,d=.006*(.7+.3*Math.sin(Math.PI*t))*taper;
  for(let j=0;j<=cols;j++){
   const a=j/cols*Math.PI*2,v=p.clone().addScaledVector(axis,Math.sin(a)*w).addScaledVector(normal,Math.cos(a)*d);vertices.push(v.x,v.y,v.z);
  }
  if(i>3&&i<rows-6){const q=p.clone().addScaledVector(normal,d+.0004).addScaledVector(axis,w*.25);streak.push([q.x,q.y,q.z]);}
 }
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+1,c=a+cols+1;indices.push(a,b,c,c,b,c+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const m=new T.Mesh(g,mat);m.castShadow=true;m.receiveShadow=true;m.name='hair-lock';parent.add(m);
 if(streak.length>4){const detail=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(streak.map(p=>new T.Vector3(...p))),24,.00045,5,false),highlight);detail.name='hair-groove';parent.add(detail);}
}
export function createHair(head:T.Group,hair:T.Material,highlight:T.Material){
 const locks:P3[][]=[
  [[-.027,.283,-.024],[-.065,.276,.035],[-.108,.233,.077],[-.121,.174,.075],[-.113,.117,.056]],
  [[-.023,.281,-.010],[-.052,.270,.065],[-.080,.226,.106],[-.080,.169,.115],[-.055,.135,.113]],
  [[-.018,.277,.008],[-.031,.253,.095],[-.037,.206,.120],[-.026,.171,.123],[-.008,.145,.112]],
  [[-.011,.276,.018],[.011,.249,.102],[.030,.205,.121],[.025,.170,.123],[.011,.150,.113]],
  [[-.006,.280,.004],[.036,.268,.073],[.062,.230,.111],[.070,.186,.112],[.058,.146,.103]],
  [[-.004,.281,-.010],[.064,.271,.042],[.108,.244,.076],[.130,.220,.070],[.153,.219,.033]],
  [[-.004,.279,-.034],[.079,.260,.006],[.126,.223,.030],[.134,.181,.031],[.123,.149,.017]],
  [[-.040,.273,-.038],[-.095,.251,-.003],[-.131,.213,.032],[-.138,.163,.019],[-.131,.139,-.010]],
 ];
 locks.forEach((p,i)=>lock(head,p,i===5?.034:.026+(i%3)*.002,hair,highlight));
 // Fine fringe breakups follow the same parted flow rather than isolated straight spikes.
 for(let i=0;i<5;i++){
  const x=-.087+i*.037;
  lock(head,[[-.022,.271,.031],[x*.5,.245,.095],[x,.199,.116],[x+(i<2?.014:-.010),.126+(i%2)*.012,.100]],.010,hair,highlight);
 }
 // Side layers sit above the ears; the back ends in a short broken nape.
 for(const s of [-1,1])for(let i=0;i<7;i++){
  const a=.65+i*.25;
  lock(head,[[s*.015,.279,-.032],[s*(.094+.007*Math.sin(i)),.249,-.038-i*.007],[s*(.124+.009*Math.sin(i*1.8)),.186,-.040-i*.010],[s*(.112+.012*Math.sin(i)),.104-i*.004,-.044-i*.010]],.020+(i%2)*.006,hair,highlight);
 }
 for(let i=0;i<11;i++){
  const x=(i-5)*.017;
  lock(head,[[x*.6,.251,-.087],[x*1.25,.193,-.118],[x*1.16,.112,-.107],[x*1.09,.047+(i%3)*.010,-.072]],.022,hair,highlight);
 }
 // Broader diagonal back layers break the parallel nape pattern.
 lock(head,[[-.042,.276,-.022],[.024,.269,-.080],[.079,.229,-.112],[.092,.173,-.114],[.064,.107,-.108]],.027,hair,highlight);
 lock(head,[[-.031,.273,-.035],[-.075,.245,-.086],[-.108,.190,-.092],[-.087,.125,-.108],[-.061,.080,-.094]],.023,hair,highlight);
 // Two modest crown wisps break the circular outline visible from the front and back.
 lock(head,[[-.035,.262,-.045],[-.032,.299,-.020],[-.006,.302,.008],[.012,.278,.026]],.007,hair,highlight);
 lock(head,[[-.055,.257,-.028],[-.080,.283,-.002],[-.100,.267,.032]],.006,hair,highlight);
}
