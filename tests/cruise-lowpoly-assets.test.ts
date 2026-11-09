import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createDuvetGeometry,createRoundedFrameGeometry,createPillowGeometry,createFoldedCornerGeometry,cruiseUvRegions} from '../src/assets/procedural/cruiseCabin/lowpolyAssets';
import {furniture} from '../src/assets/procedural/cruiseCabin/furniture';
import {architecture} from '../src/assets/procedural/cruiseCabin/architecture';
import {serviceRooms} from '../src/assets/procedural/cruiseCabin/serviceRooms';
import {referenceFinish} from '../src/assets/procedural/cruiseCabin/referenceFinish';
import {createCruiseFabricAtlas,createCruiseRugPrint,createCruiseFloorPrint,createCruiseMarblePrint} from '../src/assets/procedural/cruiseCabin/surfacePatterns';
import {referenceArchitecture} from '../src/assets/procedural/cruiseCabin/referenceArchitecture';

test('draped duvet has finite UVs, visible folds, low-poly vertex count and thickness',()=>{
 const g=createDuvetGeometry(2.58,2.85,.12);
 const p=g.getAttribute('position') as T.BufferAttribute, uv=g.getAttribute('uv') as T.BufferAttribute;
 assert.equal(p.count,2*33*41);
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

test('quilt, fitted sheet, runner and folded corner have distinct detailed cloth meshes',()=>{
 const root=new T.Group();furniture(root);
 const names=['bedsheet-top','quilt-ivory','quilt-burgundy-runner','quilt-folded-corner'];
 const meshes=names.map(name=>{
  const m=root.getObjectByName(name) as T.Mesh;
  assert.ok(m,name+' missing');
  assert.ok(m.geometry instanceof T.BufferGeometry);
  assert.ok(m.geometry.getAttribute('uv'));
  return m;
 });
 const sheet=meshes[0].geometry.getAttribute('position');
 const quilt=meshes[1].geometry.getAttribute('position');
 const throwPos=meshes[2].geometry.getAttribute('position');
 const corner=meshes[3].geometry.getAttribute('position');
 assert.ok(sheet.count>1000,'fitted sheet should carry detailed surface topology');
 assert.ok(quilt.count>3000,'duvet needs additional fabric geometry');
 assert.ok(throwPos.count>1200,'runner hem should be sculpted');
 assert.ok(corner.count>75,'corner flip needs a properly subdivided fold');
 for(const mesh of meshes){
  const uv=mesh.geometry.getAttribute('uv');
  const pos=mesh.geometry.getAttribute('position') as T.BufferAttribute;
  for(let i=0;i<pos.count;i++){
   for(let k=0;k<3;k++)assert.ok(Number.isFinite(pos.getComponent(i,k)));
   assert.ok(Number.isFinite(uv.getX(i))&&Number.isFinite(uv.getY(i)));
  }
 }
});
test('individual pillows are sculpted high-density shells, not warped cubes',()=>{
 const root=new T.Group();furniture(root);
 const pillows=root.getObjectsByProperty('name','sleeping-pillow') as T.Mesh[];
 assert.equal(pillows.length,2);
 for(const pillow of pillows){
  assert.ok(!(pillow.geometry instanceof T.BoxGeometry));
  assert.ok(pillow.geometry.getAttribute('position').count>=400);
  assert.ok(pillow.geometry.getAttribute('uv'));
 }
 const extra=createPillowGeometry(1,.6,.22,.3);
 assert.ok(extra.getAttribute('normal'));
 assert.ok(createFoldedCornerGeometry(2.6,2.7).getAttribute('normal'));
});

test('finished bedding has high-resolution drape, two-sided turn-back and full pillow shells',()=>{
 const root=new T.Group();furniture(root);root.updateMatrixWorld(true);
 const get=(n:string)=>{const m=root.getObjectByName(n) as T.Mesh;assert.ok(m,n+' missing');return m};
 const sheet=get('bedsheet-top'),quilt=get('quilt-ivory'),runner=get('quilt-burgundy-runner');
 const corner=get('quilt-folded-corner');
 assert.ok(sheet.geometry.getAttribute('position').count>=3000,'sheet needs true edge shaping');
 assert.ok(quilt.geometry.getAttribute('position').count>=4800,'duvet must have more modeled folds');
 assert.ok(runner.geometry.getAttribute('position').count>=2100,'runner requires modeled edges');
 assert.ok(corner.geometry.getAttribute('position').count>=500,'turn-back needs a dense two-sided mesh');
 assert.ok(corner.geometry.index!.count>=2400,'turned-back corner must have front, back and hem faces');
 const quiltBox=new T.Box3().setFromObject(quilt),foldBox=new T.Box3().setFromObject(corner);
 assert.ok(foldBox.min.x>=quiltBox.min.x&&foldBox.max.x<=quiltBox.max.x+.005,'fold outside quilt');
 assert.ok(foldBox.min.z>=quiltBox.min.z&&foldBox.max.z<=quiltBox.max.z+.005,'fold outside quilt foot');
 const foldPositions=corner.geometry.getAttribute('position') as T.BufferAttribute;
 const duvetPositions=quilt.geometry.getAttribute('position') as T.BufferAttribute;
 let peakLift=-Infinity;
 for(let i=0;i<foldPositions.count/2;i++){
  const u=foldPositions.getX(i)/2.62+.5,v=foldPositions.getZ(i)/2.67+.5;
  const xi=Math.max(0,Math.min(44,Math.round(u*44)));
  const zi=Math.max(0,Math.min(54,Math.round(v*54)));
  const duvetY=duvetPositions.getY(zi*45+xi);
  peakLift=Math.max(peakLift,foldPositions.getY(i)-duvetY);
 }
 assert.ok(peakLift>.055,'turned corner is not visibly folded above the local duvet');
 const pillows=root.getObjectsByProperty('name','sleeping-pillow') as T.Mesh[];
 assert.equal(pillows.length,2);
 for(const p of pillows)assert.ok(p.geometry.getAttribute('position').count>=1000,'pillow must have sufficient curvature faces');
});

test('turned white quilt corner stops before the black runner instead of making a triangular cut',()=>{
 const root=new T.Group();furniture(root);root.updateMatrixWorld(true);
 const fold=root.getObjectByName('quilt-folded-corner') as T.Mesh;
 const runner=root.getObjectByName('quilt-burgundy-runner') as T.Mesh;
 assert.ok(fold&&runner);
 const f=new T.Box3().setFromObject(fold);
 const r=new T.Box3().setFromObject(runner);
 assert.ok(f.max.z<r.min.z-.01,'white fold protrudes through black bed runner');
 const quilt=root.getObjectByName('quilt-ivory') as T.Mesh;
 assert.ok(f.min.x>=new T.Box3().setFromObject(quilt).min.x);
});
test('black runner is inset and conforms to the white duvet instead of crossing its corners',()=>{
 const root=new T.Group();furniture(root);root.updateMatrixWorld(true);
 const quilt=root.getObjectByName('quilt-ivory') as T.Mesh;
 const runner=root.getObjectByName('quilt-burgundy-runner') as T.Mesh;
 const sheet=root.getObjectByName('bedsheet-top') as T.Mesh;
 const bed=root.getObjectByName('king-bed-frame') as T.Mesh;
 const qb=new T.Box3().setFromObject(quilt),rb=new T.Box3().setFromObject(runner);
 const sb=new T.Box3().setFromObject(sheet),bb=new T.Box3().setFromObject(bed);
 assert.ok(rb.min.x>qb.min.x+.12&&rb.max.x<qb.max.x-.12,'black throw must leave white margins on both sides');
 assert.ok(rb.max.z<qb.max.z-.04,'black throw must leave white margin at the foot');
 assert.ok(sb.min.y>bb.max.y+.045,'sheet hem should not intersect wooden bed frame');
 assert.ok(qb.min.y>bb.max.y+.025,'white quilt must not intersect wooden bed frame');
 const qpos=quilt.geometry.getAttribute('position') as T.BufferAttribute;
 const rpos=runner.geometry.getAttribute('position') as T.BufferAttribute;
 for(let j=0;j<=28;j++)for(let i=0;i<=38;i++){
  const k=j*39+i;
  const localX=rpos.getX(k),localZ=rpos.getZ(k)+runner.position.z-quilt.position.z;
  const qi=Math.round((localX/2.62+.5)*44);
  const qj=Math.round((localZ/2.67+.5)*54);
  const qk=Math.max(0,Math.min(54,qj))*45+Math.max(0,Math.min(44,qi));
  assert.ok(rpos.getY(k)>=qpos.getY(qk)-.025,
    'runner sinks into duvet near its edge at vertex '+k);
 }
});
