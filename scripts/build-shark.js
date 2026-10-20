// Original connected Sphyrna mokarran sculpture. See qa/hammerhead/REFERENCES.md.
// Same 112 shared vertices / 220 persistent triangles as the approved collection.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const vertices=[],faces=[],add=p=>(vertices.push(p),vertices.length-1);
const specs=[[-2.03,.13,.23],[-1.70,.18,.26],[-1.10,.35,.34],[-.45,.39,.33],[.25,.29,.24],[.95,.20,.15],[1.55,.11,.08],[2.05,.065,.045]];
const rings=specs.map(([x,ry,rz])=>Array.from({length:8},(_,j)=>{const a=(j+.5)*Math.PI/4;return add([x,ry*Math.cos(a),rz*Math.sin(a)]);}));
for(let r=0;r<7;r++)for(let j=0;j<8;j++){const k=(j+1)%8,a=rings[r][j],b=rings[r][k],c=rings[r+1][j],d=rings[r+1][k];faces.push({ids:[a,b,c],r,j,half:0},{ids:[b,d,c],r,j,half:1});}
const nose=add([-2.115,-.015,0]),peduncle=add([2.35,.06,0]);
for(let j=0;j<8;j++){const k=(j+1)%8;faces.push({ids:[nose,rings[0][k],rings[0][j]],tag:'nose'},{ids:[peduncle,rings[7][j],rings[7][k]],tag:'peduncle'});}
const patch=(r,j,half=0)=>faces.find(f=>f.r===r&&f.j===j&&f.half===half);
const remove=fs=>{for(const f of fs){assert.ok(f,'missing attachment patch');faces.splice(faces.indexOf(f),1);}};
function bridge(a,b,tag){for(let i=0;i<a.length;i++){const k=(i+1)%a.length;faces.push({ids:[a[i],a[k],b[k]],tag},{ids:[a[i],b[k],b[i]],tag});}}
function peak(f,p,tag){const [a,b,c]=f.ids,tip=add(p);remove([f]);faces.push({ids:[a,b,tip],tag},{ids:[b,c,tip],tag},{ids:[c,a,tip],tag});}
function fin(f,points,tip,tag){const a=f.ids;remove([f]);const b=points.map(add);bridge(a,b,tag);const v=add(tip);for(let j=0;j<3;j++)faces.push({ids:[b[j],b[(j+1)%3],v],tag});}
// Broad, flattened cephalofoil: blunt outer ends rather than pointed wings.
for(const side of [-1,1]){
 const j=side>0?1:5,a=patch(0,j),b=patch(0,j,1);let rim=[a.ids[0],a.ids[1],b.ids[1],a.ids[2]];remove([a,b]);
 for(const [span,front,back,height] of [[.46,-2.17,-1.80,.105],[.70,-2.13,-1.88,.080]]){
  const next=rim.map((id,k)=>add([k<2?front:back,side*(k===0||k===3?1:-1)*height,side*span]));bridge(rim,next,'hammer');rim=next;
 }
 const caps=[{ids:[rim[0],rim[1],rim[2]],tag:'hammer-end'},{ids:[rim[0],rim[2],rim[3]],tag:'hammer-end'}];faces.push(...caps);
 peak(caps[0],[-2.05,0,side*.715],`eye-${side}`);
}
// Long swept pectorals, smaller falcate pelvic fins; all attached to body patches.
for(const side of [-1,1]){
 const j=side>0?2:5;
 const f=patch(2,j,side>0?1:0),c=f.ids.map(id=>vertices[id]);
 fin(f,c.map((p,k)=>[-.34+(p[0]+.75)*.65,-.20+(p[1]+.2)*.12,side*(.57+(k===1?.05:0))]),[.12,-.38,side*.86],`pectoral-${side}`);
 const g=patch(4,j,side>0?1:0),d=g.ids.map(id=>vertices[id]);
 fin(g,d.map((p,k)=>[.92+(p[0]-.6)*.55,-.21+(p[1]+.15)*.12,side*(.31+(k===1?.025:0))]),[1.30,-.34,side*.45],`pelvic-${side}`);
}
// Tall recurved first dorsal: a broad root, swept shoulder and pointed apex.
{
 const a=patch(2,7),b=patch(2,7,1),rim=[a.ids[0],a.ids[1],b.ids[1],a.ids[2]];remove([a,b]);
 const next=[[-.61,.94,-.035],[-.61,.94,.035],[-.32,.57,.025],[-.32,.57,-.025]].map(add);bridge(rim,next,'dorsal');
 const tip=add([-.34,1.23,0]);for(let j=0;j<4;j++)faces.push({ids:[next[j],next[(j+1)%4],tip],tag:'dorsal'});
}
peak(patch(5,7),[1.38,.49,0],'second-dorsal');
peak(patch(5,3),[1.49,-.40,0],'anal');
// Heterocercal caudal fin lies in the VERTICAL plane. Upper lobe is longer.
const f=patch(6,7),a=f.ids.map(id=>vertices[id]);
fin(f,a.map((p,k)=>[2.27+(k===2?.19:0),.62+(k===1?.08:0),(k===0?-.028:k===1?.028:0)]),[3.05,1.16,0],'caudal-upper');
peak(patch(6,3,1),[2.65,-.64,0],'caudal-lower');
assert.equal(vertices.length,112);assert.equal(faces.length,220);
const positions=faces.flatMap(f=>f.ids.flatMap(id=>vertices[id].map(v=>Math.round(v*1e6)/1e6)));
const edges=new Map();let volume=0,minArea=Infinity;
for(const f of faces){const [a,b,c]=f.ids.map(id=>vertices[id]),u=b.map((v,j)=>v-a[j]),v=c.map((n,j)=>n-a[j]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];minArea=Math.min(minArea,Math.hypot(...n)/2);volume+=(a[0]*n[0]+a[1]*n[1]+a[2]*n[2])/6;for(let j=0;j<3;j++){const a=f.ids[j],b=f.ids[(j+1)%3],key=[a,b].sort((a,b)=>a-b).join('|'),e=edges.get(key)||{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(key,e);}}
assert.ok(volume>0);assert.ok(minArea>1e-6);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0),'open or inconsistently wound edge');
fs.writeFileSync(new URL('../public/models/shark.json',import.meta.url),JSON.stringify({name:'shark',triangles:220,positions}));
console.log(JSON.stringify({species:'Great hammerhead',scientific:'Sphyrna mokarran',vertices:112,faces:220,edges:edges.size,volume,minArea,watertight:true},null,2));
