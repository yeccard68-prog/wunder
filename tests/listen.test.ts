import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { parseScore, noteName } from "../lib/lilypond";
import { allSnippets, duration, schedule, frequency } from "../lib/listen";
import { excerpt, SPECS } from "../scripts/content/listen";

const names = (src: string) => parseScore(src)!.notes.map((n) => (n.midi.length ? n.midi.map(noteName).join("+") : "r") + "/" + n.beats);

test("lilypond: relative pitches, durations, dots and ties", () => {
  // the start of "Ode to Joy" as Wikipedia prints it
  assert.deepEqual(names(`\\relative c' { \\key g \\major b' b c d | d c b a | g g a b | b4. a8 a2 }`),
    ["B4/1", "B4/1", "C5/1", "D5/1", "D5/1", "C5/1", "B4/1", "A4/1", "G4/1", "G4/1", "A4/1", "B4/1", "B4/1.5", "A4/0.5", "A4/2"]);
  assert.deepEqual(names(`\\relative c'' { g2~ g4 r4 }`), ["G4/3", "r/1"]); // tie merges, rest stays
  assert.deepEqual(names(`\\relative c { fis8 gis ais b }`), ["F♯3/0.5", "A♭3/0.5", "B♭3/0.5", "B3/0.5"]); // sharps (named by their key)
});

test("lilypond: absolute pitches, tempo, tuplets, chords, grace notes, dynamics and clef words", () => {
  const m = parseScore(`{ \\clef treble \\key c \\minor \\tempo "Allegro con brio" 2=108 \\time 2/4 { r8 g'\\ff[ g' g'] | ees'2 } }`)!;
  assert.equal(m.bpm, 216); // half = 108 → quarter = 216
  assert.deepEqual(m.notes.map((n) => n.midi.map(noteName).join() || "r"), ["r", "G4", "G4", "G4", "E♭4"]); // "treble" is not read as notes
  assert.equal(m.notes[1].vel, 1); // \ff belongs to the note before it
  const t = parseScore(`\\relative c'' { \\tuplet 3/2 { g8 a b } c4 }`)!;
  assert.deepEqual(t.notes.map((n) => +n.beats.toFixed(3)), [0.333, 0.333, 0.333, 1]);
  const c = parseScore(`\\relative c'' { g4 <<d4\\ff b' g'>> }`)!; // g next to c'' is G4, the chord builds up from D4
  assert.deepEqual(c.notes[1].midi.map(noteName), ["D4", "B4", "G5"]);
  assert.equal(c.notes[1].vel, 1);
  assert.deepEqual(names(`\\relative c'' { c4 \\acciaccatura f8 e8 d }`), ["C5/1", "E5/0.5", "D5/0.5"]); // grace note not played …
  assert.deepEqual(names(`\\relative c'' { c4 \\acciaccatura f'8 e8 d }`), ["C5/1", "E6/0.5", "D6/0.5"]); // … but it sets the octave
  assert.equal(parseScore(`{ \\new PianoStaff << \\new Staff { c'4 } >> }`), null); // several staves: not a single melody
});

test("listen: excerpts drop leading and trailing rests and keep whole notes", () => {
  const notes = [{ midi: [], beats: 1 }, { midi: [60], beats: 2 }, { midi: [62], beats: 2 }, { midi: [], beats: 1 }];
  assert.deepEqual(excerpt(notes), notes.slice(1, 3));
  assert.deepEqual(excerpt(notes, 0, 2), [notes[1]]);
  assert.deepEqual(excerpt(notes, 3), [notes[2]]);
});

test("listen: every snippet belongs to a published music question, is short and plays in tune", () => {
  const qs = JSON.parse(fs.readFileSync("content/questions.json", "utf8"));
  const questions = (qs.questions ?? qs) as { id: string; category_id: string; status: string; tags?: string[] }[];
  const snippets = allSnippets();
  assert.equal(snippets.length, SPECS.length);
  for (const s of snippets) {
    const q = questions.find((x) => x.id === s.id);
    assert.ok(q, `${s.id}: no question`);
    assert.equal(q.category_id, "music");
    assert.ok(q.tags?.includes("Hörprobe"), `${s.id}: tag Hörprobe`);
    assert.ok(s.url.includes("oldid=" + s.revid), `${s.id}: source pinned to a revision`);
    const secs = duration(s);
    assert.ok(secs > 2 && secs <= 20, `${s.id}: ${secs.toFixed(1)} s`);
    for (const n of schedule(s)) for (const f of n.freqs) assert.ok(f > 60 && f < 2100, `${s.id}: ${f} Hz`);
  }
  assert.equal(Math.round(frequency(69)), 440);
  // every question tagged Hörprobe has a snippet (otherwise the card would ask about music nobody can hear)
  for (const q of questions.filter((x) => x.tags?.includes("Hörprobe") && x.status === "published")) assert.ok(snippets.some((s) => s.id === q.id), `${q.id}: no snippet`);
});
