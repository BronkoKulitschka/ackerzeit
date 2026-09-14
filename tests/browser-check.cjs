const {chromium}=require('playwright');
const assert=require('assert/strict'),http=require('http'),fs=require('fs'),path=require('path');
const base=path.resolve(__dirname,'..');
const output=process.env.ACKERZEIT_TEST_OUTPUT||path.join(require('os').tmpdir(),'ackerzeit-browser-qa');
fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{let p=path.join(base,decodeURIComponent(req.url.split('?')[0]));if(p.endsWith('/'))p+='index.html';res.setHeader('Content-Type',({'.js':'text/javascript','.json':'application/json','.glb':'model/gltf-binary','.html':'text/html','.css':'text/css','.png':'image/png'})[path.extname(p)]||'application/octet-stream');fs.readFile(p,(e,b)=>{res.statusCode=e?404:200;res.end(e?'not found':b);});});
(async()=>{
await new Promise(r=>server.listen(8089,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const results=[];
for(const [width,height] of [[390,844],[360,640],[844,390],[1365,900]]){
 console.log("Testing",width,height);
 const context=await browser.newContext({viewport:{width,height},isMobile:width<700,hasTouch:width<700,deviceScaleFactor:1});
 const page=await context.newPage();const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));page.on('request',r=>requests.push(r.url()));
 await page.goto('http://127.0.0.1:8089');await page.waitForFunction(()=>document.querySelector('#farm-world')?.dataset.ready==='true');
 const bounds=await page.evaluate(()=>({x:document.documentElement.scrollWidth,y:document.documentElement.scrollHeight,w:innerWidth,h:innerHeight}));assert.ok(bounds.x<=bounds.w&&bounds.y<=bounds.h,JSON.stringify(bounds));
 const old=await page.evaluate(()=>JSON.parse(localStorage.getItem('ackerzeit-save-v1')));
 await page.locator('[data-map=tractor]').click();await page.locator('[data-mode=drive]').click();
 const rect=await page.locator('.three-surface canvas').boundingBox();assert.ok(rect.height>65);
 const x=rect.x+rect.width/2+rect.width*.30,y=rect.y+rect.height/2+Math.min(25,rect.height*.1);
 if(width<700)await page.touchscreen.tap(x,y);else await page.mouse.click(x,y);
 await page.waitForFunction(()=>document.querySelector('[data-three-status]').textContent.includes('fährt'),{timeout:5000});
 await page.waitForTimeout(650);
 await page.locator('[data-map=pause]').click();await page.waitForFunction(()=>document.querySelector('[data-three-status]').textContent==='Fahrt pausiert');
 await page.locator('[data-map=pause]').click();await page.waitForTimeout(350);await page.locator('[data-map=stop]').click();
 const moved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ackerzeit-save-v1')));assert.ok(moved.world3d?.tractor);assert.ok(Math.hypot(moved.world3d.tractor.x+7,moved.world3d.tractor.z-8)>.1);assert.equal(moved.day,old.day);assert.equal(moved.cash,old.cash);assert.equal(moved.fuel,old.fuel);
 // Field drawer remains usable at small heights; queue a real economic action.
 await page.locator('.field-pill[data-field="1"]').click();await page.locator('#queue').click();
 const queued=await page.evaluate(()=>JSON.parse(localStorage.getItem('ackerzeit-save-v1')));assert.equal(queued.jobs.length,1);
 await page.locator('#next').click();const advanced=await page.evaluate(()=>JSON.parse(localStorage.getItem('ackerzeit-save-v1')));assert.equal(advanced.day,'2026-03-02');assert.equal(advanced.fields[0].stage,'prepared');
 // Every menu renders inside the viewport; navigation does not leak extra canvases.
 for(const view of ['felder','arbeit','maschinen','lager','finanzen','hilfe','hof','maschinen','hof']){
  await page.locator('#nav [data-view="'+view+'"]').click();assert.equal(await page.locator('body').getAttribute('data-page'),view);
  const b=await page.evaluate(()=>({x:document.documentElement.scrollWidth,y:document.documentElement.scrollHeight,w:innerWidth,h:innerHeight}));assert.ok(b.x<=b.w&&b.y<=b.h,JSON.stringify({view,b}));
  if(view==='hof')await page.waitForFunction(()=>document.querySelector('#farm-world')?.dataset.ready==='true');else assert.equal(await page.locator('.three-surface canvas').count(),0);
 }
 await page.reload();await page.waitForFunction(()=>document.querySelector('#farm-world')?.dataset.ready==='true');
 const reloaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('ackerzeit-save-v1')));assert.equal(reloaded.day,advanced.day);assert.deepEqual(reloaded.world3d,advanced.world3d);
 await page.locator('[data-map=tractor]').click();await page.waitForTimeout(100);await page.screenshot({path:path.join(output,'test-'+width+'x'+height+'.png')});
 assert.deepEqual(errors,[]);assert.ok(requests.every(u=>u.startsWith('http://127.0.0.1:8089')||u.startsWith('blob:http://127.0.0.1:8089')||u.startsWith('data:')));
 results.push({viewport:width+'x'+height,pageOverflow:false,drive:true,pause:true,queue:true,dayChange:true,allMenus:true,saveReload:true,errors});
 await context.close();
}
// A corrupted old save must remain untouched even after driving/closing the map.
const page=await browser.newPage();await page.addInitScript(()=>localStorage.setItem('ackerzeit-save-v1','{broken'));await page.goto('http://127.0.0.1:8089');assert.equal(await page.locator('#save-warning').isVisible(),true);assert.equal(await page.evaluate(()=>localStorage.getItem('ackerzeit-save-v1')),'{broken');await page.close();
console.log(JSON.stringify(results,null,2));fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify({cases:results,corruptSaveProtected:true},null,2));
await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1)});
