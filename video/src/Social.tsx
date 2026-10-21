// Versions for social media (TikTok, Reels, Shorts): the own clip, then a 3-second end card with the clip's quiz
// question, "answer in the app" and the link – the reason to install. Plus "Did you know?" picture posts
// (1080×1350) from the source-checked facts. Rendered locally by social.mjs into video/out/social/.
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { COMPONENTS } from "./clips";
import { C, ease, FONT, FPS, type Locale } from "./theme";

export const CLIP_SECONDS = 10;
export const END_SECONDS = 3;
export const LINK = "wunder-one.vercel.app";

export type SocialClipProps = { clipId: string; locale: Locale; question: string; options: string[] };
export type FactPostProps = { kicker: string; text: string; detail: string; source: string; color: string; locale: Locale };

const T = {
  de: { ask: "Weißt du's?", answer: "Antwort in der App", free: "kostenlos · mit Quellen" },
  en: { ask: "Do you know?", answer: "Answer in the app", free: "free · with sources" },
};

function Brand({ size = 56 }: { size?: number }) {
  return (
    <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: size, color: C.ink }}>
      Wunder<span style={{ color: C.accent }}>.</span>
    </span>
  );
}

function EndCard({ locale, question, options }: Omit<SocialClipProps, "clipId">) {
  const frame = useCurrentFrame();
  const t = T[locale];
  const appear = (from: number) => ({ opacity: ease(frame, from, from + 8), transform: `translateY(${(1 - ease(frame, from, from + 8)) * 18}px)` });
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: FONT.sans, padding: "120px 64px" }}>
      <div style={{ ...appear(0), fontSize: 26, fontWeight: 600, letterSpacing: 4, color: C.accent, textTransform: "uppercase" }}>{t.ask}</div>
      <div style={{ ...appear(4), marginTop: 28, fontFamily: FONT.display, fontSize: question.length > 70 ? 46 : 54, fontWeight: 600, lineHeight: 1.15 }}>{question}</div>
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }}>
        {options.map((o, i) => (
          <div key={i} style={{ ...appear(10 + i * 4), display: "flex", alignItems: "center", gap: 18, border: `2px solid ${C.line}`, borderRadius: 26, padding: "20px 24px", fontSize: 32 }}>
            <span style={{ width: 48, height: 48, borderRadius: 24, background: C.raised, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 600, color: C.muted }}>{"ABCD"[i]}</span>
            {o}
          </div>
        ))}
      </div>
      <div style={{ ...appear(34), position: "absolute", left: 64, right: 64, bottom: 300 }}>
        <div style={{ fontSize: 34, fontWeight: 600 }}>{t.answer} 👉</div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 18 }}>
          <Brand size={60} />
          <span style={{ fontSize: 30, color: C.muted }}>{LINK}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 24, color: C.muted }}>{t.free}</div>
      </div>
    </AbsoluteFill>
  );
}

export function SocialClip({ clipId, locale, question, options }: SocialClipProps) {
  const Clip = COMPONENTS[clipId];
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [CLIP_SECONDS * FPS, CLIP_SECONDS * FPS + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Sequence durationInFrames={CLIP_SECONDS * FPS}>
        <Clip locale={locale} />
      </Sequence>
      <Sequence from={CLIP_SECONDS * FPS} durationInFrames={END_SECONDS * FPS}>
        <AbsoluteFill style={{ opacity: fadeIn }}>
          <EndCard locale={locale} question={question} options={options} />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
}

/** A still picture post (rendered as PNG): "Did you know?" with the fact, one line of detail and the source. */
export function FactPost({ kicker, text, detail, source, color }: FactPostProps) {
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.ink, fontFamily: FONT.sans, padding: 96 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 14, background: color }} />
      <Brand size={52} />
      <div style={{ marginTop: 130, fontSize: 30, fontWeight: 600, letterSpacing: 3, color, textTransform: "uppercase" }}>{kicker}</div>
      <div style={{ marginTop: 34, fontFamily: FONT.display, fontSize: text.length > 110 ? 58 : text.length > 70 ? 66 : 76, fontWeight: 600, lineHeight: 1.16 }}>{text}</div>
      <div style={{ marginTop: 40, fontSize: 34, lineHeight: 1.45, color: "#c9c3ba" }}>{detail}</div>
      <div style={{ position: "absolute", left: 96, right: 96, bottom: 88, borderTop: `2px solid ${C.line}`, paddingTop: 28 }}>
        <div style={{ fontSize: 26, color: C.muted }}>{source}</div>
        <div style={{ marginTop: 10, fontSize: 30, fontWeight: 600 }}>{LINK}</div>
      </div>
    </AbsoluteFill>
  );
}
