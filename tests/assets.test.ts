import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Document,NodeIO} from '@gltf-transform/core';
import {createVertexAsset} from '../src/assets/vertexAsset';
import {convertDocument} from '../tools/glb-to-vertices';
import {applyRoomOverrides,roomOverrides,vertexFactory} from '../src/assets/registry';
import {Group} from 'three';
function fixture(){
 const d=new Document();const buffer=d.createBuffer();const position=d.createAccessor().setType('VEC3').setArray(new Float32Array([0,0,0,1,0,0,0,1,0])).setBuffer(buffer);
 const material=d.createMaterial().setBaseColorFactor([.2,.4,.6,1]);
 const mesh=d.createMesh('triangle').addPrimitive(d.createPrimitive().setAttribute('POSITION',position).setMaterial(material));
 const parent=d.createNode('parent').setTranslation([1,2,3]);const node=d.createNode('desk').setTranslation([2,0,0]).setMesh(mesh);parent.addChild(node);d.createScene().addChild(parent);return d;
}
test('GLB round trip preserves vertices, material, and world transform',async()=>{
 const io=new NodeIO();const doc=await io.readBinary(await io.writeBinary(fixture()));
 const data=convertDocument(doc);assert.equal(data.meshes.length,1);assert.deepEqual(data.meshes[0].matrix?.slice(12,15),[3,2,3]);
 const root=createVertexAsset(data);assert.equal(root.children[0].position.x,3);assert.equal(root.children.length,1);
});
test('animated GLB is rejected before information is lost',()=>{const doc=fixture();doc.createAnimation('walk');assert.throws(()=>convertDocument(doc),/rig adapter/);});
test('textured material requires explicit consent to strip textures',()=>{
 const doc=fixture();doc.getRoot().listMaterials()[0].setBaseColorTexture(doc.createTexture());assert.throws(()=>convertDocument(doc),/strip-textures/);assert.equal(convertDocument(doc,true).meshes.length,1);
});
test('registry swaps only the requested furniture',()=>{
 const root=new Group();const old=new Group();const chair=new Group();root.add(old,chair);const registry=new Map([['desk',old],['chair',chair]]);
 roomOverrides.desk=vertexFactory(convertDocument(fixture()));
 try{applyRoomOverrides(root,registry);assert.notEqual(registry.get('desk'),old);assert.equal(registry.get('chair'),chair);assert.equal(root.children.length,2);}finally{delete roomOverrides.desk;}
});
