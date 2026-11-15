import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error The experiment deliberately exposes a plain JavaScript cage.
import {buildHeadData,headGeometry} from '../src/experiments/head/boyHead.js';
import {Vector3} from 'three';
// @ts-expect-error Plain JavaScript reference calibration.
import {referenceHeight} from '../src/experiments/head/referenceFit.js';
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

test('nasal underside and upper lip have an independent recessed transition',()=>{
 const base:Data=buildHeadData();
 const center=(d:Data,y:number)=>d.vertices.find(v=>Math.abs(v[0])<1e-8&&Math.abs(v[1]-referenceHeight(y))<1e-8&&v[2]>.5)!;
 const bridge=center(base,-.30),nose=center(base,-.22),lip=center(base,-.38);
 assert(bridge,'subnasale control row exists');
 assert(nose[2]>bridge[2]+.1,'nasal underside slopes inward');
 assert(lip[2]>bridge[2]+.005,'upper lip emerges from recessed philtrum');
 assert(base.regions.includes('nasalBase')&&base.regions.includes('philtrum'));
 const projected:Data=buildHeadData({muzzleProjection:.075,mouthForward:.03});
 assert.deepEqual(center(projected,-.30),bridge,'oral projection must not erase the nasal break');
 assert.deepEqual(center(projected,-.22),nose,'nose tip stays independent');
 assert(center(projected,-.38)[2]>lip[2]);
 const inset:Data=buildHeadData({philtrumInset:.03});
 assert(center(inset,-.30)[2]<bridge[2]);
 assert.deepEqual(center(inset,-.38),lip,'inset must not retract the upper lip');
});

test('rendered triangles mirror exactly, including diagonals and normals',()=>{
 for(const stage of [1,2,3])for(const params of [{},{muzzleProjection:.075,philtrumInset:.03,cheekFullness:.04}]){
  const data:Data=buildHeadData(params,stage);
  const key=(points:number[][])=>points.map(p=>p.map(v=>(Math.abs(v)<1e-8?0:v).toFixed(6)).join(',')).sort().join('|');
  const triangles=data.faces.flatMap(f=>f.slice(1,-1).map((_,i)=>[f[0],f[i+1],f[i+2]].map(id=>data.vertices[id])));
  const lookup=new Map(triangles.map(t=>[key(t),t]));
  for(const t of triangles){
   const reflected=t.map(([x,y,z])=>[-x,y,z]);
   const pair=lookup.get(key(reflected));
   assert(pair,'every rendered triangle must have the same reflected diagonal');
   const normal=(a:number[][])=>new Vector3(...a[1]).sub(new Vector3(...a[0])).cross(new Vector3(...a[2]).sub(new Vector3(...a[0]))).normalize();
   const n=normal(t),m=normal(pair);assert(m.distanceTo(new Vector3(-n.x,n.y,n.z))<1e-6,'reflected normal must match');
  }
 }
});

test('mandibular border rises toward the ear with an inset underside and rounded occiput',()=>{
 for(const stage of [1,2,3]){
  const d:Data=buildHeadData({},stage);
  const jaw=d.vertices.slice(6,12);
  for(let i=1;i<jaw.length;i++)assert(jaw[i][1]>=jaw[i-1][1]-1e-8,'jaw border rises toward angle');
  assert(jaw[5][1]-jaw[0][1]>.18,'jaw angle must sit above chin');
  assert(jaw[5][0]-d.vertices[5][0]>.23,'underside recedes below jaw border');
  assert(d.vertices[17][0]>jaw[5][0],'cheek continues above border');
  assert(d.regions.includes('jawUnderside'));
  const rear=d.vertices.filter(v=>Math.abs(v[0])<1e-8&&v[2]<0);
  const deepest=rear.reduce((a,b)=>a[2]<b[2]?a:b);
  assert(deepest[2]<-1.1&&deepest[1]>.1&&deepest[1]<.6,'occiput has a posterior bulge');
  assert(rear.find(v=>Math.abs(v[1]-referenceHeight(.82))<1e-8)![2]>deepest[2]+.15,'rear curves into crown');
 }
});

test('ears have closed side walls with a separate rear perimeter',()=>{
 const d:Data=buildHeadData();
 const walls=d.faces.filter((_,i)=>d.regions[i]==='earWall');
 assert.equal(walls.length,24);
 assert.equal(d.regions.filter(r=>r==='earBack').length,24);
 for(const f of walls){
  assert.equal(f.length,4);
  const points=f.map(i=>d.vertices[i]);
  assert(Math.max(...points.map(v=>Math.abs(v[0])))-Math.min(...points.map(v=>Math.abs(v[0])))>=.072-1e-8,'wall has physical thickness');
 }
});

test('oral loop stays compact and lip projection does not pull the outer cheek',()=>{
 const d:Data=buildHeadData(),changed:Data=buildHeadData({mouthForward:.03});
 const lips=d.faces.filter((_,i)=>d.regions[i]==='lip');
 assert.equal(lips.length,8,'paired upper/lower lip patches');
 for(const f of lips)for(const i of f)assert(Math.abs(d.vertices[i][0])<.30,'lip loop terminates at mouth corner');
 let checked=0;
 d.vertices.forEach((v,i)=>{if(Math.abs(v[0])>.34&&v[1]>-.60&&v[1]<-.30){assert.deepEqual(changed.vertices[i],v);checked++;}});
 assert(checked>10,'check both cheeks, not just center seam');
 const used=new Set(d.faces.flat());assert.equal(used.size,d.vertices.length,'all control points are connected');
});

test('default head matches the supplied design sheet vertical landmarks',()=>{
 const d:Data=buildHeadData();
 const top=Math.max(...d.vertices.map(v=>v[1])),bottom=Math.min(...d.vertices.map(v=>v[1])),h=top-bottom;
 const eye=d.loops[0].map(i=>d.vertices[i][1]);
 const eyeFraction=(top-(Math.max(...eye)+Math.min(...eye))/2)/h;
 // Independent image estimates: head top 75, chin 735, eye center 432,
 // nose tip 563, closed lip line 620. Excludes eyeballs and iris.
 assert(Math.abs(eyeFraction-(432-75)/660)<.02);
 assert(Math.abs((top-d.vertices[36][1])/h-(563-75)/660)<.015);
 assert(Math.abs((top-d.vertices[24][1])/h-(620-75)/660)<.015);
 const ears=[...new Set(d.faces.flatMap((f,i)=>d.regions[i]==='ear'?f:[]))].map(i=>d.vertices[i]);
 const earZ=(Math.min(...ears.map(v=>v[2]))+Math.max(...ears.map(v=>v[2])))/2;
 assert(earZ<-.45&&earZ>-.60,'side-view ears sit behind the cheek, not beside the eyes');
});
