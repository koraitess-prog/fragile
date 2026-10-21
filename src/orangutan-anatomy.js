// Original editable sculpture, not a scan. +Z faces forward, +Y is up.
// Rings are allocated to anatomy rather than redistributed by a decimator.
import {Vector3,Quaternion} from 'three';
const V=p=>new Vector3(...p),round=p=>p.map(v=>Math.round(v*1e6)/1e6);
export const orangutanGround=-1.48;
export function createOrangutanAnatomy(){
 const vertices=[],faces=[],tags=[],arms=[],legs=[];
 const add=(p,tag={part:'body'})=>(vertices.push(round(p)),tags.push(tag),vertices.length-1);
 const specs=[[-.58,.43,.30],[-.02,.60,.40],[.65,.67,.35],[.90,.29,.25],[1.25,.62,.32],[1.60,.37,.26]];
 const rings=specs.map(([y,rx,rz],r)=>Array.from({length:8},(_,j)=>{
  const a=j*Math.PI/4,p=[rx*Math.sin(a),y,rz*Math.cos(a)];
  if(r===3){if(j===0)p[2]=.42;if(j===1||j===7)p[2]=.27;}
  if(r===4){if(j===0)p[2]=.49;if(j===1||j===7){p[0]*=.73;p[1]=1.28;p[2]=.38;}if(j===2||j===6)p[2]=.06;}
  if(r===5){if(j===0){p[1]=1.53;p[2]=.36;}if(j===1||j===7){p[1]=1.64;p[2]=.27;}}
  return add(p,{part:r>=4?'head':'body',ring:r});
 }));
 for(let r=0;r<5;r++)for(let j=0;j<8;j++){const k=(j+1)%8,[a,b,c,d]=[rings[r][j],rings[r][k],rings[r+1][j],rings[r+1][k]];faces.push({ids:[a,b,c],r,j,half:0},{ids:[b,d,c],r,j,half:1});}
 const bottom=add([0,-.88,0]),crown=add([0,1.72,-.015],{part:'head'});
 for(let j=0;j<8;j++){const k=(j+1)%8;faces.push({ids:[bottom,rings[0][k],rings[0][j]],cap:'bottom',j},{ids:[crown,rings[5][j],rings[5][k]]});}
 const center=ids=>[0,1,2].map(k=>ids.reduce((s,i)=>s+vertices[i][k],0)/ids.length);
 const remove=f=>faces.splice(faces.indexOf(f),1);
 function cut(r,j){const k=(j+1)%8;for(const half of [0,1])remove(faces.find(f=>f.r===r&&f.j===j&&f.half===half));return[rings[r][j],rings[r][k],rings[r+1][k],rings[r+1][j]];}
 function bridge(a,b,flip=false){for(let j=0;j<4;j++){const k=(j+1)%4;if(flip)faces.push({ids:[a[j],a[k],b[j]]},{ids:[a[k],b[k],b[j]]});else faces.push({ids:[a[j],a[k],b[k]]},{ids:[a[j],b[k],b[j]]});}}
 function cap(rim){faces.push({ids:[rim[0],rim[1],rim[2]]},{ids:[rim[0],rim[2],rim[3]]});}
 function align(points,previous){
  const a=V(center(previous)),b=points.reduce((s,p)=>s.add(V(p)),new Vector3()).multiplyScalar(.25);let best=null,cost=Infinity;
  for(const direction of [1])for(let shift=0;shift<4;shift++){const order=Array.from({length:4},(_,i)=>((shift+direction*i)%4+4)%4),c=order.reduce((sum,j,i)=>sum+V(vertices[previous[i]]).sub(a).normalize().distanceToSquared(V(points[j]).sub(b).normalize()),0);if(c<cost){cost=c;best=order;}}
  return best.map(i=>points[i]);
 }
 function section(p,direction,rx,rz,tag,previous){
  const q=new Quaternion().setFromUnitVectors(new Vector3(0,-1,0),V(direction).normalize());
  const points=Array.from({length:4},(_,j)=>{const a=(j+.5)*Math.PI/2,off=new Vector3(rx*Math.cos(a),0,rz*Math.sin(a)).applyQuaternion(q);return V(p).add(off).toArray();});
  return align(points,previous).map(p=>add(p,tag));
 }
 for(const side of [1,-1]){
  const rim=cut(1,side>0?1:6),root=[side*.68,.65,.08],elbow=[side*1.16,-.18,.10],wrist=[side*1.22,-1.16,.29],hand=[side*1.21,-1.42,.35];
  const upper=elbow.map((v,k)=>v-root[k]),lower=wrist.map((v,k)=>v-elbow[k]);
  const upperCenter=[side*.90,.50,.08];
  const arm={side,root,elbow,wrist,hand};arms.push(arm);
  let previous=rim;
  for(const [ring,p,direction,rx,rz] of [[0,upperCenter,[side,0,0],.21,.22],[1,elbow,upper,.18,.19],[2,wrist,lower,.12,.14],[3,hand,[0,-1,0],.17,.085]]){
   const next=section(p,direction,rx,rz,{part:'arm',side,ring},previous);bridge(previous,next,ring===0&&side>0);previous=next;
  }
  cap(previous);
 }
 for(const side of [1,-1]){
  const j=side>0?1:5;for(const n of [j,j+1])remove(faces.find(f=>f.cap==='bottom'&&f.j===n));
  const rim=[bottom,rings[0][j+2],rings[0][j+1],rings[0][j]],root=[side*.34,-.55,.04],knee=[side*.53,-.94,.31],ankle=[side*.42,-1.30,.13],toe=[side*.46,-1.40,.43];
  const upper=knee.map((v,k)=>v-root[k]),lower=ankle.map((v,k)=>v-knee[k]);
  legs.push({side,root,knee,ankle,toe});let previous=rim;
  for(const [ring,p,direction,rx,rz] of [[0,knee,upper,.19,.18],[1,ankle,V(lower).normalize().add(V(toe).sub(V(ankle)).normalize()).normalize().toArray(),.115,.12]]){
   const next=section(p,direction,rx,rz,{part:'leg',side,ring},previous);bridge(previous,next,ring===0&&side>0);previous=next;
  }
  // Broad curled toe plane, with a separate medial hallux peak below.
  const foot=align([[-.13,-.08],[.13,-.08],[.13,.08],[-.13,.08]].map(([x,y])=>[toe[0]+x,toe[1]+y,toe[2]]),previous).map(p=>add(p,{part:'leg',side,ring:2}));
  bridge(previous,foot);cap(foot);
 }
 function peak(f,p,tag){const tip=add(p,tag),[a,b,c]=f.ids;remove(f);faces.push({ids:[a,b,tip]},{ids:[b,c,tip]},{ids:[c,a,tip]});}
 // Six vertices complete the 112-vertex closed surface: opposing thumbs,
 // grasping big toes, projecting muzzle and a compact chin/throat silhouette.
 for(const side of [1,-1]){
  const hand=faces.filter(f=>f.ids.every(i=>tags[i].part==='arm'&&tags[i].side===side&&tags[i].ring>=2)).sort((a,b)=>side*(center(a.ids)[0]-center(b.ids)[0]))[0];
  peak(hand,[side*1.035,-1.29,.38],{part:'arm',side,ring:3});
  const foot=faces.filter(f=>f.ids.every(i=>tags[i].part==='leg'&&tags[i].side===side&&tags[i].ring>=1)).sort((a,b)=>side*(center(a.ids)[0]-center(b.ids)[0]))[0];
  peak(foot,[side*.20,-1.40,.46],{part:'leg',side,ring:2});
 }
 peak(faces.find(f=>f.r===4&&f.j===0&&f.half===0),[.18,1.43,.44],{part:'head'});
 peak(faces.find(f=>f.r===4&&f.j===7&&f.half===1),[-.18,1.43,.44],{part:'head'});
 // Orient the connected triangle surface once. No separate overlapping shells.
 const edgeMap=new Map();
 faces.forEach((f,i)=>f.ids.forEach((a,j)=>{const b=f.ids[(j+1)%3],key=[a,b].sort((a,b)=>a-b).join('|');if(!edgeMap.has(key))edgeMap.set(key,[]);edgeMap.get(key).push({i,a,b});}));
 const signs=new Map([[0,1]]),queue=[0];
 while(queue.length){const i=queue.shift(),f=faces[i];for(let j=0;j<3;j++){const a=f.ids[j],b=f.ids[(j+1)%3],edges=edgeMap.get([a,b].sort((a,b)=>a-b).join('|'));if(edges.length!==2)throw Error('Non-manifold orangutan edge');const other=edges.find(e=>e.i!==i),sign=signs.get(i)*(other.a===a?-1:1);if(!signs.has(other.i)){signs.set(other.i,sign);queue.push(other.i);}else if(signs.get(other.i)!==sign)throw Error('Non-orientable sculpture');}}
 faces.forEach((f,i)=>{if(signs.get(i)<0)f.ids.reverse();});
 let volume=0;for(const f of faces){const[a,b,c]=f.ids.map(i=>V(vertices[i]));volume+=a.dot(b.cross(c))/6;}if(volume<0)faces.forEach(f=>f.ids.reverse());
 return{vertices,faces:faces.map(f=>f.ids),tags,arms,legs};
}
export const orangutanAnatomy=createOrangutanAnatomy();
