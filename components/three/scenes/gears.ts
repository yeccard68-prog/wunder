// Gears: how they pass on rotation, trade speed for force, and what an idler gear does.
// labels: 0 driving gear, 1 driven gear, 2 "12 teeth", 3 "24 teeth", 4 half the speed – twice the torque,
//         5 turns the other way, 6 idler gear, 7 same direction as the drive
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, type SceneFactory, type Vec3 } from "../types";

const MODULE = 0.25; // pitch radius = MODULE × teeth / 2
const NA = 12;
const NB = 24;
const NI = 10;
const radius = (teeth: number) => (MODULE * teeth) / 2;
const SPEED = 1.15; // radians per second of the driving gear (presentation speed)

export const gears: SceneFactory = ({ THREE: T, scene }) => {
  const dark = new T.MeshStandardMaterial({ color: 0x3d4046, metalness: 0.85, roughness: 0.45 });
  const bright = new T.MeshStandardMaterial({ color: 0xc9ccd2, metalness: 0.95, roughness: 0.22 });
  /**
   * A spur gear with the proportions of a real one: teeth one module high above the pitch circle
   * and a little more below it, flanks that narrow towards the tip (close to the involute curve of
   * machined gears), rounded roots, a raised hub on a keyed shaft and – on larger wheels – holes
   * in the web to save weight. At the pitch circle tooth and gap are equally wide, so two wheels mesh.
   */
  const gear = (teeth: number, color: number) => {
    const r = radius(teeth);
    const pitch = (2 * Math.PI) / teeth;
    const shape = new T.Shape();
    const tip = r + MODULE;
    const root = r - 1.25 * MODULE;
    // one tooth, centred on 0.5 of its pitch: [fraction of the pitch, radius]
    const half: [number, number][] = [[0.36, root], [0.31, root + 0.045], [0.275, r - 0.5 * MODULE], [0.25, r], [0.205, r + 0.55 * MODULE], [0.165, tip - 0.03], [0.14, tip]];
    const profile: [number, number][] = [[0, root], ...half.map(([f, rad]): [number, number] => [0.5 - f, rad]), ...half.reverse().map(([f, rad]): [number, number] => [0.5 + f, rad])];
    for (let i = 0; i < teeth; i++)
      for (const [f, rad] of profile) {
        const a = (i + f) * pitch;
        const x = rad * Math.cos(a);
        const y = rad * Math.sin(a);
        if (i === 0 && f === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
    shape.closePath();
    const hole = new T.Path();
    hole.absarc(0, 0, 0.2, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    // lightening holes in the web of the larger wheels
    const windows = r > 1.4 ? Math.round(teeth / 4) : 0;
    for (let i = 0; i < windows; i++) {
      const a = ((i + 0.5) / windows) * Math.PI * 2;
      const w = new T.Path();
      w.absarc(0.57 * r * Math.cos(a), 0.57 * r * Math.sin(a), 0.17 * r, 0, Math.PI * 2, true);
      shape.holes.push(w);
    }
    const g = new T.Group();
    const metal = new T.MeshStandardMaterial({ color, metalness: 0.9, roughness: 0.32 });
    const body = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: 0.36, bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025, bevelSegments: 2, curveSegments: 20 }), metal);
    body.position.z = -0.18;
    // raised hub with a chamfer, clamped on the shaft by a key
    const hub = new T.Mesh(new T.CylinderGeometry(0.4, 0.46, 0.2, 40), metal);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = 0.3;
    const key = new T.Mesh(new T.BoxGeometry(0.1, 0.13, 0.5), dark);
    key.position.set(0, 0.2, 0.2);
    const cap = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.06, 28), bright);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.56;
    // a mark on the rim, so the eye can follow one turn
    const mark = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.06, 16), new T.MeshBasicMaterial({ color: 0xfff2a8 }));
    mark.rotation.x = Math.PI / 2;
    mark.position.set(r - 0.42, 0, 0.22);
    const axle = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 1.3, 28), bright);
    axle.rotation.x = Math.PI / 2;
    axle.position.z = -0.1;
    g.add(body, hub, key, cap, mark, axle);
    // the bearing the shaft runs in: bolted to the base plate, does not turn
    const bearing = new T.Group();
    const flange = new T.Mesh(new T.CylinderGeometry(0.52, 0.56, 0.16, 40), dark);
    flange.rotation.x = Math.PI / 2;
    bearing.add(flange);
    for (let i = 0; i < 4; i++) {
      const bolt = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.08, 6), bright);
      bolt.rotation.x = Math.PI / 2;
      bolt.position.set(0.42 * Math.cos((i + 0.5) * (Math.PI / 2)), 0.42 * Math.sin((i + 0.5) * (Math.PI / 2)), 0.1);
      bearing.add(bolt);
    }
    bearing.position.z = -0.57;
    const unit = new T.Group(); // moves as one; only `g` turns
    unit.add(g, bearing);
    scene.add(unit);
    return { unit, wheel: g };
  };
  const a = gear(NA, 0xd9a441);
  const b = gear(NB, 0xaab0b8);
  const idler = gear(NI, 0xc7754a);
  // base plate of dark anodised metal; the wheels throw their shadows on it
  const plate = new T.Mesh(new T.BoxGeometry(16, 9, 0.2), new T.MeshStandardMaterial({ color: 0x24262a, metalness: 0.6, roughness: 0.62 }));
  plate.position.set(3.5, 0, -0.75);
  scene.add(plate);

  const DIRECT = radius(NA) + radius(NB); // centre distance without the idler
  const WITH_IDLER = radius(NA) + 2 * radius(NI) + radius(NB);
  let bx = DIRECT;
  let k = 0; // 0 = two gears, 1 = idler in place

  return {
    update(step, _p, t, s) {
      const theta = t * SPEED;
      k = step === 3 ? ease(clamp(s / TIMING.camera)) : 0;
      bx = lerp(DIRECT, WITH_IDLER, k);
      a.wheel.rotation.z = theta - Math.PI / NA; // a tooth points at the neighbour when theta = 0
      b.unit.position.x = bx;
      idler.unit.position.x = radius(NA) + radius(NI);
      idler.unit.visible = k > 0.02;
      idler.unit.scale.setScalar(Math.max(0.001, k));
      idler.wheel.rotation.z = (-theta * NA) / NI; // meshes with the driving gear → turns the other way
      // direct mesh: opposite direction; through the idler: same direction again. The ratio 12 : 24 stays.
      b.wheel.rotation.z = k > 0.5 ? (theta * NA) / NB - Math.PI / NB : (-theta * NA) / NB;
    },
    camera(step) {
      // centre of everything on show: from the left edge of the small gear to the right edge of the large one
      const cx = (lerp(DIRECT, WITH_IDLER, k) + radius(NB) - radius(NA)) / 2;
      return { pos: [cx + 2.4, 2.6, lerp(19, 23.5, k)], look: [cx, step === 1 ? 0.15 : 0, 0] };
    },
    labels(step) {
      const top = (x: number, r: number, dy = 0.75): Vec3 => [x, r + dy, 0.3];
      const A: Vec3 = top(0, radius(NA));
      const B: Vec3 = top(bx, radius(NB), 0.6);
      if (step === 0) return [{ at: A, text: 0, color: "#f0c36a" }, { at: B, text: 1 }, { at: [bx, -radius(NB) - 0.7, 0.3], text: 5, color: "#ffd24a" }];
      if (step === 1) return [{ at: A, text: 2, color: "#f0c36a" }, { at: B, text: 3 }];
      if (step === 2) return [{ at: [bx / 2 + 0.5, -radius(NB) - 0.7, 0.3], text: 4, color: "#ffd24a" }, { at: A, text: 0, dim: true }, { at: B, text: 1, dim: true }];
      return k > 0.6 ? [{ at: top(radius(NA) + radius(NI), radius(NI)), text: 6, color: "#e59a72" }, { at: [bx, -radius(NB) - 0.7, 0.3], text: 7, color: "#ffd24a" }] : [];
    },
    stage: { shadows: true },
  };
};
