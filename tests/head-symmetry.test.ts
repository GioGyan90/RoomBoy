import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

// Validate the committed GLB itself. This does not use a procedural proxy.
const raw=readFileSync(resolve('public/heads/grey-head-qem-symmetric.glb'));
const report=JSON.parse(readFileSync(resolve('public/heads/grey-head-qem-symmetric.report.json'),'utf8'));

function parse(){
 assert.equal(raw.toString('ascii',0,4),'glTF');
 assert.equal(raw.readUInt32LE(4),2);
 assert.equal(raw.readUInt32LE(8),raw.length);
 const n=raw.readUInt32LE(12);
 assert.equal(raw.toString('ascii',16,20),'JSON');
 const json=JSON.parse(raw.subarray(20,20+n).toString('utf8'));
 const bin=20+n;
 assert.equal(raw.toString('ascii',bin+4,bin+7),'BIN');
 const base=bin+8;
 const prim=json.meshes[0].primitives[0];
 const attributes=json.accessors;
 function accessor(id:number){
  const a=attributes[id],view=json.bufferViews[a.bufferView];
  const width=a.type==='VEC3'?3:1;
  const stride=view.byteStride||width*4;
  return Array.from({length:a.count},(_,i)=>Array.from({length:width},(_,j)=>{
   const off=base+(view.byteOffset||0)+(a.byteOffset||0)+i*stride+j*4;
   if(a.componentType===5126)return raw.readFloatLE(off);
   if(a.componentType===5125)return raw.readUInt32LE(off);
   if(a.componentType===5123)return raw.readUInt16LE(off);
   throw new Error('Unexpected GLB accessor type');
  }));
 }
 const indices=accessor(prim.indices).map(a=>a[0]);
 assert.equal(indices.length%3,0);
 return {json,verts:accessor(prim.attributes.POSITION) as number[][],
   normals:accessor(prim.attributes.NORMAL) as number[][],
   faces:Array.from({length:indices.length/3},(_,i)=>indices.slice(i*3,i*3+3))};
}
const mesh=parse();
const key=(x:number,y:number,z:number)=>[x,y,z].map(n=>(Object.is(n,-0)?0:n).toFixed(7)).join(',');
// The source GLB deliberately has duplicate positions with different normals,
 // so a coordinate maps to a LIST of vertex indices, not a single vertex.
const vertices=new Map<string,number[]>();
for(const [i,p] of mesh.verts.entries()){
 const k=key(p[0],p[1],p[2]),items=vertices.get(k)||[];
 items.push(i);vertices.set(k,items);
}

test('the committed GLB is physically clipped from source and mirrored about X=0',()=>{
 assert.equal(report.source_faces,30000);
 assert.equal(report.source_vertices,27463);
 assert.equal(report.preserved_half,'negative');
 assert.equal(report.plane.axis,'X');
 assert(Math.abs(report.plane.worldX)<.001);
 assert.equal(mesh.faces.length,34500);
 assert.equal(mesh.verts.length,31357);
 assert.equal(mesh.normals.length,mesh.verts.length);
 assert.equal(report.result_faces,mesh.faces.length);
 assert.equal(report.result_vertices,mesh.verts.length);
 assert.equal(report.half_faces*2,mesh.faces.length);
 assert.equal(report.seam_boundary_edges,0);
 assert.equal(report.seam_vertices,655);
 assert.equal(report.seam_edges,593);
});

test('every retained vertex has an exact mirrored pair; seam normals are also symmetric',()=>{
 let seamCount=0;
 for(let i=0;i<mesh.verts.length;i++){
  const [x,y,z]=mesh.verts[i],n=mesh.normals[i];
  assert([x,y,z,...n].every(Number.isFinite));
  const twins=vertices.get(key(-x,y,z));
  assert(twins?.length,'missing reflected vertex at '+i);
  const paired=twins.some(j=>{
   const reflected=mesh.normals[j];
   return Math.abs(reflected[0]+n[0])<1e-5
    &&Math.abs(reflected[1]-n[1])<1e-5
    &&Math.abs(reflected[2]-n[2])<1e-5;
  });
  assert(paired,'missing mirrored normal for vertex '+i);
  if(Math.abs(x)<1e-8){
   seamCount++;
   assert(Math.abs(n[0])<1e-7,'normal must be tangent to symmetry plane');
  }
 }
 assert.equal(seamCount,655);
});

test('all 34,500 indexed triangles have reflected partners and no open center seam',()=>{
 const geometricFaceKey=(tri:number[])=>tri.map(i=>{
  const [x,y,z]=mesh.verts[i];return key(x,y,z);
 }).sort().join('|');
 const faces=new Set<string>();
 const edgeUse=new Map<string,number>();
 for(const tri of mesh.faces){
  const [a,b,c]=tri;
  assert(new Set(tri).size===3);
  assert(tri.every(i=>i>=0&&i<mesh.verts.length));
  faces.add(geometricFaceKey(tri));
  for(let k=0;k<3;k++){
   const u=tri[k],v=tri[(k+1)%3];
   if(Math.abs(mesh.verts[u][0])>1e-8||Math.abs(mesh.verts[v][0])>1e-8)continue;
   const ek=[Math.min(u,v),Math.max(u,v)].join(':');
   edgeUse.set(ek,(edgeUse.get(ek)||0)+1);
  }
 }
 for(const tri of mesh.faces){
  const mirrored=tri.map(i=>{
   const [x,y,z]=mesh.verts[i];
   return key(-x,y,z);
  }).sort().join('|');
  assert(faces.has(mirrored),'unmatched reflected triangle');
 }
 assert.equal(edgeUse.size,593);
 assert([...edgeUse.values()].every(n=>n===2),'a cut edge must be shared by both halves');
});

test('symmetric model keeps compact bounding box and the original 30k backup',()=>{
 const x=mesh.verts.map(v=>v[0]);
 assert(Math.abs(Math.max(...x)+Math.min(...x))<1e-6);
 assert(Math.max(...x)>.9);
 assert(raw.length>500000&&raw.length<2_000_000);
 const original=readFileSync(resolve('public/heads/grey-head-qem-30000.glb'));
 assert.equal(original.length,1020232);
});
