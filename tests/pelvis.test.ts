import {test} from 'node:test';import assert from 'node:assert/strict';import * as T from 'three';
import {createPelvisPart,detachLegacyPelvis} from '../src/assets/parts/pelvis';
import {pelvisPoints,pelvisFrame as f,pelvisReviewState} from '../src/assets/parts/pelvisReference';
test('isolated pelvis is a small closed oriented primitive with explicit source corners',()=>{
 const m=createPelvisPart(),p=m.geometry.getAttribute('position'),idx=m.geometry.index!,edges=new Map<string,{n:number;direction:number}>();assert.equal(p.count,30);assert.equal(idx.count/3,56);
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
