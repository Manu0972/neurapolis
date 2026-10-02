#!/usr/bin/env python3
"""Régénère tout le kit : `python3 source/build_kit.py` (Pillow + numpy). Sources = ce code ; les PNG sont éditables à la main."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from lib import *
import tiles as TL, buildings as BD, props as PR, chars as CH, scene as SC

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
def out(*p): return os.path.join(ROOT, *p)
def wj(path, obj): json.dump(obj, open(path, 'w'), indent=1, ensure_ascii=False)

# ---------- palette ----------
names = list(P.keys())
wj(out('palette', 'palette.json'), {
  'core': {k: P[k] for k in names}, 'count': len(names),
  'ramps_ombre_base_lumiere': {k: [P[c] for c in v] for k, v in RAMPS.items()},
  'swaps_peau_hors_core': SKIN_SWAPS,
  'regle': 'ombres froides (bleu/violet), lumières chaudes (ambre), contour brun chaud #2a1a14, jamais de noir pur',
})
with open(out('palette', 'neurapolis-core.gpl'), 'w') as f:
    f.write('GIMP Palette\nName: NEURAPOLIS core 32\nColumns: 8\n#\n')
    for k in names: r, g, b = rgb(P[k]); f.write(f'{r:3d} {g:3d} {b:3d} {k}\n')
sw = Cv(8 * 24, 4 * 24)
for i, k in enumerate(names): sw.rect((i % 8) * 24, (i // 8) * 24, 24, 24, k)
sw.save(out('palette', 'palette-swatch.png'))

# ---------- tuiles ----------
at, meta = TL.atlas(); at.save(out('tiles', 'tiles.png'))
wj(out('tiles', 'tiles.json'), {'tile': 32, 'colonnes': TL.COLS, 'tuiles': meta,
   'usage': {'sol':'pave_a..e (aléatoire stable par hash de tuile)', 'herbe':'herbe_a..d', 'terre':'terre_a/b', 'haie':'haie_a/b',
             'plancher':'plancher_a/b', 'carrelage':'damier', 'transition':'bord_herbe_* à poser PAR-DESSUS le pavé voisin'}})

# ---------- personnages ----------
chjson = {'cellule': [CH.W, CH.H], 'ancre': 'bas-centre (pieds) : (8,23)', 'colonnes': CH.FRAMES, 'lignes': CH.DIRS,
          'droite': 'miroir horizontal de la ligne left', 'cadence': 'idle ~1.6 Hz (2 frames) ; marche 6 Hz (walk0..walk3 en boucle)',
          'feuilles': {}}
for n in CH.SPECS:
    sh = CH.sheet(n); sh.save(out('characters', f'{n}.png'))
    chjson['feuilles'][n] = {'fichier': f'{n}.png', 'taille': [sh.w, sh.h]}
wj(out('characters', 'characters.json'), chjson)

# ---------- bâtiments ----------
bj = {}
for n, fn in BD.BUILDINGS.items():
    for lit in (False, True):
        im = fn(lit); tag = 'allume' if lit else 'jour'
        im.save(out('buildings', f'{n}_{tag}.png'))
        bj[f'{n}_{tag}'] = {'w': im.w, 'h': im.h, 'ancre': 'bas-gauche : le bas du sprite pose sur la ligne de sol'}
bj['_notes'] = {'epicerie': 'porte x=126..152 ; vitrine x=12..116,y=66..110 ; enseigne ÉPICERIE BERTIN',
                'maison': 'cheminée x=76..90 (fumée) ; rosiers grimpants', 'immeuble': 'balcons, linge, entrée n°12'}
wj(out('buildings', 'buildings.json'), bj)

# ---------- accessoires ----------
pj = {}
for n, fn in PR.PROPS:
    im = fn(); im.save(out('props', f'{n}.png')); pj[n] = {'w': im.w, 'h': im.h, 'ancre': 'bas-centre'}
wj(out('props', 'props.json'), pj)

# ---------- décor lointain ----------
PR.sky('jour').save(out('backdrop', 'ciel_jour_480x128.png')); PR.sky('soir').save(out('backdrop', 'ciel_soir_480x128.png'))
PR.clouds().save(out('backdrop', 'nuages_200x40.png')); PR.skyline().save(out('backdrop', 'skyline_cite_480x80.png'))
wj(out('backdrop', 'backdrop.json'), {'parallaxe_conseillee': {'ciel': 0.0, 'nuages': 0.05, 'skyline': 0.15, 'haie': 0.4},
   'note': 'les nuages dérivent de ~2 px/s ; la skyline contient la cheminée de l’usine Taret'})

# ---------- lumière ----------
SC.export_light(out('light'))
wj(out('light', 'grading.json'), {'heures': {k: {kk: (list(vv) if isinstance(vv, tuple) else vv) for kk, vv in v.items()} for k, v in SC.GRADE.items()},
   'couleur_ombre_portee': list(SC.SHADOW_COL), 'couleur_fenetre': list(SC.WIN_COL), 'couleur_lampe': list(SC.LAMP_COL),
   'ordre': 'scène -> multiplication mul*k -> halos en screen/lighter -> vignette',
   'note': 'les surcouches PNG de ce dossier sont HORS palette core (alpha et teinte chaude) ; elles sont tramées en paliers nets'})

# ---------- aperçus ----------
for t in ('jour', 'soir', 'nuit'):
    im = SC.compose(t); im.save(out('preview', f'scene_{t}_480x270.png'))
    im.resize((960, 540), Image.NEAREST).save(out('preview', f'scene_{t}_x2.png'))
man = {'version': 'claude-assets-v1', 'tuile': 32, 'palette': 'palette/palette.json',
       'tuiles': {'image': 'tiles/tiles.png', 'meta': 'tiles/tiles.json'},
       'personnages': {n: {'image': f'characters/{n}.png', 'cellule': [CH.W, CH.H]} for n in CH.SPECS},
       'batiments': {k: {'image': f'buildings/{k}.png', 'w': v['w'], 'h': v['h']} for k, v in bj.items() if not k.startswith('_')},
       'props': {k: {'image': f'props/{k}.png', **v} for k, v in pj.items()},
       'decor': ['backdrop/ciel_jour_480x128.png', 'backdrop/ciel_soir_480x128.png', 'backdrop/nuages_200x40.png', 'backdrop/skyline_cite_480x80.png'],
       'lumiere': ['light/halo_chaud_96.png', 'light/flaque_sol_128x48.png', 'light/halo_fenetre_64.png', 'light/vignette_480x270.png'],
       'grading': 'light/grading.json'}
wj(out('manifest.json'), man)
import styleboard; styleboard.build(out('preview', 'styleboard.png'))
print('kit généré dans', ROOT)
