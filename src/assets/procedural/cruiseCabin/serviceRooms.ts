import * as T from "three";
import {block,cylinder,palette} from "./architecture";
export function serviceRooms(root:T.Group){
 const g=new T.Group();g.name="cruise-marble-bathroom";root.add(g);
 block(g,"bath-marble-floor",[3.15,.035,3.02],[-4.17,.025,2.27],palette.marble);
 for(let i=0;i<5;i++)block(g,"bath-floor-brass-inlay",[.012,.006,2.93],[-5.46+i*.64,.047,2.27],palette.gold);
 block(g,"bath-back-marble-panel",[3.08,1.96,.035],[-4.16,1.20,.805],palette.marble);
 for(const x of [-5.64,-2.69])block(g,"bath-panel-brass-edge",[.035,1.97,.046],[x,1.20,.838],palette.gold);
 // Bath is a shallow open basin, with a visible interior.
 block(g,"tub-plinth",[1.38,.26,1.75],[-4.8,.24,2.57],palette.gold);
 // Open ceramic basin: separate bottom and four raised walls.
 block(g,"tub-bottom",[1.29,.10,1.64],[-4.8,.36,2.57],palette.cream);
 for(const x of [-5.405,-4.195])block(g,"tub-side-wall",[.09,.39,1.64],[x,.585,2.57],palette.cream);
 for(const z of [1.795,3.345])block(g,"tub-end-wall",[1.29,.39,.09],[-4.8,.585,z],palette.cream);
 block(g,"tub-water",[1.11,.025,1.42],[-4.8,.64,2.57],palette.glass);
 for(const x of [-5.30,-4.30])block(g,"tub-inner-shadow",[.035,.09,1.43],[x,.67,2.57],palette.marble);
 for(const x of [-5.44,-4.16])block(g,"tub-rim",[.07,.07,1.75],[x,.79,2.57],palette.gold);
 for(const z of [1.71,3.43])block(g,"tub-rim",[1.38,.07,.07],[-4.8,.79,z],palette.gold);
 cylinder(g,"bath-tap",.045,.5,[-4.15,1.04,1.95],palette.gold);
 block(g,"vanity-cabinet",[.72,.76,.59],[-3.09,.47,1.24],palette.wood);
 block(g,"vanity-marble",[.82,.07,.66],[-3.09,.88,1.24],palette.marble);
 cylinder(g,"washbasin",.24,.045,[-3.09,.94,1.24],palette.cream);
 block(g,"mirror",[.76,.9,.035],[-3.09,1.76,.87],palette.glass);
 block(g,"mirror-gold-top",[.81,.035,.045],[-3.09,2.22,.87],palette.gold);
 for(const x of [-3.51,-2.67])block(g,"mirror-brass-frame",[.035,.92,.055],[x,1.76,.90],palette.gold);
 for(const x of [-3.56,-2.62]){
  cylinder(g,"vanity-wall-light",.07,.21,[x,1.83,.92],palette.gold);
  cylinder(g,"vanity-light-globe",.11,.14,[x,1.65,.92],palette.cream);
 }
 cylinder(g,"toilet-bowl",.24,.36,[-3.0,.37,3.1],palette.cream);
 cylinder(g,"toilet-seat",.26,.055,[-3.0,.59,3.1],palette.cream);
 block(g,"toilet-cistern",[.53,.61,.22],[-3.0,.74,3.48],palette.cream);
}
