import {parameterGroups,specs,defaults,normalizeParameters,serializeParameters,parseParameters} from './parameters.js';
const storageKey='roomboy:boy-head:shape:v2';
export function createParameterPanel(root,onChange){
 let params={...defaults},stage=3;
 const fields=new Map();
 root.innerHTML=`<p class="param-help">${Object.keys(specs).length} 项结构参数 · 1 为比例基准，0 为位置基准。数值只在各自范围内生效。</p><div class="parameter-groups"></div><div class="preset-actions"><button data-action="save">保存到本机</button><button data-action="load">载入本机参数</button></div><details class="preset-json"><summary>复制 / 导入参数 JSON</summary><p>可复制给下一轮继续修改，也可在其他设备粘贴导入。</p><textarea aria-label="参数 JSON" spellcheck="false"></textarea><div class="preset-actions"><button data-action="export">生成当前 JSON</button><button data-action="copy">复制 JSON</button><button data-action="import">应用 JSON</button></div></details><output class="param-status" role="status" aria-live="polite"></output>`;
 const status=root.querySelector('.param-status'),json=root.querySelector('textarea');
 const notify=message=>status.textContent=message;
 function refresh(editingId){
  for(const [id,{range,number,label}]of fields){const spec=specs[id];range.value=String(params[id]);if(id!==editingId)number.value=params[id].toFixed(3).replace(/0+$/,'').replace(/\.$/,'');range.disabled=number.disabled=stage<spec[6];label.classList.toggle('inactive',stage<spec[6]);}
 }
 function update(id,value,editing=false){
  if(!Number.isFinite(value)){notify('请输入有效数字。');refresh();return;}
  const s=specs[id];params=normalizeParameters({...params,[id]:value});refresh(editing?id:undefined);onChange({...params});
  if(params[id]!==value)notify(`${s[1]}已限制在 ${s[2]}～${s[3]}。`);else notify(`${s[1]}：${params[id].toFixed(3)}`);
 }
 for(const group of parameterGroups){
  const details=document.createElement('details');details.className='parameter-group';details.open=group.name==='吻部体块';
  details.innerHTML=`<summary>${group.name}<span>${group.items.length} 项</span></summary><p>${group.hint}</p><div class="parameter-fields"></div><button class="group-reset">重置本组</button>`;
  for(const s of group.items){
   const [id,name,min,max,value,step,first,hint]=s;
   const label=document.createElement('div');label.className='parameter';label.dataset.parameter=id;
   label.innerHTML=`<div class="parameter-title"><label for="head-${id}">${name}</label><input class="parameter-number" type="number" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${name}数值"></div><input id="head-${id}" type="range" min="${min}" max="${max}" value="${value}" step="${step}" aria-label="${name}"><small>${hint}<span class="stage-hint"> · 阶段 ${first} 起生效</span></small>`;
   const range=label.querySelector('input[type=range]'),number=label.querySelector('input[type=number]');
   range.oninput=()=>update(id,Number(range.value));
   number.oninput=()=>{if(number.value!==''&&Number.isFinite(Number(number.value)))update(id,Number(number.value),true);};
   number.onchange=()=>update(id,number.value===''?NaN:Number(number.value));
   fields.set(id,{range,number,label});details.querySelector('.parameter-fields').append(label);
  }
  details.querySelector('.group-reset').onclick=()=>{for(const s of group.items)params[s[0]]=s[4];refresh();onChange({...params});notify(group.name+'已恢复默认。');};
  root.querySelector('.parameter-groups').append(details);
 }
 root.querySelector('[data-action=save]').onclick=()=>{try{localStorage.setItem(storageKey,serializeParameters(params));notify('已保存到当前浏览器；跨设备请复制 JSON。');}catch{notify('浏览器不允许本地保存，请使用 JSON。');}};
 root.querySelector('[data-action=load]').onclick=()=>{try{const saved=localStorage.getItem(storageKey);if(!saved){notify('本机尚无已保存参数。');return;}params=parseParameters(saved);refresh();onChange({...params});notify('已载入本机保存的参数。');}catch(e){notify('载入失败：'+e.message);}};
 root.querySelector('[data-action=export]').onclick=()=>{json.value=serializeParameters(params);notify('已生成当前参数，可复制或保存文本。');};
 root.querySelector('[data-action=copy]').onclick=async()=>{json.value=serializeParameters(params);try{await navigator.clipboard.writeText(json.value);notify('已复制当前参数 JSON。');}catch{json.focus();json.select();notify('请长按或使用系统复制选中的 JSON。');}};
 root.querySelector('[data-action=import]').onclick=()=>{try{const next=parseParameters(json.value);params=next;refresh();onChange({...params});notify('已应用参数；超出范围的数值已限制到编辑范围。');}catch(e){notify(e.message);}};
 refresh();
 return {setStage(value){stage=value;refresh();},reset(){params={...defaults};refresh();onChange({...params});notify('全部参数已恢复默认；本机存档保留。');}};
}
