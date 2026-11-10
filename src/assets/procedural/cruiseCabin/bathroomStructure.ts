import * as T from 'three';
import {block,palette} from './architecture';
import {bathMaterials} from './bathroom/materials';

/** The bathroom shell is an independent architectural asset.
 * Coordinates preserve the existing walkable doorway at x=-2.5, z=2.2..3.5.
 * The low exterior cutaway is deliberate for the isometric room view, while
 * the actual door jambs and lintel form a properly supported full-height frame.
 */
export function bathroomStructure(root:T.Group){
 const shell=new T.Group();shell.name='cruise-bathroom-shell';root.add(shell);
 const walls=new T.Group();walls.name='bathroom-partitions';shell.add(walls);
 block(walls,'bath-rear-wall',[3.32,2.38,.13],[-4.16,1.19,.66],bathMaterials.marble);
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
 // Recessed pocket-door track bridges the rear partition into the door header.
 block(doorway,'bath-door-pocket-track',[.15,.10,1.48],[-2.5,2.365,1.405],palette.wood);
 block(doorway,'bath-door-track-brass',[.024,.018,1.46],[-2.408,2.304,1.405],palette.gold);
 // Door leaf is parked open along the short partition (sliding-door logic).
 // It does NOT occupy the passage or swing through the adjacent toilet.
 const panel=new T.Group();panel.name='bath-door-open-panel';doorway.add(panel);
 // Retain the stable object name for navigation and QA, but give the cabin
 // its concept-art walnut pocket door instead of a floating glass partition.
 block(panel,'bath-sliding-glass',[.060,2.25,1.11],[-2.405,1.1925,1.40],palette.wood);
 const face=new T.Group();face.name='bath-door-wood-inlay';panel.add(face);
 // Real recessed panel silhouette: four rails surround a darker inset rather
 // than placing a bright solid-gold slab across the face.
 const inset=new T.MeshStandardMaterial({color:0x4b3029,roughness:.75});
 block(face,'bath-pocket-door-recess',[.010,1.89,.90],[-2.377,1.20,1.40],inset);
 for(const z of [.948,1.852])block(face,'bath-pocket-door-stile',[.021,1.96,.027],[-2.376,1.20,z],palette.wood);
 for(const y of [.225,2.17])block(face,'bath-pocket-door-rail',[.021,.030,.93],[-2.376,y,1.40],palette.wood);
 // The handle is attached to the outer face of the moving leaf.

 for(const z of [.84,1.96])block(panel,'bath-sliding-edge',[.07,2.25,.035],[-2.405,1.1925,z],palette.gold);
 block(panel,'bath-sliding-handle',[.070,.25,.035],[-2.345,1.05,1.89],palette.gold);
 const cutaway=new T.Group();cutaway.name='bathroom-cutaway';shell.add(cutaway);
 block(cutaway,'bath-front-cutaway',[3.32,.27,.13],[-4.16,.135,3.9],palette.shell);
 return shell;
}
