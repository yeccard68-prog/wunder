import type { Visual } from "@/lib/visuals";

/** What every visualisation component receives. */
export interface VizProps {
  visual: Visual;
  color: string; // colour of the topic
  locale: string;
  revealed: boolean; // the prediction has been made (or there is none): hidden parts may be shown
  onChange?: () => void; // the learner changed something
}
