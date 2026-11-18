// A small reader for the LilyPond melodies in Wikipedia's <score> tags – just enough for single-line themes:
// \relative and absolute pitches, durations with dots, rests, ties, chords, tuplets and the tempo mark.
// Everything else (dynamics, articulation, slurs, beams, markup, grace notes) is skipped.
// The listening cards ("Hörproben") are built from it, so a theme is played exactly as Wikipedia notates it.

export type Note = { midi: number[]; beats: number; vel?: number }; // midi: [] = rest; beats in quarter notes; vel 0–1 from the dynamics (pp … ff)
export type Melody = { notes: Note[]; bpm: number }; // bpm: quarter notes per minute

const STEP: Record<string, number> = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 };
const SEMI = [0, 2, 4, 5, 7, 9, 11];

type Pitch = { step: number; octave: number; alter: number }; // octave: 0 = the octave starting at middle C (c')
const midiOf = (p: Pitch) => 60 + 12 * p.octave + SEMI[p.step] + p.alter;

/** "fis''" → step, alteration and octave marks (Dutch note names: is = sharp, es/s = flat). */
function readPitch(tok: string): { step: number; alter: number; marks: number } | null {
  const m = /^([a-g])((?:is|es|s)*)([',]*)/.exec(tok);
  if (!m) return null;
  let alter = 0;
  for (const a of m[2].match(/is|es|s/g) ?? []) alter += a === "is" ? 1 : -1;
  const marks = [...m[3]].reduce((n, c) => n + (c === "'" ? 1 : -1), 0);
  return { step: STEP[m[1]], alter, marks };
}

/** Relative mode: the octave that puts the note closest (at most a fourth) to the previous one, then the marks. */
function relative(prev: Pitch, step: number, alter: number, marks: number): Pitch {
  let octave = prev.octave;
  const d = step - prev.step;
  if (d > 3) octave -= 1;
  else if (d < -3) octave += 1;
  return { step, alter, octave: octave + marks };
}

/** Strips everything that does not change pitch or rhythm, so the rest can be read token by token. */
function clean(src: string): string {
  let s = src.replace(/%.*$/gm, " ");
  s = s.replace(/\\addlyrics\s*\{[^}]*\}/g, " ");
  s = s.replace(/\\(?:layout|paper|header|midi)\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, " ");
  s = s.replace(/[_^-]?\\markup\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, " ");
  s = s.replace(/[_^]"[^"]*"/g, " "); // ^"First theme" – a plain "…" stays (tempo words)
  s = s.replace(/\\set\s+[\w.]+\s*=\s*(?:#?"[^"]*"|#*'?\([^)]*\)|\S+)/g, " ");
  s = s.replace(/\\override\s+[\w.#']+\s*=\s*(?:#?"[^"]*"|#*'?\((?:[^()]|\([^()]*\))*\)|\S+)/g, " ");
  s = s.replace(/\\afterGrace\s*([a-g][^\s{(]*)\s*\(?\s*\{[^}]*\}/g, " $1 "); // main note only
  s = s.replace(/\\[<>!]/g, " "); // hairpins
  s = s.replace(/\\clef\s*(?:"[^"]*"|\w+)/g, " "); // "treble" would read as notes
  return s;
}

/** Reads one <score> body. Returns null when it holds more than one voice or staff (not a single melody). */
export function parseScore(src: string): Melody | null {
  if (/\\new\s+(?:Staff|PianoStaff|StaffGroup|Voice)/.test(src)) return null;
  const s = clean(src);
  const notes: Note[] = [];
  let bpm = 100;
  let dur = 1; // beats of the last written duration
  let prev: Pitch = { step: 0, octave: 0, alter: 0 };
  let isRelative = false;
  let scale = 1; // tuplets
  const scaleStack: number[] = [];
  let tie = false;
  let skipNext = false; // grace notes are not played
  let chord: Pitch[] | null = null;
  let chordFirst: Pitch | null = null;
  let vel: number | undefined;
  const DYN: Record<string, number> = { ppp: 0.25, pp: 0.35, p: 0.5, mp: 0.62, mf: 0.75, f: 0.9, ff: 1, fff: 1 };

  const toks = s.match(/\\[A-Za-z]+|<<|>>|[<>{}~|()[\]]|\d+\/\d+|\d+\.*\s*=\s*\d+|[a-gr](?:is|es|s)*[',]*!?\d*\.*(?:\*\d+(?:\/\d+)?)?|\d+\.*(?:\*\d+)?|"[^"]*"|\S/g) ?? [];
  const durOf = (t: string) => {
    const m = /(\d+)(\.*)/.exec(t);
    if (!m) return null;
    let b = 4 / Number(m[1]);
    let add = b;
    for (let i = 0; i < m[2].length; i++) { add /= 2; b += add; }
    return b;
  };
  const push = (midi: number[], beats: number) => {
    if (skipNext) { skipNext = false; return; }
    const last = notes[notes.length - 1];
    if (tie && last && midi.length && JSON.stringify(last.midi) === JSON.stringify(midi)) last.beats += beats;
    else notes.push(vel === undefined ? { midi, beats } : { midi, beats, vel });
    tie = false;
  };

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t === "\\relative") {
      isRelative = true;
      const p = readPitch(toks[i + 1] ?? "");
      if (p) { prev = { step: p.step, alter: 0, octave: -1 + p.marks }; i++; } // \relative c = the c below middle C
      continue;
    }
    if (t === "\\tempo") {
      for (let j = i + 1; j < Math.min(i + 4, toks.length); j++) {
        const m = /^(\d+)(\.?)\s*=\s*(\d+)$/.exec(toks[j]);
        if (m) { const unit = (4 / Number(m[1])) * (m[2] ? 1.5 : 1); bpm = Number(m[3]) * unit; i = j; break; }
      }
      continue;
    }
    if (t === "\\tuplet" || t === "\\times") {
      const f = /^(\d+)\/(\d+)$/.exec(toks[i + 1] ?? "");
      if (f) { scaleStack.push(scale); scale *= t === "\\times" ? Number(f[1]) / Number(f[2]) : Number(f[2]) / Number(f[1]); i += 1; if (toks[i + 1] === "{") i += 1; scaleStack.push(-1); }
      continue;
    }
    if (t === "\\acciaccatura" || t === "\\appoggiatura" || t === "\\grace" || t === "\\slashedGrace") { skipNext = true; continue; }
    if (t === "\\partial" || t === "\\time" || t === "\\key" || t === "\\clef" || t === "\\bar") { i += t === "\\key" ? 2 : 1; continue; }
    if (t.startsWith("\\")) {
      // a dynamic mark belongs to the note written just before it (inside a chord: to the whole chord)
      if (DYN[t.slice(1)] !== undefined) { vel = DYN[t.slice(1)]; const last = notes[notes.length - 1]; if (!chord && last?.midi.length) last.vel = vel; }
      continue; // articulations, layout
    }
    if (t === "}") { if (scaleStack.length && scaleStack[scaleStack.length - 1] === -1) { scaleStack.pop(); scale = scaleStack.pop() ?? 1; } continue; }
    if (t === "{" ) {
      // the braces after \afterGrace's main note hold grace notes: skip them
      if (/^[a-g]/.test(toks[i - 2] ?? "") && toks[i - 1] === ")") { while (i < toks.length && toks[i] !== "}") i++; }
      continue;
    }
    if (t === "~") { tie = true; continue; }
    if (t === "<" || t === "<<") { chord = []; chordFirst = null; continue; }
    if (t === ">" || t === ">>") {
      if (chord) {
        const d = durOf(toks[i + 1] ?? "");
        if (d !== null && /^\d/.test(toks[i + 1])) { dur = d; i++; }
        push(chord.map(midiOf).sort((a, b) => a - b), dur * scale);
        if (chordFirst) prev = chordFirst;
      }
      chord = null;
      continue;
    }
    const m = /^([a-gr](?:is|es|s)*[',]*)!?(\d*\.*)(?:\*(\d+)(?:\/(\d+))?)?$/.exec(t);
    if (!m) continue;
    if (m[2]) dur = durOf(m[2]) ?? dur;
    let beats = dur * scale;
    if (m[3]) beats *= Number(m[3]) / Number(m[4] ?? 1);
    if (m[1] === "r") { if (!skipNext) { notes.push({ midi: [], beats }); tie = false; } else skipNext = false; continue; }
    const p = readPitch(m[1]);
    if (!p) continue;
    const pitch: Pitch = isRelative ? relative(chord && chord.length ? chord[chord.length - 1] : prev, p.step, p.alter, p.marks) : { step: p.step, alter: p.alter, octave: -1 + p.marks };
    if (chord) { chord.push(pitch); if (!chordFirst) chordFirst = pitch; continue; }
    prev = pitch; // grace notes are not played, but in LilyPond they still set the octave reference
    push([midiOf(pitch)], beats);
  }
  return notes.length ? { notes, bpm } : null;
}

const NAMES = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
/** "G4" style name of a MIDI number, for tests and checks. */
export const noteName = (midi: number) => `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
