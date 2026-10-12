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
  /** A gear wheel as an extruded outline: every tooth takes half of its pitch, the gap the other half. */
  const gear = (teeth: number, color: number) => {
    const r = radius(teeth);
    const pitch = (2 * Math.PI) / teeth;
    const shape = new T.Shape();
    const profile: [number, number][] = [[0, r - 0.16], [0.25, r - 0.16], [0.31, r + 0.15], [0.69, r + 0.15], [0.75, r - 0.16]];
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
    hole.absarc(0, 0, 0.22, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const g = new T.Group();
    const body = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: 0.36, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 6 }), new T.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.35 }));
    body.position.z = -0.18;
    // a mark on the rim, so the eye can follow one turn
    const mark = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.06, 16), new T.MeshBasicMaterial({ color: 0xfff2a8 }));
    mark.rotation.x = Math.PI / 2;
    mark.position.set(r - 0.42, 0, 0.22);
    const axle = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 1.1, 20), new T.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.8, roughness: 0.5 }));
    axle.rotation.x = Math.PI / 2;
    g.add(body, mark, axle);
    scene.add(g);
    return g;
  };
  const a = gear(NA, 0xd9a441);
  const b = gear(NB, 0xaab0b8);
  const idler = gear(NI, 0xc7754a);
  const plate = new T.Mesh(new T.BoxGeometry(16, 9, 0.2), new T.MeshStandardMaterial({ color: 0x1c1b19, roughness: 0.9 }));
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
      a.rotation.z = theta - Math.PI / NA; // a tooth points at the neighbour when theta = 0
      b.position.x = bx;
      idler.position.x = radius(NA) + radius(NI);
      idler.visible = k > 0.02;
      idler.scale.setScalar(Math.max(0.001, k));
      idler.rotation.z = (-theta * NA) / NI; // meshes with the driving gear → turns the other way
      // direct mesh: opposite direction; through the idler: same direction again. The ratio 12 : 24 stays.
      b.rotation.z = k > 0.5 ? (theta * NA) / NB - Math.PI / NB : (-theta * NA) / NB;
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
  };
};
