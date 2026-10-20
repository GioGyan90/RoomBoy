import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createPelvisPart,detachLegacyPelvis} from '../src/assets/parts/pelvis';
import {pelvisPoints,pelvisFrame as f,pelvisReviewState} from '../src/assets/parts/pelvisReference';
test('isolated pelvis is a closed oriented outline cage with no added face vertices',()=>{
 const m=createPelvisPart(),p=m.geometry.getAttribute('position'),idx=m.geometry.index!,edges=new Map<string,{n:number;direction:number}>();assert.equal(p.count,24);assert.equal(idx.count/3,44);
 for(const x of p.array)assert.ok(Number.isFinite(x));
 for(let i=0;i<idx.count;i+=3){const face=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)],a=new T.Vector3().fromBufferAttribute(p,face[0]),b=new T.Vector3().fromBufferAttribute(p,face[1]),c=new T.Vector3().fromBufferAttribute(p,face[2]);assert.ok(b.sub(a).cross(c.sub(a)).lengthSq()>1e-13,'No collapsed triangle');for(let j=0;j<3;j++){const a=face[j],b=face[(j+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');const e=edges.get(key)??{n:0,direction:0};e.n++;e.direction+=a<b?1:-1;edges.set(key,e);}}
 for(const e of edges.values()){assert.equal(e.n,2);assert.equal(e.direction,0);}
 for(const [i,v] of pelvisPoints.entries()){assert.ok(Math.abs(p.getX(i)/f.scale-v.x)<1e-4);assert.ok(Math.abs(460-p.getY(i)/f.scale-v.y)<1e-4);assert.ok(Math.abs(f.sideAxis-p.getZ(i)/f.scale-v.sx)<1e-4);}
 assert.equal(m.userData.review.installed,false);
});
test('assembly review removes the legacy region without installing the candidate',async()=>{
 const {createBodyBlockout}=await import('../src/assets/procedural/bodyBlockout');const body=createBodyBlockout('blockout');const old=body.getObjectByName('pelvis') as T.Mesh,count=old.geometry.index!.count/3,total=body.userData.triangles;
 detachLegacyPelvis(body);assert.equal(body.getObjectByName('pelvis'),undefined);assert.equal(body.getObjectByName('pelvis-review-part'),undefined);assert.equal(body.userData.triangles,total-count);assert.equal(pelvisReviewState.status,'awaiting-user-review');assert.equal(body.userData.pelvisReview.installed,false);
});

test('every cage vertex lies on the silhouette and both geometry and triangulation mirror exactly',async()=>{
 const {pelvisProfile,pelvisMirrorIndex,pelvisMasks}=await import('../src/assets/parts/pelvisReference');
 const m=createPelvisPart(),p=m.geometry.getAttribute('position'),idx=m.geometry.index!,n=pelvisProfile.length;
 const triangles=new Set<string>();for(let i=0;i<idx.count;i+=3)triangles.add([idx.getX(i),idx.getX(i+1),idx.getX(i+2)].sort((a,b)=>a-b).join(','));
 const outline=pelvisMasks.front[0];
 function distance(x:number,y:number){let best=Infinity;for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));best=Math.min(best,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}return best;}
 const sideXs=Array.from({length:p.count},(_,i)=>f.sideAxis-p.getZ(i)/f.scale),left=Math.min(...sideXs),right=Math.max(...sideXs);
 for(let i=0;i<p.count;i++){
  const j=pelvisMirrorIndex[i%n]+(i>=n?n:0);assert.ok(Math.abs(p.getX(i)+p.getX(j))<1e-7);assert.equal(p.getY(i),p.getY(j));assert.equal(p.getZ(i),p.getZ(j));
  const sourceY=460-p.getY(i)/f.scale;
  assert.ok(distance(f.frontAxis+p.getX(i)/f.scale,sourceY)<1.5,'No vertex inside the front silhouette face');
  assert.ok(distance(f.frontAxis-p.getX(i)/f.scale,sourceY)<1.5,'No independent back vertex overhangs the common outline');
  assert.ok(Math.min(Math.abs(sideXs[i]-left),Math.abs(sideXs[i]-right))<1e-6,'All side projections lie on the placeholder outer edges');
  if(i<n){assert.equal(p.getX(i),p.getX(i+n));assert.equal(p.getY(i),p.getY(i+n));}
 }
 for(let i=0;i<idx.count;i+=3){const mirrored=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)].map(k=>pelvisMirrorIndex[k%n]+(k>=n?n:0)).sort((a,b)=>a-b).join(',');assert.ok(triangles.has(mirrored),'Diagonal split must have a mirrored partner');}
});
