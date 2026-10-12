// Registry of 3D scenes. A scene is added here and referenced by its key from content/animations.json
// ("renderer": "three", "scene": "<key>"). Everything in this folder is loaded only when a 3D animation is shown.
import type { SceneFactory } from "../types";
import { dna } from "./dna";
import { engine } from "./engine";
import { gears } from "./gears";
import { lens } from "./lens";
import { orbit } from "./orbit";

export const SCENES_3D: Record<string, SceneFactory> = { engine, dna, orbit, gears, lens };
