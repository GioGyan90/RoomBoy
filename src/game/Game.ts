import * as THREE from 'three';
import {createRenderer} from '../core/renderer';
import {createCameraController} from '../core/camera';
import {addLighting} from '../core/lighting';
import {createRoom} from '../assets/procedural/room';
import {createCharacter} from '../assets/procedural/character';
import {createAnimation} from './animation';
import {createActions} from './actions';
import {createPieMenu} from '../ui/pieMenu';
import {bindControls} from '../input/controls';
import {element} from '../ui/dom';
import {applyRoomOverrides} from '../assets/registry';
import {createReview} from '../ui/review';
import {RH} from '../assets/layout';
export function startGame(){
 const {renderer,scene,camera,composer}=createRenderer();
 const room=createRoom();applyRoomOverrides(room.root,room.registry);scene.add(room.root);addLighting(scene);
 const character=createCharacter(scene);scene.add(character.charRoot);
 const animation=createAnimation(character);
 const actions=createActions(scene,character,animation);
 const controller=createCameraController(camera);
 const menu=createPieMenu(actions);bindControls(renderer,camera,character,actions,menu,controller);
 character.charRoot.position.set(-.15,0,.75);character.charRoot.rotation.y=.22;character.body.position.y=animation.HIP;
 const review=createReview(scene,room.root,character,controller,actions);
 const capture=new URLSearchParams(location.search).get("capture")==="1";
 const clock=new THREE.Clock();
 function tick(){const dt=Math.min(clock.getDelta(),.05);const t=clock.elapsedTime;
 actions.updateRunner(dt);animation.updateAnimation(dt,capture?0:t);review.pose();controller.updateCamera(dt);actions.updateMarker(dt);
 room.ceiling.visible=camera.position.y<RH-.05;composer.render();}
 renderer.setAnimationLoop(tick);
 window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);});
 document.addEventListener('visibilitychange',()=>{clock.getDelta();});
 const loader=element('loader');setTimeout(()=>{loader.classList.add('gone');setTimeout(()=>loader.remove(),700);},260);
 return {room,character,actions};
}
