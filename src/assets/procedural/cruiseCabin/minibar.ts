import * as T from 'three';
import {block,cylinder,palette} from './architecture';

/**
 * The minibar is a wall-mounted service nook, independent of the bed and balcony.
 * Local +Z is the cabinet's opening; rotation turns it to face the main room.
 */
export function minibar(root:T.Group){
 const station=new T.Group();
 station.name='cruise-service-bar';
 station.position.set(-5.16,0,-1.02);
 station.rotation.y=Math.PI/2;
 root.add(station);
 block(station,'minibar-cabinet',[1.45,.91,.61],[0,.48,0],palette.wood);
 block(station,'minibar-black-marble',[1.53,.07,.68],[0,.97,0],palette.marble);
 block(station,'minibar-base-brass',[1.48,.06,.63],[0,.10,0],palette.gold);
 // Drawer fronts sit outside the cabinet's front face, not inside its body.
 for(let i=0;i<3;i++){
  const x=-.46+i*.46;
  block(station,'minibar-drawer',[.39,.42,.027],[x,.49,.326],palette.wood);
  block(station,'minibar-gold-handle',[.16,.022,.035],[x,.54,.354],palette.gold);
 }
 // The mirror belongs behind the bottles, on the wall-facing side of the unit.
 block(station,'minibar-back-mirror',[1.42,.66,.025],[0,1.52,-.49],palette.glass);
 block(station,'minibar-shelf',[1.43,.038,.35],[0,1.28,-.25],palette.gold);
 const decanterXs=[-.37,0,.37];
 for(const x of decanterXs){
  cylinder(station,'decanter-body',.08,.26,[x,1.45,-.25],palette.glass);
  cylinder(station,'decanter-neck',.035,.10,[x,1.63,-.25],palette.gold);
 }
 for(let i=0;i<3;i++){
  cylinder(station,'crystal-glass',.07,.18,[-.38+i*.32,1.12,.10],palette.glass);
 }
 // Small under-shelf light with no full-room emissive panel.
 block(station,'minibar-shelf-light',[1.32,.018,.02],[0,1.24,-.078],palette.cream);
 return station;
}
