import * as T from 'three';
import {referenceFrame,sourceJoints,sourcePoint,fitJointTargets,hairRim,type BodyTargets,type JointName} from './bodyReference';
import {constrainBands,measureReprojection,type BodyPart,type MeshLandmarks} from './bodyConstraints';

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

export function createBodyBlockout(stage:BodyStage,targets:BodyTargets=fitJointTargets()){
 const root=new T.Group();root.name=`body-${stage}`;
 const refined=stage==='planes',sides=refined?12:8;
 const palette={head:0xc9bdaa,torso:0xa9b8bb,pelvis:0xb9aaa1,limbs:0xc6c1b5,joints:0xb1ada3,hair:0x5e6060};
 function mass(name:string,part:BodyPart,color:number){
  const bands=constrainBands(part,targets);
  // Both resolutions use the same measured section positions. Refinement adds
  // radial faces only; decimating anatomical stations would change the silhouette.
  const rings:Ring[]=bands.map(([y,l,r,f,b])=>[
   (referenceFrame.ground-y)*referenceFrame.scale,(r-l)*referenceFrame.scale/2,
   (b-f)*referenceFrame.scale/2,(referenceFrame.sideAxis-(f+b)/2)*referenceFrame.scale,
   ((l+r)/2-referenceFrame.frontAxis)*referenceFrame.scale,
  ]);
  const m=new T.Mesh(cage(rings,sides),new T.MeshStandardMaterial({color,roughness:1,flatShading:true}));m.name=name;m.userData.bandCount=bands.length;root.add(m);return m;
 }
 const pelvis=mass('pelvis','pelvis',palette.pelvis);
 const pp=pelvis.geometry.getAttribute('position');for(let i=0;i<sides;i++)pp.setY(i,pp.getY(i)+.050*Math.abs(Math.sin(i/sides*Math.PI*2)));pelvis.geometry.computeVertexNormals();
 mass('abdomen','abdomen',palette.torso);mass('ribcage','ribcage',palette.torso);
 mass('neck','neck',palette.joints);mass('head','head',palette.head);
 const hair=mass('hair-envelope','hair',palette.hair);
 // The single envelope reaches down the nape without lowering the front hairline.
 const hp=hair.geometry.getAttribute('position');for(let i=0;i<sides;i++){
  const t=i/sides*hairRim.length,index=Math.floor(t),u=t-index,a=hairRim[index],b=hairRim[(index+1)%hairRim.length];
  hp.setXYZ(i,...sourcePoint([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u]));
 }hair.geometry.computeVertexNormals();
 for(const side of ['right','left'] as const){
  for(const [part,section] of [['deltoid','Deltoid'],['upper-arm','UpperArm'],['forearm','Forearm'],['hand','Hand'],['thigh','Thigh'],['shin','Shin'],['foot','Foot']] as const){
   mass(`${side}-${part}`,`${side}${section}`,['hand','foot'].includes(part)?palette.head:palette.limbs);
  }
 }
 // Read actual geometry vertices, never copy the target coordinates into markers.
 const actual={} as MeshLandmarks;
 function read(name:JointName,meshName:string,at:'bottom'|'top'|'front'){
  const m=root.getObjectByName(meshName) as T.Mesh,p=m.geometry.getAttribute('position'),index=at==='front'?0:m.userData.bandCount*sides+(at==='top'?1:0);
  actual[name]=[p.getX(index),p.getY(index),p.getZ(index)];
 }
 read('crown','hair-envelope','top');read('chin','head','front');read('neck','neck','bottom');
 for(const side of ['right','left'] as const){
  read(`${side}Shoulder`,`${side}-upper-arm`,'top');read(`${side}Elbow`,`${side}-forearm`,'top');read(`${side}Wrist`,`${side}-forearm`,'bottom');
  read(`${side}Hip`,`${side}-thigh`,'top');read(`${side}Knee`,`${side}-shin`,'top');read(`${side}Ankle`,`${side}-shin`,'bottom');
 }
 root.userData.landmarks=actual;root.userData.fitReport=measureReprojection(actual);
 root.userData.triangles=0;root.traverse(o=>{if(o instanceof T.Mesh)root.userData.triangles+=o.geometry.index!.count/3;});
 return root;
}
