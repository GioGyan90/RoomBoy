/** The purple pelvis block only, read from the simplified 1536x1024 sheet.
 * Source pixels are retained. Hidden surfaces are explicitly provisional. */
export const pelvisFrame={frontAxis:383,backAxis:1151,sideAxis:800,scale:1.8/884} as const;
export type PelvisView='front'|'side'|'back';
export type PelvisPoint={id:string;x:number;y:number;sx:number;view:'front'|'back';depth:'visible'|'provisional'};
/** One right half of the FRONT silhouette. Left coordinates are never authored
 * independently. Centre-bottom lies on the lower silhouette edge and allows
 * mirrored triangulation without adding a vertex inside the face. */
export const pelvisHalfProfile=[
 {key:'waist-centre',x:0,y:423},
 {key:'waist-corner',x:63,y:412},
 {key:'outer-hip',x:76,y:464},
 {key:'leg-opening-corner',x:59,y:468},
 {key:'lower-corner',x:33,y:491},
 {key:'crotch-corner',x:7,y:513},
 {key:'crotch-centre',x:0,y:513},
] as const;
export const pelvisProfile=[...pelvisHalfProfile,...pelvisHalfProfile.slice(1,-1).reverse().map(p=>({...p,x:-p.x}))];
export const pelvisDepthPlanes={front:715,back:835} as const;
export const pelvisMirrorIndex=pelvisProfile.map((p,i)=>p.x===0?i:pelvisProfile.findIndex(q=>q.x===-p.x&&q.y===p.y));
/** Outer-outline cage only. Uniform thickness is a temporary depth placeholder,
 * not a fitted side view. Front/back use identical XY to prevent overhang. */
export const pelvisPoints:readonly PelvisPoint[]=(['front','back'] as const).flatMap(view=>pelvisProfile.map((p,i)=>({id:`${view==='front'?'F':'B'}${i}`,x:p.x,y:p.y,sx:pelvisDepthPlanes[view],view,depth:'provisional' as const})));
// Literal clipping paths through the original purple block. The arm is excluded
// in side view; white occlusion is NOT a hole or a generated reconstruction.
export const pelvisMasks:Record<PelvisView,readonly (readonly [number,number][])[]>={
 front:[[[321,413],[383,423],[445,413],[459,464],[442,468],[416,491],[390,513],[376,513],[350,491],[324,468],[307,464]]],
 back:[[[1088,412],[1151,416],[1214,412],[1231,470],[1212,488],[1156,510],[1146,510],[1090,488],[1071,470]]],
 side:[[[759,410],[719,423],[715,431],[718,487],[725,497],[738,465],[757,460]],[[814,416],[835,470],[827,497],[814,510],[809,496],[785,480],[795,455],[805,435]]],
};
export const pelvisReviewState={status:'awaiting-user-review',installed:false,stage:'symmetric-outline-only'} as const;
