// Languages and age levels.  Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { canRegister, demoContent, fitsAge, forAudience, isChild } from "../lib/content";
import { translate } from "../lib/i18n";
import en from "../lib/locales/en.json";

const content = demoContent();

test("English: every published question and clip has a complete translation", () => {
  for (const i of [...content.items, ...content.clips.map((c) => c.quiz!)]) {
    const t = i.translations?.en;
    assert.ok(t?.question && t.explanation, `${i.id} has no English text`);
    assert.equal(t!.options.length, i.options.length, `${i.id}: option count differs`);
  }
  for (const c of content.clips) assert.equal(c.translations?.en?.captions.length, c.captions.length, c.id);
});

test("content is shown in the requested language, with the original as fallback", () => {
  const english = forAudience(content, "en", "16+");
  assert.equal(english.items.find((i) => i.id === "s1")!.question, "What is the chemical symbol for gold?");
  assert.match(english.items.find((i) => i.id === "s1")!.explanation!, /aurum/);
  assert.equal(english.clips.find((c) => c.id === "v-sonne")!.title, "Our Sun in motion");
  assert.equal(english.clips.find((c) => c.id === "v-sonne")!.quiz!.options[0], "Hydrogen and helium");
  // no French translations exist → original German text
  assert.equal(forAudience(content, "fr", "16+").items.find((i) => i.id === "s1")!.question, "Welches chemische Symbol hat Gold?");
});

test("the correct answer keeps its position in every language", () => {
  for (const i of content.items) assert.equal(i.translations!.en.options.length > i.correctIndex!, true, i.id);
});

test("age levels: children only see cards made for them", () => {
  const kids = forAudience(content, "de", "6-9");
  assert.ok(kids.items.length >= 20);
  assert.ok(kids.items.every((i) => i.minAge === 6));
  assert.deepEqual(kids.clips.map((c) => c.id).sort(), ["v-gepard", "v-keimung", "v-oktopus", "v-rippenqualle"]);
});

test("age levels: 10–12 sees children's cards plus level 10, nothing above", () => {
  const set = forAudience(content, "de", "10-12");
  assert.ok(set.items.some((i) => i.minAge === 6) && set.items.some((i) => i.minAge === 10));
  assert.ok(set.items.every((i) => i.minAge <= 10));
  assert.equal(set.clips.length, 38);
});

test("age levels: from 16 everything is shown except cards written only for children", () => {
  const adults = forAudience(content, "de", "16+");
  assert.ok(adults.items.some((i) => i.minAge === 16));
  assert.ok(adults.items.every((i) => i.maxAge === null));
  assert.equal(adults.items.length, content.items.filter((i) => i.maxAge === null).length);
  // users who were never asked are treated like 16+
  assert.equal(forAudience(content, "de", null).items.length, adults.items.length);
});

test("age levels: 13–15 does not see 16+ content", () => {
  assert.ok(forAudience(content, "de", "13-15").items.every((i) => i.minAge <= 13 && i.maxAge === null));
  assert.equal(fitsAge({ minAge: 16 }, "13-15"), false);
});

test("children get no community features and cannot register on their own", () => {
  assert.deepEqual([isChild("6-9"), isChild("10-12"), isChild("13-15"), isChild("16+"), isChild(null)], [true, true, false, false, false]);
  assert.deepEqual([canRegister("6-9"), canRegister("13-15"), canRegister("16+"), canRegister(null)], [false, false, true, true]);
});

test("interface texts: German is the key, English comes from the dictionary, unknown keys fall back", () => {
  assert.equal(translate("de", "Weiter"), "Weiter");
  assert.equal(translate("en", "Weiter"), "Continue");
  assert.equal(translate("en", "Noch {n} bis zum Tagesziel", { n: 3 }), "3 to go to reach your daily goal");
  assert.equal(translate("en", "Nicht übersetzter Text"), "Nicht übersetzter Text");
  assert.equal(translate("fr", "Weiter"), "Weiter");
});

test("the English dictionary has no empty entries and keeps all placeholders", () => {
  for (const [de, text] of Object.entries(en as Record<string, string>)) {
    assert.ok(text.trim().length > 0, de);
    assert.deepEqual((text.match(/\{\w+\}/g) ?? []).sort(), (de.match(/\{\w+\}/g) ?? []).sort(), de);
  }
});
