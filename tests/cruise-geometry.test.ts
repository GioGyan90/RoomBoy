import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {cylinder, palette} from '../src/assets/procedural/cruiseCabin/architecture';
import {furniture} from '../src/assets/procedural/cruiseCabin/furniture';
import {serviceRooms} from '../src/assets/procedural/cruiseCabin/serviceRooms';

test('default cylinders are upright, explicit x cylinders point sideways',()=>{
 const root=new T.Group();
 const upright=cylinder(root,'table',.5,.1,[0,1,0],palette.gold);
 const sideways=cylinder(root,'porthole',.5,.1,[0,1,0],palette.gold,'x');
 assert.ok(Math.abs(upright.rotation.x)<1e-8 && Math.abs(upright.rotation.z)<1e-8);
 assert.ok(Math.abs(sideways.rotation.z-Math.PI/2)<1e-8);
});
test('cruise table, toilet and washbasin have upright geometry',()=>{
 const root=new T.Group();furniture(root);serviceRooms(root);
 const names=['cocktail-table-marble','cocktail-table-pedestal','cocktail-table-foot','toilet-bowl','toilet-seat','washbasin','table-flower-vase'];
 for(const name of names){
  const obj=root.getObjectByName(name) as T.Mesh;
  assert.ok(obj,name+' missing');
  assert.ok(Math.abs(obj.rotation.x)<1e-8 && Math.abs(obj.rotation.z)<1e-8,name+' tilted');
 }
});
