// Birth of a star: a cold cloud of gas and dust collapses under its own gravity, spins faster,
// flattens into a disc around a protostar – and finally fusion ignites.
// labels: 0 cloud of gas and dust, 1 gravity pulls the cloud together, 2 a protostar forms, 3 disc,
//         4 nuclear fusion ignites, 5 hydrogen fuses into helium
// A few thousand points stand for unimaginably many particles; the real collapse takes on the
// order of a hundred thousand years and more.
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const N = 3200;

export const starbirth: SceneFactory = ({ THREE: T, scene }) => {
  const surface = painter(T);
  const far = new T.BufferGeometry();
  far.setAttribute("position", new T.Float32BufferAttribute(Array.from({ length: 2400 }, (_, i) => (rand(i, 17) - 0.5) * 160), 3));
  scene.add(new T.Points(far, new T.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: false, transparent: true, opacity: 0.45 })));

  // every particle: where it starts in the cloud, and where it ends up in the disc
  const start = new Float32Array(N * 3); // radius in the plane, height, angle
  const disc = new Float32Array(N); // radius in the disc
  const pace = new Float32Array(N); // how fast it circles (inner particles faster)
  const colors = new Float32Array(N * 3);
  const tint = new T.Color();
  for (let i = 0; i < N; i++) {
    const clump = 0.75 + 0.5 * Math.sin(rand(i, 1) * 19) * rand(i, 2); // the cloud is lumpy, not a ball
    const r = 5.6 * Math.cbrt(rand(i, 3)) * clump;
    const tiltUp = Math.acos(2 * rand(i, 4) - 1);
    start[i * 3] = r * Math.sin(tiltUp);
    start[i * 3 + 1] = r * Math.cos(tiltUp) * 0.8;
    start[i * 3 + 2] = rand(i, 5) * 6.2832;
    disc[i] = 0.55 + 3.6 * Math.pow(rand(i, 6), 0.7);
    pace[i] = 1 / Math.pow(0.35 + disc[i] / 4, 1.5);
    tint.setHSL(lerp(0.03, 0.62, rand(i, 7) ** 2), 0.6, lerp(0.38, 0.62, rand(i, 8))); // dusty red-brown to cool blue
    colors.set([tint.r, tint.g, tint.b], i * 3);
  }
  const geometry = new T.BufferGeometry();
  const position = new T.Float32BufferAttribute(new Float32Array(N * 3), 3);
  geometry.setAttribute("position", position);
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  const cloudMat = new T.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.6, blending: T.AdditiveBlending, depthWrite: false });
  const cloud = new T.Points(geometry, cloudMat);
  cloud.frustumCulled = false;

  const starMat = new T.MeshBasicMaterial({ map: surface.sun() });
  const star = new T.Mesh(new T.SphereGeometry(0.5, 48, 32), starMat);
  const glowMat = new T.SpriteMaterial({ map: surface.halo(), blending: T.AdditiveBlending, depthWrite: false, transparent: true });
  const glow = new T.Sprite(glowMat);
  // soft glowing patches of gas, so the cloud reads as a nebula and not as snow
  const soft = surface.paint((c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.35, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  }, 128, 128);
  const puffColours = [0x8a3326, 0x2c4f96, 0x5b3a84, 0x9a5a2a];
  const puffs = Array.from({ length: 34 }, (_, i) => {
    const s = new T.Sprite(new T.SpriteMaterial({ map: soft, color: puffColours[i % 4], transparent: true, opacity: 0.32, blending: T.AdditiveBlending, depthWrite: false }));
    const r = 4.6 * Math.cbrt(rand(i, 31)), up = Math.acos(2 * rand(i, 32) - 1), a = rand(i, 33) * 6.2832;
    s.userData = { r: r * Math.sin(up), y: r * Math.cos(up) * 0.8, a, size: 3 + 3.5 * rand(i, 34) };
    scene.add(s);
    return s;
  });
  // gravity: arrows pointing inwards while the cloud contracts
  const pulls = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * 6.2832;
    const arrow = new T.ArrowHelper(new T.Vector3(-Math.cos(a), 0, -Math.sin(a)), new T.Vector3(), 1.1, 0xffd24a, 0.35, 0.22);
    arrow.userData.a = a;
    scene.add(arrow);
    return arrow;
  });
  scene.add(cloud, star, glow);

  const ember = new T.Color(0x9a2f14);
  const orange = new T.Color(0xff8a3a);
  const white = new T.Color(0xfff6dc);
  const views: { pos: Vec3; look: Vec3 }[] = [
    { pos: [0, 3.2, 16], look: [0, 0, 0] },
    { pos: [0, 4, 13.5], look: [0, 0, 0] },
    { pos: [0, 5.6, 10.5], look: [0, -0.2, 0] }, // higher up, so the disc shows
    { pos: [0, 4.4, 9.4], look: [0, -0.1, 0] },
  ];

  return {
    update(step, p, t) {
      const collapse = step === 0 ? 0 : step === 1 ? ease(p) : 1; // falling inwards
      const flatten = step < 2 ? 0 : step === 2 ? ease(clamp(p * 1.15)) : 1; // into a disc
      const ignite = step === 3 ? ease(clamp(p * 1.6)) : 0;
      // the cloud turns faster the smaller it gets (like a skater pulling in the arms)
      const spin = t * 0.1 + (step === 0 ? 0 : step === 1 ? 2.2 * p * p : step === 2 ? 2.2 + 4.4 * p : 6.6 + 4.4 * p);
      for (let i = 0; i < N; i++) {
        const inner = disc[i] < 1.25; // close to the centre: ends up in the star
        let r = lerp(start[i * 3], lerp(start[i * 3] * 0.45, disc[i], flatten), collapse);
        if (inner) r *= 1 - 0.97 * Math.max(flatten * 0.6, ignite);
        const y = start[i * 3 + 1] * lerp(1, 0.45, collapse) * lerp(1, 0.05, flatten);
        const a = start[i * 3 + 2] + spin * pace[i];
        position.setXYZ(i, r * Math.cos(a), y, r * Math.sin(a));
      }
      position.needsUpdate = true;
      cloudMat.opacity = lerp(0.6, 0.5, flatten);
      puffs.forEach((s, i) => {
        const { r, y, a, size } = s.userData as { r: number; y: number; a: number; size: number };
        const rr = r * lerp(1, lerp(0.45, 0.8, flatten), collapse);
        const angle = a + spin * 0.35;
        s.position.set(rr * Math.cos(angle), y * lerp(1, 0.45, collapse) * lerp(1, 0.08, flatten), rr * Math.sin(angle));
        const sz = size * lerp(1, 0.6, collapse) * lerp(1, 0.7, flatten);
        s.scale.set(sz, sz * lerp(1, 0.45, flatten), 1);
        (s.material as InstanceType<typeof T.SpriteMaterial>).opacity = 0.32 * lerp(1, 0.35, flatten) * (1 - 0.6 * ignite) * (0.85 + 0.15 * Math.sin(t * 0.7 + i));
      });
      const ring = lerp(5.2, 2.6, collapse);
      pulls.forEach((arrow) => {
        const a = arrow.userData.a as number;
        arrow.visible = step === 1;
        arrow.position.set(ring * Math.cos(a), 0, ring * Math.sin(a));
      });

      // the protostar: first a dull red glow from the heat of compression, then white-hot when fusion starts
      const grown = step < 2 ? (step === 1 ? 0.25 * ease(clamp(p * 2 - 1)) : 0) : step === 2 ? lerp(0.25, 1, ease(p)) : 1;
      star.scale.setScalar(Math.max(0.001, grown * (1 + 0.25 * ignite)));
      star.rotation.y = t * 0.3;
      starMat.color.copy(ember).lerp(orange, step >= 2 ? (step === 2 ? ease(p) : 1) : 0).lerp(white, ignite);
      const flash = step === 3 ? Math.max(0, 1 - Math.abs(p - 0.3) * 5) : 0; // the moment of ignition
      const shine = grown * (3 + 7 * ignite + 4.5 * flash) * (1 + 0.03 * Math.sin(t * 2.4));
      glow.scale.set(Math.max(0.001, 2 * shine), Math.max(0.001, shine), 1);
      glowMat.color.copy(orange).lerp(white, ignite);
      glowMat.opacity = lerp(0.55, 1, ignite);
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.5)));
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step, p) {
      if (step === 0) return [{ at: [0, 3.5, 0], text: 0 }];
      if (step === 1) return [{ at: [0, 2.5, 0], text: 1, color: "#ffd24a" }];
      if (step === 2) return p > 0.4 ? [{ at: [0, 1.25, 0], text: 2, color: "#ffb37a" }, { at: [2.3, 0.45, 1.6], text: 3 }] : [];
      return p > 0.25 ? [{ at: [0, 1.7, 0], text: 4, color: "#fff2a8" }, { at: [0, -1.5, 0.5], text: 5 }] : [];
    },
    stage: { space: true },
  };
};
