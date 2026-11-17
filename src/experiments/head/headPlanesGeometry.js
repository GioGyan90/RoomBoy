import * as T from 'three';

const C={
  skull:0xcac6c3, brow:0xd8d4d0, temple:0xb8b4b2,
  cheek:0xbfbab7, jaw:0xa9a5a3, chin:0xcac5c1,
  eyes:0x625f5d, nose:0xd9d3ce, noseSide:0xb4b0ad,
  ears:0xb7b1ae, earInset:0x8f8986, neck:0xbdb8b3,
  shoulders:0xcec9c4
};

const mat=(color)=>new T.MeshStandardMaterial({color,roughness:0.95,metalness:0,flatShading:true,side:T.DoubleSide});

function polygonGeometry(vertices){
  const positions=[],indices=[];
  for(const v of vertices)positions.push(...v);
  for(let i=1;i<vertices.length-1;i++)indices.push(0,i,i+1);
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

// Every item lives in a semantic group, so the face can later be retopologized.
export function createHeadPlanes(){
 const root=new T.Group();
 root.name='basic-planes-head';
 const parts=[];
 const outlineMaterial=new T.LineBasicMaterial({color:0x514d4a,transparent:true,opacity:.46,depthWrite:false});
 function add(name,geometry,color,zone){
   const mesh=new T.Mesh(geometry,mat(color));
   mesh.name=name;mesh.userData={zone,baseColor:color};
   root.add(mesh);parts.push(mesh);
   const lines=new T.LineSegments(new T.WireframeGeometry(geometry),outlineMaterial);
   lines.name='topology';lines.visible=false;lines.renderOrder=2;
   mesh.add(lines);
   return mesh;
 }
 function panel(name,vertices,color,zone){
   return add(name,polygonGeometry(vertices),color,zone);
 }
 // A 16-sector head cage: the front, side and back are all views of one
 // consistent volume, not several independent flat silhouettes.
 const rings=[
   {y:1.51,w:.28,d:.23,z:-.10},
   {y:1.43,w:.51,d:.43,z:-.10},
   {y:1.15,w:.69,d:.59,z:-.07},
   {y:.79,w:.735,d:.60,z:-.07},
   {y:.58,w:.73,d:.565,z:-.06},
   {y:.39,w:.715,d:.52,z:-.06},
   {y:.12,w:.675,d:.51,z:-.06},
   {y:-.23,w:.55,d:.47,z:-.075},
   {y:-.55,w:.385,d:.40,z:-.09},
   {y:-.77,w:.22,d:.31,z:-.105}
 ];
 const segments=16,vertices=[],triangles=[];
 for(const ring of rings){
   for(let j=0;j<segments;j++){
     const a=j*Math.PI*2/segments;
     let x=Math.sin(a)*ring.w;
     let z=Math.cos(a)*ring.d+ring.z;
     // Recessed eye-plane below the frontal brow ledge.
     const front=Math.cos(a)>.60;
     if(front&&ring.y===.39)z-=.095;
     if(front&&ring.y===.12)z-=.035;
     vertices.push([x,ring.y,z]);
   }
 }
 for(let i=0;i<rings.length-1;i++){
  for(let j=0;j<segments;j++){
   const a=i*segments+j,b=i*segments+(j+1)%segments;
   const c=(i+1)*segments+j,d=(i+1)*segments+(j+1)%segments;
   triangles.push(a,c,b,b,c,d);
  }
 }
 // Cap the upper and lower ends; avoid open rings in side/back views.
 const top=vertices.length;vertices.push([0,1.53,-.10]);
 const bottom=vertices.length;vertices.push([0,-.80,-.105]);
 for(let j=0;j<segments;j++){
   triangles.push(top,j,(j+1)%segments);
   const a=(rings.length-1)*segments+j;
   const b=(rings.length-1)*segments+(j+1)%segments;
   triangles.push(bottom,b,a);
 }
 const geom=new T.BufferGeometry();
 geom.setAttribute('position',new T.Float32BufferAttribute(vertices.flat(),3));
 geom.setIndex(triangles);geom.computeVertexNormals();
 add('01 / 颅骨主壳',geom,C.skull,'skull');

 for(const s of [-1,1]){
   // The eyebrow shelf, cheek wedge and jaw are deliberately distinct
   // connected-looking volumes, with planar turns and mirrored landmarks.
   panel('02 / 眉弓 '+s,[
    [s*.73,.60,.06],[s*.62,.64,.33],[s*.30,.60,.52],
    [s*.135,.54,.55],[s*.28,.48,.55],[s*.56,.48,.42],
    [s*.72,.48,.22]
   ],C.brow,'brow');
   panel('03 / 眼窝 '+s,[
    [s*.17,.46,.43],[s*.36,.47,.40],[s*.61,.46,.285],
    [s*.68,.36,.21],[s*.51,.34,.36],[s*.29,.34,.40],
    [s*.16,.36,.43]
   ],C.eyes,'eyes');
   panel('04 / 太阳穴 '+s,[
    [s*.73,.77,.005],[s*.72,.48,.19],
    [s*.68,.32,.26],[s*.79,.08,.01],
    [s*.72,.58,-.13]
   ],C.temple,'temple');
   panel('05 / 颧骨 '+s,[
    [s*.67,.34,.30],[s*.48,.29,.46],
    [s*.24,.13,.55],[s*.35,-.16,.50],
    [s*.57,-.08,.34],[s*.67,.12,.24]
   ],C.cheek,'cheek');
   panel('06 / 下颌侧面 '+s,[
    [s*.63,.06,.16],[s*.56,-.09,.32],
    [s*.40,-.26,.44],[s*.40,-.56,.29],
    [s*.21,-.76,.20],[s*.50,-.45,.10],
    [s*.58,-.17,-.03]
   ],C.jaw,'jaw');
   panel('07 / 颏侧面 '+s,[
    [s*.40,-.54,.29],[s*.27,-.64,.43],
    [s*.19,-.77,.25],[0,-.78,.29],
    [0,-.60,.46],[s*.23,-.49,.46]
   ],C.chin,'chin');

   // Straight bridge, tapered mid-section, projecting nose tip and two
   // lower side facets. No eyeballs or hair, following the plane study.
   panel('08 / 鼻梁 '+s,[
    [0,.54,.57],[s*.115,.52,.555],
    [s*.10,.25,.69],[s*.135,-.04,.78],
    [0,-.095,.90],[0,.28,.77]
   ],C.nose,'nose');
   panel('09 / 鼻翼 '+s,[
    [s*.135,-.04,.78],[0,-.095,.90],
    [s*.125,-.15,.76],[s*.17,-.13,.60],
    [s*.10,.25,.69]
   ],C.noseSide,'nose');

   const earOuter=[
    [s*.70,.46,-.13],[s*.82,.49,-.12],
    [s*.94,.36,-.13],[s*.965,.14,-.10],
    [s*.87,.005,-.075],[s*.76,.045,-.03],
    [s*.72,.20,.035]
   ];
   const earFront=earOuter.map(([x,y,z])=>[x,y,z+.10]);
   panel('10 / 外耳正面 '+s,earFront,C.ears,'ears');
   panel('11 / 外耳背面 '+s,earOuter,C.temple,'ears');
   for(let i=0;i<earOuter.length;i++){
     const j=(i+1)%earOuter.length;
     panel('12 / 耳轮厚度 '+s+'-'+i,[
       earOuter[i],earOuter[j],earFront[j],earFront[i]
     ],C.ears,'ears');
   }
   panel('13 / 耳甲 '+s,[
     [s*.80,.38,.013],[s*.90,.30,.026],
     [s*.90,.17,.04],[s*.83,.10,.052],
     [s*.78,.19,.067]
   ],C.earInset,'ears');
   panel('14 / 耳屏 '+s,[
     [s*.76,.22,.091],[s*.82,.25,.090],
     [s*.82,.12,.088]
   ],C.ears,'ears');
 }
 // One tiny shadow break for the upper lip, not full lips/eyes.
 panel('15 / 口部基准面',[
   [-.235,-.40,.425],[0,-.42,.488],
   [.235,-.40,.425],[.17,-.48,.44],
   [0,-.50,.466],[-.17,-.48,.44]
 ],0xb0aaa7,'chin');

 function loft(name,levels,sections,color,zone){
   const positions=[],indices=[];
   for(const l of levels){
     for(let j=0;j<sections;j++){
       const a=j*2*Math.PI/sections;
       positions.push(l.w*Math.sin(a),l.y,l.z+l.d*Math.cos(a));
     }
   }
   for(let i=0;i<levels.length-1;i++){
     for(let j=0;j<sections;j++){
       const a=i*sections+j,b=i*sections+(j+1)%sections,
         c=(i+1)*sections+j,d=(i+1)*sections+(j+1)%sections;
       indices.push(a,c,b,b,c,d);
     }
   }
   // Both cut ends are filled to avoid hollow caps in back/top views.
   const t=positions.length/3;positions.push(0,levels[0].y,levels[0].z);
   const b=positions.length/3;const last=levels[levels.length-1];
   positions.push(0,last.y,last.z);
   for(let j=0;j<sections;j++){
     indices.push(t,j,(j+1)%sections);
     const a=(levels.length-1)*sections+j,d=(levels.length-1)*sections+(j+1)%sections;
     indices.push(b,d,a);
   }
   const g=new T.BufferGeometry();
   g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
   g.setIndex(indices);g.computeVertexNormals();
   add(name,g,color,zone);
 }
 loft('16 / 颈部',[
   {y:-.64,w:.25,d:.245,z:-.11},
   {y:-.97,w:.26,d:.26,z:-.13},
   {y:-1.29,w:.275,d:.26,z:-.13},
   {y:-1.53,w:.34,d:.27,z:-.14}
 ],12,C.neck,'neck');
 loft('17 / 斜方肌与肩部截面',[
   {y:-1.29,w:.265,d:.25,z:-.13},
   {y:-1.39,w:.41,d:.28,z:-.13},
   {y:-1.57,w:.92,d:.37,z:-.12},
   {y:-1.68,w:1.04,d:.40,z:-.12},
   {y:-2.08,w:1.10,d:.43,z:-.12}
 ],12,C.shoulders,'shoulders');

 let faces=0;
 for(const m of parts)faces+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;
 function setWire(visible){for(const m of parts)m.getObjectByName('topology').visible=visible;}
 function setZones(visible){
   for(const m of parts)m.material.color.setHex(visible?m.userData.baseColor:C.skull);
 }
 function setPartVisible(zone,visible){for(const m of parts)if(m.userData.zone===zone)m.visible=visible;}
 return {group:root,parts,faces,vertices:parts.reduce((v,m)=>v+m.geometry.attributes.position.count,0),
  setWire,setZones,setPartVisible};
}

