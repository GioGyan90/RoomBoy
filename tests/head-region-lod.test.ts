import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const root='public/heads/';
const report=JSON.parse(readFileSync(root+'grey-head-region-lod-v1.report.json','utf8'));
const parts=JSON.parse(readFileSync(root+'grey-head-region-lod-v1.parts.json','utf8'));

function parse(path:string) {
 const b=readFileSync(path);
 assert.equal(b.toString('ascii',0,4),'glTF');
 assert.equal(b.readUInt32LE(4),2);
 assert.equal(b.readUInt32LE(8),b.length);
 const jsonLen=b.readUInt32LE(12);
 const j=JSON.parse(b.subarray(20,20+jsonLen).toString('utf8'));
 const binary=20+jsonLen+8;
 function values(accessorId:number) {
  const a=j.accessors[accessorId];
  const v=j.bufferViews[a.bufferView];
  const step=a.componentType===5123?2:4;
  const components=a.type==='VEC3'?3:1;
  const out:number[][]=[];
  for(let i=0;i<a.count;i++) {
   const vals:number[]=[];
   for(let k=0;k<components;k++){
    const off=binary+(v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||components*step)+k*step;
    vals.push(a.componentType===5126?b.readFloatLE(off):a.componentType===5125?b.readUInt32LE(off):b.readUInt16LE(off));
   }
   out.push(vals);
  }
  return out;
 }
 return {j,values};
}
const out=parse(root+'grey-head-region-lod-v1.glb');
const primitive=out.j.meshes[0].primitives[0];
const vertices=out.values(primitive.attributes.POSITION);
const normals=out.values(primitive.attributes.NORMAL);
const index=out.values(primitive.indices).map(x=>x[0]);
const faces=Array.from({length:index.length/3},(_,i)=>index.slice(i*3,i*3+3));
const coord=(v:number[])=>v.map(x=>(Object.is(x,-0)?0:x).toFixed(7)).join(',');
const mirror=(v:number[])=>coord([-v[0],v[1],v[2]]);

test('candidate is derived from immutable 34.5K GLB and never falsely accepted if over budget',()=>{
 const source=readFileSync(root+'grey-head-qem-symmetric.glb');
 assert.equal(source.length,1167696,'original master must not be replaced');
 assert.equal(report.sourceFaces,34500);
 assert.equal(report.source,'grey-head-qem-symmetric.glb');
 assert.equal(report.outputFaces,faces.length);
 assert.equal(report.outputVertices,vertices.length);
 assert.equal(report.targetFaces,10000);
 assert.equal(report.sourceOnlyGeometry,true);
 if(faces.length>10000){
  assert.match(report.state,/unaccepted/);
  assert.equal(report.acceptance.countAtMost10000,false);
 } else {
  assert.equal(report.acceptance.countAtMost10000,true);
 }
});

test('exact mirrored vertices, normals and triangles with fully welded X=0 indexed seam',()=>{
 const keys=new Set(vertices.map(coord));
 const faceKeys=new Set(faces.map(f=>f.map(i=>coord(vertices[i])).sort().join('|')));
 const usage=new Map<string,number>();
 assert.equal(vertices.length,normals.length);
 for(let i=0;i<vertices.length;i++){
  const v=vertices[i],n=normals[i];
  assert([...v,...n].every(Number.isFinite));
  assert(keys.has(mirror(v)),'mirrored vertex missing');
  if(v[0]===0)assert(Math.abs(n[0])<1e-5,'center normal x');
 }
 for(const tri of faces){
  assert.equal(new Set(tri).size,3);
  assert(tri.every(x=>x>=0&&x<vertices.length));
  const p=tri.map(i=>vertices[i]);
  const a=p[1].map((v,k)=>v-p[0][k]);
  const b=p[2].map((v,k)=>v-p[0][k]);
  const area=Math.hypot(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]);
  assert(area>1e-12,'zero-area triangle');
  assert(faceKeys.has(tri.map(i=>mirror(vertices[i])).sort().join('|')),'mirrored face missing');
  for(let k=0;k<3;k++){
   const u=tri[k],v=tri[(k+1)%3];
   if(vertices[u][0]===0 && vertices[v][0]===0){
    const key=[Math.min(u,v),Math.max(u,v)].join(':');
    usage.set(key,(usage.get(key)||0)+1);
   }
  }
 }
 assert.equal(usage.size,593);
 assert([...usage.values()].every(x=>x===2));
 assert.equal(report.centerPlaneEdgesFullyWelded,usage.size);
 assert.equal(report.newNonManifoldEdges,0);
});

test('all 23 real region meshes are indexed to the single unified geometry',()=>{
 const part=parse(root+'grey-head-region-lod-v1.parts.glb');
 assert.equal(parts.groups.length,23);
 assert.equal(part.j.meshes.length,23);
 assert.equal(parts.groups.reduce((n:number,g:{faces:number})=>n+g.faces,0),faces.length);
 for(const g of parts.groups) {
  assert(g.globalVertexIds.length>0);
  assert.equal(g.globalVertexIds.length,g.sourceVertexIds.length);
  assert(g.globalVertexIds.every((x:number)=>x>=0&&x<vertices.length));
  assert(g.faces>0);
 }
 assert.equal(report.isExactMirroredIndexedMesh,true);
 assert.equal(report.sourceOnlyGeometry,true);
 assert(report.crossRegionBoundaryEdgesUnchangedOnLeft>0);
});

test('topology baseline records original holes and 23 semantic components without overwriting them',()=>{
 const audit=JSON.parse(readFileSync(root+'grey-head-region-lod-v1.topology.json','utf8'));
 assert.equal(audit.regions,23);
 assert.equal(audit.faces,34500);
 assert.equal(audit.vertices,31357);
 assert.equal(audit.symmetry_plane.non_two_face_edges,0);
 assert.equal(audit.source_index_edges.nonmanifold,0);
 assert(audit.source_index_edges.single_use>20000,'must not conceal existing open edges');
 assert.equal(audit.shared_region_edges,1714);
});


test('failed 10K face count is never represented as an accepted asset',()=>{
 assert.equal(faces.length,10000);
 assert.equal(report.state,'rejected_visual_surface_holes');
 assert.equal(report.acceptance.noVisibleSurfaceHoles,false);
 assert.match(report.acceptance.visualInspection,/REJECTED/);
});

test('safe fallback preserves 34.5K source face islands and all original open boundaries',()=>{
 const safe=JSON.parse(readFileSync(root+'grey-head-region-lod-v1.safe.report.json','utf8'));
 assert.equal(safe.sourceFaces,34500);
 assert(safe.outputFaces>10000);
 assert.equal(safe.targetFaces,10000);
 assert.equal(safe.reachedTarget,false);
 assert.equal(safe.componentCountPreserved,true);
 assert.equal(safe.sourceConnectedComponents,safe.candidateConnectedComponents);
 assert.equal(safe.sourceLeftOpenEdges,safe.candidateLeftOpenEdges);
 assert(safe.areaRetainedPercent>=97.5);
 const glb=parse(root+'grey-head-region-lod-v1.safe.glb');
 const faces=glb.values(glb.j.meshes[0].primitives[0].indices).length/3;
 assert.equal(faces,safe.outputFaces);
});
