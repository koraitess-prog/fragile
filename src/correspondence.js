const distance=(a,b)=>a.reduce((s,v,i)=>s+(v-b[i])**2,0);
function region(face){const {x,y,z}=face.center;
 if(face.animal==='shark'){
  if(x<-1.65)return 'head';
  if(x>1.58)return 'tail';
  if(Math.abs(z)>.43)return x<.3?'forelimb':'hindlimb';
  return 'body';
 }
 if(face.animal==='rhino'){
  if(x<-1.05)return 'head';
  if(y<-.62&&Math.abs(z)>.18)return x<0?'forelimb':'hindlimb';
  if(x>2)return 'tail';return 'body';
 }
 if(face.animal==='turtle'){
  if(x<-1.12)return 'head';
  const outside=((x-.32)/1.67)**2+(z/1.15)**2>1.07;
  if(outside&&Math.abs(z)>.83)return x<.7?'forelimb':'hindlimb';
  if(x>2.05&&Math.abs(z)<.2)return 'tail';return 'body';
 }
 if(face.animal==='orangutan'){
  if(y>.75)return 'head';
  if(Math.abs(x)>.75)return 'forelimb';
  if(y<-.65)return 'hindlimb';return 'body';
 }
 if(face.animal==='pangolin'){
  if(x<-1.25)return 'head';
  if(y<-.65&&Math.abs(z)>.3)return x<0?'forelimb':'hindlimb';
  if(x>1.05)return 'tail';return 'body';
 }
 if(face.animal==='eagle'){
  if(z>.72&&Math.abs(x)<.60)return 'head';
  if(Math.abs(x)>.48)return 'forelimb';
  if(y<-.19&&z<-.2&&Math.abs(x)>.1)return 'hindlimb';
  if(z<-.82)return 'tail';return 'body';
 }
 return 'body';
}
function features(faces){const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],groups=new Map(),mean=faces.reduce((s,f)=>s+f.area,0)/faces.length;
 for(const f of faces){f.center.toArray().forEach((v,j)=>{min[j]=Math.min(min[j],v);max[j]=Math.max(max[j],v);});const r=region(f);if(!groups.has(r))groups.set(r,{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});const g=groups.get(r);f.center.toArray().forEach((v,j)=>{g.min[j]=Math.min(g.min[j],v);g.max[j]=Math.max(g.max[j],v);});}
 return faces.map(f=>{const r=region(f),g=groups.get(r),p=f.center.toArray(),a=f.original,u=[a[3]-a[0],a[4]-a[1],a[5]-a[2]],v=[a[6]-a[0],a[7]-a[1],a[8]-a[2]],edges=[Math.hypot(...u),Math.hypot(...v),Math.hypot(a[6]-a[3],a[7]-a[4],a[8]-a[5])].sort((a,b)=>a-b);return{region:r,side:Math.abs(f.center.z)>.15?Math.sign(f.center.z):0,p:p.map((v,j)=>(v-min[j])/Math.max(.01,max[j]-min[j])),local:p.map((v,j)=>(v-g.min[j])/Math.max(.05,g.max[j]-g.min[j])),normal:f.normal.toArray(),logArea:Math.log(f.area/mean),aspect:Math.log(edges[2]/Math.max(.0001,edges[0]))};});
}
export function minimumAssignment(cost,n){if(cost.length!==n*n||!cost.every(Number.isFinite))throw new TypeError('Finite square cost matrix required');const u=new Float64Array(n+1),v=new Float64Array(n+1),p=new Int32Array(n+1),way=new Int32Array(n+1);
 for(let i=1;i<=n;i++){p[0]=i;let j0=0;const min=new Float64Array(n+1).fill(Infinity),used=new Uint8Array(n+1);do{used[j0]=1;const i0=p[j0];let delta=Infinity,j1=0;for(let j=1;j<=n;j++)if(!used[j]){const cur=cost[(i0-1)*n+j-1]-u[i0]-v[j];if(cur<min[j]){min[j]=cur;way[j]=j0;}if(min[j]<delta){delta=min[j];j1=j;}}for(let j=0;j<=n;j++)if(used[j]){u[p[j]]+=delta;v[j]-=delta;}else min[j]-=delta;j0=j1;}while(p[j0]!==0);do{const j1=way[j0];p[j0]=p[j1];j0=j1;}while(j0);}
 const result=new Int32Array(n);for(let j=1;j<=n;j++)result[p[j]-1]=j-1;return Array.from(result);
}
export function buildCorrespondence(a,b){if(!a.length||a.length!==b.length)throw new RangeError('Equal non-empty triangle pools required');const n=a.length,A=features(a),B=features(b),matrix=new Float64Array(n*n);
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=A[i],y=B[j],dot=x.normal.reduce((s,v,k)=>s+v*y.normal[k],0),same=x.region===y.region,limb=['forelimb','hindlimb'].includes(x.region);matrix[i*n+j]=distance(x.p,y.p)*1.4+(same?distance(x.local,y.local)*.4:4.5)+(same&&limb&&x.side!==y.side?2:0)+(1-Math.max(-1,Math.min(1,dot)))*.22+Math.min(3,Math.abs(x.logArea-y.logArea))*.12+Math.min(3,Math.abs(x.aspect-y.aspect))*.08;}
 const indices=minimumAssignment(matrix,n),pairs=indices.map((j,i)=>[a[i],b[j]]),cost=indices.reduce((s,j,i)=>s+matrix[i*n+j],0),same=indices.filter((j,i)=>A[i].region===B[j].region).length,limbPairs=indices.map((j,i)=>({a:A[i],b:B[j]})).filter(p=>['forelimb','hindlimb'].includes(p.a.region)&&p.a.region===p.b.region);
 // Spatial sort is retained only as a measured baseline, not the mapping strategy.
 const order=f=>f.map((v,i)=>({i,key:v.p[0]*10000+v.p[1]*100+v.p[2]})).sort((a,b)=>a.key-b.key).map(v=>v.i),sa=order(A),sb=order(B),baseline=sa.reduce((s,i,k)=>s+matrix[i*n+sb[k]],0);
 return{pairs,indices,report:{method:'global Hungarian assignment',features:['anatomical region','normalized global and regional position','surface normal','relative face area','triangle aspect ratio','limb side'],triangles:n,cost,spatialBaselineCost:baseline,anatomicalAgreement:same/n,limbSideAgreement:limbPairs.length?limbPairs.filter(p=>p.a.side===p.b.side).length/limbPairs.length:1,unmatchedSource:0,unmatchedTarget:0,regionHeuristics:true,rigidCongruenceGuaranteed:false}};
}
