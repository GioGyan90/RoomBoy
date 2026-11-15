import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error The experiment deliberately exposes a plain JavaScript cage.
import {buildHeadData,headGeometry} from '../src/experiments/head/boyHead.js';
import {Vector3} from 'three';
type Data={vertices:number[][];faces:number[][];regions:string[];loops:number[][]};
for(const stage of [1,2,3])test(`boy head stage ${stage}: symmetry, topology and nondegenerate faces`,()=>{
 for(const options of [{},{cheek:.9,jaw:.85,depth:.9,nose:.65,eyeHeight:.75},{cheek:1.1,jaw:1.15,depth:1.1,nose:1.25,eyeHeight:1.2}]){
  const d:Data=buildHeadData(options,stage),edges=new Map<string,number[][]>();
  const positions=new Set(d.vertices.map(v=>v.map(n=>n.toFixed(6)).join(',')));
  d.vertices.forEach(v=>{assert(v.every(Number.isFinite));assert(positions.has([-v[0],v[1],v[2]].map(n=>Math.abs(n)<1e-8?'0.000000':n.toFixed(6)).join(',')));});
  for(const f of d.faces){
   assert.equal(new Set(f).size,f.length);
   f.forEach((a,i)=>{assert(a>=0&&a<d.vertices.length);const b=f[(i+1)%f.length],key=[Math.min(a,b),Math.max(a,b)].join(':');edges.set(key,[...(edges.get(key)||[]),[a,b]]);});
   for(let i=1;i<f.length-1;i++){
    const a=new Vector3(...d.vertices[f[0]]),b=new Vector3(...d.vertices[f[i]]),c=new Vector3(...d.vertices[f[i+1]]);
    assert(b.sub(a).cross(c.sub(a)).length()>1e-8,'zero area triangle');
   }
  }
  const boundary=[...edges.entries()].filter(([,v])=>v.length===1);
  assert.equal(boundary.length,stage===3?20:0,'only two intentional ten-edge eye openings');
  for(const [,v]of edges){assert(v.length<=2);if(v.length===2)assert.equal(v[0][0],v[1][1],'consistent winding');}
  if(stage===3){const openings=new Set(d.loops.filter((_,i)=>i%2===1).flatMap(l=>l.map((a,i)=>[Math.min(a,l[(i+1)%l.length]),Math.max(a,l[(i+1)%l.length])].join(':'))));assert(boundary.every(([k])=>openings.has(k)));}
  const geometry=headGeometry(d);assert(geometry.attributes.position.count/3<1200);geometry.dispose();
 }
});
