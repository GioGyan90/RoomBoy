#!/usr/bin/env node
/**
 * Split the actual symmetric QEM GLB into independently editable parts.
 * No source triangles or positions are changed: local indices are remapped
 * to a compact per-part vertex list, with the exact source IDs in JSON.
 *
 * node scripts/bake-head-regions.mjs [input.glb] [output-prefix]
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,basename} from 'node:path';
import {partitionHeadFaces,createHeadPartsManifest,auditHeadParts,HEAD_REGIONS} from '../src/experiments/head/headRegions.js';

const input=process.argv[2]||'public/heads/grey-head-qem-symmetric.glb';
const prefix=process.argv[3]||'public/heads/grey-head-qem-symmetric';

function loadGlb(path){
 const bytes=readFileSync(path);
 if(bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2||bytes.readUInt32LE(8)!==bytes.length)
  throw Error('Not a valid glTF 2.0 binary');
 const length=bytes.readUInt32LE(12);
 if(bytes.toString('ascii',16,20)!=='JSON')throw Error('Expected glTF JSON chunk first');
 const gltf=JSON.parse(bytes.subarray(20,20+length).toString('utf8'));
 const off=20+length;
 if(bytes.toString('ascii',off+4,off+7)!=='BIN')throw Error('Missing GLB binary chunk');
 const bin=bytes.subarray(off+8,off+8+bytes.readUInt32LE(off));
 const prim=gltf.meshes?.[0]?.primitives?.[0];
 if(!prim||(prim.mode&&prim.mode!==4)||gltf.meshes.length!==1||gltf.meshes[0].primitives.length!==1)
  throw Error('Expected one indexed triangle mesh in symmetric GLB');
 function accessor(id){
  if(id===undefined)return null;
  const a=gltf.accessors[id],v=gltf.bufferViews[a.bufferView];
  const count=a.type==='VEC3'?3:a.type==='SCALAR'?1:0;
  const bytesPer={5126:4,5125:4,5123:2}[a.componentType];
  if(!count||!bytesPer)throw Error('Unsupported source accessor');
  const offset=(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||count*bytesPer;
  const result=new (a.componentType===5126?Float32Array:a.componentType===5125?Uint32Array:Uint16Array)(a.count*count);
  for(let i=0;i<a.count;i++)for(let k=0;k<count;k++){
   const p=offset+i*stride+k*bytesPer;
   result[i*count+k]=a.componentType===5126?bin.readFloatLE(p):a.componentType===5125?bin.readUInt32LE(p):bin.readUInt16LE(p);
  }
  return result;
 }
 return {positions:accessor(prim.attributes.POSITION),normals:accessor(prim.attributes.NORMAL),indices:accessor(prim.indices)};
}
function bytesOf(data){return Buffer.from(data.buffer,data.byteOffset,data.byteLength);}
function bake(source,partition){
 const {positions,normals,indices}=source;
 const chunks=[],views=[],accessors=[],meshes=[],nodes=[],materials=[],sourceVertices=[];
 let cursor=0;
 function append(data,target){
  const aligned=(4-data.length%4)%4;
  const offset=cursor;chunks.push(data);
  if(aligned)chunks.push(Buffer.alloc(aligned));
  cursor+=data.length+aligned;
  views.push({buffer:0,byteOffset:offset,byteLength:data.length,target});
  return views.length-1;
 }
 for(const region of partition.groups){
  const originalFaceIds=region.faceIds,localIndexBySource=new Map(),vertexIds=[];
  const newIndices=new Uint32Array(originalFaceIds.length*3);
  for(let face=0;face<originalFaceIds.length;face++)for(let k=0;k<3;k++){
   const originalId=indices[originalFaceIds[face]*3+k];
   let local=localIndexBySource.get(originalId);
   if(local===undefined){local=vertexIds.length;vertexIds.push(originalId);localIndexBySource.set(originalId,local);}
   newIndices[face*3+k]=local;
  }
  const localPositions=new Float32Array(vertexIds.length*3),localNormals=normals?new Float32Array(vertexIds.length*3):null;
  const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
  for(let i=0;i<vertexIds.length;i++)for(let k=0;k<3;k++){
   const v=positions[vertexIds[i]*3+k];
   localPositions[i*3+k]=v;
   if(localNormals)localNormals[i*3+k]=normals[vertexIds[i]*3+k];
   min[k]=Math.min(min[k],v);max[k]=Math.max(max[k],v);
  }
  sourceVertices.push(vertexIds);
  const pos=accessors.push({bufferView:append(bytesOf(localPositions),34962),
   componentType:5126,count:vertexIds.length,type:'VEC3',min,max})-1;
  const normal=localNormals?accessors.push({bufferView:append(bytesOf(localNormals),34962),
   componentType:5126,count:vertexIds.length,type:'VEC3'})-1:null;
  const idx=accessors.push({bufferView:append(bytesOf(newIndices),34963),
   componentType:5125,count:newIndices.length,type:'SCALAR',min:[0],max:[vertexIds.length-1]})-1;
  const rgb=region.color;
  materials.push({name:region.label,pbrMetallicRoughness:{
   baseColorFactor:[(rgb>>16&255)/255,(rgb>>8&255)/255,(rgb&255)/255,1],
   metallicFactor:0,roughnessFactor:.95},doubleSided:true});
  meshes.push({name:region.id,extras:{family:region.family,partId:region.id,
   sourceFaces:originalFaceIds.length,priority:region.priority},
   primitives:[{mode:4,attributes:{POSITION:pos,...(normal!==null?{NORMAL:normal}:{})},
    indices:idx,material:materials.length-1}]});
  nodes.push({name:region.id,mesh:meshes.length-1});
 }
 const bin=Buffer.concat(chunks);
 const gltf={asset:{version:'2.0',generator:'RoomBoy | 23 source-triangle semantic regions'},
  scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes,materials,accessors,
  bufferViews:views,buffers:[{byteLength:bin.length}],
  extras:{source:'grey-head-qem-symmetric.glb',faceCount:indices.length/3,
   topology:'original triangles, locally renumbered vertices',sourceIndexOrderPreserved:true}};
 const jsonData=Buffer.from(JSON.stringify(gltf));
 const jsonChunk=Buffer.concat([jsonData,Buffer.alloc((4-jsonData.length%4)%4,0x20)]);
 const binChunk=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);
 const result=Buffer.alloc(12+8+jsonChunk.length+8+binChunk.length);
 result.write('glTF',0,4,'ascii');result.writeUInt32LE(2,4);result.writeUInt32LE(result.length,8);
 result.writeUInt32LE(jsonChunk.length,12);result.write('JSON',16,4,'ascii');jsonChunk.copy(result,20);
 const offset=20+jsonChunk.length;
 result.writeUInt32LE(binChunk.length,offset);result.write('BIN\0',offset+4,4,'ascii');
 binChunk.copy(result,offset+8);
 return {result,sourceVertices};
}
const source=loadGlb(input);
const parts=partitionHeadFaces(source.positions,source.indices);
const audit=auditHeadParts(parts);
const isOriginal=basename(input)==='grey-head-qem-symmetric.glb';
const isLOD1=basename(input)==='grey-head-lod1-10000.glb';
if(!isOriginal&&!isLOD1)throw Error('Unsupported head source: '+input);
if((isOriginal&&(audit.sourceFaces!==34500||audit.sourceVertices!==31357))||
   (isLOD1&&(audit.sourceFaces>10000||audit.sourceFaces<9700))||
   audit.unassignedFaces||audit.regionCount!==HEAD_REGIONS.length||
   !audit.allMirroredFaceCountsEqual)
 throw Error('Source mesh partition audit failed: '+JSON.stringify(audit));
mkdirSync(dirname(prefix),{recursive:true});
const {result,sourceVertices}=bake(source,parts);
const manifest=createHeadPartsManifest(parts);
manifest.source=basename(input);
manifest.parentLOD=isLOD1?'first-pass 10k hybrid; triangles are not original 34.5k face IDs':'unchanged 34.5k symmetric parent';
manifest.vertexIndexMapping='sourceVertexIds maps each compact part vertex to the original GLB vertex. Shared region borders duplicate vertices for independent editing.';
for(let i=0;i<manifest.groups.length;i++)manifest.groups[i].sourceVertexIds=sourceVertices[i];
writeFileSync(prefix+'.parts.glb',result);
writeFileSync(prefix+'.parts.json',JSON.stringify(manifest,null,2)+'\n');
writeFileSync(prefix+'.parts.audit.json',JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({regions:audit.regionCount,sourceFaces:audit.sourceFaces,
 output:prefix+'.parts.glb',bytes:result.length,mirrorPairs:audit.mirrorPairs.length}));
