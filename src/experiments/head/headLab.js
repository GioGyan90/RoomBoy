import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {loadReferenceParts,makeReferenceGroup,referenceCounts} from './referenceCopy.js';
import {HEAD_REGIONS,HEAD_FAMILIES} from './headRegions.js';
import './headLab.css';

// Directly clipped from the real QEM-30K head at the bounding-box X median.
// The negative X half is retained; the positive half is an EXACT mirrored
// vertex/triangle copy sharing the 655 center-plane vertices.
export const compressedHeadAsset = Object.freeze({
 path:'heads/grey-head-qem-symmetric.glb',
 originalPath:'heads/grey-head-qem-30000.glb',
 sourceSha256:'cc1500ea406241ce7f43e5c1873ebceb42cce5f9e8390347cfb6943e33751817',
 sourceVertices:797528,sourceFaces:1424998,
 baseFaces:30000,vertices:31357,faces:34500,halfFaces:17250,
 seamVertices:655,bytes:1167696
});

function countsFromModel(root){
 let vertices=0,faces=0;
 root.traverse(o=>{
  if(!o.isMesh)return;
  const g=o.geometry,pos=g?.getAttribute('position');
  if(!pos)return;
  vertices+=pos.count;
  faces+=(g.index?.count??pos.count)/3;
 });
 return {vertices,faces};
}

export function startHeadLab(){
 document.title='GLB 实际减面 · RoomBoy 少年头部';
 document.body.innerHTML=`<main class="head-lab">
 <aside>
  <a class="back" href="?view=structure">← 人体结构研究</a>
  <small>ROOMBOY / ORIGINAL MESH REDUCTION</small>
  <h1>少年头部<span>30K GLB · 精确镜像对称版</span></h1>
  <p class="intro">真实 GLB 网格减面 → X 中线裁切 → 镜像焊接<br>沿中线共享顶点，左右形体与三角面完全对称</p>
  <section><h2>01 / 网格统计</h2>
   <dl class="head-stat-grid">
    <div><dt>原始三角面</dt><dd>1,424,998</dd></div>
    <div><dt>对称后总面数</dt><dd id="head-face-count">34,500</dd></div>
    <div><dt>对称后顶点</dt><dd id="head-vertex-count">31,357</dd></div>
    <div><dt>中心线焊接点</dt><dd>655</dd></div>
   </dl>
   <p class="ratio">沿 X ≈ 0 对称切割 · 每侧 17,250 面 · 中线 593 条边全部焊合 · 相对 142.5 万面原模减少约 97.58%</p>
   <a class="head-download" id="head-model-download" href="./heads/grey-head-qem-symmetric.glb" download>下载对称 GLB · 1.11 MB</a>
   <a class="head-original-link" href="./heads/grey-head-qem-30000.glb" download>保留的原始 30K 减面版（未对称）</a>
  </section>
  <section><h2>02 / 观察视角</h2>
   <div class="views"><button data-view="front">正面</button><button data-view="quarter" class="selected">45°</button><button data-view="side">侧面</button><button data-view="back">背面</button></div>
   <div class="toggles">
    <label><input id="head-wire" type="checkbox"> 显示原网格边线</label>
    <label><input id="head-flat" type="checkbox"> 三角面平面着色</label>
    <label><input id="head-axis" type="checkbox" checked> 标示 X=0 对称轴</label>
    <label><input id="head-split" type="checkbox"> 分开展示左右半边</label>
   </div>
  </section>
  <section><h2>03 / 和原模型对比</h2>
   <p>可导入本机原始 GLB，并排检查同视角的眼眶、鼻口、耳廓和颅骨。原始文件不会上传。</p>
   <label class="head-file-label">选择原始高模 GLB<input type="file" id="head-source-file" accept=".glb,model/gltf-binary"></label>
   <label class="head-compare-toggle"><input id="head-compare" type="checkbox" disabled> 并排对照原模型</label>
   <p id="head-status" role="status">正在加载仓库内的精确镜像对称 GLB…</p>
  </section>
  <section class="head-regions"><h2>04 / 逆向工程 · 结构分块</h2>
   <p>以对称 GLB 的真实面片为依据，拆成可单独编辑的 23 个网格。每个部件保留母版的顶点和三角面索引映射。</p>
   <label class="head-part-switch"><input id="head-parts-mode" type="checkbox"> 显示结构分块（不修改母版）</label>
   <label class="head-part-range">分离距离 <input id="head-parts-distance" type="range" min="0" max="80" value="0" step="1">
    <output id="head-parts-distance-label">0.00</output></label>
   <div class="head-part-options"><label><input id="head-parts-outline" type="checkbox" checked> 显示分块边界</label>
    <label><input id="head-parts-isolate" type="checkbox"> 仅显示选中块</label></div>
   <label class="head-part-target-label">聚焦部位 <select id="head-part-target"><option value="">全部分块</option></select></label>
   <div id="head-parts-list" class="head-parts-list"></div>
   <button id="head-export-part" type="button" class="head-export-part" disabled>导出选中分块 GLB</button>
   <a class="head-download" href="./heads/grey-head-qem-symmetric.parts.glb" download>下载 23 分块 GLB</a>
   <a class="head-part-manifest" href="./heads/grey-head-qem-symmetric.parts.json" download>下载源顶点 / 三角面索引映射 JSON</a>
   <p id="head-parts-status" role="status">正在加载 23 个独立网格部件…</p>
  </section>
  <section class="head-lod"><h2>05 / 真实分区减面 · 10K 对照</h2>
   <p>以 34,500 面对称母版的原始三角形为输入，按 23 个语义区域约束 QEM 折边，再精确镜像拼接。没有重建颅骨壳或叠加五官面片。</p>
   <label class="head-part-switch"><input id="head-lod-toggle" type="checkbox" disabled> 预览 10,000 面分区减面版</label>
   <label class="head-compare-toggle"><input id="head-lod-compare" type="checkbox" disabled> 与原 34,500 面母版并排对照</label>
   <a class="head-download" href="./heads/grey-head-region-lod-v1.glb" download>下载 10K 连续索引 GLB</a>
   <a class="head-original-link" href="./heads/grey-head-region-lod-v1.parts.glb" download>下载 23 个减面结构分块 GLB</a>
   <a class="head-part-manifest" href="./heads/grey-head-region-lod-v1.report.json" download>下载减面、边界与拓扑报告</a>
   <p id="head-lod-status" role="status">正在检查 10K 减面资产…</p>
  </section>
  <p class="note">从原 30K 网格直接切割镜像，保留原始面片，切口共享同一组顶点而非盖上中间平面。两半可分开检查。灰模材质不包含原 KTX2 贴图；暂不更换 Haru 的绑定头部。</p>
 </aside>
 <div class="head-stage"><header><span>GLB 半边镜像 / <b>34.5K</b></span><a href="?">返回房间</a></header><div id="head-canvas"></div>
 <footer><span>拖动旋转 · 滚轮缩放</span><span id="view-label">45° · 正交投影</span></footer></div>
 </main>`;

 const status=document.querySelector('#head-status');
 const holder=document.querySelector('#head-canvas');
 const wireToggle=document.querySelector('#head-wire'),flatToggle=document.querySelector('#head-flat');
 const axisToggle=document.querySelector('#head-axis'),splitToggle=document.querySelector('#head-split');
 const compareToggle=document.querySelector('#head-compare');
 const partsToggle=document.querySelector('#head-parts-mode');
 const distanceSlider=document.querySelector('#head-parts-distance');
 const outlineToggle=document.querySelector('#head-parts-outline');
 const isolateToggle=document.querySelector('#head-parts-isolate');
 const targetSelect=document.querySelector('#head-part-target');
 const partsStatus=document.querySelector('#head-parts-status');
 const lodToggle=document.querySelector('#head-lod-toggle');
 const lodCompareToggle=document.querySelector('#head-lod-compare');
 const lodStatus=document.querySelector('#head-lod-status');
 lodToggle.checked=new URLSearchParams(location.search).get('mode')==='lod';
 const exportPartButton=document.querySelector('#head-export-part');
 const partsVisible=new Set(HEAD_REGIONS.map(r=>r.id));
 let partsGroup=null,partMeshes=new Map();
 const scene=new T.Scene();scene.background=new T.Color('#eaede9');
 const camera=new T.OrthographicCamera(-2,2,1.5,-1.5,.1,50);
 let renderer;
 try {
  renderer=new T.WebGLRenderer({antialias:true});
 } catch(error){
  status.textContent='此高模减面预览需要 WebGL。请开启浏览器硬件加速。';
  return;
 }
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.setSize(Math.max(holder.clientWidth,1),Math.max(holder.clientHeight,1));
 holder.append(renderer.domElement);
 renderer.domElement.style.touchAction='none';

 scene.add(new T.AmbientLight(0xffffff,.62));
 const key=new T.DirectionalLight(0xffffff,.85);key.position.set(-3,5,6);scene.add(key);
 const fill=new T.DirectionalLight(0xffffff,.25);fill.position.set(4,1,-4);scene.add(fill);
 const controls=new OrbitControls(camera,renderer.domElement);
 controls.target.set(0,.07,0);controls.enablePan=false;controls.enableDamping=true;
 controls.minZoom=.48;controls.maxZoom=3;
 let reducedGroup=null,splitGroup=null,referenceGroup=null,referenceParts=null,viewName='quarter';
 let lodGroup=null;
 const heads=new T.Group();scene.add(heads);
 const symmetryAxis=new T.Line(
  new T.BufferGeometry().setFromPoints([new T.Vector3(0,-1.05,.93),new T.Vector3(0,1.25,.93)]),
  new T.LineDashedMaterial({color:0x0b8eae,dashSize:.045,gapSize:.027,depthTest:false,transparent:true,opacity:.9})
 );
 symmetryAxis.name='X=0 symmetry axis';symmetryAxis.computeLineDistances();symmetryAxis.renderOrder=20;heads.add(symmetryAxis);
 function buildSplitHalves(root){
  const pieces=new T.Group();pieces.name='Symmetry cut / inspect left and right';
  root.traverse(o=>{
   if(!o.isMesh||!o.geometry)return;
   const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry;
   const position=g.getAttribute('position'),normal=g.getAttribute('normal');
   const half=[{positions:[],normals:[]},{positions:[],normals:[]}];
   for(let i=0;i<position.count;i+=3){
    const x=position.getX(i)+position.getX(i+1)+position.getX(i+2);
    const target=half[x<0?0:1];
    for(let j=i;j<i+3;j++){
     target.positions.push(position.getX(j),position.getY(j),position.getZ(j));
     if(normal)target.normals.push(normal.getX(j),normal.getY(j),normal.getZ(j));
    }
   }
   half.forEach((piece,index)=>{
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.Float32BufferAttribute(piece.positions,3));
    if(normal)geometry.setAttribute('normal',new T.Float32BufferAttribute(piece.normals,3));
    else geometry.computeVertexNormals();
    const material=o.material.clone();
    const mesh=new T.Mesh(geometry,material);
    mesh.name=index===0?'left-half: original negative-X':'right-half: exact mirror';
    mesh.position.x=index===0?-.20:.20;
    pieces.add(mesh);
   });
   if(g!==o.geometry)g.dispose();
  });
  return pieces;
 }

 function setCompare(){
  const lodOn=Boolean(lodGroup&&lodToggle.checked);
  const nativeComparison=Boolean(lodOn&&lodCompareToggle.checked);
  const loadedComparison=Boolean(referenceGroup&&compareToggle.checked&&!nativeComparison);
  const enabled=nativeComparison||loadedComparison;
  const segmented=Boolean(partsGroup&&partsToggle.checked);
  const separated=Boolean(splitGroup&&splitToggle.checked&&!segmented&&!lodOn);
  if(reducedGroup){
   reducedGroup.position.x=nativeComparison?1.25:loadedComparison?-1.25:0;
   reducedGroup.visible=(nativeComparison||(!lodOn&&!segmented&&!separated));
  }
  if(lodGroup){
   lodGroup.position.x=enabled?-1.25:0;
   lodGroup.visible=lodOn&&!segmented&&!separated;
  }
  if(splitGroup){splitGroup.position.x=loadedComparison?-1.25:0;splitGroup.visible=separated;}
  if(partsGroup){partsGroup.position.x=loadedComparison?-1.25:0;partsGroup.visible=segmented;}
  if(referenceGroup){referenceGroup.position.x=1.25;referenceGroup.visible=loadedComparison;}
  symmetryAxis.visible=axisToggle.checked&&(viewName==='front'||viewName==='quarter')&&!enabled;
  camera.zoom=enabled?.78:segmented&&Number(distanceSlider.value)>0?.84:separated?.84:1;
  camera.updateProjectionMatrix();
  document.querySelector('.head-stage').classList.toggle('is-comparing',enabled);
  document.querySelector('.head-stage').classList.toggle('is-split',separated&&!enabled);
  document.querySelector('.head-stage').classList.toggle('is-parts',segmented&&!enabled);
 }
 function syncWire(){
  if(!reducedGroup)return;
  for(const root of [reducedGroup,splitGroup,partsGroup,lodGroup]){
   if(!root)continue;
   root.traverse(o=>{
   if(!o.isMesh)return;
   const existing=o.getObjectByName('lowpoly-edges');
   if(existing){o.remove(existing);existing.geometry.dispose();existing.material.dispose();}
   if(wireToggle.checked){
    const edges=new T.LineSegments(new T.EdgesGeometry(o.geometry,14),new T.LineBasicMaterial({color:0x425e5b,transparent:true,opacity:.42}));
    edges.name='lowpoly-edges';o.add(edges);
   }
   if(o.material){
    o.material.flatShading=flatToggle.checked;
    o.material.needsUpdate=true;
   }
   });
  }
 }
 const directions={front:[0,.08,6],quarter:[3,.5,5],side:[6,.08,0],back:[0,.08,-6]};
 function changeView(name){
  viewName=name;
  camera.position.set(...directions[name]);
  controls.target.set(0,.07,0);
  setCompare();controls.update();
  document.querySelectorAll('[data-view]').forEach(btn=>btn.classList.toggle('selected',btn.dataset.view===name));
  document.querySelector('#view-label').textContent=({front:'正面',quarter:'45°',side:'侧面',back:'背面'})[name]+' · 正交投影';
 }
 document.querySelectorAll('[data-view]').forEach(btn=>btn.onclick=()=>changeView(btn.dataset.view));
 wireToggle.onchange=syncWire;flatToggle.onchange=syncWire;compareToggle.onchange=setCompare;
 axisToggle.onchange=setCompare;
 splitToggle.onchange=()=>{
  if(splitToggle.checked){partsToggle.checked=false;lodToggle.checked=false;}
  setCompare();
 };
 lodToggle.onchange=()=>{
  if(lodToggle.checked){partsToggle.checked=false;splitToggle.checked=false;}
  setCompare();syncWire();
  const count=lodToggle.checked?'10,000 面分区约束版':'34,500 面原对称母版';
  document.querySelector('#head-face-count').textContent=lodToggle.checked?'10,000':'34,500';
  lodStatus.textContent='当前显示：'+count+'。可切换并排对照、视角与原网格线框。';
 };
 lodCompareToggle.onchange=setCompare;
 function updatePartMeshes(){
  const focus=targetSelect.value,solo=isolateToggle.checked;
  exportPartButton.disabled=!focus||!partMeshes.has(focus);
  const amount=Number(distanceSlider.value)*.01;
  document.querySelector('#head-parts-distance-label').textContent=amount.toFixed(2);
  for(const r of HEAD_REGIONS){
   const mesh=partMeshes.get(r.id);
   if(!mesh)continue;
   const focused=!focus||r.id===focus;
   mesh.visible=partsVisible.has(r.id)&&(!solo||focused);
   mesh.position.set(r.direction[0]*amount,r.direction[1]*amount,r.direction[2]*amount);
   const opacity=focus&&!focused&&!solo?.2:1;
   mesh.material.transparent=opacity<1;
   mesh.material.opacity=opacity;
   mesh.material.depthWrite=opacity===1;
   mesh.material.needsUpdate=true;
   const border=mesh.getObjectByName('part-boundary');
   if(border)border.visible=outlineToggle.checked;
  }
  setCompare();
 }
 function buildPartControlList(counts){
  const container=document.querySelector('#head-parts-list');
  container.replaceChildren();
  targetSelect.replaceChildren(new Option('全部分块',''));
  for(const family of HEAD_FAMILIES){
   const list=HEAD_REGIONS.filter(r=>r.family===family);
   const details=document.createElement('details');details.open=true;
   const title=document.createElement('summary');
   title.textContent=family+' · '+list.reduce((n,r)=>n+(counts[r.id]||0),0).toLocaleString()+' 面';
   details.append(title);
   for(const region of list){
    const line=document.createElement('label');line.className='head-part-row';
    const check=document.createElement('input');check.type='checkbox';check.checked=true;
    check.onchange=()=>{
     if(check.checked)partsVisible.add(region.id);else partsVisible.delete(region.id);
     partsToggle.checked=true;splitToggle.checked=false;updatePartMeshes();
    };
    const swatch=document.createElement('i');swatch.style.backgroundColor='#'+region.color.toString(16).padStart(6,'0');
    const name=document.createElement('span');name.textContent=region.label;
    const quantity=document.createElement('small');quantity.textContent=(counts[region.id]||0).toLocaleString();
    line.append(check,swatch,name,quantity);details.append(line);
    targetSelect.add(new Option(region.label,region.id));
   }
   container.append(details);
  }
 }
 partsToggle.checked=new URLSearchParams(location.search).get('mode')==='parts';
 partsToggle.onchange=()=>{
  if(partsToggle.checked){splitToggle.checked=false;lodToggle.checked=false;}
  setCompare();
 };
 distanceSlider.oninput=()=>updatePartMeshes();
 outlineToggle.onchange=()=>updatePartMeshes();
 isolateToggle.onchange=()=>updatePartMeshes();
 targetSelect.onchange=()=>{
  if(targetSelect.value)partsToggle.checked=true;
  updatePartMeshes();
 };
 exportPartButton.onclick=()=>{
  const id=targetSelect.value,source=partMeshes.get(id);
  if(!source)return;
  exportPartButton.disabled=true;
  const clone=source.clone(false);
  clone.visible=true;clone.position.set(0,0,0);
  clone.material=source.material.clone();
  clone.material.opacity=1;clone.material.transparent=false;clone.material.depthWrite=true;
  new GLTFExporter().parse(clone,data=>{
   const bytes=data instanceof ArrayBuffer?data:null;
   if(!bytes){partsStatus.textContent='独立 GLB 导出失败：未生成二进制数据。';exportPartButton.disabled=false;return;}
   const url=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'}));
   const a=document.createElement('a');a.download='room-boy-head-'+id+'.glb';a.href=url;document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1500);
   clone.material.dispose();
   exportPartButton.disabled=false;
   partsStatus.textContent='已导出 '+id+' 的独立可编辑 GLB。原始母版和其他分块未修改。';
  },error=>{
   clone.material.dispose();exportPartButton.disabled=false;
   partsStatus.textContent='分块导出失败：'+(error?.message||String(error));
  },{binary:true,onlyVisible:false});
 };

 document.querySelector('#head-source-file').onchange=async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  if(!file.name.toLowerCase().endsWith('.glb')){status.textContent='请选择 .glb 文件。';return;}
  status.textContent='正在本地解码原始 GLB（约 142.5 万面）…';
  try{
   const parts=await loadReferenceParts(await file.arrayBuffer());
   const next=makeReferenceGroup(parts);
   next.traverse(o=>{if(o.isMesh)o.material.color.set('#c2c3bf');});
   if(referenceGroup){heads.remove(referenceGroup);referenceParts?.forEach(p=>p.geometry.dispose());referenceGroup.traverse(o=>{if(o.isMesh)o.material.dispose();});}
   referenceGroup=next;referenceParts=parts;heads.add(next);
   compareToggle.disabled=false;compareToggle.checked=true;
   setCompare();
   const c=referenceCounts(parts);
   status.textContent='已载入原 GLB：'+c.vertices.toLocaleString()+' 顶点 / '+Math.round(c.triangles).toLocaleString()+' 面。左为减面，右为原模型。';
  }catch(error){
   console.error(error);status.textContent='原 GLB 解码失败：'+(error?.message||String(error));
  }
 };

 const loader=new GLTFLoader();
 const partUrl=import.meta.env.BASE_URL+'heads/grey-head-qem-symmetric.parts.glb';
 loader.load(partUrl,gltf=>{
  partsGroup=gltf.scene;
  partsGroup.name='RoomBoy | 23 independently editable anatomical blocks';
  const counts={};
  partsGroup.traverse(mesh=>{
   if(!mesh.isMesh)return;
   const region=HEAD_REGIONS.find(r=>r.id===mesh.name);
   if(!region)return;
   const original=mesh.material;
   mesh.material=new T.MeshLambertMaterial({color:region.color,side:T.DoubleSide});
   if(original)for(const m of Array.isArray(original)?original:[original])m.dispose();
   mesh.castShadow=mesh.receiveShadow=true;
   const boundary=new T.LineSegments(
    new T.EdgesGeometry(mesh.geometry,165),
    new T.LineBasicMaterial({color:0x304f55,transparent:true,opacity:.75,depthTest:true})
   );
   boundary.name='part-boundary';mesh.add(boundary);
   partMeshes.set(region.id,mesh);
   counts[region.id]=(mesh.geometry.index?.count??mesh.geometry.getAttribute('position').count)/3;
  });
  if(partMeshes.size!==HEAD_REGIONS.length||Object.values(counts).reduce((sum,n)=>sum+n,0)!==34500){
   partsStatus.textContent='分块资产的部件数或三角面数量不符，请重新生成。';
   return;
  }
  buildPartControlList(counts);
  heads.add(partsGroup);
  syncWire();updatePartMeshes();
  partsStatus.textContent='23 个独立分块已就绪 · 共 34,500 面 · 左右 7 组配对 · 可以隔离、分离、逐块导出。';
 },undefined,error=>{
  console.error(error);partsStatus.textContent='分块 GLB 加载失败：'+(error?.message||String(error));
 });
 const url=import.meta.env.BASE_URL+compressedHeadAsset.path;
 loader.load(url,gltf=>{
  reducedGroup=gltf.scene;
  reducedGroup.name='source-glb-qem-30000';
  reducedGroup.traverse(o=>{
   if(!o.isMesh)return;
   const old=o.material;
   o.material=new T.MeshLambertMaterial({color:0xc2c4c1,side:T.DoubleSide});
   if(old)for(const m of Array.isArray(old)?old:[old])m.dispose();
  });
  const c=countsFromModel(reducedGroup);
  if(c.vertices!==compressedHeadAsset.vertices||c.faces!==compressedHeadAsset.faces){
   status.textContent='减面 GLB 的顶点/面数不符，请检查仓库资产。';return;
  }
  splitGroup=buildSplitHalves(reducedGroup);
  heads.add(reducedGroup,splitGroup);syncWire();changeView('quarter');
  document.querySelector('#head-face-count').textContent=c.faces.toLocaleString();
  document.querySelector('#head-vertex-count').textContent=c.vertices.toLocaleString();
  status.textContent='已加载由真实 GLB 切割镜像的 34,500 面头模：沿中线无裂缝，可用“分开展示左右半边”检查。';
 },undefined,error=>{
  console.error(error);status.textContent='加载仓库模型失败：'+(error?.message||String(error));
 });
 const lodUrl=import.meta.env.BASE_URL+'heads/grey-head-region-lod-v1.glb';
 loader.load(lodUrl,gltf=>{
  const next=gltf.scene;
  const c=countsFromModel(next);
  if(c.faces!==10000){lodStatus.textContent='10K GLB 面数不符，已禁用预览。';return;}
  next.name='RoomBoy | constrained indexed region QEM LOD';
  next.traverse(o=>{
   if(!o.isMesh)return;
   const old=o.material;
   o.material=new T.MeshLambertMaterial({color:0xc2c4c1,side:T.DoubleSide});
   if(old)for(const m of Array.isArray(old)?old:[old])m.dispose();
  });
  lodGroup=next;heads.add(next);
  lodToggle.disabled=false;lodCompareToggle.disabled=false;
  syncWire();setCompare();
  lodStatus.textContent='已载入真实源网格减面版：10,000 面 / '+c.vertices.toLocaleString()+' 个顶点。可与 34,500 面母版并排检查。';
 },undefined,error=>{
  lodStatus.textContent='分区减面 GLB 加载失败：'+(error?.message||String(error));
 });
 function resize(){
  const w=Math.max(holder.clientWidth,1),h=Math.max(holder.clientHeight,1);
  renderer.setSize(w,h,false);
  camera.left=-1.5*w/h;camera.right=1.5*w/h;camera.top=1.5;camera.bottom=-1.5;
  camera.updateProjectionMatrix();
 }
 const observer=new ResizeObserver(resize);observer.observe(holder);
 changeView('quarter');resize();
 function animate(){controls.update();renderer.render(scene,camera);requestAnimationFrame(animate);}animate();
}
