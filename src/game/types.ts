import * as THREE from 'three';
export type Posture='stand'|'sitDesk'|'sitBed'|'lieBed'|'stretch';
export type Step={type:'walk';pos:THREE.Vector3}|{type:'pose';posture:Posture;pos:THREE.Vector3;rot?:number;bodyY?:number;rotX?:number;duration?:number;hold?:boolean};
export interface Action {id:string;icon:string;label:string;nap?:boolean;steps:()=>Step[];status:string}
