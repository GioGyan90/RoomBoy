import * as THREE from 'three';
import {rand} from '../../core/math';
/* =========================================================
   2 · procedural textures
   ========================================================= */
function canvasTex(c:HTMLCanvasElement, repeat?:[number,number]){
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat){ t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

export function woodFloorTexture(){
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle = '#c99b64'; g.fillRect(0,0,512,512);
  const planks = 5, pw = 512/planks;
  for (let i=0;i<planks;i++){
    const b = 205 + Math.round(rand(-16,16));
    g.fillStyle = `rgb(${b},${Math.round(b*0.77)},${Math.round(b*0.52)})`;
    g.fillRect(i*pw,0,pw,512);
    for (let k=0;k<46;k++){
      const x0 = i*pw + rand(2,pw-2);
      g.beginPath(); g.moveTo(x0,0);
      for (let y=0;y<=512;y+=26) g.lineTo(x0 + Math.sin(y*0.015 + k*1.7)*rand(1,4.5), y);
      g.strokeStyle = `rgba(118,78,38,${rand(0.03,0.11)})`;
      g.lineWidth = rand(0.4,2.4); g.stroke();
    }
    g.fillStyle = 'rgba(84,55,30,.42)';
    g.fillRect(i*pw-1.2,0,2.4,512);
  }
  for (let k=0;k<14;k++){
    g.fillStyle = 'rgba(84,55,30,.20)';
    g.fillRect(rand(0,320), rand(0,512), rand(70,190), 2);
  }
  return canvasTex(c,[2.6,2.4]);
}

export function skyTexture(){
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0,0,0,512);
  gr.addColorStop(0,'#3f97dd'); gr.addColorStop(.5,'#8ec8f2'); gr.addColorStop(1,'#e3f2ff');
  g.fillStyle = gr; g.fillRect(0,0,1024,512);
  for (let i=0;i<34;i++){
    const x=rand(0,1024), y=rand(30,300), r=rand(35,110);
    const rg = g.createRadialGradient(x,y,0,x,y,r);
    rg.addColorStop(0,'rgba(255,255,255,.95)');
    rg.addColorStop(.55,'rgba(255,255,255,.55)');
    rg.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(x,y,r,0,6.3); g.fill();
  }
  // distant plane trail
  g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=4;
  g.beginPath(); g.moveTo(150,120); g.lineTo(560,60); g.stroke();
  return canvasTex(c);
}

export function calendarTexture(){
  const c = document.createElement('canvas'); c.width = 256; c.height = 340;
  const g = c.getContext('2d')!;
  g.fillStyle='#fdfaf4'; g.fillRect(0,0,256,340);
  const gr = g.createLinearGradient(0,0,0,140);
  gr.addColorStop(0,'#9ed3f0'); gr.addColorStop(1,'#5aa9d8');
  g.fillStyle = gr; g.fillRect(10,10,236,120);
  g.fillStyle='#3d7fa8'; g.beginPath(); g.moveTo(10,110); g.lineTo(120,70); g.lineTo(246,110); g.lineTo(246,130); g.lineTo(10,130); g.fill();
  g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.arc(190,50,20,0,6.3); g.fill();
  g.fillStyle='#8a8a8a'; g.font='bold 22px sans-serif'; g.fillText('OCTOBER', 16, 168);
  g.strokeStyle='#d8d2c6'; g.lineWidth=1;
  for(let r=0;r<5;r++) for(let col=0;col<7;col++){
    g.strokeRect(16+col*32, 190+r*28, 30, 26);
  }
  g.fillStyle='#c0504d'; g.fillRect(16+2*32+6, 190+28+6, 18, 14);
  return canvasTex(c);
}

export function rugTexture(){
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d')!;
  g.fillStyle='#efe4d2'; g.fillRect(0,0,512,512);
  g.strokeStyle='#d9c9b0'; g.lineWidth=18; g.strokeRect(20,20,472,472);
  g.strokeStyle='#e6dac6'; g.lineWidth=6; g.strokeRect(52,52,408,408);
  for(let i=0;i<2600;i++){
    g.fillStyle = `rgba(200,180,150,${Math.random()*0.12})`;
    g.fillRect(rand(0,512),rand(0,512),rand(1,4),rand(1,4));
  }
  return canvasTex(c);
}
