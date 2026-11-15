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

// @ts-expect-error Plain JavaScript parameter contract shared by UI and generator.
import {specs,defaults,normalizeParameters,serializeParameters,parseParameters} from '../src/experiments/head/parameters.js';
const entries=Object.values(specs) as [string,string,number,number,number,number,number,string][];
function normals(d:Data){return d.faces.flatMap(f=>f.slice(1,-1).map((_,i)=>{const a=new Vector3(...d.vertices[f[0]]),b=new Vector3(...d.vertices[f[i+1]]),c=new Vector3(...d.vertices[f[i+2]]);return b.sub(a).cross(c.sub(a));}));}
test('every parameter changes its intended stage and preserves existing topology',()=>{
 for(const [id,,min,max,def,,first]of entries){
  const base:Data=buildHeadData({},first),changed:Data=buildHeadData({[id]:max},first);
  assert.deepEqual(changed.faces,base.faces);
  assert(changed.vertices.some((v,i)=>v.some((n,j)=>Math.abs(n-base.vertices[i][j])>1e-7)),id+' must deform real vertices');
  if(first>1)assert.deepEqual(buildHeadData({[id]:max},first-1).vertices,buildHeadData({},first-1).vertices,id+' stage gating');
  assert.equal(normalizeParameters({[id]:-Infinity})[id],def);
  assert.equal(normalizeParameters({[id]:min-99})[id],min);
  assert.equal(normalizeParameters({[id]:max+99})[id],max);
 }
});
test('parameter presets round trip and reject corrupt input',()=>{
 const p=normalizeParameters({eyeGap:.02,mouthWidth:1.1,chinLength:.04});
 assert.deepEqual(parseParameters(serializeParameters(p)),p);
 for(const text of ['null','{}','{"schema":"roomboy-boy-head","version":2,"parameters":{"evil":0}}','{"schema":"roomboy-boy-head","version":2,"parameters":{"nose":"1"}}'])assert.throws(()=>parseParameters(text));
 assert.deepEqual(normalizeParameters({nose:NaN}),defaults);
});
test('combined parameter extremes stay finite, nondegenerate and preserve local winding',()=>{
 const base:Data=buildHeadData();const reference=normals(base);
 const candidates=[Object.fromEntries(entries.map(s=>[s[0],s[2]])),Object.fromEntries(entries.map(s=>[s[0],s[3]]))];
 let seed=68192;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 for(let n=0;n<150;n++)candidates.push(Object.fromEntries(entries.map(s=>[s[0],s[2]+rand()*(s[3]-s[2])])));
 for(const p of candidates){
  const d:Data=buildHeadData(p);assert(d.vertices.flat().every(Number.isFinite));
  normals(d).forEach((normal,i)=>{assert(normal.length()>1e-8,'degenerate '+i);assert(normal.dot(reference[i])>0,'local fold '+i+' '+JSON.stringify(p));});
 }
});
