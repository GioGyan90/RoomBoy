import {element} from './dom';
import {clamp} from '../core/math';
import type {Actions} from '../game/actions';
export function createPieMenu(actions:Actions){
const {ACTIONS,runAction}=actions;
const pie = element('pie');
const pieLabel = element('pieLabel');
let pieOpen = false;
let hoverChar = false;

function buildPie(){
  const n = ACTIONS.length;
  ACTIONS.forEach((a, i)=>{
    const ang = -90 + i*(360/n);
    const b = document.createElement('button');
    b.className = 'pie-item';
    b.type = 'button';
    b.style.setProperty('--a', ang + 'deg');
    b.style.transitionDelay = (i*26) + 'ms';
    b.textContent = a.icon;b.setAttribute('aria-label',a.label);b.dataset.action=a.id;
    b.addEventListener('mouseenter', ()=>{ pieLabel.textContent = a.label; pieLabel.classList.add('show'); });
    b.addEventListener('mouseleave', ()=> pieLabel.classList.remove('show'));
    b.addEventListener('click', (e)=>{
      e.stopPropagation();
      closePie();
      runAction(a);
    });
    pie.appendChild(b);
  });
  element('pieClose').addEventListener('click', (e)=>{ e.stopPropagation(); closePie(); });
  pie.addEventListener('pointerdown', e=> e.stopPropagation());
}
buildPie();

function openPie(x:number, y:number){
  x = clamp(x, 165, innerWidth - 165);
  y = clamp(y, 185, innerHeight - 165);
  pie.style.left = x + 'px';
  pie.style.top  = y + 'px';
  pie.classList.remove('hidden');
  pieOpen = true;
  pieLabel.classList.remove('show');
  requestAnimationFrame(()=> pie.classList.add('show'));
}
function closePie(){
  if (!pieOpen) return;
  pieOpen = false;
  pie.classList.remove('show');
  pieLabel.classList.remove('show');
  setTimeout(()=>{ if (!pieOpen) pie.classList.add('hidden'); }, 240);
}
document.addEventListener('pointerdown', (e)=>{
  if (pieOpen && !pie.contains(e.target as Node)) closePie();
});


return {openPie,closePie,isOpen:()=>pieOpen};
}
export type PieMenu=ReturnType<typeof createPieMenu>;
