"""Accessoires de rue, ciel, nuages, skyline lointaine, particules. Même règles : 3 tons, contour brun chaud."""
import random
import numpy as np
from lib import *
from buildings import text

def _fin(cv):
    outline(cv); return cv

def lamp(on):
    cv = Cv(16, 64)
    cv.rect(7, 16, 2, 40, 'grS'); cv.vl(7, 16, 40, 'gr')
    cv.rect(5, 56, 6, 8, 'grS'); cv.hl(5, 56, 6, 'gr'); cv.rect(4, 61, 8, 3, 'grS'); cv.hl(4, 61, 8, 'gr')
    cv.rect(5, 18, 6, 3, 'grS')
    cv.rect(3, 4, 10, 12, 'li' if on else 'gl'); cv.hl(3, 4, 10, 'liL' if on else 'waL'); cv.vl(3, 4, 12, 'liL' if on else 'waL')
    cv.rect(5, 6, 6, 8, 'liL' if on else 'blL')
    cv.vl(8, 4, 12, 'grS')
    cv.rect(2, 2, 12, 3, 'grS'); cv.hl(2, 2, 12, 'gr'); cv.rect(6, 0, 4, 2, 'grS')
    cv.rect(2, 16, 12, 2, 'grS')
    return _fin(cv)

def bench():
    cv = Cv(40, 22)
    cv.rect(2, 0, 36, 3, 'wo'); cv.hl(2, 0, 36, 'woL'); cv.hl(2, 2, 36, 'ha')
    cv.rect(2, 4, 36, 3, 'wo'); cv.hl(2, 4, 36, 'woL'); cv.hl(2, 6, 36, 'ha')
    cv.rect(0, 10, 40, 4, 'wo'); cv.hl(0, 10, 40, 'woL'); cv.hl(0, 13, 40, 'ha')
    for x in (3, 33):
        cv.rect(x, 14, 3, 8, 'blS'); cv.vl(x, 14, 8, 'bl'); cv.rect(x, 0, 3, 14, 'blS'); cv.vl(x, 0, 14, 'bl')
    return _fin(cv)

def planter():
    cv = Cv(20, 26)
    for i, (c, x, y) in enumerate([('co', 4, 4), ('coL', 9, 1), ('li', 14, 5), ('waL', 6, 8), ('co', 12, 9)]):
        cv.vl(x + 1, y + 2, 12 - y, 'grS'); cv.rect(x, y, 3, 3, c); cv.p(x + 1, y + 1, 'li')
        cv.p(x - 1, y + 6, 'gr'); cv.p(x + 3, y + 7, 'grL')
    cv.rect(2, 12, 16, 3, 'gr')
    pot = Cv(20, 26)
    for y in range(14, 26):
        inset = (y - 14) // 4
        pot.rect(2 + inset, y, 16 - inset * 2, 1, 'ro')
    cv.im.alpha_composite(pot.im)
    cv.rect(1, 13, 18, 3, 'roL'); cv.hl(1, 15, 18, 'roS')
    cv.rect(3, 19, 4, 5, 'roL'); cv.vl(16, 17, 8, 'roS')
    return _fin(cv)

def crates():
    cv = Cv(34, 26)
    cv.block(0, 12, 34, 14, 'wood', out=False)
    for y in (16, 21): cv.hl(1, y, 32, 'ha')
    for x in (6, 17, 28): cv.vl(x, 13, 12, 'ha')
    r = random.Random(5)
    for x in range(2, 31, 4):
        c = r.choice(['co', 'ro', 'li', 'grL', 'co'])
        cv.rect(x, 7 + r.randint(0, 2), 4, 4, c); cv.p(x, 7, 'liL'); cv.p(x + 3, 11, 'coS' if c != 'grL' else 'gr')
    return _fin(cv)

def bin_():
    cv = Cv(14, 20)
    cv.block(1, 4, 12, 16, 'grass', out=False); cv.block(0, 2, 14, 4, 'grass', out=False)
    for x in (4, 8): cv.vl(x, 8, 10, 'grS')
    cv.rect(5, 0, 4, 2, 'grS')
    return _fin(cv)

def cat(frame):
    cv = Cv(16, 14)
    paint(cv, ell_mask(16, 14, 7, 9, 5, 4.5), 'coral')
    paint(cv, ell_mask(16, 14, 6, 4.5, 3.6, 3.3), 'coral')
    for x in (4, 9): cv.p(x, 1, 'co'); cv.p(x, 2, 'co'); cv.p(x + 1, 2, 'co')
    cv.p(5, 4, 'O'); cv.p(8, 4, 'O') if frame == 0 else (cv.hl(4, 4, 2, 'coS'), cv.hl(8, 4, 2, 'coS'))
    cv.p(7, 5, 'coL' if frame == 0 else 'coS')
    for x in (6, 8, 10): cv.vl(x, 8, 2, 'coS')
    cv.hl(4, 12, 3, 'coL'); cv.hl(8, 12, 3, 'coL')
    ty = 6 if frame == 0 else 8   # queue : bat doucement
    for k in range(5): cv.p(11 + k // 2, ty + 3 - k if frame == 0 else ty + 1 + k // 2, 'co' if k < 4 else 'coS')
    cv.p(13, 12, 'co'); cv.p(14, 11, 'co')
    return _fin(cv)

def tree(blossom=False):
    cv = Cv(44, 60)
    cv.rect(19, 36, 6, 24, 'ha'); cv.vl(19, 36, 24, 'wo'); cv.vl(24, 36, 24, 'haS'); cv.rect(17, 55, 10, 5, 'ha'); cv.hl(17, 55, 10, 'wo')
    ramp = ('coS', 'co', 'coL') if blossom else 'grass'
    for (cx, cy, r) in [(22, 20, 14), (11, 28, 9), (33, 28, 9), (16, 12, 9), (29, 12, 9), (22, 33, 8)]:
        paint(cv, ell_mask(44, 60, cx, cy, r, r * .9), ramp, cx, cy, r, r * .9)
    rr = random.Random(2)
    for _ in range(40):
        x, y = rr.randrange(6, 38), rr.randrange(2, 38)
        if cv.get(x, y)[3]:
            cv.p(x, y, 'coL' if blossom else 'grL'); cv.p(x + 1, y + 1, 'coS' if blossom else 'grS')
    if blossom:
        for _ in range(10): cv.p(rr.randrange(6, 38), rr.randrange(4, 34), 'waL')
    return _fin(cv)

def bush_roses():
    cv = Cv(28, 18)
    for (cx, cy, r) in [(8, 11, 7), (19, 11, 8), (14, 7, 7)]:
        paint(cv, ell_mask(28, 18, cx, cy, r, r * .85), 'grass', cx, cy, r, r * .85)
    rr = random.Random(7)
    for _ in range(9):
        x, y = rr.randrange(3, 25), rr.randrange(2, 14)
        if cv.get(x, y)[3]: cv.p(x, y, 'co'); cv.p(x + 1, y, 'coL'); cv.p(x, y + 1, 'coS')
    return _fin(cv)

def board():
    cv = Cv(20, 28)
    cv.rect(2, 22, 2, 6, 'wo'); cv.rect(16, 22, 2, 6, 'wo'); cv.vl(2, 22, 6, 'woL')
    cv.rect(1, 2, 18, 22, 'wo'); cv.hl(1, 2, 18, 'woL'); cv.vl(1, 2, 22, 'woL'); cv.hl(1, 23, 18, 'ha')
    cv.rect(3, 4, 14, 18, 'blS'); cv.hl(3, 4, 14, 'bl')
    text(cv, 3, 7, 'PAIN', 'waL', 1)
    cv.hl(4, 15, 12, 'waL'); cv.hl(4, 18, 8, 'wa'); cv.p(14, 18, 'coL'); cv.p(15, 17, 'coL'); cv.p(13, 17, 'coL')
    return _fin(cv)

def fence():
    cv = Cv(32, 18)
    for x in (2, 14, 26):
        cv.rect(x, 2, 4, 16, 'wo'); cv.vl(x, 2, 16, 'woL'); cv.vl(x + 3, 2, 16, 'ha'); cv.hl(x, 1, 4, 'woL'); cv.p(x, 0, 'woL'); cv.p(x + 3, 0, 'wo')
    cv.rect(0, 5, 32, 3, 'wo'); cv.hl(0, 5, 32, 'woL'); cv.hl(0, 7, 32, 'ha')
    cv.rect(0, 11, 32, 3, 'wo'); cv.hl(0, 11, 32, 'woL'); cv.hl(0, 13, 32, 'ha')
    return _fin(cv)

def smoke(i):
    """Volute de fumée : 3 tailles croissantes, tons très doux (aucun contour : elle se fond dans le ciel)."""
    cv = Cv(18, 18)
    cr = 2.2 + i * 1.1
    paint(cv, ell_mask(18, 18, 9 + i, 11 - i, cr, cr * .85), ('stL', 'waL', 'waL'))
    paint(cv, ell_mask(18, 18, 8 + i, 8 - i, cr * .7, cr * .6), ('stL', 'waL', 'waL'))
    return cv

def leaf(i):
    cv = Cv(4, 4)
    cv.p(1, 1, 'grL'); cv.p(2, 1, 'gr'); cv.p(1, 2, 'gr'); cv.p(2, 2, 'grS')
    if i: cv.p(0, 0, 'coL'); cv.p(1, 0, 'co')
    return cv

PROPS = [  # nom, fabrique, ancre (bas-centre du sprite = pieds posés au sol)
 ('lampadaire_off', lambda: lamp(False)), ('lampadaire_on', lambda: lamp(True)), ('banc', bench), ('jardiniere', planter),
 ('cageots_fruits', crates), ('poubelle', bin_), ('chat_0', lambda: cat(0)), ('chat_1', lambda: cat(1)),
 ('arbre', lambda: tree(False)), ('cerisier', lambda: tree(True)), ('buisson_rosiers', bush_roses),
 ('ardoise_pain', board), ('cloture', fence), ('fumee_0', lambda: smoke(0)), ('fumee_1', lambda: smoke(1)), ('fumee_2', lambda: smoke(2)),
 ('feuille_0', lambda: leaf(0)), ('feuille_1', lambda: leaf(1)),
]

# ---------------------------------------------------------------------------- décor lointain
def gradient(W, H, stops):
    """Dégradé vertical tramé (Bayer 4x4) entre les couleurs de palette `stops` — aucun flou."""
    cv = Cv(W, H)
    n = len(stops) - 1
    for y in range(H):
        u = y / (H - 1) * n; i = min(int(u), n - 1); f = u - i
        for x in range(W):
            cv.p(x, y, stops[i + 1] if f > BAYER[y % 4, x % 4] else stops[i])
    return cv

def sky(kind):
    return gradient(480, 128, ['sky', 'gl', 'waL'] if kind == 'jour' else ['blL', 'coL', 'li'])

def clouds():
    cv = Cv(200, 40)
    for (ox, oy, w) in [(4, 14, 46), (70, 6, 60), (150, 16, 40)]:
        for (dx, dy, r) in [(0.25, 0.55, 8), (0.5, 0.35, 11), (0.78, 0.55, 8)]:
            m = ell_mask(200, 40, ox + w * dx, oy + 10 * dy + 6, r, r * .75)
            paint(cv, m, ('wa', 'waL', 'waL'))
        for x in range(ox + 4, ox + w - 4): cv.p(x, oy + 17, 'wa')
    return _fin(cv)

def skyline():
    cv = Cv(480, 80)
    r = random.Random(12)
    x = 0
    while x < 480:   # couche lointaine, bleutée (perspective atmosphérique)
        w, h = r.randint(18, 40), r.randint(16, 40)
        cv.rect(x, 80 - h, w, h, 'blL'); cv.hl(x, 80 - h, w, 'blL')
        x += w + r.randint(0, 6)
    x = 6
    while x < 470:   # couche proche, froide, fenêtres qui s'allument
        w, h = r.randint(14, 30), r.randint(10, 28)
        cv.rect(x, 80 - h, w, h, 'stS')
        for wx in range(x + 3, x + w - 3, 5):
            for wy in range(80 - h + 3, 76, 6):
                if r.random() < .3: cv.p(wx, wy, 'li')
        x += w + r.randint(1, 5)
    # usine Taret : cheminées rayées (le passé industriel du quartier)
    for cx in (342, 358):
        cv.rect(cx, 8, 6, 72, 'stS'); cv.vl(cx, 8, 72, 'st')
        for y in (10, 16): cv.hl(cx, y, 6, 'roS')
    cv.rect(330, 52, 50, 28, 'stS'); cv.hl(330, 52, 50, 'st')
    for wx in range(334, 376, 8): cv.rect(wx, 60, 4, 6, 'blS')
    return cv

def hedge_row(W=480, H=34):
    from tiles import hedge
    cv = Cv(W, H)
    for x in range(0, W, 32):
        cv.paste(hedge(31 + (x // 32) % 2), x, 0)
    return cv
