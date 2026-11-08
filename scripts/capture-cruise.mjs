import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output=resolve('artifacts/cruise-review');
await mkdir(output,{recursive:true});
const server=spawn('npm',['run','preview','--','--port','4173','--strictPort'],{stdio:'pipe',env:process.env});
let log='';server.stdout.on('data',d=>{log+=String(d)});server.stderr.on('data',d=>{log+=String(d)});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const base='http://127.0.0.1:4173/RoomBoy/';
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
 for(const station of ['overview','bed','bath','ocean','top']){
  await page.goto(base+'?room=cruise&view=room&station='+station,{waitUntil:'networkidle',timeout:60000});
  await page.waitForTimeout(1700);
  const canvas=page.locator('canvas').first();
  if(!await canvas.isVisible())throw Error('No visible WebGL canvas at '+station);
  const pixels=await canvas.evaluate(c=>{const gl=c.getContext('webgl2')||c.getContext('webgl');return {width:c.width,height:c.height,webgl:!!gl}});
  await page.screenshot({path:resolve(output,station+'.png'),animations:'disabled'});
  console.log('Captured',station,pixels);
 }
 await writeFile(resolve(output,'report.json'),JSON.stringify({issues,stations:5},null,2));
 if(issues.length)throw Error('Browser console errors: '+issues.join('; '));
}finally{await browser?.close();server.kill('SIGTERM')}
