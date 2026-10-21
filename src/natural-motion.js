import {deformOrangutanVertex,orangutanBehavior,orangutanRigDiagnostics} from './orangutan-behavior.js';
import {DURATION,ease} from './transitions.js';
import {deformTigerVertex,tigerBehavior,tigerRigDiagnostics} from './tiger-behavior.js';

const TAU=Math.PI*2;
const smooth=(a,b,x)=>ease((x-a)/(b-a));
function pulse(t,period,start,length){const phase=((t%period)+period)%period;return phase>start&&phase<start+length?Math.sin(Math.PI*(phase-start)/length)**2:0;}

// Quadrupeds face -X; the upright orangutan faces +Z. Up is +Y.
// Continuous spatial weights join limbs to the torso without splitting faces.
const hash=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453123;return value-Math.floor(value);};
// Held poses and finite gestures have smooth arrivals, quiet holds and releases.
function held(t,seed,period){const clock=t/period,slot=Math.floor(clock);return (hash(slot+seed)*2-1)*(1-ease(clock-slot))+(hash(slot+seed+1)*2-1)*ease(clock-slot);}
function gesture(t,seed,period,duration){const slot=Math.floor(t/period),local=t-slot*period,start=1.8+hash(slot*13+seed)*Math.min(5,period-duration-3),length=duration*(.85+.3*hash(slot*7+seed+2));if(slot!==0&&hash(slot+seed+9)<.18)return 0;const u=(local-start)/length;return ease(u/.28)*(1-ease((u-.70)/.30));}
function strokePhase(t){const clock=t/6.6+.045*Math.sin(t*.13)+.018*Math.sin(t*.047);return clock-Math.floor(clock);}
export function eagleFlight(t){
 const clock=t/12+.018*Math.sin(t*.09),u=clock-Math.floor(clock),envelope=ease(u/.09)*(1-ease((u-.59)/.09));
 const beat=TAU*2*u/.68;
 return{envelope,beat,stroke:.22*Math.sin(beat)*envelope,outerLag:.055*(Math.sin(beat-.36)-Math.sin(beat))*envelope,twist:.065*Math.cos(beat)*envelope};
}
export function sharkSwim(t){
 // Continuous phase: slightly quicker strokes during an unhurried effort phrase.
 const active=.5+.5*Math.sin(t*.14-.6);
 return{phase:TAU*(t/3.6-.09*Math.cos(t*.14-.6)),strength:.88+.20*active,active};
}
export function mantaGlide(t){
 // Slow paired strokes with spanwise lag; quiet glide phrases stay in motion.
 const phase=TAU*(t/7.8+.025*Math.sin(t*.10)),effort=.5+.5*Math.sin(t*.115-.8);
 return{phase,effort,strength:.12+.085*effort};
}
export function whaleSwim(t){
 // Authored slow cruising, deliberately heavier than the manta's 7.8 s stroke.
 return{phase:TAU*(t/12.5+.014*Math.sin(t*.06)),strength:.87+.10*(.5+.5*Math.sin(t*.075-.7))};
}
// An authored bovid-informed placement sequence, NOT documented saola kinematics.
// Pause, four short forward placements, pause, four small return placements.
// Hoof world positions stay fixed during support; only one hoof swings at once.
export function saolaStep(t){
 const u=((t%60)+60)%60,body=-.30*(ease((u-4)/12)-ease((u-31)/12)),feet=[],lift=[];
 for(let order=0;order<4;order++){
  const forward=(u-(4+order*3))/2.15,back=(u-(31+(3-order)*3))/2.15;
  feet.push(-.30*(ease(forward)-ease(back)));
  const bump=v=>v>0&&v<1?Math.sin(Math.PI*ease(v))**2:0;
  lift.push(.075*(bump(forward)+bump(back)));
 }
 return{body,feet,lift,active:lift.some(v=>v>1e-6)};
}
export function motionState(kind,t){
 if(kind==='whale'){const w=whaleSwim(t);return Math.abs(Math.cos(w.phase))<.25?'momentum / suspended glide':Math.cos(w.phase)>0?'slow vertical power stroke':'controlled fluke recovery';}
 if(kind==='manta'){const m=mantaGlide(t);return m.effort<.22?'suspended glide':Math.cos(m.phase)<0?'flowing pectoral downstroke':'soft pectoral recovery';}
 if(kind==='saola')return saolaStep(t).active?'cautious hoof placement (inferred)':gesture(t,197,21,6)>.1?'gentle head carriage (inferred)':'breathing / quiet pause (inferred)';
 if(kind==='tiger')return tigerBehavior(t).state;
 if(kind==='shark')return sharkSwim(t).active>.70?'stronger propulsion / gentle bank':'steady lateral swimming';
 if(kind===0||kind==='rhino')return gesture(t,7,19,5.5)>.12?'listening / head carriage':'quiet breathing / settled stance';
 if(kind===1||kind==='turtle'){const p=strokePhase(t);return p<.23?'power stroke':p<.70?'recovery / feathering':'glide / steering';}
 if(kind===2||kind==='orangutan')return orangutanBehavior(t).state;
 if(kind==='eagle'){const f=eagleFlight(t);return f.envelope<.08?'extended-wing glide':Math.cos(f.beat)<0?'controlled downstroke':'soft wing recovery';}
 return 'quiet rest';
}
export function deformVertex(species,x,y,z,t,out,amplitude=1.22){
 if(species==='tiger')return deformTigerVertex(x,y,z,t,out,amplitude);
 if(species===2||species==='orangutan')return deformOrangutanVertex(x,y,z,t,out,amplitude);
 let px=x,py=y,pz=z;
 if(species===0||species==='rhino'){
  const torso=smooth(-1.65,-.7,x)*(1-smooth(1.2,1.85,x))*smooth(-.8,-.15,y);
  const breath=Math.sin(TAU*(t/5.9+.055*Math.sin(t*.11)+.016*Math.sin(t*.037)))*(.94+.06*Math.sin(t*.17));
  py+=(y-.05)*.016*breath*torso;pz+=z*.024*breath*torso;
  const standing=smooth(-1.25,-.1,y),lean=held(t,4,12);
  px+=.017*held(t,12,16)*standing;pz+=.030*lean*standing;
  const attention=gesture(t,7,19,5.5),direction=hash(Math.floor(t/19)+33)*2-1;
  const head=(1-smooth(-1.6,-.85,x))*smooth(-.8,-.05,y);
  const nod=(.045*attention-.012*held(t,19,9))*head;
  let dx=px+.95,dy=py-.3;
  px=-.95+dx*Math.cos(nod)-dy*Math.sin(nod);py=.3+dx*Math.sin(nod)+dy*Math.cos(nod);
  const turn=(.060*direction*attention+.009*held(t,22,11))*head;dx=px+.95;
  const nextX=dx*Math.cos(turn)+pz*Math.sin(turn);pz=-dx*Math.sin(turn)+pz*Math.cos(turn);px=nextX-.95;
  const side=Math.sign(z)||1,ear=smooth(.68,1.15,y)*smooth(.18,.4,Math.abs(z))*smooth(-1.65,-1.3,x)*(1-smooth(-.85,-.6,x));
  const flick=side*(.17*gesture(t,side>0?5:17,side>0?12.7:15.3,.95)+.075*attention*(side===Math.sign(direction)?1:.35))*ear;
  dy=py-.65;const dz=pz-side*.28;
  py=.65+dy*Math.cos(flick)-dz*Math.sin(flick);pz=side*.28+dy*Math.sin(flick)+dz*Math.cos(flick);
 }else if(species===1||species==='turtle'){
  const p=strokePhase(t),side=Math.sign(z)||1,span=Math.abs(z);
  // Coordinated downstroke, slower recovery/feather, then a genuine quiet glide.
  let drive;if(p<.23)drive=.35*ease(p/.23);else if(p<.52)drive=.35-.49*ease((p-.23)/.29);else if(p<.70)drive=-.14*(1-ease((p-.52)/.18));else drive=0;
  const strength=.94+.06*held(t,31,17),steer=held(t,8,13),front=(1-smooth(.65,1.15,x))*smooth(.72,1.25,span),rear=smooth(.9,1.35,x)*smooth(.66,1.08,span);
  const stroke=drive*strength*front+(.065*steer+.022*drive)*rear,angle=side*stroke,dy=py+.29,dz=pz-side*.8;
  py=-.29+dy*Math.cos(angle)-dz*Math.sin(angle);pz=side*.8+dy*Math.sin(angle)+dz*Math.cos(angle);
  px+=(.045*Math.sin(TAU*p)*front*smooth(.9,2.2,span))*(p<.70?1-ease((p-.52)/.18):0);
  const pitch=.020*drive/.35+.012*held(t,17,19),roll=.024*steer;
  const nextX=px*Math.cos(pitch)-py*Math.sin(pitch);py=px*Math.sin(pitch)+py*Math.cos(pitch);px=nextX;
  const nextY=py*Math.cos(roll)-pz*Math.sin(roll);pz=py*Math.sin(roll)+pz*Math.cos(roll);py=nextY;
  // Lift builds through propulsion, crests during recovery, then settles in glide.
  // Use the same variable stroke phase as the flippers, with continuous velocity.
  px+=.045*held(t,41,18);py+=.045*Math.sin(t*.19)+.20*Math.sin(TAU*(p-.12))+.014*drive/.35;
 }
 if(species==='pangolin'){
  const torso=smooth(-1.55,-.8,x)*(1-smooth(.65,1.45,x))*smooth(-1.15,-.45,y),breath=Math.sin(TAU*t/6.1);
  py+=(y+.15)*.009*breath*torso;pz+=z*.012*breath*torso;
  const head=(1-smooth(-1.75,-1.22,x))*smooth(-1.1,-.65,y),sniff=.025*Math.sin(t*.85)+.025*pulse(t,14,3,3);
  const angle=head*sniff,dx=px+1.35,dy=py+.12;
  px=-1.35+dx*Math.cos(angle)-dy*Math.sin(angle);py=-.12+dx*Math.sin(angle)+dy*Math.cos(angle);
  // Planted feet, a small held weight shift, and restrained lag along the tail.
  const balance=held(t,63,14);pz+=.012*balance*smooth(-1.28,-.55,y);
  const tail=smooth(1.05,3.95,x),lag=Math.max(0,x-1.05)*.7;
  pz+=(.15*held(t-lag,63,14)+.075*Math.sin(t*.38-lag*.2))*tail;
  py+=(.018*held(t-lag,71,18)+.009*Math.sin(t*.31-lag*.15))*tail;
 }
 if(species==='eagle'){
  const flight=eagleFlight(t),side=Math.sign(x)||1,wing=smooth(.34,.90,Math.abs(x)),outer=smooth(.95,2.15,Math.abs(x));
  // Broad shoulder arcs, a delayed outer wing, and feather-plane rotation.
  const angle=side*(.10+flight.stroke+flight.outerLag*outer)*wing,wx=px-side*.34;
  let nextX=side*.34+wx*Math.cos(angle)-py*Math.sin(angle);py=wx*Math.sin(angle)+py*Math.cos(angle);px=nextX;
  const twist=flight.twist*outer,wy=py,dz=pz-.10;py=wy*Math.cos(twist)-dz*Math.sin(twist);pz=.10+wy*Math.sin(twist)+dz*Math.cos(twist);
  // Head stability and tucked limbs keep the silhouette aerial and composed.
  const head=smooth(.60,1.0,z)*(1-smooth(.40,.70,Math.abs(x))),turn=.045*held(t,37,15)*head,dx=px,hz=pz-.95;
  px=dx*Math.cos(turn)+hz*Math.sin(turn);pz=.95-dx*Math.sin(turn)+hz*Math.cos(turn);
  const pitch=.012*held(t,93,19)-.018*flight.stroke,roll=.014*held(t,81,16);
  const nextY=py*Math.cos(pitch)-pz*Math.sin(pitch);pz=py*Math.sin(pitch)+pz*Math.cos(pitch);py=nextY;
  nextX=px*Math.cos(roll)-py*Math.sin(roll);py=px*Math.sin(roll)+py*Math.cos(roll);px=nextX;
  py+=.028*Math.sin(t*.29)+.032*flight.envelope*Math.cos(flight.beat-.5);
 }
 if(species==='shark'){
  const swim=sharkSwim(t),u=Math.max(0,Math.min(1,(x+1.65)/4.70)),phase=swim.phase-1.04*(x+1.65);
  const amplitude=(.012+.26*u*u+.045*u**4)*swim.strength;
  const slope=(.52*u+.18*u**3)/4.70*swim.strength*Math.sin(phase)-1.04*amplitude*Math.cos(phase);
  // The wave grows toward the peduncle. Rotate each cross-section with the
  // centerline tangent so both caudal lobes push sideways as ONE vertical fin.
  const yaw=Math.atan(slope),lateral=amplitude*Math.sin(phase);
  px=x-z*Math.sin(yaw);pz=lateral+z*Math.cos(yaw);
  // A small coordinated heading/bank change, never vertical tail flapping.
  const heading=.035*held(t,109,17)+.025*Math.sin(t*.11),bank=.052*Math.sin(t*.16)+.025*held(t,117,19);
  let nx=px*Math.cos(heading)-pz*Math.sin(heading);pz=px*Math.sin(heading)+pz*Math.cos(heading);px=nx;
  const ny=py*Math.cos(bank)-pz*Math.sin(bank);pz=py*Math.sin(bank)+pz*Math.cos(bank);py=ny;
  px+=.16*Math.sin(t*.18)+.055*held(t,123,23);
  pz+=.10*held(t,127,21)+.055*Math.sin(t*.13);
  py+=.022*Math.sin(t*.19+.5);
 }
 if(species==='saola'){
  const step=saolaStep(t),standing=smooth(-1.40,-.20,y),torso=smooth(-1.20,-.65,x)*(1-smooth(.95,1.40,x))*smooth(-.32,.05,y)*(1-smooth(.80,.98,y));
  const breath=Math.sin(TAU*(t/6.2+.020*Math.sin(t*.09)));
  py+=(y-.20)*.012*breath*torso;pz+=z*.018*breath*torso;
  const balance=.016*held(t,191,17)+.20*(step.lift[2]+step.lift[3]-step.lift[0]-step.lift[1]);pz+=balance*standing;
  py-=.06*Math.max(...step.lift)*standing;
  const side=z>0?1:-1,order=x<0?(side>0?1:3):(side>0?0:2);
  const leg=(1-smooth(-1.28,-.26,y))*smooth(.12,.22,Math.abs(z));
  px+=(step.feet[order]-step.body)*leg;py+=step.lift[order]*leg;
  // Independent small ear adjustments, kept spatially clear of the horns.
  const ear=smooth(.26,.62,Math.abs(z))*smooth(.70,.90,y)*(1-smooth(-1.05,-.75,x));
  const listen=(.025*held(t,side>0?193:199,side>0?11:14)+.075*gesture(t,side>0?203:211,side>0?17:23,1.8))*ear;
  const ey=py-.85,ez=pz-side*.25,earAngle=side*listen;
  py=.85+ey*Math.cos(earAngle)-ez*Math.sin(earAngle);pz=side*.25+ey*Math.sin(earAngle)+ez*Math.cos(earAngle);
  // Horn vertices have unit head weight: they move as rigid parts of the skull.
  const head=Math.max((1-smooth(-1.45,-1.05,x))*smooth(-.15,.25,y),smooth(.98,1.25,y));
  const attention=gesture(t,197,21,6),nod=(.042*held(t,217,16)-.040*attention)*head;
  const hx=px+1.15,hy=py-.62;px=-1.15+hx*Math.cos(nod)-hy*Math.sin(nod);py=.62+hx*Math.sin(nod)+hy*Math.cos(nod);
  const turn=.034*held(t,223,19)*head,dx=px+1.15;
  px=-1.15+dx*Math.cos(turn)+pz*Math.sin(turn);pz=-dx*Math.sin(turn)+pz*Math.cos(turn);
  const tail=smooth(1.40,1.65,x)*(1-smooth(.16,.36,y));pz+=.026*held(t-.6,191,17)*tail;
  px+=step.body;
 }
 if(species==='manta'){
  const swim=mantaGlide(t),span=Math.abs(z),side=Math.sign(z)||1;
  const wing=smooth(.62,1.10,span),outer=smooth(.95,3.15,span);
  // A continuous shared-vertex bend, not rigidly flapping separate triangles.
  // Stable disc roots, increasing distal excursion, slight trailing-edge delay.
  const lag=.40*outer+.10*(x+.95)*outer;
  const bank=.025*held(t,233,19),stroke=.065+swim.strength*Math.sin(swim.phase-lag);
  const angle=-side*(stroke+.018*side*held(t,239,23))*wing,dy=py,dz=pz-side*.62;
  py=dy*Math.cos(angle)-dz*Math.sin(angle);pz=side*.62+dy*Math.sin(angle)+dz*Math.cos(angle);
  const twist=.018*Math.cos(swim.phase-lag)*outer,dx=px-.20;
  px=.20+dx*Math.cos(twist)-py*Math.sin(twist);py=dx*Math.sin(twist)+py*Math.cos(twist);
  const tail=smooth(1.18,3.20,x);pz+=.035*Math.sin(t*.36-(x-1.18)*.65)*tail;
  const pitch=.012*held(t,241,21)-.010*Math.cos(swim.phase-.35);
  let nx=px*Math.cos(pitch)-py*Math.sin(pitch);py=px*Math.sin(pitch)+py*Math.cos(pitch);px=nx;
  const ny=py*Math.cos(bank)-pz*Math.sin(bank);pz=py*Math.sin(bank)+pz*Math.cos(bank);py=ny;
  // Bounded forward drift and a coordinated lift, with no end-of-path reset.
  px+=.105*held(t,251,24)-.045*Math.sin(swim.phase-.3);
  py+=.060*Math.sin(swim.phase-.65)+.025*held(t,257,27);
  pz+=.055*held(t,263,29);
 }
 if(species==='whale'){
  const swim=whaleSwim(t),u=Math.max(0,Math.min(1,(x+1.50)/5.32)),phase=swim.phase-.62*(x+1.50);
  const heave=(.006+.30*u**2.6)*swim.strength;
  const slope=.78*u**1.6/5.32*swim.strength*Math.sin(phase)-.62*heave*Math.cos(phase);
  // Both horizontal flukes follow the same vertical centerline and tangent.
  // A stable forebody and growing posterior wave convey mass, not fish-like yaw.
  const pitch=Math.atan(slope);px=x-y*Math.sin(pitch);py=heave*Math.sin(phase)+y*Math.cos(pitch);
  const side=Math.sign(z)||1,flipper=smooth(.60,1.02,Math.abs(z))*(1-smooth(-.45,-.10,x));
  const trim=side*.020*held(t,271,29)*flipper,fy=py+.25,fz=pz-side*.55;
  py=-.25+fy*Math.cos(trim)-fz*Math.sin(trim);pz=side*.55+fy*Math.sin(trim)+fz*Math.cos(trim);
  const attitude=.010*held(t,277,31),bank=.010*held(t,281,35);
  let nx=px*Math.cos(attitude)-py*Math.sin(attitude);py=px*Math.sin(attitude)+py*Math.cos(attitude);px=nx;
  const ny=py*Math.cos(bank)-pz*Math.sin(bank);pz=py*Math.sin(bank)+pz*Math.cos(bank);py=ny;
  px+=.12*held(t,283,36)-.025*Math.sin(swim.phase-.4);
  py+=.045*Math.sin(swim.phase-.55)+.018*held(t,293,39);
  pz+=.025*held(t,307,41);
 }
 out[0]=x+(px-x)*amplitude;out[1]=y+(py-y)*amplitude;out[2]=z+(pz-z)*amplitude;return out;
}

export function motionWeights(elapsed){return elapsed<0?[1,0]:[1-ease(elapsed/.65),ease((elapsed-(DURATION-.65))/.65)];}

export function createNaturalMotion(pairs,{tigerClockOrigin=0,tigerTimeOffset=0,orangutanClockOrigin=0,orangutanTimeOffset=0,orangutanFixedTime=null}={}){
 const layouts=Array.from({length:pairs[0].length},(_,species)=>{
  const ids=new Uint16Array(pairs.length*3),unique=[],lookup=new Map();
  for(let face=0;face<pairs.length;face++)for(let corner=0;corner<3;corner++){
   const p=pairs[face][species].original.slice(corner*3,corner*3+3),key=p.join(',');
   if(!lookup.has(key)){lookup.set(key,unique.length/3);unique.push(...p);}
   ids[face*3+corner]=lookup.get(key);
  }
  return{kind:pairs[0][species].animal,ids,rest:new Float32Array(unique),posed:new Float32Array(unique.length),delta:new Float32Array(unique.length)};
 });
 const point=new Float64Array(3);let maxDisplacement=0,behavior='quiet rest',tiger=null,orangutan=null;
 function pose(species,t){const layout=layouts[species],sampleTime=layout.kind==='tiger'?Math.max(0,t-tigerClockOrigin+tigerTimeOffset):layout.kind==='orangutan'?(orangutanFixedTime??Math.max(0,t-orangutanClockOrigin+orangutanTimeOffset)):t;behavior=motionState(layout.kind,sampleTime);tiger=layout.kind==='tiger'?tigerRigDiagnostics(sampleTime):null;orangutan=layout.kind==='orangutan'?orangutanRigDiagnostics(sampleTime):null;for(let i=0;i<layout.rest.length;i+=3){const {rest,posed,delta}=layout;deformVertex(layout.kind,rest[i],rest[i+1],rest[i+2],sampleTime,point);for(let axis=0;axis<3;axis++){posed[i+axis]=point[axis];delta[i+axis]=posed[i+axis]-rest[i+axis];}maxDisplacement=Math.max(maxDisplacement,Math.hypot(delta[i],delta[i+1],delta[i+2]));}}
 function apply(positions,species,t,elapsed=-1,sourceCaptured=false){
  maxDisplacement=0;let [outWeight,inWeight]=motionWeights(elapsed);if(elapsed>=0&&sourceCaptured)outWeight=0;const from=layouts[species],to=layouts[(species+1)%layouts.length];
  if(outWeight)pose(species,t);if(inWeight)pose((species+1)%layouts.length,t);
  for(let vertex=0;vertex<from.ids.length;vertex++)for(let axis=0;axis<3;axis++){
   const i=vertex*3+axis,a=from.ids[vertex]*3+axis,b=to.ids[vertex]*3+axis;
   // At rest, scatter ONE computed position per shared vertex (bit-identical).
   // During the existing explosion, fade offsets over its unchanged trajectory.
   positions[i]=elapsed<0?from.posed[a]:positions[i]+(outWeight?from.delta[a]*outWeight:0)+(inWeight?to.delta[b]*inWeight:0);
  }
 }
 return{apply,get diagnostics(){return{sharedVertices:layouts.map(l=>l.rest.length/3),maxDisplacement,behavior,...(tiger?{tiger}:{} ),...(orangutan?{orangutan}:{})};}};
}
