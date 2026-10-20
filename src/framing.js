import * as THREE from 'three';

// Approved collection envelope at checkpoint f119ebd. Keep its composition,
// move 14% closer, then fit the ACTUAL animated vertices when more room is needed.
const min=[-2.52,-1.499751,-2.076931],max=[2.75,1.294011,2.075674];
export function createFraming(camera,root,target){
 const corners=[];for(const x of [min[0],max[0]])for(const y of [min[1],max[1]])for(const z of [min[2],max[2]])corners.push(new THREE.Vector3(x,y,z));
 const point=new THREE.Vector3(),direction=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3();
 let referenceDistance=0,requiredDistance=0;
 function update(dt,narrow,spread=0){
  root.updateMatrixWorld(true);direction.copy(camera.position).sub(target).normalize();right.crossVectors(camera.up,direction).normalize();up.crossVectors(direction,right);
  const tangent=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));referenceDistance=narrow?Math.max(16.8,12/camera.aspect):12.3;
  for(const corner of corners){point.copy(corner).applyMatrix4(root.matrixWorld).sub(target);const depth=point.dot(direction);referenceDistance=Math.max(referenceDistance,depth+Math.abs(point.dot(right))/(tangent*camera.aspect*.85),depth+Math.abs(point.dot(up))/(tangent*.8));}
  requiredDistance=referenceDistance/1.14;
  // Camera-space perspective constraints include depth, not just a screen box.
  // The lower margin reserves the existing caption area. Fragment vertices are
  // checked too, so the original explosion can expand safely from any angle.
  for(const child of root.children){const positions=child.geometry?.attributes.position;if(!positions)continue;
   for(let i=0;i<positions.count;i++){
    point.fromBufferAttribute(positions,i).applyMatrix4(child.matrixWorld).sub(target);
    const depth=point.dot(direction),vertical=point.dot(up);
    const bottom=.62+.18*Math.max(0,Math.min(1,spread));
    requiredDistance=Math.max(requiredDistance,depth+Math.abs(point.dot(right))/(tangent*camera.aspect*.84),depth+Math.abs(vertical)/(tangent*(vertical>=0?.80:bottom)),depth+camera.near+.05);
   }
  }
  const radius=camera.position.distanceTo(target),distance=requiredDistance>radius?requiredDistance:THREE.MathUtils.damp(radius,requiredDistance,4,dt);
  camera.position.copy(target).addScaledVector(direction,distance);camera.lookAt(target);
  const far=Math.max(60,distance+20);if(camera.far!==far){camera.far=far;camera.updateProjectionMatrix();}
 }
 return{update,get referenceDistance(){return referenceDistance;},get requiredDistance(){return requiredDistance;}};
}
