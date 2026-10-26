"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, Delete, Eye, Grid3x3, Lightbulb } from "lucide-react";
import { today } from "@/lib/gamification";
import { puzzleState, sudokuConflicts, wordCells, type Crossword, type Puzzle, type Pyramid, type Sudoku } from "@/lib/puzzles";
import { practised } from "@/lib/skill";
import { useStore, useT } from "@/lib/store";

const NAMES = { sudoku: "Sudoku", crossword: "Kreuzworträtsel", pyramid: "Zahlenpyramide" } as const;
const HOW = {
  sudoku: "Jede Zahl darf in jeder Zeile, jeder Spalte und jedem Kasten nur einmal vorkommen.",
  crossword: "Tippe auf ein Feld und schreib das Lösungswort. Die Fragen kennst du schon aus deinem Feed.",
  pyramid: "Jeder Stein ist die Summe der beiden Steine darunter.",
} as const;

/** Every puzzle as flat cells: the solution per cell (null = no cell) and which cells are written in from the start. */
function cellsOf(p: Puzzle) {
  if (p.kind === "sudoku") return { solution: p.solution.map(String), given: p.givens.map((v) => v > 0) };
  if (p.kind === "crossword") return { solution: p.solution, given: p.givens };
  return { solution: p.rows.flat().map(String), given: p.shown.flat() };
}

/** Marks a puzzle as done on this device (daily: also for today's three) and moves the step for its kind (lib/skill.ts). */
function useFinish() {
  const { getState, update } = useStore();
  return (puzzle: Puzzle, daily: boolean, result: "right" | "hinted" | "wrong") => {
    const id = puzzle.id;
    const st = puzzleState(getState());
    const date = today();
    const todays = st.daily.date === date ? st.daily.done : [];
    update({
      puzzles: { done: [...st.done.filter((x) => x !== id), id].slice(-300), daily: daily ? { date, done: [...todays.filter((x) => x !== id), id] } : st.daily },
      skill: practised(getState(), puzzle.kind, result),
    });
  };
}

/**
 * A grid puzzle as a card: sudoku, mini crossword or number pyramid. A hint fills in one cell; "Lösung zeigen"
 * gives up and shows everything. `onDone` runs once the puzzle is solved or given up.
 */
export default function PuzzleCard({ puzzle, daily = false, onDone }: { puzzle: Puzzle; daily?: boolean; onDone?: (solved: boolean) => void }) {
  const t = useT();
  const finish = useFinish();
  const { solution, given } = useMemo(() => cellsOf(puzzle), [puzzle]);
  const [values, setValues] = useState<string[]>(() => solution.map((s, i) => (s !== null && given[i] ? s : "")));
  const [hinted, setHinted] = useState<number[]>([]);
  const [result, setResult] = useState<"solved" | "shown" | null>(null);
  const open = solution.map((s, i) => s !== null && !given[i] && !hinted.includes(i));
  const solved = solution.every((s, i) => s === null || values[i] === s);

  useEffect(() => {
    if (solved && !result) {
      setResult("solved");
      finish(puzzle, daily, hinted.length ? "hinted" : "right");
      onDone?.(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved]);

  const set = (i: number, v: string) => !result && open[i] && setValues((vs) => vs.map((x, k) => (k === i ? v : x)));
  const hint = () => {
    const i = solution.findIndex((s, k) => s !== null && open[k] && values[k] !== s);
    if (i < 0) return;
    setHinted((h) => [...h, i]);
    setValues((vs) => vs.map((x, k) => (k === i ? solution[i]! : x)));
  };
  const reveal = () => {
    setResult("shown");
    setValues(solution.map((s) => s ?? ""));
    finish(puzzle, daily, "wrong");
    onDone?.(false);
  };
  const props = { values, set, open, done: !!result };

  return (
    <article className="card space-y-4 p-5" data-testid="puzzle" data-kind={puzzle.kind}>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--math)" }}>
          <Grid3x3 size={14} /> {daily ? t("Rätsel des Tages") : t("Rätsel")} · {t(NAMES[puzzle.kind])}
        </p>
        <p className="mt-1 text-sm text-muted">{t(HOW[puzzle.kind])}</p>
      </div>
      {puzzle.kind === "sudoku" ? <SudokuBoard p={puzzle} {...props} /> : puzzle.kind === "crossword" ? <CrosswordBoard p={puzzle} {...props} /> : <PyramidBoard p={puzzle} {...props} />}
      {result ? (
        <p className={`flex items-center gap-2 rounded-2xl p-3.5 text-sm font-semibold ${result === "solved" ? "bg-good/10" : "bg-raised"}`} role="status" data-testid="puzzle-result">
          {result === "solved" ? <><Check size={16} className="shrink-0 text-good" /> {hinted.length ? t("Gelöst! Genutzte Tipps: {n}", { n: hinted.length }) : t("Gelöst – ganz ohne Tipp!")}</> : t("Hier ist die Lösung.")}
        </p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button onClick={hint} className="press flex items-center gap-1.5 rounded-full bg-raised px-4 py-2 text-sm font-semibold" data-testid="puzzle-hint">
            <Lightbulb size={16} /> {t("Tipp: ein Feld")}
          </button>
          <button onClick={reveal} className="press flex items-center gap-1.5 px-2 py-2 text-sm font-semibold text-muted" data-testid="puzzle-reveal">
            <Eye size={16} /> {t("Lösung zeigen")}
          </button>
        </div>
      )}
    </article>
  );
}

type BoardProps = { values: string[]; set: (i: number, v: string) => void; open: boolean[]; done: boolean };
const cellText = "font-display font-semibold tabular-nums";

function SudokuBoard({ p, values, set, open, done }: BoardProps & { p: Sudoku }) {
  const t = useT();
  const n = p.size;
  const [sel, setSel] = useState(() => open.findIndex(Boolean));
  const bad = sudokuConflicts(p, values.map(Number));
  const key = (e: KeyboardEvent) => {
    const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -n, ArrowDown: n }[e.key];
    if (d !== undefined) {
      e.preventDefault();
      setSel((s) => Math.min(n * n - 1, Math.max(0, s + d)));
    } else if (/^[1-9]$/.test(e.key) && +e.key <= n) set(sel, e.key);
    else if (e.key === "Backspace" || e.key === "Delete") set(sel, "");
  };
  return (
    <div className="space-y-3">
      <div role="grid" aria-label={t("Sudoku")} tabIndex={0} onKeyDown={key} className="mx-auto grid w-full max-w-[360px] overflow-hidden rounded-xl border-2 border-ink outline-none" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {values.map((v, i) => {
          const r = Math.floor(i / n), c = i % n;
          const edgeR = (c + 1) % p.boxCols === 0 && c < n - 1, edgeB = (r + 1) % p.boxRows === 0 && r < n - 1;
          return (
            <button key={i} role="gridcell" aria-label={t("Zeile {r}, Spalte {c}", { r: r + 1, c: c + 1 }) + (v ? `: ${v}` : "")} onClick={() => setSel(i)} data-testid="puzzle-cell" data-open={open[i] || undefined}
              className={`${cellText} flex aspect-square items-center justify-center border-line text-lg ${edgeR ? "border-r-2 border-r-ink" : "border-r"} ${edgeB ? "border-b-2 border-b-ink" : "border-b"} ${sel === i && !done ? "bg-accent/20" : ""} ${open[i] ? (bad.has(i) ? "text-bad" : "text-accent") : ""}`}>
              {v}
            </button>
          );
        })}
      </div>
      {!done && (
        <div className="mx-auto flex max-w-[360px] flex-wrap justify-center gap-1.5">
          {Array.from({ length: n }, (_, k) => String(k + 1)).map((d) => (
            <button key={d} onClick={() => set(sel, d)} className={`press ${cellText} h-11 w-11 rounded-xl bg-raised text-lg`} data-testid="puzzle-digit">{d}</button>
          ))}
          <button onClick={() => set(sel, "")} aria-label={t("Löschen")} className="press flex h-11 w-11 items-center justify-center rounded-xl bg-raised"><Delete size={18} /></button>
        </div>
      )}
    </div>
  );
}

function CrosswordBoard({ p, values, set, open, done }: BoardProps & { p: Crossword }) {
  const t = useT();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [word, setWord] = useState(() => Math.max(0, p.words.findIndex((w) => wordCells(p, w).some((i) => open[i]))));
  const active = p.words[word];
  const activeCells = wordCells(p, active);
  // numbers at the start of each word, in reading order
  const starts = [...new Set(p.words.map((w) => w.row * p.cols + w.col))].sort((a, b) => a - b);
  const numOf = (w: Crossword["words"][number]) => starts.indexOf(w.row * p.cols + w.col) + 1;
  const focus = (i: number) => refs.current[i]?.focus();
  const wordsAt = (i: number) => p.words.map((_, k) => k).filter((k) => wordCells(p, p.words[k]).includes(i));
  // moving into a square of another word selects that word; a tap on a crossing inside the selected word switches direction
  const follow = (i: number) => !activeCells.includes(i) && setWord(wordsAt(i)[0]);
  const tap = (i: number) => {
    if (!activeCells.includes(i)) return;
    const other = wordsAt(i).find((k) => k !== word);
    if (other !== undefined && document.activeElement === refs.current[i]) setWord(other);
  };
  const type = (i: number, raw: string) => {
    const ch = raw.slice(-1).toUpperCase();
    if (ch && !/^[A-ZÄÖÜ]$/.test(ch)) return;
    set(i, ch);
    if (ch) {
      const nextCell = activeCells.slice(activeCells.indexOf(i) + 1).find((k) => open[k]);
      if (nextCell !== undefined) focus(nextCell);
    }
  };
  const back = (i: number, e: KeyboardEvent) => {
    if (e.key !== "Backspace" || values[i]) return;
    const prev = activeCells.slice(0, activeCells.indexOf(i)).reverse().find((k) => open[k]);
    if (prev !== undefined) focus(prev);
  };
  return (
    <div className="space-y-3">
      {!done && (
        <p className="min-h-[3rem] rounded-2xl bg-raised p-3 text-sm font-semibold" aria-live="polite" data-testid="crossword-clue">
          {numOf(active)} {active.across ? t("waagerecht") : t("senkrecht")} ({active.answer.length}): {active.clue}
        </p>
      )}
      <div className="mx-auto grid w-full gap-[3px]" style={{ gridTemplateColumns: `repeat(${p.cols}, 1fr)`, maxWidth: `${p.cols * 38}px` }}>
        {p.solution.map((s, i) =>
          s === null ? <div key={i} /> : (
            <label key={i} className={`relative flex aspect-square items-center justify-center rounded-md border ${activeCells.includes(i) && !done ? "border-accent bg-accent/10" : "border-line bg-surface"}`}>
              {starts.includes(i) && <span className="absolute left-0.5 top-0 text-[9px] font-semibold text-muted">{starts.indexOf(i) + 1}</span>}
              {open[i] && !done ? (
                <input ref={(el) => { refs.current[i] = el; }} value={values[i]} onChange={(e) => type(i, e.target.value)} onKeyDown={(e) => back(i, e)} onFocus={() => follow(i)} onPointerDown={() => tap(i)}
                  aria-label={t("Feld {n}", { n: i + 1 })} autoCapitalize="characters" autoComplete="off" autoCorrect="off" spellCheck={false} data-testid="puzzle-cell" data-open
                  className={`${cellText} h-full w-full bg-transparent text-center text-base uppercase text-accent outline-none`} />
              ) : (
                <span className={`${cellText} text-base ${open[i] ? "text-accent" : ""}`} data-testid="puzzle-cell">{values[i]}</span>
              )}
            </label>
          ),
        )}
      </div>
      <ol className="space-y-1 text-[13px] leading-snug text-muted">
        {p.words.map((w, k) => (
          <li key={k}><button onClick={() => { setWord(k); const c = wordCells(p, w).find((i) => open[i]); if (c !== undefined) focus(c); }} className={`text-left ${k === word && !done ? "font-semibold text-ink" : ""}`}>
            {numOf(w)} {w.across ? "→" : "↓"} {w.clue} {done && <span className="font-semibold text-ink">– {w.answer}</span>}
          </button></li>
        ))}
      </ol>
    </div>
  );
}

function PyramidBoard({ p, values, set, open, done }: BoardProps & { p: Pyramid }) {
  const t = useT();
  let index = 0;
  return (
    <div className="mx-auto flex max-w-[360px] flex-col items-center gap-1.5">
      {p.rows.map((row, y) => (
        <div key={y} className="flex gap-1.5">
          {row.map((_, x) => {
            const i = index++;
            const wrong = !!values[i] && done === false && values[i].length >= String(p.rows[y][x]).length && values[i] !== String(p.rows[y][x]);
            return open[i] && !done ? (
              <input key={x} value={values[i]} onChange={(e) => set(i, e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" aria-label={t("Stein in Reihe {r}", { r: y + 1 })} data-testid="puzzle-cell" data-open
                className={`${cellText} h-11 w-14 rounded-lg border-2 border-dashed bg-transparent text-center text-lg outline-none focus:border-accent ${wrong ? "border-bad text-bad" : "border-line text-accent"}`} />
            ) : (
              <span key={x} className={`${cellText} flex h-11 w-14 items-center justify-center rounded-lg bg-raised text-lg ${open[i] ? "text-accent" : ""}`} data-testid="puzzle-cell">{values[i]}</span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
