/* Ackerzeit 0.1 – dependency-free simulation, usable in browser and Node. */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const CROPS = {
    barley: {name:'Sommergerste', sow:[2,3], harvest:[6,7,8], seed:0.18, heat:1080, yield:5.8, price:195},
    wheat: {name:'Winterweizen', sow:[8,9], harvest:[6,7,8], seed:0.20, heat:1450, yield:7.6, price:225}
  };
  const ACTIONS = {
    cultivate:{name:'Boden bearbeiten', hours:1.1, fuel:13, fee:12},
    barley:{name:'Sommergerste säen', hours:0.65, fuel:7, fee:8},
    wheat:{name:'Winterweizen säen', hours:0.65, fuel:7, fee:8},
    fertilize:{name:'Düngen', hours:0.3, fuel:3, fee:4},
    harvest:{name:'Lohnunternehmer ernten lassen', hours:0.45, fuel:0, fee:155}
  };
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const round=v=>Math.round(v*100)/100;
  const date=s=>new Date(s.day+'T12:00:00Z');
  const month=s=>date(s).getUTCMonth();
  const season=s=>['Winter','Winter','Frühling','Frühling','Frühling','Sommer','Sommer','Sommer','Herbst','Herbst','Herbst','Winter'][month(s)];
  function rand(s){s.rng=(Math.imul(s.rng,1664525)+1013904223)>>>0;return s.rng/4294967296;}
  function weather(s){const m=month(s),base=[1,3,7,11,15,18,20,19,15,10,5,2][m];const rain=rand(s)<0.31?round(1+rand(s)*12):0;const temp=Math.round(base+(rand(s)-0.5)*10);return {temp,rain,label:temp<0?(rain?'Schnee':'Frost'):rain>0?'Regen':temp>25?'Heiß':'Heiter'};}
  function log(s,text){s.log.unshift({day:s.day,text});s.log=s.log.slice(0,100);}
  function book(s,amount,label){s.cash=round(s.cash+amount);s.ledger.unshift({day:s.day,amount:round(amount),label});s.ledger=s.ledger.slice(0,800);if(amount>=0)s.income=round(s.income+amount);else s.expenses=round(s.expenses-amount);}
  function fresh(){const s={version:1,day:'2026-03-01',rng:1947,cash:38000,debt:0,income:0,expenses:0,storage:80,fuel:450,fertilizer:2,seed:{barley:2,wheat:2},stock:{barley:0,wheat:0},tractor:{condition:86,hours:2840},fields:[{id:1,name:'Am Hof',ha:2},{id:2,name:'Südhang',ha:3},{id:3,name:'An der Mühle',ha:4}].map(f=>({...f,stage:'stubble',crop:null,heat:0,health:100,moisture:52,fertilized:false,lastCrop:null,sown:null,readyDays:0})),jobs:[],nextJob:1,ledger:[],log:[]};s.weather=weather(s);log(s,'Willkommen auf Sonnenrain. Beginne mit der Bodenbearbeitung und säe im März oder April Sommergerste.');return s;}
  const busy=(s,f)=>s.jobs.some(j=>j.field===f.id);
  function estimate(s,f,key){const a=ACTIONS[key];if(!a)return null;return {hours:round(a.hours*f.ha),fuel:round(a.fuel*f.ha),cost:round(a.fee*f.ha),seed:CROPS[key]?round(CROPS[key].seed*f.ha):0,fertilizer:key==='fertilize'?round(0.15*f.ha):0};}
  function reason(s,f,key,queued=false){
    if(!f||!ACTIONS[key])return 'Unbekannte Arbeit.';
    if(!queued&&busy(s,f))return 'Auf diesem Feld ist bereits eine Arbeit geplant.';
    if(key==='cultivate'&&!['stubble','prepared'].includes(f.stage))return 'Erst die bestehende Kultur abernten.';
    if(key==='cultivate'&&f.stage==='prepared')return 'Der Boden ist bereits vorbereitet.';
    if(CROPS[key]){if(f.stage!=='prepared')return 'Zuerst den Boden bearbeiten.';if(!CROPS[key].sow.includes(month(s)))return key==='barley'?'Aussaat nur im März und April.':'Aussaat nur im September und Oktober.';}
    if(key==='fertilize'){if(f.stage!=='growing')return 'Nur eine wachsende Kultur kann gedüngt werden.';if(f.fertilized)return 'Diese Kultur wurde bereits gedüngt.';if([10,11,0,1].includes(month(s)))return 'Düngung im Spiel nur von März bis Oktober.';}
    if(key==='harvest'){if(f.stage!=='ready')return 'Die Kultur ist noch nicht erntereif.';if(!CROPS[f.crop].harvest.includes(month(s)))return 'Erntezeit ist Juli bis September.';if(s.stock.barley+s.stock.wheat+yieldFor(f)>s.storage+0.001)return 'Nicht genug Lagerplatz. Erst Ernte verkaufen oder Lager erweitern.';}
    const e=estimate(s,f,key);
    if(!queued){if(s.cash<e.cost)return 'Nicht genug Geld für die Arbeitskosten.';if(s.fuel<e.fuel)return 'Nicht genug Diesel im Hoftank.';if(e.seed&&s.seed[key]<e.seed)return 'Nicht genug Saatgut im Lager.';if(s.fertilizer<e.fertilizer)return 'Nicht genug Dünger im Lager.';}
    return '';
  }
  function weatherReason(s,f,key){if(s.weather.temp<1)return 'Frost: Feldarbeit pausiert.';if(f.moisture>78)return 'Boden zu nass: Feldarbeit pausiert.';if(key==='harvest'&&(s.weather.rain>0||f.moisture>67))return 'Ernte braucht trockenes Wetter und einen tragfähigen Boden.';if(key!=='harvest'&&s.tractor.condition<20)return 'Traktor warten: Zustand unter 20 %.';return '';}
  function queue(s,id,key){const f=s.fields.find(f=>f.id===id),why=reason(s,f,key);if(why)return why;const e=estimate(s,f,key);book(s,-e.cost,ACTIONS[key].name+' · '+f.name);s.fuel=round(s.fuel-e.fuel);if(e.seed)s.seed[key]=round(s.seed[key]-e.seed);s.fertilizer=round(s.fertilizer-e.fertilizer);s.jobs.push({id:s.nextJob++,field:id,key,total:e.hours,remaining:e.hours,reserved:e});log(s,ACTIONS[key].name+' für '+f.name+' eingeplant.');return '';}
  function cancel(s,id){const i=s.jobs.findIndex(j=>j.id===id);if(i<0)return 'Auftrag nicht gefunden.';const j=s.jobs[i],ratio=j.remaining/j.total;book(s,round(j.reserved.cost*ratio),'Restkosten storniert');s.fuel=round(s.fuel+j.reserved.fuel*ratio);s.fertilizer=round(s.fertilizer+j.reserved.fertilizer*ratio);if(j.reserved.seed)s.seed[j.key]=round(s.seed[j.key]+j.reserved.seed*ratio);s.jobs.splice(i,1);log(s,'Auftrag storniert; ungenutzte Betriebsmittel zurückgebucht.');return '';}
  // Live field work uses the same reservations and completion rules as legacy saves.
  function migrate(s){
    if(s.workedToday===undefined)s.workedToday=0;
    for(const j of s.jobs)if(j.live===undefined){j.live=true;j.paused=true;}
    return s;
  }
  function workReason(s,j){
    if(!j)return 'Keine Feldarbeit aktiv.';
    const f=s.fields.find(f=>f.id===j.field);
    return reason(s,f,j.key,true)||weatherReason(s,f,j.key)||((s.workedToday||0)>=8?'Feierabend: Die 8 Arbeitsstunden sind verbraucht. Gehe zum nächsten Tag.':'');
  }
  function dispatch(s,id,key){
    if(s.jobs.some(j=>j.live&&!j.paused))return 'Der Traktor ist beschäftigt. Unterbrich zuerst die laufende Arbeit.';
    const f=s.fields.find(f=>f.id===id),why=reason(s,f,key)||weatherReason(s,f,key);
    if(why)return why;
    if((s.workedToday||0)>=8)return 'Feierabend: Gehe zuerst zum nächsten Tag.';
    const error=queue(s,id,key);if(error)return error;
    const j=s.jobs.at(-1);j.live=true;j.paused=false;return '';
  }
  function pauseJob(s,id){const j=s.jobs.find(j=>j.id===id);if(j)j.paused=true;}
  function resumeJob(s,id){
    const j=s.jobs.find(j=>j.id===id);if(!j)return 'Arbeit nicht gefunden.';
    if(s.jobs.some(other=>other.id!==id&&other.live&&!other.paused))return 'Der Traktor ist bereits beschäftigt.';
    const why=workReason(s,j);if(why)return why;j.live=true;j.paused=false;return '';
  }
  function work(s,id,amount){
    const j=s.jobs.find(j=>j.id===id);
    if(!j||!j.live||j.paused||!Number.isFinite(amount)||amount<=0)return {hours:0,completed:false};
    const why=workReason(s,j);if(why)return {hours:0,completed:false,reason:why};
    const hours=round(Math.min(amount,j.remaining,8-(s.workedToday||0)));if(hours<=0)return {hours:0,completed:false};
    j.remaining=round(j.remaining-hours);s.workedToday=round((s.workedToday||0)+hours);
    if(j.key!=='harvest'){
      s.tractor.hours=round(s.tractor.hours+hours);
      // Do not round each sub-step: otherwise small updates erase all wear.
      s.tractor.condition=clamp(s.tractor.condition-hours*.16,0,100);
    }
    if(j.remaining<=0){finish(s,j,s.fields.find(f=>f.id===j.field));s.jobs=s.jobs.filter(x=>x.id!==id);return {hours,completed:true};}
    return {hours,completed:false};
  }
  function yieldFor(f){const crop=CROPS[f.crop];return crop?round(f.ha*crop.yield*(0.55+0.45*f.health/100)*(f.fertilized?1:0.68)*(f.lastCrop===f.crop?0.85:1)):0;}
  function price(s,key){return Math.round(CROPS[key].price*(1+0.13*Math.cos((month(s)-1)*Math.PI/6)+0.04*Math.sin(date(s).getUTCDate()/5)));}
  function finish(s,j,f){
    if(j.key==='cultivate')f.stage='prepared';
    else if(CROPS[j.key]){f.stage='growing';f.crop=j.key;f.heat=0;f.health=100;f.fertilized=false;f.sown=s.day;f.readyDays=0;}
    else if(j.key==='fertilize')f.fertilized=true;
    else if(j.key==='harvest'){const amount=yieldFor(f);s.stock[f.crop]=round(s.stock[f.crop]+amount);log(s,f.name+': '+amount.toLocaleString('de-DE')+' t '+CROPS[f.crop].name+' eingelagert.');f.lastCrop=f.crop;f.crop=null;f.stage='stubble';f.heat=0;f.sown=null;f.fertilized=false;f.readyDays=0;}
    log(s,ACTIONS[j.key].name+' auf '+f.name+' abgeschlossen.');
  }
  function tick(s){
    let important=false,hours=8-(s.workedToday||0);
    for(const f of s.fields)f.moisture=clamp(round(f.moisture+s.weather.rain*1.6-Math.max(1,s.weather.temp*0.17)-Math.max(0,f.moisture-55)*0.18),5,100);
    for(const j of [...s.jobs]){if(j.live)continue;const f=s.fields.find(f=>f.id===j.field);if(reason(s,f,j.key,true)||weatherReason(s,f,j.key))continue;const work=Math.min(hours,j.remaining);if(work<=0)continue;j.remaining=round(j.remaining-work);hours=round(hours-work);if(j.key!=='harvest'){s.tractor.hours=round(s.tractor.hours+work);s.tractor.condition=clamp(round(s.tractor.condition-work*0.16),0,100);}if(j.remaining<=0){finish(s,j,f);s.jobs=s.jobs.filter(x=>x.id!==j.id);important=true;}}
    for(const f of s.fields){if(f.stage==='growing'){
      const crop=CROPS[f.crop];if(f.moisture<22)f.health=clamp(f.health-0.9,20,100);if(f.moisture>88)f.health=clamp(f.health-0.5,20,100);if(s.weather.temp<0&&f.crop==='barley')f.health=clamp(f.health-2,20,100);
      f.heat+=Math.max(0,s.weather.temp-4)*(f.moisture<22?0.6:1);
      const overwintered=f.crop!=='wheat'||date(s).getUTCFullYear()>Number(f.sown.slice(0,4));
      if(f.heat>=crop.heat&&overwintered&&crop.harvest.includes(month(s))){f.stage='ready';f.readyDays=0;log(s,f.name+' ist erntereif. Plane die Ernte bei trockenem Wetter.');important=true;}
    }else if(f.stage==='ready'){f.readyDays++;if(f.readyDays>21)f.health=clamp(f.health-1,20,100);}
    if(f.crop&&(f.stage==='ready'||f.crop==='barley')&&month(s)===9){for(const j of [...s.jobs])if(j.field===f.id)cancel(s,j.id);log(s,'Ernteverlust auf '+f.name+': Das Erntefenster ist vorbei.');f.lastCrop=f.crop;f.crop=null;f.stage='stubble';f.heat=0;f.sown=null;f.readyDays=0;f.fertilized=false;important=true;}}
    if(s.workedToday!==undefined)s.workedToday=0;
    book(s,-8,'Tägliche Hofkosten');
    const before=month(s);s.day=new Date(date(s).getTime()+DAY).toISOString().slice(0,10);s.weather=weather(s);
    if(month(s)!==before){important=true;if(s.debt)book(s,-s.debt*0.05/12,'Monatliche Kreditzinsen (5 % p. a.)');log(s,'Neuer Monat: '+date(s).toLocaleDateString('de-DE',{month:'long',timeZone:'UTC'})+'.');}
    if(s.cash<0){if(!s.log.some(l=>l.day===s.day&&l.text.startsWith('Kontostand')))log(s,'Kontostand negativ. Verkaufe Vorräte oder nimm einen Betriebskredit auf.');important=true;}
    return important;
  }
  function advance(s,count=1){let days=0;for(;days<count;){days++;if(tick(s)||s.jobs.some(j=>j.live&&!j.paused))break;}return days;}
  const SHOP={fuel:{name:'Diesel',price:1.65,unit:'l',cap:2000},barley:{name:'Gersten-Saatgut',price:650,unit:'t',cap:20},wheat:{name:'Weizen-Saatgut',price:680,unit:'t',cap:20},fertilizer:{name:'Dünger',price:580,unit:'t',cap:20}};
  const stockOf=(s,key)=>key==='barley'||key==='wheat'?s.seed[key]:s[key];
  function buy(s,key,amount){const p=SHOP[key];if(!p||!Number.isFinite(amount)||amount<=0)return 'Bitte eine positive Menge eingeben.';amount=round(amount);if(!amount)return 'Menge zu klein.';const reserved=s.jobs.reduce((a,j)=>a+(key==='fuel'?j.reserved.fuel:key==='fertilizer'?j.reserved.fertilizer:j.key===key?j.reserved.seed:0)*j.remaining/j.total,0);if(stockOf(s,key)+amount+reserved>p.cap+0.001)return 'Kapazität einschließlich reserviertem Material überschritten: maximal '+p.cap+' '+p.unit+'.';const cost=round(amount*p.price);if(s.cash<cost)return 'Nicht genug Geld.';book(s,-cost,p.name+' gekauft');if(key==='barley'||key==='wheat')s.seed[key]=round(s.seed[key]+amount);else s[key]=round(s[key]+amount);return '';}
  function sell(s,key,amount){if(!CROPS[key]||!Number.isFinite(amount)||amount<=0||amount>s.stock[key])return 'Diese Menge ist nicht im Lager.';amount=round(amount);if(!amount)return 'Menge zu klein.';s.stock[key]=round(s.stock[key]-amount);book(s,round(amount*price(s,key)),amount+' t '+CROPS[key].name+' verkauft');log(s,amount+' t '+CROPS[key].name+' verkauft.');return '';}
  function maintain(s){if(s.jobs.length)return 'Für die Wartung zuerst alle Feldaufträge abschließen oder stornieren.';const cost=Math.ceil((100-s.tractor.condition)*35);if(!cost)return 'Der Traktor ist bereits vollständig gewartet.';if(s.cash<cost)return 'Nicht genug Geld.';book(s,-cost,'Traktorwartung');s.tractor.condition=100;log(s,'Traktor in der Werkstatt gewartet.');return '';}
  function expand(s){if(s.storage>=200)return 'Maximale Lagergröße erreicht.';if(s.cash<6500)return 'Nicht genug Geld.';book(s,-6500,'Getreidelager +40 t');s.storage+=40;return '';}
  function land(s){if(s.fields.length>=4)return 'Das angebotene Feld gehört dir bereits.';if(s.cash<28000)return 'Für den Flächenkauf fehlen Mittel.';book(s,-28000,'Feldkauf · Am Waldrand (2 ha)');s.fields.push({...fresh().fields[0],id:4,name:'Am Waldrand',ha:2,moisture:50});log(s,'Am Waldrand gekauft: 2 ha zusätzliche Ackerfläche.');return '';}
  function loan(s,repay=false){if(repay){if(s.debt<10000)return 'Kein Kredit zur Rückzahlung vorhanden.';if(s.cash<10000)return 'Nicht genug Geld für die Rückzahlung.';s.debt-=10000;s.cash=round(s.cash-10000);log(s,'10.000 € Kredit getilgt.');}else{if(s.debt>=50000)return 'Kreditrahmen von 50.000 € ausgeschöpft.';s.debt+=10000;s.cash=round(s.cash+10000);log(s,'10.000 € Betriebskredit aufgenommen (5 % p. a.).');}return '';}
  function validate(s){
    const num=(x,a,b)=>typeof x==='number'&&Number.isFinite(x)&&x>=a&&x<=b;
    const validDay=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
    if(!s||s.version!==1||!validDay(s.day)||!num(s.cash,-1e9,1e9)||!num(s.rng,0,4294967295)||!num(s.debt,0,50000)||s.debt%10000||!num(s.storage,80,200)||!num(s.fuel,0,2000)||!num(s.fertilizer,0,20)||!num(s.income,0,1e12)||!num(s.expenses,0,1e12)||!num(s.nextJob,1,1e9))return false;
    if(s.workedToday!==undefined&&!num(s.workedToday,0,8))return false;
    if(!s.tractor||!num(s.tractor.condition,0,100)||!num(s.tractor.hours,0,1e9)||!s.weather||!num(s.weather.temp,-30,50)||!num(s.weather.rain,0,100)||!['Schnee','Frost','Regen','Heiß','Heiter'].includes(s.weather.label))return false;
    for(const k of Object.keys(CROPS))if(!s.seed||!s.stock||!num(s.seed[k],0,20)||!num(s.stock[k],0,s.storage))return false;
    if(s.stock.barley+s.stock.wheat>s.storage+0.01)return false;
    if(!Array.isArray(s.fields)||s.fields.length<3||s.fields.length>4||new Set(s.fields.map(f=>f.id)).size!==s.fields.length)return false;
    for(const f of s.fields){if(!num(f.id,1,4)||typeof f.name!=='string'||f.name.length>80||!num(f.ha,0.1,20)||!['stubble','prepared','growing','ready'].includes(f.stage)||!num(f.moisture,5,100)||!num(f.health,20,100)||!num(f.heat,0,1e8)||!num(f.readyDays,0,1e5)||typeof f.fertilized!=='boolean'||!(f.lastCrop===null||Object.hasOwn(CROPS,f.lastCrop)))return false;if(['growing','ready'].includes(f.stage)&&(!Object.hasOwn(CROPS,f.crop)||!validDay(f.sown)||f.sown>s.day))return false;if(['stubble','prepared'].includes(f.stage)&&f.crop!==null)return false;}
    if(!Array.isArray(s.jobs)||s.jobs.length>s.fields.length||new Set(s.jobs.map(j=>j.field)).size!==s.jobs.length||new Set(s.jobs.map(j=>j.id)).size!==s.jobs.length)return false;
    for(const j of s.jobs){if(j.live!==undefined&&typeof j.live!=='boolean'||j.paused!==undefined&&typeof j.paused!=='boolean')return false;if(!s.fields.some(f=>f.id===j.field)||!Object.hasOwn(ACTIONS,j.key)||!num(j.id,1,s.nextJob-1)||!num(j.total,0.01,1000)||!num(j.remaining,0.01,j.total)||!j.reserved)return false;const e=estimate(s,s.fields.find(f=>f.id===j.field),j.key);for(const k of Object.keys(e))if(j.reserved[k]!==e[k])return false;if(j.total!==e.hours)return false;}
    for(const [key,max] of [['log',100],['ledger',800]]){if(!Array.isArray(s[key])||s[key].length>max)return false;for(const item of s[key]){if(!validDay(item.day))return false;if(key==='log'&&(typeof item.text!=='string'||item.text.length>500))return false;if(key==='ledger'&&(!num(item.amount,-1e9,1e9)||typeof item.label!=='string'||item.label.length>200))return false;}}
    return true;
  }
  const api={migrate,workReason,dispatch,pauseJob,resumeJob,work,CROPS,ACTIONS,SHOP,fresh,date,month,season,estimate,reason,weatherReason,queue,cancel,advance,buy,sell,maintain,expand,land,loan,price,yieldFor,busy,stockOf,validate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Farm=api;
})(typeof globalThis!=='undefined'?globalThis:this);
