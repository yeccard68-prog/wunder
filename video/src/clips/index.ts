// Every own clip by its id in content/videos.json – used by Root (app clips) and Social (versions for social media).
import type { ComponentType } from "react";
import type { Locale } from "../theme";
import { LichtReise } from "./LichtReise";
import { MarathonRunden } from "./MarathonRunden";
import { PapierMond } from "./PapierMond";
import { PyramideMond } from "./PyramideMond";
import { SonneMasse } from "./SonneMasse";
import { Zinseszins } from "./Zinseszins";

export const COMPONENTS: Record<string, ComponentType<{ locale: Locale }>> = {
  "v-zinseszins": Zinseszins,
  "v-pyramide-mond": PyramideMond,
  "v-marathon-runden": MarathonRunden,
  "v-papier-mond": PapierMond,
  "v-sonne-masse": SonneMasse,
  "v-licht-reise": LichtReise,
};
