import * as T from "three";
import {block,cylinder,palette} from "./architecture";
export function furniture(root:T.Group){
 const g=new T.Group();g.name="cabin-bedroom-and-lounge";root.add(g);
 // Bed faces the front, with an accessible foot and both side aisles.
 block(g,"king-bed-base",[2.7,.45,2.65],[-1.05,.31,-2.03],palette.wood);
 block(g,"king-mattress",[2.56,.24,2.49],[-1.05,.65,-2.03],palette.cream);
 block(g,"burgundy-duvet",[2.53,.12,1.45],[-1.05,.81,-1.48],palette.burgundy);
 block(g,"upholstered-headboard",[3.12,1.33,.22],[-1.05,1.23,-3.54],palette.burgundy);
 for(const x of [-2.55,.45]){
  block(g,"bedside-table",[.55,.67,.58],[x,.37,-3.2],palette.wood);
  cylinder(g,"bedside-lamp",.17,.29,[x,.84,-3.2],palette.gold);
 }
 for(const x of [-1.69,-.41])block(g,"pillow",[.92,.17,.47],[x,.86,-2.92],palette.cream);
 // Cocktail lounge and minibar.
 block(g,"lounge-sofa",[2.2,.54,.84],[3.82,.42,.55],palette.burgundy);
 block(g,"sofa-back",[2.2,.79,.24],[3.82,.86,.17],palette.burgundy);
 for(const x of [2.81,4.83])block(g,"sofa-arm",[.22,.68,.84],[x,.65,.55],palette.burgundy);
 cylinder(g,"round-coffee-table",.54,.10,[3.55,.57,1.85],palette.marble);
 cylinder(g,"table-pedestal",.12,.53,[3.55,.29,1.85],palette.gold);
 block(g,"minibar",[1.45,.91,.61],[1.35,.48,-3.22],palette.wood);
 block(g,"minibar-counter",[1.53,.08,.68],[1.35,.96,-3.22],palette.marble);
 for(let i=0;i<3;i++)cylinder(g,"glassware",.085,.16,[.94+i*.38,1.11,-3.2],palette.glass);
 block(g,"wardrobe",[1.55,2.31,.65],[-4.69,1.18,-3.32],palette.wood);
 for(const x of [-5.06,-4.29])block(g,"wardrobe-gold-handle",[.035,.4,.05],[x,1.2,-2.97],palette.gold);
 // Decorative floor runners, wall trim and ship fittings.
 block(g,"bedside-rug",[3.5,.025,3.1],[-1.05,.025,-1.67],palette.burgundy);
 block(g,"lounge-rug",[3.0,.024,2.55],[3.72,.026,1.15],palette.cream);
}
