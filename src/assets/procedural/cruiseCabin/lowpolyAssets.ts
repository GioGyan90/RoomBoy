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

/** Room-oriented duvet: irregular 2.5D fabric surface with sewn hems and sagging folds.
 * The y upper surface is a deformable mesh, not a rigid extruded plate.
 */
export function createDuvetGeometry(width:number,length:number,thickness:number,region:CruiseUvRegion='ivoryCloth'){
 const nx=14,nz=18; const halfW=width/2,halfL=length/2;
 const vertices:number[]=[],uv:number[]=[],indices:number[]=[];
 const uvBox=cruiseUvRegions[region];
 function surf(xi:number,zi:number,bottom=false){
  const u=xi/nx,v=zi/nz;
  const x=(u-.5)*width,z=(v-.5)*length;
  const hem=Math.pow(Math.abs(u-.5)*2,6)*.055;
  const fold=Math.sin(v*Math.PI*5+u*2.3)*.028*(.28+.72*Math.sin(Math.PI*u)**2);
  const central=Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*.052;
  const edgeSag=-Math.pow(Math.abs(u-.5)*2,4)*.065;
  const y=(bottom?-.11:0)+central+fold+edgeSag-hem;
  vertices.push(x,y,z);
  uv.push(uvBox.u0+(uvBox.u1-uvBox.u0)*u,uvBox.v0+(uvBox.v1-uvBox.v0)*v);
 }
 for(let zi=0;zi<=nz;zi++)for(let xi=0;xi<=nx;xi++)surf(xi,zi);
 const count=(nx+1)*(nz+1);
 for(let zi=0;zi<=nz;zi++)for(let xi=0;xi<=nx;xi++)surf(xi,zi,true);
 for(let zi=0;zi<nz;zi++)for(let xi=0;xi<nx;xi++){
  const a=zi*(nx+1)+xi,b=a+1,c=a+nx+1,d=c+1;
  indices.push(a,b,c,b,d,c, count+c,count+b,count+a,count+c,count+d,count+b);
 }
 const edge=(a:number,b:number)=>{indices.push(a,b,count+a,b,count+b,count+a)};
 for(let xi=0;xi<nx;xi++){
  edge(xi,xi+1);
  edge(nz*(nx+1)+xi+1,nz*(nx+1)+xi);
 }
 for(let zi=0;zi<nz;zi++){
  edge((zi+1)*(nx+1),zi*(nx+1));
  edge(zi*(nx+1)+nx,(zi+1)*(nx+1)+nx);
 }
 const geometry=new T.BufferGeometry();
 geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
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
