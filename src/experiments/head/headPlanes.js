import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import './headPlanes.css';
import {createHeadPlanes} from './headPlanesGeometry.js';

// Rebuilt from explicit left-front silhouette landmarks, then mirrored and depth-fitted.
// Standalone and GLB-free; the old pasted feature geometry has been removed.
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
const INTRO='已废弃旧版椭球加浮动五官贴片。新模型按参考图正面左半端点布线、共用中线镜像，再以侧面及背面轮廓赋予同一网格深度。';
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
 '<section><h2>01 · 建模过程（可逐步检查）</h2>',
 '<div class="planes-stages"><button type="button" data-stage="half">01 左半边端点</button><button type="button" data-stage="mirror">02 镜像正面</button><button type="button" data-stage="volume" class="selected">03 深度与背面</button></div>',
 '<p id="planes-step-note" class="planes-step-note">完整体积：正面共边网格 + 侧面深度 + 后脑与颈肩。</p>',
 '</section>',
 '<section><h2>02 · 九个观察角度</h2>',
 '<div class="planes-views">'+VIEWS.map(v=>'<button type="button" data-view="'+v.id+'">'+v.name+'</button>').join('')+'</div>',
 '<button type="button" id="planes-sheet" class="planes-wide">切换九视图同屏</button>',
 '</section>',
 '<section><h2>03 · 结构检查</h2>',
 '<label><input type="checkbox" id="planes-wire"> 显示真实三角面布线</label>',
 '<label><input type="checkbox" id="planes-parts" checked> 显示分区明暗</label>',
 '<label><input type="checkbox" id="planes-features" checked> 五官区域明暗（无独立贴片）</label>',
 '<label><input type="checkbox" id="planes-bust" checked> 显示颈肩表面</label>',
 '<button type="button" id="planes-reset" class="planes-wide">重置视角</button>',
 '</section>',
 '<section class="planes-notes"><h2>04 · 顶点与拼接方式</h2>',
 '<p><b>正面左半：</b>12 条解剖高度线 × 6 个横向端点，共 72 个显式坐标。</p>',
 '<p><b>镜像：</b>右半网格取左半 X 的负值，X=0 的正中点只保留一份索引。</p>',
 '<p><b>体积：</b>围绕两侧轮廓向后增加截面，头、下颌、颈肩为一张共边表面；耳部是封闭独立体块。</p>',
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
 let model=createHeadPlanes(),scene=new T.Scene();
 scene.background=new T.Color(0xf2f0ed);
 scene.add(model.group);
 scene.add(new T.HemisphereLight(0xffffff,0xb1aba4,1.45));
 const key=new T.DirectionalLight(0xffffff,1.95);key.position.set(-3,6,7);scene.add(key);
 const fill=new T.DirectionalLight(0xffffff,.65);fill.position.set(5,3,-5);scene.add(fill);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:false});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.outputColorSpace=T.SRGBColorSpace;
 holder.append(renderer.domElement);
 const camera=new T.OrthographicCamera(-2.5,2.5,2.3,-2.3,.1,100);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.enableDamping=true;controls.dampingFactor=.10;
 controls.target.set(0,-.40,0);controls.minZoom=.65;controls.maxZoom=4;
 controls.enablePan=false;
 let sheet=false,active='frontLeft';
 const center=new T.Vector3(0,-.40,0);
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
   const aspect=w/h,span=2.15;
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
     const aspect=sw/sh,span=2.18;
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
 function updateCounts(){
   document.getElementById('planes-count').textContent=
     model.faces.toLocaleString()+' 三角面 · '+model.parts.length+' 个结构网格';
 }
 function applyToggles(){
   model.setWire(document.getElementById('planes-wire').checked);
   model.setZones(document.getElementById('planes-parts').checked);
   model.setPartVisible('brow',document.getElementById('planes-features').checked);
   const showBust=document.getElementById('planes-bust').checked;
   model.setPartVisible('neck',showBust);
   model.setPartVisible('shoulders',showBust);
 }
 const stageNotes={
   half:'仅显示原始左半面：12 × 6 个端点和共边布线；右半面尚未创建。',
   mirror:'以 X=0 为缝合中轴镜像，完成两侧一致的正面；尚未包围后脑。',
   volume:'正面端点保持不变，加入真实侧面深度、后脑体积和连续颈肩截面。'
 };
 function changeStage(stage){
   scene.remove(model.group);
   model.group.traverse(object=>{
     if(object.geometry)object.geometry.dispose();
     const ms=Array.isArray(object.material)?object.material:[object.material];
     for(const material of ms)if(material)material.dispose();
   });
   model=createHeadPlanes({stage});
   center.y=stage==='volume'?-.40:.50;
   scene.add(model.group);
   document.querySelectorAll('[data-stage]').forEach(b=>b.classList.toggle('selected',b.dataset.stage===stage));
   document.getElementById('planes-step-note').textContent=stageNotes[stage];
   document.getElementById('planes-bust').disabled=stage!=='volume';
   applyToggles();updateCounts();
   if(stage!=='volume'){
     camera.zoom=1.2;camera.updateProjectionMatrix();
     select('front');
   }else{
     camera.zoom=1;camera.updateProjectionMatrix();
     select('frontLeft');
   }
 }
 document.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>changeStage(b.dataset.stage)));
 updateCounts();
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
 document.getElementById('planes-features').addEventListener('change',e=>model.setPartVisible('brow',e.target.checked));
 document.getElementById('planes-bust').addEventListener('change',e=>{
   for(const zone of ['neck','shoulders'])model.setPartVisible(zone,e.target.checked);
 });
 document.getElementById('planes-reset').addEventListener('click',()=>{
   camera.zoom=1;camera.updateProjectionMatrix();select('frontLeft');
 });
 const initialStage=new URLSearchParams(location.search).get('stage');
 if(initialStage==='half'||initialStage==='mirror')changeStage(initialStage);
 else select(new URLSearchParams(location.search).get('angle')||'frontLeft');
 if(new URLSearchParams(location.search).get('grid')==='1')
   document.getElementById('planes-sheet').click();
 animate();
}
