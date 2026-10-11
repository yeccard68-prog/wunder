// Finds ffmpeg: PATH first, then the winget install location (Windows).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

export function ffmpegPath() {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "pipe" });
    return "ffmpeg";
  } catch {}
  const root = path.join(process.env.LOCALAPPDATA ?? "", "Microsoft", "WinGet", "Packages");
  if (fs.existsSync(root))
    for (const pkg of fs.readdirSync(root).filter((d) => d.startsWith("Gyan.FFmpeg")))
      for (const build of fs.readdirSync(path.join(root, pkg))) {
        const exe = path.join(root, pkg, build, "bin", "ffmpeg.exe");
        if (fs.existsSync(exe)) return exe;
      }
  throw new Error("ffmpeg not found – install it with: winget install Gyan.FFmpeg");
}
