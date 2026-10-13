// A converging lens on an optical bench: parallel light meets in the focal point; a candle in front
// of the lens gets an upside-down image behind it, and the image grows as the candle comes closer.
// labels: 0 converging lens, 1 focal point, 2 parallel light, 3 object, 4 image (upside down),
//         5 "the lens bends the light", 6 "closer object – larger image, further away"
import { clamp, ease, lerp, type SceneFactory, type Vec3 } from "../types";

const F = 1.6; // focal length
const H = 1; // height of the object
const HEIGHTS = [1.2, 0.6, 0, -0.6, -1.2];
const R = 1.75; // radius of the lens
const RAIL = -2.35; // top of the bench

export const lens: SceneFactory = ({ THREE: T, scene }) => {
  const metal = new T.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.85, roughness: 0.38 });
  const dark = new T.MeshStandardMaterial({ color: 0x1f2125, metalness: 0.6, roughness: 0.6 });

  // the lens: thick in the middle, thin at the rim – a turned profile, like a real biconvex lens.
  // Real glass: light passes through and is bent (index of refraction 1.5), the surface mirrors the room.
  const profile = [
    ...Array.from({ length: 25 }, (_, i) => new T.Vector2((i / 24) * R, 0.03 + 0.33 * (1 - (i / 24) ** 2))),
    ...Array.from({ length: 25 }, (_, i) => new T.Vector2((1 - i / 24) * R, -0.03 - 0.33 * (1 - (1 - i / 24) ** 2))),
  ];
  const glassMat = new T.MeshPhysicalMaterial({ color: 0xd9f1ff, roughness: 0.03, metalness: 0, transmission: 1, ior: 1.5, thickness: 0.6, attenuationColor: new T.Color(0x9fd8ff), attenuationDistance: 2.5, clearcoat: 1, envMapIntensity: 1.4 });
  const glass = new T.Mesh(new T.LatheGeometry(profile, 72), glassMat);
  glass.rotation.z = Math.PI / 2;
  const rim = new T.Mesh(new T.TorusGeometry(R + 0.03, 0.07, 14, 72), metal);
  rim.rotation.y = Math.PI / 2;
  // holder and bench
  const post = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, -RAIL - R, 16), metal);
  post.position.y = (RAIL - R) / 2;
  const foot = (x: number) => {
    const m = new T.Mesh(new T.BoxGeometry(0.5, 0.16, 0.7), metal);
    m.position.set(x, RAIL + 0.08, 0);
    return m;
  };
  const rail = new T.Mesh(new T.BoxGeometry(15, 0.14, 0.42), dark);
  rail.position.set(0.5, RAIL - 0.07, 0);
  const table = new T.Mesh(new T.BoxGeometry(40, 0.1, 14), new T.MeshStandardMaterial({ color: 0x17181b, roughness: 0.85, metalness: 0.1 }));
  table.position.set(0, RAIL - 0.2, 0);
  // marks on the rail, as on a real optical bench
  for (let x = -6.5; x <= 7.5; x += 0.5) {
    const tick = new T.Mesh(new T.BoxGeometry(0.02, 0.01, Number.isInteger(x) ? 0.2 : 0.11), new T.MeshBasicMaterial({ color: 0x9a968e }));
    tick.position.set(x, RAIL + 0.005, 0.1);
    scene.add(tick);
  }
  const axis = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-9, 0, 0), new T.Vector3(9, 0, 0)]), new T.LineDashedMaterial({ color: 0x8c8780, dashSize: 0.18, gapSize: 0.14 }));
  axis.computeLineDistances();
  const focus = [-F, F].map((x) => {
    const m = new T.Mesh(new T.SphereGeometry(0.09, 16, 12), new T.MeshBasicMaterial({ color: 0xffd24a }));
    m.position.x = x;
    return m;
  });
  scene.add(glass, rim, post, foot(0), rail, table, axis, ...focus);

  // a ray of light: a bright core inside a soft glow, in two straight pieces (before and after the lens)
  const UP = new T.Vector3(0, 1, 0);
  const core = new T.CylinderGeometry(0.02, 0.02, 1, 8, 1, true);
  const halo = new T.CylinderGeometry(0.07, 0.07, 1, 10, 1, true);
  const v = new T.Vector3();
  const ray = (color: number) => {
    const pieces = [0, 1].map(() => {
      const g = new T.Group();
      g.add(new T.Mesh(core, new T.MeshBasicMaterial({ color })), new T.Mesh(halo, new T.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false })));
      scene.add(g);
      return g;
    });
    return {
      set(pts: Vec3[]) {
        pieces.forEach((g, i) => {
          const [a, b] = [pts[i], pts[i + 1]];
          v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          const length = v.length();
          g.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
          g.scale.set(1, length, 1);
          g.quaternion.setFromUnitVectors(UP, v.normalize());
        });
      },
      show: (on: boolean) => pieces.forEach((g) => (g.visible = on)),
    };
  };
  const parallel = HEIGHTS.map(() => ray(0xffe08a));
  const principal = [ray(0xffe08a), ray(0x9ccbff), ray(0xffa98f)];
  const pulses = Array.from({ length: 10 }, () => {
    const m = new T.Mesh(new T.SphereGeometry(0.075, 10, 8), new T.MeshBasicMaterial({ color: 0xfff6c9 }));
    scene.add(m);
    return m;
  });

  // the object: a burning candle whose flame tip is exactly H above the axis
  const candle = new T.Group();
  const wax = new T.Mesh(new T.CylinderGeometry(0.11, 0.12, 0.72, 20), new T.MeshStandardMaterial({ color: 0xf3ead7, roughness: 0.55 }));
  wax.position.y = 0.36;
  const wick = new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.07, 6), new T.MeshBasicMaterial({ color: 0x2a2520 }));
  wick.position.y = 0.75;
  const flame = new T.Mesh(new T.SphereGeometry(0.075, 16, 12), new T.MeshBasicMaterial({ color: 0xffc247 }));
  flame.scale.set(1, 1.75, 1);
  flame.position.y = 0.87;
  const flameCore = new T.Mesh(new T.SphereGeometry(0.04, 12, 10), new T.MeshBasicMaterial({ color: 0xfff7d6 }));
  flameCore.scale.set(1, 1.5, 1);
  flameCore.position.y = 0.84;
  const candleLight = new T.PointLight(0xffb45a, 2.2, 5, 1.6);
  candleLight.position.y = 0.9;
  const stand = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, -RAIL, 12), metal);
  stand.position.y = RAIL / 2;
  const dish = new T.Mesh(new T.CylinderGeometry(0.2, 0.16, 0.05, 24), metal);
  const candleFoot = foot(0);
  candle.add(wax, wick, flame, flameCore, candleLight, stand, dish, candleFoot);
  // the image: what the light paints behind the lens – the same candle, upside down, made of light
  const image = new T.Group();
  const lightMat = (color: number, opacity: number) => new T.MeshBasicMaterial({ color, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false });
  const imageWax = new T.Mesh(wax.geometry, lightMat(0xffe6c4, 0.5));
  imageWax.position.y = 0.36;
  const imageFlame = new T.Mesh(flame.geometry, lightMat(0xffc247, 0.95));
  imageFlame.scale.set(1, 1.75, 1);
  imageFlame.position.y = 0.87;
  image.add(imageWax, imageFlame);
  scene.add(candle, image);

  let g = 4.6; // object distance
  let b = 2.45; // image distance
  let size = 0.53; // image height (pointing down)

  /** Point at fraction u of the polyline start → lens → end. */
  const along = (pts: Vec3[], u: number): Vec3 => {
    const first = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
    const second = Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1]);
    const d = u * (first + second);
    const [from, to, k] = d < first ? [pts[0], pts[1], d / first] : [pts[1], pts[2], (d - first) / second];
    return [lerp(from[0], to[0], k), lerp(from[1], to[1], k), 0];
  };

  return {
    update(step, p, t) {
      const beams = step <= 1;
      parallel.forEach((l) => l.show(beams));
      principal.forEach((l) => l.show(!beams));
      candle.visible = !beams;
      image.visible = !beams;
      const paths: Vec3[][] = [];
      if (beams) {
        HEIGHTS.forEach((y, i) => {
          const pts: Vec3[] = [[-4.6, y, 0], [0, y, 0], [4.6, y - (y * 4.6) / F, 0]]; // behind the lens every ray passes through (F, 0)
          parallel[i].set(pts);
          paths.push(pts);
        });
      } else {
        g = step === 2 ? 4.6 : lerp(4.6, 2.7, ease(clamp(p * 1.25)));
        b = (F * g) / (g - F); // lens equation: 1/f = 1/g + 1/b
        size = (H * b) / g;
        const tip: Vec3 = [-g, H, 0];
        const img: Vec3 = [b, -size, 0];
        const beyond = (from: Vec3, to: Vec3, x: number): Vec3 => [x, from[1] + ((to[1] - from[1]) * (x - from[0])) / (to[0] - from[0]), 0];
        const rays: Vec3[][] = [
          [tip, [0, H, 0], beyond([0, H, 0], img, b + 1.2)], // parallel to the axis → through the focal point
          [tip, [0, 0, 0], beyond([0, 0, 0], img, b + 1.2)], // through the centre: straight on
          [tip, [0, -size, 0], [b + 1.2, -size, 0]], // through the front focal point → parallel to the axis
        ];
        rays.forEach((pts, i) => principal[i].set(pts));
        paths.push(...rays);
        candle.position.x = -g;
        // the flame flickers a little; its tip stays where the rays start
        flame.scale.set(1 + 0.06 * Math.sin(t * 9), 1.75 + 0.12 * Math.sin(t * 13), 1);
        candleLight.intensity = 2.2 + 0.3 * Math.sin(t * 11);
        image.position.x = b;
        image.scale.set(size / H, -size / H, size / H); // upside down, and as large as the lens equation says
      }
      // light travelling along the rays
      pulses.forEach((m, i) => {
        const pts = paths[i % paths.length];
        m.position.set(...along(pts, (t * 0.32 + i * 0.37) % 1));
      });
      glassMat.attenuationDistance = step === 1 ? 2.5 - 1.5 * Math.sin(Math.PI * clamp(p * 2)) : 2.5; // the glass lights up while it is the subject
    },
    camera(step, p) {
      const wide = step === 3 ? ease(clamp(p * 1.25)) : 0;
      const cx = step <= 1 ? 0.2 : lerp(-0.5, 1.2, wide);
      return { pos: [cx + 2.2, 2.3, step <= 1 ? 11.5 : 15.5], look: [cx, -0.25, 0] };
    },
    labels(step, p) {
      if (step === 0) return [{ at: [0, 2.25, 0], text: 0, color: "#9fd8ff" }, { at: [-3, 1.7, 0], text: 2, color: "#ffe08a" }, { at: [F, -0.5, 0], text: 1, color: "#ffd24a" }];
      if (step === 1) return [{ at: [0, 2.25, 0], text: 5, color: "#9fd8ff" }, { at: [F, -0.5, 0], text: 1, color: "#ffd24a" }];
      if (step === 2) return [{ at: [-g, H + 0.55, 0], text: 3, color: "#7fe0a0" }, { at: [b, -size - 0.55, 0], text: 4, color: "#ff8f7a" }, { at: [F, 0.45, 0], text: 1, dim: true }];
      return [{ at: [-g, H + 0.55, 0], text: 3, color: "#7fe0a0" }, { at: [b, -size - 0.55, 0], text: 4, color: "#ff8f7a" }, ...(p > 0.7 ? [{ at: [0.6, 2.4, 0] as Vec3, text: 6, color: "#ffd24a" }] : [])];
    },
    stage: { shadows: true },
  };
};
