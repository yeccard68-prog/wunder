// Surfaces painted once on a canvas and wrapped around a sphere (256 × 128). They are drawn from
// deterministic pseudo-random numbers – stylised, not photographs, and the same on every run.
import type * as THREE from "three";
import { rand } from "./types";

type Ctx = CanvasRenderingContext2D;

export function painter(T: typeof THREE) {
  const paint = (draw: (c: Ctx, w: number, h: number) => void) => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const c = canvas.getContext("2d");
    if (c) draw(c, 256, 128);
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
  return {
    paint,
    blobs,
    /** Blue planet: land, clouds, ice caps. */
    earth: () => paint((c, w, h) => {
      c.fillStyle = "#2f6fd0";
      c.fillRect(0, 0, w, h);
      blobs(c, w, h, 22, 31, (i) => (i % 2 ? "#4f9a4a" : "#8c8a4e"), 16);
      blobs(c, w, h, 90, 41, () => "rgba(255,255,255,0.34)", 4.5); // thin scattered clouds
      c.fillStyle = "#f4f8ff";
      c.fillRect(0, 0, w, 9);
      c.fillRect(0, h - 9, w, 9);
    }),
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
}
