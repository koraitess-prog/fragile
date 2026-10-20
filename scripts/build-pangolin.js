// Original, explicitly connected sculpture. References documented in
// qa/phase-4/REFERENCES.md. No third-party mesh or other species regenerated.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const vertices=[],faces=[],add=p=>(vertices.push(p),vertices.length-1);
// Preserve the body and tail root; extend the two existing distal tail sections.
// A broad taper keeps the Chinese pangolin's substantial tail silhouette.
const ringSpecs=[[-2.34,-.58,.065,.075],[-1.98,-.35,.22,.23],[-1.48,-.12,.40,.39],[-.95,0,.66,.58],[-.05,.05,.81,.69],[.8,-.04,.66,.57],[1.45,-.54,.25,.40],[2.80,-.98,.16,.23]];
const rings=ringSpecs.map(([x,y,ry,rz],r)=>Array.from({length:10},(_,j)=>{const theta=j*Math.PI/5;return add([x,y+ry*Math.cos(theta),rz*Math.sin(theta)]);}));
for(let r=0;r<rings.length-1;r++)for(let j=0;j<10;j++){
 const k=(j+1)%10,a=rings[r][j],b=rings[r][k],c=rings[r+1][j],d=rings[r+1][k];
 faces.push({ids:[a,b,c],r,j,half:0},{ids:[b,d,c],r,j,half:1});
}
const nose=add([-2.52,-.64,0]),tail=add([3.95,-1.26,0]);
for(let j=0;j<10;j++){const k=(j+1)%10;faces.push({ids:[nose,rings[0][k],rings[0][j]]},{ids:[tail,rings.at(-1)[j],rings.at(-1)[k]]});}
const center=ids=>[0,1,2].map(axis=>ids.reduce((s,i)=>s+vertices[i][axis],0)/ids.length);
const footSides=[];
// Extrude four lower flank patches into short, bent, claw-bearing legs.
for(const [r,j,side,fore] of [[2,3,1,true],[2,6,-1,true],[4,3,1,false],[4,6,-1,false]]){
 const index=faces.findIndex(f=>f.r===r&&f.j===j&&f.half===(fore?1:0));
 const [patch]=faces.splice(index,1),base=patch.ids,c=center(base),cx=fore?-.99:.79;
 const mid=base.map(id=>{const p=vertices[id];return add([cx+.06+(p[0]-c[0])*.55,-.94+(p[1]-c[1])*.18,side*.66+(p[2]-c[2])*.6]);});
 const foot=base.map(id=>{const p=vertices[id];return add([cx-.06+(p[0]-c[0])*.65,-1.34,side*.68+(p[2]-c[2])*.9]);});
 for(const [a,b] of [[base,mid],[mid,foot]])for(let k=0;k<3;k++){
  const n=(k+1)%3,f1={ids:[a[k],a[n],b[n]]},f2={ids:[a[k],b[n],b[k]]};faces.push(f1,f2);if(fore&&a===mid)footSides.push(f1,f2);
 }
 faces.push({ids:foot});
}
function normal(ids){const [a,b,c]=ids.map(i=>vertices[i]),u=b.map((v,i)=>v-a[i]),v=c.map((x,i)=>x-a[i]);const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]],length=Math.hypot(...n);return n.map(x=>x/length);}
function peak(face,distance,offset=[0,0,0]){const c=center(face.ids),n=normal(face.ids),tip=add(c.map((v,i)=>v+n[i]*distance+offset[i])),[a,b,d]=face.ids;faces.splice(faces.indexOf(face),1,{ids:[a,b,tip]},{ids:[b,d,tip]},{ids:[d,a,tip]});}
// Compact ear pinnae; two dorsal armor facets; a foreclaw on each front foot.
for(const j of [1,8])peak(faces.find(f=>f.r===1&&f.j===j&&f.half===1),.10,[0,.035,0]);
for(const [r,j] of [[3,0],[4,9]])peak(faces.find(f=>f.r===r&&f.j===j&&f.half===0),.055);
for(const side of [-1,1]){const candidates=footSides.filter(f=>center(f.ids)[2]*side>0);candidates.sort((a,b)=>normal(a.ids)[0]-normal(b.ids)[0]);peak(candidates[0],.12,[-.06,0,0]);}
const positions=faces.flatMap(f=>f.ids.flatMap(id=>vertices[id].map(v=>Math.round(v*1e6)/1e6)));
assert.equal(vertices.length,112);assert.equal(faces.length,220);
let volume=0;const edges=new Map();for(const f of faces){const [a,b,c]=f.ids.map(i=>vertices[i]);volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;for(let k=0;k<3;k++){const a=f.ids[k],b=f.ids[(k+1)%3],key=[a,b].sort((a,b)=>a-b).join(',');const e=edges.get(key)||{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(key,e);}}
assert.ok(volume>0);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0));
fs.writeFileSync(new URL('../public/models/pangolin.json',import.meta.url),JSON.stringify({name:'pangolin',triangles:faces.length,positions}));
console.log(JSON.stringify({animal:'Chinese pangolin',scientific:'Manis pentadactyla',vertices:vertices.length,triangles:faces.length,edges:edges.size,volume,watertight:true,originalMesh:true},null,2));
