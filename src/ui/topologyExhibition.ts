import * as T from 'three';
import {mirrorTrianglesX} from './mirrorTriangulation';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';

type Cage={vertices:number[][];faces:number[][]};
export function startTopologyExhibition(){
 const root=document.createElement('main');
 root.style.cssText='position:fixed;inset:0;z-index:9999;background:#252b33;color:#eef2f5;display:flex;flex-direction:column;font:14px system-ui';
 document.body.append(root);
 const bar=document.createElement('header');bar.style.cssText='padding:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;background:#17202a';
 root.append(bar);
 for(const [id,label] of [['stage1','01 颅骨'],['stage2','02 下颌与颈部'],['stage3','03 面部纵向布线'],['stage4','04 鼻部与眉弓（旧）'],['stage4-calibrated','04B 参考图校准'],['stage4-c','04C 局部鼻部布线'],['stage4-d','04D 眉弓深度校准']]){const a=document.createElement('a');a.href='?view=topology-exhibition&model='+id;a.textContent=label;a.style.cssText='color:#9cd9ff;padding:5px 8px;border:1px solid #637584;border-radius:5px';bar.append(a);}
 const title=document.createElement('strong');title.textContent='布线模型展览馆';bar.append(title);
 const back=document.createElement('a');back.href='./';back.textContent='返回 RoomBoy';back.style.color='#9cd9ff';bar.append(back);
 const file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.setAttribute('aria-label','导入控制网格');bar.append(file);
 const status=document.createElement('span');status.setAttribute('role','status');bar.append(status);
 const canvasArea=document.createElement('div');canvasArea.style.cssText='flex:1;min-height:0;position:relative;touch-action:none';root.append(canvasArea);
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));canvasArea.append(renderer.domElement);
 renderer.domElement.style.cssText='display:block;width:100%;height:100%;touch-action:none';
 const scene=new T.Scene();scene.background=new T.Color(0x30353b);
 const camera=new T.PerspectiveCamera(38,1,.01,1000);const orbit=new OrbitControls(camera,renderer.domElement);orbit.enableDamping=true;
 scene.add(new T.HemisphereLight(0xffffff,0x667788,2));const light=new T.DirectionalLight(0xffffff,2.2);light.position.set(3,5,4);scene.add(light);
 const fillLight=new T.DirectionalLight(0xffffff,0);fillLight.position.set(-3,5,4);scene.add(fillLight);
 const group=new T.Group();scene.add(group);
 let symmetricLight=false,mirrorEnabled=true,lastMesh:Cage|null=null;
 let lines:T.LineSegments|null=null,points:T.Points|null=null,distance=5,wire=true;
 const center=new T.Vector3();
 function view(x:number,y:number,z:number){camera.up.set(0,1,0);camera.position.copy(center).add(new T.Vector3(x,y,z).normalize().multiplyScalar(distance));orbit.target.copy(center);orbit.update();}
 function button(label:string,action:()=>void){const b=document.createElement('button');b.textContent=label;b.style.cssText='padding:6px 10px;background:#344455;color:white;border:1px solid #667687;border-radius:5px';b.onclick=action;bar.append(b);return b;}
 for(const [label,x,y,z] of [['正面',0,0,1],['侧面',1,0,0],['背面',0,0,-1],['俯视',0,1,.0001],['仰视',0,-1,.0001],['3/4',1,.6,1.4]] as const)button(label,()=>view(x,y,z));
 button('切换布线',()=>{wire=!wire;if(lines)lines.visible=wire;if(points)points.visible=wire;});
 const lightButton=button('对称光照',()=>{symmetricLight=!symmetricLight;light.intensity=symmetricLight?1.1:2.2;fillLight.intensity=symmetricLight?1.1:0;lightButton.setAttribute('aria-pressed',String(symmetricLight));});lightButton.setAttribute('aria-pressed','false');
 const mirrorButton=button('镜像三角化',()=>{mirrorEnabled=!mirrorEnabled;mirrorButton.setAttribute('aria-pressed',String(mirrorEnabled));if(lastMesh){const p=camera.position.clone(),target=orbit.target.clone();show(lastMesh);camera.position.copy(p);orbit.target.copy(target);orbit.update();}});mirrorButton.setAttribute('aria-pressed','true');
 function show(raw:unknown){
  const d=raw as Cage;
  if(!d||!Array.isArray(d.vertices)||!Array.isArray(d.faces)||!d.vertices.length||d.vertices.length>5000||!d.faces.length||d.faces.length>10000||d.vertices.some(v=>!Array.isArray(v)||v.length!==3||v.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>1e6))||d.faces.some(f=>!Array.isArray(f)||f.length<3||f.length>64||f.some(i=>!Number.isInteger(i)||i<0||i>=d.vertices.length)))throw Error('控制网格格式无效');
  const positions=d.vertices.flat(),perFace:number[][]=[],edge=new Map<string,number[]>();
  for(const f of d.faces){
   const faceTriangles:number[]=[];
   // Project polygon onto its dominant plane for triangulation, preserving face order.
   const n=new T.Vector3();for(let i=0;i<f.length;i++){const a=new T.Vector3(...d.vertices[f[i]] as [number,number,number]),b=new T.Vector3(...d.vertices[f[(i+1)%f.length]] as [number,number,number]);n.add(a.clone().cross(b));}
   const axis=Math.abs(n.x)>=Math.abs(n.y)&&Math.abs(n.x)>=Math.abs(n.z)?0:Math.abs(n.y)>=Math.abs(n.z)?1:2;
   const contour=f.map(i=>{const v=d.vertices[i];return new T.Vector2(v[(axis+1)%3],v[(axis+2)%3]);});
   for(const t of T.ShapeUtils.triangulateShape(contour,[])){const ids=t.map(i=>f[i]);const a=new T.Vector3(...d.vertices[ids[0]] as [number,number,number]),b=new T.Vector3(...d.vertices[ids[1]] as [number,number,number]),c=new T.Vector3(...d.vertices[ids[2]] as [number,number,number]);if(b.sub(a).cross(c.sub(a)).dot(n)<0)ids.reverse();faceTriangles.push(...ids);}
   perFace.push(faceTriangles);
   f.forEach((a,i)=>{const b=f[(i+1)%f.length];edge.set(a<b?a+':'+b:b+':'+a,[a,b]);});
  }
  const {indices:tri,report}=mirrorTrianglesX(d.vertices,d.faces,perFace,mirrorEnabled);
  if(!tri.length)throw Error('无法三角化');
  group.traverse(o=>{if(o instanceof T.Mesh||o instanceof T.LineSegments||o instanceof T.Points){o.geometry.dispose();(o.material as T.Material).dispose();}});group.clear();
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(tri);geo.computeVertexNormals();
  group.add(new T.Mesh(geo,new T.MeshStandardMaterial({color:0xbfc4c9,flatShading:true,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1})));
  const eg=new T.BufferGeometry();eg.setAttribute('position',new T.Float32BufferAttribute([...edge.values()].flatMap(([a,b])=>[...d.vertices[a],...d.vertices[b]]),3));lines=new T.LineSegments(eg,new T.LineBasicMaterial({color:0xffab57}));lines.visible=wire;group.add(lines);
  const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(positions,3));points=new T.Points(pg,new T.PointsMaterial({color:0x62caff,size:4,sizeAttenuation:false}));points.visible=wire;group.add(points);
  const box=new T.Box3().setFromObject(group);box.getCenter(center);distance=Math.max(box.getSize(new T.Vector3()).length()*1.7,.1);camera.far=Math.max(distance*20,100);camera.near=Math.max(distance/10000,.0001);camera.updateProjectionMatrix();view(1,.6,1.4);
  lastMesh=d;
  status.textContent=d.vertices.length+' 顶点 / '+edge.size+' 边 / '+d.faces.length+' 控制面 / '+tri.length/3+' 三角面 · '+(report.unmatchedTriangles===null?'非完整对称网格':('镜像缺失 '+report.unmatchedTriangles+' 面'));
 }
 const error=(e:unknown)=>{status.textContent='加载失败：'+String(e);};
 file.onchange=async()=>{try{const f=file.files?.[0];if(f){if(f.size>10*1024*1024)throw Error('文件超过10MB');show(JSON.parse(await f.text()));}}catch(e){error(e);}finally{file.value='';}};
 const resize=()=>{const w=canvasArea.clientWidth,h=Math.max(canvasArea.clientHeight,1);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(canvasArea);resize();view(1,.6,1.4);
 renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera);});
 const hash=new URLSearchParams(location.hash.slice(1));const payload=hash.get('mesh');
 if(payload){try{if(payload.length>1000000)throw Error('链接太长，请使用 JSON 导入');show(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(payload),c=>c.charCodeAt(0)))));}catch(e){error(e);}}
 else if(['stage1','stage2','stage3','stage4','stage4-calibrated','stage4-c','stage4-d'].includes(new URLSearchParams(location.search).get('model')??'')){const model=new URLSearchParams(location.search).get('model');fetch(import.meta.env.BASE_URL+'exhibits/'+(model==='stage4-d'?'stage4-d.json':model==='stage4-c'?'stage4-c.json':model==='stage4-calibrated'?'stage4-calibrated.json':model==='stage4'?'stage4-nose-brow.json':model==='stage3'?'stage3-face-routing.json':model==='stage2'?'stage2-cranium-neck.json':'stage1-cranium.json')).then(r=>{if(!r.ok)throw Error('模型未找到');return r.json();}).then(show).catch(error);}
 else status.textContent='请导入 3D_AItool 控制网格 JSON';
}
