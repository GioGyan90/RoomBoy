import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
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
  await page.waitForTimeout(800);
  const canvas=page.locator('canvas').first();
  if(!await canvas.isVisible())throw Error('No visible WebGL canvas at '+station);
  const pixels=await canvas.evaluate(c=>({width:c.width,height:c.height}));
  const shot=await page.screenshot({path:resolve(output,station+'.png'),animations:'disabled'});
  if(shot.length<15000)throw Error('Screenshot appears blank: '+station+' ('+shot.length+' bytes)');
  console.log('Captured',station,pixels);
 }
 // Compact annotated contact sheet is published on a separate QA branch,
 // allowing review of actual WebGL frames rather than trusting code-only checks.
 const tileW=480,tileH=300,cols=3;
 const layers=[];
 for(let i=0;i<stations.length;i++){
  const file=resolve(output,stations[i]+'.png');
  const input=await sharp(file).resize(tileW,tileH,{fit:'fill'}).jpeg({quality:73}).toBuffer();
  const left=(i%cols)*tileW,top=Math.floor(i/cols)*tileH;
  layers.push({input,left,top});
  const labelSvg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="32"><rect width="480" height="32" fill="#211a28" fill-opacity=".90"/><text x="12" y="22" font-family="sans-serif" font-size="18" fill="#fff">'+stations[i]+'</text></svg>');
  layers.push({input:labelSvg,left,top});
 }
 await sharp({create:{width:tileW*cols,height:tileH*Math.ceil(stations.length/cols),channels:3,background:'#211a28'}})
  .composite(layers).jpeg({quality:82}).toFile(resolve(output,'contact-sheet.jpg'));
 await writeFile(resolve(output,'report.json'),JSON.stringify({issues,stations:stations.length,contactSheet:'contact-sheet.jpg',commit:process.env.GITHUB_SHA??null},null,2));
 if(issues.length)throw Error('Browser console errors: '+issues.join('; '));
}finally{await browser?.close();server.kill('SIGTERM')}
