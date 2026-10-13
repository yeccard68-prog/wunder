// Electric motor and battery move from the 2D drawing to a 3D scene (19.10.2026).
// The drawings stay as the fallback where 3D is not available. Texts and check questions are
// unchanged, except the first step of the motor, which described the flat front view.
//   node content/_batches/2026-10-animations-3d-3.mjs      (idempotent; rewrites content/animations.json)
import fs from "node:fs";

const file = "content/animations.json";
const animations = JSON.parse(fs.readFileSync(file, "utf8"));
const to3d = (id, scene, fallback) => {
  const a = animations.find((x) => x.id === id);
  if (!a) throw new Error(`${id} not found`);
  Object.assign(a, { renderer: "three", scene, fallback_scene: fallback });
  return a;
};
const motor = to3d("a-elektromotor", "emotor", "motor");
motor.steps[0].text = "Ein einfacher Elektromotor besteht aus einem Magneten und einer drehbaren Drahtspule zwischen seinen Polen. Der Strom kommt aus der Batterie und fließt über zwei Schleifkontakte in die Spule.";
motor.translations.en.steps[0] = "A simple electric motor consists of a magnet and a wire coil that can turn between its poles. The current comes from the battery and flows into the coil through two sliding contacts.";
// the coil is no longer "seen from the front"
motor.labels[2] = "Drahtspule";
motor.translations.en.labels[2] = "Wire coil";
to3d("a-batterie", "cell", "battery");
fs.writeFileSync(file, JSON.stringify(animations, null, 2) + "\n");
console.log("motor and battery are 3D scenes now.");
