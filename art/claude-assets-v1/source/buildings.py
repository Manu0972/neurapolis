"""Façades 2.5D de la Cité des Roses. Chaque bâtiment : variante 'jour' (vitres reflétantes) et 'lit' (fenêtres ambrées)."""
import random
from lib import *

FONT = {  # police 3x5 maison
 'A': '010101111101101', 'B': '110101110101110', 'C': '011100100100011', 'D': '110101101101110',
 'E': '111100110100111', 'I': '111010010010111', 'N': '110101101101101', 'O': '010101101101010',
 'P': '110101110100100', 'R': '110101110101101', 'T': '111010010010010', 'S': '011100010001110',
 'L': '100100100100111', 'U': '101101101101111', 'M': '101111111101101', 'F': '111100110100100',
 '1': '010110010010111', '2': '110001010100111', ' ': '000000000000000',
}

def text(cv, x, y, s, col, scale=1):
    """Écrit `s` en police 3x5 (x4 de pas). Retourne la largeur écrite."""
    cx = x
    for ch in s:
        g = FONT['E'] if ch == '\u00c9' else FONT.get(ch, FONT[' '])
        for i, b in enumerate(g):
            if b == '1': cv.rect(cx + (i % 3) * scale, y + (i // 3) * scale, scale, scale, col)
        if ch == '\u00c9': cv.rect(cx + 2 * scale, y - 2 * scale, scale, scale, col)
        cx += 4 * scale
    return cx - x - scale

def wall_fill(cv, x, y, w, h, ramp='wall', seed=0, noise=.06):
    S, B, L = RAMPS[ramp]
    cv.rect(x, y, w, h, B)
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            n = hash01(xx, yy, seed)
            if n < noise: cv.p(xx, yy, L)
            elif n > 1 - noise: cv.p(xx, yy, S)
    cv.vl(x, y, h, L); cv.vl(x + w - 1, y, h, S)

def roof(cv, x, y, w, h):
    cv.rect(x, y, w, h, 'ro')
    for r in range(h // 6 + 1):
        ry = y + r * 6; off = 4 if r % 2 else 0
        if ry < y + h: cv.hl(x, ry, w, 'roL')
        for xx in range(x + off, x + w, 8):
            for k in range(1, 6):
                if ry + k < y + h: cv.p(xx, ry + k, 'roS')
        if ry + 5 < y + h: cv.hl(x, ry + 5, w, 'roS')
    cv.hl(x, y, w, 'roL'); cv.hl(x, y + h - 2, w, 'roS'); cv.hl(x, y + h - 1, w, 'O'); cv.hl(x, y - 1, w, 'O')
    cv.vl(x, y, h, 'O'); cv.vl(x + w - 1, y, h, 'O')

def eave_shadow(cv, x, y, w):
    cv.hl(x, y, w, 'waS')
    for i in range(0, w, 2): cv.p(x + i, y + 1, 'waS')

def window(cv, x, y, w, h, lit=False, shutters=False, box=False, curtain=True):
    cv.rect(x - 1, y - 1, w + 2, h + 2, 'wo'); cv.hl(x - 1, y - 1, w + 2, 'woL'); cv.hl(x - 1, y + h, w + 2, 'ha')
    cv.box(x - 1, y - 1, w + 2, h + 2)
    if lit:
        cv.rect(x, y, w, h, 'li'); cv.rect(x, y, w, max(2, h // 3), 'liL')
        if curtain:
            cv.rect(x, y, 2, h, 'coL'); cv.rect(x + w - 2, y, 2, h, 'coL'); cv.vl(x + 1, y, h, 'co'); cv.vl(x + w - 1, y, h, 'co')
    else:
        cv.rect(x, y, w, h, 'gl'); cv.rect(x, y + h // 2, w, h - h // 2, 'blL')
        for i in range(0, min(w, h) - 2, 4): cv.p(x + 1 + i, y + 1 + i, 'waL'); cv.p(x + 2 + i, y + 1 + i, 'waL')
        for xx in range(x, x + w):
            for yy in range(y, y + h // 2):
                if (xx + yy) % 2 == 0: cv.p(xx, yy, 'gl')
    if w >= 10: cv.vl(x + w // 2, y, h, 'wo')
    cv.hl(x, y + h // 2, w, 'wo')
    cv.hl(x - 2, y + h + 1, w + 4, 'stL'); cv.hl(x - 2, y + h + 2, w + 4, 'stS')
    if shutters:
        cv.block(x - 5, y - 1, 3, h + 2, 'grass'); cv.block(x + w + 2, y - 1, 3, h + 2, 'grass')
        for k in range(2, h, 3): cv.hl(x - 5, y + k, 3, 'grS'); cv.hl(x + w + 2, y + k, 3, 'grS')
    if box:
        cv.block(x - 2, y + h + 3, w + 4, 4, 'wood')
        for i in range(0, w + 2, 3):
            cv.p(x - 1 + i, y + h + 1, 'gr'); cv.p(x - 1 + i, y + h, ['co', 'coL', 'li'][(i // 3) % 3]); cv.p(x + i, y + h + 1, 'grL')

def awning(cv, x, y, w, h=14, c1='ro', c2='waL'):
    t = Cv(w + 2, h + 2)
    slope = h - 6
    for i in range(w):
        a = c1 if (i // 8) % 2 == 0 else c2
        S, B, L = (RAMPS['roof'] if a == 'ro' else RAMPS['wall'])
        for k in range(slope):
            t.p(i + 1, k + 1, L if k == 0 else (B if k < slope - 1 else S))
        d = [3, 4, 5, 5, 5, 5, 4, 3][i % 8]
        for k in range(6):
            if k < d: t.p(i + 1, slope + 1 + k, S if k == d - 1 else B)
    outline(t); cv.paste(t, x - 1, y - 1)
    for i in range(0, w, 2):   # ombre portée de la toile sur le mur
        cv.p(x + i, y + h + 1, 'waS')

def vines(cv, pts, seed=0):
    r = random.Random(seed)
    for (x, y) in pts:
        for _ in range(7):
            vx, vy = x + r.randint(-3, 3), y + r.randint(-3, 3)
            cv.p(vx, vy, r.choice(['gr', 'grS', 'grL', 'gr'])); cv.p(vx + 1, vy, 'grS')
        if r.random() < .75:
            vx, vy = x + r.randint(-3, 3), y + r.randint(-3, 3)
            cv.p(vx, vy, 'coL'); cv.p(vx + 1, vy, 'co'); cv.p(vx, vy + 1, 'coS')

def step(cv, x, y, w):
    cv.block(x, y, w, 5, 'stone')
    for i in range(8, w - 2, 12): cv.vl(x + i, y + 1, 3, 'stS')

def finish(cv):
    return cv

# ------------------------------------------------------------------------------------
def epicerie(lit):
    W, H = 160, 128
    cv = Cv(W, H)
    wall_fill(cv, 0, 22, W, 98, 'wall', 5)
    roof(cv, 0, 2, W, 20)
    eave_shadow(cv, 1, 23, W - 2)
    # plinthe de pierre
    cv.rect(0, 118, W, 10, 'st'); cv.hl(0, 118, W, 'stL'); cv.hl(0, 127, W, 'stS')
    for i in range(10, W, 18): cv.vl(i, 119, 8, 'stS')
    cv.hl(0, 117, W, 'O')
    # enseigne
    cv.rect(10, 27, 140, 17, 'grS'); cv.rect(12, 29, 136, 13, 'gr'); cv.hl(12, 29, 136, 'grL')
    cv.rect(13, 30, 134, 11, 'grS')
    cv.box(10, 27, 140, 17); cv.block(10, 26, 2, 19, 'wood', out=False); cv.block(148, 26, 2, 19, 'wood', out=False)
    label = 'ÉPICERIE BERTIN'
    tw = len(label) * 8 - 2
    text(cv, 12 + (136 - tw) // 2, 32, label, 'waL', scale=2)
    # auvent rayé
    awning(cv, 6, 48, 116, 15)
    # vitrine
    vx, vy, vw, vh = 12, 66, 104, 44
    cv.rect(vx - 2, vy - 2, vw + 4, vh + 4, 'wo'); cv.box(vx - 2, vy - 2, vw + 4, vh + 4)
    cv.hl(vx - 2, vy - 2, vw + 4, 'woL')
    cv.rect(vx, vy, vw, vh, 'li' if lit else 'gl')
    if lit:
        cv.rect(vx, vy, vw, 10, 'liL'); cv.rect(vx, vy + 10, vw, 6, 'li')
    r = random.Random(9)
    cols = ['co', 'gr', 'bl', 'roL', 'wa', 'coL', 'grL', 'wo']
    for sy in (vy + 20, vy + 34):
        cv.rect(vx, sy, vw, 2, 'wo'); cv.hl(vx, sy + 2, vw, 'ha')
        x = vx + 2
        while x < vx + vw - 6:
            iw, ih = r.randint(3, 6), r.randint(4, 9)
            c = r.choice(cols)
            cv.rect(x, sy - ih, iw, ih, 'haS' if not lit else 'ha'); cv.rect(x + 1, sy - ih + 1, iw - 1, ih - 1, c)
            cv.p(x + 1, sy - ih + 1, 'liL' if lit else 'waL')
            x += iw + r.randint(1, 3)
    if not lit:   # voile de reflet : damier gris-bleu sur la moitié haute + éclat diagonal
        for xx in range(vx, vx + vw):
            for yy in range(vy, vy + vh):
                if (xx + yy) % 2 == 0 and yy < vy + 30: cv.p(xx, yy, 'gl')
        for i in range(0, 24): cv.p(vx + 18 + i, vy + 26 - i, 'waL'); cv.p(vx + 19 + i, vy + 26 - i, 'waL')
        for i in range(0, 14): cv.p(vx + 54 + i, vy + 20 - i, 'waL')
    for mx in (vx + 34, vx + 69): cv.rect(mx, vy, 2, vh, 'wo'); cv.vl(mx, vy, vh, 'woL')
    # soubassement bois sous la vitrine
    cv.block(vx - 2, vy + vh + 2, vw + 4, 6, 'wood')
    for i in range(6, vw, 12): cv.vl(vx + i, vy + vh + 3, 4, 'ha')
    # porte
    dx, dy, dw, dh = 126, 62, 26, 55
    cv.rect(dx - 2, dy - 2, dw + 4, dh + 2, 'wo'); cv.box(dx - 2, dy - 2, dw + 4, dh + 2)
    cv.rect(dx, dy, dw, dh, 'gr'); cv.hl(dx, dy, dw, 'grL'); cv.vl(dx, dy, dh, 'grL'); cv.vl(dx + dw - 1, dy, dh, 'grS')
    cv.rect(dx + 3, dy + 4, dw - 6, 26, 'li' if lit else 'gl'); cv.box(dx + 3, dy + 4, dw - 6, 26, 'grS')
    if lit: cv.rect(dx + 3, dy + 4, dw - 6, 8, 'liL')
    else:
        for i in range(0, 14): cv.p(dx + 6 + i, dy + 24 - i, 'waL')
    cv.hl(dx + 3, dy + 17, dw - 6, 'wo')
    cv.block(dx + 3, dy + 33, dw - 6, 18, 'grass', out=False); cv.box(dx + 3, dy + 33, dw - 6, 18, 'grS')
    cv.p(dx + dw - 6, dy + 30, 'li'); cv.p(dx + dw - 6, dy + 31, 'woL')
    step(cv, 122, 117, 34)
    # lanterne murale + descente de gouttière
    cv.rect(119, 70, 3, 5, 'li' if lit else 'gl'); cv.box(119, 70, 3, 5)
    cv.rect(155, 24, 3, 94, 'st'); cv.vl(155, 24, 94, 'stL'); cv.vl(157, 24, 94, 'stS')
    return cv

def maison(lit):
    W, H = 112, 128
    cv = Cv(W, H)
    wall_fill(cv, 0, 40, W, 80, 'wall', 11)
    cv.rect(76, 0, 14, 20, 'st'); cv.block(74, 0, 18, 4, 'stone'); cv.vl(77, 4, 16, 'stL'); cv.vl(88, 4, 16, 'stS'); cv.box(76, 4, 14, 16)
    roof(cv, 0, 14, W, 28)
    eave_shadow(cv, 1, 43, W - 2)
    cv.rect(0, 118, W, 10, 'st'); cv.hl(0, 118, W, 'stL'); cv.hl(0, 127, W, 'stS'); cv.hl(0, 117, W, 'O')
    for i in range(8, W, 18): cv.vl(i, 119, 8, 'stS')
    window(cv, 16, 54, 16, 22, lit=lit, shutters=True, box=True)
    window(cv, 66, 54, 16, 22, lit=False if not lit else True, shutters=True, box=True)
    window(cv, 62, 86, 24, 22, lit=lit, box=True)
    # porte en bois, imposte
    cv.rect(13, 82, 22, 36, 'wo'); cv.box(13, 82, 22, 36); cv.hl(13, 82, 22, 'woL'); cv.vl(13, 82, 36, 'woL'); cv.vl(34, 82, 36, 'ha')
    cv.rect(17, 86, 14, 10, 'li' if lit else 'gl'); cv.box(17, 86, 14, 10, 'ha')
    cv.block(17, 100, 6, 14, 'wood', out=False); cv.block(25, 100, 6, 14, 'wood', out=False)
    cv.p(31, 104, 'li'); cv.p(31, 105, 'woL')
    step(cv, 10, 117, 28)
    # rosiers grimpants : la signature de la Cité des Roses
    vines(cv, [(6, 112), (5, 104), (6, 96), (8, 88), (6, 80), (9, 72), (10, 64), (12, 56), (36, 112), (38, 104), (37, 96)], 4)
    vines(cv, [(100, 108), (102, 100), (101, 92)], 8)
    return cv

def immeuble(lit):
    W, H = 112, 128
    cv = Cv(W, H)
    wall_fill(cv, 0, 10, W, 110, 'stone', 21, .09)
    cv.block(0, 2, W, 10, 'stone'); cv.hl(0, 11, W, 'stS')
    for i in range(0, W, 8): cv.p(i + 3, 5, 'stS')
    cv.rect(0, 118, W, 10, 'stS'); cv.hl(0, 118, W, 'st'); cv.hl(0, 117, W, 'O')
    lit_pattern = [[1, 0, 1], [0, 1, 1], [1, 0, 0]]
    for ri, wy in enumerate((20, 52, 84)):
        for ci, wx in enumerate((12, 46, 80)):
            window(cv, wx, wy, 20, 22, lit=bool(lit and lit_pattern[ri][ci]), curtain=(ri + ci) % 2 == 0)
        if ri == 1:   # balcons : dalle claire, garde-corps, plantes
            for wx in (12, 46, 80):
                cv.block(wx - 3, wy + 25, 26, 4, 'stone')
                for i in range(0, 26, 4): cv.vl(wx - 2 + i, wy + 20, 5, 'stS')
                cv.hl(wx - 3, wy + 19, 26, 'stL')
                if wx != 46:
                    cv.rect(wx + 2, wy + 15, 5, 4, 'ro'); cv.p(wx + 3, wy + 13, 'co'); cv.p(wx + 4, wy + 12, 'coL'); cv.p(wx + 5, wy + 14, 'gr')
    # linge qui sèche + parabole
    cv.hl(8, 80, 70, 'haS')
    for i, c in enumerate(['co', 'blL', 'waL', 'coL']):
        cv.rect(20 + i * 12, 81, 6, 7, c); cv.hl(20 + i * 12, 87, 6, 'stS')
    cv.rect(94, 14, 7, 5, 'waL'); cv.p(97, 12, 'stS'); cv.p(98, 16, 'stS')
    # entrée : auvent, porte vitrée, numéro
    cv.block(40, 96, 32, 4, 'roof')
    cv.rect(44, 100, 24, 18, 'bl'); cv.box(44, 100, 24, 18); cv.vl(56, 100, 18, 'blS')
    cv.rect(46, 102, 9, 14, 'li' if lit else 'gl'); cv.rect(58, 102, 9, 14, 'li' if lit else 'gl')
    text(cv, 52, 91, '12', 'waL', 1)
    return cv

BUILDINGS = {'epicerie': epicerie, 'maison': maison, 'immeuble': immeuble}
