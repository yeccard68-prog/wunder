// The answer key never ships with the app: everything under public/ is copied into the site as it is, so no file there
// may contain answers. The generated question sets live in content/gen and reach the database from GitHub
// (docs/BACKEND.md section 134).  Run: npm test
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const TEXT = /\.(json|js|mjs|txt|csv|html|xml|webmanifest)$/i;
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

test("no answers in the files the site serves (public/)", () => {
  const leaks = walk("public").filter((f) => TEXT.test(f) && /"correct_index"\s*:/.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(leaks, []);
});

test("generated question sets live outside public/", () => {
  assert.ok(!fs.existsSync("public/gen"), "public/gen would be downloadable from the site");
  assert.ok(fs.readdirSync("content/gen").filter((f) => f.endsWith(".json")).length > 50);
});
