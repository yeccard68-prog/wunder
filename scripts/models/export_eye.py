# Builds eye.glb from Z-Anatomy (right eye): sclera, cornea, iris, lens, retina, vitreous body, anterior chamber,
# eye muscles and the optic nerve, plus eye-paths.json with the centre line of the optic nerve, in glTF coordinates.
#   blender -b --disable-autoexec --factory-startup Startup.blend --python scripts/models/export_eye.py -- public/models/eye.glb eye-paths.json
import bpy, bmesh, re, sys, json
from mathutils import Matrix, Vector
args = sys.argv[sys.argv.index('--')+1:]
OUT, PATHS = args[0], args[1]
SCALE = 100  # 1 unit = 1 cm
names = [o.name for o in bpy.data.objects if o.type == 'MESH']
muscles = [n for n in names if re.match(r'^(Superior|Inferior|Lateral|Medial) (rectus|oblique) muscle\.r$', n)]
print('MUSCLES', muscles)
GROUPS = {
 'sclera': ['Sclera.r'], 'cornea': ['Cornea.r'], 'iris': ['Iris.r'], 'lens': ['Lens.r'], 'retina': ['Retina.r'],
 'vitreous': ['Posterior segment of eyeball.r'], 'chamber': ['Anterior chamber of eyeball.r'], 'muscles': muscles, 'nerve': ['Optic nerve (II).r'],
}
dg = bpy.context.evaluated_depsgraph_get()
sc = bpy.data.objects['Sclera.r']
pts = [sc.matrix_world @ v.co for v in sc.data.vertices]
lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
C = (lo + hi) / 2
M = Matrix.Scale(SCALE, 4) @ Matrix.Translation(-C)
print('EYE_SIZE_CM', tuple(round((hi[i]-lo[i])*100, 2) for i in range(3)))
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
    built.append(g)
    bb = [Vector(c) for c in ob.bound_box]
    print('GROUP', g, len(out.vertices), tuple(round(min(c[i] for c in bb), 2) for i in range(3)), tuple(round(max(c[i] for c in bb), 2) for i in range(3)))
o = bpy.data.objects['Optic nerve (II).r']; W = M @ o.matrix_world
paths = {'nerve': [[[round((W @ Vector(p.co[:3])).x, 3), round((W @ Vector(p.co[:3])).z, 3), round(-(W @ Vector(p.co[:3])).y, 3)] for p in (sp.bezier_points if sp.type == 'BEZIER' else sp.points)] for sp in o.data.splines]}
json.dump(paths, open(PATHS, 'w'))
for ob in bpy.context.scene.objects: ob.select_set(ob.name in built)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_texcoords=False, export_normals=True, export_vertex_color='NONE', export_animations=False, export_extras=False, export_yup=True)
print('DONE')
