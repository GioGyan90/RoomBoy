import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createDuvetGeometry,createRoundedFrameGeometry,cruiseUvRegions} from '../src/assets/procedural/cruiseCabin/lowpolyAssets';
import {furniture} from '../src/assets/procedural/cruiseCabin/furniture';
import {architecture} from '../src/assets/procedural/cruiseCabin/architecture';
import {serviceRooms} from '../src/assets/procedural/cruiseCabin/serviceRooms';
import {referenceFinish} from '../src/assets/procedural/cruiseCabin/referenceFinish';
import {createCruiseFabricAtlas,createCruiseRugPrint,createCruiseFloorPrint,createCruiseMarblePrint} from '../src/assets/procedural/cruiseCabin/surfacePatterns';
import {referenceArchitecture} from '../src/assets/procedural/cruiseCabin/referenceArchitecture';

test('draped duvet has finite UVs, visible folds, low-poly vertex count and thickness',()=>{
 const g=createDuvetGeometry(2.58,2.85,.12);
 const p=g.getAttribute('position') as T.BufferAttribute, uv=g.getAttribute('uv') as T.BufferAttribute;
 assert.equal(p.count,2*15*19);
 assert.equal(uv.count,p.count);
 let min=Infinity,max=-Infinity;
 for(let i=0;i<p.count/2;i++){const y=p.getY(i);min=Math.min(min,y);max=Math.max(max,y);}
 assert.ok(max-min>.055,'fabric should not be an unbent flat slab');
 for(let i=0;i<uv.count;i++){assert.ok(Number.isFinite(uv.getX(i))&&Number.isFinite(uv.getY(i)));assert.ok(uv.getX(i)>=0&&uv.getX(i)<=.5);}
 assert.ok(g.index&&g.index.count>0);
});
test('hollow rounded frame leaves its central aperture open',()=>{
 const g=createRoundedFrameGeometry(2.52,1.94,.4,.072);
 assert.ok(g instanceof T.ExtrudeGeometry);
 const root=new T.Group();referenceArchitecture(root);
 const brass=root.getObjectByName('side-window-brass-frame') as T.Mesh;
 const gasket=root.getObjectByName('side-window-black-gasket') as T.Mesh;
 assert.ok(brass.geometry instanceof T.ExtrudeGeometry);
 assert.ok(gasket.geometry instanceof T.ExtrudeGeometry);
 const bs=(brass.geometry as T.ExtrudeGeometry).parameters.shapes;
 const gs=(gasket.geometry as T.ExtrudeGeometry).parameters.shapes;
 const first=(v:T.Shape|T.Shape[])=>Array.isArray(v)?v[0]:v;
 assert.equal(first(bs).holes.length,1);
 assert.equal(first(gs).holes.length,1);
});
test('scene uses UV-ready cloth shells instead of solid rectangular quilt pieces',()=>{
 const root=new T.Group();furniture(root);
 for(const name of ['quilt-ivory','quilt-burgundy-runner']){
  const mesh=root.getObjectByName(name) as T.Mesh;
  assert.ok(mesh,name+' missing');
  assert.ok(mesh.geometry instanceof T.BufferGeometry);
  assert.ok(!(mesh.geometry instanceof T.BoxGeometry));
  assert.ok(mesh.geometry.getAttribute('uv'));
 }
 assert.equal(Object.keys(cruiseUvRegions).length,6);
});

test('embroidery, carpet gold linework and marble veins are ink on surfaces, not raised objects',()=>{
 const root=new T.Group();architecture(root);furniture(root);serviceRooms(root);referenceFinish(root);
 const absent=['runner-gold-stitch','quilt-stitched-line','bed-rug-border','bed-rug-inner',
  'carpet-gold-inlay','carpet-center','rug-gold-corner-a','rug-gold-corner-b',
  'marble-floor-gold-border','bath-floor-brass-inlay','bath-panel-brass-edge','bath-gold-marble-vein'];
 for(const name of absent)assert.equal(root.getObjectByName(name),undefined,name+' must not be a geometry decoration');
 for(const name of ['quilt-ivory','quilt-burgundy-runner','bed-rug','lounge-carpet',
  'cabin-floor','bath-marble-floor','bath-back-marble-panel']){
  const mesh=root.getObjectByName(name) as T.Mesh;
  assert.ok(mesh,name+' mesh missing');
  const material=mesh.material as T.MeshStandardMaterial;
  assert.ok(material.map instanceof T.DataTexture,name+' needs UV/pigment texture');
 }
});
test('print atlas maintains flat texture pixel data and 6 UV regions',()=>{
 for(const map of [createCruiseFabricAtlas(),createCruiseRugPrint(),createCruiseFloorPrint(),createCruiseMarblePrint()]){
  assert.ok(map instanceof T.DataTexture);
  assert.equal(map.image.width,256);
  assert.equal(map.image.height,256);
  assert.equal(map.image.data.length,256*256*4);
 }
});
