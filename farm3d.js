import * as THREE from 'three';
import { OrbitControls } from './vendor/three/addons/controls/OrbitControls.js';
import { catalog, loadModel } from './model-loader.js';
const W=window.FarmWorld;
let renderer=null;
let rememberedCamera=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const scratch=new THREE.Object3D();

export function mount(host,state,selected,onField,options={}){
  let disposed=false,raf=0,previous=0,lastPaint=0,paused=false,visible=true,contextLost=false,ready=false;
  let driving=false,vehicle=null,definition=null,path=[],destination=null,speed=0,yaw=-1.9,saveDue=false;
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let statusMessage='Farmall wird geladen …',shownStatus='',mode='select';
  let wheelFront=[],wheelRear=[],steering=[],steeringWheel=null;
  const scene=new THREE.Scene(),geometry=new Set(),materials=new Set(),textures=new Set(),events=[];
  const isWinter=window.Farm.season(state)==='Winter',season=window.Farm.season(state);
  scene.background=new THREE.Color(isWinter?0xd6e0de:0xc7d7ca);
  const canvasHost=host.querySelector('.three-surface'),status=host.querySelector('[data-three-status]');
  function listen(target,type,fn,opts){target.addEventListener(type,fn,opts);events.push(()=>target.removeEventListener(type,fn,opts));}
  try{
    if(!renderer){renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;}
  }catch(error){canvasHost.textContent='Die 3D-Ansicht benötigt WebGL 2. Du kannst deinen Hof weiterhin über die Menüs verwalten.';canvasHost.classList.add('three-error');status.textContent='3D auf diesem Gerät nicht verfügbar';throw error;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','3D-Hof. Ziehen verschiebt die Kamera. Im Fahrmodus ein Ziel antippen.');canvasHost.append(canvas);
  const camera=new THREE.OrthographicCamera(-28,28,21,-21,.2,240);
  const controls=new OrbitControls(camera,canvas);controls.enableRotate=false;controls.enableDamping=false;controls.screenSpacePanning=false;controls.minZoom=.22;controls.maxZoom=8;
  controls.mouseButtons.LEFT=THREE.MOUSE.PAN;controls.mouseButtons.RIGHT=THREE.MOUSE.PAN;
  controls.touches.ONE=THREE.TOUCH.PAN;controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
  camera.position.set(42,42,52);controls.target.set(-5,0,2);camera.lookAt(controls.target);
  if(rememberedCamera){camera.position.fromArray(rememberedCamera.position);camera.zoom=rememberedCamera.zoom;controls.target.fromArray(rememberedCamera.target);}
  controls.update();
  scene.add(new THREE.HemisphereLight(0xf7f4db,0x6b7864,2.6));
  const sun=new THREE.DirectionalLight(0xfff3d5,3.1);sun.position.set(-22,38,16);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-42,right:42,top:37,bottom:-37,near:1,far:110});sun.shadow.normalBias=.07;sun.shadow.bias=-.00015;scene.add(sun);sun.target.position.set(0,0,0);scene.add(sun.target);
  function mat(color,extra={}){const m=new THREE.MeshStandardMaterial({color,roughness:.9,...extra});materials.add(m);return m;}
  function geo(g){geometry.add(g);return g;}
  const grass=mat(isWinter?0xe3e6da:0x829362),pathMat=mat(0xc8b992),wood=mat(0x6e5942),roof=mat(0x7b4b38),walls=mat(0xd3c5a3),red=mat(0xa54434),glass=mat(0x344e4c),trim=mat(0xeadfc0);
  function mesh(g,m,x=0,y=0,z=0,parent=scene){const o=new THREE.Mesh(geo(g),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function box(w,h,d,m,x,y,z,parent){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);}
  box(72,.65,56,mat(0x736348),0,-.37,0);const ground=box(70,.14,54,grass,0,-.02,0);
  box(33,.035,23,pathMat,-16,.065,4);
  box(5,.04,50,pathMat,0,.07,0);
  box(65,.035,4,pathMat,0,.073,1);
  const fieldTargets=[],fieldBorders=[];
  const crops={prepared:0x6e5134,stubble:0x9b8150,growing:0x739246,ready:0xccad54};
  function label(text,x,y,z,color='#fff8df',scale=1){
    const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');
    ctx.fillStyle='rgba(31,51,37,.87)';ctx.beginPath();ctx.roundRect(0,0,512,96,16);ctx.fill();ctx.font='600 36px system-ui';ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,49,490);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;textures.add(t);const m=new THREE.SpriteMaterial({map:t,depthTest:false,transparent:true});materials.add(m);const o=new THREE.Sprite(m);o.position.set(x,y,z);o.scale.set(10*scale,1.875*scale,1);o.renderOrder=3;scene.add(o);return o;
  }
  for(const p of W.PLOTS){
    const f=state.fields.find(f=>f.id===p.id),crop=f?.stage||'stubble';
    const tile=box(p.w,.08,p.d,mat(isWinter?0xc1c4b0:crops[crop]),p.x+p.w/2,.10,p.z+p.d/2);tile.userData.fieldId=p.id;fieldTargets.push(tile);
    const positions=[p.x,.18,p.z,p.x+p.w,.18,p.z,p.x+p.w,.18,p.z+p.d,p.x,.18,p.z+p.d,p.x,.18,p.z];
    const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));const m=new THREE.LineBasicMaterial({color:p.id===selected?0xffedaa:0x647148});materials.add(m);const line=new THREE.Line(g,m);scene.add(line);fieldBorders.push({line,id:p.id});
    const count=Math.floor(p.w/.65),h=crop==='growing'?.18+.5*Math.min(1,f.heat/window.Farm.CROPS[f.crop].heat):crop==='ready'?.72:.018;
    const rows=new THREE.InstancedMesh(geo(new THREE.BoxGeometry(.12,h,p.d-.7)),mat(isWinter?0xe1dfce:crop==='growing'?0x526e37:crop==='ready'?0xe0c471:crop==='prepared'?0x4f3d2c:0xb39b60),count);
    for(let i=0;i<count;i++){scratch.position.set(p.x+.4+i*.65,.15+h/2,p.z+p.d/2);scratch.rotation.set(0,0,0);scratch.scale.set(1,1,1);scratch.updateMatrix();rows.setMatrixAt(i,scratch.matrix);}rows.receiveShadow=true;scene.add(rows);
    label(f?'0'+f.id+'  '+f.name+' · '+f.ha+' ha':'04  Am Waldrand · zu kaufen',p.x+p.w/2,.6,p.z+p.d/2,f?'#fff8df':'#e8dba8',.91);
  }
  function building(x,z,w,d,h,isHouse=false){
    const group=new THREE.Group();scene.add(group);box(w,h,d,isHouse?walls:red,x,h/2,z,group);
    // Roof is a closed gabled prism along Z.
    const v=new Float32Array([-w/2,0,-d/2,w/2,0,-d/2,0,1.8,-d/2,-w/2,0,d/2,w/2,0,d/2,0,1.8,d/2]);
    const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.BufferAttribute(v,3));g.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,2,5,4,2,4,1,0,1,4,0,4,3]);g.computeVertexNormals();const r=new THREE.Mesh(g,roof);r.position.set(x,h,z);r.castShadow=true;group.add(r);
    box(w+.2,.17,d+.25,trim,x,h,z,group);
    box(isHouse?1.05:3.7,isHouse?2:2.8,.07,wood,x,isHouse?1:1.4,z+d/2+.045,group);
    if(!isHouse){box(.10,2.8,.1,trim,x,1.4,z+d/2+.10,group);for(const s of [-1,1]){const brace=box(.1,3.4,.09,trim,x+s*.85,1.42,z+d/2+.10,group);brace.rotation.z=s*.52;}}
    for(const s of [-1,1]){box(1.2,1.2,.12,trim,x+s*w*.31,h*.68,z+d/2+.09,group);box(1.0,1,.14,glass,x+s*w*.31,h*.68,z+d/2+.17,group);box(.07,1,.16,trim,x+s*w*.31,h*.68,z+d/2+.19,group);}
    if(isHouse)box(.65,2,.65,wood,x+1.5,h+1,z-.6,group);
    return group;
  }
  building(-24,1,10,8,4.0);building(-11,-1,6,5,3.4,true);
  mesh(new THREE.CylinderGeometry(1.9,1.9,6,14),mat(0xb7bcb0),-29,3,11);
  mesh(new THREE.ConeGeometry(2.05,1.6,14),mat(0x7e8b83),-29,6.8,11);
  for(let y=1;y<6;y+=1.2)mesh(new THREE.TorusGeometry(1.93,.035,4,16),trim,-29,y,11).rotation.x=Math.PI/2;
  label('SONNENRAIN',-20,7,1,'#ffe8a4',.85);
  // Edge trees share geometry and material to keep draw calls low on phones.
  const treePositions=[];for(let i=0;i<15;i++)treePositions.push([-33+i*4.5,-25.8]);for(let i=0;i<8;i++)treePositions.push([33.5,-22+i*6.5]);
  const trunks=new THREE.InstancedMesh(geo(new THREE.CylinderGeometry(.16,.24,2.2,5)),wood,treePositions.length);
  const canopy=new THREE.InstancedMesh(geo(new THREE.ConeGeometry(1.65,4.5,7)),mat(isWinter?0xc5d0c0:season==='Herbst'?0x9b7944:0x465f3b),treePositions.length);
  treePositions.forEach(([x,z],i)=>{scratch.position.set(x,1,z);scratch.scale.set(1,1,1);scratch.rotation.set(0,0,0);scratch.updateMatrix();trunks.setMatrixAt(i,scratch.matrix);scratch.position.y=3;scratch.updateMatrix();canopy.setMatrixAt(i,scratch.matrix);});trunks.castShadow=canopy.castShadow=true;scene.add(trunks,canopy);
  const marker=mesh(new THREE.TorusGeometry(.8,.06,6,32),mat(0xe9cd74),0,.2,0);marker.rotation.x=Math.PI/2;marker.visible=false;
  const selectedRing=mesh(new THREE.TorusGeometry(1.8,.045,5,40),mat(0xf4d774),0,.20,0);selectedRing.rotation.x=Math.PI/2;selectedRing.visible=false;
  const routeMaterial=new THREE.LineDashedMaterial({color:0xffe7a2,dashSize:.45,gapSize:.3,depthTest:false});materials.add(routeMaterial);
  let routeLine=null;
  const particles=[];
  if(state.weather.rain>0&&!reducedMotion){
    const count=220,positions=new Float32Array(count*3);for(let i=0;i<count;i++){positions[i*3]=Math.sin(i*12.989)*34;positions[i*3+1]=(i%19)*.65+1;positions[i*3+2]=Math.cos(i*7.24)*26;}
    const g=geo(new THREE.BufferGeometry());g.setAttribute('position',new THREE.BufferAttribute(positions,3));const m=new THREE.PointsMaterial({color:isWinter?0xffffff:0xd7e7e3,size:isWinter?.15:.075,transparent:true,opacity:.65});materials.add(m);const rain=new THREE.Points(g,m);scene.add(rain);particles.push(rain);
  }
  function setStatus(message){statusMessage=message;paintStatus();}
  function paintStatus(){const text=paused?'Fahrt pausiert':statusMessage;if(text!==shownStatus){status.textContent=text;shownStatus=text;}const speedLabel=host.querySelector('[data-speed]');if(speedLabel)speedLabel.textContent=(speed*3.6).toLocaleString('de-DE',{maximumFractionDigits:1})+' km/h';}
  function savePose(){if(vehicle&&saveDue){options.onPose?.({x:vehicle.position.x,z:vehicle.position.z,yaw});saveDue=false;}}
  function updateRoute(){if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();geometry.delete(routeLine.geometry);routeLine=null;}if(vehicle&&path.length){const g=geo(new THREE.BufferGeometry().setFromPoints([vehicle.position.clone().setY(.22),...path.map(p=>new THREE.Vector3(p.x,.22,p.z))]));routeLine=new THREE.Line(g,routeMaterial);routeLine.computeLineDistances();routeLine.renderOrder=2;scene.add(routeLine);}}
  function stop(message='Farmall steht bereit'){path=[];destination=null;driving=false;speed=0;marker.visible=false;updateRoute();savePose();setStatus(message);updateButtons();}
  function driveTo(point){
    if(!vehicle)return;
    if(state.tractor.condition<20){setStatus('Traktor zuerst in der Werkstatt warten.');options.onMessage?.(statusMessage);return;}
    const next=W.route({x:vehicle.position.x,z:vehicle.position.z},point,definition.driving.collisionRadius);
    if(!next.length){setStatus('Ziel nicht erreichbar – bitte eine freie Fläche wählen.');return;}
    path=next;destination=point;driving=true;paused=false;host.querySelector('[data-map="pause"]').textContent='Pause';marker.position.set(point.x,.20,point.z);marker.visible=true;setStatus('Farmall fährt zum Ziel');updateRoute();updateButtons();
  }
  function focus(target,zoom){const offset=new THREE.Vector3(42,42,52);controls.target.copy(target);camera.position.copy(target).add(offset);const aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight);camera.zoom=clamp(Math.min(zoom,52/(aspect*4.1)),.22,8);camera.updateProjectionMatrix();controls.update();}
  function updateButtons(){host.querySelectorAll('[data-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mode===mode));b.classList.toggle('active',b.dataset.mode===mode);});host.querySelector('[data-map="stop"]').disabled=!driving;host.querySelector('[data-mode="drive"]').disabled=!ready;host.querySelector('[data-map="tractor"]').disabled=!ready;}
  function action(event){const b=event.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.mode){mode=b.dataset.mode;setStatus(mode==='drive'?'Freie Fläche antippen → Farmall fährt dorthin':'Feld antippen → verwalten');updateButtons();}
    const a=b.dataset.map;if(a==='stop')stop();
    if(a==='home'){const aspect=canvas.clientWidth/Math.max(1,canvas.clientHeight);focus(new THREE.Vector3(0,1,0),52/Math.max(95,62*aspect)*.94);}
    if(a==='tractor'&&vehicle)focus(vehicle.position.clone().setY(.75),6.5);
    if(a==='zoom-in'||a==='zoom-out'){camera.zoom=clamp(camera.zoom*(a==='zoom-in'?1.35:1/1.35),controls.minZoom,controls.maxZoom);camera.updateProjectionMatrix();controls.update();}
    if(a==='pause'){paused=!paused;speed=0;b.textContent=paused?'Weiter':'Pause';b.setAttribute('aria-pressed',String(paused));paintStatus();}
  }
  listen(host,'click',action);
  let down=null,pointers=new Set(),gesture=false;
  listen(canvas,'pointerdown',e=>{pointers.add(e.pointerId);if(pointers.size>1)gesture=true;else{gesture=false;down={x:e.clientX,y:e.clientY,id:e.pointerId,time:performance.now()};}});
  listen(canvas,'pointermove',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>7)gesture=true;});
  const ray=new THREE.Raycaster(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();
  listen(canvas,'pointerup',e=>{
    const tap=down&&down.id===e.pointerId&&!gesture&&performance.now()-down.time<650;pointers.delete(e.pointerId);if(pointers.size===0)down=null;if(!tap)return;
    const rect=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);
    if(mode==='drive'){if(ray.ray.intersectPlane(groundPlane,hit))driveTo({x:hit.x,z:hit.z});return;}
    if(vehicle&&ray.intersectObject(vehicle,true).length){mode='drive';selectedRing.visible=true;setStatus('Farmall ausgewählt · Ziel auf freier Fläche antippen');updateButtons();return;}
    const picked=ray.intersectObjects(fieldTargets,false)[0];if(picked){const id=picked.object.userData.fieldId;onField(id);}
  });
  listen(canvas,'lostpointercapture',e=>{pointers.delete(e.pointerId);if(!pointers.size)down=null;});
  listen(canvas,'pointercancel',e=>{pointers.delete(e.pointerId);down=null;gesture=true;});
  listen(canvas,'keydown',e=>{if(e.key==='Escape'||e.code==='Space'){e.preventDefault();stop();}if(e.key==='+'||e.key==='-'){camera.zoom=clamp(camera.zoom*(e.key==='+'?1.2:1/1.2),.22,8);camera.updateProjectionMatrix();}});
  controls.addEventListener('change',()=>{const old=controls.target.clone();controls.target.x=clamp(controls.target.x,-30,30);controls.target.z=clamp(controls.target.z,-23,23);controls.target.y=0;camera.position.add(controls.target.clone().sub(old));});
  function resize(){const r=canvasHost.getBoundingClientRect();if(!r.width||!r.height)return;const ratio=r.width/r.height;const span=52;camera.left=-span/2;camera.right=span/2;camera.top=span/2/ratio;camera.bottom=-span/2/ratio;camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);}
  const observer=new ResizeObserver(resize);observer.observe(canvasHost);resize();
  const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting!==false;previous=0;requestFrame();});intersection.observe(host);
  listen(document,'visibilitychange',()=>{previous=0;if(document.hidden){cancelAnimationFrame(raf);raf=0;savePose();}else requestFrame();});
  listen(canvas,'webglcontextlost',e=>{e.preventDefault();contextLost=true;cancelAnimationFrame(raf);raf=0;setStatus('3D-Grafik unterbrochen. Lade die Seite neu; dein Spielstand bleibt erhalten.');});
  listen(canvas,'webglcontextrestored',()=>{contextLost=false;setStatus('Grafik wiederhergestellt');requestFrame();});
  function step(dt){
    if(!vehicle)return;
    if(driving&&path.length){
      const p=path[0],dx=p.x-vehicle.position.x,dz=p.z-vehicle.position.z,distance=Math.hypot(dx,dz);
      if(distance<.20){path.shift();if(!path.length){stop('Ziel erreicht · Farmall steht bereit');return;}}
      else{
        const desired=Math.atan2(-dx,-dz),delta=Math.atan2(Math.sin(desired-yaw),Math.cos(desired-yaw));
        yaw+=clamp(delta,-1.7*dt,1.7*dt);vehicle.rotation.y=yaw;
        const targetSpeed=definition.driving.speedMps*Math.max(0,Math.cos(delta));speed=THREE.MathUtils.damp(speed,targetSpeed,3,dt);
        const distanceStep=Math.min(distance,speed*dt);
        // Follow the collision-checked path; rotation is a visual, simplified steering model.
        const next={x:vehicle.position.x+dx/distance*distanceStep,z:vehicle.position.z+dz/distance*distanceStep};
        if(!W.clearLine({x:vehicle.position.x,z:vehicle.position.z},next,definition.driving.collisionRadius)){stop('Fahrweg blockiert. Wähle ein neues Ziel.');return;}
        vehicle.position.set(next.x,0,next.z);saveDue=true;
        for(const o of wheelFront)o.rotateX(-distanceStep/definition.driving.frontWheelRadius);
        for(const o of wheelRear)o.rotateX(-distanceStep/definition.driving.rearWheelRadius);
        const turn=clamp(delta,-.44,.44);for(const o of steering)o.rotation.y=turn;
        if(steeringWheel)steeringWheel.quaternion.setFromAxisAngle(new THREE.Vector3(0,.772,.635),turn*5);
      }
    }else{speed=0;for(const o of steering)o.rotation.y=THREE.MathUtils.damp(o.rotation.y,0,8,dt);}
    selectedRing.position.set(vehicle.position.x,.21,vehicle.position.z);selectedRing.visible=mode==='drive';
    for(const rain of particles){const a=rain.geometry.attributes.position;for(let i=0;i<a.count;i++){let y=a.getY(i)-dt*(isWinter?.8:8);if(y<.4)y=13;a.setY(i,y);}a.needsUpdate=true;}
  }
  function requestFrame(){if(!raf&&!disposed&&!document.hidden&&visible&&!contextLost)raf=requestAnimationFrame(frame);}
  function frame(now){raf=0;if(disposed||document.hidden||!visible||contextLost)return;const dt=previous?Math.min((now-previous)/1000,.06):0;previous=now;if(!paused)step(dt);if(now-lastPaint>1000/30){renderer.render(scene,camera);paintStatus();lastPaint=now;}requestFrame();}
  updateButtons();requestFrame();
  catalog().then(async c=>{
    const results=await Promise.allSettled(c.instances.map(async instance=>{const def=c.models.find(m=>m.id===instance.model);const loaded=await loadModel(def);return {instance,def,...loaded};}));
    if(disposed)return;
    let failures=0;
    for(const result of results){if(result.status==='rejected'){failures++;continue;}const {instance,def,object}=result.value;object.name=instance.id;object.position.fromArray(instance.position);object.rotation.y=instance.rotationY;scene.add(object);
      if(instance.id==='tractor-1'){
        vehicle=object;definition=def;const pose=W.safePose(state.world3d?.tractor);vehicle.position.set(pose.x,0,pose.z);yaw=pose.yaw;vehicle.rotation.y=yaw;
        const find=list=>(list||[]).map(n=>object.getObjectByName(n)).filter(Boolean);wheelFront=find(def.parts.frontWheels);wheelRear=find(def.parts.rearWheels);steering=find(def.parts.steering);steeringWheel=object.getObjectByName(def.parts.steeringWheel);ready=true;
      }
    }
    host.dataset.ready=String(ready);if(ready){setStatus(failures?'Farmall bereit · Ein weiteres Modell konnte nicht geladen werden.':'Farmall bereit · Auswählen oder Fahrmodus starten');}else setStatus('Farmall konnte nicht geladen werden. Bitte Seite neu laden.');updateButtons();
  }).catch(()=>{if(!disposed)setStatus('Modelle konnten nicht geladen werden. Bitte Seite neu laden.');});
  const api=()=>{
    disposed=true;cancelAnimationFrame(raf);savePose();rememberedCamera={position:camera.position.toArray(),target:controls.target.toArray(),zoom:camera.zoom};observer.disconnect();intersection.disconnect();controls.dispose();events.forEach(fn=>fn());geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());sun.shadow.map?.dispose();renderer.renderLists.dispose();canvas.remove();
  };
  api.save=savePose;
  api.select=id=>{fieldBorders.forEach(f=>f.line.material.color.set(f.id===id?0xffedaa:0x647148));};
  api.resetCamera=()=>{rememberedCamera=null;};
  return api;
}
