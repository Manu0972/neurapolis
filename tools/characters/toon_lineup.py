import bpy, math, sys, os, addon_utils
for _m in ('bl_ext.user_default.mpfb', 'bl_ext.user_default.vrm'):
    addon_utils.enable(_m, default_set=True, persistent=True)
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
T = '/root/.config/blender/4.2/extensions/user_default/mpfb/data/targets'
U = '/root/.config/blender/4.2/extensions/.user/user_default/mpfb/data'
out = sys.argv[sys.argv.index('--') + 1]
for o in list(bpy.data.objects): bpy.data.objects.remove(o)
def asset(kind, name, ext='mhclo'):
    d = os.path.join(U, kind, name)
    for root, _, files in os.walk(d):
        for f in files:
            if f.endswith('.' + ext): return os.path.join(root, f)
def eyes_file():
    for root, _, files in os.walk(os.path.join(U, 'eyes', 'high-poly')):
        for f in files:
            if f.endswith('.mhclo'): return os.path.join(root, f)

def toon(name, base, shade, rim=0.0):
    """Matériau cel-shading : 3 tons (lumière, demi-teinte, ombre colorée), trait par coque inversée à part."""
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    for n in list(N): N.remove(n)
    outn = N.new('ShaderNodeOutputMaterial')
    dif = N.new('ShaderNodeBsdfDiffuse'); dif.inputs['Color'].default_value = (1, 1, 1, 1)
    s2r = N.new('ShaderNodeShaderToRGB')
    ramp = N.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
    e = ramp.color_ramp.elements
    e[0].position = 0.0; e[0].color = shade
    e[1].position = 0.18; e[1].color = tuple((a + b) / 2 for a, b in zip(base, shade))
    e3 = e.new(0.42); e3.color = base
    emi = N.new('ShaderNodeEmission')
    L.new(dif.outputs[0], s2r.inputs[0]); L.new(s2r.outputs[0], ramp.inputs[0]); L.new(ramp.outputs[0], emi.inputs[0])
    L.new(emi.outputs[0], outn.inputs[0])
    return m

def get_ink():
    ink = bpy.data.materials.get('ink')
    if ink: return ink
    ink = bpy.data.materials.new('ink'); ink.use_nodes = True; ink.use_backface_culling = True
    nt = ink.node_tree
    for n in list(nt.nodes): nt.nodes.remove(n)
    o_ = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission'); em.inputs[0].default_value = (0.08, 0.05, 0.05, 1)
    nt.links.new(em.outputs[0], o_.inputs[0])
    return ink

def outline(o, width=0.006):
    o.data.materials.append(get_ink())
    mod = o.modifiers.new('trait', 'SOLIDIFY'); mod.thickness = width; mod.offset = 1; mod.use_flip_normals = True
    mod.material_offset = len(o.data.materials) - 1; mod.use_rim = False

SKINS = {  # (lumière, ombre) — ombres chaudes et saturées, jamais grises
    'porcelaine': ((0.98, 0.84, 0.76, 1), (0.85, 0.55, 0.50, 1)),
    'doree': ((0.86, 0.64, 0.46, 1), (0.66, 0.38, 0.26, 1)),
    'olive': ((0.78, 0.58, 0.40, 1), (0.55, 0.34, 0.20, 1)),
    'brune': ((0.46, 0.28, 0.17, 1), (0.28, 0.13, 0.08, 1)),
    'ebene': ((0.30, 0.17, 0.10, 1), (0.16, 0.07, 0.05, 1)),
    'rosee': ((0.95, 0.74, 0.66, 1), (0.78, 0.45, 0.42, 1)),
}
CLOTH = {'noir': ((0.13, 0.13, 0.15, 1), (0.05, 0.05, 0.08, 1)), 'kaki': ((0.45, 0.47, 0.32, 1), (0.25, 0.27, 0.17, 1)),
         'blanc': ((0.95, 0.94, 0.92, 1), (0.68, 0.68, 0.75, 1)), 'jean': ((0.30, 0.42, 0.62, 1), (0.15, 0.22, 0.38, 1))}
HAIR = ((0.10, 0.07, 0.06, 1), (0.03, 0.02, 0.02, 1))

def person(macro, x, skin, clothes, hair, cloth='noir', hair_col=HAIR, details=None):
    base = HumanService.create_human(macro_detail_dict=macro, scale=0.1)
    # Traits affirmés : réglages fins de MakeHuman (hanches, fessier, taille, épaules, muscles…).
    for name, w in (details or {}).items():
        sides = ['l-' + name, 'r-' + name] if name.startswith('*') is False and name.startswith(('upperleg', 'upperarm', 'lowerarm')) else [name]
        for n in sides:
            cat = {'hip': 'hip', 'buttocks': 'buttocks', 'stomach': 'stomach', 'measure-bust': 'torso', 'measure-waist': 'torso', 'measure-hips': 'torso',
                   'measure-shoulder': 'torso', 'torso': 'torso', 'measure-thigh': 'legs', 'l-upperleg': 'legs', 'r-upperleg': 'legs', 'l-upperarm': 'arms', 'r-upperarm': 'arms',
                   'l-lowerarm': 'arms', 'r-lowerarm': 'arms', 'breast': 'breast', 'measure-calf': 'legs'}
            folder = next(v for k, v in cat.items() if n.startswith(k))
            TargetService.load_target(base, f'{T}/{folder}/{n}.target.gz', weight=w)

    HumanService.add_mhclo_asset(eyes_file(), base, asset_type='Eyes')
    if hair: HumanService.add_mhclo_asset(asset('hair', hair), base, asset_type='Hair')
    for c in clothes: HumanService.add_mhclo_asset(asset('clothes', c), base, asset_type='Clothes')
    base.location.x = x
    sm = toon('peau', *SKINS[skin]); cm = toon('tissu', *CLOTH[cloth]); hm = toon('cheveux', *hair_col)
    for o in [base] + list(base.children):
        if o.type != 'MESH': continue
        n = o.name.lower()
        if 'eye' in n and o is not base:
            continue
        o.data.materials.clear()
        o.data.materials.append(sm if o is base else hm if 'hair' in n else cm)
        for p in o.data.polygons: p.use_smooth = True
        outline(o, 0.012 if o is base else 0.009)
    return base

R = lambda a, f, c: {"african": a, "asian": f, "caucasian": c}
# Six adultes aux corps affirmés (planche « zodiaque », Elle, triangle inversé…).
person({"gender": 1, "age": 0.55, "muscle": 0.95, "weight": 0.9, "height": 0.8, "proportions": 0.8, "race": R(0.1, 0.1, 0.8)}, -3.0, 'rosee', ['mindfront_male_swimming_trunks_01'], 'short04', details={'torso-muscle-pectoral-incr': 0.8, 'torso-muscle-dorsi-incr': 0.8, 'measure-shoulder-dist-incr': 0.6, 'upperarm-muscle-incr': 0.8, 'stomach-pregnant-incr': 0.25})
person({"gender": 1, "age": 0.45, "muscle": 0.9, "weight": 0.55, "height": 0.75, "proportions": 1.0, "race": R(0.9, 0.05, 0.05)}, -1.8, 'ebene', ['mindfront_male_swimming_trunks_02'], 'short02', details={'torso-muscle-pectoral-incr': 1.0, 'torso-muscle-dorsi-incr': 1.0, 'measure-shoulder-dist-incr': 0.9, 'measure-waist-circ-decr': 0.6, 'upperarm-muscle-incr': 1.0, 'upperleg-muscle-incr': 0.8, 'stomach-tone-incr': 1.0})
person({"gender": 1, "age": 0.4, "muscle": 0.6, "weight": 0.3, "height": 0.6, "proportions": 0.9, "race": R(0.1, 0.8, 0.1)}, -0.6, 'doree', ['mindfront_male_swimming_trunks_03'], 'short01', details={'measure-shoulder-dist-incr': 0.4, 'measure-waist-circ-decr': 0.5, 'stomach-tone-incr': 0.8, 'torso-muscle-pectoral-incr': 0.4})
person({"gender": 0, "age": 0.45, "muscle": 0.55, "weight": 0.62, "height": 0.4, "proportions": 0.9, "cupsize": 0.7, "race": R(0.15, 0.15, 0.7)}, 0.6, 'olive', ['mindfront_tank_top_01', 'cortu_jeans_shorts'], 'ponytail01', 'noir', details={'hip-scale-horiz-incr': 0.7, 'buttocks-volume-incr': 1.0, 'measure-waist-circ-decr': 0.9, 'measure-hips-circ-incr': 0.9, 'measure-thigh-circ-incr': 0.7, 'measure-shoulder-dist-incr': 0.3})
person({"gender": 0, "age": 0.55, "muscle": 0.4, "weight": 0.95, "height": 0.5, "proportions": 0.5, "cupsize": 0.8, "race": R(0.85, 0.05, 0.1)}, 1.8, 'brune', ['mindfront_tank_top_01', 'cortu_jeans_shorts'], 'afro01', 'blanc', details={'stomach-pregnant-incr': 0.5, 'hip-scale-horiz-incr': 0.8, 'buttocks-volume-incr': 0.8, 'measure-thigh-circ-incr': 0.8, 'upperarm-fat-incr': 0.8})
person({"gender": 0, "age": 0.4, "muscle": 0.95, "weight": 0.5, "height": 0.6, "proportions": 0.9, "cupsize": 0.4, "race": R(0.1, 0.1, 0.8)}, 3.0, 'porcelaine', ['mindfront_tank_top_01', 'cortu_jeans_shorts'], 'bob02', 'kaki', details={'torso-muscle-dorsi-incr': 0.7, 'measure-shoulder-dist-incr': 0.6, 'upperarm-muscle-incr': 1.0, 'upperleg-muscle-incr': 1.0, 'stomach-tone-incr': 1.0, 'measure-waist-circ-decr': 0.4})

sc = bpy.context.scene
cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -11.5, 0.95); cam.rotation_euler = (math.radians(90), 0, 0); cam.data.lens = 50
sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 4.0
sun.rotation_euler = (math.radians(55), math.radians(-20), math.radians(-35)); sc.collection.objects.link(sun)
w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.93, 0.91, 0.88, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 0.35
sc.world = w
sc.render.engine = 'BLENDER_EEVEE_NEXT'
sc.view_settings.view_transform = 'Standard'
sc.render.film_transparent = True
sc.eevee.use_shadows = False if hasattr(sc.eevee, 'use_shadows') else None
sc.render.resolution_x, sc.render.resolution_y = 2000, 900
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print('RENDER_OK')
