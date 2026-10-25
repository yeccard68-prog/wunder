// How the assembly line changed production: a conveyor belt carries car frames in the style of the Model T through three
// stations – wheels, engine, body. At each station a worker repeats one short movement. A clock above the line ticks the
// cycle time; next to it, stacks of identical parts. In the last step the line runs full, a counter shows ×8 and two
// arrows show the price falling and the wages rising.
// labels: 0 station 1: wheels, 1 station 2: engine, 2 station 3: body, 3 conveyor belt, 4 cycle time, 5 "identical parts,
//         exactly fitting", 6 output ×8, 7 price falls, 8 wages rise
// Simplified: three stations instead of dozens, cars move in jumps of one station per cycle.
// Units: 1 = 1 m.
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3 } from "../types";

const STATIONS = [-4, 0, 4]; // x of the three stations
const GAP = 4; // distance from car to car
const CYCLE = 2.2; // seconds per cycle in the animation

export const assembly: SceneFactory = ({ THREE: T, scene }) => {
  const black = new T.MeshPhysicalMaterial({ color: 0x15161a, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 });
  const steel = new T.MeshPhysicalMaterial({ color: 0x8a8d94, metalness: 0.9, roughness: 0.35 });
  const rubber = new T.MeshPhysicalMaterial({ color: 0x1d1d1d, roughness: 0.8 });
  const wood = new T.MeshPhysicalMaterial({ color: 0x8a5a32, roughness: 0.7 });
  // the factory floor and the belt
  const floor = new T.Mesh(new T.PlaneGeometry(40, 20), new T.MeshStandardMaterial({ color: 0x5b5752, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const beltTex = (() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 32;
    const g = c.getContext("2d")!;
    g.fillStyle = "#2b2b2e";
    g.fillRect(0, 0, 256, 32);
    g.fillStyle = "#3d3d42";
    for (let x = 0; x < 256; x += 16) g.fillRect(x, 0, 6, 32);
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(8, 1);
    return t;
  })();
  const belt = new T.Mesh(new RoundedBoxGeometry(18, 0.25, 2.2, 3, 0.1), new T.MeshStandardMaterial({ map: beltTex, roughness: 0.7 }));
  belt.position.set(0, 0.6, 0);
  scene.add(belt);
  for (let x = -8.5; x <= 8.5; x += 1.4) {
    const leg = new T.Mesh(new T.BoxGeometry(0.12, 0.5, 2.0), steel);
    leg.position.set(x, 0.25, 0);
    scene.add(leg);
  }
  // a car: chassis, four spoked wheels, engine block, black body with a roof
  const car = () => {
    const g = new T.Group();
    const frame = new T.Mesh(new RoundedBoxGeometry(2.4, 0.12, 0.9, 2, 0.04), steel);
    frame.position.y = 0.35;
    g.add(frame);
    const wheels = [-0.8, 0.8].flatMap((x) =>
      [-0.55, 0.55].map((z) => {
        const w = new T.Group();
        const tyre = new T.Mesh(new T.TorusGeometry(0.3, 0.06, 10, 24), rubber);
        const hub = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.1, 12), steel);
        hub.rotation.x = Math.PI / 2;
        w.add(tyre, hub);
        for (let k = 0; k < 6; k++) {
          const spoke = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, 0.56, 6), wood);
          spoke.rotation.z = (k * Math.PI) / 6;
          w.add(spoke);
        }
        w.position.set(x, 0.32, z);
        g.add(w);
        return w;
      }),
    );
    const engine = new T.Mesh(new RoundedBoxGeometry(0.6, 0.4, 0.6, 2, 0.05), new T.MeshPhysicalMaterial({ color: 0x4a4d52, metalness: 0.7, roughness: 0.45 }));
    engine.position.set(0.75, 0.62, 0);
    g.add(engine);
    const bodyGroup = new T.Group();
    const tub = new T.Mesh(new RoundedBoxGeometry(1.5, 0.5, 0.95, 3, 0.08), black);
    tub.position.set(-0.25, 0.68, 0);
    const hood = new T.Mesh(new RoundedBoxGeometry(0.7, 0.36, 0.7, 3, 0.06), black);
    hood.position.set(0.8, 0.62, 0);
    const roof = new T.Mesh(new RoundedBoxGeometry(1.0, 0.06, 1.0, 2, 0.02), black);
    roof.position.set(-0.35, 1.55, 0);
    bodyGroup.add(tub, hood, roof);
    for (const [x, z] of [[-0.8, -0.45], [-0.8, 0.45], [0.1, -0.45], [0.1, 0.45]]) {
      const pillar = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, 0.65, 6), black);
      pillar.position.set(x, 1.22, z);
      bodyGroup.add(pillar);
    }
    g.add(bodyGroup);
    scene.add(g);
    return { g, wheels, engine, body: bodyGroup };
  };
  const CARS = 7;
  const cars = Array.from({ length: CARS }, () => car());
  // workers: a simple figure per station with an arm that moves
  const worker = (x: number) => {
    const g = new T.Group();
    const overall = new T.MeshPhysicalMaterial({ color: 0x3a5a8a, roughness: 0.8 });
    const torso = new T.Mesh(new T.CapsuleGeometry(0.25, 0.7, 6, 12), overall);
    torso.position.y = 1.15;
    const head = new T.Mesh(new T.SphereGeometry(0.2, 16, 12), new T.MeshPhysicalMaterial({ color: 0xe0ac8a, roughness: 0.6 }));
    head.position.y = 1.85;
    const cap = new T.Mesh(new T.CylinderGeometry(0.21, 0.21, 0.08, 16), new T.MeshPhysicalMaterial({ color: 0x2a2a2a }));
    cap.position.y = 2.02;
    const arm = new T.Mesh(new T.CapsuleGeometry(0.07, 0.6, 4, 8), overall);
    arm.position.set(0, 1.35, 0.25);
    arm.rotation.x = 1.0;
    for (const lx of [-0.12, 0.12]) {
      const leg = new T.Mesh(new T.CapsuleGeometry(0.1, 0.6, 4, 8), new T.MeshPhysicalMaterial({ color: 0x2c3e5c }));
      leg.position.set(lx, 0.42, 0);
      g.add(leg);
    }
    g.add(torso, head, cap, arm);
    g.position.set(x, 0, -1.7);
    scene.add(g);
    return { g, arm };
  };
  const workers = STATIONS.map(worker);
  // stacks of identical parts next to each station
  const parts = STATIONS.map((x, i) => {
    const g = new T.Group();
    for (let k = 0; k < 4; k++) {
      const m = i === 0 ? new T.Mesh(new T.TorusGeometry(0.3, 0.06, 8, 20), rubber) : i === 1 ? new T.Mesh(new RoundedBoxGeometry(0.6, 0.4, 0.6, 2, 0.05), steel) : new T.Mesh(new RoundedBoxGeometry(1.0, 0.25, 0.7, 2, 0.05), black);
      if (i === 0) m.rotation.x = Math.PI / 2;
      m.position.y = 0.15 + k * (i === 0 ? 0.13 : i === 1 ? 0.42 : 0.27);
      g.add(m);
    }
    g.position.set(x + 1.2, 0, -2.6);
    scene.add(g);
    return g;
  });
  // the cycle clock above the line: a dial and a hand
  const clock = new T.Group();
  const dial = new T.Mesh(new T.CylinderGeometry(0.6, 0.6, 0.08, 40), new T.MeshPhysicalMaterial({ color: 0xf4efe4, roughness: 0.4 }));
  dial.rotation.x = Math.PI / 2;
  const hand = new T.Mesh(new T.BoxGeometry(0.05, 0.5, 0.02), new T.MeshBasicMaterial({ color: 0xc23b30 }));
  hand.geometry.translate(0, 0.25, 0.06);
  clock.add(dial, hand);
  clock.position.set(0, 3.6, -0.8);
  scene.add(clock);
  // arrows for the last step: price down (red), wages up (green)
  const arrow = (color: number, up: boolean) => {
    const a = new T.ArrowHelper(new T.Vector3(0, up ? 1 : -1, 0), new T.Vector3(), 1.4, color, 0.45, 0.35);
    scene.add(a);
    return a;
  };
  const priceArrow = arrow(0xd0473c, false), wageArrow = arrow(0x3cc775, true);

  let full = false;
  return {
    update(step, _p, t, s) {
      // the line moves one station per cycle, with a short ease; in the last step it runs faster and full
      const speed = step === 3 ? 2.2 : 1;
      const cycles = step === 0 ? 0 : (s * speed) / CYCLE;
      const whole = Math.floor(cycles), into = ease(clamp(((cycles - whole) - 0.55) / 0.45));
      const shift = (whole + into) * GAP;
      beltTex.offset.x = -shift * 0.45;
      full = step === 3;
      cars.forEach((c, i) => {
        const x = -12 + ((i * GAP + shift) % (CARS * GAP));
        c.g.position.set(x, 0.72, 0);
        c.g.visible = step === 0 ? i === 3 : full || i % 2 === 1;
        // a car has got what each station it has passed adds
        const passed = (n: number) => step === 0 || x > STATIONS[n] - 0.1;
        c.wheels.forEach((w) => (w.visible = passed(0)));
        c.engine.visible = passed(1);
        c.body.visible = passed(2);
      });
      // workers repeat one movement per cycle
      workers.forEach(({ arm }) => (arm.rotation.x = step === 0 ? 1.0 : 0.6 + 0.6 * Math.abs(Math.sin(cycles * Math.PI))));
      hand.rotation.z = -((cycles % 1) * Math.PI * 2);
      clock.visible = step >= 2;
      parts.forEach((g) => (g.visible = step >= 2));
      priceArrow.visible = wageArrow.visible = step === 3 && s > 2;
      priceArrow.position.set(6.6, 3.6 + 0.2 * Math.sin(t * 2), 0);
      wageArrow.position.set(8.2, 2.2 + 0.2 * Math.sin(t * 2 + 1), 0);
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [3, 3.5, 8], look: [0, 1, 0] }, // one car and its parts
        { pos: [2, 6, 13], look: [0, 1, 0] }, // the line with its stations
        { pos: [1.5, 5.5, 12], look: [0, 1.6, -0.5] }, // clock and parts
        { pos: [2, 8, 17], look: [1, 1.5, 0] }, // the full line
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      const stations = STATIONS.map((x, i) => ({ at: [x, 2.6, -1.7] as Vec3, text: i }));
      if (step === 0) return stations;
      if (step === 1) return [...stations, { at: [-7, 1.2, 1.3] as Vec3, text: 3 }];
      if (step === 2) return [{ at: [0, 4.5, -0.8] as Vec3, text: 4, color: "#ffd24a" }, { at: [5.2, 1.8, -2.6] as Vec3, text: 5 }];
      return [{ at: [0, 4.6, -0.8] as Vec3, text: 6, color: "#ffd24a" }, ...(full ? [{ at: [6.6, 5.0, 0] as Vec3, text: 7, color: "#ff8f7a" }, { at: [8.2, 4.0, 0] as Vec3, text: 8, color: "#7fe0a0" }] : [])];
    },
    stage: { shadows: true },
  };
};
