import * as T from 'three';
import {block,palette} from '../architecture';
import {bathMaterials,ovalOpening} from './materials';

export function buildBathToilet(toiletZone:T.Group){
 // Unified modern toilet: pedestal, shallow oval basin, open seat ring and connected tank.
 const pedestal=new T.Mesh(new T.CylinderGeometry(.205,.17,.45,20),palette.ivory);
 pedestal.name='toilet-pedestal';pedestal.position.set(-3.35,.255,3.07);pedestal.castShadow=true;toiletZone.add(pedestal);
 const bowl=new T.Mesh(new T.SphereGeometry(1,28,18),palette.ivory);
 bowl.name='toilet-bowl';bowl.position.set(-3.35,.45,3.08);bowl.scale.set(.28,.15,.36);bowl.castShadow=true;toiletZone.add(bowl);
 const seat=new T.Mesh(ovalOpening(.285,.355,.18,.26,.034),palette.ivory);
 seat.name='toilet-seat';seat.position.set(-3.35,.585,3.08);toiletZone.add(seat);
 const inner=new T.Mesh(new T.CircleGeometry(1,32),new T.MeshStandardMaterial({color:0xc9d0cb,roughness:.75}));
 inner.name='toilet-inner';inner.rotation.x=-Math.PI/2;inner.scale.set(.175,.245,1);inner.position.set(-3.35,.593,3.08);toiletZone.add(inner);
 // Contemporary low-profile tank joined to the bowl instead of a floating round finial.
 block(toiletZone,'toilet-cistern-support',[.39,.34,.22],[-3.35,.47,3.32],palette.ivory);
 block(toiletZone,'toilet-cistern',[.49,.29,.25],[-3.35,.70,3.40],palette.ivory);
 block(toiletZone,'toilet-tank-lid',[.51,.036,.27],[-3.35,.86,3.40],palette.ivory);
}
