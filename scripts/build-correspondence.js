import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {faceData} from '../src/geometry.js';
import {buildCorrespondence} from '../src/correspondence.js';
const models=['rhino','turtle'].map(name=>JSON.parse(fs.readFileSync(new URL(`../public/models/${name}.json`,import.meta.url),'utf8'))),result=buildCorrespondence(...models.map(faceData));
const inverse=new Array(result.indices.length);result.indices.forEach((j,i)=>inverse[j]=i);
const fingerprint=m=>createHash('sha256').update(JSON.stringify(m.positions)).digest('hex');
fs.writeFileSync(new URL('../public/models/correspondence.json',import.meta.url),JSON.stringify({source:'rhino',target:'turtle',meshFingerprints:models.map(m=>({name:m.name,positionsSHA256:fingerprint(m)})),forward:result.indices,inverse,report:result.report},null,2));console.log(JSON.stringify(result.report,null,2));
