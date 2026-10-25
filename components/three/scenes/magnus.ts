// Why a ball with spin flies a curve: on the pitch a ball kicked with spin bends into the goal (step 1 and 4, the other
// way round in step 4). Steps 2 and 3 look at the spinning ball close up: little air puffs stream past it – faster on
// the side that turns with the air, slower on the other – and an arrow shows the sideways force.
// labels: 0 goal, 1 ball with spin, 2 air is dragged along, 3 faster air, 4 slower air, 5 lower pressure, 6 force across
//         the flight, 7 "the path bends", 8 "spun the other way: other curve"
// Simplified: the curve is exaggerated, the air is shown as puffs, gravity's part of the path is only hinted at.
// Units: metres on the pitch; the close-up stands far to the side of the pitch (x = 60).
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const LAB: Vec3 = [60, 2, 0]; // where the close-up stands
const START: Vec3 = [-1, 0.11, 14], END: Vec3 = [2.6, 1.7, -12];

export const magnus: SceneFactory = ({ THREE: T, scene }) => {
  const canvas = (w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d")!);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  };
  // pitch with mown stripes, white lines
  const grass = canvas(512, 512, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#3f8a3a" : "#4a9a43";
      g.fillRect(0, i * 64, 512, 64);
    }
  });
  const pitch = new T.Mesh(new T.PlaneGeometry(70, 60), new T.MeshStandardMaterial({ map: grass, roughness: 0.95 }));
  pitch.rotation.x = -Math.PI / 2;
  scene.add(pitch);
  const line = (w: number, d: number, at: Vec3) => {
    const m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ color: 0xf4f4f0 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(...at);
    scene.add(m);
  };
  line(40, 0.12, [0, 0.01, -12]);
  line(16.5 * 2, 0.12, [0, 0.01, 4.5]);
  // goal: white posts and crossbar, a net behind
  const white = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.3, clearcoat: 0.6 });
  for (const x of [-3.66, 3.66]) {
    const post = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 2.44, 16), white);
    post.position.set(x, 1.22, -12);
    scene.add(post);
  }
  const bar = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 7.44, 16), white);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 2.44, -12);
  scene.add(bar);
  const netTex = canvas(128, 128, (g) => {
    g.strokeStyle = "rgba(255,255,255,0.8)";
    g.lineWidth = 2;
    for (let i = 0; i <= 128; i += 16) {
      g.beginPath();
      g.moveTo(i, 0);
      g.lineTo(i, 128);
      g.moveTo(0, i);
      g.lineTo(128, i);
      g.stroke();
    }
  });
  netTex.wrapS = netTex.wrapT = T.RepeatWrapping;
  netTex.repeat.set(10, 4);
  const net = new T.Mesh(new T.PlaneGeometry(7.32, 2.44), new T.MeshBasicMaterial({ map: netTex, transparent: true, side: T.DoubleSide, depthWrite: false }));
  net.position.set(0, 1.22, -13.2);
  scene.add(net);
  // a football: white with dark patches
  const leather = canvas(512, 256, (g) => {
    g.fillStyle = "#f6f6f2";
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = "#1b1b1d";
    for (let i = 0; i < 14; i++) {
      g.beginPath();
      const x = (i % 7) * 73 + (Math.floor(i / 7) % 2) * 36, y = 70 + Math.floor(i / 7) * 110;
      for (let k = 0; k < 5; k++) g.lineTo(x + 20 * Math.cos((k * 2 * Math.PI) / 5), y + 20 * Math.sin((k * 2 * Math.PI) / 5));
      g.fill();
    }
  });
  const ballMat = new T.MeshPhysicalMaterial({ map: leather, roughness: 0.35, clearcoat: 0.6 });
  const ball = new T.Mesh(new T.SphereGeometry(0.11, 32, 24), ballMat);
  scene.add(ball);
  const trail = Array.from({ length: 26 }, () => {
    const m = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), new T.MeshBasicMaterial({ color: 0xffe28a, transparent: true, opacity: 0.8 }));
    scene.add(m);
    return m;
  });
  // flight: forwards to the goal, the sideways part bending with the spin (dir = +1 or −1)
  const flight = (u: number, dir: number): Vec3 => {
    const endX = dir > 0 ? END[0] : -END[0];
    const x = lerp(START[0], endX, u) - dir * 7 * u * (1 - u);
    const y = lerp(START[1], END[1], u) + 3.2 * u * (1 - u);
    return [x, y, lerp(START[2], END[2], u)];
  };

  // ---------- close-up: a big spinning ball with air streaming past ----------
  const lab = new T.Group();
  lab.position.set(...LAB);
  scene.add(lab);
  const big = new T.Mesh(new T.SphereGeometry(1, 48, 32), ballMat);
  lab.add(big);
  const ROWS = [-2.4, -1.9, -1.45, 1.45, 1.9, 2.4];
  const puffs = Array.from({ length: 90 }, (_, i) => {
    const m = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), new T.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.85 }));
    m.userData = { row: ROWS[i % ROWS.length], offset: (Math.floor(i / ROWS.length) + 0.3 * rand(i, 3)) / 15, y: 0 };
    if ((m.userData.row as number) < 0) (m.material as InstanceType<typeof T.MeshBasicMaterial>).color.setHex(0x7fe3ff); // the fast side a little brighter
    lab.add(m);
    return m;
  });
  const force = new T.ArrowHelper(new T.Vector3(-1, 0, 0), new T.Vector3(), 2, 0xffd24a, 0.5, 0.35);
  lab.add(force);
  const spinArrow = new T.Mesh(new T.TorusGeometry(1.35, 0.04, 8, 64, Math.PI * 1.4), new T.MeshBasicMaterial({ color: 0xffd24a }));
  spinArrow.rotation.x = Math.PI / 2;
  lab.add(spinArrow);

  let dir = 1;
  let u = 0;
  return {
    update(step, _p, t, s) {
      // the pitch: steps 1 and 4 (the other spin in step 4)
      dir = step === 3 ? -1 : 1;
      const onPitch = step === 0 || step === 3;
      u = onPitch ? clamp((s - 0.8) / 3.2) : 0;
      const pos = flight(u, dir);
      ball.position.set(...pos);
      ball.rotation.y += 0.25 * dir;
      ball.visible = onPitch;
      trail.forEach((m, k) => {
        const uk = (k / trail.length) * u;
        m.visible = onPitch && uk > 0.01;
        m.position.set(...flight(uk, dir));
      });
      // the close-up: steps 2 and 3
      big.rotation.y = t * 2.2 * dir;
      puffs.forEach((m) => {
        const { row, offset, y } = m.userData as { row: number; offset: number; y: number };
        // the side that turns with the oncoming air (−x for this spin) gets faster air
        const fast = row < 0 ? 1.6 : 0.65;
        const z = -6 + ((offset + t * 0.12 * fast * 4) % 1) * 12;
        // close to the ball the air goes round it
        const near = Math.max(0, 1.6 - Math.hypot(row * 0.6, z) / 1.6);
        m.position.set(row + Math.sign(row) * near * 0.5, y, z);
        m.scale.set(1, 1, fast > 1 ? 3.2 : 1.4); // stretched along the flow: longer where it is faster
      });
      force.visible = step === 2;
      force.setLength(1.6 + 0.2 * Math.sin(t * 4), 0.5, 0.35);
      force.position.set(-1.1, 0, 0);
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const pitchView = { pos: [9, 6, 22] as Vec3, look: [0.5, 1, -2] as Vec3 };
      const labView = { pos: [LAB[0] + 0.3, LAB[1] + 8.5, LAB[2] + 3.2] as Vec3, look: [LAB[0], LAB[1], LAB[2]] as Vec3 };
      const views = [pitchView, labView, labView, pitchView];
      const from = views[Math.max(0, step - 1)];
      // pitch ↔ close-up is a cut, not a flight across the pitch
      const cut = (from === pitchView) !== (views[step] === pitchView);
      return cut ? views[step] : { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      const L = (x: number, y: number, z: number): Vec3 => [LAB[0] + x, LAB[1] + y, LAB[2] + z];
      if (step === 0) return [{ at: [0, 3.2, -12] as Vec3, text: 0 }, { at: [START[0] - 1.5, 1.2, START[2]] as Vec3, text: 1, color: "#ffd24a" }, ...(u > 0.6 ? [{ at: [flight(0.5, 1)[0] - 1.8, 3, 1] as Vec3, text: 7, color: "#ffe28a" }] : [])];
      if (step === 1) return [{ at: L(0, 1.9, 0), text: 2, color: "#ffd24a" }, { at: L(-1.7, 0.5, 2.6), text: 3, color: "#8fe0ff" }, { at: L(1.7, 0.5, 2.6), text: 4, color: "#c8d4e0" }];
      if (step === 2) return [{ at: L(-1.7, 0.5, 2.6), text: 5, color: "#8fe0ff" }, { at: L(-2.2, -0.9, 0), text: 6, color: "#ffd24a" }];
      return [{ at: [0, 3.2, -12] as Vec3, text: 0 }, ...(u > 0.6 ? [{ at: [flight(0.5, -1)[0] + 1.8, 3, 1] as Vec3, text: 8, color: "#ffe28a" }] : [])];
    },
    stage: { shadows: true },
  };
};
