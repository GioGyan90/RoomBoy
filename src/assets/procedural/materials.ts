import * as THREE from 'three';
import {woodFloorTexture,rugTexture} from './textures';
export function createMaterials(){
/* =========================================================
   3 · materials
   ========================================================= */
const MAT = {
  wall:      new THREE.MeshStandardMaterial({ color:0xf3e8d9, roughness:0.96, side:THREE.DoubleSide }),
  floor:     new THREE.MeshStandardMaterial({ map:woodFloorTexture(), roughness:0.82 }),
  wood:      new THREE.MeshStandardMaterial({ color:0xc08b55, roughness:0.78 }),
  woodLight: new THREE.MeshStandardMaterial({ color:0xd9b183, roughness:0.82 }),
  woodDark:  new THREE.MeshStandardMaterial({ color:0x8d5f38, roughness:0.8 }),
  white:     new THREE.MeshStandardMaterial({ color:0xf8f6f1, roughness:0.9 }),
  fabric:    new THREE.MeshStandardMaterial({ color:0xfdfcf8, roughness:1.0 }),
  blue:      new THREE.MeshStandardMaterial({ color:0x9fc6dc, roughness:0.95, side:THREE.DoubleSide }),
  blueSoft:  new THREE.MeshStandardMaterial({ color:0xbcd8e8, roughness:0.98 }),
  blueDeep:  new THREE.MeshStandardMaterial({ color:0x3f6c8f, roughness:0.9 }),
  metal:     new THREE.MeshStandardMaterial({ color:0x9aa2aa, roughness:0.35, metalness:0.75 }),
  dark:      new THREE.MeshStandardMaterial({ color:0x2a2d33, roughness:0.7 }),
  black:     new THREE.MeshStandardMaterial({ color:0x14161a, roughness:0.6 }),
  screen:    new THREE.MeshStandardMaterial({ color:0x9fd0f0, emissive:0x4d9ed0, emissiveIntensity:1.1, roughness:0.25 }),
  glass:     new THREE.MeshStandardMaterial({ color:0xcfe9ff, transparent:true, opacity:0.12, roughness:0.05, metalness:0.2 }),
  rug:       new THREE.MeshStandardMaterial({ map:rugTexture(), roughness:1.0 }),
  green:     new THREE.MeshStandardMaterial({ color:0x5d9a52, roughness:0.85 }),
  green2:    new THREE.MeshStandardMaterial({ color:0x76b563, roughness:0.85 }),
  pot:       new THREE.MeshStandardMaterial({ color:0xd6cab8, roughness:0.9 }),
};
MAT.floor.map!.wrapS = MAT.floor.map!.wrapT = THREE.RepeatWrapping;


return MAT;
}
