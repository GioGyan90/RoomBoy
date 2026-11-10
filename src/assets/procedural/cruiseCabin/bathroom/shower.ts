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
 // Handheld shower is physically cradled beside the main riser. A curved hose
 // starts at the mixing valve and terminates at the handle (no suspended rods).
 const handheld=new T.Group();handheld.name='shower-handheld-kit';showerMount.add(handheld);
 block(handheld,'shower-handset-holder',[.12,.085,.11],[-4.995,1.64,.87],palette.gold);
 const hand=cylinder(handheld,'shower-handset-grip',.038,.24,[-4.98,1.69,.90],palette.gold);
 hand.rotation.z=-.12;
 const head=cylinder(handheld,'shower-handset-head',.080,.035,[-4.96,1.82,.90],palette.gold,'z');
 head.rotation.x=-.28;
 const hosePath=new T.CatmullRomCurve3([
  new T.Vector3(-5.13,1.31,.90),
  new T.Vector3(-5.03,1.13,1.06),
  new T.Vector3(-4.91,1.16,1.09),
  new T.Vector3(-4.98,1.51,.92),
  new T.Vector3(-4.98,1.62,.90),
 ]);
 const hose=new T.Mesh(new T.TubeGeometry(hosePath,24,.014,6,false),palette.gold);
 hose.name='shower-flexible-hose';hose.castShadow=true;handheld.add(hose);
 // A compact horizontal thermostat bridge reads as a connected fixture,
 // rather than a detached decorative knob.
 block(showerMount,'shower-thermostat-bar',[.32,.08,.075],[-5.13,1.31,.905],palette.gold);
 for(const x of [-5.27,-4.99]){
  cylinder(showerMount,'shower-mixer-dial',.056,.055,[x,1.31,.947],palette.gold,'z');
 }

 // Independent low filler branches from the wall riser and ends at the near tub rim.
 // Real physical joins: riser -> arm -> downpipe -> rim-mounted flange.
 const filler=new T.Group();filler.name='tub-filler-connected-assembly';showerMount.add(filler);
 block(filler,'shower-spout',[.045,.045,.82],[-5.13,.955,1.278],palette.gold);
 cylinder(filler,'tub-fill-downpipe',.024,.145,[-5.13,.881,1.669],palette.gold);
 cylinder(filler,'tub-fill-rim-flange',.085,.018,[-5.13,.805,1.669],palette.gold);
 // A short wall-fed pipe from the mounting plate is deliberately visible at the connection.
 block(filler,'tub-fill-wall-feed',[.055,.055,.18],[-5.13,.955,.943],palette.gold);

}
