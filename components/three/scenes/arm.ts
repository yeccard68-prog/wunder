// The arm: real bones and muscles of a right arm (public/models/arm.glb, prepared from Z-Anatomy / BodyParts3D,
// CC BY-SA – see the credits page). The forearm with the hand turns around the elbow; biceps and triceps bend
// with it and get thicker while they contract. A muscle can only pull – when the biceps contracts the forearm
// bends up, when the triceps contracts it straightens again.
// labels: 0 upper arm bone, 1 forearm, 2 elbow joint, 3 biceps, 4 triceps, 5 "contracts – the arm bends",
//         6 "contracts – the arm straightens", 7 "muscles can only pull – so they work in pairs"
// Model units: 1 = 10 cm, the centre of the elbow joint at the origin, the front of the arm towards +x, seen from the outside (+z).
import type * as THREE from "three";
import { clamp, ease, lerp, type SceneFactory, type Vec3 } from "../types";

const STRAIGHT = 0; // the arm as it hangs in the model
const BENT = 2.05; // forearm angle when the arm is bent (radians)
// axis of the elbow joint, measured in the model between the two bumps at the lower end of the upper arm bone
const AXIS: Vec3 = [0.055, -0.033, 0.998];

/** Fine lengthwise grooves as a normal map – muscle fibres, tendon fibres. */
function fibres(T: typeof THREE, fine: number) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  if (!g) return null;
  const img = g.createImageData(size, size);
  for (let x = 0; x < size; x++) {
    // a few overlapping waves across the fibres, so the grooves look irregular
    const slope = 0.55 * Math.sin((x * fine * Math.PI * 2) / size) + 0.3 * Math.sin((x * fine * 2.7 * Math.PI * 2) / size + 1.3) + 0.15 * Math.sin((x * 31 * Math.PI * 2) / size);
    for (let y = 0; y < size; y++) {
      const i = (y * size + x) * 4;
      const n = slope * (0.8 + 0.2 * Math.sin((y * 3 * Math.PI * 2) / size + x));
      img.data[i] = 128 + n * 90;
      img.data[i + 1] = 128;
      img.data[i + 2] = 255;
      img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const tex = new T.CanvasTexture(c);
  tex.wrapS = tex.wrapT = T.RepeatWrapping;
  return tex;
}

export const arm: SceneFactory = async ({ THREE: T, scene, load }) => {
  const model = await load("arm.glb");
  const axis = new T.Vector3(...AXIS).normalize();
  const fibreMap = fibres(T, 24);
  const boneMat = new T.MeshPhysicalMaterial({ color: 0xe6d8bd, roughness: 0.62, sheen: 0.3, sheenColor: new T.Color(0xfff4dc), sheenRoughness: 0.6 });
  const cartilageMat = new T.MeshPhysicalMaterial({ color: 0xc9dde3, roughness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.25 });
  const muscleMat = (color: number) =>
    new T.MeshPhysicalMaterial({ color, roughness: 0.48, clearcoat: 0.45, clearcoatRoughness: 0.35, sheen: 0.7, sheenColor: new T.Color(0xff9a86), sheenRoughness: 0.45, normalMap: fibreMap, normalScale: new T.Vector2(0.45, 0.45) });
  const bicepsMat = muscleMat(0xa8352c);
  const tricepsMat = muscleMat(0x8e2c40);
  const tendonMat = new T.MeshPhysicalMaterial({ color: 0xeee5d3, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.6, sheenColor: new T.Color(0xffffff), normalMap: fibreMap, normalScale: new T.Vector2(0.25, 0.25) });

  // the model's parts by name; one part can hold several meshes (bone and cartilage, muscle and tendon)
  const part = (name: string) => {
    const node = model.getObjectByName(name);
    if (!node) throw new Error("arm.glb: missing " + name);
    const meshes: THREE.Mesh[] = [];
    node.traverse((o) => (o as THREE.Mesh).isMesh && meshes.push(o as THREE.Mesh));
    return { node, meshes };
  };
  const upper = part("upper");
  const fore = part("fore");
  const biceps = part("biceps");
  const triceps = part("triceps");
  const dress = (meshes: THREE.Mesh[], own: THREE.Material) =>
    meshes.forEach((m) => {
      const name = (m.material as THREE.Material).name;
      m.material = name === "cartilage" ? cartilageMat : name === "tendon" ? tendonMat : name === "bone" ? boneMat : own;
    });
  dress(upper.meshes, boneMat);
  dress(fore.meshes, boneMat);
  dress(biceps.meshes, bicepsMat);
  dress(triceps.meshes, tricepsMat);
  scene.add(model);

  // A muscle bends with the forearm: each point turns around the elbow by a share of the forearm's angle –
  // nothing at the shoulder end, fully where the tendon is fixed to the forearm. Contraction c (−1 … 1):
  // above 0 the belly bunches up towards the shoulder and gets thicker – most of all to the side it bulges to
  // (same volume, shorter muscle); below 0 it is stretched long and thin. The tendon below the belly takes up
  // the difference. Texture coordinates run along the muscle for the fibres.
  const muscle = (meshes: THREE.Mesh[], top: number, bottom: number, belly: [number, number]) => {
    const all = meshes.map((m) => m.geometry.getAttribute("position") as THREE.BufferAttribute);
    // centre line of the belly (x and z) – the belly swells away from it
    let cx = 0, cz = 0, n = 0;
    all.forEach((a) => {
      for (let i = 0; i < a.count; i++) if (a.getY(i) > belly[0] && a.getY(i) < belly[1]) (cx += a.getX(i)), (cz += a.getZ(i)), n++;
    });
    cx /= n || 1;
    cz /= n || 1;
    const rest = all.map((a) => Float32Array.from(a.array as Float32Array));
    meshes.forEach((m, k) => {
      const r = rest[k];
      const uv = new Float32Array((r.length / 3) * 2);
      for (let i = 0; i < r.length / 3; i++) {
        uv[i * 2] = (Math.atan2(r[i * 3 + 2] - cz, r[i * 3] - cx) / Math.PI) * 2.2;
        uv[i * 2 + 1] = r[i * 3 + 1] * 0.35;
      }
      m.geometry.setAttribute("uv", new T.BufferAttribute(uv, 2));
    });
    // where the tendon meets the forearm: the lowest points of the muscle
    let low = Infinity;
    rest.forEach((r) => {
      for (let i = 1; i < r.length; i += 3) low = Math.min(low, r[i]);
    });
    const ends: number[] = [];
    rest.forEach((r) => {
      for (let i = 0; i < r.length; i += 3) if (r[i + 1] < low + 0.15) ends.push(r[i], r[i + 1], r[i + 2]);
    });
    const insertion = new T.Vector3();
    for (let i = 0; i < ends.length; i += 3) insertion.add(new T.Vector3(ends[i], ends[i + 1], ends[i + 2]));
    insertion.divideScalar(ends.length / 3 || 1);
    let head = -Infinity;
    rest.forEach((r) => {
      for (let i = 1; i < r.length; i += 3) head = Math.max(head, r[i]);
    });
    const q = new T.Quaternion();
    const v = new T.Vector3();
    return {
      insertion,
      origin: new T.Vector3(cx, belly[1] + 0.4, cz),
      pose(angle: number, c: number, side: number) {
        const shift = 0.13 * c * (head - belly[0]); // how far the lower end of the belly moves up
        meshes.forEach((m, k) => {
          const a = all[k];
          const r = rest[k];
          for (let i = 0; i < a.count; i++) {
            const y = r[i * 3 + 1];
            const w = ease(clamp((top - y) / (top - bottom)));
            v.set(r[i * 3], y, r[i * 3 + 2]);
            if (y > belly[0] && y < belly[1]) {
              const bulge = Math.sin(((y - belly[0]) / (belly[1] - belly[0])) * Math.PI);
              const grow = c * (c > 0 ? 0.55 : 0.25) * bulge;
              const out = v.x - cx;
              v.x = cx + out * (1 + grow * (Math.sign(out) === side ? 1.5 : 0.7)) + side * grow * 0.12;
              v.z = cz + (v.z - cz) * (1 + grow * 0.75);
            }
            // shorten towards the shoulder: the belly moves up, the tendon below it stretches
            if (y >= belly[0]) v.y += (shift * (head - y)) / (head - belly[0]);
            else v.y += shift * clamp((y - low) / (belly[0] - low));
            if (w > 0) v.applyQuaternion(q.setFromAxisAngle(axis, angle * w));
            a.setXYZ(i, v.x, v.y, v.z);
          }
          a.needsUpdate = true;
          m.geometry.computeVertexNormals();
          m.geometry.computeBoundingSphere();
        });
      },
    };
  };
  const bi = muscle(biceps.meshes, 0.75, -0.3, [0.55, 2.55]);
  const tri = muscle(triceps.meshes, 0.55, -0.15, [0.45, 2.35]);
  const pull = new T.ArrowHelper(new T.Vector3(0, 1, 0), new T.Vector3(), 1, 0xffd24a, 0.32, 0.24);
  scene.add(pull);

  let angle = STRAIGHT;
  const turn = new T.Quaternion();
  const at = new T.Vector3();
  /** A point of the forearm (given as it hangs) where it is now. */
  const onFore = (p: Vec3): Vec3 => {
    at.set(...p).applyQuaternion(turn);
    return [at.x, at.y, at.z];
  };
  let active = -1; // 0 biceps pulls, 1 triceps pulls

  return {
    update(step, p, t) {
      if (step === 0) angle = STRAIGHT;
      else if (step === 1) angle = lerp(STRAIGHT, BENT, ease(clamp(p * 1.4)));
      else if (step === 2) angle = lerp(BENT, STRAIGHT, ease(clamp(p * 1.4)));
      else angle = lerp(STRAIGHT, BENT, 0.5 - 0.5 * Math.cos(t * 1.4)); // both in turn
      const moving = step === 1 ? 1 : step === 2 ? -1 : step === 3 ? Math.sin(t * 1.4) : 0;
      active = moving > 0.05 ? 0 : moving < -0.05 ? 1 : -1;
      turn.setFromAxisAngle(axis, angle);
      fore.node.quaternion.copy(turn);
      const bent = (angle - STRAIGHT) / (BENT - STRAIGHT);
      // the biceps is short and thick when the arm is bent and long and thin when it is straight – the triceps the other way round
      bi.pose(angle, lerp(-0.6, 1, bent), 1);
      tri.pose(angle, lerp(0.85, -0.6, bent), -1);
      bicepsMat.emissive.setHex(active === 0 ? 0x5c1a0e : 0x000000);
      tricepsMat.emissive.setHex(active === 1 ? 0x5c1424 : 0x000000);
      pull.visible = active >= 0;
      if (active >= 0) {
        const m = active === 0 ? bi : tri;
        const end = new T.Vector3(...onFore([m.insertion.x, m.insertion.y, m.insertion.z]));
        const dir = m.origin.clone().sub(end).normalize();
        pull.position.copy(end).add(new T.Vector3(active === 0 ? 0.35 : -0.7, 0, 0.6));
        pull.setDirection(dir);
      }
      pull.setLength(1.3, 0.32, 0.24);
    },
    camera() {
      // follows the hand: the whole hanging arm, or the bent arm from shoulder to fingertips
      const bent = (angle - STRAIGHT) / (BENT - STRAIGHT);
      return { pos: [lerp(0.6, 2.2, bent), lerp(-0.2, 1.6, bent), lerp(12.5, 11.2, bent)], look: [lerp(0.3, 1.5, bent), lerp(-0.45, 1.1, bent), 0] };
    },
    labels(step) {
      const hand = onFore([0.35, -2.2, 0.2]);
      const bent = angle > 1;
      const base = [
        { at: [-0.35, 2.95, 0.5] as Vec3, text: 0, dim: step > 0 },
        { at: [hand[0] + (bent ? 0 : 0.85), hand[1] - (bent ? 0.55 : 0), hand[2]] as Vec3, text: 1, dim: step > 0 },
        { at: [-0.45, -0.55, 0.5] as Vec3, text: 2, dim: step > 0 },
        { at: [1.0, 1.9, 0.4] as Vec3, text: 3, color: "#ff8f7a", dim: step === 2 },
        { at: [-0.8, 1.6, 0.6] as Vec3, text: 4, color: "#ff8fb0", dim: step === 1 },
      ];
      if (step === 1) return [...base, { at: [2.3, 2.9, 0] as Vec3, text: 5, color: "#ffd24a" }];
      if (step === 2) return [...base, { at: [2.3, 2.9, 0] as Vec3, text: 6, color: "#ffd24a" }];
      if (step === 3) return [base[3], base[4], { at: [2.3, 2.9, 0] as Vec3, text: 7, color: "#ffd24a" }];
      return base;
    },
    stage: { shadows: true },
  };
};
