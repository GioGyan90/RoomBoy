import * as T from 'three';
import {palette} from '../architecture';
import {ovalOpening,bathMaterials} from './materials';

/** Low-poly freestanding oval tub: sculpted outer shell, concave inner basin,
 * a real hollow upper lip and inset gold drain. Coordinates are stable for QA.
 */
export function buildBathTub(tubZone:T.Group){
 const plinth=new T.Mesh(new T.CylinderGeometry(.55,.50,.35,24),palette.ivory);
 plinth.name='tub-plinth';plinth.position.set(-4.8,.235,2.57);
 plinth.scale.z=1.61;plinth.castShadow=true;tubZone.add(plinth);

 // Continuous sloped section, not a hollow rectangular wall placed on a disk.
 // The inner wall slopes to a visible recessed ceramic bottom.
 const section=[
  [.0,.405],[.30,.405],[.48,.418],[.52,.466],
  [.57,.58],[.65,.745],[.70,.778],
  [.70,.792],[.62,.783],[.54,.765],
  [.50,.632],[.44,.535],[.29,.465],[.07,.457],[0,.457],
 ];
 const shell=new T.Mesh(new T.LatheGeometry(section.map(([radius,y])=>new T.Vector2(radius,y)),28),palette.ivory);
 shell.name='tub-body';shell.position.set(-4.8,0,2.57);
 shell.scale.z=1.46;shell.castShadow=true;shell.receiveShadow=true;tubZone.add(shell);

 const rim=new T.Mesh(ovalOpening(.72,1.04,.54,.81,.035),palette.ivory);
 rim.name='tub-rim';rim.position.set(-4.8,.774,2.57);
 rim.castShadow=true;rim.receiveShadow=true;tubZone.add(rim);

 const water=new T.Mesh(new T.CircleGeometry(1,48),bathMaterials.water);
 water.name='tub-water';water.rotation.x=-Math.PI/2;
 water.scale.set(.48,.73,1);water.position.set(-4.8,.63,2.57);
 tubZone.add(water);

 const drain=new T.Mesh(new T.CylinderGeometry(.047,.047,.012,16),bathMaterials.brass);
 drain.name='tub-drain';drain.position.set(-4.8,.471,2.57);
 tubZone.add(drain);
}
