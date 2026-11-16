// Decode the *user-supplied source GLB* to raw surface vertex buffers.
// Usage: node scripts/read-head-reference.mjs path/to/source.glb .head-work
// MeshoptDecoder ships with the repo's pinned Three.js dependency.
// Source may contain KTX2 textures; the mesh geometry needs no KTX2 decoder.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';

const input=process.argv[2],dest=process.argv[3]||'.head-work';
if(!input)throw new Error('Usage: node scripts/read-head-reference.mjs reference.glb [output-dir]');
const bytes=readFileSync(input);
if(bytes.toString('ascii',0,4)!=='glTF'||bytes.readUInt32LE(4)!==2)throw new Error('Input is not GLB v2');
const jsonSize=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonSize));
const binStart=20+jsonSize+8;
const prim=gltf.meshes?.[0]?.primitives?.[0];
if(!prim)throw new Error('No first mesh primitive');
await MeshoptDecoder.ready;
mkdirSync(dest,{recursive:true});
for(const [label,accessorId] of [
 ['positions',prim.attributes.POSITION],
 ['normals',prim.attributes.NORMAL],
 ['indices',prim.indices]
]){
 const accessor=gltf.accessors[accessorId],view=gltf.bufferViews[accessor.bufferView];
 const ext=view.extensions?.EXT_meshopt_compression;
 if(!ext)throw new Error('Source view lacks EXT_meshopt_compression: '+label);
 const output=new Uint8Array(ext.count*ext.byteStride);
 MeshoptDecoder.decodeGltfBuffer(
  output,ext.count,ext.byteStride,
  bytes.subarray(binStart+ext.byteOffset,binStart+ext.byteOffset+ext.byteLength),
  ext.mode,ext.filter
 );
 writeFileSync(join(dest,'head-ref-'+label+'.bin'),output);
}
console.log(JSON.stringify({
 source:input,sha256:createHash('sha256').update(bytes).digest('hex'),
 vertices:gltf.accessors[prim.attributes.POSITION].count,
 triangles:gltf.accessors[prim.indices].count/3,
 outputDir:dest
},null,2));
