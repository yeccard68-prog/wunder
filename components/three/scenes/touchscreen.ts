// How a touchscreen detects a touch: a smartphone pulled apart into its layers – cover glass, sensor stripes (rows),
// driver stripes (columns), display. Pulses run along the driver stripes; where a finger comes close to a crossing
// point, that point lights up, a bigger signal runs along its sensor stripe to the edge, and the display shows a dot.
// In the last step two fingers move apart (a gesture) and two crossing points light up at once.
// labels: 0 cover glass, 1 sensor stripes, 2 driver stripes, 3 display, 4 crossing point, 5 "bigger signal: the finger
//         is here", 6 "several fingers at once", 7 "insulated from each other"
// Simplified: a few wide stripes instead of hundreds of thin, transparent ones; the layers are pulled far apart.
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3 } from "../types";

const W = 3.4, H = 7, COLS = 6, ROWS = 11;
const colX = (i: number) => -W / 2 + (W / COLS) * (i + 0.5);
const rowY = (j: number) => -H / 2 + (H / ROWS) * (j + 0.5);

export const touchscreen: SceneFactory = ({ THREE: T, scene }) => {
  const phone = new T.Group();
  phone.rotation.set(-0.35, 0.5, 0);
  scene.add(phone);
  // the body: dark aluminium with rounded edges
  const body = new T.Mesh(new RoundedBoxGeometry(W + 0.5, H + 0.7, 0.45, 6, 0.22), new T.MeshPhysicalMaterial({ color: 0x2a2d33, metalness: 0.9, roughness: 0.32, clearcoat: 0.5 }));
  body.position.z = -0.3;
  phone.add(body);
  // the display: a glowing picture (painted once)
  const pic = document.createElement("canvas");
  pic.width = 256;
  pic.height = 512;
  const g = pic.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 256, 512);
  grad.addColorStop(0, "#2b4d8c");
  grad.addColorStop(1, "#7a3b8c");
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 16; i++) {
    g.fillStyle = "rgba(255,255,255,0.85)";
    g.beginPath();
    g.roundRect(28 + (i % 4) * 54, 70 + Math.floor(i / 4) * 66, 40, 40, 10); // app icons
    g.fill();
  }
  const picTex = new T.CanvasTexture(pic);
  picTex.colorSpace = T.SRGBColorSpace;
  const display = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ map: picTex }));
  phone.add(display);
  const dot = new T.Mesh(new T.CircleGeometry(0.28, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
  phone.add(dot);
  const dot2 = dot.clone();
  dot2.material = dot.material.clone();
  phone.add(dot2);
  // the stripes: columns (driver, orange) and rows (sensor, blue), translucent like the real, invisible conductors
  const stripeMat = (color: number) => new T.MeshPhysicalMaterial({ color, roughness: 0.2, metalness: 0.2, transparent: true, opacity: 0.55, emissive: new T.Color(color), emissiveIntensity: 0.15 });
  const driverLayer = new T.Group(), sensorLayer = new T.Group();
  const drivers = Array.from({ length: COLS }, (_, i) => {
    const m = new T.Mesh(new T.BoxGeometry((W / COLS) * 0.55, H, 0.04), stripeMat(0xe8964a));
    m.position.x = colX(i);
    driverLayer.add(m);
    return m;
  });
  const sensors = Array.from({ length: ROWS }, (_, j) => {
    const m = new T.Mesh(new T.BoxGeometry(W, (H / ROWS) * 0.5, 0.04), stripeMat(0x4aa8e8));
    m.position.y = rowY(j);
    sensorLayer.add(m);
    return m;
  });
  const insulator = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.1, depthWrite: false }));
  const glass = new T.Mesh(new RoundedBoxGeometry(W + 0.3, H + 0.5, 0.08, 4, 0.04), new T.MeshPhysicalMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.22, roughness: 0.02, clearcoat: 1, depthWrite: false }));
  phone.add(driverLayer, insulator, sensorLayer, glass);
  // pulses running along the driver stripes
  const pulseMat = new T.MeshBasicMaterial({ color: 0xffd28a });
  const pulses = drivers.map(() => {
    const m = new T.Mesh(new T.SphereGeometry(0.08, 10, 8), pulseMat);
    driverLayer.add(m);
    return m;
  });
  // crossing points that light up, and the signal running along the sensor stripe to the edge
  const spot = (color: number) => {
    const m = new T.Mesh(new T.SphereGeometry(0.2, 20, 14), new T.MeshBasicMaterial({ color, transparent: true, opacity: 0 }));
    sensorLayer.add(m);
    return m;
  };
  const hits = [spot(0xfff2a8), spot(0xfff2a8)];
  const signals = [0, 1].map(() => {
    const m = new T.Mesh(new T.SphereGeometry(0.11, 12, 10), new T.MeshBasicMaterial({ color: 0x8fe0ff }));
    sensorLayer.add(m);
    return m;
  });
  // fingers: a rounded fingertip with a nail
  const skin = new T.MeshPhysicalMaterial({ color: 0xe0ac8a, roughness: 0.55, sheen: 0.6, sheenColor: new T.Color(0xffd0c0) });
  const finger = () => {
    const f = new T.Group();
    const tip = new T.Mesh(new T.CapsuleGeometry(0.3, 2.6, 10, 24), skin);
    tip.rotation.x = Math.PI / 2;
    tip.position.z = 1.6;
    const nail = new T.Mesh(new T.SphereGeometry(0.34, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.4), new T.MeshPhysicalMaterial({ color: 0xf2d6c8, roughness: 0.2, clearcoat: 1 }));
    nail.scale.set(0.75, 0.25, 1.1);
    nail.position.set(0, 0.27, 0.7);
    f.add(tip, nail);
    phone.add(f);
    return f;
  };
  const fingers = [finger(), finger()];

  // where the touches happen: [column, row]
  const ONE: [number, number] = [3, 6];
  const TWO: [[number, number], [number, number]] = [[2, 5], [4, 7]];
  let apart = 0;
  let near: [number, number][] = [];
  return {
    update(step, _p, t, s) {
      // layers pulled apart from the first step on (one second to open)
      apart = step === 0 ? ease(clamp((s - 1.5) / 2)) : 1;
      const z = (base: number, spread: number) => base + spread * apart;
      driverLayer.position.z = z(0.12, 1.3);
      insulator.position.z = z(0.16, 2.3);
      sensorLayer.position.z = z(0.2, 3.3);
      glass.position.z = z(0.26, 4.6);
      // pulses run along every driver stripe, one after the other
      pulses.forEach((m, i) => {
        m.visible = step >= 1;
        const u = (t * 0.6 + i / COLS) % 1;
        m.position.set(colX(i), lerp(-H / 2, H / 2, u), 0.05);
      });
      // which crossing points have a finger at them
      near = step === 2 ? [ONE] : step === 3 ? TWO.map(([c, r], k) => [c, Math.round(r + (k ? 1 : -1) * Math.min(2, Math.floor(s * 0.6)))] as [number, number]) : [];
      const touchZ = sensorLayer.position.z + (glass.position.z - sensorLayer.position.z) + 0.1;
      fingers.forEach((f, k) => {
        const target = near[k];
        f.visible = step >= 2 && (k === 0 || step === 3);
        if (!target) {
          f.position.set(colX(ONE[0]), rowY(ONE[1]), touchZ + 3);
          return;
        }
        const down = ease(clamp(s / 1.2));
        f.position.set(colX(target[0]), rowY(target[1]), touchZ + 2.5 * (1 - down));
      });
      hits.forEach((m, k) => {
        const target = near[k];
        const on = target ? ease(clamp((s - 1.0) / 0.5)) : 0;
        (m.material as InstanceType<typeof T.MeshBasicMaterial>).opacity = on * (0.75 + 0.25 * Math.sin(t * 6));
        if (target) m.position.set(colX(target[0]), rowY(target[1]), 0.06);
        const sig = signals[k];
        sig.visible = on > 0.5;
        if (target) sig.position.set(lerp(colX(target[0]), W / 2 + 0.2, (t * 0.8) % 1), rowY(target[1]), 0.06);
        const d = k ? dot2 : dot;
        (d.material as InstanceType<typeof T.MeshBasicMaterial>).opacity = on * 0.85;
        if (target) d.position.set(colX(target[0]), rowY(target[1]), 0.01);
      });
      // the sensor stripe with the signal lights up
      sensors.forEach((m, j) => ((m.material as InstanceType<typeof T.MeshPhysicalMaterial>).emissiveIntensity = near.some(([, r]) => r === j) ? 0.6 : 0.15));
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [7, 3, 15], look: [0.5, 0, 1.5] },
        { pos: [14, 5, 8], look: [0.5, 0, 2.2] }, // from the side: the layers one above the other
        { pos: [13, 5, 9], look: [0.8, 0.5, 2.4] },
        { pos: [13, 5, 10], look: [0.8, 0.5, 2.4] },
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      phone.updateMatrixWorld(true);
      const w = (x: number, y: number, zz: number): Vec3 => {
        const v = phone.localToWorld(new T.Vector3(x, y, zz));
        return [v.x, v.y, v.z];
      };
      const edge = W / 2 + 0.6;
      const layers = [
        { at: w(edge, H / 2 - 0.3, glass.position.z), text: 0 },
        { at: w(edge, H / 2 - 1.1, sensorLayer.position.z), text: 1, color: "#8fd0ff" },
        { at: w(edge, H / 2 - 1.9, driverLayer.position.z), text: 2, color: "#ffc08a" },
        { at: w(edge, H / 2 - 2.7, 0), text: 3 },
      ];
      if (step === 0) return apart > 0.5 ? [...layers, { at: w(-edge - 0.4, 0, insulator.position.z), text: 7 }] : [];
      if (step === 1) return [layers[1], layers[2], { at: w(colX(ONE[0]), rowY(ONE[1]) + 0.6, sensorLayer.position.z), text: 4, color: "#fff2a8" }];
      if (step === 2) return near.length ? [{ at: w(W / 2 + 0.4, rowY(ONE[1]) + 0.7, sensorLayer.position.z), text: 5, color: "#fff2a8" }] : [];
      return [{ at: w(0, H / 2 + 0.9, glass.position.z), text: 6, color: "#fff2a8" }];
    },
    stage: { shadows: true },
  };
};
