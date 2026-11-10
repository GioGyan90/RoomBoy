import * as T from 'three';
import {block,cylinder,palette} from '../architecture';

export function buildBathShower(showerZone:T.Group){
 // One coherent, wall-mounted plumbing assembly. No hovering faucets above the tub.
 const showerMount=new T.Group();showerMount.name='wall-fixed-shower-mount';showerZone.add(showerMount);
 block(showerMount,'shower-wall-plate',[.18,.78,.035],[-5.13,1.45,.838],palette.gold);
 block(showerMount,'shower-gold-riser',[.045,1.62,.045],[-5.13,1.555,.868],palette.gold);
 block(showerMount,'shower-overhead-arm',[.045,.045,.79],[-5.13,2.33,1.275],palette.gold);
 cylinder(showerMount,'shower-rain-head',.155,.038,[-5.13,2.292,1.69],palette.gold);
 cylinder(showerMount,'shower-control-knob',.075,.045,[-5.13,1.31,.886],palette.gold,'z');
 // Independent low filler branches from the wall riser and ends at the near tub rim.
 // Real physical joins: riser -> arm -> downpipe -> rim-mounted flange.
 const filler=new T.Group();filler.name='tub-filler-connected-assembly';showerMount.add(filler);
 block(filler,'shower-spout',[.045,.045,.82],[-5.13,.955,1.278],palette.gold);
 cylinder(filler,'tub-fill-downpipe',.024,.145,[-5.13,.881,1.669],palette.gold);
 cylinder(filler,'tub-fill-rim-flange',.085,.018,[-5.13,.805,1.669],palette.gold);
 // A short wall-fed pipe from the mounting plate is deliberately visible at the connection.
 block(filler,'tub-fill-wall-feed',[.055,.055,.18],[-5.13,.955,.943],palette.gold);

}
