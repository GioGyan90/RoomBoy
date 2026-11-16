import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// The GLB is supplied by the visitor. No upload or network fetch is performed.
// Copy all rendered surface vertices and triangle indices, not sampled outlines.
export function copyReferenceParts(root) {
 root.updateMatrixWorld(true);
 const parts=[];
 root.traverse(node=>{
  if(!node.isMesh || !node.geometry?.getAttribute('position')) return;
  const geometry=node.geometry.clone();
  geometry.applyMatrix4(node.matrixWorld);
  // Every clone owns its buffer data; the source GLTF scene is never re-used.
  if(!geometry.getAttribute('normal')) geometry.computeVertexNormals();
  parts.push({name:node.name||'surface',geometry});
 });
 if(!parts.length) throw new Error('GLB 不包含可读取的三角网格。');
 return parts;
}

export function normalizeReferenceParts(parts) {
 const box=new THREE.Box3();
 for(const p of parts) {
  p.geometry.computeBoundingBox();
  box.union(p.geometry.boundingBox);
 }
 if(box.isEmpty() || box.max.y-box.min.y<=0) throw new Error('GLB 几何范围无效。');
 const scale=2.25/(box.max.y-box.min.y);
 const shiftX=-(box.min.x+box.max.x)*.5*scale;
 const shiftY=-1.02-box.min.y*scale;
 const shiftZ=.82-box.max.z*scale;
 for(const p of parts) {
  p.geometry.scale(scale,scale,scale);
  p.geometry.translate(shiftX,shiftY,shiftZ);
  p.geometry.computeBoundingBox();
  p.geometry.computeBoundingSphere();
 }
 return parts;
}

// Strip texture/material declarations from a GLB copy before geometry-only
// inspection. The source requires KHR_texture_basisu (KTX2), but that should
// never block the user from comparing vertex positions and surface normals.
// Original user bytes are not modified, uploaded or included in the repository.
export function geometryOnlyGlb(original) {
 const input=new Uint8Array(original),dv=new DataView(input.buffer,input.byteOffset,input.byteLength);
 if(input.byteLength<28||dv.getUint32(0,true)!==0x46546c67||dv.getUint32(4,true)!==2||dv.getUint32(8,true)!==input.byteLength)throw new Error('不是有效的 GLB v2 文件。');
 const jsonSize=dv.getUint32(12,true);
 if(dv.getUint32(16,true)!==0x4e4f534a||jsonSize<2||20+jsonSize+8>input.byteLength)throw new Error('GLB JSON 数据段无效。');
 const json=JSON.parse(new TextDecoder().decode(input.subarray(20,20+jsonSize)));
 for(const mesh of json.meshes??[])for(const primitive of mesh.primitives??[])delete primitive.material;
 for(const key of ['materials','textures','images','samplers'])delete json[key];
 json.extensionsUsed=(json.extensionsUsed??[]).filter(e=>e==='EXT_meshopt_compression');
 json.extensionsRequired=(json.extensionsRequired??[]).filter(e=>e==='EXT_meshopt_compression');
 const sourceBinary=20+jsonSize,binSize=dv.getUint32(sourceBinary,true);
 if(dv.getUint32(sourceBinary+4,true)!==0x004e4942||sourceBinary+8+binSize>input.byteLength)throw new Error('GLB BIN 数据段无效。');
 const bytes=new TextEncoder().encode(JSON.stringify(json));
 const padded=(bytes.length+3)&~3;
 const output=new Uint8Array(20+padded+8+binSize);
 const header=new DataView(output.buffer);
 header.setUint32(0,0x46546c67,true);header.setUint32(4,2,true);header.setUint32(8,output.length,true);
 header.setUint32(12,padded,true);header.setUint32(16,0x4e4f534a,true);
 output.fill(32,20,20+padded);output.set(bytes,20);
 output.set(input.subarray(sourceBinary,sourceBinary+8+binSize),20+padded);
 return output.buffer;
}

export async function loadReferenceParts(buffer) {
 await MeshoptDecoder.ready;
 const loader=new GLTFLoader();
 loader.setMeshoptDecoder(MeshoptDecoder);
 const geometryBuffer=geometryOnlyGlb(buffer);
 const gltf=await new Promise((resolve,reject)=>loader.parse(geometryBuffer,'',resolve,reject));
 return normalizeReferenceParts(copyReferenceParts(gltf.scene));
}

export function makeReferenceGroup(parts) {
 const group=new THREE.Group();
 group.name='Exact GLB vertex copy (created in JavaScript)';
 for(const p of parts) {
  const mesh=new THREE.Mesh(p.geometry,new THREE.MeshLambertMaterial({
   color:0x9eb8bf,side:THREE.DoubleSide,flatShading:false
  }));
  mesh.name=p.name;
  group.add(mesh);
 }
 return group;
}

export function referenceCounts(parts) {
 return parts.reduce((sum,p)=>{
  sum.vertices+=p.geometry.getAttribute('position').count;
  sum.triangles+=p.geometry.index?p.geometry.index.count/3:p.geometry.getAttribute('position').count/3;
  return sum;
 },{vertices:0,triangles:0});
}

// Export a standalone JS module with lossless typed vertex/index/normal arrays.
// Base64 chunks are independent to avoid building one enormous JS string at once.
function encodeChunks(typed) {
 const bytes=new Uint8Array(typed.buffer,typed.byteOffset,typed.byteLength),out=[];
 for(let i=0;i<bytes.length;i+=32766)out.push(btoa(String.fromCharCode(...bytes.subarray(i,i+32766))));
 return out;
}
export function serializeReferenceToJS(parts) {
 const partsCode=parts.map((p,i)=>{
  const g=p.geometry,position=g.getAttribute('position'),normal=g.getAttribute('normal'),index=g.index;
  const pos=new Float32Array(position.count*3);
  for(let j=0;j<position.count;j++) {pos[j*3]=position.getX(j);pos[j*3+1]=position.getY(j);pos[j*3+2]=position.getZ(j);}
  const norm=normal?new Float32Array(normal.count*3):null;
  if(norm)for(let j=0;j<normal.count;j++){norm[j*3]=normal.getX(j);norm[j*3+1]=normal.getY(j);norm[j*3+2]=normal.getZ(j);}
  const inds=index?new (position.count>65535?Uint32Array:Uint16Array)(index.array):null;
  const add=(name,typed,type)=>typed?`g.setAttribute('${name}', new THREE.BufferAttribute(decode(${JSON.stringify(encodeChunks(typed))},${type}),3));`:'';
  return `// Part ${i}: ${JSON.stringify(p.name)}
   {const g=new THREE.BufferGeometry();
    ${add('position',pos,'Float32Array')}
    ${add('normal',norm,'Float32Array')}
    ${inds?`g.setIndex(new THREE.BufferAttribute(decode(${JSON.stringify(encodeChunks(inds))},${inds instanceof Uint32Array?'Uint32Array':'Uint16Array'}),1));`:''}
    if(!g.getAttribute('normal'))g.computeVertexNormals();
    group.add(new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x9eb8bf,side:THREE.DoubleSide})));}`;
 }).join('\n');
 return `// Exact triangle-surface vertex copy exported from RoomBoy. Coordinates normalized only.
 // Standalone module: import {createReferenceModel} and pass your THREE namespace.
 function decode(chunks, Type) {
  const sections=chunks.map(s=>atob(s));
  const bytes=new Uint8Array(sections.reduce((n,s)=>n+s.length,0));
  let offset=0;
  for(const section of sections){for(let i=0;i<section.length;i++)bytes[offset+i]=section.charCodeAt(i);offset+=section.length;}
  return new Type(bytes.buffer);
 }
 export function createReferenceModel(THREE) {
  const group=new THREE.Group();
  ${partsCode}
  return group;
 }
 `;
}
