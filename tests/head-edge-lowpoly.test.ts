import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
// @ts-expect-error JS module intentionally shared by the viewer and build script.
import {makeEdgeLowpolyData,serializeLowpolyHead,headContourError,referenceEdgeStations,lowpolyStats,sourceReference} from '../src/experiments/head/edgeLowpoly.js';

test('head reference metadata exactly matches the supplied meshopt GLB',()=>{
 assert.equal(sourceReference.sha256,'cc1500ea406241ce7f43e5c1873ebceb42cce5f9e8390347cfb6943e33751817');
 assert.equal(sourceReference.vertices,797528);
 assert.equal(sourceReference.triangles,1424998);
 assert.equal(sourceReference.measuredSections,57);
});

test('reference edge-aligned head is low-poly with complete face and open eye anatomy',()=>{
 const data=makeEdgeLowpolyData({},3),stats=lowpolyStats(data);
 assert(stats.vertices<800 && stats.vertices>150);
 assert(stats.triangles<1600 && stats.triangles>300);
 assert(stats.sourceTriangles/stats.triangles>500);
 assert(data.regions.includes('earWall'));
 assert(data.regions.includes('philtrum'));
 assert(data.regions.includes('jawUnderside'));
 assert(data.loops.length>=2);
 assert(data.vertices.flat().every(Number.isFinite));
 const stations=referenceEdgeStations();
 assert(stations.length>=13 && stations.length<sourceReference.measuredSections);
 assert(stations.every((s,i)=>i===0||s.y>stations[i-1].y));
});

test('reference contours stay close without claiming full surface precision',()=>{
 const contour=headContourError(makeEdgeLowpolyData());
 assert.equal(contour.rows.length,57);
 assert(contour.widthRms<.045,'skull width should follow measured outline');
 assert(contour.rearRms<.15,'occipital shape should retain measured rear profile');
 assert(Number.isFinite(contour.frontRms));
});

test('exported low-poly JS rebuilds matching positions and triangles',async()=>{
 const data=makeEdgeLowpolyData(),stats=lowpolyStats(data);
 const source=serializeLowpolyHead(data);
 const module=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(source));
 assert.equal(module.vertexCount,stats.vertices);
 assert.equal(module.triangleCount,stats.triangles);
 const mesh=module.createHeadModel(THREE);
 const positions=mesh.geometry.getAttribute('position');
 assert.equal(positions.count,stats.vertices);
 assert.equal(mesh.geometry.index.count/3,stats.triangles);
 const original=data.vertices.flat();
 for(let i=0;i<original.length;i++) assert(Math.abs(original[i]-positions.array[i])<2e-6,'vertex '+i);
 assert.equal(mesh.material.flatShading,true);
 mesh.geometry.dispose();mesh.material.dispose();
});
