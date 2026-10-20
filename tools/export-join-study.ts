/** Offline vector projection of local reference crops and actual connected meshes.
 * Usage: node --import tsx tools/export-join-study.ts REF.png OUT.svg
 * Outputs contain the private input reference and must stay outside the public repo. */
import fs from 'node:fs';
import * as T from 'three';
import {createBodyBlockout} from '../src/assets/procedural/bodyBlockout';
import {referenceFrame as f} from '../src/assets/procedural/bodyReference';
const [reference,output]=process.argv.slice(2);if(!reference||!output)throw Error('Expected reference and output paths');
const root=createBodyBlockout('blockout'),image=fs.readFileSync(reference).toString('base64'),s:string[]=[];
s.push('<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1180" viewBox="0 0 2400 1180"><rect width="2400" height="1180" fill="#f2f1ec"/><g font-family="sans-serif" fill="#34483e"><text x="35" y="42" font-size="27">RoomBoy / STAGE 01 / connection close-ups</text><text x="35" y="75" font-size="18">Simplified blockout reference and actual mesh at the same scale. Colour boundaries remain; surfaces now share their join edges.</text>');
for(const [row,region] of [{label:'NECK / CHEST',top:140,bottom:305},{label:'GLUTES / THIGHS',top:395,bottom:565}].entries()){
 const y=145+row*500,scale=2,sy=region.top;
 s.push(`<text x="35" y="${y-25}" font-size="23">${region.label}</text>`);
 for(const [v,view] of (['front','side','back'] as const).entries()){
  const axis=view==='front'?f.frontAxis:view==='side'?f.sideAxis:f.backAxis,rotation=new T.Matrix4().makeRotationY(view==='side'?-Math.PI/2:view==='back'?Math.PI:0);
  for(const mode of ['reference','mesh'] as const){
   const x=v*800+(mode==='mesh'?400:0),cx=x+200,clip=`clip-${row}-${v}-${mode}`;
   s.push(`<text x="${cx}" y="${y+8}" text-anchor="middle" font-size="18">${view.toUpperCase()} / ${mode==='mesh'?'CONNECTED MESH':'SIMPLIFIED'}</text><defs><clipPath id="${clip}"><rect x="${x+20}" y="${y+30}" width="360" height="${(region.bottom-region.top)*scale}"/></clipPath></defs><g clip-path="url(#${clip})">`);
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
   s.push('</g>');
  }
 }
 s.push(`<text x="35" y="${y+410}" font-size="18">${row===0?'Shared collar: anterior notch, converging neck planes, posterior shoulder transition.':'Shared leg openings: curved gluteal rim, crotch bridge, intermediate thigh collar. No internal joint caps.'}</text>`);
}
s.push('<text x="35" y="1160" font-size="17">Static blockout geometry; skinning and remaining shoulder/knee interfaces are not completed. No detailed concept fitting in this stage.</text></g></svg>');
fs.writeFileSync(output,s.join('\n'));
