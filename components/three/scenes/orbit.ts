// Why planets orbit: inertia plus gravity, and Kepler's laws on an elliptical orbit.
// labels: 0 sun, 1 planet, 2 motion, 3 gravity, 4 near the sun: fast, 5 far from the sun: slow,
//         6 inner orbit: short year, 7 outer orbit: long year, 8 without a force: straight ahead
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const A = 3.2; // semi-major axis
const E = 0.45; // eccentricity – exaggerated so the change of speed is visible (Earth: 0.017)
const B = A * Math.sqrt(1 - E * E);
const CENTRE: Vec3 = [-A * E, 0, 0]; // the sun sits in one focus, at the origin
const INNER = 1.25;
const OUTER = 6.3;

/** Position on the ellipse for a mean anomaly M (Kepler's equation, solved by iteration). */
function onEllipse(M: number): Vec3 {
  let x = M;
  for (let i = 0; i < 8; i++) x = M + E * Math.sin(x);
  return [A * (Math.cos(x) - E), 0, B * Math.sin(x)];
}

export const orbit: SceneFactory = ({ THREE: T, scene }) => {
  const stars = new T.BufferGeometry();
  stars.setAttribute("position", new T.Float32BufferAttribute(Array.from({ length: 900 }, (_, i) => (rand(i, 3) - 0.5) * 140), 3));
  scene.add(new T.Points(stars, new T.PointsMaterial({ color: 0xffffff, size: 0.22, transparent: true, opacity: 0.7 })));

  const sun = new T.Mesh(new T.SphereGeometry(0.6, 40, 28), new T.MeshBasicMaterial({ color: 0xffd76a }));
  const glow = new T.Mesh(new T.SphereGeometry(1.05, 32, 20), new T.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.22, depthWrite: false }));
  const light = new T.PointLight(0xfff1d6, 0, 0, 0);
  const ball = (r: number, color: number) => new T.Mesh(new T.SphereGeometry(r, 32, 22), new T.MeshStandardMaterial({ color, roughness: 0.75 }));
  const planet = ball(0.24, 0x4f8fe8);
  const inner = ball(0.15, 0xc9a37a);
  const outer = ball(0.34, 0x7fc8d9);
  const ring = (points: Vec3[], closed: boolean) => {
    const g = new T.BufferGeometry().setFromPoints(points.map((q) => new T.Vector3(...q)));
    const m = new T.LineBasicMaterial({ color: 0xcfc8bb, transparent: true, opacity: 0.85 });
    return closed ? new T.LineLoop(g, m) : new T.Line(g, m);
  };
  const circle = (r: number) => ring(Array.from({ length: 120 }, (_, i) => [r * Math.cos((i / 120) * 6.2832), 0, r * Math.sin((i / 120) * 6.2832)] as Vec3), true);
  const ellipse = ring(Array.from({ length: 160 }, (_, i) => onEllipse((i / 160) * 6.2832)), true);
  const straight = ring([[-9, 0, 2.2], [9, 0, 2.2]], false);
  const innerPath = circle(INNER);
  const outerPath = circle(OUTER);
  const motion = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1, 0xffd24a, 0.32, 0.22);
  const pull = new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(), 1, 0xff6b5a, 0.32, 0.22);
  scene.add(sun, glow, light, planet, inner, outer, ellipse, straight, innerPath, outerPath, motion, pull);

  const dir = new T.Vector3();
  let pos: Vec3 = [0, 0, 0];
  let tip: Vec3 = [0, 0, 0];
  let innerPos: Vec3 = [0, 0, 0];
  let outerPos: Vec3 = [0, 0, 0];

  return {
    update(step, p, t) {
      const appear = step === 0 ? 0 : step === 1 ? ease(clamp(p * 4)) : 1;
      sun.scale.setScalar(Math.max(0.001, appear));
      glow.scale.setScalar(Math.max(0.001, appear * (1 + 0.04 * Math.sin(t * 2.2))));
      light.intensity = 3.2 * appear;
      straight.visible = step === 0;
      ellipse.visible = step >= 1;
      (ellipse.material as InstanceType<typeof T.LineBasicMaterial>).opacity = 0.85 * appear;
      const more = step === 3 ? ease(clamp(p * 2.5)) : 0;
      for (const o of [inner, outer, innerPath, outerPath]) o.visible = more > 0;
      inner.scale.setScalar(Math.max(0.001, more));
      outer.scale.setScalar(Math.max(0.001, more));

      let velocity: Vec3;
      if (step === 0) {
        pos = [lerp(-5.5, 5.5, p), 0, 2.2];
        velocity = [1, 0, 0];
      } else {
        // starts at the far point of the orbit and keeps going from step to step
        const turns = step === 1 ? p : step === 2 ? 1 + 1.5 * p : 2.5 + 1.25 * p;
        const M = Math.PI + turns * 2 * Math.PI;
        pos = onEllipse(M);
        const ahead = onEllipse(M + 0.01);
        velocity = [(ahead[0] - pos[0]) / 0.01, 0, (ahead[2] - pos[2]) / 0.01];
      }
      planet.position.set(...pos);
      const speed = Math.hypot(velocity[0], velocity[2]);
      const len = step === 0 ? 1.3 : clamp(speed / 3.2, 0.35, 2.4);
      motion.position.set(...pos);
      motion.setDirection(dir.set(velocity[0], 0, velocity[2]).normalize());
      motion.setLength(len, 0.3, 0.2);
      tip = [pos[0] + dir.x * (len + 0.35), 0.25, pos[2] + dir.z * (len + 0.35)];
      motion.visible = step <= 2;
      const d = Math.hypot(pos[0], pos[2]);
      pull.visible = step === 1 || step === 2;
      pull.position.set(...pos);
      pull.setDirection(dir.set(-pos[0], 0, -pos[2]).normalize());
      pull.setLength(clamp(9 / (d * d), 0.55, 2.2) * appear + 0.001, 0.3, 0.2); // stronger when closer

      // Kepler's third law: the period grows with distance^1.5
      const w = (r: number) => (t * 1.9) / Math.pow(r, 1.5);
      innerPos = [INNER * Math.cos(w(INNER)), 0, INNER * Math.sin(w(INNER))];
      outerPos = [OUTER * Math.cos(w(OUTER) + 2), 0, OUTER * Math.sin(w(OUTER) + 2)];
      inner.position.set(...innerPos);
      outer.position.set(...outerPos);
    },
    camera(step, p) {
      const near = { pos: [CENTRE[0], 8.2, 9.6] as Vec3, look: [CENTRE[0], 0, 0.4] as Vec3 };
      const far = { pos: [-0.6, 13.5, 15.5] as Vec3, look: [-0.6, 0, 0.6] as Vec3 };
      const k = step === 3 ? ease(clamp(p * 2.5)) : 0;
      return { pos: mix(near.pos, far.pos, k), look: mix(near.look, far.look, k) };
    },
    labels(step, p) {
      const above = (q: Vec3, h = 0.55): Vec3 => [q[0], q[1] + h, q[2]];
      if (step === 0) return [{ at: above(pos), text: 1 }, { at: [0, 0.2, 3.3], text: 8, color: "#ffd24a" }];
      if (step === 1) return [{ at: [0, 1.25, 0], text: 0, color: "#ffd76a" }, { at: above(pos), text: 1 }, { at: tip, text: 2, color: "#ffd24a" }, { at: [pos[0] * 0.55, 0.3, pos[2] * 0.55], text: 3, color: "#ff8f7a" }];
      if (step === 2) return [{ at: [A * (1 - E) + 0.2, 0.5, -1.2], text: 4, color: "#ffd24a" }, { at: [-A * (1 + E) + 0.3, 0.5, 1.3], text: 5 }];
      return p > 0.4 ? [{ at: above(innerPos, 0.45), text: 6, color: "#e2c39f" }, { at: above(outerPos, 0.6), text: 7, color: "#9fdcea" }] : [];
    },
  };
};
