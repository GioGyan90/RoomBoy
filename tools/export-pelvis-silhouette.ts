/** A technical audit from real mesh vertices, with no generated reference image.
 * Usage: node --import tsx tools/export-pelvis-silhouette.ts OUTPUT.svg */
import fs from 'node:fs';import * as T from 'three';
import {createPelvisPart} from '../src/assets/parts/pelvis';
import {pelvisPoints,pelvisFrame as f,pelvisProfile} from '../src/assets/parts/pelvisReference';
const output=process.argv[2];if(!output)throw Error('Expected SVG output path');const m=createPelvisPart(),p=m.geometry.getAttribute('position'),idx=m.geometry.index!;
const s=['<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="770" viewBox="0 0 1800 770"><rect width="1800" height="770" fill="#f5f4ef"/><g font-family="sans-serif" fill="#34483e"><text x="35" y="45" font-size="28">SYMMETRIC OUTLINE CAGE / 36 vertices / 68 triangles</text><text x="35" y="82" font-size="18">No interior face vertices. One half-profile is mirrored, including the face triangulation. Not installed.</text>'];
for(const [v,view] of (['front','side','back'] as const).entries()){
 const cx=300+v*600,cy=355,scale=2.7,rotate=new T.Matrix4().makeRotationY(view==='side'?-Math.PI/2:view==='back'?Math.PI:0),project=(q:T.Vector3)=>[cx+(q.x/f.scale+(view==='side'?25:0))*scale,cy-q.y/f.scale*scale];
 s.push(`<text x="${cx}" y="145" text-anchor="middle" font-size="22">${view.toUpperCase()}${view==='side'?' / FITTED VISIBLE EDGES':''}</text><rect x="${v*600+30}" y="170" width="540" height="405" fill="white"/>`);
 const faces:{z:number;text:string}[]=[];
 for(let i=0;i<idx.count;i+=3){const a=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,idx.getX(i+k)).applyMatrix4(rotate)),normal=new T.Vector3().subVectors(a[1],a[0]).cross(new T.Vector3().subVectors(a[2],a[0])).normalize();if(normal.z<=.0001)continue;faces.push({z:a.reduce((sum,q)=>sum+q.z,0)/3,text:`<polygon points="${a.map(q=>project(q).join(',')).join(' ')}" fill="#c6bdcf" stroke="#78847a" stroke-width=".9"/>`});}
 s.push(...faces.sort((a,b)=>a.z-b.z).map(a=>a.text));
 if(view!=='side')s.push(`<path d="M${cx} 180v380" stroke="#c64f6f" stroke-width="1.3" stroke-dasharray="5 5"/>`);
 const groups=new Map<string,{x:number;y:number;ids:string[]}>();for(let i=0;i<p.count;i++){
  if(view==='front'&&i>=pelvisProfile.length)continue;if(view==='back'&&i<pelvisProfile.length)continue;
  const [x,y]=project(new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(rotate)),key=`${x.toFixed(3)},${y.toFixed(3)}`,g=groups.get(key)??{x,y,ids:[]};g.ids.push(pelvisPoints[i].id);groups.set(key,g);
 }
 for(const g of groups.values()){const left=g.x<cx,same=Math.abs(g.x-cx)<1;const dx=same?8:left?-8:8,anchor=left&&!same?'end':'start';s.push(`<circle cx="${g.x}" cy="${g.y}" r="3.7" fill="${pelvisPoints.find(p=>p.id===g.ids[0])!.depth==='visible'?'#00785e':'#b5741d'}"/><text x="${g.x+dx}" y="${g.y-7}" font-size="13" text-anchor="${anchor}" fill="#006650" stroke="white" stroke-width="3" paint-order="stroke">${g.ids.join('/')}</text>`);}
 s.push(`<text x="${cx}" y="620" text-anchor="middle" font-size="17">${view==='side'?'Green: visible depth. Orange: provisional hidden closure.':'All points lie on the same mirrored silhouette boundary.'}</text>`);
}
s.push('<text x="35" y="690" font-size="18">Side visible edges are fitted; hidden upper/lower closure remains provisional. No interior face vertices.</text><text x="35" y="730" font-size="18">The centre-bottom point is on the lower outline edge; it permits mirrored triangles without introducing an interior point.</text></g></svg>');fs.writeFileSync(output,s.join('\n'));
