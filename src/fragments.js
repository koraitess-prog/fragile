import * as THREE from 'three';
import {timing} from './transitions.js';
import {spreadPoint} from './fragment-spread.js';
import {faceData} from './geometry.js';
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453123;return v-Math.floor(v);};
export function createFragments(pairs){
 const count=pairs.length,positions=new Float32Array(count*9),normals=new Float32Array(count*9),colors=new Float32Array(count*9),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3).setUsage(THREE.DynamicDrawUsage));
 const palette=['#383e40','#4c5558','#32383a','#596264','#737d80'];
 for(let i=0;i<count;i++){const color=new THREE.Color(palette[Math.floor(hash(i+12)*palette.length)]);for(let j=0;j<3;j++){colors[i*9+j*3]=color.r;colors[i*9+j*3+1]=color.g;colors[i*9+j*3+2]=color.b;}}
 geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.boundingSphere=new THREE.Sphere(new THREE.Vector3(),12);
 // Draw the edges of the animated triangles themselves, with no surface pass.
 const material=new THREE.MeshBasicMaterial({color:'#e8e8e8',wireframe:true,side:THREE.DoubleSide,toneMapped:false});const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=false;mesh.frustumCulled=false;
 const data=pairs.map((pair,i)=>{const angle=hash(i+19)*Math.PI*2,radius=1.5+hash(i+79)*1.4;return{pair,cloud:new THREE.Vector3(Math.cos(angle)*radius,(hash(i+43)-.5)*3,Math.sin(angle)*radius*.72),spin:new THREE.Quaternion().setFromEuler(new THREE.Euler(hash(i+7)*4-2,hash(i+113)*5,hash(i+277)*4-2)),delay:0,arrival:0,phase:hash(i+139)*Math.PI*2};});
 const center=new THREE.Vector3(),q=new THREE.Quaternion(),spin=new THREE.Quaternion(),temp=new THREE.Vector3(),identity=new THREE.Quaternion();let captured=null;
 // Optional live-pose source: the approved cloud, timing, destination slots and
 // spin choreography stay intact. Sitting need not unfold before breaking up.
 function prepare(source,point,view={},sourcePositions=null){captured=sourcePositions?faceData({name:data[0].pair[source].animal,positions:Array.from(sourcePositions)}):null;const from=data.map((d,i)=>(captured?.[i]??d.pair[source]).center.distanceTo(point)),max=Math.max(...from);for(let i=0;i<count;i++){spreadPoint(i,count,view.aspect,view.orientation,data[i].cloud);data[i].delay=from[i]/max*.6;const dest=data[i].pair[(source+1)%pairs[0].length].center;data[i].arrival=(dest.x+3.4)/6.8*.44+hash(i+55)*.14;}}
 function update(source,t=-1){const moving=t>=0;for(let i=0;i<count;i++){const d=data[i],a=moving&&captured?captured[i]:d.pair[source],b=d.pair[(source+1)%pairs[0].length];let morph=0;if(!moving){center.copy(a.center);q.copy(a.quaternion);}else{const phase=timing(t,d.delay,d.arrival);morph=phase.arrive;const cloud=d.cloud;
   center.copy(a.center).lerp(cloud,phase.leave);center.x+=Math.sin(phase.leave*Math.PI)*.32*Math.cos(d.phase);center.y+=Math.sin(phase.leave*Math.PI)*.4;
   // A slow suspended orbit holds depth; it fades out at both closed endpoints.
   const float=phase.leave*(1-phase.arrive);center.x+=Math.sin(t*.8+d.phase)*.13*float;center.y+=Math.cos(t*.7+d.phase)*.12*float;
   center.lerp(b.center,phase.arrive);center.z+=Math.sin(phase.arrive*Math.PI)*.32*Math.sin(d.phase);
   q.copy(a.quaternion).slerp(b.quaternion,morph);spin.copy(identity).slerp(d.spin,phase.leave*(1-phase.arrive));q.multiply(spin);
  }
  for(let j=0;j<3;j++){const k=j*3;temp.set(THREE.MathUtils.lerp(a.local[k],b.local[k],morph),THREE.MathUtils.lerp(a.local[k+1],b.local[k+1],morph),0).applyQuaternion(q).add(center);const o=i*9+k;positions[o]=temp.x;positions[o+1]=temp.y;positions[o+2]=temp.z;}
  const o=i*9,ax=positions[o+3]-positions[o],ay=positions[o+4]-positions[o+1],az=positions[o+5]-positions[o+2],bx=positions[o+6]-positions[o],by=positions[o+7]-positions[o+1],bz=positions[o+8]-positions[o+2];let nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx,len=Math.hypot(nx,ny,nz)||1;nx/=len;ny/=len;nz/=len;for(let j=0;j<3;j++){normals[o+j*3]=nx;normals[o+j*3+1]=ny;normals[o+j*3+2]=nz;}
 }
 geometry.attributes.position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;}
 update(0);return{mesh,prepare,update,count,positions,get hasCapturedSource(){return !!captured;},dispose(){geometry.dispose();material.dispose();}};
}
