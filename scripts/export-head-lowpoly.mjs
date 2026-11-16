// Bake the reference-guided low-poly cage to a standalone script at build time.
// This is a reproducible procedural reconstruction, not an unlicensed GLB copy.
import {mkdirSync,writeFileSync} from 'node:fs';
import {makeEdgeLowpolyData,serializeLowpolyHead,lowpolyStats,headContourError,referenceEdgeStations,sourceReference} from '../src/experiments/head/edgeLowpoly.js';
const data=makeEdgeLowpolyData({},3),stats=lowpolyStats(data),err=headContourError(data);
if(stats.triangles>=5000 || stats.triangles===0 || err.rows.length!==57)throw new Error('unexpected low-poly head geometry');
mkdirSync('public',{recursive:true});
writeFileSync('public/grey-head-lowpoly.js',serializeLowpolyHead(data),'utf8');
const round=n=>Math.round(n*1e6)/1e6;
writeFileSync('public/grey-head-lowpoly.report.json',JSON.stringify({
 source:sourceReference,lowpoly:stats,
 fit:{widthRms:round(err.widthRms),frontRms:round(err.frontRms),rearRms:round(err.rearRms)},
 edgeStations:referenceEdgeStations()
},null,2)+'\n');
console.log('Built low-poly standalone JS:',stats,'silhouette RMS:',round(err.widthRms),round(err.rearRms));
