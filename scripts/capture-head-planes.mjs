/**
 * Capture the *actual* WebGL model, not a CPU projection or unit-test shape.
 * The resulting small JPEGs are committed as review artifacts so GitHub
 * connector consumers can inspect pixels instead of trusting compilation.
 */
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const output=resolve('docs/images/head-planes-review');
await mkdir(output,{recursive:true});
const base='http://127.0.0.1:4173/';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn('npm',['run','preview','--','--port','4173','--strictPort'],{
  stdio:'pipe',env:process.env,detached:true
});
let serverOutput='';
for(const stream of [server.stdout,server.stderr]){
  stream.on('data',data=>{serverOutput+=String(data).slice(-2000)});
}
let browser;
const browserErrors=[];
const records=[];
try{
  let ready=false;
  for(let i=0;i<70;i++){
    try{const r=await fetch(base);if(r.ok){ready=true;break}}catch{}
    await delay(500);
  }
  if(!ready)throw new Error('Vite preview unavailable: '+serverOutput);
  browser=await chromium.launch({headless:true,args:[
    '--enable-webgl','--use-gl=angle','--use-angle=swiftshader',
    '--enable-unsafe-swiftshader','--disable-dev-shm-usage'
  ]});
  const page=await browser.newPage({viewport:{width:1280,height:800},
    deviceScaleFactor:1, colorScheme:'light'});
  page.on('pageerror',e=>browserErrors.push('pageerror: '+e.message));
  page.on('console',msg=>{
    if(msg.type()==='error')browserErrors.push('console: '+msg.text());
  });
  await page.goto(base+'?view=head-planes&angle=front',{
    waitUntil:'domcontentloaded',timeout:60000
  });
  const canvas=page.locator('#planes-canvas canvas');
  await canvas.waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(()=>{
    const c=document.querySelector('#planes-canvas canvas');
    return c && c.width>=600 && c.height>=400;
  });
  await page.waitForTimeout(850); // First frames, shader compilation and lights.
  const counts=await page.locator('#planes-count').innerText();
  if(!counts.includes('三角面'))throw new Error('Head geometry count missing');

  async function capture(name){
    await page.waitForTimeout(350);
    const result=await page.locator('#planes-canvas').screenshot({
      path:resolve(output,name+'.jpg'),type:'jpeg',quality:76,
      animations:'disabled',timeout:15000
    });
    // A fully white or empty WebGL canvas produces tiny JPEGs.
    if(result.byteLength<4500)
      throw new Error('Potential blank WebGL capture '+name+': '+result.byteLength+' bytes');
    records.push({name,bytes:result.byteLength});
    console.log('HEAD VISUAL',name,result.byteLength);
  }

  const viewIds=[
    ['front','正面'],['frontLeft','左前3/4'],['frontRight','右前3/4'],
    ['profileLeft','左侧'],['profileRight','右侧'],
    ['back','背面'],['backLeft','左后3/4'],['top','俯视']
  ];
  for(const [id] of viewIds){
    const b=page.locator('[data-view="'+id+'"]');
    await b.click();
    if(!await b.evaluate(el=>el.classList.contains('selected')))
      throw new Error('Camera button failed '+id);
    await capture(id);
  }
  // Capture the *actual* half-front authored points and welded mirror stages.
  for(const stage of ['half','mirror']){
    const b=page.locator('[data-stage="'+stage+'"]');
    await b.click();
    if(!await b.evaluate(el=>el.classList.contains('selected')))
      throw new Error('Head generation stage failed '+stage);
    await capture('stage-'+stage);
  }
  // A perspective-comparison sheet is assembled by the runtime's nine views,
  // not a replacement/static illustration.
  await page.locator('[data-stage="volume"]').click();
  await page.locator('#planes-sheet').click();
  if(await page.locator('#planes-gridlabels').isHidden())
    throw new Error('Nine-view sheet failed');
  await capture('all-nine');

  // Also verify that the layout is usable at a mobile viewport.
  await page.setViewportSize({width:430,height:850});
  await page.locator('#planes-sheet').click(); // back to single-view
  await page.locator('[data-view="frontLeft"]').click();
  await capture('mobile-three-quarter');
  const summary={
    source:'Actual Chromium WebGL renders, head planes page',
    commit:process.env.GITHUB_SHA??null,
    capturedAt:new Date().toISOString(),
    modelStats:counts,
    screenshots:records,browserErrors
  };
  await writeFile(resolve(output,'report.json'),
    JSON.stringify(summary,null,2)+'\n');
  if(browserErrors.length)throw new Error(browserErrors.join('\n'));
}finally{
  await browser?.close();
  try{if(server.pid)process.kill(-server.pid,'SIGTERM')}catch{}
  server.stdout.destroy();server.stderr.destroy();
}
