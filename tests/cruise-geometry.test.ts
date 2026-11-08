import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {cylinder, palette, architecture} from '../src/assets/procedural/cruiseCabin/architecture';
import {minibar} from '../src/assets/procedural/cruiseCabin/minibar';
import {referenceArchitecture} from '../src/assets/procedural/cruiseCabin/referenceArchitecture';
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

test('large side windows fit inside real hull openings without a wall behind their glass',()=>{
 const root=new T.Group();architecture(root);referenceArchitecture(root);root.updateMatrixWorld(true);
 const frame=root.getObjectByName('side-window-brass-frame')!;
 const sea=root.getObjectByName('side-window-sea')!;
 const sill=root.getObjectByName('right-window-sill')!;
 const lintel=root.getObjectByName('right-window-lintel')!;
 const balcony=root.getObjectByName('side-balcony-sea')!;
 const balconySill=root.getObjectByName('right-balcony-sill')!;
 const balconyLintel=root.getObjectByName('right-balcony-lintel')!;
 const box=(o:T.Object3D)=>new T.Box3().setFromObject(o);
 assert.ok(box(sea).min.y>box(sill).max.y+.1,'side glazing sinks into hull sill');
 assert.ok(box(sea).max.y<box(lintel).min.y-.05,'side glazing reaches hull header');
 assert.ok(box(balcony).min.y>box(balconySill).max.y,'balcony glazing intersects threshold');
 assert.ok(box(balcony).max.y<box(balconyLintel).min.y,'balcony glazing intersects header');
 assert.ok(box(frame).min.z<-.5&&box(frame).max.z<0,'main side window is misplaced');
 assert.ok(!root.getObjectByName('right-hull'),'full solid hull must not cover windows');
});
test('concept layout closes the rear wall and keeps ocean access on the side',()=>{
 const root=new T.Group();architecture(root);
 const left=root.getObjectByName('rear-bulkhead-left')!;
 const right=root.getObjectByName('rear-bulkhead-right')!;
 const l=new T.Box3().setFromObject(left);
 const r=new T.Box3().setFromObject(right);
 assert.ok(Math.abs(l.max.x-r.min.x)<.015,'rear wall should be continuous');
 assert.ok(!root.getObjectByName('ocean-window'),'obsolete rear ocean window must not remain');
});
test('room-facing service bar clears wall, bed, wardrobe and balcony doors',()=>{
 const root=new T.Group();architecture(root);furniture(root);minibar(root);root.updateMatrixWorld(true);
 const bar=root.getObjectByName('minibar-cabinet')!;
 const mirror=root.getObjectByName('minibar-back-mirror')!;
 const other=['left-bulkhead','king-bed-frame','full-height-wardrobe','rear-wood-panel'];
 for(const item of other){
  const mesh=root.getObjectByName(item)!;
  assert.ok(!new T.Box3().setFromObject(bar).intersectsBox(new T.Box3().setFromObject(mesh)),'bar overlaps '+item);
  assert.ok(!new T.Box3().setFromObject(mirror).intersectsBox(new T.Box3().setFromObject(mesh)),'bar mirror overlaps '+item);
 }
 assert.ok(bar.getWorldDirection(new T.Vector3()).z>.99,'service bar must face the bedroom along +Z');
});

test('unrelated primary furniture modules have no three-dimensional intersections',()=>{
 const root=new T.Group();architecture(root);furniture(root);serviceRooms(root);minibar(root);
 root.updateMatrixWorld(true);
 const groups:[string,string][]=[
  ['king-bed-frame','minibar-cabinet'],
  ['minibar-cabinet','full-height-wardrobe'],
  ['minibar-cabinet','bath-rear-wall'],
  ['sofa-seat-frame','cocktail-table-marble'],
  ['sofa-seat-frame','cocktail-table-pedestal'],
  ['cocktail-table-foot','sofa-seat-frame'],
  ['vanity-cabinet','toilet-bowl'],
  ['vanity-cabinet','tub-plinth'],
  ['tub-plinth','toilet-bowl'],
 ];
 for(const [first,second] of groups){
  const a=root.getObjectByName(first),b=root.getObjectByName(second);
  assert.ok(a&&b,'missing '+first+' or '+second);
  assert.ok(!new T.Box3().setFromObject(a).intersectsBox(new T.Box3().setFromObject(b)),first+' intersects '+second);
 }
});
test('bedside lamps and flower vase have supporting surfaces',()=>{
 const root=new T.Group();furniture(root);root.updateMatrixWorld(true);
 const objects:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)objects.push(o)});
 const tops=objects.filter(o=>o.name==='nightstand-marble-top');
 const bases=objects.filter(o=>o.name==='brass-lamp-base');
 assert.equal(tops.length,2);assert.equal(bases.length,2);
 for(let i=0;i<2;i++){
  const top=new T.Box3().setFromObject(tops[i]);
  const base=new T.Box3().setFromObject(bases[i]);
  assert.ok(base.min.y<=top.max.y+.015&&base.max.y>top.max.y,'lamp base is floating above nightstand');
 }
 const table=root.getObjectByName('cocktail-table-marble')!;
 const vase=root.getObjectByName('table-flower-vase')!;
 const top=new T.Box3().setFromObject(table).max.y;
 const bottom=new T.Box3().setFromObject(vase).min.y;
 assert.ok(Math.abs(top-bottom)<.025,'vase floats above or sinks into the table');
});
