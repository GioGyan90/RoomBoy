import {bodyBands,sourceJoints,viewJoints,referenceFrame as f,type BodyTargets,type SourceBand,type JointName,type StudyView} from './bodyReference';
export type BodyPart=keyof typeof bodyBands;
type MutableBand=[number,number,number,number,number];
function section(bands:readonly SourceBand[],y:number):MutableBand{
 const sorted=[...bands].sort((a,b)=>b[0]-a[0]);
 let a=sorted[0],b=a;
 if(y<=sorted.at(-1)![0])a=b=sorted.at(-1)!;
 else for(let i=0;i<sorted.length-1;i++)if(y<=sorted[i][0]&&y>=sorted[i+1][0]){a=sorted[i];b=sorted[i+1];break;}
 const t=a[0]===b[0]?0:(y-a[0])/(b[0]-a[0]);return [y,...a.slice(1).map((v,i)=>v+(b[i+1]-v)*t)] as MutableBand;
}
/** Joint centres move real section vertices. End collars share the same station. */
export function constrainBands(part:BodyPart,targets:BodyTargets):SourceBand[]{
 let bands:MutableBand[]=bodyBands[part].map(b=>[...b]);
 function pin(name:JointName,end:'bottom'|'top'|'insert',radiusScale=1){
  const [x,y,sx]=targets[name],old=section(bands,y),w=(old[2]-old[1])/2*radiusScale,d=(old[4]-old[3])/2*radiusScale;
  if(end==='bottom')bands.shift();else if(end==='top')bands.pop();
  bands=bands.filter(b=>Math.abs(b[0]-y)>.001);bands.push([y,x-w,x+w,sx-d,sx+d]);bands.sort((a,b)=>b[0]-a[0]);
 }
 if(part==='neck')pin('neck','bottom');
 for(const side of ['right','left'] as const){
  const joint=(name:'Shoulder'|'Elbow'|'Wrist'|'Hip'|'Knee'|'Ankle')=>`${side}${name}` as JointName;
  if(part===`${side}Deltoid`)pin(joint('Shoulder'),'insert');
  if(part===`${side}UpperArm`){pin(joint('Elbow'),'bottom');pin(joint('Shoulder'),'insert',.6);}
  if(part===`${side}Forearm`){pin(joint('Wrist'),'bottom');pin(joint('Elbow'),'top');}
  if(part===`${side}Hand`)pin(joint('Wrist'),'top');
  if(part===`${side}Thigh`){pin(joint('Knee'),'bottom');pin(joint('Hip'),'top');}
  if(part===`${side}Shin`){pin(joint('Ankle'),'bottom');pin(joint('Knee'),'top');}
  if(part===`${side}Foot`)pin(joint('Ankle'),'top');
 }
 // Chin is a surface constraint rather than a section's centre.
 if(part==='head'){const [x,y,sx]=targets.chin,w=(bands[0][2]-bands[0][1])/2;bands[0]=[y,x-w,x+w,sx,bands[0][4]];}
 return bands;
}
export type MeshLandmarks=Record<JointName,readonly [number,number,number]>;
export function projectLandmark(p:readonly number[],view:StudyView):[number,number]{
 const x=view==='front'?f.frontAxis+p[0]/f.scale:view==='back'?f.backAxis-p[0]/f.scale:f.sideAxis-p[2]/f.scale;
 return [x,f.ground-p[1]/f.scale];
}
export function measureReprojection(actual:MeshLandmarks){
 return Object.fromEntries((['front','side','back'] as const).map(view=>{
  const errors=Object.keys(sourceJoints).flatMap(key=>{const name=key as JointName,target=viewJoints[name][view];if(!target)return [];const p=projectLandmark(actual[name],view);return [{name,dx:p[0]-target[0],dy:p[1]-target[1],pixels:Math.hypot(p[0]-target[0],p[1]-target[1])}];});
  return [view,{rms:Math.sqrt(errors.reduce((sum,e)=>sum+e.pixels**2,0)/errors.length),max:Math.max(...errors.map(e=>e.pixels)),errors}];
 })) as Record<StudyView,{rms:number;max:number;errors:{name:JointName;dx:number;dy:number;pixels:number}[]}>;
}
