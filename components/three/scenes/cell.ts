// A battery cell in a glass: two plates of different metals in an electrolyte, a wire and a lamp.
// labels: 0 negative terminal, 1 positive terminal, 2 electrolyte, 3 electrons, 4 ions, 5 lamp
// Electrons leave the negative plate through the wire and reach the positive plate; inside the cell
// ions carry the charge through the liquid. Sizes of electrons and ions are of course not to scale.
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, rand, type SceneFactory, type Vec3 } from "../types";

const X = 0.95; // the plates stand at −X and +X
const LIQUID = 0.55; // surface of the electrolyte
const BOTTOM = -1.6;
const TOP = 1.55; // upper end of the plates

export const cell: SceneFactory = ({ THREE: T, scene }) => {
  const add = <M extends InstanceType<typeof T.Object3D>>(m: M) => (scene.add(m), m);
  // glass beaker and the liquid in it
  const glass = add(new T.Mesh(new T.CylinderGeometry(1.75, 1.75, 2.9, 64, 1, true), new T.MeshPhysicalMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.16, roughness: 0.04, clearcoat: 1, side: T.DoubleSide, depthWrite: false })));
  glass.position.y = BOTTOM + 1.45;
  glass.renderOrder = 4;
  const base = add(new T.Mesh(new T.CylinderGeometry(1.75, 1.75, 0.08, 64), new T.MeshPhysicalMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.3, roughness: 0.05, clearcoat: 1 })));
  base.position.y = BOTTOM - 0.04;
  const liquidMat = new T.MeshStandardMaterial({ color: 0x5aa7d6, transparent: true, opacity: 0.3, roughness: 0.2, depthWrite: false });
  const liquid = add(new T.Mesh(new T.CylinderGeometry(1.7, 1.7, LIQUID - BOTTOM, 64), liquidMat));
  liquid.position.y = (LIQUID + BOTTOM) / 2;
  liquid.renderOrder = 2;
  const surface = add(new T.Mesh(new T.CircleGeometry(1.7, 64), new T.MeshStandardMaterial({ color: 0x9fd3f0, transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.2, depthWrite: false })));
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = LIQUID;
  surface.renderOrder = 3;

  // the two plates: a grey metal that gives up electrons easily (negative) and a reddish one (positive)
  const plate = (x: number, color: number) => {
    const m = add(new T.Mesh(new T.BoxGeometry(0.16, TOP - BOTTOM - 0.25, 1.1), new T.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.38 })));
    m.position.set(x, (TOP + BOTTOM + 0.25) / 2, 0);
    return m;
  };
  plate(-X, 0xa9adb5);
  plate(X, 0xc8793a);
  const clip = (x: number) => {
    const m = add(new T.Mesh(new T.BoxGeometry(0.28, 0.2, 0.3), new T.MeshStandardMaterial({ color: 0x33353a, metalness: 0.7, roughness: 0.5 })));
    m.position.set(x, TOP + 0.02, 0);
  };
  clip(-X);
  clip(X);

  // the wire over the top with a small lamp in the middle
  const wirePath = new T.CatmullRomCurve3([[-X, TOP, 0], [-X, 2.35, 0], [-0.75, 2.75, 0], [-0.28, 2.8, 0], [0.28, 2.8, 0], [0.75, 2.75, 0], [X, 2.35, 0], [X, TOP, 0]].map((q) => new T.Vector3(...(q as Vec3))), false, "catmullrom", 0.2);
  const wire = add(new T.Mesh(new T.TubeGeometry(wirePath, 96, 0.035, 10), new T.MeshStandardMaterial({ color: 0xc8793a, metalness: 0.9, roughness: 0.3 })));
  const socket = add(new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.5, 24), new T.MeshStandardMaterial({ color: 0x9a9da3, metalness: 0.9, roughness: 0.35 })));
  socket.rotation.z = Math.PI / 2;
  socket.position.set(0, 2.8, 0);
  const bulbMat = new T.MeshStandardMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.35, roughness: 0.05, emissive: new T.Color(0xffc94a), emissiveIntensity: 0, depthWrite: false });
  const bulb = add(new T.Mesh(new T.SphereGeometry(0.36, 32, 24), bulbMat));
  bulb.position.set(0, 3.25, 0);
  bulb.renderOrder = 5;
  const filament = add(new T.Mesh(new T.TorusGeometry(0.09, 0.012, 6, 20), new T.MeshBasicMaterial({ color: 0x6b5a45 })));
  filament.position.set(0, 3.2, 0);
  const glow = add(new T.PointLight(0xffc56a, 0, 7, 1.4));
  glow.position.copy(bulb.position);

  const ball = (r: number, color: number) => add(new T.Mesh(new T.SphereGeometry(r, 14, 10), new T.MeshBasicMaterial({ color })));
  const electrons = Array.from({ length: 12 }, () => ball(0.07, 0xfff2a8)); // travelling through the wire
  const waiting = Array.from({ length: 10 }, () => ball(0.07, 0xfff2a8)); // piling up on the negative plate
  const ions = Array.from({ length: 14 }, () => ball(0.1, 0x7fe0c0)); // drifting through the liquid
  const q = new T.Vector3();
  let lit = 0;

  return {
    update(step, p, t, s) {
      const connected = step >= 2;
      const k = connected ? ease(clamp(s / TIMING.appear)) : 0;
      const flow = step === 2 ? k : step === 3 ? 1 : 0;
      // wire and lamp are put on in the third step ("a wire connects the two terminals")
      for (const part of [wire, socket, bulb, filament]) part.visible = connected;
      // step 1: the reaction at the negative plate sets electrons free – they gather there
      const piled = step === 0 ? 0 : step === 1 ? ease(p) : 1;
      waiting.forEach((m, i) => {
        m.visible = step >= 1 && i / waiting.length < piled && !(connected && i % 2 === 0);
        m.position.set(-X - 0.13 + 0.26 * (i % 2), TOP - 0.12 - 0.19 * Math.floor(i / 2) + 0.015 * Math.sin(t * 7 + i), 0.3 - 0.6 * rand(i, 5));
      });
      // step 2: through the wire from the negative to the positive plate; the lamp lights up
      electrons.forEach((m, i) => {
        m.visible = flow > 0;
        wirePath.getPointAt((t * 0.22 + i / electrons.length) % 1, q);
        m.position.copy(q);
      });
      lit = flow;
      bulbMat.emissiveIntensity = 2.4 * lit;
      bulbMat.opacity = lerp(0.35, 0.85, lit);
      glow.intensity = 9 * lit;
      // step 3: inside, ions drift through the liquid and close the circuit
      ions.forEach((m, i) => {
        const u = (t * 0.16 + rand(i, 2)) % 1;
        m.visible = step === 3;
        m.position.set(lerp(X - 0.2, -X + 0.2, u), BOTTOM + 0.35 + 1.55 * rand(i, 3) + 0.06 * Math.sin(t * 2 + i), 0.9 * (rand(i, 4) - 0.5));
        m.scale.setScalar(Math.min(1, 6 * u, 6 * (1 - u)) * (step === 3 ? ease(clamp(s / TIMING.appear)) : 0) + 0.001);
      });
      liquidMat.opacity = step === 0 ? 0.3 + 0.12 * Math.sin(Math.PI * clamp(p * 1.5)) : 0.3;
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / TIMING.camera));
      const y = step === 3 ? lerp(1.9, 0.9, k) : 1.9; // down to the liquid for the ions
      return { pos: [2.8, y + 1.2, step === 3 ? lerp(10.4, 13.4, k) : 10.4], look: [0, step === 3 ? lerp(0.75, 0.5, k) : 0.75, 0] }; // step 4: the wires to the lamp stay in view
    },
    labels(step) {
      const poles = [{ at: [-X - 0.75, TOP + 0.35, 0] as Vec3, text: 0, dim: step > 1 }, { at: [X + 0.75, TOP + 0.35, 0] as Vec3, text: 1, dim: step > 1 }];
      if (step === 0) return [...poles, { at: [0, -0.6, 1.2], text: 2, color: "#9fd3f0" }];
      if (step === 1) return [...poles, { at: [-X - 0.95, 0.95, 0], text: 3, color: "#fff2a8" }];
      if (step === 2) return [{ at: [0, 3.95, 0], text: 5, color: "#ffd24a" }, { at: [-X - 0.55, 2.5, 0], text: 3, color: "#fff2a8" }];
      return [{ at: [0, -0.2, 1.2], text: 4, color: "#7fe0c0" }, { at: [0, -1.25, 1.2], text: 2, dim: true }];
    },
    stage: { shadows: true, floor: BOTTOM - 0.09 },
  };
};
