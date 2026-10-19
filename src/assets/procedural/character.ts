import * as THREE from 'three';
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
 const hair=new THREE.MeshToonMaterial({color:0x19171c,gradientMap:ramp,side:THREE.DoubleSide});
 const hairHi=new THREE.MeshToonMaterial({color:0x302a30,gradientMap:ramp,side:THREE.DoubleSide});
 const silver=new THREE.MeshStandardMaterial({color:0xbabcc0,metalness:.8,roughness:.32});
 const dark=new THREE.MeshStandardMaterial({color:0x302021,roughness:1});
 const white=new THREE.MeshStandardMaterial({color:0xe4ded5,roughness:.8});
 const iris=new THREE.MeshStandardMaterial({color:0x686c62,roughness:.4});
 const pelvis=joint('pelvis',body);
 mesh(pelvis,loft([[-.16,.085,.07],[-.115,.146,.1],[-.02,.153,.102],[.06,.138,.089],[.11,.121,.076]]),grey);
 // Elastic waistband and a narrow stitched centre fly.
 mesh(pelvis,loft([[.074,.137,.091],[.10,.127,.082],[.112,.123,.079]]),cloth);
 tube(pelvis,[[0,.075,.092],[-.008,-.02,.106],[0,-.13,.084]],.0018,seam);
 const spine=joint('spine',pelvis,[0,.10,0]);
 // Torso is one continuous fitted garment; no spherical chest pieces.
 patch(spine,100,65,(u,v)=>{
  const a=u*Math.PI*2,q=Math.abs(Math.sin(a));
  const top=.285+.052*Math.exp(-(((q-.64)/.22)**2))-.045*q**6+(Math.cos(a)<0?.016:0);
  const y=-.052+v*(top+.052),rx=y<.10?.145-y*.20:.126+(y-.10)*.22,rz=.106+(y>.16?(y-.16)*.035:0);
  const folds=(Math.sin(a*11+y*19)*.0035+Math.sin(a*7-y*25)*.0025)*Math.max(0,1-y/.30);
  return [Math.sin(a)*(rx+folds),y,Math.cos(a)*(rz+folds)];
 },cloth);
 // Sculpt the scoop neckline and deep side armholes as actual open garment surfaces.
 const chest=joint('chest',spine,[0,.20,0]);
 mesh(chest,loft([[.02,.167,.086],[.09,.177,.08],[.135,.155,.072],[.17,.075,.059],[.19,.047,.048]]),skin);
 for(const s of [-1,1]){
  // clavicle ridges, shallow enough to read through the diffuse light.
  tube(chest,[[s*.025,.16,.063],[s*.075,.152,.074],[s*.134,.145,.055]],.003,skin);
 }
 // Shoulder straps are continuous surfaces from the front neckline over the clavicle.
 for(const side of [-1,1])patch(spine,14,32,(u,v)=>[side*(.102+u*.048),.335+.020*Math.sin(v*Math.PI)+u*.002,.092-v*.18],cloth);
 // Loose lower hem and deliberate garment creases.
 for(const s of [-1,1]){
  tube(spine,[[s*.104,-.04,.075],[s*.115,.015,.07],[s*.09,.072,.065]],.002,cloth);
  tube(spine,[[s*.085,-.025,.088],[s*.025,.025,.092],[s*.10,.07,.073]],.0018,seam);
 }
 const neck=joint('neck',chest,[0,.20,0]);
 mesh(neck,loft([[-.055,.060,.052],[0,.043,.042],[.075,.039,.039],[.095,.048,.043]]),skin);
 const head=joint('head',neck,[0,.055,0]);
 mesh(head,loft([[0,.018,.03,.027],[.018,.046,.043,.024],[.042,.074,.060,.012],[.075,.083,.074,0],[.111,.098,.081,-.006],[.15,.102,.083,-.009],[.19,.10,.086,-.015],[.225,.087,.078,-.018],[.25,.055,.055,-.02],[.26,0,0,-.02]],64,(x,y,z,a)=>{
  const front=Math.max(0,Math.cos(a));
  const cheek=.007*Math.exp(-(((y-.105)/.025)**2))*Math.exp(-(((Math.abs(x)-.067)/.025)**2));
  // A flattened facial plane with recessed orbital sockets.
  let f=z+cheek*front;
  f-=.007*Math.exp(-(((y-.14)/.018)**2))*Math.exp(-(((Math.abs(x)-.045)/.026)**2))*front;
  if(front>.45&&y<.18)f+=.009*front;
  const nose=(.032*Math.exp(-(((y-.092)/.018)**2))+.014*Math.exp(-(((y-.132)/.03)**2)))*Math.exp(-((x/.010)**2));
  f+=nose*front;
  return [x,y,f];
 }),skin);
 for(const s of [-1,1]){
  
  tube(head,[[s*.008,.074,.104],[s*.012,.073,.100]],.0013,skinShade,10);
  // Almond-shaped sclera, outer corner slightly higher than the inner one.
  patch(head,32,12,(u,v)=>{const x=s*(.019+u*.057),arc=Math.pow(Math.sin(u*Math.PI),.8);return [x,.129+u*.008+(v-.5)*.014*arc,.083+arc*.015];},white);
  const eye=new THREE.Group();eye.position.set(s*.047,.135,.099);eye.rotation.y=s*.12;head.add(eye);
  ellipsoid(eye,[.010,.0075,.003],iris,[0,0,0]);
  ellipsoid(eye,[.004,.006,.0033],dark,[0,0,.002]);
  ellipsoid(eye,[.0018,.0018,.001],white,[-.003,.004,.005]);
  tube(head,[[s*.019,.129,.085],[s*.042,.141,.100],[s*.064,.145,.095],[s*.079,.14,.079]],.0018,dark);
  tube(head,[[s*.019,.128,.086],[s*.045,.129,.099],[s*.075,.137,.085]],.0012,skinShade);
  tube(head,[[s*.022,.161,.090],[s*.047,.168,.091],[s*.078,.165,.076]],.0022,hair);
  // Ear helix and inner concha, with an actual silver hoop on one side.
  const ear=ellipsoid(head,[.016,.031,.014],skin,[s*.103,.121,-.002]);ear.rotation.z=-s*.16;
  ellipsoid(head,[.007,.018,.005],skinShade,[s*.113,.124,.010]);
  tube(head,[[s*.111,.101,.014],[s*.119,.116,.014],[s*.116,.14,.010],[s*.106,.149,.009]],.003,skin);
  if(s===-1){const hoop=mesh(head,new THREE.TorusGeometry(.0065,.0016,8,32),silver,[s*.114,.09,.010]);hoop.rotation.y=.3;}
 }
 tube(head,[[-.017,.047,.083],[0,.047,.089],[.017,.048,.082]],.0008,dark);
 tube(head,[[-.012,.043,.080],[0,.042,.084],[.012,.044,.080]],.0011,skinShade);
 // Dark skull cap, the front hairline sits above the brows.
 patch(head,64,28,(u,v)=>{const a=u*Math.PI*2;const end=.95+(.40*(1-Math.cos(a)));const p=.01+v*end;return [Math.sin(a)*Math.sin(p)*.113,.157+Math.cos(p)*.125,-.021+Math.cos(a)*Math.sin(p)*.103];},hair);
 // Swept locks curve from the off-centre part, tapering at their tips.
 const locks:P3[][]=[
 [[-.03,.274,-.02],[-.065,.26,.055],[-.105,.213,.087],[-.109,.151,.082],[-.12,.118,.048]],
 [[-.027,.274,-.01],[-.048,.258,.078],[-.071,.215,.105],[-.076,.164,.107],[-.065,.134,.108]],
 [[-.024,.272,.009],[-.035,.25,.091],[-.040,.201,.113],[-.030,.166,.113],[-.015,.148,.105]],
 [[-.015,.27,.018],[.015,.25,.101],[.030,.202,.118],[.037,.168,.106],[.026,.145,.099]],
 [[-.012,.272,.002],[.039,.258,.073],[.074,.226,.099],[.092,.196,.089],[.110,.186,.057]],
 [[-.006,.27,-.02],[.065,.254,.033],[.105,.222,.070],[.124,.203,.050],[.14,.208,.022]],
 [[-.04,.27,-.04],[-.085,.25,.001],[-.12,.205,.032],[-.129,.157,.028],[-.118,.132,.010]],
 ];
 locks.forEach((points,i)=>{
  strand(head,points,.027+i%2*.007,.010,i%3===0?hairHi:hair);
  for(const offset of [-.007,.007])tube(head,points.slice(0,-1).map(p=>[p[0]+offset,p[1]+.001,p[2]+.011] as P3),.00055,hairHi,30);
 });
 for(const s of [-1,1])for(let i=0;i<8;i++){
  const a=.45+i*.27;
  strand(head,[[s*.016,.27,-.03],[s*.10,.233,-.02-i*.007],[s*(.121+i%2*.008),.16-i*.008,-.033-i*.009],[s*.105,.091-i*.005,-.039-i*.009]],.031,.012,i%3===0?hairHi:hair);
 }
 for(let i=0;i<7;i++)strand(head,[[(i-3)*.02,.22,-.092],[(i-3)*.033,.14,-.12],[(i-3)*.027,.058,-.091],[(i-3)*.03,.037,-.07]],.026,.009,hair);
 // Chain follows the clavicle and hangs as a shallow catenary.
 const chain:P3[]=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*2;chain.push([Math.cos(a)*.072,.188-Math.max(0,Math.sin(a))*.081,Math.sin(a)*(Math.sin(a)>0?.109:.05)]);}
 tube(chest,chain,.0018,silver,72);
 mesh(chest,new THREE.TorusGeometry(.007,.0016,8,24),silver,[0,.10,.113]);
 // Anatomical limbs are lofted sections rather than generic cylinders.
 for(const side of ['l','r']){
  const s=side==='l'?1:-1;
  const shoulder=joint(side+'Shoulder',chest,[s*.177,.112,0]);
  const upper=joint(side+'UpperArm',shoulder);
  mesh(upper,loft([[-.30,.035,.035],[-.273,.043,.040],[-.23,.049,.046,.002],[-.17,.064,.060,.006],[-.10,.067,.063,0],[-.035,.071,.065,0],[.021,.051,.047,0],[.037,.012,.014,0]],40,(x,y,z,a)=>[x,y,z+Math.max(0,Math.cos(a))*.006*Math.sin(-y*11)]),skin);
  const fore=joint(side+'ForeArm',upper,[0,-.29,0]);
  ellipsoid(fore,[.037,.04,.037],skin,[0,0,0]);
  mesh(fore,loft([[-.26,.025,.026],[-.235,.029,.028],[-.17,.040,.037,.005],[-.10,.048,.043,.006],[-.035,.043,.040],[.012,.033,.034]]),skin);
  const hand=joint(side+'Hand',fore,[0,-.26,0]);
  mesh(hand,loft([[-.087,.032,.016],[-.066,.038,.020],[-.035,.034,.021],[0,.025,.024]]),skin);
  for(let i=0;i<4;i++){
   const x=(i-1.5)*.017,ln=[.060,.071,.067,.052][i];
   strand(hand,[[x,-.071,.003],[x,-.092,.008],[x,-.071-ln,.017]],.009,.008,skin);
   rounded(hand,[.010,.013,.0013],new THREE.MeshStandardMaterial({color:0xecc5ad,roughness:.7}),[x,-.067-ln,.022],.003);
  }
  strand(hand,[[s*.025,-.025,.005],[s*.048,-.052,.012],[s*.050,-.079,.022]],.013,.011,skin);
  for(let i=0;i<3;i++)tube(hand,[[(i-1)*.014,-.013,.022],[(i-1)*.017,-.066,.022]],.0012,skin);
  const thigh=joint(side+'Thigh',pelvis,[s*.083,-.03,0]);
  mesh(thigh,loft([[-.49,.047,.051,.006],[-.455,.060,.062,.005],[-.38,.074,.078,-.006],[-.27,.090,.095,-.011],[-.12,.098,.101,-.009],[.015,.087,.085,0],[.038,.057,.056]],48,(x,y,z,a)=>[x+Math.sin(a)*.005*Math.sin(-y*9),y,z]),skin);
  mesh(thigh,loft([[-.151,.106,.112,-.012],[-.13,.107,.113,-.009],[-.05,.109,.113],[.02,.098,.098],[.065,.089,.09]]),grey);
  mesh(thigh,loft([[-.174,.110,.118,-.012],[-.145,.112,.119,-.012]]),cloth);
  tube(thigh,[[s*.088,.01,.05],[s*.102,-.10,.018],[s*.094,-.19,.008]],.0015,seam);
  ellipsoid(thigh,[.028,.034,.012],skin,[0,-.458,.049]);
  const shin=joint(side+'Shin',thigh,[0,-.48,0]);
  mesh(shin,loft([[-.405,.028,.028],[-.36,.029,.032,-.005],[-.27,.037,.047,-.015],[-.17,.054,.061,-.020],[-.085,.055,.058,-.012],[-.03,.046,.045],[.025,.043,.045]]),skin);
  for(const sx of [-1,1])ellipsoid(shin,[.010,.016,.012],skin,[sx*.026,-.36,-.001]);
  const foot=joint(side+'Foot',shin,[0,-.40,0]);
  // Heel, instep, metatarsal and five separate toe volumes.
  const footShape=loft([[-.056,.01,.012,.032],[-.025,.034,.028,.026],[.025,.035,.034,.022],[.08,.044,.025,.036],[.13,.045,.018,.043],[.16,.034,.014,.047],[.17,.001,.001,.048]],40);
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
