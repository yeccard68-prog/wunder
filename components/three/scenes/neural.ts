// How a neural network learns: pixels in, weighted connections, an answer out – wrong at first,
// right after training.
// labels: 0 input, 1 hidden layer, 2 output, 3 cat, 4 dog, 5 random weights: wrong guess,
//         6 after training: recognised correctly
// The network here is tiny (16 inputs, 6 hidden neurons, 2 outputs) and really computed: the
// brightness of each neuron is its activation for the weights shown. Real networks have millions
// to billions of weights. Orange = positive weight, blue = negative, brighter = stronger.
import { clamp, ease, lerp, mix, rand, type SceneFactory, type Vec3 } from "../types";

const IN = 16;
const HID = 6;
const X = [-4.4, 0, 4.2]; // where the three layers stand

export const neural: SceneFactory = ({ THREE: T, scene }) => {
  const inputAt = (i: number): Vec3 => [X[0], 1.35 - 0.9 * Math.floor(i / 4), 1.35 - 0.9 * (i % 4)];
  const hiddenAt = (j: number): Vec3 => [X[1], 2.5 - j, 0.5 * (j % 2 ? 1 : -1)];
  const outputAt = (k: number): Vec3 => [X[2], k ? -1 : 1, 0];
  const pixel = Array.from({ length: IN }, (_, i) => (rand(i, 2) > 0.45 ? 1 : 0.12)); // the picture: bright and dark pixels

  // weights before and after training. Before: random. After: the output weights are set so that
  // the hidden neurons this picture excites speak for "cat" – which is what training converges to.
  const w1 = Array.from({ length: IN * HID }, (_, n) => 2 * rand(n, 21) - 1);
  const hidden = (w: number[]) => Array.from({ length: HID }, (_, j) => Math.tanh(pixel.reduce((sum, x, i) => sum + x * w[i * HID + j], 0) * 0.45));
  const h0 = hidden(w1);
  const w1t = w1.map((w, n) => w + 0.35 * (rand(n, 22) - 0.5));
  const h1 = hidden(w1t);
  const w2 = Array.from({ length: HID * 2 }, (_, n) => 2 * rand(n, 23) - 1);
  const out = (h: number[], w: number[]) => [0, 1].map((k) => h.reduce((sum, x, j) => sum + x * w[j * 2 + k], 0));
  if (out(h0, w2)[0] > out(h0, w2)[1]) for (let j = 0; j < HID; j++) [w2[j * 2], w2[j * 2 + 1]] = [w2[j * 2 + 1], w2[j * 2]]; // untrained: the wrong answer wins
  const w2t = w2.map((_, n) => (n % 2 ? -1 : 1) * Math.sign(h1[Math.floor(n / 2)] || 1) * (0.5 + 0.5 * rand(n, 24)));

  // neurons
  const glow = (shape: InstanceType<typeof T.BoxGeometry> | InstanceType<typeof T.SphereGeometry>, at: Vec3) => {
    const m = new T.Mesh(shape, new T.MeshStandardMaterial({ color: 0x30343b, emissive: 0xffe6a8, emissiveIntensity: 0, roughness: 0.5, metalness: 0.2 }));
    m.position.set(...at);
    scene.add(m);
    return m;
  };
  const square = new T.BoxGeometry(0.14, 0.72, 0.72);
  const ball = new T.SphereGeometry(0.33, 28, 20);
  const inputs = Array.from({ length: IN }, (_, i) => glow(square, inputAt(i)));
  const hiddens = Array.from({ length: HID }, (_, j) => glow(ball, hiddenAt(j)));
  const outputs = [0, 1].map((k) => glow(new T.SphereGeometry(0.45, 32, 24), outputAt(k)));

  // connections: one line each, coloured by its weight
  const links: [Vec3, Vec3][] = [];
  for (let i = 0; i < IN; i++) for (let j = 0; j < HID; j++) links.push([inputAt(i), hiddenAt(j)]);
  for (let j = 0; j < HID; j++) for (let k = 0; k < 2; k++) links.push([hiddenAt(j), outputAt(k)]);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(links.flatMap(([a, b]) => [...a, ...b]), 3));
  const colour = new T.Float32BufferAttribute(new Float32Array(links.length * 6), 3);
  geometry.setAttribute("color", colour);
  scene.add(new T.LineSegments(geometry, new T.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false })));

  const pulses = Array.from({ length: 18 }, () => {
    const m = new T.Mesh(new T.SphereGeometry(0.08, 10, 8), new T.MeshBasicMaterial({ color: 0xfff2a8 }));
    scene.add(m);
    return m;
  });
  const forward = new T.Color(0xfff2a8);
  const backward = new T.Color(0xff6b5a);
  let answer = [0, 0];

  return {
    update(step, p, t) {
      // how far training has come: the weights move from their random start to the trained values
      const trained = step === 3 ? ease(clamp((p - 0.15) / 0.6)) : 0;
      const a1 = (n: number) => lerp(w1[n], w1t[n], trained);
      const a2 = (n: number) => lerp(w2[n], w2t[n], trained);
      const h = Array.from({ length: HID }, (_, j) => lerp(h0[j], h1[j], trained));
      const o = [0, 1].map((k) => h.reduce((sum, x, j) => sum + x * a2(j * 2 + k), 0));
      const e = o.map((x) => Math.exp(5 * x)); // sharpened, so the winner stands out
      answer = e.map((x) => x / (e[0] + e[1])); // how sure the network is: cat, dog

      // the signal arrives layer by layer in the second step; later everything is lit
      const reach = step === 0 ? 0 : step === 1 ? p * 3 : 3;
      const shimmer = step === 3 && trained > 0 && trained < 1 ? 0.25 * Math.sin(t * 14) : 0; // the weights are being adjusted
      links.forEach((_, n) => {
        const w = n < IN * HID ? a1(n) : a2(n - IN * HID);
        const strength = Math.min(1, Math.abs(w) + shimmer * Math.abs(w)) * (step === 0 ? 0.5 : 0.75);
        const [r, g, b] = w > 0 ? [1, 0.55, 0.2] : [0.25, 0.6, 1];
        colour.setXYZ(n * 2, r * strength, g * strength, b * strength);
        colour.setXYZ(n * 2 + 1, r * strength, g * strength, b * strength);
      });
      colour.needsUpdate = true;
      inputs.forEach((m, i) => ((m.material as InstanceType<typeof T.MeshStandardMaterial>).emissiveIntensity = pixel[i] * (0.25 + 1.2 * clamp(reach))));
      hiddens.forEach((m, j) => ((m.material as InstanceType<typeof T.MeshStandardMaterial>).emissiveIntensity = (0.15 + 1.5 * Math.abs(h[j])) * clamp(reach - 1)));
      outputs.forEach((m, k) => ((m.material as InstanceType<typeof T.MeshStandardMaterial>).emissiveIntensity = (0.04 + 1.9 * answer[k] ** 2) * clamp(reach - 2)));

      // signals running forward – and, while training, the error running backward (red)
      const back = step === 3 && trained < 1;
      pulses.forEach((m, i) => {
        const link = links[(i * 17 + (i % 2 ? IN * HID : 0)) % links.length];
        const u = (t * 0.55 + i * 0.31) % 1;
        m.visible = step >= 1;
        (m.material as InstanceType<typeof T.MeshBasicMaterial>).color.copy(back ? backward : forward);
        m.position.set(...mix(link[0], link[1], back ? 1 - u : u));
      });
    },
    camera(step, _p, t) {
      const sway = 0.12 * Math.sin(t * 0.25); // a slow drift, so the depth of the net can be seen
      const a = 0.32 + sway;
      if (step >= 2) return { pos: [2 + 14 * Math.sin(a * 0.6), 2, 14 * Math.cos(a * 0.6)], look: [1.7, -0.1, 0] }; // towards the output
      return { pos: [17.5 * Math.sin(a), 2.8, 17.5 * Math.cos(a)], look: [0.1, -0.1, 0] };
    },
    labels(step, p) {
      const layers = [{ at: [X[0], 2.55, 0] as Vec3, text: 0, dim: step > 0 }, { at: [X[1], 3.35, 0] as Vec3, text: 1, dim: step > 0 }, { at: [X[2], 2.1, 0] as Vec3, text: 2, dim: step > 0 }];
      if (step <= 1) return layers;
      const names = [{ at: [X[2] + 1.25, 1, 0] as Vec3, text: 3, dim: answer[0] < answer[1] }, { at: [X[2] + 1.25, -1, 0] as Vec3, text: 4, dim: answer[1] < answer[0] }];
      if (step === 2) return [...names, ...(p > 0.35 ? [{ at: [X[2] - 0.6, 2.6, 0] as Vec3, text: 5, color: "#ff8f7a" }] : [])];
      return [...names, ...(p > 0.8 ? [{ at: [X[2] - 0.6, 2.6, 0] as Vec3, text: 6, color: "#7fe0a0" }] : [])];
    },
  };
};
