// The Pythagorean theorem to watch: a 3-4-5 triangle lying on a table, a square of little cubes on each leg (9 and 16)
// and an empty frame on the hypotenuse (25 places). The cubes of the two small squares fly into the big frame and fill
// it exactly. At the end everything grows to a 6-8-10 triangle: still right-angled.
// labels: 0 leg a, 1 leg b, 2 hypotenuse c, 3 right angle, 4 a² = 9, 5 b² = 16, 6 c² = 25, 7 "9 + 16 = 25",
//         8 "36 + 64 = 100: right-angled"
// Layout in the table plane (u, v) → three.js (u, 0, −v); the right angle at the origin, leg b along u, leg a along v.
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3 } from "../types";

type P = [number, number];
const A = 3, B = 4, C = 5;
const P1: P = [B, 0], P2: P = [0, A]; // ends of the hypotenuse
const E: P = [(P2[0] - P1[0]) / C, (P2[1] - P1[1]) / C]; // along the hypotenuse, one unit
const N: P = [-E[1], E[0]].map((x) => -x) as P; // outwards from the hypotenuse
const at = (u: number, v: number, y = 0): Vec3 => [u, y, -v];
// the places in the three squares (centres of the cells) and how each is turned
const SQ_A: P[] = Array.from({ length: A * A }, (_, k) => [-(k % A) - 0.5, Math.floor(k / A) + 0.5]);
const SQ_B: P[] = Array.from({ length: B * B }, (_, k) => [(k % B) + 0.5, -Math.floor(k / B) - 0.5]);
const SQ_C: P[] = Array.from({ length: C * C }, (_, k) => {
  const i = k % C, j = Math.floor(k / C);
  return [P1[0] + E[0] * (i + 0.5) + N[0] * (j + 0.5), P1[1] + E[1] * (i + 0.5) + N[1] * (j + 0.5)];
});
const TURN_C = Math.atan2(E[1], E[0]); // rotation of the hypotenuse square about the vertical

export const pythagoras: SceneFactory = ({ THREE: T, scene }) => {
  const world = new T.Group();
  scene.add(world);
  const table = new T.Mesh(new RoundedBoxGeometry(22, 0.3, 18, 3, 0.1), new T.MeshPhysicalMaterial({ color: 0x2a2724, roughness: 0.7 }));
  table.position.set(1.5, -0.35, -1.5);
  scene.add(table);
  // the triangle: a thick white slab
  const shape = new T.Shape([new T.Vector2(0, 0), new T.Vector2(B, 0), new T.Vector2(0, A)]);
  const tri = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 3 }), new T.MeshPhysicalMaterial({ color: 0xf2efe8, roughness: 0.35, clearcoat: 0.6 }));
  tri.rotation.x = -Math.PI / 2; // shape (x, y) → table (u, v)
  world.add(tri);
  const corner = new T.Mesh(new T.BoxGeometry(0.5, 0.06, 0.5), new T.MeshBasicMaterial({ color: 0xffd24a }));
  corner.position.set(0.3, 0.38, -0.3);
  world.add(corner);
  // cubes
  const cube = (color: number) => new T.Mesh(new RoundedBoxGeometry(0.9, 0.5, 0.9, 3, 0.1), new T.MeshPhysicalMaterial({ color, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 }));
  const fromA = SQ_A.map(() => cube(0x3ab0d8));
  const fromB = SQ_B.map(() => cube(0xe8964a));
  [...fromA, ...fromB].forEach((m) => world.add(m));
  // the frame on the hypotenuse: four bars and a faint floor
  const frame = new T.Group();
  const bar = (len: number) => new T.Mesh(new T.BoxGeometry(len, 0.3, 0.12), new T.MeshPhysicalMaterial({ color: 0x9a6be0, roughness: 0.3, clearcoat: 0.6 }));
  for (const [i, j, along] of [[2.5, 0, true], [2.5, 5, true], [0, 2.5, false], [5, 2.5, false]] as [number, number, boolean][]) {
    const m = bar(5.12);
    m.position.set(i - 2.5, 0, -(j - 2.5));
    if (!along) m.rotation.y = Math.PI / 2;
    frame.add(m);
  }
  const floor = new T.Mesh(new T.PlaneGeometry(5, 5), new T.MeshBasicMaterial({ color: 0x9a6be0, transparent: true, opacity: 0.12 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.14;
  frame.add(floor);
  const mid: P = [P1[0] + E[0] * 2.5 + N[0] * 2.5, P1[1] + E[1] * 2.5 + N[1] * 2.5];
  frame.position.set(...at(mid[0], mid[1], 0.15));
  frame.rotation.y = TURN_C;
  world.add(frame);

  let grow = 1;
  let filled = 0;
  return {
    update(step, _p, _t, s) {
      // squares appear in step 2; in step 3 the cubes fly one after the other into the big frame
      const shown = step === 0 ? 0 : step === 1 ? ease(clamp(s / 1.2)) : 1;
      const fly = step === 2 ? clamp((s - 0.6) / 6.5) : step > 2 ? 1 : 0;
      filled = Math.round(fly * 25);
      frame.visible = step >= 1;
      frame.scale.setScalar(Math.max(0.001, shown));
      const all = [...fromA.map((m, k) => ({ m, home: SQ_A[k], turn: 0 })), ...fromB.map((m, k) => ({ m, home: SQ_B[k], turn: 0 }))];
      all.forEach(({ m, home }, k) => {
        const go = ease(clamp(fly * 25 - k)); // one after the other
        const target = SQ_C[k];
        const u = lerp(home[0], target[0], go), v = lerp(home[1], target[1], go);
        m.position.set(...at(u, v, 0.25 + Math.sin(go * Math.PI) * 1.6));
        m.rotation.y = lerp(0, TURN_C, go);
        m.scale.setScalar(Math.max(0.001, shown));
      });
      // last step: the whole picture grows to a 6-8-10 triangle
      grow = step === 3 ? lerp(1, 2, ease(clamp((s - 1) / 1.5))) : 1;
      world.scale.setScalar(grow);
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [1.2, 9, 8], look: [1.2, 0, -1.2] },
        { pos: [2.2, 15, 11], look: [2, 0, -2] },
        { pos: [2.2, 15, 11], look: [2, 0, -2] },
        { pos: [4, 28, 20], look: [4, 0, -4] },
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      const g = (u: number, v: number): Vec3 => at(u * grow, v * grow, 0.6 * grow);
      const sides = [
        { at: g(-0.5, 1.5), text: 0, color: "#8fd8f0" },
        { at: g(2, -0.5), text: 1, color: "#ffc08a" },
        { at: g(2.3, 1.9), text: 2, color: "#c9a8f5" },
      ];
      if (step === 0) return [...sides, { at: g(0.6, 0.6), text: 3, color: "#ffd24a" }];
      if (step === 1) return [{ at: g(-1.5, 3.4), text: 4, color: "#8fd8f0" }, { at: g(2, -4.4), text: 5, color: "#ffc08a" }, { at: g(mid[0], mid[1] + 3), text: 6, color: "#c9a8f5" }];
      if (step === 2) return filled >= 25 ? [{ at: g(mid[0], mid[1] + 3.2), text: 7, color: "#ffd24a" }] : [];
      return grow > 1.9 ? [{ at: g(mid[0], mid[1] + 3.2), text: 8, color: "#ffd24a" }] : [];
    },
    stage: { shadows: true },
  };
};
