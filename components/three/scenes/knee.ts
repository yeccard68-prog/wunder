// How the knee works: a real right knee (public/models/knee.glb, prepared from Z-Anatomy / BodyParts3D, CC BY-SA – see
// the credits page). The lower leg bends about the knee's axis; the menisci ride on the shin bone, the cruciate
// ligaments stretch between the bones, and the kneecap glides along the front of the thigh bone in the tendon of
// the four-headed thigh muscle.
// labels: 0 thigh bone, 1 shin bone, 2 kneecap, 3 menisci, 4 cruciate ligaments, 5 fibula, 6 "menisci even out and
//         carry load", 7 "cruciate ligaments secure the joint", 8 four-headed thigh muscle, 9 "longer lever arm: more force"
// Simplified: the knee bends about one fixed axis (in reality it rolls and glides a little), the kneecap follows a
// circle, and the tendon below the kneecap (patellar ligament) is drawn, not taken from the model.
// Model units: 1 = 1 cm, origin on the bending axis, front +z, up +y; the body's middle is +x.
import type * as THREE from "three";
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3 } from "../types";

const DEG = Math.PI / 180;
const KNEECAP_SHARE = 0.62; // the kneecap turns this share of the knee angle round the axis

export const knee: SceneFactory = async ({ THREE: T, scene, load }) => {
  const model = await load("knee.glb");
  const part = (name: string) => {
    const node = model.getObjectByName(name);
    const meshes: THREE.Mesh[] = [];
    node?.traverse((o) => (o as THREE.Mesh).isMesh && meshes.push(o as THREE.Mesh));
    if (!node || !meshes.length) throw new Error("knee.glb: missing " + name);
    return { node, meshes };
  };
  const bone = () => new T.MeshPhysicalMaterial({ color: 0xe6d8bd, roughness: 0.6, sheen: 0.3, sheenColor: new T.Color(0xfff4dc), transparent: true, opacity: 1 });
  const cartilage = () => new T.MeshPhysicalMaterial({ color: 0xcfe2e8, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.2, transparent: true, opacity: 1 });
  const femurMats = [bone(), cartilage()], patellaMats = [bone(), cartilage()];
  const dress = (meshes: THREE.Mesh[], mats: THREE.Material[]) => meshes.forEach((m, i) => (m.material = mats[Math.min(i, mats.length - 1)]));
  const femur = part("femur"), tibia = part("tibia"), fibula = part("fibula"), patella = part("patella"), menisci = part("menisci");
  const acl = part("acl"), pcl = part("pcl"), quad = part("quadriceps");
  dress(femur.meshes, femurMats);
  dress(tibia.meshes, [bone(), cartilage()]);
  dress(fibula.meshes, [bone(), cartilage()]);
  dress(patella.meshes, patellaMats);
  const meniscusMat = new T.MeshPhysicalMaterial({ color: 0xd9e9f0, roughness: 0.3, clearcoat: 0.9, emissive: new T.Color(0x000000) });
  dress(menisci.meshes, [meniscusMat]);
  const ligamentMat = new T.MeshPhysicalMaterial({ color: 0xf2ead8, roughness: 0.3, clearcoat: 0.6, sheen: 0.6, sheenColor: new T.Color(0xffffff), emissive: new T.Color(0x000000), side: T.DoubleSide });
  dress(acl.meshes, [ligamentMat]);
  dress(pcl.meshes, [ligamentMat]);
  const muscleMat = new T.MeshPhysicalMaterial({ color: 0xa7352e, roughness: 0.45, clearcoat: 0.4, sheen: 0.5, sheenColor: new T.Color(0xff9a86), transparent: true, opacity: 0, depthWrite: false });
  const tendonMat = new T.MeshPhysicalMaterial({ color: 0xeee4d0, roughness: 0.32, clearcoat: 0.6, transparent: true, opacity: 0, depthWrite: false });
  dress(quad.meshes, [muscleMat, tendonMat]);
  scene.add(model);

  // the lower leg: shin bone, fibula and the menisci on top of the shin bone turn together about the axis
  const leg = new T.Group();
  model.add(leg);
  for (const p of [tibia, fibula, menisci]) leg.attach(p.node);
  const cap = new T.Group();
  model.add(cap);
  cap.attach(patella.node);

  // soft parts that stretch between the bones: each point turns by a share of the angle – none at the top, all at the bottom
  const soft = (meshes: THREE.Mesh[], share: (y: number) => number, factor = 1) => {
    const all = meshes.map((m) => m.geometry.getAttribute("position") as THREE.BufferAttribute);
    const rest = all.map((a) => Float32Array.from(a.array as Float32Array));
    const q = new T.Quaternion(), v = new T.Vector3(), x = new T.Vector3(1, 0, 0);
    return (angle: number) =>
      meshes.forEach((m, k) => {
        const a = all[k], r = rest[k];
        for (let i = 0; i < a.count; i++) {
          v.set(r[i * 3], r[i * 3 + 1], r[i * 3 + 2]);
          const w = share(v.y);
          if (w > 0) v.applyQuaternion(q.setFromAxisAngle(x, angle * w * factor));
          a.setXYZ(i, v.x, v.y, v.z);
        }
        a.needsUpdate = true;
        m.geometry.computeVertexNormals();
        m.geometry.computeBoundingSphere();
      });
  };
  const span = (top: number, bottom: number) => (y: number) => ease(clamp((top - y) / (top - bottom)));
  const bendAcl = soft(acl.meshes, span(0.3, -2.3));
  const bendPcl = soft(pcl.meshes, span(-0.2, -3.6));
  const bendQuad = soft(quad.meshes, span(7, 0.5), KNEECAP_SHARE); // the end of the tendon goes with the kneecap

  // the tendon from the lower edge of the kneecap to the front of the shin bone (drawn)
  const capLow = new T.Vector3(-0.9, -2.6, 4.3), shinFront = new T.Vector3(-0.6, -6.2, 3.1);
  const tendon = new T.Mesh(new T.BufferGeometry(), new T.MeshPhysicalMaterial({ color: 0xeee4d0, roughness: 0.3, clearcoat: 0.6, sheen: 0.5 }));
  scene.add(tendon);
  const a = new T.Vector3(), b = new T.Vector3(), rx = new T.Quaternion(), X = new T.Vector3(1, 0, 0);
  let shownAngle = -1;
  const drawTendon = (angle: number) => {
    a.copy(capLow).applyQuaternion(rx.setFromAxisAngle(X, angle * KNEECAP_SHARE));
    b.copy(shinFront).applyQuaternion(rx.setFromAxisAngle(X, angle));
    tendon.geometry.dispose();
    tendon.geometry = new T.TubeGeometry(new T.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(new T.Vector3(0, 0, 0.35)), b), 16, 0.38, 10, false);
  };

  let angle = 0;
  return {
    update(step, _p, t, s) {
      // bending: still at first, then slowly bending and straightening again
      const target = step === 0 ? 8 * (0.5 - 0.5 * Math.cos(t * 0.8)) : step === 1 ? 5 : step === 2 ? 70 * (0.5 - 0.5 * Math.cos(t * 0.9)) : 95 * (0.5 - 0.5 * Math.cos(t * 0.8));
      angle = target * DEG;
      leg.rotation.x = angle;
      cap.rotation.x = angle * KNEECAP_SHARE;
      if (Math.abs(angle - shownAngle) > 0.002) {
        shownAngle = angle;
        bendAcl(angle);
        bendPcl(angle);
        bendQuad(angle);
        drawTendon(angle);
      }
      // to see inside, the thigh bone and the kneecap become see-through in steps 2 and 3
      const inside = step === 1 || step === 2 ? ease(clamp(s / 1.2)) : 0;
      for (const m of [...femurMats, ...patellaMats]) {
        (m as InstanceType<typeof T.MeshPhysicalMaterial>).opacity = 1 - 0.8 * inside;
        m.depthWrite = inside < 0.5;
      }
      // the muscle appears in the last step
      const muscle = step === 3 ? ease(clamp(s / TIMING.appear)) : 0;
      muscleMat.opacity = 0.55 * muscle; // see-through: kneecap and tendon stay visible
      tendonMat.opacity = muscle;
      quad.node.visible = muscle > 0.01;
      // what each step is about glows a little
      meniscusMat.emissive.setHex(step === 1 ? 0x1c3a48 : 0x000000);
      ligamentMat.emissive.setHex(step === 2 ? 0x3a3018 : 0x000000);
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [-17, 4, 15], look: [-0.5, -1.5, 0.5] }, // the knee from the outer side and the front
        { pos: [-5, 14, 11], look: [-0.3, -2.2, 0] }, // from above and in front onto the shin bone with the menisci
        { pos: [-3, 2, 15], look: [-0.2, -1.2, 0] }, // from the front, through the thigh bone onto the crossing ligaments
        { pos: [-34, 6, 6], look: [-0.5, 2, 1.5] }, // from the side, further back: thigh muscle, kneecap and the bending leg
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      const turn = (p: Vec3, share = 1): Vec3 => {
        const v = new T.Vector3(...p).applyQuaternion(rx.setFromAxisAngle(X, angle * share));
        return [v.x, v.y, v.z];
      };
      const thigh = { at: [-4.8, 7, 1] as Vec3, text: 0, dim: step > 0 };
      const shin = { at: turn([-4.6, -9, 2]), text: 1, dim: step > 0 };
      const kneecap = { at: turn([-3.2, 0.5, 5.6], KNEECAP_SHARE), text: 2, color: "#ffe2a8" };
      const meniscus = { at: turn([-4.2, -2.2, 1]), text: 3, color: "#a9dcf0" };
      const crossed = { at: [0.2, -1.2, 1.5] as Vec3, text: 4, color: "#fff2c8" };
      const fib = { at: turn([-5.8, -8, -1]), text: 5, dim: true };
      if (step === 0) return [thigh, shin, kneecap, fib];
      if (step === 1) return [meniscus, { at: turn([0, -5.5, 3.5]), text: 6, color: "#a9dcf0" }];
      if (step === 2) return [crossed, { at: [0, 3.2, 3] as Vec3, text: 7, color: "#ffd24a" }];
      return [kneecap, { at: [-5, 9, 3] as Vec3, text: 8, color: "#ff8f7a" }, { at: turn([-4, 4.5, 7], KNEECAP_SHARE), text: 9, color: "#ffd24a" }];
    },
    stage: { shadows: true },
  };
};
