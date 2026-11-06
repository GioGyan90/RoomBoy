import * as THREE from 'three';
import {createRenderer} from '../core/renderer';
import {createCameraController} from '../core/camera';
import {createRoomV4} from '../assets/procedural/roomV4/entities';
import {createRoomNavigation} from '../assets/procedural/roomV4/colliders';
import {createRoomEffects} from '../assets/procedural/roomV4/effects';
import {roomFrameScale} from '../assets/procedural/roomV4/definitions';
import {createCharacter} from '../assets/procedural/character';
import {createAnimation} from './animation';
import {createActions} from './actions';
import {createPieMenu} from '../ui/pieMenu';
import {bindControls} from '../input/controls';
import {element} from '../ui/dom';
import {applyRoomOverrides} from '../assets/registry';
import {createReview} from '../ui/review';
import {createRoomTools} from '../ui/roomTools';

export function startGame(){
  const {renderer,scene,camera,composer}=createRenderer();
  const room=createRoomV4();
  applyRoomOverrides(room.root,room.registry);
  scene.add(room.root);

  const effects=createRoomEffects(room.refs);
  const roomTools=createRoomTools(effects);
  const character=createCharacter(scene);
  scene.add(character.charRoot);
  const animation=createAnimation(character);
  const navigation=createRoomNavigation(room);
  const actions=createActions(scene,character,animation,navigation);
  const controller=createCameraController(camera);
  const menu=createPieMenu(actions);
  const review=createReview(scene,room.root,character,controller,actions,effects.background,roomTools.element);

  bindControls(renderer,camera,character,actions,menu,controller,{
    root:room.root,
    toggle:roomTools.toggle,
    canWalk:()=>review.view==='game',
  });

  const capture=new URLSearchParams(location.search).get('capture')==='1';
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
      renderer.render(scene,camera);
    }
  });

  window.addEventListener('resize',()=>{
    const aspect=innerWidth/innerHeight;
    if(!review.portrait){
      const scale=roomFrameScale(aspect)/roomFrameScale(camera.aspect);
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
