"""Planche d'ensemble (styleboard) : tout le kit sur une image, pour valider la DA d'un coup d'œil."""
from PIL import Image
from lib import *
import tiles as TL, buildings as BD, props as PR, chars as CH

def up(im, k): return im.resize((im.width * k, im.height * k), Image.NEAREST)

def build(path):
    Wd = 1560
    bd = Cv(Wd, 1260, C['haS'])
    bd.rect(0, 0, Wd, 6, 'wo')
    def title(x, y, s): BD.text(bd, x, y, s, 'woL', 3); bd.hl(x, y + 20, 360, 'ha')
    y = 24
    title(24, y, 'PALETTE'); y += 34
    for i, k in enumerate(P):
        bd.rect(24 + i * 46, y, 44, 44, k); bd.box(24 + i * 46, y, 44, 44, 'O') if False else None
    y += 60
    title(24, y, 'TUILES'); title(900, y, 'PERSOS'); y += 34
    at, _ = TL.atlas(); bd.im.alpha_composite(up(at.im, 3), (24, y))
    px = 900
    for n in CH.SPECS:
        sh = CH.sheet(n); bd.im.alpha_composite(up(sh.im, 2), (px, y + (0 if n != 'adulte' else 0))) if False else None
    cx, cy = 900, y
    for n in CH.SPECS:
        sh = CH.sheet(n); bd.im.alpha_composite(up(sh.im.crop((0, 0, 96, 72)), 2), (cx, cy)); cx += 200
        if cx > 1450: cx, cy = 900, cy + 160
    y += 3 * 96 + 36
    title(24, y, 'FACADES'); y += 34
    x = 24
    for lit in (False, True):
        for n, fn in BD.BUILDINGS.items():
            im = fn(lit); bd.im.alpha_composite(im.im, (x, y)); x += im.w + 12
        x += 16
    y += 140
    title(24, y, 'PROPS'); y += 34
    x = 24
    for n, fn in PR.PROPS:
        if n.startswith(('fumee', 'feuille', 'lampadaire_off', 'chat_1')): continue
        im = fn(); k = 2 if im.h <= 40 else 1
        bd.im.alpha_composite(up(im.im, k), (x, y + (60 * 2 - im.h * k if False else 0))); x += im.w * k + 14
    y += 80
    out = bd.im.crop((0, 0, Wd, y)); out.save(path)
