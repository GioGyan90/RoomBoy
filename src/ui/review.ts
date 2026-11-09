import * as T from 'three';
import type {Actions} from '../game/actions';
import type {createCameraController} from '../core/camera';
import type {Character} from '../assets/procedural/character';
import {addLighting} from '../core/lighting';
import {rooms,type RoomId,type RoomLayout} from '../game/rooms';
export function createReview(scene:T.Scene,room:T.Group,character:Character,controller:ReturnType<typeof createCameraController>,actions:Actions,roomBackground:T.Color,roomTools:HTMLElement,roomId:RoomId){
 const profile=rooms[roomId];
 // Review-only camera stations. Never insert camera meshes into the playable scene.
 const reviewStations=[
  {id:'overview',label:'全景',theta:-.398,phi:1.062,zoom:1,target:[0,1.3,0]},
  {id:'bed',label:'卧室',theta:-.24,phi:1.13,zoom:.68,target:[-.33,1.2,-1.95]},
  {id:'entry-landing',label:'玄关落脚区',theta:-1.13,phi:1.19,zoom:.43,target:[-4.70,1.10,-1.75]},
  {id:'entry-aisle',label:'入口通道',theta:-.85,phi:.96,zoom:.55,target:[-3.04,1.03,-1.38]},
  {id:'bed-foot-clearance',label:'床尾净空',theta:-.43,phi:1.19,zoom:.46,target:[-.55,.75,.62]},
  {id:'bed-tv-alignment',label:'床尾电视正视',theta:0,phi:1.35,zoom:.52,target:[-.33,1.36,2.90]},
  {id:'bed-tv-side',label:'电视墙侧视',theta:.67,phi:1.22,zoom:.40,target:[-.33,1.47,3.52]},
  {id:'vanity-sink-top',label:'洗手盆俯视',theta:-.35,phi:.40,zoom:.24,target:[-3.09,.96,1.24]},
  {id:'tub-fill-joint',label:'浴缸注水连接',theta:-.65,phi:1.27,zoom:.22,target:[-5.13,.89,1.66]},
  {id:'entry-to-bath',label:'玄关到卫浴',theta:-1.00,phi:.73,zoom:.66,target:[-2.60,.95,1.32]},
  {id:'bath',label:'卫浴',theta:-.72,phi:.94,zoom:.55,target:[-4.15,1.05,2.25]},
  {id:'ocean',label:'海景舷窗',theta:-.62,phi:1.09,zoom:.68,target:[5.44,1.72,-1.55]},
  {id:'top',label:'俯视',theta:-.35,phi:.25,zoom:1.05,target:[0,0,0]},
  {id:'table',label:'茶几低角度',theta:.32,phi:1.35,zoom:.37,target:[3.53,.48,1.94]},
  {id:'toilet',label:'马桶低角度',theta:-.85,phi:1.33,zoom:.28,target:[-3,.48,3.1]},
  {id:'bath-door-bedroom',label:'卫浴门外正视',theta:-1.22,phi:1.18,zoom:.32,target:[-2.45,1.22,2.85]},
  {id:'bath-door-bathroom',label:'卫浴门内斜视',theta:1.34,phi:1.24,zoom:.34,target:[-2.55,1.18,2.85]},
  {id:'bath-door-top',label:'卫浴门洞俯视',theta:-1.27,phi:.35,zoom:.39,target:[-2.50,.70,2.88]},
  {id:'bath-tub-attachments',label:'浴缸水件近景',theta:-.77,phi:1.12,zoom:.28,target:[-4.9,1.14,1.77]},
  {id:'bath-shower-side',label:'卫浴水件侧视',theta:1.08,phi:1.15,zoom:.32,target:[-5.13,1.45,1.35]},
  {id:'side',label:'侧面检查',theta:1.0,phi:1.19,zoom:.88,target:[0,1.1,0]},
  {id:'bed-left',label:'左床头柜',theta:-.32,phi:1.15,zoom:.32,target:[-2.15,.67,-3.06]},
  {id:'bed-right',label:'右床头柜',theta:.32,phi:1.15,zoom:.32,target:[1.49,.67,-3.06]},
  {id:'service-bar',label:'独立酒柜',theta:-.15,phi:1.18,zoom:.43,target:[-3.58,1.05,-3.25]},
  {id:'balcony-door',label:'海景玻璃门',theta:-.65,phi:1.18,zoom:.56,target:[5.60,1.50,.55]},
  {id:'exterior-starboard',label:'外侧船舷全景',theta:1.57,phi:1.17,zoom:.77,target:[5.79,1.64,-.45]},
  {id:'exterior-window-front',label:'舷窗外侧正视',theta:1.57,phi:1.49,zoom:.41,target:[5.78,1.67,-1.55]},
  {id:'exterior-window-oblique',label:'舷窗外侧斜视',theta:2.06,phi:1.33,zoom:.42,target:[5.82,1.67,-1.55]},
  {id:'exterior-window-low',label:'舷窗外侧仰视',theta:1.48,phi:1.83,zoom:.39,target:[5.82,1.38,-1.55]},
  {id:'exterior-door-front',label:'阳台门外侧正视',theta:1.57,phi:1.46,zoom:.41,target:[5.82,1.53,.53]},
  {id:'exterior-door-jamb',label:'阳台门外侧门套',theta:1.99,phi:1.33,zoom:.33,target:[5.83,1.53,.53]},
  {id:'exterior-hull-top',label:'外壳上缘衔接',theta:1.50,phi:.67,zoom:.56,target:[5.81,2.69,-.50]},
  {id:'exterior-entry',label:'入口门外侧',theta:-1.57,phi:1.22,zoom:.43,target:[-5.75,1.42,-2.23]},
 ] as const;
 let reviewStation=new URLSearchParams(location.search).get('station')??'overview';
 const query=new URLSearchParams(location.search);const requestedView=query.get('view')??'game';
 let view=['room','character','face'].includes(requestedView)?requestedView:'game';let angle=query.get('angle')??'front';
 const ui=document.createElement('div');ui.id='review-controls';ui.innerHTML='<button data-view="game">游玩</button><button data-view="room">房间</button><button data-view="character">人物</button><button data-view="face">脸部</button><button id="compare-toggle">概念图对照</button>';
 const structureLink=document.createElement('a');structureLink.href='?view=structure';structureLink.textContent='结构研究 ↗';ui.append(structureLink);document.body.append(ui);
 const selector=document.createElement('select');selector.setAttribute('aria-label','选择房间');
 for(const [id,room] of Object.entries(rooms))selector.add(new Option(room.label,id,id===roomId,id===roomId));
 selector.addEventListener('change',()=>{
  const url=new URL(location.href);
  if(selector.value==='v4')url.searchParams.delete('room');else url.searchParams.set('room',selector.value);
  if(view==='game')url.searchParams.delete('view');else url.searchParams.set('view',view);
  location.assign(url);
 });
 roomTools.prepend(selector);
 if(roomId==='cruise'){
  const toolbar=document.createElement('div');toolbar.id='cruise-camera-review';toolbar.style.cssText='display:flex;flex-wrap:wrap;gap:5px;padding:6px;background:#29212bcc;border-radius:8px;';
  const label=document.createElement('span');label.textContent='检查机位';label.style.cssText='color:#fff;font-size:12px;align-self:center';toolbar.append(label);
  for(const station of reviewStations){const button=document.createElement('button');button.textContent=station.label;button.dataset.station=station.id;button.style.cssText='padding:4px 7px;font-size:12px;cursor:pointer';button.addEventListener('click',()=>{reviewStation=station.id;apply('room');});toolbar.append(button);}
  const shot=document.createElement('button');shot.textContent='保存截图';shot.style.cssText='padding:4px 7px;font-size:12px;cursor:pointer';shot.addEventListener('click',()=>{const canvas=document.querySelector('canvas');if(!canvas)return;canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cruise-'+reviewStation+'.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);},'image/png');});toolbar.append(shot);roomTools.append(toolbar);
 }
 const angles=document.createElement('div');angles.id='character-angles';angles.innerHTML='<button data-angle="front">正面</button><button data-angle="side">侧面</button><button data-angle="back">背面</button>';document.body.append(angles);
 const panel=document.createElement('aside');panel.id='reference-panel';panel.hidden=true;
 const image=document.createElement('img');image.alt='用户提供的原始概念图，仅用于对照';panel.append(image);
 const text=document.createElement('div');text.textContent='选择参考图进行对照 · 图片仅在当前浏览器使用';panel.append(text);
 const picker=document.createElement('input');picker.type='file';picker.accept='image/*';picker.setAttribute('aria-label','选择参考图');panel.append(picker);document.body.append(panel);
 const references=new Map<string,string>();
 const referenceKey=()=>['character','face'].includes(view)?'character':'room';
 function displayReference(){const src=references.get(referenceKey());if(src){image.src=src;image.hidden=false;}else{image.removeAttribute('src');image.hidden=true;}}
 picker.addEventListener('change',()=>{const file=picker.files?.[0];if(!file)return;const key=referenceKey(),old=references.get(key);if(old)URL.revokeObjectURL(old);references.set(key,URL.createObjectURL(file));displayReference();});
 // Dedicated mobile camera joystick: works independently of canvas pointer events.
 if(roomId==='cruise'){
  const joystick=document.createElement('div');
  joystick.id='camera-joystick';
  joystick.innerHTML='<div class="camera-joystick-knob"></div><span>旋转视角</span>';
  joystick.setAttribute('aria-label','拖动调整船舱视角');
  document.body.append(joystick);
  const knob=joystick.querySelector<HTMLElement>('.camera-joystick-knob')!;
  let pointer:number|null=null,originX=0,originY=0;
  const move=(x:number,y:number)=>{
   const dx=Math.max(-43,Math.min(43,x-originX)),dy=Math.max(-43,Math.min(43,y-originY));
   knob.style.transform='translate('+dx+'px,'+dy+'px)';
   controller.camGoal.theta-=dx*.00085;
   controller.camGoal.phi=T.MathUtils.clamp(controller.camGoal.phi-dy*.00085,.24,1.65);
  };
  joystick.addEventListener('pointerdown',e=>{e.preventDefault();pointer=e.pointerId;originX=e.clientX;originY=e.clientY;joystick.setPointerCapture(e.pointerId);});
  joystick.addEventListener('pointermove',e=>{if(pointer===e.pointerId){e.preventDefault();move(e.clientX,e.clientY);}});
  const stop=(e:PointerEvent)=>{if(pointer!==e.pointerId)return;pointer=null;knob.style.transform='translate(0,0)';};
  joystick.addEventListener('pointerup',stop);joystick.addEventListener('pointercancel',stop);
 }
 const studio=new T.Group();scene.add(studio);addLighting(studio);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:0xa9afaf,roughness:1}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;studio.add(floor);
 function apply(next:string){
  view=next;const close=view==='face',portrait=view==='character'||close;
  actions.cancel();character.body.rotation.x=0;character.body.position.y=character.hipHeight;
  room.visible=!portrait;studio.visible=portrait;scene.background=portrait?new T.Color(0xa9afaf):roomBackground;character.charRoot.visible=view!=='room';
  character.plumbob.visible=view==='game';character.plumbobLight.visible=view==='game';
  const {spawn}:RoomLayout=profile.layout;
  controller.usePerspective(portrait);
  const framing=profile.camera;
  character.charRoot.position.set(portrait?0:spawn.x,portrait?0:spawn.y??0,portrait?0:spawn.z);character.charRoot.rotation.y=portrait?0:spawn.rot;
  const station=roomId==='cruise'&&view==='room'?reviewStations.find(s=>s.id===reviewStation):undefined;
  const state=portrait
    ? {theta:angle==='side'?Math.PI/2:angle==='back'?Math.PI:0,phi:close?1.46:1.52,radius:close?.49:2.72,target:new T.Vector3(0,close?1.65:.91,0)}
    : {theta:station?.theta??framing.theta,phi:station?.phi??framing.phi,radius:(view==='room'?framing.roomRadius:framing.gameRadius)*profile.frameScale(innerWidth/innerHeight)*(station?.zoom??1),target:new T.Vector3(...(station?.target??framing.target))};
  for(const obj of [controller.camGoal,controller.camState]){obj.theta=state.theta;obj.phi=state.phi;obj.radius=state.radius;obj.target.copy(state.target);}
  angles.hidden=!portrait||query.get('capture')==='1';
  roomTools.hidden=portrait||query.get('capture')==='1';
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
  for(const name of ['pelvis','spine','chest','neck','head','lShoulder','rShoulder','lThigh','rThigh','lShin','rShin','lFoot','rFoot'])j[name].rotation.set(0,0,0);
  j.lUpperArm.rotation.set(0,0,.035);j.rUpperArm.rotation.set(0,0,-.035);
  j.lForeArm.rotation.set(-.045,0,0);j.rForeArm.rotation.set(-.045,0,0);
  j.lHand.rotation.set(-.02,0,.02);j.rHand.rotation.set(-.02,0,-.02);
  j.lFoot.rotation.y=.08;j.rFoot.rotation.y=-.08;
 }
 return {pose,get view(){return view;},get portrait(){return view==='character'||view==='face';}};
}
