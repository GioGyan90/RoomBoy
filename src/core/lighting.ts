import * as THREE from 'three';
export function addLighting(scene:THREE.Scene){
/* =========================================================
   5 · lights
   ========================================================= */
scene.add(new THREE.HemisphereLight(0xcfe4ff, 0xbfa17a, 0.72));
scene.add(new THREE.AmbientLight(0xffffff, 0.22));

const sun = new THREE.DirectionalLight(0xfff0d6, 3.0);
sun.position.set(-1.6, 5.2, -7.2);
sun.target.position.set(0.1, 0.5, 0.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -6; sun.shadow.camera.right = 6;
sun.shadow.camera.top = 6;   sun.shadow.camera.bottom = -6;
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 26;
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.022;
scene.add(sun); scene.add(sun.target);

const fill = new THREE.DirectionalLight(0xfff4e6, 0.55);
fill.position.set(2.5, 3.2, 6);
scene.add(fill);


}
