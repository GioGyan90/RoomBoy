import * as THREE from 'three';
export function createRenderer(){
/* =========================================================
   1 · renderer / scene / camera
   ========================================================= */
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0d12);

const camera = new THREE.PerspectiveCamera(45, innerWidth/innerHeight, 0.05, 120);

return {renderer,scene,camera};
}
