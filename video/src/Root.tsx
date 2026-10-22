// Every clip is registered once per language: "<id>" in German, "<id>-en" in English.
// The id is the clip's id in content/videos.json; length and preview frame live in clips.json (also read by render.mjs).
// Social versions ("social-<id>-<locale>", "fact-<id>-<locale>") come from social.json, written by social.mjs;
// "On this day" clips ("day-<event id>-<locale>") straight from the app's content/days.json (days.mjs renders them).
import { Composition, Still } from "remotion";
import days from "../../content/days.json";
import clips from "./clips.json";
import { COMPONENTS } from "./clips";
import { DAY_SECONDS, DayClip, type DayClipProps } from "./DayClip";
import social from "./social.json";
import { CLIP_SECONDS, END_SECONDS, FactPost, SocialClip, type FactPostProps, type SocialClipProps } from "./Social";
import { CATEGORY_COLORS, FPS, H, W } from "./theme";

const socialClips = social.clips as SocialClipProps[];
const factPosts = social.facts as (FactPostProps & { id: string })[];
const dayClips = days.flatMap((e) =>
  (["de", "en"] as const).map((locale): DayClipProps & { id: string } => ({
    id: `day-${e.id}-${locale}`, locale, date: e.date, year: e.year, color: CATEGORY_COLORS[e.category_id] ?? "#ff6d48",
    text: locale === "de" ? e.text : e.translations.en.text,
    source: (locale === "de" ? "Quelle: " : "Source: ") + e.sources.map((s) => s.name.replace(/^Wikipedia(?: (englisch))?: /, "Wikipedia – ")).join(", "),
  }))
);

export function Root() {
  return (
    <>
      {clips.flatMap(({ id, seconds }) =>
        (["de", "en"] as const).map((locale) => (
          <Composition key={id + locale} id={locale === "de" ? id : `${id}-en`} component={COMPONENTS[id]} durationInFrames={seconds * FPS} fps={FPS} width={W} height={H} defaultProps={{ locale }} />
        ))
      )}
      {socialClips.map((p) => (
        <Composition key={`s${p.clipId}${p.locale}`} id={`social-${p.clipId}-${p.locale}`} component={SocialClip} durationInFrames={(CLIP_SECONDS + END_SECONDS) * FPS} fps={FPS} width={W} height={H} defaultProps={p} />
      ))}
      {dayClips.map(({ id, ...p }) => (
        <Composition key={id} id={id} component={DayClip} durationInFrames={DAY_SECONDS * FPS} fps={FPS} width={W} height={H} defaultProps={p} />
      ))}
      {factPosts.map(({ id, ...p }) => (
        <Still key={`f${id}${p.locale}`} id={`fact-${id}-${p.locale}`} component={FactPost} width={1080} height={1350} defaultProps={p} />
      ))}
    </>
  );
}
