import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Group} from 'three';
// @ts-expect-error JS geometry deliberately remains framework-independent.
import {createHeadPlanes,FRONT_LEFT_HALF_ROWS} from '../src/experiments/head/headPlanesGeometry.js';

function key(x:number,y:number,z:number){
  return [x,y,z].map(n=>Math.round(n*10000)).join(',');
}
function usedMeshVertices(mesh:any){
  const pos=mesh.geometry.getAttribute('position');
  return [...new Set(Array.from(mesh.geometry.index.array as Iterable<number>))]
    .map(i=>[pos.getX(i),pos.getY(i),pos.getZ(i)]);
}

test('front-authoring topology has 12 rows, six landmark endpoints, and only negative X',()=>{
  assert.equal(FRONT_LEFT_HALF_ROWS.length,12);
  for(const row of FRONT_LEFT_HALF_ROWS){
    assert.equal(row.points.length,6,row.name);
    assert.equal(row.points[0][0],0,'seam endpoint must be exactly X=0');
    for(let i=0;i<row.points.length;i++){
      const p=row.points[i];
      assert(p.every(Number.isFinite));
      assert(p[0]<=0,'the source is the LEFT half, not symmetric hand drawing');
      if(i>0)assert(p[0]<row.points[i-1][0],'columns ordered away from symmetry axis');
    }
  }
  const half=createHeadPlanes({stage:'half'});
  const mirrored=createHeadPlanes({stage:'mirror'});
  const solid=createHeadPlanes({stage:'volume'});
  assert.equal(half.parts.length,1);
  assert.equal(mirrored.parts.length,1);
  assert.equal(solid.parts.length,3);
  assert.equal(half.faces*2,mirrored.faces);
  assert(solid.faces>mirrored.faces && solid.faces<1000);
  assert(usedMeshVertices(half.parts[0]).every(p=>p[0]<=.00001));
  assert(usedMeshVertices(mirrored.parts[0]).some(p=>p[0]>.2));
});

test('full volume has one continuous indexed skin shell with no floating facial overlays',()=>{
  const result=createHeadPlanes();
  assert(result.group instanceof Group);
  assert(result.parts.length===3,'one continuous head+neck+shoulders, two attached ear shells');
  const shell=result.parts[0],g=shell.geometry;
  const count=g.getAttribute('position').count;
  assert(count>250 && count<500);
  assert(g.index && g.index.count/3>500 && g.index.count/3<900);
  assert(g.groups.length>250,'semantic facial planes are material groups of ONE mesh');
  assert(shell.material.length>8,'facets are subsets of same vertex-index mesh, not separate face cards');
  assert(result.parts.slice(1).every((p:any)=>p.userData.zone==='ears'));
  const edgeCount=new Map<string,number>();
  for(let i=0;i<g.index.count;i+=3){
    const tri=[g.index.getX(i),g.index.getX(i+1),g.index.getX(i+2)];
    assert(new Set(tri).size===3,'no collapsed triangle');
    for(let k=0;k<3;k++){
      const a=Math.min(tri[k],tri[(k+1)%3]),b=Math.max(tri[k],tri[(k+1)%3]);
      const e=a+'-'+b;edgeCount.set(e,(edgeCount.get(e)||0)+1);
    }
  }
  assert(edgeCount.size>0);
  assert([...edgeCount.values()].every(v=>v===2),
     'each head/neck/shoulder edge is shared by exactly two triangles');
  const b=new Box3().setFromObject(result.group);
  assert(Math.abs(b.max.x+b.min.x)<1e-5);
  assert(b.max.y>1.55 && b.min.y< -2);
  assert(b.max.z>.85 && b.min.z<-.80);
});

test('full indexed geometry mirrors X and exposes honest wire/region switches',()=>{
  const result=createHeadPlanes();
  const counts=new Map<string,number>();
  let triangles=0;
  for(const part of result.parts){
    const g=part.geometry,pos=g.getAttribute('position'),nor=g.getAttribute('normal');
    assert(pos.count>2 && nor.count===pos.count,part.name);
    assert(g.index && g.index.count%3===0);
    triangles+=g.index!.count/3;
    for(let i=0;i<pos.count;i++){
      const p=[pos.getX(i),pos.getY(i),pos.getZ(i)];
      assert(p.every(Number.isFinite));
      const k=key(...p as [number,number,number]);
      counts.set(k,(counts.get(k)||0)+1);
    }
  }
  assert.equal(triangles,result.faces);
  for(const [k,v] of counts){
    const [x,y,z]=k.split(',').map(Number);
    assert.equal(counts.get(key(-x/10000,y/10000,z/10000)),v,'mirror mismatch at '+k);
  }
  result.setWire(true);
  assert(result.parts.every((p:any)=>p.getObjectByName('topology')?.visible));
  result.setWire(false);
  result.setPartVisible('ears',false);
  assert(result.parts.filter((p:any)=>p.userData.zone==='ears').every((p:any)=>!p.visible));
  result.setZones(false);
  for(const part of result.parts){
    for(const material of Array.isArray(part.material)?part.material:[part.material])
      assert.equal(material.color.getHex(),0xc8c3be);
  }
});
