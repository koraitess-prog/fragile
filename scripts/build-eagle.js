// Original connected Philippine eagle sculpture; see qa/eagle/README.md.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const vertices=[],faces=[],add=p=>(vertices.push(p),vertices.length-1);
const specs=[[-.82,.25,.12,-.20],[-.44,.39,.31,-.02],[.02,.46,.35,0],[.48,.34,.27,.02],[.82,.24,.21,.05],[1.17,.28,.24,.06]];
const rings=specs.map(([y,rx,rz,cz])=>Array.from({length:8},(_,j)=>{const t=j*Math.PI/4;return add([rx*Math.sin(t),y,cz+rz*Math.cos(t)]);}));
for(let r=0;r<5;r++)for(let j=0;j<8;j++){const k=(j+1)%8,a=rings[r][j],b=rings[r][k],c=rings[r+1][j],d=rings[r+1][k];faces.push({ids:[a,b,c],r,j,half:0},{ids:[b,d,c],r,j,half:1});}
const bottom=add([0,-1.34,-.33]),top=add([0,1.36,.015]);
for(let j=0;j<8;j++){const k=(j+1)%8;faces.push({ids:[bottom,rings[0][k],rings[0][j]],cap:'bottom',j},{ids:[top,rings[5][j],rings[5][k]],cap:'top',j});}
const center=ids=>[0,1,2].map(axis=>ids.reduce((s,id)=>s+vertices[id][axis],0)/ids.length);
function remove(patches){for(const patch of patches)faces.splice(faces.indexOf(patch),1);}
function bridge(a,b,tag){for(let j=0;j<a.length;j++){const k=(j+1)%a.length;faces.push({ids:[a[j],a[k],b[k]],tag},{ids:[a[j],b[k],b[j]],tag});}}
function peak(face,point,tag){const tip=add(point),[a,b,c]=face.ids;remove([face]);faces.push({ids:[a,b,tip],tag},{ids:[b,c,tip],tag},{ids:[c,a,tip],tag});}
// Broad wings held in a partial spread. Lofted cross-sections remain closed.
for(const side of [-1,1]){
 const j=side>0?1:6,a=faces.find(f=>f.r===2&&f.j===j&&f.half===0),b=faces.find(f=>f.r===2&&f.j===j&&f.half===1);
 let ring=[a.ids[0],a.ids[1],b.ids[1],a.ids[2]];remove([a,b]);
 for(const [x,y,h,thickness] of [[.85,.38,.43,.12],[1.55,.25,.55,.10],[2.12,.02,.42,.065]]){
  let points=[[side*x,y-h,.12],[side*x,y-h,-thickness],[side*x,y+h,-thickness],[side*x,y+h,.12]];
  if(side<0)points=[points[1],points[0],points[3],points[2]];const next=points.map(add);bridge(ring,next,`wing-${side}`);ring=next;
 }
 const tip=add([side*2.48,-.18,.015]);for(let k=0;k<4;k++)faces.push({ids:[ring[k],ring[(k+1)%4],tip],tag:`wing-${side}`});
 // Three broad primary-feather separations, rather than decorative loose lines.
 const candidates=faces.filter(f=>f.tag===`wing-${side}`&&center(f.ids)[1]<-.02&&Math.abs(center(f.ids)[0])>1.05).sort((a,b)=>Math.abs(center(a.ids)[0])-Math.abs(center(b.ids)[0]));
 for(const index of [0,3,6]){const f=candidates[index],c=center(f.ids);peak(f,[c[0]+side*.10,Math.min(...f.ids.map(id=>vertices[id][1]))-.16,c[2]+.025],`primary-${side}`);}
}
// Deep bill, forward culmen and downward hooked tip.
const bill=faces.find(f=>f.r===4&&f.j===7&&f.half===1);let rim=bill.ids;remove([bill]);
for(const [z,y,scale] of [[.46,1.04,1.0],[.78,.99,.70]]){const c=center(rim),next=rim.map(id=>add([(vertices[id][0]-c[0])*scale,y+(vertices[id][1]-c[1])*scale,z+(vertices[id][2]-c[2])*.15]));bridge(rim,next,'bill');rim=next;}
const hook=add([0,.76,.74]);for(let j=0;j<3;j++)faces.push({ids:[rim[j],rim[(j+1)%3],hook],tag:'bill'});
// Nape crest is part of the same surface, with four readable feather tips.
for(const j of [2,3,4,5]){const f=faces.find(f=>f.cap==='top'&&f.j===j),c=center(f.ids),inner=j===3||j===4;peak(f,[c[0]*(inner?2.2:2.5),inner?1.53:1.38,c[2]-.27],'crest');}
// Short feathered legs and three simple talon gestures per foot.
for(const side of [-1,1]){
 const patch=faces.find(f=>f.r===0&&f.j===(side>0?0:7)&&f.half===(side>0?0:1));let ring=patch.ids;remove([patch]);
 for(const [y,z,scale] of [[-.99,.18,.55],[-1.22,.37,.60]]){const c=center(ring),next=ring.map(id=>add([side*.23+(vertices[id][0]-c[0])*scale,y+(vertices[id][1]-c[1])*.13,z+(vertices[id][2]-c[2])*scale]));bridge(ring,next,`foot-${side}`);ring=next;}
 const cap={ids:ring,tag:`toe-${side}`};faces.push(cap);
 const c=center(ring);peak(cap,[side*.23,-1.27,.68],`toe-${side}`);
 const toes=faces.filter(f=>f.tag===`toe-${side}`);
 for(const [index,offset] of [[0,-.11],[1,.11]]){const f=toes[index];peak(f,[side*.23+offset,-1.29,.58],`claw-${side}`);}
}
const breast=faces.find(f=>f.r===1&&f.j===0&&f.half===0),bc=center(breast.ids);peak(breast,[bc[0],bc[1],bc[2]+.055],'breast');
// Repose the existing connected sculpture into flight. The torso and wing
// planes turn forward; the head stays upright and the feet tuck below the belly.
const ease=t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);};
const billIds=new Set(faces.filter(f=>f.tag==='bill').flatMap(f=>f.ids));
for(let i=0;i<vertices.length;i++){
 const [x,y,z]=vertices[i];let fy=-z,fz=y;
 const head=billIds.has(i)?1:ease((y-.55)/.50)*(1-ease((Math.abs(x)-.40)/.35));
 fy=fy*(1-head)+(.20+(y-1.05)*.85)*head;
 fz=fz*(1-head)+(1.0+(z-.05)*.9)*head;
 if(y<-.80&&z>.02){const tuck=ease((-y-.80)/.42);fy=fy*(1-tuck)+(-.24+(z-.4)*.15)*tuck;fz=fz*(1-tuck)+(-.45-(z-.4)*.4)*tuck;}
 // A short, broad fan behind the body, rather than a standing support point.
 if(i<8){fy=.045-(z+.20)*.35;fz=-1.23;vertices[i]=[x*1.75,fy,fz];continue;}
 if(i===bottom){vertices[i]=[0,.045,-1.43];continue;}
 vertices[i]=[x,fy,fz];
}
assert.equal(vertices.length,112);assert.equal(faces.length,220);
const positions=faces.flatMap(f=>f.ids.flatMap(id=>vertices[id].map(v=>Math.round(v*1e6)/1e6))),edges=new Map();let volume=0,minArea=Infinity;
for(let i=0;i<positions.length;i+=9){const [a,b,c]=[0,3,6].map(j=>positions.slice(i+j,i+j+3)),u=b.map((v,j)=>v-a[j]),v=c.map((n,j)=>n-a[j]),normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];minArea=Math.min(minArea,Math.hypot(...normal)/2);volume+=a[0]*(b[1]*c[2]-b[2]*c[1])/6+a[1]*(b[2]*c[0]-b[0]*c[2])/6+a[2]*(b[0]*c[1]-b[1]*c[0])/6;const keys=[a,b,c].map(p=>p.join(','));for(let j=0;j<3;j++){const a=keys[j],b=keys[(j+1)%3],key=[a,b].sort().join('|'),e=edges.get(key)||{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(key,e);}}
assert.ok(volume>0);assert.ok(minArea>1e-6);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0),'open or inconsistent edge');
fs.writeFileSync(new URL('../public/models/eagle.json',import.meta.url),JSON.stringify({name:'eagle',triangles:220,positions}));
console.log(JSON.stringify({species:'Philippine eagle',scientific:'Pithecophaga jefferyi',vertices:112,faces:220,edges:edges.size,volume,minArea,watertight:true},null,2));
