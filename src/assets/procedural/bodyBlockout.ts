import * as T from 'three';
import {bodyBands,referenceFrame,sourceJoints,sourcePoint,type SourceBand} from './bodyReference';

/** Metres. Image landmarks estimated from the supplied 1200 × 800 turnaround.
 * These are editable design measurements, not inferred anatomical ground truth. */
export const bodyPlan = {
 height:1.80, chin:sourcePoint(sourceJoints.chin)[1], shoulder:sourcePoint(sourceJoints.rightShoulder)[1], waist:sourcePoint([554,320,795])[1], crotch:sourcePoint([554,421,795])[1],
 knee:sourcePoint(sourceJoints.rightKnee)[1], ankle:sourcePoint(sourceJoints.rightAnkle)[1], shoulderWidth:.461, waistWidth:.294, hipWidth:.345,
 headWidth:.176, headDepth:.205,
} as const;
export type BodyStage='blockout'|'planes';
type Ring=readonly [y:number, halfWidth:number, halfDepth:number, z?:number, x?:number];

/** Explicit polygon cage: no smoothing, spline inflation, or hidden subdivision. */
export function cage(rings:readonly Ring[],sides:number){
 const p:number[]=[],idx:number[]=[];
 for(const [y,w,d,z=0,x=0] of rings)for(let i=0;i<sides;i++){
  const a=i/sides*Math.PI*2;p.push(x+Math.sin(a)*w,y,z+Math.cos(a)*d);
 }
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<sides;i++){
  const a=r*sides+i,b=r*sides+(i+1)%sides,c=a+sides,d=b+sides;idx.push(a,b,c,b,d,c);
 }
 // Separate centre vertices close the ends, including hands and heels.
 for(const end of [0,rings.length-1]){
  const [y,,,z=0,x=0]=rings[end],c=p.length/3;p.push(x,y,z);
  for(let i=0;i<sides;i++){const a=end*sides+i,b=end*sides+(i+1)%sides;idx.push(...(end===0?[c,b,a]:[c,a,b]));}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}

export function createBodyBlockout(stage:BodyStage){
 const root=new T.Group();root.name=`body-${stage}`;
 const refined=stage==='planes',sides=refined?12:8;
 const palette={head:0xc9bdaa,torso:0xa9b8bb,pelvis:0xb9aaa1,limbs:0xc6c1b5,joints:0xb1ada3,hair:0x5e6060};
 function mass(name:string,bands:readonly SourceBand[],color:number){
  // Both resolutions use the same measured section positions. Refinement adds
  // radial faces only; decimating anatomical stations would change the silhouette.
  const rings:Ring[]=bands.map(([y,l,r,f,b])=>[
   (referenceFrame.ground-y)*referenceFrame.scale,(r-l)*referenceFrame.scale/2,
   (b-f)*referenceFrame.scale/2,(referenceFrame.sideAxis-(f+b)/2)*referenceFrame.scale,
   ((l+r)/2-referenceFrame.frontAxis)*referenceFrame.scale,
  ]);
  const m=new T.Mesh(cage(rings,sides),new T.MeshStandardMaterial({color,roughness:1,flatShading:true}));m.name=name;root.add(m);return m;
 }
 const pelvis=mass('pelvis',bodyBands.pelvis,palette.pelvis);
 const pp=pelvis.geometry.getAttribute('position');for(let i=0;i<sides;i++)pp.setY(i,pp.getY(i)+.050*Math.abs(Math.sin(i/sides*Math.PI*2)));pelvis.geometry.computeVertexNormals();
 mass('abdomen',bodyBands.abdomen,palette.torso);mass('ribcage',bodyBands.ribcage,palette.torso);
 mass('neck',bodyBands.neck,palette.joints);mass('head',bodyBands.head,palette.head);
 const hair=mass('hair-envelope',bodyBands.hair,palette.hair);
 // The single envelope reaches down the nape without lowering the front hairline.
 const hp=hair.geometry.getAttribute('position');for(let i=0;i<sides;i++){
  const a=i/sides*Math.PI*2;hp.setY(i,hp.getY(i)-.105*Math.max(0,-Math.cos(a)));
 }hair.geometry.computeVertexNormals();
 for(const side of ['right','left'] as const){
  for(const [part,section] of [['deltoid','Deltoid'],['upper-arm','UpperArm'],['forearm','Forearm'],['hand','Hand'],['thigh','Thigh'],['shin','Shin'],['foot','Foot']] as const){
   mass(`${side}-${part}`,bodyBands[`${side}${section}`],['hand','foot'].includes(part)?palette.head:palette.limbs);
  }
 }
 root.userData.landmarks=Object.fromEntries(Object.entries(sourceJoints).map(([name,point])=>[name,sourcePoint(point)]));
 root.userData.triangles=0;root.traverse(o=>{if(o instanceof T.Mesh)root.userData.triangles+=o.geometry.index!.count/3;});
 return root;
}
