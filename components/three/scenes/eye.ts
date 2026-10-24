// How the eye sees: a real right eye (public/models/eye.glb, prepared from Z-Anatomy / BodyParts3D, CC BY-SA – see
// the credits page), cut open from the side. Light from a candle passes the cornea, the pupil and the lens and meets
// on the retina in a sharp, upside-down image. When it gets bright the iris narrows the pupil; the retina turns the
// light into nerve impulses that run along the optic nerve towards the brain.
// labels: 0 cornea, 1 iris, 2 pupil, 3 lens, 4 retina, 5 optic nerve, 6 vitreous body, 7 sharp image on the retina,
//         8 "bright: the pupil narrows", 9 nerve impulses to the brain
// Simplified: the rays are bent only at the cornea and the lens; the candle stands much closer than it would to give
// an image this size, and the pupil reacts within a second.
// Model units: 1 = 1 cm, the centre of the eyeball at the origin, the eye looks towards +z, the body's middle is +x.
import type * as THREE from "three";
import { TIMING } from "@/lib/animations";
import { clamp, ease, lerp, mix, type SceneFactory, type Vec3 } from "../types";
import paths from "./eye-paths.json";

const CANDLE = 7; // the candle stands this far in front of the eye
const RETINA = -1.12; // where the image falls (the back of the eye, inside)
const NORMAL = 0.3, NARROW = 0.13; // radius of the pupil: normal light, bright light

export const eye: SceneFactory = async ({ THREE: T, scene, load }) => {
  const model = await load("eye.glb");
  const V = (p: Vec3) => new T.Vector3(...p);
  const mesh = (name: string) => {
    let found: THREE.Mesh | null = null;
    model.getObjectByName(name)?.traverse((o) => !found && (o as THREE.Mesh).isMesh && (found = o as THREE.Mesh));
    if (!found) throw new Error("eye.glb: missing " + name);
    return found as THREE.Mesh;
  };
  const iris = mesh("iris");
  iris.geometry.computeBoundingBox();
  const axis = iris.geometry.boundingBox!.getCenter(new T.Vector3()); // the optical axis runs through the middle of the iris
  const X = axis.x + 0.03; // everything drawn in the cut plane sits just behind it
  // cut open from the side: the half facing the viewer (x below the axis) is taken away
  const clip = { clippingPlanes: [new T.Plane(new T.Vector3(1, 0, 0), -axis.x)], clipShadows: true };
  const solid = (color: number, extra: object = {}) => new T.MeshPhysicalMaterial({ color, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3, side: T.DoubleSide, ...clip, ...extra });
  const clear = (color: number, opacity: number) => new T.MeshPhysicalMaterial({ color, roughness: 0.03, clearcoat: 1, transparent: true, opacity, depthWrite: false, side: T.DoubleSide, ...clip });
  mesh("sclera").material = solid(0xf2ece2, { roughness: 0.5 });
  mesh("cornea").material = clear(0xd6ecfb, 0.28);
  mesh("chamber").material = clear(0xcfe8ff, 0.07);
  mesh("vitreous").material = clear(0xe6f2ff, 0.07);
  mesh("lens").material = clear(0xfff3d2, 0.42);
  mesh("retina").material = solid(0xd0703e, { emissive: new T.Color(0x000000) });
  mesh("muscles").material = solid(0xa7352e);
  mesh("nerve").material = solid(0xeed9a2, { transparent: true, opacity: 0.55, depthWrite: false }); // see-through: the impulses run inside
  const irisMat = solid(0x4f78a6, { roughness: 0.55, sheen: 0.4 });
  iris.material = irisMat;
  scene.add(model);

  // the pupil: the inner edge of the iris moves out or in, the outer edge stays
  const ip = iris.geometry.getAttribute("position") as THREE.BufferAttribute;
  const rest = Float32Array.from(ip.array as Float32Array);
  let outer = 0, inner = Infinity;
  for (let i = 0; i < ip.count; i++) {
    const r = Math.hypot(rest[i * 3] - axis.x, rest[i * 3 + 1] - axis.y);
    outer = Math.max(outer, r);
    inner = Math.min(inner, r);
  }
  let shownPupil = -1;
  const pupil = (radius: number) => {
    if (Math.abs(radius - shownPupil) < 0.002) return;
    shownPupil = radius;
    const k = (outer - radius) / (outer - inner);
    for (let i = 0; i < ip.count; i++) {
      const dx = rest[i * 3] - axis.x, dy = rest[i * 3 + 1] - axis.y;
      const r = Math.hypot(dx, dy) || 1;
      const to = outer - (outer - r) * k;
      ip.setXY(i, axis.x + (dx / r) * to, axis.y + (dy / r) * to);
    }
    ip.needsUpdate = true;
    iris.geometry.computeVertexNormals();
  };

  // the candle in front of the eye, and its small upside-down image on the retina
  const candle = new T.Group();
  candle.position.set(X, axis.y, CANDLE);
  const wax = new T.Mesh(new T.CylinderGeometry(0.18, 0.2, 1.0, 24), new T.MeshPhysicalMaterial({ color: 0xf4efe4, roughness: 0.6, sheen: 0.5 }));
  wax.position.y = -0.1;
  const flameMat = new T.MeshBasicMaterial({ color: 0xffc04a });
  const flame = new T.Mesh(new T.SphereGeometry(0.12, 16, 12), flameMat);
  flame.scale.set(1, 2, 1);
  flame.position.y = 0.62;
  const light = new T.PointLight(0xffc56a, 3, 12, 1.5);
  light.position.y = 0.7;
  candle.add(wax, flame, light);
  scene.add(candle);
  const TOP: Vec3 = [X, axis.y + 0.8, CANDLE], BASE: Vec3 = [X, axis.y - 0.6, CANDLE];
  const imageAt = (p: Vec3): Vec3 => [X, axis.y - (p[1] - axis.y) * 0.3, RETINA]; // upside down and much smaller
  const imageMat = new T.MeshBasicMaterial({ color: 0xffd36a, transparent: true, opacity: 0 });
  const image = new T.Mesh(new T.TubeGeometry(new T.LineCurve3(V(imageAt(BASE)), V(imageAt(TOP))), 4, 0.03, 6), imageMat);
  scene.add(image);

  // rays from the top and the foot of the candle, through the pupil, bent at the cornea and the lens, meeting on the retina
  const rayMat = new T.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.75, depthWrite: false });
  const rays = Array.from({ length: 6 }, () => {
    const m = new T.Mesh(new T.BufferGeometry(), rayMat);
    m.renderOrder = 6;
    scene.add(m);
    return m;
  });
  let shownRays = -1;
  const drawRays = (radius: number) => {
    if (Math.abs(radius - shownRays) < 0.002) return;
    shownRays = radius;
    [TOP, BASE].forEach((from, f) =>
      [-0.8, 0, 0.8].forEach((share, k) => {
        const a = axis.y + share * radius;
        const path = new T.CurvePath<InstanceType<typeof T.Vector3>>();
        const pts = [V(from), V([X, a, 1.45]), V([X, axis.y + share * radius * 0.85, 0.8]), V(imageAt(from))];
        for (let i = 1; i < pts.length; i++) path.add(new T.LineCurve3(pts[i - 1], pts[i]));
        const m = rays[f * 3 + k];
        m.geometry.dispose();
        m.geometry = new T.TubeGeometry(path, 48, 0.018, 5, false);
      }),
    );
  };

  // nerve impulses: from the back of the eye along the optic nerve towards the brain
  const nerveLine = (paths as { nerve: Vec3[][] }).nerve[0].filter((p) => p[2] < -1.0).reverse();
  const impulsePath = new T.CatmullRomCurve3([V([X + 0.05, axis.y + 0.15, RETINA - 0.05]), ...nerveLine.map(V)], false, "centripetal");
  const impulses = Array.from({ length: 14 }, (_, i) => {
    const m = new T.Mesh(new T.SphereGeometry(0.06, 10, 8), new T.MeshBasicMaterial({ color: 0xfff2a8 }));
    m.userData.offset = i / 14;
    scene.add(m);
    return m;
  });

  let bright = 0;
  let radius = NORMAL;
  return {
    update(step, p, t, s) {
      // light: normal, then (step 3) suddenly bright; the pupil follows a moment later
      bright = step === 2 ? ease(clamp(s / 0.6)) : 0;
      radius = step === 2 ? lerp(NORMAL, NARROW, ease(clamp((s - 0.5) / 1.5))) : NORMAL;
      pupil(radius);
      drawRays(radius);
      flame.scale.set(1 + 1.5 * bright, 2 + 2.5 * bright, 1 + 1.5 * bright);
      flameMat.color.setHex(bright > 0.5 ? 0xfff4c8 : 0xffc04a);
      light.intensity = 3 + 25 * bright;
      // fewer rays get through a narrow pupil: they get thinner
      rayMat.opacity = step === 0 ? 0.45 : 0.75;
      // the image appears once the lens has done its work (step 2 on), and the retina glows a little where it falls
      imageMat.opacity = step >= 1 ? ease(clamp(s / 1.2 + (step > 1 ? 1 : 0))) : 0;
      // impulses run in the last step
      impulses.forEach((m) => {
        m.visible = step === 3;
        if (!m.visible) return;
        const u = ((m.userData.offset as number) + t * 0.35) % 1;
        m.position.copy(impulsePath.getPointAt(u));
      });
    },
    camera(step, _p, _t, s) {
      const k = ease(clamp(s / (TIMING.camera * 1.4)));
      const views: { pos: Vec3; look: Vec3 }[] = [
        { pos: [-13.5, 1.8, 4.9], look: [0, 0, 3.9] }, // the eye and the candle in front of it
        { pos: [-6.2, 0.8, 1.2], look: [0, 0, 0.2] }, // the eye: lens and retina
        { pos: [-4.6, 0.8, 2.4], look: [0, 0, 0.9] }, // close to the iris
        { pos: [-7.2, 1.6, -0.8], look: [0.9, 0.5, -1.6] }, // the back of the eye and the optic nerve
      ];
      const from = views[Math.max(0, step - 1)];
      return { pos: mix(from.pos, views[step].pos, k), look: mix(from.look, views[step].look, k) };
    },
    labels(step) {
      const at = (y: number, z: number, x = X + 0.1): Vec3 => [x, axis.y + y, z];
      const parts = [
        { at: at(1.05, 1.45), text: 0 },
        { at: at(-0.85, 1.0), text: 1, color: "#9cc4f0" },
        { at: at(0.45, 1.2), text: 2 },
        { at: at(-0.5, 0.55), text: 3 },
        { at: at(-1.0, -0.8), text: 4, color: "#ffb38a" },
        { at: at(0.5, -0.3), text: 6 },
      ];
      if (step === 0) return parts.slice(0, 3);
      if (step === 1) return [parts[3], parts[4], parts[5], { at: at(-0.55, -1.55), text: 7, color: "#ffd36a" }];
      if (step === 2) return [parts[1], parts[2], { at: at(1.5, 1.7), text: 8, color: "#ffd24a" }];
      const end = nerveLine[nerveLine.length - 1];
      return [parts[4], { at: [end[0], end[1] + 0.4, end[2]] as Vec3, text: 5 }, { at: [end[0] - 0.6, end[1] + 1.0, end[2] + 0.8] as Vec3, text: 9, color: "#fff2a8" }];
    },
    stage: { shadows: true },
  };
};
