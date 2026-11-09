import * as T from 'three';
import {block,cylinder,palette} from './architecture';
const led=new T.MeshStandardMaterial({color:0xffd897,emissive:0xffac4c,emissiveIntensity:.95,metalness:.22,roughness:.38});
export function referenceFinish(root:T.Group){
 const g=new T.Group();g.name='cruise-reference-finish';root.add(g);
 // All six bed components, including arch and LED strip, are owned by bedKit.ts.
 // Art-deco corner print is now integrated into the rug's UV texture.
 // Avoid duplicated floating-looking zig-zag brass marks on bare floor.
 // Coffee table bouquet, with each flower tied to the vase's actual position.
 const flower=new T.MeshStandardMaterial({color:0xffefc6,roughness:.91});
 for(let i=0;i<6;i++){
  const angle=i*Math.PI*2/6;
  const m=new T.Mesh(new T.SphereGeometry(.065,10,8),flower);
  m.name='table-ivory-flower';m.position.set(3.39+Math.sin(angle)*.14,1.19+Math.cos(angle)*.05,1.83+Math.cos(angle)*.10);g.add(m);
 }
 const center=new T.Mesh(new T.SphereGeometry(.085,12,8),palette.gold);
 center.name='bouquet-center';center.position.set(3.39,1.17,1.83);g.add(center);
 // The vanity mirror and display television have subtle warm accent strips.
 // TV is off; a restrained brass media-wall toe rail sits below it (not on the screen).
 block(g,'tv-underlit-trim',[1.88,.019,.023],[-.33,.90,3.503],palette.gold);
 for(const x of [-3.51,-2.67])block(g,'mirror-warm-side-strip',[.017,.93,.018],[x,1.76,.927],led);
 // Low-intensity highlights break up the dark marble without washing out its color.
 const tableLight=new T.PointLight(0xffd3a5,.35,3.3,2);
 tableLight.name='cruise-table-warm-light';tableLight.position.set(3.7,1.8,1.05);g.add(tableLight);
 return {tableLight};
}
