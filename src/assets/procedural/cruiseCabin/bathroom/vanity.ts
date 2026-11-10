import * as T from 'three';
import {block,cylinder,palette} from '../architecture';
import {bathMaterials,roundedPanelGeometry} from './materials';

export function buildBathVanity(vanityZone:T.Group){
 // One integrated vanity: four countertop pieces surround an actual recessed sink.
 const sink=new T.Group();sink.name='vanity-recessed-sink-assembly';vanityZone.add(sink);
 block(vanityZone,'vanity-cabinet',[.72,.13,.59],[-3.09,.36,1.24],palette.wood);
 for(const x of [-3.40,-2.78])block(vanityZone,'vanity-support',[.06,.62,.58],[x,.53,1.24],palette.wood);
 // Open walnut shelf has a true void rather than a solid rectangular cabinet.
 const storage=new T.Group();storage.name='vanity-open-storage';vanityZone.add(storage);
 block(storage,'vanity-bottom-shelf',[.61,.050,.54],[-3.09,.204,1.24],palette.wood);
 block(storage,'vanity-rear-panel',[.61,.62,.025],[-3.09,.51,.965],palette.wood);
 for(const z of [.965,1.50])block(storage,'vanity-shelf-brass-foot',[.61,.019,.016],[-3.09,.170,z],palette.gold);

 const marble=palette.marble;
 block(sink,'vanity-marble-left',[.145,.07,.66],[-3.4275,.88,1.24],marble);
 block(sink,'vanity-marble-right',[.145,.07,.66],[-2.7525,.88,1.24],marble);
 block(sink,'vanity-marble-back',[.53,.07,.13],[-3.09,.88,.975],marble);
 block(sink,'vanity-marble-front',[.53,.07,.13],[-3.09,.88,1.505],marble);
 // Lathe cross-section traces the outer wall, ceramic rim and inner bowl down to its drain.
 const profile=[
  [.0,.81],[.13,.81],[.215,.845],[.249,.91],[.265,.95],
  [.255,.973],[.222,.97],[.199,.92],[.12,.857],[.035,.841],[0,.841]
 ] as const;
 const sinkGeometry=new T.LatheGeometry(profile.map(([rad,y])=>new T.Vector2(rad,y)),24);
 const basin=new T.Mesh(sinkGeometry,palette.ivory);
 basin.name='washbasin';basin.scale.z=.74;basin.position.set(-3.09,0,1.24);
 basin.castShadow=true;basin.receiveShadow=true;sink.add(basin);
 const waste=new T.Mesh(new T.CylinderGeometry(.033,.033,.008,12),palette.gold);
 waste.name='washbasin-drain';waste.position.set(-3.09,.846,1.24);sink.add(waste);
 // Faucet stem emerges from rear marble, joins horizontal delivery arm and downturned tip.
 const faucet=new T.Group();faucet.name='vanity-faucet-assembly';sink.add(faucet);
 cylinder(faucet,'washbasin-tap',.036,.24,[-3.09,1.07,.99],palette.gold);
 block(faucet,'washbasin-faucet-spout',[.052,.048,.26],[-3.09,1.19,1.11],palette.gold);
 cylinder(faucet,'washbasin-faucet-aerator',.023,.06,[-3.09,1.151,1.23],palette.gold);
 // Rounded illuminated mirror is an inset metal-backed asset, not four floating rods.
 const mirrorKit=new T.Group();mirrorKit.name='bath-mirror-and-light-assembly';vanityZone.add(mirrorKit);
 const halo=new T.Mesh(roundedPanelGeometry(.89,1.06,.14,.019),bathMaterials.brass);
 halo.name='mirror-halo';halo.position.set(-3.09,1.76,.827);mirrorKit.add(halo);
 const glass=new T.Mesh(roundedPanelGeometry(.77,.94,.12,.023),bathMaterials.mirror);
 glass.name='mirror';glass.position.set(-3.09,1.76,.866);mirrorKit.add(glass);
 // A single continuous low-power warm border, supported by the backing plate.
 const glow=new T.Mesh(roundedPanelGeometry(.835,1.00,.13,.010),
  new T.MeshStandardMaterial({color:0xffd29b,emissive:0xffa851,emissiveIntensity:.68,roughness:.48}));
 glow.name='mirror-gold-top';glow.position.set(-3.09,1.76,.847);mirrorKit.add(glow);
 // The mirror stays on the front side of the marble wall (z > .82).
 for(const x of [-3.56,-2.62]){
  cylinder(vanityZone,'vanity-wall-light',.07,.21,[x,1.83,.92],palette.gold);
  cylinder(vanityZone,'vanity-light-globe',.11,.14,[x,1.65,.92],palette.ivory);
 }
 // Folded towels sit on the open shelf; their edges are kept inside the supports.
 for(const [i,y] of [.27,.339].entries()){
  const towel=block(storage,'vanity-folded-towel',[.44,.064,.29],[-3.09,y,1.24],palette.ivory);
  towel.rotation.y=i===0?.025:-.025;
 }
 // Two small, real mixer dials sit on the rear countertop, outside the basin cut.
 for(const x of [-3.28,-2.90]){
  cylinder(sink,'vanity-faucet-control',.026,.045,[x,.984,.97],palette.gold);
 }

}
