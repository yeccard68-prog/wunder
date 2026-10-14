// Polite access to source videos: files up to 300 MB are downloaded once into scripts/clips/.cache
// (one request, identified user agent); larger files are read remotely with pauses between requests.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const CACHE = path.join(here, ".cache");
export const USER_AGENT = "WunderLearningApp/0.1 (educational clips; contact: https://github.com/yeccard68-prog/wunder)";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX = 300e6;

/** Returns { input, remote }: a local cached file when possible, otherwise the URL. */
export async function sourceFor(id, url) {
  fs.mkdirSync(CACHE, { recursive: true });
  const ext = (new URL(url).pathname.match(/\.(\w+)$/)?.[1] ?? "bin").toLowerCase();
  const file = path.join(CACHE, `${id}.${ext}`);
  if (fs.existsSync(file) && fs.statSync(file).size > 10_000) return { input: file, remote: false };
  for (let attempt = 0; attempt < 4; attempt++) {
    const head = await fetch(url, { method: "HEAD", headers: { "User-Agent": USER_AGENT } });
    if (head.status === 429) {
      await sleep(15000 * (attempt + 1));
      continue;
    }
    const size = Number(head.headers.get("content-length") ?? 0);
    if (!head.ok || !size || size > MAX) return { input: url, remote: true };
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.status === 429) {
      await sleep(15000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`${id}: download failed (${res.status})`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    await sleep(1500);
    return { input: file, remote: false };
  }
  throw new Error(`${id}: source keeps answering 429 (rate limit) – try again later`);
}
