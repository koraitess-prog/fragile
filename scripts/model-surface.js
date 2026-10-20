// Shared original SDF meshing helpers; importing this module writes no assets.
import * as THREE from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
export const sm=(a,b,k=.19)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
export function egg(x,y,z,cx,cy,cz,rx,ry,rz,angle=0){const xx=x-cx,yy=y-cy,c=Math.cos(angle),s=Math.sin(angle),a=(xx*c+yy*s)/rx,b=(-xx*s+yy*c)/ry,d=(z-cz)/rz;return(Math.sqrt(a*a+b*b+d*d)-1)*Math.min(rx,ry,rz);}
export function limb(x,y,z,a,b,ra,rb,flat=1){const px=x-a[0],py=(y-a[1])/flat,pz=z-a[2],vx=b[0]-a[0],vy=(b[1]-a[1])/flat,vz=b[2]-a[2],h=Math.max(0,Math.min(1,(px*vx+py*vy+pz*vz)/(vx*vx+vy*vy+vz*vz)));return(Math.hypot(px-vx*h,py-vy*h,pz-vz*h)-(ra+(rb-ra)*h))*Math.min(flat,1);}
export function polygonise(fn,step=.105,min=[-3.35,-1.8,-2.75],max=[2.4,1.5,2.75]){const nx=Math.ceil((max[0]-min[0])/step),ny=Math.ceil((max[1]-min[1])/step),nz=Math.ceil((max[2]-min[2])/step),sx=nx+1,sy=ny+1,values=new Float32Array(sx*sy*(nz+1)),coords=[];
 const index=(x,y,z)=>(z*sy+y)*sx+x;
 for(let z=0;z<=nz;z++)for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++)values[index(x,y,z)]=fn(min[0]+x*step,min[1]+y*step,min[2]+z*step);
 const offsets=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]],tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 function tri(a,b,c,dir){const ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]),normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];if(Math.hypot(...normal)<1e-11)return;if(normal.reduce((s,v,i)=>s+v*dir[i],0)<0)[b,c]=[c,b];coords.push(...a,...b,...c);}
 for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const v=offsets.map(o=>values[index(x+o[0],y+o[1],z+o[2])]);if(v.every(a=>a>=0)||v.every(a=>a<0))continue;
  const p=offsets.map(o=>[min[0]+(x+o[0])*step,min[1]+(y+o[1])*step,min[2]+(z+o[2])*step]);
  const cut=(i,j)=>{const t=v[i]/(v[i]-v[j]);return p[i].map((a,k)=>a+(p[j][k]-a)*t);};
  for(const tet of tets){const ins=tet.filter(i=>v[i]<0),out=tet.filter(i=>v[i]>=0);if(!ins.length||!out.length)continue;const dir=[0,1,2].map(k=>out.reduce((s,i)=>s+p[i][k],0)/out.length-ins.reduce((s,i)=>s+p[i][k],0)/ins.length);
   if(ins.length===1)tri(cut(ins[0],out[0]),cut(ins[0],out[1]),cut(ins[0],out[2]),dir);
   else if(ins.length===3)tri(cut(out[0],ins[0]),cut(out[0],ins[1]),cut(out[0],ins[2]),dir);
   else{const a=cut(ins[0],out[0]),b=cut(ins[0],out[1]),c=cut(ins[1],out[0]),d=cut(ins[1],out[1]);tri(a,b,c,dir);tri(b,d,c,dir);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));return mergeVertices(g,1e-5);}
