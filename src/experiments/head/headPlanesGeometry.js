import * as T from 'three';

/**
 * BASIC PLANES OF THE HEAD — second, source-directed construction.
 *
 * These are the measured/hand-fitted landmarks of the FRONT LEFT HALF.
 * X is negative, Y is up, Z points toward the viewer. The front must be
 * laid out here first. Right-side vertices are generated only by mirroring.
 * The same vertex IDs are then moved in depth to form one connected shell.
 *
 * No disconnected brow, eye, nose, cheek or jaw "sticker" geometry exists.
 */
export const FRONT_LEFT_HALF_ROWS = [
  // Authored only on -X. Six columns: center / nose / inner orbit /
  // outer orbit / cheek ridge / silhouette. All other vertices derive here.
  {name:'01 cranial crown', points:[[0,1.59,.02],[-.10,1.59,-.01],[-.20,1.58,-.035],[-.29,1.55,-.07],[-.38,1.53,-.10],[-.45,1.49,-.14]]},
  {name:'02 upper crown',  points:[[0,1.45,.28],[-.11,1.45,.27],[-.23,1.45,.24],[-.35,1.44,.18],[-.45,1.43,.09],[-.54,1.40,-.04]]},
  {name:'03 frontal plane',points:[[0,1.25,.40],[-.12,1.25,.40],[-.25,1.25,.37],[-.39,1.25,.31],[-.52,1.24,.19],[-.60,1.22,-.04]]},
  {name:'04 lower forehead',points:[[0,.84,.47],[-.12,.84,.47],[-.25,.84,.46],[-.41,.84,.40],[-.55,.83,.27],[-.65,.82,-.04]]},
  {name:'05 brow bridge', points:[[0,.59,.54],[-.085,.59,.55],[-.22,.59,.57],[-.40,.59,.54],[-.54,.57,.41],[-.65,.55,-.04]]},
  {name:'06 recessed eye',points:[[0,.43,.61],[-.085,.43,.58],[-.20,.43,.37],[-.36,.43,.35],[-.51,.42,.30],[-.64,.42,-.05]]},
  {name:'07 eye bottom',  points:[[0,.29,.67],[-.09,.29,.60],[-.20,.29,.42],[-.36,.29,.38],[-.50,.28,.30],[-.63,.28,-.06]]},
  {name:'08 nasal tip',   points:[[0,.14,.74],[-.085,.14,.63],[-.21,.14,.51],[-.37,.14,.43],[-.51,.13,.33],[-.62,.12,-.07]]},
  {name:'09 nose base',  points:[[0,-.05,.54],[-.085,-.05,.52],[-.21,-.05,.47],[-.35,-.05,.39],[-.46,-.05,.32],[-.56,-.06,-.085]]},
  {name:'10 lower cheek',points:[[0,-.23,.48],[-.09,-.23,.46],[-.20,-.23,.43],[-.30,-.23,.38],[-.41,-.22,.25],[-.47,-.20,-.13]]},
  {name:'11 chin wedge', points:[[0,-.43,.39],[-.08,-.43,.39],[-.17,-.43,.35],[-.25,-.42,.28],[-.33,-.39,.09],[-.36,-.36,-.16]]},
  {name:'12 chin shelf', points:[[0,-.54,.32],[-.07,-.54,.32],[-.16,-.54,.29],[-.22,-.51,.21],[-.25,-.47,.03],[-.28,-.44,-.18]]}
];

// Four depth stations complete the positive X rear half, then mirror X again.
// Each station is keyed to the EXACT corresponding front silhouette row.
const REAR_DEPTH = [
  {d:-.17,lift:.00}, {d:-.44,lift:0},
  {d:-.78,lift:0}, {d:-.97,lift:0},
  {d:-1.02,lift:0}, {d:-1.03,lift:0},
  {d:-1.00,lift:0}, {d:-.92,lift:.02},
  {d:-.82,lift:.04}, {d:-.64,lift:.05},
  {d:-.46,lift:.06}, {d:-.35,lift:.09}
];

const PAL = {
  crown:0xd4d0cc, forehead:0xd3cfca, brow:0xbab5b1,
  eyes:0x827d78, underEye:0xc1bcb7, nose:0xd5d0ca,
  cheek:0xc4c0bc, jaw:0xb2ada9, chin:0xcac4be,
  side:0xb3aeaa, back:0xbeb9b4, neck:0xbab5b0,
  shoulders:0xd6d0c9, ears:0xbab5b0, inset:0x938d87
};
const SKIN=0xc8c3be, X_SCALE=1.38, Z_SCALE=1.04;
const sections=18;
const colorMaterial=(color)=>new T.MeshStandardMaterial({
  color,roughness:1,metalness:0,flatShading:true,side:T.DoubleSide
});

const near=(n)=>Math.abs(n)<1e-9?0:n;
const mirrored=(p)=>[-p[0],p[1],p[2]];
function buildRing(row,i){
 const p=row.points;
 // First create right half ONLY by mirroring the authored left half.
 const right=p.map(mirrored);
 const max=right[5],rear=REAR_DEPTH[i];
 const x=max[0],y=max[1],z=max[2];
 const side=[
   [x*1.025,y-.01,z*.28-.10],
   [x*.88,y+rear.lift*.55,rear.d*.72],
   [x*.50,y+rear.lift*.88,rear.d*.94],
   [0,y+rear.lift,rear.d]
 ];
 // Winding: front midline -> right face -> back midline -> left face.
 const leftRear=[mirrored(side[2]),mirrored(side[1]),mirrored(side[0])];
 const leftFront=p.slice(1).reverse();
 return [...right,...side,...leftRear,...leftFront].map(([xx,yy,zz])=>[
   near(xx*X_SCALE), yy, near(zz*Z_SCALE)
 ]);
}
// Rounded upper skull is created from the SAME indexed cranial ring.
// Its flattened inner collar avoids the single long triangular ridge that
// appeared in real browser screenshots of the previous cap.
function crownRoll(ring){
 return ring.map(([x,y,z])=>{
   const xx=x*.70;
   const t=Math.min(1,Math.abs(xx)/.50);
   return [near(xx),1.610-.027*t*t,near(z*.55-.060)];
 });
}

function bustRing(level){
 const out=[];
 for(let i=0;i<sections;i++){
   const a=i*2*Math.PI/sections,s=Math.sin(a),c=Math.cos(a);
   out.push([near(level.w*s*X_SCALE),
     level.y-level.shoulderDrop*Math.abs(s),
     near((level.z+level.d*c)*Z_SCALE)]);
 }
 return out;
}
const NECK_BUST=[
 {name:'neckRoot', y:-.63,w:.235,d:.24,z:-.10,shoulderDrop:0},
 {name:'neckMid',  y:-.76,w:.235,d:.25,z:-.11,shoulderDrop:0},
 {name:'neckLow',  y:-.92,w:.265,d:.27,z:-.11,shoulderDrop:0},
 {name:'trap',     y:-1.08,w:.42,d:.30,z:-.11,shoulderDrop:.045},
 {name:'shoulder', y:-1.28,w:.74,d:.33,z:-.11,shoulderDrop:.035},
 {name:'bustEnd',  y:-1.62,w:.79,d:.34,z:-.11,shoulderDrop:0}
];
export const HEAD_PLANE_STAGES=['half','mirror','volume'];
const mirrorSegments=new Set([0,1,2,3,4,13,14,15,16,17]);
function segmentZone(row,seg){
 if(row>=FRONT_LEFT_HALF_ROWS.length-1)
   return row<FRONT_LEFT_HALF_ROWS.length+1?'neck':'shoulders';
 const onFace=mirrorSegments.has(seg);
 if(!onFace)return row<3?'crown':row<8?'side':'back';
 const c=seg<5?seg:17-seg;
 if(row<=1)return 'crown';
 if(row<=3)return 'forehead';
 // One continuous, inset dark plane under a broad eyebrow shelf.
 // All these triangles belong to the SAME connected head topology.
 if(row===4)return c===0?'nose':c===1?'brow':c<=3?'eyes':'side';
 if(row===5)return c===0?'nose':c===1?'underEye':c<=3?'underEye':'cheek';
 if(row===6)return c<=1?'nose':'cheek';
 if(row===7)return c===0?'nose':'cheek';
 if(row===8)return c===0?'chin':c>=3?'jaw':'cheek';
 if(row===9)return c>=2?'jaw':'chin';
 return 'chin';
}

function makeEar(side){
 // Slightly inset ear concha, with an outer helix and a real side wall.
 // Front-face triangles share the recessed central vertex: not a 2D card.
 const outline=[
  [.625,.37,-.10],[.68,.425,-.15],[.725,.36,-.17],
  [.749,.15,-.16],[.710,-.035,-.12],[.644,-.05,-.075],
  [.625,.12,-.055]
 ];
 const front=outline.map(([x,y,z])=>[side*x*X_SCALE,y,(z+.045)*Z_SCALE]);
 const back=outline.map(([x,y,z])=>[side*x*X_SCALE,y,(z-.055)*Z_SCALE]);
 const center=[side*.685*X_SCALE,.19,-.135*Z_SCALE];
 const vertices=[...front,...back,center];
 const cap=outline.length,inner=vertices.length-1,indices=[];
 for(let i=0;i<cap;i++){
   const j=(i+1)%cap;
   indices.push(inner,i,j); // Concave ear front fan.
   indices.push(i,j,cap+j,i,cap+j,cap+i); // Solid thickness.
 }
 for(let i=1;i<cap-1;i++)indices.push(cap,cap+i+1,cap+i);
 if(side<0)for(let i=0;i<indices.length;i+=3)
   [indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(vertices.flat(),3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 return geometry;
}

/**
 * Stage half: authoring side only. Stage mirror: both sides share X=0
 * indices. Stage volume: move the SAME front vertices in Z and connect
 * the sides and back with a 360-degree shell extending into the neck.
 */
export function createHeadPlanes({stage='volume'}={}){
 if(!HEAD_PLANE_STAGES.includes(stage))stage='volume';
 const root=new T.Group();root.name='basic-planes-head-v2';
 const rings=FRONT_LEFT_HALF_ROWS.map(buildRing);
 if(stage==='volume'){
   rings.unshift(crownRoll(rings[0]));
   for(const lvl of NECK_BUST)rings.push(bustRing(lvl));
 }
 const pts=rings.flat();
 const pos=pts.flat();
 const idx=[],groups=[],paletteKeys=Object.keys(PAL);
 const mats=paletteKeys.map(k=>colorMaterial(PAL[k]));
 const isHalf=stage==='half',isMirror=stage==='mirror';
 let faceTriangles=0;
 function push(a,b,c,zone){
  const start=idx.length;
  idx.push(a,b,c);
  groups.push({start,count:3,materialIndex:paletteKeys.indexOf(zone)});
  faceTriangles++;
 }
 for(let r=0;r<rings.length-1;r++){
  for(let s=0;s<sections;s++){
   if(isHalf && s<13)continue;
   if(isHalf && s>17)continue;
   if(isMirror && !mirrorSegments.has(s))continue;
   const a=r*sections+s,b=r*sections+(s+1)%sections,
     c=(r+1)*sections+s,d=(r+1)*sections+(s+1)%sections;
   const zone=stage==='volume'&&r===0?'crown':segmentZone(r-(stage==='volume'?1:0),s);
   // Shared-vertex quads: no layered facial polygons.
   push(a,c,b,zone);
   push(b,c,d,zone);
  }
 }
 if(stage==='volume'){
  // Crown closes at one shared apex (not a separate sphere).
  const ti=pos.length/3;
  pos.push(0,1.626,-.105*Z_SCALE);
  for(let s=0;s<sections;s++)
   push(ti,s,(s+1)%sections,'crown');
  const bi=pos.length/3;
  pos.push(0,-1.62,-.11*Z_SCALE);
  const n=(rings.length-1)*sections;
  for(let s=0;s<sections;s++)
   push(bi,n+(s+1)%sections,n+s,'shoulders');
 }
 const g=new T.BufferGeometry();
 g.setAttribute('position',new T.Float32BufferAttribute(pos,3));
 g.setIndex(idx);
 for(const group of groups)g.addGroup(group.start,group.count,group.materialIndex);
 g.computeVertexNormals();
 const shell=new T.Mesh(g,mats);
 shell.name='统一头面与颈肩 · 共享索引网格';
 shell.userData.zone='skin';
 root.add(shell);
 const parts=[shell],allMaterials=[...mats];
 const earMeshes=[];
 if(stage==='volume'){
   for(const s of [-1,1]){
    const em=new T.Mesh(makeEar(s),colorMaterial(PAL.ears));
    em.name=s<0?'左耳 · 闭合体块':'右耳 · 镜像闭合体块';
    em.userData.zone='ears';
    root.add(em);parts.push(em);earMeshes.push(em);
    allMaterials.push(em.material);
   }
 }
 const meshEdges=[];
 for(const mesh of parts){
  const e=new T.LineSegments(new T.EdgesGeometry(mesh.geometry,24),
    new T.LineBasicMaterial({color:0x635e59,transparent:true,opacity:.20,depthWrite:false}));
  e.name='primary-edges';mesh.add(e);
  const w=new T.LineSegments(new T.WireframeGeometry(mesh.geometry),
    new T.LineBasicMaterial({color:0x47433f,transparent:true,opacity:.42,depthWrite:false}));
  w.name='topology';w.visible=stage!=='volume';
  mesh.add(w);meshEdges.push(w);
 }
 // White pinpoints show authored left-half endpoints before mirroring.
 if(stage!=='volume'){
  const half=FRONT_LEFT_HALF_ROWS.flatMap((r,i)=>r.points.map(p=>[
     p[0]*X_SCALE,p[1],p[2]*Z_SCALE
  ]));
  const mirroredHalf=half.map(p=>[-p[0],p[1],p[2]]);
  const points=isHalf?half:[...half,...mirroredHalf];
  const pg=new T.BufferGeometry();
  pg.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));
  const pin=new T.Points(pg,new T.PointsMaterial({
    color:0x37332f,size:.028,sizeAttenuation:true,depthTest:false
  }));
  pin.name='正面端点 · 左半版';pin.renderOrder=6;root.add(pin);
 }
 let showRegions=true,showFeatures=true;
 function repaint(){
  paletteKeys.forEach((k,i)=>{
   let hex=showRegions?PAL[k]:SKIN;
   if(!showFeatures && ['eyes','brow','underEye','nose','cheek','jaw','chin'].includes(k))
     hex=SKIN;
   mats[i].color.setHex(hex);
  });
  for(const ear of earMeshes)ear.material.color.setHex(showRegions?PAL.ears:SKIN);
 }
 function setWire(visible){for(const wire of meshEdges)wire.visible=visible;}
 function setZones(visible){showRegions=visible;repaint();}
 function setPartVisible(zone,visible){
  if(zone==='ears'){for(const ear of earMeshes)ear.visible=visible;return;}
  if(['neck','shoulders'].includes(zone)){
   const k=paletteKeys.indexOf(zone);if(k!==-1)mats[k].visible=visible;return;
  }
  if(['brow','eyes','temple','cheek','jaw','chin','nose'].includes(zone)){
   showFeatures=visible;repaint();
  }
 }
 return {group:root,parts,faces:parts.reduce((n,m)=>n+(m.geometry.index?.count||0)/3,0),
  vertices:parts.reduce((n,m)=>n+m.geometry.attributes.position.count,0),
  stage,frontLeftLandmarks:FRONT_LEFT_HALF_ROWS,
  setWire,setZones,setPartVisible};
}
