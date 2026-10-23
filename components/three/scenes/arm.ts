// The arm: two bones, an elbow joint and two muscles that work against each other. A muscle can only pull –
// when the biceps contracts the forearm bends up, when the triceps contracts it straightens again.
// labels: 0 upper arm bone, 1 forearm, 2 elbow joint, 3 biceps, 4 triceps, 5 "contracts – the arm bends",
//         6 "contracts – the arm straightens", 7 "muscles can only pull – so they work in pairs"
// Simplified: one forearm bone instead of two (ulna and radius), muscles as smooth bellies. A contracting muscle
// keeps its volume, so it gets shorter and thicker.
import { clamp, ease, lerp, type SceneFactory, type Vec3 } from "../types";

const SHOULDER: Vec3 = [0, 3.2, 0];
const ELBOW: Vec3 = [0, 0, 0];
const FOREARM = 2.9;
const STRAIGHT = 0.12; // forearm angle when the arm hangs (radians from straight down, towards the front)
const BENT = 2.2; // forearm angle when the arm is bent

export const arm: SceneFactory = ({ THREE: T, scene }) => {
  const boneMat = new T.MeshStandardMaterial({ color: 0xe9e1cf, roughness: 0.6 });
  const jointMat = new T.MeshStandardMaterial({ color: 0xd8cdb4, roughness: 0.5 });
  const tendonMat = new T.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.4 });
  const bicepsMat = new T.MeshStandardMaterial({ color: 0xc8443c, roughness: 0.55 });
  const tricepsMat = new T.MeshStandardMaterial({ color: 0xb33a52, roughness: 0.55 });

  const upper = new T.Mesh(new T.CapsuleGeometry(0.2, 3.0, 8, 20), boneMat);
  upper.position.set(0, 1.6, 0);
  const joint = new T.Mesh(new T.SphereGeometry(0.34, 24, 16), jointMat);
  const shoulder = new T.Mesh(new T.SphereGeometry(0.42, 24, 16), jointMat);
  shoulder.position.set(...SHOULDER);
  // the forearm turns around the elbow (z axis)
  const fore = new T.Group();
  const foreBone = new T.Mesh(new T.CapsuleGeometry(0.17, FOREARM - 0.3, 8, 20), boneMat);
  foreBone.position.y = -FOREARM / 2;
  const hand = new T.Mesh(new T.SphereGeometry(0.32, 20, 14), new T.MeshStandardMaterial({ color: 0xd9b59a, roughness: 0.8 }));
  hand.scale.set(1, 1.3, 0.6);
  hand.position.y = -FOREARM - 0.25;
  fore.add(foreBone, hand);

  // a muscle belly between two points, plus thin tendons at both ends
  const muscle = (mat: InstanceType<typeof T.MeshStandardMaterial>) => {
    const belly = new T.Mesh(new T.SphereGeometry(1, 32, 20), mat);
    const t1 = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1, 8), tendonMat);
    const t2 = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1, 8), tendonMat);
    scene.add(belly, t1, t2);
    const up = new T.Vector3(0, 1, 0);
    const place = (obj: InstanceType<typeof T.Mesh>, a: InstanceType<typeof T.Vector3>, b: InstanceType<typeof T.Vector3>, length: number, width: number) => {
      obj.position.copy(a).add(b).multiplyScalar(0.5);
      obj.quaternion.setFromUnitVectors(up, b.clone().sub(a).normalize());
      obj.scale.set(width, length, width);
    };
    return (from: Vec3, to: Vec3, volume: number) => {
      const a = new T.Vector3(...from), b = new T.Vector3(...to);
      const total = a.distanceTo(b);
      const bellyLen = total * 0.62;
      const dir = b.clone().sub(a).normalize();
      const s = a.clone().add(dir.clone().multiplyScalar((total - bellyLen) / 2));
      const e = b.clone().sub(dir.clone().multiplyScalar((total - bellyLen) / 2));
      // same volume: shorter means thicker
      const width = Math.sqrt(volume / bellyLen);
      place(belly, s, e, bellyLen / 2, width);
      place(t1, a, s, a.distanceTo(s), 1);
      place(t2, e, b, e.distanceTo(b), 1);
    };
  };
  const biceps = muscle(bicepsMat);
  const triceps = muscle(tricepsMat);
  const pull = new T.ArrowHelper(new T.Vector3(0, 1, 0), new T.Vector3(), 1, 0xffd24a, 0.3, 0.22);
  scene.add(upper, joint, shoulder, fore, pull);

  let angle = STRAIGHT;
  /** A point on the forearm, `d` from the elbow along it and `side` in front of it (towards the bend). */
  const onFore = (d: number, side = 0): Vec3 => [ELBOW[0] + Math.sin(angle) * d + Math.cos(angle) * side, ELBOW[1] - Math.cos(angle) * d + Math.sin(angle) * side, 0];
  let active = -1; // 0 biceps pulls, 1 triceps pulls

  return {
    update(step, p, t) {
      if (step === 0) angle = STRAIGHT;
      else if (step === 1) angle = lerp(STRAIGHT, BENT, ease(clamp(p * 1.4)));
      else if (step === 2) angle = lerp(BENT, STRAIGHT, ease(clamp(p * 1.4)));
      else angle = lerp(STRAIGHT, BENT, 0.5 - 0.5 * Math.cos(t * 1.6)); // both in turn
      active = step === 1 ? 0 : step === 2 ? 1 : step === 3 ? (Math.sin(t * 1.6) > 0 ? 0 : 1) : -1;
      fore.rotation.z = angle;
      // biceps: front of the shoulder to just below the elbow on the inner side of the forearm
      biceps([0.32, 2.85, 0.05], onFore(0.55, 0.12), 0.32);
      // triceps: back of the upper arm to the tip of the elbow behind the joint
      triceps([-0.32, 2.75, 0], onFore(-0.32, -0.12), 0.3);
      bicepsMat.emissive.setHex(active === 0 ? 0x5a1410 : 0x000000);
      tricepsMat.emissive.setHex(active === 1 ? 0x5a1430 : 0x000000);
      pull.visible = active >= 0;
      if (active === 0) {
        const at = onFore(0.55, 0.12);
        pull.position.set(at[0] + 0.25, at[1], 0.3);
        pull.setDirection(new T.Vector3(0.32 - at[0], 2.85 - at[1], 0).normalize());
      } else if (active === 1) {
        const at = onFore(-0.32, -0.12);
        pull.position.set(at[0] - 0.25, at[1], 0.3);
        pull.setDirection(new T.Vector3(-0.32 - at[0], 2.75 - at[1], 0).normalize());
      }
      pull.setLength(1.1, 0.3, 0.22);
    },
    camera() {
      return { pos: [2.2, 1.9, 12.5], look: [0.5, 1.1, 0] }; // shoulder to hand in view, also when the arm is bent
    },
    labels(step) {
      const hand = onFore(FOREARM * 0.6);
      const base = [
        { at: [-0.75, 1.5, 0] as Vec3, text: 0, dim: step > 0 },
        { at: [hand[0] + 0.55, hand[1], 0] as Vec3, text: 1, dim: step > 0 },
        { at: [-0.6, -0.35, 0] as Vec3, text: 2, dim: step > 0 },
        { at: [1.05, 2.0, 0.3] as Vec3, text: 3, color: "#ff8f7a", dim: step === 2 },
        { at: [-1.2, 2.3, 0] as Vec3, text: 4, color: "#ff8fb0", dim: step === 1 },
      ];
      if (step === 1) return [...base, { at: [1.6, 3.4, 0] as Vec3, text: 5, color: "#ffd24a" }];
      if (step === 2) return [...base, { at: [-1.4, 3.4, 0] as Vec3, text: 6, color: "#ffd24a" }];
      if (step === 3) return [base[3], base[4], { at: [0.3, 3.9, 0] as Vec3, text: 7, color: "#ffd24a" }];
      return base;
    },
    stage: { shadows: true, floor: -3.6 },
  };
};
