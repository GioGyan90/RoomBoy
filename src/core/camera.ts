import * as THREE from 'three';
import {damp} from './math';

export function createCameraController(perspective: THREE.PerspectiveCamera, useRoomOrthographic = false) {
  const parallel = useRoomOrthographic ? new THREE.OrthographicCamera(-1, 1, 1, -1, .05, 120) : undefined;
  let camera = parallel ?? perspective;
  const camState = { theta:.02, phi:1.50, radius:4.10, target:new THREE.Vector3(0,1.16,-1.1) };
  const camGoal = { ...camState, target: camState.target.clone() };
  const orbit = new THREE.Spherical();

  function usePerspective(portrait: boolean) {
    camera = portrait ? perspective : parallel ?? perspective;
  }

  function updateCamera(dt: number) {
    camState.theta = damp(camState.theta, camGoal.theta, 11, dt);
    camState.phi = damp(camState.phi, camGoal.phi, 11, dt);
    camState.radius = damp(camState.radius, camGoal.radius, 11, dt);
    camState.target.lerp(camGoal.target, 1 - Math.exp(-11 * dt));
    if (camera instanceof THREE.OrthographicCamera) {
      const halfY = camState.radius * Math.tan(THREE.MathUtils.degToRad(perspective.fov / 2));
      const halfX = halfY * perspective.aspect;
      camera.left = -halfX;
      camera.right = halfX;
      camera.top = halfY;
      camera.bottom = -halfY;
      camera.updateProjectionMatrix();
    }
    orbit.set(camState.radius, camState.phi, camState.theta);
    camera.position.setFromSpherical(orbit).add(camState.target);
    camera.lookAt(camState.target);
  }

  return {camState, camGoal, updateCamera, usePerspective, get camera() { return camera; }};
}
