// Stage 4 C acceptance: geometry invariants and preserved A/B exhibits.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const load=(name:string)=>JSON.parse(readFileSync(new URL('../public/exhibits/'+name+'.json',import.meta.url),'utf8')) as {vertices:number[][],faces:number[][]};
const close=(a:number,b:number,tol=1e-7)=>Math.abs(a-b)<tol;
test('stage4 C has 62 genuinely shared vertices, 116 edges, and 56 nondegenerate control faces',()=>{
 const c=load('stage4-c');
 assert.equal(c.vertices.length,62);
 assert.equal(c.faces.length,56);
 const edges=new Map<string,number>();
 for(const [fi,f] of c.faces.entries()){
  assert.ok(f.length>=3&&new Set(f).size===f.length,'face '+fi+' repeats vertices');
  assert.ok(f.every(i=>Number.isInteger(i)&&i>=0&&i<c.vertices.length));
  const normal=[0,0,0];
  f.forEach((id,j)=>{
   const a=c.vertices[id],b=c.vertices[f[(j+1)%f.length]];
   normal[0]+=(a[1]-b[1])*(a[2]+b[2]);
   normal[1]+=(a[2]-b[2])*(a[0]+b[0]);
   normal[2]+=(a[0]-b[0])*(a[1]+b[1]);
   const key=[id,f[(j+1)%f.length]].sort((x,y)=>x-y).join(':');
   edges.set(key,(edges.get(key)??0)+1);
  });
  assert.ok(Math.hypot(...normal)>1e-7,'degenerate face '+fi);
 }
 assert.equal(edges.size,116);
 assert.ok([...edges.values()].every(n=>n<=2),'non-manifold edge');
 assert.ok(c.vertices.every(v=>v.length===3&&v.every(Number.isFinite)));
 const keys=new Set(c.vertices.map(v=>v.map(n=>n.toFixed(8)).join(',')));
 assert.equal(keys.size,c.vertices.length,'duplicate coordinates');
});
test('stage4 C remains X-symmetric and restores both forehead-depth vertices',()=>{
 const c=load('stage4-c');
 for(const [i,v] of c.vertices.entries()){
  assert.ok(c.vertices.some(w=>close(w[0],-v[0])&&close(w[1],v[1])&&close(w[2],v[2])),'missing mirrored partner for vertex '+i);
 }
 const left=c.vertices[38],right=c.vertices[42];
 assert.ok(close(left[0],-right[0])&&close(left[1],right[1])&&close(left[2],right[2]));
 assert.ok(left[2]>1.38&&right[2]>1.38,'forehead depression repair missing');
 const center=c.vertices[13];
 assert.ok(left[2]<center[2]&&right[2]<center[2],'repair overshot middle brow depth');
});
test('stage3 and stage4 B remain available for reversible exhibition comparison',()=>{
 for(const f of ['stage3-face-routing','stage4-calibrated']){
  assert.ok(existsSync(new URL('../public/exhibits/'+f+'.json',import.meta.url)));
 }
});