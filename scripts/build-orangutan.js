import fs from 'node:fs';
import assert from 'node:assert/strict';
import {sm,egg,limb,polygonise} from './model-surface.js';
import {simplify} from './simplify.js';
import {splitTo} from './triangle-budget.js';

// Original reference-informed Tapanuli sculpture: small flatter face, compact
// abdomen, very long relaxed arms, short bent legs and grasping-shaped feet.
function orangutan(x,y,z){
 let d=egg(x,y,z,0,.05,0,.66,.86,.46);
 d=sm(d,egg(x,y,z,0,-.29,.035,.65,.60,.49),.18);
 d=sm(d,egg(x,y,z,0,-.56,0,.55,.32,.40),.15);
 d=sm(d,limb(x,y,z,[0,.56,0],[0,.97,.035],.29,.26),.13);
 d=sm(d,egg(x,y,z,0,1.15,.035,.39,.43,.34),.12);
 d=sm(d,egg(x,y,z,0,1.02,.28,.285,.27,.13),.065);
 d=sm(d,egg(x,y,z,0,.86,.32,.235,.16,.15),.055);
 d=sm(d,egg(x,y,z,0,.73,.22,.20,.17,.17),.05);
 for(const side of [-1,1]){
  d=sm(d,egg(x,y,z,side*.30,1.08,.13,.145,.24,.16),.055);
  d=sm(d,egg(x,y,z,side*.58,.57,0,.29,.34,.34),.16);
  d=sm(d,limb(x,y,z,[side*.63,.53,0],[side*1.10,-.19,.08],.25,.19),.13);
  d=sm(d,limb(x,y,z,[side*1.10,-.19,.08],[side*1.33,-.99,.25],.205,.145),.10);
  d=sm(d,egg(x,y,z,side*1.35,-1.17,.28,.17,.265,.165),.07);
  d=sm(d,limb(x,y,z,[side*1.37,-1.30,.28],[side*1.34,-1.38,.40],.12,.07),.04);
  d=sm(d,limb(x,y,z,[side*.34,-.46,0],[side*.57,-.96,.12],.275,.215),.14);
  d=sm(d,limb(x,y,z,[side*.57,-.96,.12],[side*.51,-1.36,.06],.21,.15),.09);
  d=sm(d,egg(x,y,z,side*.53,-1.43,.20,.235,.125,.32),.075);
 }
 return d;
}
const mesh=polygonise(orangutan,.107,[-1.85,-1.7,-.8],[1.85,1.85,.85]);
const positions=splitTo(simplify(mesh,220,'orangutan'),220).map(v=>Math.round(v*1e6)/1e6);
assert.equal(positions.length,220*9);
const edges=new Map(),vertices=new Set();
for(let i=0;i<positions.length;i+=9){const keys=[0,3,6].map(j=>positions.slice(i+j,i+j+3).join(','));keys.forEach(k=>vertices.add(k));for(let k=0;k<3;k++){const a=keys[k],b=keys[(k+1)%3],key=[a,b].sort().join('|'),e=edges.get(key)||{count:0,direction:0};e.count++;e.direction+=a<b?1:-1;edges.set(key,e);}}
assert.equal(vertices.size,112);assert.ok([...edges.values()].every(e=>e.count===2&&e.direction===0),'Open or inconsistent sculpture');
fs.writeFileSync(new URL('../public/models/orangutan.json',import.meta.url),JSON.stringify({name:'orangutan',triangles:220,positions}));
mesh.dispose();console.log('Saved original Tapanuli orangutan: 220 triangles. Other models unchanged.');
