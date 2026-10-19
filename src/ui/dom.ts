export function element(id:string):HTMLElement {
 const el=document.getElementById(id);if(!el)throw new Error(`Missing UI element: ${id}`);return el;
}
