import * as THREE from 'three';
import {buildCorrespondence} from './correspondence.js';
export function faceData(model){const source=model.positions,faces=[];for(let i=0;i<source.length;i+=9){const a=new THREE.Vector3(...source.slice(i,i+3)),b=new THREE.Vector3(...source.slice(i+3,i+6)),c=new THREE.Vector3(...source.slice(i+6,i+9)),center=a.clone().add(b).add(c).multiplyScalar(1/3),u=b.clone().sub(a).normalize(),normal=b.clone().sub(a).cross(c.clone().sub(a)),area=normal.length()*.5;normal.normalize();const v=normal.clone().cross(u),quaternion=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(u,v,normal)),local=[];for(const vertex of [a,b,c]){vertex.sub(center);local.push(vertex.dot(u),vertex.dot(v),0);}faces.push({id:i/9,animal:model.name,center,quaternion,normal,area,local,original:source.slice(i,i+9)});}return faces;}
export function correspondence(a,b,...others){
 // Keep the approved rhino/turtle assignment. Each persistent fragment gains
 // one destination per added species; closing the cycle retains that identity.
 let pairs=buildCorrespondence(a,b).pairs;
 for(const next of others){const mapped=buildCorrespondence(pairs.map(pair=>pair.at(-1)),next).pairs;pairs=pairs.map((pair,i)=>[...pair,mapped[i][1]]);}
 return pairs;
}
