import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import './headPlanes.css';

// A standalone JS-only study based on the broad forms of a nine-angle
// "Basic Planes of the Head" drawing. No GLB is read or modified.
const C={
  skull:0xcac6c3, brow:0xd8d4d0, temple:0xb8b4b2,
  cheek:0xbfbab7, jaw:0xa9a5a3, chin:0xcac5c1,
  eyes:0x625f5d, nose:0xd9d3ce, noseSide:0xb4b0ad,
  ears:0xb7b1ae, earInset:0x8f8986, neck:0xbdb8b3,
  shoulders:0xcec9c4
};

const VIEWS=[
  {id:'frontLeft',name:'左前 3/4',pos:[-4,0,6]},
  {id:'front',name:'正面',pos:[0,0,7]},
  {id:'frontRight',name:'右前 3/4',pos:[4,0,6]},
  {id:'backLeft',name:'左后 3/4',pos:[-4,0,-6]},
  {id:'back',name:'背面',pos:[0,0,-7]},
  {id:'backRight',name:'右后 3/4',pos:[4,0,-6]},
  {id:'profileLeft',name:'左侧面',pos:[-7,0,0]},
  {id:'top',name:'俯视',pos:[0,7,3.5]},
  {id:'profileRight',name:'右侧面',pos:[7,0,0]}
];
const INTRO='从头颅、眉弓、颧骨、鼻梁、下颌到耳廓，逐块组合基础平面。使用 JS 顶点生成，不调用任何 GLB。';
const mat=(color)=>new T.MeshStandardMaterial({color,roughness:0.95,metalness:0,flatShading:true,side:T.DoubleSide});

function polygonGeometry(vertices){
  const positions=[],indices=[];
  for(const v of vertices)positions.push(...v);
  for(let i=1;i<vertices.length-1;i++)indices.push(0,i,i+1);
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

// Every item lives in a semantic group, so the face can later be retopologized.
export function createHeadPlanes(){
 const root=new T.Group();
 root.name='basic-planes-head';
 const parts=[];
 const outlineMaterial=new T.LineBasicMaterial({color:0x514d4a,transparent:true,opacity:.46,depthWrite:false});
 function add(name,geometry,color,zone){
   const mesh=new T.Mesh(geometry,mat(color));
   mesh.name=name;mesh.userData={zone,baseColor:color};
   root.add(mesh);parts.push(mesh);
   const lines=new T.LineSegments(new T.WireframeGeometry(geometry),outlineMaterial);
   lines.name='topology';lines.visible=false;lines.renderOrder=2;
   mesh.add(lines);
   return mesh;
 }
 function panel(name,vertices,color,zone){
   return add(name,polygonGeometry(vertices),color,zone);
 }
 // A 16-sector head cage: the front, side and back are all views of one
 // consistent volume, not several independent flat silhouettes.
 const rings=[
   {y:1.51,w:.28,d:.23,z:-.10},
   {y:1.43,w:.51,d:.43,z:-.10},
   {y:1.15,w:.69,d:.59,z:-.07},
   {y:.79,w:.735,d:.60,z:-.07},
   {y:.58,w:.73,d:.565,z:-.06},
   {y:.39,w:.715,d:.52,z:-.06},
   {y:.12,w:.675,d:.51,z:-.06},
   {y:-.23,w:.55,d:.47,z:-.075},
   {y:-.55,w:.385,d:.40,z:-.09},
   {y:-.77,w:.22,d:.31,z:-.105}
 ];
 const segments=16,vertices=[],triangles=[];
 for(const ring of rings){
   for(let j=0;j<segments;j++){
     const a=j*Math.PI*2/segments;
     let x=Math.sin(a)*ring.w;
     let z=Math.cos(a)*ring.d+ring.z;
     // Recessed eye-plane below the frontal brow ledge.
     const front=Math.cos(a)>.60;
     if(front&&ring.y===.39)z-=.095;
     if(front&&ring.y===.12)z-=.035;
     vertices.push([x,ring.y,z]);
   }
 }
 for(let i=0;i<rings.length-1;i++){
  for(let j=0;j<segments;j++){
   const a=i*segments+j,b=i*segments+(j+1)%segments;
   const c=(i+1)*segments+j,d=(i+1)*segments+(j+1)%segments;
   triangles.push(a,c,b,b,c,d);
  }
 }
 // Cap the upper and lower ends; avoid open rings in side/back views.
 const top=vertices.length;vertices.push([0,1.53,-.10]);
 const bottom=vertices.length;vertices.push([0,-.80,-.105]);
 for(let j=0;j<segments;j++){
   triangles.push(top,j,(j+1)%segments);
   const a=(rings.length-1)*segments+j;
   const b=(rings.length-1)*segments+(j+1)%segments;
   triangles.push(bottom,b,a);
 }
 const geom=new T.BufferGeometry();
 geom.setAttribute('position',new T.Float32BufferAttribute(vertices.flat(),3));
 geom.setIndex(triangles);geom.computeVertexNormals();
 add('01 / 颅骨主壳',geom,C.skull,'skull');

 for(const s of [-1,1]){
   // The eyebrow shelf, cheek wedge and jaw are deliberately distinct
   // connected-looking volumes, with planar turns and mirrored landmarks.
   panel('02 / 眉弓 '+s,[
    [s*.73,.60,.06],[s*.62,.64,.33],[s*.30,.60,.52],
    [s*.135,.54,.55],[s*.28,.48,.55],[s*.56,.48,.42],
    [s*.72,.48,.22]
   ],C.brow,'brow');
   panel('03 / 眼窝 '+s,[
    [s*.17,.46,.532],[s*.36,.47,.522],[s*.61,.46,.37],
    [s*.68,.36,.265],[s*.51,.34,.427],[s*.29,.34,.515],
    [s*.16,.36,.538]
   ],C.eyes,'eyes');
   panel('04 / 太阳穴 '+s,[
    [s*.73,.77,.005],[s*.72,.48,.19],
    [s*.68,.32,.26],[s*.79,.08,.01],
    [s*.72,.58,-.13]
   ],C.temple,'temple');
   panel('05 / 颧骨 '+s,[
    [s*.67,.34,.30],[s*.48,.29,.46],
    [s*.24,.13,.55],[s*.35,-.16,.50],
    [s*.57,-.08,.34],[s*.67,.12,.24]
   ],C.cheek,'cheek');
   panel('06 / 下颌侧面 '+s,[
    [s*.63,.06,.16],[s*.56,-.09,.32],
    [s*.40,-.26,.44],[s*.40,-.56,.29],
    [s*.21,-.76,.20],[s*.50,-.45,.10],
    [s*.58,-.17,-.03]
   ],C.jaw,'jaw');
   panel('07 / 颏侧面 '+s,[
    [s*.40,-.54,.29],[s*.27,-.64,.43],
    [s*.19,-.77,.25],[0,-.78,.29],
    [0,-.60,.46],[s*.23,-.49,.46]
   ],C.chin,'chin');

   // Straight bridge, tapered mid-section, projecting nose tip and two
   // lower side facets. No eyeballs or hair, following the plane study.
   panel('08 / 鼻梁 '+s,[
    [0,.54,.57],[s*.115,.52,.555],
    [s*.10,.25,.69],[s*.135,-.04,.78],
    [0,-.095,.90],[0,.28,.77]
   ],C.nose,'nose');
   panel('09 / 鼻翼 '+s,[
    [s*.135,-.04,.78],[0,-.095,.90],
    [s*.125,-.15,.76],[s*.17,-.13,.60],
    [s*.10,.25,.69]
   ],C.noseSide,'nose');

   const earOuter=[
    [s*.70,.46,-.13],[s*.82,.49,-.12],
    [s*.94,.36,-.13],[s*.965,.14,-.10],
    [s*.87,.005,-.075],[s*.76,.045,-.03],
    [s*.72,.20,.035]
   ];
   const earFront=earOuter.map(([x,y,z])=>[x,y,z+.10]);
   panel('10 / 外耳正面 '+s,earFront,C.ears,'ears');
   panel('11 / 外耳背面 '+s,earOuter,C.temple,'ears');
   for(let i=0;i<earOuter.length;i++){
     const j=(i+1)%earOuter.length;
     panel('12 / 耳轮厚度 '+s+'-'+i,[
       earOuter[i],earOuter[j],earFront[j],earFront[i]
     ],C.ears,'ears');
   }
   panel('13 / 耳甲 '+s,[
     [s*.80,.38,.013],[s*.90,.30,.026],
     [s*.90,.17,.04],[s*.83,.10,.052],
     [s*.78,.19,.067]
   ],C.earInset,'ears');
   panel('14 / 耳屏 '+s,[
     [s*.76,.22,.091],[s*.82,.25,.090],
     [s*.82,.12,.088]
   ],C.ears,'ears');
 }
 // One tiny shadow break for the upper lip, not full lips/eyes.
 panel('15 / 口部基准面',[
   [-.235,-.40,.425],[0,-.42,.488],
   [.235,-.40,.425],[.17,-.48,.44],
   [0,-.50,.466],[-.17,-.48,.44]
 ],0xb0aaa7,'chin');

 function loft(name,levels,sections,color,zone){
   const positions=[],indices=[];
   for(const l of levels){
     for(let j=0;j<sections;j++){
       const a=j*2*Math.PI/sections;
       positions.push(l.w*Math.sin(a),l.y,l.z+l.d*Math.cos(a));
     }
   }
   for(let i=0;i<levels.length-1;i++){
     for(let j=0;j<sections;j++){
       const a=i*sections+j,b=i*sections+(j+1)%sections,
         c=(i+1)*sections+j,d=(i+1)*sections+(j+1)%sections;
       indices.push(a,c,b,b,c,d);
     }
   }
   // Both cut ends are filled to avoid hollow caps in back/top views.
   const t=positions.length/3;positions.push(0,levels[0].y,levels[0].z);
   const b=positions.length/3;const last=levels[levels.length-1];
   positions.push(0,last.y,last.z);
   for(let j=0;j<sections;j++){
     indices.push(t,j,(j+1)%sections);
     const a=(levels.length-1)*sections+j,d=(levels.length-1)*sections+(j+1)%sections;
     indices.push(b,d,a);
   }
   const g=new T.BufferGeometry();
   g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
   g.setIndex(indices);g.computeVertexNormals();
   add(name,g,color,zone);
 }
 loft('16 / 颈部',[
   {y:-.64,w:.25,d:.245,z:-.11},
   {y:-.97,w:.26,d:.26,z:-.13},
   {y:-1.29,w:.275,d:.26,z:-.13},
   {y:-1.53,w:.34,d:.27,z:-.14}
 ],12,C.neck,'neck');
 loft('17 / 斜方肌与肩部截面',[
   {y:-1.29,w:.265,d:.25,z:-.13},
   {y:-1.39,w:.41,d:.28,z:-.13},
   {y:-1.57,w:.92,d:.37,z:-.12},
   {y:-1.68,w:1.04,d:.40,z:-.12},
   {y:-2.08,w:1.10,d:.43,z:-.12}
 ],12,C.shoulders,'shoulders');

 let faces=0;
 for(const m of parts)faces+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;
 function setWire(visible){for(const m of parts)m.getObjectByName('topology').visible=visible;}
 function setZones(visible){
   for(const m of parts)m.material.color.setHex(visible?m.userData.baseColor:C.skull);
 }
 function setPartVisible(zone,visible){for(const m of parts)if(m.userData.zone===zone)m.visible=visible;}
 return {group:root,parts,faces,vertices:parts.reduce((v,m)=>v+m.geometry.attributes.position.count,0),
  setWire,setZones,setPartVisible};
}

export function startHeadPlanes(){
 document.title='基础头部平面 · RoomBoy';
 document.body.classList.add('head-planes-page');
 document.body.innerHTML=[
 '<main class="planes-layout">',
 '<aside class="planes-sidebar">',
 '<a class="planes-back" href="?view=head">← 返回原 GLB 头模实验</a>',
 '<small class="planes-kicker">ROOMBOY / HEAD PLANES · 01</small>',
 '<h1>头部基础平面<span>Basic Planes of the Head</span></h1>',
 '<p class="planes-intro">'+INTRO+'</p>',
 '<section><h2>01 · 九个观察角度</h2>',
 '<div class="planes-views">'+VIEWS.map(v=>'<button type="button" data-view="'+v.id+'">'+v.name+'</button>').join('')+'</div>',
 '<button type="button" id="planes-sheet" class="planes-wide">切换九视图同屏</button>',
 '</section>',
 '<section><h2>02 · 结构检查</h2>',
 '<label><input type="checkbox" id="planes-wire"> 显示真实三角面布线</label>',
 '<label><input type="checkbox" id="planes-parts" checked> 显示分区明暗</label>',
 '<label><input type="checkbox" id="planes-features" checked> 显示五官面片</label>',
 '<label><input type="checkbox" id="planes-bust" checked> 显示颈肩体块</label>',
 '<button type="button" id="planes-reset" class="planes-wide">重置视角</button>',
 '</section>',
 '<section class="planes-notes"><h2>03 · 建模方式</h2>',
 '<p><b>主颅骨：</b>16 扇区 × 10 高度环的封闭笼架。</p>',
 '<p><b>面部：</b>眉弓、眼窝、颧骨、下颌、颏、鼻梁与鼻翼左右镜像分面。</p>',
 '<p><b>耳与肩：</b>耳轮保留厚度；颈部和肩部独立截面连接。</p>',
 '<p>这是一份独立的程序化结构临摹，不是现有 34.5K GLB 的减面版，也未替换 Haru 游戏人物。</p>',
 '</section>',
 '<a class="planes-back" href="?view=structure">查看人体结构研究 ↗</a>',
 '</aside>',
 '<section class="planes-stage" aria-label="可旋转的三维灰模">',
 '<div class="planes-stage-top"><span>PROCEDURAL 3D · ORTHOGRAPHIC</span><span id="planes-mode">左前 3/4</span></div>',
 '<div id="planes-canvas" class="planes-canvas"></div>',
 '<div id="planes-gridlabels" class="planes-gridlabels" hidden></div>',
 '<div class="planes-stage-bottom"><span>拖动旋转 · 滚轮缩放 · 双指缩放</span><span id="planes-count"></span></div>',
 '</section></main>'
 ].join('');
 const holder=document.getElementById('planes-canvas');
 const gridlabels=document.getElementById('planes-gridlabels');
 const modeText=document.getElementById('planes-mode');
 const model=createHeadPlanes(),scene=new T.Scene();
 scene.background=new T.Color(0xf2f0ed);
 scene.add(model.group);
 scene.add(new T.HemisphereLight(0xffffff,0xb1aba4,2.4));
 const key=new T.DirectionalLight(0xffffff,2.7);key.position.set(-3,6,7);scene.add(key);
 const fill=new T.DirectionalLight(0xffffff,.9);fill.position.set(5,3,-5);scene.add(fill);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.outputColorSpace=T.SRGBColorSpace;
 holder.append(renderer.domElement);
 const camera=new T.OrthographicCamera(-2.5,2.5,2.3,-2.3,.1,100);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.dampingFactor=.10;
 controls.target.set(0,-.23,0);controls.minZoom=.65;controls.maxZoom=4;
 controls.enablePan=false;
 let sheet=false,active='frontLeft';
 const center=new T.Vector3(0,-.23,0);
 function placeView(view,cam=camera){
   const p=new T.Vector3(...view.pos).normalize().multiplyScalar(7).add(center);
   cam.position.copy(p);cam.up.set(0,1,0);
   if(view.id==='top')cam.up.set(0,0,-1);
   cam.lookAt(center);
   cam.updateProjectionMatrix();
 }
 function select(id){
   const view=VIEWS.find(v=>v.id===id)||VIEWS[0];
   active=view.id;
   sheet=false;gridlabels.hidden=true;
   controls.enabled=true;
   controls.target.copy(center);
   placeView(view);
   controls.update();
   modeText.textContent=view.name;
   document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===active));
   document.getElementById('planes-sheet').classList.remove('selected');
 }
 const gridCamera=new T.OrthographicCamera(-2,2,2,-2,.1,100);
 function resize(){
   const w=Math.max(1,holder.clientWidth),h=Math.max(1,holder.clientHeight);
   renderer.setSize(w,h,false);
   renderer.domElement.style.width='100%';
   renderer.domElement.style.height='100%';
   const aspect=w/h,span=2.07;
   camera.left=-span*aspect;camera.right=span*aspect;
   camera.top=span;camera.bottom=-span;
   camera.updateProjectionMatrix();
 }
 const observer=new ResizeObserver(resize);observer.observe(holder);resize();
 function renderSheet(){
   const w=holder.clientWidth,h=holder.clientHeight;
   const cw=w/3,ch=h/3;
   renderer.setScissorTest(true);
   for(let i=0;i<VIEWS.length;i++){
     const col=i%3,row=Math.floor(i/3),x=Math.floor(col*cw),
       y=Math.floor(h-(row+1)*ch),
       sw=Math.ceil(cw),sh=Math.ceil(ch);
     renderer.setViewport(x,y,sw,sh);
     renderer.setScissor(x,y,sw,sh);
     const aspect=sw/sh,span=2.10;
     gridCamera.left=-span*aspect;gridCamera.right=span*aspect;
     gridCamera.top=span;gridCamera.bottom=-span;
     gridCamera.zoom=1;
     gridCamera.updateProjectionMatrix();
     placeView(VIEWS[i],gridCamera);
     renderer.render(scene,gridCamera);
   }
   renderer.setScissorTest(false);
 }
 function animate(){
   requestAnimationFrame(animate);
   if(sheet)renderSheet();else{
     controls.update();
     renderer.setViewport(0,0,holder.clientWidth,holder.clientHeight);
     renderer.render(scene,camera);
   }
 }
 document.getElementById('planes-count').textContent=
   model.faces.toLocaleString()+' 三角面 · '+model.parts.length+' 个程序化网格';
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.view)));
 document.getElementById('planes-sheet').addEventListener('click',()=>{
   sheet=!sheet;
   controls.enabled=!sheet;
   gridlabels.hidden=!sheet;
   document.getElementById('planes-sheet').classList.toggle('selected',sheet);
   if(sheet){
     gridlabels.innerHTML=VIEWS.map(v=>'<span>'+v.name+'</span>').join('');
     modeText.textContent='九视图同屏';
     document.querySelectorAll('[data-view]').forEach(b=>b.classList.remove('selected'));
   }else select(active);
 });
 document.getElementById('planes-wire').addEventListener('change',e=>model.setWire(e.target.checked));
 document.getElementById('planes-parts').addEventListener('change',e=>model.setZones(e.target.checked));
 document.getElementById('planes-features').addEventListener('change',e=>{
   for(const zone of ['brow','eyes','temple','cheek','jaw','chin','nose','ears'])
     model.setPartVisible(zone,e.target.checked);
 });
 document.getElementById('planes-bust').addEventListener('change',e=>{
   for(const zone of ['neck','shoulders'])model.setPartVisible(zone,e.target.checked);
 });
 document.getElementById('planes-reset').addEventListener('click',()=>{
   camera.zoom=1;camera.updateProjectionMatrix();select('frontLeft');
 });
 select(new URLSearchParams(location.search).get('angle')||'frontLeft');
 if(new URLSearchParams(location.search).get('grid')==='1')
   document.getElementById('planes-sheet').click();
 animate();
}
