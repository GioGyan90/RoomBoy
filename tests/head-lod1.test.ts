import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

type Accessor={bufferView:number,componentType:number,count:number,type:string,byteOffset?:number};
function inspect(path:string){
 const bytes=readFileSync(resolve(path));
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(bytes.readUInt32LE(4),2);
 assert.equal(bytes.readUInt32LE(8),bytes.length);
 const size=bytes.readUInt32LE(12);
 assert.equal(bytes.toString('ascii',16,20),'JSON');
 const json=JSON.parse(bytes.subarray(20,20+size).toString('utf8'));
 const bin=20+size+8;
 assert.equal(bytes.toString('ascii',bin-4,bin-1),'BIN');
 function accessor(index:number):number[]{
  const a=json.accessors[index] as Accessor,view=json.bufferViews[a.bufferView];
  const stride=view.byteStride||(a.type==='VEC3'?3:1)*(a.componentType===5123?2:4);
  const width=a.type==='VEC3'?3:1,components:number[]=[];
  for(let i=0;i<a.count;i++)for(let k=0;k<width;k++){
   const offset=bin+(view.byteOffset||0)+(a.byteOffset||0)+i*stride+k*(a.componentType===5123?2:4);
   components.push(a.componentType===5126?bytes.readFloatLE(offset):
    a.componentType===5125?bytes.readUInt32LE(offset):bytes.readUInt16LE(offset));
  }
  return components;
 }
 return {bytes,json,accessor};
}
const original=inspect('public/heads/grey-head-qem-symmetric.glb');
const reduced=inspect('public/heads/grey-head-lod1-10000.glb');
const split=inspect('public/heads/grey-head-lod1-10000.parts.glb');
const manifest=JSON.parse(readFileSync(resolve('public/heads/grey-head-lod1-10000.parts.json'),'utf8'));
const audit=JSON.parse(readFileSync(resolve('public/heads/grey-head-lod1-10000.parts.audit.json'),'utf8'));
const report=JSON.parse(readFileSync(resolve('public/heads/grey-head-lod1-10000.report.json'),'utf8'));
const base=original.json.meshes[0].primitives[0];
const lod=reduced.json.meshes[0].primitives[0];
const sourcePosition=original.accessor(base.attributes.POSITION);
const lodPosition=reduced.accessor(lod.attributes.POSITION);
const lodNormals=reduced.accessor(lod.attributes.NORMAL);
const lodIndices=reduced.accessor(lod.indices);
const pointKey=(x:number,y:number,z:number)=>[x,y,z].map(v=>(Math.abs(v)<1e-7?0:v).toFixed(5)).join('|');

test('LOD1 is a NEW binary asset with 10,000 genuine triangles and original backup untouched',()=>{
 assert.equal(report.schema,'roomboy.head-lod.v1');
 assert.equal(report.source,'grey-head-qem-symmetric.glb');
 assert.equal(report.sourceFaces,34500);
 assert.equal(report.resultFaces,10000);
 assert.equal(report.shellFaces,5600);
 assert.deepEqual(report.patches.map((x:{name:string,lodFaces:number})=>[x.name,x.lodFaces]),[
  ['ear',1800],['eye',1800],['nose',500],['lip',300]
 ]);
 assert.equal(lodIndices.length/3,report.resultFaces);
 assert.equal(lodPosition.length/3,report.resultVertices);
 assert.equal(lodNormals.length,lodPosition.length);
 assert.equal(original.accessor(base.indices).length/3,34500);
 assert.notDeepEqual(original.bytes,reduced.bytes,'the original model must not be overwritten');
 assert(reduced.bytes.length<original.bytes.length,'LOD1 must be smaller on disk');
 assert(lodPosition.every(Number.isFinite));
 assert(lodNormals.every(Number.isFinite));
});

test('LOD1 remains geometrically left/right symmetric with face-for-face mirror pairs',()=>{
 const count=lodPosition.length/3;
 const vertices=Array.from({length:count},(_,i)=>lodPosition.slice(3*i,3*i+3));
 const points=new Set(vertices.map(([x,y,z])=>pointKey(x,y,z)));
 const faces=new Set<string>();
 const mirrorKey=(tri:number[])=>tri.map(i=>{
  const [x,y,z]=vertices[i];return pointKey(-x,y,z);
 }).sort().join('/');
 const key=(tri:number[])=>tri.map(i=>{
  const [x,y,z]=vertices[i];return pointKey(x,y,z);
 }).sort().join('/');
 for(let f=0;f<lodIndices.length;f+=3){
  const triangle=lodIndices.slice(f,f+3);
  assert(triangle.every(i=>i>=0&&i<count));
  assert(new Set(triangle).size===3,'no repeated vertex inside a triangle');
  faces.add(key(triangle));
 }
 for(const [x,y,z] of vertices){
  assert(points.has(pointKey(-x,y,z)),'missing opposite vertex');
 }
 for(let f=0;f<lodIndices.length;f+=3){
  assert(faces.has(mirrorKey(lodIndices.slice(f,f+3))),'missing mirrored triangle');
 }
 const range=(positions:number[])=>{
  const mins=[Infinity,Infinity,Infinity],maxs=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<positions.length;i+=3)for(let j=0;j<3;j++){
   mins[j]=Math.min(mins[j],positions[i+j]);maxs[j]=Math.max(maxs[j],positions[i+j]);
  }
  return {mins,maxs};
 };
 const src=range(sourcePosition),out=range(lodPosition);
 assert(Math.abs(out.maxs[0]+out.mins[0])<1e-6,'strictly mirrored X extent');
 for(let k=0;k<3;k++){
  assert(Math.abs(src.maxs[k]-out.maxs[k])<.08,'master silhouette upper bound');
  assert(Math.abs(src.mins[k]-out.mins[k])<.08,'master silhouette lower bound');
 }
});

test('the 10K copy is independently available in 23 study regions without lost triangles',()=>{
 assert.equal(manifest.source,'grey-head-lod1-10000.glb');
 assert.equal(manifest.groups.length,23);
 assert.equal(audit.regionCount,23);
 assert.equal(audit.sourceFaces,10000);
 assert.equal(audit.unassignedFaces,0);
 assert.equal(audit.allMirroredFaceCountsEqual,true);
 assert.equal(split.json.meshes.length,23);
 const seen=new Uint8Array(report.resultFaces);
 for(let r=0;r<23;r++){
  const metadata=manifest.groups[r],prim=split.json.meshes[r].primitives[0];
  assert.equal(split.json.meshes[r].name,metadata.id);
  const pos=split.accessor(prim.attributes.POSITION);
  const idx=split.accessor(prim.indices);
  assert.equal(pos.length/3,metadata.sourceVertexIds.length);
  assert.equal(idx.length/3,metadata.faceIds.length);
  for(let v=0;v<metadata.sourceVertexIds.length;v++){
   const from=metadata.sourceVertexIds[v];
   for(let j=0;j<3;j++)assert.equal(pos[v*3+j],lodPosition[from*3+j]);
  }
  for(let j=0;j<metadata.faceIds.length;j++){
   const face=metadata.faceIds[j];
   assert.equal(seen[face],0);
   seen[face]=1;
   for(let k=0;k<3;k++){
    const originalVertex=lodIndices[face*3+k];
    const localVertex=metadata.sourceVertexIds[idx[j*3+k]];
    assert.equal(localVertex,originalVertex);
   }
  }
 }
 assert(seen.every(v=>v===1),'every reduced triangle must appear once');
});
