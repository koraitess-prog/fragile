// Original closed oceanic manta sculpture. References: qa/manta/REFERENCES.md.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const vertices=[],faces=[],add=p=>(vertices.push(p),vertices.length-1);
// -X is forward, +Y is dorsal; the disc spans Z. Blunt terminal mouth.
const specs=[[-1.12,.01,.14,.46],[-1.03,.03,.24,.66],[-.95,.03,.28,.75],[.75,.01,.19,.68],[.98,0,.10,.43],[1.10,0,.055,.14]];
const rings=specs.map(([x,y,ry,rz])=>Array.from({length:8},(_,j)=>{const a=(j+.5)*Math.PI/4;return add([x,y+ry*Math.cos(a),rz*Math.sin(a)]);}));
for(let r=0;r<5;r++)for(let j=0;j<8;j++){const k=(j+1)%8,a=rings[r][j],b=rings[r][k],c=rings[r+1][j],d=rings[r+1][k];faces.push({ids:[a,b,c],r,j,half:0},{ids:[b,d,c],r,j,half:1});}
const nose=add([-1.19,.01,0]),rump=add([1.23,0,0]);
for(let j=0;j<8;j++){const k=(j+1)%8;faces.push({ids:[nose,rings[0][k],rings[0][j]],cap:'nose',j},{ids:[rump,rings[5][j],rings[5][k]],cap:'rump',j});}
const patch=(r,j,half=0)=>faces.find(f=>f.r===r&&f.j===j&&f.half===half);
function remove(f){assert.ok(f,'missing attachment');faces.splice(faces.indexOf(f),1);}
function bridge(a,b,tag){for(let j=0;j<a.length;j++){const k=(j+1)%a.length;faces.push({ids:[a[j],a[k],b[k]],tag},{ids:[a[j],b[k],b[j]],tag});}}
// Broad pectoral hydrofoils, swept tips, tapering thickness; shared roots.
for(const side of [-1,1]){
 const j=side>0?1:5,a=patch(2,j),b=patch(2,j,1);let rim=[a.ids[0],a.ids[1],b.ids[1],a.ids[2]];remove(a);remove(b);
 for(const [span,leading,trailing,thickness,y] of [[.98,-.88,.85,.075,.005],[1.62,-.66,.72,.05,.01],[2.31,-.35,.63,.028,.02],[2.83,.06,.42,.013,.025]]){
  let points=[[leading,y+thickness,side*span],[leading,y-thickness,side*span],[trailing,y-thickness,side*span],[trailing,y+thickness,side*span]];
  if(side<0)points=[points[1],points[0],points[3],points[2]];
  const next=points.map(add);bridge(rim,next,'pectoral');rim=next;
 }
 const tip=add([.24,.035,side*3.15]);for(let j=0;j<4;j++)faces.push({ids:[rim[j],rim[(j+1)%4],tip],tag:'pectoral'});
}
// Two forward curled cephalic lobes, rather than a stingray's pointed snout.
for(const side of [-1,1]){
 const f=faces.find(f=>f.cap==='nose'&&f.j===(side>0?1:5));let rim=f.ids;remove(f);
 for(const [x,y,z,r] of [[-1.25,.025,side*.43,.105],[-1.52,.08,side*.48,.075],[-1.65,.16,side*.45,.045]]){
  const next=Array.from({length:3},(_,j)=>{const a=(j+.5)*Math.PI*2/3*(side>0?1:-1);return add([x,y+r*Math.cos(a),z+r*Math.sin(a)]);});bridge(rim,next,'cephalic');rim=next;
 }
 const tip=add([-1.66,.21,side*.39]);for(let j=0;j<3;j++)faces.push({ids:[rim[j],rim[(j+1)%3],tip],tag:'cephalic'});
}
// Slender non-propulsive tail. Small dorsal fin at the tail base.
{
 const f=faces.find(f=>f.cap==='rump'&&f.j===3);let rim=f.ids;remove(f);
 for(const [x,y,z,r] of [[1.65,-.035,0,.035],[2.50,-.06,.025,.019]]){
  const next=Array.from({length:3},(_,j)=>{const a=(j+.5)*Math.PI*2/3;return add([x,y+r*Math.cos(a),z+r*Math.sin(a)]);});bridge(rim,next,'tail');rim=next;
 }
 const tip=add([3.20,-.085,.045]);for(let j=0;j<3;j++)faces.push({ids:[rim[j],rim[(j+1)%3],tip],tag:'tail'});
}
{
 const f=patch(4,7),[a,b,c]=f.ids,tip=add([1.02,.30,0]);remove(f);for(const ids of [[a,b,tip],[b,c,tip],[c,a,tip]])faces.push({ids,tag:'dorsal'});
}
assert.equal(vertices.length,112);assert.equal(faces.length,220);
const positions=faces.flatMap(f=>f.ids.flatMap(id=>vertices[id].map(v=>Math.round(v*1e6)/1e6))),edges=new Map();let volume=0,minArea=Infinity;
for(let i=0;i<positions.length;i+=9){const [a,b,c]=[0,3,6].map(j=>positions.slice(i+j,i+j+3)),u=b.map((v,j)=>v-a[j]),v=c.map((n,j)=>n-a[j]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];minArea=Math.min(minArea,Math.hypot(...n)/2);volume+=(a[0]*n[0]+a[1]*n[1]+a[2]*n[2])/6;const keys=[a,b,c].map(p=>p.join(','));for(let j=0;j<3;j++){const a=keys[j],b=keys[(j+1)%3],key=[a,b].sort().join('|'),e=edges.get(key)||{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(key,e);}}
assert.ok(volume>0);assert.ok(minArea>1e-6);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0),'open or inconsistently wound edge');
fs.writeFileSync(new URL('../public/models/manta.json',import.meta.url),JSON.stringify({name:'manta',triangles:220,positions}));
console.log(JSON.stringify({species:'Oceanic manta ray',scientific:'Mobula birostris',vertices:112,faces:220,edges:edges.size,volume,minArea,watertight:true},null,2));

