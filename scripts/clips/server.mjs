// Sample-clip workflow: `npm run clips`, then open http://127.0.0.1:4010 in Chrome and press Start.
// 1. Narration is synthesised with the Windows voice (skipped on other systems → silent clips).
// 2. The browser page animates each clip on a canvas, records it and uploads the file.
// 3. Files land in public/clips/, duration + file name are written back to content/videos.json.
// Real productions replace these files with uploaded or provider-generated videos (see pipeline/video.ts).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "..");
const dataFile = path.join(root, "content", "videos.json");
const outDir = path.join(root, "public", "clips");
const tmp = path.join(here, ".tmp");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(tmp, { recursive: true });

const clips = () => JSON.parse(fs.readFileSync(dataFile, "utf8"));

if (process.platform === "win32") {
  for (const c of clips().filter((c) => c.production?.provider === "canvas_sample")) {
    const wav = path.join(tmp, c.id + ".wav");
    if (fs.existsSync(wav)) continue;
    const txt = path.join(tmp, c.id + ".txt");
    fs.writeFileSync(txt, c.production.narration, "utf8");
    const ps = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; try { $s.SelectVoiceByHints('NotSet', 'NotSet', 0, [cultureinfo]'de-DE') } catch {}; $s.Rate = 0; $s.SetOutputToWaveFile('${wav}'); $s.Speak([IO.File]::ReadAllText('${txt}', [Text.Encoding]::UTF8)); $s.Dispose()`;
    try {
      execFileSync("powershell", ["-NoProfile", "-Command", ps]);
      console.log("narration", c.id);
    } catch (e) {
      console.warn("no narration for", c.id, e.message);
    }
  }
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    if (req.method === "GET" && url.pathname === "/") return res.end(fs.readFileSync(path.join(here, "generator.html")));
    if (req.method === "GET" && url.pathname === "/clips.json") return res.end(fs.readFileSync(dataFile));
    if (req.method === "GET" && url.pathname.startsWith("/audio/")) {
      const f = path.join(tmp, path.basename(url.pathname));
      if (!fs.existsSync(f)) return res.writeHead(404).end();
      return res.end(fs.readFileSync(f));
    }
    if (req.method === "POST" && url.pathname.startsWith("/upload/")) {
      const id = path.basename(url.pathname);
      const ext = url.searchParams.get("ext") === "mp4" ? "mp4" : "webm";
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        for (const old of ["mp4", "webm"]) fs.rmSync(path.join(outDir, `${id}.${old}`), { force: true });
        fs.writeFileSync(path.join(outDir, `${id}.${ext}`), Buffer.concat(chunks));
        const all = clips();
        const clip = all.find((c) => c.id === id);
        clip.video_url = `/clips/${id}.${ext}`;
        clip.duration_seconds = Number(url.searchParams.get("duration"));
        clip.has_audio = url.searchParams.get("audio") === "1";
        fs.writeFileSync(dataFile, JSON.stringify(all, null, 2) + "\n");
        console.log("saved", clip.video_url, clip.duration_seconds + "s – run `npm run content:import -- --update` to publish the new metadata");
        res.end("ok");
      });
      return;
    }
    res.writeHead(404).end();
  })
  .listen(4010, "127.0.0.1", () => console.log("Open http://127.0.0.1:4010 and press Start"));
