// Ebb and flow: the Moon's pull stretches the oceans into two bulges, the Earth turns underneath them,
// and the Sun makes the tides bigger or smaller depending on where it stands.
// labels: 0 Moon, 1 bulge facing the Moon, 2 bulge on the far side, 3 high tide, 4 low tide,
//         5 spring tide: Sun and Moon in a line, 6 neap tide: at a right angle, 7 Sun, 8 pull of the Moon
// Hugely exaggerated: the real bulges are less than a metre high in the open ocean, the Moon is about
// 30 Earth diameters away, and one turn of the Earth takes a few seconds here.
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, mix, rand, type SceneFactory, type Vec3 } from "../types";

const DIST = 3.0;
const BULGE = 0.5; // hugely exaggerated stretch of the water, so the two bulges can be seen
const SUN_SHARE = 0.46; // the Sun's tidal force is on average about 46 % of the Moon's

export const tides: SceneFactory = ({ THREE: T, scene }) => {
  const surface = painter(T);
  const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
  const stars = new T.BufferGeometry();
  stars.setAttribute("position", new T.Float32BufferAttribute(Array.from({ length: 2400 }, (_, i) => (rand(i, 23) - 0.5) * 150), 3));
  scene.add(new T.Points(stars, new T.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.5 })));

  const sunlight = new T.DirectionalLight(0xfff4e0, 3);
  sunlight.position.set(-20, 6, 4);
  scene.add(sunlight);

  // the Earth turns about its axis (seen from above the North Pole: y is the axis)
  const earth = new T.Mesh(new T.SphereGeometry(1, 64, 48), new T.MeshStandardMaterial({ map: surface.earth(), roughness: 0.85 }));
  scene.add(earth);
  // the oceans as a stretched shell of water around it
  const water = new T.Mesh(new T.SphereGeometry(1.06, 64, 48), new T.MeshStandardMaterial({ color: 0x5ab4ff, emissive: new T.Color(0x0d3a6e), emissiveIntensity: 0.8, transparent: true, opacity: 0.5, roughness: 0.2, metalness: 0.1, depthWrite: false }));
  scene.add(water);
  // a harbour on the equator turning with the Earth, and a gauge for the water level there
  const harbour = new T.Mesh(new T.ConeGeometry(0.07, 0.22, 12), new T.MeshBasicMaterial({ color: 0xff5a3a }));
  harbour.geometry.rotateZ(-Math.PI / 2);
  scene.add(harbour);
  const gaugeBack = new T.Mesh(new T.BoxGeometry(0.16, 1.4, 0.05), new T.MeshBasicMaterial({ color: 0x2a2f3a }));
  const gaugeFill = new T.Mesh(new T.BoxGeometry(0.12, 1, 0.06), new T.MeshBasicMaterial({ color: 0x4aa8ff }));
  gaugeBack.position.set(1.8, 0.8, 1.9);
  scene.add(gaugeBack, gaugeFill);

  const moonBall = new T.Mesh(new T.SphereGeometry(0.27, 40, 28), new T.MeshStandardMaterial({ map: surface.moon(), roughness: 0.95 }));
  scene.add(moonBall);
  const pull = new T.ArrowHelper(V(1, 0, 0), V(0, 0, 0), 1, 0xffd24a, 0.25, 0.16);
  scene.add(pull);
  // the Sun in the last step: far to the left
  const sun = new T.Mesh(new T.SphereGeometry(0.55, 32, 24), new T.MeshBasicMaterial({ map: surface.sun() }));
  const glow = new T.Sprite(new T.SpriteMaterial({ map: surface.halo(), blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
  sun.position.set(-4.4, 0, 0);
  glow.position.copy(sun.position);
  glow.scale.set(5, 3, 1);
  scene.add(sun, glow);

  let moonAngle = 0, stretch = BULGE, harbourAt = V(1, 0, 0), level = 0;
  const radius = (dir: InstanceType<typeof T.Vector3>) => {
    // water height in a direction: highest towards and away from the Moon (cos²), plus the Sun's share
    const m = V(Math.cos(moonAngle), 0, -Math.sin(moonAngle));
    const c = dir.dot(m);
    return 1.06 + stretch * (c * c - 1 / 3);
  };

  return {
    update(step, p, t, s) {
      const k = ease(clamp(s / TIMING.appear));
      // step 3: the Moon stands at new moon (in line with the Sun) and then moves to half moon (at a right angle)
      moonAngle = step < 3 ? 0.35 + t * 0.03 : Math.PI + ease(clamp(p * 1.4)) * (Math.PI / 2);
      const sunInLine = Math.abs(Math.cos(moonAngle)); // 1 at new/full moon, 0 at half moon
      stretch = step === 0 ? BULGE * k : step === 3 ? BULGE * (1 + SUN_SHARE * (2 * sunInLine - 1)) : BULGE;
      // step 0 shows only the bulge facing the Moon growing; the far one joins in step 1
      const farSide = step === 0 ? 0.35 : step === 1 ? 0.35 + 0.65 * k : 1;
      const md = V(Math.cos(moonAngle), 0, -Math.sin(moonAngle));
      moonBall.position.copy(md).multiplyScalar(DIST);
      water.rotation.set(0, moonAngle, 0);
      const toward = 1 + stretch * (2 / 3);
      water.scale.set(toward / 1.06, (1.06 - stretch / 3) / 1.06, (1.06 - stretch / 3) / 1.06);
      water.position.copy(md).multiplyScalar((1 - farSide) * stretch * 0.5); // a single bulge leans towards the Moon
      // the Earth turns: in steps 2 and 3 faster, so a day goes by in a few seconds
      const spin = step >= 2 ? t * 0.9 : t * 0.15;
      earth.rotation.y = spin;
      harbourAt = V(Math.cos(spin), 0, -Math.sin(spin));
      level = radius(harbourAt);
      harbour.position.copy(harbourAt).multiplyScalar(level + 0.08);
      harbour.rotation.y = spin;
      harbour.visible = step >= 2;
      // the gauge: water level at the harbour, low to high
      const fill = clamp((level - (1.06 - stretch / 3)) / Math.max(0.01, stretch));
      gaugeBack.visible = gaugeFill.visible = step >= 2;
      gaugeFill.scale.y = Math.max(0.02, fill) * 1.3;
      gaugeFill.position.set(1.8, 0.8 - 0.65 + gaugeFill.scale.y / 2, 1.91);
      // the pull of the Moon (step 0)
      pull.visible = step === 0;
      pull.position.copy(md).multiplyScalar(1.25);
      pull.setDirection(md);
      pull.setLength(1.0 + 0.1 * Math.sin(t * 2), 0.25, 0.16);
      sun.visible = glow.visible = step === 3;
      glow.scale.set(5 * (1 + 0.03 * Math.sin(t * 2)), 3, 1);
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [1.4, 9.6, 5.0], look: [1.35, 0, 0] }, // from above: Earth, water and Moon
        { pos: [0.4, 8.8, 4.6], look: [0.4, 0, 0] },
        { pos: [0.9, 7.6, 5.2], look: [0.9, 0, 0.5] }, // the harbour and its gauge
        { pos: [-0.8, 10.8, 5.0], look: [-0.7, 0, 0] }, // with the Sun on the left
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      const md = V(Math.cos(moonAngle), 0, -Math.sin(moonAngle));
      const at = (v: InstanceType<typeof T.Vector3>, up = 0.45): Vec3 => [v.x, v.y + up, v.z];
      const moonL = { at: at(md.clone().multiplyScalar(DIST)), text: 0 };
      const near = { at: at(md.clone().multiplyScalar(1.45), 0.3), text: 1, color: "#9ccbff" };
      const far = { at: at(md.clone().multiplyScalar(-1.45), 0.3), text: 2, color: "#9ccbff" };
      if (step === 0) return [moonL, near, { at: at(md.clone().multiplyScalar(2.1), 0.25), text: 8, color: "#ffd24a" }];
      if (step === 1) return [moonL, near, far];
      if (step === 2) return [{ at: at(harbourAt.clone().multiplyScalar(1.5), 0.3), text: level > 1.06 ? 3 : 4, color: level > 1.06 ? "#9ccbff" : "#ffb37a" }, { at: [1.8, 1.7, 1.9], text: level > 1.06 ? 3 : 4, dim: true }];
      return [{ at: [-4.4, 0.9, 0], text: 7, color: "#ffd76a" }, moonL, { at: [0, 1.7, 0], text: Math.abs(Math.cos(moonAngle)) > 0.7 ? 5 : 6, color: "#ffd24a" }];
    },
    stage: { space: true },
  };
};
