# Builds lungs.glb from Z-Anatomy: lungs, diaphragm (muscle + central tendon), trachea with bronchi, ribs with
# costal cartilages and sternum and the heart (for orientation), plus lungs-paths.json with the
# centre lines of the bronchi (for the air), all in glTF coordinates.
#   blender -b --disable-autoexec --factory-startup Startup.blend --python scripts/models/export_lungs.py -- public/models/lungs.glb lungs-paths.json
import bpy, bmesh, re, sys, json
from mathutils import Matrix, Vector
args = sys.argv[sys.argv.index('--')+1:]
OUT, PATHS = args[0], args[1]
SCALE = 12
LUNGS = ['Superior lobe of left lung', 'Inferior lobe of left lung', 'Superior lobe of right lung', 'Middle lobe of right lung', 'Inferior lobe of right lung']
BRONCHI = ['Left main bronchus', 'Right main bronchus', 'Left superior lobar bronchus', 'Left inferior lobar bronchus', 'Right superior lobar bronchus', 'Intermediate bronchus.r', 'Middle lobar bronchus.r', 'Right inferior lobar bronchus']
names = [o.name for o in bpy.data.objects if o.type == 'MESH']
ribs = [n for n in names if re.match(r'^(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth) rib\.(l|r)$', n) or re.match(r'^Costal cartilage of .* rib\.(l|r)$', n)] + ['Manubrium of sternum', 'Body of sternum', 'Xiphoid process']
GROUPS = {
 'lungs': (LUNGS, None, 0.32), 'diaphragm': (['Diaphragm'], 'muscle', 0.3), 'airway': (['Trachea'] + BRONCHI, None, None),
 'ribs': (ribs, 'bone', 0.1), 'heart': (['Right atrium', 'Right ventricle', 'Left atrium', 'Left ventricle'], None, 0.15),
}
dg = bpy.context.evaluated_depsgraph_get()
pts = []
for n in LUNGS:
    o = bpy.data.objects[n]; pts += [o.matrix_world @ v.co for v in o.data.vertices]
lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
C = (lo + hi) / 2
M = Matrix.Scale(SCALE, 4) @ Matrix.Translation(-C)
print('LUNG_SIZE_CM', tuple(round((hi[i]-lo[i])*100, 1) for i in range(3)))
mats = [bpy.data.materials.new(k) for k in ['a', 'b']]
built = []
for g, (members, two, ratio) in GROUPS.items():
    bm = bmesh.new()
    for nm in members:
        o = bpy.data.objects.get(nm)
        if o is None: print('MISSING', nm); continue
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        me.transform(M @ o.matrix_world)
        for p in me.polygons:
            m = me.materials[p.material_index] if p.material_index < len(me.materials) else None
            name = m.name.lower() if m else ''
            # two materials only where they mean something: bone/cartilage, muscle/tendon
            p.material_index = 1 if two and (name.startswith('cartilage') or name.startswith('tendon')) else 0
        bm.from_mesh(me)
    out = bpy.data.meshes.new(g); bm.to_mesh(out); bm.free()
    out.materials.append(mats[0])
    if two: out.materials.append(mats[1])
    ob = bpy.data.objects.new(g, out); bpy.context.collection.objects.link(ob)
    if ratio:
        mod = ob.modifiers.new('d', 'DECIMATE'); mod.ratio = ratio
        bpy.context.view_layer.update()
        me2 = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        ob.modifiers.clear(); ob.data = me2
    built.append(g)
    bb = [Vector(c) for c in ob.bound_box]
    print('GROUP', g, len(ob.data.vertices), tuple(round(min(c[i] for c in bb), 2) for i in range(3)), tuple(round(max(c[i] for c in bb), 2) for i in range(3)))
paths = {}
for nm in BRONCHI:
    o = bpy.data.objects[nm]; W = M @ o.matrix_world
    paths[nm] = [[[round((W @ Vector(p.co[:3])).x, 3), round((W @ Vector(p.co[:3])).z, 3), round(-(W @ Vector(p.co[:3])).y, 3)] for p in (sp.bezier_points if sp.type == 'BEZIER' else sp.points)] for sp in o.data.splines]
tr = bpy.data.objects['Trachea']; tv = [M @ tr.matrix_world @ v.co for v in tr.data.vertices]
top = max(tv, key=lambda c: c.z)
paths['Trachea top'] = [[[round(sum(c.x for c in tv)/len(tv), 3), round(top.z, 3), round(-sum(c.y for c in tv)/len(tv), 3)]]]
json.dump(paths, open(PATHS, 'w'))
for o in bpy.context.scene.objects: o.select_set(o.name in built)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_texcoords=False, export_normals=True, export_vertex_color='NONE', export_animations=False, export_extras=False, export_yup=True)
print('DONE')
