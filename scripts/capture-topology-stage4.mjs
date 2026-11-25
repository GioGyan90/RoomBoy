// Real browser & WebGL stage4 C exhibition acceptance. No training model is added to editor presets.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,stat} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright';

const folder='artifacts/stage4-c-browser';
await mkdir(folder,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','3012','--strictPort'],{stdio:'ignore'});
let browser;
const report={checks:[],screenshots:[],errors:[]};
try{
 let ready=false;
 for(let i=0;i<50;i++){
  if(server.exitCode!==null)throw Error('RoomBoy Vite terminated before screenshots');
  try{const r=await fetch('http://127.0.0.1:3012/');if(r.ok){ready=true;break;}}catch{}
  await new Promise(r=>setTimeout(r,400));
 }
 assert.ok(ready,'Vite preview unavailable');
 const bin=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium'].find(existsSync);
 assert.ok(bin,'Chrome unavailable');
 browser=await chromium.launch({executablePath:bin,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-webgl','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:960},deviceScaleFactor:1});
 page.on('pageerror',e=>report.errors.push(String(e)));
 const shots=new Map();
 const stage=async(model,expected,angles)=>{
  await page.goto('http://127.0.0.1:3012/?view=topology-exhibition&model='+model,{waitUntil:'domcontentloaded'});
  await page.getByRole('status').filter({hasText:expected}).waitFor({timeout:30000});
  const canvas=page.locator('canvas');
  await canvas.waitFor();
  assert.ok(await canvas.evaluate(c=>Boolean(c.getContext('webgl2')||c.getContext('webgl'))),'Missing WebGL');
  for(const angle of angles){
   await page.getByRole('button',{name:angle,exact:true}).click();
   await page.waitForTimeout(450);
   const name=model+'-'+angle;
   const path=folder+'/'+name+'.png';
   await canvas.screenshot({path,animations:'disabled'});
   const bytes=await canvas.screenshot({animations:'disabled'});
   if(['正面','侧面','3/4'].includes(angle)){
    const evidence=await canvas.screenshot({type:'jpeg',quality:25,animations:'disabled'});
    console.log('STAGE4_VISUAL_JPEG_'+name+':'+evidence.toString('base64'));
   }
   const size=(await stat(path)).size;
   assert.ok(size>6000,'Blank render: '+name+' '+size);
   report.screenshots.push({name,path,size});
   shots.set(name,bytes);
  }
 };
 await stage('stage4-c',/62 顶点 \/ 116 边 \/ 56 控制面/,['正面','侧面','背面','俯视','仰视','3/4']);
 report.checks.push('C model loaded in WebGL and captured in all six requested cameras');
 await stage('stage4-d',/62 顶点 \/ 116 边 \/ 56 控制面/,['正面','侧面','背面','俯视','仰视','3/4']);
 for(const a of ['正面','3/4'])assert.ok(!shots.get('stage4-c-'+a).equals(shots.get('stage4-d-'+a)),'D must render a visible change in '+a);
 report.checks.push('D model captured from six cameras and compared with C');
 await page.getByRole('status').filter({hasText:'镜像缺失 0 面'}).waitFor();
 await page.getByRole('button',{name:'正面',exact:true}).click();
 await page.getByRole('button',{name:'对称光照',exact:true}).click();
 await page.getByRole('button',{name:'切换布线',exact:true}).click();
 const canvas=page.locator('canvas');
 const capture=async(name)=>{await page.waitForTimeout(500);const path=folder+'/'+name+'.png';const b=await canvas.screenshot({path});const jpeg=await canvas.screenshot({type:'jpeg',quality:55});console.log('STAGE4_VISUAL_JPEG_'+name+':'+jpeg.toString('base64'));report.screenshots.push({name,path,size:(await stat(path)).size});return b};
 const corrected=await capture('stage4-d-symmetric-fixed');
 await page.getByRole('button',{name:'镜像三角化',exact:true}).click();
 await page.getByRole('status').filter({hasText:/镜像缺失 [1-9][0-9]* 面/}).waitFor();
 const original=await capture('stage4-d-symmetric-original');
 assert.ok(!corrected.equals(original));
 await page.getByRole('button',{name:'镜像三角化',exact:true}).click();
 await page.getByRole('status').filter({hasText:'镜像缺失 0 面'}).waitFor();
 report.checks.push('D real render indices mirror exactly; neutral-light original/fixed screenshots captured');

 await stage('stage4-e',/62 顶点 \/ 116 边 \/ 56 控制面/,['正面','侧面','背面','俯视','仰视','3/4']);
 await page.getByRole('status').filter({hasText:'镜像缺失 0 面'}).waitFor();
 await page.getByRole('button',{name:'正面',exact:true}).click();
 await page.getByRole('button',{name:'对称光照',exact:true}).click();
 await page.getByRole('button',{name:'切换布线',exact:true}).click();
 const eFixed=await capture('stage4-e-symmetric-fixed');
 assert.ok(!eFixed.equals(corrected),'E nose must differ from D');
 report.checks.push('E six angles and neutral-light D/E comparison');
 await stage('stage4-f',/60 顶点 \/ 114 边 \/ 56 控制面/,['正面','侧面','背面','俯视','仰视','3/4']);
 await page.getByRole('status').filter({hasText:'镜像缺失 0 面'}).waitFor();
 assert.ok(!shots.get('stage4-e-正面').equals(shots.get('stage4-f-正面')),'F must show the simplified forehead');
 report.checks.push('F actual exhibition six cameras, 60 vertices, 114 edges and mirrored triangulation');
 await stage('stage4-g',/62 顶点 \/ 120 边 \/ 60 控制面/,['正面','侧面','背面','俯视','仰视','3/4']);
 await page.getByRole('status').filter({hasText:'镜像缺失 0 面'}).waitFor();
 for(const a of ['正面','侧面','3/4'])assert.ok(!shots.get('stage4-f-'+a).equals(shots.get('stage4-g-'+a)),'G must show a visible calibrated shape in '+a);
 report.checks.push('G actual six-camera exhibition, restored crown corners and symmetric triangles');
 await stage('stage4-calibrated',/65 顶点 \/ \d+ 边 \/ 62 控制面/,['正面','侧面','3/4']);
 for(const a of ['正面','侧面','3/4']){
  assert.ok(!shots.get('stage4-c-'+a).equals(shots.get('stage4-calibrated-'+a)),'Stage C picture identical to old B in '+a);
 }
 report.checks.push('A/B/C exhibit navigation and visibly distinct B/C browser renders');
 assert.deepEqual(report.errors,[],'Unexpected browser errors');
 console.log('STAGE4_C_BROWSER_ACCEPTANCE_SUCCESS',JSON.stringify(report));
}finally{
 await writeFile(folder+'/report.json',JSON.stringify(report,null,2));
 await browser?.close();
 server.kill('SIGTERM');
}
