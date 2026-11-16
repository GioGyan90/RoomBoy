/**
 * RoomBoy | reverse-engineered HEAD REGIONS v1
 *
 * Assign each actual triangle of the symmetric source GLB to exactly one
 * semantic planning region. No sculpting, re-topology or position changes.
 * Coordinates are normalized: +Y up, +Z forwards, X=0 symmetry axis.
 * Boundaries are PROVISIONAL face classifications, not hand-approved cuts.
 */
export const HEAD_REGIONS=Object.freeze([
 {id:'vault',label:'颅顶',family:'颅骨',color:0xd0ac8d,priority:'low',direction:[0,.7,-.1]},
 {id:'occiput',label:'枕骨 / 后脑',family:'颅骨',color:0x98aab6,priority:'low',direction:[0,.14,-.85]},
 {id:'forehead',label:'额骨 / 额部',family:'颅骨',color:0xe3b58c,priority:'medium',direction:[0,.3,.8]},
 {id:'temple_L',label:'左颞侧',family:'颅骨',color:0xb6a8b7,priority:'medium',direction:[-.7,.12,0]},
 {id:'temple_R',label:'右颞侧',family:'颅骨',color:0xb6a8b7,priority:'medium',direction:[.7,.12,0]},
 {id:'lateral_L',label:'左侧颅过渡',family:'颅骨',color:0xa1a5aa,priority:'low',direction:[-.7,0,-.2]},
 {id:'lateral_R',label:'右侧颅过渡',family:'颅骨',color:0xa1a5aa,priority:'low',direction:[.7,0,-.2]},
 {id:'brow_L',label:'左眉弓',family:'眼眶',color:0x92b6a6,priority:'high',direction:[-.3,.23,1]},
 {id:'brow_R',label:'右眉弓',family:'眼眶',color:0x92b6a6,priority:'high',direction:[.3,.23,1]},
 {id:'orbit_L',label:'左眼眶 / 眼睑',family:'眼眶',color:0x7caea2,priority:'high',direction:[-.4,0,1]},
 {id:'orbit_R',label:'右眼眶 / 眼睑',family:'眼眶',color:0x7caea2,priority:'high',direction:[.4,0,1]},
 {id:'nasalBridge',label:'鼻根 / 鼻梁',family:'鼻部',color:0xe3c39f,priority:'high',direction:[0,.03,1]},
 {id:'nasalTip',label:'鼻尖 / 鼻翼',family:'鼻部',color:0xe8b179,priority:'high',direction:[0,-.2,1]},
 {id:'midface',label:'面中部过渡',family:'鼻部',color:0xcab894,priority:'medium',direction:[0,-.08,.7]},
 {id:'cheek_L',label:'左颧骨 / 面颊',family:'面颊',color:0x8cabc4,priority:'medium',direction:[-.7,-.1,.5]},
 {id:'cheek_R',label:'右颧骨 / 面颊',family:'面颊',color:0x8cabc4,priority:'medium',direction:[.7,-.1,.5]},
 {id:'upperLip',label:'鼻下 / 上唇',family:'口唇',color:0xc59199,priority:'high',direction:[0,-.25,1]},
 {id:'lowerLip',label:'下唇 / 唇颏沟',family:'口唇',color:0xad8793,priority:'high',direction:[0,-.4,1]},
 {id:'chin',label:'颏部 / 下巴',family:'下颌',color:0xb8a6c7,priority:'high',direction:[0,-.75,.7]},
 {id:'jaw_L',label:'左下颌角',family:'下颌',color:0x93b2c5,priority:'medium',direction:[-.65,-.65,.3]},
 {id:'jaw_R',label:'右下颌角',family:'下颌',color:0x93b2c5,priority:'medium',direction:[.65,-.65,.3]},
 {id:'ear_L',label:'左耳廓 / 耳根',family:'耳部',color:0xc7a1b7,priority:'high',direction:[-1,0,-.05]},
 {id:'ear_R',label:'右耳廓 / 耳根',family:'耳部',color:0xc7a1b7,priority:'high',direction:[1,0,-.05]},
]);
const ID=Object.freeze(Object.fromEntries(HEAD_REGIONS.map((r,i)=>[r.id,i])));
export const HEAD_FAMILIES=Object.freeze([...new Set(HEAD_REGIONS.map(r=>r.family))]);

/** Baseline spatial seeds for the reverse-engineering study.
 * All left/right rules use abs(X), making the segmentation mirror-symmetric.
 */
export function classifyHeadFace(x,y,z){
 const a=Math.abs(x),side=x<0?'L':'R';
 if(a>.735&&y>-.35&&y<.43&&z>-.74&&z<-.19)return ID['ear_'+side];
 if(y>.78)return ID.vault;
 if(z<-.46)return ID.occiput;
 if(y>.36&&z>-.3)return ID.forehead;
 if(a>.56&&y>-.08&&z<.28)return ID['temple_'+side];
 if(y>-.14&&y<.14&&a>.19&&a<.62&&z>.10)return ID['orbit_'+side];
 if(y>=.14&&y<.37&&a>.17&&a<.65&&z>.10)return ID['brow_'+side];
 if(y>-.27&&y<.30&&a<=.18&&z>.17)return ID.nasalBridge;
 if(y>-.50&&y<=-.27&&a<=.25&&z>.18)return ID.nasalTip;
 if(y>-.58&&y<-.39&&a<=.35&&z>.11)return ID.upperLip;
 if(y>=-.70&&y<=-.58&&a<=.35&&z>.11)return ID.lowerLip;
 if(y<=-.7&&a<.40&&z>-.2)return ID.chin;
 if(y>=-.43&&y<.16&&a>.22&&a<.76&&z>-.2)return ID['cheek_'+side];
 if(y<-.39&&a>=.30&&z>-.41)return ID['jaw_'+side];
 if(a>.42)return ID['lateral_'+side];
 return ID.midface;
}

/** Preserve face identity from actual GLB indices. No vertex coordinate edits. */
export function partitionHeadFaces(positions,indices){
 if(!positions||!indices||positions.length%3||indices.length%3)throw new Error('Invalid indexed triangle geometry');
 const faces=indices.length/3,vertexCount=positions.length/3;
 const faceRegion=new Uint8Array(faces),faceIds=HEAD_REGIONS.map(()=>[]);
 const bounds=HEAD_REGIONS.map(()=>({min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]}));
 for(let f=0;f<faces;f++){
  const aa=indices[f*3],bb=indices[f*3+1],cc=indices[f*3+2];
  if(aa>=vertexCount||bb>=vertexCount||cc>=vertexCount)throw new Error('Face index exceeds the source vertex buffer');
  const x=(positions[aa*3]+positions[bb*3]+positions[cc*3])/3;
  const y=(positions[aa*3+1]+positions[bb*3+1]+positions[cc*3+1])/3;
  const z=(positions[aa*3+2]+positions[bb*3+2]+positions[cc*3+2])/3;
  const region=classifyHeadFace(x,y,z);
  faceRegion[f]=region;faceIds[region].push(f);
  const box=bounds[region];
  for(const i of [aa,bb,cc])for(let k=0;k<3;k++){
   const v=positions[i*3+k];
   box.min[k]=Math.min(box.min[k],v);box.max[k]=Math.max(box.max[k],v);
  }
 }
 const groups=HEAD_REGIONS.map((meta,i)=>({...meta,faceCount:faceIds[i].length,faceIds:faceIds[i],
  bounds:faceIds[i].length?bounds[i]:null}));
 return {faceRegion,groups,faceCount:faces,vertexCount,regions:HEAD_REGIONS};
}
export function createHeadPartsManifest(partition){
 return {schema:'roomboy.head-regions.v1',source:'grey-head-qem-symmetric.glb',
  basis:'original indexed triangles; centroid/landmark annotation, no retopology',
  coordinateSystem:'+Y up, +Z forward, X=0 symmetry plane',
  sourceFaces:partition.faceCount,sourceVertices:partition.vertexCount,
  note:'Semantic borders are provisional reverse-engineering labels, not manually approved anatomical cutting lines. Face indices refer to original symmetric GLB.',
  groups:partition.groups.map(({id,label,family,color,priority,faceCount,faceIds,bounds})=>({
   id,label,family,color:'#'+color.toString(16).padStart(6,'0'),priority,faces:faceCount,faceIds,bounds
  }))};
}
export function auditHeadParts(partition){
 const counts=new Map(partition.groups.map(g=>[g.id,g.faceCount]));
 const mirrorPairs=partition.groups.filter(g=>g.id.endsWith('_L')).map(g=>({
  left:g.id,right:g.id.slice(0,-2)+'_R',leftFaces:g.faceCount,
  rightFaces:counts.get(g.id.slice(0,-2)+'_R'),
  balanced:g.faceCount===counts.get(g.id.slice(0,-2)+'_R')
 }));
 return {sourceFaces:partition.faceCount,sourceVertices:partition.vertexCount,
  regionCount:partition.groups.length,
  unassignedFaces:partition.faceCount-partition.groups.reduce((s,g)=>s+g.faceCount,0),
  mirrorPairs,allMirroredFaceCountsEqual:mirrorPairs.every(p=>p.balanced)};
}
