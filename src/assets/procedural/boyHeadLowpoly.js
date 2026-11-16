// Reusable low-poly head asset for RoomBoy scenes, tools and character prototypes.
// Geometry is rebuilt from the approved GLB-aligned procedural vertex cage; no GLB
// is downloaded, no high-resolution reference geometry enters the runtime.
import * as THREE from 'three';
import {makeEdgeLowpolyData,lowpolyStats,sourceReference} from '../../experiments/head/edgeLowpoly.js';
import {headGeometry,cageGeometry} from '../../experiments/head/boyHead.js';

/**
 * Creates a standalone head mesh with faceted shading. Every call owns its own
 * geometry and material. The local head coordinates are +Y up / +Z forward.
 * @param {{data?:object,parameters?:object,stage?:number,regionColors?:boolean}} [options]
 */
export function createBoyHeadLowpolyMesh(options={}) {
 const data=options.data ?? makeEdgeLowpolyData(options.parameters??{},options.stage??3);
 const geometry=headGeometry(data,Boolean(options.regionColors));
 const material=new THREE.MeshLambertMaterial({
  vertexColors:true,flatShading:true,side:THREE.FrontSide,
  polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1
 });
 const mesh=new THREE.Mesh(geometry,material);
 mesh.name='boy-head-lowpoly';
 mesh.castShadow=true;
 mesh.receiveShadow=true;
 const counts=lowpolyStats(data);
 mesh.userData={
  assetId:'boy-head-lowpoly',
  provenance:sourceReference.sha256,
  counts:{vertices:counts.vertices,triangles:counts.triangles},
  orientation:'+Y up, +Z front',
  eyeOpenings:data.loops.length===4?2:0,
  editable:true
 };
 return mesh;
}

/**
 * Optional authoring overlay. Lines follow logical polygon boundaries,
 * not incidental triangulation diagonals; suitable for topology inspection.
 */
export function createBoyHeadLowpolyWire(data) {
 const lines=new THREE.LineSegments(cageGeometry(data),new THREE.LineBasicMaterial({
  color:0x456268,transparent:true,opacity:.5,depthTest:true
 }));
 lines.name='boy-head-logical-edges';
 lines.userData.assetId='boy-head-logical-edges';
 return lines;
}

/** Dispose only this asset's owned geometry/material when replacing previews. */
export function disposeBoyHeadLowpolyAsset(object){
 object.traverse?.(node=>{
  if(!node.isMesh && !node.isLineSegments)return;
  node.geometry?.dispose();
  if(Array.isArray(node.material))node.material.forEach(m=>m.dispose());
  else node.material?.dispose();
 });
}
