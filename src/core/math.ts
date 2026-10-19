export const clamp = (v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
export const damp = (a:number,b:number,k:number,dt:number)=>a+(b-a)*(1-Math.exp(-k*dt));
export const rand = (a:number,b:number)=>a+Math.random()*(b-a);
export function angleLerp(a:number,b:number,t:number){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return a+d*t;}
