import * as T from 'three';
import {pelvisPoints,pelvisFrontPolygons,pelvisBackPolygons,pelvisFrame as f,pelvisReviewState} from './pelvisReference';
/** Fresh isolated asset. No legacy cages, muscle functions or vertex patches. */
export function createPelvisPart(){
 const positions=pelvisPoints.flatMap(p=>[p.x*f.scale,(460-p.y)*f.scale,(f.sideAxis-p.sx)*f.scale]);
 const indices:number[]=[];
 function face(ids:readonly number[],back=false){
  const contour=ids.map(i=>new T.Vector2(positions[i*3],positions[i*3+1]));
  for(const t of T.ShapeUtils.triangulateShape(contour,[])){const tri=t.map(j=>ids[j]);const a=new T.Vector3().fromArray(positions,tri[0]*3),b=new T.Vector3().fromArray(positions,tri[1]*3),c=new T.Vector3().fromArray(positions,tri[2]*3);const z=b.sub(a).cross(c.sub(a)).z;
   if((z<0)!==back)tri.reverse();indices.push(...tri);
  }
 }
 for(const polygon of pelvisFrontPolygons)face(polygon);
 for(const polygon of pelvisBackPolygons)face(polygon.map(i=>i+16),true);
 const B=(i:number)=>i+16;
 function side(a:number,b:number,c:number,d:number){indices.push(a,b,c,b,d,c);}
 side(0,1,B(0),B(1));side(1,2,B(1),B(2));side(2,3,B(2),B(3));
 indices.push(3,4,B(3),4,B(4),B(3),4,5,B(4));
 side(5,6,B(4),B(5));side(6,7,B(5),B(6));side(7,8,B(6),B(7));
 indices.push(8,9,B(7),9,B(8),B(7),9,10,B(8));
 side(10,0,B(8),B(0));
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
 const mesh=new T.Mesh(geometry,new T.MeshStandardMaterial({color:0xa79db7,roughness:1,flatShading:true}));mesh.name='pelvis-review-part';mesh.userData.review=pelvisReviewState;mesh.userData.vertexIds=pelvisPoints.map(p=>p.id);return mesh;
}
/** Remove the old region from the assembly review. Never install the candidate. */
export function detachLegacyPelvis(root:T.Group){
 const old=root.getObjectByName('pelvis') as T.Mesh|undefined;if(!old)return;
 root.userData.triangles-=old.geometry.index!.count/3;old.removeFromParent();old.geometry.dispose();for(const m of Array.isArray(old.material)?old.material:[old.material])m.dispose();
 if(root.userData.vertexEdits)root.userData.vertexEdits.report=root.userData.vertexEdits.report.filter((r:{id:string})=>r.id.startsWith('N'));
 root.userData.pelvisReview=pelvisReviewState;
}
