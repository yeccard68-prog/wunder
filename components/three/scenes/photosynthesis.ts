// Photosynthesis: a leaf takes in light, water and carbon dioxide, absorbs red and blue light (and so looks
// green), builds sugar and gives off oxygen; the sugar travels into the rest of the plant.
// labels: 0 sunlight, 1 water from the roots, 2 carbon dioxide from the air, 3 pores on the underside,
//         4 chlorophyll absorbs red and blue, 5 green is reflected, 6 sugar (glucose), 7 oxygen,
//         8 6 CO₂ + 6 H₂O → sugar + 6 O₂, 9 sugar travels into the plant
// Molecules are shown hugely enlarged; the reactions inside the chloroplasts are summed up in one step.
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const TILT = 0.9; // leaf faces up towards the sun and a little towards the viewer

export const photosynthesis: SceneFactory = ({ THREE: T, scene }) => {
  const surface = painter(T);
  scene.background = surface.paint((c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#5f9ad0");
    g.addColorStop(1, "#d9ecf5");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
  const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);

  // the leaf: outline in its own x–y plane, a little thickness, midrib, side veins and the stalk
  const leaf = new T.Group();
  leaf.rotation.x = -TILT;
  scene.add(leaf);
  const outline = new T.Shape();
  outline.moveTo(-2.4, 0);
  outline.quadraticCurveTo(-1.2, 1.55, 1, 1.05);
  outline.quadraticCurveTo(2.1, 0.7, 2.8, 0);
  outline.quadraticCurveTo(2.1, -0.7, 1, -1.05);
  outline.quadraticCurveTo(-1.2, -1.55, -2.4, 0);
  // the leaf surface, painted once: lighter in the middle, darker at the edge, with a fine net of small veins
  // (the outline spans x −2.4…2.8, y −1.3…1.3; the texture is stretched over exactly that)
  const skin = document.createElement("canvas");
  skin.width = 512;
  skin.height = 256;
  const c = skin.getContext("2d");
  if (c) {
    const grad = c.createRadialGradient(230, 128, 20, 230, 128, 300);
    grad.addColorStop(0, "#4f9a3c");
    grad.addColorStop(0.6, "#2f7d2c");
    grad.addColorStop(1, "#1d5a1f");
    c.fillStyle = grad;
    c.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 900; i++) {
      // tiny vein segments, a little lighter than the leaf
      const x = rand(i, 21) * 512, y = rand(i, 22) * 256, a = rand(i, 23) * 6.28, l = 6 + 14 * rand(i, 24);
      c.strokeStyle = `rgba(170,215,120,${0.08 + 0.12 * rand(i, 25)})`;
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      c.stroke();
    }
  }
  const skinMap = new T.CanvasTexture(skin);
  skinMap.colorSpace = T.SRGBColorSpace;
  skinMap.repeat.set(1 / 5.2, 1 / 2.6);
  skinMap.offset.set(2.4 / 5.2, 1.3 / 2.6);
  // a waxy skin: a little gloss on top
  const leafMat = new T.MeshPhysicalMaterial({ color: 0xffffff, map: skinMap, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.35, sheen: 0.4, sheenColor: new T.Color(0xc8f0a0), side: T.DoubleSide });
  const blade = new T.Mesh(new T.ExtrudeGeometry(outline, { depth: 0.04, bevelEnabled: false, curveSegments: 24 }), leafMat);
  blade.position.z = -0.02;
  leaf.add(blade);
  const veinMat = new T.MeshStandardMaterial({ color: 0x9ccf7a, roughness: 0.5 });
  const rod = (a: [number, number], b: [number, number], r: number, mat: InstanceType<typeof T.Material>) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const m = new T.Mesh(new T.CylinderGeometry(r, r, len, 8), mat);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.035);
    m.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
    leaf.add(m);
    return m;
  };
  rod([-4.2, 0], [2.5, 0], 0.05, veinMat);
  for (const x of [-1.5, -0.6, 0.3, 1.2]) for (const s of [1, -1]) rod([x, 0], [x + 0.75, s * (1.05 - 0.12 * x)], 0.022, veinMat);
  leaf.updateMatrixWorld(true);
  const onLeaf = (x: number, y: number, z = 0.05) => leaf.localToWorld(V(x, y, z));

  // the sun with its glow
  const sunAt = V(-2.5, 3.2, 1.4);
  const sun = new T.Mesh(new T.SphereGeometry(0.55, 32, 24), new T.MeshBasicMaterial({ map: surface.sun() }));
  sun.position.copy(sunAt);
  const glow = new T.Sprite(new T.SpriteMaterial({ map: surface.halo(), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.position.copy(sunAt);
  glow.scale.set(4, 2.4, 1);
  scene.add(sun, glow);

  // light: little packets flying from the sun to points on the leaf (white; in step 1 red, green and blue)
  const targets = [onLeaf(-1.2, 0.5), onLeaf(0, -0.4), onLeaf(1, 0.45), onLeaf(-0.3, 0.9), onLeaf(0.8, -0.6)];
  const normal = V(0, Math.sin(TILT), Math.cos(TILT)); // the leaf's upper side
  const photon = (color: number) => {
    const m = new T.Mesh(new T.SphereGeometry(0.06, 10, 8), new T.MeshBasicMaterial({ color }));
    scene.add(m);
    return m;
  };
  const white = targets.flatMap((_, i) => [0, 1, 2].map(() => photon(i % 2 ? 0xfff4c2 : 0xffffff)));
  const colours = [0xff4a3a, 0x4ad15a, 0x4a7dff];
  const coloured = Array.from({ length: 18 }, (_, i) => photon(colours[i % 3]));
  const reflectTo = (p: InstanceType<typeof T.Vector3>) => {
    const d = p.clone().sub(sunAt).normalize();
    return d.sub(normal.clone().multiplyScalar(2 * d.dot(normal))); // mirror direction
  };

  // water drops climbing the stalk and midrib (leaf coordinates)
  const drops = Array.from({ length: 9 }, () => {
    const m = new T.Mesh(new T.SphereGeometry(0.07, 10, 8), new T.MeshBasicMaterial({ color: 0x4aa8ff }));
    leaf.add(m);
    return m;
  });
  // carbon dioxide (dark carbon between two red oxygen atoms) and oxygen (two red atoms)
  const atom = (r: number, color: number) => new T.Mesh(new T.SphereGeometry(r, 12, 10), new T.MeshStandardMaterial({ color, roughness: 0.4 }));
  const co2 = Array.from({ length: 7 }, () => {
    const g = new T.Group();
    const c = atom(0.09, 0x2b2b2b);
    const o1 = atom(0.075, 0xe04a3a);
    const o2 = atom(0.075, 0xe04a3a);
    o1.position.x = -0.15;
    o2.position.x = 0.15;
    g.add(c, o1, o2);
    scene.add(g);
    return g;
  });
  const o2s = Array.from({ length: 7 }, () => {
    const g = new T.Group();
    const a = atom(0.08, 0xe04a3a);
    const b = atom(0.08, 0xe04a3a);
    a.position.x = -0.07;
    b.position.x = 0.07;
    g.add(a, b);
    scene.add(g);
    return g;
  });
  const under = [onLeaf(0.4, -0.3, -0.06), onLeaf(-0.8, 0.3, -0.06), onLeaf(1.3, 0.2, -0.06), onLeaf(-0.2, -0.7, -0.06)];
  // sugar: hexagonal rings (glucose) forming in the leaf and travelling down the midrib
  const sugarMat = new T.MeshStandardMaterial({ color: 0xf2c14e, emissive: new T.Color(0x6b4a00), emissiveIntensity: 0.4, roughness: 0.4 });
  const sugars = Array.from({ length: 6 }, () => {
    const m = new T.Mesh(new T.TorusGeometry(0.14, 0.035, 6, 6), sugarMat);
    leaf.add(m);
    return m;
  });

  return {
    update(step, p, t, s) {
      const k = ease(clamp(s / TIMING.appear));
      glow.scale.set(4 * (1 + 0.03 * Math.sin(t * 2)), 2.4 * (1 + 0.03 * Math.sin(t * 2)), 1);
      // white light in steps 0, 2, 3; split into colours in step 1
      white.forEach((m, n) => {
        const i = Math.floor(n / 3);
        const u = (t * 0.55 + (n % 3) / 3 + i * 0.13) % 1;
        m.visible = step !== 1;
        m.position.copy(sunAt).lerp(targets[i], u);
      });
      coloured.forEach((m, n) => {
        const i = Math.floor(n / 3) % targets.length;
        const colour = n % 3; // 0 red, 1 green, 2 blue
        const u = (t * 0.45 + Math.floor(n / 3) * 0.17 + colour * 0.06) % 1;
        m.visible = step === 1;
        if (u < 0.6) m.position.copy(sunAt).lerp(targets[i], u / 0.6);
        else if (colour === 1) m.position.copy(targets[i]).add(reflectTo(targets[i]).multiplyScalar(((u - 0.6) / 0.4) * 3.2)); // green bounces off
        else m.visible = false; // red and blue are absorbed
      });
      // water: up the stalk into the leaf
      drops.forEach((m, n) => {
        const u = (t * 0.18 + n / drops.length) % 1;
        m.visible = step !== 1;
        m.position.set(lerp(-4.2, 1.6, u), 0, 0.09);
        m.scale.setScalar(u > 0.85 ? (1 - u) / 0.15 : 1);
      });
      // carbon dioxide comes in from below, oxygen leaves (from step 2 on)
      co2.forEach((g, n) => {
        const u = (t * 0.22 + n / co2.length) % 1;
        const to = under[n % under.length];
        const from = V(to.x + 1.8 * (rand(n, 2) - 0.3), to.y - 2.4, to.z + 1.2);
        g.visible = step === 0 || step === 2;
        g.position.copy(from).lerp(to, u);
        g.rotation.set(t * 0.6 + n, t * 0.4, 0);
        g.scale.setScalar(Math.max(0.001, Math.min(1, (1 - u) * 6)));
      });
      o2s.forEach((g, n) => {
        const u = (t * 0.22 + n / o2s.length + 0.5) % 1;
        const from = under[(n + 1) % under.length];
        const to = V(from.x - 1.6 * rand(n, 4) - 0.4, from.y - 2.2, from.z + 1.4);
        g.visible = step >= 2;
        g.position.copy(from).lerp(to, u);
        g.rotation.set(t * 0.7 + n, 0, t * 0.5);
        g.scale.setScalar(Math.max(0.001, Math.min(1, u * 6)) * (step === 2 ? k : 1));
      });
      // sugar: appears in the leaf (step 2) and flows down the midrib into the stalk (step 3)
      sugars.forEach((m, n) => {
        m.visible = step >= 2;
        if (step === 2) {
          m.position.set(-1.4 + n * 0.55, (n % 2 ? 0.35 : -0.35), 0.1);
          m.scale.setScalar(Math.max(0.001, ease(clamp(p * 1.6 - n * 0.12))));
        } else {
          const u = (t * 0.12 + n / sugars.length) % 1;
          m.position.set(lerp(1.4, -4.2, u), 0, 0.12);
          m.scale.setScalar(1);
        }
        m.rotation.z = t * 0.8 + n;
      });
      leafMat.emissive.setHex(0x0a2a0a);
      leafMat.emissiveIntensity = step === 2 ? 0.6 + 0.4 * Math.sin(t * 3) : 0.3;
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.5)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [0, 1.9, 10.8], look: [-0.4, 0.8, 0] },
        { pos: [-0.9, 2.5, 8.6], look: [-0.8, 1.4, 0.4] }, // light and leaf
        { pos: [0.6, 0.6, 9.2], look: [0.1, -0.4, 0] }, // the molecules around the leaf
        { pos: [-1.6, 1.2, 9.4], look: [-1.4, -0.4, 0] }, // down the stalk
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      const w = (x: number, y: number, z = 0.3): Vec3 => {
        const v = onLeaf(x, y, z);
        return [v.x, v.y, v.z];
      };
      if (step === 0) return [{ at: [sunAt.x + 0.2, sunAt.y - 0.9, sunAt.z], text: 0, color: "#fff2b0" }, { at: w(-3.6, -0.35), text: 1, color: "#bfe2ff" }, { at: [1.9, -1.7, 1.6], text: 2 }, { at: w(1.6, -1.1, -0.2), text: 3, dim: true }];
      if (step === 1) return [{ at: w(-0.6, 0.2, 0.4), text: 4, color: "#ffb0a8" }, { at: [0.4, 2.6, 2.2], text: 5, color: "#9ff0a8" }];
      if (step === 2) return [{ at: w(0.2, 0.75, 0.4), text: 6, color: "#ffe08a" }, { at: [-1.4, -2.2, 1.8], text: 7, color: "#ffb0a8" }, { at: [0.6, 2.4, 0], text: 8 }];
      return [{ at: w(-3.2, 0.35, 0.4), text: 9, color: "#ffe08a" }];
    },
  };
};
