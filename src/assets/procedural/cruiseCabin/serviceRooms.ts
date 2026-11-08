import * as T from 'three';
import {block,cylinder,palette} from './architecture';

function ellipseRing(outerX:number,outerZ:number,innerX:number,innerZ:number,depth:number){
 const s=new T.Shape();
 s.absellipse(0,0,outerX,outerZ,0,Math.PI*2,false,0);
 const hole=new T.Path();
 hole.absellipse(0,0,innerX,innerZ,0,Math.PI*2,true,0);
 s.holes.push(hole);
 const geo=new T.ExtrudeGeometry(s,{depth,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.015,bevelThickness:.012,curveSegments:24});
 geo.rotateX(-Math.PI/2);
 return geo;
}
function vein(g:T.Group,name:string,positions:[number,number][],z:number){
 const mesh=new T.Line(new T.BufferGeometry().setFromPoints(positions.map(([x,y])=>new T.Vector3(x,y,z))),new T.LineBasicMaterial({color:0x986a40,transparent:true,opacity:.75}));
 mesh.name=name;g.add(mesh);
}
export function serviceRooms(root:T.Group){
 const g=new T.Group();g.name='cruise-marble-bathroom';root.add(g);
 block(g,'bath-marble-floor',[3.15,.035,3.02],[-4.17,.025,2.27],palette.marble);
 for(const x of [-5.60,-2.74])block(g,'bath-floor-brass-inlay',[.017,.006,2.90],[x,.047,2.27],palette.gold);
 block(g,'bath-back-marble-panel',[3.08,1.96,.035],[-4.16,1.20,.805],palette.marble);
 for(const x of [-5.64,-2.69])block(g,'bath-panel-brass-edge',[.035,1.97,.046],[x,1.20,.838],palette.gold);
 vein(g,'bath-gold-marble-vein',[[-5.45,1.58],[-5.10,1.38],[-4.78,1.60],[-4.48,1.40],[-4.08,1.85]],.826);
 vein(g,'bath-gold-marble-vein',[[-5.52,2.06],[-5.11,1.93],[-4.84,2.16],[-4.61,2.07]],.828);
 // Freestanding rounded soaking tub with genuinely open interior.
 block(g,'tub-plinth',[1.46,.24,1.88],[-4.8,.22,2.57],palette.marble);
 const tub=new T.Mesh(ellipseRing(.70,.87,.54,.68,.43),palette.ivory);
 tub.name='tub-body';tub.position.set(-4.8,.35,2.57);tub.castShadow=true;g.add(tub);
 const rim=new T.Mesh(ellipseRing(.72,.89,.54,.68,.035),palette.ivory);
 rim.name='tub-rim';rim.position.set(-4.8,.774,2.57);rim.castShadow=true;g.add(rim);
 const water=new T.Mesh(new T.CircleGeometry(1,48),palette.glass);
 water.name='tub-water';water.rotation.x=-Math.PI/2;water.scale.set(.52,.66,1);water.position.set(-4.8,.63,2.57);g.add(water);
 // Wall-mounted rain shower, gold riser, lever and spout.
 cylinder(g,'bath-tap',.045,.65,[-5.28,1.19,1.60],palette.gold);
 block(g,'shower-gold-riser',[.042,1.31,.048],[-5.28,1.88,1.43],palette.gold);
 block(g,'shower-overhead-arm',[.46,.045,.045],[-5.05,2.41,1.43],palette.gold);
 cylinder(g,'shower-rain-head',.20,.040,[-4.85,2.37,1.43],palette.gold);
 cylinder(g,'shower-control-knob',.085,.033,[-5.27,1.40,1.48],palette.gold,'z');
 block(g,'shower-spout',[.42,.040,.04],[-5.00,1.10,1.52],palette.gold);
 // A lighter vanity silhouette: marble counter, open towel shelf, two slim supports.
 block(g,'vanity-cabinet',[.72,.13,.59],[-3.09,.36,1.24],palette.wood);
 for(const x of [-3.40,-2.78])block(g,'vanity-support',[.06,.62,.58],[x,.53,1.24],palette.wood);
 block(g,'vanity-marble',[.82,.07,.66],[-3.09,.88,1.24],palette.marble);
 block(g,'washbasin',[.44,.045,.30],[-3.09,.943,1.24],palette.ivory);
 cylinder(g,'washbasin-tap',.036,.22,[-3.09,1.06,.97],palette.gold);
 // The backlit mirror is offset from the marble wall, not embedded inside it.
 block(g,'mirror-halo',[.89,1.04,.016],[-3.09,1.76,.838],palette.gold);
 block(g,'mirror',[.76,.90,.035],[-3.09,1.76,.87],palette.glass);
 block(g,'mirror-gold-top',[.81,.035,.045],[-3.09,2.22,.87],palette.gold);
 for(const x of [-3.51,-2.67])block(g,'mirror-brass-frame',[.035,.92,.055],[x,1.76,.90],palette.gold);
 for(const x of [-3.56,-2.62]){
  cylinder(g,'vanity-wall-light',.07,.21,[x,1.83,.92],palette.gold);
  cylinder(g,'vanity-light-globe',.11,.14,[x,1.65,.92],palette.ivory);
 }
 for(const y of [.25,.35])block(g,'vanity-folded-towel',[.49,.065,.30],[-3.09,y,1.25],palette.ivory);
 // Contoured contemporary toilet and elevated ceramic back.
 const bowl=new T.Mesh(new T.SphereGeometry(1,24,14),palette.ivory);
 bowl.name='toilet-bowl';bowl.position.set(-3.0,.39,3.08);bowl.scale.set(.27,.28,.36);bowl.castShadow=true;g.add(bowl);
 const seat=new T.Mesh(new T.SphereGeometry(1,24,12),palette.ivory);
 seat.name='toilet-seat';seat.position.set(-3.0,.63,3.08);seat.scale.set(.29,.055,.36);g.add(seat);
 block(g,'toilet-cistern',[.53,.61,.22],[-3.0,.74,3.48],palette.ivory);
}
