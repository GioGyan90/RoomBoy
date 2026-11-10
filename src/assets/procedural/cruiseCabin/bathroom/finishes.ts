import * as T from 'three';
import {block,palette} from '../architecture';
import {bathMaterials} from './materials';

export function buildBathFinishes(finish:T.Group){
 block(finish,'bath-marble-floor',[3.15,.035,3.02],[-4.17,.025,2.27],bathMaterials.marble);
 block(finish,'bath-back-marble-panel',[3.08,1.96,.035],[-4.16,1.20,.805],bathMaterials.marble);
 // A real flush floor-drain grille; not printed gold lines floating over tile.
 const drain=new T.Group();drain.name='bathroom-floor-drain';finish.add(drain);
 block(drain,'bath-floor-drain-recess',[.16,.006,.16],[-3.93,.044,3.39],palette.onyx);
 for(const offset of [-.045,-.015,.015,.045]){
  block(drain,'bath-floor-drain-slat',[.010,.010,.125],[-3.93+offset,.051,3.39],palette.gold);
 }
 // Real skirting at the wall foot, not decorative tubes across the tiles.
 block(finish,'bath-wall-base-cove',[3.06,.075,.042],[-4.16,.065,.854],palette.wood);

}
