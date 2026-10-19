import * as T from 'three';
import {referenceFrame,sourceJoints,sourcePoint} from '../assets/procedural/bodyReference';

export function clearStudyGroup(group:T.Group){
 group.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.Line||o instanceof T.Sprite){
  if('geometry' in o)o.geometry.dispose();const m=o.material as T.Material&{map?:T.Texture};m.map?.dispose();m.dispose();
 }});group.clear();
}
/** Display only: the original file is read locally and never sent to a server. */
export function addReferenceProjection(group:T.Group,image:HTMLImageElement,view:string,offset:number,opacity:number){
 const f=referenceFrame,axis=view==='side'?f.sideAxis:view==='back'?f.backAxis:f.frontAxis;
 const left=axis-(view==='side'?110:135),top=20,width=view==='side'?180:270,height=760;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 canvas.getContext('2d')!.drawImage(image,left,top,width,height,0,0,width,height);
 const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
 const plane=new T.Mesh(new T.PlaneGeometry(width*f.scale,height*f.scale),new T.MeshBasicMaterial({map:texture,transparent:true,opacity,depthWrite:false}));
 plane.position.set(offset+(left+width/2-axis)*f.scale,(f.ground-top-height/2)*f.scale,-.5);group.add(plane);
}
export function addLandmarkMarkers(parent:T.Group){
 const material=new T.MeshBasicMaterial({color:0x008969,depthTest:false});
 const points=Object.entries(sourceJoints);
 for(const [index,[,p]] of points.entries()){
  const position=new T.Vector3(...sourcePoint(p));
  const dot=new T.Mesh(new T.SphereGeometry(.007,8,6),material.clone());dot.position.copy(position);dot.renderOrder=4;parent.add(dot);
  const canvas=document.createElement('canvas');canvas.width=64;canvas.height=48;
  const ctx=canvas.getContext('2d')!;ctx.font='bold 29px sans-serif';ctx.textAlign='center';ctx.fillStyle='#005740';ctx.strokeStyle='white';ctx.lineWidth=5;ctx.strokeText(String(index+1),32,35);ctx.fillText(String(index+1),32,35);
  const label=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(canvas),depthTest:false}));label.position.copy(position).add(new T.Vector3(.021,.018,0));label.scale.set(.045,.034,1);label.renderOrder=5;parent.add(label);
 }
 material.dispose();
 const links=[['crown','chin'],['chin','neck'],['neck','rightShoulder'],['neck','leftShoulder'],['rightShoulder','rightElbow'],['rightElbow','rightWrist'],['leftShoulder','leftElbow'],['leftElbow','leftWrist'],['rightHip','leftHip'],['rightHip','rightKnee'],['rightKnee','rightAnkle'],['leftHip','leftKnee'],['leftKnee','leftAnkle']] as const;
 const vertices=links.flatMap(([a,b])=>[new T.Vector3(...sourcePoint(sourceJoints[a])),new T.Vector3(...sourcePoint(sourceJoints[b]))]);
 const lines=new T.LineSegments(new T.BufferGeometry().setFromPoints(vertices),new T.LineBasicMaterial({color:0x008969,transparent:true,opacity:.45,depthTest:false}));lines.renderOrder=3;parent.add(lines);
}
