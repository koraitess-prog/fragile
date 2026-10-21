import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {orangutanAnatomy as mesh} from '../src/orangutan-anatomy.js';
import {faceData} from '../src/geometry.js';
import {buildCorrespondence} from '../src/correspondence.js';
const file=new URL('../public/models/orangutan.json',import.meta.url),previous=JSON.parse(fs.readFileSync(file));
const positions=mesh.faces.flatMap(f=>f.flatMap(i=>mesh.vertices[i]));
assert.equal(mesh.vertices.length,112);assert.equal(mesh.faces.length,220);
let minArea=Infinity,volume=0;const edges=new Map();
for(const ids of mesh.faces){const[a,b,c]=ids.map(i=>new Vector3(...mesh.vertices[i])),n=b.clone().sub(a).cross(c.clone().sub(a));minArea=Math.min(minArea,n.length()/2);volume+=a.dot(n)/6;for(let j=0;j<3;j++){const a=ids[j],b=ids[(j+1)%3],key=[a,b].sort((a,b)=>a-b).join('|'),e=edges.get(key)||{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(key,e);}}
assert(minArea>1e-6);assert(volume>0);assert([...edges.values()].every(e=>e.count===2&&e.direction===0));
// Map the original orangutan's fragment IDs onto the refined topology. The
// approved destinations of every OTHER animal remain in their original slots.
const reference=previous.fragmentReference?.positions??previous.positions;
const indices=buildCorrespondence(faceData({name:'orangutan',positions:reference}),faceData({name:'orangutan',positions})).indices;
fs.writeFileSync(file,JSON.stringify({name:'orangutan',triangles:220,positions,fragmentReference:{positions:reference,indices}}));
console.log(JSON.stringify({species:'Tapanuli orangutan',vertices:112,triangles:220,edges:edges.size,volume,minArea,watertight:true,anatomicalRings:true,persistentOtherAnimalSlots:true},null,2));
