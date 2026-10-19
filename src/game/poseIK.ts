import * as T from 'three';
import type {Character} from '../assets/procedural/character';
const DOWN=new T.Vector3(0,-1,0);
/** Analytic two-bone arms for the reference hands-on-hips pose. */
export function referenceArms(c:Character){
 c.charRoot.updateMatrixWorld(true);
 for(const side of ['l','r']){
  const s=side==='l'?1:-1,upper=c.J[side+'UpperArm'],fore=c.J[side+'ForeArm'],hand=c.J[side+'Hand'];
  hand.position.z=0;
  const shoulder=upper.getWorldPosition(new T.Vector3());
  const target=c.body.localToWorld(new T.Vector3(s*.145,.075,.115));
  const direction=target.clone().sub(shoulder);const distance=direction.length();direction.normalize();
  const pole=new T.Vector3(s,0,0).transformDirection(c.body.matrixWorld);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
  const along=(.29**2+distance**2-.26**2)/(2*distance),height=Math.sqrt(Math.max(0,.29**2-along**2));
  const elbow=shoulder.clone().addScaledVector(direction,along).addScaledVector(pole,height);
  const upperWorld=new T.Quaternion().setFromUnitVectors(DOWN,elbow.clone().sub(shoulder).normalize());
  upper.quaternion.copy(upper.parent!.getWorldQuaternion(new T.Quaternion()).invert().multiply(upperWorld));
  upper.updateWorldMatrix(false,true);
  const foreWorld=new T.Quaternion().setFromUnitVectors(DOWN,target.clone().sub(elbow).normalize());
  fore.quaternion.copy(fore.parent!.getWorldQuaternion(new T.Quaternion()).invert().multiply(foreWorld));
  fore.updateWorldMatrix(false,true);
  const handWorld=c.body.getWorldQuaternion(new T.Quaternion()).multiply(new T.Quaternion().setFromEuler(new T.Euler(-.12,s*.2,-s*.65)));
  hand.quaternion.copy(hand.parent!.getWorldQuaternion(new T.Quaternion()).invert().multiply(handWorld));
 }
}
