const test=require('node:test');
const assert=require('node:assert/strict');
global.Farm=require('../engine.js');
const M=require('../isometric.js');
const context=()=>({fillRect(){},fillText(){},clearRect(){},drawImage(){}});

test('isometric field selection matches each diamond rather than its bounding rectangle',()=>{
  M.PLOTS.forEach((p,i)=>{
    for(const [x,y] of [[.05,.05],[.5,.5],[.95,.95]]){
      const screen=M.project(p.x+p.w*x,p.y+p.h*y);
      assert.equal(M.hitTest(screen.x,screen.y),i);
    }
    const top=M.project(p.x,p.y),left=M.project(p.x,p.y+p.h);
    assert.notEqual(M.hitTest(left.x+1,top.y+1),i);
  });
  assert.equal(M.hitTest(0,0),-1);
  assert.equal(M.hitTest(719,449),-1);
});

test('work preview selects a feasible order and respects weather pauses',()=>{
  const s=Farm.fresh();
  assert.equal(M.activeJob(s),null);
  Farm.queue(s,1,'cultivate');Farm.queue(s,2,'cultivate');
  s.weather={temp:12,rain:0,label:'Heiter'};s.fields[0].moisture=90;
  assert.equal(M.activeJob(s).field,2);
  s.weather.temp=-2;assert.equal(M.activeJob(s),null);
  s.weather.temp=12;s.fields[0].moisture=50;assert.equal(M.activeJob(s).field,1);
});

test('rendering and animation never advance game time or change a saved state',()=>{
  const s=Farm.fresh();Farm.queue(s,1,'cultivate');const before=JSON.stringify(s);
  for(const t of [0,500,1500,9000])M.frame(context(),s,1,t);
  assert.equal(JSON.stringify(s),before);
});

test('animation loop pauses for visibility, resumes once, and disposes on navigation',()=>{
  let next=0,paintCount=0;const scheduled=new Map(),listeners=new Map();
  const ctx=context();ctx.drawImage=()=>paintCount++;
  const canvas={getContext:()=>ctx,getBoundingClientRect:()=>({left:20,top:30,width:360,height:225})};
  global.document={hidden:false,createElement:()=>({getContext:context}),addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k)};
  global.requestAnimationFrame=fn=>{scheduled.set(++next,fn);return next;};
  global.cancelAnimationFrame=id=>scheduled.delete(id);
  const tick=t=>{const [id,fn]=scheduled.entries().next().value;scheduled.delete(id);fn(t);};
  let picked=-1;
  const stop=M.mount(canvas,Farm.fresh(),1,i=>picked=i,true);
  assert.equal(scheduled.size,1);assert.equal(paintCount,1);
  tick(0);tick(60);assert.equal(scheduled.size,1);assert.equal(stop.time(),60);
  const p=M.PLOTS[1],point=M.project(p.x+p.w/2,p.y+p.h/2);
  canvas.onclick({clientX:20+point.x/2,clientY:30+point.y/2});assert.equal(picked,1);
  document.hidden=true;listeners.get('visibilitychange')();assert.equal(scheduled.size,0);
  document.hidden=false;listeners.get('visibilitychange')();assert.equal(scheduled.size,1);
  const elapsed=stop.time();stop();assert.equal(scheduled.size,0);assert.equal(listeners.size,0);assert.equal(canvas.onclick,null);
  const paused=M.mount(canvas,Farm.fresh(),1,()=>{},false,elapsed);assert.equal(scheduled.size,0);assert.equal(paused.time(),elapsed);paused();
  delete global.document;delete global.requestAnimationFrame;delete global.cancelAnimationFrame;
});
