import * as T from 'three';
import {block,palette} from './architecture';

/** The bathroom shell is an independent architectural asset.
 * Coordinates preserve the existing walkable doorway at x=-2.5, z=2.2..3.5.
 * The low exterior cutaway is deliberate for the isometric room view, while
 * the actual door jambs and lintel form a properly supported full-height frame.
 */
export function bathroomStructure(root:T.Group){
 const shell=new T.Group();shell.name='cruise-bathroom-shell';root.add(shell);
 const walls=new T.Group();walls.name='bathroom-partitions';shell.add(walls);
 block(walls,'bath-rear-wall',[3.32,2.38,.13],[-4.16,1.19,.66],palette.marble);
 // Cutaway partition: a solid lower section, not a random freestanding tall wall.
 block(walls,'bath-divider',[.13,1.12,1.53],[-2.5,.56,1.415],palette.shell);
 block(walls,'bath-end-return',[.13,1.12,.37],[-2.5,.56,3.715],palette.shell);
 const doorway=new T.Group();doorway.name='bathroom-sliding-door-assembly';shell.add(doorway);
 // Open doorway z=2.18..3.53: two jambs physically support the high header.
 for(const z of [2.13,3.57]){
  block(doorway,'bath-door-jamb',[.15,2.39,.09],[-2.5,1.195,z],palette.wood);
  block(doorway,'bath-door-jamb-gold',[.022,2.34,.022],[-2.413,1.19,z],palette.gold);
 }
 block(doorway,'bath-door-lintel',[.15,.115,1.53],[-2.5,2.365,2.85],palette.wood);
 block(doorway,'bath-door-lintel-brass',[.02,.026,1.48],[-2.412,2.295,2.85],palette.gold);
 block(doorway,'bath-threshold',[.25,.028,1.36],[-2.5,.04,2.85],palette.gold);
 // Door leaf is parked open along the short partition (sliding-door logic).
 // It does NOT occupy the passage or swing through the adjacent toilet.
 const panel=new T.Group();panel.name='bath-door-open-panel';doorway.add(panel);
 block(panel,'bath-sliding-glass',[.045,2.18,1.11],[-2.375,1.16,1.40],new T.MeshStandardMaterial({
  color:0xc5c7bf,roughness:.39,metalness:.18,transparent:true,opacity:.33,depthWrite:false,side:T.DoubleSide
 }));
 for(const z of [.84,1.96])block(panel,'bath-sliding-edge',[.07,2.2,.035],[-2.375,1.16,z],palette.gold);
 block(panel,'bath-sliding-handle',[.085,.27,.035],[-2.327,1.05,1.89],palette.gold);
 const cutaway=new T.Group();cutaway.name='bathroom-cutaway';shell.add(cutaway);
 block(cutaway,'bath-front-cutaway',[3.32,.27,.13],[-4.16,.135,3.9],palette.shell);
 return shell;
}
