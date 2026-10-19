// The review desk's view of content: every piece as something to read – the exact texts the app
// shows, in one language at a time – plus its review state. Pure functions, so they can be tested.
import { animationRows, type AnimationRow } from "./animations";
import { bookRows, EVIDENCE_NAME, FORMAT_NAME, type BookRow } from "./books";
import { contentHash, type BundleKind } from "./reviews";
import type { ContentReview, ReviewItem, ReviewKind } from "./supabase";
import { AREAS, factRows } from "./facts";
import { formatYear, visualRows, type BarsConfig, type ScatterConfig, type TimelineConfig, type VisualRow } from "./visuals";

export interface Block {
  label?: string; // small heading above the text
  text: string;
  tone?: "good" | "muted"; // good = the correct answer
}
export type ReviewState = "open" | "approved" | "change" | "outdated" | "reported";
export interface ReviewEntry {
  kind: ReviewKind;
  id: string;
  categoryId: string;
  title: string;
  hash: string | null; // fingerprint of the version shown (bundled content only)
  state: ReviewState;
  reports: number;
  withdrawn: boolean; // taken out of the app after reports
  note: string | null;
  link: string | null; // where to see it in the app
  blocks: Block[];
  sources: { name: string; url: string }[];
}

type Tr = (german: string, vars?: Record<string, string | number>) => string;

const bookBlocks = (b: BookRow, locale: string, t: Tr): Block[] => {
  const x = locale === "de" ? { ...b, ideas: b.ideas } : { ...b, ...b.translations[locale], ideas: b.ideas.map((idea, i) => ({ ...idea, ...(b.translations[locale]?.ideas[i] ?? {}) })) };
  const out: Block[] = [
    { label: t("Lernziel"), text: x.goal },
    { label: t("Kernthese"), text: x.thesis },
  ];
  x.ideas.forEach((idea, i) => {
    out.push({ label: `${t("Idee {n}", { n: i + 1 })} · ${t(FORMAT_NAME[b.ideas[i].format])} · ${t(EVIDENCE_NAME[b.ideas[i].evidence])}`, text: idea.title });
    out.push({ label: t("Einstiegsfrage"), text: idea.hook, tone: "muted" });
    out.push({ text: idea.text });
    out.push({ label: t("Beispiel"), text: idea.example });
    out.push({ label: t("Aus dem Kopf"), text: `${idea.recall.question} → ${idea.recall.answer}` });
    if (idea.transfer) {
      out.push({ label: t("Übertrage es"), text: idea.transfer.situation });
      idea.transfer.options.forEach(([option, feedback], k) => out.push({ text: `${k === idea.transfer!.best ? "✓" : "·"} ${option} – ${feedback}`, tone: k === idea.transfer!.best ? "good" : "muted" }));
    }
    out.push({ label: t("Merksatz"), text: idea.takeaway });
  });
  out.push({ label: t("Einordnung und Kritik"), text: x.limits }, { label: t("Zum Weiterdenken"), text: x.reflect });
  return out;
};

const animationBlocks = (a: AnimationRow, locale: string, t: Tr): Block[] => {
  const tr = a.translations[locale];
  const steps = a.steps.map((s, i) => tr?.steps[i] ?? s.text);
  const predict = a.predict ? { ...a.predict, ...(tr?.predict ?? {}) } : null;
  return [
    { label: t("Lernziel"), text: tr?.goal ?? a.goal },
    ...steps.map((text, i) => ({ label: t("Schritt {n}", { n: i + 1 }), text })),
    { label: t("Beschriftungen im Bild"), text: (tr?.labels ?? a.labels).join(" · "), tone: "muted" as const },
    ...(predict ? [{ label: `${t("Vorhersagefrage")} (${t("vor Schritt {n}", { n: predict.step + 1 })})`, text: predict.question }, ...predict.options.map((o, k) => ({ text: `${k === predict.correct ? "✓" : "·"} ${o}`, tone: (k === predict.correct ? "good" : "muted") as Block["tone"] }))] : []),
  ];
};

const visualBlocks = (v: VisualRow, locale: string, t: Tr): Block[] => {
  const x = { ...v, ...(v.translations[locale] ?? {}) };
  const L = x.labels;
  const data: string[] =
    v.type === "bars" ? (v.config as BarsConfig).items.map((i) => `${L[i.key]}: ${i.value} ${(v.config as BarsConfig).unit}`)
    : v.type === "timeline" ? (v.config as TimelineConfig).items.map((i) => `${formatYear(i.year, locale, (v.config as TimelineConfig).from < 0)} ${L[i.key]}`)
    : v.type === "scatter" ? (v.config as ScatterConfig).points.map((p) => `${L[p.key]}: ${p.x} / ${p.y}`)
    : [JSON.stringify(v.config)];
  return [
    { label: t("Lernziel"), text: x.goal },
    { label: t("Einleitung"), text: x.intro },
    { label: v.data_kind === "real" ? t("Echte Daten") : t("Rechenmodell mit Beispielzahlen"), text: data.join(" · "), tone: "muted" },
    { label: t("Annahmen und Grenzen"), text: x.note },
    ...(x.predict ? [{ label: t("Erst schätzen"), text: x.predict.question }, ...x.predict.options.map((o, k) => ({ text: `${k === v.predict_correct ? "✓" : "·"} ${o}`, tone: (k === v.predict_correct ? "good" : "muted") as Block["tone"] })), { text: x.predict.feedback }] : []),
    { label: t("Warum ist das so?"), text: x.explain },
    ...(x.apply ? [{ label: t("Probier es aus"), text: x.apply }] : []),
  ];
};

/** Review state of a piece from the editors' decisions (and, for bundled content, the version). */
export function stateOf(kind: ReviewKind, id: string, hash: string | null, reviews: Map<string, ContentReview>, verified = false): { state: ReviewState; note: string | null } {
  const r = reviews.get(`${kind}:${id}`);
  if (verified) return { state: "approved", note: r?.note ?? null };
  if (!r) return { state: "open", note: null };
  if (r.decision === "change") return { state: "change", note: r.note };
  if (hash && r.content_hash !== hash) return { state: "outdated", note: r.note }; // approved, but the text has changed since
  return { state: "approved", note: r.note };
}

/** Books, animations and visualisations as review entries, in the chosen language. */
export function bundleEntries(locale: string, reviews: Map<string, ContentReview>, t: Tr): ReviewEntry[] {
  const make = (kind: BundleKind, row: { id: string; status: string; verification_status: string; sources: { name: string; url: string }[] }, categoryId: string, title: string, link: string, blocks: Block[]): ReviewEntry => {
    const hash = contentHash(row);
    const { state, note } = stateOf(kind, row.id, hash, reviews, row.verification_status === "verified");
    return { kind, id: row.id, categoryId, title, hash, state, reports: 0, withdrawn: false, note, link, blocks, sources: row.sources };
  };
  return [
    ...bookRows.filter((b) => b.status === "published").map((b) => make("book", b, b.topic_id, `${locale === "de" ? b.title_de : b.title} – ${b.author}`, `/books/?b=${b.id}`, bookBlocks(b, locale, t))),
    ...animationRows.filter((a) => a.status === "published").map((a) => make("animation", a, a.category_id, a.translations[locale]?.title ?? a.title, `/explain/?a=${a.id}`, animationBlocks(a, locale, t))),
    ...visualRows.filter((v) => v.status === "published").map((v) => make("visual", v, v.category_id, v.translations[locale]?.title ?? v.title, `/lab/?v=${v.id}`, visualBlocks(v, locale, t))),
    ...factRows.filter((f) => f.status === "published").map((f) => {
      const tr = f.translations[locale] ?? f;
      return make("fact", f, f.category_id, tr.text, "/facts/", [{ label: t(AREAS[f.area]), text: tr.detail }]);
    }),
  ];
}

/** Questions and clips from the database queue as review entries. */
export function databaseEntries(items: ReviewItem[], locale: string, reviews: Map<string, ContentReview>): ReviewEntry[] {
  return items.map((item) => {
    const en = locale === "en" && item.en ? item.en : null;
    const options = en?.options ?? item.options;
    const hints = en?.hints ?? item.hints ?? [];
    const blocks: Block[] = [
      ...(options ?? []).map((o, i) => ({ text: `${i === item.correctIndex ? "✓" : "·"} ${o}`, tone: (i === item.correctIndex ? "good" : "muted") as Block["tone"] })),
      { text: en?.body ?? item.body },
      ...hints.map((h, i) => ({ label: `Tipp ${i + 1}`, text: h })),
    ];
    const review = stateOf(item.kind, item.id, null, reviews);
    const state: ReviewState = item.status === "review" || item.reports > 0 ? "reported" : review.state === "change" ? "change" : "open";
    return {
      kind: item.kind, id: item.id, categoryId: item.categoryId, title: en?.title ?? item.title, hash: null, state, reports: item.reports, withdrawn: item.status === "review",
      note: review.note ?? item.note, link: null, blocks, sources: item.sourceUrl ? [{ name: item.sourceName ?? item.sourceUrl, url: item.sourceUrl }] : [],
    };
  });
}
