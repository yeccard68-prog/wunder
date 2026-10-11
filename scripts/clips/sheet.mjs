// Contact sheets for choosing clip segments: 12 frames of a source video in one image.
//   node scripts/clips/sheet.mjs <candidates.json> <outDir> [id[:from-to] ...]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ffmpegPath } from "./ffmpeg.mjs";
import { sleep, sourceFor, USER_AGENT } from "./source.mjs";

const [file, outDir, ...only] = process.argv.slice(2);
const cands = JSON.parse(fs.readFileSync(file, "utf8"));
fs.mkdirSync(outDir, { recursive: true });
const FF = ffmpegPath();
const PROBE = FF.replace(/ffmpeg(\.exe)?$/, "ffprobe$1");
const N = 12;

for (const spec of only.length ? only : Object.keys(cands)) {
  const [id, range] = spec.split(":");
  const c = cands[id];
  try {
    const { input, remote } = await sourceFor(id, c.url);
    const net = remote ? ["-user_agent", USER_AGENT] : [];
    const dur = c.duration || Number(execFileSync(PROBE, [...net, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", input]).toString().trim());
    const [from, to] = range ? range.split("-").map(Number) : [0, dur];
    const tmp = path.join(outDir, "_" + id);
    fs.mkdirSync(tmp, { recursive: true });
    for (let i = 0; i < N; i++) {
      const t = from + ((to - from) * (i + 0.5)) / N;
      execFileSync(FF, ["-y", "-v", "error", ...net, "-ss", t.toFixed(2), "-i", input, "-frames:v", "1", "-vf", `scale=-2:210,drawtext=fontfile='C\\:/Windows/Fonts/arialbd.ttf':text='${t.toFixed(1)}':x=4:y=4:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.7`, path.join(tmp, `f${String(i).padStart(2, "0")}.jpg`)], { stdio: "pipe", timeout: 180000 });
      if (remote) await sleep(2500);
    }
    execFileSync(FF, ["-y", "-v", "error", "-i", path.join(tmp, "f%02d.jpg"), "-vf", "tile=6x2:padding=2", "-frames:v", "1", "-q:v", "5", path.join(outDir, id + ".jpg")], { stdio: "pipe" });
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(id, `${Math.round(dur)}s`, remote ? "(remote)" : "(cached)", "ok");
  } catch (e) {
    console.log(id, "FAILED:", String(e.stderr ?? e.message).slice(0, 160));
  }
}
