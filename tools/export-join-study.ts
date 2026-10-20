/** Offline vector projection of local reference crops and actual edited meshes.
 * Usage: node --import tsx tools/export-join-study.ts REF.png OUT.svg
 * Outputs contain the private input reference and must stay outside the public repo. */
import fs from 'node:fs';
import * as T from 'three';
import {createBodyBlockout} from '../src/assets/procedural/bodyBlockout';
import {referenceFrame as f} from '../src/assets/procedural/bodyReference';
const [reference,output]=process.argv.slice(2);if(!reference||!output)throw Error('Expected reference and output paths');
const root=createBodyBlockout('blockout'),image=fs.readFileSync(reference).toString('base64'),s:string[]=[];
s.push('<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1180" viewBox="0 0 2400 1180"><rect width="2400" height="1180" fill="#f2f1ec"/><g font-family="sans-serif" fill="#34483e"><text x="35" y="42" font-size="27">RoomBoy / STAGE 01 / measured vertex correction</text><text x="35" y="75" font-size="18">Simplified blockout reference and actual mesh at the same scale. Magenta: hand-read reference corners. Green: moved existing mesh vertices. No new geometry.</text>');
for(const [row,region] of [{label:'NECK / CHEST',top:140,bottom:305},{label:'GLUTES / THIGHS',top:395,bottom:565}].entries()){
 const y=145+row*500,scale=2,sy=region.top;
 s.push(`<text x="35" y="${y-25}" font-size="23">${region.label}</text>`);
 for(const [v,view] of (['front','side','back'] as const).entries()){
  const axis=view==='front'?f.frontAxis:view==='side'?f.sideAxis:f.backAxis,rotation=new T.Matrix4().makeRotationY(view==='side'?-Math.PI/2:view==='back'?Math.PI:0);
  for(const mode of ['reference','mesh'] as const){
   const x=v*800+(mode==='mesh'?400:0),cx=x+200,clip=`clip-${row}-${v}-${mode}`;
   s.push(`<text x="${cx}" y="${y+8}" text-anchor="middle" font-size="18">${view.toUpperCase()} / ${mode==='mesh'?'EDITED VERTICES':'SIMPLIFIED'}</text><defs><clipPath id="${clip}"><rect x="${x+20}" y="${y+30}" width="360" height="${(region.bottom-region.top)*scale}"/></clipPath></defs><g clip-path="url(#${clip})">`);
   if(mode==='reference')s.push(`<image x="${cx-axis*scale}" y="${y+30-sy*scale}" width="${f.width*scale}" height="${f.height*scale}" href="data:image/png;base64,${image}"/>`);
   else{
    const triangles:{z:number;svg:string}[]=[];
    root.traverse(o=>{if(!(o instanceof T.Mesh))return;const p=o.geometry.getAttribute('position'),idx=o.geometry.index!;
     for(let i=0;i<idx.count;i+=3){const points=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,idx.getX(i+k)).applyMatrix4(rotation)),normal=new T.Vector3().subVectors(points[1],points[0]).cross(new T.Vector3().subVectors(points[2],points[0])).normalize();if(normal.z<.0001)continue;
      const material=Array.isArray(o.material)?o.material[o.geometry.groups.find((g:{start:number;count:number;materialIndex?:number})=>i>=g.start&&i<g.start+g.count)?.materialIndex??0]:o.material;
      const shade=.66+.34*Math.max(0,normal.dot(new T.Vector3(-.4,.7,1).normalize())),color=(material as T.MeshStandardMaterial).color.clone().multiplyScalar(shade).getHexString(T.SRGBColorSpace);
      const xy=points.map(q=>`${cx+q.x/f.scale*scale},${y+30+(f.ground-q.y/f.scale-sy)*scale}`).join(' ');
      triangles.push({z:points.reduce((sum,q)=>sum+q.z,0)/3,svg:`<polygon points="${xy}" fill="#${color}" stroke="#${color}" stroke-width=".3"/>`});
     }
    });s.push(...triangles.sort((a,b)=>a.z-b.z).map(t=>t.svg));
   }
   for(const r of root.userData.vertexEdits.report){const target=r.targets[view];if(!target)continue;if(row===0?!r.id.startsWith('N'):r.id.startsWith('N'))continue;
    const q=new T.Vector3(...r.position as [number,number,number]).applyMatrix4(rotation),px=mode==='reference'?cx+(target[0]-axis)*scale:cx+q.x/f.scale*scale,py=mode==='reference'?y+30+(target[1]-sy)*scale:y+30+(f.ground-q.y/f.scale-sy)*scale;
    s.push(`<circle cx="${px}" cy="${py}" r="3" fill="${mode==='reference'?'#c34469':'#008969'}"/><text x="${px+5}" y="${py-5}" font-size="12" fill="${mode==='reference'?'#9c234a':'#00654d'}" stroke="#fff" stroke-width="2" paint-order="stroke">${r.id}</text>`);
   }
   s.push('</g>');
  }
 }
 s.push(`<text x="35" y="${y+410}" font-size="18">${row===0?'N0-N7: move existing neck-base vertices; move existing chest-top vertices to the same measured boundary.':'H0-H15: lower rim; M0-M15: observed panel corners. One redundant ring removed; no new connection loops.'}</text>`);
}
s.push('<text x="35" y="1160" font-size="17">Approximate stylized-sheet reads; view-height conflicts remain. Unmeasured surface depths retained; hidden thigh caps tucked inside. Not full-shape accuracy.</text></g></svg>');
fs.writeFileSync(output,s.join('\n'));
