// Surfaces painted once on a canvas and wrapped around a sphere (256 × 128). They are drawn from
// deterministic pseudo-random numbers – stylised, not photographs, and the same on every run.
// Earth and Moon are replaced by NASA photographs (public/textures, public domain) as soon as these have
// loaded; the painted version is shown until then and stays if they cannot be loaded.
import type * as THREE from "three";
import { rand, TEXTURE_LOADED } from "./types";

type Ctx = CanvasRenderingContext2D;


// Rough continent outlines as [longitude, latitude] – drawn for this app, simplified on purpose.
const CONTINENTS = [
  [[-168, 66], [-156, 71], [-130, 70], [-95, 72], [-80, 73], [-62, 60], [-55, 52], [-66, 45], [-75, 35], [-81, 25], [-97, 26], [-105, 20], [-87, 15], [-79, 8], [-83, 10], [-92, 15], [-106, 23], [-115, 30], [-124, 40], [-125, 49], [-135, 58], [-150, 60], [-165, 62]], // North America
  [[-80, 9], [-72, 12], [-60, 10], [-50, 0], [-35, -6], [-39, -14], [-48, -26], [-58, -38], [-65, -42], [-68, -52], [-75, -50], [-72, -35], [-71, -18], [-81, -5]], // South America
  [[-10, 36], [-9, 43], [-2, 47], [-5, 48], [0, 50], [8, 54], [10, 58], [5, 62], [15, 69], [28, 71], [40, 67], [60, 69], [80, 73], [100, 77], [115, 73], [140, 72], [160, 70], [180, 68], [180, 62], [163, 60], [158, 52], [143, 59], [135, 54], [140, 48], [130, 42], [127, 35], [122, 40], [118, 38], [122, 30], [120, 24], [110, 20], [108, 12], [104, 9], [100, 13], [98, 8], [103, 1], [98, 16], [94, 20], [90, 22], [80, 15], [77, 8], [73, 18], [70, 22], [62, 25], [57, 25], [48, 30], [52, 24], [56, 26], [59, 22], [55, 17], [44, 12], [43, 15], [35, 28], [33, 31], [36, 36], [27, 37], [26, 40], [23, 38], [20, 40], [15, 38], [12, 44], [8, 44], [3, 43], [-1, 37]], // Eurasia
  [[-17, 21], [-16, 12], [-8, 4], [5, 5], [9, 4], [10, -2], [13, -12], [12, -18], [15, -27], [18, -34], [25, -34], [33, -27], [35, -20], [40, -15], [40, -5], [44, 2], [51, 11], [43, 12], [38, 18], [33, 28], [30, 31], [20, 32], [10, 37], [-1, 36], [-6, 36], [-10, 30]], // Africa
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -26], [150, -37], [141, -38], [135, -35], [129, -32], [117, -35], [114, -28]], // Australia
  [[-5, 50], [1, 51], [-1, 55], [-3, 58], [-6, 56]], // Great Britain
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17]], // Madagascar
  [[130, 31], [135, 34], [141, 36], [142, 43], [140, 41], [136, 36]], // Japan
  [[109, 1], [118, 7], [119, 0], [115, -4], [110, -3]], // Borneo
  [[95, 5], [106, -6], [104, -5], [98, 1]], // Sumatra
  [[131, -1], [141, -2], [150, -10], [141, -9], [133, -4]], // New Guinea
  [[172, -35], [178, -38], [174, -41], [167, -46], [171, -44]], // New Zealand
];
const DESERTS = [
  [[-15, 18], [0, 30], [30, 30], [33, 21], [15, 15], [0, 16]], // Sahara
  [[38, 28], [48, 29], [56, 22], [52, 16], [44, 15]], // Arabia
  [[120, -22], [138, -20], [140, -30], [125, -31]], // Australian interior
];
const GREENLAND = [[-55, 60], [-42, 60], [-20, 70], [-18, 80], [-40, 83], [-65, 80], [-72, 77], [-55, 70]];

export function painter(T: typeof THREE) {
  const paint = (draw: (c: Ctx, w: number, h: number) => void, width = 256, height = 128) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const c = canvas.getContext("2d");
    if (c) draw(c, width, height);
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    return texture;
  };
  /** n soft-edged patches of random size and place; the poles stay free. */
  const blobs = (c: Ctx, w: number, h: number, n: number, seed: number, color: (i: number) => string, size: number) => {
    for (let i = 0; i < n; i++) {
      c.fillStyle = color(i);
      c.beginPath();
      c.ellipse(rand(i, seed) * w, (0.12 + 0.76 * rand(i, seed + 1)) * h, size * (0.4 + rand(i, seed + 2)), size * 0.6 * (0.4 + rand(i, seed + 3)), rand(i, seed + 4) * 3, 0, 6.2832);
      c.fill();
    }
  };
  const painted = {
    paint,
    blobs,
    /** The Earth: simplified continents (own drawing from rough outlines), deserts, ice caps, a few clouds. */
    earth: () => paint((c, w, h) => {
      const at = ([lon, lat]: number[]): [number, number] => [((lon + 180) / 360) * w, ((90 - lat) / 180) * h];
      const shape = (points: number[][], fill: string) => {
        c.fillStyle = fill;
        c.beginPath();
        points.forEach((p, i) => (i ? c.lineTo(...at(p)) : c.moveTo(...at(p))));
        c.closePath();
        c.fill();
      };
      const ocean = c.createLinearGradient(0, 0, 0, h);
      ocean.addColorStop(0, "#1d4f9c");
      ocean.addColorStop(0.5, "#2a6cc4");
      ocean.addColorStop(1, "#1d4f9c");
      c.fillStyle = ocean;
      c.fillRect(0, 0, w, h);
      for (const land of CONTINENTS) shape(land, "#4f8f45");
      for (const sand of DESERTS) shape(sand, "#c8ad6a");
      // ice: Arctic sea ice, Greenland, Antarctica
      c.fillStyle = "#eef4fb";
      c.fillRect(0, 0, w, h * 0.06);
      shape(GREENLAND, "#eef4fb");
      c.fillRect(0, h * 0.86, w, h * 0.14);
      // thin streaks of cloud
      c.strokeStyle = "rgba(255,255,255,0.32)";
      c.lineCap = "round";
      for (let i = 0; i < 46; i++) {
        c.lineWidth = 2 + 5 * rand(i, 43);
        const x = rand(i, 41) * w, y = (0.12 + 0.76 * rand(i, 42)) * h;
        c.beginPath();
        c.moveTo(x, y);
        c.quadraticCurveTo(x + 30 * rand(i, 44), y - 8 * rand(i, 45), x + 25 + 50 * rand(i, 46), y + 4 * (rand(i, 47) - 0.5));
        c.stroke();
      }
    }, 1024, 512),
    /** Grey moon with dark plains and small bright craters. */
    moon: () => paint((c, w, h) => {
      c.fillStyle = "#b9b6b0";
      c.fillRect(0, 0, w, h);
      blobs(c, w, h, 14, 71, () => "rgba(95,92,90,0.6)", 15);
      blobs(c, w, h, 60, 81, (i) => (i % 2 ? "rgba(225,222,215,0.5)" : "rgba(120,116,112,0.45)"), 3.5);
    }),
    /** Light fading out smoothly – for the glow around a sun (use on a sprite twice as wide as high). */
    halo: () => paint((c, w, h) => {
      // falls off steeply: in linear light even 1 % shows on black, so a straight ramp would end in a visible edge
      const grad = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h / 2);
      grad.addColorStop(0, "rgba(255,225,150,1)");
      grad.addColorStop(0.14, "rgba(255,200,105,0.5)");
      grad.addColorStop(0.28, "rgba(255,170,75,0.2)");
      grad.addColorStop(0.42, "rgba(255,150,60,0.075)");
      grad.addColorStop(0.56, "rgba(255,140,52,0.026)");
      grad.addColorStop(0.7, "rgba(255,130,46,0.008)");
      grad.addColorStop(0.85, "rgba(255,125,42,0.0015)");
      grad.addColorStop(1, "rgba(255,120,40,0)");
      c.fillStyle = grad;
      c.fillRect(w / 2 - h / 2, 0, h, h);
    }),
    /** Granulated surface of a sun. */
    sun: () => paint((c, w, h) => {
      c.fillStyle = "#ffcf5a";
      c.fillRect(0, 0, w, h);
      blobs(c, w, h, 260, 11, (i) => (i % 3 ? "rgba(255,236,150,0.5)" : "rgba(255,150,40,0.45)"), 7);
    }),
  };
  /** Swaps a painted texture for a photograph once it has loaded (same equirectangular layout). */
  const photo = (texture: THREE.CanvasTexture, url: string) => {
    const img = new Image();
    img.onload = () => {
      texture.dispose(); // the GPU copy has the painted size; the photograph needs a new one
      texture.image = img;
      texture.needsUpdate = true;
      window.dispatchEvent(new Event(TEXTURE_LOADED)); // a paused stage draws once more
    };
    img.src = url;
    return texture;
  };
  return {
    ...painted,
    earth: () => photo(painted.earth(), "/textures/earth-blue-marble.jpg"), // NASA Visible Earth, Blue Marble (Reto Stöckli, NASA GSFC)
    moon: () => photo(painted.moon(), "/textures/moon-lroc.jpg"), // NASA Scientific Visualization Studio, CGI Moon Kit (LRO data)
  };
}
