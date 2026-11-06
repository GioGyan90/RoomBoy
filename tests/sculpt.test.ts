import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createCharacter} from '../src/assets/procedural/character';
import {createRoom} from '../src/assets/procedural/room';
import {createRoomV4} from '../src/assets/procedural/roomV4/entities';
import {createBlueApartment} from '../src/assets/procedural/blueApartment';
import {createGardenLoft} from '../src/assets/procedural/gardenLoft';
import {loftLayout,plan as loftPlan,stair} from '../src/assets/procedural/gardenLoft/plan';
import {apartmentLayout,plan as apartmentPlan} from '../src/assets/procedural/blueApartment/plan';
import {createHotelSuite} from '../src/assets/procedural/hotelSuite';
import {hotelLayout,plan as hotelPlan,tub as hotelTub} from '../src/assets/procedural/hotelSuite/plan';
import {createRoomNavigation} from '../src/assets/procedural/roomV4/colliders';
import {DOOR_HEIGHT,GAME_LAYOUT,ROOM,ROOM_SCALE} from '../src/assets/procedural/roomV4/definitions';
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
test('room v4 keeps the asset slots and places the action anchors on its furniture',()=>{
 const {root,registry,refs}=createRoomV4();
 assert.deepEqual([...registry.keys()].sort(),['shell','window','outside','decor','bed','desk','chair','wardrobe','shelves','props'].sort());
 assert.ok(validate(root)>0);
 const bed=new T.Box3().setFromObject(registry.get('bed')!);
 for(const anchor of [GAME_LAYOUT.bed.sit,GAME_LAYOUT.bed.lie]){
  assert.ok(bed.containsPoint(new T.Vector3(anchor.x,anchor.bodyY,anchor.z)));
 }
 const chair=new T.Box3().setFromObject(registry.get('chair')!);
 const {x,z,bodyY}=GAME_LAYOUT.desk.sit;
 assert.ok(chair.containsPoint(new T.Vector3(x,bodyY,z)));
 assert.ok(refs.monitorScreen.getWorldPosition(new T.Vector3()).z<z);
 const monitor=new T.Box3().setFromObject(root.getObjectByName('crt-monitor')!);
 const window=new T.Box3().setFromObject(registry.get('window')!);
 assert.ok(monitor.min.z-window.max.z>.08);
 assert.ok(DOOR_HEIGHT*ROOM_SCALE>1.89&&DOOR_HEIGHT*ROOM_SCALE<2);
 assert.equal(ROOM.bath.doorH,DOOR_HEIGHT);
});
test('blue apartment routes around the cutaway walls and uses its own furniture anchors',()=>{
 const {root,navigation}=createBlueApartment();
 const {spawn,desk,bed,toilet}=apartmentLayout;
 assert.ok(validate(root)>0);
 assert.ok(!root.getObjectByName('bedroom-door'));
 assert.ok(navigation.canStand({x:-.77,z:1.45}));
 for(const point of [desk.stand,bed.stand,toilet.stand,{x:1.94,z:1.1},{x:1.66,z:-2.29},{x:-.54,z:3.72}]){
  const route=navigation.findPath(spawn,point);
  assert.ok(route,`No route to ${point.x}, ${point.z}`);
  let previous=spawn;
  for(const next of route){assert.ok(navigation.canTraverse(previous,next));previous={x:next.x,z:next.z,rot:0};}
 }
 assert.ok(!navigation.canTraverse(spawn,toilet.stand));
 assert.ok(!navigation.canStand({x:-3.5,z:apartmentPlan.back+.4}));
 assert.ok(!navigation.canStand({x:2.55,z:apartmentPlan.kitchenBack}));
 assert.ok(!navigation.canStand({x:2.55,z:apartmentPlan.entryFront-.35}));

 const scene=new T.Scene(),character=createCharacter(scene),animation=createAnimation(character);
 const actions=createActions(scene,character,animation,navigation,apartmentLayout,false);
 scene.add(character.charRoot);
 character.charRoot.position.set(spawn.x,0,spawn.z);
 assert.ok(!actions.ACTIONS.some(action=>action.id==='computer'));
 for(const [id,anchor] of [['sitChair',desk.sit],['sitBed',bed.sit],['nap',bed.lie],['sitToilet',toilet.sit]] as const){
  actions.runAction(actions.ACTIONS.find(action=>action.id===id)!);
  for(let i=0;i<600;i++){actions.updateRunner(.02);animation.updateAnimation(.02,0);}
  assert.ok(character.charRoot.position.distanceTo(new T.Vector3(anchor.x,0,anchor.z))<.001);
  assert.ok(Math.abs(character.body.position.y-anchor.bodyY)<.001);
 }
});
test('the loft routes between floors only through the staircase and keeps the cutaway edges solid', () => {
 const {root,navigation}=createGardenLoft();
 assert.ok(validate(root)>0);
 assert.ok(root.getObjectByName('double-height-window'));
 assert.ok(root.getObjectByName('loft-tread-13'));
 const {spawn,bed,desk,toilet}=loftLayout;
 const stairX=(stair.left+stair.right)/2;
 const steps=navigation.findPath(spawn,bed.stand);
 assert.ok(steps);
 assert.ok(steps.some(p=>Math.abs(p.x-stairX)<1e-6&&p.z===stair.bottom&&p.y===0));
 assert.ok(steps.some(p=>Math.abs(p.x-stairX)<1e-6&&p.z===stair.top&&p.y===loftPlan.deckY));
 assert.ok(!navigation.canTraverse(spawn,bed.stand));
 assert.ok(!navigation.canStand({x:stairX,z:(stair.top+stair.bottom)/2}));
 assert.ok(!navigation.canStand({x:bed.stand.x,y:loftPlan.deckY,z:loftPlan.deckFront+.10}));
 assert.ok(!navigation.canStand({x:1,y:0,z:loftPlan.front+.18}));

 for(const destination of [desk.stand,toilet.stand,{x:4.07,y:.035,z:1.31},{x:4.04,z:4.57},{x:-3.64,z:5.27}]){
  const route=navigation.findPath(bed.stand,destination);
  assert.ok(route,`No route down to ${destination.x}, ${destination.z}`);
  let previous=new T.Vector3(bed.stand.x,loftPlan.deckY,bed.stand.z);
  for(const point of route){
   assert.ok(navigation.canTraverse(previous,point));
   previous=point;
  }
  assert.equal(previous.y,0);
 }
 const tread=new T.Vector3(stairX,loftPlan.deckY*7/stair.steps,(stair.top+stair.bottom)/2);
 const stairRoute=navigation.findPath(spawn,tread);
 assert.ok(stairRoute);
 const normalized=stairRoute.at(-1)!;
 assert.ok(Math.abs(normalized.y-loftPlan.deckY/2)<1e-6);
 assert.ok(navigation.findPath(normalized,bed.stand));
 assert.ok(navigation.findPath(normalized,desk.stand));
});

test('loft seating preserves the mezzanine height while sitting, napping and returning downstairs', () => {
 const {navigation}=createGardenLoft();
 const {spawn,desk,bed,toilet}=loftLayout;
 const scene=new T.Scene(),character=createCharacter(scene),animation=createAnimation(character);
 scene.add(character.charRoot);
 character.charRoot.position.set(spawn.x,0,spawn.z);
 const actions=createActions(scene,character,animation,navigation,loftLayout,false);
 for(const [id,anchor] of [['sitChair',desk.sit],['sitBed',bed.sit],['nap',bed.lie],['sitToilet',toilet.sit]] as const){
  actions.runAction(actions.ACTIONS.find(action=>action.id===id)!);
  for(let i=0;i<1200;i++){
   actions.updateRunner(.02);
   animation.updateAnimation(.02,0);
   if(animation.st.mode==='walk')assert.ok(navigation.canStand(character.charRoot.position));
  }
  assert.ok(character.charRoot.position.distanceTo(new T.Vector3(anchor.x,anchor.y??0,anchor.z))<.001,id);
  assert.ok(Math.abs(character.body.position.y-anchor.bodyY)<.001,id);
 }
});

test('hotel bathtub is open and its bathroom route crosses the actual doorway', () => {
 const {root,navigation}=createHotelSuite();
 assert.ok(validate(root)>0);
 const shell=root.getObjectByName('hotel-hollow-tub-shell')!;
 const bowlRay=new T.Raycaster(new T.Vector3(hotelTub.x+.033,2,hotelTub.z+.045),new T.Vector3(0,-1,0));
 const bowl=bowlRay.intersectObject(shell)[0];
 assert.ok(bowl&&bowl.point.y>.09&&bowl.point.y<.19);
 assert.ok(new T.Box3().setFromObject(shell).max.y>.64);
 assert.ok(!navigation.canStand(hotelTub));
 assert.ok(!navigation.canStand({x:hotelPlan.bathLeft+.20,z:hotelPlan.bathBack-.55}));
 const {spawn,bed,desk,toilet}=hotelLayout;
 const points=[bed.stand,desk.stand,toilet.stand,{x:hotelPlan.entryLeft+1.835,z:5.235},{x:2.05,z:1.28}];
 for(const to of points){
  const route=navigation.findPath(spawn,to);
  assert.ok(route,`No hotel route to ${to.x}, ${to.z}`);
  let previous:{x:number;z:number}=spawn;
  for(const next of route){
   assert.ok(navigation.canTraverse(previous,next));
   if(to===toilet.stand&&previous.x>hotelPlan.bathRight&&next.x<hotelPlan.bathRight){
    const at=(hotelPlan.bathRight-previous.x)/(next.x-previous.x);
    const z=T.MathUtils.lerp(previous.z,next.z,at);
    assert.ok(z>hotelPlan.bathDoor[0]&&z<hotelPlan.bathDoor[1]);
   }
   previous=next;
  }
 }
 assert.ok(!navigation.canTraverse(bed.stand,toilet.stand));
 assert.ok(!navigation.canTraverse({x:-.76,z:-1.06},{x:.37,z:-1.06}));
});

test('the fourth room supports existing seating actions and closes both curtain panels', () => {
 const {root,navigation,effects}=createHotelSuite();
 const {spawn,desk,bed,toilet}=hotelLayout;
 const scene=new T.Scene(),character=createCharacter(scene),animation=createAnimation(character);
 scene.add(character.charRoot);
 character.charRoot.position.set(spawn.x,0,spawn.z);
 const actions=createActions(scene,character,animation,navigation,hotelLayout,false);
 for(const [id,anchor] of [['sitChair',desk.sit],['sitBed',bed.sit],['nap',bed.lie],['sitToilet',toilet.sit]] as const){
  actions.runAction(actions.ACTIONS.find(action=>action.id===id)!);
  for(let i=0;i<840;i++){
   actions.updateRunner(.02);
   animation.updateAnimation(.02,0);
  }
  assert.ok(character.charRoot.position.distanceTo(new T.Vector3(anchor.x,0,anchor.z))<.001,id);
  assert.ok(Math.abs(character.body.position.y-anchor.bodyY)<.001,id);
 }
 effects.toggle('curtains');
 for(let i=0;i<140;i++)effects.update(.02,0);
 for(const curtain of root.getObjectsByProperty('name','hotel-burgundy-curtain')){
  const cloth=curtain.children.find((o):o is T.Mesh=>o instanceof T.Mesh&&!!o.morphTargetInfluences);
  assert.ok(cloth&&cloth.morphTargetInfluences![0]>.99);
  assert.equal(curtain.getObjectByName('braided-gold-tieback')!.visible,false);
 }
});

test('bed pillow rests on the sheet clear of the headboard and folded blanket',()=>{
 const {root}=createRoomV4();
 root.updateMatrixWorld(true);
 const bounds=(name:string)=>new T.Box3().setFromObject(root.getObjectByName(name)!);
 const pillow=bounds('bed-pillow');
 const sheet=bounds('bed-sheet');
 const fold=bounds('bed-fold');
 assert.ok(Math.abs(pillow.min.y-sheet.max.y)<1e-6);
 assert.ok(pillow.min.z>sheet.min.z&&pillow.max.z<sheet.max.z);
 assert.ok(pillow.min.x-bounds('bed-headboard').max.x>.015);
 assert.ok(fold.min.x-pillow.max.x>.025);
 assert.ok(fold.max.x-bounds('bed-blanket').min.x<1e-6);
});
test('entry garments and shoes have cut faces and window dust has varied motion',()=>{
 const {root,refs}=createRoomV4();
 for(const name of ['carved-jacket','carved-shoe-upper']){
  const mesh=root.getObjectByName(name) as T.Mesh;
  assert.ok(mesh.geometry.groups.some(group=>group.materialIndex===1&&group.count>0));
  assert.ok(validate(mesh)>0);
 }
 const geometry=refs.dust.points.geometry;
 const sizes=geometry.getAttribute('moteSize').array;
 assert.ok(Math.max(...sizes)>4*Math.min(...sizes));
 const velocity=geometry.getAttribute('moteAmplitude').array;
 assert.ok(velocity.some(value=>value<0)&&velocity.some(value=>value>0));
 assert.ok(new Set(geometry.getAttribute('moteFrequency').array).size>30);
});
test('Haru has one closed skinned surface with fitted garment openings',()=>{
 const character=createCharacter(new T.Scene());
 assert.equal(character.charMeshes.length,1);
 const skin=character.charMeshes[0];
 assert.ok(skin instanceof T.SkinnedMesh);
 assert.ok(character.J.head instanceof T.Bone);
 const {geometry}=skin;
 const index=geometry.index!;
 const position=geometry.getAttribute('position');
 const weights=geometry.getAttribute('skinWeight');
 const edges=new Map<string,[number,number]>();
 const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();
 for(let i=0;i<index.count;i+=3){
  const [u,v,w]=[index.getX(i),index.getX(i+1),index.getX(i+2)];
  a.fromBufferAttribute(position,u);
  b.fromBufferAttribute(position,v).sub(a);
  c.fromBufferAttribute(position,w).sub(a);
  assert.ok(b.cross(c).lengthSq()>1e-12);
  for(const [from,to] of [[u,v],[v,w],[w,u]]){
   const key=from<to?`${from}:${to}`:`${to}:${from}`;
   const [count,direction]=edges.get(key)??[0,0];
   edges.set(key,[count+1,direction+(from<to?1:-1)]);
  }
 }
 assert.ok([...edges.values()].every(([count,direction])=>count===2&&direction===0));
 assert.deepEqual(geometry.groups.map(group=>group.materialIndex),[0,1,2,3]);
 for(let i=0;i<weights.count;i++){
  assert.ok(Math.abs(weights.getX(i)+weights.getY(i)-1)<1e-6);
 }
});
test('skinned rig remains finite throughout all seven game interactions',()=>{
 const scene=new T.Scene();const character=createCharacter(scene);scene.add(character.charRoot);
 const {spawn}=GAME_LAYOUT;character.charRoot.position.set(spawn.x,0,spawn.z);
 const navigation=createRoomNavigation(createRoomV4());
 const animation=createAnimation(character);const actions=createActions(scene,character,animation,navigation);
 assert.equal(actions.ACTIONS.length,7);
 assert.equal(actions.ACTIONS.find(action=>action.id==='sitToilet')?.icon,'🚽');
 assert.ok(!actions.ACTIONS.some(action=>action.id==='lie'));
 const skin=character.charMeshes[0];
 character.charRoot.updateMatrixWorld(true);
 const index=skin.geometry.getAttribute('position').count-20;
 const rest=skin.getVertexPosition(index,new T.Vector3());
 const {desk,bed,toilet}=GAME_LAYOUT;
 const anchors:Record<string,{x:number;z:number;bodyY:number}>={computer:desk.sit,sitChair:desk.sit,nap:bed.lie,sitBed:bed.sit,sitToilet:toilet.sit};
 for(const action of actions.ACTIONS){
  actions.runAction(action);
  for(let i=0;i<500;i++){actions.updateRunner(.02);animation.updateAnimation(.02,i*.02);}
  validate(character.charRoot);
  const deformed=skin.getVertexPosition(index,new T.Vector3());
  assert.ok(deformed.toArray().every(Number.isFinite));
  if(action.id==='computer'){
   assert.ok(deformed.distanceTo(rest)>.05);
   assert.ok(new T.Box3().setFromObject(skin,true).min.y>-.018);
  }
  if(action.id==='sitToilet'){
   assert.equal(animation.st.seating?.kind,'toilet');
   const floorClearance=new T.Box3().setFromObject(skin,true).min.y;
   assert.ok(floorClearance>.005&&floorClearance<.025);
  }
  const anchor=anchors[action.id];
  if(anchor){
   assert.ok(character.charRoot.position.distanceTo(new T.Vector3(anchor.x,0,anchor.z))<.001);
   assert.ok(Math.abs(character.body.position.y-anchor.bodyY)<.001);
  }
 }
 assert.ok(validate(character.charRoot)>0);
});

test('walking sweeps against walls and furniture, routing through the actual bathroom doorway',()=>{
 const navigation=createRoomNavigation(createRoomV4());
 const from=new T.Vector3(GAME_LAYOUT.spawn.x,0,GAME_LAYOUT.spawn.z);
 const {stand,sit}=GAME_LAYOUT.toilet;
 const bathroom=new T.Vector3(stand.x,0,stand.z);
 assert.equal(navigation.canTraverse(from,bathroom),false);
 const route=navigation.findPath(from,bathroom);
 assert.ok(route&&route.length>1);
 let previous=from;
 for(const point of route){
  assert.ok(navigation.canTraverse(previous,point));
  if(previous.x<ROOM.bath.x0*ROOM_SCALE&&point.x>ROOM.bath.x0*ROOM_SCALE){
   assert.ok(point.z>ROOM.bath.doorZ0*ROOM_SCALE&&point.z<ROOM.bath.doorZ1*ROOM_SCALE);
  }
  previous=point;
 }
 assert.ok(navigation.canTraverse(stand,sit,'toilet'));
 for(const point of [GAME_LAYOUT.desk.sit,GAME_LAYOUT.bed.sit,sit,{x:-3,z:1}]){
  assert.equal(navigation.findPath(from,point),null);
 }
});

test('seating can be redirected mid-clip and walking resumes from the correct exit',()=>{
 const scene=new T.Scene(),character=createCharacter(scene);
 const navigation=createRoomNavigation(createRoomV4());
 const animation=createAnimation(character);
 const actions=createActions(scene,character,animation,navigation);
 scene.add(character.charRoot);
 character.charRoot.position.set(GAME_LAYOUT.spawn.x,0,GAME_LAYOUT.spawn.z);
 const tick=(dt:number)=>{
  actions.updateRunner(dt);
  animation.updateAnimation(dt,0);
  if(animation.st.mode==='walk')assert.ok(navigation.canStand(character.charRoot.position));
  if(animation.st.seating){
   character.charRoot.updateMatrixWorld(true);
   assert.ok(new T.Box3().setFromObject(character.charMeshes[0],true).min.y>-1e-5);
  }
 };
 actions.sitAt('chair');
 for(let i=0;i<400&&(animation.st.seating?.time??0)<.5;i++)tick(.02);
 assert.equal(animation.st.seating?.kind,'chair');
 assert.ok(animation.st.seating!.time<1.3);
 actions.sitAt('bed');
 for(let i=0;i<500;i++)tick(.02);
 assert.equal(animation.st.posture,'sitBed');
 const target=new T.Vector3(1.81,0,1.91);
 actions.walkTo(target);
 for(let i=0;i<125;i++)tick(.1);
 assert.equal(animation.st.posture,'stand');
 assert.ok(character.charRoot.position.distanceTo(target)<.001);
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
