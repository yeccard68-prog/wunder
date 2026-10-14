// Renders the Android launcher icons and the splash background from public/icon.svg.
//   node scripts/app/icons.mjs            (after `npx cap add android`; idempotent)
// Sizes follow Android's density buckets. The adaptive icon (Android 8+) gets the white W mark on
// the dark background as foreground, with the safe zone (inner 66 %) respected.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const res = "android/app/src/main/res";
if (!fs.existsSync(res)) throw new Error("android/ is missing – run `npx cap add android` first");
const svg = fs.readFileSync("public/icon.svg");
// foreground for the adaptive icon: the mark only, scaled into the safe zone, transparent around it
const mark = Buffer.from(
  svg
    .toString()
    .replace(/<rect[^>]*\/>/, "")
    .replace('viewBox="0 0 512 512"', 'viewBox="-140 -140 792 792"'),
);
const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

for (const [name, k] of Object.entries(densities)) {
  const dir = path.join(res, `mipmap-${name}`);
  fs.mkdirSync(dir, { recursive: true });
  const legacy = Math.round(48 * k);
  const adaptive = Math.round(108 * k);
  await sharp(svg, { density: 384 }).resize(legacy, legacy).png().toFile(path.join(dir, "ic_launcher.png"));
  // round icon: the same picture, cut to a circle
  const circle = Buffer.from(`<svg width="${legacy}" height="${legacy}"><circle cx="${legacy / 2}" cy="${legacy / 2}" r="${legacy / 2}"/></svg>`);
  await sharp(svg, { density: 384 }).resize(legacy, legacy).composite([{ input: circle, blend: "dest-in" }]).png().toFile(path.join(dir, "ic_launcher_round.png"));
  await sharp(mark, { density: 384 }).resize(adaptive, adaptive).png().toFile(path.join(dir, "ic_launcher_foreground.png"));
}
// background colour of the adaptive icon
const values = path.join(res, "values");
fs.mkdirSync(values, { recursive: true });
fs.writeFileSync(path.join(values, "ic_launcher_background.xml"), `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#1A1714</color>\n</resources>\n`);
// splash screen: the mark on the dark background, in every size the template ships (replaces Capacitor's logo)
for (const dir of fs.readdirSync(res).filter((d) => d.startsWith("drawable"))) {
  const file = path.join(res, dir, "splash.png");
  if (!fs.existsSync(file)) continue;
  const { width, height } = await sharp(file).metadata();
  const size = Math.round(Math.min(width, height) * 0.28);
  const logo = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
  await sharp({ create: { width, height, channels: 4, background: "#1a1714" } }).composite([{ input: logo, gravity: "center" }]).png().toFile(file + ".tmp");
  fs.renameSync(file + ".tmp", file);
}
// store listing icon (512 × 512, required by Google Play)
fs.mkdirSync("store", { recursive: true });
await sharp(svg, { density: 384 }).resize(512, 512).flatten({ background: "#1a1714" }).png().toFile("store/icon-512.png");
console.log("Launcher icons written for", Object.keys(densities).join(", "), "+ splash screens + store/icon-512.png");
