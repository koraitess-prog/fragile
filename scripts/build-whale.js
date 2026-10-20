// Original connected blue whale sculpture. References: qa/whale/REFERENCES.md.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const vertices=[],faces=[],add=p=>(vertices.push(p),vertices.length-1);
// Broad, flattened U-shaped rostrum, long substantial body, tapering peduncle.
// Forward is -X, dorsal +Y; the flukes extend horizontally along Z.
const specs=[[-3.20,-.055,.16,.40],[-2.70,-.025,.27,.57],[-1.75,0,.45,.67],[-.65,0,.53,.64],[.50,.01,.40,.44],[1.45,.015,.26,.27],[2.35,.02,.15,.14],[3.00,.025,.085,.085]];
const rings=specs.map(([x,y,ry,rz])=>Array.from({length:8},(_,j)=>{const a=(j+.5)*Math.PI/4;return add([x,y+ry*Math.cos(a),rz*Math.sin(a)]);}));
for(let r=0;r<7;r++)for(let j=0;j<8;j++){const k=(j+1)%8,a=rings[r][j],b=rings[r][k],c=rings[r+1][j],d=rings[r+1][k];faces.push({ids:[a,b,c],r,j,half:0},{ids:[b,d,c],r,j,half:1});}
const nose=add([-3.26,-.07,0]),peduncle=add([3.50,.025,0]);
for(let j=0;j<8;j++){const k=(j+1)%8;faces.push({ids:[nose,rings[0][k],rings[0][j]],tag:'nose'},{ids:[peduncle,rings[7][j],rings[7][k]],tag:'peduncle'});}
const patch=(r,j,half=0)=>faces.find(f=>f.r===r&&f.j===j&&f.half===half);
function remove(f){assert.ok(f,'missing attachment');faces.splice(faces.indexOf(f),1);}
function bridge(a,b,tag){for(let j=0;j<a.length;j++){const k=(j+1)%a.length;faces.push({ids:[a[j],a[k],b[k]],tag},{ids:[a[j],b[k],b[j]],tag});}}
function peak(f,p,tag){const [a,b,c]=f.ids,tip=add(p);remove(f);for(const ids of [[a,b,tip],[b,c,tip],[c,a,tip]])faces.push({ids,tag});}
// Relatively small, narrow pointed pectorals; no wing-like flapping pose.
for(const side of [-1,1]){
 const f=patch(2,side>0?2:4,side>0?1:0);let rim=f.ids;remove(f);
 for(const [x,y,z,r] of [[-1.02,-.32,side*.75,.10],[-.60,-.44,side*.91,.055]]){
  const next=Array.from({length:3},(_,j)=>{const a=(j+.5)*Math.PI*2/3*(side>0?1:-1);return add([x+r*Math.cos(a),y+r*.23*Math.sin(a),z+r*.5*Math.sin(a)]);});bridge(rim,next,'pectoral');rim=next;
 }
 const tip=add([-.30,-.52,side*1.02]);for(let j=0;j<3;j++)faces.push({ids:[rim[j],rim[(j+1)%3],tip],tag:'pectoral'});
}
// Broad paired horizontal flukes, swept leading edges and central trailing notch.
for(const side of [-1,1]){
 const j=side>0?1:5,a=patch(6,j),b=patch(6,j,1);let rim=[a.ids[0],a.ids[1],b.ids[1],a.ids[2]];remove(a);remove(b);
 for(const [span,leading,trailing,h] of [[.28,2.88,3.60,.045],[.60,3.02,3.66,.032],[.86,3.30,3.68,.018]]){
  let p=[[leading,.025+h,side*span],[leading,.025-h,side*span],[trailing,.025-h,side*span],[trailing,.025+h,side*span]];
  if(side<0)p=[p[1],p[0],p[3],p[2]];const next=p.map(add);bridge(rim,next,'fluke');rim=next;
 }
 const tip=add([3.82,.025,side*1.03]);for(let j=0;j<4;j++)faces.push({ids:[rim[j],rim[(j+1)%4],tip],tag:'fluke'});
}
// Small posterior dorsal, about three quarters of the distance from the snout.
{
 const f=patch(5,7);let rim=f.ids;remove(f);
 const next=[[1.85,.32,-.022],[1.85,.32,.022],[2.08,.205,0]].map(add);bridge(rim,next,'dorsal');rim=next;
 const tip=add([1.97,.40,0]);for(let j=0;j<3;j++)faces.push({ids:[rim[j],rim[(j+1)%3],tip],tag:'dorsal'});
}
// Subtle lateral eye/cheek facets remain part of the closed head surface.
for(const side of [-1,1])peak(patch(1,side>0?1:5),[-2.40,.10,side*.60],'eye-cheek');
assert.equal(vertices.length,112);assert.equal(faces.length,220);
const positions=faces.flatMap(f=>f.ids.flatMap(id=>vertices[id].map(v=>Math.round(v*1e6)/1e6))),edges=new Map();let volume=0,minArea=Infinity;
for(let i=0;i<positions.length;i+=9){const [a,b,c]=[0,3,6].map(j=>positions.slice(i+j,i+j+3)),u=b.map((v,j)=>v-a[j]),v=c.map((n,j)=>n-a[j]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];minArea=Math.min(minArea,Math.hypot(...n)/2);volume+=(a[0]*n[0]+a[1]*n[1]+a[2]*n[2])/6;const keys=[a,b,c].map(p=>p.join(','));for(let j=0;j<3;j++){const a=keys[j],b=keys[(j+1)%3],key=[a,b].sort().join('|'),e=edges.get(key)||{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(key,e);}}
assert.ok(volume>0);assert.ok(minArea>1e-6);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0),'open or inconsistently wound edge');
fs.writeFileSync(new URL('../public/models/whale.json',import.meta.url),JSON.stringify({name:'whale',triangles:220,positions}));
console.log(JSON.stringify({species:'Blue whale',scientific:'Balaenoptera musculus',vertices:112,faces:220,edges:edges.size,volume,minArea,watertight:true},null,2));
