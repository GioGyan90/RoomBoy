// Reference-guided low-poly head from the exact grey-head-fast-medium.glb
// SHA-256 cc1500ea406241ce7f43e5c1873ebceb42cce5f9e8390347cfb6943e33751817.
// The original is 797,528 vertices / 1,424,998 triangles. This low-poly asset
// uses the GLB's measured skull edge envelopes, with deliberately authored
// facial loops. It is NOT a direct decimation of every source triangle.
import {buildHeadData} from './boyHead.js';
import {glbSections} from './glbOutline.js';

export const sourceReference = Object.freeze({
 filename:'grey-head-fast-medium.glb',
 sha256:'cc1500ea406241ce7f43e5c1873ebceb42cce5f9e8390347cfb6943e33751817',
 vertices:797528,triangles:1424998,
 measuredSections:glbSections.length
});

const triFaces = d => d.faces.flatMap(f=>f.slice(1,-1).map((_,i)=>[f[0],f[i+1],f[i+2]]));
const p3=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);

// Intersection with the true *low-poly* triangle surface at the sampled y-level.
// Its error is measured against the saved 57 source GLB silhouette stations.
export function headContourError(data) {
 const tris=triFaces(data),rows=[];
 for(const [y,targetWidth,targetFront,targetBack] of glbSections) {
  let width=0,front=-Infinity,back=Infinity,count=0;
  for(const [i,j,k] of tris) {
   if(data.regions[data.faces.findIndex(f=>f.includes(i)&&f.includes(j)&&f.includes(k))]?.startsWith('ear'))continue;
   for(const [a,b] of [[i,j],[j,k],[k,i]]) {
    const p=data.vertices[a],q=data.vertices[b];
    if((p[1]-y)*(q[1]-y)>=0)continue;
    const v=p3(p,q,(y-p[1])/(q[1]-p[1]));
    width=Math.max(width,Math.abs(v[0]));front=Math.max(front,v[2]);back=Math.min(back,v[2]);count++;
   }
  }
  if(count) rows.push({y,expectedWidth:targetWidth,width,expectedFront:targetFront,front,expectedBack:targetBack,back});
 }
 const rms=(key,expected)=>Math.sqrt(rows.reduce((sum,r)=>sum+(r[key]-r[expected])**2,0)/Math.max(1,rows.length));
 return {rows,widthRms:rms('width','expectedWidth'),rearRms:rms('back','expectedBack'),frontRms:rms('front','expectedFront')};
}

// Pick sharp outline turns from original sampled reference, instead of evenly
// distributing surface loops. Useful as explicit guides for future hand retopo.
export function referenceEdgeStations(threshold=.012) {
 const keep=new Set([0,glbSections.length-1]);
 const forced=[-.99,-.76,-.57,-.43,-.30,-.18,-.03,.18,.36,.57,.78,1.03,1.18];
 for(const y of forced) {
  let best=0,dist=Infinity;
  glbSections.forEach((r,i)=>{const d=Math.abs(r[0]-y);if(d<dist){best=i;dist=d;}});
  keep.add(best);
 }
 for(let i=1;i<glbSections.length-1;i++) {
  const a=glbSections[i-1],b=glbSections[i],c=glbSections[i+1];
  const curvature=Math.max(...[1,2,3].map(k=>Math.abs(b[k]-(a[k]+c[k])/2)));
  if(curvature>threshold)keep.add(i);
 }
 return [...keep].sort((a,b)=>a-b).map(i=>({y:glbSections[i][0],halfWidth:glbSections[i][1],front:glbSections[i][2],back:glbSections[i][3]}));
}

export function makeEdgeLowpolyData(options={},stage=3) {
 // The base mesh has already been fitted to these same GLB envelopes, while
 // keeping the anatomical open-eye and mouth topology rather than voxelizing.
 return buildHeadData(options,stage);
}

export function lowpolyStats(data) {
 return {vertices:data.vertices.length,triangles:triFaces(data).length,sourceTriangles:sourceReference.triangles};
}

// Bake the presently edited *real* JS cage into a standalone Three.js ES module.
// No GLB, meshopt decoder, remote assets or runtime procedural generator needed.
export function serializeLowpolyHead(data) {
 const triangles=triFaces(data),positions=data.vertices.flat(),indices=triangles.flat();
 if(positions.some(n=>!Number.isFinite(n)))throw new Error('头部包含无效顶点。');
 if(data.vertices.length>65535)throw new Error('低模顶点数量超出 Uint16 索引。');
 const encode=arr=>JSON.stringify(arr.map(n=>Math.round(n*1000000)/1000000));
 return `// RoomBoy GLB-edge fitted low-poly head. Source SHA256: ${sourceReference.sha256}
 // Reconstructed and simplified topology; NOT the original 1.42M triangle GLB.
 export const vertexCount=${data.vertices.length};
 export const triangleCount=${triangles.length};
 export function createHeadModel(THREE) {
   const geo=new THREE.BufferGeometry();
   geo.setAttribute('position',new THREE.Float32BufferAttribute(${encode(positions)},3));
   geo.setIndex(${JSON.stringify(indices)});
   geo.computeVertexNormals();
   const mesh=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({
     color:0xb8b7af,flatShading:true,side:THREE.FrontSide
   }));
   mesh.name='RoomBoy · GLB-fitted low-poly head';
   return mesh;
 }
 `;
}
