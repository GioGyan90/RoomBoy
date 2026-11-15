import * as THREE from 'three';

// Logical cage, +Z front, +Y up. No subdivision / CSG / imported head.
import {normalizeParameters} from './parameters.js';
import {fitReferenceVertex} from './referenceFit.js';
export {defaults} from './parameters.js';
// y, half width, facial depth, rear depth. Anatomical stations, not a sphere.
const stations = [
  [-1.02,.30,.54,.42],[-.91,.43,.55,.74],[-.72,.55,.58,.91],
  [-.55,.66,.61,1.00],[-.46,.69,.62,1.04],[-.38,.72,.64,1.07],
  [-.22,.77,.66,1.09],[-.04,.81,.64,1.10],[.17,.83,.63,1.15],
  [.36,.82,.67,1.16],[.57,.81,.64,1.10],[.82,.76,.56,.96],
  [1.03,.63,.42,.75],[1.17,.40,.24,.47],
];
// Mandibular border is row 1: chin -> jaw body -> angle below ear.
const jawSideY=[-.78,-.62,-.56,-.46,-.39,-.32,-.20];
const rearBaseY=[-.72,-.57,-.46,-.35,-.28,-.20,-.12];
const jawSideWidth=[.32,.64,.67,.70,.72,.74,.78];
const xs = [0,.15,.32,.55,.79,1];
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const reverseWinding=ids=>[ids[0],...ids.slice(1).reverse()];
const bump=(center,radius,x)=>{const t=Math.max(0,1-Math.abs(x-center)/radius);return t*t*(3-2*t);};

export function buildHeadData(options = {}, stage = 3) {
  const p = normalizeParameters(options), vertices=[], faces=[], regions=[], loops=[];
  const add=v=>{ vertices.push(v); return vertices.length-1; };
  const face=(ids,region='skull')=>{ faces.push(ids); regions.push(region); };
  function point(r,c) {
    const [y,w,z,back] = stations[r];
    const u=xs[c];
    const jw=smooth(-.40,-.85,y),cw=(1-jw)*(1-smooth(.20,.57,y));
    const lateral=smooth(.32,1,u);
    const sideWidth=r<7?w+(jawSideWidth[r]-w)*lateral:w;
    const width=sideWidth*(1+(p.jaw-1)*jw+(p.cheek-1)*cw);
    let height=r<7?y+(jawSideY[r]-y)*lateral:y;
    let front=z*(1-.53*Math.pow(u,2.4));
    if(stage>=2) {
      // Connected wedge nose: narrow bridge and deliberate alar base.
      const nose=[0,0,0,0,0,0,.16,.01,0,.015,0,0,0,0][r];
      front+=nose*Math.max(0,1-u/.32)*p.nose;
      if(r===9)front+=.005*Math.sin(Math.PI*u);
      // Upper / lower lips are shallow planes, never separate floating objects.
      if(r===3) front+=.015*Math.max(0,1-u/.4);
      if(r===4) front-=.008*Math.max(0,1-u/.4);
      if(r===5) front+=.010*Math.max(0,1-u/.4);
    }
    if(c===5)front=.03;
    return [width*u,height,front*p.depth];
  }
  const front=stations.map((_,r)=>xs.map((_,c)=>add(point(r,c))));
  // A local subnasale row separates the nasal underside from the oral mound.
  // End it with three explicit cheek triangles; no concave polygon fan or cracks.
  const subnasale=stage>=2 ? xs.slice(0,4).map((u,c)=>{
    const a=vertices[front[5][c]],b=vertices[front[6][c]];
    return add([(a[0]+b[0])/2,-.30,(.67*(1-.53*Math.pow(u,2.4)))*p.depth]);
  }):[];
  for(let r=0;r<stations.length-1;r++)for(let c=0;c<xs.length-1;c++) {
    // Reserve a rectangular patch; replace it with a concentric almond loop.
    if(stage>=2 && r>=3 && r<5 && c<2)continue;
    if(stage===3 && r>=7 && r<9 && c>=1 && c<4)continue;
    if(stage>=2 && r===5 && c<3){
      face([front[r][c],front[r][c+1],subnasale[c+1],subnasale[c]],'philtrum');
      face([subnasale[c],subnasale[c+1],front[r+1][c+1],front[r+1][c]],'nasalBase');
      continue;
    }
    if(stage>=2 && r===5 && c===3){
      const a=front[r][c],b=front[r][c+1],d=front[r+1][c],e=front[r+1][c+1],m=subnasale[c];
      face([a,b,m],'face');face([b,e,m],'face');face([e,d,m],'face');
      continue;
    }
    const region=stage>=2 && r>=2 && r<6 && c<3
      ? (r===2?'chinTransition':c===2?'muzzleSide':r===5?'philtrum':'muzzle')
      : r===0?'jawUnderside':r<3?'jaw':r<7?'face':r<10?'brow':'skull';
    face([front[r][c],front[r][c+1],front[r+1][c+1],front[r+1][c]],region);
  }
  if(stage>=2){
    // Half oral ring: surrounding cheek transitions converge at the mouth corner.
    // Upper/lower lip surfaces use the existing central seam; no open mouth or bag.
    const boundary=[front[3][0],front[3][1],front[3][2],front[4][2],front[5][2],front[5][1],front[5][0]];
    const shape=[[0,-.525],[.10,-.51],[.185,-.49],[.235,-.46],[.185,-.425],[.10,-.405],[0,-.42]];
    const oral=shape.map(([x,y])=>add([x*p.cheek,y,(.648-.12*x)*p.depth]));
    for(let i=0;i<6;i++)face([boundary[i],boundary[i+1],oral[i+1],oral[i]],'muzzle');
    const mid0=front[4][0],mid1=front[4][1];
    face([oral[0],oral[1],mid1,mid0],'lip');
    face([oral[1],oral[2],oral[3],mid1],'lip');
    face([mid1,oral[3],oral[4],oral[5]],'lip');
    face([mid0,mid1,oral[5],oral[6]],'lip');
  }
  if(stage===3) {
    const outer=[front[8][1],front[9][1],front[9][2],front[9][3],front[9][4],front[8][4],front[7][4],front[7][3],front[7][2],front[7][1]];
    // Inner corner -> upper lid -> outer corner -> lower lid, clockwise front view.
    const shape=[[.15,.12],[.22,.20],[.34,.225],[.49,.235],[.61,.23],[.65,.20],[.57,.075],[.44,.055],[.30,.055],[.20,.08]];
    const eye=shape.map(([x,y])=>add([x*p.cheek,.14+(y-.14)*p.eyeHeight,(.635-.16*x)*p.depth]));
    const rim=shape.map(([x,y])=>add([(.4+(x-.4)*.97)*p.cheek,.14+(y-.14)*p.eyeHeight*.92,(.59-.16*x)*p.depth]));
    const support=shape.map(([x,y])=>add([(.4+(x-.4)*1.04)*p.cheek,.14+(y-.14)*p.eyeHeight*1.20,(.65-.16*x)*p.depth]));
    for(let i=0;i<10;i++){const j=(i+1)%10;
      face([outer[i],support[i],support[j],outer[j]],'orbit');
      face([support[i],eye[i],eye[j],support[j]],'lid');
      face([eye[i],rim[i],rim[j],eye[j]],'lid');
    }
    loops.push(eye,rim);
  }
  // Back shell from temple to sagittal rear. Shares temple vertices with face.
  const back=stations.map(([y,w,z,d],r)=>[front[r][5],...Array.from({length:8},(_,i)=>{
    const a=(i+1)*Math.PI/16;
    const height=r<7?jawSideY[r]+(rearBaseY[r]-jawSideY[r])*Math.sin(a):y;
    return add([Math.cos(a)*vertices[front[r][5]][0],height,(.03*Math.cos(a)-d*Math.sin(a))*p.depth]);
  })]);
  for(let r=0;r<stations.length-1;r++)for(let c=0;c<8;c++)face([back[r][c],back[r][c+1],back[r+1][c+1],back[r+1][c]],r===0?'jawUnderside':r<3?'jaw':'skull');
  const top=add([0,1.23,-.08*p.depth]),bottom=add([0,-.83,.05]);
  for(const [r,apex,flip] of [[13,top,false],[0,bottom,true]]){
    const ring=[...front[r],...back[r].slice(1)];
    for(let i=0;i<ring.length-1;i++)face(flip?[ring[i+1],ring[i],apex]:[ring[i],ring[i+1],apex],r===0?'jawUnderside':'skull');
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
    v[2]+=(p.cheekFullness+.038)*cheekWeight;
    // Broad mental pad and shallow masseter support, not a pointed chin or carved fibers.
    v[2]+=.015*bump(-.85,.18,y)*(1-smooth(.13,.36,x))*frontWeight;
    v[0]+=.018*bump(-.40,.28,y)*bump(.69,.20,x)*frontWeight;
    v[2]+=.015*bump(-.40,.28,y)*bump(.65,.23,x)*frontWeight;
    v[1]+=p.cheekHeight*cheekWeight;
    if(stage>=2){
      v[2]+=p.browProjection*bump(.36,.22,y)*bump(.4,.32,x)*frontWeight;
      v[2]+=.018*bump(-.22,.20,y)*bump(.22,.17,x)*frontWeight;
      const noseWeight=bump(-.13,.49,y)*(1-smooth(.15,.34,x))*frontWeight;
      v[0]*=1+(p.noseWidth-1)*noseWeight;
      v[2]+=p.noseBridge*bump(.13,.28,y)*(1-smooth(.05,.26,x))*frontWeight;
      v[1]+=p.noseY*bump(-.22,.24,y)*(1-smooth(.12,.30,x))*frontWeight;
      v[0]*=1+(p.alarWidth-1)*bump(-.38,.15,y)*(1-smooth(.14,.30,x))*frontWeight;
      // Broad oral mound: a front plane, bevel into cheeks, and a lower chin break.
      // Evaluate against the original cage, so mouth controls do not drag its boundary.
      const muzzleY=smooth(-.72,-.55,y)*(1-smooth(-.38,-.30,y));
      const muzzleX=1-smooth(.10,.30,x);
      const muzzleWeight=muzzleY*muzzleX*frontWeight;
      v[2]+=p.muzzleProjection*muzzleWeight;
      v[0]*=1+(p.muzzleWidth-1)*muzzleWeight;
      v[1]+=(y+.46)*(p.muzzleHeight-1)*muzzleWeight;
      v[2]-=p.labiomentalFold*bump(-.72,.17,y)*(1-smooth(.18,.38,x))*frontWeight;
      v[2]-=p.philtrumInset*bump(-.30,.075,y)*(1-smooth(.12,.40,x))*frontWeight;
      const mouthWeight=bump(-.46,.20,y)*(1-smooth(-.38,-.30,y))*(1-smooth(.16,.32,x))*frontWeight;
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
      if(lowerSet.has(i)){v[1]+=p.lowerLid*Math.sin(Math.PI*Math.max(0,Math.min(1,(ax-.15)/.5)));v[2]+=.025*Math.sin(Math.PI*Math.max(0,Math.min(1,(ax-.15)/.5)));}
      if(rimSet.has(i))v[2]-=.045*(p.lidDepth-1)*p.depth;
    }
  }
  // Thin geometric eyebrow ridge from the design sheet; no hair cards or textures.
  if(stage>=2){
    const browShape=[[.15,.285,.665],[.25,.355,.685],[.47,.405,.630],[.64,.395,.555],[.47,.365,.635],[.25,.315,.680]];
    const browFront=browShape.map(([x,y,z])=>add([x*p.cheek,y,(z+p.browProjection)*p.depth]));
    const browBack=browShape.map(([x,y,z])=>add([x*p.cheek,y,(z-.018+p.browProjection)*p.depth]));
    face(reverseWinding(browFront),'eyebrow');face(browBack,'eyebrow');
    for(let i=0;i<6;i++){const j=(i+1)%6;face([browFront[i],browFront[j],browBack[j],browBack[i]],'eyebrow');}
  }
  // Mirror topology and preserve the fan anchor: reversing the whole array changes
  // quad diagonals, causing asymmetric faceting even with symmetric vertices.
  const count=vertices.length, originalFaces=faces.length;
  const mirror=Array.from({length:count},(_,i)=>Math.abs(vertices[i][0])<1e-8?i:add([-vertices[i][0],vertices[i][1],vertices[i][2]]));
  for(let i=0;i<originalFaces;i++)face(reverseWinding(faces[i].map(v=>mirror[v])),regions[i]);
  loops.push(...loops.map(l=>l.map(i=>mirror[i]).reverse()));
  const headVertexCount=vertices.length;
  // Small polygon ears, a separate inspectable study part. Attached by overlap.
  if(stage>=2)for(const sign of [-1,1]){
    const earStart=vertices.length;
    const outline=[[.82,.29,.09],[.88,.31,.02],[.94,.27,-.10],[.97,.20,-.18],[.99,.10,-.22],[.97,-.01,-.21],[.93,-.12,-.16],[.88,-.20,-.07],[.83,-.23,.04],[.81,-.17,.10],[.80,-.02,.13],[.80,.15,.14]];
    const ear=outline.map(v=>add([v[0]*p.cheek*sign,v[1],v[2]*p.depth]));
    const inset=outline.map(v=>add([(.85+(v[0]-.90)*.45)*p.cheek*sign,.05+(v[1]-.05)*.65,(-.035+(v[2]+.035)*.6)*p.depth]));
    const center=add([.82*p.cheek*sign,.05,-.035*p.depth]);
    const reverse=ids=>sign===1?reverseWinding(ids):ids;
    for(let i=0;i<ear.length;i++){const j=(i+1)%ear.length;face(reverse([ear[i],ear[j],inset[j],inset[i]]),'ear');face(reverse([inset[i],inset[j],center]),'ear');}
    // A real rear perimeter creates a solid helix wall rather than a thin rim
    // collapsing directly into one rear apex. Keep the back behind the bowl floor.
    const rearRing=outline.map(v=>add([Math.min(v[0]-.08,.80)*p.cheek*sign,v[1],v[2]*p.depth]));
    const rear=add([.75*p.cheek*sign,.05,-.035*p.depth]);
    for(let i=0;i<ear.length;i++){
      const j=(i+1)%ear.length;
      face(reverse([ear[j],ear[i],rearRing[i],rearRing[j]]),'earWall');
      face(reverse([rearRing[j],rearRing[i],rear]),'earBack');
    }
    for(let i=earStart;i<vertices.length;i++){
      const v=vertices[i],root=.78*p.cheek*sign;
      v[0]=root+(v[0]-root)*p.earOut;
      v[1]=.05+(v[1]-.05)*p.earSize+p.earY;
      v[2]=-.035*p.depth+(v[2]+.035*p.depth)*p.earSize;
    }
  }
  // Discard original cage points replaced by the eye patch; keep exported topology clean.
  const used=new Set(faces.flat()),remap=new Map(),compact=[];
  vertices.forEach((v,i)=>{if(used.has(i)){remap.set(i,compact.length);compact.push(fitReferenceVertex(v,i>=headVertexCount));}});
  return {vertices:compact,faces:faces.map(f=>f.map(i=>remap.get(i))),regions,loops:loops.map(l=>l.map(i=>remap.get(i)))};
}
export function headGeometry(data, colored=false) {
  const palette={skull:0xe5ddce,face:0xe4c9b3,jaw:0xc6d4c7,jawUnderside:0x8baca6,brow:0xd7c8ad,eyebrow:0x9d9e9b,orbit:0x9ebbb8,lid:0x779998,ear:0xccb6a1,earWall:0xb69b83,earBack:0xc0a991,muzzle:0xe5ac88,lip:0xd9a68e,muzzleSide:0xc48668,philtrum:0xc8ac91,nasalBase:0xaaa0b8,chinTransition:0xb9b6a5};
  const positions=[],colors=[];
  data.faces.forEach((f,fi)=>{
    const color=new THREE.Color(colored?palette[data.regions[fi]]:0xbfc1c0);
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
