import * as THREE from 'three';
import {damp} from './math';
export function createCameraController(camera:THREE.PerspectiveCamera){
const camState = { theta:0.02, phi:1.50, radius:4.10, target:new THREE.Vector3(0,1.16,-1.1) };
const camGoal  = { theta:0.02, phi:1.50, radius:4.10, target:new THREE.Vector3(0,1.16,-1.1) };

function updateCamera(dt:number){
  camState.theta  = damp(camState.theta,  camGoal.theta,  11, dt);
  camState.phi    = damp(camState.phi,    camGoal.phi,    11, dt);
  camState.radius = damp(camState.radius, camGoal.radius, 11, dt);
  camState.target.lerp(camGoal.target, 1-Math.exp(-11*dt));
  const sp = new THREE.Spherical(camState.radius, camState.phi, camState.theta);
  camera.position.setFromSpherical(sp).add(camState.target);
  camera.lookAt(camState.target);
}

return {camState,camGoal,updateCamera};
}
