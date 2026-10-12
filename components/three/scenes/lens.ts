// A converging lens: parallel light meets in the focal point; an object in front of the lens
// gets an upside-down image behind it, and the image grows as the object comes closer.
// labels: 0 converging lens, 1 focal point, 2 parallel light, 3 object, 4 image (upside down),
//         5 "the lens bends the light", 6 "closer object – larger image, further away"
import { clamp, ease, lerp, type SceneFactory, type Vec3 } from "../types";

const F = 1.6; // focal length
const H = 1; // height of the object
const HEIGHTS = [1.2, 0.6, 0, -0.6, -1.2];

export const lens: SceneFactory = ({ THREE: T, scene }) => {
  const glass = new T.Mesh(new T.SphereGeometry(1.75, 48, 32), new T.MeshPhysicalMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0, clearcoat: 1, depthWrite: false }));
  glass.scale.set(0.2, 1, 1);
  glass.renderOrder = 3;
  const rim = new T.Mesh(new T.TorusGeometry(1.75, 0.045, 10, 64), new T.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.8, roughness: 0.4 }));
  rim.rotation.y = Math.PI / 2;
  const axis = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-9, 0, 0), new T.Vector3(9, 0, 0)]), new T.LineDashedMaterial({ color: 0x8c8780, dashSize: 0.18, gapSize: 0.14, transparent: true, opacity: 0.7 }));
  axis.computeLineDistances();
  const focus = [-F, F].map((x) => {
    const m = new T.Mesh(new T.SphereGeometry(0.09, 16, 12), new T.MeshBasicMaterial({ color: 0xffd24a }));
    m.position.x = x;
    return m;
  });
  scene.add(glass, rim, axis, ...focus);

  // every ray is a line of three points: start – lens – end
  const ray = (color: number) => {
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(new Float32Array(9), 3));
    const l = new T.Line(g, new T.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
    scene.add(l);
    return l;
  };
  const set = (l: InstanceType<typeof T.Line>, pts: Vec3[]) => {
    const pos = l.geometry.getAttribute("position") as InstanceType<typeof T.BufferAttribute>;
    pts.forEach((q, i) => pos.setXYZ(i, q[0], q[1], q[2]));
    pos.needsUpdate = true;
  };
  const parallel = HEIGHTS.map(() => ray(0xffe08a));
  const principal = [ray(0xffe08a), ray(0x9ccbff), ray(0xffa98f)];
  const pulses = Array.from({ length: 10 }, () => {
    const m = new T.Mesh(new T.SphereGeometry(0.075, 10, 8), new T.MeshBasicMaterial({ color: 0xfff6c9 }));
    scene.add(m);
    return m;
  });
  const arrow = (color: number) => {
    const a = new T.ArrowHelper(new T.Vector3(0, 1, 0), new T.Vector3(), 1, color, 0.3, 0.24);
    scene.add(a);
    return a;
  };
  const object = arrow(0x7fe0a0);
  const image = arrow(0xff8f7a);
  const dir = new T.Vector3();
  const on = (o: { visible: boolean }, v: boolean) => (o.visible = v);
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
      parallel.forEach((l) => on(l, beams));
      principal.forEach((l) => on(l, !beams));
      on(object, !beams);
      on(image, !beams);
      const paths: Vec3[][] = [];
      if (beams) {
        HEIGHTS.forEach((y, i) => {
          const pts: Vec3[] = [[-4.6, y, 0], [0, y, 0], [4.6, y - (y * 4.6) / F, 0]]; // behind the lens every ray passes through (F, 0)
          set(parallel[i], pts);
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
        rays.forEach((pts, i) => set(principal[i], pts));
        paths.push(...rays);
        object.position.set(-g, 0, 0);
        object.setLength(H, 0.28, 0.22);
        image.position.set(b, 0, 0);
        image.setDirection(dir.set(0, -1, 0));
        image.setLength(Math.max(0.05, size), Math.min(0.28, size * 0.5), Math.min(0.22, size * 0.4));
      }
      // light travelling along the rays
      pulses.forEach((m, i) => {
        const pts = paths[i % paths.length];
        m.position.set(...along(pts, (t * 0.32 + i * 0.37) % 1));
      });
      (glass.material as InstanceType<typeof T.MeshPhysicalMaterial>).opacity = step === 1 ? 0.32 + 0.2 * Math.sin(Math.PI * clamp(p * 2)) : 0.32;
    },
    camera(step, p) {
      const wide = step === 3 ? ease(clamp(p * 1.25)) : 0;
      const cx = step <= 1 ? 0.2 : lerp(-0.5, 1.2, wide);
      return { pos: [cx + 0.9, 2, step <= 1 ? 11.5 : 15.5], look: [cx, -0.1, 0] };
    },
    labels(step, p) {
      if (step === 0) return [{ at: [0, 2.25, 0], text: 0, color: "#9fd8ff" }, { at: [-3, 1.7, 0], text: 2, color: "#ffe08a" }, { at: [F, -0.5, 0], text: 1, color: "#ffd24a" }];
      if (step === 1) return [{ at: [0, 2.25, 0], text: 5, color: "#9fd8ff" }, { at: [F, -0.5, 0], text: 1, color: "#ffd24a" }];
      if (step === 2) return [{ at: [-g, H + 0.55, 0], text: 3, color: "#7fe0a0" }, { at: [b, -size - 0.55, 0], text: 4, color: "#ff8f7a" }, { at: [F, 0.45, 0], text: 1, dim: true }];
      return [{ at: [-g, H + 0.55, 0], text: 3, color: "#7fe0a0" }, { at: [b, -size - 0.55, 0], text: 4, color: "#ff8f7a" }, ...(p > 0.7 ? [{ at: [0.6, 2.4, 0] as Vec3, text: 6, color: "#ffd24a" }] : [])];
    },
  };
};
