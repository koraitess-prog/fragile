import * as THREE from 'three';
function radicalInverse(index){let result=0,weight=.5;while(index){result+=(index%2)*weight;index=Math.floor(index/2);weight*=.5;}return result;}
export function spreadPoint(index,count,aspect=1,orientation=new THREE.Quaternion(),out=new THREE.Vector3()){
 // Low-discrepancy rounded rectangle: deliberate coverage, not random clumps.
 const x=2*(index+.5)/count-1,y=2*radicalInverse(index+1)-1,round=1-.11*(Math.abs(x*y)**3);
 const height=4.5,width=height*Math.max(.3,Math.min(3.2,aspect)),layer=Math.sin(index*2.3999632297);
 return out.set(x*width*round,(y*.94+.045*Math.sin(x*Math.PI))*height*round,layer*1.8+x*.3).applyQuaternion(orientation);
}
