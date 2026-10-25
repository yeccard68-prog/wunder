// How we form sounds: tongue, jaws and teeth, soft palate, larynx and pharynx of a real head (public/models/mouth.glb,
// prepared from Z-Anatomy / BodyParts3D, CC BY-SA – see the credits page), cut in half down the middle and seen from
// the side. The vocal folds (drawn – they are not in the model) vibrate and send sound rings up; for the vowels the
// tongue moves to the front (i), to the back (u) and the jaw opens (a); for t the tip of the tongue closes at the ridge
// behind the upper teeth, for k the back of the tongue closes at the soft palate – the air stops and then bursts out.
// labels: 0 vocal folds, 1 larynx, 2 tongue, 3 soft palate, 4 teeth, 5 "air flows freely: vowel", 6 i, 7 u, 8 a,
//         9 t, 10 k, 11 sound
// Simplified: the tongue only bulges where it matters for each sound; lips are not shown.
// Model units: 1 = 1 cm, the middle of the head at x = 0, the face towards +z, up +y.
import type * as THREE from "three";
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3 } from "../types";

type Shape = { at: number; width: number; lift: number; forward: number };
const REST: Shape = { at: 0.5, width: 0.3, lift: 0, forward: 0 };
// where the tongue bulges (0 = its root at the back, 1 = its tip) and how much
const SOUNDS: Record<string, Shape> = {
  i: { at: 0.68, width: 0.24, lift: 1.5, forward: 0.25 },
  u: { at: 0.28, width: 0.24, lift: 1.4, forward: -0.25 },
  a: { at: 0.5, width: 0.4, lift: -0.4, forward: 0 },
  t: { at: 0.95, width: 0.13, lift: 2.8, forward: 0.45 },
  k: { at: 0.22, width: 0.18, lift: 2.6, forward: 0 },
};

export const mouth: SceneFactory = async ({ THREE: T, scene, load }) => {
  const model = await load("mouth.glb");
  const part = (name: string) => {
    let found: THREE.Mesh | null = null;
    model.getObjectByName(name)?.traverse((o) => !found && (o as THREE.Mesh).isMesh && (found = o as THREE.Mesh));
    if (!found) throw new Error("mouth.glb: missing " + name);
    return found as THREE.Mesh;
  };
  // cut down the middle: the half towards the viewer (x > 0) is taken away
  const clip = { clippingPlanes: [new T.Plane(new T.Vector3(-1, 0, 0), 0)], clipShadows: true, side: T.DoubleSide };
  const mat = (color: number, extra: object = {}) => new T.MeshPhysicalMaterial({ color, roughness: 0.5, clearcoat: 0.4, ...clip, ...extra });
  const tongue = part("tongue"), jaw = part("jaw");
  tongue.material = mat(0xc9545a, { roughness: 0.4, clearcoat: 0.7, sheen: 0.6, sheenColor: new T.Color(0xffb0b0) });
  jaw.material = mat(0xeee6d6);
  part("upper").material = mat(0xeee6d6);
  part("palate").material = mat(0xd0707a, { clearcoat: 0.7 });
  part("larynx").material = mat(0xc9dde3, { roughness: 0.3 });
  part("pharynx").material = mat(0xd88a8a, { transparent: true, opacity: 0.35, depthWrite: false });
  scene.add(model);

  // the lower jaw (with the tongue on it) opens about the jaw joint
  const hinge = new T.Group();
  hinge.position.set(0, 4.0, -3.8);
  model.add(hinge);
  for (const m of [jaw, tongue]) hinge.attach(m);

  // the tongue bends: points near the bulge go up (and a little forwards), the underside stays
  const tp = tongue.geometry.getAttribute("position") as THREE.BufferAttribute;
  const rest = Float32Array.from(tp.array as Float32Array);
  tongue.geometry.computeBoundingBox();
  const tb = tongue.geometry.boundingBox!;
  // top and bottom of the tongue in 40 slices from back to tip: "how far up" is measured within each slice
  const BINS = 40;
  const binOf = (z: number) => Math.min(BINS - 1, Math.max(0, Math.floor(((z - tb.min.z) / (tb.max.z - tb.min.z)) * BINS)));
  const top = new Float32Array(BINS).fill(-Infinity), bottom = new Float32Array(BINS).fill(Infinity);
  for (let i = 0; i < tp.count; i++) {
    const b = binOf(rest[i * 3 + 2]);
    top[b] = Math.max(top[b], rest[i * 3 + 1]);
    bottom[b] = Math.min(bottom[b], rest[i * 3 + 1]);
  }
  let shownKey = "";
  const bend = (s: Shape) => {
    const key = [s.at, s.width, s.lift, s.forward].map((v) => v.toFixed(3)).join();
    if (key === shownKey) return;
    shownKey = key;
    for (let i = 0; i < tp.count; i++) {
      const x = rest[i * 3], y = rest[i * 3 + 1], z = rest[i * 3 + 2];
      const along = (z - tb.min.z) / (tb.max.z - tb.min.z); // 0 back … 1 tip
      const b = binOf(z);
      const up = Math.pow(clamp((y - bottom[b]) / Math.max(0.01, top[b] - bottom[b])), 1.5); // the top moves, the underside stays
      const w = Math.exp(-Math.pow((along - s.at) / s.width, 2)) * up;
      tp.setXYZ(i, x, y + s.lift * w, z + s.forward * w);
    }
    tp.needsUpdate = true;
    tongue.geometry.computeVertexNormals();
  };
  const blend = (a: Shape, b: Shape, k: number): Shape => ({ at: lerp(a.at, b.at, k), width: lerp(a.width, b.width, k), lift: lerp(a.lift, b.lift, k), forward: lerp(a.forward, b.forward, k) });

  // the vocal folds in the larynx (drawn), and the sound rings rising from them
  const LARYNX: Vec3 = [0, -5.0, -2.6];
  const folds = [-1, 1].map((side) => {
    const m = new T.Mesh(new T.CapsuleGeometry(0.12, 1.3, 6, 12), mat(0xe8b0b0, { side: T.FrontSide, clippingPlanes: [] }));
    m.rotation.x = Math.PI / 2;
    m.position.set(LARYNX[0] - 0.05 + side * 0.2, LARYNX[1], LARYNX[2]);
    scene.add(m);
    return { m, side };
  });
  const rings = Array.from({ length: 5 }, (_, i) => {
    const m = new T.Mesh(new T.TorusGeometry(0.6, 0.04, 8, 40), new T.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0 }));
    m.rotation.x = Math.PI / 2;
    m.userData.offset = i / 5;
    scene.add(m);
    return m;
  });
  // the way of the air: up the throat, forward over the tongue, out between the teeth
  const AIR = new T.CatmullRomCurve3([[-0.4, -5.2, -2.6], [-0.4, -2.2, -3.4], [-0.4, 0.6, -2.6], [-0.4, 1.0, 0.5], [-0.4, 0.4, 3.3], [-0.4, 0.2, 6.2]].map((p) => new T.Vector3(...(p as Vec3))));
  const puffs = Array.from({ length: 34 }, (_, i) => {
    const m = new T.Mesh(new T.SphereGeometry(0.11, 8, 6), new T.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.85 }));
    m.userData.offset = i / 34;
    scene.add(m);
    return m;
  });
  const CLOSE = { t: 0.82, k: 0.47 }; // where along the air path the tongue closes it

  let sound = "";
  let closed = false;
  return {
    update(step, _p, t, s) {
      // which sound, how far into it
      let shape = REST, open = 0.03;
      sound = "";
      closed = false;
      if (step === 1) {
        const k = (s % 7.5) / 2.5, idx = Math.floor(k), into = ease(clamp((k - idx) * 2));
        const order = ["i", "u", "a"];
        sound = order[idx];
        const prev = idx === 0 ? REST : SOUNDS[order[idx - 1]];
        shape = blend(prev, SOUNDS[sound], into);
        open = sound === "a" ? lerp(0.03, 0.2, into) : 0.03;
      } else if (step === 2 || step === 3) {
        sound = step === 2 ? "t" : "k";
        const cycle = (s % 2.4) / 2.4; // close, hold, release
        const hold = cycle < 0.55;
        closed = hold && cycle > 0.15;
        shape = blend(REST, SOUNDS[sound], hold ? ease(clamp(cycle / 0.15)) : 1 - ease(clamp((cycle - 0.55) / 0.2)));
      }
      bend(shape);
      hinge.rotation.x = open;
      // the vocal folds vibrate while there is voice
      const voice = step === 0 || step === 1;
      folds.forEach(({ m, side }) => (m.position.x = LARYNX[0] - 0.05 + side * (0.18 + (voice ? 0.08 * Math.abs(Math.sin(t * 40)) : 0.25))));
      rings.forEach((m) => {
        const u = ((m.userData.offset as number) + t * 0.35) % 1;
        (m.material as InstanceType<typeof T.MeshBasicMaterial>).opacity = voice ? (1 - u) * 0.8 : 0;
        m.position.copy(AIR.getPointAt(u * 0.6));
        m.scale.setScalar(0.6 + u * 1.6);
      });
      // the air: free for vowels; for t and k it piles up behind the closure and bursts out when it opens
      puffs.forEach((m) => {
        let u = ((m.userData.offset as number) + t * 0.22) % 1;
        const stop = sound === "t" || sound === "k" ? CLOSE[sound as "t" | "k"] : 2;
        if (closed && u > stop - 0.08 && u < stop + 0.25) u = stop - 0.06 * ((m.userData.offset as number) % 0.3) / 0.3;
        m.visible = step > 0 || u < 0.6;
        m.position.copy(AIR.getPointAt(u));
      });
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [20, -1, 4], look: [0, -2.4, -1] }, // the throat and the larynx
        { pos: [19, 2, 6], look: [0, 0.5, 0.5] }, // the mouth
        { pos: [17, 2, 9], look: [0, 0.8, 2] }, // the front of the mouth
        { pos: [17, 2, 3], look: [0, 0.8, -1.5] }, // the back of the mouth
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      const L = (y: number, z: number): Vec3 => [0.3, y, z];
      if (step === 0) return [{ at: L(-5.0, -0.9), text: 0, color: "#ffb3b3" }, { at: L(-6.4, -1.0), text: 1 }, { at: L(-2.5, -2.4), text: 11, color: "#ffd24a" }];
      const base = [{ at: L(-1.2, 0.5), text: 2, color: "#ff9a9a" }, { at: L(2.6, -2.6), text: 3, color: "#ffb0b8" }, { at: L(1.6, 4.9), text: 4 }];
      if (step === 1) return [...base, { at: L(4.2, 1.5), text: 5, color: "#8fe0ff" }, ...(sound ? [{ at: L(-3.0, 1.8), text: sound === "i" ? 6 : sound === "u" ? 7 : 8, color: "#ffd24a" }] : [])];
      if (step === 2) return [base[0], base[2], { at: L(2.9, 3.4), text: 9, color: "#ffd24a" }];
      return [base[0], base[1], { at: L(3.2, -1.2), text: 10, color: "#ffd24a" }];
    },
    stage: { shadows: true },
  };
};
