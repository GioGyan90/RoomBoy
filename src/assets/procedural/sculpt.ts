import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
export type P3=[number,number,number];
export type Ring=[number,number,number,number?];
export function mesh(parent:T.Object3D,geo:T.BufferGeometry,mat:T.Material,pos:P3=[0,0,0]){
 const m=new T.Mesh(geo,mat);m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function rounded(parent:T.Object3D,size:P3,mat:T.Material,pos:P3,r=.012){return mesh(parent,new RoundedBoxGeometry(...size,2,r),mat,pos);}
export function ellipsoid(parent:T.Object3D,size:P3,mat:T.Material,pos:P3){const g=new T.SphereGeometry(1,24,16);g.scale(...size);return mesh(parent,g,mat,pos);}
/** Smooth cross-sections with local sculpt offsets; all source vertices are authored here. */
export function loft(rings:Ring[],segments=40,deform?:(x:number,y:number,z:number,a:number)=>P3){
 const smooth:Ring[]=[];
 for(let i=0;i<rings.length-1;i++)for(let k=0;k<5;k++){
  const t=k/5,a=rings[Math.max(0,i-1)],b=rings[i],c=rings[i+1],d=rings[Math.min(rings.length-1,i+2)];
  const cubic=(n:number)=>{const p=a[n]??0,q=b[n]??0,r=c[n]??0,s=d[n]??0;return .5*((2*q)+(-p+r)*t+(2*p-5*q+4*r-s)*t*t+(-p+3*q-3*r+s)*t*t*t);};
  smooth.push([b[0]+(c[0]-b[0])*t,Math.max(0,cubic(1)),Math.max(0,cubic(2)),cubic(3)]);
 }
 smooth.push(rings[rings.length-1]);rings=smooth;
 const vertices:number[]=[],indices:number[]=[];
 for(const [y,rx,rz,cz=0] of rings)for(let j=0;j<=segments;j++){
  const a=j/segments*Math.PI*2,x=Math.sin(a)*rx,z=Math.cos(a)*rz+cz;
  vertices.push(...(deform?deform(x,y,z,a):[x,y,z]));
 }
 for(let i=0;i<rings.length-1;i++)for(let j=0;j<segments;j++){
  const a=i*(segments+1)+j,b=a+1,c=a+segments+1,d=c+1;indices.push(a,b,c,c,b,d);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
export function tube(parent:T.Object3D,points:P3[],radius:number,mat:T.Material,segments=32){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),segments,radius,8,false),mat);}
export function patch(parent:T.Object3D,nu:number,nv:number,fn:(u:number,v:number)=>P3,mat:T.Material){
 const pos:number[]=[],idx:number[]=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++)pos.push(...fn(i/nu,j/nv));
 for(let j=0;j<nv;j++)for(let i=0;i<nu;i++){const a=j*(nu+1)+i,b=a+1,c=a+nu+1,d=c+1;idx.push(a,c,b,b,c,d);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return mesh(parent,g,mat);
}
export function strand(parent:T.Object3D,points:P3[],width:number,depth:number,mat:T.Material){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const n=24,sides=10,frames=curve.computeFrenetFrames(n,false),pos:number[]=[],idx:number[]=[];
 for(let i=0;i<=n;i++){
  const t=i/n,p=curve.getPoint(t),w=width*(.06+.94*Math.pow(Math.sin(Math.PI*(t*.93+.025)),.65))*(1-t*.75);
  for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;const v=p.clone().addScaledVector(frames.normals[i],Math.sin(a)*w).addScaledVector(frames.binormals[i],Math.cos(a)*depth*(w/width));pos.push(v.x,v.y,v.z);}
 }
 for(let i=0;i<n;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+1,c=a+sides+1;idx.push(a,b,c,c,b,c+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return mesh(parent,g,mat);
}
