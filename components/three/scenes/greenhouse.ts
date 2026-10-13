// The greenhouse effect: sunlight comes in, heat radiation goes out – and greenhouse gases send part of it back.
// labels: 0 sunlight, 1 heat radiation, 2 greenhouse gases, 3 without greenhouse gases: −18 °C,
//         4 natural greenhouse effect: +15 °C, 5 more CO₂ – more heat stays, 6 space
// A cut through ground and air, hugely simplified: a handful of molecules stand for the whole
// atmosphere, and how much radiation comes back is shown as "about half" and "about three quarters"
// only to make the difference visible – these are not measured shares.
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, lerp, rand, type SceneFactory, type Vec3 } from "../types";

const SKY = 6.2; // where space begins in this picture
const GAS = 3.2; // height of the layer of greenhouse gases
const S = 0.6; // scale of the whole model in the picture

export const greenhouse: SceneFactory = ({ THREE: T, scene }) => {
  const { paint } = painter(T);
  scene.background = paint((c, w, h) => {
    const grad = c.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#05070d");
    grad.addColorStop(0.42, "#16304f");
    grad.addColorStop(1, "#7fb4d8");
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
  });
  // everything is built at a comfortable size and then scaled to fit the picture
  const root = new T.Group();
  root.scale.setScalar(S);
  scene.add(root);
  const groundMat = new T.MeshStandardMaterial({ color: 0x5c7a45, roughness: 1, emissive: 0xff5a1e, emissiveIntensity: 0 });
  const ground = new T.Mesh(new T.BoxGeometry(40, 9, 6), groundMat); // deep enough to fill the picture below the surface
  ground.position.y = -4.5;
  const sea = new T.Mesh(new T.BoxGeometry(6, 0.06, 6), new T.MeshStandardMaterial({ color: 0x2f6fb0, roughness: 0.25, metalness: 0.2 }));
  sea.position.set(-6, 0.03, 0);
  root.add(ground, sea);
  // a small power station: where the additional CO₂ comes from
  const concrete = new T.MeshStandardMaterial({ color: 0x8a8d92, roughness: 0.9 });
  const plant = new T.Group();
  const hall = new T.Mesh(new T.BoxGeometry(1.5, 0.6, 1), concrete);
  hall.position.y = 0.3;
  const chimney = new T.Mesh(new T.CylinderGeometry(0.12, 0.16, 1.5, 16), concrete);
  chimney.position.set(0.5, 0.75, 0);
  plant.add(hall, chimney);
  plant.position.set(4.6, 0, -0.6);
  root.add(plant);

  // carbon dioxide: one carbon atom between two oxygen atoms
  const carbon = new T.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.5 });
  const oxygen = new T.MeshStandardMaterial({ color: 0xd9483a, roughness: 0.5 });
  const molecules = Array.from({ length: 16 }, (_, i) => {
    const g = new T.Group();
    g.add(new T.Mesh(new T.SphereGeometry(0.16, 18, 14), carbon));
    for (const side of [-1, 1]) {
      const o = new T.Mesh(new T.SphereGeometry(0.14, 18, 14), oxygen);
      o.position.x = side * 0.27;
      g.add(o);
    }
    g.position.set(-6.4 + (i % 8) * 1.75 + 0.6 * rand(i, 2), GAS + (i < 8 ? 0 : 0.8) + 0.5 * (rand(i, 3) - 0.5), 1.2 * (rand(i, 4) - 0.5));
    root.add(g);
    return g;
  });
  const dot = (r: number, color: number) => {
    const m = new T.Mesh(new T.SphereGeometry(r, 10, 8), new T.MeshBasicMaterial({ color }));
    root.add(m);
    return m;
  };
  const light = Array.from({ length: 12 }, () => dot(0.09, 0xffe08a)); // sunlight: passes the air almost unhindered
  const heat = Array.from({ length: 16 }, () => dot(0.1, 0xff5a3a)); // heat radiation from the warm ground
  const smoke = Array.from({ length: 8 }, () => dot(0.12, 0x9a9da3));

  // a thermometer for the average temperature at the surface
  const tube = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 2.6, 20), new T.MeshStandardMaterial({ color: 0xe8eef5, transparent: true, opacity: 0.35, roughness: 0.1 }));
  tube.position.set(5.9, 1.5, 1);
  const mercury = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 1, 16), new T.MeshBasicMaterial({ color: 0xff4a3a }));
  const bulb = new T.Mesh(new T.SphereGeometry(0.24, 20, 16), new T.MeshBasicMaterial({ color: 0xff4a3a }));
  bulb.position.set(5.9, 0.2, 1);
  root.add(tube, mercury, bulb);

  let level = 0.25;

  return {
    update(step, p, t, s) {
      const gases = step < 2 ? 0 : step === 2 ? ease(clamp(s / TIMING.appear)) : 1;
      const extra = step === 3 ? ease(clamp(p * 1.4)) : 0;
      molecules.forEach((g, i) => {
        const shown = i < 8 ? gases : extra * clamp(extra * 8 - (i - 8)); // the second row arrives one by one
        g.visible = shown > 0.01;
        g.scale.setScalar(Math.max(0.001, shown));
        g.rotation.z = t * 0.6 + i;
        g.rotation.y = t * 0.4 + i * 2;
      });
      // sunlight comes down at an angle and warms the ground
      light.forEach((m, i) => {
        const u = (t * 0.28 + i / light.length) % 1;
        const x0 = -7 + (i % 6) * 2.4;
        m.position.set(x0 + 2.2 * u, lerp(SKY + 0.8, 0.05, u), 0.4 * (i % 3) - 0.4);
      });
      // heat radiation rises. Without greenhouse gases all of it escapes; with them part is sent back down.
      const returned = step < 2 ? 0 : step === 2 ? 0.5 : lerp(0.5, 0.75, extra);
      heat.forEach((m, i) => {
        const u = (t * 0.2 + i / heat.length) % 1;
        const x0 = -6.6 + (i % 8) * 1.75;
        const back = step >= 1 && (i * 0.618) % 1 < returned;
        m.visible = step >= 1;
        const turn = GAS / (SKY + 1); // the moment it meets the gas layer
        const y = !back || u < turn ? lerp(0.05, SKY + 1, u) : lerp(GAS, 0.05, (u - turn) / (1 - turn));
        m.position.set(x0 + 0.25 * Math.sin(u * 20 + i), y, 0.9);
      });
      smoke.forEach((m, i) => {
        const u = (t * 0.25 + i / smoke.length) % 1;
        m.visible = step === 3;
        m.position.set(5.1 + 0.5 * u + 0.1 * Math.sin(t + i), 1.5 + 1.6 * u, -0.6);
        m.scale.setScalar(0.5 + 1.2 * u);
      });
      // temperature: far below freezing without the gases, mild with them, rising with more of them
      level = step === 0 ? 0.3 : step === 1 ? lerp(0.3, 0.18, ease(p)) : step === 2 ? lerp(0.18, 0.55, ease(p)) : lerp(0.55, 0.68, extra);
      mercury.scale.y = 2.4 * level;
      mercury.position.set(5.9, 0.3 + 1.2 * level, 1);
      groundMat.emissiveIntensity = 0.02 + 0.1 * level; // the ground warms a little
    },
    camera(step) {
      return { pos: [0.5, step === 0 ? 1.9 : 2.1, 13], look: [0.3, 1.75, 0] };
    },
    labels(step, p) {
      // positions are given in the model's own size and scaled like the model
      const model = (): { at: Vec3; text: number; color?: string; dim?: boolean }[] => {
      const space = { at: [-5.2, SKY + 0.6, 0] as Vec3, text: 6, dim: true };
      if (step === 0) return [space, { at: [-3.4, 4.6, 0], text: 0, color: "#ffe08a" }];
      if (step === 1) return [space, { at: [0.5, 1.5, 0.9], text: 1, color: "#ff8f7a" }, ...(p > 0.5 ? [{ at: [6.2, 3.3, 1] as Vec3, text: 3, color: "#9ccbff" }] : [])];
      if (step === 2) return [{ at: [-1.5, GAS + 0.75, 0], text: 2 }, ...(p > 0.5 ? [{ at: [5.6, 3.3, 1] as Vec3, text: 4, color: "#7fe0a0" }] : [])];
      return [{ at: [-1.5, GAS + 1.55, 0], text: 2, dim: true }, ...(p > 0.45 ? [{ at: [5.2, 3.5, 1] as Vec3, text: 5, color: "#ffd24a" }] : [])];
      };
      return model().map((l) => ({ ...l, at: [l.at[0] * S, l.at[1] * S, l.at[2] * S] as Vec3 }));
    },
    stage: { shadows: true },
  };
};
