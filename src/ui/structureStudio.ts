import * as T from 'three';
import {bodyPlan,createBodyBlockout,type BodyStage} from '../assets/procedural/bodyBlockout';
import {landmarkNames,sourceJoints} from '../assets/procedural/bodyReference';
import {addLandmarkMarkers,addReferenceProjection,clearStudyGroup} from './structureReference';

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
 let stage:BodyStage=query.get('stage')==='planes'?'planes':'blockout';
 let angle=query.get('angle')??'three',silhouette=false,wire=false,showGuides=true;
 let showPoints=query.get('points')==='1',overlay=false,referenceReady=false,referenceOpacity=.55;
 const ui=document.createElement('section');ui.id='structure-ui';
 ui.innerHTML=`<header><div><small>CHARACTER STUDY · 01</small><h1>先把结构做准</h1><p>原图比例 → 几何体块 → 低面结构</p></div><a href="?view=character">查看旧版 ↗</a></header>
 <nav aria-label="建模阶段"><button data-stage="blockout">01 几何体块</button><button data-stage="planes">02 低面结构</button></nav>
 <nav aria-label="检查视角"><button data-angle="three">三视同屏</button><button data-angle="front">正面</button><button data-angle="side">侧面</button><button data-angle="back">背面</button></nav>
 <nav><button id="structure-silhouette">剪影</button><button id="structure-wire">线框</button><button id="structure-guides" class="active">比例线</button><button id="structure-points">定位点</button><button id="structure-reference">参考图</button><button id="structure-overlay" title="先在参考图中选择本次原设定图" disabled>原图叠合</button></nav>
 <output id="structure-stats"></output>`;
 document.body.append(ui);
 const labels=document.createElement('div');labels.id='structure-labels';document.body.append(labels);
 const panel=document.createElement('aside');panel.id='structure-reference-panel';panel.hidden=true;
 panel.innerHTML='<p>选择原设定或简化图。图片只在当前浏览器读取。原图叠合使用本次 1200 × 800 设定图的固定坐标。</p><input type="file" accept="image/*" aria-label="选择建模参考图"><p id="reference-state"></p><label>叠合强度 <input type="range" min="0.1" max="1" step="0.05" value="0.55" aria-label="叠合强度"></label><img alt="本地建模参考图"><details><summary>定位点坐标</summary><p>定位点是手工读取的约束，不是网格拟合精度报告。格式：编号 / 正面 x,y / 侧面 x。</p><ol>'+Object.entries(sourceJoints).map(([name,p])=>`<li>${landmarkNames[name as keyof typeof sourceJoints]}：${p[0]}, ${p[1]} / ${p[2]}</li>`).join('')+'</ol></details>';document.body.append(panel);
 let referenceURL:string|undefined;
 const referenceImage=panel.querySelector('img')!;
 panel.querySelector<HTMLInputElement>('input[type=file]')!.onchange=e=>{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;if(referenceURL)URL.revokeObjectURL(referenceURL);referenceURL=URL.createObjectURL(file);referenceImage.src=referenceURL;};
 referenceImage.onload=()=>{referenceReady=referenceImage.naturalWidth===1200&&referenceImage.naturalHeight===800;overlay=referenceReady;ui.querySelector<HTMLButtonElement>('#structure-overlay')!.disabled=!referenceReady;panel.querySelector('#reference-state')!.textContent=referenceReady?'已启用固定坐标叠合；请确认这是本次原设定图。':'此尺寸仅作旁置参考；固定坐标叠合需要本次 1200 × 800 原图。';rebuild();};
 panel.querySelector<HTMLInputElement>('input[type=range]')!.oninput=e=>{referenceOpacity=Number((e.target as HTMLInputElement).value);rebuild();};
 const guideMaterial=new T.LineBasicMaterial({color:0xb7b7af,transparent:true,opacity:.55,depthTest:false});
 for(const y of [0,bodyPlan.ankle,bodyPlan.knee,bodyPlan.crotch,bodyPlan.waist,bodyPlan.shoulder,bodyPlan.chin,bodyPlan.height]){
  const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(-1.12,y,-.22),new T.Vector3(1.12,y,-.22)]);
  guides.add(new T.Line(geometry,guideMaterial));
 }
 function resize(){
  const top=capture?0:Math.ceil(ui.getBoundingClientRect().bottom+18);
  const height=capture?innerHeight:Math.max(200,innerHeight-top-50);
  const aspect=innerWidth/height,span=angle==='three'?Math.max(2.04,2.25/aspect):Math.max(2.04,.75/aspect);
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,height);renderer.domElement.style.position='absolute';renderer.domElement.style.top=`${top}px`;
  labels.style.width='100%';labels.querySelectorAll<HTMLElement>('span').forEach((e,i)=>{const x=angle==='three'?(i-1)*.73:0;e.style.left=`${50+x/(span*aspect)*100}%`;});render();
 }
 function render(){renderer.render(scene,camera);}
 function disposeModels(){while(models.children.length){const root=models.children[0];root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});models.remove(root);}}
 function rebuild(){
  clearStudyGroup(overlays);clearStudyGroup(markers);disposeModels();const views=angle==='three'?['front','side','back']:[angle];let triangles=0;
  for(const [i,v] of views.entries()){
   const m=createBodyBlockout(stage);m.position.x=views.length===3?(i-1)*.73:0;m.rotation.y=v==='side'?-Math.PI/2:v==='back'?Math.PI:0;
   triangles=m.userData.triangles;
   m.traverse(o=>{if(o instanceof T.Mesh){const mat=o.material as T.MeshStandardMaterial;mat.wireframe=wire;mat.transparent=overlay;mat.opacity=overlay?.60:1;if(silhouette){const flat=new T.MeshBasicMaterial({color:0x303636,wireframe:wire,transparent:overlay,opacity:overlay?.60:1});mat.dispose();o.material=flat;}}});models.add(m);
   if(overlay&&referenceReady)addReferenceProjection(overlays,referenceImage,v,m.position.x,referenceOpacity);
   if(showPoints){const marker=new T.Group();marker.position.copy(m.position);marker.rotation.copy(m.rotation);addLandmarkMarkers(marker);markers.add(marker);}
  }
  guides.visible=showGuides;
  labels.innerHTML=views.map(v=>`<span>${({front:'正面',side:'侧面',back:'背面'} as Record<string,string>)[v]}</span>`).join('');
  labels.style.width=views.length===3?'min(94vw, 900px)':'100%';
  ui.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b=>b.classList.toggle('active',b.dataset.stage===stage));
  ui.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.classList.toggle('active',b.dataset.angle===angle));
  ui.querySelector('#structure-points')!.classList.toggle('active',showPoints);ui.querySelector('#structure-overlay')!.classList.toggle('active',overlay);
  ui.querySelector('output')!.textContent=`${triangles.toLocaleString()} 三角面 / 人物 · 正交投影 · ${(bodyPlan.height/(bodyPlan.height-bodyPlan.chin)).toFixed(1)} 头身 · 静态结构研究`;
  const url=new URL(location.href);url.searchParams.set('stage',stage);url.searchParams.set('angle',angle);history.replaceState(null,'',url);
  resize();
 }
 ui.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b=>b.onclick=()=>{stage=b.dataset.stage as BodyStage;rebuild();});
 ui.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.onclick=()=>{angle=b.dataset.angle!;rebuild();});
 function toggle(id:string,get:()=>boolean,set:(v:boolean)=>void){ui.querySelector<HTMLButtonElement>(id)!.onclick=e=>{set(!get());(e.target as HTMLElement).classList.toggle('active',get());rebuild();};}
 toggle('#structure-silhouette',()=>silhouette,v=>{silhouette=v;});toggle('#structure-wire',()=>wire,v=>{wire=v;});toggle('#structure-guides',()=>showGuides,v=>{showGuides=v;});
 toggle('#structure-points',()=>showPoints,v=>{showPoints=v;});toggle('#structure-overlay',()=>overlay,v=>{overlay=v;});
 ui.querySelector<HTMLButtonElement>('#structure-reference')!.onclick=()=>{panel.hidden=!panel.hidden;};
 if(capture){ui.hidden=true;labels.hidden=true;guides.visible=false;showGuides=false;}
 window.addEventListener('resize',resize);rebuild();
}
