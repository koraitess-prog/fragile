// A drag stays a drag even when the pointer returns to its starting point.
export function createGestureTracker(threshold=8){
 let active=null;
 function move(e){if(active?.id===e.pointerId&&Math.hypot(e.clientX-active.x,e.clientY-active.y)>=threshold)active.dragged=true;}
 return{
  start(e){if(e.isPrimary===false||e.button!==0){if(active)active.dragged=true;return;}active={id:e.pointerId,x:e.clientX,y:e.clientY,dragged:false};},
  move,
  finish(e){if(active?.id!==e.pointerId)return false;move(e);const click=!active.dragged;active=null;return click;},
  cancel(){active=null;},
  get dragging(){return !!active?.dragged;}
 };
}
