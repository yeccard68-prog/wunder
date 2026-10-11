// Video production pipeline – contracts only. Nothing here calls a paid service by itself.
//
//   verified source → concise script → factual review → visual/video generation or editing
//   → captions → quality checks → moderation → publication
//
// The script and review steps reuse the text pipeline in run.ts (Claude, source-quote rule).
// Video generation is NOT part of the Claude API: providers are pluggable, cost money per clip,
// and manual uploads are always supported.

import type { SourceDocument } from "./types";

/** One clip = one takeaway. Written from a single verified source. */
export interface ClipScript {
  title: string;
  takeaway: string;
  narration: string; // ≤ 25 words → 5–10 seconds
  captions: string[];
  categoryId: string;
  format: "animated_fact" | "timeline" | "visualization" | "ai_generated" | "creator" | "current_event";
  visualBrief: string; // what should be seen; input for a generator or an editor
  supportingQuote: string; // verbatim from the source
  source: SourceDocument;
}

export interface RenderedVideo {
  file: string; // local path or storage reference
  durationSeconds: number;
  provider: string;
  costUsd: number; // 0 for manual uploads and canvas samples
}

/** Anything that turns a script into a video file. */
export interface VideoProvider {
  name: string; // "manual_upload" | "canvas_sample" | a generation service
  estimateCostUsd(script: ClipScript): number;
  render(script: ClipScript): Promise<RenderedVideo>;
}

/** Checks that must pass before a clip may reach moderation. */
export interface QualityReport {
  durationOk: boolean; // 5–10 s (hard limit 15 s)
  hasCaptions: boolean;
  hasSource: boolean;
  fileSizeOk: boolean; // target ≤ 1.5 MB per clip at 720p
  notes: string[];
}

export function checkQuality(script: ClipScript, video: RenderedVideo, fileBytes: number): QualityReport {
  const notes: string[] = [];
  const durationOk = video.durationSeconds >= 5 && video.durationSeconds <= 15;
  if (!durationOk) notes.push(`Dauer ${video.durationSeconds}s außerhalb 5–15 s`);
  const hasCaptions = script.captions.length > 0;
  if (!hasCaptions) notes.push("Untertitel fehlen");
  const hasSource = !!script.source.url && script.source.text.includes(script.supportingQuote.trim());
  if (!hasSource) notes.push("Quelle oder Belegzitat fehlt");
  const fileSizeOk = fileBytes <= 1_500_000;
  if (!fileSizeOk) notes.push(`Datei ${(fileBytes / 1e6).toFixed(1)} MB – stärker komprimieren`);
  return { durationOk, hasCaptions, hasSource, fileSizeOk, notes };
}

/** Publication gate: a human approves; AI checks alone never mark a clip "verified". */
export type ModerationDecision = { status: "approved" | "rejected"; reviewer: string; reason?: string };

// Providers available today:
// - "canvas_sample": scripts/clips (npm run clips) – animated bar comparisons with system voice, free.
// - "manual_upload": drop an MP4 into public/clips and add its entry to lib/clips.data.json.
// A generation service can be added by implementing VideoProvider; keep its key server-side
// and record costUsd per clip (videos.generation_cost_usd).
