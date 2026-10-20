/** The purple pelvis block only, read from the simplified 1536x1024 sheet.
 * Source pixels are retained. Hidden surfaces are explicitly provisional. */
export const pelvisFrame={frontAxis:383,backAxis:1151,sideAxis:800,scale:1.8/884} as const;
export type PelvisView='front'|'side'|'back';
export type PelvisPoint={id:string;x:number;y:number;sx:number;view:'front'|'back';depth:'visible'|'provisional'};
// A bevelled wedge: eleven front perimeter corners, nine back perimeter corners and five face corners per side.
// x is a signed distance from that view's centre, converted to world x below.
export const pelvisPoints:readonly PelvisPoint[]=[
 {id:'F0',x:-63,y:412,sx:760,view:'front',depth:'provisional'},
 {id:'F1',x:0,y:423,sx:719,view:'front',depth:'visible'},
 {id:'F2',x:63,y:412,sx:760,view:'front',depth:'provisional'},
 {id:'F3',x:76,y:464,sx:758,view:'front',depth:'provisional'},
 {id:'F4',x:59,y:468,sx:738,view:'front',depth:'visible'},
 {id:'F5',x:33,y:491,sx:725,view:'front',depth:'visible'},
 {id:'F6',x:7,y:513,sx:759,view:'front',depth:'provisional'},
 {id:'F7',x:-7,y:513,sx:759,view:'front',depth:'provisional'},
 {id:'F8',x:-33,y:491,sx:725,view:'front',depth:'visible'},
 {id:'F9',x:-59,y:468,sx:738,view:'front',depth:'visible'},
 {id:'F10',x:-76,y:464,sx:758,view:'front',depth:'provisional'},
 {id:'F11',x:-50,y:432,sx:715,view:'front',depth:'visible'},
 {id:'F12',x:50,y:432,sx:715,view:'front',depth:'visible'},
 {id:'F13',x:44,y:480,sx:718,view:'front',depth:'visible'},
 {id:'F14',x:0,y:490,sx:718,view:'front',depth:'visible'},
 {id:'F15',x:-44,y:480,sx:718,view:'front',depth:'visible'},
 {id:'B0',x:-63,y:412,sx:806,view:'back',depth:'provisional'},
 {id:'B1',x:0,y:416,sx:813,view:'back',depth:'provisional'},
 {id:'B2',x:63,y:412,sx:806,view:'back',depth:'provisional'},
 {id:'B3',x:80,y:470,sx:835,view:'back',depth:'visible'},
 {id:'B4',x:61,y:488,sx:827,view:'back',depth:'visible'},
 {id:'B5',x:5,y:510,sx:814,view:'back',depth:'visible'},
 {id:'B6',x:-5,y:510,sx:814,view:'back',depth:'visible'},
 {id:'B7',x:-61,y:488,sx:827,view:'back',depth:'visible'},
 {id:'B8',x:-80,y:470,sx:835,view:'back',depth:'visible'},
 {id:'B9',x:-49,y:430,sx:820,view:'back',depth:'provisional'},
 {id:'B10',x:49,y:430,sx:820,view:'back',depth:'provisional'},
 {id:'B11',x:44,y:468,sx:827,view:'back',depth:'visible'},
 {id:'B12',x:0,y:476,sx:833,view:'back',depth:'visible'},
 {id:'B13',x:-44,y:468,sx:827,view:'back',depth:'visible'},
];
export const pelvisFrontPolygons=[
 [0,1,2,12,11],[2,3,4,13,12],[4,5,6,14,13],[6,7,14],
 [7,8,9,15,14],[9,10,0,11,15],[11,12,13,14,15],
] as const;
export const pelvisBackPolygons=[
 [0,1,2,10,9],[2,3,11,10],[3,4,5,12,11],[5,6,12],
 [6,7,8,13,12],[8,0,9,13],[9,10,11,12,13],
] as const;
// Literal clipping paths through the original purple block. The arm is excluded
// in side view; white occlusion is NOT a hole or a generated reconstruction.
export const pelvisMasks:Record<PelvisView,readonly (readonly [number,number][])[]>={
 front:[[[321,413],[383,423],[445,413],[459,464],[442,468],[416,491],[390,513],[376,513],[350,491],[324,468],[307,464]]],
 back:[[[1088,412],[1151,416],[1214,412],[1231,470],[1212,488],[1156,510],[1146,510],[1090,488],[1071,470]]],
 side:[[[759,410],[719,423],[715,431],[718,487],[725,497],[738,465],[757,460]],[[814,416],[835,470],[827,497],[814,510],[809,496],[785,480],[795,455],[805,435]]],
};
export const pelvisReviewState={status:'awaiting-user-review',installed:false} as const;
