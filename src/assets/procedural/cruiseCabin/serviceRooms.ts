import * as T from "three";
import {block,cylinder,palette} from "./architecture";
export function serviceRooms(root:T.Group){
 const g=new T.Group();g.name="cruise-marble-bathroom";root.add(g);
 block(g,"bath-marble-floor",[3.15,.035,3.02],[-4.17,.025,2.27],palette.marble);
 // Bath is a shallow open basin, with a visible interior.
 block(g,"tub-plinth",[1.38,.26,1.75],[-4.8,.24,2.57],palette.gold);
 block(g,"tub-shell",[1.31,.48,1.66],[-4.8,.54,2.57],palette.cream);
 block(g,"tub-water",[1.11,.025,1.42],[-4.8,.796,2.57],palette.glass);
 for(const x of [-5.44,-4.16])block(g,"tub-rim",[.07,.07,1.75],[x,.79,2.57],palette.gold);
 for(const z of [1.71,3.43])block(g,"tub-rim",[1.38,.07,.07],[-4.8,.79,z],palette.gold);
 cylinder(g,"bath-tap",.045,.5,[-4.15,1.04,1.95],palette.gold);
 block(g,"vanity-cabinet",[.72,.76,.59],[-3.09,.47,1.24],palette.wood);
 block(g,"vanity-marble",[.82,.07,.66],[-3.09,.88,1.24],palette.marble);
 cylinder(g,"washbasin",.24,.045,[-3.09,.94,1.24],palette.cream);
 block(g,"mirror",[.76,.9,.035],[-3.09,1.76,.77],palette.glass);
 block(g,"mirror-gold-top",[.81,.035,.045],[-3.09,2.22,.77],palette.gold);
 cylinder(g,"toilet-bowl",.24,.36,[-3.0,.37,3.1],palette.cream);
 cylinder(g,"toilet-seat",.26,.055,[-3.0,.59,3.1],palette.cream);
 block(g,"toilet-cistern",[.53,.61,.22],[-3.0,.74,3.48],palette.cream);
}
