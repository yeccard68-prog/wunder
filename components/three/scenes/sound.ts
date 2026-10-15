// Sound: a loudspeaker membrane pushes the air, compressions and rarefactions travel to the ear, the
// particles themselves only swing back and forth; higher frequency = higher tone, larger swing = louder.
// labels: 0 membrane, 1 light: compression, 2 blue: rarefaction, 3 this particle only swings back and forth,
//         4 the wave travels → in air about 343 m/s, 5 twice the frequency: higher tone,
//         6 larger swing: louder, 7 eardrum
// A model: the air particles are shown enormously enlarged and far too few, the wave far too slow
// (real sound travels 343 m/s). A change at the membrane (faster, wider) travels outwards with the wave.
import { TIMING } from "@/lib/animations";
import { clamp, ease, mix, rand, type SceneFactory, type Vec3 } from "../types";

const XS = -2.9; // the membrane
const XE = 3.5; // the eardrum
const C = 1.9; // wave speed in scene units per second of animation time
const F1 = 0.8; // frequency; doubled in step 2
const A1 = 0.16; // amplitude; doubled in step 3 (at the first frequency again, so the picture stays clear)
const COLS = 26;
const ROWS = 5;
const LAYERS = 4;
const TWO_PI = Math.PI * 2;

export const sound: SceneFactory = ({ THREE: T, scene }) => {
  const dark = new T.MeshStandardMaterial({ color: 0x2b2d33, roughness: 0.6, metalness: 0.3 });
  const steel = new T.MeshStandardMaterial({ color: 0xb9bdc4, metalness: 0.9, roughness: 0.3 });
  // loudspeaker: cabinet, cone and the membrane in its middle
  const cabinet = new T.Mesh(new T.BoxGeometry(1.1, 2.8, 2.2), dark);
  cabinet.position.set(XS - 0.9, 0, 0);
  const cone = new T.Mesh(new T.ConeGeometry(0.95, 0.5, 40, 1, true), new T.MeshStandardMaterial({ color: 0x4a4d55, roughness: 0.8, side: T.DoubleSide }));
  cone.rotation.z = Math.PI / 2; // opens towards +x
  cone.position.set(XS - 0.32, 0, 0);
  const membrane = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.08, 32), new T.MeshStandardMaterial({ color: 0xd8c9a8, roughness: 0.7 }));
  membrane.rotation.z = Math.PI / 2;
  const ring = new T.Mesh(new T.TorusGeometry(0.97, 0.06, 10, 48), steel);
  ring.rotation.y = Math.PI / 2;
  ring.position.set(XS - 0.08, 0, 0);
  scene.add(cabinet, cone, membrane, ring);
  // the ear: a funnel and the eardrum at its end
  const funnel = new T.Mesh(new T.CylinderGeometry(0.45, 1.25, 1.1, 40, 1, true), new T.MeshStandardMaterial({ color: 0xe0b49a, roughness: 0.7, side: T.DoubleSide }));
  funnel.rotation.z = -Math.PI / 2; // narrow end at the eardrum, wide end towards the speaker
  funnel.position.set(XE - 0.5, 0, 0);
  const eardrumMat = new T.MeshStandardMaterial({ color: 0xf0d7c4, roughness: 0.5, emissive: new T.Color(0xffb27a), emissiveIntensity: 0 });
  const eardrum = new T.Mesh(new T.CylinderGeometry(0.44, 0.44, 0.04, 32), eardrumMat);
  eardrum.rotation.z = Math.PI / 2;
  scene.add(funnel, eardrum);

  // the air: one instanced mesh, coloured by how tightly packed it is
  const count = COLS * ROWS * LAYERS;
  const air = new T.InstancedMesh(new T.SphereGeometry(0.07, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff }), count);
  const home: Vec3[] = [];
  for (let i = 0; i < COLS; i++)
    for (let j = 0; j < ROWS; j++)
      for (let k = 0; k < LAYERS; k++) {
        const n = home.length;
        home.push([XS + 0.35 + (i + 0.5) * ((XE - XS - 0.8) / COLS) + 0.06 * (rand(n, 1) - 0.5), -0.9 + j * 0.45 + 0.1 * (rand(n, 2) - 0.5), -0.6 + k * 0.4 + 0.1 * (rand(n, 3) - 0.5)]);
      }
  scene.add(air);
  const thin = new T.Color(0x3a6fb0);
  const dense = new T.Color(0xfff1c2);
  const tmp = new T.Color();
  const m4 = new T.Matrix4();
  // the marked particle (front layer, middle row, middle of the column range) and a ring at its resting place
  const markedIndex = Math.round(COLS / 2) * ROWS * LAYERS + 2 * LAYERS + (LAYERS - 1);
  const marked = new T.Mesh(new T.SphereGeometry(0.12, 16, 12), new T.MeshBasicMaterial({ color: 0xff5a4a }));
  const rest = new T.Mesh(new T.TorusGeometry(0.2, 0.02, 8, 24), new T.MeshBasicMaterial({ color: 0xff8a7a, transparent: true, opacity: 0.7 }));
  scene.add(marked, rest);

  // The membrane's phase and swing at time τ. Step 2: from its start the membrane vibrates twice as fast;
  // step 3: from its start it swings twice as wide. A point at distance d shows what the membrane did
  // d / C earlier, so every change travels outwards with the wave.
  let now = { t: 0, start: 0, step: 0 };
  const faster = (tau: number) => now.step === 2 && tau >= now.start;
  const phaseAt = (tau: number) => TWO_PI * (faster(tau) ? F1 * now.start + 2 * F1 * (tau - now.start) : F1 * tau);
  const freqAt = (tau: number) => (faster(tau) ? 2 * F1 : F1);
  const ampAt = (tau: number) => (now.step === 3 && tau >= now.start ? 2 * A1 : A1);
  /** displacement along x, and how packed the air is (negative: thinner, positive: denser) */
  const at = (d: number) => {
    const tau = now.t - d / C;
    const ph = phaseAt(tau);
    const a = ampAt(tau);
    return { dx: a * Math.sin(ph), rho: (a / A1) * (freqAt(tau) / F1) * Math.cos(ph) };
  };

  return {
    update(step, _p, t, s) {
      now = { t, start: t - s, step };
      membrane.position.x = XS + at(0).dx;
      for (let n = 0; n < count; n++) {
        const h = home[n];
        const { dx, rho } = at(h[0] - XS);
        m4.makeTranslation(h[0] + dx, h[1], h[2]);
        air.setMatrixAt(n, m4);
        tmp.copy(thin).lerp(dense, clamp(0.5 + 0.38 * rho));
        air.setColorAt(n, tmp);
      }
      air.instanceMatrix.needsUpdate = true;
      if (air.instanceColor) air.instanceColor.needsUpdate = true;
      const e = at(XE - XS);
      eardrum.position.x = XE + 0.6 * e.dx;
      eardrumMat.emissiveIntensity = step === 3 ? 0.7 * clamp(Math.abs(e.dx) / (2 * A1)) : 0;
      const h = home[markedIndex];
      marked.visible = rest.visible = step === 1;
      marked.position.set(h[0] + at(h[0] - XS).dx, h[1], h[2] + 0.05);
      rest.position.set(h[0], h[1], h[2] + 0.05);
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.5)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [0.1, 2.6, 13.6], look: [0.1, 0, 0] },
        { pos: [0.7, 1.3, 5.6], look: [0.5, 0, 0] }, // close to the marked particle
        { pos: [0.3, 2.8, 13.8], look: [0.3, 0, 0] },
        { pos: [0.7, 2.4, 13.4], look: [0.5, 0, 0] },
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      const legend = [{ at: [-0.8, 1.4, 0] as Vec3, text: 1, color: "#fff1c2" }, { at: [0.9, -1.4, 0] as Vec3, text: 2, color: "#9fc4f0" }];
      if (step === 0) return [{ at: [XS - 0.2, -1.45, 0.8], text: 0 }, ...legend];
      if (step === 1) return [{ at: [home[markedIndex][0], -0.6, 0.8], text: 3, color: "#ff9a8a" }, { at: [0.6, 1.1, 0], text: 4, color: "#fff1c2" }];
      if (step === 2) return [{ at: [0.4, 1.45, 0], text: 5, color: "#fff1c2" }];
      return [{ at: [0, 1.45, 0], text: 6, color: "#fff1c2" }, { at: [XE + 0.1, -1, 0.4], text: 7 }];
    },
  };
};
