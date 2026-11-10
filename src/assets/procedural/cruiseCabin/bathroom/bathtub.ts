import * as T from 'three';
import {palette} from '../architecture';
import {ovalOpening,bathMaterials} from './materials';

export function buildBathTub(tubZone:T.Group){
 // Freestanding rounded soaking tub with genuinely open interior.
 const plinth=new T.Mesh(new T.CylinderGeometry(1,1,.35,20),palette.ivory);
 plinth.name='tub-plinth';plinth.position.set(-4.8,.235,2.57);plinth.scale.set(.65,1,.98);
 plinth.castShadow=true;tubZone.add(plinth);
 const tub=new T.Mesh(ovalOpening(.70,1.02,.54,.81,.43),palette.ivory);
 tub.name='tub-body';tub.position.set(-4.8,.35,2.57);tub.castShadow=true;tubZone.add(tub);
 const rim=new T.Mesh(ovalOpening(.72,1.04,.54,.81,.035),palette.ivory);
 rim.name='tub-rim';rim.position.set(-4.8,.774,2.57);rim.castShadow=true;tubZone.add(rim);
 const water=new T.Mesh(new T.CircleGeometry(1,48),bathMaterials.water);
 water.name='tub-water';water.rotation.x=-Math.PI/2;water.scale.set(.51,.79,1);water.position.set(-4.8,.63,2.57);tubZone.add(water);

}
