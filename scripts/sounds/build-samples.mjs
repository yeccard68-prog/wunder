// Builds the recorded instrument notes in public/sounds/ and their list lib/samples.json from original recordings of
// the Versilian Community Sample Library (VCSL, CC0 1.0 – free for any use, https://github.com/sgossner/VCSL).
//
//   node scripts/sounds/build-samples.mjs <folder with the VCSL .wav files> [--ffmpeg=<path>] [--organ=full|8|mix] [--check]
//
// Piano – "Grand Piano, Steinway B", no sustain pedal, close microphones, the middle of five loudness layers: one note
// every two semitones from E3 to E6 (scientific octave names, middle C = C4). Each note is cut to its attack, kept for
// 3 s with a gentle fade and stored as a mono MP3 (the player skips the few milliseconds of silence MP3 adds).
// Organ – "Renaissance Organ", room microphones, the full organ (the default, chosen by ear on 21.11.2026), the 8-foot
// stop or a blend of both: F#3–D4 in the
// maker's octave names (middle C = C3), i.e. the pitches the barrel organ needs. A sustained part of each note is
// turned into a seamless loop (crossfaded), so a pipe sounds for as long as its valve is open; stored as mono 16-bit
// WAV, because a compressed file would shift the loop points.
// One microphone channel is used: the two microphones stand apart, and mixed together (as a phone speaker would) they
// cancel parts of some notes. Every note is brought to the same loudness – the microphones pick up neighbouring notes
// very unevenly (up to 15 dB).
// Every note's pitch is measured: it must lie within 60 cents of the note it is named for (otherwise the build stops);
// the deviation of the fundamental is stored and corrected when the note is played.
// --check measures and prints without writing anything.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { crossfadeLoop, fade, findLoop, midiOf, onsetIndex, partial, pitch, rms, wav16 } from "./dsp.mjs";

const args = process.argv.slice(2);
const opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const src = args.find((a) => !a.startsWith("--"));
if (!src || !existsSync(src)) throw new Error("usage: node scripts/sounds/build-samples.mjs <folder with the VCSL .wav files>");
const FFMPEG = opt("ffmpeg", "ffmpeg");
const STOP = opt("organ", "full");
const CHECK = args.includes("--check");

const PIANO = {
  names: ["E3", "F#3", "G#3", "A#3", "C4", "D4", "E4", "F#4", "G#4", "A#4", "C5", "D5", "E5", "F#5", "G#5", "A#5", "C6", "D6", "E6"],
  file: (n) => `JHPiano_NoSus_Close_${n}_vl3_rr1.wav`,
  channel: "L", // the more even of the two close microphones
  c4: 4,
  rate: 44100,
  seconds: 3,
};
const ORGAN = {
  names: ["F#3", "G#3", "A#3", "C4", "D4"],
  // per stop: file name and microphone (the 8-foot flute is clearer on the right, the full organ's high pipes on the left)
  file: { 8: (n) => `RenOrgan_8foot_Room_${n}_rr1.wav`, full: (n) => `RenOrgan_Full_Room_${n}_rr1.wav` },
  channel: { 8: "R", full: "L" },
  c4: 3,
  rate: 32000,
};
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

/** One channel ("L" or "R") of a recording at `rate`. */
function decode(name, rate, channel) {
  const path = join(src, name);
  if (!existsSync(path)) throw new Error(`missing recording: ${path}`);
  const r = spawnSync(FFMPEG, ["-v", "error", "-i", path, "-ac", "2", "-ar", String(rate), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg could not read ${name}: ${r.stderr}`);
  const b = r.stdout, x = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length));
  const c = channel === "R" ? 1 : 0, out = new Float32Array(x.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = x[2 * i + c];
  return out;
}

/** Measured pitch near `at` (samples) compared with the note's: cents off, clarity; stops the build if it is wrong. */
function check(label, x, rate, at, midi) {
  const f = hz(midi);
  const p = pitch(x, rate, at, 4096, f / 2.2, f * 2.2);
  const cents = 1200 * Math.log2(p.hz / f);
  if (!(Math.abs(cents) < 60) || p.clarity < 0.5) throw new Error(`${label}: expected ${f.toFixed(1)} Hz, measured ${p.hz.toFixed(1)} Hz (${cents.toFixed(0)} cents, clarity ${p.clarity.toFixed(2)})`);
  return { cents: Math.round(cents * 10) / 10, clarity: p.clarity };
}

const peakOf = (x) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
const out = { piano: [], organ: [] };
const files = [];

// ---- piano: one-shots
{
  const { rate } = PIANO;
  const notes = PIANO.names.map((name) => {
    const midi = midiOf(name, PIANO.c4);
    const x = decode(PIANO.file(name), rate, PIANO.channel);
    const on = onsetIndex(x, 0.02, Math.round(0.003 * rate));
    const m = check(`piano ${name}`, x, rate, on + Math.round(0.15 * rate), midi);
    // tuning: the fundamental itself (the overtones of a piano string are a little sharp)
    m.cents = Math.round(12000 * Math.log2(partial(x, rate, on + Math.round(0.05 * rate), Math.round(0.5 * rate), hz(midi)) / hz(midi))) / 10;
    const seg = fade(x.slice(on, on + PIANO.seconds * rate), Math.round(0.001 * rate), Math.round(0.6 * rate));
    const level = rms(seg, 0, Math.round(0.4 * rate)); // the same loudness for every note (first 0.4 s)
    seg.forEach((v, i, a) => (a[i] = v / level));
    return { name, midi, seg, ...m };
  });
  const gain = 0.89 / Math.max(...notes.map((n) => peakOf(n.seg)));
  for (const n of notes) {
    n.seg.forEach((v, i, a) => (a[i] = v * gain));
    const file = `piano/${n.midi}.mp3`;
    out.piano.push({ midi: n.midi, cents: n.cents, file });
    files.push({ file, data: n.seg, rate, kind: "mp3" });
    console.log(`piano ${n.name.padEnd(4)} midi ${n.midi}  ${n.cents >= 0 ? "+" : ""}${n.cents} cents  clarity ${n.clarity.toFixed(2)}  peak ${peakOf(n.seg).toFixed(2)}`);
  }
}

// ---- organ: sustained notes with a seamless loop
{
  const { rate } = ORGAN;
  const stops = STOP === "mix" ? [["8", 0.6], ["full", 0.5]] : [[STOP, 1]];
  const notes = ORGAN.names.map((name) => {
    const midi = midiOf(name, ORGAN.c4);
    // the chosen stop(s), each from its own attack on
    let x = null;
    for (const [stop, level] of stops) {
      const y = decode(ORGAN.file[stop](name), rate, ORGAN.channel[stop]);
      const from = onsetIndex(y, 0.02, Math.round(0.01 * rate));
      const z = y.subarray(from);
      const steady = rms(z, Math.round(0.7 * rate), Math.round(1.7 * rate)); // the same loudness for every note
      if (!x) x = new Float32Array(z.length);
      for (let i = 0; i < Math.min(x.length, z.length); i++) x[i] += (level * z[i]) / steady;
    }
    const m = check(`organ ${name}`, x, rate, Math.round(0.8 * rate), midi);
    m.cents = Math.round(12000 * Math.log2(partial(x, rate, Math.round(0.8 * rate), Math.round(0.5 * rate), hz(midi)) / hz(midi))) / 10;
    const period = rate / (hz(midi) * 2 ** (m.cents / 1200));
    const loop = findLoop(x, Math.round(0.7 * rate), Math.round(1.0 * rate), Math.round(1.4 * rate), Math.round(4 * period));
    const seg = crossfadeLoop(x, loop.start, loop.end, Math.round(0.25 * rate), Math.round(0.03 * rate));
    fade(seg, Math.round(0.001 * rate), 0);
    return { name, midi, seg, loop, ...m };
  });
  const gain = 0.89 / Math.max(...notes.map((n) => peakOf(n.seg)));
  for (const n of notes) {
    n.seg.forEach((v, i, a) => (a[i] = v * gain));
    const file = `organ/${n.midi}.wav`;
    const r4 = (s) => Math.round((s / rate) * 1e5) / 1e5;
    out.organ.push({ midi: n.midi, cents: n.cents, file, loopStart: r4(n.loop.start), loopEnd: r4(n.loop.end) });
    files.push({ file, data: n.seg, rate, kind: "wav" });
    console.log(`organ ${n.name.padEnd(4)} midi ${n.midi}  ${n.cents >= 0 ? "+" : ""}${n.cents} cents  clarity ${n.clarity.toFixed(2)}  loop ${r4(n.loop.start)}–${r4(n.loop.end)} s (mismatch ${n.loop.err.toFixed(4)})`);
  }
}

if (CHECK) process.exit(0);
let bytes = 0;
for (const f of files) {
  const path = join("public/sounds", f.file);
  mkdirSync(join(path, ".."), { recursive: true });
  if (f.kind === "wav") writeFileSync(path, wav16(f.data, f.rate));
  else {
    const r = spawnSync(FFMPEG, ["-v", "error", "-y", "-f", "f32le", "-ar", String(f.rate), "-ac", "1", "-i", "-", "-c:a", "libmp3lame", "-b:a", "96k", path], { input: Buffer.from(f.data.buffer, f.data.byteOffset, f.data.byteLength), maxBuffer: 1 << 28 });
    if (r.status !== 0) throw new Error(`ffmpeg could not write ${path}: ${r.stderr}`);
  }
  bytes += statSync(path).size;
}
const list = {
  source: `Versilian Community Sample Library (VCSL), CC0 1.0, https://github.com/sgossner/VCSL – piano: Grand Piano, Steinway B (NoSus, Close, vl3); organ: Renaissance Organ (Room, ${STOP === "mix" ? "8' + Full" : STOP === "8" ? "8'" : "Full"})`,
  ...out,
};
writeFileSync("lib/samples.json", JSON.stringify(list, null, 1) + "\n");
console.log(`${files.length} files, ${(bytes / 1024).toFixed(0)} KB in public/sounds; list in lib/samples.json`);
