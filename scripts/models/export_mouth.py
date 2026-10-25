# Builds mouth.glb from Z-Anatomy: tongue, lower jaw with its teeth, upper jaw with its teeth, soft palate with uvula,
# epiglottis, thyroid cartilage, hyoid bone and the pharynx. 1 unit = 1 cm, the middle of the head at x = 0, glTF axes.
#   blender -b --disable-autoexec --factory-startup Startup.blend --python scripts/models/export_mouth.py -- public/models/mouth.glb
import bpy, bmesh, re, sys
from mathutils import Matrix, Vector
OUT = sys.argv[sys.argv.index('--')+1]
names = [o.name for o in bpy.data.objects if o.type == 'MESH']
lower = [n for n in names if re.match(r'^Lower .*(incisor|canine|premolar|molar).*\.(l|r)$', n, re.I)]
upper = [n for n in names if re.match(r'^Upper .*(incisor|canine|premolar|molar).*\.(l|r)$', n, re.I)]
GROUPS = {
 'tongue': ['Tongue'], 'jaw': ['Mandible'] + lower, 'upper': ['Maxilla.r', 'Maxilla.l'] + upper,
 'palate': ['Soft palate', 'Uvula of palate'], 'larynx': ['Thyroid cartilage', 'Epiglottis', 'Hyoid bone'],
 'pharynx': ['Nasopharynx', 'Oropharynx', 'Laryngopharynx'],
}
print('TEETH', len(lower), len(upper))
dg = bpy.context.evaluated_depsgraph_get()
pts = [bpy.data.objects[n].matrix_world @ v.co for n in ['Mandible', 'Maxilla.r', 'Maxilla.l', 'Thyroid cartilage'] for v in bpy.data.objects[n].data.vertices]
lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
M = Matrix.Scale(100, 4) @ Matrix.Translation(-(lo + hi) / 2)
mat = bpy.data.materials.new('m')
built = []
for g, members in GROUPS.items():
    bm = bmesh.new()
    for nm in members:
        o = bpy.data.objects.get(nm)
        if o is None: print('MISSING', nm); continue
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        me.transform(M @ o.matrix_world)
        for p in me.polygons: p.material_index = 0
        bm.from_mesh(me)
    out = bpy.data.meshes.new(g); bm.to_mesh(out); bm.free()
    out.materials.append(mat)
    ob = bpy.data.objects.new(g, out); bpy.context.collection.objects.link(ob)
    if g == 'tongue':  # smooth enough to bend softly
        mod = ob.modifiers.new('s', 'SUBSURF'); mod.levels = 2
        bpy.context.view_layer.update()
        me2 = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        ob.modifiers.clear(); ob.data = me2
    if len(ob.data.vertices) > 9000:
        mod = ob.modifiers.new('d', 'DECIMATE'); mod.ratio = 9000 / len(ob.data.vertices)
        bpy.context.view_layer.update()
        me2 = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        ob.modifiers.clear(); ob.data = me2
    built.append(g)
    bb = [Vector(c) for c in ob.bound_box]
    # print in glTF coordinates (x, z, -y)
    print('GROUP', g, len(ob.data.vertices), 'x', round(min(c.x for c in bb), 1), round(max(c.x for c in bb), 1), 'y', round(min(c.z for c in bb), 1), round(max(c.z for c in bb), 1), 'z', round(min(-c.y for c in bb), 1), round(max(-c.y for c in bb), 1))
for ob in bpy.context.scene.objects: ob.select_set(ob.name in built)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_texcoords=False, export_normals=True, export_vertex_color='NONE', export_animations=False, export_extras=False, export_yup=True)
print('DONE')
