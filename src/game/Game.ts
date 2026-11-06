import * as THREE from 'three';
import {createRenderer} from '../core/renderer';
import {createCameraController} from '../core/camera';
import {createCharacter} from '../assets/procedural/character';
import {createAnimation} from './animation';
import {createActions} from './actions';
import {createPieMenu} from '../ui/pieMenu';
import {bindControls} from '../input/controls';
import {element} from '../ui/dom';
import {createReview} from '../ui/review';
import {createRoomTools} from '../ui/roomTools';
import {rooms, type RoomId} from './rooms';

export function startGame(){
  const {renderer,scene,camera,composer}=createRenderer();
  const query=new URLSearchParams(location.search);
  const roomId:RoomId=query.get('room')==='apartment'?'apartment':'v4';
  const profile=rooms[roomId];
  const room=profile.create();
  scene.add(room.root);

  const {effects,navigation}=room;
  const roomTools=createRoomTools(effects);
  const character=createCharacter(scene);
  scene.add(character.charRoot);
  const animation=createAnimation(character);
  const actions=createActions(scene,character,animation,navigation,profile.layout,effects.state.monitor!==undefined);
  const controller=createCameraController(camera,profile.camera.orthographic);
  const menu=createPieMenu(actions);
  const review=createReview(scene,room.root,character,controller,actions,effects.background,roomTools.element,roomId);

  bindControls(renderer,character,actions,menu,controller,{
    root:room.root,
    toggle:roomTools.toggle,
    half:profile.layout.half,
    frameScale:profile.frameScale,
    canWalk:()=>review.view==='game',
  });

  const capture=query.get('capture')==='1';
  const clock=new THREE.Clock();
  renderer.setAnimationLoop(()=>{
    const dt=Math.min(clock.getDelta(),.05);
    const time=capture?0:clock.elapsedTime;
    actions.updateRunner(dt);
    animation.updateAnimation(dt,time);
    review.pose();
    controller.updateCamera(dt);
    actions.updateMarker(dt);

    if(review.portrait){
      renderer.toneMapping=THREE.ACESFilmicToneMapping;
      composer.render();
    }else{
      renderer.toneMapping=THREE.NoToneMapping;
      effects.update(dt,time);
      renderer.render(scene,controller.camera);
    }
  });

  window.addEventListener('resize',()=>{
    const aspect=innerWidth/innerHeight;
    if(!review.portrait){
      const scale=profile.frameScale(aspect)/profile.frameScale(camera.aspect);
      controller.camState.radius*=scale;
      controller.camGoal.radius*=scale;
    }
    camera.aspect=aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
    composer.setSize(innerWidth,innerHeight);
  });
  document.addEventListener('visibilitychange',()=>{clock.getDelta();});
  const loader=element('loader');
  setTimeout(()=>{
    loader.classList.add('gone');
    setTimeout(()=>loader.remove(),700);
  },260);
  return {room,character,actions};
}
