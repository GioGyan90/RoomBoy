import * as T from 'three';
import type {Actions} from '../game/actions';
import type {createCameraController} from '../core/camera';
import type {Character} from '../assets/procedural/character';
export function createReview(scene:T.Scene,room:T.Group,character:Character,controller:ReturnType<typeof createCameraController>,actions:Actions){
 const query=new URLSearchParams(location.search);let view=query.get('view')??'game';let angle=query.get('angle')??'front';
 const ui=document.createElement('div');ui.id='review-controls';ui.innerHTML='<button data-view="game">游玩</button><button data-view="room">房间</button><button data-view="character">人物</button><button data-view="face">脸部</button><button id="compare-toggle">概念图对照</button>';
 const structureLink=document.createElement('a');structureLink.href='?view=structure';structureLink.textContent='结构研究 ↗';ui.append(structureLink);document.body.append(ui);
 const angles=document.createElement('div');angles.id='character-angles';angles.innerHTML='<button data-angle="front">正面</button><button data-angle="side">侧面</button><button data-angle="back">背面</button>';document.body.append(angles);
 const panel=document.createElement('aside');panel.id='reference-panel';panel.hidden=true;
 const image=document.createElement('img');image.alt='用户提供的原始概念图，仅用于对照';panel.append(image);
 const text=document.createElement('div');text.textContent='选择参考图进行对照 · 图片仅在当前浏览器使用';panel.append(text);
 const picker=document.createElement('input');picker.type='file';picker.accept='image/*';picker.setAttribute('aria-label','选择参考图');panel.append(picker);document.body.append(panel);
 const references=new Map<string,string>();
 const referenceKey=()=>['character','face'].includes(view)?'character':'room';
 function displayReference(){const src=references.get(referenceKey());if(src){image.src=src;image.hidden=false;}else{image.removeAttribute('src');image.hidden=true;}}
 picker.addEventListener('change',()=>{const file=picker.files?.[0];if(!file)return;const key=referenceKey(),old=references.get(key);if(old)URL.revokeObjectURL(old);references.set(key,URL.createObjectURL(file));displayReference();});
 const studio=new T.Group();scene.add(studio);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0xa9afaf,roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;studio.add(floor);
 function apply(next:string){
  view=next;character.J.lHand.position.z=0;character.J.rHand.position.z=0;const close=view==='face',portrait=view==='character'||close;
  if(portrait){actions.cancel();character.body.rotation.x=0;character.body.position.y=.95;}
  room.visible=!portrait;studio.visible=portrait;scene.background=new T.Color(portrait?0xa9afaf:0x202731);character.charRoot.visible=view!=='room';
  character.plumbob.visible=view==='game';character.plumbobLight.visible=view==='game';
  character.charRoot.position.set(portrait?0:-.15,0,portrait?0:.75);character.charRoot.rotation.y=portrait?0:.22;
  const state=portrait?{theta:angle==='side'?Math.PI/2:angle==='back'?Math.PI:(close?.35:0),phi:close?1.46:1.52,radius:close?.49:2.72,target:new T.Vector3(0,close?1.65:.91,0)}:{theta:.02,phi:1.50,radius:4.10,target:new T.Vector3(0,1.16,-1.1)};
  if(view==='game'){state.theta=.17;state.phi=1.25;state.radius=5.5;state.target.set(0,.95,0);}
  for(const obj of [controller.camGoal,controller.camState]){obj.theta=state.theta;obj.phi=state.phi;obj.radius=state.radius;obj.target.copy(state.target);}
  angles.hidden=!portrait||query.get('capture')==='1';
  angles.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.classList.toggle('active',b.dataset.angle===angle));
  displayReference();
  ui.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  document.querySelector<HTMLElement>('#hint')!.style.display=(portrait||query.get('capture')==='1')?'none':'';
  if(query.get('capture')==='1'){ui.hidden=true;document.querySelector<HTMLElement>('#hud')!.hidden=true;document.querySelector<HTMLElement>('#hint')!.hidden=true;}
 }
 ui.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.addEventListener('click',()=>apply(b.dataset.view!)));
 angles.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(b=>b.addEventListener('click',()=>{angle=b.dataset.angle!;apply(view);}));
 ui.querySelector('#compare-toggle')!.addEventListener('click',()=>{panel.hidden=!panel.hidden;});
 apply(view);
 function pose(){
  if(!['character','face'].includes(view))return;
  const j=character.J;
  for(const name of ['pelvis','spine','chest','neck','head','lThigh','rThigh','lShin','rShin','lFoot','rFoot'])j[name].rotation.set(0,0,0);
  j.lUpperArm.rotation.set(0,0,.035);j.rUpperArm.rotation.set(0,0,-.035);
  j.lForeArm.rotation.set(-.045,0,0);j.rForeArm.rotation.set(-.045,0,0);
  j.lHand.rotation.set(-.02,0,.02);j.rHand.rotation.set(-.02,0,-.02);
  j.lFoot.rotation.y=.08;j.rFoot.rotation.y=-.08;
 }
 return {pose,get view(){return view;},get portrait(){return view==='character'||view==='face';}};
}
