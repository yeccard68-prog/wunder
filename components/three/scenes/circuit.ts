// An electric circuit: open and closed, then two lamps in series and in parallel.
// labels: 0 battery, 1 switch, 2 lamp, 3 open: no current, 4 closed: electrons flow,
//         5 in series: both dimmer, 6 in parallel: both bright
// The moving dots stand for electrons drifting from the negative to the positive terminal; real
// electrons creep along at fractions of a millimetre per second. Brightness is shown relative to one lamp.
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3 } from "../types";

const X = 3;
const Y = 1.6;
const RUNG = 1.1; // x of the second branch in the parallel circuit

export const circuit: SceneFactory = ({ THREE: T, scene }) => {
  const copper = new T.MeshStandardMaterial({ color: 0xc8793a, metalness: 0.9, roughness: 0.3 });
  const steel = new T.MeshStandardMaterial({ color: 0xc3c6cc, metalness: 0.95, roughness: 0.3 });
  const dark = new T.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.7 });
  const board = new T.Mesh(new T.BoxGeometry(8.6, 5.2, 0.2), new T.MeshStandardMaterial({ color: 0x1d2a22, roughness: 0.85 }));
  board.position.z = -0.25;
  scene.add(board);
  const wire = (a: Vec3, b: Vec3) => {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const m = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, length, 10), copper);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0);
    m.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
    scene.add(m);
    return m;
  };
  // the outer loop, with gaps for battery (bottom) and switch (left)
  wire([-X, -Y, 0], [-0.9, -Y, 0]);
  wire([0.9, -Y, 0], [X, -Y, 0]);
  wire([X, -Y, 0], [X, Y, 0]);
  wire([X, Y, 0], [-X, Y, 0]);
  wire([-X, Y, 0], [-X, 0.45, 0]);
  wire([-X, -0.45, 0], [-X, -Y, 0]);
  const rung = wire([RUNG, -Y, 0], [RUNG, Y, 0]); // second branch, only in the parallel circuit

  // battery: negative end on the left, positive (with the cap) on the right
  const cell = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 1.5, 28), new T.MeshStandardMaterial({ color: 0x2f5fb8, metalness: 0.4, roughness: 0.4 }));
  cell.rotation.z = Math.PI / 2;
  cell.position.set(-0.12, -Y, 0);
  const plus = new T.Mesh(new T.CylinderGeometry(0.34, 0.34, 0.3, 28), new T.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.8, roughness: 0.3 }));
  plus.rotation.z = Math.PI / 2;
  plus.position.set(0.75, -Y, 0);
  const cap = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.12, 16), steel);
  cap.rotation.z = Math.PI / 2;
  cap.position.set(0.95, -Y, 0);
  // switch: a lever that closes the gap
  const lever = new T.Group();
  const arm = new T.Mesh(new T.BoxGeometry(0.1, 0.95, 0.1), steel);
  arm.position.y = 0.47;
  lever.add(arm);
  lever.position.set(-X, -0.45, 0.05);
  const posts = [-0.45, 0.45].map((y) => {
    const m = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.16, 16), dark);
    m.rotation.x = Math.PI / 2;
    m.position.set(-X, y, 0.05);
    return m;
  });
  scene.add(cell, plus, cap, lever, ...posts);

  const lamp = () => {
    const g = new T.Group();
    const socket = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.34, 20), steel);
    socket.rotation.x = Math.PI / 2;
    const glassMat = new T.MeshStandardMaterial({ color: 0xfff3d0, transparent: true, opacity: 0.4, roughness: 0.05, emissive: new T.Color(0xffc94a), emissiveIntensity: 0, depthWrite: false });
    const glass = new T.Mesh(new T.SphereGeometry(0.42, 28, 20), glassMat);
    glass.position.z = 0.45;
    glass.renderOrder = 4;
    const light = new T.PointLight(0xffc56a, 0, 5, 1.5);
    light.position.z = 0.6;
    g.add(socket, glass, light);
    scene.add(g);
    return { g, glassMat, light };
  };
  const lamps = [lamp(), lamp()];
  const dots = Array.from({ length: 30 }, () => {
    const m = new T.Mesh(new T.SphereGeometry(0.075, 10, 8), new T.MeshBasicMaterial({ color: 0xfff2a8 }));
    scene.add(m);
    return m;
  });
  // the electrons leave the negative end (left), go round and return to the positive end
  const outer: Vec3[] = [[-0.9, -Y, 0.12], [-X, -Y, 0.12], [-X, Y, 0.12], [X, Y, 0.12], [X, -Y, 0.12], [0.9, -Y, 0.12]];
  const inner: Vec3[] = [[-0.9, -Y, 0.12], [-X, -Y, 0.12], [-X, Y, 0.12], [RUNG, Y, 0.12], [RUNG, -Y, 0.12], [0.9, -Y, 0.12]];
  const along = (path: Vec3[], u: number): Vec3 => {
    const lengths = path.slice(1).map((q, i) => Math.hypot(q[0] - path[i][0], q[1] - path[i][1]));
    let d = u * lengths.reduce((a, b) => a + b, 0);
    for (let i = 0; i < lengths.length; i++) {
      if (d <= lengths[i]) return mix(path[i], path[i + 1], d / lengths[i]);
      d -= lengths[i];
    }
    return path[path.length - 1];
  };
  let place: Vec3[] = [[0, Y, 0], [0, Y, 0]];

  return {
    update(step, p, t, s) {
      const k = ease(clamp(s / TIMING.camera));
      const closed = step === 0 ? 0 : step === 1 ? ease(clamp(s / TIMING.appear)) : 1;
      lever.rotation.z = lerp(-0.6, 0, closed); // open: the lever stands away from the upper contact
      const on = closed > 0.98;
      // where the lamps sit: one in the middle → two next to each other (series) → one in each branch (parallel)
      const single: Vec3[] = [[0, Y, 0], [0, Y, 0]];
      const series: Vec3[] = [[-1.4, Y, 0], [1, Y, 0]];
      const parallel: Vec3[] = [[RUNG, 0, 0], [X, 0, 0]];
      place = step <= 1 ? single : step === 2 ? single.map((a, i) => mix(a, series[i], k)) : series.map((a, i) => mix(a, parallel[i], k));
      lamps.forEach(({ g }, i) => g.position.set(...place[i]));
      lamps[1].g.visible = step >= 2;
      lamps[1].g.scale.setScalar(step === 2 ? Math.max(0.001, k) : 1);
      rung.visible = step === 3;
      rung.scale.y = step === 3 ? Math.max(0.001, k) : 1;
      // brightness relative to a single lamp: in series the two share the voltage and glow weakly, in parallel each gets all of it
      const bright = !on ? 0 : step === 1 ? 1 : step === 2 ? lerp(1, 0.3, k) : lerp(0.3, 1, k);
      lamps.forEach(({ glassMat, light }, i) => {
        const b = i === 1 && step < 2 ? 0 : bright;
        glassMat.emissiveIntensity = 2.6 * b;
        glassMat.opacity = lerp(0.4, 0.9, b);
        light.intensity = 7 * b;
      });
      // current: half as strong through two lamps in series; in parallel both branches carry current
      const speed = step === 2 ? 0.07 : 0.14;
      dots.forEach((m, i) => {
        const second = step === 3 && i % 2 === 1;
        m.visible = on && (step === 3 || i % 2 === 0);
        m.position.set(...along(second ? inner : outer, (t * speed + i / dots.length) % 1));
      });
    },
    camera() {
      return { pos: [2.1, -2.6, 13.2], look: [0.55, 0, 0] }; // room for the second lamp on the right
    },
    labels(step) {
      const parts = [{ at: [0, -Y - 0.75, 0] as Vec3, text: 0, dim: step > 0 }, { at: [-X - 1, 0, 0] as Vec3, text: 1, dim: step > 1 }];
      const lampLabel = { at: [place[0][0], place[0][1] + 0.95, 0.4] as Vec3, text: 2, dim: step > 0 };
      if (step === 0) return [...parts, lampLabel, { at: [0, 0, 0], text: 3, color: "#9ccbff" }];
      if (step === 1) return [...parts, { at: [0, 0, 0], text: 4, color: "#ffd24a" }];
      if (step === 2) return [{ at: [-0.2, 0, 0], text: 5, color: "#ffd24a" }];
      return [{ at: [-1, 0, 0], text: 6, color: "#ffd24a" }];
    },
    stage: { shadows: true },
  };
};
