"""Planche de validation : dix adultes variés (peaux, morphologies, coiffures, tenues du quotidien),
de face, de dos et en gros plan. `blender -b --python planche.py -- sortie.png`"""
import bpy, math, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import toonlib, hair
from toonlib import *
out = sys.argv[sys.argv.index('--') + 1]
R = lambda a, f, c: {"african": a, "asian": f, "caucasian": c}
H = {  # couleurs de cheveux (lumière, ombre)
    'noir': ((0.09, 0.07, 0.07, 1), (0.03, 0.02, 0.02, 1)), 'brun': ((0.20, 0.12, 0.08, 1), (0.08, 0.045, 0.035, 1)),
    'chatain': ((0.36, 0.22, 0.13, 1), (0.18, 0.10, 0.06, 1)), 'cuivre': ((0.50, 0.24, 0.12, 1), (0.25, 0.10, 0.05, 1)),
    'roux': ((0.62, 0.27, 0.13, 1), (0.36, 0.13, 0.07, 1)), 'noir_bleu': ((0.10, 0.10, 0.14, 1), (0.03, 0.03, 0.06, 1)),
}
I = {'brun': (0.20, 0.11, 0.06, 1), 'noisette': (0.36, 0.24, 0.10, 1), 'bleu': (0.28, 0.40, 0.55, 1), 'vert': (0.25, 0.42, 0.30, 1)}
M, F = 1, 0
PEOPLE = [
    # (genre, macro, peau, tête VRoid, coiffure procédurale, cheveux, iris, vêtements, couleur haut, couleur bas, traits, écart des bras)
    (M, dict(age=0.55, muscle=0.85, weight=0.85, height=0.55, proportions=0.8, race=R(0.1, 0.1, 0.8)), 'rosee', 'HairSample_Male.vrm', None, 'chatain', 'bleu',
     ['namuhekam_male_polo_shirt', 'punkduck_male_classic_jeans', 'culturalibre_sneakers'], 'brique', 'jean',
     {'torso-muscle-pectoral-incr': 0.6, 'torso-muscle-dorsi-incr': 0.6, 'measure-shoulder-dist-incr': 0.5, 'upperarm-muscle-incr': 0.6, 'stomach-pregnant-incr': 0.2}, 16),
    (M, dict(age=0.45, muscle=0.9, weight=0.55, height=0.62, proportions=1.0, race=R(0.9, 0.05, 0.05)), 'ebene', 'Base_Male.vrm', 'locks', 'noir', 'brun',
     ['toigo_basic_tucked_t-shirt', 'elvs_male_trouser_short_1', 'punkduck_running_shoes_01'], 'creme', 'kaki',
     {'torso-muscle-pectoral-incr': 0.9, 'torso-muscle-dorsi-incr': 0.9, 'measure-shoulder-dist-incr': 0.8, 'measure-waist-circ-decr': 0.5, 'upperarm-muscle-incr': 0.9, 'upperleg-muscle-incr': 0.7}, 14),
    (M, dict(age=0.4, muscle=0.6, weight=0.3, height=0.45, proportions=0.9, race=R(0.1, 0.8, 0.1)), 'doree', 'Sakurada_Fumiriya.vrm', None, 'noir_bleu', 'brun',
     ['elvs_hooded_sweat_jacket1', 'cortu_cargo_pants', 'punkduck_comfortable_sneakers'], 'sauge', 'noir', {'measure-shoulder-dist-incr': 0.3, 'measure-waist-circ-decr': 0.4}, 12),
    (M, dict(age=0.5, muscle=0.55, weight=0.85, height=0.5, proportions=0.6, race=R(0.75, 0.05, 0.2)), 'brune', 'Base_Male.vrm', 'nattes', 'noir', 'brun',
     ['elvs_male_shirt_untucked_bd1', 'elvs_male_trouser', 'mindfront_shoes_oxford_male'], 'marine', 'gris', {'stomach-pregnant-incr': 0.5, 'measure-shoulder-dist-incr': 0.4}, 18),
    (F, dict(age=0.45, muscle=0.55, weight=0.62, height=0.4, proportions=0.9, cupsize=0.65, race=R(0.15, 0.15, 0.7)), 'olive', 'Sendagaya_Shino.vrm', None, 'brun', 'noisette',
     ['punkduck_v_neck_top', 'punkduck_female_tight_jeans', 'dressupdoc_balletflat1'], 'moutarde', 'marine',
     {'hip-scale-horiz-incr': 0.6, 'buttocks-volume-incr': 0.9, 'measure-waist-circ-decr': 0.8, 'measure-hips-circ-incr': 0.8, 'measure-thigh-circ-incr': 0.6}, 16),
    (F, dict(age=0.55, muscle=0.4, weight=0.95, height=0.45, proportions=0.5, cupsize=0.75, race=R(0.85, 0.05, 0.1)), 'brune', 'Base_Female.vrm', 'afro', 'noir', 'brun',
     ['toigo_keyhole_tank_top', 'punkduck_jeans_skirt', 'dressupdoc_sandals1'], 'prune', 'jean_clair',
     {'stomach-pregnant-incr': 0.4, 'hip-scale-horiz-incr': 0.7, 'buttocks-volume-incr': 0.7, 'measure-thigh-circ-incr': 0.7, 'upperarm-fat-incr': 0.7}, 22),
    (F, dict(age=0.4, muscle=0.95, weight=0.5, height=0.5, proportions=0.9, cupsize=0.4, race=R(0.1, 0.1, 0.8)), 'porcelaine', 'Base_Female.vrm', None, 'roux', 'vert',
     ['punkduck_sleeveless_crop_top', 'mindfront_female_trousers_1', 'punkduck_tennis_shoes'], 'blanc', 'gris',
     {'torso-muscle-dorsi-incr': 0.6, 'measure-shoulder-dist-incr': 0.5, 'upperarm-muscle-incr': 0.9, 'upperleg-muscle-incr': 0.9, 'measure-waist-circ-decr': 0.4}, 16),
    (F, dict(age=0.45, muscle=0.5, weight=0.6, height=0.45, proportions=0.85, cupsize=0.6, race=R(0.8, 0.05, 0.15)), 'brune', 'Base_Female.vrm', 'papillon', 'cuivre', 'brun',
     ['toigo_camisole_top', 'punkduck_female_tight_jeans', 'culturalibre_sneakers'], 'sauge', 'noir', {'hip-scale-horiz-incr': 0.5, 'buttocks-volume-incr': 0.6}, 15),
    (F, dict(age=0.42, muscle=0.6, weight=0.5, height=0.6, proportions=0.9, cupsize=0.5, race=R(0.95, 0.0, 0.05)), 'ebene', 'Base_Female.vrm', 'tresses', 'noir', 'brun',
     ['toigo_keyhole_tank_top', 'mindfront_female_trousers_1', 'punkduck_tennis_shoes'], 'brique', 'creme', {'measure-waist-circ-decr': 0.5}, 15),
    (F, dict(age=0.5, muscle=0.45, weight=0.4, height=0.55, proportions=0.9, cupsize=0.45, race=R(0.05, 0.85, 0.1)), 'doree', 'AvatarSample_D.vrm', None, 'noir', 'brun',
     ['mindfront_knitted_sweater_01', 'punkduck_female_short_jeans', 'mindfront_shoes_biker_boots_female'], 'creme', 'jean', {}, 13),
]
N = len(PEOPLE); GAP = 1.05
for k, (g, mac, skin, vrm, coiffure, hc, iris, clothes, c1, c2, det, gap) in enumerate(PEOPLE):
    mac = dict(mac, gender=g); mac.setdefault('cupsize', 0.5)
    person(mac, (k - (N - 1) / 2) * GAP, skin, clothes, cloth=c1, cloth2=c2, hair_col=H[hc], vrm=vrm, iris=I[iris], details=det, arm_gap=gap)
    if coiffure:
        crane = next(o for o in toonlib.LAST_PARTS if o.name.startswith('Crane'))
        head = hair.Head([o for o in toonlib.LAST_PARTS if o.name.startswith(('Face', 'Crane'))])
        hm = toon('meche', *H[hc])
        ob = {'locks': lambda: hair.locks(crane, hm, head, seed=k, count=70),
              'papillon': lambda: hair.locks(crane, hm, head, seed=k, count=60, length=0.30, thick=0.014, butterfly=True),
              'tresses': lambda: hair.box_braids(crane, hm, head, seed=k, count=90),
              'nattes': lambda: hair.cornrows(crane, hm, head),
              'afro': lambda: hair.afro(crane, hm, head, seed=k)}[coiffure]()
        outline(ob, 0.004)
sc = bpy.context.scene
W = N * GAP + 0.6
cam = setup_scene((0, -W / (2 * math.tan(math.radians(39.6) / 2)) * 1.02, 0.95), 50, (3200, 1150))
sc.render.filepath = out; bpy.ops.render.render(write_still=True)
cam.location.y = -cam.location.y; cam.rotation_euler = (math.radians(90), 0, math.radians(180))
sc.render.filepath = out.replace('.png', '_dos.png'); bpy.ops.render.render(write_still=True)
cam.rotation_euler = (math.radians(90), 0, 0); cam.data.lens = 85
sc.render.resolution_x, sc.render.resolution_y = 520, 620
faces = sorted([o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith('Face')], key=lambda o: (o.matrix_world @ o.data.vertices[0].co).x)
for i, f in enumerate(faces):
    pts = [f.matrix_world @ v.co for v in f.data.vertices]
    cx = sum(p.x for p in pts) / len(pts); cz = max(p.z for p in pts)
    cam.location = (cx, -1.75, cz - 0.27)
    sc.render.filepath = out.replace('.png', f'_visage{i}.png'); bpy.ops.render.render(write_still=True)
print('RENDER_OK')
