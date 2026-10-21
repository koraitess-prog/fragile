import './styles.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import * as THREE from 'three';
import {species} from './animals.js';
import {createScene} from './scene.js';
import {createGestureTracker} from './inspection.js';
import {faceData,correspondence} from './geometry.js';
import {createFragments} from './fragments.js';
import {createNaturalMotion} from './natural-motion.js';
import {DURATION,phaseAt,ease} from './transitions.js';
const container=document.querySelector('#scene'),caption=document.querySelector('#caption'),error=document.querySelector('#error');document.body.classList.add('loading');
try{
 const models=await Promise.all(species.map(async animal=>{const response=await fetch(`${import.meta.env.BASE_URL}models/${animal.id}.json`);if(!response.ok)throw Error('Model unavailable');return response.json();}));
 const params=new URLSearchParams(location.search),tigerOffset=params.has('qa')?Math.max(0,Number(params.get('tigerTime'))||0):0;
 const pairs=correspondence(...models.map(faceData)),world=createScene(container,models),fragments=createFragments(pairs),natural=createNaturalMotion(pairs,{tigerClockOrigin:performance.now()/1000,tigerTimeOffset:tigerOffset,orangutanClockOrigin:performance.now()/1000,orangutanTimeOffset:params.has('qa')?Math.max(0,Number(params.get('orangutanTime'))||0):0,orangutanFixedTime:params.has('qa')&&params.has('orangutanPose')?Math.max(0,Number(params.get('orangutanPose'))||0):null});world.root.add(fragments.mesh);
 let current=Math.max(0,species.findIndex(animal=>animal.id===new URLSearchParams(location.search).get('species'))),busy=false,started=0,frames=[],lastFrame=0,adaptive=false,frozen=null;
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
 function labels(){const animal=species[current];document.querySelector('#name').textContent=animal.name;document.querySelector('#quantity').textContent=animal.quantity;document.querySelector('#qualifier').textContent=animal.qualifier;const link=document.querySelector('#population');link.href=animal.source;link.title=animal.populationScope;document.querySelector('#name').title=`${animal.scientific} · IUCN: ${animal.status}`;caption.dataset.scientificName=animal.scientific;caption.dataset.conservationStatus=animal.status;container.setAttribute('aria-label',`${animal.name} (${animal.scientific}), ${animal.status}. Sculpture. Drag to rotate. Click or press Enter to transform into the next species.`);}
 function hit(e){const r=container.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,world.camera);return raycaster.intersectObject(fragments.mesh)[0];}
 function transform(point=new THREE.Vector3(-2,0,0)){if(busy)return false;busy=true;started=performance.now()/1000;caption.classList.add('changing');container.setAttribute('aria-busy','true');world.root.updateMatrixWorld();fragments.prepare(current,world.root.worldToLocal(point.clone()),world.spreadView(),['tiger','orangutan'].includes(species[current].id)?fragments.positions:null);return true;}
 const gesture=createGestureTracker();
 container.addEventListener('pointerdown',e=>{gesture.start(e);});
 container.addEventListener('pointermove',e=>{gesture.move(e);container.classList.toggle('dragging',gesture.dragging);if(!busy&&!gesture.dragging)container.classList.toggle('hit',!!hit(e));});
 container.addEventListener('pointerleave',()=>{container.classList.remove('hit');});
 container.addEventListener('pointerup',e=>{const click=gesture.finish(e);container.classList.remove('dragging');if(click&&!busy){const intersection=hit(e);if(intersection)transform(intersection.point);}});
 const cancelGesture=()=>{gesture.cancel();container.classList.remove('dragging','hit');};
 container.addEventListener('pointercancel',cancelGesture);container.addEventListener('lostpointercapture',cancelGesture);container.addEventListener('keydown',e=>{if(e.key==='Enter'||e.code==='Space'){e.preventDefault();transform();}});
 let diagnostics={species:species[current].id,phase:'alive',triangles:fragments.count,transforms:0,frameMedianMs:null,frameP95Ms:null};
 // Read-only diagnostics and deterministic phase rendering are QA-only; no visible controls.
 const qa=new URLSearchParams(location.search).has('qa');
 if(qa){const status=document.createElement('output');status.id='qa-status';status.setAttribute('aria-live','off');Object.assign(status.style,{position:'fixed',width:'1px',height:'1px',overflow:'hidden',clipPath:'inset(50%)'});document.body.appendChild(status);globalThis.fragileQA={get state(){return{...diagnostics,busy};},trigger:()=>transform(),seek(t){frozen=t;fragments.prepare(current,new THREE.Vector3(-2,0,0),world.spreadView());},endpoint(i){current=i;busy=false;frozen=null;fragments.update(i);labels();caption.classList.remove('changing');}};
 addEventListener('keydown',e=>{const phases={'1':.4,'2':1.5,'3':2.2,'4':4.5,'6':3.5};if(e.key in phases){current=e.key==='6'?1:0;busy=false;frozen=phases[e.key];fragments.prepare(current,new THREE.Vector3(-2,0,0),world.spreadView());caption.classList.add('changing');}else if(['0','5','7','8','e'].includes(e.key)){current={'0':0,'5':1,'7':2,'8':3,'e':4}[e.key];busy=false;frozen=null;fragments.update(current);labels();caption.classList.remove('changing');}else if(e.key==='9'){frozen=null;busy=false;current=0;fragments.update(0);labels();caption.classList.remove('changing');} });}
 function render(ms){const t=ms/1000,dt=lastFrame?ms-lastFrame:16;lastFrame=ms;frames.push(dt);if(frames.length>240)frames.shift();if(frames.length===240&&diagnostics.frameMedianMs===null){const sorted=[...frames].sort((a,b)=>a-b);diagnostics.frameMedianMs=+sorted[120].toFixed(2);diagnostics.frameP95Ms=+sorted[228].toFixed(2);if(sorted[120]>24&&!adaptive){world.renderer.setPixelRatio(1);world.resize();adaptive=true;}}
  if(busy){let elapsed=t-started;if(elapsed>=DURATION){current=(current+1)%species.length;busy=false;diagnostics.transforms++;diagnostics.species=species[current].id;fragments.update(current);labels();caption.classList.remove('changing');container.setAttribute('aria-busy','false');}else fragments.update(current,Math.max(0,elapsed));}
  if(frozen!==null)fragments.update(current,frozen);
  if(frozen===null){if(!busy)fragments.update(current);natural.apply(fragments.positions,current,t,busy?t-started:-1,busy&&fragments.hasCapturedSource);fragments.mesh.geometry.attributes.position.needsUpdate=true;}
  diagnostics.phase=frozen!==null?phaseAt(frozen):busy?phaseAt(t-started):'alive';const elapsed=frozen!==null?frozen:busy?t-started:-1,angle=elapsed>=0?THREE.MathUtils.lerp(current,(current+1)%species.length,ease((elapsed-1.3)/3.5)):current,spread=elapsed>=0?ease(elapsed/1.2)*(1-ease((elapsed-4.4)/1.1)):0;world.update(t,busy||frozen!==null,angle,spread);world.renderer.render(world.scene,world.camera);if(qa)document.querySelector('#qa-status').textContent=JSON.stringify({...diagnostics,species:species[current].id,busy,quality:adaptive?'adaptive':'full',inspection:world.inspection(),motion:natural.diagnostics});requestAnimationFrame(render);}
 labels();document.body.classList.remove('loading');requestAnimationFrame(render);
 addEventListener('pagehide',()=>{fragments.dispose();world.dispose();},{once:true});
}catch(e){console.error(e);document.body.classList.remove('loading');caption.hidden=true;error.hidden=false;error.textContent='The sculpture could not load. Please use a WebGL-capable browser and the local development server.';}

