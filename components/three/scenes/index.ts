// Registry of 3D scenes. A scene is added here and referenced by its key from content/animations.json
// ("renderer": "three", "scene": "<key>"). Everything in this folder is loaded only when a 3D animation is shown.
import type { SceneFactory } from "../types";
import { cell } from "./cell";
import { dna } from "./dna";
import { emotor } from "./emotor";
import { engine } from "./engine";
import { gears } from "./gears";
import { lens } from "./lens";
import { lever } from "./lever";
import { moon } from "./moon";
import { orbit } from "./orbit";
import { plates } from "./plates";
import { seasons } from "./seasons";
import { starbirth } from "./starbirth";

export const SCENES_3D: Record<string, SceneFactory> = { engine, dna, orbit, gears, lens, emotor, cell, seasons, moon, lever, plates, starbirth };
