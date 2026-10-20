import * as T from 'three';
import {referenceFrame as f,type ImagePoint,type StudyView} from './bodyReference';
export type VertexObservation={id:string;mesh:string;ring:'bottom'|'top'|number;spoke:number;divisions:number;front?:ImagePoint;side?:ImagePoint;back?:ImagePoint};
/** Hand-read CORNERS from the simplified sheet, not anatomical shape functions.
 * Unobserved axes retain their old values. Different view heights are averaged
 * and the disagreement remains visible in the report; no zero-error claim. */
export const vertexObservations:readonly VertexObservation[]=[
 {id:'N0',mesh:'neck',ring:'bottom',spoke:0,divisions:8,front:[383,216],side:[751,209]},
 {id:'N1',mesh:'neck',ring:'bottom',spoke:1,divisions:8,front:[411,211],side:[770,204]},
 {id:'N2',mesh:'neck',ring:'bottom',spoke:2,divisions:8,front:[432,197],side:[800,190]},
 {id:'N3',mesh:'neck',ring:'bottom',spoke:3,divisions:8,back:[1121,177],side:[811,185]},
 {id:'N4',mesh:'neck',ring:'bottom',spoke:4,divisions:8,back:[1151,176],side:[818,186]},
 {id:'N5',mesh:'neck',ring:'bottom',spoke:5,divisions:8,back:[1181,177],side:[811,185]},
 {id:'N6',mesh:'neck',ring:'bottom',spoke:6,divisions:8,front:[334,197],side:[800,190]},
 {id:'N7',mesh:'neck',ring:'bottom',spoke:7,divisions:8,front:[357,211],side:[770,204]},
 {id:'H0',mesh:'pelvis',ring:'bottom',spoke:0,divisions:16,front:[383,513],side:[725,497]},
 {id:'H1',mesh:'pelvis',ring:'bottom',spoke:1,divisions:16,front:[409,506]},
 {id:'H2',mesh:'pelvis',ring:'bottom',spoke:2,divisions:16,front:[432,488]},
 {id:'H3',mesh:'pelvis',ring:'bottom',spoke:3,divisions:16,front:[447,475]},
 {id:'H4',mesh:'pelvis',ring:'bottom',spoke:4,divisions:16,front:[459,464],back:[1071,470]},
 {id:'H5',mesh:'pelvis',ring:'bottom',spoke:5,divisions:16,back:[1086,485]},
 {id:'H6',mesh:'pelvis',ring:'bottom',spoke:6,divisions:16,back:[1108,499]},
 {id:'H7',mesh:'pelvis',ring:'bottom',spoke:7,divisions:16,back:[1129,507]},
 {id:'H8',mesh:'pelvis',ring:'bottom',spoke:8,divisions:16,back:[1151,510],side:[814,510]},
 {id:'H9',mesh:'pelvis',ring:'bottom',spoke:9,divisions:16,back:[1173,507]},
 {id:'H10',mesh:'pelvis',ring:'bottom',spoke:10,divisions:16,back:[1194,499]},
 {id:'H11',mesh:'pelvis',ring:'bottom',spoke:11,divisions:16,back:[1216,485]},
 {id:'H12',mesh:'pelvis',ring:'bottom',spoke:12,divisions:16,front:[307,464],back:[1231,470]},
 {id:'H13',mesh:'pelvis',ring:'bottom',spoke:13,divisions:16,front:[319,475]},
 {id:'H14',mesh:'pelvis',ring:'bottom',spoke:14,divisions:16,front:[334,488]},
 {id:'H15',mesh:'pelvis',ring:'bottom',spoke:15,divisions:16,front:[357,506]},
 {id:'M0',mesh:'pelvis',ring:463,spoke:0,divisions:16,front:[383,490],side:[718,488]},
 {id:'M1',mesh:'pelvis',ring:463,spoke:1,divisions:16,front:[411,485]},
 {id:'M2',mesh:'pelvis',ring:463,spoke:2,divisions:16,front:[432,480]},
 {id:'M3',mesh:'pelvis',ring:463,spoke:3,divisions:16,front:[447,467]},
 {id:'M4',mesh:'pelvis',ring:463,spoke:4,divisions:16,front:[455,459]},
 {id:'M5',mesh:'pelvis',ring:463,spoke:5,divisions:16,back:[1107,470]},
 {id:'M6',mesh:'pelvis',ring:463,spoke:6,divisions:16,back:[1123,473]},
 {id:'M7',mesh:'pelvis',ring:463,spoke:7,divisions:16,back:[1139,475]},
 {id:'M8',mesh:'pelvis',ring:463,spoke:8,divisions:16,back:[1151,476],side:[835,470]},
 {id:'M9',mesh:'pelvis',ring:463,spoke:9,divisions:16,back:[1163,475]},
 {id:'M10',mesh:'pelvis',ring:463,spoke:10,divisions:16,back:[1179,473]},
 {id:'M11',mesh:'pelvis',ring:463,spoke:11,divisions:16,back:[1195,470]},
 {id:'M12',mesh:'pelvis',ring:463,spoke:12,divisions:16,front:[311,459]},
 {id:'M13',mesh:'pelvis',ring:463,spoke:13,divisions:16,front:[319,467]},
 {id:'M14',mesh:'pelvis',ring:463,spoke:14,divisions:16,front:[334,480]},
 {id:'M15',mesh:'pelvis',ring:463,spoke:15,divisions:16,front:[355,485]},
];
export function projectVertex(p:readonly number[],view:StudyView):[number,number]{return [view==='front'?f.frontAxis+p[0]/f.scale:view==='back'?f.backAxis-p[0]/f.scale:f.sideAxis-p[2]/f.scale,f.ground-p[1]/f.scale];}
export function applyMeasuredVertexEdits(root:T.Group){
 const changes:{mesh:string;index:number;before:number[];after:number[];source:string}[]=[],report:{id:string;position:number[];before:number[];targets:Partial<Record<StudyView,ImagePoint>>}[]=[];
 for(const meshName of ['neck','pelvis']){
  const m=root.getObjectByName(meshName) as T.Mesh,p=m.geometry.getAttribute('position'),n=m.userData.radialSides;
  const meshObs=vertexObservations.filter(o=>o.mesh===meshName);
  for(const selector of [...new Set(meshObs.map(o=>o.ring))]){
   const observations=meshObs.filter(o=>o.ring===selector),ri=selector==='top'?m.userData.bandCount-1:selector==='bottom'?0:m.userData.sourceBands.findIndex((b:number[])=>b[0]===selector);
   if(ri<0)throw Error('Missing measured section');
   const targets=observations.map(o=>{
    const index=ri*n+Math.round(o.spoke/o.divisions*n)%n,before=[p.getX(index),p.getY(index),p.getZ(index)],after=[...before];
    const xs=[...(o.front?[o.front[0]-f.frontAxis]:[]),...(o.back?[f.backAxis-o.back[0]]:[])],ys=[o.front?.[1],o.side?.[1],o.back?.[1]].filter((v):v is number=>v!==undefined);
    if(xs.length)after[0]=xs.reduce((a,b)=>a+b)/xs.length*f.scale;
    after[1]=(f.ground-ys.reduce((a,b)=>a+b)/ys.length)*f.scale;if(o.side)after[2]=(f.sideAxis-o.side[0])*f.scale;
    report.push({id:o.id,position:after,before,targets:{front:o.front,side:o.side,back:o.back}});return {o,after};
   });
   for(let j=0;j<n;j++){
    const u=j/n*observations[0].divisions,a=Math.floor(u),t=u-a,A=targets[a],B=targets[(a+1)%targets.length],after=A.after.map((v,k)=>v+(B.after[k]-v)*t),index=ri*n+j,before=[p.getX(index),p.getY(index),p.getZ(index)];
    p.setXYZ(index,after[0],after[1],after[2]);changes.push({mesh:meshName,index,before,after,source:A.o.id+(t?`/${B.o.id}`:'')});
   }
   for(const o of observations){const index=ri*n+Math.round(o.spoke/o.divisions*n)%n;report.find(r=>r.id===o.id)!.position=[p.getX(index),p.getY(index),p.getZ(index)];}
  }
  m.geometry.computeVertexNormals();
 }
 // Move the existing chest top vertices onto the measured neck-base polygon.
 // This keeps the original closed block primitives and their original indices.
 const neck=root.getObjectByName('neck') as T.Mesh,chest=root.getObjectByName('ribcage') as T.Mesh,np=neck.geometry.getAttribute('position'),cp=chest.geometry.getAttribute('position'),nn=neck.userData.radialSides,cn=chest.userData.radialSides;
 for(let j=0;j<cn;j++){
  const u=j/cn*nn,a=Math.floor(u),b=(a+1)%nn,t=u-a,index=(chest.userData.bandCount-1)*cn+j,before=[cp.getX(index),cp.getY(index),cp.getZ(index)],A=[np.getX(a),np.getY(a),np.getZ(a)],B=[np.getX(b),np.getY(b),np.getZ(b)],after=A.map((v,k)=>v+(B[k]-v)*t);
  cp.setXYZ(index,after[0],after[1],after[2]);changes.push({mesh:'ribcage',index,before,after,source:'neck boundary interpolation'});
 }
 chest.geometry.computeVertexNormals();
 // The thigh root cap is occluded by the pelvis in all reference views.
 // Keep its existing vertices inside the block instead of sculpting an unseen join.
 for(const name of ['right-thigh','left-thigh']){
  const m=root.getObjectByName(name) as T.Mesh,p=m.geometry.getAttribute('position'),n=m.userData.radialSides,start=(m.userData.bandCount-1)*n,ci=m.userData.bandCount*n+1,center=new T.Vector3().fromBufferAttribute(p,ci);
  for(let j=0;j<n;j++){
   const i=start+j,v=new T.Vector3().fromBufferAttribute(p,i),after=center.clone().lerp(v,.2);p.setXYZ(i,after.x,after.y,after.z);changes.push({mesh:name,index:i,before:v.toArray(),after:after.toArray(),source:'occluded endpoint retained inside pelvis, not a reference surface point'});
  }
  m.geometry.computeVertexNormals();
 }
 root.userData.vertexEdits={changes,report,addedVertices:0,addedTriangles:0};
}
