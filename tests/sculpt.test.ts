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
  const body=createBodyBlockout(stage),sides=stage==='blockout'?8:12;
  for(const [name,key] of parts){const positions=(body.getObjectByName(name) as T.Mesh).geometry.getAttribute('position');
   for(const [station,[y,l,r,front,back]] of constrainBands(key,fitJointTargets()).entries()){
    const xs:number[]=[],zs:number[]=[];
    for(let j=0;j<sides;j++){const i=station*sides+j;xs.push(positions.getX(i)/f.scale+f.frontAxis);zs.push(f.sideAxis-positions.getZ(i)/f.scale);assert.ok(Math.abs(f.ground-positions.getY(i)/f.scale-y)<.0001);}
    assert.ok(Math.abs(Math.min(...xs)-l)<.0001&&Math.abs(Math.max(...xs)-r)<.0001,`Front station drift in ${name}`);
    assert.ok(Math.abs(Math.min(...zs)-front)<.0001&&Math.abs(Math.max(...zs)-back)<.0001,`Side station drift in ${name}`);
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
 for(const stage of ['blockout','planes'] as const){const m=createBodyBlockout(stage);assert.ok(m.userData.fitReport.front.max<4.2);assert.ok(m.userData.fitReport.side.max<1.01);assert.ok(m.userData.fitReport.back.max<4.2);}
});
