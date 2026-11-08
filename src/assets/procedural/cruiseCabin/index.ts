import * as T from "three";
import {architecture} from "./architecture";
import {furniture} from "./furniture";
import {serviceRooms} from "./serviceRooms";
import {applyCruiseInk} from "./ink";
import {luxuryDetails} from "./luxuryDetails";
import {minibar} from "./minibar";
import {referenceArchitecture} from "./referenceArchitecture";
import type {RoomEffects,RoomToggle} from "../roomV4/effects";
export function createCruiseCabin(){
 const root=new T.Group();root.name="cruise-cabin";
 const navigation=architecture(root);
 referenceArchitecture(root);
 furniture(root);serviceRooms(root);minibar(root);
 luxuryDetails(root);
 applyCruiseInk(root);
 const hemi=new T.HemisphereLight(0xffe8ce,0x736276,1.65);
 const sun=new T.DirectionalLight(0xffe7bd,1.75);sun.position.set(-3,9,6);
 const ambient=new T.AmbientLight(0xffffff,.24);
 root.add(hemi,sun,ambient);
 const state:Partial<Record<RoomToggle,boolean>>={night:false,lamps:true,curtains:true};
 const effects:RoomEffects={
  state,background:new T.Color(0x14111a),
  toggle(id:RoomToggle){if(state[id]!==undefined)state[id]=!state[id];},
  update(){hemi.intensity=state.night?.75:1.65;sun.intensity=state.night?.18:1.75;ambient.intensity=state.lamps?.24:.08;}
 };
 return {root,navigation,effects};
}
