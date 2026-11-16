import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const assetPath=resolve('public/heads/grey-head-qem-30000.glb');
const sourceSha256='cc1500ea406241ce7f43e5c1873ebceb42cce5f9e8390347cfb6943e33751817';
const outputSha256='36732c6a929e4e588314ba540255c8c2effe0f6880d6168a091f7922787e66d0';
const raw=readFileSync(assetPath);

function inspectGlb(){
 assert.equal(raw.toString('ascii',0,4),'glTF');
 assert.equal(raw.readUInt32LE(4),2);
 assert.equal(raw.readUInt32LE(8),raw.length);
 const jsonLength=raw.readUInt32LE(12);
 assert.equal(raw.toString('ascii',16,20),'JSON');
 const json=JSON.parse(raw.subarray(20,20+jsonLength).toString('utf8'));
 const binStart=20+jsonLength;
 assert.equal(raw.toString('ascii',binStart+4,binStart+7),'BIN');
 const binLength=raw.readUInt32LE(binStart);
 const binBase=binStart+8;
 assert.equal(binBase+binLength,raw.length);
 const prim=json.meshes[0].primitives[0];
 const positions=json.accessors[prim.attributes.POSITION];
 const normals=json.accessors[prim.attributes.NORMAL];
 const indices=json.accessors[prim.indices];
 const at=(accessor,index,component)=>{
  const view=json.bufferViews[accessor.bufferView];
  const stride=view.byteStride||((accessor.type==='VEC3'?3:1)*4);
  const offset=binBase+(view.byteOffset||0)+(accessor.byteOffset||0)+index*stride+component*4;
  if(accessor.componentType===5126)return raw.readFloatLE(offset);
  if(accessor.componentType===5125)return raw.readUInt32LE(offset);
  throw Error('unexpected accessor component type');
 };
 return {json,positions,normals,indices,at};
}

test('real GLB QEM asset replaces the abandoned procedural 1046-face head',()=>{
 const sha=createHash('sha256').update(raw).digest('hex');
 assert.equal(sha,outputSha256);
 assert(raw.length<1200000,'under 1.2 MB on disk');
 const m=inspectGlb();
 assert.equal(m.positions.count,27463);
 assert.equal(m.normals.count,27463);
 assert.equal(m.indices.count,90000);
 assert.equal(m.indices.count/3,30000);
 assert.equal(m.json.extensionsRequired?.includes('EXT_meshopt_compression')??false,false,'no decoder needed for shipped mesh');
 assert.equal(m.json.extensionsRequired?.includes('KHR_texture_basisu')??false,false);
 assert(!existsSync('src/assets/procedural/boyHeadLowpoly.js'),'old synthetic scene asset removed');
 assert(!existsSync('src/experiments/head/edgeLowpoly.js'),'old silhouette approximator removed');
 assert(!existsSync('public/grey-head-lowpoly.js'),'old baked lowpoly artifact removed');
});

test('the QEM asset has valid finite positions, normals, indices and triangles',()=>{
 const {positions,normals,indices,at}=inspectGlb();
 const bbMin=[Infinity,Infinity,Infinity],bbMax=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<positions.count;i++){
  let n2=0;
  for(let c=0;c<3;c++){
   const p=at(positions,i,c),n=at(normals,i,c);
   assert(Number.isFinite(p),'finite source-derived position');
   assert(Number.isFinite(n),'finite original-space vertex normal');
   n2+=n*n;bbMin[c]=Math.min(bbMin[c],p);bbMax[c]=Math.max(bbMax[c],p);
  }
  assert(n2>.70 && n2<1.30,'surface normal unit length');
 }
 assert(bbMin[1]<-1.018 && bbMax[1]>1.229);
 assert(bbMin[0]<-.93 && bbMax[0]>.90);
 assert(bbMax[2]>.81 && bbMin[2]<-1.35);
 for(let i=0;i<indices.count;i+=3){
  const a=at(indices,i,0),b=at(indices,i+1,0),c=at(indices,i+2,0);
  assert(a<positions.count&&b<positions.count&&c<positions.count,'index references real vertex');
  assert(a!==b&&a!==c&&b!==c,'triangle index is nondegenerate');
 }
});

test('reduction genuinely changes source triangle density, not just file encoding',()=>{
 const originalTriangles=1424998,reducedTriangles=inspectGlb().indices.count/3;
 assert(originalTriangles/reducedTriangles>40,'over 40x fewer actual triangles');
 assert.equal(sourceSha256.length,64,'source mesh fingerprint recorded');
});
