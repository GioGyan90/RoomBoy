import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
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

const target=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{samples:4});
const composer=new EffectComposer(renderer,target);composer.addPass(new RenderPass(scene,camera));
const ao=new SSAOPass(scene,camera,innerWidth,innerHeight,16);ao.kernelRadius=.16;ao.minDistance=.0005;ao.maxDistance=.045;composer.addPass(ao);composer.addPass(new OutputPass());
return {renderer,scene,camera,composer};
}
