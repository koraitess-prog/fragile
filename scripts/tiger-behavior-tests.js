import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import * as THREE from 'three';
import {species} from '../src/animals.js';
import {deformVertex,createNaturalMotion} from '../src/natural-motion.js';
import {tigerBehavior,tigerRigDiagnostics} from '../src/tiger-behavior.js';
import {faceData,correspondence} from '../src/geometry.js';
import {createFragments} from '../src/fragments.js';
const checkpoint='891207e',a=new Float64Array(3),b=new Float64Array(3);
let baseline=null;try{baseline=execFileSync('git',['show',`${checkpoint}:fragile/src/natural-motion.js`],{encoding:'utf8',stdio:['ignore','pipe','ignore']});}catch{/* Public export excludes local checkpoint history. */}
const approved=baseline?(await import(`data:text/javascript;base64,${Buffer.from(baseline.replace("'./transitions.js'",JSON.stringify(new URL('../src/transitions.js',import.meta.url).href))).toString('base64')}`)).deformVertex:null;
const models=species.map(s=>JSON.parse(fs.readFileSync(new URL(`../public/models/${s.id}.json`,import.meta.url))));
for(const model of models){if(!approved)continue;assert.deepEqual(model,JSON.parse(execFileSync('git',['show',`${checkpoint}:fragile/public/models/${model.name}.json`],{encoding:'utf8'})),`${model.name} geometry changed`);if(model.name==='tiger')continue;
 for(const t of [0,3,11,30,38,49,68,119])for(let i=0;i<model.positions.length;i+=3){const p=model.positions.slice(i,i+3);approved(model.name,...p,t,a);deformVertex(model.name,...p,t,b);assert.deepEqual(a,b,`${model.name} idle changed`);}}
const model=models.find(m=>m.name==='tiger'),vertices=[],lookup=new Map(),ids=[];
for(let i=0;i<model.positions.length;i+=3){const p=model.positions.slice(i,i+3),key=p.join(',');if(!lookup.has(key)){lookup.set(key,vertices.length);vertices.push(p);}ids.push(lookup.get(key));}
const normal=(p,i)=>{const [a,b,c]=[0,1,2].map(j=>p[ids[i+j]]),u=b.map((v,j)=>v-a[j]),v=c.map((v,j)=>v-a[j]);return[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];};
const restAreas=Array.from({length:220},(_,f)=>Math.hypot(...normal(vertices,f*3))),states=new Set();
assert.equal(vertices.length,112);assert.ok(vertices.some(p=>p[1]>.95&&p[2]>.25)&&vertices.some(p=>p[1]>.95&&p[2]<-.25),'paired ears missing');assert.ok(vertices.some(p=>p[0]>3.1)&&vertices.some(p=>p[0]>2.5&&p[1]<-.3),'long curved tail missing');
let previous=null,previousNormals=null,minAreaRatio=1,maxNormalTurn=0,maxVertexStep=0,minY=Infinity,minVolume=Infinity,maxSupportSpeed=0,minSupport=4,maxReach=0,maxTailLengthError=0,tailMin=Infinity,tailMax=-Infinity;
for(let frame=0;frame<=14400;frame++){
 const t=frame/60,s=tigerBehavior(t),rig=tigerRigDiagnostics(t);states.add(s.state);minSupport=Math.min(minSupport,s.lift.filter(v=>v<1e-9).length);maxReach=Math.max(maxReach,...rig.feet.map(l=>l.reach));
 const p=vertices.map(v=>[...deformVertex('tiger',...v,t,a)]),normals=[];let volume=0;
 for(let f=0;f<220;f++){const n=normal(p,f*3),area=Math.hypot(...n);minAreaRatio=Math.min(minAreaRatio,area/restAreas[f]);normals.push(n);
  if(previousNormals){const q=previousNormals[f],dot=n.reduce((s,v,j)=>s+v*q[j],0)/(area*Math.hypot(...q));maxNormalTurn=Math.max(maxNormalTurn,Math.acos(Math.max(-1,Math.min(1,dot))));}
  const v=p[ids[f*3]];volume+=v.reduce((s,v,j)=>s+v*n[j],0)/6;
 }
 minVolume=Math.min(minVolume,volume);minY=Math.min(minY,...p.map(v=>v[1]));
 if(previous)for(let i=0;i<p.length;i++)maxVertexStep=Math.max(maxVertexStep,Math.hypot(...p[i].map((v,j)=>v-previous[i][j])));
 for(let i=0;i<4;i++)if(s.lift[i]===0&&tigerBehavior(t+1/60).lift[i]===0){const next=tigerRigDiagnostics(t+1/60).feet[i].position;maxSupportSpeed=Math.max(maxSupportSpeed,Math.hypot(...rig.feet[i].position.map((v,j)=>v-next[j])));}
 for(let i=1;i<rig.tail.length;i++){const length=Math.hypot(...rig.tail[i].map((v,j)=>v-rig.tail[i-1][j])),rest=tigerRigDiagnostics(0).tail,max=Math.hypot(...rest[i].map((v,j)=>v-rest[i-1][j]));maxTailLengthError=Math.max(maxTailLengthError,Math.abs(length-max));}
 if(!s.sit){tailMin=Math.min(tailMin,rig.tail.at(-1)[2]);tailMax=Math.max(tailMax,rig.tail.at(-1)[2]);}
 previous=p;previousNormals=normals;
}
assert.ok(minAreaRatio>.08,`joint surface pinched ${minAreaRatio}`);assert.ok(maxNormalTurn<.20,`abrupt face orientation ${maxNormalTurn}`);assert.ok(minVolume>.5,'inside-out surface');assert.ok(minY>=-1.205,`ground penetration ${minY}`);assert.ok(maxVertexStep<.035,`pose snap ${maxVertexStep}`);assert.ok(maxSupportSpeed<1e-9,`supporting paw slides ${maxSupportSpeed}`);assert.ok(minSupport>=3);assert.ok(maxReach<1.035,`limb overreach ${maxReach}`);assert.ok(maxTailLengthError<1e-12);assert.ok(tailMax-tailMin>.8);assert.equal(states.size,11);
// Check every state boundary from both sides, including the varied next phrase.
let boundaryError=0;for(const t of [0,68,160])for(const event of tigerBehavior(t).events)for(const v of vertices){deformVertex('tiger',...v,event.start-1e-6,a);deformVertex('tiger',...v,event.start+1e-6,b);boundaryError=Math.max(boundaryError,Math.hypot(...a.map((v,j)=>v-b[j])));}assert.ok(boundaryError<1e-4);
const pairs=correspondence(...models.map(faceData)),source=species.findIndex(s=>s.id==='tiger'),fragments=createFragments(pairs),motion=createNaturalMotion(pairs);let captureError=0,arrivalError=0,firstFrameMotion=0;
for(const t of [3,16,30,38,49]){
 fragments.update(source);motion.apply(fragments.positions,source,t);const captured=fragments.positions.slice();fragments.prepare(source,new THREE.Vector3(-2,0,0),{},captured);
 fragments.update(source,0);motion.apply(fragments.positions,source,t,0,true);for(let i=0;i<captured.length;i++)captureError=Math.max(captureError,Math.abs(captured[i]-fragments.positions[i]));
 fragments.update(source,.001);motion.apply(fragments.positions,source,t+.001,.001,true);for(let i=0;i<captured.length;i++)firstFrameMotion=Math.max(firstFrameMotion,Math.abs(captured[i]-fragments.positions[i]));
 for(let frame=0;frame<=330;frame++){const elapsed=frame/60;fragments.update(source,elapsed);motion.apply(fragments.positions,source,t+elapsed,elapsed,true);assert.ok(fragments.positions.every(Number.isFinite));}
 const actual=fragments.positions.slice();fragments.update(source+1);motion.apply(fragments.positions,source+1,t+5.5);for(let i=0;i<actual.length;i++)arrivalError=Math.max(arrivalError,Math.abs(actual[i]-fragments.positions[i]));
}
assert.ok(captureError<1e-6&&arrivalError<1e-6&&firstFrameMotion<1e-5);fragments.dispose();
console.log(JSON.stringify({passed:true,checkpoint,localBaselineAvailable:!!approved,allTenRestMeshesUnchanged:!!approved,otherNineIdlesUnchanged:!!approved,seconds:240,states:[...states],minAreaRatio,maxFaceTurnPer60HzFrame:maxNormalTurn,minVolume,minY,maxVertexStep,maxPlantedPawStep:maxSupportSpeed,minSupportingPaws:minSupport,maxLimbReach:maxReach,maxTailSegmentLengthError:maxTailLengthError,standingTailLateralRange:tailMax-tailMin,maxBoundaryError:boundaryError,capturedPoseError:captureError,firstMillisecondMotion:firstFrameMotion,arrivalError},null,2));
