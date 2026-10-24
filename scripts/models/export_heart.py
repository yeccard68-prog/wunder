# Builds heart.glb from Z-Anatomy: the four chambers, valves, papillary muscles, great vessels and lungs,
# plus heart-paths.json with the centre lines of the vessels (for the blood flow), all in glTF coordinates.
import bpy, bmesh, math, sys, json
from mathutils import Matrix, Vector
args = sys.argv[sys.argv.index('--')+1:]
OUT, PATHS = args[0], args[1]
SCALE = 25
GROUPS = {
 'ra': ['Right atrium'], 'rv': ['Right ventricle'], 'la': ['Left atrium'], 'lv': ['Left ventricle'],
 'tricuspid': ['Inferior leaflet of right atrioventricular valve', 'Septal leaflet of right atrioventricular valve'],
 'mitral': ['Posterior leaflet of left atrioventricular valve'],
 'aortic': ['Left coronary leaflet', 'Right coronary leaflet', 'Non-coronary leaflet'],
 'pulmonary': ['Anterior semilunar leaflet of pulmonary valve', 'Left semilunar leaflet of pulmonary valve', 'Right semilunar leaflet of pulmonary valve'],
 'papillary': ['Anterior papillary muscle of right ventricle', 'Inferior papillary muscle of right ventricle', 'Septal papillary muscle of right ventricle', 'Inferior papillary muscle of left ventricle'],
 'aorta': ['Ascending aorta', 'Aortic arch', 'Thoracic aorta', 'Brachiocephalic trunk', 'Left common carotid artery', 'Left subclavian artery'],
 'cava': ['Superior vena cava', 'Inferior vena cava (thoracic part)'],
 'partery': ['Pulmonary trunk', 'Bifurcation of pulmonary trunk', 'Left pulmonary artery', 'Right pulmonary artery'],
 'pvein': ['Left inferior pulmonary vein', 'Left superior pulmonary vein', 'Right inferior pulmonary vein', 'Right superior pulmonary vein'],
 'lungs': ['Superior lobe of left lung', 'Inferior lobe of left lung', 'Superior lobe of right lung', 'Middle lobe of right lung', 'Inferior lobe of right lung'],
}
DECIMATE = {'ra': 0.4, 'rv': 0.4, 'lv': 0.4, 'tricuspid': 0.45, 'mitral': 0.55, 'pulmonary': 0.6, 'lungs': 0.3}
CURVES = ['Ascending aorta','Aortic arch','Thoracic aorta','Superior vena cava','Inferior vena cava (thoracic part)','Bifurcation of pulmonary trunk','Left pulmonary artery','Right pulmonary artery','Left inferior pulmonary vein','Left superior pulmonary vein','Right inferior pulmonary vein','Right superior pulmonary vein']
dg = bpy.context.evaluated_depsgraph_get()
# centre: the four chambers together
pts = []
for n in ['Right atrium','Right ventricle','Left atrium','Left ventricle']:
    o = bpy.data.objects[n]
    pts += [o.matrix_world @ v.co for v in o.data.vertices]
lo = Vector([min(p[i] for p in pts) for i in range(3)]); hi = Vector([max(p[i] for p in pts) for i in range(3)])
C = (lo+hi)/2
M = Matrix.Scale(SCALE, 4) @ Matrix.Translation(-C)
print('HEART_SIZE_CM', tuple(round((hi[i]-lo[i])*100,1) for i in range(3)))
mat = bpy.data.materials.new('m')
built = {}
for g, names in GROUPS.items():
    bm = bmesh.new()
    for nm in names:
        o = bpy.data.objects.get(nm)
        if o is None: print('MISSING', nm); continue
        if o.type == 'CURVE':
            o.data.bevel_depth = max(o.data.bevel_depth, 0.0005)
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
        me.transform(M @ o.matrix_world)
        for p in me.polygons: p.material_index = 0  # one material per part
        print('  PART', g, nm, len(me.vertices))
        bm.from_mesh(me)
    out = bpy.data.meshes.new(g); bm.to_mesh(out); bm.free()
    out.materials.append(mat)
    ob = bpy.data.objects.new(g, out); bpy.context.collection.objects.link(ob)
    if g in DECIMATE:
        mod = ob.modifiers.new('d', 'DECIMATE'); mod.ratio = DECIMATE[g]
        bpy.context.view_layer.update()
        me2 = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
        ob.modifiers.clear(); ob.data = me2; out = me2
    built[g] = ob
    bb = [Vector(c) for c in ob.bound_box]
    print('GROUP', g, len(out.vertices), 'box', tuple(round(min(c[i] for c in bb),2) for i in range(3)), tuple(round(max(c[i] for c in bb),2) for i in range(3)))
# vessel centre lines, Blender (x,y,z) -> glTF (x, z, -y)
paths = {}
for nm in CURVES:
    o = bpy.data.objects[nm]
    W = M @ o.matrix_world
    lines = []
    for sp in o.data.splines:
        ps = sp.bezier_points if sp.type == 'BEZIER' else sp.points
        line = []
        for p in ps:
            co = W @ Vector(p.co[:3])
            line.append([round(co.x,3), round(co.z,3), round(-co.y,3), round(p.radius,3)])
        lines.append(line)
    paths[nm] = lines
    print('PATH', nm, [len(l) for l in lines], 'bevel', o.data.bevel_depth, 'ext', o.data.extrude)
json.dump(paths, open(PATHS,'w'), indent=0)
for o in bpy.context.scene.objects: o.select_set(o.name in built)
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True, export_texcoords=False, export_normals=True, export_vertex_color='NONE', export_animations=False, export_extras=False, export_yup=True)
print('DONE')
