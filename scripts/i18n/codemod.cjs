// One-off refactoring (October 2026): wraps the German interface texts in t("…") and writes the
// English dictionary lib/locales/en.json. Kept for reference; it is not part of the app.
const fs = require("fs");

const dict = {};
let problems = 0;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function apply(file, { pairs = [], phrases = {} }) {
  let c = fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n");
  c = c.replace('import { useStore } from "@/lib/store";', 'import { useStore, useT } from "@/lib/store";');
  for (const [a, b] of pairs) {
    if (!c.includes(a)) {
      console.log(`MISSING pair in ${file}: ${a.slice(0, 90)}`);
      problems++;
      continue;
    }
    c = c.split(a).join(b);
  }
  for (const de of Object.keys(phrases).sort((x, y) => y.length - x.length)) {
    dict[de] = phrases[de];
    let hits = 0;
    const q = JSON.stringify(de);
    // 1. quoted: attribute="…" → attribute={t("…")}, otherwise "…" → t("…")
    c = c.replace(new RegExp(`(.?)${esc(q)}`, "g"), (m, before, offset, all) => {
      if (all.slice(Math.max(0, offset - 1), offset + 1 + 2).startsWith("t(") || all.slice(offset - 1, offset + 1) === "t(" ) return m;
      if (before === "(" && all[offset - 1] === "t") return m;
      hits++;
      return before === "=" ? `={t(${q})}` : `${before}t(${q})`;
    });
    // 2. JSX text: … >Text< … (never inside a string literal)
    c = c
      .split("\n")
      .map((line) =>
        line.replace(new RegExp(`(^|[>}\\s])${esc(de)}(?=$|[<{\\s])`, "g"), (m, before, offset) => {
          const prefix = line.slice(0, offset + before.length);
          if ((prefix.match(/"/g) ?? []).length % 2 || (prefix.match(/`/g) ?? []).length % 2) return m;
          if (/^\s*(\/\/|\*)/.test(line)) return m;
          hits++;
          return `${before}{t(${q})}`;
        })
      )
      .join("\n");
    if (!hits) {
      console.log(`MISSING phrase in ${file}: ${de.slice(0, 90)}`);
      problems++;
    }
  }
  fs.writeFileSync(file, c);
}
const hook = (after) => [after, after + "\n  const t = useT();"];
const add = (extra) => Object.assign(dict, extra);

// ---------------------------------------------------------------- lib
apply("lib/ranking.ts", {
  pairs: [
    ["export interface Ranked {\n  item: Item;\n  reason: string;\n}", "export interface Ranked {\n  item: Item;\n  reason: string; // German text = translation key, may contain {placeholders}\n  vars?: Record<string, string>;\n}"],
    ["      const parts: [number, string][] = [", "      const parts: [number, string, Record<string, string>?][] = ["],
    ["`Zum Üben: ${cat.name}`]", "\"Zum Üben: {topic}\", { topic: cat.name }]"],
    ["      const reason = [...parts].sort((a, b) => b[0] - a[0])[0][1];\n      return { item, reason, score };", "      const [, reason, vars] = [...parts].sort((a, b) => b[0] - a[0])[0];\n      return { item, reason, vars, score };"],
    ["out.push({ item, reason: `${personById(a.userId)!.name.split(\" \")[0]} gefällt das` });", "out.push({ item, reason: \"{name} gefällt das\", vars: { name: personById(a.userId)!.name.split(\" \")[0] } });"],
  ],
});
add({ "Passt zu deinen Themen": "Matches your topics", "Weil dir Ähnliches gefallen hat": "Because you liked similar cards", "Zum Üben: {topic}": "For practice: {topic}", "Neu": "New", "Gerade beliebt": "Popular right now", "{name} gefällt das": "{name} likes this" });

apply("lib/store.tsx", {
  pairs: [
    ["if (gained > 0) toast(`+${gained} XP`, \"xp\");", "if (gained > 0) toast(`+${gained} XP`, \"xp\");\n        const tr = (k: string, v?: Record<string, string | number>) => translate(next.settings.locale, k, v);"],
    ["          toast(`Level ${lvl} erreicht`);\n          log.unshift({ type: \"level\", text: `Level ${lvl} erreicht`, at });", "          toast(tr(\"Level {n} erreicht\", { n: lvl }));\n          log.unshift({ type: \"level\", text: tr(\"Level {n} erreicht\", { n: lvl }), at });"],
    ["          toast(`Abzeichen: ${a.name}`);\n          log.unshift({ type: \"badge\", text: `Abzeichen „${a.name}“ erhalten`, at });", "          toast(tr(\"Abzeichen: {name}\", { name: tr(a.name) }));\n          log.unshift({ type: \"badge\", text: tr(\"Abzeichen „{name}“ erhalten\", { name: tr(a.name) }), at });"],
    ["toast(`Antwort nicht gespeichert: ${message(e)}`);", "toast(tr(\"Antwort nicht gespeichert: {reason}\", { reason: tr(message(e)) }));"],
    [".catch((e) => toast(`Bonus nicht gespeichert: ${message(e)}`));", ".catch((e) => toast(tr(\"Bonus nicht gespeichert: {reason}\", { reason: tr(message(e)) })));"],
    ["text: `Challenge ${mine > theirs ? \"gewonnen\" : mine === theirs ? \"unentschieden\" : \"verloren\"} (${mine}:${theirs})`", "text: tr(mine > theirs ? \"Challenge gewonnen ({a}:{b})\" : mine === theirs ? \"Challenge unentschieden ({a}:{b})\" : \"Challenge verloren ({a}:{b})\", { a: mine, b: theirs })"],
    ["if (list === \"saves\") toast(on ? \"Gemerkt\" : \"Entfernt\");", "if (list === \"saves\") toast(tr(on ? \"Gemerkt\" : \"Entfernt\"));"],
    ["toast(report ? \"Danke – wir prüfen den Inhalt\" : \"Verstanden, weniger davon\");", "toast(tr(report ? \"Danke – wir prüfen den Inhalt\" : \"Verstanden, weniger davon\"));"],
    ["toast(\"Profil gemeldet und blockiert\");", "toast(tr(\"Profil gemeldet und blockiert\"));"],
    ["toast(\"In die Zwischenablage kopiert\");", "toast(tr(\"In die Zwischenablage kopiert\"));"],
    ["toast(`Löschen fehlgeschlagen: ${message(e)}`);", "toast(tr(\"Löschen fehlgeschlagen: {reason}\", { reason: tr(message(e)) }));"],
    ["[commit, toast]\n  );\n\n  const completeDaily", "[commit, toast, tr]\n  );\n\n  const completeDaily"],
  ],
});
add({
  "Level {n} erreicht": "Reached level {n}", "Abzeichen: {name}": "Badge: {name}", "Abzeichen „{name}“ erhalten": "Earned the “{name}” badge",
  "Antwort nicht gespeichert: {reason}": "Answer not saved: {reason}", "Bonus nicht gespeichert: {reason}": "Bonus not saved: {reason}", "Löschen fehlgeschlagen: {reason}": "Deletion failed: {reason}",
  "Challenge gewonnen ({a}:{b})": "Challenge won ({a}:{b})", "Challenge unentschieden ({a}:{b})": "Challenge drawn ({a}:{b})", "Challenge verloren ({a}:{b})": "Challenge lost ({a}:{b})",
  "Gemerkt": "Saved", "Entfernt": "Removed", "Danke – wir prüfen den Inhalt": "Thanks – we'll review this", "Verstanden, weniger davon": "Got it, less of this",
  "Profil gemeldet und blockiert": "Profile reported and blocked", "In die Zwischenablage kopiert": "Copied to clipboard",
  "Keine Verbindung zum Server.": "No connection to the server.",
  "Gast-Anmeldung ist im Backend noch nicht aktiviert (Supabase → Authentication → Anonymous sign-ins).": "Guest sign-in is not enabled in the backend yet (Supabase → Authentication → Anonymous sign-ins).",
  "Daily Challenge: {a}/5": "Daily challenge: {a}/5",
});

// achievements, leagues, categories, demo community (texts stay German in the code = keys)
add({
  "Erster Funke": "First spark", "Erste Frage beantwortet": "Answered your first question", "Schlaukopf": "Smart cookie", "10 Fragen richtig": "10 correct answers",
  "Wissensdurst": "Thirst for knowledge", "25 Fragen beantwortet": "Answered 25 questions", "Tagesform": "Daily form", "Daily Challenge abgeschlossen": "Completed a daily challenge",
  "Fünf von fünf": "Five out of five", "Daily Challenge ohne Fehler": "Daily challenge without a mistake", "Comeback": "Comeback", "Eine Wissenslücke geschlossen": "Closed a knowledge gap",
  "Dranbleiber": "Keeping at it", "3 Tage in Folge gelernt": "Learned 3 days in a row", "Wochenheld": "Hero of the week", "7 Tage in Folge gelernt": "Learned 7 days in a row",
  "Allrounder": "All-rounder", "In jedem Thema geantwortet": "Answered in every topic", "Gut vernetzt": "Well connected", "3 Leuten gefolgt": "Followed 3 people",
  "Duellant": "Duellist", "Eine Challenge gewonnen": "Won a challenge", "Aufsteiger": "On the rise", "Level 5 erreicht": "Reached level 5",
  "Gold-Liga": "Gold League", "Silber-Liga": "Silver League", "Bronze-Liga": "Bronze League",
  "Wissenschaft": "Science", "Technologie & KI": "Technology & AI", "Geschichte": "History", "Erde & Natur": "Earth & Nature", "Wirtschaft & Geld": "Economy & Money", "Kultur & Gesellschaft": "Culture & Society",
  "Vom Atom bis zum Universum": "From atoms to the universe", "Wie Computer und KI wirklich funktionieren": "How computers and AI really work", "Die Geschichten hinter dem Heute": "The stories behind today",
  "Länder, Tiere, Klima und Naturwunder": "Countries, animals, climate and natural wonders", "Wie Märkte, Geld und Finanzen ticken": "How markets, money and finance work", "Kunst, Politik und Zusammenleben": "Art, politics and living together",
  "Biologin. Sammelt nutzloses Wissen über Tintenfische.": "Biologist. Collects useless knowledge about squid.", "Entwickler. Erklärt gern, warum es eigentlich kein Bug ist.": "Developer. Loves explaining why it isn't actually a bug.",
  "Geschichtsstudentin, 4. Semester. Team Spätantike.": "History student, second year. Team Late Antiquity.", "Lernt jeden Morgen fünf Minuten in der S-Bahn.": "Learns for five minutes on the train every morning.",
  "Physiklehrerin. Ja, ich korrigiere auch hier.": "Physics teacher. Yes, I correct things here too.", "Neu hier. Will endlich beim Pubquiz gewinnen.": "New here. Finally wants to win the pub quiz.",
  "Data Scientist. KI-News, bevor sie im Feed landen.": "Data scientist. AI news before it hits the feed.", "Rentner, Hobbyastronom, Frühaufsteher.": "Retiree, amateur astronomer, early riser.",
  "hat die Daily Challenge mit 5/5 abgeschlossen": "completed the daily challenge with 5/5", "gefällt eine Karte": "likes a card", "lernt seit 21 Tagen am Stück": "has been learning for 21 days in a row",
  "hat Level 8 erreicht": "reached level 8", "hat das Abzeichen „Dranbleiber“ erhalten": "earned the “Keeping at it” badge", "hat die Daily Challenge mit 3/5 abgeschlossen": "completed the daily challenge with 3/5",
  // onboarding (already uses t)
  "Neugierig": "Curious", "Sprache": "Language", "Stimmt das?": "True or false?", "Jeden Tag ein bisschen": "A little", "klüger.": "smarter every day.",
  "Kurze Clips, überraschende Fakten und schnelle Quizfragen – von Wissenschaft bis Wirtschaft, in fünf Minuten am Tag, alles mit Quelle.": "Short clips, surprising facts and quick quiz questions – from science to economics, in five minutes a day, all with sources.",
  "Los geht's": "Let's go", "Ich habe schon ein Konto": "I already have an account", "Demo-Modus · Beispieldaten, nichts wird übertragen": "Demo mode · sample data, nothing is transmitted", "Anmelden": "Sign in", "Zurück": "Back",
  "Wie alt bist du?": "How old are you?", "Damit die Inhalte zu dir passen. Wir speichern nur die Altersgruppe, kein Geburtsdatum.": "So the content suits you. We only store the age group, never a date of birth.",
  "6 bis 9 Jahre": "6 to 9 years", "Einfache Fragen für Grundschulkinder": "Simple questions for primary school children", "10 bis 12 Jahre": "10 to 12 years", "Für neugierige Kinder": "For curious kids",
  "13 bis 15 Jahre": "13 to 15 years", "Für Jugendliche": "For teenagers", "16 Jahre und älter": "16 and older", "Alle Inhalte": "All content",
  "Was interessiert dich?": "What are you interested in?", "Wähle mindestens ein Thema. Du kannst das jederzeit ändern.": "Choose at least one topic. You can change this at any time.",
  "Wie viel Zeit nimmst du dir?": "How much time will you take?", "Kleine Ziele hält man durch. Erhöhen geht immer.": "Small goals are easier to keep. You can always raise them.",
  "Locker": "Casual", "Regelmäßig": "Regular", "Ambitioniert": "Ambitious", "ca. {n} Fragen am Tag": "about {n} questions a day",
  "Was treibt dich an?": "What drives you?", "Damit wir wissen, was wir dir zuerst zeigen.": "So we know what to show you first.",
  "Neues entdecken": "Discover new things", "Ich will überrascht werden.": "I want to be surprised.", "Besser werden": "Get better", "Ich will Lücken schließen und es behalten.": "I want to close gaps and remember things.",
  "Mich messen": "Compete", "Ich will Freunde und Ranglisten schlagen.": "I want to beat friends and leaderboards.",
  "Deine erste Frage": "Your first question", "So fühlt sich Wunder an. Die XP gehören schon dir.": "This is what Wunder feels like. The XP are already yours.",
  "Fast geschafft.": "Almost there.", "Du startest mit {n} XP.": "You start with {n} XP.", "Wie sollen dich andere sehen?": "How should others see you?", "Anzeigename": "Display name", "z. B. Alex": "e.g. Alex",
  "Fortschritt sichern (optional)": "Save your progress (optional)", "Zum Feed": "To the feed", "Weiter": "Continue",
});

// ---------------------------------------------------------------- components
apply("components/ui.tsx", {
  pairs: [
    ['import { X } from "lucide-react";', 'import { X } from "lucide-react";\nimport { useT } from "@/lib/store";'],
    hook("export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {"),
    hook("export function Skeleton() {"),
  ],
  phrases: { "Schließen": "Close", "Lädt": "Loading" },
});

apply("components/Shell.tsx", {
  pairs: [
    hook("  const path = usePathname();"),
    ["{label}\n", "{t(label)}\n"],
    ["  const immersive = path.startsWith(\"/clips\"); // full-screen video feed", "  const immersive = path.startsWith(\"/clips\"); // full-screen video feed\n  const nav = NAV.filter((n) => !(isChild(state.ageBand) && n.href === \"/social/\")); // no community for children"],
    ["<ul className=\"grid grid-cols-5\">\n          {NAV.map(", "<ul className=\"grid\" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>\n          {nav.map("],
    ['import { liveStreak } from "@/lib/gamification";', 'import { liveStreak } from "@/lib/gamification";\nimport { isChild } from "@/lib/content";'],
    ["<p className=\"mt-2 text-sm leading-relaxed text-muted\">{error}</p>", "<p className=\"mt-2 text-sm leading-relaxed text-muted\">{error && t(error)}</p>"],
  ],
  phrases: {
    "Wunder lädt gerade nicht": "Wunder isn't loading right now", "Erneut versuchen": "Try again", "Demo-Modus · Beispieldaten, Fortschritt nur auf diesem Gerät": "Demo mode · sample data, progress on this device only",
    "Offline – du siehst den zuletzt geladenen Stand. Antworten werden erst mit Verbindung gespeichert.": "Offline – you are seeing the last loaded state. Answers are only saved once you are connected.",
    "Neu laden": "Reload", "Hauptnavigation": "Main navigation", "Streak": "Streak", "Gesamt-XP": "Total XP",
  },
});
add({ "Entdecken": "Discover", "Clips": "Clips", "Quiz": "Quiz", "Community": "Community", "Profil": "Profile" });

apply("components/Feed.tsx", {
  pairs: [hook("  const { state } = useStore();"), ["reason={e.reason}", "reason={t(e.reason, e.vars)}"]],
  phrases: { "Das war alles für heute. Morgen gibt es Neues.": "That's all for today. There'll be more tomorrow." },
});

apply("components/KnowledgeCard.tsx", {
  pairs: [
    ["function SourceLine({ item }: { item: Item }) {", "function SourceLine({ item }: { item: Item }) {\n  const t = useT();"],
    hook("  const { state, answer, toggle, hide, share } = useStore();"),
    ["{cat.name}\n", "{t(cat.name)}\n"],
    ["{LEVELS[item.difficulty]}", "{t(LEVELS[item.difficulty])}"],
    ["const shareText = isFact ? `„${item.question}“\\n\\nStimmt das? Finde es heraus – Wunder` : `${item.question}\\n\\nWeißt du die Antwort? – Wunder`;", "const shareText = isFact ? `„${item.question}“\\n\\n${t(\"Stimmt das? Finde es heraus – Wunder\")}` : `${item.question}\\n\\n${t(\"Weißt du die Antwort? – Wunder\")}`;"],
    ["Warum du das siehst: {reason}.", "{t(\"Warum du das siehst: {reason}.\", { reason: reason })}"],
  ],
  phrases: {
    "Quelle:": "Source:", "Neu": "New", "Stimmt das?": "True or false?", "Mehr Optionen": "More options", "Gefällt mir": "Like", "Merken": "Save", "Teilen": "Share",
    "Kein Interesse": "Not interested", "Fehler oder Problem melden": "Report an error or problem", "Diese Karte": "This card",
    "Stimmt wirklich. ": "That's really true. ", "Ein Mythos. ": "A myth. ", "Gut eingeschätzt!": "Well judged!", "Richtig!": "Correct!", "Beim letzten Mal falsch": "Wrong last time",
    "Kommt später noch einmal.": "It will come up again later.", "Nicht ganz – kommt später zur Wiederholung": "Not quite – it will come back for review later",
  },
});
add({ "Leicht": "Easy", "Mittel": "Medium", "Schwer": "Hard", "Stimmt das? Finde es heraus – Wunder": "True or false? Find out – Wunder", "Weißt du die Antwort? – Wunder": "Do you know the answer? – Wunder", "Warum du das siehst: {reason}.": "Why you are seeing this: {reason}." });

apply("components/Session.tsx", {
  pairs: [
    hook("  const { state, completeDaily, recordChallenge, share } = useStore();"),
    ["`Ich habe ${opponent.name.split(\" \")[0]} auf Wunder herausgefordert: ${score}:${theirs}. Wer traut sich?`", "t(\"Ich habe {name} auf Wunder herausgefordert: {a}:{b}. Wer traut sich?\", { name: opponent.name.split(\" \")[0], a: score, b: theirs ?? 0 })"],
    ["`${title} auf Wunder: ${score}/${items.length} richtig. Schaffst du mehr?`", "t(\"{title} auf Wunder: {a}/{b} richtig. Schaffst du mehr?\", { title, a: score, b: items.length })"],
  ],
  phrases: {
    "Gewonnen!": "You won!", "Unentschieden": "It's a draw", "Knapp daneben": "So close", "Makellos.": "Flawless.", "Stark gemacht.": "Well done.", "Dranbleiben lohnt sich.": "Keep at it.",
    "Übungsrunde – XP gibt es für neue Fragen und fällige Wiederholungen.": "Practice round – you earn XP for new questions and due reviews.",
    " Falsche Antworten kommen zur Wiederholung.": " Wrong answers will come back for review.",
    "Teilen": "Share", "Fertig": "Done", "Runde beenden": "End round", "Ergebnis ansehen": "See result", "Weiter": "Continue",
  },
});
add({ "Ich habe {name} auf Wunder herausgefordert: {a}:{b}. Wer traut sich?": "I challenged {name} on Wunder: {a}:{b}. Who dares?", "{title} auf Wunder: {a}/{b} richtig. Schaffst du mehr?": "{title} on Wunder: {a}/{b} correct. Can you beat that?" });

apply("components/Account.tsx", {
  pairs: [
    hook("  const { auth, state, toast, registerEmail, signInEmail, signOut } = useStore();"),
    ["  if (!auth.isGuest && auth.email)", "  if (!canRegister(state.ageBand) && auth.isGuest)\n    return (\n      <p className=\"rounded-2xl bg-raised p-4 text-sm leading-relaxed text-muted\">\n        {t(\"Für ein Konto mit E-Mail-Adresse brauchst du die Zustimmung deiner Eltern. Bis dahin lernst du als Gast weiter – dein Fortschritt bleibt gespeichert.\")}\n      </p>\n    );\n\n  if (!auth.isGuest && auth.email)"],
    ['import { useStore, useT } from "@/lib/store";', 'import { canRegister } from "@/lib/content";\nimport { useStore, useT } from "@/lib/store";'],
    ["Angemeldet als {auth.email}", "{t(\"Angemeldet als {email}\", { email: auth.email })}"],
    ["Link gesendet an {sentTo}", "{t(\"Link gesendet an {email}\", { email: sentTo })}"],
    ["Öffne die E-Mail auf diesem Gerät und tippe auf den Link, um {mode === \"register\" ? \"dein Konto zu bestätigen\" : \"dich anzumelden\"}.", "{mode === \"register\" ? t(\"Öffne die E-Mail auf diesem Gerät und tippe auf den Link, um dein Konto zu bestätigen.\") : t(\"Öffne die E-Mail auf diesem Gerät und tippe auf den Link, um dich anzumelden.\")}"],
    ["`Achtung: Nach der Anmeldung siehst du den Stand deines Kontos. Der Gast-Fortschritt auf diesem Gerät (${state.xp} XP) wird nicht übernommen.`", "t(\"Achtung: Nach der Anmeldung siehst du den Stand deines Kontos. Der Gast-Fortschritt auf diesem Gerät ({n} XP) wird nicht übernommen.\", { n: state.xp })"],
  ],
  phrases: {
    "Demo-Modus: Es ist kein Backend verbunden. Inhalte sind Beispieldaten, dein Fortschritt liegt nur auf diesem Gerät, eine Anmeldung ist nicht möglich.": "Demo mode: no backend is connected. Content is sample data, your progress is stored on this device only, and signing in is not possible.",
    "Dein Fortschritt ist gesichert und auf jedem Gerät verfügbar.": "Your progress is saved and available on every device.", "Abmelden": "Sign out", "Andere Adresse verwenden": "Use a different address",
    "Abmelden fehlgeschlagen": "Sign-out failed", "Diese Adresse hat schon ein Konto – bitte anmelden.": "This address already has an account – please sign in.",
    "Zu viele Versuche. Bitte warte kurz.": "Too many attempts. Please wait a moment.", "Kein Konto mit dieser Adresse gefunden.": "No account found with this address.", "Das hat nicht geklappt": "That didn't work",
    "Du lernst gerade als Gast. Mit einer E-Mail-Adresse sicherst du deinen Fortschritt und kannst auf anderen Geräten weitermachen.": "You are learning as a guest. With an email address you save your progress and can continue on other devices.",
    "Wir senden dir einen Anmeldelink per E-Mail.": "We'll send you a sign-in link by email.", "E-Mail-Adresse": "Email address", "Sichern": "Save", "Anmelden": "Sign in",
    "Ich habe schon ein Konto": "I already have an account", "Zurück: Gast-Fortschritt sichern": "Back: save guest progress",
  },
});
add({
  "Für ein Konto mit E-Mail-Adresse brauchst du die Zustimmung deiner Eltern. Bis dahin lernst du als Gast weiter – dein Fortschritt bleibt gespeichert.": "For an account with an email address you need your parents' consent. Until then you keep learning as a guest – your progress stays saved.",
  "Angemeldet als {email}": "Signed in as {email}", "Link gesendet an {email}": "Link sent to {email}",
  "Öffne die E-Mail auf diesem Gerät und tippe auf den Link, um dein Konto zu bestätigen.": "Open the email on this device and tap the link to confirm your account.",
  "Öffne die E-Mail auf diesem Gerät und tippe auf den Link, um dich anzumelden.": "Open the email on this device and tap the link to sign in.",
  "Achtung: Nach der Anmeldung siehst du den Stand deines Kontos. Der Gast-Fortschritt auf diesem Gerät ({n} XP) wird nicht übernommen.": "Note: after signing in you will see your account's progress. The guest progress on this device ({n} XP) will not be carried over.",
});

// ---------------------------------------------------------------- pages
apply("app/page.tsx", {
  pairs: [
    hook("  const router = useRouter();"),
    ["`Noch ${goal - count} bis zum Tagesziel`", "t(\"Noch {n} bis zum Tagesziel\", { n: goal - count })"],
    ["{due === 1 ? \"1 Wiederholung ist fällig\" : `${due} Wiederholungen sind fällig`}", "{due === 1 ? t(\"1 Wiederholung ist fällig\") : t(\"{n} Wiederholungen sind fällig\", { n: due })}"],
    ["{dailyDone ? `Daily Challenge: ${state.dailyChallenge.score}/5` : \"Daily Challenge\"}", "{dailyDone ? t(\"Daily Challenge: {a}/5\", { a: state.dailyChallenge.score ?? 0 }) : \"Daily Challenge\"}"],
  ],
  phrases: {
    "Tagesziel erreicht. Bis morgen!": "Daily goal reached. See you tomorrow!", "5 Fragen · bis zu 30 Bonus-XP": "5 questions · up to 30 bonus XP", "Start": "Start",
    "Schließe die Lücke, solange sie frisch ist.": "Close the gap while it's fresh.", "Für dich": "For you", "Folge ich": "Following", "Alles entdeckt": "All discovered",
    "Du hast jede Karte gesehen. Neue Inhalte sind unterwegs.": "You've seen every card. New content is on its way.", "Noch niemand hier": "Nobody here yet",
    "Folge Leuten, um zu sehen, welche Karten ihnen gefallen.": "Follow people to see which cards they like.", "Leute entdecken": "Discover people",
  },
});
add({ "Noch {n} bis zum Tagesziel": "{n} to go to reach your daily goal", "1 Wiederholung ist fällig": "1 review is due", "{n} Wiederholungen sind fällig": "{n} reviews are due" });

apply("app/quiz/page.tsx", {
  pairs: [
    hook("  const { items, state, launch, setLaunch, toast } = useStore();"),
    ["title: `Challenge gegen ${opponent.name.split(\" \")[0]}`", "title: t(\"Challenge gegen {name}\", { name: opponent.name.split(\" \")[0] })"],
    ["Heute erledigt: {state.dailyChallenge.score}/5 – morgen gibt es neue Fragen.", "{t(\"Heute erledigt: {a}/5 – morgen gibt es neue Fragen.\", { a: state.dailyChallenge.score ?? 0 })}"],
    ["{due.length ? `${due.length} fällig · +5 XP pro geschlossener Lücke` : scheduled ? `${scheduled} geplant – wir melden uns, wenn es Zeit ist` : \"Falsch beantwortete Fragen tauchen hier wieder auf.\"}", "{due.length ? t(\"{n} fällig · +5 XP pro geschlossener Lücke\", { n: due.length }) : scheduled ? t(\"{n} geplant – wir melden uns, wenn es Zeit ist\", { n: scheduled }) : t(\"Falsch beantwortete Fragen tauchen hier wieder auf.\")}"],
    ["              {c.name}\n            </Chip>", "              {t(c.name)}\n            </Chip>"],
    ["<span className=\"font-semibold\">{c.name}</span>", "<span className=\"font-semibold\">{t(c.name)}</span>"],
  ],
  phrases: {
    "Wiederholung": "Review", "Für diese Auswahl gibt es noch keine Fragen": "There are no questions for this selection yet", "Übungsrunde": "Practice round", "Heute": "Today",
    "Fünf Fragen, für alle dieselben. +4 Bonus-XP pro richtiger Antwort, +10 für fünf von fünf.": "Five questions, the same for everyone. +4 bonus XP per correct answer, +10 for five out of five.",
    "Jetzt spielen": "Play now", "Wiederholen": "Review", "Freies Üben": "Free practice", "Themen": "Topics", "Schwierigkeit": "Difficulty", "Alle": "All", "Leicht": "Easy", "Mittel": "Medium", "Schwer": "Hard",
    "Runde starten": "Start round", "Dein Wissensstand": "Your knowledge",
  },
});
add({ "Challenge gegen {name}": "Challenge against {name}", "Heute erledigt: {a}/5 – morgen gibt es neue Fragen.": "Done for today: {a}/5 – new questions tomorrow.", "{n} fällig · +5 XP pro geschlossener Lücke": "{n} due · +5 XP per closed gap", "{n} geplant – wir melden uns, wenn es Zeit ist": "{n} scheduled – we'll let you know when it's time", "Falsch beantwortete Fragen tauchen hier wieder auf.": "Questions you got wrong will show up here again." });

apply("app/social/page.tsx", {
  pairs: [
    ["const ago = (h: number) => (h < 1 ? \"gerade eben\" : h < 24 ? `vor ${Math.round(h)} Std.` : `vor ${Math.round(h / 24)} T.`);", "type T = (key: string, vars?: Record<string, string | number>) => string;\nconst ago = (h: number, t: T) => (h < 1 ? t(\"gerade eben\") : h < 24 ? t(\"vor {n} Std.\", { n: Math.round(h) }) : t(\"vor {n} T.\", { n: Math.round(h / 24) }));"],
    ["{ago(a.hours)}", "{ago(a.hours, t)}"],
    hook("  const { state, toggleFollow } = useStore();"),
    ["function PersonRow({ p, onOpen }: { p: Person; onOpen: () => void }) {", "function PersonRow({ p, onOpen }: { p: Person; onOpen: () => void }) {\n  const t = useT();"],
    ["Level {levelInfo(p.xp).level} · {p.interests.map((i) => categoryById(i).name).join(\", \")}", "Level {levelInfo(p.xp).level} · {p.interests.map((i) => t(categoryById(i).name)).join(\", \")}"],
    hook("  const router = useRouter();"),
    ["{a.person ? a.text : `– ${a.text}`}", "{a.person ? t(a.text) : `– ${a.text}`}"],
    ["<p className=\"font-display text-xl font-semibold\">{leagueFor(state.xp)}</p>", "<p className=\"font-display text-xl font-semibold\">{t(leagueFor(state.xp))}</p>"],
    ["Diese Woche zählt jedes XP · endet in {daysLeftInWeek()} {daysLeftInWeek() === 1 ? \"Tag\" : \"Tagen\"}", "{daysLeftInWeek() === 1 ? t(\"Diese Woche zählt jedes XP · endet in 1 Tag\") : t(\"Diese Woche zählt jedes XP · endet in {n} Tagen\", { n: daysLeftInWeek() })}"],
    ["{r.me ? `${r.name} (du)` : r.name}", "{r.me ? t(\"{name} (du)\", { name: r.name }) : r.name}"],
    ["<p className=\"mt-4 text-[15px] leading-relaxed\">{open.bio}</p>", "<p className=\"mt-4 text-[15px] leading-relaxed\">{t(open.bio)}</p>"],
    ["Heutige Challenge: {played(open.id)!.mine}:{played(open.id)!.theirs}", "{t(\"Heutige Challenge: {a}:{b}\", { a: played(open.id)!.mine, b: played(open.id)!.theirs })}"],
  ],
  phrases: {
    "Gefolgt": "Following", "Folgen": "Follow", "Demo-Profile": "Demo profiles", "Aktivität": "Activity", "Rangliste": "Leaderboard", "Leute": "People",
    "Folge ein paar Leuten": "Follow a few people", "Dann siehst du hier, was sie lernen und gewinnen.": "Then you'll see here what they learn and win.", "Du": "You",
    "Hier wird es lebendig": "This is where it comes alive", "Folge ein paar Leuten und sieh, was sie lernen, liken und gewinnen.": "Follow a few people and see what they learn, like and win.",
    "Leute entdecken": "Discover people", "Alle": "All", "Freunde": "Friends", "Dein Profil ist privat – du erscheinst nicht in Ranglisten.": "Your profile is private – you do not appear on leaderboards.",
    "Noch keine Freunde": "No friends yet", "Folge Leuten, um dich direkt mit ihnen zu vergleichen.": "Follow people to compare yourself with them directly.", "Namen suchen": "Search names", "Profil": "Profile",
    "Quote": "Accuracy", "Revanche (ohne Bonus)": "Rematch (no bonus)", "Herausfordern · 5 Fragen": "Challenge · 5 questions", "Melden und blockieren": "Report and block",
  },
});
add({ "gerade eben": "just now", "vor {n} Std.": "{n} h ago", "vor {n} T.": "{n} d ago", "Diese Woche zählt jedes XP · endet in 1 Tag": "Every XP counts this week · ends in 1 day", "Diese Woche zählt jedes XP · endet in {n} Tagen": "Every XP counts this week · ends in {n} days", "{name} (du)": "{name} (you)", "Heutige Challenge: {a}:{b}": "Today's challenge: {a}:{b}" });

apply("app/profile/page.tsx", {
  pairs: [
    hook("  const { state, items, clips, update, reset, share } = useStore();"),
    ["Level {lvl.level} · {leagueFor(state.xp)}", "Level {lvl.level} · {t(leagueFor(state.xp))}"],
    ["<span className=\"tnum\">{state.xp} XP gesamt</span>", "<span className=\"tnum\">{t(\"{n} XP gesamt\", { n: state.xp })}</span>"],
    ["<span className=\"tnum\">noch {lvl.needed - lvl.current} XP bis Level {lvl.level + 1}</span>", "<span className=\"tnum\">{t(\"noch {n} XP bis Level {level}\", { n: lvl.needed - lvl.current, level: lvl.level + 1 })}</span>"],
    ["<span className=\"font-semibold\">{c.name}</span>", "<span className=\"font-semibold\">{t(c.name)}</span>"],
    ["<p className=\"mt-1.5 text-xs font-semibold leading-tight\">{a.name}</p>\n                <p className=\"text-[11px] leading-tight text-muted\">{a.description}</p>", "<p className=\"mt-1.5 text-xs font-semibold leading-tight\">{t(a.name)}</p>\n                <p className=\"text-[11px] leading-tight text-muted\">{t(a.description)}</p>"],
    ["share(`Ich bin Level ${lvl.level} auf Wunder – ${state.xp} XP, ${liveStreak(state)} Tage Streak. Mach mit!`)", "share(t(\"Ich bin Level {level} auf Wunder – {xp} XP, {days} Tage Streak. Mach mit!\", { level: lvl.level, xp: state.xp, days: liveStreak(state) }))"],
    ["                  {c.name}\n                </Chip>", "                  {t(c.name)}\n                </Chip>"],
    ["          <div>\n            <p className=\"mb-2 text-sm font-semibold\">Darstellung</p>", "          <div>\n            <p className=\"mb-2 text-sm font-semibold\">{t(\"Sprache\")}</p>\n            <Segmented value={state.settings.locale} onChange={(locale) => update({ settings: { ...state.settings, locale } })} options={LOCALES.map((l) => ({ value: l.id as string, label: l.name }))} />\n          </div>\n          <div>\n            <p className=\"mb-2 text-sm font-semibold\">{t(\"Altersstufe\")}</p>\n            <Segmented value={state.ageBand ?? \"16+\"} onChange={(ageBand) => update({ ageBand })} options={AGE_BANDS.map((b) => ({ value: b, label: b }))} />\n            <p className=\"mt-1.5 text-xs text-muted\">{t(\"Bestimmt, welche Inhalte angezeigt werden. Ab 16 wird alles gezeigt.\")}</p>\n          </div>\n          <div>\n            <p className=\"mb-2 text-sm font-semibold\">Darstellung</p>"],
    ['import { useStore, useT } from "@/lib/store";', 'import { AGE_BANDS } from "@/lib/content";\nimport { LOCALES } from "@/lib/i18n";\nimport { useStore, useT } from "@/lib/store";'],
  ],
  phrases: {
    "Einstellungen": "Settings", "Tage-Streak": "Day streak", "Längste Streak": "Longest streak", "Fragen beantwortet": "Questions answered", "Trefferquote": "Accuracy",
    "Wissensstand": "Knowledge", "Abzeichen": "Badges", "Gemerkte Karten": "Saved cards", "Profil teilen": "Share profile", "Noch nichts gemerkt": "Nothing saved yet",
    "Tippe im Feed auf das Lesezeichen, um Karten für später aufzuheben.": "Tap the bookmark in the feed to keep cards for later.", "Anzeigename": "Display name", "Interessen": "Interests", "Tagesziel": "Daily goal",
    "Darstellung": "Appearance", "System": "System", "Hell": "Light", "Dunkel": "Dark", "Privates Profil": "Private profile",
    "Du erscheinst nicht in Ranglisten und Suchergebnissen.": "You do not appear on leaderboards or in search results.", "Konto": "Account", "Wirklich alles löschen?": "Really delete everything?",
    "XP, Streak, Abzeichen und Konto werden unwiderruflich entfernt.": "XP, streak, badges and account will be removed permanently.", "Abbrechen": "Cancel", "Endgültig löschen": "Delete permanently", "Konto und Daten löschen": "Delete account and data",
  },
});
add({ "{n} XP gesamt": "{n} XP total", "noch {n} XP bis Level {level}": "{n} XP to level {level}", "Ich bin Level {level} auf Wunder – {xp} XP, {days} Tage Streak. Mach mit!": "I'm level {level} on Wunder – {xp} XP, {days}-day streak. Join me!", "Altersstufe": "Age level", "Bestimmt, welche Inhalte angezeigt werden. Ab 16 wird alles gezeigt.": "Determines which content is shown. From 16, everything is shown." });

apply("app/clips/page.tsx", {
  pairs: [
    hook("  const { state, update, toggle, share, trackClip } = useStore();"),
    ["  const [failed, setFailed] = useState(false);\n  const cat", "  const [failed, setFailed] = useState(false);\n  const [cover, setCover] = useState(false); // landscape footage fills the screen, vertical clips are shown whole\n  const cat"],
    ["      v.pause();\n      if (v.currentTime) v.currentTime = 0;\n      last.current = 0;\n      setTime(0);", "      v.pause();\n      if (v.readyState > 0) v.currentTime = clip.start;\n      last.current = clip.start;\n      setTime(clip.start);"],
    ["  }, [active, autoplay, clip.id, trackClip]);", "  }, [active, autoplay, clip.id, clip.start, trackClip]);"],
    ["  const onTime = () => {\n    const t = video.current?.currentTime ?? 0;\n    if (t < last.current - 0.5) trackClip(clip.id, \"complete\"); // looped → watched to the end\n    last.current = t;\n    setTime(t);\n  };", "  const onTime = () => {\n    const v = video.current;\n    if (!v) return;\n    let now = v.currentTime;\n    // A clip can be a segment of a longer file: jump back to its start when the end is reached.\n    if (clip.end !== null && now >= clip.end) {\n      v.currentTime = clip.start;\n      now = clip.start;\n      trackClip(clip.id, \"complete\");\n      if (active) v.play().catch(() => {});\n    } else if (now < last.current - 0.5) trackClip(clip.id, \"complete\"); // looped → watched to the end\n    last.current = now;\n    setTime(now);\n  };\n  const onMeta = () => {\n    const v = video.current;\n    if (!v) return;\n    setCover(v.videoWidth > v.videoHeight);\n    if (clip.start && v.currentTime < clip.start) v.currentTime = clip.start;\n  };"],
    ["  // Captions are spread over the narration in proportion to their length.\n  const total = clip.captions.reduce((n, c) => n + c.length, 0);\n  const progress = Math.min(0.999, Math.max(0, (time - 0.5) / Math.max(1, clip.duration - 1.7)));\n  let acc = 0;\n  const caption = time < 0.4 ? null : clip.captions.find((c) => (acc += c.length / total) > progress);", "  // Captions are spread over the clip in proportion to their length.\n  const elapsed = Math.max(0, time - clip.start);\n  const total = clip.captions.reduce((n, c) => n + c.length, 0);\n  const progress = Math.min(0.999, elapsed / Math.max(1, clip.duration));\n  let acc = 0;\n  const caption = clip.captions.find((c) => (acc += c.length / total) > progress);"],
    ["<video ref={video} src={clip.file} loop playsInline muted preload={active ? \"auto\" : \"metadata\"} onTimeUpdate={onTime}", "<video ref={video} src={clip.start ? `${clip.file}#t=${clip.start}` : clip.file} loop={clip.end === null} playsInline muted preload={active ? \"auto\" : \"metadata\"} onLoadedMetadata={onMeta} onTimeUpdate={onTime}"],
    ["className=\"absolute inset-0 h-full w-full object-contain\" />", "className={`absolute inset-0 h-full w-full ${cover ? \"object-cover\" : \"object-contain\"}`} />"],
    ["<span className=\"rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur\">Beispielclip</span>", "<span className=\"rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide backdrop-blur\">{clip.creator}</span>"],
    ["share(`${clip.title}\\n\\n${clip.takeaway}\\n\\n– ein Clip auf Wunder`)", "share(`${clip.title}\\n\\n${clip.takeaway}\\n\\n${t(\"– ein Clip auf Wunder\")}`)"],
    ["{clip.creator} · Quelle: {clip.sources[0].name}", "{clip.creator} · {t(\"Quelle:\")} {clip.sources[0].name}"],
    ["          {cat.name}\n", "          {t(cat.name)}\n"],
    ["style={{ width: `${Math.min(100, (time / clip.duration) * 100)}%` }}", "style={{ width: `${Math.min(100, (elapsed / clip.duration) * 100)}%` }}"],
    ["  const { state, clips: allClips, getState, hide, addComment } = useStore();", "  const { state, clips: allClips, getState, hide, addComment } = useStore();\n  const t = useT();\n  const child = isChild(state.ageBand); // no comments for children"],
    ["Merksatz: {clip.takeaway}", "{t(\"Merksatz:\")} {clip.takeaway}"],
    ["{clip.creator} · {new Date(clip.publishedAt).toLocaleDateString(\"de-DE\")} · {clip.verification === \"verified\" ? \"Redaktionell geprüft.\" : \"Automatisch erzeugter Beispielclip, noch nicht redaktionell geprüft.\"}", "{clip.creator} · {new Date(clip.publishedAt).toLocaleDateString(formatLocale(state.settings.locale))} · {clip.verification === \"verified\" ? t(\"Redaktionell geprüft.\") : t(\"Noch nicht redaktionell geprüft.\")}\n              {clip.license && <span className=\"block\">{t(\"Lizenz:\")} {clip.license}</span>}"],
    ["{p.name} · Demo-Profil", "{p.name} · {t(\"Demo-Profil\")}"],
    ['import { useStore, useT } from "@/lib/store";', 'import { isChild } from "@/lib/content";\nimport { formatLocale } from "@/lib/i18n";\nimport { useStore, useT } from "@/lib/store";'],
    ["<ClipView key={c.id} clip={c} index={i} active={i === active} near={Math.abs(i - active) <= 1} autoplay={autoplay} onActive={setActive} open={(kind) => setSheet({ kind, clip: c })} />", "<ClipView key={c.id} clip={c} index={i} active={i === active} near={Math.abs(i - active) <= 1} autoplay={autoplay} onActive={setActive} open={(kind) => setSheet({ kind, clip: c })} comments={!child} />"],
    ["function ClipView({ clip, index, active, near, autoplay, onActive, open }: { clip: Clip; index: number; active: boolean; near: boolean; autoplay: boolean; onActive: (i: number) => void; open: (kind: SheetKind) => void }) {", "function ClipView({ clip, index, active, near, autoplay, onActive, open, comments }: { clip: Clip; index: number; active: boolean; near: boolean; autoplay: boolean; onActive: (i: number) => void; open: (kind: SheetKind) => void; comments: boolean }) {"],
    ["        <RailButton label=\"Kommentare\" onClick={() => open(\"comments\")} count={clip.comments.length + ownComments}>\n          <MessageCircle size={21} />\n        </RailButton>", "        {comments && (\n          <RailButton label={t(\"Kommentare\")} onClick={() => open(\"comments\")} count={clip.comments.length + ownComments}>\n            <MessageCircle size={21} />\n          </RailButton>\n        )}"],
    ["  const { muted, captions } = state.settings;", "  const { muted, captions: showCaptions } = state.settings;"],
    ["update({ settings: { ...state.settings, captions: !captions } })} aria-label={captions ? \"Untertitel ausblenden\" : \"Untertitel einblenden\"} aria-pressed={captions}", "update({ settings: { ...state.settings, captions: !showCaptions } })} aria-label={showCaptions ? t(\"Untertitel ausblenden\") : t(\"Untertitel einblenden\")} aria-pressed={showCaptions}"],
    ["{captions ? <Captions size={19} /> : <CaptionsOff size={19} />}", "{showCaptions ? <Captions size={19} /> : <CaptionsOff size={19} />}"],
    ["{captions && caption && (", "{showCaptions && caption && ("],
  ],
  phrases: {
    "Dieser Clip lädt gerade nicht.": "This clip isn't loading right now.", "Erneut versuchen": "Try again", "Abspielen": "Play", "Ton einschalten": "Turn sound on", "Ton ausschalten": "Turn sound off",
    "Mehr Optionen": "More options", "Gefällt mir": "Like", "Merken": "Save", "Teilen": "Share", "Erklärung und Quellen": "Explanation and sources", "Quiz gelöst": "Quiz solved", "Kurz testen · 10 XP": "Quick test · 10 XP",
    "Keine Clips mehr": "No more clips", "Du hast alle Clips ausgeblendet. Neue folgen.": "You have hidden all clips. More will follow.",
    "Noch keine Clips vorhanden. Mit „npm run clips“ werden die Beispielclips erzeugt.": "No clips available yet.",
    "Erklärung": "Explanation", "Kurz testen": "Quick test", "Kommentare": "Comments", "Dieser Clip": "This clip", "Quellen": "Sources", "Quiz ansehen": "View quiz", "Wissen testen": "Test your knowledge",
    "Weiter schauen": "Keep watching", "Du": "You", "Kommentar schreiben": "Write a comment", "Senden": "Send",
    "Kommentare werden noch nicht synchronisiert – deiner bleibt auf diesem Gerät.": "Comments are not synced yet – yours stays on this device.", "Kein Interesse": "Not interested", "Irreführend oder falsch – melden": "Misleading or wrong – report",
  },
});
add({ "– ein Clip auf Wunder": "– a clip on Wunder", "Quelle:": "Source:", "Merksatz:": "Key takeaway:", "Redaktionell geprüft.": "Editorially reviewed.", "Noch nicht redaktionell geprüft.": "Not editorially reviewed yet.", "Lizenz:": "Licence:", "Demo-Profil": "Demo profile", "Untertitel ausblenden": "Hide captions", "Untertitel einblenden": "Show captions", "NASA-Material, gemeinfrei (keine Billigung durch die NASA)": "NASA material, public domain (no endorsement by NASA)" });

fs.mkdirSync("lib/locales", { recursive: true });
fs.writeFileSync("lib/locales/en.json", JSON.stringify(Object.fromEntries(Object.entries(dict).sort(([a], [b]) => a.localeCompare(b, "de"))), null, 2) + "\n");
console.log(`${Object.keys(dict).length} dictionary entries, ${problems} problems`);
