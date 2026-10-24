// How the brain is built: a real brain (public/models/brain.glb, prepared from Z-Anatomy / BodyParts3D, CC BY-SA – see
// the credits page), seen from the left. Step by step the lobes of the cerebrum, then the cerebellum and the brainstem
// light up in their own colour; in the first step the two halves part a little.
// labels: 0 frontal, 1 parietal, 2 temporal, 3 occipital lobe, 4 cerebellum, 5 brainstem, 6–11 one task each (same order)
// Simplified: the colours mark regions, not sharp borders – and no part of the brain works alone.
// Model units: 1 = 1 cm, the centre of the brain at the origin, the front towards +z, the left side towards +x.
import type * as THREE from "three";
import { TIMING } from "@/lib/animations";
import { clamp, ease, mix, type SceneFactory, type Vec3 } from "../types";

const PARTS = ["frontal", "parietal", "temporal", "occipital", "cerebellum", "brainstem"] as const;
const COLORS = [0x4f86e8, 0xe8c24f, 0x4fbf7a, 0xa66be0, 0xe8874f, 0x4fc4c4];
// which parts each step is about
const FOCUS: number[][] = [[0, 1, 2, 3], [0, 1], [2, 3], [4, 5]];

export const brain: SceneFactory = async ({ THREE: T, scene, load }) => {
  const model = await load("brain.glb");
  const tissue = new T.Color(0xe6b8b0); // the colour of brain tissue
  const groups = PARTS.map((name, i) => {
    const nodes = (name === "cerebellum" || name === "brainstem" ? [name] : [name + "_l", name + "_r"]).map((n) => {
      const node = model.getObjectByName(n);
      if (!node) throw new Error("brain.glb: missing " + n);
      return node;
    });
    const mat = new T.MeshPhysicalMaterial({ color: tissue.clone(), roughness: 0.55, clearcoat: 0.4, clearcoatRoughness: 0.4, sheen: 0.6, sheenColor: new T.Color(0xffe0dc), emissive: new T.Color(0x000000) });
    const meshes: THREE.Mesh[] = [];
    nodes.forEach((n) => n.traverse((o) => (o as THREE.Mesh).isMesh && meshes.push(o as THREE.Mesh)));
    meshes.forEach((m) => (m.material = mat));
    // where to put the label: the middle of the left half's outer side
    const box = new T.Box3().setFromObject(nodes[0]);
    const centre = box.getCenter(new T.Vector3());
    return { nodes, mat, color: new T.Color(COLORS[i]), label: [box.max.x + 0.3, centre.y, centre.z] as Vec3 };
  });
  // the insula and the inner parts of the cortex: tissue colour, never highlighted
  const filler = model.getObjectByName("insula");
  filler?.traverse((o) => (o as THREE.Mesh).isMesh && ((o as THREE.Mesh).material = new T.MeshPhysicalMaterial({ color: tissue.clone().multiplyScalar(0.92), roughness: 0.6, sheen: 0.5, sheenColor: new T.Color(0xffe0dc) })));
  scene.add(model);
  const left = groups.slice(0, 4).map((g) => g.nodes[0]);
  const right = groups.slice(0, 4).map((g) => g.nodes[1]);

  let focus: number[] = [];
  return {
    update(step, _p, t, s) {
      focus = FOCUS[step];
      // the parts of this step take on their colour; the others stay tissue-coloured, a little faded
      groups.forEach((g, i) => {
        const on = focus.includes(i);
        const k = on ? ease(clamp(s / 0.8)) : 0;
        g.mat.color.copy(tissue).lerp(g.color, 0.75 * k);
        g.mat.emissive.copy(g.color).multiplyScalar(0.18 * k * (0.75 + 0.25 * Math.sin(t * 3)));
      });
      // step 1: the two halves part a little and come together again
      const part = step === 0 ? Math.sin(clamp(s / 5) * Math.PI) * 1.4 : 0;
      left.forEach((n) => (n.position.x = part));
      right.forEach((n) => (n.position.x = -part));
    },
    camera(step, _p, t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [33, 15, 24], look: [0, 0, 0] }, // from the left, front and above: both halves visible
        { pos: [38, 8, 9], look: [0, 1, 1] }, // from the left: front and top
        { pos: [38, 0, -6], look: [0, -1, -1] }, // from the left: side and back
        { pos: [26, -12, -27], look: [0, -3, -3] }, // from behind and below: cerebellum and brainstem
      ];
      const from = views[Math.max(0, step - 1)];
      const v = { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
      if (step === 0) v.pos = [v.pos[0] * Math.cos(t * 0.15) - v.pos[2] * Math.sin(t * 0.15) * 0.3, v.pos[1], v.pos[2]]; // a slow look round
      return v;
    },
    labels(step) {
      return focus.flatMap((i) => [
        { at: groups[i].label, text: i, color: "#" + groups[i].color.getHexString() },
        ...(step > 0 ? [{ at: [groups[i].label[0], groups[i].label[1] - 2.1, groups[i].label[2]] as Vec3, text: 6 + i }] : []),
      ]);
    },
    stage: { shadows: true },
  };
};
