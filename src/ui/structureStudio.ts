import * as T from 'three';
import {bodyPlan,createBodyBlockout,type BodyStage} from '../assets/procedural/bodyBlockout';

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
 const models=new T.Group(),guides=new T.Group();scene.add(models,guides);
 let stage:BodyStage=query.get('stage')==='planes'?'planes':'blockout';
 let angle=query.get('angle')??'three',silhouette=false,wire=false,showGuides=true;
 const ui=document.createElement('section');ui.id='structure-ui';
 ui.innerHTML=`<header><div><small>CHARACTER STUDY · 01</small><h1>先把结构做准</h1><p>原图比例 → 几何体块 → 低面结构</p></div><a href="?view=character">查看旧版 ↗</a></header>
 <nav aria-label="建模阶段"><button data-stage="blockout">01 几何体块</button><button data-stage="planes">02 低面结构</button></nav>
 <nav aria-label="检查视角"><button data-angle="three">三视同屏</button><button data-angle="front">正面</button><button data-angle="side">侧面</button><button data-angle="back">背面</button></nav>
 <nav><button id="structure-silhouette">剪影</button><button id="structure-wire">线框</button><button id="structure-guides" class="active">比例线</button><button id="structure-reference">参考图</button></nav>
 <output id="structure-stats"></output>`;
 document.body.append(ui);
 const labels=document.createElement('div');labels.id='structure-labels';document.body.append(labels);
 const panel=document.createElement('aside');panel.id='structure-reference-panel';panel.hidden=true;
 panel.innerHTML='<p>选择原设定或生成的简化图，对照检查。图片只在当前浏览器读取。</p><input type="file" accept="image/*" aria-label="选择建模参考图"><img alt="本地建模参考图">';document.body.append(panel);
 let referenceURL:string|undefined;
 panel.querySelector('input')!.onchange=e=>{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;if(referenceURL)URL.revokeObjectURL(referenceURL);referenceURL=URL.createObjectURL(file);panel.querySelector('img')!.src=referenceURL;};
 const guideMaterial=new T.LineBasicMaterial({color:0xb7b7af,transparent:true,opacity:.55,depthTest:false});
 for(const y of [0,bodyPlan.ankle,bodyPlan.knee,bodyPlan.crotch,bodyPlan.waist,bodyPlan.shoulder,bodyPlan.chin,bodyPlan.height]){
  const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(-1.12,y,-.22),new T.Vector3(1.12,y,-.22)]);
  guides.add(new T.Line(geometry,guideMaterial));
 }
 function resize(){
  const height=capture?innerHeight:Math.max(240,innerHeight-260);
  const aspect=innerWidth/height,span=angle==='three'?Math.max(2.04,2.25/aspect):Math.max(2.04,.75/aspect);
  camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,height);renderer.domElement.style.position='absolute';renderer.domElement.style.top=capture?'0':'210px';
  labels.style.width='100%';labels.querySelectorAll<HTMLElement>('span').forEach((e,i)=>{const x=angle==='three'?(i-1)*.73:0;e.style.left=`${50+x/(span*aspect)*100}%`;});render();
 }
 function render(){renderer.render(scene,camera);}
 function disposeModels(){while(models.children.length){const root=models.children[0];root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as T.Material).dispose();}});models.remove(root);}}
 function rebuild(){
  disposeModels();const views=angle==='three'?['front','side','back']:[angle];let triangles=0;
  for(const [i,v] of views.entries()){
   const m=createBodyBlockout(stage);m.position.x=views.length===3?(i-1)*.73:0;m.rotation.y=v==='side'?-Math.PI/2:v==='back'?Math.PI:0;
   triangles=m.userData.triangles;
   m.traverse(o=>{if(o instanceof T.Mesh){const mat=o.material as T.MeshStandardMaterial;mat.wireframe=wire;if(silhouette){const flat=new T.MeshBasicMaterial({color:0x303636,wireframe:wire});mat.dispose();o.material=flat;}}});models.add(m);
  }
  guides.visible=showGuides;
  labels.innerHTML=views.map(v=>`<span>${({front:'正面',side:'侧面',back:'背面'} as Record<string,string>)[v]}</span>`).join('');
  labels.style.width=views.length===3?'min(94vw, 900px)':'100%';
  ui.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b=>b.classList.toggle('active',b.dataset.stage===stage));
  ui.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.classList.toggle('active',b.dataset.angle===angle));
  ui.querySelector('output')!.textContent=`${triangles.toLocaleString()} 三角面 / 人物 · 正交投影 · 约 7.5 头身 · 静态结构研究`;
  const url=new URL(location.href);url.searchParams.set('stage',stage);url.searchParams.set('angle',angle);history.replaceState(null,'',url);
  resize();
 }
 ui.querySelectorAll<HTMLButtonElement>('[data-stage]').forEach(b=>b.onclick=()=>{stage=b.dataset.stage as BodyStage;rebuild();});
 ui.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.onclick=()=>{angle=b.dataset.angle!;rebuild();});
 function toggle(id:string,get:()=>boolean,set:(v:boolean)=>void){ui.querySelector<HTMLButtonElement>(id)!.onclick=e=>{set(!get());(e.target as HTMLElement).classList.toggle('active',get());rebuild();};}
 toggle('#structure-silhouette',()=>silhouette,v=>{silhouette=v;});toggle('#structure-wire',()=>wire,v=>{wire=v;});toggle('#structure-guides',()=>showGuides,v=>{showGuides=v;});
 ui.querySelector<HTMLButtonElement>('#structure-reference')!.onclick=()=>{panel.hidden=!panel.hidden;};
 if(capture){ui.hidden=true;labels.hidden=true;guides.visible=false;showGuides=false;}
 window.addEventListener('resize',resize);rebuild();
}
