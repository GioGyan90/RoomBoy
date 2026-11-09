import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {architecture} from '../src/assets/procedural/cruiseCabin/architecture';
import {furniture} from '../src/assets/procedural/cruiseCabin/furniture';
import {cruiseLayout} from '../src/assets/procedural/cruiseCabin/plan';

test('the entrance opens onto a free landing with routes to bathroom, bed and sea lounge',()=>{
 const scene=new T.Group();const nav=architecture(scene);furniture(scene);
 const entry=cruiseLayout.spawn;
 const targets=[
  {id:'entrance landing',x:-4.65,z:-1.78},
  {id:'main circulation lane',x:-3.02,z:-1.35},
  {id:'bathroom doorway',x:-2.09,z:2.85},
  {id:'bed approach',x:cruiseLayout.bed.stand.x,z:cruiseLayout.bed.stand.z},
  {id:'sea lounge',x:2.28,z:2.70},
 ];
 assert.ok(nav.canStand(entry),'entrance spawn overlaps wall or furniture');
 for(const target of targets){
  assert.ok(nav.canStand(target),'landing destination obstructed: '+target.id);
  const path=nav.findPath(entry,target);
  assert.ok(path && path.length,'no walking route from entry to '+target.id);
 }
});
test('bed is right of entrance corridor, shortened, with correct physics footprint',()=>{
 const root=new T.Group();const nav=architecture(root);furniture(root);root.updateMatrixWorld(true);
 const zone=root.getObjectByName('cruise-sleeping-zone') as T.Group;
 assert.ok(zone,'sleeping area must move as a single assembly');
 assert.ok(zone.position.x>.60,'bed not shifted towards window side');
 const bed=root.getObjectByName('king-bed-frame')!;
 const bounds=new T.Box3().setFromObject(bed);
 assert.ok(bounds.min.x>-1.72,'bed still intrudes into the central corridor');
 assert.ok(bounds.max.z<.25,'bed foot still blocks the foreground turning zone');
 const body=nav.bodies.find(b=>b.id==='king-bed');
 assert.ok(body,'collision body missing');
 assert.ok(Math.abs(body.x-(bounds.min.x+bounds.max.x)/2)<.1,'collision mesh not aligned with bed');
 assert.ok(Math.abs(body.z-(bounds.min.z+bounds.max.z)/2)<.1,'collision footprint out of sync');
});
