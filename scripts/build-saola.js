// Original connected saola sculpture; factual/inferred notes in qa/saola/REFERENCES.md.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const vertices=[],faces=[],add=p=>(vertices.push(p),vertices.length-1);
// A narrow sloping face and substantial, slightly higher-backed bovid torso.
const specs=[[-2.03,.30,.17,.145],[-1.64,.67,.31,.235],[-1.14,.45,.46,.28],[-.74,.20,.53,.39],[.25,.25,.59,.43],[1.03,.25,.55,.36]];
const rings=specs.map(([x,y,ry,rz])=>Array.from({length:8},(_,j)=>{const a=(j+.5)*Math.PI/4;return add([x,y+ry*Math.cos(a),rz*Math.sin(a)]);}));
for(let r=0;r<5;r++)for(let j=0;j<8;j++){const k=(j+1)%8,a=rings[r][j],b=rings[r][k],c=rings[r+1][j],d=rings[r+1][k];faces.push({ids:[a,b,c],r,j,half:0},{ids:[b,d,c],r,j,half:1});}
const nose=add([-2.20,.24,0]),rump=add([1.43,.27,0]);
for(let j=0;j<8;j++){const k=(j+1)%8;faces.push({ids:[nose,rings[0][k],rings[0][j]],cap:'nose',j},{ids:[rump,rings[5][j],rings[5][k]],cap:'rump',j});}
const center=ids=>[0,1,2].map(axis=>ids.reduce((s,id)=>s+vertices[id][axis],0)/ids.length);
const patch=(r,j,half=0)=>faces.find(f=>f.r===r&&f.j===j&&f.half===half);
function remove(f){assert.ok(f,'missing attachment patch');faces.splice(faces.indexOf(f),1);}
function bridge(a,b,tag){for(let j=0;j<a.length;j++){const k=(j+1)%a.length;faces.push({ids:[a[j],a[k],b[k]],tag},{ids:[a[j],b[k],b[j]],tag});}}
function peak(f,point,tag){const tip=add(point),[a,b,c]=f.ids;remove(f);faces.push({ids:[a,b,tip],tag},{ids:[b,c,tip],tag},{ids:[c,a,tip],tag});}
// Long slender lower legs, compact hoof caps, modest fore/hind joint offsets.
for(const [r,j,side,fore] of [[2,2,1,true],[2,4,-1,true],[4,2,1,false],[4,4,-1,false]]){
 const f=patch(r,j,side>0?1:0),rim=f.ids,c=center(rim),cx=fore?-.84:1.14;
 const offsets=rim.map(id=>{const p=vertices[id];return[p[0]-c[0],p[2]-c[2]+side*.4*(p[1]-c[1])];}),extent=[0,1].map(j=>Math.max(...offsets.map(p=>Math.abs(p[j]))));
 const mid=offsets.map(p=>add([cx+p[0]/extent[0]*.065,fore?-.65:-.73,side*.31+p[1]/extent[1]*.055]));
 const hoof=offsets.map(p=>add([(fore?-.88:1.02)+p[0]/extent[0]*.095,-1.40,side*.32+p[1]/extent[1]*.065]));
 remove(f);bridge(rim,mid,fore?'foreleg':'hindleg');bridge(mid,hoof,'lower-leg');faces.push({ids:hoof,tag:'hoof'});
}
// Two unbranched spindle horns. Equal axes and a slight natural divergence.
for(const side of [-1,1]){
 const f=patch(1,side>0?0:6,side>0?1:0);let rim=f.ids;remove(f);
 for(const [x,y,z,r] of [[-1.54,1.00,side*.14,.062],[-1.24,1.57,side*.16,.034]]){
  const next=Array.from({length:3},(_,j)=>{const a=(j+.5)*Math.PI*2/3*(side>0?1:-1);return add([x+r*Math.cos(a),y,z+r*Math.sin(a)]);});bridge(rim,next,'horn');rim=next;
 }
 const tip=add([-.94,2.18,side*.18]);for(let j=0;j<3;j++)faces.push({ids:[rim[j],rim[(j+1)%3],tip],tag:'horn'});
}
// Broad oval mobile ears emerge laterally below the horn bases.
for(const side of [-1,1]){
 const f=patch(1,side>0?1:5,side>0?1:0),rim=f.ids;remove(f);
 const bud=Array.from({length:6},(_,j)=>{const a=j*Math.PI/3;return[-1.45+.06*Math.cos(a)+.13*Math.sin(a),1.04+.16*Math.cos(a)-.08*Math.sin(a),side*(.53+.28*Math.cos(a))];});
 if(side<0)bud.reverse();const next=bud.map(add);
 for(let j=0;j<3;j++){const a=rim[j],b=rim[(j+1)%3],d=next[2*j],e=next[2*j+1],g=next[(2*j+2)%6];for(const ids of [[a,b,g],[a,g,e],[a,e,d]])faces.push({ids,tag:'ear'});}
 const dome=add([-1.49,1.05,side*.56]);for(let j=0;j<6;j++)faces.push({ids:[next[j],next[(j+1)%6],dome],tag:'ear'});
}
// Short hanging tail, with a slightly fuller distal tuft made of the same mesh.
{
 const f=faces.find(f=>f.cap==='rump'&&f.j===7);let rim=f.ids;remove(f);
 for(const [x,y,z,r] of [[1.50,.13,0,.065],[1.62,-.25,.02,.055]]){
  const next=Array.from({length:3},(_,j)=>{const a=(j+.5)*Math.PI*2/3;return add([x+r*Math.cos(a),y,z+r*Math.sin(a)]);});bridge(rim,next,'tail');rim=next;
 }
 const tip=add([1.60,-.43,.02]);for(let j=0;j<3;j++)faces.push({ids:[rim[j],rim[(j+1)%3],tip],tag:'tail'});
}
for(const side of [-1,1]){
 peak(patch(0,side>0?1:5),[-1.91,.43,side*.23],'muzzle-gland');
}
peak(patch(3,7),[-.47,.77,0],'shoulder');
assert.equal(vertices.length,112);assert.equal(faces.length,220);
const positions=faces.flatMap(f=>f.ids.flatMap(id=>vertices[id].map(v=>Math.round(v*1e6)/1e6))),edges=new Map();let volume=0,minArea=Infinity;
for(const f of faces){const [a,b,c]=f.ids.map(id=>vertices[id]),u=b.map((v,j)=>v-a[j]),v=c.map((n,j)=>n-a[j]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];minArea=Math.min(minArea,Math.hypot(...n)/2);volume+=(a[0]*n[0]+a[1]*n[1]+a[2]*n[2])/6;for(let j=0;j<3;j++){const a=f.ids[j],b=f.ids[(j+1)%3],key=[a,b].sort((a,b)=>a-b).join('|'),e=edges.get(key)||{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(key,e);}}
assert.ok(volume>0);assert.ok(minArea>1e-6);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0),'open or inconsistently wound edge');
fs.writeFileSync(new URL('../public/models/saola.json',import.meta.url),JSON.stringify({name:'saola',triangles:220,positions}));
console.log(JSON.stringify({species:'Saola',scientific:'Pseudoryx nghetinhensis',vertices:112,faces:220,edges:edges.size,volume,minArea,watertight:true},null,2));
