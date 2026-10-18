// The lever: a long arm on the side of the hand means less force – and a longer way.
// labels: 0 pivot, 1 load, 2 force, 3 load arm, 4 force arm, 5 "4 × as long – ¼ of the force",
//         6 "4 × the distance"
// Law of the lever: force × force arm = load × load arm. The weight of the beam itself is left out.
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, type SceneFactory, type Vec3 } from "../types";

const TOP = 1.1; // height of the pivot edge
const LOAD_X = -3.4;
const SWING = 0.085; // how far the beam tilts (radians)

export const lever: SceneFactory = ({ THREE: T, scene }) => {
  const wood = new T.MeshStandardMaterial({ color: 0xb98a55, roughness: 0.7, metalness: 0 });
  const iron = new T.MeshStandardMaterial({ color: 0x565a61, metalness: 0.8, roughness: 0.45 });
  const steel = new T.MeshStandardMaterial({ color: 0xc3c6cc, metalness: 0.95, roughness: 0.3 });
  const ground = new T.Mesh(new T.BoxGeometry(30, 0.2, 12), new T.MeshStandardMaterial({ color: 0x1d1e21, roughness: 0.9 }));
  ground.position.y = -0.1;
  // pivot: a steel wedge
  const triangle = new T.Shape();
  triangle.moveTo(-0.55, 0);
  triangle.lineTo(0.55, 0);
  triangle.lineTo(0, TOP);
  triangle.closePath();
  const wedge = new T.Mesh(new T.ExtrudeGeometry(triangle, { depth: 1.1, bevelEnabled: false }), steel);
  wedge.position.z = -0.55;
  // everything that tilts hangs in this group, whose origin is the pivot edge
  const tilt = new T.Group();
  tilt.position.y = TOP;
  const beam = new T.Mesh(new T.BoxGeometry(8, 0.16, 0.7), wood);
  beam.position.y = 0.08;
  // marks every unit of length along the beam
  const marks = new T.Group();
  for (let x = -4; x <= 4; x += 0.5) {
    const tick = new T.Mesh(new T.BoxGeometry(0.02, 0.005, Number.isInteger(x) ? 0.3 : 0.16), new T.MeshBasicMaterial({ color: 0x4a3620 }));
    tick.position.set(x, 0.163, 0.15);
    marks.add(tick);
  }
  // the load: a stack of four iron weights; in the second step an equal stack on the other side
  const stack = () => {
    const g = new T.Group();
    for (let i = 0; i < 4; i++) {
      const w = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.24, 32), iron);
      w.position.y = 0.16 + 0.12 + i * 0.25;
      g.add(w);
    }
    const knob = new T.Mesh(new T.SphereGeometry(0.09, 16, 12), steel);
    knob.position.y = 0.16 + 4 * 0.25 + 0.06;
    g.add(knob);
    return g;
  };
  const load = stack();
  const counter = stack();
  tilt.add(beam, marks, load, counter);
  const push = new T.ArrowHelper(new T.Vector3(0, -1, 0), new T.Vector3(), 1, 0xffd24a, 0.34, 0.26);
  scene.add(ground, wedge, tilt, push);

  let pivot = 0; // x of the pivot
  let handX = 3.4; // where the force acts
  let angle = 0;
  let strength = 1; // 1 = as much as the load
  /** A point on top of the beam (x along the beam), in the world. */
  const onBeam = (x: number, up = 0.16): Vec3 => {
    const dx = x - pivot;
    return [pivot + dx * Math.cos(angle) - up * Math.sin(angle), TOP + dx * Math.sin(angle) + up * Math.cos(angle), 0];
  };

  return {
    update(step, p, t, s) {
      const k = step === 2 ? ease(clamp(s / (TIMING.camera * 1.8))) : step === 3 ? 1 : 0;
      pivot = lerp(0, -2.4, k);
      handX = lerp(3.4, 1.6, k); // force arm 4, load arm 1 once the pivot has moved
      strength = lerp(1, 0.25, k);
      // steps 1 and 2: a gentle rocking in balance; step 3 rests level; step 4: the hand pushes down, the load rises
      angle = step <= 1 ? SWING * 0.45 * Math.sin(t * 1.3) : step === 2 ? 0 : lerp(SWING, -SWING, ease(clamp(p * 1.2)));
      wedge.position.x = pivot;
      tilt.position.x = pivot;
      tilt.rotation.z = angle;
      for (const part of [beam, marks]) part.position.x = -pivot;
      load.position.x = LOAD_X - pivot;
      counter.position.x = 3.4 - pivot;
      counter.visible = step === 1; // equal arms need an equal weight
      push.visible = step >= 2 || step === 0;
      const length = 0.45 + 1.35 * strength;
      const tip = onBeam(handX);
      push.position.set(tip[0], tip[1] + length + 0.08, 0);
      push.setLength(length, 0.34, 0.26);
    },
    camera(step) {
      return { pos: [1.9, 4.6, step === 3 ? 13.6 : 14.4], look: [0.35, 0.75, 0] }; // both ends of the bar in view
    },
    labels(step, p) {
      const pivotLabel = { at: [pivot, 0.28, 0.9] as Vec3, text: 0, dim: step > 1 };
      const loadLabel = { at: onBeam(LOAD_X, 1.65), text: 1 };
      const hand = onBeam(handX);
      const forceLabel = { at: [hand[0], hand[1] + 0.95 + 1.35 * strength, 0] as Vec3, text: 2, color: "#ffd24a" };
      if (step === 0) return [pivotLabel, loadLabel, forceLabel];
      if (step === 1) return [pivotLabel, { at: [(LOAD_X + pivot) / 2, TOP - 0.45, 0.5], text: 3, color: "#ff8f7a" }, { at: [(3.4 + pivot) / 2, TOP - 0.45, 0.5], text: 4, color: "#7fe0a0" }];
      if (step === 2) return [pivotLabel, { at: [(LOAD_X + pivot) / 2 - 0.2, TOP - 0.5, 0.5], text: 3, color: "#ff8f7a" }, { at: [(handX + pivot) / 2, TOP - 0.5, 0.5], text: 4, color: "#7fe0a0" }, ...(p > 0.5 ? [{ at: [hand[0], hand[1] + 1.6, 0] as Vec3, text: 5, color: "#ffd24a" }] : [])];
      return [loadLabel, forceLabel, ...(p > 0.55 ? [{ at: [hand[0] + 0.9, hand[1] - 0.75, 0] as Vec3, text: 6, color: "#ffd24a" }] : [])];
    },
    stage: { shadows: true },
  };
};
