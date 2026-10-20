import * as T from 'three';
import {pelvisPoints,pelvisHalfProfile,pelvisProfile,pelvisMirrorIndex,pelvisFrame as f,pelvisReviewState} from './pelvisReference';
/** Symmetric extruded outline: no interior face vertices or independent back rim. */
export function createPelvisPart(){
 const n=pelvisProfile.length,positions=pelvisPoints.flatMap(p=>[p.x*f.scale,(460-p.y)*f.scale,(f.sideAxis-p.sx)*f.scale]),indices:number[]=[];
 const mirror=(i:number)=>pelvisMirrorIndex[i%n]+(i>=n?n:0);
 function mirroredTriangle(tri:number[]){indices.push(...tri,...tri.map(mirror).reverse());}
 const contour=pelvisHalfProfile.map(p=>new T.Vector2(p.x,-p.y));
 for(const triangle of T.ShapeUtils.triangulateShape(contour,[])){
  const tri=[...triangle],a=contour[tri[0]],b=contour[tri[1]],c=contour[tri[2]];
  if((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)<0)tri.reverse();
  mirroredTriangle(tri);mirroredTriangle(tri.map(i=>i+n).reverse());
 }
 for(let i=0;i<pelvisHalfProfile.length-1;i++){
  const a=i,b=i+1;mirroredTriangle([a,b,a+n]);mirroredTriangle([b,b+n,a+n]);
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0xa79db7,roughness:1,flatShading:true}));mesh.name='pelvis-review-part';mesh.userData.review=pelvisReviewState;mesh.userData.vertexIds=pelvisPoints.map(p=>p.id);mesh.userData.mirrorIndices=pelvisPoints.map((_,i)=>mirror(i));return mesh;
}
/** Remove the old region from the assembly review. Never install the candidate. */
export function detachLegacyPelvis(root:T.Group){
 const old=root.getObjectByName('pelvis') as T.Mesh|undefined;if(!old)return;
 root.userData.triangles-=old.geometry.index!.count/3;old.removeFromParent();old.geometry.dispose();for(const m of Array.isArray(old.material)?old.material:[old.material])m.dispose();
 if(root.userData.vertexEdits)root.userData.vertexEdits.report=root.userData.vertexEdits.report.filter((r:{id:string})=>r.id.startsWith('N'));
 root.userData.pelvisReview=pelvisReviewState;
}
