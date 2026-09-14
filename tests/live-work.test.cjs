const test=require('node:test'),assert=require('node:assert/strict'),E=require('../engine.js'),W=require('../world.js');
function fresh(){const s=E.migrate(E.fresh());s.weather={temp:12,rain:0,label:'Heiter'};return s;}
test('dispatch reserves once, rejects a second active assignment, and work finishes the field exactly once',()=>{
 const s=fresh(),cash=s.cash,fuel=s.fuel;assert.equal(E.dispatch(s,1,'cultivate'),'');assert.equal(s.cash,cash-24);assert.equal(s.fuel,fuel-26);assert.ok(E.dispatch(s,2,'cultivate'));const id=s.jobs[0].id;
 for(let i=0;i<220;i++)E.work(s,id,.01);
 assert.equal(s.fields[0].stage,'prepared');assert.equal(s.jobs.length,0);assert.equal(s.workedToday,2.2);assert.equal(s.tractor.hours,2842.2);assert.ok(Math.abs(s.tractor.condition-(86-2.2*.16))<1e-8);assert.deepEqual(E.work(s,id,3),{hours:0,completed:false});assert.ok(E.validate(s));
});
test('pause, serialization, resume and cancellation preserve earned progress and refund only the unworked part',()=>{
 let s=fresh();E.dispatch(s,1,'cultivate');const id=s.jobs[0].id;E.work(s,id,1.1);E.pauseJob(s,id);assert.equal(E.work(s,id,1).hours,0);s=JSON.parse(JSON.stringify(s));assert.ok(E.validate(s));assert.equal(E.resumeJob(s,id),'');assert.equal(s.jobs[0].remaining,1.1);const fuel=s.fuel,cash=s.cash;E.cancel(s,id);assert.equal(s.fuel,fuel+13);assert.equal(s.cash,cash+12);assert.equal(s.workedToday,1.1);
});
test('day change cannot complete live work and resets only the daily capacity',()=>{
 const s=fresh();E.dispatch(s,1,'cultivate');E.work(s,s.jobs[0].id,.5);const remaining=s.jobs[0].remaining;E.advance(s);assert.equal(s.jobs[0].remaining,remaining);assert.equal(s.fields[0].stage,'stubble');assert.equal(s.workedToday,0);assert.equal(s.day,'2026-03-02');
});
test('daily limit, weather and tractor condition block progress without consuming reserved work',()=>{
 const s=fresh();E.dispatch(s,1,'cultivate');const j=s.jobs[0];s.workedToday=7.8;assert.equal(E.work(s,j.id,2).hours,.2);assert.match(E.work(s,j.id,1).reason,/Feierabend/);E.advance(s);s.weather={temp:-2,rain:0,label:'Frost'};assert.match(E.work(s,j.id,1).reason,/Frost/);s.weather.temp=12;s.fields[0].moisture=90;assert.match(E.work(s,j.id,1).reason,/nass/);s.fields[0].moisture=50;s.tractor.condition=10;assert.match(E.work(s,j.id,1).reason,/warten/);
});
test('cultivation, sowing, fertilizer and contractor harvest use the same direct completion rules',()=>{
 const s=fresh();for(const k of ['cultivate','barley','fertilize']){assert.equal(E.dispatch(s,1,k),'');E.work(s,s.jobs[0].id,8);}assert.equal(s.fields[0].crop,'barley');assert.equal(s.fields[0].fertilized,true);
 s.day='2026-07-15';s.workedToday=0;s.fields[0].stage='ready';s.fields[0].heat=1200;const hours=s.tractor.hours;assert.equal(E.dispatch(s,1,'harvest'),'');E.work(s,s.jobs[0].id,8);assert.ok(s.stock.barley>0);assert.equal(s.fields[0].stage,'stubble');assert.equal(s.tractor.hours,hours);
});
test('old pending jobs migrate to paused resumable field work without new reservations',()=>{
 const s=E.fresh();E.queue(s,1,'cultivate');E.queue(s,2,'cultivate');const cash=s.cash,fuel=s.fuel;E.migrate(s);assert.ok(s.jobs.every(j=>j.live&&j.paused));assert.equal(s.cash,cash);assert.equal(s.fuel,fuel);assert.ok(E.validate(s));assert.equal(E.resumeJob(s,s.jobs[0].id),'');assert.ok(E.resumeJob(s,s.jobs[1].id));
});
test('serpentine work routes stay inside plots and restore the correct partial lane',()=>{
 for(const p of W.PLOTS)for(const key of ['cultivate','barley','fertilize','harvest']){
  const plan=W.fieldPlan(p.id,key);assert.ok(plan.total>0);for(const seg of plan.segments){for(const point of [seg.a,seg.b]){assert.ok(point.x>=p.x&&point.x<=p.x+p.w&&point.z>=p.z&&point.z<=p.z+p.d);assert.equal(W.blocked(point),false);}}
  for(const fraction of [0,.1,.5,.99]){const rest=W.remainingPlan(plan,fraction);assert.ok(rest.points.length);let done=0,prev=rest.entry;for(const q of rest.points){if(q.work)done+=Math.hypot(q.x-prev.x,q.z-prev.z);prev=q;}assert.ok(Math.abs(done-(1-fraction)*plan.total)<1e-6);}
 }
});
