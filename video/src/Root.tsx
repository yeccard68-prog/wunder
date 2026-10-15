// Every clip is registered once per language: "<id>" in German, "<id>-en" in English.
// The id is the clip's id in content/videos.json; length and preview frame live in clips.json (also read by render.mjs).
import type { ComponentType } from "react";
import { Composition } from "remotion";
import clips from "./clips.json";
import { MarathonRunden } from "./clips/MarathonRunden";
import { PyramideMond } from "./clips/PyramideMond";
import { Zinseszins } from "./clips/Zinseszins";
import { FPS, H, W, type Locale } from "./theme";

const COMPONENTS: Record<string, ComponentType<{ locale: Locale }>> = {
  "v-zinseszins": Zinseszins,
  "v-pyramide-mond": PyramideMond,
  "v-marathon-runden": MarathonRunden,
};

export function Root() {
  return (
    <>
      {clips.flatMap(({ id, seconds }) =>
        (["de", "en"] as const).map((locale) => (
          <Composition key={id + locale} id={locale === "de" ? id : `${id}-en`} component={COMPONENTS[id]} durationInFrames={seconds * FPS} fps={FPS} width={W} height={H} defaultProps={{ locale }} />
        ))
      )}
    </>
  );
}
