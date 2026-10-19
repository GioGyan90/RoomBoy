import * as THREE from 'three';
export function createCharacter(scene:THREE.Scene){
/* =========================================================
   6 · character
   ========================================================= */
const charRoot = new THREE.Group();
charRoot.name="haru";
const body = new THREE.Group();     // posture pivot, origin = hip joint
charRoot.add(body);

const J:Record<string,THREE.Group> = {};
const charMeshes:THREE.Mesh[] = [];

function grp(name:string, parent:THREE.Object3D, x=0, y=0, z=0){
  const g = new THREE.Group(); g.position.set(x,y,z); parent.add(g); J[name] = g; return g;
}
function addMesh(parent:THREE.Object3D, geo:THREE.BufferGeometry, mat:THREE.Material, x=0, y=0, z=0){
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x,y,z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m); charMeshes.push(m);
  return m;
}
const limb = (len:number, rTop:number, rBot:number) => { const g = new THREE.CylinderGeometry(rTop, rBot, len, 16, 1); g.translate(0, -len/2, 0); return g; };
const ball = (r:number, sx=1, sy=1, sz=1) => { const g = new THREE.SphereGeometry(r, 20, 16); g.scale(sx,sy,sz); return g; };

const SKIN   = new THREE.MeshStandardMaterial({ color:0xf2c6a2, roughness:0.62 });
const SKIN2  = new THREE.MeshStandardMaterial({ color:0xe4b28c, roughness:0.7 });
const SHIRT  = new THREE.MeshStandardMaterial({ color:0x17181d, roughness:0.9 });
const SHORTS = new THREE.MeshStandardMaterial({ color:0x585c64, roughness:0.94 });
const HAIR   = new THREE.MeshStandardMaterial({ color:0x17151c, roughness:0.42, metalness:0.18 });
const EYEW   = new THREE.MeshStandardMaterial({ color:0xf6f6f6, roughness:0.35 });
const EYEI   = new THREE.MeshStandardMaterial({ color:0x33262b, roughness:0.22 });
const MOUTH  = new THREE.MeshStandardMaterial({ color:0x9c5b55, roughness:0.6 });

/* --- pelvis / shorts --- */
const pelvis = grp('pelvis', body, 0, 0, 0);
addMesh(pelvis, limb(0.19, 0.128, 0.118), SHORTS, 0, 0.09, 0);
addMesh(pelvis, ball(0.11, 1.0, 0.75, 0.9), SHORTS, 0, -0.055, 0);

/* --- spine + chest (tank top) --- */
const spine = grp('spine', pelvis, 0, 0.10, 0);
addMesh(spine, limb(0.24, 0.118, 0.126), SHIRT, 0, 0.22, 0);
const chest = grp('chest', spine, 0, 0.20, 0);
addMesh(chest, ball(0.15, 1.06, 0.94, 0.74), SHIRT, 0, 0.06, 0);
addMesh(chest, ball(0.06, 1, 0.9, 1), SKIN, 0, 0.175, -0.005);      // neckline skin
for (const s of [-1, 1]){                                            // tank straps
  const st = addMesh(chest, new THREE.BoxGeometry(0.055, 0.12, 0.10), SHIRT, s*0.088, 0.15, 0.0);
  st.rotation.z = -s*0.34;
}
/* --- neck + head --- */
const neck = grp('neck', chest, 0, 0.20, 0);
addMesh(neck, limb(0.11, 0.045, 0.052), SKIN, 0, 0.06, 0);
const head = grp('head', neck, 0, 0.08, 0);

addMesh(head, ball(0.115, 0.96, 1.06, 1.0), SKIN, 0, 0.10, 0);
addMesh(head, ball(0.075, 1.0, 0.85, 0.95), SKIN, 0, 0.045, 0.042);  // jaw
for (const s of [-1,1]) addMesh(head, ball(0.024, 0.55, 1.0, 0.9), SKIN, s*0.104, 0.095, -0.005); // ears

// eyes
for (const s of [-1,1]){
  addMesh(head, ball(0.030, 1.0, 0.68, 0.35), EYEW, s*0.046, 0.108, 0.100);
  addMesh(head, ball(0.017, 1.0, 1.05, 0.55), EYEI, s*0.046, 0.106, 0.108);
  addMesh(head, ball(0.005), new THREE.MeshStandardMaterial({color:0xffffff, emissive:0x444444}), s*0.053, 0.115, 0.113);
  const brow = addMesh(head, new THREE.BoxGeometry(0.042, 0.009, 0.012), HAIR, s*0.047, 0.140, 0.101);
  brow.rotation.z = -s*0.12;
}
addMesh(head, ball(0.011), SKIN2, 0, 0.082, 0.108);                  // nose
addMesh(head, new THREE.BoxGeometry(0.030, 0.006, 0.008), MOUTH, 0, 0.050, 0.106);

// hair
addMesh(head, ball(0.124, 1.02, 0.98, 1.0), HAIR, 0, 0.118, -0.030);
addMesh(head, ball(0.10, 1.0, 0.8, 1.0), HAIR, 0, 0.055, -0.095);
{ // bangs
  const bangGeo = new THREE.ConeGeometry(0.048, 0.15, 5);
  const spots = [[-0.088,0.155,0.055,0.32],[-0.045,0.170,0.082,0.10],[0.005,0.175,0.090,-0.05],[0.055,0.168,0.080,-0.15],[0.095,0.150,0.050,-0.35]];
  for (const [x,y,z,rz] of spots){
    const b = addMesh(head, bangGeo, HAIR, x, y, z);
    b.rotation.set(3.05, 0, rz);
  }
  // side locks
  for (const s of [-1,1]){
    const l = addMesh(head, new THREE.ConeGeometry(0.035, 0.17, 5), HAIR, s*0.108, 0.075, 0.015);
    l.rotation.set(3.1, 0, s*0.12);
  }
  // back tuft
  const t = addMesh(head, new THREE.ConeGeometry(0.07, 0.14, 6), HAIR, 0, 0.06, -0.10);
  t.rotation.set(2.9, 0, 0);
}

/* --- arms --- */
for (const side of ['l','r']){
  const s = side === 'l' ? 1 : -1;
  const sh = grp(side+'Shoulder', chest, 0.156*s, 0.098, 0);
  addMesh(sh, ball(0.056), SKIN);                    // deltoid
  const ua = grp(side+'UpperArm', sh);
  addMesh(ua, limb(0.29, 0.047, 0.040), SKIN, 0, 0.005, 0);
  const fa = grp(side+'ForeArm', ua, 0, -0.29, 0);
  addMesh(fa, ball(0.041), SKIN);
  addMesh(fa, limb(0.26, 0.040, 0.031), SKIN);
  const hd = grp(side+'Hand', fa, 0, -0.26, 0);
  addMesh(hd, ball(0.045, 0.75, 1.15, 0.45), SKIN, 0, -0.045, 0.004);
}

/* --- legs --- */
for (const side of ['l','r']){
  const s = side === 'l' ? 1 : -1;
  const th = grp(side+'Thigh', pelvis, 0.082*s, -0.03, 0);
  addMesh(th, limb(0.48, 0.086, 0.056), SKIN);
  addMesh(th, limb(0.235, 0.101, 0.088), SHORTS, 0, 0.03, 0);   // shorts leg
  const sn = grp(side+'Shin', th, 0, -0.48, 0);
  addMesh(sn, ball(0.057), SKIN);
  addMesh(sn, limb(0.40, 0.058, 0.032), SKIN);
  const ft = grp(side+'Foot', sn, 0, -0.40, 0);
  const fm = addMesh(ft, new THREE.CapsuleGeometry(0.032, 0.13, 4, 12), SKIN);
  fm.rotation.x = Math.PI/2; fm.position.set(0, -0.034, 0.05); fm.scale.set(1.15, 1, 0.9);
  addMesh(ft, ball(0.030, 1.2, 0.65, 1.05), SKIN2, 0, -0.052, 0.148); // toes
  addMesh(ft, ball(0.035), SKIN, 0, -0.018, -0.030);                  // heel
}

/* --- plumbob (Sims-style mood diamond) --- */
const plumbob = new THREE.Mesh(
  new THREE.OctahedronGeometry(0.062, 0),
  new THREE.MeshStandardMaterial({ color:0x4ff08a, emissive:0x22a74e, emissiveIntensity:1.4,
                                   transparent:true, opacity:0.9, roughness:0.25 })
);
scene.add(plumbob);
const plumbobLight = new THREE.PointLight(0x54ff9a, 0.6, 1.4, 2);
scene.add(plumbobLight);

/* --- Zzz sprites --- */
const zMat = (()=>{
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.font = 'bold 96px sans-serif'; g.fillStyle = '#fff';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('Z', 64, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const zzz = [0,1,2].map(()=>{
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:zMat, transparent:true, opacity:0, depthWrite:false }));
  sp.scale.setScalar(0.14);
  scene.add(sp);
  return sp;
});


return {charRoot,body,J,charMeshes,plumbob,plumbobLight,zzz};
}
export type Character = ReturnType<typeof createCharacter>;
