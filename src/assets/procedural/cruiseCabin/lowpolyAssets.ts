import * as T from 'three';

/**
 * Cruise kit v1: reusable low-poly authored silhouettes, with explicit normalized
 * UVs. Materials may later sample a single 1024 x 1024 atlas:
 * 0..0.5 U ivory cloth; 0.5..1 U dark textile; bottom V stone/wood; top V metals.
 */
export const cruiseUvRegions={
 ivoryCloth:{u0:0,v0:.5,u1:.5,v1:1},
 midnightCloth:{u0:.5,v0:.5,u1:1,v1:1},
 timber:{u0:0,v0:0,u1:.25,v1:.5},
 blackMarble:{u0:.25,v0:0,u1:.5,v1:.5},
 brass:{u0:.5,v0:0,u1:.75,v1:.5},
 ceramic:{u0:.75,v0:0,u1:1,v1:.5},
} as const;
export type CruiseUvRegion=keyof typeof cruiseUvRegions;

/** High-density but controllable stylized cloth, with separate face loops for
 * the underside and an uneven hem. The top has meaningful drape rather than
 * simply adding subdivisions to a planar box.
 */
export type ClothOptions={
 nx?:number;nz?:number;sideDrop?:number;footDrop?:number;
 centerLift?:number;foldStrength?:number;seed?:number;
};
function drapeY(u:number,v:number,options:ClothOptions={}){
 const edge=Math.pow(Math.abs(2*u-1),5);
 const foot=Math.pow(Math.max(0,(v-.65)/.35),2);
 const head=Math.pow(Math.max(0,(.14-v)/.14),2);
 const middle=Math.max(0,1-Math.pow(2*u-1,2));
 const undulate=(Math.sin(v*19+u*5.7+(options.seed??0))*.017
   +Math.sin(v*31-u*9)*.010)*middle;
 return (options.centerLift??.055)*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)
  - (options.sideDrop??.19)*edge
  - (options.footDrop??.15)*foot*(.70+.30*edge)
  - .032*head + undulate
  + (options.foldStrength??.04)*Math.sin(v*Math.PI*3.5+u*2)*middle;
}
export function createDuvetGeometry(
 width:number,length:number,thickness:number,
 region:CruiseUvRegion='ivoryCloth',options:ClothOptions={}
){
 const nx=options.nx??32,nz=options.nz??40;
 const vertices:number[]=[],uv:number[]=[],indices:number[]=[];
 const patch=cruiseUvRegions[region];
 const add=(u:number,v:number,bottom:boolean)=>{
  const x=(u-.5)*width,z=(v-.5)*length;
  const slope=drapeY(u,v,options);
  const y=slope-(bottom?Math.max(.015,thickness):0);
  vertices.push(x,y,z);
  uv.push(patch.u0+(patch.u1-patch.u0)*u,patch.v0+(patch.v1-patch.v0)*v);
 };
 for(const bottom of [false,true])for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)add(i/nx,j/nz,bottom);
 const count=(nx+1)*(nz+1);
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
  const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;
  indices.push(a,c,b,b,c,d);
  indices.push(count+a,count+b,count+c,count+b,count+d,count+c);
 }
 const stitch=(a:number,b:number)=>indices.push(a,b,count+a,b,count+b,count+a);
 for(let i=0;i<nx;i++){
  stitch(i+1,i);
  stitch(nz*(nx+1)+i,nz*(nx+1)+i+1);
 }
 for(let j=0;j<nz;j++){
  stitch(j*(nx+1),(j+1)*(nx+1));
  stitch((j+1)*(nx+1)+nx,j*(nx+1)+nx);
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 return geometry;
}

/** An overlapping, sewn-back turned corner at the right foot of the quilt.
 * It shares the duvet's height function at the edges, avoiding floating flaps.
 */
export function createFoldedCornerGeometry(
 quiltWidth:number,quiltLength:number,options:ClothOptions={}
){
 // Right-foot turn-back: a real double-sided textile flap with a wrapped hem.
 // Barycentric grid keeps local folds fine enough to silhouette from close-up.
 const n=22,positions:number[]=[],uvs:number[]=[],indices:number[]=[];
 const atlas=cruiseUvRegions.ivoryCloth;
 const start=(row:number)=>row*(n+1)-row*(row-1)/2;
 const uvA:[number,number]=[.77,.77],uvB:[number,number]=[.99,.97],uvC:[number,number]=[.60,.985];
 const count=(n+1)*(n+2)/2;
 for(const underside of [false,true])for(let row=0;row<=n;row++){
  const t=row/n;
  for(let k=0;k<=n-row;k++){
   const s=k/n,base=1-t-s;
   const u=uvA[0]*base+uvB[0]*t+uvC[0]*s;
   const v=uvA[1]*base+uvB[1]*t+uvC[1]*s;
   const inside=Math.max(0,Math.min(1,t,s,base));
   const crease=Math.sin(Math.PI*Math.min(1,inside*1.5))**1.4;
   const roll=.105*crease+.014*Math.sin(Math.PI*t);
   const y=drapeY(u,v,options)+.004+roll-(underside?.018:0);
   const x=(u-.5)*quiltWidth,z=(v-.5)*quiltLength;
   positions.push(x,y,z);
   uvs.push(atlas.u0+u*(atlas.u1-atlas.u0),atlas.v0+v*(atlas.v1-atlas.v0));
  }
 }
 for(let row=0;row<n;row++)for(let k=0;k<n-row;k++){
  const a=start(row)+k,b=start(row+1)+k,d=start(row)+k+1;
  indices.push(a,b,d,count+a,count+d,count+b);
  if(k<n-row-1){
   const e=start(row+1)+k+1;
   indices.push(b,e,d,count+b,count+d,count+e);
  }
 }
 // Three sewn edge strips. Folded fabric has thickness, not a floating decal.
 const edge=(a:number,b:number)=>indices.push(a,b,count+a,b,count+b,count+a);
 for(let row=0;row<n;row++){
  edge(start(row),start(row+1));
  edge(start(row)+n-row,start(row+1)+n-row-1);
 }
 for(let k=0;k<n;k++)edge(k+1,k);
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 return geometry;
}

/** Independent filled cloth pillow with sewn perimeter, soft crown, pinched
 * corners and local UVs. The same grid resolution is used for top and bottom.
 */
export function createPillowGeometry(width:number,depth:number,height:number,variant=0){
 const nx=24,nz=20,positions:number[]=[],uvs:number[]=[],indices:number[]=[];
 const atlas=cruiseUvRegions.ivoryCloth;
 for(const underside of [false,true])for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const u=i/nx,v=j/nz,ax=Math.abs(2*u-1),az=Math.abs(2*v-1);
  const corner=ax*ax*az*az;
  const x=(u-.5)*width*(1-.13*corner)+.012*Math.sin(v*Math.PI*2+variant)*Math.sin(Math.PI*u);
  const z=(v-.5)*depth*(1-.13*corner)+.008*Math.sin(u*Math.PI*2+variant);
  const inflate=Math.pow(Math.max(0,1-ax*ax),.75)*Math.pow(Math.max(0,1-az*az),.75);
  const scrunch=(.012*Math.sin((u*2.7+v*1.9+variant)*Math.PI*2)
   +.007*Math.cos(v*12.5+variant))*inflate;
  const y=underside?-.30*height+.022*inflate:
   .42*height+.55*height*inflate-.10*height*corner+scrunch;
  positions.push(x,y,z);
  uvs.push(atlas.u0+u*(atlas.u1-atlas.u0),atlas.v0+v*(atlas.v1-atlas.v0));
 }
 const size=(nx+1)*(nz+1);
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
  const p=j*(nx+1)+i,q=p+1,r=p+nx+1;
  indices.push(p,r,q,q,r,r+1);
  indices.push(size+p,size+q,size+r,size+q,size+r+1,size+r);
 }
 const rim=(a:number,b:number)=>indices.push(a,b,size+a,b,size+b,size+a);
 for(let i=0;i<nx;i++){rim(i+1,i);rim(nz*(nx+1)+i,nz*(nx+1)+i+1);}
 for(let j=0;j<nz;j++){rim(j*(nx+1),(j+1)*(nx+1));rim((j+1)*(nx+1)+nx,j*(nx+1)+nx);}
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 return geometry;
}

/** Cut-out ring with a genuine empty center. The opening may remain glass-filled,
 * but cannot be concealed by solid rectangular frame panels.
 * Geometry is local XY; parent is rotated to wall plane externally.
 */
export function createRoundedFrameGeometry(width:number,height:number,radius:number,frameWidth:number,depth=.075){
 const shape=new T.Shape();
 const trace=(w:number,h:number,r:number,clockwise=false)=>{
  const x=-w/2,y=-h/2;
  const corners=[
   [x+r,y],[x+w-r,y],[x+w,y+r],[x+w,y+h-r],
   [x+w-r,y+h],[x+r,y+h],[x,y+h-r],[x,y+r],
  ];
  const p=clockwise?new T.Path():shape;
  p.moveTo(corners[0][0],corners[0][1]);
  p.lineTo(corners[1][0],corners[1][1]);
  p.quadraticCurveTo(x+w,y,x+w,y+r);
  p.lineTo(x+w,y+h-r);
  p.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  p.lineTo(x+r,y+h);
  p.quadraticCurveTo(x,y+h,x,y+h-r);
  p.lineTo(x,y+r);
  p.quadraticCurveTo(x,y,x+r,y);
  p.closePath();
  return p;
 };
 trace(width,height,radius);
 shape.holes.push(trace(width-frameWidth*2,height-frameWidth*2,Math.max(.02,radius-frameWidth),true));
 const geometry=new T.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:false,curveSegments:5});
 geometry.computeVertexNormals();
 return geometry;
}

/** Boolean-style wall infill: rectangular construction opening MINUS rounded
 * portal. The four resulting corner wedges have real wall thickness, closing
 * visible triangular gaps around rounded window/door assemblies.
 * All measurements use local XY (window width/height); extrude along +Z.
 */
export function createWallApertureCornerGeometry(rectW:number,rectH:number,cutW:number,cutH:number,r:number,depth:number){
 if(cutW>rectW||cutH>rectH||r<=0||r>=Math.min(cutW,cutH)/2){
  throw new Error('Invalid rounded aperture dimensions');
 }
 const outer=new T.Shape(),w=rectW/2,h=rectH/2;
 outer.moveTo(-w,-h);outer.lineTo(w,-h);outer.lineTo(w,h);outer.lineTo(-w,h);outer.closePath();
 const hole=new T.Path(),x=-cutW/2,y=-cutH/2;
 hole.moveTo(x+r,y);hole.lineTo(x+cutW-r,y);
 hole.quadraticCurveTo(x+cutW,y,x+cutW,y+r);
 hole.lineTo(x+cutW,y+cutH-r);
 hole.quadraticCurveTo(x+cutW,y+cutH,x+cutW-r,y+cutH);
 hole.lineTo(x+r,y+cutH);
 hole.quadraticCurveTo(x,y+cutH,x,y+cutH-r);
 hole.lineTo(x,y+r);
 hole.quadraticCurveTo(x,y,x+r,y);
 hole.closePath();
 outer.holes.push(hole);
 return new T.ExtrudeGeometry(outer,{depth,steps:1,bevelEnabled:false,curveSegments:8});
}
