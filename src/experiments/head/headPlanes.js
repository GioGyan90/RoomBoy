import * as T from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import './headPlanes.css';
import {createHeadPlanes} from './headPlanesGeometry.js';

// A standalone JS-only study based on the broad forms of a nine-angle
// "Basic Planes of the Head" drawing. No GLB is read or modified.
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
