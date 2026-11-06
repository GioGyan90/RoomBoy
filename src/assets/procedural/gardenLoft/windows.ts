import * as T from "three";
import { box, disc, frame, glass, plane } from "../blueApartment/surfaces";
import { patch } from "../sculpt";
import { scenery } from "./decor";
import { finish, group } from "./materials";
import { plan as p, tallWindow, upperWindow } from "./plan";

function glazing(parent: T.Group, name: string, x: number, opening: typeof tallWindow,
  columns: number, rows: number, view: T.Texture) {
  const { from, to, sill, head } = opening;
  const w = to - from, h = head - sill;
  const window = group(parent, name, [x, (sill + head) / 2, (from + to) / 2], -Math.PI / 2);
  const outside = new T.MeshBasicMaterial({ map: view });
  plane(window, w - .022, h - .022, outside, [0, 0, -.088]).userData.pickThrough = true;
  glass(window, w - .075, h - .073, [0, 0, -.010], .081);
  frame(window, w, h, .125, .064, finish.oliveDark);
  for (let i = 1; i < columns; i++) {
    const u = w * (i / columns - .5);
    box(window, [.052, h - .071, .094], finish.oliveDark, [u, 0, .013]);
    box(window, [.012, h - .071, .010], finish.oliveLight, [u - .013, 0, .066]);
  }
  for (let i = 1; i < rows; i++) {
    const y = h * (i / rows - .5);
    box(window, [w - .064, i === 2 ? .070 : .046, .099], finish.oliveDark, [0, y, .015]);
  }
  box(window, [w + .09, .06, .21], finish.trim, [0, -h / 2, .035]);
  return { window, outside, w, h };
}

export function buildWindows(root: T.Group) {
  const view = scenery(true);
  const tall = glazing(root, "double-height-window", p.right - .015, tallWindow, 5, 4, view);
  const small = glazing(root, "mezzanine-window", p.divider - .012, upperWindow, 2, 2, view);
  box(small.window, [small.w + .10, .079, .153], finish.oakLight, [0, small.h / 2 + .079, .038]);
  box(small.window, [small.w + .081, .027, .104], finish.oakEdge, [0, small.h / 2 + .035, .058]);

  const curtains: { panel: T.Group; hooks: T.Mesh[] }[] = [];
  const cloth = new T.MeshStandardMaterial({ color: 0xf2dfbf, roughness: .95, side: T.DoubleSide });
  const rod = disc(tall.window, .025, tall.w + .19, finish.iron, [0, tall.h / 2 + .047, .187]);
  rod.rotation.z = Math.PI / 2;
  for (const sign of [-1, 1]) {
    const panel = group(tall.window, "pleated-linen-curtain", [sign * (tall.w / 2 + .027), 0, .164]);
    panel.userData.interactive = { id: "curtains" };
    const drape = patch(panel, 48, 16, (u, v) => {
      const pleat = Math.cos(u * Math.PI * 13 + .15);
      const hem = Math.sin(u * Math.PI * 7) * .023;
      return [-sign * u * (.63 + v * .037), tall.h / 2 + .003 - (tall.h + .092) * v + hem * v ** 6,
        .026 + pleat * (.032 + .019 * v) + Math.sin(Math.PI * v) * .022];
    }, cloth);
    drape.name = "linen-pleats";
    const hooks: T.Mesh[] = [];
    for (let i = 0; i < 7; i++) {
      const hook = disc(panel, .030, .012, finish.iron, [-sign * (.027 + i * .078), tall.h / 2 + .039, .026]);
      hook.rotation.z = Math.PI / 2;
      hooks.push(hook);
    }
    curtains.push({ panel, hooks });
  }
  return { curtains, outdoor: [tall.outside, small.outside] };
}
