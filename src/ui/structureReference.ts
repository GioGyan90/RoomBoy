import * as T from 'three';
import {referenceFrame,sourceJoints,viewJoints,type StudyView,type JointName} from '../assets/procedural/bodyReference';
import type {MeshLandmarks} from '../assets/procedural/bodyConstraints';

export function clearStudyGroup(group:T.Group){
 group.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line||o instanceof T.Sprite){
  if('geometry' in o)o.geometry.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]) as (T.Material&{map?:T.Texture})[]){m.map?.dispose();m.dispose();}
 }});group.clear();
}
/** Display only: the original file is read locally and never sent to a server. */
export function addReferenceProjection(group:T.Group,image:HTMLImageElement,view:string,offset:number,opacity:number){
 const f=referenceFrame,axis=view==='side'?f.sideAxis:view==='back'?f.backAxis:f.frontAxis;
 const width=view==='side'?f.sideCrop:f.frontCrop,left=axis-width/2,top=f.cropTop,height=f.cropHeight;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 canvas.getContext('2d')!.drawImage(image,left,top,width,height,0,0,width,height);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const plane=new T.Mesh(new T.PlaneGeometry(width*f.scale,height*f.scale),new T.MeshBasicMaterial({map:texture,transparent:true,opacity,depthWrite:false}));
 plane.position.set(offset+(left+width/2-axis)*f.scale,(f.ground-top-height/2)*f.scale,-.5);group.add(plane);
}
export function addLandmarkMarkers(parent:T.Group,actual:MeshLandmarks,view:StudyView){
 const material=new T.MeshBasicMaterial({color:0x008969,depthTest:false});
 const points=Object.entries(sourceJoints);
 for(const [index,[name]] of points.entries()){
  if(!viewJoints[name as JointName][view])continue;
  const position=new T.Vector3(...actual[name as JointName]);
  const dot=new T.Mesh(new T.SphereGeometry(.007,8,6),material.clone());dot.position.copy(position);dot.renderOrder=4;parent.add(dot);
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=48;
  const ctx=canvas.getContext('2d')!;ctx.font='bold 29px sans-serif';ctx.textAlign='center';ctx.fillStyle='#005740';ctx.strokeStyle='white';ctx.lineWidth=5;ctx.strokeText(String(index+1),32,35);ctx.fillText(String(index+1),32,35);
  const label=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),depthTest:false}));label.position.copy(position).add(new T.Vector3(.021,.018,0));label.scale.set(.045,.034,1);label.renderOrder=5;parent.add(label);
 }
 material.dispose();
 const links=[['crown','chin'],['chin','neck'],['neck','rightShoulder'],['neck','leftShoulder'],['rightShoulder','rightElbow'],['rightElbow','rightWrist'],['leftShoulder','leftElbow'],['leftElbow','leftWrist'],['rightHip','leftHip'],['rightHip','rightKnee'],['rightKnee','rightAnkle'],['leftHip','leftKnee'],['leftKnee','leftAnkle']] as const;
 const vertices=links.filter(([a,b])=>viewJoints[a][view]&&viewJoints[b][view]).flatMap(([a,b])=>[new T.Vector3(...actual[a]),new T.Vector3(...actual[b])]);
 const lines=new T.LineSegments(new T.BufferGeometry().setFromPoints(vertices),new T.LineBasicMaterial({color:0x008969,transparent:true,opacity:.45,depthTest:false}));lines.renderOrder=3;parent.add(lines);
}

/** Independent original-image targets; unlike mesh markers these stay fixed. */
export function addViewTargets(parent:T.Group,actual:MeshLandmarks,view:StudyView,offset:number,drawError=true){
 const f=referenceFrame,axis=view==='front'?f.frontAxis:view==='side'?f.sideAxis:f.backAxis,vertices:T.Vector3[]=[];
 for(const name of Object.keys(viewJoints) as JointName[]){
  const target=viewJoints[name][view];if(!target)continue;
  const x=offset+(target[0]-axis)*f.scale,y=(f.ground-target[1])*f.scale,r=.010;
  vertices.push(new T.Vector3(x-r,y,.35),new T.Vector3(x+r,y,.35),new T.Vector3(x,y-r,.35),new T.Vector3(x,y+r,.35));
  const p=actual[name],px=offset+(view==='front'?p[0]:view==='side'?-p[2]:-p[0]);
  if(drawError)vertices.push(new T.Vector3(px,p[1],.35),new T.Vector3(x,y,.35));
 }
 const lines=new T.LineSegments(new T.BufferGeometry().setFromPoints(vertices),new T.LineBasicMaterial({color:0xc34469,depthTest:false}));lines.renderOrder=6;parent.add(lines);
}

/** Measured surface corners for the current edit pass, separate from joint centres. */
export function addEditedVertices(parent:T.Group,report:{id:string;position:number[];targets:Partial<Record<StudyView,readonly number[]>>}[],view:StudyView|undefined,focus:string){
 for(const r of report){if(view&&!r.targets[view])continue;if(focus==='neck'&&!r.id.startsWith('N'))continue;if(focus==='hips'&&r.id.startsWith('N'))continue;
  const point=new T.Vector3(...r.position as [number,number,number]);
  const dot=new T.Mesh(new T.SphereGeometry(.004,6,4),new T.MeshBasicMaterial({color:0x008969,depthTest:false}));dot.position.copy(point);dot.renderOrder=8;parent.add(dot);
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=48;const ctx=canvas.getContext('2d')!;ctx.font='bold 26px sans-serif';ctx.textAlign='center';ctx.fillStyle='#005740';ctx.strokeStyle='white';ctx.lineWidth=4;ctx.strokeText(r.id,48,34);ctx.fillText(r.id,48,34);
  const label=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),depthTest:false}));label.position.copy(point).add(new T.Vector3(.016,.012,0));label.scale.set(.038,.019,1);label.renderOrder=9;parent.add(label);
 }
}
