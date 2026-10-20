import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {species} from '../src/animals.js';
import {faceData,correspondence} from '../src/geometry.js';
import {createFragments} from '../src/fragments.js';
import {createNaturalMotion} from '../src/natural-motion.js';
const models=species.map(s=>JSON.parse(fs.readFileSync(new URL(`../public/models/${s.id}.json`,import.meta.url))));
assert.deepEqual(species.map(s=>s.id),['rhino','turtle','orangutan','pangolin','eagle','shark','tiger','saola','manta','whale']);
const pairs=correspondence(...models.map(faceData)),approved=correspondence(...models.slice(0,2).map(faceData));
assert.deepEqual(pairs.map(p=>p.slice(0,2)),approved,'approved fragment identity changed');
assert.deepEqual(pairs.map(p=>p.slice(0,4)),correspondence(...models.slice(0,4).map(faceData)),'existing four-species fragment slots changed');
assert.deepEqual(pairs.map(p=>p.slice(0,5)),correspondence(...models.slice(0,5).map(faceData)),'approved five-species fragment slots changed');
assert.deepEqual(pairs.map(p=>p.slice(0,6)),correspondence(...models.slice(0,6).map(faceData)),'approved six-species fragment slots changed');
assert.deepEqual(pairs.map(p=>p.slice(0,7)),correspondence(...models.slice(0,7).map(faceData)),'approved seven-species fragment slots changed');
const fragments=createFragments(pairs),motion=createNaturalMotion(pairs);
assert.deepEqual(pairs.map(p=>p.slice(0,8)),correspondence(...models.slice(0,8).map(faceData)),'approved eight-species fragment slots changed');
assert.deepEqual(pairs.map(p=>p.slice(0,9)),correspondence(...models.slice(0,9).map(faceData)),'approved nine-species fragment slots changed');
const normal=(p,i)=>new THREE.Vector3().fromArray(p,i+3).sub(new THREE.Vector3().fromArray(p,i)).cross(new THREE.Vector3().fromArray(p,i+6).sub(new THREE.Vector3().fromArray(p,i)));
const report=[];
for(let source=0;source<models.length;source++){
 const owners=new Map(),edges=new Map();let volume=0;
 for(let face=0;face<pairs.length;face++){
  const p=pairs[face][source].original,keys=[];
  volume+=new THREE.Vector3(...p.slice(0,3)).dot(new THREE.Vector3(...p.slice(3,6)).cross(new THREE.Vector3(...p.slice(6,9))))/6;
  for(let corner=0;corner<3;corner++){const key=p.slice(corner*3,corner*3+3).join(',');keys.push(key);if(!owners.has(key))owners.set(key,[]);owners.get(key).push(face*9+corner*3);}
  for(let corner=0;corner<3;corner++){const a=keys[corner],b=keys[(corner+1)%3],key=[a,b].sort().join('|'),edge=edges.get(key)||{count:0,direction:0};edge.count++;edge.direction+=a<b?1:-1;edges.set(key,edge);}
 }
 assert.equal(new Set(pairs.map(p=>p[source].id)).size,220);assert.equal(owners.size,112);assert.equal(edges.size,330);assert.ok(volume>0);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0));
 let displacement=0;
 for(let frame=0;frame<=2400;frame++){
  fragments.update(source);motion.apply(fragments.positions,source,frame/20);
  for(const indices of owners.values())for(const i of indices)for(let axis=0;axis<3;axis++)assert.equal(fragments.positions[i+axis],fragments.positions[indices[0]+axis],'idle crack');
  for(let face=0;face<pairs.length;face++){const n=normal(fragments.positions,face*9);assert.ok(n.length()>1e-7);assert.ok(n.dot(normal(pairs[face][source].original,0))>0,'inverted idle face');}
  assert.ok(fragments.positions.every(Number.isFinite));displacement=Math.max(displacement,motion.diagnostics.maxDisplacement);
 }
 assert.ok(displacement>.015,'idle movement missing');
 fragments.prepare(source,new THREE.Vector3(-2,0,0));let error=0;
 for(let frame=0;frame<=330;frame++){
  const elapsed=frame/60;fragments.update(source,elapsed);motion.apply(fragments.positions,source,10+elapsed,elapsed);assert.ok(fragments.positions.every(Number.isFinite));
  if(frame===0||frame===330){const actual=fragments.positions.slice(),destination=frame===0?source:(source+1)%models.length;fragments.update(destination);motion.apply(fragments.positions,destination,10+elapsed);for(let i=0;i<actual.length;i++)error=Math.max(error,Math.abs(actual[i]-fragments.positions[i]));}
 }
 assert.ok(error<1e-6,'motion seam');
 report.push({species:models[source].name,next:models[(source+1)%models.length].name,triangles:220,vertices:owners.size,watertight:true,closedEuler:owners.size-edges.size+220,posedSamples:2401,seconds:120,bitIdenticalSharedVertices:true,noInvertedFaces:true,maxDisplacement:displacement,maxEndpointError:error});
}
assert.equal(fragments.mesh.material.wireframe,true);assert.equal(fragments.mesh.material.color.getHexString(),'e8e8e8');fragments.dispose();
console.log(JSON.stringify({passed:true,approvedRhinoTurtleAssignmentPreserved:true,persistentFragmentSlots:220,models:report},null,2));
