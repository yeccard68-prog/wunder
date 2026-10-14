// A heat pump: the refrigerant takes up heat from the outside air, the compressor makes it hot, it gives
// the heat to the heating water, and the expansion valve makes it cold again.
// labels: 0 evaporator, 1 compressor, 2 condenser, 3 expansion valve, 4 heat from the outside air,
//         5 hot gas, 6 heat for the house, 7 very cold, 8 electricity, 9 outside, 10 inside,
//         11 from 1 kWh of electricity: 3–4 kWh of heat
// A diagram, not a real unit: the refrigerant runs clockwise; blue = cold, red = hot.
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const TOP = 1.9;
const BOT = -1.9;
const WALL = 1.6; // the house wall: outside on the left, inside on the right
const z = 0;
// the refrigerant's way round, starting just behind the valve
const EVAP: Vec3[] = [[-2.6, BOT, z], [-2.6, -1.2, z], [-3.8, -1.2, z], [-3.8, -0.6, z], [-2.6, -0.6, z], [-2.6, 0, z], [-3.8, 0, z], [-3.8, 0.6, z], [-2.6, 0.6, z], [-2.6, 1.2, z], [-3.8, 1.2, z], [-3.8, TOP, z]];
const COND: Vec3[] = [[3.8, TOP, z], [3.8, 1.2, z], [2.6, 1.2, z], [2.6, 0.6, z], [3.8, 0.6, z], [3.8, 0, z], [2.6, 0, z], [2.6, -0.6, z], [3.8, -0.6, z], [3.8, -1.2, z], [2.6, -1.2, z], [2.6, BOT, z]];
const PATH: Vec3[] = [[-0.35, BOT, z], ...EVAP, [-0.6, TOP, z], [0.6, TOP, z], ...COND, [0.35, BOT, z], [-0.35, BOT, z]];
const LENGTHS = PATH.slice(1).map((q, i) => Math.hypot(q[0] - PATH[i][0], q[1] - PATH[i][1]));
const TOTAL = LENGTHS.reduce((a, b) => a + b, 0);
const upTo = (n: number) => LENGTHS.slice(0, n).reduce((a, b) => a + b, 0) / TOTAL;
// where things happen, as a share of the way round
const U_EVAP_IN = upTo(1);
const U_EVAP_OUT = upTo(EVAP.length);
const U_COMP_IN = upTo(EVAP.length + 1);
const U_COMP_OUT = upTo(EVAP.length + 2);
const U_COND_OUT = upTo(EVAP.length + 2 + COND.length);
const U_VALVE_IN = upTo(EVAP.length + 3 + COND.length);

export const heatpump: SceneFactory = ({ THREE: T, scene }) => {
  const copper = new T.MeshStandardMaterial({ color: 0xc8793a, metalness: 0.9, roughness: 0.3 });
  const dark = new T.MeshStandardMaterial({ color: 0x34373d, metalness: 0.75, roughness: 0.4, emissive: new T.Color(0xff7a3a), emissiveIntensity: 0 });
  const steel = new T.MeshStandardMaterial({ color: 0xc3c6cc, metalness: 0.95, roughness: 0.3 });
  // backdrop: cold outside, warm inside, the wall in between
  const outside = new T.Mesh(new T.PlaneGeometry(9.5, 10.5), new T.MeshStandardMaterial({ color: 0x29445f, roughness: 0.95 }));
  outside.position.set(WALL - 4.75, -0.3, -1.1);
  const inside = new T.Mesh(new T.PlaneGeometry(7.5, 10.5), new T.MeshStandardMaterial({ color: 0x5b4334, roughness: 0.95 }));
  inside.position.set(WALL + 3.75, -0.3, -1.1);
  const wall = new T.Mesh(new T.BoxGeometry(0.35, 10.5, 1.4), new T.MeshStandardMaterial({ color: 0xd9d2c3, roughness: 0.9, transparent: true, opacity: 0.55, depthWrite: false }));
  wall.position.set(WALL, -0.3, -0.45);
  wall.renderOrder = 2;
  scene.add(outside, inside, wall);

  // the pipe loop
  for (let i = 0; i < PATH.length - 1; i++) {
    const [a, b] = [PATH[i], PATH[i + 1]];
    if (Math.abs(a[0]) < 0.7 && Math.abs(b[0]) < 0.7) continue; // compressor and valve sit here
    const m = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, LENGTHS[i] + 0.06, 10), copper);
    m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z);
    m.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2;
    scene.add(m);
  }
  // compressor: a squat drum; a cable brings electricity from above
  const compressor = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 1.1, 32), dark);
  compressor.position.set(0, TOP, z);
  const cable = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1.5, 8), new T.MeshStandardMaterial({ color: 0x1d1e21 }));
  cable.position.set(0, TOP + 1.3, z);
  scene.add(compressor, cable);
  // expansion valve: a narrow throat
  const valve = new T.Group();
  for (const side of [-1, 1]) {
    const cone = new T.Mesh(new T.ConeGeometry(0.2, 0.4, 20), steel);
    cone.rotation.z = (side * Math.PI) / 2;
    cone.position.x = side * 0.2;
    valve.add(cone);
  }
  valve.position.set(0, BOT, z);
  const valveGlow = new T.PointLight(0x6fc2ff, 0, 3, 1.5);
  valveGlow.position.set(0, BOT, 0.6);
  scene.add(valve, valveGlow);
  // evaporator fins and fan (outside), condenser in the heating-water tank and a radiator (inside)
  const fins = new T.Mesh(new T.BoxGeometry(1.5, 3, 0.5), new T.MeshStandardMaterial({ color: 0x8c96a3, metalness: 0.6, roughness: 0.5, transparent: true, opacity: 0.28, depthWrite: false }));
  fins.position.set(-3.2, 0, z);
  const fan = new T.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new T.Mesh(new T.BoxGeometry(0.34, 0.62, 0.05), steel);
    blade.position.y = 0.36;
    blade.rotation.y = 0.5;
    const arm = new T.Group();
    arm.rotation.z = (i / 4) * Math.PI * 2;
    arm.add(blade);
    fan.add(arm);
  }
  fan.position.set(-5.1, 0, z);
  const housing = new T.Mesh(new T.TorusGeometry(0.78, 0.06, 10, 48), steel);
  housing.position.set(-5.1, 0, z);
  scene.add(housing);
  const tankMat = new T.MeshStandardMaterial({ color: 0x6f9fd0, transparent: true, opacity: 0.3, roughness: 0.2, depthWrite: false });
  const tank = new T.Mesh(new T.BoxGeometry(1.7, 3.3, 0.9), tankMat);
  tank.position.set(3.2, 0, z);
  tank.renderOrder = 3;
  const radiatorMat = new T.MeshStandardMaterial({ color: 0xece8e0, roughness: 0.5, emissive: new T.Color(0xff8a3a), emissiveIntensity: 0 });
  const radiator = new T.Group();
  for (let i = 0; i < 6; i++) {
    const rib = new T.Mesh(new T.BoxGeometry(0.12, 1.6, 0.4), radiatorMat);
    rib.position.x = i * 0.17;
    radiator.add(rib);
  }
  radiator.position.set(5.1, -0.9, z);
  const water = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 1.2, 8), steel);
  water.rotation.z = Math.PI / 2;
  water.position.set(4.5, -0.9, z);
  scene.add(fins, fan, tank, radiator, water);

  const dot = (n: number, r: number, color: number) => Array.from({ length: n }, () => {
    const m = new T.Mesh(new T.SphereGeometry(r, 10, 8), new T.MeshBasicMaterial({ color }));
    scene.add(m);
    return m;
  });
  const refrigerant = dot(54, 0.09, 0xffffff);
  const air = dot(16, 0.07, 0xf2f0e6);
  const heat = dot(12, 0.08, 0xff9a4a);
  const power = dot(5, 0.06, 0xffd84a);
  const cold = new T.Color(0x3c9bff);
  const cool = new T.Color(0xa8e4ff);
  const hot = new T.Color(0xff3d2e);
  const warm = new T.Color(0xffa25a);
  const airWarm = new T.Color(0xf2f0e6);
  const airCold = new T.Color(0x6fb6ff);
  const colorAt = (u: number, out: InstanceType<typeof T.Color>) => {
    if (u < U_EVAP_IN) return out.copy(cold);
    if (u < U_EVAP_OUT) return out.copy(cold).lerp(cool, (u - U_EVAP_IN) / (U_EVAP_OUT - U_EVAP_IN)); // takes up heat, boils
    if (u < U_COMP_IN) return out.copy(cool);
    if (u < U_COMP_OUT) return out.copy(cool).lerp(hot, (u - U_COMP_IN) / (U_COMP_OUT - U_COMP_IN)); // squeezed: hot
    if (u < U_COND_OUT) return out.copy(hot).lerp(warm, (u - U_COMP_OUT) / (U_COND_OUT - U_COMP_OUT)); // gives off heat, turns liquid
    if (u < U_VALVE_IN) return out.copy(warm);
    return out.copy(warm).lerp(cold, (u - U_VALVE_IN) / (1 - U_VALVE_IN)); // pressure drops: very cold
  };
  const along = (u: number): Vec3 => {
    let d = u * TOTAL;
    for (let i = 0; i < LENGTHS.length; i++) {
      if (d <= LENGTHS[i]) return mix(PATH[i], PATH[i + 1], d / LENGTHS[i]);
      d -= LENGTHS[i];
    }
    return PATH[PATH.length - 1];
  };

  return {
    update(step, p, t, s) {
      const k = ease(clamp(s / TIMING.appear));
      refrigerant.forEach((m, i) => {
        const u = (t * 0.045 + i / refrigerant.length) % 1;
        const [x, y] = along(u);
        m.position.set(x, y, z + 0.02);
        colorAt(u, (m.material as InstanceType<typeof T.MeshBasicMaterial>).color);
        // gas takes more room than liquid: a little larger between evaporator and condenser
        m.scale.setScalar(u > U_EVAP_IN + 0.5 * (U_EVAP_OUT - U_EVAP_IN) && u < U_COMP_OUT + 0.6 * (U_COND_OUT - U_COMP_OUT) ? 1.25 : 0.9);
      });
      fan.rotation.z = -t * 3;
      air.forEach((m, i) => {
        const u = (t * 0.35 + i / air.length) % 1;
        const x = lerp(-7.2, -2, u);
        m.position.set(x, -1.3 + 2.6 * rand(i, 3), z + 0.35);
        (m.material as InstanceType<typeof T.MeshBasicMaterial>).color.copy(airWarm).lerp(airCold, clamp((x + 4) / 1.6));
        m.visible = step === 0 || step === 3;
      });
      heat.forEach((m, i) => {
        const u = (t * 0.3 + i / heat.length) % 1;
        m.visible = step >= 2;
        const fromTank = i % 2 === 0;
        m.position.set(fromTank ? lerp(3.9, 5, u) : 5.5 + 0.5 * rand(i, 5), fromTank ? -0.9 + 0.3 * Math.sin(u * 9) : lerp(-0.2, 2.6, u), z + 0.3);
        m.scale.setScalar(fromTank ? 1 : 1 - 0.7 * u);
      });
      power.forEach((m, i) => {
        m.visible = step >= 1;
        m.position.set(0, lerp(TOP + 2.05, TOP + 0.6, (t * 0.7 + i / power.length) % 1), z + 0.05);
      });
      // what is in focus
      dark.emissiveIntensity = step === 1 ? 0.25 + 0.2 * Math.sin(t * 6) : step > 1 ? 0.15 : 0;
      compressor.scale.set(1 + (step >= 1 ? 0.025 * Math.sin(t * 12) : 0), 1, 1 + (step >= 1 ? 0.025 * Math.sin(t * 12) : 0));
      tankMat.color.setHex(0x6f9fd0).lerp(warm, step >= 2 ? (step === 2 ? 0.6 * k : 0.6) : 0);
      radiatorMat.emissiveIntensity = step >= 2 ? 0.45 * (step === 2 ? k : 1) : 0;
      valveGlow.intensity = step === 3 ? 4 * (0.6 + 0.4 * Math.sin(t * 5)) : 0;
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.5)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [-3.6, 0.6, 11.5], look: [-3.4, 0.3, 0] }, // outside: evaporator and fan
        { pos: [0, 2.4, 9.5], look: [0, 1.5, 0] }, // compressor
        { pos: [4, 0.5, 11], look: [4.1, 0.2, 0] }, // inside: condenser and radiator
        { pos: [0.2, 0.3, 16], look: [0.2, 0, 0] },
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      const where = [{ at: [-1.2, 3.8, 0] as Vec3, text: 9, dim: true }, { at: [3.4, 3.8, 0] as Vec3, text: 10, dim: true }];
      if (step === 0) return [{ at: [-3.2, 2.35, 0.3], text: 0 }, { at: [-5.6, 1.85, 0.4], text: 4, color: "#ffe7b0" }, ...where];
      if (step === 1) return [{ at: [0, 1.0, 0.7], text: 1 }, { at: [0.45, TOP + 2.25, 0], text: 8, color: "#ffd84a" }, { at: [1.6, TOP + 0.45, 0.3], text: 5, color: "#ff8a7a" }];
      if (step === 2) return [{ at: [3.2, 2.35, 0.3], text: 2 }, { at: [5.4, 1.5, 0.3], text: 6, color: "#ffb27a" }, ...where];
      return [{ at: [0, BOT - 0.55, 0.3], text: 3 }, { at: [-1.5, BOT + 0.45, 0.3], text: 7, color: "#9fd0ff" }];
    },
    heading(step) {
      return step === 3 ? 11 : null;
    },
    // no shadows: on the flat backdrop the pipes' shadows only blur the diagram
  };
};
