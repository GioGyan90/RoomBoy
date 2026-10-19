import * as T from 'three';

/** Metres. Image landmarks estimated from the supplied 1200 × 800 turnaround.
 * These are editable design measurements, not inferred anatomical ground truth. */
export const bodyPlan = {
 height:1.80, chin:1.563, shoulder:1.49, waist:1.063, crotch:.842,
 knee:.553, ankle:.115, shoulderWidth:.461, waistWidth:.300, hipWidth:.345,
 headWidth:.176, headDepth:.205,
} as const;
export type BodyStage='blockout'|'planes';
type Ring=readonly [y:number, halfWidth:number, halfDepth:number, z?:number, x?:number];

/** Explicit polygon cage: no smoothing, spline inflation, or hidden subdivision. */
export function cage(rings:readonly Ring[],sides:number){
 const p:number[]=[],idx:number[]=[];
 for(const [y,w,d,z=0,x=0] of rings)for(let i=0;i<sides;i++){
  const a=i/sides*Math.PI*2;p.push(x+Math.sin(a)*w,y,z+Math.cos(a)*d);
 }
 for(let r=0;r<rings.length-1;r++)for(let i=0;i<sides;i++){
  const a=r*sides+i,b=r*sides+(i+1)%sides,c=a+sides,d=b+sides;idx.push(a,b,c,b,d,c);
 }
 // Separate centre vertices close the ends, including hands and heels.
 for(const end of [0,rings.length-1]){
  const [y,,,z=0,x=0]=rings[end],c=p.length/3;p.push(x,y,z);
  for(let i=0;i<sides;i++){const a=end*sides+i,b=end*sides+(i+1)%sides;idx.push(...(end===0?[c,b,a]:[c,a,b]));}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}

export function createBodyBlockout(stage:BodyStage){
 const root=new T.Group();root.name=`body-${stage}`;
 const refined=stage==='planes',sides=refined?12:8;
 const palette={head:0xc9bdaa,torso:0xa9b8bb,pelvis:0xb9aaa1,limbs:0xc6c1b5,joints:0xb1ada3,hair:0x5e6060};
 function mass(name:string,rings:readonly Ring[],color:number,n=sides){
  const m=new T.Mesh(cage(rings,n),new T.MeshStandardMaterial({color,roughness:1,flatShading:true}));
  m.name=name;root.add(m);return m;
 }
 // Horizontal landmark heights are shared by both stages. The second stage
 // adds cross sections to clarify planes, not decorative anatomy.
 const pelvis=mass('pelvis',[[.842,.160,.070,.005],[.960,.1725,.105,-.012],[1.015,.162,.102,-.008],[1.063,.150,.085,0]],palette.pelvis);
 // A slanted lower rim leaves room for the thighs instead of a barrel edge.
 const pelvisPositions=pelvis.geometry.getAttribute('position');
 for(let i=0;i<sides;i++)pelvisPositions.setY(i,.842+.105*Math.abs(Math.sin(i/sides*Math.PI*2)));
 pelvis.geometry.computeVertexNormals();
 mass('abdomen',[[1.015,.151,.087,0],[1.14,.145,.082,0],[1.23,.161,.101,-.008]],palette.torso);
 mass('ribcage',refined?[
  [1.13,.145,.083,0],[1.22,.165,.105,-.009],[1.34,.187,.119,-.012],
  [1.43,.196,.119,-.017],[1.49,.183,.096,-.018],[1.535,.071,.063,-.023],
 ]:[ [1.13,.145,.083,0],[1.35,.187,.119,-.012],[1.49,.183,.096,-.018],[1.535,.071,.063,-.023] ],palette.torso);
 mass('neck',[[1.50,.055,.050,-.020],[1.58,.041,.044,-.012],[1.62,.043,.046,-.007]],palette.joints);
 const head=mass('head',refined?[
  [1.563,.027,.039,.047],[1.583,.051,.058,.028],[1.621,.078,.079,.006],
  [1.674,.088,.093,-.002],[1.727,.086,.095,-.009],[1.766,.069,.076,-.013],[1.787,.035,.043,-.014],
 ]:[ [1.563,.027,.039,.047],[1.621,.078,.079,.006],[1.727,.088,.095,-.009],[1.787,.035,.043,-.014] ],palette.head);
 // One hair envelope only. Hair volume belongs to the silhouette, not to strands.
 mass('hair-envelope',[[1.686,.086,.092,-.025],[1.745,.101,.107,-.020],[1.782,.074,.080,-.017],[1.80,.024,.029,-.011]],palette.hair);
 // Keep the facial plane in the same closed cage; never attach a floating nose.
 if(refined){const positions=head.geometry.getAttribute('position');positions.setZ(2*sides,.104);head.geometry.computeVertexNormals();}
 for(const s of [-1,1]){
  const r=(a:readonly Ring[])=>a.map(([y,w,d,z=0,x=0])=>[y,w,d,z,s*x] as Ring);
  const prefix=s===-1?'right':'left';
  mass(`${prefix}-deltoid`,r([[1.368,.041,.058,-.008,.192],[1.435,.0485,.068,-.016,.182],[1.49,.025,.039,-.021,.171]]),palette.limbs);
  mass(`${prefix}-upper-arm`,r(refined?[
   [1.122,.027,.032,.005,.226],[1.20,.035,.044,.002,.221],[1.31,.041,.053,-.009,.204],[1.41,.041,.055,-.014,.191],
  ]:[ [1.122,.027,.032,.005,.226],[1.30,.041,.053,-.009,.204],[1.41,.041,.055,-.014,.191] ]),palette.limbs);
  mass(`${prefix}-forearm`,r([[.899,.020,.022,.026,.239],[1.025,.030,.038,.015,.235],[1.105,.034,.036,.007,.229],[1.14,.027,.031,.004,.226]]),palette.limbs);
  mass(`${prefix}-hand`,r([[.792,.021,.017,.041,.243],[.824,.027,.022,.037,.244],[.874,.031,.023,.029,.243],[.907,.020,.022,.026,.239]]),palette.head);
  mass(`${prefix}-thigh`,r(refined?[
   [.553,.041,.046,.018,.100],[.65,.051,.061,.015,.104],[.78,.069,.083,-.005,.105],[.90,.075,.092,-.018,.098],[.96,.067,.085,-.017,.094],
  ]:[ [.553,.041,.046,.018,.100],[.78,.069,.083,-.005,.105],[.96,.067,.085,-.017,.094] ]),palette.limbs);
  mass(`${prefix}-shin`,r([[.115,.024,.028,-.004,.117],[.26,.031,.041,-.014,.111],[.405,.047,.056,-.019,.105],[.49,.043,.050,.004,.102],[.568,.038,.043,.018,.100]]),palette.limbs);
  mass(`${prefix}-foot`,r([[0,.038,.109,.050,.119],[.038,.040,.117,.054,.119],[.079,.031,.063,.011,.117],[.125,.024,.028,-.004,.117]]),palette.head);
 }
 root.userData.triangles=0;root.traverse(o=>{if(o instanceof T.Mesh)root.userData.triangles+=o.geometry.index!.count/3;});
 return root;
}
