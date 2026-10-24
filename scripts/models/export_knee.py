# Builds knee.glb from Z-Anatomy (right knee): femur, tibia, fibula (bone + cartilage), patella, menisci, both
# cruciate ligaments and the four heads of the quadriceps. Origin: the bending axis of the knee (through the femoral
# condyles); 1 unit = 1 cm; glTF axes (front +z, up +y).
#   blender -b --disable-autoexec --factory-startup Startup.blend --python scripts/models/export_knee.py -- public/models/knee.glb
import bpy, bmesh, sys
from mathutils import Matrix, Vector
OUT = sys.argv[sys.argv.index('--')+1]
GROUPS = {
 'femur': (['Femur.r'], True), 'tibia': (['Tibia.r'], True), 'fibula': (['Fibula.r'], True), 'patella': (['Patella.r'], True),
 'menisci': (['Lateral meniscus.r', 'Medial meniscus.r', 'Transverse ligament of knee.r'], False),
 'acl': (['Anterior cruciate ligament.r'], False), 'pcl': (['Posterior cruciate ligament.r'], False),
 'quadriceps': (['Rectus femoris muscle.r', 'Vastus lateralis muscle.r', 'Vastus medialis muscle.r', 'Vastus intermedius muscle.r'], True),
}
dg = bpy.context.evaluated_depsgraph_get()
fe = bpy.data.objects['Femur.r']
fv = [fe.matrix_world @ v.co for v in fe.data.vertices]
zmin = min(v.z for v in fv)
low = [v for v in fv if v.z < zmin + 0.03]
pivot = Vector(((min(v.x for v in low) + max(v.x for v in low)) / 2, sum(v.y for v in low) / len(low) + 0.005, zmin + 0.022))
M = Matrix.Scale(100, 4) @ Matrix.Translation(-pivot)
mats = [bpy.data.materials.new(k) for k in ['a', 'b']]
built = []
for g, (members, two) in GROUPS.items():
    bm = bmesh.new()
    for nm in members:
        o = bpy.data.objects.get(nm)
        if o is None: print('MISSING', nm); continue
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        me.transform(M @ o.matrix_world)
        for p in me.polygons:
            m = me.materials[p.material_index] if p.material_index < len(me.materials) else None
            n = m.name.lower() if m else ''
            p.material_index = 1 if two and (n.startswith('cartilage') or n.startswith('tendon')) else 0
        bm.from_mesh(me)
    out = bpy.data.meshes.new(g); bm.to_mesh(out); bm.free()
    out.materials.append(mats[0])
    if two: out.materials.append(mats[1])
    ob = bpy.data.objects.new(g, out); bpy.context.collection.objects.link(ob)
    built.append(g)
    bb = [Vector(c) for c in ob.bound_box]
    print('GROUP', g, len(out.vertices), tuple(round(min(c[i] for c in bb), 1) for i in range(3)), tuple(round(max(c[i] for c in bb), 1) for i in range(3)))
for ob in bpy.context.scene.objects: ob.select_set(ob.name in built)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_texcoords=False, export_normals=True, export_vertex_color='NONE', export_animations=False, export_extras=False, export_yup=True)
print('DONE')
