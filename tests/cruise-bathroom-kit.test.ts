import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {architecture} from '../src/assets/procedural/cruiseCabin/architecture';
import {serviceRooms} from '../src/assets/procedural/cruiseCabin/serviceRooms';

const bounds=(root:T.Object3D,name:string)=>{
 const m=root.getObjectByName(name);
 assert.ok(m,name+' missing');
 return new T.Box3().setFromObject(m);
};

test('all six concept asset groups are independent and name-stable',()=>{
 const root=new T.Group();architecture(root);serviceRooms(root);
 const shell=root.getObjectByName('cruise-bathroom-shell')!;
 const kit=root.getObjectByName('cruise-marble-bathroom')!;
 assert.ok(shell&&kit);
 for(const name of ['bathroom-partitions','bathroom-sliding-door-assembly','bathroom-cutaway'])
  assert.ok(shell.getObjectByName(name),'missing architecture subassembly '+name);
 for(const name of ['bathroom-finish-materials','bathroom-soaking-tub','bathroom-wall-plumbing',
  'bathroom-vanity','bathroom-toilet'])
  assert.ok(kit.getObjectByName(name),'missing fixture assembly '+name);
 const tub=kit.getObjectByName('bathroom-soaking-tub')!;
 assert.ok(tub.getObjectByName('tub-body')&&tub.getObjectByName('tub-rim')&&tub.getObjectByName('tub-drain'));
 const vanity=kit.getObjectByName('bathroom-vanity')!;
 assert.ok(vanity.getObjectByName('bath-mirror-and-light-assembly'));
 assert.ok(vanity.getObjectByName('vanity-recessed-sink-assembly'));
});
test('oval tub has contoured inner/outer ceramic shell and real recessed drain',()=>{
 const root=new T.Group();serviceRooms(root);root.updateMatrixWorld(true);
 const tub=root.getObjectByName('tub-body') as T.Mesh;
 assert.ok(tub.geometry instanceof T.LatheGeometry,'tub should have real continuous ceramic curvature');
 const base=bounds(root,'tub-plinth'),wall=bounds(root,'tub-body'),
  rim=bounds(root,'tub-rim'),water=bounds(root,'tub-water'),
  drain=bounds(root,'tub-drain');
 assert.ok(base.min.y<.075,'bath plinth should reach the floor');
 assert.ok(base.intersectsBox(wall),'bath ceramic must connect to its support');
 assert.ok(drain.max.y<water.min.y,'drain belongs inside bathtub beneath the water');
 assert.ok(water.max.y<rim.min.y,'water must not cover the rim');
 assert.ok(wall.max.y>=rim.min.y-.01);
});
test('sculpted toilet is grounded and connected to bowl, seat and tank',()=>{
 const root=new T.Group();serviceRooms(root);root.updateMatrixWorld(true);
 const base=root.getObjectByName('toilet-pedestal') as T.Mesh;
 const bowl=root.getObjectByName('toilet-bowl') as T.Mesh;
 assert.ok(base.geometry instanceof T.LatheGeometry);
 assert.ok(bowl.geometry instanceof T.LatheGeometry);
 assert.ok(bounds(root,'toilet-pedestal').intersectsBox(bounds(root,'toilet-bowl')));
 assert.ok(bounds(root,'toilet-bowl').intersectsBox(bounds(root,'toilet-seat')));
 assert.ok(bounds(root,'toilet-cistern-support').intersectsBox(bounds(root,'toilet-cistern')));
});
test('round mirror is nested against the marble wall, not floating in bathroom',()=>{
 const root=new T.Group();serviceRooms(root);root.updateMatrixWorld(true);
 const mirror=root.getObjectByName('mirror') as T.Mesh;
 const halo=root.getObjectByName('mirror-halo') as T.Mesh;
 assert.ok(mirror.geometry instanceof T.ExtrudeGeometry);
 assert.ok(halo.geometry instanceof T.ExtrudeGeometry);
 const panel=bounds(root,'bath-back-marble-panel');
 const back=bounds(root,'mirror-halo'),glass=bounds(root,'mirror');
 assert.ok(back.min.z>panel.min.z-.005,'mirror backing is buried in wall');
 assert.ok(back.min.z<panel.max.z+.05,'mirror backing is detached from wall');
 assert.ok(glass.min.z>back.min.z,'glass must be in front of backing');
});
