import * as T from 'three';
import { detachLegacyPelvis } from '../assets/parts/pelvis';
import { bodyPlan, createBodyBlockout } from '../assets/procedural/bodyBlockout';
import { landmarkNames, maleStudyCrops, referenceFrame, viewJoints, type JointName, type StudyCrop, type StudyView } from '../assets/procedural/bodyReference';
import { createFemaleBodyBlockout, femalePartLabels } from '../assets/procedural/femaleBodyBlockout';
import { femaleBodyPlan, femaleSheet, femaleStudyCrops, femaleStudyJoints } from '../assets/procedural/femaleBodyReference';
import { addLandmarkMarkers, addViewTargets, addReferenceProjection, clearStudyGroup, addEditedVertices } from './structureReference';

const rotations = { front: 0, side: -Math.PI / 2, back: Math.PI, quarter: -Math.PI / 4, 'rear-quarter': Math.PI * .75 };
const viewNames = { front: '正面', side: '侧面', back: '背面', quarter: '前斜侧', 'rear-quarter': '后斜侧' };
const orthographic = ['front', 'side', 'back'] as const;
type View = keyof typeof rotations;
type Angle = View | 'three' | 'four';

function canonical(view: View): view is StudyView {
  return view === 'front' || view === 'side' || view === 'back';
}

/** Independent static modelling studio. Does not alter the playable rig. */
export function startStructureStudio() {
  const query = new URLSearchParams(location.search);
  const capture = query.get('capture') === '1';
  const female = query.get('body') === 'female';
  const plan = female ? femaleBodyPlan : bodyPlan;
  const sheet = female ? femaleSheet : referenceFrame;
  const joints = female ? femaleStudyJoints : viewJoints;
  const names = female ? { ...viewNames, quarter: '半侧' } : viewNames;
  const crops: Partial<Record<View, StudyCrop>> = female ? femaleStudyCrops : maleStudyCrops;
  const angles: Angle[] = [...(female ? ['four' as const] : []), 'three', ...orthographic, 'quarter', 'rear-quarter'];
  const requestedAngle = query.get('angle') as Angle;
  let angle = angles.includes(requestedAngle) ? requestedAngle : female && innerWidth > 650 ? 'four' : 'three';
  let focus = query.get('focus') ?? 'body';
  const requestedPart = query.get('part') ?? '';
  let part = female && Object.hasOwn(femalePartLabels, requestedPart) ? requestedPart : '';
  let partBounds: T.Box3 | undefined;
  let silhouette = false, wire = false, showGuides = !capture;
  let showEdits = !female && query.get('edits') === '1';
  let showPoints = query.get('points') === '1';
  let overlay = false, referenceReady = false, referenceOpacity = .55, paired = false;
  let labelPositions: number[] = [];

  document.querySelectorAll('#hud,#hint,#pie,#loader').forEach(element => element.remove());
  document.body.classList.add('structure-studio');
  const scene = new T.Scene();
  scene.background = new T.Color(0xf2f1ec);
  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = T.SRGBColorSpace;
  document.body.append(renderer.domElement);
  scene.add(new T.HemisphereLight(0xffffff, 0xc4c0b8, 2.2));
  const key = new T.DirectionalLight(0xffffff, 2.5);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const fill = new T.DirectionalLight(0xffffff, .8);
  fill.position.set(4, 2, -2);
  scene.add(fill);
  const camera = new T.OrthographicCamera(-1.2, 1.2, 1.2, -1.2, .1, 20);
  const models = new T.Group(), guides = new T.Group(), overlays = new T.Group(), markers = new T.Group();
  scene.add(models, guides, overlays, markers);

  const ui = document.createElement('section');
  ui.id = 'structure-ui';
  ui.innerHTML = `<header><div><small>CHARACTER STUDY · 01</small><h1>${female ? '女性人体 · 低模临摹' : '先把结构做准'}</h1>
    <p>${female ? '正侧背面对齐截面，半侧面复核体块。' : '旧臀块已移除，新分块等待确认。<a href="?view=pelvis">审阅独立臀块 ↗</a>'}</p></div><a href="?view=character">查看游戏人物 ↗</a></header>
  <nav aria-label="建模对象"><a href="?view=structure" ${female ? '' : 'aria-current="page"'}>男性结构</a><a href="?view=structure&body=female" ${female ? 'aria-current="page"' : ''}>女性结构</a></nav>
  <nav aria-label="建模阶段"><button class="active" data-stage="blockout">01 几何体块</button><button data-stage="planes" disabled title="完成简化体块对齐后再进入低面细化">02 低面结构</button></nav>
  <nav aria-label="检查视角">${angles.map(value => `<button data-angle="${value}">${value === 'three' ? '三视同屏' : value === 'four' ? '四视同屏' : names[value]}</button>`).join('')}</nav>
  <nav aria-label="局部放大"><button data-focus="body">全身</button><button data-focus="neck">颈胸放大</button><button data-focus="hips">臀腿放大</button>
    ${female ? `<select id="structure-part" aria-label="单独查看分块"><option value="">查看分块</option>${Object.entries(femalePartLabels).map(([id, label]) => `<option value="${id}">${label}</option>`).join('')}</select>` : ''}</nav>
  <nav aria-label="检查选项"><button id="structure-silhouette">剪影</button><button id="structure-wire">线框</button><button id="structure-guides" class="active">比例线</button>
    <button id="structure-points">关节定位点</button>${female ? '' : '<button id="structure-edits">本轮改点</button>'}
    <button id="structure-reference">参考图</button><button id="structure-paired" disabled>并排对照</button>
    <button id="structure-overlay" title="先载入对应的参考图" disabled>简化图叠合</button></nav>
  <output id="structure-stats"></output>`;
  document.body.append(ui);
  const labels = document.createElement('div');
  labels.id = 'structure-labels';
  document.body.append(labels);

  const panel = document.createElement('aside');
  panel.id = 'structure-reference-panel';
  panel.hidden = true;
  const dimensions = `${sheet.width} × ${sheet.height}`;
  panel.innerHTML = `<button id="structure-close-reference">收起</button>
    <p>选择${female ? '女性四视图' : '几何体块简化图'}（${dimensions}）。图片在当前浏览器读取。${female ? '半侧视图用于并排观察。' : ''}</p>
    <input type="file" accept="image/*" aria-label="选择建模参考图"><p id="reference-state" aria-live="polite"></p>
    <label>叠合强度 <input type="range" min="0.1" max="1" step="0.05" value="0.55" aria-label="叠合强度"></label><img alt="本地建模参考图">
    <details><summary>定位点坐标</summary><p>绿点读取实际网格端面或截面，紫色十字为独立读点。RMS 统计定点投影误差。坐标顺序为正、侧、背。</p><ol>
    ${Object.entries(joints).map(([name, points]) => `<li>${landmarkNames[name as JointName]} ${orthographic.map(view => points[view]?.join(', ') ?? '—').join(' / ')}</li>`).join('')}</ol></details>`;
  document.body.append(panel);
  const referenceImage = panel.querySelector('img')!;
  const referenceState = panel.querySelector('#reference-state')!;
  let referenceURL: string | undefined;

  function displayedViews(): readonly View[] {
    if (angle === 'three') return orthographic;
    if (angle === 'four') return [...orthographic, 'quarter'];
    return [angle];
  }
  function canOverlay() {
    return referenceReady && displayedViews().some(canonical);
  }
  function canPair() {
    return referenceReady && displayedViews().every(view => crops[view]);
  }
  panel.querySelector<HTMLInputElement>('input[type=file]')!.onchange = event => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (referenceURL) URL.revokeObjectURL(referenceURL);
    referenceURL = URL.createObjectURL(file);
    referenceReady = overlay = paired = false;
    referenceImage.src = referenceURL;
  };
  referenceImage.onload = () => {
    referenceReady = referenceImage.naturalWidth === sheet.width && referenceImage.naturalHeight === sheet.height;
    overlay = canOverlay();
    paired = canPair() && !overlay;
    referenceState.textContent = referenceReady
      ? female ? '已按各视图头顶与地面校准。正侧背支持叠合，半侧支持并排。' : '已启用固定坐标叠合。'
      : `此图可作为旁置参考。固定坐标对齐需要原始 ${dimensions} 图版。`;
    rebuild();
  };
  referenceImage.onerror = () => {
    referenceState.textContent = '无法读取这张参考图。';
    rebuild();
  };
  panel.querySelector<HTMLInputElement>('input[type=range]')!.oninput = event => {
    referenceOpacity = Number((event.target as HTMLInputElement).value);
    rebuild();
  };
  panel.querySelector<HTMLButtonElement>('#structure-close-reference')!.onclick = () => { panel.hidden = true; };

  const guideMaterial = new T.LineBasicMaterial({ color: 0xb7b7af, transparent: true, opacity: .55, depthTest: false });
  const guideWidth = female ? 1.47 : 1.12;
  for (const y of [0, plan.ankle, plan.knee, plan.crotch, plan.waist, plan.shoulder, plan.chin, plan.height]) {
    const geometry = new T.BufferGeometry().setFromPoints([new T.Vector3(-guideWidth, y, -.22), new T.Vector3(guideWidth, y, -.22)]);
    guides.add(new T.Line(geometry, guideMaterial));
  }

  function spacing() {
    return paired ? 1.55 : focus === 'body' && !part ? .73 : .53;
  }
  function resize() {
    const top = capture ? 0 : Math.ceil(ui.getBoundingClientRect().bottom + 18);
    const height = capture ? innerHeight : Math.max(180, innerHeight - top - 65);
    const aspect = innerWidth / height;
    const count = displayedViews().length;
    const baseSpan = partBounds ? Math.max(.16, (partBounds.max.y - partBounds.min.y) * 1.38)
      : focus === 'body' ? 2.04 : .62;
    const minWidth = count > 1 ? (count - 1) * spacing() + (paired ? 1.55 : .80) : paired ? 1.55 : .65;
    const span = Math.max(baseSpan, minWidth / aspect);
    const center = partBounds ? (partBounds.min.y + partBounds.max.y) / 2
      : focus === 'neck' ? 1.50 : focus === 'hips' ? .95 : plan.height / 2;
    camera.position.set(0, center, 5);
    camera.lookAt(0, center, 0);
    camera.left = -span * aspect / 2;
    camera.right = span * aspect / 2;
    camera.top = span / 2;
    camera.bottom = -span / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, height);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = `${top}px`;
    labels.style.width = '100%';
    labels.querySelectorAll<HTMLElement>('span').forEach((element, i) => {
      element.style.left = `${50 + labelPositions[i] / (span * aspect) * 100}%`;
    });
    renderer.render(scene, camera);
  }

  function rebuild() {
    clearStudyGroup(overlays);
    clearStudyGroup(markers);
    clearStudyGroup(models);
    const views = displayedViews();
    const labelTexts: string[] = [];
    labelPositions = [];
    partBounds = undefined;
    let triangles = 0, fitText = '';
    for (const [i, view] of views.entries()) {
      const model = female ? createFemaleBodyBlockout() : createBodyBlockout('blockout');
      if (!female) detachLegacyPelvis(model);
      const isolated = part ? model.getObjectByName(part) as T.Mesh : undefined;
      if (isolated) partBounds = new T.Box3().setFromObject(isolated);
      const origin = (i - (views.length - 1) / 2) * spacing();
      const yaw = rotations[view];
      const center = partBounds?.getCenter(new T.Vector3());
      const shift = center && !paired ? -(center.x * Math.cos(yaw) + center.z * Math.sin(yaw)) : 0;
      const referenceOffset = origin - (paired ? .36 : 0) + shift;
      model.position.x = origin + (paired ? .36 : 0) + shift;
      // The reference half-side is seen from slightly above. Keep this tilt
      // in that preview so the orthographic fit uses the unrotated heights.
      const pitch = female && view === 'quarter' ? .24 : 0;
      model.rotation.set(pitch, yaw, 0);
      model.position.y = (1 - Math.cos(pitch)) * (center?.y ?? plan.height / 2);
      const crop = crops[view];
      const blend = overlay && canonical(view);
      triangles = isolated ? isolated.geometry.index!.count / 3 : model.userData.triangles;
      fitText = orthographic.map((key, index) => `${'正侧背'[index]} ${model.userData.fitReport[key].rms.toFixed(2)}`).join(' / ');
      model.traverse(object => {
        if (!(object instanceof T.Mesh)) return;
        object.visible = !isolated || object === isolated;
        const materials = (Array.isArray(object.material) ? object.material : [object.material]) as T.MeshStandardMaterial[];
        for (const material of materials) {
          material.wireframe = wire;
          material.transparent = blend;
          material.opacity = blend ? .60 : 1;
        }
        if (silhouette) {
          for (const material of materials) material.dispose();
          object.material = new T.MeshBasicMaterial({ color: 0x303636, wireframe: wire, transparent: blend, opacity: blend ? .60 : 1 });
        }
      });
      models.add(model);
      if (crop && (blend || paired)) {
        addReferenceProjection(overlays, referenceImage, referenceOffset, paired ? 1 : referenceOpacity, crop);
      }
      const label = names[view];
      if (paired) {
        labelPositions.push(origin - .36, origin + .36);
        labelTexts.push(`${label} · 参考`, `${label} · 模型`);
      } else {
        labelPositions.push(origin);
        labelTexts.push(label);
      }
      if (showEdits || showPoints) {
        const marker = new T.Group();
        marker.position.copy(model.position);
        marker.rotation.copy(model.rotation);
        if (showEdits) addEditedVertices(marker, model.userData.vertexEdits.report, canonical(view) ? view : undefined, focus);
        if (showPoints) {
          addLandmarkMarkers(marker, model.userData.landmarks, canonical(view) ? view : 'front', joints);
          if (canonical(view) && crop) addViewTargets(markers, model.userData.landmarks, view,
            paired ? referenceOffset : model.position.x, !paired, joints, crop);
        }
        markers.add(marker);
      }
    }
    guides.visible = showGuides;
    labels.innerHTML = labelTexts.map(label => `<span>${label}</span>`).join('');
    ui.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach(button => {
      button.classList.toggle('active', !part && button.dataset.focus === focus);
    });
    ui.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(button => {
      button.classList.toggle('active', button.dataset.angle === angle);
    });
    const partSelect = ui.querySelector<HTMLSelectElement>('#structure-part');
    if (partSelect) partSelect.value = part;
    ui.querySelector<HTMLButtonElement>('#structure-overlay')!.disabled = !canOverlay();
    ui.querySelector<HTMLButtonElement>('#structure-paired')!.disabled = !canPair();
    for (const [id, value] of [['edits', showEdits], ['points', showPoints], ['overlay', overlay], ['paired', paired]] as const) {
      ui.querySelector('#structure-' + id)?.classList.toggle('active', value);
    }
    const stats = female
      ? part ? femalePartLabels[part] : `${Object.keys(femalePartLabels).length} 个独立体块`
      : '旧臀块已移除 / 新块未安装';
    const fit = part ? '' : ` · ${(plan.height / (plan.height - plan.chin)).toFixed(1)} 头身 · 定位点 RMS ${fitText} px`;
    ui.querySelector('output')!.textContent = `${triangles.toLocaleString()} 三角面 · ${stats} · 正交投影${fit}`;
    const url = new URL(location.href);
    url.searchParams.set('focus', focus);
    url.searchParams.set('stage', 'blockout');
    url.searchParams.set('angle', angle);
    if (part) url.searchParams.set('part', part);
    else url.searchParams.delete('part');
    history.replaceState(null, '', url);
    resize();
  }

  ui.querySelectorAll<HTMLButtonElement>('[data-focus]').forEach(button => {
    button.onclick = () => { focus = button.dataset.focus!; part = ''; rebuild(); };
  });
  const partSelect = ui.querySelector<HTMLSelectElement>('#structure-part');
  if (partSelect) partSelect.onchange = () => { part = partSelect.value; focus = 'body'; rebuild(); };
  ui.querySelectorAll<HTMLButtonElement>('[data-angle]').forEach(button => {
    button.onclick = () => {
      angle = button.dataset.angle as Angle;
      if (!canOverlay() && overlay) {
        overlay = false;
        paired = canPair();
      }
      if (!canPair()) paired = false;
      rebuild();
    };
  });
  function toggle(id: string, get: () => boolean, set: (value: boolean) => void) {
    const button = ui.querySelector<HTMLButtonElement>('#structure-' + id);
    if (button) button.onclick = () => { set(!get()); button.classList.toggle('active', get()); rebuild(); };
  }
  toggle('silhouette', () => silhouette, value => { silhouette = value; });
  toggle('wire', () => wire, value => { wire = value; });
  toggle('guides', () => showGuides, value => { showGuides = value; });
  toggle('edits', () => showEdits, value => { showEdits = value; });
  toggle('points', () => showPoints, value => { showPoints = value; });
  toggle('paired', () => paired, value => { paired = value; if (value) overlay = false; });
  toggle('overlay', () => overlay, value => { overlay = value; if (value) paired = false; });
  ui.querySelector<HTMLButtonElement>('#structure-reference')!.onclick = () => { panel.hidden = !panel.hidden; };
  if (capture) {
    ui.hidden = true;
    labels.hidden = true;
  }
  window.addEventListener('resize', resize);
  rebuild();
}
