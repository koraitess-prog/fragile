import {Vector3,Quaternion,Euler} from 'three';
import {ease} from './transitions.js';
import {orangutanAnatomy as anatomy} from './orangutan-anatomy.js';
const V=p=>new Vector3(...p),mix=(a,b,u)=>a+(b-a)*u,smooth=(a,b,x)=>ease((x-a)/(b-a));
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453123;return v-Math.floor(v);};
const held=(t,seed,period)=>{const slot=Math.floor(t/period),u=t/period-slot;return mix(hash(slot+seed)*2-1,hash(slot+seed+1)*2-1,ease(u));};
const plans=[];let end=0;
function plan(index){
 const spec=[['SUPPORTED_STANCE',4],['OBSERVE',4],['TRANSFER_WEIGHT',4],['REACH',6],['HOLD_REACH',3],['WITHDRAW',5],['PAUSE',3],['LOWER_TO_REST',6],['SUPPORTED_REST',6],['REPOSITION_ARM',4],['LOOK_WHILE_RESTING',4],['RETURN_HAND',4],['RISE',6],['SETTLE',3]];
 let clock=end;const events=spec.map(([state,length],i)=>{const duration=index===0?length:length*(.90+.28*hash(index*31+i)),start=clock;clock+=duration;return{state,start,end:clock,duration};});
 const p={index,start:end,end:clock,side:index===0?1:hash(index*17+4)>.45?1:-1,events};end=clock;plans.push(p);
}
export function orangutanBehavior(time){
 const t=Math.max(0,time);while(!plans.length||plans.at(-1).end<=t)plan(plans.length);
 const p=plans.find(p=>t<p.end),event=p.events.find(e=>t<e.end),u=(t-event.start)/event.duration,i=p.events.indexOf(event);
 let reach=i>3&&i<5?1:0,rest=i>7&&i<12?1:0,lap=i>9&&i<11?1:0;
 if(i===3)reach=ease(u);if(i===5)reach=1-ease(u);
 if(i===7)rest=ease(u);if(i===12)rest=1-ease(u);
 if(i===9)lap=ease(u);if(i===11)lap=1-ease(u);
 const transfer=i===2?ease(u):i>2&&i<6?1:i===6?1-ease(u):0;
 const look=i===1||i===10?Math.sin(Math.PI*ease(u))**2:0;
 return{state:event.state,time:t,elapsed:t-event.start,duration:event.duration,progress:u,cycle:p.index,side:p.side,reach,rest,lap,transfer,look,events:p.events};
}
const key=p=>p.map(v=>v.toFixed(4)).join(',');
const lookup=new Map(anatomy.vertices.map((p,i)=>[key(p),i]));
const sub=(a,b)=>a.map((v,k)=>v-b[k]),length=(a,b)=>Math.hypot(...sub(a,b));
const turn=(a,b)=>new Quaternion().setFromUnitVectors(V(a).normalize(),V(b).normalize());
const quat=(x=0,y=0,z=0)=>new Quaternion().setFromEuler(new Euler(x,y,z,'YXZ'));
function body(p,t,s,amplitude){
 const [x,y,z]=p,upper=smooth(-.52,.65,y),torso=1-smooth(.76,.98,y),breath=.012*Math.sin(t*Math.PI*2/6.8)*amplitude;
 const lean=-s.side*.115*s.transfer+.025*held(t,421,13)*(1-s.rest),pitch=.24*s.rest+.055*s.transfer;
 const v=V([x*(1+breath*torso*upper),y,z*(1+1.5*breath*torso*upper)]);
 v.y+=breath*upper*torso;
 const pelvis=new Vector3(0,-.58,0);v.sub(pelvis).applyQuaternion(quat(-.45*s.rest*(1-smooth(-.58,-.02,y)),0,0)).add(pelvis);
 const rel=V([0,-.50,0]);v.sub(rel).applyQuaternion(quat(pitch*upper,-s.side*.065*s.reach*upper,.035*s.side*s.transfer*upper)).add(rel);
 v.x+=lean*(.25+.75*upper);v.y-=.45*s.rest;v.z-=.40*s.rest;
 // The reaching shoulder elevates/protracts; the pelvis counterbalances.
 const shoulder=smooth(.22,.64,y)*(1-smooth(.76,.98,y)),near=smooth(0,.40,s.side*x);
 v.y+=.10*s.reach*shoulder*near;v.z+=.075*s.reach*shoulder*near;
 const headWeight=smooth(.80,1.03,y);
 if(headWeight){const pivot=V(body([0,.78,0],t,s,amplitude)),q=quat((.055*held(t,427,11)-.07*s.reach-.05*s.rest)*headWeight,(.16*held(t,431,9)-s.side*.18*s.look+s.side*.13*s.reach)*headWeight,0);v.sub(pivot).applyQuaternion(q).add(pivot);}
 return v.toArray();
}
// A two-bone solver controls the wrists/ankles. Ring frames at joints bisect
// adjacent bone rotations instead of collapsing all vertices into an offset.
function solve(root,target,restJoint,upper,lower,pole){
 const axis=V(target).sub(V(root)),raw=axis.length(),d=Math.max(Math.abs(upper-lower)+1e-5,Math.min(upper+lower-1e-5,raw));axis.normalize();
 let perp=V(pole).sub(V(root));perp.addScaledVector(axis,-perp.dot(axis));if(perp.lengthSq()<1e-9)perp=new Vector3(0,0,1);perp.normalize();
 const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 const joint=V(root).addScaledVector(axis,along).addScaledVector(perp,height).toArray();
 return{root,joint,target,reach:raw/(upper+lower),upper,lower};
}
let cachedTime=NaN,cachedAmplitude=NaN,cached;
function pose(t,amplitude=1.22){
 if(t===cachedTime&&amplitude===cachedAmplitude)return cached;
 const behavior=orangutanBehavior(t),s={...behavior,rest:.35+.65*behavior.rest},bodyPoints=anatomy.vertices.map(p=>body(p,t,s,amplitude));
 const legs=anatomy.legs.map(l=>{
  const root=body(l.root,t,s,amplitude),target=l.ankle.slice(),q=solve(root,target,l.knee,length(l.root,l.knee),length(l.knee,l.ankle),[l.side*.85,-.80,.85]);
  q.upperRotation=turn(sub(l.knee,l.root),sub(q.joint,root));q.lowerRotation=turn(sub(l.ankle,l.knee),sub(target,q.joint));q.jointRotation=q.upperRotation.clone().slerp(q.lowerRotation,.5);return q;
 });
 const arms=anatomy.arms.map(a=>{
  const active=a.side===s.side,r=active?s.reach:0,root=body(a.root,t,s,amplitude),rest=a.side>0?[.85,1.75,.45]:a.wrist.slice();
  // A deliberate exploration reach, not a claim of grasping an invisible vine.
  const goal=[a.side*1.65,1.12,.72],wrist=rest.map((v,i)=>mix(v,goal[i],r));
  if(!active&&a.side<0&&s.lap){const knee=legs[anatomy.legs.findIndex(l=>l.side===a.side)].joint,lap=[a.side*1.12,knee[1]+.30,knee[2]+.32];for(let i=0;i<3;i++)wrist[i]=mix(wrist[i],lap[i],s.lap);}
  const q=solve(root,wrist,a.elbow,length(a.root,a.elbow),length(a.elbow,a.wrist),a.elbow.map((v,i)=>mix(v,[a.side*1.55,-.30,(!active&&a.side<0?s.lap:0)*.70-.12][i],Math.max(s.rest,r))));
  // Hinge angles are unwrapped before averaging. Quaternion shortest-path
  // interpolation can flip the elbow frame when an arm passes overhead.
  const angles=d=>[Math.atan2(d[0],-d[1]),-Math.atan2(d[2],Math.hypot(d[0],d[1]))];
  const unwrap=(a,b)=>{while(b-a>Math.PI)b-=2*Math.PI;while(b-a< -Math.PI)b+=2*Math.PI;return b;};
  const ru=angles(sub(a.elbow,a.root)),rl=angles(sub(a.wrist,a.elbow)),pu=angles(sub(q.joint,root)),pl=angles(sub(wrist,q.joint));rl[0]=unwrap(ru[0],rl[0]);pl[0]=unwrap(pu[0],pl[0]);
  const rotation=([z,x])=>quat(0,0,z).multiply(quat(x,0,0)),map=(r,p)=>rotation(p).multiply(rotation(r).invert());
  q.upperRotation=map(ru,pu);q.lowerRotation=map(rl,pl);q.jointRotation=map(ru.map((v,i)=>(v+rl[i])/2),pu.map((v,i)=>(v+pl[i])/2));
  q.handRotation=new Quaternion().slerp(q.lowerRotation,a.side>0?1:Math.max(r,s.lap*.65)).multiply(quat(-.18*r-.10*s.lap*(active?0:1),a.side*.12*r,0));q.wristRotation=q.lowerRotation.clone().slerp(q.handRotation,.55);q.supported=!active||r<1e-7;q.lap=!active&&a.side<0?s.lap:0;return q;
 });
 const points=anatomy.vertices.map((p,i)=>{
  const tag=anatomy.tags[i];if(tag.part==='body'||tag.part==='head')return bodyPoints[i];
  if(tag.part==='arm'){
   const j=anatomy.arms.findIndex(a=>a.side===tag.side),a=anatomy.arms[j],q=arms[j];
   if(tag.ring===0)return V(p).sub(V(a.root)).applyQuaternion(new Quaternion().slerp(q.upperRotation,.55)).add(V(q.root)).toArray();
   if(tag.ring===1)return V(p).sub(V(a.elbow)).applyQuaternion(q.jointRotation).add(V(q.joint)).toArray();
   return V(p).sub(V(a.wrist)).applyQuaternion(tag.ring===2?q.wristRotation:q.handRotation).add(V(q.target)).toArray();
  }
  const j=anatomy.legs.findIndex(l=>l.side===tag.side),l=anatomy.legs[j],q=legs[j];
  if(tag.ring===0)return V(p).sub(V(l.knee)).applyQuaternion(q.jointRotation).add(V(q.joint)).toArray();
  if(tag.ring===1)return V(p).sub(V(l.ankle)).applyQuaternion(q.lowerRotation.clone().slerp(new Quaternion(),.55)).add(V(q.target)).toArray();
  return p.slice(); // toe contacts stay fixed, including the opposable hallux.
 });
 cachedTime=t;cachedAmplitude=amplitude;cached={s,arms,legs,points};return cached;
}
export function deformOrangutanVertex(x,y,z,t,out,amplitude=1.22){const rig=pose(t,amplitude),id=lookup.get(key([x,y,z])),p=id===undefined?body([x,y,z],t,rig.s,amplitude):rig.points[id];out[0]=p[0];out[1]=p[1];out[2]=p[2];return out;}
export function orangutanRigDiagnostics(t){const r=pose(t);return{state:r.s.state,cycle:r.s.cycle,elapsed:r.s.elapsed,rest:r.s.rest,reach:r.s.reach,side:r.s.side,arms:r.arms.map(a=>({shoulder:a.root,elbow:a.joint,wrist:a.target,reach:a.reach,lap:a.lap,supported:a.supported})),legs:r.legs.map(l=>({hip:l.root,knee:l.joint,ankle:l.target,reach:l.reach}))};}
