// Original connected Sunda tiger. Reference/proportion notes: qa/tiger/REFERENCES.md.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const vertices=[],faces=[],add=p=>(vertices.push(p),vertices.length-1);
// Compact broad skull, short muzzle, substantial shoulders, tucked waist/haunch.
const specs=[[-2.08,.36,.20,.26],[-1.83,.49,.37,.40],[-1.42,.25,.46,.34],[-.91,.16,.59,.43],[.20,.10,.42,.32],[1.03,.11,.51,.40]];
const rings=specs.map(([x,y,ry,rz])=>Array.from({length:8},(_,j)=>{const a=(j+.5)*Math.PI/4;return add([x,y+ry*Math.cos(a),rz*Math.sin(a)]);}));
for(let r=0;r<5;r++)for(let j=0;j<8;j++){const k=(j+1)%8,a=rings[r][j],b=rings[r][k],c=rings[r+1][j],d=rings[r+1][k];faces.push({ids:[a,b,c],r,j,half:0},{ids:[b,d,c],r,j,half:1});}
const nose=add([-2.13,.36,0]),rump=add([1.40,.20,0]);
for(let j=0;j<8;j++){const k=(j+1)%8;faces.push({ids:[nose,rings[0][k],rings[0][j]],cap:'nose',j},{ids:[rump,rings[5][j],rings[5][k]],cap:'rump',j});}
const center=ids=>[0,1,2].map(axis=>ids.reduce((s,id)=>s+vertices[id][axis],0)/ids.length);
const patch=(r,j,half=0)=>faces.find(f=>f.r===r&&f.j===j&&f.half===half);
function remove(f){assert.ok(f,'missing attachment patch');faces.splice(faces.indexOf(f),1);}
function bridge(a,b,tag){for(let j=0;j<a.length;j++){const k=(j+1)%a.length;faces.push({ids:[a[j],a[k],b[k]],tag},{ids:[a[j],b[k],b[j]],tag});}}
function peak(f,point,tag){const tip=add(point),[a,b,c]=f.ids;remove(f);faces.push({ids:[a,b,tip],tag},{ids:[b,c,tip],tag},{ids:[c,a,tip],tag});}
// Four independently readable planted paws; shoulder and thigh remain muscular.
for(const [r,j,side,fore] of [[2,2,1,true],[2,4,-1,true],[4,2,1,false],[4,4,-1,false]]){
 const f=patch(r,j,side>0?1:0),rim=f.ids,c=center(rim),cx=fore?-.98:1.12;
 const offsets=rim.map(id=>{const p=vertices[id];return[p[0]-c[0],(p[2]-c[2])+side*.40*(p[1]-c[1])];}),extent=[0,1].map(j=>Math.max(...offsets.map(p=>Math.abs(p[j]))));
 const mid=offsets.map(p=>add([cx+p[0]/extent[0]*(fore?.13:.16),fore?-.78:-.81,side*(fore?.37:.39)+p[1]/extent[1]*.10]));
 const footX=fore?-1.08:(side>0?.82:1.03);
 const paw=offsets.map(p=>add([footX+p[0]/extent[0]*.18,-1.20,side*.40+p[1]/extent[1]*.13]));
 remove(f);bridge(rim,mid,fore?'foreleg':'hindleg');bridge(mid,paw,'paw');faces.push({ids:paw,tag:'paw'});
}
// Long tapering tail is an extension of a rump patch, not a separate tube.
{
 const f=faces.find(f=>f.cap==='rump'&&f.j===7);let rim=f.ids;remove(f);
 for(const [x,y,z,r] of [[1.55,.34,0,.105],[1.94,.05,.015,.090],[2.65,-.36,.08,.063],[2.96,-.20,.12,.050],[3.13,.04,.14,.038]]){
  const next=Array.from({length:3},(_,j)=>{const a=(j+.5)*Math.PI*2/3;return add([x,y+r*Math.cos(a),z+r*Math.sin(a)]);});bridge(rim,next,'tail');rim=next;
 }
 const tip=add([3.16,.23,.13]);for(let j=0;j<3;j++)faces.push({ids:[rim[j],rim[(j+1)%3],tip],tag:'tail'});
}
// Small rounded ear cups, rather than tall domestic-cat points.
for(const side of [-1,1]){
 const f=patch(1,side>0?0:6,side>0?1:0),rim=f.ids;remove(f);
 const bud=[[-1.78,.86,side*.23],[-1.78,.99,side*.26],[-1.78,.99,side*.37],[-1.78,.87,side*.41]];
 if(side>0)bud.reverse();
 const [a,b,c]=rim,[d,e,fv,g]=bud.map(add);
 for(const ids of [[a,b,e],[a,e,d],[b,c,fv],[b,fv,e],[c,g,fv],[c,a,g],[a,d,g]])faces.push({ids,tag:'ear'});
 const dome=add([-1.82,.94,side*.32]),next=[d,e,fv,g];for(let j=0;j<4;j++)faces.push({ids:[next[j],next[(j+1)%4],dome],tag:'ear'});
}
for(const side of [-1,1]){
 peak(patch(1,side>0?2:4),[-1.77,.27,side*.48],'cheek-ruff');
 peak(patch(0,side>0?1:5),[-2.08,.34,side*.32],'muzzle');
 peak(patch(3,side>0?0:6),[-.66,.69,side*.22],'scapula');
 peak(patch(4,side>0?1:5),[.78,.35,side*.45],'haunch');
 peak(patch(0,side>0?0:6),[-1.99,.60,side*.27],'brow');
}
peak(faces.find(f=>f.cap==='nose'&&f.j===0),[-2.20,.42,.015],'nose');
peak(faces.find(f=>f.cap==='nose'&&f.j===3),[-2.06,.08,0],'chin');
assert.equal(vertices.length,112);assert.equal(faces.length,220);
const positions=faces.flatMap(f=>f.ids.flatMap(id=>vertices[id].map(v=>Math.round(v*1e6)/1e6))),edges=new Map();let volume=0,minArea=Infinity;
for(const f of faces){const [a,b,c]=f.ids.map(id=>vertices[id]),u=b.map((v,j)=>v-a[j]),v=c.map((n,j)=>n-a[j]),n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];minArea=Math.min(minArea,Math.hypot(...n)/2);volume+=(a[0]*n[0]+a[1]*n[1]+a[2]*n[2])/6;for(let j=0;j<3;j++){const a=f.ids[j],b=f.ids[(j+1)%3],key=[a,b].sort((a,b)=>a-b).join('|'),e=edges.get(key)||{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(key,e);}}
assert.ok(volume>0);assert.ok(minArea>1e-6);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0),'open or inconsistently wound edge');
fs.writeFileSync(new URL('../public/models/tiger.json',import.meta.url),JSON.stringify({name:'tiger',triangles:220,positions}));
console.log(JSON.stringify({species:'Sunda tiger',scientific:'Panthera tigris sondaica',vertices:112,faces:220,edges:edges.size,volume,minArea,watertight:true},null,2));
