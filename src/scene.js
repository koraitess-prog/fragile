import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createFraming} from './framing.js';
export function createScene(container,models){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;container.appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#000000');
 const camera=new THREE.PerspectiveCamera(34,1,.1,60),root=new THREE.Group();scene.add(root);
 scene.add(new THREE.HemisphereLight('#f4f6f8','#777f7d',1.5));
 const key=new THREE.DirectionalLight('#f8fbff',3.2);key.position.set(-3,7,6);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-6,right:6,top:5,bottom:-5,near:.1,far:22});key.shadow.normalBias=.035;key.shadow.bias=-.0002;key.shadow.radius=4;scene.add(key);
 const fill=new THREE.DirectionalLight('#d6dee3',1.15);fill.position.set(5,2,-1);scene.add(fill);
 const rim=new THREE.DirectionalLight('#ffffff',1.8);rim.position.set(-4,4,-6);scene.add(rim);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:'#77776b',opacity:.15}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.47;ground.receiveShadow=true;ground.visible=false;scene.add(ground);
 const target=new THREE.Vector3(0,.05,0);let narrow=false,lastTime=0;
 camera.position.set(-12.3*.35,12.3*.235,12.3*.91);
 const controls=new OrbitControls(camera,container);controls.target.copy(target);
 controls.enableDamping=true;controls.dampingFactor=.09;controls.rotateSpeed=.65;
 controls.enableZoom=false;controls.enablePan=false;
 controls.minPolarAngle=THREE.MathUtils.degToRad(20);controls.maxPolarAngle=THREE.MathUtils.degToRad(80);
 controls.mouseButtons.MIDDLE=null;controls.mouseButtons.RIGHT=null;controls.touches.TWO=null;
 controls.update();
 const framing=createFraming(camera,root,target),point=new THREE.Vector3();let inspectedFrames=0,clippedFrames=0;
 function resize(){const w=container.clientWidth,h=container.clientHeight;narrow=w<650;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=narrow?39:34;camera.updateProjectionMatrix();}
 function update(t,moving,turtle=0,spread=0){const dt=Math.min(.05,Math.max(0,t-lastTime));lastTime=t;root.position.y=.35;root.rotation.y=.08;root.rotation.z=0;const scale=THREE.MathUtils.lerp(narrow?1.18:1.45,1,spread);root.scale.setScalar(scale);ground.position.y=-1.43*scale+.35;controls.update(dt);framing.update(dt,narrow,spread);}
 function inspection(){
  // QA only: measure the rendered vertices against the actual camera frustum.
  const projected=new THREE.Box3();camera.updateMatrixWorld();
  for(const child of root.children){const positions=child.geometry?.attributes.position;if(positions)for(let i=0;i<positions.count;i++)projected.expandByPoint(point.fromBufferAttribute(positions,i).applyMatrix4(child.matrixWorld).project(camera));}
  const fullyVisible=projected.min.x>=-1&&projected.max.x<=1&&projected.min.y>=-1&&projected.max.y<=1&&projected.min.z>=-1&&projected.max.z<=1;inspectedFrames++;if(!fullyVisible)clippedFrames++;
  return{azimuth:controls.getAzimuthalAngle(),polar:controls.getPolarAngle(),distance:camera.position.distanceTo(target),fullyVisible,inspectedFrames,clippedFrames,approvedReferenceDistance:framing.referenceDistance,projectedBounds:{min:projected.min.toArray(),max:projected.max.toArray()}};
 }
 addEventListener('resize',resize);resize();update(0,false);
 function spreadView(){root.updateMatrixWorld(true);camera.updateMatrixWorld();return{aspect:camera.aspect,orientation:root.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(camera.getWorldQuaternion(new THREE.Quaternion()))};}
 return{renderer,scene,camera,root,ground,resize,update,spreadView,narrow:()=>narrow,inspection,dispose(){controls.dispose();removeEventListener('resize',resize);renderer.dispose();ground.geometry.dispose();ground.material.dispose();}};
}
