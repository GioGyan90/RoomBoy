import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createCueWorkbench } from '../src/assets/procedural/cueWorkshop/workbench';
import { createCueWorkshop, workshopLayout } from '../src/assets/procedural/cueWorkshop';
import { benchSize, workshopVariants, type WorkshopVariant } from '../src/assets/procedural/cueWorkshop/variants';
import { modelStats } from '../src/assets/procedural/cueWorkshop/geometry';
import { rooms } from '../src/game/rooms';

const variants: WorkshopVariant[] = ['citrus', 'burgundy', 'blackgold'];
const bounds = (object: T.Object3D) => new T.Box3().setFromObject(object);
const near = (a: number, b: number, message: string) => assert.ok(Math.abs(a - b) < .00001, message);

test('all three cue workbenches have valid low-poly meshes and strictly increasing budgets', () => {
  let previousTriangles = 0, previousMeshes = 0;
  for (const variant of variants) {
    const root = createCueWorkbench(variant);
    root.traverse(object => {
      if (!(object instanceof T.Mesh)) return;
      const positions = object.geometry.getAttribute('position');
      const normals = object.geometry.getAttribute('normal');
      for (let i = 0; i < positions.count; i++) for (let axis = 0; axis < 3; axis++) {
        assert.ok(Number.isFinite(positions.getComponent(i, axis)), object.name + ': invalid vertex');
        assert.ok(Number.isFinite(normals.getComponent(i, axis)), object.name + ': invalid normal');
      }
      const material = object.material as T.MeshStandardMaterial;
      assert.equal(material.map, null, object.name + ': texture-free low-poly prop');
    });
    const stats = modelStats(root);
    assert.ok(stats.triangles > previousTriangles && stats.triangles <= 2500);
    assert.ok(stats.meshes > previousMeshes && stats.meshes < 120);
    previousTriangles = stats.triangles;
    previousMeshes = stats.meshes;
    for (const name of ['bench-frame', 'cue-lathe', 'tool-board', 'work-surface', 'cue-rack', 'storage']) {
      assert.ok(root.getObjectByName(name) instanceof T.Group, name + ': reusable part group missing');
    }
  }
});

test('lathe shafts align with both physical centers without floating end gaps', () => {
  for (const variant of variants) {
    const root = createCueWorkbench(variant);
    root.updateMatrixWorld(true);
    const shaft = root.getObjectByName('mounted-cue-shaft')!;
    const head = root.getObjectByName('headstock-chuck')!;
    const tail = root.getObjectByName('tailstock-center')!;
    for (const center of [head, tail]) {
      near(shaft.position.y, center.position.y, 'shaft center height');
      near(shaft.position.z, center.position.z, 'shaft center depth');
    }
    const sb = bounds(shaft), hb = bounds(head), tb = bounds(tail);
    assert.ok(sb.min.x <= hb.max.x + .00001 && sb.min.x >= hb.min.x, 'headstock gap');
    assert.ok(sb.max.x >= tb.min.x && sb.max.x <= tb.max.x, 'tailstock gap');
  }
});

test('cue rack apertures and spare ferrule bores stay physically open', () => {
  for (const variant of variants) {
    const root = createCueWorkbench(variant);
    root.updateMatrixWorld(true);
    const board = root.getObjectByName('rack-aperture-board') as T.Mesh;
    const cues = root.getObjectByName('cue-rack')!.children.filter(part => part.name.startsWith('standing-cue-'));
    assert.equal(cues.length, workshopVariants[variant].cues);
    for (const cue of cues) {
      const first = cue.children[0];
      const origin = first.getWorldPosition(new T.Vector3());
      origin.y = 1.08;
      const ray = new T.Raycaster(origin, new T.Vector3(0, -1, 0), 0, .13);
      assert.equal(ray.intersectObject(board, false).length, 0, 'cue passes through solid rack board');
      const collar = origin.clone();
      collar.z += .075;
      ray.set(collar, new T.Vector3(0, -1, 0));
      assert.ok(ray.intersectObject(board, false).length, 'hole must be surrounded by a solid support');
    }
    for (const ferrule of root.getObjectsByProperty('name', 'spare-ferrule')) {
      const origin = ferrule.getWorldPosition(new T.Vector3());
      origin.y += .08;
      const ray = new T.Raycaster(origin, new T.Vector3(0, -1, 0), 0, .1);
      assert.equal(ray.intersectObject(ferrule, false).length, 0, 'ferrule bore is blocked');
    }
  }
});

test('table feet, shelf cases and loose cue parts meet their supports', () => {
  for (const variant of variants) {
    const root = createCueWorkbench(variant);
    root.updateMatrixWorld(true);
    for (const foot of root.getObjectsByProperty('name', 'foot-cap')) near(bounds(foot).min.y, 0, 'floating table foot');
    for (const name of ['case-body', 'toolbox-body']) {
      const part = root.getObjectByName(name);
      if (part) near(bounds(part).min.y, benchSize.shelfTop, 'floating shelf case');
    }
    const mat = bounds(root.getObjectByName('protective-mat')!);
    near(mat.min.y, benchSize.top, 'mat must sit on tabletop');
    const panel = bounds(root.getObjectByName('plain-tool-panel')!);
    near(panel.min.y, benchSize.top, 'back panel must meet the tabletop');
    const posts = root.getObjectsByProperty('name', 'panel-post').map(bounds).sort((a, b) => a.min.x - b.min.x);
    assert.ok(panel.min.x < posts[0].max.x && panel.max.x > posts[1].min.x, 'gap between back panel and frame');
    const butt = root.getObjectByName('detached-cue-butt')!;
    const segments = butt.children.map(bounds).sort((a, b) => a.min.x - b.min.x);
    for (let i = 1; i < segments.length; i++) near(segments[i - 1].max.x, segments[i].min.x, 'disconnected cue section');
  }
});

test('each workshop has floor bounds, furniture collision and a route around the workbench', () => {
  for (const variant of variants) {
    const { root, navigation, effects } = createCueWorkshop(variant);
    assert.ok(navigation.canStand(workshopLayout.spawn));
    assert.equal(navigation.canStand({ x: 0, z: -.25 }), false, 'workbench collision missing');
    assert.equal(navigation.canStand({ x: 1.755, z: -.215 }), false, 'cue rack collision missing');
    assert.equal(navigation.canStand({ x: 5, z: 0 }), false, 'outside platform must be blocked');
    for (const target of [{ x: -1.94, z: -.4 }, { x: .2, z: -1.29 }, { x: 2.32, z: -.4 }]) {
      assert.ok(navigation.findPath(workshopLayout.spawn, target), variant + ': inaccessible inspection side');
    }
    assert.deepEqual(workshopLayout.availableSeats, []);
    assert.ok(root.getObjectByName('workshop-floor')!.userData.walkable);
    effects.toggle('night'); effects.update(1, 1);
    assert.equal(effects.state.night, true);
    assert.ok(Number.isFinite(effects.background.r));
  }
});

test('initial desktop and phone cameras keep every workbench vertex inside the viewport', () => {
  for (const variant of variants) {
    const profile = rooms[`workshop-${variant}`];
    const bench = profile.create().root.getObjectByName(`cue-workbench-${variant}`)!;
    bench.updateWorldMatrix(true, true);
    for (const aspect of [1280 / 900, 390 / 844]) {
      const radius = profile.camera.roomRadius * profile.frameScale(aspect);
      const halfY = radius * Math.tan(Math.PI / 8);
      const camera = new T.OrthographicCamera(-halfY * aspect, halfY * aspect, halfY, -halfY, .05, 120);
      const target = new T.Vector3(...profile.camera.target);
      camera.position.setFromSpherical(new T.Spherical(radius, profile.camera.phi, profile.camera.theta)).add(target);
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      bench.traverse(object => {
        if (!(object instanceof T.Mesh)) return;
        const positions = object.geometry.getAttribute('position');
        for (let i = 0; i < positions.count; i++) {
          const point = new T.Vector3().fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld).project(camera);
          assert.ok(Math.abs(point.x) < .96 && Math.abs(point.y) < .96,
            `${variant}: initial camera crops ${object.name} at aspect ${aspect}`);
        }
      });
    }
  }
});
