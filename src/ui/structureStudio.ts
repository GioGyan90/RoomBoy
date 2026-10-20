import * as T from 'three';
import {bodyPlan,createBodyBlockout,type BodyStage} from '../assets/procedural/bodyBlockout';
import {landmarkNames,sourceJoints,viewJoints,type StudyView} from '../assets/procedural/bodyReference';
import {addLandmarkMarkers,addViewTargets,addReferenceProjection,clearStudyGroup} from './structureReference';

/** Independent static modelling studio. Does not alter the playable rig. */
export function startStructureStudio(){
 const query=new URLSearchParams(location.search),capture=query.get('capture')==='1';
 document.querySelectorAll<HTMLElement>('#hud,#hint,#pie,#loader').forEach(e=>e.remove());
 document.body.classList.add('structure-studio');
 const scene=new T.Scene();scene.background=new T.Color(0xf2f1ec);
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;document.body.append(renderer.domElement);
 scene.add(new T.HemisphereLight(0xffffff,0xc4c0b8,2.2));
 const key=new T.DirectionalLight(0xffffff,2.5);key.position.set(-3,5,6);scene.add(key);
 const fill=new T.DirectionalLight(0xffffff,.8);fill.position.set(4,2,-2);scene.add(fill);
 const camera=new T.OrthographicCamera(-1.2,1.2,1.2,-1.2,.1,20);camera.position.set(0,.90,5);camera.lookAt(0,.90,0);
 const models=new T.Group(),guides=new T.Group(),overlays=new T.Group(),markers=new T.Group();scene.add(models,guides,overlays,markers);
 let stage:BodyStage='blockout';
 let focus=query.get('focus')??'body';
 let angle=query.get('angle')??'three',silhouette=false,wire=false,showGuides=true;
 let showPoints=query.get('points')==='1',overlay=false,referenceReady=false,referenceOpacity=.55,paired=false;let labelPositions:number[]=[];
 const ui=document.createElement('section');ui.id='structure-ui';
 ui.innerHTML=`<header><div><small>CHARACTER STUDY · 01</small><h1>先把结构做准</h1><p>当前基准：彩色几何体块简化图 → 先完成体块对齐</p></div><a href="?view=character">查看旧版 ↗</a></header>
 <nav aria-label="建模阶段"><button data-stage="blockout">01 几何体块</button><button data-stage="planes" disabled title="完成简化体块对齐后再进入低面细化">02 低面结构</button></nav>
 <nav aria-label="检查视角"><button data-angle="three">三视同屏</button><button data-angle="front">正面</button><button data-angle="side">侧面</button><button data-angle="back">背面</button><button data-angle="quarter">前斜侧</button><button data-angle="rear-quarter">后斜侧</button></nav>
 <nav aria-label="局部放大"><button data-focus="body">全身</button><button data-focus="neck">颈胸放大</button><button data-focus="hips">臀腿放大</button></nav>
 <nav><button id="structure-silhouette">剪影</button><button id="structure-wire">线框</button><button id="structure-guides" class="active">比例线</button><button id="structure-points">定位点</button><button id="structure-reference">参考图</button><button id="structure-paired" disabled>并排对照</button><button id="structure-overlay" title="先在参考图中选择当前简化体块三视图" disabled>简化图叠合</button></nav>
 <output id="structure-stats"></output>`;
 document.body.append(ui);
 const labels=document.createElement('div');labels.id='structure-labels';document.body.append(labels);
 const panel=document.createElement('aside');panel.id='structure-reference-panel';panel.hidden=true;
 panel.innerHTML='<p>选择几何体块简化图。图片只在当前浏览器读取。简化图叠合使用当前 1536 × 1024 几何体块图的固定坐标。</p><input type="file" accept="image/*" aria-label="选择建模参考图"><p id="reference-state"></p><label>叠合强度 <input type="range" min="0.1" max="1" step="0.05" value="0.55" aria-label="叠合强度"></label><img alt="本地建模参考图"><details><summary>定位点坐标</summary><p>绿点读取实际网格端面/截面；紫色十字为各角度独立简化图定点。RMS 只统计定点投影，不代表整个轮廓相似度。格式：编号 / 正面 x,y / 侧面 x / 背面 x,y（不可见则省略）。</p><ol>'+Object.entries(sourceJoints).map(([name,p])=>`<li>${landmarkNames[name as keyof typeof sourceJoints]}：${p[0]}, ${p[1]} / ${p[2]} / ${viewJoints[name as keyof typeof sourceJoints].back?.join(", ")??"—"}</li>`).join('')+'</ol></details>';document.body.append(panel);
 let referenceURL:string|undefined;
 const referenceImage=panel.querySelector('img')!;
 panel.querySelector<HTMLInputElement>('input[type=file]')!.onchange=e=>{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;if(referenceURL)URL.revokeObjectURL(referenceURL);referenceURL=URL.createObjectURL(file);referenceImage.src=referenceURL;};
 referenceImage.onload=()=>{referenceReady=referenceImage.naturalWidth===1536&&referenceImage.naturalHeight===1024;overlay=referenceReady&&!['quarter','rear-quarter'].includes(angle);if(!referenceReady)paired=false;ui.querySelector<HTMLButtonElement>('#structure-paired')!.disabled=!referenceReady;ui.querySelector<HTMLButtonElement>('#structure-overlay')!.disabled=!referenceReady;panel.querySelector('#reference-state')!.textContent=referenceReady?'已启用固定坐标叠合；请确认这是当前简化体块三视图。':'此尺寸仅作旁置参考；固定坐标叠合需要当前 1536 × 1024 几何体块图。';rebuild();};
 panel.querySelector<HTMLInputElement>('input[type=range]')!.oninput=e=>{referenceOpacity=Number((e.target as HTMLInputElement).value);rebuild();};
 const guideMaterial=new T.LineBasicMaterial({color:0xb7b7af,transparent:true,opacity:.55,depthTest:false});
 for(const y of [0,bodyPlan.ankle,bodyPlan.knee,bodyPlan.crotch,bodyPlan.waist,bodyPlan.shoulder,bodyPlan.chin,bodyPlan.height]){
  const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(-1.12,y,-.22),new T.Vector3(1.12,y,-.22)]);
  guides.add(new T.Line(geometry,guideMaterial));
 }
 function resize(){
  const top=capture?0:Math.ceil(ui.getBoundingClientRect().bottom+18);
  const height=capture?innerHeight:Math.max(200,innerHeight-top-50);
  const aspect=innerWidth/height,baseSpan=focus==='body'?2.04:.62,minWidth=focus==='body'?2.25:1.55,span=angle==='three'?Math.max(baseSpan,(paired?4.8:minWidth)/aspect):Math.max(baseSpan,(paired?1.25:.65)/aspect);
  const center=focus==='neck'?1.5:focus==='hips'?.95:.90;camera.position.set(0,center,5);camera.lookAt(0,center,0);
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,height);renderer.domElement.style.position='absolute';renderer.domElement.style.top=`${top}px`;
  labels.style.width='100%';labels.querySelectorAll<HTMLElement>('span').forEach((e,i)=>{const x=labelPositions[i]??0;e.style.left=`${50+x/(span*aspect)*100}%`;});render();
 }
 function render(){renderer.render(scene,camera);}
 function disposeModels(){clearStudyGroup(models);}
 function rebuild(){
  clearStudyGroup(overlays);clearStudyGroup(markers);disposeModels();const views=angle==='three'?['front','side','back']:[angle];let triangles=0;let fitText="";labelPositions=[];const labelTexts:string[]=[];
  for(const [i,v] of views.entries()){
   const m=createBodyBlockout(stage);const origin=views.length===3?(i-1)*(paired?1.55:focus==='body'?.73:.52):0;const referenceOffset=origin-(paired?.36:0);m.position.x=origin+(paired?.36:0);m.rotation.y=v==='side'?-Math.PI/2:v==='back'?Math.PI:v==='quarter'?-Math.PI/4:v==='rear-quarter'?Math.PI*.75:0;const canonical=['front','side','back'].includes(v);
   triangles=m.userData.triangles;fitText=(Object.entries(m.userData.fitReport) as [string,{rms:number}][]).map(([v,r])=>`${({front:"正",side:"侧",back:"背"} as Record<string,string>)[v]} ${r.rms.toFixed(2)}`).join(" / ");
   m.traverse(o=>{if(o instanceof T.Mesh){const materials=Array.isArray(o.material)?o.material:[o.material];for(const material of materials){const mat=material as T.MeshStandardMaterial;mat.wireframe=wire;mat.transparent=overlay&&!paired;mat.opacity=overlay&&!paired?.60:1;}if(silhouette){for(const mat of materials)mat.dispose();o.material=new T.MeshBasicMaterial({color:0x303636,wireframe:wire,transparent:overlay&&!paired,opacity:overlay&&!paired?.60:1});}}});models.add(m);
   if(canonical&&(overlay||paired)&&referenceReady)addReferenceProjection(overlays,referenceImage,v,referenceOffset,paired?1:referenceOpacity);
   const viewLabel=({front:'正面',side:'侧面',back:'背面',quarter:'前斜侧','rear-quarter':'后斜侧'} as Record<string,string>)[v];if(paired){labelPositions.push(referenceOffset,m.position.x);labelTexts.push(`${viewLabel} · 简化图`,`${viewLabel} · 模型`);}else{labelPositions.push(m.position.x);labelTexts.push(viewLabel);}
   if(showPoints){const marker=new T.Group();marker.position.copy(m.position);marker.rotation.copy(m.rotation);addLandmarkMarkers(marker,m.userData.landmarks,(canonical?v:'front') as StudyView);markers.add(marker);if(canonical)addViewTargets(markers,m.userData.landmarks,v as StudyView,paired?referenceOffset:m.position.x,!paired);}
  }
  guides.visible=showGuides;
  labels.innerHTML=labelTexts.map(label=>`<span>${label}</span>`).join('');
  labels.style.width=views.length===3?'min(94vw, 900px)':'100%';
  ui.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach(b=>b.classList.toggle('active',b.dataset.focus===focus));
  ui.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b=>b.classList.toggle('active',b.dataset.stage===stage));
  ui.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.classList.toggle('active',b.dataset.angle===angle));
  const canCompare=referenceReady&&!['quarter','rear-quarter'].includes(angle);ui.querySelector<HTMLButtonElement>('#structure-overlay')!.disabled=!canCompare;ui.querySelector<HTMLButtonElement>('#structure-paired')!.disabled=!canCompare;
  ui.querySelector('#structure-points')!.classList.toggle('active',showPoints);ui.querySelector('#structure-overlay')!.classList.toggle('active',overlay);ui.querySelector('#structure-paired')!.classList.toggle('active',paired);
  ui.querySelector('output')!.textContent=`${triangles.toLocaleString()} 三角面 / 人物 · 正交投影 · ${(bodyPlan.height/(bodyPlan.height-bodyPlan.chin)).toFixed(1)} 头身 · 定点 RMS：${fitText} px`;
  const url=new URL(location.href);url.searchParams.set('focus',focus);url.searchParams.set('stage',stage);url.searchParams.set('angle',angle);history.replaceState(null,'',url);
  resize();
 }
 ui.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b=>b.onclick=()=>{stage=b.dataset.stage as BodyStage;rebuild();});
 ui.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach(b=>b.onclick=()=>{focus=b.dataset.focus!;ui.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach(x=>x.classList.toggle('active',x===b));rebuild();});
 ui.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.onclick=()=>{angle=b.dataset.angle!;if(['quarter','rear-quarter'].includes(angle)){paired=false;overlay=false;}rebuild();});
 function toggle(id:string,get:()=>boolean,set:(v:boolean)=>void){ui.querySelector<HTMLButtonElement>(id)!.onclick=e=>{set(!get());(e.target as HTMLElement).classList.toggle('active',get());rebuild();};}
 toggle('#structure-silhouette',()=>silhouette,v=>{silhouette=v;});toggle('#structure-wire',()=>wire,v=>{wire=v;});toggle('#structure-guides',()=>showGuides,v=>{showGuides=v;});
 toggle('#structure-paired',()=>paired,v=>{paired=v;});toggle('#structure-points',()=>showPoints,v=>{showPoints=v;});toggle('#structure-overlay',()=>overlay,v=>{overlay=v;});
 ui.querySelector<HTMLButtonElement>('#structure-reference')!.onclick=()=>{panel.hidden=!panel.hidden;};
 if(capture){ui.hidden=true;labels.hidden=true;guides.visible=false;showGuides=false;}
 window.addEventListener('resize',resize);rebuild();
}
