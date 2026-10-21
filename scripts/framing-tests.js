import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {species} from '../src/animals.js';
import {faceData,correspondence} from '../src/geometry.js';
import {createFragments} from '../src/fragments.js';
import {createNaturalMotion,deformVertex} from '../src/natural-motion.js';
import {createFraming} from '../src/framing.js';
import {ease} from '../src/transitions.js';
const models=species.map(s=>JSON.parse(fs.readFileSync(new URL(`../public/models/${s.id}.json`,import.meta.url))));
const pairs=correspondence(...models.map(faceData)),fragments=createFragments(pairs),motion=createNaturalMotion(pairs);
const root=new THREE.Group();root.add(fragments.mesh);root.position.y=.35;root.rotation.y=.08;
const camera=new THREE.PerspectiveCamera(34,1,.1,60),target=new THREE.Vector3(0,.05,0),framing=createFraming(camera,root,target),p=new THREE.Vector3();
let cases=0,margin=1;const viewports=[[360,800],[343,580],[1280,800],[844,390]],times=[0,.15,.4,.75,1.25,1.75,2.25,2.75,3.25,3.75,4.25,4.75,5.25,5.5];
for(let source=0;source<models.length;source++)for(const [w,h] of viewports)for(let az=0;az<12;az++)for(const elevation of [10,35,70])for(let sample=0;sample<times.length+(['tiger','orangutan'].includes(models[source].name)?18:9);sample++){
 const idle=sample>=times.length,elapsed=idle?-1:times[sample],t=idle?[0,2,5,9,13,17,23,30,35,38,45,49,55,61,66,101,112,120][sample-times.length]:(['tiger','orangutan'].includes(models[source].name)?38:18)+elapsed;
 const spread=idle?0:ease(elapsed/1.2)*(1-ease((elapsed-4.4)/1.1));root.scale.setScalar(THREE.MathUtils.lerp(w<650?1.18:1.45,1,spread));
 camera.aspect=w/h;camera.fov=w<650?39:34;camera.updateProjectionMatrix();
 const angle=az*Math.PI/6,pitch=elevation*Math.PI/180;
 // Launch toward the initial view, then inspect the same spread from every orbit angle.
 camera.position.set(0,2+target.y,10);camera.lookAt(target);camera.updateMatrixWorld();root.updateMatrixWorld(true);
 const orientation=root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(camera.getWorldQuaternion(new THREE.Quaternion()));
 let captured=null;if(!idle&&['tiger','orangutan'].includes(models[source].name)){fragments.update(source);motion.apply(fragments.positions,source,38);captured=fragments.positions.slice();}
 fragments.prepare(source,new THREE.Vector3(-2,0,0),{aspect:w/h,orientation},captured);fragments.update(source,elapsed);motion.apply(fragments.positions,source,t,elapsed,!!captured);
 camera.position.set(10*Math.sin(angle)*Math.cos(pitch),10*Math.sin(pitch)+target.y,10*Math.cos(angle)*Math.cos(pitch));
 framing.update(1/60,w<650,spread);camera.updateMatrixWorld();
 for(let i=0;i<fragments.positions.length;i+=3){p.fromArray(fragments.positions,i).applyMatrix4(fragments.mesh.matrixWorld).project(camera);assert.ok(Math.abs(p.x)<=.84001&&p.y<=.80001&&p.y>=-(.62001+.18*spread)&&p.z>=-1&&p.z<=1,`clipping ${source} ${w} ${az} ${elevation} ${elapsed}`);margin=Math.min(margin,1-Math.abs(p.x),1-Math.abs(p.y));}
 cases++;
}
// Modest gain is measurable in both approved animals, without changing timing.
const a=new Float64Array(3),b=new Float64Array(3);let ratios=[];
for(const kind of ['rhino','turtle']){
 let oldMax=0,newMax=0;const rest=models.find(m=>m.name===kind).positions;
 for(let frame=0;frame<144;frame++)for(let i=0;i<rest.length;i+=3){const x=rest[i],y=rest[i+1],z=rest[i+2];deformVertex(kind,x,y,z,frame/4,a,1);deformVertex(kind,x,y,z,frame/4,b);oldMax=Math.max(oldMax,Math.hypot(a[0]-x,a[1]-y,a[2]-z));newMax=Math.max(newMax,Math.hypot(b[0]-x,b[1]-y,b[2]-z));}
 assert.ok(Math.abs(newMax/oldMax-1.22)<1e-8);ratios.push({species:kind,displacementGain:newMax/oldMax});
}
fragments.dispose();console.log(JSON.stringify({passed:true,cameraCases:cases,fullAzimuthDegrees:360,elevations:[10,35,70],viewports,minViewportEdgeMargin:margin,idleAndEveryTransition:true,liveVertexFit:true,motionGain:ratios},null,2));
