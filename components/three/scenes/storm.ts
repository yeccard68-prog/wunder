// How a thunderstorm forms: warm moist air rises, a cloud tower grows, ice and graupel separate
// electric charge, and lightning evens it out.
// labels: 0 warm, moist air rises, 1 ice crystals, 2 graupel, 3 lightning: up to 30,000 °C, 4 over 10 km high
// Not to scale: crystals, graupel and the charge signs are enormously enlarged, the growth of the
// cloud – in reality tens of minutes – takes seconds.
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const BASE = 2.3; // height of the cloud base
const TOPY = 7.2; // top of the full-grown tower

export const storm: SceneFactory = ({ THREE: T, scene }) => {
  const { paint } = painter(T);
  // evening sky before a storm
  scene.background = paint((c, w, h) => {
    const grad = c.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#131c2e");
    grad.addColorStop(0.6, "#2c3f5c");
    grad.addColorStop(1, "#6f7f8f");
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
  });
  const ground = new T.Mesh(new T.CircleGeometry(26, 64), new T.MeshStandardMaterial({ color: 0x4d6a3a, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  for (let i = 0; i < 9; i++) {
    // a few trees and a house give the cloud its scale
    const x = -7 + i * 1.75 + rand(i, 3);
    const z = -1.5 - 3 * rand(i, 4);
    const trunk = new T.Mesh(new T.CylinderGeometry(0.04, 0.05, 0.3, 6), new T.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 1 }));
    trunk.position.set(x, 0.15, z);
    const crown = new T.Mesh(new T.ConeGeometry(0.2, 0.55, 8), new T.MeshStandardMaterial({ color: 0x2f5231, roughness: 1 }));
    crown.position.set(x, 0.52, z);
    scene.add(trunk, crown);
  }

  // the cloud: many soft balls, appearing from the base upwards as it grows; an anvil spreads out at the top
  // dark at the base, bright at the top – the way a thundercloud looks from below
  const shadeBase = Array.from({ length: 6 }, (_, k) => new T.Color(0x8a92a2).lerp(new T.Color(0xffffff), Math.pow(k / 5, 0.8)));
  // soft, fuzzy material: the edges light up a little, as on a real cloud
  const shades = shadeBase.map((c) => new T.MeshPhysicalMaterial({ color: c.clone(), roughness: 1, metalness: 0, sheen: 1, sheenRoughness: 0.85, sheenColor: new T.Color(0xffffff) }));
  // one lumpy ball (cauliflower-like bumps) shared by all puffs; each puff is turned differently
  const lump = mergeVertices(new T.IcosahedronGeometry(1, 4).deleteAttribute("normal").deleteAttribute("uv")); // shared corners: smooth shading
  {
    const p = lump.getAttribute("position") as InstanceType<typeof T.BufferAttribute>;
    const v = new T.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      const bump = 0.13 * Math.sin(v.x * 7.1 + 1.3) * Math.sin(v.y * 6.3 + 0.4) * Math.sin(v.z * 7.7 + 2.1) + 0.06 * Math.sin(v.x * 17 + v.y * 13) * Math.sin(v.z * 15 - v.y * 11);
      v.multiplyScalar(1 + bump);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    lump.computeVertexNormals();
  }
  const PUFFS = 110;
  const puffs = Array.from({ length: PUFFS }, (_, i) => {
    const level = i / (PUFFS - 1); // 0 base … 1 top
    const anvil = level > 0.82;
    const spread = anvil ? 3.4 : lerp(2.1, 1.35, level) * (1 + 0.25 * Math.sin(level * 9));
    const a = rand(i, 1) * 6.2832;
    const d = Math.sqrt(rand(i, 2)) * spread;
    const m = new T.Mesh(lump, shades[Math.min(5, Math.floor(level * 6))]);
    m.rotation.set(rand(i, 7) * 6.28, rand(i, 8) * 6.28, rand(i, 9) * 6.28);
    m.position.set(d * Math.cos(a), lerp(BASE + 0.3, TOPY, level) + (anvil ? 0 : 0.3 * (rand(i, 5) - 0.5)), d * Math.sin(a) * 0.75);
    scene.add(m);
    return { m, level, size: (anvil ? 0.62 : lerp(0.9, 0.66, level)) * (0.75 + 0.5 * rand(i, 6)), flat: anvil ? 0.55 : 1 };
  });

  // rain falling from the base of the mature cloud
  const rain = Array.from({ length: 30 }, (_, i) => {
    const m = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.32, 4), new T.MeshBasicMaterial({ color: 0xbfd6f0, transparent: true, opacity: 0.6 }));
    m.userData = { x: -1.8 + 3.6 * rand(i, 21), z: 1.2 * (rand(i, 22) - 0.5), o: rand(i, 23) };
    scene.add(m);
    return m;
  });
  const dot = (r: number, color: number, opacity = 1) => {
    const m = new T.Mesh(new T.SphereGeometry(r, 10, 8), new T.MeshBasicMaterial({ color, transparent: opacity < 1, opacity }));
    scene.add(m);
    return m;
  };
  const warm = Array.from({ length: 16 }, () => dot(0.09, 0xff9a5a, 0.85)); // rising warm air
  const ice = Array.from({ length: 16 }, () => dot(0.07, 0xdff4ff)); // light crystals, carried up
  const graupel = Array.from({ length: 12 }, () => dot(0.12, 0x9aa3ad)); // heavy soft hail, sinking

  // charge signs, always facing the viewer
  const sign = (text: string, color: string) => paint((c, w, h) => {
    c.font = "bold 92px system-ui, sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = color;
    c.fillText(text, w / 2, h / 2 + 4);
  });
  const plus = sign("+", "#ffd24a");
  const minus = sign("–", "#8fd0ff");
  const charge = (map: InstanceType<typeof T.CanvasTexture>, at: Vec3) => {
    const s = new T.Sprite(new T.SpriteMaterial({ map, transparent: true, depthTest: false, opacity: 0 }));
    s.position.set(...at);
    s.scale.set(1.1, 0.55, 1);
    s.renderOrder = 6;
    scene.add(s);
    return s;
  };
  const positive = Array.from({ length: 7 }, (_, i) => charge(plus, [-2.4 + i * 0.8, TOPY - 0.5 + 0.35 * (i % 2), 1.2]));
  const negative = Array.from({ length: 7 }, (_, i) => charge(minus, [-1.8 + i * 0.6, BASE + 0.45 + 0.3 * (i % 2), 1.6]));
  const induced = Array.from({ length: 4 }, (_, i) => charge(plus, [-0.6 + i * 0.75, 0.3, 1.2])); // the ground below answers with positive charge

  // the lightning channel: a jagged path from the cloud base to the ground, with one side branch
  const UP = new T.Vector3(0, 1, 0);
  const v = new T.Vector3();
  const boltMat = new T.MeshBasicMaterial({ color: 0xf2f6ff });
  const haloMat = new T.MeshBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.3, blending: T.AdditiveBlending, depthWrite: false });
  const bolt = new T.Group();
  const path: Vec3[] = Array.from({ length: 9 }, (_, i) => [0.2 + (i ? 0.55 * (rand(i, 8) - 0.5) : 0) + i * 0.07, lerp(BASE + 0.2, 0, i / 8), 1.3]);
  const branch: Vec3[] = [path[3], [path[3][0] - 0.7, path[3][1] - 0.5, 1.3], [path[3][0] - 0.9, path[3][1] - 1.1, 1.3]];
  for (const line of [path, branch])
    for (let i = 0; i < line.length - 1; i++) {
      const [a, b] = [line[i], line[i + 1]];
      v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const length = v.length();
      for (const [r, mat] of [[line === path ? 0.035 : 0.02, boltMat], [0.13, haloMat]] as const) {
        const seg = new T.Mesh(new T.CylinderGeometry(r, r, length, 6, 1, true), mat);
        seg.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2]);
        seg.quaternion.setFromUnitVectors(UP, v.clone().normalize());
        bolt.add(seg);
      }
    }
  const flash = new T.PointLight(0xcfe0ff, 0, 40, 1.2);
  flash.position.set(0.4, 1.4, 2.5);
  scene.add(bolt, flash);

  const dark = new T.Color(0x5f6a78);
  const views: { pos: Vec3; look: Vec3 }[] = [
    { pos: [1.5, 1.9, 13.5], look: [0, 1.9, 0] },
    { pos: [2, 3, 21], look: [0, 3.9, 0] },
    { pos: [1.5, 4.2, 16.5], look: [0, 4.6, 0] },
    { pos: [2, 2.6, 20], look: [0, 3.4, 0] },
  ];
  let strike = 0;

  return {
    update(step, p, t) {
      // growth: a small cumulus in the first step, the full tower in the second
      const growth = step === 0 ? 0.3 * ease(p) : step === 1 ? lerp(0.3, 1, ease(clamp(p * 1.15))) : 1;
      puffs.forEach(({ m, level, size, flat }, i) => {
        const k = ease(clamp((growth - level * 0.92) * 9));
        const breathe = 1 + 0.03 * Math.sin(t * 0.9 + i);
        m.scale.set(Math.max(0.001, size * k * breathe), Math.max(0.001, size * k * flat), Math.max(0.001, size * k));
      });
      // a storm cloud is dense: it turns dark as it fills with ice and water
      const dense = step === 0 ? 0 : step === 1 ? 0.45 * ease(p) : step === 2 ? lerp(0.45, 0.75, p) : 0.75;
      shades.forEach((m, k) => m.color.copy(shadeBase[k]).lerp(dark, dense * (1 - 0.55 * (k / 5)))); // the top stays brighter

      warm.forEach((m, i) => {
        const u = (t * 0.2 + i / warm.length) % 1;
        m.visible = step <= 1;
        m.position.set(1.7 * (rand(i, 11) - 0.5) * (1 - 0.3 * u) + 0.12 * Math.sin(t * 2 + i), lerp(0.1, BASE + 0.2, u), 1.5 + 0.8 * (rand(i, 12) - 0.5));
        m.scale.setScalar(Math.min(1, 5 * u, 5 * (1 - u)) + 0.001);
      });
      const inside = step === 1 ? ease(clamp(p * 2 - 1)) : step === 2 ? 1 : 0;
      ice.forEach((m, i) => {
        const u = (t * 0.17 + i / ice.length) % 1;
        m.visible = inside > 0;
        m.position.set(2.6 * (rand(i, 13) - 0.5), lerp(4.2, TOPY - 0.2, u), 1.5 + 0.5 * rand(i, 14));
        m.scale.setScalar(inside * Math.min(1, 5 * u, 5 * (1 - u)) + 0.001);
      });
      graupel.forEach((m, i) => {
        const u = (t * 0.15 + i / graupel.length) % 1;
        m.visible = inside > 0;
        m.position.set(2.2 * (rand(i, 15) - 0.5), lerp(5, BASE + 0.4, u), 1.6 + 0.5 * rand(i, 16));
        m.scale.setScalar(inside * Math.min(1, 5 * u, 5 * (1 - u)) + 0.001);
      });

      // charge separates in the third step
      const charged = step < 2 ? 0 : step === 2 ? ease(clamp(p * 1.3)) : 1;
      positive.forEach((s, i) => (s.material.opacity = clamp(charged * 7 - i)));
      negative.forEach((s, i) => (s.material.opacity = clamp(charged * 7 - i)));
      induced.forEach((s) => (s.material.opacity = step === 3 ? 1 : 0));

      // lightning: a short, flickering discharge every second and a half
      const beat = (t * 0.62) % 1;
      strike = step === 3 && beat < 0.2 ? (0.55 + 0.45 * Math.sin(beat * 95)) * (1 - beat / 0.2) : 0;
      bolt.visible = strike > 0.08;
      rain.forEach((m) => {
        const { x, z, o } = m.userData as { x: number; z: number; o: number };
        const u = (t * 0.9 + o) % 1;
        m.visible = step === 3;
        m.position.set(x, lerp(BASE, 0.1, u), z);
      });
      flash.intensity = 90 * strike;
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.5)));
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step, p) {
      if (step === 0) return [{ at: [2.6, 1.2, 1.5], text: 0, color: "#ffb37a" }];
      if (step === 1) return p > 0.55 ? [{ at: [0, TOPY + 1.5, 0], text: 4 }, { at: [-3.2, 6.3, 1.5], text: 1, color: "#dff4ff" }, { at: [-3, 3.4, 1.5], text: 2 }] : [{ at: [2.6, 1.2, 1.5], text: 0, dim: true }];
      if (step === 2) return [{ at: [3.7, TOPY - 0.4, 1.5], text: 1, color: "#ffd24a" }, { at: [3.4, BASE + 0.6, 1.5], text: 2, color: "#8fd0ff" }];
      return [{ at: [2.9, 1.4, 1.5], text: 3, color: "#ffd24a" }];
    },
    stage: { shadows: true },
  };
};
