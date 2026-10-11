// Builds the app's clips from freely licensed source videos.
//   npm run clips:build            → builds missing clips
//   npm run clips:build -- --force → rebuilds all
//   npm run clips:build -- v-id    → builds only the given clips
//
// For every video in content/videos.json with production.provider = "external" it cuts the segment
// production.start–end from production.source_url, converts it to a vertical 720×1280 H.264 file
// without sound, writes a preview image and stores both under public/clips/.
//   mode "crop": fill the screen (centre given by production.x / production.y, 0–1)
//   mode "tall": 3:4 picture on a blurred background (keeps more of a wide image)
//   mode "wide": whole picture on a blurred background (for footage that must not be cropped)
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ffmpegPath } from "./ffmpeg.mjs";
import { sourceFor, USER_AGENT } from "./source.mjs";

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));
const FF = ffmpegPath();
const PROBE = FF.replace(/ffmpeg(\.exe)?$/, "ffprobe$1");
const DATA = "content/videos.json";
const OUT = "public/clips";
const videos = JSON.parse(fs.readFileSync(DATA, "utf8"));
fs.mkdirSync(OUT, { recursive: true });

function filter(p) {
  const x = p.x ?? 0.5;
  const y = p.y ?? 0.5;
  const pre = p.cropBottom ? `crop=iw:ih*${1 - p.cropBottom}:0:0,` : "";
  const cut = (ratio) => `crop='min(iw,ih*(${ratio}))':'min(ih,iw/(${ratio}))':(iw-ow)*${x}:(ih-oh)*${y}`;
  if ((p.mode ?? "crop") === "crop") return `[0:v]${pre}${cut("9/16")},scale=720:1280:flags=lanczos,fps=30,format=yuv420p[v]`;
  const fg = p.mode === "tall" ? `${cut("3/4")},scale=720:960:flags=lanczos` : `scale=720:-2:flags=lanczos`;
  const top = p.mode === "tall" ? 96 : "(H-h)/2-90";
  return `[0:v]${pre}split[a][b];[a]${cut("9/16")},scale=720:1280,boxblur=24:2,eq=brightness=-0.18:saturation=0.8[bg];[b]${fg}[fg];[bg][fg]overlay=0:${top},fps=30,format=yuv420p[v]`;
}

let built = 0;
for (const v of videos) {
  const p = v.production;
  if (p?.provider !== "external" || (only.length && !only.includes(v.id))) continue;
  const mp4 = path.join(OUT, v.id + ".mp4");
  const jpg = path.join(OUT, v.id + ".jpg");
  if (fs.existsSync(mp4) && fs.existsSync(jpg) && !force && !only.length) continue;
  try {
    const { input, remote } = await sourceFor(p.cache ?? v.id, p.source_url);
    const net = remote ? ["-user_agent", USER_AGENT] : [];
    const loop = !remote && p.loops > 1 ? ["-stream_loop", String(p.loops - 1)] : [];
    const length = (p.end - p.start) * (loop.length ? p.loops : 1);
    execFileSync(FF, ["-y", "-v", "error", ...net, ...loop, "-ss", String(p.start), "-i", input, "-t", String(length), "-filter_complex", filter(p), "-map", "[v]", "-an",
      "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-maxrate", "2400k", "-bufsize", "4800k", "-profile:v", "high", "-movflags", "+faststart", mp4], { stdio: "pipe", timeout: 600000 });
    const duration = Number(execFileSync(PROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString().trim());
    execFileSync(FF, ["-y", "-v", "error", "-ss", String(Math.min(duration / 3, 3)), "-i", mp4, "-frames:v", "1", "-vf", "scale=360:640", "-q:v", "4", jpg], { stdio: "pipe" });
    Object.assign(v, { video_url: `/clips/${v.id}.mp4`, thumbnail_url: `/clips/${v.id}.jpg`, duration_seconds: Math.round(duration * 100) / 100, start_seconds: null, end_seconds: null, has_audio: false });
    built++;
    console.log(v.id.padEnd(16), `${duration.toFixed(1)}s`, `${(fs.statSync(mp4).size / 1e6).toFixed(2)} MB`, remote ? "(remote source)" : "");
  } catch (e) {
    console.log(v.id, "FAILED:", String(e.stderr ?? e.message).slice(0, 300));
  }
}
fs.writeFileSync(DATA, JSON.stringify(videos, null, 2) + "\n");
console.log(`${built} clips built → ${OUT}/. Next: npm run content:check, then import.`);
