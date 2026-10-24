// The heart: two pumps in one organ. A real heart (public/models/heart.glb, prepared from Z-Anatomy /
// BodyParts3D, CC BY-SA – see the credits page), cut open at a slant from the front so the four chambers,
// the valves between atria and ventricles and the aortic valve can be seen. Seen from the front, the body's
// right side (oxygen-poor, blue) is on the left of the picture. The blood travels round the double circuit
// along the real vessels (their centre lines are in heart-paths.json): one loop through each lung.
// labels: 0 lungs, 1 body, 2 right atrium, 3 right ventricle, 4 left atrium, 5 left ventricle,
//         6 valves open, 7 valves closed, 8 takes up oxygen, 9 gives off oxygen
// Simplified: no coronary vessels, the leaflets open and close by squashing rather than by folding, and the
// heartbeat is slowed down so the order of the phases can be followed.
// Model units: 1 = 4 cm, the centre of the heart at the origin, the front of the body towards +z.
import type * as THREE from "three";
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3 } from "../types";
import vessels from "./heart-paths.json";

const BLUE = 0x3d6fd8, RED = 0xd8323c;
const BEAT = [3.0, 2.6, 2.6, 2.2]; // seconds per heartbeat in each step (slowed down)
const ADVANCE = 0.03; // share of the circuit the blood moves on per heartbeat
// we look at the heart along this direction (from the front, a little from the body's left);
// the cut keeps everything at least CUT along it, so the front of the heart is taken away
const DIR: Vec3 = [-0.423, 0, -0.906];
const CUT = -0.25;

// phases inside one beat (0–1): the atria contract first, then the ventricles, then everything relaxes and fills
const atrialSqueeze = (f: number) => (f > 0.04 && f < 0.24 ? Math.sin(((f - 0.04) / 0.2) * Math.PI) : 0);
const ventricularSqueeze = (f: number) => (f > 0.26 && f < 0.6 ? Math.sin(((f - 0.26) / 0.34) * Math.PI) : 0);
// how fast the blood moves at each moment of a beat; its integral is precomputed so the flow is smooth
const speed = (f: number) => 0.15 + 0.55 * atrialSqueeze(f) + 2.2 * ventricularSqueeze(f);
const N = 400;
const flowTable = (() => {
  const out = [0];
  for (let i = 1; i <= N; i++) out.push(out[i - 1] + speed((i - 0.5) / N));
  return out.map((v) => v / out[N]);
})();
const flowIn = (f: number) => {
  const x = clamp(f) * N, i = Math.min(N - 1, Math.floor(x));
  return flowTable[i] + (flowTable[i + 1] - flowTable[i]) * (x - i);
};

type Lines = Record<string, Vec3[][]>;
/** A vessel's centre line as the blood runs through it (`back` = against the direction it is stored in). */
const line = (name: string, i = 0, back = false): Vec3[] => {
  const l = (vessels as unknown as Lines)[name][i];
  return back ? [...l].reverse() : l;
};

// the path of the blood through the heart, the same in both loops
const RIGHT_HEART: Vec3[] = [[-0.62, -0.28, 0.12], [-0.4, -0.75, 0.22], [-0.05, -0.45, 0.42], [0.13, 0.69, 0.56], [0.164, 1.338, 0.12]]; // tricuspid valve → right ventricle → pulmonary valve → pulmonary trunk
const LEFT_HEART: Vec3[] = [[-0.1, 0.35, -0.7], [0.38, -0.25, -0.45], [0.85, -0.85, -0.05], [0.35, -0.2, 0.05], [-0.15, 0.61, 0.02]]; // left atrium → mitral valve → left ventricle → aortic valve
const LUNG: Vec3[] = [[-2.45, 0.2, -0.75], [2.35, 0.1, -0.85]]; // where the blood is in the right and the left lung
const BODY: Vec3[] = [[-0.45, -3.4, -0.6], [-0.65, 3.45, -0.05]]; // … and in the body (below: legs and belly, above: head and arms)
const LOOPS: Vec3[][] = [
  // through the right lung and back from the lower body
  [
    ...line("Inferior vena cava (thoracic part)"), [-0.95, 0.05, -0.02], ...RIGHT_HEART,
    ...line("Bifurcation of pulmonary trunk", 1), ...line("Right pulmonary artery"),
    [-2.2, 0.75, -0.75], LUNG[0], [-1.6, -0.05, -1.25], ...line("Right inferior pulmonary vein", 0, true),
    ...LEFT_HEART, ...line("Ascending aorta"), ...line("Aortic arch"), ...line("Thoracic aorta"),
    BODY[0], [-0.75, -3.35, -0.35],
  ],
  // through the left lung and back from the upper body
  [
    ...line("Superior vena cava"), [-1.0, 0.4, -0.05], ...RIGHT_HEART,
    ...line("Bifurcation of pulmonary trunk", 0), ...line("Left pulmonary artery"),
    [2.25, -0.35, -1.1], LUNG[1], [1.4, 0.8, -0.8], ...line("Left superior pulmonary vein", 1, true),
    ...LEFT_HEART, ...line("Ascending aorta"), [-0.5, 2.5, 0.05],
    BODY[1], [-0.95, 3.3, -0.05], [-0.93, 2.6, -0.04],
  ],
];
/** Removes points that (nearly) repeat the one before – vessels share their ends. */
const tidy = (pts: Vec3[]) => pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1], p[2] - pts[i - 1][2]) > 0.04);

export const heart: SceneFactory = async ({ THREE: T, scene, load }) => {
  const model = await load("heart.glb");
  const V = (p: Vec3) => new T.Vector3(...p);
  const dir = V(DIR).normalize();
  // the cut: keeps what lies at least `-constant` along the viewing direction
  const cut = new T.Plane(dir.clone(), 5);
  const clip = { clippingPlanes: [cut], clipShadows: true };

  const outside = new T.MeshPhysicalMaterial({ color: 0x9c3b33, roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.35, sheen: 0.5, sheenColor: new T.Color(0xff9a8a), side: T.FrontSide, ...clip });
  // inside the chambers: oxygen-poor (right half) a little bluish, oxygen-rich (left half) red
  const inside = (color: number) => new T.MeshPhysicalMaterial({ color, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.3, side: T.BackSide, ...clip });
  const insideRight = inside(0x6a5ca0), insideLeft = inside(0xb8474a);
  const valveMat = new T.MeshPhysicalMaterial({ color: 0xf1e3c6, roughness: 0.38, sheen: 0.7, sheenColor: new T.Color(0xffffff), emissive: new T.Color(0x000000), side: T.DoubleSide, ...clip });
  const papillaryMat = new T.MeshPhysicalMaterial({ color: 0xb4564c, roughness: 0.45, clearcoat: 0.4, side: T.DoubleSide, ...clip });
  const vessel = (color: number) => new T.MeshPhysicalMaterial({ color, roughness: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3, side: T.DoubleSide, ...clip });
  const lungMat = new T.MeshPhysicalMaterial({ color: 0xe9a2a6, roughness: 0.75, sheen: 0.6, sheenColor: new T.Color(0xffd0d0), transparent: true, opacity: 0, depthWrite: false });

  const mesh = (name: string) => {
    const node = model.getObjectByName(name);
    let found: THREE.Mesh | null = null;
    node?.traverse((o) => !found && (o as THREE.Mesh).isMesh && (found = o as THREE.Mesh));
    if (!found) throw new Error("heart.glb: missing " + name);
    return found as THREE.Mesh;
  };
  const centre = (m: THREE.Mesh) => {
    m.geometry.computeBoundingBox();
    return m.geometry.boundingBox!.getCenter(new T.Vector3());
  };
  // a part that squeezes: turned into a group whose pivot is the part's centre
  const pivot = (m: THREE.Mesh, at = centre(m)) => {
    const g = new T.Group();
    g.position.copy(at);
    m.position.sub(at);
    m.parent!.add(g);
    g.add(m);
    return g;
  };
  // a chamber: its wall from outside, and the same wall seen from inside in the colour of its blood
  const chamber = (name: string, right: boolean) => {
    const m = mesh(name);
    m.material = outside;
    const inner = new T.Mesh(m.geometry, right ? insideRight : insideLeft);
    m.add(inner);
    return { group: pivot(m), centre: centre(m) };
  };
  const ra = chamber("ra", true), rv = chamber("rv", true), la = chamber("la", false), lv = chamber("lv", false);
  const tricuspid = mesh("tricuspid"), mitral = mesh("mitral"), aortic = mesh("aortic"), pulmonary = mesh("pulmonary");
  for (const m of [tricuspid, mitral, aortic, pulmonary]) m.material = valveMat;
  mesh("papillary").material = papillaryMat;
  mesh("aorta").material = vessel(0xb3262e);
  mesh("pvein").material = vessel(0xc4464f);
  mesh("cava").material = vessel(0x34539f);
  mesh("partery").material = vessel(0x3f63b5);
  const lungs = mesh("lungs");
  lungs.material = lungMat;
  // leaflets between atrium and ventricle hang from their ring at the top: closing pulls them up into the ring
  const ring = (m: THREE.Mesh) => {
    m.geometry.computeBoundingBox();
    const b = m.geometry.boundingBox!;
    return pivot(m, new T.Vector3((b.min.x + b.max.x) / 2, b.max.y - 0.05, (b.min.z + b.max.z) / 2));
  };
  const avValves = [ring(tricuspid), ring(mitral)];
  const exitValves = [pivot(aortic), pivot(pulmonary)];
  scene.add(model);

  // ---------- the blood: two loops (one through each lung) that share the path through the heart ----------
  const loops = LOOPS.map((pts) => new T.CatmullRomCurve3(tidy(pts).map(V), true, "centripetal"));
  const nearestU = (curve: InstanceType<typeof T.CatmullRomCurve3>, target: Vec3) => {
    const goal = V(target);
    let best = 0, dist = Infinity;
    for (let i = 0; i < 800; i++) {
      const d = curve.getPointAt(i / 800).distanceTo(goal);
      if (d < dist) (dist = d), (best = i / 800);
    }
    return best;
  };
  const marks = loops.map((c, i) => ({ lung: nearestU(c, LUNG[i]), body: nearestU(c, BODY[i]) }));
  // the stretches between the ends of the vessels in the model: out in the lung and out in the body
  const last = (l: Vec3[]) => l[l.length - 1];
  const beyond = [
    [[last(line("Right pulmonary artery")), last(line("Right inferior pulmonary vein"))], [last(line("Thoracic aorta")), line("Inferior vena cava (thoracic part)")[0]]],
    [[last(line("Left pulmonary artery")), last(line("Left superior pulmonary vein", 1))], [last(line("Ascending aorta")), line("Superior vena cava")[0]]],
  ].map((pairs, i) => pairs.map(([a, b]) => [nearestU(loops[i], a), nearestU(loops[i], b)]));
  const PER_LOOP = 90;
  const cellGeo = new T.SphereGeometry(0.045, 10, 8);
  const cells = loops.flatMap((_, l) =>
    Array.from({ length: PER_LOOP }, (_, n) => {
      const m = new T.Mesh(cellGeo, new T.MeshStandardMaterial({ color: BLUE, roughness: 0.3, emissive: new T.Color(BLUE), emissiveIntensity: 0.35 }));
      m.userData = { loop: l, offset: n / PER_LOOP };
      scene.add(m);
      return m;
    }),
  );
  const blue = new T.Color(BLUE).offsetHSL(0, 0, 0.12), red = new T.Color(RED).offsetHSL(0, 0, 0.1);
  const between = (u: number, a: number, b: number) => (a < b ? u >= a && u < b : u >= a || u < b);

  let beatPhase = 0;
  let opened = CUT; // how far the cut has opened the heart (along the viewing direction)
  return {
    update(step, _p, t, s) {
      const P = BEAT[step];
      const beats = t / P;
      const f = beats - Math.floor(beats);
      beatPhase = f;
      // first the whole heart, then it is cut open – from the second step on it stays open
      opened = step === 0 ? lerp(-2.2, CUT, ease(clamp((s - 2.5) / 2.5))) : CUT;
      cut.constant = -opened;
      // chambers squeeze in their phase; the atria in step 1 and the ventricles in step 2 a little more
      const a = atrialSqueeze(f) * (step === 1 ? 0.13 : 0.09);
      const v = ventricularSqueeze(f) * (step === 2 ? 0.11 : 0.08);
      ra.group.scale.setScalar(1 - a);
      la.group.scale.setScalar(1 - a);
      rv.group.scale.set(1 - v, 1 - v * 1.2, 1 - v);
      lv.group.scale.set(1 - v, 1 - v * 1.2, 1 - v);
      // valves between atria and ventricles: open unless the ventricles squeeze; at the exits: open only then
      const avShut = clamp(ventricularSqueeze(f) * 4) * (f > 0.26 && f < 0.6 ? 1 : 0);
      for (const g of avValves) g.scale.set(1 - 0.12 * avShut, 1 - 0.5 * avShut, 1 - 0.12 * avShut);
      const exitOpen = clamp(ventricularSqueeze(f) * 3);
      for (const g of exitValves) g.scale.set(1 + 0.32 * exitOpen, 1 + 0.12 * exitOpen, 1 + 0.32 * exitOpen);
      // the leaflets light up while they are moving, so the eye finds them
      valveMat.emissive.setRGB(0.22 * Math.max(avShut * (1 - avShut) * 4, exitOpen * (1 - exitOpen) * 4), 0.16 * Math.max(avShut * (1 - avShut) * 4, exitOpen * (1 - exitOpen) * 4), 0.06);
      // the lungs belong to the last step (they would hide the heart in the close-ups)
      const show = step === 3 ? ease(clamp(s / TIMING.appear)) : 0;
      lungMat.opacity = 0.42 * show;
      lungs.visible = show > 0;
      const breathe = 1 + 0.03 * Math.sin(t * 1.4) * show;
      lungs.scale.setScalar(breathe);
      // blood cells: a pulsing flow round the two loops, blue until the lung, red until the body
      const flow = (Math.floor(beats) + flowIn(f)) * ADVANCE;
      const fade = step === 3 ? ease(clamp(s / TIMING.appear)) : 1;
      for (const m of cells) {
        const { loop, offset } = m.userData as { loop: number; offset: number };
        const u = ((((offset + flow) % 1) + 1) % 1) || 0; // also for negative times (jumping back)
        m.position.copy(loops[loop].getPointAt(u));
        const oxygen = between(u, marks[loop].lung, marks[loop].body);
        const mat = m.material as InstanceType<typeof T.MeshStandardMaterial>;
        mat.color.copy(oxygen ? red : blue);
        mat.emissive.copy(mat.color);
        // cells in the part of the heart that is cut away, and – while lungs and body are hidden – out there, are not shown
        const p = m.position;
        const removed = p.dot(dir) < opened - 0.02;
        const out = beyond[loop].some(([a, b]) => between(u, a, b));
        m.visible = !removed && (show > 0 || !out);
        m.scale.setScalar(fade);
      }
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      // along the viewing direction, from `distance` away, a little from above
      const view = (look: Vec3, distance: number, above: number) => ({ pos: [look[0] - DIR[0] * distance, look[1] + above, look[2] - DIR[2] * distance] as Vec3, look });
      const views = [
        view([0, 0.25, 0], 10, 0.8),
        view([-0.2, 0.2, 0], 7.6, 1.2), // atria and the valves below them
        view([0.1, -0.35, 0], 7.6, 0.4), // ventricles and the exits
        view([0, 0.05, 0], 18, 0.6), // the whole circuit
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step, _p, _t, s) {
      // a chamber's label sits at its centre, moved back behind the cut so it is inside the open chamber
      const at = (c: InstanceType<typeof T.Vector3>, dx = 0, dy = 0): Vec3 => {
        const q = c.clone().add(new T.Vector3(dx, dy, 0));
        const behind = Math.max(0, opened + 0.15 - q.dot(dir));
        q.addScaledVector(dir, behind);
        return [q.x, q.y, q.z];
      };
      const chambers = [
        { at: at(ra.centre, -0.15, 0.35), text: 2, color: "#a9c4ff" },
        { at: at(rv.centre, -0.35, -0.55), text: 3, color: "#a9c4ff" },
        { at: at(la.centre, 0.35, 0.45), text: 4, color: "#ffb3b3" },
        { at: at(lv.centre, 0.15, -0.35), text: 5, color: "#ffb3b3" },
      ];
      const valves = at(new T.Vector3(-0.05, -0.3, -0.2));
      if (step === 0) return chambers;
      if (step === 1) return [chambers[0], chambers[2], ...(atrialSqueeze(beatPhase) > 0.05 || s > 1 ? [{ at: valves, text: 6 }] : [])];
      // step 2: the closing valves are only named once the step runs (the prediction question asks about them)
      if (step === 2) return [chambers[1], chambers[3], ...(s > 1.2 ? [{ at: valves, text: 7 }] : [])];
      return [
        { at: [-2.6, 2.4, -0.6] as Vec3, text: 0 }, { at: [2.4, 2.4, -0.6] as Vec3, text: 0 },
        { at: [-2.75, -0.3, -0.6] as Vec3, text: 8, color: "#ffb3b3" },
        { at: [-0.4, -3.75, -0.5] as Vec3, text: 1 }, { at: [-0.7, 3.8, 0] as Vec3, text: 1 },
        { at: [1.3, -3.1, -0.5] as Vec3, text: 9, color: "#a9c4ff" },
      ];
    },
    stage: { shadows: true },
  };
};
