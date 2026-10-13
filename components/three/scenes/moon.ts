// The phases of the Moon: half of the Moon is always lit by the Sun – what changes is how much of
// that half we see from the Earth. First seen from above, then from the Earth itself.
// labels: 0 sunlight, 1 Earth, 2 Moon, 3 new moon, 4 first quarter (waxing), 5 full moon,
//         6 last quarter (waning), 7 view from the Earth
// Not to scale: the real Moon is about 30 Earth diameters away. The lighting is computed, so the
// phases on screen are what this geometry really produces.
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const DIST = 3.6;
/** Moon position for the orbital angle m (π = new moon, 2π = full moon); the orbit is tilted a little, as in reality. */
const at = (m: number): Vec3 => [DIST * Math.cos(m), 0.3 * Math.sin(m + 0.6), -DIST * Math.sin(m)];

export const moon: SceneFactory = ({ THREE: T, scene }) => {
  const surface = painter(T);
  const stars = new T.BufferGeometry();
  stars.setAttribute("position", new T.Float32BufferAttribute(Array.from({ length: 2700 }, (_, i) => (rand(i, 13) - 0.5) * 150), 3));
  scene.add(new T.Points(stars, new T.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, opacity: 0.55 })));

  // the Sun is far away on the left: its light arrives as parallel rays
  const sunlight = new T.DirectionalLight(0xfff4e0, 3.2);
  sunlight.position.set(-20, 0, 0);
  const earth = new T.Mesh(new T.SphereGeometry(1, 56, 40), new T.MeshStandardMaterial({ map: surface.earth(), roughness: 0.85 }));
  earth.rotation.z = -0.41;
  const ball = new T.Mesh(new T.SphereGeometry(0.27, 48, 32), new T.MeshStandardMaterial({ map: surface.moon(), roughness: 0.95 }));
  const path = new T.LineLoop(new T.BufferGeometry().setFromPoints(Array.from({ length: 160 }, (_, i) => new T.Vector3(...at((i / 160) * 6.2832)))), new T.LineBasicMaterial({ color: 0xcfc8bb, transparent: true, opacity: 0.45 }));
  const rays = [-2.4, 0, 2.4].map((z) => new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(-5.6, 0, z), 1.3, 0xffd24a, 0.32, 0.22));
  scene.add(sunlight, earth, ball, path, ...rays);

  let m = Math.PI;
  let pos: Vec3 = at(m);
  /** Standing on the Earth, on the side facing the Moon, looking at it. */
  const fromEarth = (q: Vec3): { pos: Vec3; look: Vec3 } => {
    const d = Math.hypot(q[0], q[1], q[2]);
    return { pos: [(q[0] / d) * 1.08, (q[1] / d) * 1.08 + 0.05, (q[2] / d) * 1.08], look: q };
  };
  const above = { pos: [-1, 10.6, 10.8] as Vec3, look: [-1, 0, 0.3] as Vec3 };

  return {
    update(step, p, t) {
      m = (step === 0 ? lerp(0.35, 1, ease(p)) : step === 1 ? 1 : step === 2 ? lerp(1, 2, p) : lerp(2, 3, p)) * Math.PI;
      pos = at(m);
      ball.position.set(...pos);
      ball.rotation.y = m; // the Moon always shows the Earth the same face
      earth.rotation.y = t * 0.9;
      const overview = step === 0;
      path.visible = overview;
      rays.forEach((r) => (r.visible = overview));
    },
    camera(step, _p, _t, s) {
      if (step === 0) return above;
      const view = fromEarth(pos);
      if (step > 1) return view;
      const k = ease(clamp(s / (TIMING.camera * 1.6))); // down from the overview to the Earth's surface
      return { pos: mix(above.pos, view.pos, k), look: mix(above.look, view.look, k) };
    },
    labels(step, p) {
      const over = (h: number): Vec3 => [pos[0], pos[1] + h, pos[2]];
      if (step === 0) return [{ at: [-4.9, 0.5, -1.2], text: 0, color: "#ffd24a" }, { at: [0, 1.45, 0], text: 1 }, { at: over(0.6), text: 2 }];
      if (step === 1) return p > 0.35 ? [{ at: over(0.42), text: 3, color: "#9ccbff" }, { at: over(-0.45), text: 7, dim: true }] : [];
      // name the phase while the Moon is close to it
      const turns = m / Math.PI; // 1 new · 1.5 first quarter · 2 full · 2.5 last quarter · 3 new
      const phase = [[1, 3], [1.5, 4], [2, 5], [2.5, 6], [3, 3]].find(([x]) => Math.abs(turns - x) < 0.13);
      return phase ? [{ at: over(0.42), text: phase[1], color: "#ffd24a" }] : [];
    },
    stage: { space: true },
  };
};
