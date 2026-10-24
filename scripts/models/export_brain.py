# Builds brain.glb from Z-Anatomy: the four lobes of each cerebral hemisphere (frontal, parietal, temporal, occipital,
# as left/right parts), the cerebellum and the brainstem. 1 unit = 1 cm, centre of the brain at the origin, glTF axes.
#   blender -b --disable-autoexec --factory-startup Startup.blend --python scripts/models/export_brain.py -- public/models/brain.glb
import bpy, bmesh, re, sys
from mathutils import Matrix, Vector
OUT = sys.argv[sys.argv.index('--')+1]
SKIP = re.compile(r'(ventricle|aqueduct|fossa|nucleus|artery|vein|nerve)', re.I)
def skip(name):
    n = name.lower()
    return bool(SKIP.search(n)) or ('sulcus' in n and 'gyrus' not in n)  # a bare furrow, not a convolution
def members(col, side=None):
    c = bpy.data.collections[col]
    out = [o for o in c.all_objects if o.type == 'MESH' and len(o.data.vertices) > 30 and not skip(o.name)]
    if side: out = [o for o in out if o.name.endswith('.' + side)]
    return out
GROUPS = {}
for lobe, col in [('frontal', 'Frontal lobe'), ('parietal', 'Parietal lobe'), ('temporal', 'Temporal lobe'), ('occipital', 'Occipital lobe')]:
    for side in ['l', 'r']:
        GROUPS[f'{lobe}_{side}'] = members(col, side)
GROUPS['insula'] = members('Insula') + members('Limbic lobe')  # fills the deep furrow; shown in tissue colour
GROUPS['cerebellum'] = members('Cerebellum')
GROUPS['brainstem'] = members('Brainstem')
allv = [o.matrix_world @ v.co for g in GROUPS.values() for o in g for v in o.data.vertices]
lo = Vector([min(p[i] for p in allv) for i in range(3)]); hi = Vector([max(p[i] for p in allv) for i in range(3)])
M = Matrix.Scale(100, 4) @ Matrix.Translation(-(lo + hi) / 2)
print('BRAIN_CM', tuple(round((hi[i] - lo[i]) * 100, 1) for i in range(3)))
dg = bpy.context.evaluated_depsgraph_get()
mat = bpy.data.materials.new('m')
built = []
for g, objs in GROUPS.items():
    bm = bmesh.new()
    for o in objs:
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        me.transform(M @ o.matrix_world)
        for p in me.polygons: p.material_index = 0
        bm.from_mesh(me)
    out = bpy.data.meshes.new(g); bm.to_mesh(out); bm.free()
    out.materials.append(mat)
    ob = bpy.data.objects.new(g, out); bpy.context.collection.objects.link(ob)
    if len(out.vertices) > 7000:
        mod = ob.modifiers.new('d', 'DECIMATE'); mod.ratio = 7000 / len(out.vertices)
        bpy.context.view_layer.update()
        me2 = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        ob.modifiers.clear(); ob.data = me2
    built.append(g)
    print('GROUP', g, len(objs), len(ob.data.vertices))
for ob in bpy.context.scene.objects: ob.select_set(ob.name in built)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_texcoords=False, export_normals=True, export_vertex_color='NONE', export_animations=False, export_extras=False, export_yup=True)
print('DONE')
