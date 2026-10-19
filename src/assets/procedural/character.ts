import * as THREE from 'three';
import {createHair} from './hair';
import {mesh,loft,ellipsoid,rounded,tube,patch,strand,type P3} from './sculpt';
export function createCharacter(scene:THREE.Scene){
 const charRoot=new THREE.Group();charRoot.name='haru';
 const body=new THREE.Group();charRoot.add(body);
 const J:Record<string,THREE.Group>={};
 function joint(name:string,parent:THREE.Object3D,p:P3=[0,0,0]){const g=new THREE.Group();g.name=name;g.position.set(...p);parent.add(g);J[name]=g;return g;}
 const ramp=new THREE.DataTexture(new Uint8Array([88,146,200,235,255]),5,1,THREE.RedFormat);ramp.minFilter=THREE.NearestFilter;ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
 const skin=new THREE.MeshToonMaterial({color:0xd4ac91,gradientMap:ramp,side:THREE.DoubleSide});
 const skinShade=new THREE.MeshToonMaterial({color:0xb97d66,gradientMap:ramp,side:THREE.DoubleSide});
 const cloth=new THREE.MeshToonMaterial({color:0x27282d,gradientMap:ramp,side:THREE.DoubleSide});
 const grey=new THREE.MeshToonMaterial({color:0x62656c,gradientMap:ramp,side:THREE.DoubleSide});
 const seam=new THREE.MeshStandardMaterial({color:0x363940,roughness:1});
 const hair=new THREE.MeshStandardMaterial({color:0x16151a,roughness:.54,metalness:0,side:THREE.DoubleSide});
 const hairHi=new THREE.MeshStandardMaterial({color:0x29252b,roughness:.60,metalness:0,side:THREE.DoubleSide});
 const silver=new THREE.MeshStandardMaterial({color:0xbabcc0,metalness:.8,roughness:.32});
 const dark=new THREE.MeshStandardMaterial({color:0x302021,roughness:1});
 const white=new THREE.MeshStandardMaterial({color:0xe4ded5,roughness:.8,side:THREE.DoubleSide});
 const iris=new THREE.MeshStandardMaterial({color:0x51483e,roughness:.4});
 const pelvis=joint('pelvis',body);
 mesh(pelvis,loft([[-.077,.080,.070],[-.050,.146,.1],[-.02,.153,.102],[.06,.138,.089],[.11,.121,.076]]),grey);
 // Elastic waistband and a narrow stitched centre fly.
 mesh(pelvis,loft([[.074,.137,.091],[.10,.127,.082],[.112,.123,.079]]),cloth);
 tube(pelvis,[[0,.075,.092],[-.008,-.02,.106],[0,-.13,.084]],.0018,seam);
 const spine=joint('spine',pelvis,[0,.10,0]);
 // Torso is one continuous fitted garment; no spherical chest pieces.
 patch(spine,100,65,(u,v)=>{
  const a=u*Math.PI*2,q=Math.abs(Math.sin(a));
  const top=.285+.052*Math.exp(-(((q-.64)/.22)**2))-.045*q**6+(Math.max(0,-Math.cos(a))**4*.075);
  const y=-.052+v*(top+.052),rx=y<.10?.145-y*.20:.126+(y-.10)*.22,rz=.106+(y>.16?(y-.16)*.035:0);
  const folds=(Math.sin(a*11+y*19)*.0035+Math.sin(a*7-y*25)*.0025)*Math.max(0,1-y/.30);
  const upperStretch=.07*THREE.MathUtils.smoothstep(y,.08,.30);
  return [Math.sin(a)*(rx+folds),y+upperStretch,Math.cos(a)*(rz+folds)];
 },cloth);
 // Sculpt the scoop neckline and deep side armholes as actual open garment surfaces.
 const chest=joint('chest',spine,[0,.27,0]);
 mesh(chest,loft([[.02,.167,.086],[.09,.177,.08],[.135,.155,.072],[.17,.075,.059],[.19,.047,.048]]),skin);
 for(const s of [-1,1]){
  // clavicle ridges, shallow enough to read through the diffuse light.
  tube(chest,[[s*.025,.16,.063],[s*.075,.152,.074],[s*.134,.145,.055]],.003,skin);
 }
 // Shoulder straps are continuous surfaces from the front neckline over the clavicle.
 for(const side of [-1,1])patch(spine,14,32,(u,v)=>[side*(.102+u*.048),.405+.020*Math.sin(v*Math.PI)+u*.002,.092-v*.18],cloth);
 // Loose lower hem and deliberate garment creases.
 for(const s of [-1,1]){
  tube(spine,[[s*.104,-.04,.075],[s*.115,.015,.07],[s*.09,.072,.065]],.002,cloth);
  tube(spine,[[s*.085,-.025,.088],[s*.025,.025,.092],[s*.10,.07,.073]],.0018,seam);
 }
 const neck=joint('neck',chest,[0,.165,0]);
 mesh(neck,loft([[-.055,.060,.052],[0,.043,.042],[.055,.039,.039],[.075,.043,.041]]),skin);
 const head=joint('head',neck,[0,.045,0]);head.scale.set(.88,.85,.88);
 mesh(head,loft([[0,.025,.033,.027],[.018,.048,.045,.024],[.042,.076,.061,.012],[.075,.083,.074,0],[.111,.098,.081,-.006],[.15,.102,.083,-.009],[.19,.10,.086,-.015],[.225,.087,.078,-.018],[.25,.055,.055,-.02],[.26,0,0,-.02]],64,(x,y,z,a)=>{
  const front=Math.max(0,Math.cos(a));
  const cheek=.003*Math.exp(-(((y-.105)/.025)**2))*Math.exp(-(((Math.abs(x)-.067)/.025)**2));
  // A flattened facial plane with recessed orbital sockets.
  let f=z+cheek*front;
  f-=.004*Math.exp(-(((y-.14)/.018)**2))*Math.exp(-(((Math.abs(x)-.045)/.026)**2))*front;
  if(front>.45&&y<.18)f+=.009*front;
  const facialPlane=THREE.MathUtils.smoothstep(y,.065,.10)*(1-THREE.MathUtils.smoothstep(y,.17,.19));
  if(front>.45)f+=(.088-f)*.72*front*facialPlane;
  const nose=(.026*Math.exp(-(((y-.092)/.018)**2))+.010*Math.exp(-(((y-.132)/.03)**2)))*Math.exp(-((x/.010)**2));
  f+=nose*front;
  return [x,y,f];
 }),skin);
 for(const s of [-1,1]){
  
  tube(head,[[s*.006,.078,.105],[s*.010,.077,.101]],.0007,skinShade,10);
  // Recess the complete eye assembly into the orbital plane, including the lids.
  const socket=new THREE.Group();socket.position.z=-.008;head.add(socket);
  // Almond-shaped sclera, outer corner slightly higher than the inner one.
  patch(socket,32,12,(u,v)=>{const x=s*(.019+u*.057),arc=Math.pow(Math.sin(u*Math.PI),.8);return [x,.129+u*.008+(v-.5)*.011*arc,.083+arc*.015];},white);
  const eye=new THREE.Group();eye.position.set(s*.047,.134,.099);eye.rotation.y=s*.12;socket.add(eye);
  ellipsoid(eye,[.010,.0065,.003],iris,[0,0,0]);
  ellipsoid(eye,[.004,.0052,.0033],dark,[0,0,.002]);
  ellipsoid(eye,[.0018,.0018,.001],white,[-.003,.004,.005]);
  tube(socket,[[s*.019,.129,.085],[s*.042,.139,.100],[s*.064,.141,.095],[s*.079,.137,.079]],.0018,dark);
  tube(socket,[[s*.019,.128,.086],[s*.045,.129,.099],[s*.075,.137,.085]],.0012,skinShade);
  strand(socket,[[s*.021,.158,.092],[s*.043,.164,.094],[s*.065,.165,.087],[s*.081,.162,.075]],.0044,.0018,hair);
  // Ear helix and inner concha, with an actual silver hoop on one side.
  const ear=ellipsoid(head,[.016,.031,.014],skin,[s*.103,.121,-.002]);ear.rotation.z=-s*.16;
  ellipsoid(head,[.007,.018,.005],skinShade,[s*.113,.124,.010]);
  tube(head,[[s*.111,.101,.014],[s*.119,.116,.014],[s*.116,.14,.010],[s*.106,.149,.009]],.003,skin);
  
 }
 tube(head,[[-.020,.047,.083],[0,.046,.089],[.020,.050,.082]],.0008,dark);
 tube(head,[[-.012,.043,.080],[0,.042,.084],[.012,.044,.080]],.0011,skinShade);
 // Dark skull cap, the front hairline sits above the brows.
 patch(head,64,28,(u,v)=>{const a=u*Math.PI*2;const end=.95+(.75*(1-Math.cos(a)))+.055*Math.sin(a*19)*Math.max(0,-Math.cos(a));const p=.01+v*end;return [Math.sin(a)*Math.sin(p)*.113,.157+Math.cos(p)*.125,-.021+Math.cos(a)*Math.sin(p)*.103];},hair);
 createHair(head,hair,hairHi);
 // Two chains and the narrow rectangular tag in the new turnaround sheet.
 const shortChain:P3[]=[[0,.188,-.044],[.032,.183,-.030],[.044,.174,0],[.040,.158,.044],[.030,.132,.085],[0,.105,.086],[-.030,.132,.085],[-.040,.158,.044],[-.044,.174,0],[-.032,.183,-.030],[0,.188,-.044]];
 const longChain:P3[]=[[0,.187,-.047],[.034,.180,-.031],[.045,.171,0],[.040,.148,.055],[.031,.095,.087],[.022,.055,.115],[0,-.022,.115],[-.022,.055,.115],[-.031,.095,.087],[-.040,.148,.055],[-.045,.171,0],[-.034,.180,-.031],[0,.187,-.047]];
 tube(chest,shortChain,.00115,silver,100);tube(chest,longChain,.0010,silver,100);
 const medallion=mesh(chest,new THREE.CylinderGeometry(.0055,.0055,.002,24),silver,[0,.099,.089]);medallion.rotation.x=Math.PI/2;
 rounded(chest,[.012,.034,.0035],silver,[0,-.036,.118],.003);
 mesh(chest,new THREE.TorusGeometry(.0022,.0006,6,16),silver,[0,-.015,.120]);
 tube(chest,[[.003,-.028,.120],[.003,-.044,.120]],.0004,seam,8);
 // Anatomical limbs are lofted sections rather than generic cylinders.
 for(const side of ['l','r']){
  const s=side==='l'?1:-1;
  const shoulder=joint(side+'Shoulder',chest,[s*.170,.112,0]);
  const upper=joint(side+'UpperArm',shoulder);
  const upperSkin=mesh(upper,loft([[-.30,.035,.035],[-.273,.043,.040],[-.23,.049,.046,.002],[-.17,.064,.060,.006],[-.10,.067,.063,0],[-.035,.071,.065,0],[.021,.051,.047,0],[.037,.012,.014,0]],40,(x,y,z,a)=>[x,y,z+Math.max(0,Math.cos(a))*.006*Math.sin(-y*11)]),skin);upperSkin.scale.set(.82,1,.86);
  const fore=joint(side+'ForeArm',upper,[0,-.29,0]);
  ellipsoid(fore,[.031,.036,.031],skin,[0,0,0]);
  const foreSkin=mesh(fore,loft([[-.26,.025,.026],[-.235,.029,.028],[-.17,.040,.037,.005],[-.10,.048,.043,.006],[-.035,.043,.040],[.012,.033,.034]]),skin);
  foreSkin.scale.set(.84,1,.87);
  const hand=joint(side+'Hand',fore,[0,-.26,0]);hand.scale.set(.87,.94,.88);
  mesh(hand,loft([[-.087,.032,.016],[-.066,.038,.020],[-.035,.034,.021],[0,.025,.024]]),skin);
  for(let i=0;i<4;i++){
   const x=(i-1.5)*.017,ln=[.060,.071,.067,.052][i];
   strand(hand,[[x,-.071,.003],[x,-.092,.008],[x,-.071-ln,.017]],.009,.008,skin);
   rounded(hand,[.010,.013,.0013],new THREE.MeshStandardMaterial({color:0xecc5ad,roughness:.7}),[x,-.067-ln,.022],.003);
  }
  strand(hand,[[s*.025,-.025,.005],[s*.048,-.052,.012],[s*.050,-.079,.022]],.013,.011,skin);
  for(let i=0;i<3;i++)tube(hand,[[(i-1)*.014,-.013,.022],[(i-1)*.017,-.066,.022]],.0012,skin);
  const thigh=joint(side+'Thigh',pelvis,[s*.083,-.03,0]);
  const thighSkin=mesh(thigh,loft([[-.49,.047,.051,.006],[-.455,.060,.062,.005],[-.38,.074,.078,-.006],[-.27,.090,.095,-.011],[-.12,.098,.101,-.009],[.015,.087,.085,0],[.038,.057,.056]],48,(x,y,z,a)=>[x+Math.sin(a)*.005*Math.sin(-y*9),y,z]),skin);
  thighSkin.scale.set(.83,1,.88);
  const shortsLeg=mesh(thigh,loft([[-.073,.106,.112,-.012],[-.050,.109,.113,-.009],[.02,.102,.104],[.065,.089,.09]]),grey);
  shortsLeg.scale.set(.88,1,.92);
  const shortsHem=mesh(thigh,loft([[-.094,.110,.118,-.012],[-.070,.112,.119,-.012]]),cloth);
  shortsHem.scale.set(.88,1,.92);
  tube(thigh,[[s*.078,.01,.05],[s*.092,-.04,.018],[s*.083,-.087,.008]],.0015,seam);
  ellipsoid(thigh,[.024,.029,.010],skin,[0,-.458,.045]);
  const shin=joint(side+'Shin',thigh,[0,-.48,0]);
  const shinSkin=mesh(shin,loft([[-.405,.028,.028],[-.36,.029,.032,-.005],[-.27,.037,.047,-.015],[-.17,.054,.061,-.020],[-.085,.055,.058,-.012],[-.03,.046,.045],[.025,.043,.045]]),skin);
  shinSkin.scale.set(.84,1,.88);
  for(const sx of [-1,1])ellipsoid(shin,[.007,.012,.009],skin,[sx*.022,-.36,-.001]);
  const foot=joint(side+'Foot',shin,[0,-.40,0]);
  // Heel, instep, metatarsal and five separate toe volumes.
  const footShape=loft([[-.061,0,0,.033],[-.054,.024,.020,.032],[-.025,.034,.028,.026],[.025,.035,.034,.022],[.08,.044,.025,.036],[.13,.045,.018,.043],[.16,.034,.014,.047],[.17,.001,.001,.048]],40);
  footShape.rotateX(Math.PI/2);mesh(foot,footShape,skin);
  tube(foot,[[s*.018,-.01,.01],[s*.014,-.018,.067],[s*.016,-.036,.117]],.002,skin);
  for(let i=0;i<5;i++){
   const x=s*(.032-i*.017),z=.16-i*.005,rx=.012-i*.0012;
   ellipsoid(foot,[rx,.015-i*.001,.024-i*.002],skin,[x,-.049,z]);
   ellipsoid(foot,[rx*.65,.002,.009],new THREE.MeshStandardMaterial({color:0xe9bea6,roughness:.8}),[x,-.035,z+.008]);
  }
 }
 const charMeshes:THREE.Mesh[]=[];body.traverse(o=>{if(o instanceof THREE.Mesh){o.name=o.name||'sculpt';charMeshes.push(o);}});
 // A thin inverted hull gives the authored silhouettes an anime ink contour.
 const ink=new THREE.MeshBasicMaterial({color:0x352c2b,side:THREE.BackSide,transparent:true,opacity:.52,depthWrite:false});
 for(const source of charMeshes){
  source.geometry.computeBoundingSphere();if((source.geometry.boundingSphere?.radius??0)<.035)continue;
  const geometry=source.geometry.clone(),positions=geometry.getAttribute('position'),normals=geometry.getAttribute('normal');
  for(let i=0;i<positions.count;i++)positions.setXYZ(i,positions.getX(i)+normals.getX(i)*.0009,positions.getY(i)+normals.getY(i)*.0009,positions.getZ(i)+normals.getZ(i)*.0009);
  const outline=new THREE.Mesh(geometry,ink);outline.name='ink-contour';source.add(outline);
 }
/* --- plumbob (Sims-style mood diamond) --- */
const plumbob = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.062, 0),
  new THREE.MeshStandardMaterial({ color:0x4ff08a, emissive:0x22a74e, emissiveIntensity:1.4,
                                   transparent:true, opacity:0.9, roughness:0.25 })
);
scene.add(plumbob);
const plumbobLight = new THREE.PointLight(0x54ff9a, 0.6, 1.4, 2);
scene.add(plumbobLight);

/* --- Zzz sprites --- */
const zMat = (()=>{
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.font = 'bold 96px sans-serif'; g.fillStyle = '#fff';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('Z', 64, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const zzz = [0,1,2].map(()=>{
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:zMat, transparent:true, opacity:0, depthWrite:false }));
  sp.scale.setScalar(0.14);
  scene.add(sp);
  return sp;
});



return {charRoot,body,J,charMeshes,plumbob,plumbobLight,zzz};
}
export type Character=ReturnType<typeof createCharacter>;
