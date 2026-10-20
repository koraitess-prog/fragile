import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {deformVertex,motionState} from '../src/natural-motion.js';
import {spreadPoint} from '../src/fragment-spread.js';
const a=new Float64Array(3),b=new Float64Array(3),report=[];
for(const kind of ['rhino','turtle','orangutan','eagle','shark','tiger','saola']){
 const model=JSON.parse(fs.readFileSync(new URL(`../public/models/${kind}.json`,import.meta.url))),states=new Set();let largestStep=0,cycleDifference=0;
 for(let frame=0;frame<=2400;frame++){
  const t=frame/20;states.add(motionState(kind,t));
  for(let i=0;i<model.positions.length;i+=3){
   const [x,y,z]=model.positions.slice(i,i+3);deformVertex(kind,x,y,z,t,a);deformVertex(kind,x,y,z,t+1/60,b);
   largestStep=Math.max(largestStep,Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]));
   if(frame%20===0){deformVertex(kind,x,y,z,t+23,b);cycleDifference=Math.max(cycleDifference,Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]));}
   if(kind==='rhino'&&y<=-1.25)assert.ok(Math.hypot(a[0]-x,a[1]-y,a[2]-z)<1e-10,'rhino foot slid');
  }
 }
 assert.ok(largestStep<.025,`${kind} has an abrupt gesture`);assert.ok(cycleDifference>.015,'identical repeated cycle');assert.ok(states.size>=2);
 if(kind==='turtle')assert.ok([...states].includes('glide / steering'));
 report.push({species:kind,seconds:120,states:[...states],largest60HzStep:largestStep,cycleDifference});
}
// The cloud occupies a balanced rectangle with depth, across portrait and landscape.
const spreads=[];
for(const aspect of [343/580,360/800,1280/800,844/390]){
 const points=Array.from({length:220},(_,i)=>spreadPoint(i,220,aspect)),xs=points.map(p=>p.x),ys=points.map(p=>p.y),zs=points.map(p=>p.z);
 const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys),depth=Math.max(...zs)-Math.min(...zs);
 assert.ok(width/height/aspect>.92&&width/height/aspect<1.14);assert.ok(depth>3);
 const quadrants=[0,0,0,0];for(const p of points)quadrants[(p.x>0?1:0)+(p.y>0?2:0)]++;
 assert.ok(quadrants.every(n=>n>=45));
 const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(.3,1.2,0));
 for(let i=0;i<220;i++)assert.ok(spreadPoint(i,220,aspect,q).distanceTo(points[i].clone().applyQuaternion(q))<1e-10,'view orientation mismatch');
 spreads.push({aspect,width,height,depth,quadrants});
}
console.log(JSON.stringify({passed:true,movement:report,spreads},null,2));
