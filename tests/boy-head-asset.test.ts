import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error Reusable procedural asset is authored in plain JavaScript.
import {createBoyHeadLowpolyMesh,createBoyHeadLowpolyWire,disposeBoyHeadLowpolyAsset} from '../src/assets/procedural/boyHeadLowpoly.js';
// @ts-expect-error Experimental head cage is authored in plain JavaScript.
import {makeEdgeLowpolyData,lowpolyStats,sourceReference} from '../src/experiments/head/edgeLowpoly.js';

test('GLB-aligned boy head is directly instantiable as a repository scene asset',()=>{
 const mesh=createBoyHeadLowpolyMesh();
 const counts=mesh.userData.counts;
 assert.equal(mesh.name,'boy-head-lowpoly');
 assert.equal(mesh.userData.assetId,'boy-head-lowpoly');
 assert.equal(mesh.userData.provenance,sourceReference.sha256);
 assert.equal(counts.vertices,541);
 assert.equal(counts.triangles,1046);
 assert.equal(mesh.geometry.getAttribute('position').count,counts.triangles*3);
 assert.equal(mesh.material.flatShading,true);
 assert.equal(mesh.material.vertexColors,true);
 assert.equal(mesh.userData.eyeOpenings,2);
 assert(mesh.geometry.getAttribute('position').array.every(Number.isFinite));
 mesh.geometry.computeBoundingBox();
 const box=mesh.geometry.boundingBox!;
 assert(box.min.y<-0.9 && box.max.y>1.0);
 assert(box.max.x>0.8 && box.min.x<-.8);
 disposeBoyHeadLowpolyAsset(mesh);
});

test('scene instances do not share disposable buffers or parameter modifications',()=>{
 const first=createBoyHeadLowpolyMesh();
 const second=createBoyHeadLowpolyMesh({parameters:{chinWidth:1.2},regionColors:true});
 assert.notEqual(first,second);
 assert.notEqual(first.geometry,second.geometry);
 assert.notEqual(first.material,second.material);
 assert.notDeepEqual(Array.from(first.geometry.getAttribute('position').array),
  Array.from(second.geometry.getAttribute('position').array));
 assert.equal(first.userData.counts.triangles,second.userData.counts.triangles);
 disposeBoyHeadLowpolyAsset(first);
 disposeBoyHeadLowpolyAsset(second);
});

test('logical polygon edges are a separate overlay, not triangle diagonals',()=>{
 const data=makeEdgeLowpolyData();
 const wire=createBoyHeadLowpolyWire(data);
 const counts=lowpolyStats(data);
 assert.equal(wire.name,'boy-head-logical-edges');
 assert(wire.isLineSegments);
 assert(wire.geometry.getAttribute('position').count>counts.vertices);
 assert(wire.geometry.getAttribute('position').count<counts.triangles*6);
 disposeBoyHeadLowpolyAsset(wire);
});
