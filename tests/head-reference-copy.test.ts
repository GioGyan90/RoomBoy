import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,BufferGeometry,Float32BufferAttribute,Group,Mesh,MeshBasicMaterial,Vector3} from 'three';
// @ts-expect-error Standalone plain JS reference-copy implementation.
import {copyReferenceParts,normalizeReferenceParts,makeReferenceGroup,referenceCounts,serializeReferenceToJS} from '../src/experiments/head/referenceCopy.js';

test('GLB reference copy preserves actual triangle vertices, indices and world transforms',()=>{
 const geometry=new BufferGeometry();
 geometry.setAttribute('position',new Float32BufferAttribute([0,0,0, 1,0,0, 0,2,0, 1,2,0],3));
 geometry.setIndex([0,1,2, 1,3,2]);
 geometry.computeVertexNormals();
 const root=new Group(),mesh=new Mesh(geometry,new MeshBasicMaterial());
 mesh.position.set(1,2,3);root.add(mesh);
 const parts=copyReferenceParts(root);
 assert.equal(parts.length,1);
 assert.notEqual(parts[0].geometry,geometry);
 assert.equal(parts[0].geometry.getAttribute('position').count,4);
 assert.deepEqual(Array.from(parts[0].geometry.index.array),[0,1,2,1,3,2]);
 const pos=parts[0].geometry.getAttribute('position');
 assert.deepEqual([pos.getX(0),pos.getY(0),pos.getZ(0)],[1,2,3]);
 assert.deepEqual([geometry.getAttribute('position').getX(0),geometry.getAttribute('position').getY(0)],[0,0],'original mesh is untouched');
 normalizeReferenceParts(parts);
 const box=new Box3().setFromObject(makeReferenceGroup(parts));
 assert(Math.abs(box.min.y+1.02)<1e-5);
 assert(Math.abs(box.max.y-1.23)<1e-5);
 assert(Math.abs(box.max.z-.82)<1e-5);
 assert(Math.abs((box.min.x+box.max.x)/2)<1e-5);
 assert.deepEqual(referenceCounts(parts),{vertices:4,triangles:2});
 geometry.dispose();
 parts[0].geometry.dispose();
});

test('JS vertex module export restores identical normalized positions, normals and triangles',async()=>{
 const geometry=new BufferGeometry();
 geometry.setAttribute('position',new Float32BufferAttribute([0,0,0, 1,0,0, 0,1,0],3));
 geometry.setIndex([0,1,2]);
 geometry.computeVertexNormals();
 const parts=normalizeReferenceParts([{name:'triangle',geometry}]);
 const source=serializeReferenceToJS(parts);
 assert(source.includes('export function createReferenceModel'));
 const mod=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source));
 const T=await import('three');
 const group=mod.createReferenceModel(T);
 const clone=(group.children[0] as Mesh).geometry as BufferGeometry;
 for(const attribute of ['position','normal']){
  const original=geometry.getAttribute(attribute),copy=clone.getAttribute(attribute);
  assert.equal(copy.count,original.count);
  assert.deepEqual(Array.from(copy.array),Array.from(original.array),attribute+' values');
 }
 assert.deepEqual(Array.from(clone.index!.array),Array.from(geometry.index!.array));
 clone.dispose();geometry.dispose();
});

test('empty or degenerate reference geometry produces readable errors',()=>{
 assert.throws(()=>copyReferenceParts(new Group()),/GLB/);
 const g=new BufferGeometry();
 g.setAttribute('position',new Float32BufferAttribute([0,0,0,1,0,0,1,0,1],3));
 assert.throws(()=>normalizeReferenceParts([{name:'flat',geometry:g}]),/几何范围/);
 g.dispose();
});
