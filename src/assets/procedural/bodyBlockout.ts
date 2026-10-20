import * as T from 'three';
import {applyMeasuredVertexEdits} from './bodyVertexEdits';
import {shapeBodyStructure} from './bodyStructure';
import {referenceFrame,sourceJoints,sourcePoint,fitJointTargets,hairRim,type BodyTargets,type JointName} from './bodyReference';
import {constrainBands,measureReprojection,type BodyPart,type MeshLandmarks} from './bodyConstraints';

/** Metres. Image landmarks estimated from the simplified 1536 × 1024 blockout sheet.
 * These are editable design measurements, not inferred anatomical ground truth. */
export const bodyPlan = {
 height:1.80, chin:sourcePoint(sourceJoints.chin)[1], shoulder:sourcePoint(sourceJoints.rightShoulder)[1], waist:sourcePoint([383,390,770])[1], crotch:sourcePoint([383,507,770])[1],
 knee:sourcePoint(sourceJoints.rightKnee)[1], ankle:sourcePoint(sourceJoints.rightAnkle)[1], shoulderWidth:.415, waistWidth:.250, hipWidth:.316,
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

export function createBodyBlockout(stage:BodyStage,targets:BodyTargets=fitJointTargets(),calibrate=true){
 const root=new T.Group();root.name=`body-${stage}`;
 const refined=stage==='planes',sides=refined?12:8;
 const palette={head:0xd1c0a7,torso:0xa5ae92,pelvis:0xa79db7,limbs:0x9ba5b9,joints:0xd5b98c,hair:0x929db2,chest:0xc9a293};
 function mass(name:string,part:BodyPart,color:number){
  const bands=constrainBands(part,targets);const radialSides=['ribcage','pelvis','hair'].includes(part)?Math.max(16,sides):part.endsWith('Deltoid')?Math.max(12,sides):sides;
  // Both resolutions use the same measured section positions. Refinement adds
  // radial faces only; decimating anatomical stations would change the silhouette.
  const rings:Ring[]=bands.map(([y,l,r,f,b])=>[
   (referenceFrame.ground-y)*referenceFrame.scale,(r-l)*referenceFrame.scale/2,
   (b-f)*referenceFrame.scale/2,(referenceFrame.sideAxis-(f+b)/2)*referenceFrame.scale,
   ((l+r)/2-referenceFrame.frontAxis)*referenceFrame.scale,
  ]);
  const m=new T.Mesh<T.BufferGeometry,T.Material|T.Material[]>(cage(rings,radialSides),new T.MeshStandardMaterial({color,roughness:1,flatShading:true}));m.name=name;m.userData.bandCount=bands.length;m.userData.sourceBands=bands;m.userData.radialSides=radialSides;shapeBodyStructure(part,bands,radialSides,m.geometry);root.add(m);return m;
 }
 const pelvis=mass('pelvis','pelvis',palette.pelvis);
 const pp=pelvis.geometry.getAttribute('position');
 // Warp the entire lower opening coherently. Raising only its last ring folds
 // the neighbouring glute rings through each other and creates posterior spikes.
 for(const [ring,band] of (pelvis.userData.sourceBands as readonly (readonly number[])[]).entries()){
  const weight=Math.max(0,(band[0]-453)/(507-453));
  for(let i=0;i<pelvis.userData.radialSides;i++){const a=i/pelvis.userData.radialSides*Math.PI*2,s=Math.abs(Math.sin(a)),rise=Math.cos(a)<0?referenceFrame.pelvisRise*s**4+19*Math.exp(-((s/.25)**2)):referenceFrame.pelvisRise*s,index=ring*pelvis.userData.radialSides+i;pp.setY(index,pp.getY(index)+rise*weight*referenceFrame.scale);}
 }pelvis.geometry.computeVertexNormals();
 mass('abdomen','abdomen',palette.joints);const chest=mass('ribcage','ribcage',palette.torso);
 // Colour groups expose the simplified drawing's upper/lower chest partition.
 const geometry=chest.geometry,upper=new T.MeshStandardMaterial({color:palette.chest,roughness:1,flatShading:true});chest.material=[chest.material as T.MeshStandardMaterial,upper];
 geometry.clearGroups();for(let ring=0;ring<chest.userData.bandCount-1;ring++){geometry.addGroup(ring*chest.userData.radialSides*6,chest.userData.radialSides*6,chest.userData.sourceBands[ring][0]<=280?1:0);}geometry.addGroup((chest.userData.bandCount-1)*chest.userData.radialSides*6,chest.userData.radialSides*3,0);geometry.addGroup((chest.userData.bandCount-1)*chest.userData.radialSides*6+chest.userData.radialSides*3,chest.userData.radialSides*3,1);
 mass('neck','neck',palette.joints);mass('head','head',palette.head);
 const hair=mass('hair-envelope','hair',palette.hair);
 // The single envelope reaches down the nape without lowering the front hairline.
 const hp=hair.geometry.getAttribute('position');for(let i=0;i<hair.userData.radialSides;i++){
  const t=i/hair.userData.radialSides*hairRim.length,index=Math.floor(t),u=t-index,a=hairRim[index],b=hairRim[(index+1)%hairRim.length];
  hp.setXYZ(i,...sourcePoint([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u]));
 }hair.geometry.computeVertexNormals();
 for(const side of ['right','left'] as const){
  for(const [part,section] of [['deltoid','Deltoid'],['upper-arm','UpperArm'],['forearm','Forearm'],['hand','Hand'],['thigh','Thigh'],['shin','Shin'],['foot','Foot']] as const){
   mass(`${side}-${part}`,`${side}${section}`,['hand','foot'].includes(part)?palette.joints:part==='thigh'?palette.chest:part==='forearm'?palette.torso:palette.limbs);
  }
 }
 if(calibrate)applyMeasuredVertexEdits(root);
 // Read actual geometry vertices, never copy the target coordinates into markers.
 const actual={} as MeshLandmarks;
 function read(name:JointName,meshName:string,at:'bottom'|'top'|'front'){
  const m=root.getObjectByName(meshName) as T.Mesh,p=m.geometry.getAttribute('position'),index=at==='front'?0:m.userData.bandCount*m.userData.radialSides+(at==='top'?1:0);
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

