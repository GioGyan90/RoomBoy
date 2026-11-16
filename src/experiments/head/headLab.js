import * as T from 'three';
import {SVGRenderer} from 'three/examples/jsm/renderers/SVGRenderer.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {buildHeadData,headGeometry,cageGeometry,defaults} from './boyHead.js';
import {glbSections} from './glbOutline.js';
import {makeEdgeLowpolyData,lowpolyStats,serializeLowpolyHead,referenceEdgeStations,sourceReference} from './edgeLowpoly.js';
import {loadReferenceParts,makeReferenceGroup,referenceCounts,serializeReferenceToJS} from './referenceCopy.js';
import {createParameterPanel} from './parameterPanel.js';
import {createBoyHeadLowpolyMesh,createBoyHeadLowpolyWire} from '../../assets/procedural/boyHeadLowpoly.js';
import './headLab.css';

export function startHeadLab(){
 document.title='少年头部 · RoomBoy 建模实验';
 document.body.innerHTML=`<main class="head-lab"><aside><a class="back" href="?view=structure">← 人体结构研究</a><small>ROOMBOY / FORM STUDY 02</small><h1>少年头部<span>形体 · 布线实验</span></h1><p class="intro">GLB 轮廓对齐版 · 支持逐顶点高模对比。<br>无头发 · 无颈部 · 暂不添加眼球</p><section><h2>01 / 建模阶段</h2><div class="stages"><button data-stage="1">基础形体 <em>颅骨 / 下颌</em></button><button data-stage="2">五官平面 <em>鼻 / 口 / 耳</em></button><button class="selected" data-stage="3">眼眶布线 <em>开口 / 眼睑厚度</em></button></div></section><section><h2>02 / 观察视角</h2><div class="views"><button data-view="front">正面</button><button data-view="quarter" class="selected">45°</button><button data-view="side">侧面</button><button data-view="back">背面</button></div><div class="toggles"><label><input id="wire" type="checkbox"> 逻辑布线</label><label><input id="regions" type="checkbox"> 结构分区</label><label><input id="reference-outline" type="checkbox"> GLB 轮廓对照</label></div></section><section><h2>03 / 形体参数</h2><div id="sliders"></div><button id="reset">恢复 GLB 对齐头型</button><button id="head-export-lowpoly" type="button">导出低面 JS 头像</button><p id="head-edge-info" class="head-edge-info"></p></section><section class="reference-compare"><h2>04 / 精确 GLB 顶点副本</h2><p>导入原始 GLB 后，右侧以 JavaScript 复制全部表面顶点及三角面，与左侧低模并排显示；两者共用视角。</p><label class="head-file-label">选择参考 GLB<input type="file" id="head-reference-file" accept=".glb,model/gltf-binary"></label><label class="head-compare-toggle"><input id="head-compare" type="checkbox" disabled> 左右并排比较</label><button id="head-export-js" type="button" disabled>导出完整顶点 JS 模块</button><p id="head-reference-status" role="status">尚未导入原始 GLB。文件仅在当前浏览器处理，不会上传服务器。</p></section><p class="note">青色参考线仅在正面、侧面显示，表示参考模型的截面包络，排除耳部。眼眶保留开口；尚未进入表情绑定。</p><output id="stats"></output></aside><div class="head-stage"><header><span>低面灰模 <b> / 03</b></span><a href="?">返回房间 ↗</a></header><div id="head-canvas"></div><footer><span>单指拖动旋转 · 双指缩放</span><span id="view-label">45° / 正交投影</span></footer></div></main>`;
 const holder=document.querySelector('#head-canvas');
 const scene=new T.Scene();scene.background=new T.Color('#ecece6');
 const camera=new T.OrthographicCamera(-2,2,1.65,-1.65,.1,50);
 let renderer;try{renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;}catch{renderer=new SVGRenderer();renderer.setQuality('high');document.querySelector('.head-stage header span').insertAdjacentHTML('beforeend',' <small>兼容预览</small>');}holder.append(renderer.domElement);renderer.domElement.style.touchAction='none';
 scene.add(new T.AmbientLight(0xffffff,.65));
 const light=new T.DirectionalLight(0xffffff,.85);light.position.set(-3,5,6);scene.add(light);
 const fill=new T.DirectionalLight(0xffffff,.25);fill.position.set(4,1,-3);scene.add(fill);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.08,0);controls.enablePan=false;controls.enableDamping=true;controls.minZoom=.65;controls.maxZoom=2.8;
 const group=new T.Group();scene.add(group);
 let referenceGroup=null,referenceParts=null;
 const compareToggle=document.querySelector('#head-compare');
 function applyCompare(){
  const enabled=Boolean(referenceGroup&&compareToggle.checked);
  group.position.x=enabled?-1.26:0;
  if(referenceGroup){referenceGroup.position.x=1.26;referenceGroup.visible=enabled;}
  camera.zoom=enabled?.55:1;
  camera.updateProjectionMatrix();
  document.querySelector('.head-stage').classList.toggle('is-comparing',enabled);
  document.querySelector('#view-label').title=enabled?'左：可编辑低面少年头；右：GLB 全顶点 JS 副本':'';
 }
 let stage=3,params={...defaults},activeLowpoly=null;
 function rebuild(){
  while(group.children.length){const o=group.children[0];group.remove(o);o.geometry?.dispose();o.material?.dispose();}
  const data=makeEdgeLowpolyData(params,stage);
  activeLowpoly=data;
  // Use the exact reusable scene asset, not a duplicate experimental render mesh.
  const mesh=createBoyHeadLowpolyMesh({data,regionColors:document.querySelector('#regions').checked});
  const g=mesh.geometry;
  group.add(mesh);
  // Interior surface only, not an eyeball or a cap over the eye opening.
  group.add(new T.Mesh(headGeometry({...data,faces:data.faces.map(f=>[...f].reverse())}),new T.MeshBasicMaterial({color:0x777c78,side:T.FrontSide})));
  const wire=createBoyHeadLowpolyWire(data);wire.visible=document.querySelector('#wire').checked;group.add(wire);
  if(document.querySelector('#reference-outline').checked){
   const name=document.querySelector('[data-view].selected')?.dataset.view,points=[];
   if(name==='front'||name==='side')for(let i=1;i<glbSections.length;i++)for(const side of [-1,1]){
    for(const row of [glbSections[i-1],glbSections[i]])points.push(...(name==='front'?[side*row[1],row[0],1.6]:[1.6,row[0],side===1?row[2]:row[3]]));
   }
   const lineGeometry=new T.BufferGeometry();lineGeometry.setAttribute('position',new T.Float32BufferAttribute(points,3));
   const overlay=new T.LineSegments(lineGeometry,new T.LineBasicMaterial({color:0x008fbe,depthTest:false,transparent:true,opacity:.85}));overlay.renderOrder=10;group.add(overlay);
  }
  document.querySelector('#stats').textContent=`${data.vertices.length} 控制点 · ${g.attributes.position.count/3} 三角面 · 无细分`;
  document.querySelector('.head-stage header b').textContent=' / 0'+stage;
  const stats=lowpolyStats(data);
  document.querySelector('#head-edge-info').textContent='匹配原 GLB 的 '+sourceReference.measuredSections+' 层边缘测量 · '+referenceEdgeStations().length+' 个主要转折站位。当前 '+stats.vertices+' 个逻辑顶点 / '+stats.triangles+' 面；原始模型 '+sourceReference.triangles.toLocaleString()+' 面。';
 }
 const positions={front:[0,.08,6],quarter:[3,.45,5],side:[6,.08,0],back:[0,.08,-6]};
 function view(name){camera.position.set(...positions[name]);controls.target.set(0,.08,0);camera.zoom=1;applyCompare();controls.update();document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===name));document.querySelector('#view-label').textContent=({front:'正面',quarter:'45°',side:'侧面',back:'背面'})[name]+' / 正交投影';if(group.children.length)rebuild();}
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));
 document.querySelectorAll('[data-stage]').forEach(b=>b.onclick=()=>{stage=Number(b.dataset.stage);parameterUI.setStage(stage);document.querySelectorAll('[data-stage]').forEach(x=>x.classList.toggle('selected',x===b));rebuild();});
 for(const id of ['wire','regions','reference-outline'])document.getElementById(id).onchange=rebuild;
 const parameterUI=createParameterPanel(document.querySelector('#sliders'),next=>{params=next;rebuild();});
 document.querySelector('#reset').onclick=()=>parameterUI.reset();
 document.querySelector('#head-export-lowpoly').onclick=()=>{
  if(!activeLowpoly)return;
  const contents=serializeLowpolyHead(activeLowpoly);
  const url=URL.createObjectURL(new Blob([contents],{type:'text/javascript;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='room-boy-glb-edge-lowpoly.js';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 };
 compareToggle.onchange=applyCompare;
 const status=document.querySelector('#head-reference-status');
 const exportButton=document.querySelector('#head-export-js');
 document.querySelector('#head-reference-file').onchange=async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  if(!file.name.toLowerCase().endsWith('.glb')){status.textContent='请选择 .glb 二进制模型。';return;}
  if(!(renderer instanceof T.WebGLRenderer)){status.textContent='精确高模需要 WebGL；当前浏览器处于 SVG 兼容渲染模式。';return;}
  status.textContent='正在本地解码 GLB 并逐顶点复制，请保持页面打开…';
  exportButton.disabled=true;
  try{
   const parts=await loadReferenceParts(await file.arrayBuffer());
   const next=makeReferenceGroup(parts);
   const counts=referenceCounts(parts);
   if(referenceGroup){scene.remove(referenceGroup);referenceParts?.forEach(p=>p.geometry.dispose());referenceGroup.children.forEach(m=>m.material.dispose());}
   referenceParts=parts;referenceGroup=next;scene.add(referenceGroup);
   compareToggle.disabled=false;compareToggle.checked=true;exportButton.disabled=false;
   applyCompare();
   status.textContent='完整 JS 副本：'+counts.vertices.toLocaleString()+' 顶点 / '+Math.round(counts.triangles).toLocaleString()+' 三角面 · '+parts.length+' 个网格。与左侧低模共用相机。';
  }catch(error){status.textContent='导入失败：'+(error?.message||String(error));console.error(error);}
 };
 exportButton.onclick=()=>{
  if(!referenceParts)return;
  status.textContent='正在生成完整的 JS 顶点模块…';
  try{
   const source=serializeReferenceToJS(referenceParts);
   const url=URL.createObjectURL(new Blob([source],{type:'text/javascript;charset=utf-8'}));
   const a=document.createElement('a');a.href=url;a.download='room-boy-head-glb-vertex-copy.js';document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
   const counts=referenceCounts(referenceParts);
   status.textContent='已生成 JS 模块（'+counts.vertices.toLocaleString()+' 个顶点）。它可独立于原始 GLB 使用。';
  }catch(error){status.textContent='JS 导出失败：'+(error?.message||String(error));console.error(error);}
 };
 function resize(){const w=holder.clientWidth,h=holder.clientHeight;renderer.setSize(w,h);camera.left=-1.5*w/h;camera.right=1.5*w/h;camera.top=1.5;camera.bottom=-1.5;camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(holder);view('front');rebuild();resize();
 function frame(){controls.update();renderer.render(scene,camera);requestAnimationFrame(frame);}frame();
}
