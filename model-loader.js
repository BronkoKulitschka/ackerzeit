import { GLTFLoader } from './vendor/three/addons/loaders/GLTFLoader.js';
const loader=new GLTFLoader(),cache=new Map();
let catalogPromise;
export function catalog(){
  if(!catalogPromise)catalogPromise=fetch(new URL('./data/models.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Modellkatalog nicht erreichbar.');return r.json();}).then(c=>window.FarmWorld.validateCatalog(c)).catch(e=>{catalogPromise=null;throw e;});
  return catalogPromise;
}
export async function loadModel(def){
  if(!cache.has(def.file))cache.set(def.file,loader.loadAsync(new URL(def.file,import.meta.url).href).catch(e=>{cache.delete(def.file);throw e;}));
  const asset=await cache.get(def.file),object=asset.scene.clone(true);
  object.scale.setScalar(def.scale);
  object.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.sharedAsset=true;}});
  // Rigid game props share immutable mesh resources, keeping repeated loads economical.
  // Skinned characters will require SkeletonUtils.clone when added in a later release.
  return {object,animations:asset.animations};
}
