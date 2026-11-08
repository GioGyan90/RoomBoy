import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {cylinder, palette, architecture} from '../src/assets/procedural/cruiseCabin/architecture';
import {minibar} from '../src/assets/procedural/cruiseCabin/minibar';
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

test('bathroom cladding, mirror and sconces face into the bathroom',()=>{
 const root=new T.Group();serviceRooms(root);
 const wall=root.getObjectByName('bath-back-marble-panel') as T.Mesh;
 const mirror=root.getObjectByName('mirror') as T.Mesh;
 const light=root.getObjectByName('vanity-wall-light') as T.Mesh;
 assert.ok(wall.position.z>.74,'marble panel must sit in front of bath partition');
 assert.ok(mirror.position.z>wall.position.z+.03,'mirror must not be buried in wall');
 assert.ok(light.position.z>mirror.position.z,'wall light must face room');
});
test('bathroom bathtub is open and has a visible recessed water surface',()=>{
 const root=new T.Group();serviceRooms(root);
 assert.equal(root.getObjectByName('tub-shell'),undefined,'solid bathtub must not return');
 const water=root.getObjectByName('tub-water') as T.Mesh;
 const rim=root.getObjectByName('tub-rim') as T.Mesh;
 assert.ok(water&&rim);
 assert.ok(water.position.y<rim.position.y,'water must be below tub rim');
});

test('both bedside cabinets and their marble tops clear bed frame and headboard',()=>{
 const root=new T.Group();furniture(root);root.updateMatrixWorld(true);
 const meshes:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o)});
 const beds=meshes.filter(m=>['king-bed-frame','headboard-wood-frame'].includes(m.name));
 const stands=meshes.filter(m=>['walnut-nightstand','nightstand-marble-top'].includes(m.name));
 assert.equal(stands.length,4);
 for(const stand of stands)for(const bed of beds){
  const a=new T.Box3().setFromObject(stand),b=new T.Box3().setFromObject(bed);
  assert.ok(!a.intersectsBox(b),stand.name+' overlaps '+bed.name+' at '+stand.position.x);
 }
});
test('minibar and nightstands do not intersect',()=>{
 const root=new T.Group();furniture(root);minibar(root);root.updateMatrixWorld(true);
 const meshes:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o)});
 const bar=meshes.find(m=>m.name==='minibar-cabinet')!;
 assert.ok(bar,'minibar is included as independent station');
 for(const stand of meshes.filter(m=>m.name==='walnut-nightstand'||m.name==='nightstand-marble-top')){
  assert.ok(!new T.Box3().setFromObject(bar).intersectsBox(new T.Box3().setFromObject(stand)),stand.name+' intersects minibar');
 }
});

test('balcony door aperture is clear of the rear bulkhead',()=>{
 const root=new T.Group();architecture(root);root.updateMatrixWorld(true);
 const left=root.getObjectByName('rear-bulkhead-left')!;
 const right=root.getObjectByName('rear-bulkhead-right')!;
 const glass=root.getObjectByName('ocean-window')!;
 const wallLeft=new T.Box3().setFromObject(left);
 const wallRight=new T.Box3().setFromObject(right);
 const glassBox=new T.Box3().setFromObject(glass);
 assert.ok(wallLeft.max.x<glassBox.min.x,'solid wall blocks the left edge of the balcony glass');
 assert.ok(wallRight.min.x>glassBox.max.x,'solid wall blocks the right edge of the balcony glass');
 assert.ok(wallLeft.max.x<wallRight.min.x,'balcony is fully closed off');
});
test('wall-facing service bar clears wall, bed, wardrobe and balcony doors',()=>{
 const root=new T.Group();architecture(root);furniture(root);minibar(root);root.updateMatrixWorld(true);
 const bar=root.getObjectByName('minibar-cabinet')!;
 const mirror=root.getObjectByName('minibar-back-mirror')!;
 const other=['left-bulkhead','king-bed-frame','full-height-wardrobe','ocean-window'];
 for(const item of other){
  const mesh=root.getObjectByName(item)!;
  assert.ok(!new T.Box3().setFromObject(bar).intersectsBox(new T.Box3().setFromObject(mesh)),'bar overlaps '+item);
  assert.ok(!new T.Box3().setFromObject(mirror).intersectsBox(new T.Box3().setFromObject(mesh)),'bar mirror overlaps '+item);
 }
 assert.ok(Math.abs(bar.getWorldDirection(new T.Vector3()).x)>.99,'service bar must face into the room');
});
