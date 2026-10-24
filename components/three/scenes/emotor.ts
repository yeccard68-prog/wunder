// A simple DC motor: a wire coil between the poles of a magnet, fed through a split ring (commutator).
// labels: 0 north pole, 1 south pole, 2 coil, 3 commutator, 4 battery, 5 force
// The magnetic field points from the north pole (left) to the south pole (right). Current in the two
// long sides of the coil runs along the axle, so the force on them points up or down. The commutator
// swaps the current every half turn: the side that is on the left is always pushed up, the one on the
// right down – the coil keeps turning the same way (clockwise, seen from the front).
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3 } from "../types";

const RAD = 1; // half the width of the coil
const LEN = 1.9; // length of the coil along the axle
const FRONT = LEN / 2 + 0.75; // where the commutator sits
const DEG = Math.PI / 180;

export const emotor: SceneFactory = ({ THREE: T, scene }) => {
  const steel = new T.MeshStandardMaterial({ color: 0xc3c6cc, metalness: 0.95, roughness: 0.28 });
  const copper = new T.MeshStandardMaterial({ color: 0xc8793a, metalness: 0.9, roughness: 0.3 });
  const iron = new T.MeshStandardMaterial({ color: 0x4a4d52, metalness: 0.8, roughness: 0.5 });
  const graphite = new T.MeshStandardMaterial({ color: 0x25262a, metalness: 0.3, roughness: 0.7 });
  const add = <M extends InstanceType<typeof T.Object3D>>(m: M, parent: InstanceType<typeof T.Object3D> = scene) => (parent.add(m), m);
  const box = (w: number, h: number, d: number, mat: InstanceType<typeof T.Material>, at: Vec3, parent?: InstanceType<typeof T.Object3D>) => {
    const m = add(new T.Mesh(new T.BoxGeometry(w, h, d), mat), parent);
    m.position.set(...at);
    return m;
  };
  const rod = (r: number, length: number, mat: InstanceType<typeof T.Material>, at: Vec3, axis: "x" | "y" | "z", parent?: InstanceType<typeof T.Object3D>) => {
    const m = add(new T.Mesh(new T.CylinderGeometry(r, r, length, 24), mat), parent);
    if (axis === "z") m.rotation.x = Math.PI / 2;
    if (axis === "x") m.rotation.z = Math.PI / 2;
    m.position.set(...at);
    return m;
  };

  // the base board everything stands on
  box(6.4, 0.16, 5.4, new T.MeshPhysicalMaterial({ color: 0x9a6a3e, roughness: 0.62, clearcoat: 0.3, clearcoatRoughness: 0.5 }), [0, -1.9, 0.9]);
  // horseshoe magnet, painted: red north pole on the left, green south pole on the right, bare steel at the pole faces
  const half = (side: number) => {
    // one half of the U, as a profile in x/y extruded along the axle, with rounded edges
    const sh = new T.Shape();
    const o = 2.7, i = 1.8, top = 0.9, bottom = -1.8, inner = -1.25, bend = 0.55;
    const x = (v: number) => side * v; // drawn mirrored for the left half (flipping the mesh would turn its faces inside out)
    sh.moveTo(0, bottom);
    sh.lineTo(x(o - bend), bottom);
    sh.quadraticCurveTo(x(o), bottom, x(o), bottom + bend);
    sh.lineTo(x(o), top);
    sh.lineTo(x(i), top);
    sh.lineTo(x(i), inner + 0.25);
    sh.quadraticCurveTo(x(i), inner, x(i - 0.25), inner);
    sh.lineTo(0, inner);
    sh.closePath();
    const g = new T.ExtrudeGeometry(sh, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3, curveSegments: 16 });
    g.translate(0, 0, -0.75);
    const paint = new T.MeshPhysicalMaterial({ color: side < 0 ? 0xc23b30 : 0x2f8a55, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15 });
    add(new T.Mesh(g, paint));
    // the pole face: bare, ground steel
    box(0.06, 1.6, 1.62, steel, [side * 1.73, 0.05, 0]);
  };
  half(-1);
  half(1);
  // bearing blocks holding the axle: a post with a round bearing at the top (the front one is slim, so it does not hide the commutator)
  const brass = new T.MeshPhysicalMaterial({ color: 0xc9a14a, metalness: 1, roughness: 0.25 });
  for (const [z, w] of [[-LEN / 2 - 0.55, 0.42], [FRONT + 0.6, 0.22]]) {
    box(w, 1.6, 0.16, iron, [0, -1.0, z]);
    box(w + 0.7, 0.12, 0.6, iron, [0, -1.76, z]);
    const ring = add(new T.Mesh(new T.TorusGeometry(0.16, 0.07, 12, 28), brass));
    ring.position.set(0, 0, z);
  }

  // the rotor: axle, coil (three turns of copper wire) and the two halves of the commutator
  const rotor = add(new T.Group());
  rod(0.09, LEN + 2.6, steel, [0, 0, 0.35], "z", rotor);
  // the coil: six turns of enamelled copper wire, wound as a rounded rectangle round the axle
  const enamel = new T.MeshPhysicalMaterial({ color: 0xb8662c, metalness: 0.85, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
  const turn = (off: number, y: number) => {
    const w = RAD + off, l = LEN / 2 + off, c = 0.18;
    const path = new T.CurvePath<InstanceType<typeof T.Vector3>>();
    const P = (x: number, z: number) => new T.Vector3(x, y, z);
    const corner = (cx: number, cz: number, a0: number) => new T.QuadraticBezierCurve3(P(cx + c * Math.cos(a0), cz + c * Math.sin(a0)), P(cx + c * (Math.cos(a0) + Math.cos(a0 + Math.PI / 2)), cz + c * (Math.sin(a0) + Math.sin(a0 + Math.PI / 2))), P(cx + c * Math.cos(a0 + Math.PI / 2), cz + c * Math.sin(a0 + Math.PI / 2)));
    path.add(new T.LineCurve3(P(-w, l), P(-w, -l + c)));
    path.add(corner(-w + c, -l + c, Math.PI));
    path.add(new T.LineCurve3(P(-w + c, -l), P(w - c, -l)));
    path.add(corner(w - c, -l + c, -Math.PI / 2));
    path.add(new T.LineCurve3(P(w, -l + c), P(w, l)));
    add(new T.Mesh(new T.TubeGeometry(path, 120, 0.032, 8, false), enamel), rotor);
  };
  for (let k = 0; k < 6; k++) turn((k % 2) * 0.05, -0.1 + Math.floor(k / 2) * 0.07 + (k % 2) * 0.035);
  // leads from the coil to the commutator halves
  for (const side of [-1, 1]) {
    rod(0.04, RAD - 0.2, copper, [side * (RAD + 0.2) * 0.5, 0, LEN / 2], "x", rotor);
    rod(0.04, FRONT - LEN / 2, copper, [side * 0.2, 0, (LEN / 2 + FRONT) / 2], "z", rotor);
    // one half of the split ring; the gap between the halves is what swaps the current
    const half = add(new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.5, 28, 1, false, side > 0 ? 0.12 : Math.PI + 0.12, Math.PI - 0.24), copper), rotor);
    half.rotation.x = Math.PI / 2;
    half.position.z = FRONT;
  }
  rod(0.24, 0.5, new T.MeshStandardMaterial({ color: 0x2b2a28, roughness: 0.8 }), [0, 0, FRONT], "z", rotor); // insulating core

  // brushes pressing on the ring, wires down to the battery
  for (const side of [-1, 1]) {
    box(0.34, 0.22, 0.3, graphite, [side * 0.5, 0, FRONT]);
    // brass holder around the carbon, and the spring that presses it onto the ring
    box(0.3, 0.3, 0.36, brass, [side * 1.0, 0, FRONT]);
    const coil = new T.CatmullRomCurve3(Array.from({ length: 49 }, (_, i) => new T.Vector3(side * (0.67 + (i / 48) * 0.17), Math.cos(i * 0.785) * 0.07, FRONT + Math.sin(i * 0.785) * 0.07)));
    add(new T.Mesh(new T.TubeGeometry(coil, 96, 0.012, 6, false), steel));
    rod(0.03, 1.55, copper, [side * 0.67, -0.85, FRONT], "y");
    rod(0.03, 0.3, copper, [side * 0.82, -1.62, FRONT], "x");
  }
  rod(0.3, 1.3, new T.MeshStandardMaterial({ color: 0x2f5fb8, metalness: 0.4, roughness: 0.4 }), [0, -1.62, FRONT], "x");
  rod(0.3, 0.32, new T.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.8, roughness: 0.3 }), [0.5, -1.62, FRONT], "x");
  rod(0.1, 0.14, steel, [0.72, -1.62, FRONT], "x");

  // field lines from north to south (thin, behind the coil) and the force arrows on the two sides
  for (const y of [-0.8, 0, 0.8]) {
    const line = add(new T.ArrowHelper(new T.Vector3(1, 0, 0), new T.Vector3(-1.75, y, -0.2), 3.5, 0x6f7b8c, 0.2, 0.12));
    (line.line.material as InstanceType<typeof T.LineBasicMaterial>).transparent = true;
  }
  const force = [0, 1].map(() => add(new T.ArrowHelper(new T.Vector3(0, 1, 0), new T.Vector3(), 1.1, 0xffd24a, 0.34, 0.24)));
  const dots = Array.from({ length: 10 }, () => add(new T.Mesh(new T.SphereGeometry(0.07, 10, 8), new T.MeshBasicMaterial({ color: 0xfff2a8 })), rotor));
  // path of the current through the coil (in the rotor's own frame): front left → back left → back right → front right
  const loop: Vec3[] = [[-0.2, 0, FRONT], [-0.2, 0, LEN / 2], [-RAD, 0, LEN / 2], [-RAD, 0, -LEN / 2], [RAD, 0, -LEN / 2], [RAD, 0, LEN / 2], [0.2, 0, LEN / 2], [0.2, 0, FRONT]];
  const lengths = loop.slice(1).map((q, i) => Math.hypot(q[0] - loop[i][0], q[2] - loop[i][2]));
  const total = lengths.reduce((a, b) => a + b, 0);
  const onLoop = (u: number): Vec3 => {
    let d = u * total;
    for (let i = 0; i < lengths.length; i++) {
      if (d <= lengths[i]) return mix(loop[i], loop[i + 1], d / lengths[i]);
      d -= lengths[i];
    }
    return loop[loop.length - 1];
  };
  const up = new T.Vector3();
  let phi = 0;
  let sides: Vec3[] = [[0, 0, 0], [0, 0, 0]];

  return {
    update(step, p, t) {
      // angle of the coil against the horizontal: resting, starting to turn, past the top (swap), running
      phi = (step === 0 ? 20 : step === 1 ? lerp(20, 78, ease(p)) : step === 2 ? lerp(78, 200, ease(p)) : 200 + t * 150) * DEG;
      rotor.rotation.z = -phi;
      const current = step > 0;
      sides = [-1, 1].map((s): Vec3 => [s * RAD * Math.cos(phi), -s * RAD * Math.sin(phi), 0]);
      force.forEach((arrow, i) => {
        const [x, y] = sides[i];
        arrow.visible = current;
        arrow.position.set(x, y, 0.2);
        arrow.setDirection(up.set(0, x < 0 ? 1 : -1, 0)); // left side up, right side down – always
        arrow.setLength(1.1, 0.34, 0.24);
      });
      // the current always enters through the brush on the same side: inside the turning coil it changes direction every half turn
      const flipped = Math.cos(phi) < 0;
      dots.forEach((d, i) => {
        d.visible = current;
        const u = (t * 0.5 + i / dots.length) % 1;
        d.position.set(...onLoop(flipped ? 1 - u : u));
      });
    },
    camera(step, _p, _t, s) {
      const wide = { pos: [3.6, 2.7, 9.6] as Vec3, look: [0, -0.35, 0.4] as Vec3 };
      const close = { pos: [2.6, 1.5, 7.2] as Vec3, look: [0, -0.45, 1.2] as Vec3 }; // towards the commutator
      const k = ease(clamp(s / TIMING.camera));
      const [from, to] = step === 2 ? [wide, close] : step === 3 ? [close, wide] : [wide, wide];
      return { pos: mix(from.pos, to.pos, k), look: mix(from.look, to.look, k) };
    },
    labels(step) {
      const left = sides[0][0] < sides[1][0] ? sides[0] : sides[1];
      const magnet = [{ at: [-2.25, 1.25, 0] as Vec3, text: 0, color: "#ff8f7a", dim: step > 1 }, { at: [2.25, 1.25, 0] as Vec3, text: 1, color: "#7fe0a0", dim: step > 1 }];
      if (step === 0) return [...magnet, { at: [0, 1.1, -0.6], text: 2, color: "#f0b27a" }, { at: [0, -2.25, FRONT], text: 4 }];
      if (step === 1) return [...magnet, { at: [left[0] - 0.2, left[1] + 1.55, 0.2], text: 5, color: "#ffd24a" }];
      if (step === 2) return [{ at: [0, 0.65, FRONT], text: 3, color: "#ffd24a" }];
      return [...magnet, { at: [0, 1.75, 0], text: 2, dim: true }];
    },
    stage: { shadows: true, floor: -1.82 },
  };
};
