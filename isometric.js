/* Ackerzeit 0.1.1 – original pixel geometry, 2:1 isometric world and visual-only animation. */
(function(root){
  'use strict';
  const WIDTH=720,HEIGHT=450,ORIGIN={x:340,y:42},SCALE=14;
  const PLOTS=[{x:12,y:1,w:5,h:7},{x:18,y:1,w:6,h:7},{x:12,y:10,w:7,h:11},{x:20,y:10,w:4,h:11}];
  const project=(x,y,z=0)=>({x:ORIGIN.x+(x-y)*SCALE,y:ORIGIN.y+(x+y)*SCALE/2-z});
  function hitTest(px,py){const u=(px-ORIGIN.x)/SCALE,v=(py-ORIGIN.y)/(SCALE/2),x=(u+v)/2,y=(v-u)/2;return PLOTS.findIndex(p=>x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h);}
  function activeJob(state){return state.jobs.find(j=>{const f=state.fields.find(f=>f.id===j.field);return f&&!root.Farm.reason(state,f,j.key,true)&&!root.Farm.weatherReason(state,f,j.key);})||null;}
  function drawing(ctx,ox=ORIGIN.x,oy=ORIGIN.y,scale=SCALE){
    const p=(x,y,z=0)=>({x:Math.round(ox+(x-y)*scale),y:Math.round(oy+(x+y)*scale/2-z)});
    function dot(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
    // Scanline polygons and Bresenham lines retain hard pixel edges on every face.
    function polygon(points,color){const v=points.map(q=>({x:Math.round(q.x),y:Math.round(q.y)}));const lo=Math.min(...v.map(q=>q.y)),hi=Math.max(...v.map(q=>q.y));ctx.fillStyle=color;for(let y=lo;y<=hi;y++){const hits=[];for(let i=0;i<v.length;i++){const a=v[i],b=v[(i+1)%v.length];if((a.y<=y&&b.y>y)||(b.y<=y&&a.y>y))hits.push(a.x+(y-a.y)*(b.x-a.x)/(b.y-a.y));}hits.sort((a,b)=>a-b);for(let i=0;i+1<hits.length;i+=2)ctx.fillRect(Math.ceil(hits[i]),y,Math.floor(hits[i+1])-Math.ceil(hits[i])+1,1);}}
    function line(a,b,color,width=1){let x=Math.round(a.x),y=Math.round(a.y),tx=Math.round(b.x),ty=Math.round(b.y),dx=Math.abs(tx-x),dy=-Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1,e=dx+dy;for(;;){dot(x,y,width,width,color);if(x===tx&&y===ty)break;const d=e*2;if(d>=dy){e+=dy;x+=sx;}if(d<=dx){e+=dx;y+=sy;}}}
    function ground(x,y,w,h,color,z=0){polygon([p(x,y,z),p(x+w,y,z),p(x+w,y+h,z),p(x,y+h,z)],color);}
    function box(x,y,w,h,height,top,left,right,z=0){polygon([p(x,y+h,z),p(x+w,y+h,z),p(x+w,y+h,z+height),p(x,y+h,z+height)],left);polygon([p(x+w,y,z),p(x+w,y+h,z),p(x+w,y+h,z+height),p(x+w,y,z+height)],right);ground(x,y,w,h,top,z+height);}
    function trunk(x,y,winter,autumn){const q=p(x,y);ground(x-.35,y-.15,1.1,.75,'#526a4a');dot(q.x-2,q.y-15,4,17,'#695039');dot(q.x+1,q.y-13,2,14,'#493c2d');const dark=winter?'#829586':autumn?'#78613a':'#31583a',mid=winter?'#b3c3b2':autumn?'#ae8a3c':'#527b43',light=winter?'#e2eadd':autumn?'#d7b35a':'#82a35c';polygon([{x:q.x,y:q.y-39},{x:q.x+13,y:q.y-29},{x:q.x+16,y:q.y-18},{x:q.x+8,y:q.y-11},{x:q.x-10,y:q.y-12},{x:q.x-17,y:q.y-23},{x:q.x-11,y:q.y-33}],dark);dot(q.x-10,q.y-31,18,15,mid);dot(q.x-13,q.y-25,10,9,mid);dot(q.x-6,q.y-34,9,13,light);dot(q.x-9,q.y-28,5,6,light);dot(q.x+8,q.y-24,4,8,dark);}
    function house(x,y,w,h,barn=false,winter=false){const wall=barn?'#b79f76':'#e9d9ad',height=barn?27:28,rise=barn?16:15;ground(x+.3,y+.5,w+.5,h+.5,'#657250');box(x,y,w,h,height,'#b39b76',wall,barn?'#867b5f':'#c4b28a');
      // Windows and doors belong to the visible wall planes.
      for(let u=.35;u<w-.4;u+=1.1){polygon([p(x+u,y+h,8),p(x+u+.48,y+h,8),p(x+u+.48,y+h,19),p(x+u,y+h,19)],'#645f47');polygon([p(x+u+.06,y+h,10),p(x+u+.4,y+h,10),p(x+u+.4,y+h,17),p(x+u+.06,y+h,17)],'#8eb2ad');line(p(x+u+.23,y+h,10),p(x+u+.23,y+h,17),'#e2d9ba');}
      if(barn){const a=x+w*.28,b=x+w*.78;polygon([p(a,y+h,0),p(b,y+h,0),p(b,y+h,23),p(a,y+h,23)],'#504f39');line(p((a+b)/2,y+h,0),p((a+b)/2,y+h,23),'#bdac7f');line(p(a,y+h,1),p(b,y+h,22),'#a28b64');line(p(a,y+h,22),p(b,y+h,1),'#a28b64');}else polygon([p(x+w-.85,y+h,0),p(x+w-.3,y+h,0),p(x+w-.3,y+h,18),p(x+w-.85,y+h,18)],'#705c43');
      for(let v=.5;v<h-.2;v+=1)polygon([p(x+w,y+v,10),p(x+w,y+v+.45,10),p(x+w,y+v+.45,19),p(x+w,y+v,19)],'#688c8d');
      const a=p(x-.15,y-.12,height),b=p(x+w+.15,y-.12,height),d=p(x-.15,y+h+.12,height),e=p(x+w+.15,y+h+.12,height),r1=p(x-.15,y+h/2,height+rise),r2=p(x+w+.15,y+h/2,height+rise);
      polygon([p(x+w,y,height),p(x+w,y+h,height),p(x+w,y+h/2,height+rise)],'#b9a781');
      polygon([a,b,r2,r1],winter?'#e5ebde':'#b27650');polygon([r1,r2,e,d],winter?'#bccdbb':'#85503b');line(r1,r2,winter?'#f2f4e7':'#d39966',2);line(d,e,'#584b36',2);
      for(let u=.3;u<w;u+=.45)line(p(x+u,y+h/2,height+rise),p(x+u,y+h+.08,height),winter?'#cfdbca':'#a56b47');
      if(!barn)box(x+.5,y+.45,.45,.48,16,'#786752','#9c8666','#6a604a',height+5);
    }
    function silo(x,y){ground(x-.2,y-.2,1.7,1.7,'#637354');box(x,y,1.2,1.2,42,'#d2d8c1','#a9b8a7','#7a928a');const a=p(x,y,42),b=p(x+1.2,y,42),c=p(x+1.2,y+1.2,42),d=p(x,y+1.2,42),peak=p(x+.6,y+.6,51);polygon([a,b,peak],'#dfe3ce');polygon([b,c,peak],'#a9bbb0');polygon([c,d,peak],'#bdccbb');for(let z=8;z<40;z+=9){line(p(x,y+1.2,z),p(x+1.2,y+1.2,z),'#81998b');line(p(x+1.2,y,z),p(x+1.2,y+1.2,z),'#5f7d72');}line(p(x+.2,y+1.2,3),p(x+.2,y+1.2,42),'#e1e4cd');}
    function vehicle(x,y,direction=1,harvest=false,phase=0,key='cultivate'){
      const pos=(a,b,z=0)=>p(x+(direction===1?a:1.55-a),y+b,z),poly=(coords,color)=>polygon(coords.map(v=>pos(...v)),color);
      function cub(a,b,w,h,z,height,top,left,right){poly([[a,b+h,z],[a+w,b+h,z],[a+w,b+h,z+height],[a,b+h,z+height]],left);poly([[a+w,b,z],[a+w,b+h,z],[a+w,b+h,z+height],[a+w,b,z+height]],right);poly([[a,b,z+height],[a+w,b,z+height],[a+w,b+h,z+height],[a,b+h,z+height]],top);}
      const tire=(a,b,big)=>{const q=pos(a,b,3),r=big?6:4;polygon([{x:q.x-r,y:q.y-r+2},{x:q.x-r+2,y:q.y-r},{x:q.x+r-2,y:q.y-r},{x:q.x+r,y:q.y-r+2},{x:q.x+r,y:q.y+r-2},{x:q.x+r-2,y:q.y+r},{x:q.x-r+2,y:q.y+r},{x:q.x-r,y:q.y+r-2}],'#263e35');dot(q.x-2,q.y-2,4,4,'#b6bca4');if(phase%2===0)dot(q.x-r+1,q.y-1,2,3,'#65715c');else dot(q.x-1,q.y-r+1,3,2,'#65715c');};
      ground(x-.35,y-.05,2.3,1.25,'#5a704c');tire(.25,0,true);tire(1.3,0,false);
      cub(.05,.08,1.48,.68,3,5,harvest?'#e2bd62':'#709457',harvest?'#b99546':'#3c7047','#355d41');
      cub(.1,.06,.62,.71,8,12,'#9ec0b1','#90b5a9','#588b84');cub(.02,-.03,.78,.88,20,2,harvest?'#f0d37c':'#95b36f','#486c44','#344e38');
      cub(.78,.08,.74,.67,8,5,harvest?'#efd280':'#84a75f',harvest?'#c8a247':'#528348','#3e6740');
      const exhaust=pos(1.12,.18,13);dot(exhaust.x,exhaust.y-8,2,9,'#394a3d');const light=pos(1.55,.66,10);dot(light.x,light.y,3,2,'#f7deb1');
      if(harvest){cub(1.55,-.28,.42,1.35,1,4,'#d1b561','#8b783e','#7c6935');for(let b=-.2;b<1.05;b+=.15)line(pos(1.98,b,2),pos(1.98,b,5+phase%2),'#4b5034');}else if(key){const tint=key==='fertilize'?'#b79749':key==='barley'||key==='wheat'?'#ab5941':'#748e96';cub(-.55,.02,.48,.87,2,3,tint,'#665d49','#48534b');for(let b=.08;b<.9;b+=.18)line(pos(-.7,b,0),pos(-.5,b,3),'#444d39');}
      tire(.25,.85,true);tire(1.3,.85,false);
    }
    return {p,dot,polygon,line,ground,box,trunk,house,silo,vehicle};
  }
  function staticScene(ctx,state,selected){
    const d=drawing(ctx),{p,dot,line,polygon,ground,box}=d,winter=root.Farm.season(state)==='Winter',autumn=root.Farm.season(state)==='Herbst';
    dot(0,0,WIDTH,HEIGHT,winter?'#c5d6d0':'#c6d8be');
    // An exposed earth edge makes the entire farm read as a solid isometric tile.
    polygon([p(0,23),p(25,23),p(25,23,-14),p(0,23,-14)],'#8d7350');polygon([p(25,0),p(25,23),p(25,23,-14),p(25,0,-14)],'#685b43');
    ground(0,0,25,23,winter?'#dae1ca':autumn?'#a8b16a':'#93b36b');
    let seed=19;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<950;i++){const q=p(r()*25,r()*23);dot(q.x,q.y,2,1,winter?'#c7d4bd':autumn?'#929e5b':'#7ea25c');}
    ground(1.7,3,8.2,15.5,winter?'#c8cfb7':'#b1b387');ground(10.1,0,1.15,23,'#c7b793');ground(0,8.45,25,1.05,'#c7b793');line(p(10.25,0),p(10.25,23),'#e0ceaa');line(p(0,8.6),p(25,8.6),'#decba5');
    // Every field is rendered from the same coordinates used by pointer selection.
    PLOTS.forEach((a,i)=>{const f=state.fields[i];ground(a.x-.15,a.y-.15,a.w+.3,a.h+.3,'#638049');ground(a.x,a.y,a.w,a.h,!f?(winter?'#cbd6be':'#7fa461'):f.stage==='growing'?(winter?'#a2b187':'#759d4b'):f.stage==='ready'?'#d1b463':f.stage==='prepared'?'#816047':'#9d8057');
      if(f){for(let y=a.y+.28;y<a.y+a.h-.1;y+=.45){line(p(a.x+.15,y),p(a.x+a.w-.15,y),f.stage==='growing'?'#456e3c':f.stage==='ready'?'#a58a41':'#71543a');for(let x=a.x+.3;x<a.x+a.w-.1;x+=.48){const q=p(x,y);if(f.crop){const h=f.stage==='ready'?6:3;line(q,{x:q.x+1,y:q.y-h},f.stage==='ready'?'#f0d485':'#a3c16c');if(f.stage==='ready')dot(q.x-1,q.y-h,3,2,'#f7dfa0');}else if(f.stage==='stubble')dot(q.x,q.y-2,1,3,'#d1b87b');}}}
      if(f&&selected===f.id){const pts=[p(a.x-.2,a.y-.2),p(a.x+a.w+.2,a.y-.2),p(a.x+a.w+.2,a.y+a.h+.2),p(a.x-.2,a.y+a.h+.2)];for(let k=0;k<4;k++)line(pts[k],pts[(k+1)%4],'#fff0ac',2);}
    });
    // Back-to-front painter ordering for tall world objects.
    const objects=[];for(let y=1;y<22;y+=2.2)objects.push({depth:.65+y,draw:()=>d.trunk(.65,y,winter,autumn)});for(let x=2;x<25;x+=2.3)objects.push({depth:x+22.35,draw:()=>d.trunk(x,22.35,winter,autumn)});
    objects.push({depth:3.2+3.1+4.6+3.2,draw:()=>d.house(3.2,3.1,4.6,3.2,false,winter)},{depth:2.7+11+5.6+3.6,draw:()=>d.house(2.7,11,5.6,3.6,true,winter)},{depth:8.4+12.5+2.4,draw:()=>d.silo(8.4,12.5)});
    // Vegetable beds, stacked bales and workshop apron enrich the existing farm.
    for(let row=0;row<3;row++){ground(2.6,17+row*.65,3.9,.42,'#7d6746');for(let x=2.8;x<6.3;x+=.45){const q=p(x,17.2+row*.65);dot(q.x-2,q.y-3,4,3,winter?'#cdd8bd':'#58794a');}}
    for(let i=0;i<3;i++)box(7.7+i*.6,16.3,.5,.7,6,'#d8c077','#baa056','#9d894c');
    for(let x=2;x<10;x+=1){line(p(x,20.5,0),p(x,20.5,10),'#e2d5af',2);if(x<9){line(p(x,20.5,4),p(x+1,20.5,4),'#caba91');line(p(x,20.5,8),p(x+1,20.5,8),'#eddfb8');}}
    objects.sort((a,b)=>a.depth-b.depth).forEach(o=>o.draw());
    // Label chips stay horizontal for readability; the fields remain isometric.
    PLOTS.forEach((a,i)=>{const f=state.fields[i],q=p(a.x+a.w/2,a.y+a.h/2);const text=f?'0'+f.id+' · '+f.ha+' ha':'KAUFBAR',w=f?66:70;dot(q.x-w/2,q.y-6,w,18,'#244a3b');ctx.fillStyle='#fff3c7';ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillText(text,q.x,q.y+7);ctx.textAlign='start';});
  }
  function motionScene(ctx,state,time){
    const d=drawing(ctx),{p,dot,line}=d,job=activeJob(state),winter=root.Farm.season(state)==='Winter';
    // Chimney smoke, wind wheel and birds also animate when no work is scheduled.
    const chimney=p(3.9,3.7,56);
    for(let i=0;i<4;i++){const age=(time/1400+i*.7)%3,drift=Math.round(Math.sin(age+i)*3+age*3);dot(chimney.x+drift,chimney.y-age*11,3+Math.floor(age),3+Math.floor(age),['#a9b4a2','#b9c5b0','#c7d6bd'][Math.min(2,Math.floor(age))]);}
    const wheel=p(8.9,18.8,38),foot=p(8.9,18.8);line({x:foot.x-5,y:foot.y},wheel,'#716e50',2);line({x:foot.x+5,y:foot.y},wheel,'#999475',2);
    for(let i=0;i<4;i++){const a=time/1600+i*Math.PI/2,end={x:wheel.x+Math.cos(a)*12,y:wheel.y+Math.sin(a)*12};line(wheel,end,'#e8dfbd',3);dot(end.x-1,end.y-1,4,3,'#a59f7c');}dot(wheel.x-2,wheel.y-2,5,5,'#5a6c50');
    if(job){const index=state.fields.findIndex(f=>f.id===job.field),a=PLOTS[index],phase=(time/2600)%8,row=Math.floor(phase),t=phase-row,dir=row%2? -1:1,x=a.x+.55+(dir===1?t:1-t)*(a.w-2.65),y=a.y+.65+(row<4?row:7-row)*(a.h-2.5)/3;
      d.vehicle(x,y,dir,job.key==='harvest',Math.floor(time/160),job.key);
      if(!state.weather.rain){const q=p(x+(dir===1?-.4:1.9),y+.5);for(let i=0;i<3;i++)dot(q.x+(dir===1?-1:1)*(i*4+Math.floor(time/120)%3),q.y-i*2,2,2,job.key==='fertilize'?'#e1d9af':'#bcab82');}
    }else d.vehicle(7.4,8.9,1,false,0,null);
    for(let i=0;i<2;i++){const x=80+((time/100+i*195)%530),y=29+i*18+Math.sin(time/1400+i)*6,flap=Math.floor(time/240)%2?3:-2;line({x:x-4,y:y+flap},{x,y},'#5b735d');line({x,y},{x:x+4,y:y+flap},'#5b735d');}
    if(state.weather.rain>0){for(let i=0;i<(winter?32:42);i++){const x=(i*97+time/(winter?110:35))%WIDTH,y=(i*53+time/(winter?35:5))%HEIGHT;if(winter||state.weather.temp<0){dot(x,y,2,2,'#f1f5e8');}else line({x,y},{x:x-2,y:y+5},'#9ab7b3');}}
  }
  function frame(ctx,state,selected=1,time=0){ctx.imageSmoothingEnabled=false;staticScene(ctx,state,selected);motionScene(ctx,state,time);}
  function drawMachine(canvas){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);drawing(c,canvas.width/2-20,canvas.height/2+9,22).vehicle(0,0,1,false,0,null);}
  function mount(canvas,state,selected,onSelect,enabled=true,initialTime=0){
    const ctx=canvas.getContext('2d'),background=root.document.createElement('canvas');background.width=WIDTH;background.height=HEIGHT;staticScene(background.getContext('2d'),state,selected);
    let alive=true,id=0,last=null,elapsed=initialTime,painted=-100,visible=true;
    function paint(){ctx.imageSmoothingEnabled=false;ctx.drawImage(background,0,0);motionScene(ctx,state,elapsed);}
    function cancel(){if(id)root.cancelAnimationFrame(id);id=0;last=null;}
    function loop(now){id=0;if(!alive||!enabled||root.document.hidden||!visible)return;if(last!==null)elapsed+=Math.min(100,now-last);last=now;if(elapsed-painted>=50){paint();painted=elapsed;}id=root.requestAnimationFrame(loop);}
    function resume(){cancel();if(alive&&enabled&&!root.document.hidden&&visible)id=root.requestAnimationFrame(loop);}
    canvas.onclick=e=>{const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;const i=hitTest((e.clientX-r.left)*WIDTH/r.width,(e.clientY-r.top)*HEIGHT/r.height);if(i>=0)onSelect(i);};
    root.document.addEventListener('visibilitychange',resume);
    const observer=root.IntersectionObserver?new root.IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();}):null;
    if(observer)observer.observe(canvas);paint();resume();
    const dispose=()=>{alive=false;cancel();root.document.removeEventListener('visibilitychange',resume);if(observer)observer.disconnect();canvas.onclick=null;};
    dispose.time=()=>elapsed;return dispose;
  }
  const api={WIDTH,HEIGHT,PLOTS,project,hitTest,activeJob,frame,drawMachine,mount};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FarmMap=api;
})(typeof globalThis!=='undefined'?globalThis:this);
