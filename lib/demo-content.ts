// Demo mode only: the local dataset including the answer key. Loaded with a dynamic import, so the
// live app never downloads it – a megabyte less, and the answers stay on the server (duels!).
import questionsJson from "../content/questions.json";
import videosJson from "../content/videos.json";
import { buildContent, type Content, type QuestionRow, type VideoRow } from "./content";

/** Demo mode: the local dataset including answers, invented like counts and fictional comments. */
export function demoContent(): Content {
  const questions = (questionsJson as unknown as (QuestionRow & { status: string; demo_popularity: number })[])
    .filter((q) => q.status === "published")
    .map((q) => ({ ...q, like_count: q.demo_popularity }));
  const videos = (videosJson as unknown as (VideoRow & { status: string; demo_popularity: number })[])
    .filter((v) => v.status === "published")
    .map((v) => ({ ...v, like_count: v.demo_popularity }));
  return buildContent(questions, videos);
}
