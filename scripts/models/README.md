# 3D models

`public/models/*.glb` are real anatomy models for the 3D scenes. They are cut out of the free
anatomy atlas **Z-Anatomy** (CC BY-SA 4.0), which builds on **BodyParts3D** (The Database Center for
Life Science, CC BY-SA 2.1 Japan). Adapted versions stay under CC BY-SA 4.0; the attribution is on the
credits page (`app/legal/page.tsx`, `MODELS`) and under the animation (`MODEL_CREDITS` in `lib/animations.ts`).
Do not use the parts of Z-Anatomy under a non-commercial licence (inner ear, kidney).

Regenerate `arm.glb` (and the same way `heart.glb` with `export_heart.py -- public/models/heart.glb heart-paths.json`; copy the paths without radii to `components/three/scenes/heart-paths.json`) (Blender 5.2, free; the portable zip from blender.org is enough):

1. Download `Z-Anatomy.zip` from https://github.com/Z-Anatomy/Models-of-human-anatomy and extract only `Startup.blend`.
2. `blender -b --disable-autoexec --factory-startup Startup.blend --python scripts/models/export_arm.py -- public/models/arm.glb`

Keep Blender in a short path on Windows (e.g. `%TEMP%\bl523`) – longer paths break its Python modules.
The script prints the elbow axis (`AXIS_GLTF`); `components/three/scenes/arm.ts` uses it negated as `AXIS`.
