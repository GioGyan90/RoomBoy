// Extract geometry only; textures are not needed for silhouette fitting.
import {readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
const bytes=readFileSync(process.argv[2]);
const jsonSize=bytes.readUInt32LE(12),gltf=JSON.parse(bytes.subarray(20,20+jsonSize));
const binStart=20+jsonSize+8,bin=bytes.subarray(binStart);
await MeshoptDecoder.ready;
for(const [label,id]of [['positions',0],['normals',1]]){
 const accessor=gltf.accessors[id],view=gltf.bufferViews[accessor.bufferView],ext=view.extensions.EXT_meshopt_compression;
 const out=new Uint8Array(ext.count*ext.byteStride);
 MeshoptDecoder.decodeGltfBuffer(out,ext.count,ext.byteStride,bin.subarray(ext.byteOffset,ext.byteOffset+ext.byteLength),ext.mode,ext.filter);
 writeFileSync(join(process.argv[3]||tmpdir(),`head-ref-${label}.bin`),out);
}
console.log(JSON.stringify({vertices:gltf.accessors[0].count,triangles:gltf.accessors[3].count/3,bounds:[gltf.accessors[0].min,gltf.accessors[0].max]}));
