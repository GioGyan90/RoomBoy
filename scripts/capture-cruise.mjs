import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output=resolve('artifacts/cruise-review');
await mkdir(output,{recursive:true});
const server=spawn('npm',['run','preview','--','--port','4173','--strictPort'],{stdio:'pipe',env:process.env,detached:true});
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
 const page=await browser.newPage({viewport:{width:1120,height:700},deviceScaleFactor:1});
 page.on('pageerror',e=>issues.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error')issues.push('console: '+m.text())});
 const stations=['overview','bed','entry-landing','entry-aisle','bed-foot-clearance','bed-tv-alignment','bed-tv-side','vanity-sink-top','tub-fill-joint','entry-to-bath','bath','ocean','top','table','toilet','side','bed-left','bed-right','service-bar','balcony-door','exterior-starboard','exterior-window-front','exterior-window-oblique','exterior-window-low','exterior-door-front','exterior-door-jamb','exterior-hull-top','exterior-entry','bath-door-bedroom','bath-door-bathroom','bath-door-top','bath-tub-attachments','bath-shower-side'];
 // Boot WebGL once. Repeated full-page reloads made SwiftShader capture flaky and slow.
 await page.goto(base+'?room=cruise&view=room&capture=1&station=overview',{waitUntil:'networkidle',timeout:60000});
 await page.waitForTimeout(1000);
 for(const station of stations){
  const selected=await page.evaluate(name=>{
   const button=document.querySelector('#cruise-camera-review [data-station="'+name+'"]');
   if(!button)return false;
   button.click();
   return true;
  },station);
  if(!selected)throw Error('Inspection camera missing: '+station);
  await page.waitForTimeout(480);
  const canvas=page.locator('canvas').first();
  if(!await canvas.isVisible())throw Error('No visible WebGL canvas at '+station);
  const pixels=await canvas.evaluate(c=>({width:c.width,height:c.height}));
  const shot=await page.screenshot({path:resolve(output,station+'.png'),animations:'disabled'});
  if(shot.length<15000)throw Error('Screenshot appears blank: '+station+' ('+shot.length+' bytes)');
  console.log('Captured',station,pixels);
 }
 await writeFile(resolve(output,'report.json'),JSON.stringify({issues,stations:stations.length,commit:process.env.GITHUB_SHA??null},null,2));
 if(issues.length)throw Error('Browser console errors: '+issues.join('; '));
}finally{
 await browser?.close();
 // npm spawns a shell + Vite child; killing npm alone leaves the pipe open forever.
 // On the Ubuntu runner, terminate the whole detached process group.
 try{if(server.pid)process.kill(-server.pid,'SIGTERM')}catch{}
 server.stdout.destroy();server.stderr.destroy();
}
