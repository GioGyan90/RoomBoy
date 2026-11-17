import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const output=resolve('artifacts/head-lod-webgl');
await mkdir(output,{recursive:true});
const server=spawn('npm',['run','preview','--','--port','4175','--strictPort'],{
 stdio:'pipe',env:process.env,detached:true
});
let log='';
server.stdout.on('data',x=>{log+=String(x)});
server.stderr.on('data',x=>{log+=String(x)});
const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
const base='http://127.0.0.1:4175/';
let browser;
const issues=[];
try{
 let ready=false;
 for(let i=0;i<60;i++){
  try {if((await fetch(base)).ok){ready=true;break}}catch{}
  await delay(500);
 }
 if(!ready)throw Error('Preview server failed '+log);
 browser=await chromium.launch({
  headless:true,
  args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
        '--enable-unsafe-swiftshader','--disable-dev-shm-usage']
 });
 const page=await browser.newPage({viewport:{width:1512,height:930},deviceScaleFactor:1});
 page.on('pageerror',e=>issues.push('pageerror '+e.message));
 await page.goto(base+'?view=head&mode=lod',{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#head-canvas canvas').waitFor({state:'visible',timeout:30000});
 await page.waitForFunction(()=>{
   const lod=document.querySelector('#head-lod-toggle');
   const txt=document.querySelector('#head-lod-status')?.textContent||'';
   const master=document.querySelector('#head-status')?.textContent||'';
   return lod && !lod.disabled && txt.includes('10,000') && master.includes('34,500');
 },{timeout:30000});
 await page.locator('#head-lod-compare').check();
 await page.waitForFunction(()=>!document.querySelector('#head-safe-toggle')?.disabled);
 await page.locator('#head-safe-toggle').check();
 for(const view of ['front','quarter','side','back']){
  await page.locator('[data-view="'+view+'"]').click();
  await page.waitForTimeout(550);
  const bytes=await page.locator('.head-stage').screenshot({
   path:resolve(output,'boundary-safe-'+view+'.png'),animations:'disabled'
  });
  if(bytes.length<15000)throw Error('Blank safety comparison '+view);
 }
 await page.locator('#head-lod-toggle').check();
 for(const view of ['front','quarter','side','back']){
  await page.locator('[data-view="'+view+'"]').click();
  await page.waitForTimeout(650);
  const data=await page.locator('.head-stage').screenshot({
   path:resolve(output,view+'-webgl.png'),animations:'disabled'
  });
  if(data.length<15000)throw Error('Blank WebGL render for '+view);
 }
 // Facial high-zoom, compared with same orbit controls and actual vertex normals.
 await page.locator('[data-view="front"]').click();
 await page.locator('#head-canvas canvas').hover();
 await page.mouse.wheel(0,-540);
 await page.waitForTimeout(550);
 const wireShot=await page.locator('.head-stage').screenshot({
  path:resolve(output,'face-zoom-webgl.png'),animations:'disabled'
 });
 if(wireShot.length<15000)throw Error('Blank face zoom');
 await writeFile(resolve(output,'report.json'),JSON.stringify({
  source:'actual Three.js GLTFLoader + MeshLambertMaterial',
  views:['front','quarter','side','back','face-zoom', 'boundary-safe-front','boundary-safe-quarter','boundary-safe-side','boundary-safe-back'],
  issues,commit:process.env.GITHUB_SHA||null
 },null,2)+'\n');
 if(issues.length)throw Error(issues.join('; '));
 console.log('WebGL head LOD comparison captured for four views and face zoom');
}finally{
 await browser?.close();
 try {if(server.pid)process.kill(-server.pid,'SIGTERM')}catch{}
 server.stdout.destroy();server.stderr.destroy();
}
