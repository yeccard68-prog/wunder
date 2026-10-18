// The heart: two pumps in one organ. A cut-open heart seen from the front – so the body's right side
// (oxygen-poor, blue) is on the left of the picture – with its four chambers, the valves between atria
// and ventricles and at the exits, and the blood travelling round the double circuit through lungs and body.
// labels: 0 lungs, 1 body, 2 right atrium, 3 right ventricle, 4 left atrium, 5 left ventricle,
//         6 valves open, 7 valves closed, 8 takes up oxygen, 9 gives off oxygen
// Simplified: no coronary vessels, one vena cava from below instead of two, two pulmonary veins instead of
// four, and the heartbeat slowed down so the order of the phases can be followed.
import { TIMING } from "@/lib/animations";
import { painter } from "../surface";
import { clamp, ease, mix, rand, type SceneFactory, type Vec3 } from "../types";

const BLUE = 0x3d6fd8, RED = 0xd8323c;
const BEAT = [3.0, 2.6, 2.6, 2.2]; // seconds per heartbeat in each step (slowed down)
const ADVANCE = 0.03; // share of the circuit the blood moves on per heartbeat

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

export const heart: SceneFactory = ({ THREE: T, scene }) => {
  const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
  const root = new T.Group();
  root.rotation.z = -0.22; // the apex points down and to the body's left
  scene.add(root);

  // ---------- the heart wall: the back half of a pear-shaped shell, so we look into the chambers ----------
  const fibres = painter(T).paint((c, w, h) => {
    c.fillStyle = "#8a2326";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) {
      c.strokeStyle = `rgba(${rand(i, 3) > 0.5 ? "255,170,160" : "60,0,5"},${0.06 + 0.08 * rand(i, 4)})`;
      c.lineWidth = 1 + 2 * rand(i, 5);
      const x = rand(i, 6) * w;
      c.beginPath();
      c.moveTo(x, 0);
      c.bezierCurveTo(x + 30 * (rand(i, 7) - 0.5), h * 0.35, x + 40 * (rand(i, 8) - 0.5), h * 0.7, x + 20 * (rand(i, 9) - 0.5), h);
      c.stroke();
    }
  });
  const muscle = new T.MeshStandardMaterial({ color: 0xffffff, map: fibres, roughness: 0.7, side: T.DoubleSide });
  const wallMat = new T.MeshStandardMaterial({ color: 0x7a1e22, roughness: 0.75 });
  const shellGeo = new T.SphereGeometry(1, 64, 48, Math.PI, Math.PI); // the half facing away from the viewer
  const pos = shellGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const taper = y < 0 ? 1 + y * 0.62 : 1 - y * y * 0.12; // narrow towards the apex, rounded on top
    x *= 1.72 * taper;
    z *= 1.15 * taper;
    y *= y < 0 ? 2.15 : 1.45;
    x += y < 0 ? -y * 0.12 : 0; // apex slightly towards the body's left
    pos.setXYZ(i, x, y, z * 1.0);
  }
  shellGeo.computeVertexNormals();
  const shell = new T.Mesh(shellGeo, muscle);
  shell.position.set(0, 0.05, -0.15);
  root.add(shell);
  // the wall between the two halves (septum)
  const septum = new T.Mesh(new T.CapsuleGeometry(0.08, 2.5, 6, 12), wallMat);
  septum.scale.z = 4;
  septum.position.set(0.02, -0.3, -0.15);
  root.add(septum);

  // ---------- the four chambers, filled with blood; they squeeze when they contract ----------
  const chamber = (x: number, y: number, z: number, rx: number, ry: number, rz: number, color: number) => {
    const m = new T.Mesh(new T.SphereGeometry(1, 40, 28), new T.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.05, transparent: true, opacity: 0.55, depthWrite: false }));
    m.position.set(x, y, z);
    m.scale.set(rx, ry, rz);
    m.userData.base = [rx, ry, rz];
    root.add(m);
    return m;
  };
  const ra = chamber(-0.72, 0.78, 0.05, 0.56, 0.48, 0.42, BLUE);
  const la = chamber(0.74, 0.86, -0.05, 0.54, 0.44, 0.42, RED);
  const rv = chamber(-0.62, -0.5, 0.12, 0.6, 0.66, 0.46, BLUE);
  const lv = chamber(0.6, -0.62, 0.05, 0.6, 0.92, 0.5, RED);

  // ---------- valves: two leaflets between atrium and ventricle on each side, one flap at each exit ----------
  const leafletMat = new T.MeshStandardMaterial({ color: 0xfff1d6, emissive: new T.Color(0x5a4a30), emissiveIntensity: 0.6, roughness: 0.45, side: T.DoubleSide });
  const avValves = [-0.72, 0.72].map((x) => {
    const pair = [-1, 1].map((side) => {
      const hinge = new T.Group();
      hinge.position.set(x + side * 0.34, 0.2, 0.18);
      const flap = new T.Mesh(new T.BoxGeometry(0.34, 0.045, 0.5), leafletMat);
      flap.position.x = -side * 0.17;
      hinge.add(flap);
      hinge.userData.side = side;
      root.add(hinge);
      return hinge;
    });
    return pair;
  });
  const exitValves = [V(-0.22, 0.62, 0.32), V(0.26, 0.66, 0.12)].map((p) => {
    const hinge = new T.Group();
    hinge.position.copy(p);
    const flap = new T.Mesh(new T.CylinderGeometry(0.19, 0.19, 0.025, 20, 1, false, 0, Math.PI), leafletMat);
    flap.rotation.z = Math.PI / 2;
    hinge.add(flap);
    root.add(hinge);
    return hinge;
  });

  // ---------- vessels (translucent, so the blood inside can be seen) ----------
  const tube = (points: Vec3[], r: number, color: number) => {
    const curve = new T.CatmullRomCurve3(points.map((p) => V(...p)));
    const m = new T.Mesh(new T.TubeGeometry(curve, 64, r, 14, false), new T.MeshStandardMaterial({ color, roughness: 0.35, transparent: true, opacity: 0.42, depthWrite: false }));
    root.add(m);
    return m;
  };
  tube([[-0.9, -3.4, -0.4], [-1.05, -1.6, -0.35], [-0.95, 0.1, -0.15], [-0.78, 0.6, 0.0]], 0.2, BLUE); // vena cava
  tube([[-0.22, 0.25, 0.32], [-0.18, 1.4, 0.36], [-0.95, 1.95, 0.2], [-2.0, 1.9, 0.0]], 0.17, BLUE); // pulmonary artery to the body's right lung
  tube([[-0.18, 1.4, 0.36], [0.6, 2.05, 0.25], [2.0, 1.95, 0.0]], 0.15, BLUE); // … and to the left lung
  tube([[0.26, 0.3, 0.12], [0.24, 1.75, 0.0], [0.62, 2.35, -0.35], [1.15, 1.85, -0.7], [1.2, -1.6, -0.8], [0.7, -3.4, -0.4]], 0.2, RED); // aorta
  tube([[-2.0, 1.05, -0.2], [-1.2, 0.95, -0.55], [0.3, 0.9, -0.35], [0.7, 0.88, -0.1]], 0.12, RED); // pulmonary vein from the body's right lung (behind)
  tube([[2.0, 1.05, -0.1], [1.4, 0.95, -0.1], [0.95, 0.9, -0.05]], 0.12, RED); // … and from the left lung

  // ---------- lungs and body, seen in the last step ----------
  const lungMat = new T.MeshStandardMaterial({ color: 0xe8909a, roughness: 0.8, transparent: true, opacity: 0.85 });
  const lungs = [-2.7, 2.7].map((x) => {
    const m = new T.Mesh(new T.SphereGeometry(1, 32, 24), lungMat);
    m.position.set(x, 1.55, -0.2);
    m.scale.set(0.85, 1.3, 0.55);
    root.add(m);
    return m;
  });
  const body = new T.Mesh(new T.CapsuleGeometry(0.62, 2.4, 8, 24), new T.MeshStandardMaterial({ color: 0xc9a089, roughness: 0.85, transparent: true, opacity: 0.85 }));
  body.rotation.z = Math.PI / 2;
  body.position.set(-0.1, -3.75, -0.2);
  root.add(body);

  // ---------- the blood: two loops (one through each lung) that share the path through the heart ----------
  const heartPart = (lungX: number): Vec3[] => [
    [-0.75, 0.82, 0.12], [-0.72, 0.22, 0.16], [-0.58, -0.55, 0.2], [-0.25, 0.25, 0.32], [-0.18, 1.4, 0.36], // RA → RV → pulmonary artery
    [lungX * 0.45, 1.95, 0.2], [lungX * 0.85, 1.85, 0.0], [lungX * 1.0, 2.35, -0.1], [lungX * 1.15, 1.2, -0.1], // lung
    [lungX * 0.6, 0.95, -0.2], [0.72, 0.88, -0.02], [0.7, 0.22, 0.12], [0.62, -0.72, 0.12], [0.26, 0.25, 0.12], // LA → LV → aorta
    [0.24, 1.75, 0.0], [0.62, 2.35, -0.35], [1.15, 1.85, -0.7], [1.2, -1.6, -0.8], // aortic arch, descending
    [0.8, -3.7, -0.1], [-0.3, -3.95, 0.0], [-1.1, -3.6, -0.1], [-1.05, -1.6, -0.35], [-0.95, 0.1, -0.15], // body, vena cava
  ];
  const loops = [-2.65, 2.65].map((lx) => new T.CatmullRomCurve3(heartPart(lx).map((p) => V(...p)), true, "centripetal"));
  // where on each loop the blood is in the lung and in the body (colour changes there)
  const nearestU = (curve: InstanceType<typeof T.CatmullRomCurve3>, target: InstanceType<typeof T.Vector3>) => {
    let best = 0, dist = Infinity;
    for (let i = 0; i < 400; i++) {
      const d = curve.getPointAt(i / 400).distanceTo(target);
      if (d < dist) { dist = d; best = i / 400; }
    }
    return best;
  };
  const marks = loops.map((c, i) => ({ lung: nearestU(c, V(i ? 2.65 : -2.65, 2.35, -0.1)), body: nearestU(c, V(-0.3, -3.95, 0)) }));
  const PER_LOOP = 70;
  const cellGeo = new T.SphereGeometry(0.055, 10, 8);
  const cells = loops.flatMap((_, l) => Array.from({ length: PER_LOOP }, (_, n) => {
    const m = new T.Mesh(cellGeo, new T.MeshBasicMaterial({ color: BLUE }));
    m.userData = { loop: l, offset: n / PER_LOOP };
    root.add(m);
    return m;
  }));
  const blue = new T.Color(BLUE).offsetHSL(0, 0, 0.12), red = new T.Color(RED).offsetHSL(0, 0, 0.1);
  const between = (u: number, a: number, b: number) => (a < b ? u >= a && u < b : u >= a || u < b);

  let beatPhase = 0;
  return {
    update(step, _p, t, s) {
      const P = BEAT[step];
      const beats = t / P;
      const f = beats - Math.floor(beats);
      beatPhase = f;
      // chambers squeeze in their phase; the atria in step 1 and the ventricles in step 2 a little more
      const a = atrialSqueeze(f) * (step === 1 ? 0.24 : 0.16);
      const v = ventricularSqueeze(f) * (step === 2 ? 0.26 : 0.18);
      for (const [m, k] of [[ra, a], [la, a], [rv, v], [lv, v]] as const) {
        const [x, y, z] = m.userData.base as number[];
        m.scale.set(x * (1 - k), y * (1 - k * 1.1), z * (1 - k));
      }
      shell.scale.set(1 - v * 0.18, 1 - v * 0.12, 1 - v * 0.18);
      // valves between atria and ventricles: open unless the ventricles squeeze; exits: open only then
      const avOpen = 1 - clamp(ventricularSqueeze(f) * 4) * (f > 0.26 && f < 0.6 ? 1 : 0);
      for (const pair of avValves) for (const h of pair) h.rotation.z = (h.userData.side as number) * avOpen * 1.15;
      const exitOpen = clamp(ventricularSqueeze(f) * 3);
      for (const h of exitValves) h.rotation.x = -exitOpen * 1.3;
      // the lungs breathe gently in the last step
      // lungs and body only belong to the last step (they would crowd the close-ups)
      const show = step === 3 ? ease(clamp(s / TIMING.appear)) : 0;
      const breathe = (1 + 0.04 * Math.sin(t * 1.4)) * Math.max(0.001, show);
      lungs.forEach((m) => {
        m.visible = show > 0;
        m.scale.set(0.85 * breathe, 1.3 * breathe, 0.55 * breathe);
      });
      body.visible = show > 0;
      body.scale.setScalar(Math.max(0.001, show));
      // blood cells: a pulsing flow round the two loops, blue until the lung, red until the body
      const flow = (Math.floor(beats) + flowIn(f)) * ADVANCE;
      const fade = step === 3 ? ease(clamp(s / TIMING.appear)) : 1;
      for (const m of cells) {
        const { loop, offset } = m.userData as { loop: number; offset: number };
        const u = ((((offset + flow) % 1) + 1) % 1) || 0; // also for negative times (jumping back)
        m.position.copy(loops[loop].getPointAt(u));
        const oxygen = between(u, marks[loop].lung, marks[loop].body);
        (m.material as InstanceType<typeof T.MeshBasicMaterial>).color.copy(oxygen ? red : blue);
        // while lungs and body are hidden, the cells out there are hidden too (they would float in empty space)
        const out = Math.abs(m.position.x) > 1.75 || m.position.y < -2.4;
        m.visible = show > 0 || !out;
        m.scale.setScalar(fade);
      }
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [0.4, 0.6, 10.5], look: [0, 0.0, 0] },
        { pos: [0.2, 1.2, 8.0], look: [0, 0.45, 0] }, // atria and the valves below them
        { pos: [0.3, -0.2, 8.4], look: [0, -0.15, 0] }, // ventricles and the exits
        { pos: [0, -0.3, 19.5], look: [0, -0.6, 0] }, // the whole circuit
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step, _p, _t, s) {
      root.updateMatrixWorld(true);
      const w = (x: number, y: number, z: number): Vec3 => {
        const v = root.localToWorld(V(x, y, z));
        return [v.x, v.y, v.z];
      };
      const chambers = [
        { at: w(-0.85, 1.35, 0.4), text: 2, color: "#a9c4ff" },
        { at: w(-0.95, -1.15, 0.5), text: 3, color: "#a9c4ff" },
        { at: w(0.95, 1.35, 0.4), text: 4, color: "#ffb3b3" },
        { at: w(0.95, -1.5, 0.5), text: 5, color: "#ffb3b3" },
      ];
      if (step === 0) return chambers;
      if (step === 1) return [chambers[0], chambers[2], ...(atrialSqueeze(beatPhase) > 0.05 || s > 1 ? [{ at: w(0, 0.25, 0.6), text: 6 }] : [])];
      // step 2: the closing valves are only named once the step runs (the prediction question asks about them)
      if (step === 2) return [chambers[1], chambers[3], ...(s > 1.2 ? [{ at: w(0, 0.25, 0.6), text: 7 }] : [])];
      return [
        { at: w(-2.7, 3.1, 0), text: 0 }, { at: w(2.7, 3.1, 0), text: 0 },
        { at: w(-2.7, 0.0, 0.4), text: 8, color: "#ffb3b3" },
        { at: w(-0.1, -4.75, 0.3), text: 1 },
        { at: w(2.4, -3.6, 0.3), text: 9, color: "#a9c4ff" },
      ];
    },
  };
};
