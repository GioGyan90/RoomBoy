import * as T from 'three';
import {mesh,rounded,ellipsoid,tube,patch,strand,type P3} from './sculpt';
import {BED,WIN,HD,HW,ROOM,DESK,CHAIR} from '../layout';
import {createMaterials} from './materials';
const mat=(color:number,roughness=.9)=>new T.MeshStandardMaterial({color,roughness,side:T.DoubleSide});
export function refineRoom(root:T.Group,registry:Map<string,T.Group>){
 // Distant scenery is a hand-drawn procedural canvas, with no imported photography.
 const outside=registry.get('outside')!;outside.clear();
 const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1000;const ctx=canvas.getContext('2d')!;
 const sky=ctx.createLinearGradient(0,0,0,1000);sky.addColorStop(0,'#5baae5');sky.addColorStop(.65,'#b5dcf3');sky.addColorStop(1,'#e6ebd8');ctx.fillStyle=sky;ctx.fillRect(0,0,1600,1000);
 let n=42913;const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
 for(let c=0;c<14;c++){const cx=random()*1600,cy=300+random()*320;ctx.fillStyle='#ffffff';ctx.beginPath();for(let i=0;i<12;i++){const px=cx+(random()-.5)*230,py=cy+(random()-.5)*70,r=22+random()*48;ctx.moveTo(px+r,py);ctx.arc(px,py,r,0,Math.PI*2);}ctx.fill();}
 ctx.strokeStyle='#fff9';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(300,350);ctx.lineTo(1300,140);ctx.stroke();
 for(let i=0;i<18;i++){
  const x=i*100-30,y=740+random()*150;ctx.fillStyle=i%2?'#adb8b7':'#ccd1c6';ctx.fillRect(x,y,110,1000-y);
  ctx.fillStyle='#8398a4';ctx.beginPath();ctx.moveTo(x-15,y);ctx.lineTo(x+50,y-46);ctx.lineTo(x+126,y);ctx.closePath();ctx.fill();
  for(let k=0;k<4;k++){ctx.fillStyle='#7c9cae';ctx.fillRect(x+12+k*23,y+17,12,20);}
 }
 for(let i=0;i<500;i++){const x=1050+random()*650,y=620+random()*500;ctx.fillStyle=['#536f48','#7e9c60','#a2b778','#607d4d'][i%4];ctx.beginPath();ctx.ellipse(x,y,8+random()*25,8+random()*20,random()*3,0,Math.PI*2);ctx.fill();}
 const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;const panorama=mesh(outside,new T.PlaneGeometry(12,7.5),new T.MeshBasicMaterial({map:tex}),[0,2.5,-8]);panorama.castShadow=false;panorama.receiveShadow=false;
 const M=createMaterials();const ivory=mat(0xe9e3d8),navy=mat(0x526c82),edge=mat(0x29323b),steel=mat(0x97928a,.4);
 function replace(id:string){const old=registry.get(id)!;old.removeFromParent();const group=new T.Group();group.name=id;root.add(group);registry.set(id,group);return group;}
 const b=replace('bed'),x=BED.x,z=BED.z;
 rounded(b,[1.25,.115,2.68],M.wood,[x,.31,z],.018);
 rounded(b,[1.20,.07,2.64],M.woodDark,[x,.225,z],.008);
 rounded(b,[1.32,.78,.075],M.wood,[x,.41,-1.99],.022);
 rounded(b,[1.22,.64,.024],M.woodLight,[x,.43,-1.941],.014);
 for(const sx of [-.57,.57])for(const sz of [-1.23,1.23])rounded(b,[.075,.31,.075],M.wood,[x+sx,.155,z+sz],.006);
 rounded(b,[1.20,.18,2.6],ivory,[x,.445,z],.052);
 // An actual draped sheet: top surface flows over both mattress edges.
 patch(b,78,120,(u,v)=>{
  const xx=(u-.5)*1.48,zz=(v-.5)*2.72;
  const fall=Math.pow(Math.max(0,(Math.abs(xx)-.54)/.20),.7)*.32+Math.pow(Math.max(0,(zz-1.22)/.14),.7)*.21;
  const fold=(Math.sin(v*85+u*12)*.004+Math.sin(v*37-u*18)*.003)*(.25+Math.pow(Math.abs(u-.5)*2,2));
  return [x+xx,.55-fall+fold,z+zz];
 },M.fabric);
 // Draped blue duvet, with a turned-back edge and irregular cloth ridges.
 patch(b,74,90,(u,v)=>{
  const xx=(u-.5)*1.39,zz=-.13+v*1.52;
  const hanging=Math.pow(Math.max(0,(Math.abs(xx)-.54)/.15),.8)*.17+Math.pow(Math.max(0,(zz-1.24)/.15),.8)*.15;
  return [x+xx+.025*Math.sin(v*7),.655-hanging+.010*Math.sin(v*32+u*14)+.008*Math.sin(u*25-v*15),z+zz];
 },navy);
 tube(b,[[x-.65,.57,z-.13],[x-.3,.62,z-.16],[x+.15,.61,z-.11],[x+.66,.57,z-.13]],.012,navy);
 for(const sx of [-.32,.25]){
  const pillow=ellipsoid(b,[.34,.075,.21],ivory,[x+sx*.35,.63,-1.64+(sx>.1?.10:0)]);pillow.rotation.y=sx*.12;
  // Tailored piping around each pillow.
  const points:P3[]=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;points.push([x+sx*.35+Math.cos(a)*.327,.625+Math.sin(a*2)*.006,-1.64+(sx>.1?.10:0)+Math.sin(a)*.20]);}tube(b,points,.003,M.fabric);
 }
 for(let i=0;i<3;i++){
  rounded(b,[.44,.22,.66],mat(i===2?0x3b3b39:0xb8b4aa),[x+.35,.13,z-.75+i*.8],.014);
  rounded(b,[.45,.027,.67],mat(0xc3beb1),[x+.35,.252,z-.75+i*.8],.007);
  rounded(b,[.06,.015,.008],edge,[x+.575,.17,z-.75+i*.8],.002);
 }
 const w=replace('window');const cy=(WIN.y0+WIN.y1)/2,cx=(WIN.x0+WIN.x1)/2,width=WIN.x1-WIN.x0,height=WIN.y1-WIN.y0;
 for(const y of [WIN.y0,WIN.y1])rounded(w,[width+.14,.048,.10],ivory,[cx,y,-HD+.025],.005);
 for(const xx of [WIN.x0,WIN.x1,cx])rounded(w,[.038,height,.07],steel,[xx,cy,-HD+.03],.003);
 rounded(w,[width,.025,.045],steel,[cx,WIN.y0+height*.32,-HD+.06],.002);
 rounded(w,[width+.22,.035,.17],M.white,[cx,WIN.y0-.025,-HD+.06],.005);
 for(const xx of [cx-.055,cx+.055])rounded(w,[.013,.105,.015],edge,[xx,cy-.12,-HD+.08],.004);
 tube(w,[[WIN.x0-.22,WIN.y1+.085,-HD+.11],[WIN.x1+.22,WIN.y1+.085,-HD+.11]],.012,steel);
 const linen=new T.MeshStandardMaterial({color:0xf5f1e6,roughness:1,transparent:true,opacity:.67,side:T.DoubleSide,depthWrite:false});
 patch(w,45,60,(u,v)=>[cx+.30+u*.59+.012*Math.sin(v*5),WIN.y1+.065-v*(height+.17),-HD+.11+.026*Math.sin(u*60)],linen).castShadow=false;
 for(const s of [-1,1]){
  const anchor=s<0?WIN.x0:WIN.x1;
  patch(w,40,90,(u,v)=>{
   const fullness=.38-.15*Math.exp(-(((v-.69)/.17)**2));
   return [anchor+s*.02+(u-.5)*fullness+s*.045*Math.sin(v*Math.PI),WIN.y1+.075-v*(height+.19),-HD+.19+.031*Math.sin(u*Math.PI*16)+.009*Math.sin(v*7+u*14)];
  },navy);
  const tie=rounded(w,[.23,.07,.075],mat(0x8192a0),[anchor+s*.055,WIN.y1+.075-(height+.19)*.69,-HD+.22],.012);tie.rotation.z=-s*.12;
 }
 // Cornices and ceiling trim frame the composition.
 const shell=registry.get('shell')!;
 rounded(shell,[ROOM.w,.045,.035],M.woodDark,[0,ROOM.h-.025,-HD+.025],.003);
 for(const sx of [-HW,HW])rounded(shell,[.035,.045,ROOM.d],M.woodDark,[sx,ROOM.h-.025,0],.003);
 const decor=registry.get('decor')!;
 decor.children.forEach(o=>{if(o instanceof T.Mesh&&o.geometry instanceof T.PlaneGeometry&&Math.abs(o.position.y-1.66)<.01)o.position.x=1.23;});
 // AC drain pipe with rounded corners, remote and ventilation grille.
 tube(decor,[[.68,2.49,-HD+.08],[.87,2.49,-HD+.08],[.98,2.42,-HD+.08],[.98,2.20,-HD+.08],[1.03,2.16,-HD+.08]],.015,ivory);
 rounded(decor,[.085,.105,.04],ivory,[1.04,2.13,-HD+.04],.016);
 const vent=mesh(decor,new T.CircleGeometry(.068,36),ivory,[.98,1.91,-HD+.01]);
 for(let i=-3;i<=3;i++)tube(decor,[[.93,1.91+i*.012,-HD+.018],[1.03,1.91+i*.012,-HD+.018]],.0015,steel);
 vent.name='ventilation-grille';
 const d=registry.get('desk')!;d.children.forEach(o=>{if(o instanceof T.PointLight)o.intensity=.3;});
 // Laptop hinge, chiclet keyboard, trackpad and mug handle.
 const keyboard=mat(0x464850);
 for(let r=0;r<4;r++)for(let c=0;c<10;c++)rounded(d,[.022,.002,.018],keyboard,[DESK.x-.19+c*.027,.778,DESK.z+.02+r*.023],.002);
 rounded(d,[.095,.001,.058],mat(0x555960),[DESK.x-.05,.779,DESK.z+.151],.004);
 tube(d,[[DESK.x+.247,.825,DESK.z+.14],[DESK.x+.275,.84,DESK.z+.14],[DESK.x+.275,.80,DESK.z+.14],[DESK.x+.247,.79,DESK.z+.14]],.006,ivory,20);
 for(let i=0;i<6;i++)tube(d,[[DESK.x+.30,.83,DESK.z-.14],[DESK.x+.30+(i-3)*.009,.98+i%2*.03,DESK.z-.14]],.0025,edge,8);
 // Adjustable anglepoise lamp, replacing the straight cylinder silhouette.
 tube(d,[[DESK.x+.5,.79,DESK.z-.16],[DESK.x+.54,.96,DESK.z-.16],[DESK.x+.44,1.16,DESK.z-.16],[DESK.x+.29,1.28,DESK.z-.16]],.009,edge);
 for(const p of [[DESK.x+.54,.96,DESK.z-.16],[DESK.x+.44,1.16,DESK.z-.16]] as P3[])ellipsoid(d,[.019,.019,.019],edge,p);
 tube(d,[[DESK.x+.10,.78,DESK.z-.24],[DESK.x+.18,.56,DESK.z-.26],[DESK.x+.45,.10,DESK.z-.25]],.0035,edge);
 const c=registry.get('chair')!;
 const cushion=mat(0x283845);
 const seat=rounded(c,[.47,.06,.45],cushion,[CHAIR.x,.47,CHAIR.z],.035);seat.rotation.x=-.03;
 const back=patch(c,30,40,(u,v)=>[CHAIR.x+(u-.5)*(.41-.045*Math.sin(v*Math.PI)),.52+v*.53,CHAIR.z-.21-.04*Math.sin(v*Math.PI)+.04*(u-.5)**2],cushion);
 back.name='curved-mesh-chair-back';
 for(const s of [-1,1])tube(c,[[CHAIR.x+s*.21,.54,CHAIR.z-.20],[CHAIR.x+s*.22,.94,CHAIR.z-.25],[CHAIR.x+s*.17,1.06,CHAIR.z-.22]],.014,edge);
 const wardrobe=replace('wardrobe');const wx=2.12,wz=.1,backX=2.39;
 rounded(wardrobe,[.055,2.65,2.6],M.woodDark,[backX,1.325,wz],.007);
 for(const zz of [-1.2,-.5,1.4])rounded(wardrobe,[.63,2.65,.055],M.wood,[wx,1.325,zz],.005);
 for(const y of [.045,2.62])rounded(wardrobe,[.64,.065,2.65],M.wood,[wx,y,wz],.006);
 // Near bay is a hanging rail; far bay contains open shelves and paper boxes.
 tube(wardrobe,[[wx,2.38,-.45],[wx,2.38,1.34]],.012,steel);
 const colors=[0x253343,0x46576b,0xb8b8b2,0x334557,0x76818c,0xced0ca,0x24313d];
 for(let i=0;i<8;i++){
  const zz=-.34+i*.215;const m=mat(colors[i%colors.length]);
  tube(wardrobe,[[wx,2.37,zz],[wx,2.43,zz],[wx-.035,2.45,zz],[wx-.047,2.40,zz]],.004,steel,16);
  tube(wardrobe,[[wx-.22,2.24,zz],[wx,2.36,zz],[wx+.22,2.24,zz],[wx-.22,2.24,zz]],.006,M.woodDark,16);
  // Each garment is a shoulder-shaped surface with a folded sleeve and hem.
  patch(wardrobe,32,42,(u,v)=>{
   const xx=(u-.5)*(.46-.06*v),shoulder=.065*Math.abs(u-.5)*2;
   return [wx+xx,2.28-shoulder-v*(.93+i%3*.09),zz+.024*Math.sin(u*29)+.014*Math.sin(v*6+u*12)];
  },m);
  tube(wardrobe,[[wx-.21,2.20,zz],[wx-.245,2.03,zz+.02],[wx-.18,1.99,zz+.025]],.018,m,12);
 }
 for(const y of [.45,.85,1.45,2.06])rounded(wardrobe,[.62,.038,.64],M.woodLight,[wx,y,-.85],.004);
 for(let i=0;i<3;i++){
  rounded(wardrobe,[.56,.28,.57],mat(0xbca37f),[wx,.23+i*.32,-.85],.008);
  rounded(wardrobe,[.008,.018,.10],edge,[wx-.285,.27+i*.32,-.85],.002);
 }
 for(let i=0;i<8;i++)rounded(wardrobe,[.29,.24,.03],mat(colors[i%7]),[wx-.12,1.59,-1.10+i*.055],.003);
 wardrobe.scale.z=.68;wardrobe.position.z=.55;wardrobe.position.x=-.15;
 const shelves=registry.get('shelves')!;
 // Trailing pothos with individually shaped leaves.
 for(let branch=0;branch<3;branch++){
  const bx=1.22+branch*.04;const points:P3[]=[];
  for(let i=0;i<7;i++){const y=2.19-i*.07;points.push([bx+.05*Math.sin(i*.9+branch),y,-HD+.3+.03*Math.sin(i)]);}
  tube(shelves,points,.002,M.green);
  points.forEach((p,i)=>{const leaf=ellipsoid(shelves,[.022,.037,.008],i%2?M.green:M.green2,[p[0]+(i%2?-.024:.024),p[1]-.012,p[2]]);leaf.rotation.z=i%2?.7:-.7;});
 }
 const props=replace('props');
 rounded(props,[1.60,.019,1.30],mat(0xe3d9c7),[-.10,.014,-.02],.016);
 const rugSeam=mat(0xc4bba9);tube(props,[[-.87,.025,-.64],[.67,.025,-.64],[.67,.025,.60],[-.87,.025,.60],[-.87,.025,-.64]],.003,rugSeam);
 const bin=mesh(props,new T.CylinderGeometry(.13,.10,.32,32,1,true),ivory,[.98,.16,-1.20]);bin.name='open-wastebasket';
 const pack=rounded(props,[.39,.52,.23],navy,[1.98,.29,1.36],.065);pack.rotation.y=-.18;
 rounded(props,[.33,.25,.04],mat(0x344b63),[1.95,.23,1.50],.04);
 tube(props,[[1.87,.51,1.39],[1.89,.62,1.39],[2.05,.62,1.39],[2.08,.51,1.39]],.012,navy);
 for(const s of [-1,1])tube(props,[[1.98+s*.13,.51,1.30],[1.98+s*.19,.28,1.28],[1.98+s*.13,.07,1.30]],.018,edge);
 tube(props,[[1.80,.16,1.525],[1.81,.39,1.525],[2.10,.39,1.525],[2.12,.16,1.525]],.003,steel);
 rounded(props,[.05,.035,.003],mat(0xa99d80),[1.96,.35,1.53],.003);
}
