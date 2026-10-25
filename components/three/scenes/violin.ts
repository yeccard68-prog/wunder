// How a violin sounds: a violin built in code – spruce top with f-holes, maple ribs and back, neck, fingerboard, scroll,
// bridge, four strings – and a bow. The bow strokes the D string; close up, the string sticks to the hair, slips, and
// vibrates (a kink running up and down it, as in a bowed string). Then the top turns see-through: the bridge rocks, the
// sound post under it carries the vibration to the back, and sound rings leave the f-holes.
// labels: 0 strings, 1 body, 2 f-holes, 3 bow with horsehair, 4 rosin, 5 "stick – slip – stick", 6 bridge, 7 sound post,
//         8 "the body vibrates too"
// Simplified: the string's motion is shown hugely enlarged and slowed down.
// Units: 1 = 10 cm; the violin stands upright, its top facing +z.
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const TOP_Z = 0.42; // height of the top above the back
const BRIDGE_Y = -0.35, NUT_Y = 3.15, TAIL_Y = -1.45;
const STRING_X = [-0.105, -0.035, 0.035, 0.105];
const bridgeZ = TOP_Z + 0.27, nutZ = TOP_Z + 0.13;
const strZ = (y: number) => (y >= BRIDGE_Y ? lerp(bridgeZ, nutZ, (y - BRIDGE_Y) / (NUT_Y - BRIDGE_Y)) : lerp(TOP_Z + 0.12, bridgeZ, (y - TAIL_Y) / (BRIDGE_Y - TAIL_Y)));

export const violin: SceneFactory = ({ THREE: T, scene }) => {
  const canvas = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  };
  const inst = new T.Group();
  inst.rotation.set(-0.25, 0.35, 0);
  scene.add(inst);
  // the outline of the body: lower bout, waist (C-bouts), upper bout – one half, mirrored
  const half: [number, number][] = [[0, -1.78], [0.55, -1.7], [0.95, -1.35], [1.03, -0.9], [0.9, -0.45], [0.62, -0.18], [0.57, 0.12], [0.66, 0.42], [0.82, 0.8], [0.8, 1.25], [0.5, 1.68], [0, 1.78]];
  const outline = new T.CatmullRomCurve3([...half, ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y] as [number, number])].map(([x, y]) => new T.Vector3(x, y, 0)), true, "centripetal");
  const shape = new T.Shape(outline.getPoints(120).map((p) => new T.Vector2(p.x, p.y)));
  // spruce top with its two f-holes (painted), flamed maple for the sides and back
  const spruce = canvas(256, 512, (g) => {
    g.fillStyle = "#c98a3c";
    g.fillRect(0, 0, 256, 512);
    for (let x = 0; x < 256; x += 3) {
      g.fillStyle = `rgba(110,60,20,${0.08 + 0.12 * rand(x, 1)})`;
      g.fillRect(x, 0, 1, 512);
    }
    g.fillStyle = "#1a0e06";
    for (const side of [-1, 1]) {
      // an f-hole: a long S stroke with round eyes at both ends
      const cx = 128 + side * 46;
      g.lineWidth = 7;
      g.strokeStyle = "#1a0e06";
      g.beginPath();
      g.moveTo(cx - side * 10, 200);
      g.bezierCurveTo(cx + side * 18, 230, cx - side * 18, 290, cx + side * 10, 318);
      g.stroke();
      g.beginPath();
      g.arc(cx - side * 12, 196, 7, 0, Math.PI * 2);
      g.arc(cx + side * 12, 322, 7, 0, Math.PI * 2);
      g.fill();
    }
  });
  spruce.repeat.set(1 / 2.1, 1 / 3.6);
  spruce.offset.set(1.05 / 2.1, 1.8 / 3.6);
  const flame = canvas(256, 64, (g) => {
    g.fillStyle = "#9a4f22";
    g.fillRect(0, 0, 256, 64);
    for (let x = 0; x < 256; x += 6) {
      g.fillStyle = `rgba(255,200,140,${0.15 + 0.15 * Math.sin(x * 0.3)})`;
      g.fillRect(x, 0, 3, 64);
    }
  });
  const varnish = { roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12 };
  const topMat = new T.MeshPhysicalMaterial({ map: spruce, ...varnish, transparent: true, opacity: 1 });
  const ribMat = new T.MeshPhysicalMaterial({ map: flame, ...varnish });
  const body = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: TOP_Z - 0.1, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.04, bevelSegments: 4, curveSegments: 60 }), [topMat, ribMat]);
  body.position.z = 0.06;
  inst.add(body);
  const ebony = new T.MeshPhysicalMaterial({ color: 0x121010, roughness: 0.3, clearcoat: 0.6 });
  const maple = new T.MeshPhysicalMaterial({ map: flame, ...varnish });
  const neck = new T.Mesh(new T.BoxGeometry(0.24, 1.4, 0.28), maple);
  neck.position.set(0, 2.45, TOP_Z - 0.08);
  const board = new T.Mesh(new T.BoxGeometry(0.28, 2.3, 0.06), ebony);
  board.position.set(0, 2.05, TOP_Z + 0.1);
  board.rotation.x = 0.03;
  const pegbox = new T.Mesh(new T.BoxGeometry(0.2, 0.55, 0.24), maple);
  pegbox.position.set(0, 3.42, TOP_Z - 0.05);
  const scroll = new T.Mesh(new T.TorusGeometry(0.12, 0.06, 12, 32, Math.PI * 1.6), maple);
  scroll.rotation.y = Math.PI / 2;
  scroll.position.set(0, 3.78, TOP_Z - 0.02);
  const tail = new T.Mesh(new T.BoxGeometry(0.34, 0.75, 0.05), ebony);
  tail.position.set(0, -1.25, TOP_Z + 0.1);
  inst.add(neck, board, pegbox, scroll, tail);
  for (let i = 0; i < 4; i++) {
    const peg = new T.Mesh(new T.CylinderGeometry(0.025, 0.035, 0.36, 10), ebony);
    peg.rotation.z = Math.PI / 2;
    peg.position.set(0, 3.25 + i * 0.12, TOP_Z - 0.05);
    inst.add(peg);
  }
  // bridge: a thin maple plate standing on the top, and the sound post under its treble foot
  const bridgeShape = new T.Shape([new T.Vector2(-0.22, 0), new T.Vector2(0.22, 0), new T.Vector2(0.17, 0.12), new T.Vector2(0.16, 0.27), new T.Vector2(-0.16, 0.27), new T.Vector2(-0.17, 0.12)]);
  const bridge = new T.Mesh(new T.ExtrudeGeometry(bridgeShape, { depth: 0.03, bevelEnabled: false }), new T.MeshPhysicalMaterial({ color: 0xe8d2a8, roughness: 0.5 }));
  bridge.rotation.x = Math.PI / 2;
  bridge.position.set(0, BRIDGE_Y + 0.015, TOP_Z);
  inst.add(bridge);
  const post = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, TOP_Z - 0.04, 12), new T.MeshPhysicalMaterial({ color: 0xd9b27a, roughness: 0.6 }));
  post.rotation.x = Math.PI / 2;
  post.position.set(0.12, BRIDGE_Y - 0.06, TOP_Z / 2 + 0.02);
  inst.add(post);
  // strings: fixed parts as tubes; the played D string (index 1) between bridge and nut is redrawn when it vibrates
  const steel = new T.MeshPhysicalMaterial({ color: 0xd8d8d0, metalness: 1, roughness: 0.25 });
  STRING_X.forEach((x, i) => {
    const pts = [new T.Vector3(x * 0.6, TAIL_Y + 0.25, strZ(TAIL_Y + 0.25)), new T.Vector3(x, BRIDGE_Y, bridgeZ)];
    if (i !== 1) pts.push(new T.Vector3(x * 0.55, NUT_Y, nutZ));
    inst.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.006 + i * 0.0015, 5), steel));
  });
  const played = new T.Mesh(new T.BufferGeometry(), new T.MeshPhysicalMaterial({ color: 0xffe9b0, metalness: 1, roughness: 0.25, emissive: new T.Color(0x3a2a00) }));
  inst.add(played);
  const D = 41;
  const drawString = (amp: number, phase: number) => {
    const pts: InstanceType<typeof T.Vector3>[] = [];
    for (let k = 0; k < D; k++) {
      const u = k / (D - 1);
      // a bowed string: a straight-sided shape whose corner runs up and down the string
      const corner = 0.5 + 0.5 * Math.sin(phase);
      const side = u < corner ? u / Math.max(0.01, corner) : (1 - u) / Math.max(0.01, 1 - corner);
      const y = lerp(BRIDGE_Y, NUT_Y, u);
      pts.push(new T.Vector3(lerp(STRING_X[1], STRING_X[1] * 0.55, u) + amp * side * Math.cos(phase), y, strZ(y)));
    }
    played.geometry.dispose();
    played.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 80, 0.011, 6);
  };
  // the bow: a slightly curved pernambuco stick and a ribbon of horsehair, crossing the D string near the bridge
  const bow = new T.Group();
  const stick = new T.Mesh(new T.TubeGeometry(new T.QuadraticBezierCurve3(new T.Vector3(-3.6, 0, 0.22), new T.Vector3(0, 0, 0.12), new T.Vector3(3.6, 0, 0.2)), 40, 0.035, 8), new T.MeshPhysicalMaterial({ color: 0x5a2a12, roughness: 0.35, clearcoat: 0.8 }));
  const hair = new T.Mesh(new T.BoxGeometry(7.0, 0.07, 0.008), new T.MeshPhysicalMaterial({ color: 0xf2ece0, roughness: 0.8, sheen: 0.6 }));
  const frog = new T.Mesh(new T.BoxGeometry(0.4, 0.12, 0.22), ebony);
  frog.position.set(-3.3, 0, 0.11);
  bow.add(stick, hair, frog);
  bow.position.set(0, 0.15, bridgeZ + 0.02);
  bow.rotation.z = -0.08;
  inst.add(bow);
  // rosin dust and sound rings
  const dust = Array.from({ length: 30 }, (_, i) => {
    const m = new T.Mesh(new T.SphereGeometry(0.012, 6, 4), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
    m.userData.seed = i;
    inst.add(m);
    return m;
  });
  const rings = Array.from({ length: 8 }, (_, i) => {
    const m = new T.Mesh(new T.TorusGeometry(0.3, 0.015, 6, 40), new T.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0 }));
    m.userData = { offset: (i % 4) / 4, side: i < 4 ? -1 : 1 };
    inst.add(m);
    return m;
  });

  return {
    update(step, _p, t, s) {
      const bowing = step >= 1;
      bow.visible = bowing;
      bow.position.x = bowing ? 1.6 * Math.sin(t * 0.9) : 0;
      // the string vibrates from step 3 on
      const amp = step >= 2 ? 0.05 : 0;
      drawString(amp, t * (step === 2 ? 2.2 : 14));
      dust.forEach((m) => {
        const k = m.userData.seed as number;
        m.visible = step === 1 || step === 2;
        const u = (t * 0.6 + k * 0.137) % 1;
        m.position.set(STRING_X[1] + (rand(k, 1) - 0.5) * 0.2, 0.15 + (rand(k, 2) - 0.5) * 0.1, bridgeZ + 0.02 + u * 0.4);
        (m.material as InstanceType<typeof T.MeshBasicMaterial>).opacity = 0.8 * (1 - u);
      });
      // last step: the top turns see-through, the bridge rocks, rings leave the f-holes
      const inside = step === 3 ? ease(clamp(s / 1.2)) : 0;
      topMat.opacity = 1 - 0.65 * inside;
      topMat.depthWrite = inside < 0.5;
      bridge.rotation.y = step === 3 ? 0.04 * Math.sin(t * 30) : 0;
      body.scale.z = 1 + (step === 3 ? 0.01 * Math.sin(t * 30) : 0);
      rings.forEach((m) => {
        const { offset, side } = m.userData as { offset: number; side: number };
        const u = (offset + t * 0.4) % 1;
        (m.material as InstanceType<typeof T.MeshBasicMaterial>).opacity = step === 3 ? (1 - u) * 0.8 : 0;
        m.position.set(side * 0.18, -0.45, TOP_Z + 0.1 + u * 0.9);
        m.scale.setScalar(0.4 + u * 2.2);
      });
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [3.2, 1.5, 10], look: [0.3, 0.9, 0] }, // the whole violin
        { pos: [3.6, 1.2, 5.2], look: [0.3, 0.1, 0.4] }, // the bow on the string
        { pos: [1.4, -2.4, 2.6], look: [0, 0.6, 0.6] }, // along the string
        { pos: [2.6, -0.6, 4.2], look: [0.1, -0.4, 0.3] }, // into the body under the bridge
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      inst.updateMatrixWorld(true);
      const w = (x: number, y: number, z: number): Vec3 => {
        const v = inst.localToWorld(new T.Vector3(x, y, z));
        return [v.x, v.y, v.z];
      };
      if (step === 0) return [{ at: w(0.35, 1.4, nutZ + 0.1), text: 0 }, { at: w(-1.25, -0.9, 0.2), text: 1 }, { at: w(0.75, -0.45, TOP_Z + 0.1), text: 2 }];
      if (step === 1) return [{ at: w(-1.6, 0.4, bridgeZ + 0.2), text: 3, color: "#f2ece0" }, { at: w(0.4, 0.45, bridgeZ + 0.3), text: 4, color: "#ffffff" }];
      if (step === 2) return [{ at: w(0.35, 1.2, nutZ + 0.15), text: 5, color: "#ffd24a" }];
      return [{ at: w(-0.45, BRIDGE_Y + 0.1, bridgeZ + 0.05), text: 6 }, { at: w(0.45, BRIDGE_Y - 0.2, TOP_Z / 2), text: 7, color: "#e8c08a" }, { at: w(0, -1.3, TOP_Z + 0.9), text: 8, color: "#ffd24a" }];
    },
    stage: { shadows: true },
  };
};
