// Four-stroke petrol engine, one cylinder, cut open at the front.
// labels: 0 intake valve, 1 exhaust valve, 2 spark plug, 3 piston, 4 crankshaft, 5–8 names of the four strokes
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { clamp, ease, lerp, type SceneFactory, type Vec3 } from "../types";

const R = 0.6; // crank radius
const L = 2.0; // connecting rod length
const CY = -1.9; // height of the crankshaft axis
const BORE = 1;
const HEAD = 1.4; // underside of the cylinder head
const AZIMUTH = [-0.5, -0.2, 0.15, 0.45, 0.6]; // camera angle at the start of each stroke

export const engine: SceneFactory = ({ THREE: T, scene }) => {
  const steel = new T.MeshStandardMaterial({ color: 0xc3c6cc, metalness: 0.95, roughness: 0.28 });
  const iron = new T.MeshStandardMaterial({ color: 0x565a61, metalness: 0.8, roughness: 0.5 });
  const block = new T.MeshStandardMaterial({ color: 0x7a8088, metalness: 0.55, roughness: 0.6, side: T.DoubleSide });
  const ceramic = new T.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.35 });
  const add = <M extends THREE_Object>(m: M, parent: THREE_Object = scene) => (parent.add(m), m);
  type THREE_Object = InstanceType<typeof T.Object3D>;

  // cylinder and head: only the rear half, so the inside is visible
  const liner = add(new T.Mesh(new T.CylinderGeometry(BORE + 0.14, BORE + 0.14, 2.6, 56, 1, true, Math.PI / 2, Math.PI), block));
  liner.position.y = HEAD - 1.3;
  const head = add(new T.Mesh(new T.CylinderGeometry(BORE + 0.14, BORE + 0.14, 0.3, 56, 1, false, Math.PI / 2, Math.PI), block));
  head.position.y = HEAD + 0.15;

  // cooling fins around the cylinder, as on an air-cooled engine
  for (let i = 0; i < 7; i++) {
    // a flat half ring behind the cut – it must not reach into the bore
    const fin = add(new T.Mesh(new T.RingGeometry(BORE + 0.14, BORE + 0.44, 56, 1, Math.PI, Math.PI), block));
    fin.rotation.x = Math.PI / 2;
    fin.position.y = HEAD - 0.15 - i * 0.33;
  }
  // crankcase: the lower half of the housing the crankshaft turns in
  const crankcase = add(new T.Mesh(new T.CylinderGeometry(1.32, 1.32, 1.7, 48, 1, true, -Math.PI / 2, Math.PI), block));
  crankcase.rotation.x = Math.PI / 2;
  crankcase.position.y = CY;

  // intake (left, bluish) and exhaust (right) ports
  const port = (side: number, color: number) => {
    const m = add(new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 1.5, 24, 1, true), new T.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.5, side: T.DoubleSide, transparent: true, opacity: 0.55 })));
    m.position.set(side * 1.05, HEAD + 0.72, -0.05);
    m.rotation.z = side * 0.95;
    return m;
  };
  port(-1, 0x6ea6e8);
  port(1, 0x9a948c);

  // valves
  const valve = (side: number) => {
    const g = add(new T.Group());
    add(new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 0.9, 12), steel), g).position.y = 0.48;
    add(new T.Mesh(new T.CylinderGeometry(0.3, 0.22, 0.07, 28), steel), g);
    add(new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.04, 20), steel), g).position.y = 0.92; // spring retainer
    g.position.set(side * 0.47, HEAD - 0.04, 0);
    return g;
  };
  // valve springs: they sit on the head and are squeezed when a valve opens
  const helix = new T.CatmullRomCurve3(Array.from({ length: 73 }, (_, i) => new T.Vector3(0.12 * Math.cos((i / 72) * Math.PI * 12), (i / 72) * 0.56, 0.12 * Math.sin((i / 72) * Math.PI * 12))));
  const spring = (side: number) => {
    const s = add(new T.Mesh(new T.TubeGeometry(helix, 96, 0.022, 6), steel));
    s.position.set(side * 0.47, HEAD + 0.3, 0);
    return s;
  };
  const springs = [spring(-1), spring(1)];
  const intake = valve(-1);
  const exhaust = valve(1);

  // spark plug with its spark
  add(new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.55, 16), ceramic)).position.set(0, HEAD + 0.3, -0.3);
  add(new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.14, 8), iron)).position.set(0, HEAD - 0.05, -0.3);
  const spark = add(new T.Mesh(new T.SphereGeometry(0.13, 16, 12), new T.MeshBasicMaterial({ color: 0xfff2a8 })));
  spark.position.set(0, HEAD - 0.16, -0.3);
  const flash = add(new T.PointLight(0xffb040, 0, 6));
  flash.position.copy(spark.position);

  // piston with rings, connecting rod
  const piston = add(new T.Group());
  // the piston: a slightly dished crown, two ring grooves, a skirt that narrows a little towards the bottom
  add(new T.Mesh(new T.LatheGeometry([[0, 0.33], [0.6, 0.35], [0.92, 0.375], [0.95, 0.35], [0.95, 0.25], [0.93, 0.24], [0.93, 0.2], [0.95, 0.19], [0.95, 0.13], [0.93, 0.12], [0.93, 0.08], [0.95, 0.07], [0.945, -0.375], [0.86, -0.375], [0.86, 0.25], [0, 0.25]].map(([x, y]) => new T.Vector2(x, y)), 64), steel), piston);
  for (const y of [0.22, 0.1]) {
    const ring = add(new T.Mesh(new T.TorusGeometry(0.955, 0.022, 8, 48), iron), piston);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
  }
  // connecting rod: a slim beam between the small eye at the piston pin and the big eye on the crank pin
  const rod = add(new T.Group());
  add(new T.Mesh(new T.BoxGeometry(0.2, L - 0.5, 0.1), iron), rod);
  add(new T.Mesh(new T.BoxGeometry(0.08, L - 0.6, 0.16), iron), rod); // web of the I-beam
  for (const [y, r] of [[L / 2, 0.19], [-L / 2, 0.29]] as const) {
    const eye = add(new T.Mesh(new T.CylinderGeometry(r, r, 0.2, 28), iron), rod);
    eye.rotation.x = Math.PI / 2;
    eye.position.y = y;
  }
  // piston pin, visible in the cut-open skirt
  const wrist = add(new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 1.5, 20), steel), piston);
  wrist.rotation.x = Math.PI / 2;
  wrist.position.y = -0.1;

  // crankshaft: turns around the z axis
  const crank = add(new T.Group());
  crank.position.y = CY;
  for (const z of [-0.62, 0.62]) {
    const journal = add(new T.Mesh(new T.CylinderGeometry(0.24, 0.24, 0.6, 24), steel), crank);
    journal.rotation.x = Math.PI / 2;
    journal.position.z = z;
  }
  for (const z of [-0.24, 0.24]) {
    add(new T.Mesh(new RoundedBoxGeometry(0.46, R + 0.5, 0.14, 3, 0.05), iron), crank).position.set(0, R / 2, z);
    // counterweight: half a disc on the side opposite the crank pin
    const half = new T.CylinderGeometry(0.74, 0.74, 0.14, 32, 1, false, 0, Math.PI);
    half.rotateX(Math.PI / 2);
    half.rotateZ(-Math.PI / 2);
    add(new T.Mesh(half, iron), crank).position.set(0, -0.1, z);
  }
  const pin = add(new T.Mesh(new T.CylinderGeometry(0.17, 0.17, 0.62, 20), steel), crank);
  pin.rotation.x = Math.PI / 2;
  pin.position.y = R;

  // the gas in the combustion chamber
  const gasMat = new T.MeshStandardMaterial({ color: 0x7fb6ff, transparent: true, opacity: 0.3, depthWrite: false, roughness: 1, metalness: 0 });
  const gas = add(new T.Mesh(new T.CylinderGeometry(0.93, 0.93, 1, 40), gasMat));
  gas.renderOrder = 2;

  // fresh mixture flowing in, exhaust flowing out
  const dots = (color: number) => Array.from({ length: 7 }, () => add(new T.Mesh(new T.SphereGeometry(0.075, 10, 8), new T.MeshBasicMaterial({ color }))));
  const inflow = dots(0x9ccbff);
  const outflow = dots(0xb8b2aa);
  const along = (side: number, u: number): Vec3 => (u < 0.6 ? [side * lerp(1.75, 0.55, u / 0.6), lerp(HEAD + 1.25, HEAD + 0.1, u / 0.6), -0.05] : [side * lerp(0.55, 0.3, (u - 0.6) / 0.4), lerp(HEAD + 0.1, HEAD - 0.7, (u - 0.6) / 0.4), 0]);

  const colors = { intake: new T.Color(0x7fb6ff), dense: new T.Color(0x3f7fe0), fire: new T.Color(0xffc24a), ember: new T.Color(0xe8662e), smoke: new T.Color(0x8d8a86) };
  let pistonY = 0;

  return {
    update(step, p, t) {
      const theta = (step + p) * Math.PI; // 0 = top dead centre
      const pinY = CY + R * Math.cos(theta) + Math.sqrt(L * L - (R * Math.sin(theta)) ** 2);
      const cx = R * Math.sin(theta);
      const cy = CY + R * Math.cos(theta);
      pistonY = pinY + 0.1;
      piston.position.y = pistonY;
      crank.rotation.z = -theta;
      rod.position.set(cx / 2, (pinY + cy) / 2, 0);
      rod.rotation.z = Math.atan2(cx, pinY - cy);

      const open = (active: boolean) => (active ? -0.24 * Math.sin(Math.PI * clamp(p * 1.05)) : 0);
      intake.position.y = HEAD - 0.04 + open(step === 0);
      exhaust.position.y = HEAD - 0.04 + open(step === 3);
      springs[0].scale.y = (0.56 + open(step === 0)) / 0.56;
      springs[1].scale.y = (0.56 + open(step === 3)) / 0.56;

      const top = pistonY + 0.375;
      gas.scale.y = Math.max(0.01, HEAD - top);
      gas.position.y = (HEAD + top) / 2;
      if (step === 0) {
        gasMat.color.copy(colors.intake);
        gasMat.opacity = lerp(0.12, 0.34, p);
      } else if (step === 1) {
        gasMat.color.lerpColors(colors.intake, colors.dense, p);
        gasMat.opacity = lerp(0.34, 0.75, p);
      } else if (step === 2) {
        gasMat.color.lerpColors(colors.fire, colors.ember, clamp(p * 1.3));
        gasMat.opacity = lerp(0.92, 0.5, p);
      } else {
        gasMat.color.copy(colors.smoke);
        gasMat.opacity = lerp(0.5, 0.15, p);
      }
      gasMat.emissive.copy(step === 2 ? gasMat.color : colors.smoke).multiplyScalar(step === 2 ? 0.9 * (1 - p) : 0);
      const ignite = step === 2 && p < 0.16;
      spark.visible = ignite;
      flash.intensity = step === 2 ? 30 * Math.max(0, 1 - p * 3) : 0;

      inflow.forEach((d, i) => {
        d.visible = step === 0;
        d.position.set(...along(-1, (t * 0.45 + i / inflow.length) % 1));
      });
      outflow.forEach((d, i) => {
        d.visible = step === 3;
        d.position.set(...along(1, 1 - ((t * 0.45 + i / outflow.length) % 1)));
      });
    },
    camera(step, p) {
      const a = lerp(AZIMUTH[step], AZIMUTH[step + 1], ease(p));
      return { pos: [Math.sin(a) * 11.2, 1.9, Math.cos(a) * 11.2], look: [0, 0.2, 0] };
    },
    labels(step) {
      return [
        { at: [-2.2, HEAD + 0.55, 0], text: 0, dim: step !== 0, color: "#9ccbff" },
        { at: [2.2, HEAD + 0.55, 0], text: 1, dim: step !== 3 },
        { at: [0, HEAD + 0.85, -0.3], text: 2, dim: step !== 2, color: step === 2 ? "#ffd24a" : undefined },
        { at: [-1.75, pistonY, 0], text: 3, dim: true },
        { at: [0, CY - 1.15, 0], text: 4, dim: true },
      ];
    },
    heading: (step) => 5 + step,
    stage: { shadows: true, floor: CY - 1.7 },
  };
};
