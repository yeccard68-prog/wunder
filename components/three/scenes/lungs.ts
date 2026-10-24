// Breathing: real lungs, diaphragm, windpipe with bronchi, ribs and heart (public/models/lungs.glb, prepared from
// Z-Anatomy / BodyParts3D, CC BY-SA – see the credits page). The diaphragm contracts and flattens, the lungs
// expand downwards with it and air streams in through the windpipe and bronchi; breathing out runs the other way.
// The last step looks through a magnifier at air sacs (drawn, not from the model) where oxygen passes into the
// blood and carbon dioxide out of it.
// labels: 0 lungs, 1 diaphragm, 2 windpipe, 3 bronchi, 4 ribs, 5 "diaphragm contracts – flattens", 6 "air flows in",
//         7 "diaphragm relaxes", 8 air sacs, 9 "oxygen into the blood", 10 "carbon dioxide into the air", 11 "air flows out"
// Simplified: the movement of the diaphragm and the lungs is exaggerated so it can be seen, the ribs barely move.
// Model units: 1 = 8.3 cm, the centre of the lungs at the origin, the front of the body towards +z.
import type * as THREE from "three";
import { TIMING } from "@/lib/animations";
import { clamp, ease, mix, rand, type SceneFactory, type Vec3 } from "../types";
import bronchi from "./lungs-paths.json";

const DROP = 0.5; // how far the top of the diaphragm moves down when it contracts fully
const MAGNIFIER: Vec3 = [3.1, -0.2, 0]; // centre of the close-up of the air sacs (step 4)

type Lines = Record<string, Vec3[][]>;
const B = bronchi as unknown as Lines;
const TOP = B["Trachea top"][0][0];
const CARINA: Vec3 = B["Left main bronchus"][0][0]; // where the windpipe divides
// the airway from the windpipe to the end of each lobar bronchus
const LEFT = B["Left main bronchus"][0];
const RIGHT_MAIN = [...B["Right main bronchus"][0]].reverse();
const BRANCHES: Vec3[][] = [
  [...LEFT, ...B["Left superior lobar bronchus"][0].slice(1)],
  [...LEFT, B["Left superior lobar bronchus"][1][0], ...B["Left superior lobar bronchus"][1].slice(1)],
  [...LEFT, ...B["Left inferior lobar bronchus"][0].slice(1)],
  [...RIGHT_MAIN, ...B["Right superior lobar bronchus"][0].slice(1)],
  [...RIGHT_MAIN, ...[...B["Intermediate bronchus.r"][0]].reverse().slice(1), ...B["Middle lobar bronchus.r"][0].slice(1)],
  [...RIGHT_MAIN, ...[...B["Intermediate bronchus.r"][0]].reverse().slice(1), ...[...B["Right inferior lobar bronchus"][0]].reverse().slice(1)],
];

export const lungs: SceneFactory = async ({ THREE: T, scene, load }) => {
  const model = await load("lungs.glb");
  const V = (p: Vec3) => new T.Vector3(...p);
  const part = (name: string) => {
    const node = model.getObjectByName(name);
    const meshes: THREE.Mesh[] = [];
    node?.traverse((o) => (o as THREE.Mesh).isMesh && meshes.push(o as THREE.Mesh));
    if (!node || !meshes.length) throw new Error("lungs.glb: missing " + name);
    return { node, meshes };
  };
  const lungMat = new T.MeshPhysicalMaterial({ color: 0xe7a0a2, roughness: 0.62, sheen: 0.8, sheenColor: new T.Color(0xffd6d6), sheenRoughness: 0.5, transparent: true, opacity: 0.5, depthWrite: false, side: T.DoubleSide });
  const muscleMat = new T.MeshPhysicalMaterial({ color: 0xa7352e, roughness: 0.45, clearcoat: 0.45, clearcoatRoughness: 0.35, sheen: 0.6, sheenColor: new T.Color(0xff9a86), side: T.DoubleSide, emissive: new T.Color(0x000000) });
  const tendonMat = new T.MeshPhysicalMaterial({ color: 0xeee4d0, roughness: 0.32, clearcoat: 0.6, sheen: 0.5, side: T.DoubleSide });
  // the front of the rib cage is cut away, so the lungs and the airway inside can be seen
  const open = { clippingPlanes: [new T.Plane(new T.Vector3(0, 0, -1), 0.3)], clipShadows: true, side: T.DoubleSide };
  const boneMat = new T.MeshPhysicalMaterial({ color: 0xe6d8bd, roughness: 0.6, sheen: 0.3, sheenColor: new T.Color(0xfff4dc), ...open });
  const cartilageMat = new T.MeshPhysicalMaterial({ color: 0xc9dde3, roughness: 0.3, clearcoat: 0.6, ...open });
  const airwayMat = new T.MeshPhysicalMaterial({ color: 0xf0d6c8, roughness: 0.35, clearcoat: 0.5, sheen: 0.5 });
  const heartMat = new T.MeshPhysicalMaterial({ color: 0x9c3b33, roughness: 0.5, clearcoat: 0.4, transparent: true, opacity: 0.3, depthWrite: false }); // see-through: the bronchi lie behind it
  const dress = (meshes: THREE.Mesh[], first: THREE.Material, second: THREE.Material) => meshes.forEach((m, i) => (m.material = i === 0 ? first : second));

  const lung = part("lungs");
  dress(lung.meshes, lungMat, lungMat);
  const diaphragm = part("diaphragm");
  dress(diaphragm.meshes, muscleMat, tendonMat);
  const ribs = part("ribs");
  dress(ribs.meshes, boneMat, cartilageMat);
  dress(part("airway").meshes, airwayMat, airwayMat);
  const heart = part("heart");
  dress(heart.meshes, heartMat, heartMat);
  scene.add(model);

  // A soft part that moves with the diaphragm: each point keeps its place at rest and is moved by `move` (its share of the drop).
  const soft = (meshes: THREE.Mesh[], move: (x: number, y: number, z: number, c: number, out: InstanceType<typeof T.Vector3>) => void) => {
    const all = meshes.map((m) => m.geometry.getAttribute("position") as THREE.BufferAttribute);
    const rest = all.map((a) => Float32Array.from(a.array as Float32Array));
    const v = new T.Vector3();
    return (c: number) =>
      meshes.forEach((m, k) => {
        const a = all[k], r = rest[k];
        for (let i = 0; i < a.count; i++) {
          move(r[i * 3], r[i * 3 + 1], r[i * 3 + 2], c, v);
          a.setXYZ(i, v.x, v.y, v.z);
        }
        a.needsUpdate = true;
        m.geometry.computeVertexNormals();
        m.geometry.computeBoundingSphere();
      });
  };
  // the dome flattens: its top goes down most, the edges where it is fixed to the ribs stay
  const DOME_TOP = -0.44, DOME_EDGE = -1.95;
  const flatten = soft(diaphragm.meshes, (x, y, z, c, out) => out.set(x, y - DROP * c * ease(clamp((y - DOME_EDGE) / (DOME_TOP - DOME_EDGE))), z));
  // the lungs follow downwards (their tips stay) and widen a little
  const APEX = 1.58, BASE = -1.59;
  const expand = soft(lung.meshes, (x, y, z, c, out) => {
    const w = clamp((APEX - y) / (APEX - BASE));
    out.set(x * (1 + 0.05 * c * w), y - DROP * c * w * w, z * (1 + 0.05 * c * w) + 0.04 * c * w);
  });

  // ---------- the air: little bubbles along the windpipe and the bronchi into the lungs ----------
  const routes = BRANCHES.map((pts, b) => {
    const end = V(pts[pts.length - 1]);
    const out = end.clone().sub(V(CARINA)).normalize();
    return { b, pts: [TOP, ...pts.filter((p, i) => i === 0 || p !== pts[i - 1])], end, out };
  });
  const AIR = 150;
  const airGeo = new T.SphereGeometry(0.035, 8, 6);
  const airMat = new T.MeshStandardMaterial({ color: 0xbfe9ff, emissive: new T.Color(0x6fc9ff), emissiveIntensity: 0.6, roughness: 0.2 });
  const air = Array.from({ length: AIR }, (_, i) => {
    const r = routes[i % routes.length];
    // each bubble ends somewhere in its lobe, beyond the end of the bronchus
    const target = r.end.clone().addScaledVector(r.out, 0.1 + 0.35 * rand(i, 1)).add(new T.Vector3(rand(i, 2) - 0.5, rand(i, 3) - 0.5, rand(i, 4) - 0.5).multiplyScalar(0.35));
    target.x = Math.max(-1.25, Math.min(1.25, target.x)); // stays inside the lung
    const curve = new T.CatmullRomCurve3([...r.pts.map(V), target], false, "centripetal");
    const m = new T.Mesh(airGeo, airMat);
    m.userData = { curve, offset: rand(i, 5), target };
    scene.add(m);
    return m;
  });

  // ---------- the magnifier: air sacs round the end of a bronchiole, a capillary around them ----------
  const lens = new T.Group();
  lens.position.set(...MAGNIFIER);
  scene.add(lens);
  const ringMat = new T.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.3, metalness: 0.3 });
  lens.add(new T.Mesh(new T.TorusGeometry(1.25, 0.04, 12, 80), ringMat));
  const back = new T.Mesh(new T.CircleGeometry(1.22, 64), new T.MeshBasicMaterial({ color: 0x1a1513, transparent: true, opacity: 0.85 }));
  back.position.z = -0.5;
  lens.add(back);
  const sacMat = new T.MeshPhysicalMaterial({ color: 0xf0a8ac, roughness: 0.5, sheen: 0.8, sheenColor: new T.Color(0xffe0e0), transparent: true, opacity: 0.6, depthWrite: false });
  const sacs: Vec3[] = [[-0.15, -0.05, 0], [0.32, 0.18, -0.1], [0.3, -0.33, 0.05], [-0.1, -0.5, -0.05], [-0.48, -0.25, 0.05], [0.05, 0.38, 0.0], [-0.42, 0.22, -0.1]];
  sacs.forEach((p) => {
    const m = new T.Mesh(new T.SphereGeometry(0.27, 24, 16), sacMat);
    m.position.set(...p);
    lens.add(m);
  });
  const bronchiole = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 0.8, 16), airwayMat);
  bronchiole.position.set(-0.05, 0.75, 0);
  lens.add(bronchiole);
  const capillary = new T.CatmullRomCurve3([[-1.05, -0.75, 0.3], [-0.6, -0.72, 0.32], [-0.1, -0.78, 0.3], [0.45, -0.58, 0.3], [0.62, -0.05, 0.32], [0.55, 0.42, 0.3], [0.2, 0.7, 0.28], [-0.4, 0.62, 0.3], [-0.75, 0.3, 0.32], [-1.05, 0.25, 0.3]].map((p) => V(p as Vec3)));
  lens.add(new T.Mesh(new T.TubeGeometry(capillary, 80, 0.07, 10, false), new T.MeshPhysicalMaterial({ color: 0xc0504f, transparent: true, opacity: 0.45, depthWrite: false, roughness: 0.4 })));
  const BLOOD = 26;
  const bloodGeo = new T.SphereGeometry(0.045, 10, 8);
  const blood = Array.from({ length: BLOOD }, (_, i) => {
    const m = new T.Mesh(bloodGeo, new T.MeshStandardMaterial({ color: 0x3d6fd8, roughness: 0.3 }));
    m.userData.offset = i / BLOOD;
    lens.add(m);
    return m;
  });
  // gas molecules: oxygen goes from a sac into the capillary, carbon dioxide the other way
  const GAS = 16;
  const gasGeo = new T.SphereGeometry(0.035, 8, 6);
  const o2Mat = new T.MeshStandardMaterial({ color: 0xffffff, emissive: new T.Color(0x9fe3ff), emissiveIntensity: 0.6 });
  const co2Mat = new T.MeshStandardMaterial({ color: 0x9a9a9a, emissive: new T.Color(0x444444), emissiveIntensity: 0.4 });
  const gas = Array.from({ length: GAS }, (_, i) => {
    const o2 = i % 2 === 0;
    const sac = V(sacs[i % sacs.length]);
    const vessel = capillary.getPointAt((i * 0.37) % 1);
    const m = new T.Mesh(gasGeo, o2 ? o2Mat : co2Mat);
    m.userData = { from: o2 ? sac : vessel, to: o2 ? vessel : sac, offset: rand(i, 7) };
    lens.add(m);
    return m;
  });
  // a line from the lung to the magnifier
  const pointer = new T.Line(new T.BufferGeometry().setFromPoints([V([1.05, -0.25, 0.2]), V([MAGNIFIER[0] - 1.25, MAGNIFIER[1], 0])]), new T.LineBasicMaterial({ color: 0xf4f1ea, transparent: true, opacity: 0.6 }));
  scene.add(pointer);

  let breath = 0; // 0 breathed out, 1 breathed in
  let flowing = 0; // +1 air flows in, −1 out
  let zoom = 0; // magnifier shown (0–1)
  return {
    update(step, p, t, s) {
      const before = breath;
      if (step === 0) breath = 0.12 + 0.1 * (0.5 - 0.5 * Math.cos(t * 1.1)); // calm, shallow breathing
      else if (step === 1) breath = ease(clamp(p * 1.3));
      else if (step === 2) breath = 1 - ease(clamp(p * 1.3));
      else breath = 0.5 - 0.5 * Math.cos(t * 1.2);
      flowing = breath > before + 1e-4 ? 1 : breath < before - 1e-4 ? -1 : 0;
      if (step === 1 && p > 0.05 && p < 0.8) flowing = 1;
      if (step === 2 && p > 0.05 && p < 0.8) flowing = -1;
      flatten(breath);
      expand(breath);
      heart.node.position.y = -DROP * 0.45 * breath; // the heart rests on the diaphragm
      ribs.node.rotation.x = -0.03 * breath; // the lower ribs rise a little
      // the diaphragm glows while it works (contracting), not while it relaxes
      muscleMat.emissive.setHex(flowing > 0 && step > 0 ? 0x4a120c : 0x000000);
      // air bubbles: the deeper the breath, the further in; at rest they are outside (hidden)
      for (const m of air) {
        const { curve, offset } = m.userData as { curve: InstanceType<typeof T.CatmullRomCurve3>; offset: number };
        const q = clamp(breath * 1.35 - offset * 0.35);
        m.visible = q > 0.02 && zoom < 0.5;
        if (!m.visible) continue;
        m.position.copy(curve.getPointAt(q));
        if (q > 0.85) m.position.y -= DROP * breath * 0.5; // inside the lung, carried down with it
      }
      // the magnifier in the last step
      zoom = step === 3 ? ease(clamp(s / TIMING.appear)) : 0;
      lens.visible = zoom > 0;
      pointer.visible = zoom > 0;
      lens.scale.setScalar(Math.max(0.001, zoom));
      blood.forEach((m) => {
        const u = (m.userData.offset + t * 0.05) % 1;
        m.position.copy(capillary.getPointAt(u));
        // blue on the way in, red once it has passed the sacs and taken up oxygen
        (m.material as InstanceType<typeof T.MeshStandardMaterial>).color.setHex(u < 0.35 ? 0x3d6fd8 : u > 0.6 ? 0xd8323c : 0x8a4fa0);
      });
      gas.forEach((m) => {
        const { from, to, offset } = m.userData as { from: InstanceType<typeof T.Vector3>; to: InstanceType<typeof T.Vector3>; offset: number };
        const k = (offset + t * 0.25) % 1;
        m.position.lerpVectors(from, to, ease(k));
        m.scale.setScalar(k < 0.1 ? k * 10 : k > 0.9 ? (1 - k) * 10 : 1);
      });
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [1.6, 0.4, 9.2], look: [0, -0.3, 0] },
        { pos: [3.6, 0.0, 8.2], look: [0, -0.6, 0] }, // a little from the side: the dome and how it flattens
        { pos: [3.6, 0.0, 8.2], look: [0, -0.6, 0] },
        { pos: [2.4, 0.3, 10.5], look: [1.6, -0.3, 0] }, // lungs and the magnifier
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      const dome = -0.44 - DROP * breath;
      const base = [
        { at: [-1.25, 0.9, 0.6] as Vec3, text: 0 },
        { at: [0.9, dome - 0.15, 0.7] as Vec3, text: 1, color: "#ff8f7a" },
        { at: [0.05, 1.75, 0.2] as Vec3, text: 2 },
        { at: [0.75, 0.55, 0.2] as Vec3, text: 3 },
        { at: [-1.65, -1.6, 0.9] as Vec3, text: 4 },
      ];
      if (step === 0) return base;
      if (step === 1) return [base[0], base[1], base[2], { at: [0.0, dome - 0.85, 1.0] as Vec3, text: 5, color: "#ffd24a" }, ...(flowing > 0 ? [{ at: [0.6, 2.25, 0.2] as Vec3, text: 6, color: "#9fe3ff" }] : [])];
      if (step === 2) return [base[0], base[1], base[2], { at: [0.0, dome - 0.85, 1.0] as Vec3, text: 7, color: "#ffd24a" }, ...(flowing < 0 ? [{ at: [0.6, 2.25, 0.2] as Vec3, text: 11, color: "#9fe3ff" }] : [])];
      return [
        base[2], base[3],
        { at: [MAGNIFIER[0], MAGNIFIER[1] + 1.45, 0] as Vec3, text: 8 },
        { at: [MAGNIFIER[0] + 0.15, MAGNIFIER[1] - 1.5, 0.3] as Vec3, text: 9, color: "#ffb3b3" },
        { at: [MAGNIFIER[0] - 0.3, MAGNIFIER[1] + 1.05, 0.5] as Vec3, text: 10, color: "#d0d0d0" },
      ];
    },
    stage: { shadows: true },
  };
};

