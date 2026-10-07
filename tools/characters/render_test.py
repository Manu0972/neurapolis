import bpy, math, sys, os
from bl_ext.user_default.mpfb.services.humanservice import HumanService
U = '/root/.config/blender/4.2/extensions/.user/user_default/mpfb/data'
out = sys.argv[sys.argv.index('--') + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
def asset(kind, name, ext='mhclo'):
    d = os.path.join(U, kind, name)
    return os.path.join(d, [f for f in os.listdir(d) if f.endswith('.' + ext)][0])
def eyes_file():
    d = os.path.join(U, 'eyes', 'high-poly')
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith('.mhclo'): return os.path.join(root, f)
def human(macro, x, skin, clothes, hair, brows='eyebrow001'):
    base = HumanService.create_human(macro_detail_dict=macro, scale=0.1)
    HumanService.set_character_skin(asset('skins', skin, 'mhmat'), base, skin_type='ENHANCED_SSS')
    HumanService.add_mhclo_asset(eyes_file(), base, asset_type='Eyes')
    HumanService.add_mhclo_asset(asset('eyebrows', brows), base, asset_type='Eyebrows')
    HumanService.add_mhclo_asset(asset('eyelashes', 'eyelashes01'), base, asset_type='Eyelashes')
    if hair: HumanService.add_mhclo_asset(asset('hair', hair), base, asset_type='Hair')
    for c in clothes: HumanService.add_mhclo_asset(asset('clothes', c), base, asset_type='Clothes')
    for o in [base] + list(base.children):
        o.location.x += x if o is base else 0
    base.location.x = x
    return base
R = lambda a, f, c: {"african": a, "asian": f, "caucasian": c}
bases = []
bases.append(0)
bases[-1] = human({"gender": 1.0, "age": 0.19, "muscle": 0.5, "weight": 0.5, "height": 0.6, "proportions": 0.5, "race": R(0.85, 0.05, 0.1)}, -1.1, 'young_african_male', ['male_casualsuit02', 'shoes02'], 'short02')
bases.append(human({"gender": 1.0, "age": 0.5, "muscle": 0.8, "weight": 0.7, "height": 0.65, "proportions": 0.7, "race": R(0.1, 0.1, 0.8)}, 0.0, 'young_caucasian_male', ['male_casualsuit04', 'shoes01'], 'short04', 'eyebrow006'))
bases.append(human({"gender": 0.0, "age": 0.5, "muscle": 0.5, "weight": 0.65, "height": 0.45, "proportions": 0.6, "cupsize": 0.65, "race": R(0.1, 0.7, 0.2)}, 1.1, 'young_asian_female', ['female_casualsuit01', 'shoes03'], 'bob02', 'eyebrow010'))
if os.environ.get('STYLE') == 'facettes':
    # Style low-poly : maillage simplifié par plans, ombrage plat (facettes visibles).
    for o in list(bpy.data.objects):
        if o.type != 'MESH': continue
        if any(k in o.name.lower() for k in ('eye', 'brow', 'lash', 'teeth', 'tongue')): continue
        m = o.modifiers.new('lowpoly', 'DECIMATE'); m.decimate_type = 'COLLAPSE'; m.ratio = 0.12 if 'hair' not in o.name.lower() else 0.2
        for poly in o.data.polygons: poly.use_smooth = False
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); bpy.context.scene.collection.objects.link(cam)
cam.location = (0, -6.0, 1.0); cam.rotation_euler = (math.radians(90), 0, 0); cam.data.lens = 50

bpy.context.scene.camera = cam
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3.0; sun.rotation_euler = (math.radians(55), math.radians(10), math.radians(25)); bpy.context.scene.collection.objects.link(sun)
w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.55, 0.52, 0.48, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.9
bpy.context.scene.world = w
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 32; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 1200, 800
sc.render.filepath = out
if os.environ.get('PORTRAIT'):
    sc.render.resolution_x, sc.render.resolution_y = 600, 700
    for i, b in enumerate(bases):
        h = b.dimensions.z
        cam.location = (b.location.x, -1.6, h - 0.11); cam.data.lens = 85
        sc.render.filepath = out.replace('.png', f'_{i}.png')
        bpy.ops.render.render(write_still=True)
else:
    bpy.ops.render.render(write_still=True)
print('RENDER_OK', out)
