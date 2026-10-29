import type { Visual } from "@/lib/visuals";

/** What every visualisation component receives. */
export interface VizProps {
  visual: Visual;
  color: string; // colour of the topic
  locale: string;
  revealed: boolean; // the prediction has been made (or there is none): hidden parts may be shown
  saved?: Record<string, number>; // slider values from the last visit (this device) – the picture starts where it was left
  onChange?: (values?: Record<string, number>) => void; // the learner changed something; sliders pass all their values to keep
}
