import * as T from 'three';
import {block} from '../architecture';
import {bathMaterials} from './materials';

export function buildBathFinishes(finish:T.Group){
 block(finish,'bath-marble-floor',[3.15,.035,3.02],[-4.17,.025,2.27],bathMaterials.marble);
 block(finish,'bath-back-marble-panel',[3.08,1.96,.035],[-4.16,1.20,.805],bathMaterials.marble);

}
