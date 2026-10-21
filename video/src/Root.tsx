// Every clip is registered once per language: "<id>" in German, "<id>-en" in English.
// The id is the clip's id in content/videos.json; length and preview frame live in clips.json (also read by render.mjs).
// Social versions ("social-<id>-<locale>", "fact-<id>-<locale>") come from social.json, written by social.mjs.
import { Composition, Still } from "remotion";
import clips from "./clips.json";
import { COMPONENTS } from "./clips";
import social from "./social.json";
import { CLIP_SECONDS, END_SECONDS, FactPost, SocialClip, type FactPostProps, type SocialClipProps } from "./Social";
import { FPS, H, W } from "./theme";

const socialClips = social.clips as SocialClipProps[];
const factPosts = social.facts as (FactPostProps & { id: string })[];

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
      {factPosts.map(({ id, ...p }) => (
        <Still key={`f${id}${p.locale}`} id={`fact-${id}-${p.locale}`} component={FactPost} width={1080} height={1350} defaultProps={p} />
      ))}
    </>
  );
}
