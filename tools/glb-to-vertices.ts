import {NodeIO,type Document} from '@gltf-transform/core';
import {mkdir,writeFile} from 'node:fs/promises';
import {dirname,relative,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import type {VertexAsset} from '../src/assets/vertexAsset';
export function convertDocument(document:Document,stripTextures=false):VertexAsset {
 const root=document.getRoot();
 if(root.listSkins().length||root.listAnimations().length)throw new Error('Skins and animations require a rig adapter; static conversion refused.');
 const meshes:VertexAsset['meshes']=[];
 const scene=root.getDefaultScene()??root.listScenes()[0];if(!scene)throw new Error('No scene');
 scene.traverse(node=>{
  const mesh=node.getMesh();if(!mesh)return;
  for(const [i,primitive] of mesh.listPrimitives().entries()){
   if(primitive.getMode()!==4)throw new Error('Only triangle primitives are supported');
   if(primitive.listTargets().length)throw new Error('Morph targets require a character adapter');
   const position=primitive.getAttribute('POSITION');if(!position)throw new Error('Missing POSITION');
   const material=primitive.getMaterial();
   if(material && [material.getBaseColorTexture(),material.getMetallicRoughnessTexture(),material.getNormalTexture(),material.getOcclusionTexture(),material.getEmissiveTexture()].some(Boolean)&&!stripTextures)throw new Error('Textured material: use --strip-textures to explicitly export solid colors only');
   if(material?.listExtensions().length)throw new Error('Material extensions require a dedicated adapter');
   const color=material?.getBaseColorFactor()??[1,1,1,1];
   const normal=primitive.getAttribute('NORMAL');const uv=primitive.getAttribute('TEXCOORD_0');const indices=primitive.getIndices();
   meshes.push({name:`${node.getName()||mesh.getName()||'mesh'}_${i}`,positions:Array.from(position.getArray()!),...(normal?{normals:Array.from(normal.getArray()!)}:{}),...(uv?{uvs:Array.from(uv.getArray()!)}:{}),...(indices?{indices:Array.from(indices.getArray()!)}:{}),matrix:node.getWorldMatrix(),material:{color:[color[0],color[1],color[2]],roughness:material?.getRoughnessFactor()??1,metalness:material?.getMetallicFactor()??1,opacity:color[3],doubleSided:material?.getDoubleSided()??false}});
  }
 });
 if(!meshes.length)throw new Error('No renderable meshes');
 return {version:1,meshes};
}
async function main(){
 const [input,output,...flags]=process.argv.slice(2);
 if(!input||!output)throw new Error('Usage: npm run assets:convert -- assets/source/desk.glb src/assets/generated/desk.ts [--strip-textures]');
 const document=await new NodeIO().read(input);
 const data=convertDocument(document,flags.includes('--strip-textures'));
 let typePath=relative(dirname(resolve(output)),resolve('src/assets/vertexAsset')).replaceAll('\\','/');if(!typePath.startsWith('.'))typePath='./'+typePath;
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,`// Generated from ${JSON.stringify(input)}. Do not edit by hand.\nimport type {VertexAsset} from ${JSON.stringify(typePath)};\nexport default ${JSON.stringify(data)} satisfies VertexAsset;\n`);
 console.log(`Exported ${data.meshes.length} primitives to ${output}`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
