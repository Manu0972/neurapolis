"""Tuiles 32x32 (TILE_PX du jeu). Toutes se raccordent sans couture (wrap) : on peut les mélanger librement."""
import random
import numpy as np
from lib import *

T = 32

def wp(cv, x, y, c):
    cv.p(x % T, y % T, c)

def pave(seed):
    """Pavé irrégulier : joints froids, pierres chaudes, arêtes éclairées en haut-gauche."""
    r = random.Random(seed)
    cv = Cv(T, T); cv.rect(0, 0, T, T, 'stS')
    heights = r.choice([[8, 8, 8, 8], [7, 9, 8, 8], [9, 7, 8, 8], [8, 9, 7, 8], [6, 9, 9, 8]])
    y = 0
    for h in heights:
        while True:
            w1, w2 = r.randint(9, 14), r.randint(9, 14)
            if 9 <= T - w1 - w2 <= 14: break
        off = r.randint(0, T - 1); x = off
        for w in (w1, w2, T - w1 - w2):
            base = r.choice(['st', 'st', 'st', 'stL', 'st'])
            for dx in (-T, 0, T):
                x0 = x + dx
                if x0 + w < 0 or x0 > T: continue
                iw, ih = w - 1, h - 1
                for yy in range(ih):
                    for xx in range(iw):
                        if (xx in (0, iw - 1)) and (yy in (0, ih - 1)): continue   # coins arrondis
                        c = base
                        if yy == 0 and base == 'st': c = 'stL'
                        elif xx == 0 and base == 'st' and yy > 0: c = 'stL'
                        elif yy == ih - 1 and (xx + x0) % 2 == 0: c = 'stS' if base == 'st' else 'st'
                        wp(cv, x0 + xx, y + yy, c)
                for _ in range(2):
                    wp(cv, x0 + r.randrange(1, max(2, iw - 1)), y + r.randrange(1, max(2, ih - 1)), 'stS')
            x += w
        y += h
    for _ in range(3):  # un peu de mousse dans les joints
        x, y = r.randrange(T), r.randrange(T)
        if cv.get(x, y) == C['stS']: cv.p(x, y, 'grS')
    return cv

def grass(seed, flower=False):
    r = random.Random(seed)
    cv = Cv(T, T); cv.rect(0, 0, T, T, 'gr')
    for _ in range(6):  # plaques d'ombre fraîche / lumière chaude
        cx, cy = r.randrange(T), r.randrange(T)
        for dx, dy in [(0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (3, 1), (1, 2)]:
            wp(cv, cx + dx, cy + dy, 'grL' if r.random() < .5 else 'grS')
    for _ in range(26):  # brins : base froide, pointe claire
        x, y = r.randrange(T), r.randrange(T)
        wp(cv, x, y, 'grS'); wp(cv, x, y - 1, 'grL')
        if r.random() < .4: wp(cv, x + 1, y, 'grS')
    if flower:
        for _ in range(3):
            x, y = r.randrange(T), r.randrange(T)
            wp(cv, x, y, r.choice(['liL', 'coL', 'waL'])); wp(cv, x, y + 1, 'grS')
    return cv

def dirt(seed):
    r = random.Random(seed)
    cv = Cv(T, T); cv.rect(0, 0, T, T, 'wo')
    for _ in range(5):
        cx, cy = r.randrange(T), r.randrange(T)
        for dx in range(-2, 3):
            for dy in range(-1, 2):
                if abs(dx) + abs(dy) * 2 <= 3: wp(cv, cx + dx, cy + dy, 'woL')
    for _ in range(16): wp(cv, r.randrange(T), r.randrange(T), 'ha')
    for _ in range(4):
        x, y = r.randrange(T), r.randrange(T)
        wp(cv, x, y, 'stL'); wp(cv, x + 1, y, 'st'); wp(cv, x, y + 1, 'stS'); wp(cv, x + 1, y + 1, 'stS')
    for _ in range(3):
        x, y = r.randrange(T), r.randrange(T); wp(cv, x, y, 'grL'); wp(cv, x, y - 1, 'grL')
    return cv

def wood_floor(seed):
    r = random.Random(seed)
    cv = Cv(T, T)
    for row in range(4):
        y0 = row * 8; off = r.randint(0, 31)
        cv.rect(0, y0, T, 8, 'wo')
        cv.hl(0, y0, T, 'woL'); cv.hl(0, y0 + 7, T, 'ha')
        for sx in (off, (off + 17) % T):
            cv.vl(sx, y0 + 1, 7, 'ha')
        for _ in range(5): wp(cv, r.randrange(T), y0 + r.randrange(2, 6), 'ha' if r.random() < .5 else 'woL')
    return cv

def checker():
    cv = Cv(T, T)
    for y in range(T):
        for x in range(T):
            cv.p(x, y, 'wa' if ((x // 16) + (y // 16)) % 2 == 0 else 'waL')
    cv.hl(0, 0, T, 'waS'); cv.vl(0, 0, T, 'waS')
    r = random.Random(3)
    for _ in range(6): wp(cv, r.randrange(T), r.randrange(T), 'waS')
    return cv

def hedge(seed):
    r = random.Random(seed)
    cv = Cv(T, T); cv.rect(0, 0, T, T, 'grS')
    blobs = [(r.randrange(T), r.randrange(T), r.randint(4, 6)) for _ in range(8)]
    for bx, by, br in sorted(blobs, key=lambda b: b[1]):
        for dx in (-T, 0, T):
            for dy in (-T, 0, T):
                for yy in range(-br, br + 1):
                    for xx in range(-br, br + 1):
                        d2 = xx * xx + yy * yy
                        if d2 > br * br: continue
                        v = -0.7 * xx / br - 0.8 * yy / br
                        c = 'grL' if v > .42 else ('grS' if v < -.35 else 'gr')
                        wp(cv, bx + dx + xx, by + dy + yy, c) if 0 <= bx + dx + xx < T + 8 else None
    for _ in range(4):
        x, y = r.randrange(T), r.randrange(T); wp(cv, x, y, 'coL'); wp(cv, x + 1, y, 'co')   # roses sauvages
    return cv

def edge(side, seed=1):
    """Surcouche transparente : l'herbe mord sur le pavé (bord irrégulier). side = n|s|e|w."""
    r = random.Random(seed)
    cv = Cv(T, T)
    for x in range(T):
        d = 4 + int(3 * r.random())
        for y in range(d):
            c = 'gr'
            if y == d - 1: c = 'grS'
            elif y == 0 or r.random() < .18: c = 'grL'
            cv.p(x, y, c)
        if r.random() < .25: cv.p(x, d, 'gr'); cv.p(x, d + 1, 'grS')
    im = cv.im
    im = {'n': im, 's': im.transpose(1), 'e': im.rotate(-90), 'w': im.rotate(90)}[side]
    out = Cv(T, T); out.im = im.copy(); out.px = out.im.load()
    return out

TILES = [  # nom -> générateur (ordre = atlas 8 colonnes)
 ('pave_a', lambda: pave(1)), ('pave_b', lambda: pave(2)), ('pave_c', lambda: pave(3)), ('pave_d', lambda: pave(4)),
 ('herbe_a', lambda: grass(11)), ('herbe_b', lambda: grass(12)), ('herbe_c', lambda: grass(13, True)), ('herbe_d', lambda: grass(14)),
 ('terre_a', lambda: dirt(21)), ('terre_b', lambda: dirt(22)), ('haie_a', lambda: hedge(31)), ('haie_b', lambda: hedge(32)),
 ('plancher_a', lambda: wood_floor(41)), ('plancher_b', lambda: wood_floor(42)), ('damier', checker), ('pave_e', lambda: pave(5)),
 ('bord_herbe_n', lambda: edge('n', 1)), ('bord_herbe_s', lambda: edge('s', 2)), ('bord_herbe_e', lambda: edge('e', 3)), ('bord_herbe_w', lambda: edge('w', 4)),
]
COLS = 8

def atlas():
    rows = (len(TILES) + COLS - 1) // COLS
    at = Cv(COLS * T, rows * T)
    meta = {}
    for i, (name, fn) in enumerate(TILES):
        x, y = (i % COLS) * T, (i // COLS) * T
        at.paste(fn(), x, y)
        meta[name] = {'x': x, 'y': y, 'w': T, 'h': T, 'overlay': name.startswith('bord_')}
    return at, meta
