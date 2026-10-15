// Renders the own clips into the app: public/clips/<id>.mp4 + .jpg (German) and <id>.en.mp4 + .en.jpg (English),
// silent H.264 at 720×1280 like the other clips. Then updates the clip's entry in content/videos.json.
//   npm run render                    → all clips in src/clips.json
//   npm run render -- v-zinseszins    → only these
// Rendering happens on this machine (Remotion downloads a headless Chrome once). No cloud, no costs.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const CLI = path.join(here, "node_modules/@remotion/cli/remotion-cli.js");
const clips = JSON.parse(fs.readFileSync(path.join(here, "src/clips.json"), "utf8"));
const only = process.argv.slice(2);
const DATA = path.join(app, "content/videos.json");
const videos = JSON.parse(fs.readFileSync(DATA, "utf8"));
const remotion = (...args) => execFileSync(process.execPath, [CLI, ...args], { cwd: here, stdio: "inherit" });

for (const clip of clips) {
  if (only.length && !only.includes(clip.id)) continue;
  for (const locale of ["de", "en"]) {
    const comp = locale === "de" ? clip.id : `${clip.id}-en`;
    const base = path.join(app, "public/clips", locale === "de" ? clip.id : `${clip.id}.en`);
    remotion("render", "src/index.ts", comp, `${base}.mp4`, "--codec=h264", "--crf=24", "--x264-preset=slow", "--pixel-format=yuv420p", "--muted", "--log=error");
    remotion("still", "src/index.ts", comp, `${base}.jpg`, `--frame=${clip.thumbFrame}`, "--scale=0.5", "--image-format=jpeg", "--jpeg-quality=80", "--log=error");
    console.log(comp.padEnd(24), `${(fs.statSync(`${base}.mp4`).size / 1e6).toFixed(2)} MB`);
  }
  const v = videos.find((x) => x.id === clip.id);
  if (!v) {
    console.log(`${clip.id}: rendered, but not yet in content/videos.json – apply its content batch, then render again`);
    continue;
  }
  Object.assign(v, { video_url: `/clips/${clip.id}.mp4`, thumbnail_url: `/clips/${clip.id}.jpg`, duration_seconds: clip.seconds, has_audio: false, start_seconds: null, end_seconds: null });
  v.translations ??= {};
  v.translations.en = { ...v.translations.en, file: `/clips/${clip.id}.en.mp4`, poster: `/clips/${clip.id}.en.jpg` };
}
fs.writeFileSync(DATA, JSON.stringify(videos, null, 2) + "\n");
console.log("Next: npm run content:check in the app folder, then import the new rows.");
