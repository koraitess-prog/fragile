export const DURATION=5.5;
export const clamp=t=>Math.max(0,Math.min(1,t));
export const ease=t=>{t=clamp(t);return t*t*t*(t*(t*6-15)+10);};
export function phaseAt(t){return t<.7?'disassembly':t<2.3?'suspension':t<5?'reconstruction':'alignment';}
export function timing(t,delay,arrival){return{leave:ease((t-delay)/1.55),arrive:ease((t-2.3-arrival)/2.35),spin:Math.sin(Math.PI*clamp((t-delay)/4.95))};}
