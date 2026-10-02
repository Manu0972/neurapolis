#!/usr/bin/env python3
"""Vérifie le kit : ouverture des PNG, dimensions annoncées, transparence, appartenance à la palette core 32."""
import json, os, sys, glob
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib import P, rgb
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
core = {rgb(v) for v in P.values()}
skins = {rgb(c) for s in __import__('lib').SKIN_SWAPS.values() for c in s.values()}
ok = True; lines = []
def check(path, strict=True, size=None):
    global ok
    im = Image.open(path); im.load(); rel = os.path.relpath(path, ROOT)
    a = im.convert('RGBA'); px = a.getdata()
    cols = {p[:3] for p in px if p[3] > 0}; semi = sum(1 for p in px if 0 < p[3] < 255)
    bad = cols - core - (skins if strict == 'skin' else set())
    msg = f'{rel:52s} {im.size[0]:4d}x{im.size[1]:<4d} couleurs={len(cols):2d}'
    if size and tuple(im.size) != tuple(size): msg += f'  ❌ taille attendue {size}'; ok = False
    if strict and bad: msg += f'  ❌ hors palette: {len(bad)}'; ok = False
    if strict and semi: msg += f'  ❌ alpha partiel: {semi}px'; ok = False
    lines.append(msg)
for d in ('tiles', 'characters', 'buildings', 'props', 'backdrop'):
    for f in sorted(glob.glob(os.path.join(ROOT, d, '*.png'))):
        check(f, strict=True)
for f in sorted(glob.glob(os.path.join(ROOT, 'light', '*.png'))): check(f, strict=False)
for f in sorted(glob.glob(os.path.join(ROOT, 'preview', '*.png'))): check(f, strict=False)
for f in glob.glob(os.path.join(ROOT, '*', '*.json')): json.load(open(f))
lines.append(f'\nPalette core : {len(core)} couleurs. JSON : tous valides.')
lines.append('RÉSULTAT : ' + ('OK' if ok else 'ÉCHEC'))
txt = '\n'.join(lines); print(txt); open(os.path.join(ROOT, 'source', 'verify_report.txt'), 'w').write(txt + '\n')
sys.exit(0 if ok else 1)
