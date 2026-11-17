import test from 'node:test';
import assert from 'node:assert/strict';
import {Box3,Group} from 'three';
// @ts-expect-error This is a deliberately standalone JS geometry module.
import {createHeadPlanes} from '../src/experiments/head/headPlanesGeometry.js';

test('procedural nine-view head builds a bounded, low-poly symmetrical 3D form',()=>{
  const result=createHeadPlanes();
  assert(result.group instanceof Group);
  assert(result.faces>400 && result.faces<1500,'must be a genuine low-poly study');
  assert(result.parts.length>30,'semantic parts should remain separately editable');
  const b=new Box3().setFromObject(result.group);
  assert(Math.abs(b.max.x+b.min.x)<.001,'left-right silhouette must mirror around X=0');
  assert(b.max.y>1.45 && b.min.y< -2,'head, neck and shoulders must be present');
  assert(b.max.z>.85 && b.min.z<-.60,'nose tip and back skull have 3D depth');
  const vertices=new Map<string,number>();
  const key=(x:number,y:number,z:number)=>[x,y,z].map(v=>Math.round(v*10000)).join(',');
  let triangles=0;
  for(const part of result.parts){
    const g=part.geometry;
    const pos=g.getAttribute('position');
    const nor=g.getAttribute('normal');
    assert(pos.count>2 && nor.count===pos.count,part.name);
    assert(g.index && g.index.count%3===0,part.name);
    triangles+=g.index!.count/3;
    for(let i=0;i<pos.count;i++){
      const p=[pos.getX(i),pos.getY(i),pos.getZ(i)];
      assert(p.every(Number.isFinite),'all vertices must be finite');
      const k=key(p[0],p[1],p[2]);
      vertices.set(k,(vertices.get(k)||0)+1);
    }
  }
  assert.equal(triangles,result.faces);
  for(const [k,count] of vertices){
    const [x,y,z]=k.split(',').map(Number);
    const mirror=key(-x/10000,y/10000,z/10000);
    assert.equal(vertices.get(mirror),count,'every geometry vertex must have a matching mirrored vertex: '+k);
  }
  result.setWire(true);
  assert(result.parts.every((p:any)=>p.getObjectByName('topology')?.visible));
  result.setWire(false);
  result.setPartVisible('ears',false);
  assert(result.parts.filter((p:any)=>p.userData.zone==='ears').every((p:any)=>!p.visible));
  result.setZones(false);
  assert(result.parts.every((p:any)=>p.material.color.getHex()===0xcac6c3));
});
