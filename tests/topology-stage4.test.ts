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

for(const stage of ['stage4-c','stage4-d','stage4-e','stage4-f','stage4-g','stage4-h'])test(stage+' has no nonadjacent triangle interior crossings (fan triangulation)',()=>{
 const m=load(stage);
 const V=m.vertices;
 const faces=m.faces.flatMap((f,fi)=>f.slice(1,-1).map((_,j)=>({ids:[f[0],f[j+1],f[j+2]],fi})));
 const sub=(a:number[],b:number[])=>a.map((x,i)=>x-b[i]);
 const dot=(a:number[],b:number[])=>a.reduce((sum,x,i)=>sum+x*b[i],0);
 const cross=(a:number[],b:number[])=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const hit=(p:number[],q:number[],a:number[],b:number[],c:number[])=>{
  const d=sub(q,p),e1=sub(b,a),e2=sub(c,a),h=cross(d,e2),det=dot(e1,h);
  if(Math.abs(det)<1e-9)return false;
  const inv=1/det,s=sub(p,a),u=dot(s,h)*inv;
  if(u<=1e-7||u>=1-1e-7)return false;
  const r=cross(s,e1),v=dot(d,r)*inv;
  if(v<=1e-7||u+v>=1-1e-7)return false;
  const t=dot(e2,r)*inv;
  return t>1e-7&&t<1-1e-7;
 };
 const crossing=(a:number[],b:number[])=>{
  const va=a.map(i=>V[i]),vb=b.map(i=>V[i]);
  for(let j=0;j<3;j++)if(hit(va[j],va[(j+1)%3],vb[0],vb[1],vb[2]))return true;
  for(let j=0;j<3;j++)if(hit(vb[j],vb[(j+1)%3],va[0],va[1],va[2]))return true;
  return false;
 };
 for(let i=0;i<faces.length;i++)for(let j=i+1;j<faces.length;j++){
  const a=faces[i],b=faces[j];
  if(a.fi===b.fi||a.ids.some(id=>b.ids.includes(id)))continue;
  assert.ok(!crossing(a.ids,b.ids),'self-intersecting nonadjacent faces '+a.fi+' and '+b.fi);
 }
});

test('stage4 D is a symmetric depth-only calibration with protected anchors and unchanged connectivity',()=>{
 const c=load('stage4-c'),d=load('stage4-d');
 assert.deepEqual(d.faces,c.faces);
 assert.equal(d.vertices.length,62);
 const changed=[46,47,53,54,55,56];
 for(let i=0;i<c.vertices.length;i++){
  assert.deepEqual(d.vertices[i].slice(0,2),c.vertices[i].slice(0,2));
  if(!changed.includes(i))assert.deepEqual(d.vertices[i],c.vertices[i]);
  else assert.ok(d.vertices[i][2]>c.vertices[i][2]&&d.vertices[i][2]-c.vertices[i][2]<.18);
 }
 for(const [a,b] of [[46,54],[47,53],[55,56]])assert.equal(d.vertices[a][2],d.vertices[b][2]);
 const normal=(vs:number[][],face:number[])=>{
  const n=[0,0,0];
  for(let i=0;i<face.length;i++){const a=vs[face[i]],b=vs[face[(i+1)%face.length]];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1]);}
  return n;
 };
 for(const face of c.faces){
  const a=normal(c.vertices,face),b=normal(d.vertices,face);
  const ratio=Math.hypot(...b)/Math.hypot(...a);
  assert.ok(ratio>.8);
  assert.ok(a.reduce((s,x,i)=>s+x*b[i],0)/(Math.hypot(...a)*Math.hypot(...b))>Math.cos(20*Math.PI/180));
 }
 assert.ok(d.vertices[46][2]<d.vertices[38][2],'preserve intentional eye socket recession');
});


import * as T from 'three';
import {mirrorTrianglesX} from '../src/ui/mirrorTriangulation';
test('stage4 D actual Three.js earcut faces have fully mirrored render triangles after repair',()=>{
 const d=load('stage4-d');
 const source=d.faces.map(f=>{
  const n=new T.Vector3();const p=f.map(i=>new T.Vector3(...d.vertices[i] as [number,number,number]));
  p.forEach((a,i)=>n.add(a.clone().cross(p[(i+1)%p.length])));
  const a=Math.abs(n.x)>=Math.abs(n.y)&&Math.abs(n.x)>=Math.abs(n.z)?0:Math.abs(n.y)>=Math.abs(n.z)?1:2;
  return T.ShapeUtils.triangulateShape(p.map(v=>new T.Vector2(v.getComponent((a+1)%3),v.getComponent((a+2)%3))),[]).flatMap(t=>{
   const [x,y,z]=t.map(i=>p[i]);if(y.clone().sub(x).cross(z.clone().sub(x)).dot(n)<0)t.reverse();return t.map(i=>f[i]);
  });
 });
 const before=mirrorTrianglesX(d.vertices,d.faces,source,false);
 const after=mirrorTrianglesX(d.vertices,d.faces,source,true);
 assert.ok(before.report.unmatchedTriangles!>0);
 assert.equal(after.report.matchedVertices,62);
 assert.equal(after.report.pairedFaces,56);
 assert.equal(after.report.unmatchedTriangles,0);
 assert.deepEqual(after.report.unresolvedFaces,[]);
 assert.equal(after.indices.length,360);
 assert.equal(before.indices.length,after.indices.length);
 console.log('RENDER_MIRROR_AUDIT',JSON.stringify({before:before.report,after:after.report}));
});

test('stage4 E preserves the D cage and all anchors outside six nose vertices',()=>{
 const d=load('stage4-d'),e=load('stage4-e');
 assert.deepEqual(e.faces,d.faces);
 assert.equal(e.vertices.length,62);
 const changed=[55,56,57,58,60,61];
 for(let i=0;i<62;i++){
  if(!changed.includes(i))assert.deepEqual(e.vertices[i],d.vertices[i]);
  assert.equal(e.vertices[i][1],d.vertices[i][1]);
 }
 for(const [a,b] of [[55,56],[57,58],[60,61]])assert.deepEqual(e.vertices[a],[-e.vertices[b][0],e.vertices[b][1],e.vertices[b][2]]);
 const source=e.faces.map(f=>{
  const p=f.map(i=>new T.Vector3(...e.vertices[i] as [number,number,number]));
  const n=new T.Vector3();p.forEach((a,i)=>n.add(a.clone().cross(p[(i+1)%p.length])));
  const a=Math.abs(n.x)>=Math.abs(n.y)&&Math.abs(n.x)>=Math.abs(n.z)?0:Math.abs(n.y)>=Math.abs(n.z)?1:2;
  return T.ShapeUtils.triangulateShape(p.map(v=>new T.Vector2(v.getComponent((a+1)%3),v.getComponent((a+2)%3))),[]).flatMap(t=>{
   const [x,y,z]=t.map(i=>p[i]);if(y.clone().sub(x).cross(z.clone().sub(x)).dot(n)<0)t.reverse();return t.map(i=>f[i]);
  });
 });
 const result=mirrorTrianglesX(e.vertices,e.faces,source,true);
 assert.equal(result.report.unmatchedTriangles,0);
 assert.equal(result.indices.length,360);
});

test('stage4 F is the exact editor-exported two-edge collapse, closed and X-symmetric',()=>{
 const e=load('stage4-e'),f=load('stage4-f');
 assert.deepEqual(f.vertices,e.vertices.filter((_,i)=>i!==37&&i!==41));
 const map=(i:number)=>i===37?8:i===41?25:i-(i>37?1:0)-(i>41?1:0);
 assert.deepEqual(f.faces,e.faces.map(face=>{const a=face.map(map);return a.filter((v,j)=>v!==a[(j+a.length-1)%a.length]);}));
 assert.equal(f.vertices.length,60);assert.equal(f.faces.length,56);
 const edges=new Map<string,number>();
 for(const face of f.faces){assert.ok(face.length>=3&&new Set(face).size===face.length);
 for(let i=0;i<face.length;i++){const k=[face[i],face[(i+1)%face.length]].sort((a,b)=>a-b).join(':');edges.set(k,(edges.get(k)??0)+1)}}
 assert.equal(edges.size,114);assert.ok([...edges.values()].every(n=>n===2));
 assert.equal(f.vertices.length-edges.size+f.faces.length,2);
 assert.ok(f.vertices.every(v=>f.vertices.some(w=>close(v[0],-w[0])&&close(v[1],w[1])&&close(v[2],w[2]))));
 assert.equal(f.faces.reduce((n,face)=>n+face.length-2,0),116);
});

test('stage4 G restores two upper silhouette corners with local mirrored cuts; anchors protected',()=>{
 const f=load('stage4-f'),g=load('stage4-g');assert.equal(g.vertices.length,62);assert.equal(g.faces.length,60);
 for(let i=0;i<60;i++)if(![6,7,23,24,43].includes(i))assert.deepEqual(g.vertices[i],f.vertices[i]);
 assert.ok(g.vertices.every(v=>g.vertices.some(w=>close(v[0],-w[0])&&close(v[1],w[1])&&close(v[2],w[2]))));
 const edges=new Map<string,number>();const key=(face:number[])=>[...face].sort((a,b)=>a-b).join(':');
 const mirror=g.vertices.map(v=>g.vertices.findIndex(w=>close(v[0],-w[0])&&close(v[1],w[1])&&close(v[2],w[2])));
 const faceKeys=new Set(g.faces.map(key));for(const face of g.faces){assert.ok(face.length>=3&&new Set(face).size===face.length);assert.ok(faceKeys.has(key(face.map(i=>mirror[i]))));for(let j=0;j<face.length;j++){const k=[face[j],face[(j+1)%face.length]].sort((a,b)=>a-b).join(':');edges.set(k,(edges.get(k)??0)+1)}}
 assert.equal(edges.size,120);assert.ok([...edges.values()].every(n=>n===2));assert.equal(g.vertices.length-edges.size+g.faces.length,2);assert.equal(g.faces.reduce((n,face)=>n+face.length-2,0),120);
});

test('stage4 H keeps all G faces and protected anchors; bounded local deformation',()=>{
 const g=load('stage4-g'),h=load('stage4-h');
 assert.equal(h.vertices.length,62);assert.deepEqual(h.faces,g.faces);
 const changed=[38,41,44,52,45,51,53,54,55,56,58,59,43];
 for(let i=0;i<62;i++)if(!changed.includes(i))assert.deepEqual(h.vertices[i],g.vertices[i]);
 assert.ok(h.vertices.every(v=>h.vertices.some(w=>close(v[0],-w[0])&&close(v[1],w[1])&&close(v[2],w[2]))));
 const normal=(vs:number[][],f:number[])=>{const n=[0,0,0];for(let i=0;i<f.length;i++){const a=vs[f[i]],b=vs[f[(i+1)%f.length]];n[0]+=(a[1]-b[1])*(a[2]+b[2]);n[1]+=(a[2]-b[2])*(a[0]+b[0]);n[2]+=(a[0]-b[0])*(a[1]+b[1])}return n};
 for(const f of h.faces){const a=normal(g.vertices,f),b=normal(h.vertices,f),la=Math.hypot(...a),lb=Math.hypot(...b);assert.ok(lb/la>.9);assert.ok(a.reduce((s,n,i)=>s+n*b[i],0)/la/lb>Math.cos(11*Math.PI/180));}
});
