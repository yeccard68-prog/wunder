// The greenhouse effect: sunlight comes in, heat radiation goes out – and greenhouse gases send part of it back.
// labels: 0 sunlight, 1 heat radiation, 2 greenhouse gases, 3 without greenhouse gases: −18 °C,
//         4 natural greenhouse effect: +15 °C, 5 more CO₂ – more heat stays, 6 space
// Seen from space just above the curved Earth. Hugely simplified: a handful of molecules stand for the whole
// atmosphere, the atmosphere is drawn far too thick, and how much radiation comes back ("about half", "about
// three quarters") only makes the difference visible – these are not measured shares.
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, lerp, rand, type SceneFactory, type Vec3 } from "../types";

const R = 14; // radius of the Earth in this picture; its top is at y = 0
const AIR = 1.7; // top of the (much exaggerated) atmosphere
const GAS = 0.95; // height at which radiation meets the greenhouse gases
const SUN: Vec3 = [-2.9, 6.1, -1];
const PACKETS = 14; // heat radiation
const RAYS = 7; // sunlight
const TRAIL = 14; // dots per wave packet

export const greenhouse: SceneFactory = ({ THREE: T, scene }) => {
  const surface = painter(T);
  const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
  scene.background = surface.paint((c, w, h) => {
    c.fillStyle = "#03050b";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      c.fillStyle = `rgba(255,255,255,${0.25 + 0.6 * rand(i, 2)})`;
      c.fillRect(rand(i, 3) * w, rand(i, 4) * h * 0.7, 1.5, 1.5);
    }
  }, 512, 576); // about the shape of the picture, so the stars stay round

  // the Earth (only its top is in the picture) and the glowing air around it
  const earthMat = new T.MeshStandardMaterial({ map: surface.earth(), roughness: 0.9, emissive: new T.Color(0xff4a1e), emissiveIntensity: 0 });
  const earth = new T.Mesh(new T.SphereGeometry(R, 96, 64), earthMat);
  earth.position.y = -R;
  earth.rotation.set(Math.PI / 2, 0, 0.6); // equator up: no squeezed pole in the picture
  const air = new T.Mesh(new T.SphereGeometry(R + AIR, 96, 64), new T.MeshBasicMaterial({ color: 0x4f9cff, transparent: true, opacity: 0.16, depthWrite: false }));
  air.position.y = -R;
  const rim = new T.Mesh(new T.SphereGeometry(R + 0.25, 96, 64), new T.MeshBasicMaterial({ color: 0x8cc4ff, transparent: true, opacity: 0.18, depthWrite: false }));
  rim.position.y = -R;
  scene.add(earth, air, rim);
  // height above the curved ground at horizontal position x
  const ground = (x: number) => Math.sqrt(R * R - x * x) - R;

  // the sun
  const sun = new T.Mesh(new T.SphereGeometry(0.65, 32, 24), new T.MeshBasicMaterial({ map: surface.sun() }));
  sun.position.set(...SUN);
  const glow = new T.Sprite(new T.SpriteMaterial({ map: surface.halo(), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.position.set(...SUN);
  glow.scale.set(5, 3, 1);
  scene.add(sun, glow);

  // greenhouse gases: carbon dioxide (dark carbon, red oxygen) and water vapour (red oxygen, white hydrogen)
  const atom = (r: number, color: number) => new T.Mesh(new T.SphereGeometry(r, 16, 12), new T.MeshStandardMaterial({ color, roughness: 0.45, emissive: new T.Color(color), emissiveIntensity: 0.15 }));
  const molecules = Array.from({ length: 18 }, (_, i) => {
    const g = new T.Group();
    if (i % 3 === 2) {
      const o = atom(0.13, 0xd9483a);
      const h1 = atom(0.08, 0xf2f2f2), h2 = atom(0.08, 0xf2f2f2);
      h1.position.set(-0.13, -0.1, 0);
      h2.position.set(0.13, -0.1, 0);
      g.add(o, h1, h2);
    } else {
      g.add(atom(0.13, 0x3a3d42));
      for (const side of [-1, 1]) {
        const o = atom(0.11, 0xd9483a);
        o.position.x = side * 0.22;
        g.add(o);
      }
    }
    const x = -3.3 + (i % 9) * 0.82 + 0.3 * rand(i, 2);
    g.position.set(x, ground(x) + GAS + (i < 9 ? 0 : 0.42) + 0.25 * (rand(i, 3) - 0.5), 0.6 * (rand(i, 4) - 0.5));
    g.userData.flash = 0;
    scene.add(g);
    return g;
  });

  // radiation drawn as chains of dots: straight for sunlight, wavy for heat radiation
  const dotGeo = new T.SphereGeometry(1, 8, 6);
  const sunDots = new T.InstancedMesh(dotGeo, new T.MeshBasicMaterial({ color: 0xffe08a }), RAYS * TRAIL);
  const heatDots = new T.InstancedMesh(dotGeo, new T.MeshBasicMaterial({ color: 0xff6a4a }), PACKETS * TRAIL);
  // the dots move far from where the meshes were created, so they must never be culled as "off screen"
  sunDots.frustumCulled = false;
  heatDots.frustumCulled = false;
  scene.add(sunDots, heatDots);
  const tmp = new T.Object3D();
  const hide = (mesh: InstanceType<typeof T.InstancedMesh>, k: number) => {
    tmp.position.set(0, -50, 0);
    tmp.scale.setScalar(0.0001);
    tmp.updateMatrix();
    mesh.setMatrixAt(k, tmp.matrix);
  };
  const sunTargets = Array.from({ length: RAYS }, (_, i) => -2.8 + i * 0.95);
  const heatStart = Array.from({ length: PACKETS }, (_, i) => -3.1 + i * 0.46 + 0.15 * rand(i, 6));
  // faint lines show the paths of the sunlight
  const rayMat = new T.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.22 });
  for (const x of sunTargets) scene.add(new T.Line(new T.BufferGeometry().setFromPoints([V(...SUN), V(x, ground(x), 0.3)]), rayMat));

  // a thermometer for the average temperature at the surface
  const glass = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 2.4, 20), new T.MeshStandardMaterial({ color: 0xe8eef5, transparent: true, opacity: 0.3, roughness: 0.1 }));
  glass.position.set(3.25, 4.3, 1);
  const mercury = new T.Mesh(new T.CylinderGeometry(0.08, 0.08, 1, 16), new T.MeshBasicMaterial({ color: 0xff4a3a }));
  const bulb = new T.Mesh(new T.SphereGeometry(0.23, 20, 16), new T.MeshBasicMaterial({ color: 0xff4a3a }));
  bulb.position.set(3.25, 3.05, 1);
  scene.add(glass, mercury, bulb);

  return {
    update(step, p, t, s) {
      const gases = step < 2 ? 0 : step === 2 ? ease(clamp(s / TIMING.appear)) : 1;
      const extra = step === 3 ? ease(clamp(p * 1.4)) : 0;
      molecules.forEach((g, i) => {
        const shown = i < 9 ? gases : extra * clamp(extra * 9 - (i - 9)); // the second row arrives one by one
        g.visible = shown > 0.01;
        g.userData.flash = Math.max(0, (g.userData.flash as number) - 0.04);
        g.scale.setScalar(Math.max(0.001, shown) * (1 + 0.5 * (g.userData.flash as number)));
        g.rotation.set(t * 0.5 + i, t * 0.35 + i * 2, 0);
      });

      // sunlight: from the sun straight down to the ground
      for (let r = 0; r < RAYS; r++) {
        const from = V(...SUN), to = V(sunTargets[r], ground(sunTargets[r]), 0.3);
        const head = (t * 0.3 + r / RAYS) % 1;
        for (let k = 0; k < TRAIL; k++) {
          const u = head - k * 0.012;
          if (u < 0) { hide(sunDots, r * TRAIL + k); continue; }
          tmp.position.copy(from).lerp(to, u);
          tmp.scale.setScalar(0.07 * (1 - k / TRAIL));
          tmp.updateMatrix();
          sunDots.setMatrixAt(r * TRAIL + k, tmp.matrix);
        }
      }
      sunDots.instanceMatrix.needsUpdate = true;

      // heat radiation: up from the warm ground. With greenhouse gases a share is caught and sent back down.
      const caught = step < 2 ? 0 : step === 2 ? 0.5 : lerp(0.5, 0.75, extra);
      for (let i = 0; i < PACKETS; i++) {
        const x0 = heatStart[i];
        const back = (i * 0.618) % 1 < caught;
        const turnAt = 0.32; // share of the trip at which the packet reaches the gas layer
        const tilt = 0.35 * (rand(i, 7) - 0.5);
        const pos = (u: number) => {
          if (!back || u < turnAt) return V(x0 + tilt * u * 7, ground(x0) + u * 7.5, 0.6);
          const top = V(x0 + tilt * turnAt * 7, ground(x0) + turnAt * 7.5, 0.6);
          const k = (u - turnAt) / (1 - turnAt) * 1.6; // re-emitted down towards the ground
          const x = top.x + 0.9 * k * (rand(i, 8) - 0.5);
          return V(x, Math.max(ground(x), top.y - k * (top.y - ground(x)) * 0.62), 0.6);
        };
        const head = (t * 0.17 + i / PACKETS) % 1;
        if (back && head > turnAt && head < turnAt + 0.03) {
          const m = molecules.reduce((a, b) => (b.position.distanceTo(pos(turnAt)) < a.position.distanceTo(pos(turnAt)) ? b : a));
          m.userData.flash = 1; // the molecule lights up when it catches the radiation
        }
        for (let k = 0; k < TRAIL; k++) {
          const u = head - k * 0.008;
          if (step === 0 || u < 0) { hide(heatDots, i * TRAIL + k); continue; }
          const a = pos(u), b = pos(Math.max(0, u - 0.004));
          const dir = a.clone().sub(b).normalize();
          const side = V(-dir.y, dir.x, 0).multiplyScalar(0.09 * Math.sin(u * 160));
          tmp.position.copy(a).add(side);
          tmp.scale.setScalar(0.055 * (1 - k / TRAIL) * (u > 0.85 ? (1 - u) / 0.15 : 1));
          tmp.updateMatrix();
          heatDots.setMatrixAt(i * TRAIL + k, tmp.matrix);
        }
      }
      heatDots.instanceMatrix.needsUpdate = true;

      // temperature: far below freezing without the gases, mild with them, rising with more of them
      const level = step === 0 ? 0.3 : step === 1 ? lerp(0.3, 0.16, ease(p)) : step === 2 ? lerp(0.16, 0.55, ease(p)) : lerp(0.55, 0.68, extra);
      mercury.scale.y = 2.2 * level;
      mercury.position.set(3.25, 3.15 + 1.1 * level, 1);
      earthMat.emissiveIntensity = 0.02 + 0.12 * level; // the ground warms a little
      glow.scale.set(5 * (1 + 0.03 * Math.sin(t * 2)), 3 * (1 + 0.03 * Math.sin(t * 2)), 1);
    },
    camera() {
      return { pos: [0, 3.0, 14], look: [0, 2.8, 0] };
    },
    labels(step, p) {
      const space = { at: [0.6, 6.7, 0] as Vec3, text: 6, dim: true };
      const temp = (text: number, color: string) => ({ at: [2.2, 2.45, 1] as Vec3, text, color });
      if (step === 0) return [space, { at: [-1.2, 3.6, 0.5], text: 0, color: "#ffe08a" }];
      if (step === 1) return [space, { at: [0.6, 2.4, 0.8], text: 1, color: "#ff8f7a" }, ...(p > 0.5 ? [temp(3, "#9ccbff")] : [])];
      if (step === 2) return [{ at: [-0.8, GAS + 1.0, 0.5], text: 2 }, ...(p > 0.5 ? [temp(4, "#7fe0a0")] : [])];
      return [{ at: [-0.8, GAS + 1.3, 0.5], text: 2, dim: true }, ...(p > 0.45 ? [temp(5, "#ffd24a")] : [])];
    },

  };
};
