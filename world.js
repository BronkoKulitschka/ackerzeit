/* Deterministic map layout and collision-aware routing, independent of WebGL. */
(function(root){
  'use strict';
  const BOUNDS={minX:-35,maxX:35,minZ:-27,maxZ:27};
  // Shared assignment profiles: UI and lane planning use the same working widths.
  const EQUIPMENT={
    cultivate:{vehicle:'Farmall D-320',tool:'Grubber',width:2.5},
    barley:{vehicle:'Farmall D-320',tool:'Sämaschine',width:2.5},
    wheat:{vehicle:'Farmall D-320',tool:'Sämaschine',width:2.5},
    fertilize:{vehicle:'Farmall D-320',tool:'Düngerstreuer',width:4},
    harvest:{vehicle:'Lohnunternehmer',tool:'Mähdrescher',width:3}
  };
  // The view is a schematic farm: field labels carry the simulation's actual hectares.
  const PLOTS=[
    {id:1,x:4,z:-21,w:25,d:17},
    {id:2,x:4,z:4,w:25,d:18},
    {id:3,x:-30,z:-23,w:27,d:15},
    {id:4,x:-31,z:17,w:27,d:7}
  ];
  const OBSTACLES=[
    {id:'barn',x:-24,z:1,w:10,d:8},
    {id:'house',x:-11,z:-1,w:6,d:5},
    {id:'silo',x:-29,z:11,w:3.8,d:3.8}
  ];
  const spawn={x:-7,z:8,yaw:-1.9};
  function blocked(p,r=1.55){
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))return true;
    if(p.x<BOUNDS.minX+r||p.x>BOUNDS.maxX-r||p.z<BOUNDS.minZ+r||p.z>BOUNDS.maxZ-r)return true;
    return OBSTACLES.some(o=>Math.abs(p.x-o.x)<o.w/2+r&&Math.abs(p.z-o.z)<o.d/2+r);
  }
  function clearLine(a,b,r=1.55){
    const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.25));
    for(let i=0;i<=steps;i++){const t=i/steps;if(blocked({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t},r))return false;}
    return true;
  }
  function route(start,end,r=1.55){
    if(blocked(start,r)||blocked(end,r))return [];
    if(clearLine(start,end,r))return [{x:end.x,z:end.z}];
    const key=p=>p.x+','+p.z, heuristic=p=>Math.hypot(p.x-end.x,p.z-end.z);
    const nearest=p=>{let best=null,dist=Infinity;for(let x=Math.floor(p.x)-2;x<=Math.ceil(p.x)+2;x++)for(let z=Math.floor(p.z)-2;z<=Math.ceil(p.z)+2;z++){const q={x,z},d=Math.hypot(x-p.x,z-p.z);if(d<dist&&!blocked(q,r)&&clearLine(p,q,r)){best=q;dist=d;}}return best;};
    const first=nearest(start),last=nearest(end);if(!first||!last)return [];
    const open=[{...first,g:0,f:heuristic(first)}],cost=new Map([[key(first),0]]),prev=new Map(),closed=new Set();
    for(let iter=0;open.length&&iter<5000;iter++){
      let n=0;for(let i=1;i<open.length;i++)if(open[i].f<open[n].f)n=i;
      const p=open.splice(n,1)[0],k=key(p);if(closed.has(k))continue;closed.add(k);
      if(k===key(last)){
        const path=[end];let cur={x:p.x,z:p.z};while(cur){path.push(cur);cur=prev.get(key(cur));}path.push(start);path.reverse();
        const smooth=[];let i=0;while(i<path.length-1){let j=path.length-1;while(j>i+1&&!clearLine(path[i],path[j],r))j--;smooth.push(path[j]);i=j;}return smooth;
      }
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[-1,1],[1,-1]]){
        const q={x:p.x+dx,z:p.z+dz},qk=key(q),g=p.g+Math.hypot(dx,dz);
        if(closed.has(qk)||blocked(q,r)||!clearLine(p,q,r)||g>=(cost.get(qk)??Infinity))continue;
        cost.set(qk,g);prev.set(qk,{x:p.x,z:p.z});open.push({...q,g,f:g+heuristic(q)});
      }
    }
    return [];
  }
  function fieldPlan(id,key='cultivate'){
    const p=PLOTS.find(p=>p.id===id);if(!p)return null;
    const width=(EQUIPMENT[key]||EQUIPMENT.cultivate).width;
    const count=Math.ceil(p.w/width),spacing=p.w/count,margin=1.7,segments=[];
    let previous=null,total=0;
    for(let lane=0;lane<count;lane++){
      const x=p.x+spacing*(lane+.5),a={x,z:p.z+(lane%2?p.d-margin:margin)},b={x,z:p.z+(lane%2?margin:p.d-margin)};
      if(previous)segments.push({a:previous,b:a,work:false,lane,length:Math.hypot(a.x-previous.x,a.z-previous.z)});
      const length=Math.abs(b.z-a.z);segments.push({a,b,work:true,lane,length,start:total});total+=length;previous=b;
    }
    return {plot:p,spacing,segments,total};
  }
  function remainingPlan(plan,fraction){
    const done=Math.max(0,Math.min(1,fraction))*plan.total;
    const index=plan.segments.findIndex(s=>s.work&&s.start+s.length>done+1e-8);
    if(index<0)return {entry:plan.segments.at(-1).b,points:[]};
    const first=plan.segments[index],t=(done-first.start)/first.length;
    const entry={x:first.a.x+(first.b.x-first.a.x)*t,z:first.a.z+(first.b.z-first.a.z)*t};
    return {entry,points:plan.segments.slice(index).map(s=>({...s.b,work:s.work,lane:s.lane}))};
  }
  function safePose(value){return value&&Number.isFinite(value.yaw)&&!blocked(value)?{x:value.x,z:value.z,yaw:Math.atan2(Math.sin(value.yaw),Math.cos(value.yaw))}:{...spawn};}
  function validateCatalog(c){
    if(!c||c.version!==1||!Array.isArray(c.models)||!c.models.length||!Array.isArray(c.instances))throw Error('Ungültiger Modellkatalog.');
    const ids=new Set();
    for(const m of c.models){if(typeof m.id!=='string'||ids.has(m.id)||!m.file?.startsWith('assets/models/')||m.file.includes('..')||!m.file.endsWith('.glb')||!(m.scale>0&&m.scale<=100))throw Error('Ungültiger Modelletrag.');ids.add(m.id);}
    const instances=new Set();for(const i of c.instances){if(typeof i.id!=='string'||instances.has(i.id)||!ids.has(i.model)||!Array.isArray(i.position)||i.position.length!==3||!i.position.every(Number.isFinite)||!Number.isFinite(i.rotationY))throw Error('Ungültige Modellplatzierung.');instances.add(i.id);}
    return c;
  }
  const api={EQUIPMENT,fieldPlan,remainingPlan,BOUNDS,PLOTS,OBSTACLES,spawn,blocked,clearLine,route,safePose,validateCatalog};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FarmWorld=api;
})(typeof globalThis!=='undefined'?globalThis:this);
