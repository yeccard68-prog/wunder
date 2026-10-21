// Maps content records (content/*.json and the identical database rows) to app models,
// and tailors them to the user's language and age level.
// The JSON dataset is bundled ONLY for demo mode (no backend configured).
import type { AnswerKey } from "./formats";
import type { AgeBand, Difficulty, Item } from "./types";

/** Short learning video. Mirrors the `videos` table. */
export interface Clip {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  takeaway: string; // the one idea the clip teaches
  tags: string[];
  file: string; // video URL or app-bundled path
  poster: string | null; // preview image shown while the video loads
  start: number; // segment of the file that is played (seconds)
  end: number | null;
  duration: number; // seconds
  hasAudio: boolean;
  captions: string[]; // shown in order, spread over the clip
  creator: string;
  license: string | null;
  sources: { name: string; url: string }[];
  publishedAt: string;
  verification: Item["verification"];
  popularity: number;
  minAge: number;
  quiz: Item | null; // optional reinforcement question
  comments: { personId: string; text: string }[]; // demo mode only
  // file / poster: own clips with text in the picture are rendered once per language (video/, Remotion)
  translations?: Record<string, { title: string; hook: string; description?: string; captions: string[]; file?: string; poster?: string }>;
}

/** The caption to show at a moment of the clip: captions are spread over the clip in proportion to their length. */
export function captionAt(clip: Pick<Clip, "captions" | "start" | "duration">, time: number): string | undefined {
  const total = clip.captions.reduce((n, c) => n + c.length, 0);
  const progress = Math.min(0.999, Math.max(0, time - clip.start) / Math.max(1, clip.duration));
  let acc = 0;
  return clip.captions.find((c) => (acc += c.length / total) > progress);
}

/** Row shape shared by content/questions.json and public.questions (answers optional). */
export interface QuestionRow {
  id: string;
  kind: string;
  category_id: string;
  question: string;
  options: string[];
  difficulty: number;
  source_name: string | null;
  source_url: string | null;
  verification_status: string;
  show_in_feed: boolean;
  created_at: string;
  min_age?: number;
  max_age?: number | null;
  translations?: Record<string, { question: string; options: string[]; explanation?: string; hints?: string[] }>;
  hints?: string[] | null;
  like_count?: number;
  correct_index?: number;
  answer?: AnswerKey | null;
  explanation?: string;
}

export interface VideoRow {
  id: string;
  category_id: string;
  title: string;
  hook: string;
  description: string | null;
  video_url: string;
  thumbnail_url?: string | null;
  duration_seconds: number;
  has_audio: boolean;
  captions: string[];
  creator_name: string | null;
  sources: { name: string; url: string }[];
  published_at: string | null;
  tags: string[];
  quiz_question_id: string | null;
  verification_status: string;
  min_age?: number;
  start_seconds?: number | null;
  end_seconds?: number | null;
  license?: string | null;
  translations?: Clip["translations"];
  like_count?: number;
  demo_comments?: { personId: string; text: string }[];
}

export interface Content {
  items: Item[]; // feed items (video quizzes live on their clip)
  clips: Clip[];
}

export function toItem(r: QuestionRow): Item {
  return {
    id: r.id,
    kind: (["fact", "order", "estimate", "blank"].includes(r.kind) ? r.kind : "question") as Item["kind"],
    answerKey: r.answer ?? undefined,
    categoryId: r.category_id,
    question: r.question,
    options: r.options,
    correctIndex: r.correct_index,
    explanation: r.explanation,
    difficulty: r.difficulty as Difficulty,
    source: { name: r.source_name ?? "Quelle unbekannt", url: r.source_url ?? undefined },
    createdAt: r.created_at,
    popularity: r.like_count ?? 0,
    verification: r.verification_status as Item["verification"],
    minAge: r.min_age ?? 10,
    maxAge: r.max_age ?? null,
    hints: r.hints ?? undefined,
    translations: r.translations,
  };
}

/** Splits question rows into feed items and video quizzes, and attaches the quizzes to their clips. */
export function buildContent(questions: QuestionRow[], videos: VideoRow[]): Content {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return {
    items: questions.filter((q) => q.show_in_feed).map(toItem),
    clips: videos.map((v) => {
      const quiz = v.quiz_question_id ? byId.get(v.quiz_question_id) : undefined;
      return {
        id: v.id,
        categoryId: v.category_id,
        title: v.title,
        description: v.description ?? "",
        takeaway: v.hook,
        tags: v.tags,
        file: v.video_url,
        poster: v.thumbnail_url ?? null,
        start: Number(v.start_seconds ?? 0),
        end: v.end_seconds == null ? null : Number(v.end_seconds),
        duration: Number(v.duration_seconds),
        hasAudio: v.has_audio,
        captions: v.captions,
        creator: v.creator_name ?? "Unbekannt",
        license: v.license ?? null,
        sources: v.sources,
        publishedAt: v.published_at ?? "",
        verification: v.verification_status as Item["verification"],
        popularity: v.like_count ?? 0,
        minAge: v.min_age ?? 10,
        quiz: quiz ? toItem(quiz) : null,
        comments: v.demo_comments ?? [],
        translations: v.translations,
      };
    }),
  };
}

// ---------- language ----------
/** Shows an item in the requested language; untranslated items stay in the original language. */
export function localizeItem(item: Item, locale: string): Item {
  const t = item.translations?.[locale];
  return t ? { ...item, question: t.question, options: t.options, explanation: t.explanation ?? item.explanation, hints: t.hints ?? item.hints } : item;
}
/**
 * Own media files (/clips/…) can be served from another host – e.g. Cloudflare Pages, which has no bandwidth limit –
 * by setting NEXT_PUBLIC_MEDIA_BASE (like "https://wunder.pages.dev"). Empty: served by the app itself.
 */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE ?? "").replace(/\/$/, "");
export const media = (path: string) => (MEDIA_BASE && path.startsWith("/clips/") ? MEDIA_BASE + path : path);

export function localizeClip(clip: Clip, locale: string): Clip {
  const t = clip.translations?.[locale];
  const quiz = clip.quiz && localizeItem(clip.quiz, locale);
  const file = media(t?.file ?? clip.file);
  const poster = t?.poster ?? clip.poster;
  return t
    ? { ...clip, title: t.title, takeaway: t.hook, description: t.description ?? clip.description, captions: t.captions, file, poster: poster && media(poster), quiz }
    : { ...clip, file, poster: poster && media(poster), quiz };
}

// ---------- age levels ----------
// Only a band is known about the user, never a birth date. Content carries min_age (6, 10, 13, 16)
// and, for cards written for children, max_age. From 16 everything is shown.
export const AGE_BANDS: AgeBand[] = ["6-9", "10-12", "13-15", "16+"];
/**
 * The age bands the app is open to. For now only 16+: a younger person's account – even an
 * anonymous one – needs parental consent (GDPR Art. 8, COPPA), which the app cannot collect yet.
 * The filtering by age below stays in place for the day the younger bands are opened.
 */
export const OFFERED_AGE_BANDS: AgeBand[] = ["16+"];
/** null = not asked yet. */
export const ageAllowed = (band: AgeBand | null) => band === null || OFFERED_AGE_BANDS.includes(band);
const AGE_OF: Record<AgeBand, number> = { "6-9": 6, "10-12": 10, "13-15": 13, "16+": 16 };
export const ageOf = (band: AgeBand | null) => (band ? AGE_OF[band] : 16);
/** Under 13: no community, comments or sharing. Under 16: no self-service registration (parental consent). */
export const isChild = (band: AgeBand | null) => band === "6-9" || band === "10-12";
export const canRegister = (band: AgeBand | null) => band === null || band === "16+";
export const fitsAge = (c: { minAge: number; maxAge?: number | null }, band: AgeBand | null) => c.minAge <= ageOf(band) && (c.maxAge == null || ageOf(band) <= c.maxAge);

/** The content one user sees: right language, right age level. */
export function forAudience(content: Content, locale: string, band: AgeBand | null): Content {
  return {
    items: content.items.filter((i) => fitsAge(i, band)).map((i) => localizeItem(i, locale)),
    clips: content.clips.filter((c) => fitsAge(c, band)).map((c) => localizeClip(c, locale)),
  };
}
