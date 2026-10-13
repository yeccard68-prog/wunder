// Usage events – only with consent ("Nutzungsstatistik" in the settings, off by default), never in
// demo mode and never for children. An event is a name from a fixed list plus, at most, the id and
// kind of the content. Nothing else leaves the device. Table and rules: public.events.
import { supabase } from "./supabase";

export type EventName = "session_start" | "clip_start" | "clip_complete" | "animation_complete" | "insight_complete" | "book_open" | "content_save" | "recall_known" | "recall_again" | "clip_quiz_retry" | "animation_predict";
type Kind = "item" | "clip" | "animation" | "insight" | "book";

let enabled = false;
let queue: { name: EventName; content_id: string | null; content_kind: Kind | null }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let sessionSent = false;

async function flush() {
  timer = null;
  const rows = queue;
  queue = [];
  if (!rows.length || !supabase) return;
  // analytics must never get in the way of learning: failures are dropped silently
  await supabase.from("events").insert(rows).then(() => {}, () => {});
}

export function track(name: EventName, contentId?: string, kind?: Kind) {
  if (!enabled || !supabase) return;
  queue.push({ name, content_id: contentId ?? null, content_kind: kind ?? null });
  timer ??= setTimeout(flush, 4000); // a few events per request instead of one request per event
}

/** Called by the app shell whenever consent, mode or age band change. */
export function setAnalytics(on: boolean) {
  enabled = on;
  if (!on) queue = [];
  else if (!sessionSent) {
    sessionSent = true;
    track("session_start");
  }
}
