const test=require('node:test');
const assert=require('node:assert/strict');
const W=require('../world.js');
const E=require('../engine.js');
const catalog=require('../data/models.json');

test('routes detour around farm buildings with tractor clearance',()=>{
  for(const [start,end] of [[{x:-32,z:1},{x:-16,z:1}],[{x:-31,z:7},{x:-17,z:-6}],[W.spawn,{x:26,z:-18}]]){
    const route=W.route(start,end);assert.ok(route.length);let previous=start;
    for(const point of route){assert.ok(W.clearLine(previous,point),JSON.stringify({previous,point}));previous=point;}
    assert.deepEqual(route.at(-1),end);
  }
});
test('unreachable targets and invalid saved positions cannot enter buildings or leave the map',()=>{
  for(const p of [{x:-24,z:1},{x:100,z:4},{x:NaN,z:0}])assert.deepEqual(W.route(W.spawn,p),[]);
  for(const p of [null,{x:NaN,z:0,yaw:0},{x:0,z:0,yaw:Infinity},{x:-24,z:1,yaw:0}])assert.deepEqual(W.safePose(p),W.spawn);
  assert.deepEqual(W.safePose({x:2,z:2,yaw:0}),{x:2,z:2,yaw:0});
});
test('catalog entries resolve all placements; malformed and duplicate IDs fail',()=>{
  assert.equal(W.validateCatalog(catalog),catalog);
  for(const edit of [c=>c.models.push(c.models[0]),c=>c.models[0].file='../unsafe.glb',c=>c.instances[0].model='missing',c=>c.instances[0].position=[1,2]]){
    const c=structuredClone(catalog);edit(c);assert.throws(()=>W.validateCatalog(c));
  }
});
test('3D placement is optional and routing never changes management state',()=>{
  const s=E.fresh(),before=JSON.stringify(s);W.route(W.spawn,{x:20,z:10});assert.equal(JSON.stringify(s),before);assert.ok(E.validate(s));
  s.world3d={tractor:{x:2,z:4,yaw:1}};const loaded=JSON.parse(JSON.stringify(s));assert.ok(E.validate(loaded));E.advance(loaded);assert.deepEqual(loaded.world3d,s.world3d);
});
