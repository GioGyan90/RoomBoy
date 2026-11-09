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
 const other=['left-bulkhead-bedroom','king-bed-frame','full-height-wardrobe','rear-wood-panel'];
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
test('bedside reading lamps are anchored to upholstered headboard, and flowers remain on table',()=>{
 const root=new T.Group();furniture(root);root.updateMatrixWorld(true);
 const all:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)all.push(o)});
 const plates=all.filter(m=>m.name==='reading-lamp-wall-plate');
 const arms=all.filter(m=>m.name==='reading-lamp-arm');
 const heads=all.filter(m=>m.name==='reading-lamp-head');
 const controls=all.filter(m=>m.name==='reading-control-panel');
 const necks=all.filter(m=>m.name==='reading-lamp-neck');
 assert.equal(plates.length,2);assert.equal(arms.length,2);
 assert.equal(heads.length,2);assert.equal(necks.length,2);assert.equal(controls.length,2);
 const board=new T.Box3().setFromObject(root.getObjectByName('headboard-wood-frame')!);
 for(let i=0;i<2;i++){
  const plate=new T.Box3().setFromObject(plates[i]);
  assert.ok(plate.intersectsBox(board),'reading light must mount on headboard');
  const arm=new T.Box3().setFromObject(arms[i]);
  const head=new T.Box3().setFromObject(heads[i]);
  const neck=new T.Box3().setFromObject(necks[i]);
  assert.ok(plate.intersectsBox(arm),'reading light arm is detached from wall plate');
  assert.ok(arm.intersectsBox(neck),'reading lamp neck detached from arm');
  assert.ok(neck.intersectsBox(head),'reading lamp head detached from neck');
 }
 const table=root.getObjectByName('cocktail-table-marble')!;
 const vase=root.getObjectByName('table-flower-vase')!;
 const top=new T.Box3().setFromObject(table).max.y;
 const bottom=new T.Box3().setFromObject(vase).min.y;
 assert.ok(Math.abs(top-bottom)<.025,'vase floats above or sinks into table');
});

test('reference sleeping kit has six grouped assets and preserves the cleared entrance aisle',()=>{
 const root=new T.Group();furniture(root);root.updateMatrixWorld(true);
 const zone=root.getObjectByName('cruise-sleeping-zone') as T.Group;
 assert.ok(zone);
 for(const name of ['bed-kit-rug-and-underlight','bed-kit-frame-and-slats',
  'bed-kit-mattress','bed-kit-duvet-and-pillows','bed-kit-upholstered-headboard',
  'bed-kit-two-nightstands','bed-kit-reading-lamps-and-controls']){
  assert.ok(zone.getObjectByName(name),'missing kit module '+name);
 }
 assert.equal(zone.getObjectsByProperty('name','bed-frame-slat').length,12);
 assert.equal(zone.getObjectsByProperty('name','headboard-vertical-tuft').length,8);
 assert.equal(zone.getObjectsByProperty('name','nightstand-marble-top').length,2);
 assert.ok(zone.getObjectByName('headboard-art-deco-gold-arch'));
 assert.ok(zone.getObjectByName('headboard-warm-halo'));
 const bed=new T.Box3().setFromObject(zone.getObjectByName('king-bed-frame')!);
 assert.ok(bed.min.x>-1.75&&bed.max.z<.3,'bed must not re-block the entrance');
});
test('bathroom cutaway preserves view of the tub without removing bedroom exterior wall',()=>{
 const root=new T.Group();architecture(root);
 const bedroom=root.getObjectByName('left-bulkhead-bedroom') as T.Mesh;
 const cutaway=root.getObjectByName('left-bulkhead-bath-cutaway') as T.Mesh;
 assert.ok(bedroom&&cutaway);
 const high=new T.Box3().setFromObject(bedroom),low=new T.Box3().setFromObject(cutaway);
 assert.ok(high.max.y>3&&low.max.y<.8,'cutaway wall should not obscure bathroom');
 assert.ok(Math.abs(high.max.z-low.min.z)<.02,'exterior wall segments must join without gaps');
});

test('toilet is grounded, has an open seat, and the cistern is physically supported',()=>{
 const root=new T.Group();serviceRooms(root);root.updateMatrixWorld(true);
 const get=(name:string)=>{const m=root.getObjectByName(name) as T.Mesh;assert.ok(m,name+' missing');return m};
 const box=(name:string)=>new T.Box3().setFromObject(get(name));
 const pedestal=box('toilet-pedestal'),bowl=box('toilet-bowl'),seat=box('toilet-seat');
 const support=box('toilet-cistern-support'),tank=box('toilet-cistern');
 assert.ok(pedestal.min.y<.06,'pedestal must reach the bathroom floor');
 assert.ok(pedestal.intersectsBox(bowl),'pedestal must support the bowl');
 assert.ok(seat.min.y<=bowl.max.y+.015,'seat must rest on the basin rim');
 assert.ok(support.intersectsBox(tank),'cistern support must connect to tank');
 assert.ok(support.intersectsBox(bowl),'tank support must connect to toilet body');
 assert.ok(get('toilet-seat').geometry instanceof T.ExtrudeGeometry,'toilet seat should be an open elliptical ring');
});

test('cruise has an unobstructed bathroom cutaway and a single curved sofa shell',()=>{
 const root=new T.Group();architecture(root);furniture(root);root.updateMatrixWorld(true);
 const divider=root.getObjectByName('bath-divider') as T.Mesh;
 assert.ok(divider,'bathroom divider missing');
 const bounds=new T.Box3().setFromObject(divider);
 assert.ok(bounds.max.y<=1.25,'high divider blocks the bed and bathroom in isometric view');
 const sofa=root.getObjectByName('sofa-curved-backrest') as T.Mesh;
 assert.ok(sofa&&sofa.geometry instanceof T.ExtrudeGeometry,'continuous sofa back required');
 let obsolete=0;root.traverse(o=>{if(o.name==='sofa-curve-back-panel')obsolete++});
 assert.equal(obsolete,0,'segmented sofa backs must not return');
});

test('exterior glazing frames span real hull thickness on both sides',()=>{
 const root=new T.Group();architecture(root);referenceArchitecture(root);root.updateMatrixWorld(true);
 const bounds=(name:string)=>{
  const obj=root.getObjectByName(name);
  assert.ok(obj,name+' missing');
  return new T.Box3().setFromObject(obj);
 };
 const wall=bounds('right-window-sill');
 const outer=bounds('side-window-brass-frame');
 const inner=bounds('side-window-inner-brass-frame');
 const glass=bounds('side-window-sea');
 assert.ok(outer.max.x>wall.max.x+.025,'outer brass reveal must project beyond ship skin');
 assert.ok(outer.min.x<wall.min.x+.025,'outer frame must engage full shell thickness');
 assert.ok(inner.min.x<wall.min.x-.005,'inner trim must sit inside room');
 assert.ok(glass.min.x>wall.min.x && glass.max.x<wall.max.x,'glass must sit within thickness, not on face');
 const door=bounds('side-balcony-brass-frame');
 const doorGlass=bounds('side-balcony-sea');
 const doorInner=bounds('side-balcony-inner-brass-frame');
 assert.ok(door.max.x>wall.max.x+.025 && door.min.x<wall.min.x+.025);
 assert.ok(doorInner.min.x<wall.min.x-.005);
 assert.ok(doorGlass.min.x>wall.min.x && doorGlass.max.x<wall.max.x);
});
test('entry wall is genuinely cut around the door and exterior reveal lines its jambs',()=>{
 const root=new T.Group();architecture(root);referenceArchitecture(root);root.updateMatrixWorld(true);
 const entry=root.getObjectByName('left-bulkhead-bedroom') as T.Group;
 assert.ok(entry&&entry.children.length>=4,'entrance wall should have four aperture segments');
 const bounds=(name:string)=>{
  const m=root.getObjectByName(name);
  assert.ok(m,name+' missing');
  return new T.Box3().setFromObject(m);
 };
 const aft=bounds('entry-wall-aft'),fore=bounds('entry-wall-forward');
 const header=bounds('entry-wall-header'),threshold=bounds('entry-wall-threshold');
 const door=bounds('suite-entry-door');
 assert.ok(aft.max.z<door.min.z && fore.min.z>door.max.z,'door must fit between wall segments');
 assert.ok(header.min.y>door.max.y && threshold.max.y<door.min.y,'opening must continue above and below door');
 const frame=bounds('suite-entry-door-frame');
 assert.ok(frame.min.x<aft.min.x && frame.max.x>aft.max.x,'entry frame must wrap external and internal shell');
});

test('rounded window and door openings have wall-thickness corner infills rather than visible gaps',()=>{
 const root=new T.Group();architecture(root);referenceArchitecture(root);root.updateMatrixWorld(true);
 const box=(name:string)=>{
  const mesh=root.getObjectByName(name) as T.Mesh;
  assert.ok(mesh,name+' missing');
  return {mesh,box:new T.Box3().setFromObject(mesh)};
 };
 const window=box('window-hull-corner-infill');
 const door=box('door-hull-corner-infill');
 for(const item of [window,door]){
  assert.ok(item.mesh.geometry instanceof T.ExtrudeGeometry,'infill must be an extruded negative-aperture shape');
  const shapes=(item.mesh.geometry as T.ExtrudeGeometry).parameters.shapes;
  const shape=Array.isArray(shapes)?shapes[0]:shapes;
  assert.equal(shape.holes.length,1,'rounded opening must be subtracted from wall infill');
  assert.ok(item.box.min.x<5.72&&item.box.max.x>5.88,'infill must engage complete hull skin');
 }
 const wall=root.getObjectByName('right-window-sill')!;
 const wallBox=new T.Box3().setFromObject(wall);
 assert.ok(window.box.max.x<=wallBox.max.x+.025);
});
test('exterior metal trim must stop on either side of the balcony aperture',()=>{
 const root=new T.Group();architecture(root);referenceArchitecture(root);root.updateMatrixWorld(true);
 const door=root.getObjectByName('side-balcony-brass-frame')!;
 const doorBox=new T.Box3().setFromObject(door);
 const names=['hull-longitudinal-brass-aft','hull-longitudinal-brass-fore',
  'hull-gold-longitudinal-band-aft','hull-gold-longitudinal-band-fore'];
 for(const name of names){
  const item=root.getObjectByName(name);
  assert.ok(item,name+' missing');
  const box=new T.Box3().setFromObject(item);
  if(name.includes('aft'))assert.ok(box.max.z<doorBox.min.z,'aft rail crosses glass at '+name);
  else assert.ok(box.min.z>doorBox.max.z,'fore rail crosses glass at '+name);
 }
 assert.equal(root.getObjectByName('hull-longitudinal-brass'),undefined);
 assert.equal(root.getObjectByName('hull-gold-longitudinal-band'),undefined);
});

test('bathroom is composed of independent grouped assemblies with open sliding doorway',()=>{
 const root=new T.Group();architecture(root);serviceRooms(root);
 const required=[
  'cruise-bathroom-shell','bathroom-partitions','bathroom-sliding-door-assembly','bath-door-open-panel',
  'bathroom-finish-materials','bathroom-soaking-tub','bathroom-wall-plumbing','wall-fixed-shower-mount',
  'bathroom-vanity','bathroom-toilet'
 ];
 for(const name of required)assert.ok(root.getObjectByName(name),name+' missing');
 const bounds=(name:string)=>{
  const item=root.getObjectByName(name);
  assert.ok(item,name+' missing');
  return new T.Box3().setFromObject(item);
 };
 const left=bounds('bath-divider'),right=bounds('bath-end-return'),leaf=bounds('bath-sliding-glass');
 assert.ok(left.max.z<2.25,'the partition blocks the doorway');
 assert.ok(right.min.z>3.5,'the return blocks the doorway');
 assert.ok(leaf.max.z<2.1,'sliding leaf must park outside opening');
 const lintel=bounds('bath-door-lintel');
 const track=bounds('bath-door-pocket-track'),wall=bounds('bath-rear-wall');
 assert.ok(track.intersectsBox(lintel),'sliding track is detached from header');
 assert.ok(track.intersectsBox(wall),'pocket door track is detached from rear partition');
 assert.ok(track.intersectsBox(leaf),'stored door leaf does not engage its track');
 const posts=[...root.getObjectsByProperty('name','bath-door-jamb')];
 assert.equal(posts.length,2,'real doorway must have two supported jambs');
 for(const post of posts){
  const box=new T.Box3().setFromObject(post);
  assert.ok(box.max.y>=lintel.min.y-.07,'door header must meet jamb');
 }
});
test('tub plumbing has no floating extras and shower pipe is physically continuous',()=>{
 const root=new T.Group();serviceRooms(root);root.updateMatrixWorld(true);
 const bounds=(name:string)=>{
  const item=root.getObjectByName(name);
  assert.ok(item,name+' missing');
  return new T.Box3().setFromObject(item);
 };
 const base=bounds('tub-plinth'),body=bounds('tub-body'),rim=bounds('tub-rim'),water=bounds('tub-water');
 assert.ok(base.min.y<.075,'tub base must rest on bath floor');
 assert.ok(base.intersectsBox(body),'tub body must rest on its base');
 assert.ok(water.max.y<rim.max.y,'water must remain inside tub');
 const pipe=bounds('shower-gold-riser'),arm=bounds('shower-overhead-arm'),spout=bounds('shower-spout');
 const head=bounds('shower-rain-head'),plate=bounds('shower-wall-plate'),wall=bounds('bath-back-marble-panel');
 assert.ok(pipe.intersectsBox(arm),'shower arm is floating');
 assert.ok(pipe.intersectsBox(spout),'shower spout is floating');
 assert.ok(arm.intersectsBox(head),'shower head is detached from its arm');
 assert.ok(plate.intersectsBox(wall),'shower wall plate is not mounted to marble');
 assert.ok(plate.intersectsBox(pipe),'shower riser is detached from wall plate');
 for(const name of ['bath-faucet-spout','bath-tap-knob','bath-towel-rail','bath-towel-bracket']){
  assert.equal(root.getObjectByName(name),undefined,name+' obsolete floating object');
 }
});
test('toilet is kept clear of open bathroom doorway',()=>{
 const root=new T.Group();architecture(root);serviceRooms(root);
 const toilet=root.getObjectByName('toilet-bowl')!,leaf=root.getObjectByName('bath-sliding-glass')!;
 const box=new T.Box3().setFromObject(toilet),door=new T.Box3().setFromObject(leaf);
 assert.ok(box.max.x< -3.0,'toilet sits too close to bathroom passage');
 assert.ok(!box.intersectsBox(door),'sliding door collides with toilet');
});

test('TV is on the bed-foot wall, faces the mattress and has a dark off screen',()=>{
 const root=new T.Group();architecture(root);furniture(root);referenceArchitecture(root);
 root.updateMatrixWorld(true);
 const bed=root.getObjectByName('king-bed-frame')!,tv=root.getObjectByName('wall-tv-screen') as T.Mesh;
 const wall=root.getObjectByName('bed-foot-media-panel')!;
 const a=new T.Box3().setFromObject(bed),b=new T.Box3().setFromObject(tv),w=new T.Box3().setFromObject(wall);
 assert.ok(b.min.z>a.max.z+1,'TV should be in front of bed foot, not above headboard');
 assert.ok(Math.abs(b.getCenter(new T.Vector3()).x-a.getCenter(new T.Vector3()).x)<.12,'TV must be centered opposite the bed');
 assert.ok(b.max.z<w.min.z,'TV panel must face the bedroom');
 const mat=tv.material as T.MeshStandardMaterial;
 assert.ok(mat.color.r<.1&&mat.color.g<.1&&mat.color.b<.13,'TV must not be an ocean-blue screen');
 assert.equal(root.getObjectByName('wall-tv-sea'),undefined);
 assert.equal(root.getObjectByName('wall-tv-sky'),undefined);
 assert.equal(root.getObjectByName('wall-tv-horizon'),undefined);
 const frame=new T.Box3().setFromObject(root.getObjectByName('wall-tv-brass-frame')!);
 const inset=new T.Box3().setFromObject(root.getObjectByName('bed-foot-media-inset')!);
 assert.ok(frame.intersectsBox(b),'television floating outside frame');
 assert.ok(frame.intersectsBox(inset),'TV frame is not attached to inset');
 assert.ok(inset.intersectsBox(w),'media inset is detached from wall');
});
test('vanity has a genuine recessed bowl, open countertop and connected tap',()=>{
 const root=new T.Group();serviceRooms(root);root.updateMatrixWorld(true);
 const get=(n:string)=>{const o=root.getObjectByName(n) as T.Mesh;assert.ok(o,n+' missing');return o};
 const bounds=(n:string)=>new T.Box3().setFromObject(get(n));
 const basin=get('washbasin');
 assert.ok(basin.geometry instanceof T.LatheGeometry,'sink should be a hollow lathable dish rather than slab');
 const left=bounds('vanity-marble-left'),right=bounds('vanity-marble-right');
 const back=bounds('vanity-marble-back'),front=bounds('vanity-marble-front');
 const bowl=bounds('washbasin'),drain=bounds('washbasin-drain');
 assert.ok(left.max.x<bowl.getCenter(new T.Vector3()).x && right.min.x>bowl.getCenter(new T.Vector3()).x);
 assert.ok(back.max.z<bowl.getCenter(new T.Vector3()).z && front.min.z>bowl.getCenter(new T.Vector3()).z);
 assert.ok(drain.min.y<bowl.max.y-.04,'basin must dip beneath the rim to a drain');
 assert.equal(root.getObjectByName('vanity-marble'),undefined,'solid uncut slab must not return');
 const stem=bounds('washbasin-tap'),spout=bounds('washbasin-faucet-spout'),tip=bounds('washbasin-faucet-aerator');
 assert.ok(stem.intersectsBox(spout),'washbasin faucet stem is detached');
 assert.ok(spout.intersectsBox(tip),'washbasin tip is detached');
 assert.ok(tip.getCenter(new T.Vector3()).z>bowl.min.z,'faucet must discharge over washbasin');
});
test('tub fill plumbing connects wall riser to bathtub edge and has no hovering pieces',()=>{
 const root=new T.Group();serviceRooms(root);root.updateMatrixWorld(true);
 const bounds=(n:string)=>{
  const o=root.getObjectByName(n)!;
  assert.ok(o,n+' missing');return new T.Box3().setFromObject(o);
 };
 const pipe=bounds('shower-gold-riser'),spout=bounds('shower-spout');
 const feed=bounds('tub-fill-wall-feed'),down=bounds('tub-fill-downpipe'),flange=bounds('tub-fill-rim-flange');
 const rim=bounds('tub-rim');
 assert.ok(pipe.intersectsBox(spout),'wall riser not linked to tub filler');
 assert.ok(spout.intersectsBox(feed),'wall feed detached');
 assert.ok(spout.intersectsBox(down),'filler downpipe suspended');
 assert.ok(down.intersectsBox(flange),'filler downpipe misses flange');
 assert.ok(flange.intersectsBox(rim),'flange does not seat on bathtub rim');
 assert.ok(spout.max.z>rim.min.z,'fill pipe does not extend over tub');
});

test('wider sofa pillows remain clear of the armrests',()=>{
 const root=new T.Group();furniture(root);root.updateMatrixWorld(true);
 const pillows=root.getObjectsByProperty('name','sofa-pillow') as T.Mesh[];
 const arms=root.getObjectsByProperty('name','sofa-arm') as T.Mesh[];
 assert.equal(pillows.length,2);
 assert.equal(arms.length,2);
 for(const pillow of pillows){
  const b=new T.Box3().setFromObject(pillow);
  assert.ok(b.max.x-b.min.x>=.45,'sofa cushion should be visibly wider');
  for(const arm of arms){
   const a=new T.Box3().setFromObject(arm);
   assert.ok(!b.intersectsBox(a),'widened sofa cushion intersects armrest');
  }
 }
});
