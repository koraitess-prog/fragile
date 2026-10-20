import {DURATION,ease} from './transitions.js';

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
export function motionState(kind,t){
 if(kind===0||kind==='rhino')return gesture(t,7,19,5.5)>.12?'listening / head carriage':'quiet breathing / settled stance';
 if(kind===1||kind==='turtle'){const p=strokePhase(t);return p<.23?'power stroke':p<.70?'recovery / feathering':'glide / steering';}
 if(kind===2||kind==='orangutan')return gesture(t,11,23,6)>.12?'attention shift':gesture(t,3,17,4.2)>.12?'shoulder / arm settling':'quiet breathing / balance';
 if(kind==='eagle'){const f=eagleFlight(t);return f.envelope<.08?'extended-wing glide':Math.cos(f.beat)<0?'controlled downstroke':'soft wing recovery';}
 return 'quiet rest';
}
export function deformVertex(species,x,y,z,t,out,amplitude=1.22){
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
 if(species===2||species==='orangutan'){
  const upper=smooth(-1.28,-.3,y),torso=(1-smooth(.55,.88,Math.abs(x)))*smooth(-.8,-.2,y)*(1-smooth(.6,1,y));
  const breath=Math.sin(TAU*(t/6.1+.05*Math.sin(t*.09)));py+=(y+.25)*.017*breath*torso;pz+=z*.026*breath*torso;
  px+=.033*held(t,23,11)*upper;pz+=.018*held(t,5,15)*upper;
  const attention=gesture(t,11,23,6),direction=hash(Math.floor(t/23)+27)*2-1,head=smooth(.62,1.02,y);
  const turn=(.065*direction*attention+.012*held(t,39,14))*head,dx=px,dz=pz-.04;
  px=dx*Math.cos(turn)+dz*Math.sin(turn);pz=.04-dx*Math.sin(turn)+dz*Math.cos(turn);
  py+=(-.018*attention+.012*held(t,16,13))*head;
  const side=Math.sign(x)||1,arm=smooth(.65,1.15,Math.abs(x)),settle=gesture(t,side>0?3:19,side>0?17:21,4.2);
  const shoulder=(.027*held(t,side>0?14:26,12)+.042*settle)*arm,dy=py-.55;
  px+=-side*dy*Math.sin(shoulder);py=.55+dy*Math.cos(shoulder);pz+=(.020*held(t,side>0?7:18,14)+.024*settle)*arm;
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
 out[0]=x+(px-x)*amplitude;out[1]=y+(py-y)*amplitude;out[2]=z+(pz-z)*amplitude;return out;
}

export function motionWeights(elapsed){return elapsed<0?[1,0]:[1-ease(elapsed/.65),ease((elapsed-(DURATION-.65))/.65)];}

export function createNaturalMotion(pairs){
 const layouts=Array.from({length:pairs[0].length},(_,species)=>{
  const ids=new Uint16Array(pairs.length*3),unique=[],lookup=new Map();
  for(let face=0;face<pairs.length;face++)for(let corner=0;corner<3;corner++){
   const p=pairs[face][species].original.slice(corner*3,corner*3+3),key=p.join(',');
   if(!lookup.has(key)){lookup.set(key,unique.length/3);unique.push(...p);}
   ids[face*3+corner]=lookup.get(key);
  }
  return{kind:pairs[0][species].animal,ids,rest:new Float32Array(unique),posed:new Float32Array(unique.length),delta:new Float32Array(unique.length)};
 });
 const point=new Float64Array(3);let maxDisplacement=0,behavior='quiet rest';
 function pose(species,t){const layout=layouts[species];behavior=motionState(layout.kind,t);for(let i=0;i<layout.rest.length;i+=3){const {rest,posed,delta}=layout;deformVertex(layout.kind,rest[i],rest[i+1],rest[i+2],t,point);for(let axis=0;axis<3;axis++){posed[i+axis]=point[axis];delta[i+axis]=posed[i+axis]-rest[i+axis];}maxDisplacement=Math.max(maxDisplacement,Math.hypot(delta[i],delta[i+1],delta[i+2]));}}
 function apply(positions,species,t,elapsed=-1){
  maxDisplacement=0;const [outWeight,inWeight]=motionWeights(elapsed),from=layouts[species],to=layouts[(species+1)%layouts.length];
  if(outWeight)pose(species,t);if(inWeight)pose((species+1)%layouts.length,t);
  for(let vertex=0;vertex<from.ids.length;vertex++)for(let axis=0;axis<3;axis++){
   const i=vertex*3+axis,a=from.ids[vertex]*3+axis,b=to.ids[vertex]*3+axis;
   // At rest, scatter ONE computed position per shared vertex (bit-identical).
   // During the existing explosion, fade offsets over its unchanged trajectory.
   positions[i]=elapsed<0?from.posed[a]:positions[i]+(outWeight?from.delta[a]*outWeight:0)+(inWeight?to.delta[b]*inWeight:0);
  }
 }
 return{apply,get diagnostics(){return{sharedVertices:layouts.map(l=>l.rest.length/3),maxDisplacement,behavior};}};
}
