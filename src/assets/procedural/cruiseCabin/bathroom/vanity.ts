import * as T from 'three';
import {block,cylinder,palette} from '../architecture';
import {bathMaterials} from './materials';

export function buildBathVanity(vanityZone:T.Group){
 // One integrated vanity: four countertop pieces surround an actual recessed sink.
 const sink=new T.Group();sink.name='vanity-recessed-sink-assembly';vanityZone.add(sink);
 block(vanityZone,'vanity-cabinet',[.72,.13,.59],[-3.09,.36,1.24],palette.wood);
 for(const x of [-3.40,-2.78])block(vanityZone,'vanity-support',[.06,.62,.58],[x,.53,1.24],palette.wood);
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
 // The backlit mirror is offset from the marble wall, not embedded inside it.
 block(vanityZone,'mirror-halo',[.89,1.04,.016],[-3.09,1.76,.838],palette.gold);
 block(vanityZone,'mirror',[.76,.90,.035],[-3.09,1.76,.87],bathMaterials.mirror);
 block(vanityZone,'mirror-gold-top',[.81,.035,.045],[-3.09,2.22,.87],palette.gold);
 for(const x of [-3.51,-2.67])block(vanityZone,'mirror-brass-frame',[.035,.92,.055],[x,1.76,.90],palette.gold);
 for(const x of [-3.56,-2.62]){
  cylinder(vanityZone,'vanity-wall-light',.07,.21,[x,1.83,.92],palette.gold);
  cylinder(vanityZone,'vanity-light-globe',.11,.14,[x,1.65,.92],palette.ivory);
 }
 for(const y of [.25,.35])block(vanityZone,'vanity-folded-towel',[.49,.065,.30],[-3.09,y,1.25],palette.ivory);

}
