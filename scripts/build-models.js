import fs from 'node:fs';
import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {simplify} from './simplify.js';
import {splitTo} from './triangle-budget.js';

// Original implicit sculptures. Smooth unions are polygonised as ONE exterior
// surface, not drawn as overlapping primitive meshes or sampled particle skins.
const sm=(a,b,k=.19)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
function egg(x,y,z,cx,cy,cz,rx,ry,rz,angle=0){const xx=x-cx,yy=y-cy,c=Math.cos(angle),s=Math.sin(angle),a=(xx*c+yy*s)/rx,b=(-xx*s+yy*c)/ry,d=(z-cz)/rz;return(Math.sqrt(a*a+b*b+d*d)-1)*Math.min(rx,ry,rz);}
function limb(x,y,z,a,b,ra,rb,flat=1){const px=x-a[0],py=(y-a[1])/flat,pz=z-a[2],vx=b[0]-a[0],vy=(b[1]-a[1])/flat,vz=b[2]-a[2],h=Math.max(0,Math.min(1,(px*vx+py*vy+pz*vz)/(vx*vx+vy*vy+vz*vz)));return(Math.hypot(px-vx*h,py-vy*h,pz-vz*h)-(ra+(rb-ra)*h))*Math.min(flat,1);}
function rhino(x,y,z){let d=egg(x,y,z,0,.16,0,1.61,.88,.73);
 d=sm(d,egg(x,y,z,-.83,.28,0,.81,.81,.73),.28);
 d=sm(d,egg(x,y,z,1.05,.12,0,.74,.82,.68),.3);
 d=sm(d,egg(x,y,z,-1.39,.06,0,.65,.6,.49,-.23),.24);
 d=sm(d,egg(x,y,z,-1.91,-.07,0,.61,.44,.37,.18),.16);
 d=sm(d,egg(x,y,z,-2.37,-.21,0,.38,.24,.27,.04),.1);
 d=sm(d,egg(x,y,z,-2.67,-.13,0,.15,.13,.18,-.35),.045);
 for(const side of [-1,1]){
  d=sm(d,limb(x,y,z,[-.95,-.18,side*.48],[-1.05,-.89,side*.53],.37,.25),.19);
  d=sm(d,limb(x,y,z,[-1.05,-.85,side*.53],[-1.12,-1.39,side*.55],.25,.23),.12);
  d=sm(d,egg(x,y,z,-1.18,-1.39,side*.55,.32,.19,.26),.09);
  d=sm(d,limb(x,y,z,[1.02,-.2,side*.44],[1.23,-.91,side*.51],.4,.23),.2);
  d=sm(d,limb(x,y,z,[1.23,-.86,side*.51],[1.06,-1.39,side*.54],.23,.22),.1);
  d=sm(d,egg(x,y,z,1.01,-1.4,side*.54,.3,.18,.25),.08);
  // Upright tapered ears, joined to the back of the skull.
  d=sm(d,limb(x,y,z,[-1.51,.48,side*.3],[-1.38,1.16,side*.47],.16,.045,.95),.06);
 }
 d=sm(d,limb(x,y,z,[-2.46,.0,0],[-2.58,.48,0],.18,.095),.04);
 d=sm(d,limb(x,y,z,[-2.58,.48,0],[-2.73,1.02,0],.095,.008),.025);
 d=sm(d,limb(x,y,z,[-1.99,.23,0],[-2.04,.79,0],.14,.008),.035);
 d=sm(d,limb(x,y,z,[1.54,.25,0],[1.93,-.52,.04],.075,.038),.075);
 return d;}
function turtle(x,y,z){let d=egg(x,y<.02?.02+(y-.02)*1.85:y,z,0,.02,0,1.67,.53,1.15);
 d=sm(d,limb(x,y,z,[-1.38,-.04,0],[-1.95,.0,0],.29,.21,.8),.12);
 d=sm(d,egg(x,y,z,-2.04,.04,0,.4,.23,.23,.1),.08);
 d=sm(d,limb(x,y,z,[-2.29,.02,0],[-2.51,-.15,0],.13,.008,.85),.03);
 for(const side of [-1,1]){
  // Long swept fore-flippers and smaller rear paddles are part of the same mesh.
  d=sm(d,limb(x,y,z,[-.94,-.16,side*.76],[-1.16,-.21,side*1.52],.3,.26,.32),.13);
  d=sm(d,limb(x,y,z,[-1.16,-.21,side*1.52],[-.39,-.29,side*2.42],.26,.012,.3),.06);
  d=sm(d,limb(x,y,z,[1.05,-.16,side*.72],[1.53,-.22,side*1.27],.28,.23,.34),.12);
  d=sm(d,limb(x,y,z,[1.53,-.22,side*1.27],[1.85,-.25,side*1.68],.23,.015,.33),.06);
 }
 d=sm(d,limb(x,y,z,[1.47,-.12,0],[2.01,-.21,0],.13,.006,.65),.065);
 return d;}
function polygonise(fn,step=.105){const min=[-3.35,-1.8,-2.75],max=[2.4,1.5,2.75],nx=Math.ceil((max[0]-min[0])/step),ny=Math.ceil((max[1]-min[1])/step),nz=Math.ceil((max[2]-min[2])/step),sx=nx+1,sy=ny+1,values=new Float32Array(sx*sy*(nz+1)),coords=[];
 const index=(x,y,z)=>(z*sy+y)*sx+x;
 for(let z=0;z<=nz;z++)for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)values[index(x,y,z)]=fn(min[0]+x*step,min[1]+y*step,min[2]+z*step);
 const offsets=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 function tri(a,b,c,dir){const ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]),normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];if(Math.hypot(...normal)<1e-11)return;if(normal.reduce((s,v,i)=>s+v*dir[i],0)<0)[b,c]=[c,b];coords.push(...a,...b,...c);}
 for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const v=offsets.map(o=>values[index(x+o[0],y+o[1],z+o[2])]);if(v.every(a=>a>=0)||v.every(a=>a<0))continue;
  const p=offsets.map(o=>[min[0]+(x+o[0])*step,min[1]+(y+o[1])*step,min[2]+(z+o[2])*step]);
  const cut=(i,j)=>{const t=v[i]/(v[i]-v[j]);return p[i].map((a,k)=>a+(p[j][k]-a)*t);};
  for(const tet of tets){const ins=tet.filter(i=>v[i]<0),out=tet.filter(i=>v[i]>=0);if(!ins.length||!out.length)continue;const dir=[0,1,2].map(k=>out.reduce((s,i)=>s+p[i][k],0)/out.length-ins.reduce((s,i)=>s+p[i][k],0)/ins.length);
   if(ins.length===1)tri(cut(ins[0],out[0]),cut(ins[0],out[1]),cut(ins[0],out[2]),dir);
   else if(ins.length===3)tri(cut(out[0],ins[0]),cut(out[0],ins[1]),cut(out[0],ins[2]),dir);
   else{const a=cut(ins[0],out[0]),b=cut(ins[0],out[1]),c=cut(ins[1],out[0]),d=cut(ins[1],out[1]);tri(a,b,c,dir);tri(b,d,c,dir);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));return mergeVertices(g,1e-5);}
function closeBoundaries(input){const positions=[];for(let i=0;i<input.length;i+=9){const a=new THREE.Vector3(...input.slice(i,i+3)),b=new THREE.Vector3(...input.slice(i+3,i+6)),c=new THREE.Vector3(...input.slice(i+6,i+9));if(b.sub(a).cross(c.sub(a)).length()>1e-9)positions.push(...input.slice(i,i+9));}const edges=new Map(),point=k=>k.split(',').map(Number),key=p=>p.map(v=>Math.round(v*1e5)/1e5).join(',');for(let i=0;i<positions.length;i+=9){const t=[0,3,6].map(j=>Array.from(positions.slice(i+j,i+j+3)));for(let j=0;j<3;j++){const a=key(t[j]),b=key(t[(j+1)%3]);if(a===b)continue;const k=[a,b].sort().join('|');if(edges.has(k))edges.delete(k);else edges.set(k,[a,b]);}}
 const boundary=[...edges.values()],next=new Map(boundary.map(([a,b])=>[a,b])),visited=new Set();let caps=0;for(const [start] of boundary){if(visited.has(start))continue;const loop=[];let current=start;while(!visited.has(current)&&next.has(current)){visited.add(current);loop.push(point(current));current=next.get(current);}if(current!==start||loop.length<3)throw Error('Open unrepairable boundary');const center=[0,1,2].map(k=>loop.reduce((s,p)=>s+p[k],0)/loop.length);for(let i=0;i<loop.length;i++){positions.push(...loop[(i+1)%loop.length],...loop[i],...center);caps++;}}console.log('boundary cap triangles',caps);return positions;}
const models=[];
for(const [name,fn] of [['rhino',rhino],['turtle',turtle]]){const mesh=polygonise(fn),vertexCount=mesh.attributes.position.count;console.log(name,'surface vertices',vertexCount);
 let positions=closeBoundaries(simplify(mesh,220,name));
 // Shared framing; horns, ears and flippers retain their anatomical proportions.
 for(let i=0;i<positions.length;i+=3){positions[i]+=.32;if(name==='rhino')positions[i+1]+=.15;else positions[i+1]-=.13;}
 models.push({name,positions,faces:positions.length/9});console.log(name,'simplified triangles',positions.length/9);}
const count=220;if(models.some(m=>m.faces>count))throw Error('Decimation did not meet the explicit 220-face budget');
for(const model of models){const positions=splitTo(model.positions,count);fs.writeFileSync(new URL(`../public/models/${model.name}.json`,import.meta.url),JSON.stringify({name:model.name,triangles:count,positions:positions.map(v=>Math.round(v*1e6)/1e6)}));console.log('saved',model.name,count);}
