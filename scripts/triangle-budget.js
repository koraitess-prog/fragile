// A face-interior split replaces one triangle with three (+2), without creating
// T-junctions along shared edges. Exact compatible targets only; never overshoot.
export function splitTo(positions,target,{maxSplits=32}={}){
 if(!Array.isArray(positions)&&!ArrayBuffer.isView(positions))throw new TypeError('Expected triangle positions');
 if(positions.length%9!==0||!Array.from(positions).every(Number.isFinite))throw new TypeError('Malformed or non-finite triangles');
 const count=positions.length/9;
 if(!Number.isSafeInteger(target)||target<0)throw new RangeError('Target must be a nonnegative safe integer');
 if(!Number.isSafeInteger(maxSplits)||maxSplits<0)throw new RangeError('maxSplits must be a nonnegative safe integer');
 if(target<count)throw new RangeError('Decimate first: splitTo cannot reduce triangle counts');
 if((target-count)%2!==0)throw new RangeError('Incompatible parity: conforming interior subdivision adds two faces. A closed triangle mesh has an even face count.');
 const splits=(target-count)/2;
 if(splits>maxSplits||splits>count)throw new RangeError('Subdivision budget exceeded; regenerate or decimate to the requested budget');
 if(!splits)return Array.from(positions);
 const faces=Array.from({length:count},(_,i)=>Array.from(positions.slice(i*9,i*9+9)));
 const score=t=>{const ax=t[3]-t[0],ay=t[4]-t[1],az=t[5]-t[2],bx=t[6]-t[0],by=t[7]-t[1],bz=t[8]-t[2];return Math.hypot(ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx);};
 const selected=new Set(faces.map((t,i)=>({i,area:score(t)})).sort((a,b)=>b.area-a.area||a.i-b.i).slice(0,splits).map(v=>v.i));
 const result=[];
 for(let i=0;i<count;i++){const t=faces[i];if(!selected.has(i)){result.push(...t);continue;}const m=[0,1,2].map(k=>(t[k]+t[k+3]+t[k+6])/3);result.push(...t.slice(0,3),...t.slice(3,6),...m,...t.slice(3,6),...t.slice(6,9),...m,...t.slice(6,9),...t.slice(0,3),...m);}
 if(result.length!==target*9)throw new Error('Exact budget invariant failed');return result;
}
