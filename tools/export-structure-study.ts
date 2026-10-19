/** Offline technical illustration from actual mesh triangles, not a browser screenshot.
 * Usage: node --import tsx tools/export-structure-study.ts REF.png OUT.svg */
import fs from 'node:fs';
import * as T from 'three';
import {createBodyBlockout} from '../src/assets/procedural/bodyBlockout';
import {referenceFrame as f,viewJoints,type StudyView,type JointName} from '../src/assets/procedural/bodyReference';
const [reference,output]=process.argv.slice(2);if(!reference||!output)throw Error('Expected local reference PNG and output SVG paths');
const image=fs.readFileSync(reference).toString('base64'),root=createBodyBlockout('blockout'),s:string[]=[];
s.push('<svg xmlns="http://www.w3.org/2000/svg" width="1880" height="960" viewBox="0 0 1880 960"><rect width="1880" height="960" fill="#f2f1ec"/><g font-family="sans-serif" fill="#34483e"><text x="40" y="38" font-size="23">RoomBoy / structure alignment review</text><text x="40" y="66" font-size="13">Same scale and ground line in each pair. Actual mesh geometry, before detail sculpting.</text>');
for(const [v,view] of (['front','side','back'] as StudyView[]).entries()){
 const start=40+v*600,axis=view==='front'?f.frontAxis:view==='side'?f.sideAxis:f.backAxis;
 s.push(`<text x="${start+150}" y="92" text-anchor="middle" font-size="13">${view.toUpperCase()} / ORIGINAL</text><text x="${start+450}" y="92" text-anchor="middle" font-size="13">${view.toUpperCase()} / MESH</text>`);
 const cropWidth=view==='side'?180:270,cropLeft=axis-(view==='side'?110:135);
 s.push(`<svg x="${start+150+cropLeft-axis}" y="110" width="${cropWidth}" height="760" viewBox="${cropLeft} 20 ${cropWidth} 760"><image width="1200" height="800" href="data:image/png;base64,${image}"/></svg>`);
 const rotation=new T.Matrix4().makeRotationY(view==='side'?-Math.PI/2:view==='back'?Math.PI:0),triangles:{z:number;svg:string}[]=[];
 root.traverse(o=>{if(!(o instanceof T.Mesh))return;const p=o.geometry.getAttribute('position'),idx=o.geometry.index!,color=(o.material as T.MeshStandardMaterial).color.clone();
  for(let i=0;i<idx.count;i+=3){const points=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,idx.getX(i+k)).applyMatrix4(rotation));const normal=new T.Vector3().subVectors(points[1],points[0]).cross(new T.Vector3().subVectors(points[2],points[0])).normalize();if(normal.z<.0001)continue;
   const shade=.66+.34*Math.max(0,normal.dot(new T.Vector3(-.4,.7,1).normalize()));const c=color.clone().multiplyScalar(shade).getHexString(T.SRGBColorSpace);
   const xy=points.map(q=>`${(start+450+q.x/f.scale).toFixed(2)},${(110+f.ground-q.y/f.scale-20).toFixed(2)}`).join(' ');triangles.push({z:points.reduce((sum,q)=>sum+q.z,0)/3,svg:`<polygon points="${xy}" fill="#${c}" stroke="#${c}" stroke-width=".25"/>`});
  }
 });s.push(...triangles.sort((a,b)=>a.z-b.z).map(t=>t.svg));
 for(const name of Object.keys(viewJoints) as JointName[]){const target=viewJoints[name][view];if(!target)continue;const q=new T.Vector3(...root.userData.landmarks[name]).applyMatrix4(rotation),mx=start+450+q.x/f.scale,my=110+f.ground-q.y/f.scale-20,tx=start+450+target[0]-axis,ty=110+target[1]-20;
  s.push(`<path d="M${tx-4},${ty}h8 M${tx},${ty-4}v8" fill="none" stroke="#c34469" stroke-width="1.2"/><circle cx="${mx}" cy="${my}" r="2.5" fill="#008969"/>`);
 }
 const r=root.userData.fitReport[view];s.push(`<text x="${start+300}" y="895" text-anchor="middle" font-size="13">Joint reprojection: RMS ${r.rms.toFixed(2)} px / max ${r.max.toFixed(2)} px</text>`);
}
s.push('<text x="40" y="935" font-size="13">Green: actual mesh anchor vertices. Magenta: independent image targets. Read-point uncertainty and silhouette differences remain.</text></g></svg>');fs.writeFileSync(output,s.join('\n'));
