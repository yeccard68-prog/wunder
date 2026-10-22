// Look of the own clips: the app's dark palette and fonts (Fraunces, Geist – SIL Open Font License).
// Clips are 720×1280 like the bundled footage. The app lays its captions over the lower part of the
// picture, so everything important sits above SAFE_BOTTOM.
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const W = 720;
export const H = 1280;
export const FPS = 30;
export const SAFE_BOTTOM = 880; // the app's captions start below this line

const display = loadFraunces("normal", { weights: ["600"], subsets: ["latin"] }).fontFamily;
const sans = loadGeist("normal", { weights: ["400", "600"], subsets: ["latin"] }).fontFamily;
export const FONT = { display, sans };

export const C = {
  bg: "#11100e",
  raised: "#272421",
  neutral: "#57514a", // starting amounts and other quiet bars – visible on the dark background
  line: "#2f2b27",
  ink: "#f4f1ec",
  muted: "#a39d94",
  accent: "#ff6d48",
  economy: "#6db3f2",
  history: "#e2ab4f",
  sport: "#f09a6e",
};

/** Topic colours of the app (categories), used where a clip stands for a whole topic. */
export const CATEGORY_COLORS: Record<string, string> = { science: "#41c7b4", technology: "#9794ff", history: "#e2ab4f", earth: "#7fc66a", economy: "#6db3f2", business: "#f08a6c", culture: "#e58bb8", math: "#d6c35a", language: "#6ccbdc", sport: "#f09a6e" };

export type Locale = "de" | "en";

/** 0 → 1 between two frames, eased. */
export const ease = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (t) => 1 - Math.pow(1 - t, 3) });

export function useSpring(delay: number, damping = 14) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
}

/** Background, topic label at the top and a soft fade at the end so the loop in the app is calm. */
export function Stage({ topic, color, children }: { topic: string; color: string; children: ReactNode }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const fade = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
  const label: CSSProperties = { position: "absolute", top: 64, left: 0, right: 0, textAlign: "center", fontFamily: sans, fontWeight: 600, fontSize: 22, letterSpacing: 4, color, textTransform: "uppercase", opacity: ease(frame, 0, 10) };
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: sans }}>
      <AbsoluteFill style={{ opacity: fade }}>
        <div style={label}>{topic}</div>
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export const fmt = (n: number, locale: Locale, digits = 0) => n.toLocaleString(locale === "de" ? "de-DE" : "en-GB", { maximumFractionDigits: digits, minimumFractionDigits: digits });
