// Why planets orbit: inertia plus gravity, and Kepler's laws on an elliptical orbit.
// labels: 0 sun, 1 planet, 2 motion, 3 gravity, 4 near the sun: fast, 5 far from the sun: slow,
//         6 inner orbit: short year, 7 outer orbit: long year, 8 without a force: straight ahead
import { TIMING } from "@/lib/animations";
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
  // stars: many faint ones, a few bright ones – always the same sky (deterministic)
  const sky = (count: number, size: number, opacity: number, seed: number) => {
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(Array.from({ length: count * 3 }, (_, i) => (rand(i, seed) - 0.5) * 150), 3));
    scene.add(new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size, sizeAttenuation: false, transparent: true, opacity })));
  };
  sky(1100, 1.2, 0.5, 3);
  sky(120, 2.4, 0.9, 7);

  /** A surface painted once on a canvas (256 × 128, wraps around the sphere). Drawn, not photographed. */
  const paint = (draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const c = canvas.getContext("2d");
    if (c) draw(c, 256, 128);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    return texture;
  };
  const blobs = (c: CanvasRenderingContext2D, w: number, h: number, n: number, seed: number, color: (i: number) => string, size: number) => {
    for (let i = 0; i < n; i++) {
      c.fillStyle = color(i);
      c.beginPath();
      c.ellipse(rand(i, seed) * w, (0.12 + 0.76 * rand(i, seed + 1)) * h, size * (0.4 + rand(i, seed + 2)), size * 0.6 * (0.4 + rand(i, seed + 3)), rand(i, seed + 4) * 3, 0, 6.2832);
      c.fill();
    }
  };
  // the sun: bright granulated surface, a few darker spots
  const sunTexture = paint((c, w, h) => {
    c.fillStyle = "#ffcf5a";
    c.fillRect(0, 0, w, h);
    blobs(c, w, h, 260, 11, (i) => (i % 3 ? "rgba(255,236,150,0.5)" : "rgba(255,150,40,0.45)"), 7);
    blobs(c, w, h, 5, 21, () => "rgba(150,70,10,0.55)", 4);
  });
  const sun = new T.Mesh(new T.SphereGeometry(0.6, 48, 32), new T.MeshBasicMaterial({ map: sunTexture }));
  // its glow: light that fades out smoothly, always facing the viewer
  const halo = paint((c, w, h) => {
    // falls off steeply: in linear light even 1 % shows on black, so a straight ramp would end in a visible edge
    const grad = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h / 2);
    grad.addColorStop(0, "rgba(255,225,150,1)");
    grad.addColorStop(0.14, "rgba(255,200,105,0.5)");
    grad.addColorStop(0.28, "rgba(255,170,75,0.2)");
    grad.addColorStop(0.42, "rgba(255,150,60,0.075)");
    grad.addColorStop(0.56, "rgba(255,140,52,0.026)");
    grad.addColorStop(0.7, "rgba(255,130,46,0.008)");
    grad.addColorStop(0.85, "rgba(255,125,42,0.0015)");
    grad.addColorStop(1, "rgba(255,120,40,0)");
    c.fillStyle = grad;
    c.fillRect(w / 2 - h / 2, 0, h, h);
  });
  const glow = new T.Sprite(new T.SpriteMaterial({ map: halo, blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
  const light = new T.PointLight(0xfff1d6, 0, 0, 0);
  const ball = (r: number, map: InstanceType<typeof T.CanvasTexture>, tilt: number) => {
    const m = new T.Mesh(new T.SphereGeometry(r, 40, 28), new T.MeshStandardMaterial({ map, roughness: 0.85, metalness: 0, emissive: new T.Color(0x1c2c44), emissiveIntensity: 0.9 })); // the night side stays faintly visible
    m.rotation.z = tilt; // the axis the planet spins around is tilted
    return m;
  };
  // a blue planet with land, clouds and ice caps; a cratered rocky one; a banded gas giant
  const planet = ball(0.24, paint((c, w, h) => {
    c.fillStyle = "#2f6fd0";
    c.fillRect(0, 0, w, h);
    blobs(c, w, h, 22, 31, (i) => (i % 2 ? "#4f9a4a" : "#8c8a4e"), 16);
    blobs(c, w, h, 40, 41, () => "rgba(255,255,255,0.5)", 9);
    c.fillStyle = "#f4f8ff";
    c.fillRect(0, 0, w, 9);
    c.fillRect(0, h - 9, w, 9);
  }), 0.41);
  const inner = ball(0.15, paint((c, w, h) => {
    c.fillStyle = "#b08f6c";
    c.fillRect(0, 0, w, h);
    blobs(c, w, h, 70, 51, (i) => (i % 2 ? "rgba(70,50,35,0.45)" : "rgba(225,200,170,0.35)"), 5);
  }), 0.05);
  const outer = ball(0.34, paint((c, w, h) => {
    const bands = ["#7fc8d9", "#a9dde6", "#6bb3c9", "#bfe6ec", "#72bdd0", "#9ad3df", "#63a9c0", "#aadce6"];
    bands.forEach((color, i) => {
      c.fillStyle = color;
      c.fillRect(0, (i * h) / bands.length, w, h / bands.length + 1);
    });
    blobs(c, w, h, 18, 61, () => "rgba(255,255,255,0.22)", 14);
  }), 0.3);
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
  // where the planet was a moment ago (fading dots), and where it would go without the sun's pull (dashed)
  const ghosts = Array.from({ length: 10 }, (_, k) => new T.Mesh(new T.SphereGeometry(0.1, 12, 8), new T.MeshBasicMaterial({ color: 0xcfe2ff, transparent: true, opacity: 0.8 * (1 - k / 10) })));
  const tangentGeo = new T.BufferGeometry();
  tangentGeo.setAttribute("position", new T.Float32BufferAttribute(new Float32Array(6), 3));
  const tangent = new T.Line(tangentGeo, new T.LineDashedMaterial({ color: 0xffd24a, dashSize: 0.18, gapSize: 0.14, transparent: true, opacity: 0.7 }));
  tangent.frustumCulled = false;
  scene.add(sun, glow, light, planet, inner, outer, ellipse, straight, innerPath, outerPath, motion, pull, tangent, ...ghosts);

  const dir = new T.Vector3();
  let pos: Vec3 = [0, 0, 0];
  let tip: Vec3 = [0, 0, 0];
  let innerPos: Vec3 = [0, 0, 0];
  let outerPos: Vec3 = [0, 0, 0];

  return {
    update(step, p, t, s) {
      const appear = step === 0 ? 0 : step === 1 ? ease(clamp(s / TIMING.appear)) : 1;
      sun.scale.setScalar(Math.max(0.001, appear));
      sun.rotation.y = t * 0.12;
      const flare = Math.max(0.001, appear * (1 + 0.04 * Math.sin(t * 2.2)));
      glow.scale.set(12 * flare, 6 * flare, 1); // the canvas is twice as wide as high
      planet.rotation.y = t * 1.6; // day and night: the planet spins while it orbits
      inner.rotation.y = t * 0.5;
      outer.rotation.y = t * 2.4;
      light.intensity = 3.2; // the planet is lit from where the sun is, also before the sun is shown
      straight.visible = step === 0;
      ellipse.visible = step >= 1;
      (ellipse.material as InstanceType<typeof T.LineBasicMaterial>).opacity = 0.85 * appear;
      const more = step === 3 ? ease(clamp(s / TIMING.camera)) : 0;
      for (const o of [inner, outer, innerPath, outerPath]) o.visible = more > 0;
      inner.scale.setScalar(Math.max(0.001, more));
      outer.scale.setScalar(Math.max(0.001, more));

      let velocity: Vec3;
      const trail = (k: number): Vec3 => {
        if (step === 0) return [lerp(-3.6, 5.5, Math.max(0, p - k * 0.035)), 0, 2.2];
        const turns = step === 1 ? p : step === 2 ? 1 + 1.5 * p : 2.5 + 1.25 * p;
        return onEllipse(Math.PI + turns * 2 * Math.PI - k * 0.16);
      };
      ghosts.forEach((g, k) => {
        g.position.set(...trail(k + 1));
        g.visible = step <= 2;
      });
      if (step === 0) {
        pos = [lerp(-3.6, 5.5, p), 0, 2.2]; // starts inside the picture
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
      // step 1: the straight line it would follow if the sun let go
      tangent.visible = step === 1;
      const along = dir.set(velocity[0], 0, velocity[2]).normalize();
      const tp = tangentGeo.attributes.position as InstanceType<typeof T.BufferAttribute>;
      tp.setXYZ(0, pos[0], 0, pos[2]);
      tp.setXYZ(1, pos[0] + along.x * 3.2, 0, pos[2] + along.z * 3.2);
      tp.needsUpdate = true;
      tangent.computeLineDistances();

      // Kepler's third law: the period grows with distance^1.5
      const w = (r: number) => (t * 1.9) / Math.pow(r, 1.5);
      innerPos = [INNER * Math.cos(w(INNER)), 0, INNER * Math.sin(w(INNER))];
      outerPos = [OUTER * Math.cos(w(OUTER) + 2), 0, OUTER * Math.sin(w(OUTER) + 2)];
      inner.position.set(...innerPos);
      outer.position.set(...outerPos);
    },
    camera(step, _p, _t, s) {
      const near = { pos: [CENTRE[0], 8.2, 9.6] as Vec3, look: [CENTRE[0], 0, 0.4] as Vec3 };
      const far = { pos: [-0.6, 13.5, 15.5] as Vec3, look: [-0.6, 0, 0.6] as Vec3 };
      const k = step === 3 ? ease(clamp(s / TIMING.camera)) : 0;
      return { pos: mix(near.pos, far.pos, k), look: mix(near.look, far.look, k) };
    },
    labels(step, p) {
      const above = (q: Vec3, h = 0.55): Vec3 => [q[0], q[1] + h, q[2]];
      if (step === 0) return [{ at: above(pos), text: 1 }, { at: [0, 0.2, 3.3], text: 8, color: "#ffd24a" }];
      if (step === 1) return [{ at: [0, 1.25, 0], text: 0, color: "#ffd76a" }, { at: above(pos), text: 1 }, { at: tip, text: 2, color: "#ffd24a" }, { at: [pos[0] * 0.55, 0.3, pos[2] * 0.55], text: 3, color: "#ff8f7a" }];
      if (step === 2) return [{ at: [A * (1 - E) + 0.2, 0.5, -1.2], text: 4, color: "#ffd24a" }, { at: [-A * (1 + E) + 0.3, 0.5, 1.3], text: 5 }];
      return p > 0.4 ? [{ at: above(innerPos, 0.45), text: 6, color: "#e2c39f" }, { at: above(outerPos, 0.6), text: 7, color: "#9fdcea" }] : [];
    },
    stage: { space: true },
  };
};
