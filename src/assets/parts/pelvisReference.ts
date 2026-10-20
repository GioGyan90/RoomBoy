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
 {key:'front-slope-break',x:63+13*19/52,y:431},
 {key:'outer-hip',x:76,y:464},
 {key:'leg-opening-corner',x:59,y:468},
 {key:'front-wall-end',x:59-26*19/23,y:487},
 {key:'lower-corner',x:33,y:491},
 {key:'front-lower-turn',x:33-26*6/22,y:497},
 {key:'crotch-corner',x:7,y:513},
 {key:'crotch-centre',x:0,y:513},
] as const;
export const pelvisProfile=[...pelvisHalfProfile,...pelvisHalfProfile.slice(1,-1).reverse().map(p=>({...p,x:-p.x}))];
/** Visible outer side edges, measured from the simplified sheet, not the
 * internal purple/skin boundary or the arm outline. Source pixels. */
export const pelvisSideEdges={
 front:[[759,410],[719,423],[715,431],[718,487],[725,497]],
 back:[[814,416],[835,470],[827,497],[814,510]],
} as const;
// Endpoints under the arm / below visible leg opening are provisional closure.
export const pelvisSideClosure={front:[[759-80/13,412],[785,513]],back:[[814-84/54,412],[811,513]]} as const;
export function pelvisDepthAt(view:'front'|'back',y:number){
 const edge:readonly (readonly [number,number])[]=[pelvisSideClosure[view][0],...pelvisSideEdges[view].filter(p=>p[1]>412),pelvisSideClosure[view][1]];
 for(let i=1;i<edge.length;i++){const a=edge[i-1],b=edge[i];if(y<=b[1])return a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]);}
 return edge[edge.length-1][0];
}
export const pelvisMirrorIndex=pelvisProfile.map((p,i)=>p.x===0?i:pelvisProfile.findIndex(q=>q.x===-p.x&&q.y===p.y));
/** All vertices stay on the common XY rim. Depth follows visible side edges;
 * no interior vertices, independent left coordinates, or inferred muscle bulges. */
export const pelvisPoints:readonly PelvisPoint[]=(['front','back'] as const).flatMap(view=>pelvisProfile.map((p,i)=>({id:`${view==='front'?'F':'B'}${i}`,x:p.x,y:p.y,sx:pelvisDepthAt(view,p.y),view,depth:(p.y>=pelvisSideEdges[view][0][1]&&p.y<=pelvisSideEdges[view].at(-1)![1]?'visible':'provisional') as PelvisPoint['depth']})));
// Literal clipping paths through the original purple block. The arm is excluded
// in side view; white occlusion is NOT a hole or a generated reconstruction.
export const pelvisMasks:Record<PelvisView,readonly (readonly [number,number][])[]>={
 front:[[[321,413],[383,423],[445,413],[459,464],[442,468],[416,491],[390,513],[376,513],[350,491],[324,468],[307,464]]],
 back:[[[1088,412],[1151,416],[1214,412],[1231,470],[1212,488],[1156,510],[1146,510],[1090,488],[1071,470]]],
 side:[[[759,410],[719,423],[715,431],[718,487],[725,497],[738,465],[757,460]],[[814,416],[835,470],[827,497],[814,510],[809,496],[785,480],[795,455],[805,435]]],
};
export const pelvisReviewState={status:'awaiting-user-review',installed:false,stage:'symmetric-side-fit'} as const;
