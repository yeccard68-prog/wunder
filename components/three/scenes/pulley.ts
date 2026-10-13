// Pulleys: a fixed pulley only turns the force around, a movable pulley halves it, a block and
// tackle with four carrying ropes quarters it – always paid for with more rope to pull.
// labels: 0 fixed pulley, 1 movable pulley, 2 load, 3 force, 4 same force – other direction,
//         5 two ropes carry: half the force, 6 twice the rope, 7 four ropes carry: a quarter of the force
// Idealised: ropes and pulleys weigh nothing and turn without friction.
import { TIMING } from "@/lib/animations";
import { clamp, ease, type SceneFactory, type Vec3 } from "../types";

const CEILING = 5;
const R = 0.45; // radius of a pulley

export const pulley: SceneFactory = ({ THREE: T, scene }) => {
  const steel = new T.MeshStandardMaterial({ color: 0xc3c6cc, metalness: 0.95, roughness: 0.3 });
  const iron = new T.MeshStandardMaterial({ color: 0x565a61, metalness: 0.8, roughness: 0.45 });
  const brass = new T.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.9, roughness: 0.32 });
  const ropeMat = new T.MeshStandardMaterial({ color: 0xd8c59a, roughness: 0.9 });
  const beam = new T.Mesh(new T.BoxGeometry(9, 0.3, 1.4), new T.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.8 }));
  beam.position.y = CEILING + 0.15;
  const wall = new T.Mesh(new T.BoxGeometry(14, 9, 0.2), new T.MeshStandardMaterial({ color: 0x1f2125, roughness: 0.9 }));
  wall.position.set(0, 2.6, -1.1);
  scene.add(beam, wall);

  const UP = new T.Vector3(0, 1, 0);
  const v = new T.Vector3();
  const unit = new T.CylinderGeometry(0.035, 0.035, 1, 8);
  type Group = InstanceType<typeof T.Group>;
  /** A straight piece of rope between two points that can be moved every frame. */
  const rope = (parent: Group) => {
    const m = new T.Mesh(unit, ropeMat);
    parent.add(m);
    return (a: Vec3, b: Vec3) => {
      v.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
      const length = v.length();
      m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
      m.scale.set(1, Math.max(0.001, length), 1);
      m.quaternion.setFromUnitVectors(UP, v.normalize());
    };
  };
  const wheel = (parent: Group) => {
    const g = new T.Group();
    const disc = new T.Mesh(new T.CylinderGeometry(R, R, 0.16, 36), brass);
    disc.rotation.x = Math.PI / 2;
    const hub = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.3, 16), steel);
    hub.rotation.x = Math.PI / 2;
    const spoke = new T.Mesh(new T.BoxGeometry(R * 1.7, 0.05, 0.18), iron); // makes the turning visible
    g.add(disc, hub, spoke);
    parent.add(g);
    return g;
  };
  const weight = (parent: Group) => {
    const g = new T.Group();
    const body = new T.Mesh(new T.CylinderGeometry(0.5, 0.55, 0.8, 28), iron);
    body.position.y = -0.55;
    const eye = new T.Mesh(new T.TorusGeometry(0.1, 0.03, 8, 20), steel);
    eye.position.y = -0.08;
    g.add(body, eye);
    parent.add(g);
    return g;
  };
  const bracket = (parent: Group, x: number, y: number) => {
    const m = new T.Mesh(new T.BoxGeometry(0.08, CEILING - y, 0.08), iron);
    m.position.set(x, (CEILING + y) / 2, 0);
    parent.add(m);
  };
  const rig = () => {
    const g = new T.Group();
    scene.add(g);
    return g;
  };

  // A – one fixed pulley
  const A = rig();
  const aWheel = wheel(A);
  aWheel.position.set(0, 4, 0);
  bracket(A, 0, 4);
  const aLoad = weight(A);
  const aRopes = [rope(A), rope(A)];
  // B – one movable pulley: the rope is tied to the beam, runs under the pulley and up to the hand
  const B = rig();
  const bWheel = wheel(B);
  const bLoad = weight(B);
  const bRopes = [rope(B), rope(B), rope(B)];
  // C – block and tackle: two pulleys above, two below, four pieces of rope carry the load
  const C = rig();
  const cTop = [-0.55, 0.55].map((x) => {
    const w = wheel(C);
    w.position.set(x, 4.1, 0);
    bracket(C, x, 4.1);
    return w;
  });
  const cLow = [wheel(C), wheel(C)];
  const cBar = new T.Mesh(new T.BoxGeometry(1.5, 0.1, 0.1), iron);
  C.add(cBar);
  const cLoad = weight(C);
  const cRopes = [rope(C), rope(C), rope(C), rope(C), rope(C), rope(C)];

  const pull = new T.ArrowHelper(new T.Vector3(0, -1, 0), new T.Vector3(), 1, 0xffd24a, 0.32, 0.24);
  scene.add(pull);
  let hand: Vec3 = [0, 0, 0];
  let loadAt: Vec3 = [0, 0, 0];

  return {
    update(step, p, t, s) {
      const kind = step === 0 ? 0 : step === 3 ? 2 : 1;
      A.visible = kind === 0;
      B.visible = kind === 1;
      C.visible = kind === 2;
      // the load goes up and down; in the third step it is lifted once, slowly, so the rope can be compared
      const h = step === 2 ? 0.9 * ease(clamp(p * 1.2)) : 0.45 * (1 - Math.cos(t * 1.1));
      const turn = h / R;
      if (kind === 0) {
        loadAt = [-R, 1.4 + h, 0];
        hand = [R, 2.6 - h, 0]; // as much rope out as the load rises
        aLoad.position.set(...loadAt);
        aWheel.rotation.z = -turn;
        aRopes[0](loadAt, [-R, 4, 0]);
        aRopes[1]([R, 4, 0], hand);
      } else if (kind === 1) {
        const y = 2 + h;
        loadAt = [0, y - R - 0.05, 0];
        hand = [R, 3.3 + 2 * h, 0]; // two ropes get shorter: the hand travels twice as far
        bWheel.position.set(0, y, 0);
        bWheel.rotation.z = turn;
        bLoad.position.set(...loadAt);
        bRopes[0]([-R, CEILING, 0], [-R, y, 0]);
        bRopes[1]([R, y, 0], hand);
        bRopes[2]([0, y, 0], [0, y - R, 0]);
      } else {
        const y = 1.9 + h * 0.5;
        loadAt = [0, y - R - 0.1, 0];
        hand = [1.9, 2.9 - 2 * h, 0]; // four ropes get shorter: four times the way (h is halved here to fit the picture)
        cLow.forEach((w, i) => {
          w.position.set(i ? 0.55 : -0.55, y, 0);
          w.rotation.z = (i ? 1 : -1) * turn;
        });
        cTop.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * turn));
        cBar.position.set(0, y, 0);
        cLoad.position.set(...loadAt);
        [-1, -0.1, 0.1, 1].forEach((x, i) => cRopes[i]([x, 4.1, 0], [x, y, 0]));
        cRopes[4]([1, 4.1, 0], [1.45, 4.55, 0]);
        cRopes[5]([1.45, 4.55, 0], hand);
      }
      // the force: full, half, a quarter
      const strength = [1, 0.5, 0.25][kind];
      const length = 0.4 + 1.3 * strength;
      const down = kind !== 1;
      pull.setDirection(v.set(0, down ? -1 : 1, 0));
      pull.position.set(hand[0], hand[1], 0);
      pull.setLength(length, 0.32, 0.24);
      pull.visible = step !== 2 || s > TIMING.appear;
    },
    camera(step) {
      return { pos: [step === 3 ? 1.6 : 0.9, 3.2, 12.6], look: [step === 3 ? 0.5 : 0.1, 2.9, 0] };
    },
    labels(step, p) {
      const load = { at: [loadAt[0] - 1.25, loadAt[1] - 0.6, 0] as Vec3, text: 2 };
      const up = step === 1 || step === 2;
      const force = { at: [hand[0] + 0.95, hand[1] + (up ? 0.7 : -0.7), 0] as Vec3, text: 3, color: "#ffd24a" };
      if (step === 0) return [{ at: [-1.45, 4.25, 0], text: 0 }, load, force, { at: [0, 0.2, 0], text: 4, color: "#ffd24a" }];
      if (step === 1) return [{ at: [-1.5, 2.3, 0], text: 1 }, load, force, { at: [0, 0.2, 0], text: 5, color: "#ffd24a" }];
      if (step === 2) return [load, ...(p > 0.5 ? [{ at: [hand[0] + 1.3, hand[1] - 0.5, 0] as Vec3, text: 6, color: "#ffd24a" }] : [force])];
      return [load, force, { at: [0, 0.15, 0], text: 7, color: "#ffd24a" }];
    },
    stage: { shadows: true },
  };
};
