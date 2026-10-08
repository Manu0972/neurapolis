"""Bibliothèque du rendu « dessiné » des personnages : corps MakeHuman (MPFB) affirmés, tête anime
VRoid (CC0) greffée, ombres en aplats (3 tons), normales lissées, trait par coque inversée."""
import bpy, math, sys, os, addon_utils, mathutils
for _m in ('bl_ext.user_default.mpfb', 'bl_ext.user_default.vrm'):
    addon_utils.enable(_m, default_set=True, persistent=True)
from bl_ext.user_default.mpfb.services.humanservice import HumanService
from bl_ext.user_default.mpfb.services.targetservice import TargetService
from bl_ext.user_default.mpfb.services.clothesservice import ClothesService
from bl_ext.user_default.mpfb.entities.clothes.mhclo import Mhclo
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from graft import graft
_EXT = os.path.expanduser('~/.config/blender/4.2/extensions')
# Têtes VRoid CC0 (non suivies par git), cibles MakeHuman de l'extension, assets MakeHuman (CC0) installés.
V = os.environ.get('VROID_DIR', os.path.join(HERE, '..', '..', 'public', '_vroid_tmp')) + os.sep
T = os.environ.get('MPFB_TARGETS', os.path.join(_EXT, 'user_default', 'mpfb', 'data', 'targets'))
U = os.environ.get('MPFB_USER_DATA', os.path.join(_EXT, '.user', 'user_default', 'mpfb', 'data'))
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

def toon(name, base, shade, rim=0.0, mid=0.18, light=0.42):
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
    e[1].position = mid; e[1].color = tuple((a + b) / 2 for a, b in zip(base, shade))
    e3 = e.new(light); e3.color = base
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

def outline(o, width=0.006, group=None):
    o.data.materials.append(get_ink())
    mod = o.modifiers.new('trait', 'SOLIDIFY'); mod.thickness = width; mod.offset = 1; mod.use_flip_normals = True
    if group: mod.vertex_group = group; mod.thickness_vertex_group = 0.0
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
CLOTH.update({
    'cuir': ((0.22, 0.16, 0.13, 1), (0.10, 0.07, 0.06, 1)), 'brique': ((0.70, 0.33, 0.25, 1), (0.45, 0.17, 0.15, 1)),
    'sauge': ((0.60, 0.68, 0.56, 1), (0.36, 0.44, 0.38, 1)), 'creme': ((0.93, 0.88, 0.78, 1), (0.70, 0.62, 0.55, 1)),
    'marine': ((0.20, 0.26, 0.40, 1), (0.10, 0.12, 0.22, 1)), 'moutarde': ((0.86, 0.66, 0.28, 1), (0.60, 0.40, 0.16, 1)),
    'prune': ((0.45, 0.26, 0.40, 1), (0.26, 0.13, 0.25, 1)), 'gris': ((0.62, 0.62, 0.64, 1), (0.38, 0.38, 0.44, 1)),
    'jean_clair': ((0.52, 0.64, 0.80, 1), (0.30, 0.40, 0.58, 1)),
})
SHOE_HINTS = ('shoe', 'sneaker', 'boot', 'sandal', 'flat', 'maryjane')
BOTTOM_HINTS = ('jean', 'pant', 'trouser', 'short', 'skirt')

def soften_normals(o, iterations):
    """Ombrage « dessin » : normales prises sur une copie lissée du maillage (technique Guilty Gear Xrd),
    pour des aplats nets au lieu des stries des muscles et des plis."""
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
    src = bpy.data.objects.new(o.name + '_lisse', me); bpy.context.scene.collection.objects.link(src)
    src.matrix_world = o.matrix_world
    sm = src.modifiers.new('lisse', 'SMOOTH'); sm.factor = 1.0; sm.iterations = iterations
    src.hide_render = True; src.hide_viewport = False
    dt = o.modifiers.new('normales', 'DATA_TRANSFER'); dt.object = src; dt.use_object_transform = True
    dt.use_loop_data = True; dt.data_types_loops = {'CUSTOM_NORMAL'}; dt.loop_mapping = 'POLYINTERP_NEAREST'
    return src

def relax_arms(rig, from_vertical=12.0):
    """Pose détendue : ramène les bras de l'A-pose vers le corps (rotation autour de l'axe avant-arrière)."""
    bpy.context.view_layer.update()
    for side, sgn in (('l', 1), ('r', -1)):
        pb = rig.pose.bones['upperarm_' + side]
        d = pb.tail - pb.head
        cur = math.degrees(math.atan2(abs(d.x), -d.z))
        R = mathutils.Matrix.Rotation(math.radians(cur - from_vertical) * sgn, 4, 'Y')
        h = pb.head.copy()
        pb.matrix = mathutils.Matrix.Translation(h) @ R @ mathutils.Matrix.Translation(-h) @ pb.matrix
        bpy.context.view_layer.update()

def person(macro, x, skin, clothes, hair=None, iris=(0.30, 0.18, 0.10, 1), cloth='noir', hair_col=HAIR, details=None, vrm=None, cloth2=None, arm_gap=12.0, head_boost=1.12):
    base = HumanService.create_human(macro_detail_dict=macro, scale=0.1)
    # Traits affirmés : réglages fins de MakeHuman (hanches, fessier, taille, épaules, muscles…).
    for name, w in (details or {}).items():
        sides = ['l-' + name, 'r-' + name] if name.startswith('*') is False and name.startswith(('upperleg', 'upperarm', 'lowerarm')) else [name]
        for n in sides:
            cat = {'hip': 'hip', 'buttocks': 'buttocks', 'stomach': 'stomach', 'measure-bust': 'torso', 'measure-waist': 'torso', 'measure-hips': 'torso',
                   'measure-shoulder': 'torso', 'torso': 'torso', 'measure-thigh': 'legs', 'l-upperleg': 'legs', 'r-upperleg': 'legs', 'l-upperarm': 'arms', 'r-upperarm': 'arms',
                   'l-lowerarm': 'arms', 'r-lowerarm': 'arms', 'breast': 'breast', 'measure-calf': 'legs', 'measure-neck': 'neck', 'neck': 'neck'}
            folder = next(v for k, v in cat.items() if n.startswith(k))
            TargetService.load_target(base, f'{T}/{folder}/{n}.target.gz', weight=w)

    # Cou affiné : la tête anime a une mâchoire plus étroite que la tête MakeHuman.
    neck = 0.5 if macro.get('gender', 0) >= 0.5 else 0.8
    TargetService.load_target(base, f'{T}/neck/measure-neck-circ-decr.target.gz', weight=neck)
    rig = HumanService.add_builtin_rig(base, 'game_engine')
    for c in clothes:
        f = asset('clothes', c)
        HumanService.add_mhclo_asset(f, base, asset_type='Clothes')
        # Masque la peau cachée par le vêtement (sinon elle transperce les tissus ajustés).
        mh = Mhclo(); mh.load(f); ClothesService.update_delete_group(mh, base)
    rig.location.x = x
    relax_arms(rig, arm_gap)
    bpy.context.view_layer.update()
    sm = toon('peau', *SKINS[skin]); cm = toon('tissu', *CLOTH[cloth]); cm2 = toon('tissu2', *CLOTH[cloth2 or cloth]); hm = toon('cheveux', *hair_col)
    shoe = toon('chaussure', *CLOTH['cuir'])
    for o in [base] + [c for c in rig.children_recursive if c is not base]:
        if o.type != 'MESH': continue
        n = o.name.lower()
        if 'eye' in n and o is not base:
            continue
        o.data.materials.clear()
        o.data.materials.append(sm if o is base else hm if 'hair' in n else shoe if any(t in n for t in SHOE_HINTS) else cm2 if any(t in n for t in BOTTOM_HINTS) else cm)
        for p in o.data.polygons: p.use_smooth = True
        if o is not base:  # vêtement : 3 mm au-dessus de la peau (évite les taches de peau au travers)
            dp = o.modifiers.new('decolle', 'DISPLACE'); dp.mid_level = 0.0; dp.strength = 0.003
        soften_normals(o, 18 if o is base else 10)
        outline(o, 0.009 if o is base else 0.008, 'trait' if o is base else None)
    # Tête anime VRoid (CC0) greffée, peau et cheveux aux couleurs du personnage.
    global LAST_PARTS
    LAST_PARTS = graft(base, rig, V + (vrm or 'HairSample_Female.vrm'), sm, hm, head_boost, face_mat=toon('visage', *SKINS[skin], mid=0.04, light=0.10), iris=iris)
    for part in LAST_PARTS:
        for poly in part.data.polygons: poly.use_smooth = True
        if not part.name.startswith('Face'): outline(part, 0.008)
    return base


def setup_scene(cam_loc, lens, res, target=None):
    """Caméra, soleil SANS ombres portées (sinon la coque du trait ombre la peau en stries) et Eevee."""
    sc = bpy.context.scene
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = cam_loc; cam.rotation_euler = (math.radians(90), 0, 0); cam.data.lens = lens
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 4.0; sun.data.use_shadow = False
    sun.rotation_euler = (math.radians(55), math.radians(-20), math.radians(-35)); sc.collection.objects.link(sun)
    sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.view_settings.view_transform = 'Standard'; sc.render.film_transparent = True
    sc.render.resolution_x, sc.render.resolution_y = res
    return cam
