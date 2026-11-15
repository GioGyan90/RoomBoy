// Landmark fit to the user-provided front/side/back design sheet (2026-11-15).
// Values are measured/estimated artistic targets, not generic anatomical ratios.
const heights=[[-1.10,-1.10],[-1.02,-1.02],[-.91,-.94],[-.72,-.82],[-.55,-.69],[-.46,-.63],[-.405,-.59],[-.38,-.57],[-.30,-.48],[-.22,-.43],[-.04,-.14],[.14,.01],[.36,.24],[.57,.55],[.82,.85],[1.23,1.23],[1.40,1.40]];
const widths=[[-1.10,.86],[-.91,.86],[-.72,.84],[-.55,.84],[-.38,.88],[-.22,.91],[-.04,.96],[.17,.97],[.36,.98],[.57,1],[1.4,1]];
function sample(table,y){
 for(let i=1;i<table.length;i++)if(y<=table[i][0]){const [a,b]=table[i-1],[c,d]=table[i];return b+(d-b)*(y-a)/(c-a);}
 return table.at(-1)[1];
}
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export function fitReferenceVertex(v,ear=false){
 const [x,y,z]=v,ax=Math.abs(x);
 let width=sample(widths,y),depth=z;
 if(ear)return [(x<0?-1:1)*(.72+(ax-.78)*.90),sample(heights,y),z-.48];
 // Narrow nasal side planes while preserving medial cheek support.
 const nasal=(1-smooth(.12,.30,ax))*smooth(-.39,-.22,y)*(1-smooth(-.04,.14,y));
 width*=1-.20*nasal;
 // Flatten the protruding upper lip and bring the chin into the reference profile.

 depth-=.025*smooth(-.72,-.55,y)*(1-smooth(-.38,-.30,y))*(1-smooth(.12,.30,ax));
 // Broad cheek plane: suppress row-by-row steps outside the compact oral mound.
 const cheek=smooth(.22,.40,ax)*(1-smooth(.62,.82,ax))*smooth(-.91,-.72,y)*(1-smooth(-.04,.17,y))*smooth(.03,.35,z);
 const target=.66-.25*ax+.10*(sample(heights,y)+.4);
 depth=depth*(1-cheek*.80)+target*cheek*.80;
 if(z<0)depth*=1.04;
 return [x*width,sample(heights,y),depth];
}
export function referenceHeight(y){return sample(heights,y);}
