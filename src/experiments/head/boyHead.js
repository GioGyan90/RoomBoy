import * as THREE from 'three';

// Logical cage, +Z front, +Y up. No subdivision / CSG / imported head.
import {normalizeParameters} from './parameters.js';
export {defaults} from './parameters.js';
// y, half width, facial depth, rear depth. Anatomical stations, not a sphere.
const stations = [
  [-1.02,.23,.43,.17],[-.91,.39,.57,.32],[-.72,.55,.60,.48],
  [-.55,.66,.61,.60],[-.46,.69,.62,.65],[-.38,.72,.64,.70],
  [-.22,.77,.66,.76],[-.04,.81,.67,.80],[.17,.83,.66,.83],
  [.36,.82,.67,.85],[.57,.81,.64,.86],[.82,.76,.56,.82],
  [1.03,.63,.42,.70],[1.17,.40,.24,.47],
];
const xs = [0,.15,.32,.55,.79,1];
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const bump=(center,radius,x)=>{const t=Math.max(0,1-Math.abs(x-center)/radius);return t*t*(3-2*t);};

export function buildHeadData(options = {}, stage = 3) {
  const p = normalizeParameters(options), vertices=[], faces=[], regions=[], loops=[];
  const add=v=>{ vertices.push(v); return vertices.length-1; };
  const face=(ids,region='skull')=>{ faces.push(ids); regions.push(region); };
  function point(r,c) {
    const [y,w,z,back] = stations[r];
    const u=xs[c];
    const jw=smooth(-.40,-.85,y),cw=(1-jw)*(1-smooth(.20,.57,y));
    const width=w*(1+(p.jaw-1)*jw+(p.cheek-1)*cw);
    let front=z*(1-.53*Math.pow(u,2.4));
    if(stage>=2) {
      // Connected wedge nose: narrow bridge and deliberate alar base.
      const nose=[0,0,0,0,0,.025,.16,.10,.045,.015,0,0,0,0][r];
      front+=nose*Math.max(0,1-u/.32)*p.nose;
      // Upper / lower lips are shallow planes, never separate floating objects.
      if(r===3) front+=.015*Math.max(0,1-u/.4);
      if(r===4) front-=.008*Math.max(0,1-u/.4);
      if(r===5) front+=.015*Math.max(0,1-u/.4);
    }
    if(c===5)front=.03;
    return [width*u,y,front*p.depth];
  }
  const front=stations.map((_,r)=>xs.map((_,c)=>add(point(r,c))));
  for(let r=0;r<stations.length-1;r++)for(let c=0;c<xs.length-1;c++) {
    // Reserve a rectangular patch; replace it with a concentric almond loop.
    if(stage===3 && r>=7 && r<9 && c>=1 && c<4)continue;
    face([front[r][c],front[r][c+1],front[r+1][c+1],front[r+1][c]],r<3?'jaw':r<7?'face':r<10?'brow':'skull');
  }
  if(stage===3) {
    const outer=[front[8][1],front[9][1],front[9][2],front[9][3],front[9][4],front[8][4],front[7][4],front[7][3],front[7][2],front[7][1]];
    // Inner corner -> upper lid -> outer corner -> lower lid, clockwise front view.
    const shape=[[.15,.13],[.22,.23],[.34,.27],[.49,.27],[.61,.23],[.65,.15],[.57,.065],[.44,.035],[.30,.045],[.20,.08]];
    const eye=shape.map(([x,y])=>add([x*p.cheek,.14+(y-.14)*p.eyeHeight,(.635-.16*x)*p.depth]));
    const rim=shape.map(([x,y])=>add([(.4+(x-.4)*.97)*p.cheek,.14+(y-.14)*p.eyeHeight*.92,(.59-.16*x)*p.depth]));
    for(let i=0;i<10;i++){const j=(i+1)%10;face([outer[i],eye[i],eye[j],outer[j]],'orbit');face([eye[i],rim[i],rim[j],eye[j]],'lid');}
    loops.push(eye,rim);
  }
  // Back shell from temple to sagittal rear. Shares temple vertices with face.
  const back=stations.map(([y,w,z,d],r)=>[front[r][5],...Array.from({length:8},(_,i)=>{
    const a=(i+1)*Math.PI/16;
    return add([Math.cos(a)*vertices[front[r][5]][0],y,(.03*Math.cos(a)-d*Math.sin(a))*p.depth]);
  })]);
  for(let r=0;r<stations.length-1;r++)for(let c=0;c<8;c++)face([back[r][c],back[r][c+1],back[r+1][c+1],back[r+1][c]],'skull');
  const top=add([0,1.23,-.08*p.depth]),bottom=add([0,-1.035,.05]);
  for(const [r,apex,flip] of [[13,top,false],[0,bottom,true]]){
    const ring=[...front[r],...back[r].slice(1)];
    for(let i=0;i<ring.length-1;i++)face(flip?[ring[i+1],ring[i],apex]:[ring[i],ring[i+1],apex],r===0?'jaw':'skull');
  }
  // Local semantic shape fields. Every shared vertex is moved once; no topology edits.
  // Eye rings share the support field with the surrounding face to avoid detached sockets.
  const upperSet=new Set(loops.flatMap(l=>l.slice(1,5)));
  const lowerSet=new Set(loops.flatMap(l=>l.slice(6,10)));
  const rimSet=new Set(loops[1]||[]);
  for(let i=0;i<vertices.length;i++){
    const v=vertices[i], [x,y,z]=v;
    const frontWeight=smooth(.03,.35,z), forehead=smooth(.32,.90,y);
    const chin=smooth(-.70,-1.02,y);
    v[0]*=1+(p.foreheadWidth-1)*forehead;
    v[0]*=1+(p.templeWidth-1)*bump(.38,.40,y)*smooth(.45,.8,x);
    v[1]+=p.skullHeight*smooth(.36,1.23,y);
    v[2]+=p.foreheadSlope*forehead*frontWeight;
    if(z<0)v[2]*=p.backDepth;
    v[0]*=1+(p.chinWidth-1)*chin;
    v[1]-=p.chinLength*chin;
    v[2]+=p.chinForward*chin*frontWeight;
    v[0]+=p.jawAngle*bump(-.72,.25,y)*smooth(.24,.55,x);
    const cheekWeight=bump(-.15,.45,y)*bump(.51,.35,x)*frontWeight;
    v[2]+=p.cheekFullness*cheekWeight;
    v[1]+=p.cheekHeight*cheekWeight;
    if(stage>=2){
      v[2]+=p.browProjection*bump(.36,.22,y)*bump(.4,.32,x)*frontWeight;
      const noseWeight=bump(-.13,.49,y)*(1-smooth(.15,.34,x))*frontWeight;
      v[0]*=1+(p.noseWidth-1)*noseWeight;
      v[2]+=p.noseBridge*bump(.13,.28,y)*(1-smooth(.05,.26,x))*frontWeight;
      v[1]+=p.noseY*bump(-.22,.24,y)*(1-smooth(.12,.30,x))*frontWeight;
      v[0]*=1+(p.alarWidth-1)*bump(-.38,.15,y)*(1-smooth(.14,.30,x))*frontWeight;
      const mouthWeight=bump(-.46,.20,y)*(1-smooth(.29,.53,x))*frontWeight;
      v[0]*=1+(p.mouthWidth-1)*mouthWeight;
      v[1]+=p.mouthY*mouthWeight;
      v[2]+=p.mouthForward*mouthWeight;
      v[1]+=p.mouthCorner*bump(.23,.18,x)*bump(-.46,.12,y)*frontWeight;
      v[2]+=.045*(p.lipFullness-1)*(bump(-.55,.07,y)+bump(-.38,.06,y))*(1-smooth(.18,.36,x))*frontWeight;
    }
    if(stage===3){
      const ax=x/p.cheek;
      const support=smooth(.025,.115,ax)*(1-smooth(.67,.81,ax))*smooth(-.22,-.04,y)*(1-smooth(.36,.57,y))*frontWeight;
      v[0]+=(p.eyeGap+(ax-.4)*(p.eyeWidth-1))*support*p.cheek;
      v[1]+=(p.eyeY+p.eyeTilt*(ax-.4)/.5)*support;
      v[2]+=p.eyeDepth*support;
      if(upperSet.has(i))v[1]+=p.upperLid*Math.sin(Math.PI*Math.max(0,Math.min(1,(ax-.15)/.5)));
      if(lowerSet.has(i))v[1]+=p.lowerLid*Math.sin(Math.PI*Math.max(0,Math.min(1,(ax-.15)/.5)));
      if(rimSet.has(i))v[2]-=.045*(p.lidDepth-1)*p.depth;
    }
  }
  // Mirror topology, welding center plane. Winding is reversed on reflected side.
  const count=vertices.length, originalFaces=faces.length;
  const mirror=Array.from({length:count},(_,i)=>Math.abs(vertices[i][0])<1e-8?i:add([-vertices[i][0],vertices[i][1],vertices[i][2]]));
  for(let i=0;i<originalFaces;i++)face(faces[i].map(v=>mirror[v]).reverse(),regions[i]);
  loops.push(...loops.map(l=>l.map(i=>mirror[i]).reverse()));
  // Small polygon ears, a separate inspectable study part. Attached by overlap.
  if(stage>=2)for(const sign of [-1,1]){
    const earStart=vertices.length;
    const outline=[[.86,.30,-.06],[.96,.23,-.19],[.99,.06,-.22],[.91,-.18,-.12],[.83,-.19,.08],[.84,-.04,.14],[.82,.18,.13]];
    const ear=outline.map(v=>add([v[0]*p.cheek*sign,v[1],v[2]*p.depth]));
    const inset=outline.map(v=>add([(.85+(v[0]-.90)*.45)*p.cheek*sign,.05+(v[1]-.05)*.65,(-.035+(v[2]+.035)*.6)*p.depth]));
    const center=add([.82*p.cheek*sign,.05,-.035*p.depth]);
    const reverse=ids=>sign===1?ids.reverse():ids;
    for(let i=0;i<ear.length;i++){const j=(i+1)%ear.length;face(reverse([ear[i],ear[j],inset[j],inset[i]]),'ear');face(reverse([inset[i],inset[j],center]),'ear');}
    const rear=add([.77*p.cheek*sign,.05,-.035*p.depth]);
    for(let i=0;i<ear.length;i++)face(reverse([ear[(i+1)%ear.length],ear[i],rear]),'ear');
    for(let i=earStart;i<vertices.length;i++){
      const v=vertices[i],root=.78*p.cheek*sign;
      v[0]=root+(v[0]-root)*p.earOut;
      v[1]=.05+(v[1]-.05)*p.earSize+p.earY;
      v[2]=-.035*p.depth+(v[2]+.035*p.depth)*p.earSize;
    }
  }
  return {vertices,faces,regions,loops};
}
export function headGeometry(data, colored=false) {
  const palette={skull:0xe5ddce,face:0xe4c9b3,jaw:0xc6d4c7,brow:0xd7c8ad,orbit:0x9ebbb8,lid:0x779998,ear:0xccb6a1};
  const positions=[],colors=[];
  data.faces.forEach((f,fi)=>{
    const color=new THREE.Color(colored?palette[data.regions[fi]]:0xe4dfd4);
    for(let i=1;i<f.length-1;i++)for(const idx of [f[0],f[i],f[i+1]]){positions.push(...data.vertices[idx]);colors.push(color.r,color.g,color.b);}
  });
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
export function cageGeometry(data){
  const edges=new Set(),pts=[];
  for(const f of data.faces)for(let i=0;i<f.length;i++){
    const a=f[i],b=f[(i+1)%f.length],key=[Math.min(a,b),Math.max(a,b)].join(':');
    if(!edges.has(key)){edges.add(key);pts.push(...data.vertices[a],...data.vertices[b]);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));return g;
}
