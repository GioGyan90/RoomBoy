import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
// @ts-expect-error Head anatomy regions are maintained in plain ES modules.
import {HEAD_REGIONS,partitionHeadFaces,auditHeadParts,classifyHeadFace} from '../src/experiments/head/headRegions.js';

function glb(path:string){
 const bytes=readFileSync(resolve(path));
 assert.equal(bytes.toString('ascii',0,4),'glTF');
 assert.equal(bytes.readUInt32LE(4),2);
 assert.equal(bytes.readUInt32LE(8),bytes.length);
 const jsonLength=bytes.readUInt32LE(12);
 const json=JSON.parse(bytes.subarray(20,20+jsonLength).toString('utf8'));
 const start=20+jsonLength+8;
 function values(accessorId:number){
  const a=json.accessors[accessorId],v=json.bufferViews[a.bufferView];
  const components=a.type==='VEC3'?3:1,step=a.componentType===5123?2:4;
  const stride=v.byteStride||components*step;
  const data=new (a.componentType===5126?Float32Array:Uint32Array)(components*a.count);
  for(let i=0;i<a.count;i++)for(let k=0;k<components;k++){
   const offset=start+(v.byteOffset||0)+(a.byteOffset||0)+i*stride+k*step;
   data[i*components+k]=a.componentType===5126?bytes.readFloatLE(offset):
     a.componentType===5125?bytes.readUInt32LE(offset):bytes.readUInt16LE(offset);
  }
  return data;
 }
 return {json,values};
}
const src=glb('public/heads/grey-head-qem-symmetric.glb');
const out=glb('public/heads/grey-head-qem-symmetric.parts.glb');
const master=src.json.meshes[0].primitives[0];
const originalPositions=src.values(master.attributes.POSITION);
const originalNormals=master.attributes.NORMAL!==undefined?src.values(master.attributes.NORMAL):null;
const originalIndices=src.values(master.indices);
const manifest=JSON.parse(readFileSync(resolve('public/heads/grey-head-qem-symmetric.parts.json'),'utf8'));
const audit=JSON.parse(readFileSync(resolve('public/heads/grey-head-qem-symmetric.parts.audit.json'),'utf8'));

test('anatomy tags exhaustively and symmetrically classify the actual 34.5K faces',()=>{
 const parts=partitionHeadFaces(originalPositions,originalIndices);
 const a=auditHeadParts(parts);
 assert.equal(a.regionCount,23);
 assert.equal(a.sourceFaces,34500);
 assert.equal(a.sourceVertices,31357);
 assert.equal(a.unassignedFaces,0);
 assert(a.allMirroredFaceCountsEqual);
 assert.deepEqual(a,audit);
 assert.equal(manifest.schema,'roomboy.head-regions.v1');
 assert.equal(manifest.groups.length,23);
 assert.equal(out.json.meshes.length,23);
 assert.equal(out.json.nodes.length,23);
 assert.deepEqual(manifest.groups.map((x:{id:string})=>x.id),HEAD_REGIONS.map((x:{id:string})=>x.id));
 for(let i=0;i<23;i++){
  assert.deepEqual(manifest.groups[i].faceIds,parts.groups[i].faceIds);
 }
});

test('all independent part meshes reconstruct their ORIGINAL face triangles with zero coordinate loss',()=>{
 const seen=new Uint8Array(originalIndices.length/3);
 let sourceTriangles=0;
 for(let k=0;k<out.json.meshes.length;k++){
  const part=out.json.meshes[k].primitives[0],metadata=manifest.groups[k];
  const localPos=out.values(part.attributes.POSITION),localNormals=part.attributes.NORMAL!==undefined?out.values(part.attributes.NORMAL):null;
  const localFaces=out.values(part.indices),sourceVertexIds=metadata.sourceVertexIds as number[],sourceFaceIds=metadata.faceIds as number[];
  assert.equal(localPos.length/3,sourceVertexIds.length,'compact vertices stored per region');
  assert.equal(localFaces.length,sourceFaceIds.length*3);
  assert(localPos.length<originalPositions.length,'parts must not contain unused master vertices');
  assert.equal(out.json.meshes[k].name,metadata.id);
  for(let i=0;i<sourceVertexIds.length;i++){
   const original=sourceVertexIds[i];
   assert(original>=0&&original<originalPositions.length/3);
   for(let j=0;j<3;j++){
    assert.equal(localPos[i*3+j],originalPositions[original*3+j],'original GLB vertex position');
    if(originalNormals&&localNormals)
     assert.equal(localNormals[i*3+j],originalNormals[original*3+j],'original GLB normal');
   }
  }
  for(let i=0;i<sourceFaceIds.length;i++){
   const originalFace=sourceFaceIds[i];
   assert.equal(seen[originalFace],0,'each original triangle appears only once');
   seen[originalFace]=1;
   for(let j=0;j<3;j++){
    const originalVertex=originalIndices[originalFace*3+j];
    const reconstructed=sourceVertexIds[localFaces[i*3+j]];
    assert.equal(reconstructed,originalVertex,'source face index mapping');
   }
  }
  sourceTriangles+=sourceFaceIds.length;
 }
 assert.equal(sourceTriangles,34500);
 assert(seen.every(i=>i===1),'no triangle was lost');
});

test('the seven left/right study pairs have equal face counts and the midpoint rules mirror',()=>{
 assert.equal(audit.mirrorPairs.length,7);
 assert(audit.mirrorPairs.every((p:{balanced:boolean})=>p.balanced));
 for(const [x,y,z] of [[.83,0,-.49],[.3,.15,.45],[.5,-.2,.32],[.47,-.68,.29],[.72,.24,-.25]]){
  const left=HEAD_REGIONS[classifyHeadFace(-x,y,z)].id;
  const right=HEAD_REGIONS[classifyHeadFace(x,y,z)].id;
  assert(left===right||left.replace('_L','_R')===right);
 }
});
