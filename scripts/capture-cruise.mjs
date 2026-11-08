import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output=resolve('artifacts/cruise-review');
await mkdir(output,{recursive:true});
const server=spawn('npm',['run','preview','--','--port','4173','--strictPort'],{stdio:'pipe',env:process.env});
let log='';server.stdout.on('data',d=>{log+=String(d)});server.stderr.on('data',d=>{log+=String(d)});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const base='http://127.0.0.1:4173/';
let browser;
const issues=[];
try{
 let ready=false;
 for(let i=0;i<60;i++){try{const r=await fetch(base);if(r.ok){ready=true;break}}catch{}await delay(500)}
 if(!ready)throw Error('Vite preview did not start: '+log);
 browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 page.on('pageerror',e=>issues.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error')issues.push('console: '+m.text())});
 const stations=['overview','bed','bath','ocean','top','table','toilet','side','bed-left','bed-right','service-bar','balcony-door'];
 for(const station of stations){
  await page.goto(base+'?room=cruise&view=room&capture=1&station='+station,{waitUntil:'networkidle',timeout:60000});
  await page.waitForTimeout(1700);
  const canvas=page.locator('canvas').first();
  if(!await canvas.isVisible())throw Error('No visible WebGL canvas at '+station);
  const pixels=await canvas.evaluate(c=>({width:c.width,height:c.height}));
  const shot=await page.screenshot({path:resolve(output,station+'.png'),animations:'disabled'});
  if(shot.length<15000)throw Error('Screenshot appears blank: '+station+' ('+shot.length+' bytes)');
  console.log('Captured',station,pixels);
 }
 // Compact annotated contact sheet is published on a separate QA branch,
 // allowing review of actual WebGL frames rather than trusting code-only checks.
 const frames=await Promise.all(stations.map(async name=>({
  name,src:'data:image/png;base64,'+(await readFile(resolve(output,name+'.png'))).toString('base64')
 })));
 const mosaic=await page.evaluate(async frames=>{
  const w=480,h=300,columns=3;
  const canvas=document.createElement('canvas');
  canvas.width=w*columns;canvas.height=h*Math.ceil(frames.length/columns);
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('contact sheet 2D canvas unavailable');
  for(let i=0;i<frames.length;i++){
   const {name,src}=frames[i];
   const img=await new Promise((resolve,reject)=>{
    const node=new Image();
    node.onload=()=>resolve(node);
    node.onerror=reject;
    node.src=src;
   });
   const col=i%columns,row=Math.floor(i/columns);
   ctx.drawImage(img,col*w,row*h,w,h);
   ctx.fillStyle='rgba(20,14,20,.82)';
   ctx.fillRect(col*w,row*h,w,28);
   ctx.font='bold 17px sans-serif';
   ctx.fillStyle='#fff';
   ctx.fillText(name,col*w+12,row*h+20);
  }
  return canvas.toDataURL('image/jpeg',.79).split(',')[1];
 },frames);
 await writeFile(resolve(output,'contact-sheet.jpg'),Buffer.from(mosaic,'base64'));
  await writeFile(resolve(output,'report.json'),JSON.stringify({issues,stations:stations.length,contactSheet:'contact-sheet.jpg',commit:process.env.GITHUB_SHA??null},null,2));
 if(issues.length)throw Error('Browser console errors: '+issues.join('; '));
}finally{await browser?.close();server.kill('SIGTERM')}
