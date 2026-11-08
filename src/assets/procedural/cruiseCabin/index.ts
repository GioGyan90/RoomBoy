import * as T from "three";
import {architecture} from "./architecture";
import {furniture} from "./furniture";
import {serviceRooms} from "./serviceRooms";
import {applyCruiseInk} from "./ink";
import {luxuryDetails} from "./luxuryDetails";
import {minibar} from "./minibar";
import {referenceArchitecture} from "./referenceArchitecture";
import {referenceFinish} from "./referenceFinish";
import type {RoomEffects,RoomToggle} from "../roomV4/effects";
export function createCruiseCabin(){
 const root=new T.Group();root.name="cruise-cabin";
 const navigation=architecture(root);
 referenceArchitecture(root);
 furniture(root);serviceRooms(root);minibar(root);
 luxuryDetails(root);
 const {tableLight}=referenceFinish(root);
 applyCruiseInk(root);
 const hemi=new T.HemisphereLight(0xffe8ce,0x736276,1.65);
 const sun=new T.DirectionalLight(0xffe7bd,1.75);sun.position.set(-3,9,6);
 const ambient=new T.AmbientLight(0xffffff,.24);
 const bedside=new T.PointLight(0xffce91,.48,4.3,2);
 bedside.position.set(-1.05,2.20,-2.90);
 const bathroom=new T.PointLight(0xffe3b1,.37,3.4,2);
 bathroom.position.set(-3.50,2.18,1.82);
 root.add(hemi,sun,ambient,bedside,bathroom);
 const state:Partial<Record<RoomToggle,boolean>>={night:false,lamps:true,curtains:true};
 const effects:RoomEffects={
  state,background:new T.Color(0x14111a),
  toggle(id:RoomToggle){if(state[id]!==undefined)state[id]=!state[id];},
  update(){hemi.intensity=state.night?.75:1.65;sun.intensity=state.night?.18:1.75;ambient.intensity=state.lamps?.24:.08;
   bedside.intensity=state.lamps?.48:0;
   bathroom.intensity=state.lamps?.37:0;
   tableLight.intensity=state.lamps?.35:0;}
 };
 return {root,navigation,effects};
}
