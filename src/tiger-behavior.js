import {ease} from './transitions.js';
const TAU=Math.PI*2,ground=-1.20;
const smooth=(a,b,x)=>ease((x-a)/(b-a));
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453123;return v-Math.floor(v);};
const held=(t,seed,period)=>{const slot=Math.floor(t/period),u=t/period-slot;return (hash(slot+seed)*2-1)*(1-ease(u))+(hash(slot+seed+1)*2-1)*ease(u);};
const bump=u=>u>0&&u<1?Math.sin(Math.PI*ease(u))**2:0;
// Authored tiger ethogram, not measured frequencies. Later phrases vary their
// durations and omit some observations. No per-frame randomness or pose snaps.
const plans=[];let planEnd=0;
function plan(index){
 const first=index===0,r=n=>hash(index*31+n);
 const spec=[['STAND',first?6:7+5*r(1)],['LOOK',first?4:(r(2)>.25?3+3*r(3):0)],['WALK',first?10:10+3*r(4)],['PAUSE',first?4:3+4*r(5)],['TAIL_SWISH',first?4:(r(6)>.3?3+3*r(7):0)],['SIT_DOWN',6],['SEATED_REST',first?12:12+9*r(8)],['STAND_UP',6],['OBSERVE',first?4:4+6*r(9)],['REPOSITION',first?8:8+3*r(10)],['SETTLE',first?4:4+5*r(11)]];
 let clock=planEnd;const states=spec.filter(([,d])=>d>0).map(([state,duration])=>{const start=clock;clock+=duration;return{state,start,end:clock,duration};});
 const p={index,start:planEnd,end:clock,states};planEnd=clock;plans.push(p);return p;
}
const order=[3,1,2,0]; // left hind → left fore → right hind → right fore
let cachedTime=NaN,cached;
export function tigerBehavior(t){
 t=Math.max(0,t);while(!plans.length||plans.at(-1).end<=t)plan(plans.length);
 const p=plans.find(p=>t<p.end),event=p.states.find(e=>t<e.end),u=(t-event.start)/event.duration;
 const phaseIndex=p.states.indexOf(event),walkIndex=p.states.findIndex(e=>e.state==='WALK'),returnIndex=p.states.findIndex(e=>e.state==='REPOSITION');
 let root=phaseIndex>walkIndex&&phaseIndex<returnIndex?-.80:0,sit=0;
 const feet=new Array(4).fill(root),lift=new Array(4).fill(0),sitFeet=new Array(4).fill(0);
 if(event.state==='WALK'||event.state==='REPOSITION'){
  const back=event.state==='REPOSITION',distance=back?.80:-.80,base=back?-.80:0;
  root=base+distance*ease(u);
  for(let i=0;i<8;i++){const leg=order[i%4],v=(u*8-i)/.78;feet[leg]+=distance/2*ease(v);lift[leg]+=(back?.085:.115)*bump(v);}
  if(back)for(let i=0;i<4;i++)feet[i]-=.80;
  // Follow the advancing support pattern, rather than delaying the torso until
  // a global ease catches up with the first paw (which overextends a hock).
  root=feet.reduce((sum,x)=>sum+x,0)/4;
 }
 if(['SIT_DOWN','SEATED_REST','STAND_UP'].includes(event.state)){
  sit=event.state==='SIT_DOWN'?ease((u-.26)/.74):event.state==='STAND_UP'?1-ease(u/.72):1;
  for(const [leg,start] of [[2,0],[3,.20]]){
   const v=event.state==='SIT_DOWN'?(u-start)/.20:event.state==='STAND_UP'?(u-.72-start*.70)/.12:2;
   sitFeet[leg]=event.state==='STAND_UP'?1-ease(v):ease(v);lift[leg]+=.055*bump(v);
  }
 }
 // Foot support remains fixed in world coordinates between authored swings.
 return{state:event.state,cycle:p.index,time:t,elapsed:t-event.start,duration:event.duration,progress:u,root,sit,feet,lift,sitFeet,walking:event.state==='WALK'||event.state==='REPOSITION',events:p.states};
}
const specs=[[-2.08,.36,.20,.26],[-1.83,.49,.37,.40],[-1.42,.25,.46,.34],[-.91,.16,.59,.43],[.20,.10,.42,.32],[1.03,.11,.51,.40]];
const ring=(r,j)=>{const [x,y,ry,rz]=specs[r],a=(j+.5)*Math.PI/4;return[x,+(y+ry*Math.cos(a)).toFixed(6),+(rz*Math.sin(a)).toFixed(6)];};
function rootCenter(r,j,half){const a=ring(r,j),b=ring(r,(j+1)%8),c=ring(r+1,j),d=ring(r+1,(j+1)%8),v=half?[b,d,c]:[a,b,c];return [0,1,2].map(k=>v.reduce((s,p)=>s+p[k],0)/3);}
const legs=[
 {fore:true,side:1,root:rootCenter(2,2,1),mid:[-.98,-.78,.37],foot:[-1.08,ground,.40]},
 {fore:true,side:-1,root:rootCenter(2,4,0),mid:[-.98,-.78,-.37],foot:[-1.08,ground,-.40]},
 {fore:false,side:1,root:rootCenter(4,2,1),mid:[1.12,-.81,.39],foot:[.82,ground,.40]},
 {fore:false,side:-1,root:rootCenter(4,4,0),mid:[1.12,-.81,-.39],foot:[1.03,ground,-.40]}
].map(l=>({...l,upper:Math.hypot(l.mid[0]-l.root[0],l.mid[1]-l.root[1]),lower:Math.hypot(l.foot[0]-l.mid[0],l.foot[1]-l.mid[1])}));
const tailRest=[[1.40,.20,0],[1.55,.34,0],[1.94,.05,.015],[2.65,-.36,.08],[2.96,-.20,.12],[3.13,.04,.14],[3.16,.23,.13]];
const tailSit=[[.85,-.57,0],[1.0,-.61,.10],[1.40,-.89,.24],[1.75,-1.07,.88],[1.62,-1.09,1.20],[1.38,-1.08,1.39],[1.20,-1.02,1.40]];
const segment=(a,b)=>b.map((v,k)=>v-a[k]);
function frame(t){const d=Math.hypot(...t),a=t.map(v=>v/d),h=Math.hypot(a[0],a[2])||1,b=[-a[2]/h,0,a[0]/h],c=[b[1]*a[2]-b[2]*a[1],b[2]*a[0]-b[0]*a[2],b[0]*a[1]-b[1]*a[0]];return[a,c,b];}
function body(x,y,z,t,s,amplitude){
 const h=smooth(-.85,1.03,x),upper=smooth(-.6,-.1,y),torso=smooth(-1.5,-.85,x)*(1-smooth(1.15,1.42,x));
 const breath=Math.sin(TAU*t/5.7)*(.010+.004*(1-s.sit))*amplitude;
 let px=x-.55*s.sit*h,py=y-.77*s.sit*h,pz=z;
 py+=(y-.05)*breath*torso;pz+=z*breath*1.7*torso;
 const walk=s.walking?Math.sin(TAU*s.progress*2)*Math.sin(Math.PI*s.progress)**2:0;
 const supportLean=.035*(s.lift[1]+s.lift[3]-s.lift[0]-s.lift[2])/.115;
 pz+=(.018*held(t,321,15)+.015*walk+supportLean)*upper;py+=.018*walk*upper*(1-h);
 if(s.walking)py-=.045*ease(s.progress/.10)*(1-ease((s.progress-.90)/.10))*upper;
 px+=.022*walk*upper*torso*(1-h)-.015*walk*upper*torso*h;
 const head=(1-smooth(-1.8,-1.25,x))*smooth(-.05,.30,y),look=(s.state==='LOOK'?Math.sin(Math.PI*ease(s.progress))**2:0);
 const sniff=(s.state==='OBSERVE'&&s.cycle%3===1)?Math.sin(Math.PI*ease(s.progress))**2:0;
 const turn=(.12*held(t,331,11)+.12*look*held(t,337,9))*head,nod=(.026*held(t,347,17)-.12*sniff-.08*s.sit)*head;
 py+=.20*s.sit*head;
 let dx=px+1.40,dy=py-.26;
 px=-1.40+dx*Math.cos(nod)-dy*Math.sin(nod);py=.26+dx*Math.sin(nod)+dy*Math.cos(nod);
 dx=px+1.40;const nx=dx*Math.cos(turn)+pz*Math.sin(turn);pz=-dx*Math.sin(turn)+pz*Math.cos(turn);px=nx-1.40;
 const ear=smooth(.80,.98,y)*(1-smooth(-1.65,-1.40,x)),side=Math.sign(z)||1;
 pz+=side*.035*bump((((t+(side>0?0:5))%(side>0?13:17))-2)/1.7)*ear;
 return[px+s.root,py,pz];
}
function pose(t,amplitude){
 if(t===cachedTime&&cached?.amplitude===amplitude)return cached;
 const s=tigerBehavior(t),posedLegs=legs.map((l,i)=>{
  const root=body(...l.root,t,s,amplitude),foot=[l.foot[0]+s.feet[i]+(i===2?-.17:i===3?-.28:0)*s.sitFeet[i],ground+s.lift[i],l.foot[2]];
  const dx=foot[0]-root[0],dy=foot[1]-root[1],raw=Math.hypot(dx,dy),d=Math.max(Math.abs(l.upper-l.lower)+.0001,Math.min(l.upper+l.lower-.0001,raw)),ux=dx/raw,uy=dy/raw;
  const along=(l.upper*l.upper-l.lower*l.lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,l.upper*l.upper-along*along));
  const mid=[root[0]+along*ux-height*uy,root[1]+along*uy+height*ux,l.mid[2]+(root[2]-l.root[2])*.5];
  // The joint ring bisects the upper/lower directions. Following the upper
  // bone alone can flatten a shin triangle when the hock folds into a sit.
  const upperTurn=Math.atan2(mid[1]-root[1],mid[0]-root[0])-Math.atan2(l.mid[1]-l.root[1],l.mid[0]-l.root[0]);
  const lowerTurn=Math.atan2(foot[1]-mid[1],foot[0]-mid[0])-Math.atan2(l.foot[1]-l.mid[1],l.foot[0]-l.mid[0]);
  const angle=(upperTurn+lowerTurn)*.5;
  return{root,mid,foot,angle,reach:raw/(l.upper+l.lower)};
 });
 const tail=[body(...tailRest[0],t,s,amplitude)],swish=.42*held(t,353,9)+.16*held(t,359,4.5);
 for(let i=1;i<tailRest.length;i++){
  const d=segment(tailRest[i-1],tailRest[i]),seated=segment(tailSit[i-1],tailSit[i]),length=Math.hypot(...d),u=i/6;
  const yaw=Math.atan2(d[2],d[0])*(1-s.sit)+Math.atan2(seated[2],seated[0])*s.sit;
  const pitch=Math.atan2(d[1],Math.hypot(d[0],d[2]))*(1-s.sit)+Math.atan2(seated[1],Math.hypot(seated[0],seated[2]))*s.sit;
  const emphasis=s.state==='TAIL_SWISH'?Math.sin(Math.PI*ease(s.progress))**2:0;
  const angle=yaw+swish*u+(.14+.20*emphasis)*Math.sin(t*.43-i*.38)*u*(1-.50*s.sit)+.12*held(t-i*.3,367,3)*u**4;
  const curve=pitch+.055*held(t-i*.2,373,7)*u**3;
  tail.push([tail[i-1][0]+length*Math.cos(curve)*Math.cos(angle),tail[i-1][1]+length*Math.sin(curve),tail[i-1][2]+length*Math.cos(curve)*Math.sin(angle)]);
 }
 cachedTime=t;cached={s,posedLegs,tail,amplitude};return cached;
}
export function deformTigerVertex(x,y,z,t,out,amplitude=1.22){
 const rig=pose(t,amplitude),s=rig.s;let p;
 const legIndex=y<-.65&&Math.abs(z)>.20?(x<0?(z>0?0:1):(z>0?2:3)):-1;
 if(legIndex>=0){
  const l=legs[legIndex],q=rig.posedLegs[legIndex];
  if(y< -1.1)p=[q.foot[0]+x-l.foot[0],q.foot[1]+y-ground,q.foot[2]+z-l.foot[2]];
  else {const dx=x-l.mid[0],dy=y-l.mid[1];p=[q.mid[0]+dx*Math.cos(q.angle)-dy*Math.sin(q.angle),q.mid[1]+dx*Math.sin(q.angle)+dy*Math.cos(q.angle),q.mid[2]+z-l.mid[2]];}
 }else if(x>1.45){
  const i=tailRest.findIndex((v,j)=>j>0&&Math.abs(x-v[0])<.0001);
  if(i>=0){const rest=tailRest[i],a=frame(segment(tailRest[i-1],rest)),b=frame(segment(rig.tail[i-1],rig.tail[i])),offset=[x-rest[0],y-rest[1],z-rest[2]],local=a.map(axis=>axis.reduce((sum,v,j)=>sum+v*offset[j],0));p=rig.tail[i].map((v,k)=>v+b.reduce((sum,axis,j)=>sum+axis[k]*local[j],0));}
 }
 p??=body(x,y,z,t,s,amplitude);out[0]=p[0];out[1]=p[1];out[2]=p[2];return out;
}
export function tigerRigDiagnostics(t){const r=pose(t,1.22);return{state:r.s.state,cycle:r.s.cycle,elapsed:r.s.elapsed,sit:r.s.sit,root:r.s.root,feet:r.posedLegs.map((l,i)=>({position:l.foot,lift:r.s.lift[i],reach:l.reach})),tail:r.tail};}
