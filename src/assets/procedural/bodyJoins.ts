import * as T from 'three';
import {referenceFrame as f,type SourceBand} from './bodyReference';
type BodyMesh=T.Mesh<T.BufferGeometry,T.Material|T.Material[]>;
function removeCap(m:BodyMesh,end:'bottom'|'top'){
 const n=m.userData.radialSides,sideCount=(m.userData.bandCount-1)*n*6,start=sideCount+(end==='top'?n*3:0);
 const indices=Array.from(m.geometry.index!.array);indices.splice(start,n*3);m.geometry.setIndex(indices);
 m.geometry.clearGroups();m.geometry.computeVertexNormals();
}
/** Matching boundary vertices join the visible surfaces; internal cap fans are removed. */
export function joinNeckAndChest(neck:BodyMesh,chest:BodyMesh){
 const n=neck.userData.radialSides,np=neck.geometry.getAttribute('position'),cp=chest.geometry.getAttribute('position'),last=(chest.userData.bandCount-1)*n;
 for(let j=0;j<n;j++){
  const c=Math.cos(j/n*Math.PI*2);
  // A shallow suprasternal notch sits between the two anterolateral neck planes.
  if(c>0){np.setY(j,np.getY(j)-11*f.scale*c**4);np.setZ(j,np.getZ(j)+6*f.scale*c);}
  const centerX=(neck.userData.sourceBands[0][1]+neck.userData.sourceBands[0][2])/2-f.frontAxis;
  np.setX(j,centerX*f.scale+(np.getX(j)-centerX*f.scale)*1.3);
  cp.setXYZ(last+j,np.getX(j),np.getY(j),np.getZ(j));
 }
 removeCap(neck,'bottom');removeCap(chest,'top');
 // Preserve the upper/lower colour partition after removing the internal fan.
 for(let ring=0;ring<chest.userData.bandCount-1;ring++)chest.geometry.addGroup(ring*n*6,n*6,chest.userData.sourceBands[ring][0]<=280?1:0);
 chest.geometry.addGroup((chest.userData.bandCount-1)*n*6,n*3,0);
 chest.geometry.computeVertexNormals();neck.userData.joinedWith='ribcage';chest.userData.joinedWith='neck';
}
/** Split the pelvis rim into two leg openings sharing a short crotch bridge.
 * Each thigh receives the same boundary positions, instead of intersecting a hip shell. */
export function joinPelvisAndThighs(pelvis:BodyMesh,right:BodyMesh,left:BodyMesh){
 const pp=pelvis.geometry.getAttribute('position'),pn=pelvis.userData.radialSides;
 if(pn!==16)throw Error('Pelvic branch layout expects sixteen rim vertices');
 const front=new T.Vector3().fromBufferAttribute(pp,0),back=new T.Vector3().fromBufferAttribute(pp,8);
 const crotch=front.clone().lerp(back,.5);crotch.y=(f.ground-510)*f.scale;
 for(const [thigh,layout] of [[left,[0,1,2,3,4,5,6,7,8,-1]],[right,[0,-1,8,9,10,11,12,13,14,15]]] as const){
  const p=thigh.geometry.getAttribute('position'),n=thigh.userData.radialSides,rows=thigh.userData.bandCount;
  if(n!==10)throw Error('Thigh branch layout expects ten vertices');
  const bands=thigh.userData.sourceBands as SourceBand[],top=bands.at(-1)!,cx=((top[1]+top[2])/2-f.frontAxis)*f.scale,cz=(f.sideAxis-(top[3]+top[4])/2)*f.scale;
  const rim=layout.map(i=>i<0?crotch.clone():new T.Vector3().fromBufferAttribute(pp,i));
  const angles=rim.map(v=>Math.atan2(v.x-cx,v.z-cz));
  for(let r=0;r<rows-1;r++){
   const [sy,l,rr,fr,bk]=bands[r],x=((l+rr)/2-f.frontAxis)*f.scale,z=(f.sideAxis-(fr+bk)/2)*f.scale;
   for(let j=0;j<n;j++)p.setXYZ(r*n+j,x+Math.sin(angles[j])*(rr-l)*f.scale/2,(f.ground-sy)*f.scale,z+Math.cos(angles[j])*(bk-fr)*f.scale/2);
  }
  for(let j=0;j<n;j++){
   // The intermediate collar follows the curved opening, not a horizontal slice
   // that would cross the anterior groin when its centre is above the rim.
   const below=new T.Vector3().fromBufferAttribute(p,(rows-3)*n+j);
   const collar=rim[j].clone().lerp(below,.45);
   p.setXYZ((rows-2)*n+j,collar.x,collar.y,collar.z);
   p.setXYZ((rows-1)*n+j,rim[j].x,rim[j].y,rim[j].z);
  }
  removeCap(thigh,'top');thigh.userData.joinedWith='pelvis';thigh.userData.joinBoundary=layout;
 }
 removeCap(pelvis,'bottom');pelvis.userData.joinedWith=['right-thigh','left-thigh'];
}
