import * as T from 'three';

/**
 * Decorative motif atlas: pixels belong to the surface material, never an
 * additional mesh. All drawing runs on a Uint8Array so browser and Node tests
 * use identical geometry/UV behavior; no Canvas or raised decals are needed.
 *
 * V axis is bottom-up; regions are from cruiseUvRegions.
 */
const W=256,H=256;
const colors={
 linen:[248,236,218],ink:[37,34,42],warmWhite:[255,244,230],
 brass:[187,151,92],wood:[104,67,53],marble:[46,42,51],ceramic:[241,230,214]
} as const;
type RGB=readonly [number,number,number];
function makePixels(w:number,h:number,fill:RGB){
 const pixels=new Uint8Array(w*h*4);
 for(let i=0;i<w*h;i++){pixels[4*i]=fill[0];pixels[4*i+1]=fill[1];pixels[4*i+2]=fill[2];pixels[4*i+3]=255;}
 return pixels;
}
function dot(p:Uint8Array,w:number,h:number,x:number,y:number,color:RGB){
 if(x<0||x>=w||y<0||y>=h)return;
 const i=4*(Math.floor(y)*w+Math.floor(x));
 p[i]=color[0];p[i+1]=color[1];p[i+2]=color[2];
}
function rect(p:Uint8Array,w:number,h:number,x0:number,y0:number,x1:number,y1:number,c:RGB){
 for(let y=Math.max(0,Math.ceil(y0));y<Math.min(h,Math.ceil(y1));y++)
  for(let x=Math.max(0,Math.ceil(x0));x<Math.min(w,Math.ceil(x1));x++)dot(p,w,h,x,y,c);
}
function stroke(p:Uint8Array,w:number,h:number,x0:number,y0:number,x1:number,y1:number,c:RGB,thickness=1){
 const steps=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)*2));
 for(let k=0;k<=steps;k++){
  const x=Math.round(x0+(x1-x0)*k/steps),y=Math.round(y0+(y1-y0)*k/steps);
  for(let j=-thickness+1;j<thickness;j++)for(let i=-thickness+1;i<thickness;i++)dot(p,w,h,x+i,y+j,c);
 }
}
function texture(pixels:Uint8Array,w:number,h:number){
 // Explicit ArrayBuffer-backed storage for DOM BufferSource TS compatibility.\n const upload=new Uint8Array(new ArrayBuffer(pixels.byteLength));\n upload.set(pixels);\n const t=new T.DataTexture(upload,w,h,T.RGBAFormat);
 t.colorSpace=T.SRGBColorSpace;
 t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;
 t.generateMipmaps=true;t.needsUpdate=true;
 return t;
}
/** Six stable atlas regions; the upper two are the non-geometric embroidery. */
export function createCruiseFabricAtlas(){
 const p=makePixels(W,H,colors.wood);
 rect(p,W,H,0,0,64,128,colors.wood);
 rect(p,W,H,64,0,128,128,colors.marble);
 rect(p,W,H,128,0,192,128,colors.brass);
 rect(p,W,H,192,0,256,128,colors.ceramic);
 rect(p,W,H,0,128,128,256,colors.linen);
 rect(p,W,H,128,128,256,256,colors.ink);
 // Ivory duvet: soft, subtle parallel textile seams (a printed stitch, no tube).
 for(const y of [147,169,191,213,235]){
  for(let x=12;x<116;x+=6)stroke(p,W,H,x,y,x+3,y,colors.warmWhite,1);
 }
 // Midnight runner: two straight gold embroidery borders and clipped corner marks.
 for(const y of [144,240])stroke(p,W,H,139,y,245,y,colors.brass,1);
 for(const x of [139,245]){
  stroke(p,W,H,x,144,x,162,colors.brass,1);
  stroke(p,W,H,x,222,x,240,colors.brass,1);
 }
 return texture(p,W,H);
}
/** Square flat-printed rug motif for top UV, with no border meshes or lift. */
export function createCruiseRugPrint(){
 const p=makePixels(256,256,colors.ink),gold=colors.brass;
 for(const [a,b,c,d] of [[13,13,243,13],[243,13,243,243],[243,243,13,243],[13,243,13,13]]){
  stroke(p,256,256,a,b,c,d,gold,2);
 }
 for(const x of [26,230])for(const y of [26,230]){
  const sx=x<128?1:-1,sy=y<128?1:-1;
  stroke(p,256,256,x,y,x+sx*19,y,gold,1);
  stroke(p,256,256,x,y,x,y+sy*19,gold,1);
  stroke(p,256,256,x+sx*19,y,x+sx*19,y+sy*12,gold,1);
 }
 return texture(p,256,256);
}
/** The black-marble room floor gets a hairline border printed on its surface. */
export function createCruiseFloorPrint(){
 const p=makePixels(256,256,colors.marble);
 for(const s of [7,248]){
  stroke(p,256,256,s,7,s,248,colors.brass,1);
  stroke(p,256,256,7,s,248,s,colors.brass,1);
 }
 return texture(p,256,256);
}
export function createCruiseFabricMaterials(){
 const map=createCruiseFabricAtlas();
 return {
  ivory:new T.MeshStandardMaterial({map,color:0xffffff,roughness:.93,side:T.DoubleSide}),
  dark:new T.MeshStandardMaterial({map,color:0xffffff,roughness:.92,side:T.DoubleSide}),
 };
}

/** Veins belong to the marble pigment: no loose Line meshes around the basin. */
export function createCruiseMarblePrint(){
 const p=makePixels(256,256,colors.marble);
 for(const pts of [
  [[12,38],[51,63],[82,52],[119,90],[157,69],[231,121]],
  [[9,200],[49,179],[78,192],[133,164],[170,184],[245,132]],
  [[21,113],[44,127],[61,115],[92,149],[139,141],[183,166]]
 ]){
  for(let i=1;i<pts.length;i++)stroke(p,256,256,pts[i-1][0],pts[i-1][1],pts[i][0],pts[i][1],colors.brass,1);
 }
 return texture(p,256,256);
}
