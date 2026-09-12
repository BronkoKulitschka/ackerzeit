const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');

test('new game and serialized save are valid', () => {
  const s = E.fresh();
  assert.ok(E.validate(s));
  assert.ok(E.validate(JSON.parse(JSON.stringify(s))));
  assert.equal(s.fields.reduce((a,f) => a + f.ha, 0), 9);
});

test('planning reserves costs and materials; cancellation restores unworked order', () => {
  const s = E.fresh(), before = JSON.parse(JSON.stringify(s));
  assert.equal(E.queue(s, 1, 'cultivate'), '');
  assert.ok(s.cash < before.cash);
  assert.ok(s.fuel < before.fuel);
  assert.match(E.queue(s, 1, 'cultivate'), /bereits/);
  assert.equal(s.jobs.length, 1);
  E.cancel(s, s.jobs[0].id);
  assert.equal(s.cash, before.cash);
  assert.equal(s.fuel, before.fuel);
  assert.ok(E.validate(s));
});

test('wet ground and frost block work without losing reserved materials', () => {
  const s = E.fresh();
  E.queue(s, 1, 'cultivate');
  s.weather = {temp:3, rain:12, label:'Regen'};
  s.fields[0].moisture = 95;
  const remaining = s.jobs[0].remaining, fuel = s.fuel;
  E.advance(s);
  assert.equal(s.jobs[0].remaining, remaining);
  assert.equal(s.fuel, fuel);
  s.weather = {temp:-2, rain:0, label:'Frost'};
  s.fields[0].moisture = 50;
  E.advance(s);
  assert.equal(s.jobs[0].remaining, remaining);
});

test('daily capacity is shared and partial cancellation refunds only the unused part', () => {
  const s = E.fresh(), startCash = s.cash, startFuel = s.fuel;
  for (const f of s.fields) E.queue(s, f.id, 'cultivate');
  s.weather = {temp:12,rain:0,label:'Heiter'};
  E.advance(s);
  assert.equal(s.tractor.hours, 2848);
  assert.equal(s.jobs.length, 1);
  assert.equal(s.jobs[0].remaining, 1.9);
  E.cancel(s, s.jobs[0].id);
  assert.ok(s.cash < startCash - 8);
  assert.ok(s.fuel < startFuel);
  assert.ok(E.validate(s));
});

test('sowing windows, preparation, fertilization and machine condition are enforced', () => {
  const s = E.fresh(), f = s.fields[0];
  assert.match(E.queue(s,1,'barley'), /Boden/);
  f.stage='prepared';
  assert.match(E.queue(s,1,'wheat'), /September/);
  assert.equal(E.queue(s,1,'barley'), '');
  s.tractor.condition=10;
  s.weather={temp:12,rain:0,label:'Heiter'};
  E.advance(s);
  assert.equal(f.stage,'prepared');
  E.cancel(s,s.jobs[0].id);
  assert.equal(E.maintain(s),'');
  assert.equal(s.tractor.condition,100);
  E.queue(s,1,'barley');
  s.weather={temp:12,rain:0,label:'Heiter'};
  E.advance(s);
  assert.equal(f.stage,'growing');
  assert.equal(E.queue(s,1,'fertilize'),'');
  s.weather={temp:12,rain:0,label:'Heiter'};
  E.advance(s);
  assert.equal(f.fertilized,true);
  assert.match(E.queue(s,1,'fertilize'), /bereits/);
});

test('storage capacity, invalid transactions and reserved material capacity are checked', () => {
  const s=E.fresh(), before=s.cash;
  assert.ok(E.buy(s,'fuel',-10));
  assert.ok(E.buy(s,'fuel',NaN));
  assert.ok(E.buy(s,'barley',Infinity));
  assert.ok(E.sell(s,'wheat',1));
  assert.equal(s.cash,before);
  E.queue(s,1,'cultivate');
  assert.ok(E.buy(s,'fuel',2000-s.fuel));
  assert.equal(E.buy(s,'fuel',2000-450),'');
  E.cancel(s,s.jobs[0].id);
  assert.equal(s.fuel,2000);
  const f=s.fields[0];
  Object.assign(f,{crop:'barley',stage:'ready',sown:'2026-03-01',heat:1200});
  s.day='2026-07-15'; s.stock.wheat=79;
  assert.match(E.queue(s,1,'harvest'), /Lagerplatz/);
  assert.ok(E.validate(s));
});

test('credit is limited and monthly interest is charged at month transition', () => {
  const s=E.fresh();
  for(let i=0;i<5;i++)assert.equal(E.loan(s),'');
  assert.match(E.loan(s),/ausgeschöpft/);
  s.day='2026-03-31';
  const before=s.cash;
  E.advance(s);
  assert.equal(s.cash,Math.round((before-8-50000*.05/12)*100)/100);
  assert.equal(E.loan(s,true),'');
  assert.equal(s.debt,40000);
  assert.ok(E.validate(s));
});

test('7-day advance stops at completed work and month boundary; leap years work', () => {
  const s=E.fresh();
  E.queue(s,1,'cultivate');
  s.weather={temp:12,rain:0,label:'Heiter'};
  assert.equal(E.advance(s,7),1);
  s.day='2028-02-28';
  E.advance(s);
  assert.equal(s.day,'2028-02-29');
  assert.equal(E.advance(s,7),1);
  assert.equal(s.day,'2028-03-01');
});

test('malformed saves are rejected', () => {
  for(const mutate of [s=>s.day='2026-02-30',s=>s.cash='38000',s=>s.fields[0].crop='evil',s=>s.weather.temp=Infinity,s=>s.debt=123,s=>s.fields[0].name=null,s=>s.fields[0].stage='ready',s=>s.jobs.push({key:'constructor'}),s=>s.ledger.push({day:s.day,label:'x',amount:NaN})]){
    const s=E.fresh();mutate(s);assert.equal(E.validate(s),false);
  }
});

test('570-day management cycle produces barley and overwintered wheat, with valid saves daily', () => {
  const s=E.fresh(), harvests=[];
  for(let d=0;d<570;d++){
    for(const f of s.fields){
      if(E.busy(s,f))continue;
      let key=null;
      if(f.stage==='stubble'&&[2,3,8,9].includes(E.month(s)))key='cultivate';
      else if(f.stage==='prepared')key=[2,3].includes(E.month(s))?'barley':[8,9].includes(E.month(s))?'wheat':null;
      else if(f.stage==='growing'&&!f.fertilized&&[2,3,4].includes(E.month(s)))key='fertilize';
      else if(f.stage==='ready')key='harvest';
      if(key&&!E.reason(s,f,key))assert.equal(E.queue(s,f.id,key),'');
    }
    for(const key of ['barley','wheat'])if(s.stock[key]>0){harvests.push({crop:key,day:s.day,amount:s.stock[key]});assert.equal(E.sell(s,key,s.stock[key]),'');}
    if(s.fuel<100)E.buy(s,'fuel',300);
    if(s.fertilizer<0.8)E.buy(s,'fertilizer',2);
    if(s.seed.wheat<0.8)E.buy(s,'wheat',2);
    if(s.seed.barley<0.8)E.buy(s,'barley',2);
    if(!s.jobs.length&&s.tractor.condition<35)E.maintain(s);
    E.advance(s);
    assert.ok(E.validate(s),s.day);
  }
  assert.ok(harvests.some(h=>h.crop==='barley'&&h.day.startsWith('2026-07')));
  assert.ok(harvests.some(h=>h.crop==='wheat'&&h.day.startsWith('2027-07')));
  assert.ok(s.cash>38000);
  assert.ok(s.fields.every(f=>f.lastCrop==='wheat'));
});
