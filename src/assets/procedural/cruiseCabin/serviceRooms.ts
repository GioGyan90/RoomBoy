import * as T from 'three';
import {block,cylinder,palette} from './architecture';
import {createCruiseMarblePrint} from './surfacePatterns';
const mirrorGlass=new T.MeshStandardMaterial({color:0xb5b2a9,metalness:.72,roughness:.19});
const bathWater=new T.MeshStandardMaterial({color:0xc8e3e9,roughness:.17,metalness:.06,transparent:true,opacity:.30});

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
const marbleVeinMaterial=new T.MeshStandardMaterial({map:createCruiseMarblePrint(),roughness:.4,color:0xffffff});
export function serviceRooms(root:T.Group){
 const g=new T.Group();g.name='cruise-marble-bathroom';root.add(g);
 const finish=new T.Group();finish.name='bathroom-finish-materials';g.add(finish);
 const tubZone=new T.Group();tubZone.name='bathroom-soaking-tub';g.add(tubZone);
 const showerZone=new T.Group();showerZone.name='bathroom-wall-plumbing';g.add(showerZone);
 const vanityZone=new T.Group();vanityZone.name='bathroom-vanity';g.add(vanityZone);
 const toiletZone=new T.Group();toiletZone.name='bathroom-toilet';g.add(toiletZone);
 block(finish,'bath-marble-floor',[3.15,.035,3.02],[-4.17,.025,2.27],marbleVeinMaterial);
 block(finish,'bath-back-marble-panel',[3.08,1.96,.035],[-4.16,1.20,.805],marbleVeinMaterial);
 // Freestanding rounded soaking tub with genuinely open interior.
 const plinth=new T.Mesh(new T.CylinderGeometry(1,1,.35,20),palette.ivory);
 plinth.name='tub-plinth';plinth.position.set(-4.8,.235,2.57);plinth.scale.set(.65,1,.98);
 plinth.castShadow=true;tubZone.add(plinth);
 const tub=new T.Mesh(ellipseRing(.70,1.02,.54,.81,.43),palette.ivory);
 tub.name='tub-body';tub.position.set(-4.8,.35,2.57);tub.castShadow=true;tubZone.add(tub);
 const rim=new T.Mesh(ellipseRing(.72,1.04,.54,.81,.035),palette.ivory);
 rim.name='tub-rim';rim.position.set(-4.8,.774,2.57);rim.castShadow=true;tubZone.add(rim);
 const water=new T.Mesh(new T.CircleGeometry(1,48),bathWater);
 water.name='tub-water';water.rotation.x=-Math.PI/2;water.scale.set(.51,.79,1);water.position.set(-4.8,.63,2.57);tubZone.add(water);
 // One coherent, wall-mounted plumbing assembly. No hovering faucets above the tub.
 const showerMount=new T.Group();showerMount.name='wall-fixed-shower-mount';showerZone.add(showerMount);
 block(showerMount,'shower-wall-plate',[.18,.78,.035],[-5.13,1.45,.852],palette.gold);
 block(showerMount,'shower-gold-riser',[.045,1.62,.045],[-5.13,1.555,.89],palette.gold);
 block(showerMount,'shower-overhead-arm',[.045,.045,.79],[-5.13,2.33,1.275],palette.gold);
 cylinder(showerMount,'shower-rain-head',.155,.038,[-5.13,2.275,1.69],palette.gold);
 cylinder(showerMount,'shower-control-knob',.075,.045,[-5.13,1.31,.91],palette.gold,'z');
 block(showerMount,'shower-spout',[.045,.045,.72],[-5.13,.955,1.265],palette.gold);
 // A lighter vanity silhouette: marble counter, open towel shelf, two slim supports.
 block(vanityZone,'vanity-cabinet',[.72,.13,.59],[-3.09,.36,1.24],palette.wood);
 for(const x of [-3.40,-2.78])block(vanityZone,'vanity-support',[.06,.62,.58],[x,.53,1.24],palette.wood);
 block(vanityZone,'vanity-marble',[.82,.07,.66],[-3.09,.88,1.24],palette.marble);
 block(vanityZone,'washbasin',[.44,.045,.30],[-3.09,.943,1.24],palette.ivory);
 cylinder(vanityZone,'washbasin-tap',.036,.22,[-3.09,1.06,.97],palette.gold);
 // The backlit mirror is offset from the marble wall, not embedded inside it.
 block(vanityZone,'mirror-halo',[.89,1.04,.016],[-3.09,1.76,.838],palette.gold);
 block(vanityZone,'mirror',[.76,.90,.035],[-3.09,1.76,.87],mirrorGlass);
 block(vanityZone,'mirror-gold-top',[.81,.035,.045],[-3.09,2.22,.87],palette.gold);
 for(const x of [-3.51,-2.67])block(vanityZone,'mirror-brass-frame',[.035,.92,.055],[x,1.76,.90],palette.gold);
 for(const x of [-3.56,-2.62]){
  cylinder(vanityZone,'vanity-wall-light',.07,.21,[x,1.83,.92],palette.gold);
  cylinder(vanityZone,'vanity-light-globe',.11,.14,[x,1.65,.92],palette.ivory);
 }
 for(const y of [.25,.35])block(vanityZone,'vanity-folded-towel',[.49,.065,.30],[-3.09,y,1.25],palette.ivory);
 // Unified modern toilet: pedestal, shallow oval basin, open seat ring and connected tank.
 const pedestal=new T.Mesh(new T.CylinderGeometry(.205,.17,.45,20),palette.ivory);
 pedestal.name='toilet-pedestal';pedestal.position.set(-3.35,.255,3.07);pedestal.castShadow=true;toiletZone.add(pedestal);
 const bowl=new T.Mesh(new T.SphereGeometry(1,28,18),palette.ivory);
 bowl.name='toilet-bowl';bowl.position.set(-3.35,.45,3.08);bowl.scale.set(.28,.15,.36);bowl.castShadow=true;toiletZone.add(bowl);
 const seat=new T.Mesh(ellipseRing(.285,.355,.18,.26,.034),palette.ivory);
 seat.name='toilet-seat';seat.position.set(-3.35,.585,3.08);toiletZone.add(seat);
 const inner=new T.Mesh(new T.CircleGeometry(1,32),new T.MeshStandardMaterial({color:0xc9d0cb,roughness:.75}));
 inner.name='toilet-inner';inner.rotation.x=-Math.PI/2;inner.scale.set(.175,.245,1);inner.position.set(-3.35,.593,3.08);toiletZone.add(inner);
 // Contemporary low-profile tank joined to the bowl instead of a floating round finial.
 block(toiletZone,'toilet-cistern-support',[.39,.34,.22],[-3.35,.47,3.32],palette.ivory);
 block(toiletZone,'toilet-cistern',[.49,.29,.25],[-3.35,.70,3.40],palette.ivory);
 block(toiletZone,'toilet-tank-lid',[.51,.036,.27],[-3.35,.86,3.40],palette.ivory);
}
