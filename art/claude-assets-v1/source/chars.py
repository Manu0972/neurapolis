"""Personnages chibi 16x24 — cellule bas-centrée, 3 directions (bas, haut, gauche ; droite = miroir).
Colonnes : idle0, idle1, walk0..walk3. Tout est dessiné par masques + rampes 3 tons + contour brun auto."""
import numpy as np
from lib import *

W, H = 16, 24
FRAMES = ['idle0', 'idle1', 'walk0', 'walk1', 'walk2', 'walk3']
DIRS = ['down', 'up', 'left']

SPECS = {
 # jeune joueur (12 ans) : sweat moutarde à capuche, cheveux bruns en bataille
 'joueur': dict(kind='kid', hair='hairB', style='short', top='mustard', hood=True, pants='blue', apron=False, bun=False),
 # camarade (12 ans) : pull sauge, queue-de-cheval sombre, chouchou corail
 'camarade': dict(kind='kid', hair='hairD', style='pony', top='grass', hood=False, pants='hairB', apron=False, bun=False),
 # adulte du quartier (Mme Bertin, 58 ans) : blouse corail, tablier crème, chignon argenté
 'adulte': dict(kind='adult', hair='hairG', style='bun', top='coral', hood=False, pants='blue', apron=True, bun=True),
}

def pose(frame):
    """-> (dyU décalage du haut du corps, jambe gauche bas, jambe droite bas, bras g, bras d)"""
    return {
        'idle0': (0, 23, 23, 0, 0),
        'idle1': (1, 23, 23, 0, 0),
        'walk0': (0, 23, 22, -1, 1),
        'walk1': (-1, 23, 23, 0, 0),
        'walk2': (0, 22, 23, 1, -1),
        'walk3': (-1, 23, 23, 0, 0),
    }[frame]

def draw(spec, d, frame):
    cv = Cv(W, H)
    kid = spec['kind'] == 'kid'
    dyU, lb, rb, al, ar = pose(frame)
    hcx, hcy, hrx, hry = (8, 7.2, 6, 5.1) if kid else (8, 6.8, 5.2, 5.0)
    ty, th = (12, 6) if kid else (11, 8)             # torse
    hcy += dyU; ty += dyU
    side = d == 'left'
    # ---- jambes (dessinées sous le torse) ----
    if not side:
        legs = [(5, lb), (8, rb)]
    else:
        spread = {'walk0': 2, 'walk2': -2}.get(frame, 0)
        legs = [(5 - spread // 2 - (1 if spread else 0), 23), (8 + spread // 2 + (1 if spread else 0), 23 if spread else 22 if frame in ('walk1', 'walk3') else 23)]
    skirt = spec['apron']
    for lx, bot in legs:
        top = 16
        m = rect_mask(W, H, lx, top, 3, bot - top + 1)
        paint(cv, m, spec['pants'])
        cv.rect(lx, bot - 1, 3, 2, 'O' if d != 'up' else 'haS')   # chaussures
        cv.p(lx, bot - 1, 'ha')                                      # reflet de chaussure
    if side:  # pointe de chaussure vers l'avant (gauche)
        lx, bot = legs[0]; cv.p(lx - 1, bot, 'O')
    # ---- cheveux de derrière (queue / chignon) ----
    hair = spec['hair']
    if spec['style'] == 'pony' and d in ('up', 'left'):
        px = 7 if d == 'up' else 12
        paint(cv, rect_mask(W, H, px, int(hcy + 1), 2, 7), hair)
        cv.p(px, int(hcy + 1), 'coS'); cv.p(px + 1, int(hcy + 1), 'coS'); cv.p(px, int(hcy + 2), 'co')
    # ---- torse ----
    tw = 8 if not side else 6
    tx = 4 if not side else 5
    tm = rect_mask(W, H, tx, ty, tw, th)
    for (cx_, cy_) in [(tx, ty), (tx + tw - 1, ty), (tx, ty + th - 1), (tx + tw - 1, ty + th - 1)]:
        tm[cy_, cx_] = False if kid else tm[cy_, cx_]
    paint(cv, tm, spec['top'])
    if spec['hood'] and d != 'up':      # col de capuche + cordons
        cv.hl(6, ty, 4, 'li'); cv.p(7, ty + 1, 'liL'); cv.p(8, ty + 1, 'liL')
        cv.p(7, ty + 2, 'liL'); cv.p(9, ty + 2, 'liL')
    if spec['hood'] and d == 'up':      # capuche dans le dos
        paint(cv, rect_mask(W, H, 5, ty, 6, 3), spec['top'])
    if spec['apron'] and d != 'up':
        am = rect_mask(W, H, 5 if not side else 6, ty + 2, 6 if not side else 4, 7)
        paint(cv, am, 'wall'); cv.hl(5 if not side else 6, ty + 2, 6 if not side else 4, 'waL')
        if not side:
            cv.p(6, ty + 4, 'coL'); cv.p(7, ty + 4, 'co')   # petite poche brodée
    # ---- bras ----
    if not side:
        for ax, adj in ((2, al), (12, ar)):
            m = rect_mask(W, H, ax, ty + 1 + adj, 2, 5 if kid else 6)
            paint(cv, m, spec['top'])
            inner = ax + 1 if ax < 8 else ax
            cv.vl(inner, ty + 1 + adj, (5 if kid else 6) - 1, RAMPS[spec['top']][0])
            cv.p(ax, ty + (5 if kid else 6) + adj, 'sk'); cv.p(ax + 1, ty + (5 if kid else 6) + adj, 'skS')
    else:
        sw = {'walk0': -1, 'walk2': 1}.get(frame, 0)
        m = rect_mask(W, H, 7 + sw, ty + 1, 3, 5 if kid else 6)
        paint(cv, m, spec['top']); cv.p(8 + sw, ty + (5 if kid else 6), 'sk')
    # ---- tête ----
    if side: hcx = 7.5
    hm = ell_mask(W, H, hcx, hcy, hrx, hry)
    paint(cv, hm, 'skin', hcx, hcy, hrx, hry)
    if d == 'down':
        # visage : yeux 1x2, joues, bouche
        ey = int(hcy + 0.8)
        for ex in (6, 10 if kid else 9):
            if not kid: ex = 6 if ex == 6 else 10
            cv.p(ex, ey, 'O'); cv.p(ex, ey + 1, 'O')
        cv.p(ex - 4, ey + 1, None)
        cv.p(5, ey + 2, 'coL'); cv.p(11, ey + 2, 'coL')
        cv.p(8, ey + 3, 'coS'); cv.p(7, ey + 3, 'coS') if kid else None
        if spec['apron']:   # lunettes rondes
            for gx in (5, 9): cv.hl(gx, ey - 1, 3, 'wo'); cv.p(gx, ey, 'wo'); cv.p(gx + 2, ey, 'wo'); cv.hl(gx, ey + 1, 3, 'wo')
            cv.hl(8, ey, 1, 'wo')
    elif d == 'left':
        ey = int(hcy + 0.8)
        cv.p(4, ey, 'O'); cv.p(4, ey + 1, 'O'); cv.p(3, ey + 2, 'coL'); cv.p(2, ey + 3, 'coS')
        cv.p(1, ey + 1, 'sk'); cv.p(1, ey + 2, 'skS')       # nez
        cv.p(9, ey + 1, 'skS')                              # oreille
    # ---- cheveux ----
    top = int(hcy - hry)
    if d == 'down':
        hair_m = ell_mask(W, H, hcx, hcy - 0.6, hrx + 0.3, hry + 0.2)
        yy, xx = np.mgrid[0:H, 0:W]
        fring = 7 + dyU + ((xx % 3 == 0).astype(int) if spec['style'] != 'bun' else (xx % 5 == 0).astype(int))
        keep = (yy < fring) | ((np.abs(xx + 0.5 - hcx) >= hrx - 0.8) & (yy < hcy + 2.5))
        hair_m &= keep
        if not kid:  # frange sur le côté, chignon : cheveux plus plaqués
            hair_m &= (yy < fring - 1) | ((np.abs(xx + 0.5 - hcx) >= hrx - 1.2) & (yy < hcy + 1.5))
        paint(cv, hair_m, hair, hcx, hcy - 0.6, hrx, hry)
        if spec['style'] == 'short':           # mèche rebelle
            cv.p(5, top - 1 if top > 0 else 0, hair and RAMPS[hair][1]); cv.p(10, top, RAMPS[hair][2])
        if spec['style'] == 'pony':            # queue de cheval visible côté droit + chouchou
            paint(cv, rect_mask(W, H, 13, int(hcy), 2, 5), hair); cv.p(13, int(hcy), 'coS'); cv.p(14, int(hcy), 'coS')
    elif d == 'up':
        hair_m = ell_mask(W, H, hcx, hcy + 0.4, hrx + 0.3, hry + 0.5)
        paint(cv, hair_m, hair, hcx, hcy + 0.4, hrx, hry)
    else:  # left
        hair_m = ell_mask(W, H, hcx + 0.5, hcy - 0.3, hrx + 0.2, hry + 0.3)
        yy, xx = np.mgrid[0:H, 0:W]
        hair_m &= (xx >= 7) | (yy < hcy - 1.5)
        paint(cv, hair_m, hair, hcx + 0.5, hcy - 0.3, hrx, hry)
    if spec['bun']:
        bx = 8 if d != 'left' else 9
        paint(cv, ell_mask(W, H, bx, hcy - hry - 0.3, 2.6, 2.2), hair)
    outline(cv)
    return cv

def sheet(name):
    spec = SPECS[name]
    sh = Cv(W * len(FRAMES), H * len(DIRS))
    for r, d in enumerate(DIRS):
        for c, f in enumerate(FRAMES):
            sh.paste(draw(spec, d, f), c * W, r * H)
    return sh
