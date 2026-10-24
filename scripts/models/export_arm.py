# Builds arm.glb from Z-Anatomy (right arm): static upper arm + shoulder, forearm with hand, biceps, triceps.
import bpy, bmesh, math, sys
from mathutils import Matrix, Vector
OUT = sys.argv[sys.argv.index('--')+1]
fingers = ['first','second','third','fourth','fifth']
GROUPS = {
 'upper': ['Humerus.r','Scapula.r','Clavicle.r'],
 'fore': ['Ulna.r','Radius.r','Scaphoid bone.r','Lunate bone.r','Triquetrum bone.r','Pisiform bone.r','Trapezium bone.r','Trapezoid bone.r','Capitate bone.r','Hamate bone.r']
   + [f'{n.capitalize()} metacarpal bone.r' for n in fingers]
   + [f'{p} phalanx of {n} finger of hand.r' for p in ['Proximal','Middle','Distal'] for n in fingers if not (p=='Middle' and n=='first')],
 'biceps': ['Long head of biceps brachii.r','Short head of biceps brachii.r'],
 'triceps': ['Long head of triceps brachii.r','Lateral head of triceps brachii.r','Medial head of triceps brachii.r'],
}
mats = {k: bpy.data.materials.new(k) for k in ['bone','cartilage','muscle','tendon']}
def target(name):
    n = name.lower()
    if n.startswith('bone'): return 'bone'
    if n.startswith('cartilage'): return 'cartilage'
    if n.startswith('tendon'): return 'tendon'
    return 'muscle'
dg = bpy.context.evaluated_depsgraph_get()
# rotate +90° about Z (front -Y -> +X), scale x10
R = Matrix.Rotation(math.radians(90), 4, 'Z') @ Matrix.Scale(10, 4)
built = {}
for g, names in GROUPS.items():
    bm = bmesh.new()
    slot_names = ['bone','cartilage','muscle','tendon']
    for nm in names:
        o = bpy.data.objects.get(nm)
        if o is None: print('MISSING', nm); continue
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        me.transform(R @ o.matrix_world)
        remap = [slot_names.index(target(m.name if m else 'bone')) for m in me.materials] or [0]
        for p in me.polygons: p.material_index = remap[p.material_index] if p.material_index < len(remap) else 0
        if nm == 'Scapula.r':
            tmp = bmesh.new(); tmp.from_mesh(me)
            me2 = bpy.data.meshes.new('s'); tmp.to_mesh(me2)
            ob = bpy.data.objects.new('s', me2); bpy.context.collection.objects.link(ob)
            mod = ob.modifiers.new('d','DECIMATE'); mod.ratio = 0.22
            me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        bm.from_mesh(me)
    out = bpy.data.meshes.new(g); bm.to_mesh(out); bm.free()
    for k in slot_names: out.materials.append(mats[k])
    built[g] = out
# elbow: lowest 6 % of the humerus; axis between its most medial and most lateral points (along Z after rotation)
hum = bpy.data.meshes.new_from_object(bpy.data.objects['Humerus.r'].evaluated_get(dg)); hum.transform(R @ bpy.data.objects['Humerus.r'].matrix_world)
zs = [v.co.z for v in hum.vertices]; lo, hi = min(zs), max(zs)
bottom = [v.co.copy() for v in hum.vertices if v.co.z < lo + (hi-lo)*0.06]
a = min(bottom, key=lambda c: c.y); b = max(bottom, key=lambda c: c.y)
centre = (a+b)/2
axis = (b-a).normalized()
print('HUMERUS_LEN', hi-lo, 'ELBOW', tuple(centre), 'AXIS', tuple(axis))
for g, me in built.items():
    me.transform(Matrix.Translation(-centre))
    ob = bpy.data.objects.new(g, me); bpy.context.collection.objects.link(ob)
    print('GROUP', g, len(me.vertices), len(me.polygons))
    bb = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    print('  BOX', tuple(round(min(c[i] for c in bb),3) for i in range(3)), tuple(round(max(c[i] for c in bb),3) for i in range(3)))
for o in bpy.context.scene.objects: o.select_set(o.name in built)
# axis in glTF coords (x, z, -y)
print('AXIS_GLTF', (axis.x, axis.z, -axis.y))
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_texcoords=False, export_normals=True, export_vertex_color='NONE', export_animations=False, export_extras=False, export_yup=True)
print('DONE')
