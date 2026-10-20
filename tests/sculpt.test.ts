import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCharacter} from '../src/assets/procedural/character';
import {createRoom} from '../src/assets/procedural/room';
import {createAnimation} from '../src/game/animation';
import {createActions} from '../src/game/actions';
const gradient={addColorStop(){}};
const context=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get(target,key){return (target as Record<PropertyKey,unknown>)[key]??(()=>{});},set(){return true;}});
const status={innerHTML:''};
Object.assign(globalThis,{document:{createElement:()=>({width:0,height:0,getContext:()=>context}),getElementById:()=>status}});
function validate(root:T.Object3D){let vertices=0;root.updateMatrixWorld(true);root.traverse(o=>{
 if(o instanceof T.Mesh){const position=o.geometry.getAttribute('position');vertices+=position.count;for(const n of position.array)assert.ok(Number.isFinite(n),`Nonfinite vertex in ${o.name}`);assert.ok(o.matrixWorld.elements.every(Number.isFinite));}
});return vertices;}
test('sculpted room has finite geometry and every replaceable asset group',()=>{const room=createRoom();assert.deepEqual([...room.registry.keys()].sort(),['shell','window','outside','decor','bed','desk','chair','wardrobe','shelves','props'].sort());assert.ok(room.ceiling.parent);assert.ok(validate(room.root)>30000);});
test('adult rig remains finite throughout all six game interactions',()=>{
 const scene=new T.Scene();const character=createCharacter(scene);scene.add(character.charRoot);const animation=createAnimation(character);const actions=createActions(scene,character,animation);
 assert.equal(actions.ACTIONS.length,6);assert.ok(character.J.head);assert.ok(character.charMeshes.length>80);
 for(const action of actions.ACTIONS){actions.runAction(action);for(let i=0;i<500;i++){actions.updateRunner(.02);animation.updateAnimation(.02,i*.02);}validate(character.charRoot);}
 assert.ok(validate(character.charRoot)>20000);
});

test('structural cages stay closed, finite and proportionate at both densities',async()=>{
 const {createBodyBlockout,bodyPlan}=await import('../src/assets/procedural/bodyBlockout');
 const counts:number[]=[];
 for(const stage of ['blockout','planes'] as const){
  const body=createBodyBlockout(stage);validate(body);
  const box=new T.Box3().setFromObject(body);assert.ok(Math.abs(box.max.y-bodyPlan.height)<1e-6);assert.ok(Math.abs(box.min.y)<1e-6);
  assert.ok(body.getObjectByName('ribcage'));assert.ok(body.getObjectByName('pelvis'));
  body.traverse(o=>{if(!(o instanceof T.Mesh))return;const edges=new Map<string,number>(),idx=o.geometry.index!;
   for(let i=0;i<idx.count;i+=3){const face=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];for(let k=0;k<3;k++){const a=face[k],b=face[(k+1)%3],key=[Math.min(a,b),Math.max(a,b)].join(':');edges.set(key,(edges.get(key)??0)+1);}}
   assert.ok([...edges.values()].every(n=>n===2),`Open boundary in ${o.name}`);
  });
  counts.push(body.userData.triangles);assert.ok(body.userData.triangles<3000);
 }
 assert.ok(counts[1]>counts[0]);
});

test('measured front and side section stations drive both model densities',async()=>{
 const {createBodyBlockout}=await import('../src/assets/procedural/bodyBlockout');
 const {fitJointTargets,referenceFrame:f}=await import('../src/assets/procedural/bodyReference');
 const {constrainBands}=await import('../src/assets/procedural/bodyConstraints');
 const parts=[['ribcage','ribcage'],['right-forearm','rightForearm'],['left-forearm','leftForearm'],['right-shin','rightShin'],['left-shin','leftShin'],['head','head']] as const;
 for(const stage of ['blockout','planes'] as const){
  const body=createBodyBlockout(stage);
  for(const [name,key] of parts){const mesh=body.getObjectByName(name) as T.Mesh,positions=mesh.geometry.getAttribute('position'),sides=mesh.userData.radialSides;
   for(const [station,[y,l,r,front,back]] of constrainBands(key,fitJointTargets()).entries()){
    if(name==='ribcage'&&station===mesh.userData.bandCount-1)continue; // Existing vertices now follow the measured nonplanar neck boundary.
    const xs:number[]=[],zs:number[]=[];
    for(let j=0;j<sides;j++){const i=station*sides+j;xs.push(positions.getX(i)/f.scale+f.frontAxis);zs.push(f.sideAxis-positions.getZ(i)/f.scale);assert.ok(Math.abs(f.ground-positions.getY(i)/f.scale-y)<.0001);}
    assert.ok(Math.abs(Math.min(...xs)-l)<.0001&&Math.abs(Math.max(...xs)-r)<.0001,`Front station drift in ${name}`);
    assert.ok(Math.abs(Math.min(...zs)-front)<(name==='ribcage'?4:.0001)&&Math.abs(Math.max(...zs)-back)<.0001,`Side station drift in ${name}`);
   }
  }
 }
});


test('joint targets move real mesh end caps rather than only display markers',async()=>{
 const {createBodyBlockout}=await import('../src/assets/procedural/bodyBlockout');
 const {fitJointTargets,sourcePoint,referenceFrame:f}=await import('../src/assets/procedural/bodyReference');
 const targets=fitJointTargets(),before=createBodyBlockout('blockout',targets);
 const changed={...targets,rightWrist:[targets.rightWrist[0]+14,targets.rightWrist[1]-10,targets.rightWrist[2]-9] as const};
 const after=createBodyBlockout('blockout',changed),expected=sourcePoint(changed.rightWrist);
 const forearm=after.getObjectByName('right-forearm') as T.Mesh;
 const hand=after.getObjectByName('right-hand') as T.Mesh;
 for(const [part,top] of [[forearm,false],[hand,true]] as const){const p=part.geometry.getAttribute('position'),i=part.userData.bandCount*8+(top?1:0);const actual=[p.getX(i),p.getY(i),p.getZ(i)];
  actual.forEach((v,k)=>assert.ok(Math.abs(v-expected[k])<1e-6));
 }
 const delta=after.userData.landmarks.rightWrist.map((v:number,i:number)=>v-before.userData.landmarks.rightWrist[i]);
 [14*f.scale,10*f.scale,9*f.scale].forEach((v,i)=>assert.ok(Math.abs(delta[i]-v)<1e-6));
 assert.deepEqual(before.userData.landmarks.leftWrist,after.userData.landmarks.leftWrist);
 for(const stage of ['blockout','planes'] as const){const m=createBodyBlockout(stage);assert.ok(m.userData.fitReport.front.max<2.1);assert.ok(m.userData.fitReport.side.max<2.01);assert.ok(m.userData.fitReport.back.max<2.1);}
});


test('anatomical planes preserve paired chest/glute volumes, measured neck levels and instep profile',()=>{
 // Shape properties are measured on the final meshes, independently of their targets.
 return import('../src/assets/procedural/bodyBlockout').then(({createBodyBlockout})=>import('../src/assets/procedural/bodyReference').then(({referenceFrame:f})=>{
  const root=createBodyBlockout('blockout');
  function mesh(name:string){return root.getObjectByName(name) as T.Mesh;}
  function station(m:T.Mesh,sy:number){const p=m.geometry.getAttribute('position'),n=m.userData.radialSides;let best=0,error=Infinity;for(let r=0;r<m.userData.bandCount;r++){const e=Math.abs(f.ground-p.getY(r*n)/f.scale-sy);if(e<error){best=r;error=e;}}return best*n;}
  const chest=mesh('ribcage'),cp=chest.geometry.getAttribute('position'),ci=station(chest,244),cn=chest.userData.radialSides;
  assert.ok((cp.getZ(ci+1)+cp.getZ(ci+cn-1))/2-cp.getZ(ci)>.001,'Chest needs paired anterior planes around sternum');
  const pelvis=mesh('pelvis'),pp=pelvis.geometry.getAttribute('position'),pn=pelvis.userData.radialSides,pi=station(pelvis,463)+pn/2;
  assert.ok(pp.getZ(pi)-(pp.getZ(pi-1)+pp.getZ(pi+1))/2>.001,'Gluteal rear planes need bilateral volume');
  for(let r=0;r<pelvis.userData.bandCount-1;r++)for(let j=0;j<pn;j++)assert.ok(pp.getY((r+1)*pn+j)>pp.getY(r*pn+j),'Pelvis rings must not fold through the lower opening');
  const neck=mesh('neck'),np=neck.geometry.getAttribute('position'),nn=neck.userData.radialSides;
  assert.ok(np.getY(nn/2)>np.getY(0)+.04,'Reference rear neck boundary is higher than the anterior notch');
  const dome=mesh('hair-envelope'),hp=dome.geometry.getAttribute('position'),hn=dome.userData.radialSides,top=dome.userData.bandCount-1;
  const width=(r:number)=>hp.getX(r*hn+hn/4)-hp.getX(r*hn+3*hn/4);
  const t=(hp.getY((top-1)*hn)-hp.getY(top*hn))/(hp.getY((top-3)*hn)-hp.getY(top*hn));
  assert.ok(width(top-1)>((1-t)*width(top)+t*width(top-3))*1.2,'Skull dome should round over instead of a straight cone');
  const foot=mesh('right-foot'),fp=foot.geometry.getAttribute('position'),fn=foot.userData.radialSides,rows=foot.userData.bandCount;
  const slope=(a:number,b:number)=>Math.abs((fp.getY(b*fn)-fp.getY(a*fn))/(fp.getZ(b*fn)-fp.getZ(a*fn)));
  assert.ok(slope(rows-2,rows-1)>slope(2,3)*2,'Instep should steepen towards ankle');
 }));
});


test('shoulder caps taper into arms and hairline retains forehead, temple and nape steps',async()=>{
 const {createBodyBlockout}=await import('../src/assets/procedural/bodyBlockout');
 const root=createBodyBlockout('blockout');
 for(const side of ['right','left']){
  const m=root.getObjectByName(`${side}-deltoid`) as T.Mesh,p=m.geometry.getAttribute('position'),n=m.userData.radialSides;
  const width=(r:number)=>Math.abs(p.getX(r*n+n/4)-p.getX(r*n+3*n/4));
  assert.ok(width(0)<width(2)*.5,'Shoulder insertion must taper into upper arm');
 }
 const hair=root.getObjectByName('hair-envelope') as T.Mesh,p=hair.geometry.getAttribute('position'),n=hair.userData.radialSides;
 assert.ok(p.getY(0)>p.getY(3),'Temple edge should descend from frontal hairline');
 assert.ok(p.getY(4)>p.getY(3),'Ear clearance needs a separate turn');
 assert.ok(p.getY(0)-p.getY(n/2)>.07,'Rear rim must descend to nape');
 for(let j=1;j<n/2;j++){assert.ok(Math.abs(p.getY(j)-p.getY(n-j))<1e-6);assert.ok(Math.abs(p.getZ(j)-p.getZ(n-j))<1e-6);}
});



test('reference-driven vertex moves preserve topology and reduce observed point error',async()=>{
 const {createBodyBlockout}=await import('../src/assets/procedural/bodyBlockout');
 const {projectVertex}=await import('../src/assets/procedural/bodyVertexEdits');
 const before=createBodyBlockout('blockout',undefined,false),after=createBodyBlockout('blockout');
 let vertices=0;
 before.traverse(o=>{if(!(o instanceof T.Mesh))return;const m=after.getObjectByName(o.name) as T.Mesh;vertices+=m.geometry.getAttribute('position').count;assert.equal(m.geometry.getAttribute('position').count,o.geometry.getAttribute('position').count);assert.deepEqual(m.geometry.index!.array,o.geometry.index!.array);});
 assert.equal(after.userData.triangles,before.userData.triangles);assert.equal(after.userData.vertexEdits.addedVertices,0);
 const totals={before:0,after:0};let samples=0;
 for(const r of after.userData.vertexEdits.report){for(const view of ['front','side','back'] as const){const target=r.targets[view];if(!target)continue;const a=projectVertex(r.before,view),b=projectVertex(r.position,view);totals.before+=Math.hypot(a[0]-target[0],a[1]-target[1])**2;totals.after+=Math.hypot(b[0]-target[0],b[1]-target[1])**2;samples++;}}
 assert.ok(totals.after<totals.before*.15,'Observed corner error must improve without adding faces');
 assert.ok(Math.sqrt(totals.after/samples)<4,'Cross-view disagreement is retained rather than claimed as zero');
 assert.ok(vertices>0);
});
