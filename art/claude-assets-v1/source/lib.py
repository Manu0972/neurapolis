"""Outils communs : palette, canvas pixel, ombrage par rampes (ombre froide / base / lumière chaude)."""
import numpy as np
from PIL import Image

# --- PALETTE CORE : 32 couleurs, contour brun chaud, jamais de noir pur -------------
P = {
 'O':'#2a1a14',
 'skS':'#d99a78','sk':'#ffc496','skL':'#ffd9b0',
 'haD':'#2c2230','haS':'#4a3220','ha':'#6b4a2f','haL':'#8a6240',
 'coS':'#c25a40','co':'#f48c5d','coL':'#ffb08a',
 'blS':'#34406a','bl':'#4f67a3','blL':'#7f9bd0',
 'wo':'#bc7e4d','woL':'#d8a878',
 'waS':'#b99a86','wa':'#efd9ac','waL':'#f9ecd0',
 'roS':'#8f3a34','ro':'#c15f4a','roL':'#d97a5f',
 'stS':'#8e8a9a','st':'#c8b9a0','stL':'#e4d3b4',
 'grS':'#3d7a6a','gr':'#6fb06a','grL':'#b5d977',
 'sky':'#6fb4e0','gl':'#7fa8c4','li':'#ffd98a','liL':'#ffe9b8',
}
def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
C = {k: rgb(v) + (255,) for k, v in P.items()}
# l'ombre du bois (woS) est 'ha'
RAMPS = {  # (ombre froide, base, lumière chaude)
 'skin':('skS','sk','skL'), 'hairB':('haS','ha','haL'), 'hairD':('haD','haS','ha'),
 'hairG':('stS','st','stL'), 'coral':('coS','co','coL'), 'blue':('blS','bl','blL'),
 'wood':('ha','wo','woL'), 'wall':('waS','wa','waL'), 'roof':('roS','ro','roL'),
 'stone':('stS','st','stL'), 'grass':('grS','gr','grL'), 'mustard':('wo','li','liL'),
}
# Variantes de peau (hors palette core, +6 couleurs) pour recolorer les PNJ
SKIN_SWAPS = {
 'brun_chaud': {'skS':'#8a5238','sk':'#b47a56','skL':'#d19a72'},
 'brun_profond': {'skS':'#5e3a2c','sk':'#8a5a40','skL':'#aa7656'},
}

class Cv:
    def __init__(s, w, h, bg=None):
        s.w, s.h = w, h
        s.im = Image.new('RGBA', (w, h), bg or (0, 0, 0, 0))
        s.px = s.im.load()
    def p(s, x, y, c):
        x, y = int(x), int(y)
        if c is not None and 0 <= x < s.w and 0 <= y < s.h:
            s.px[x, y] = C[c] if isinstance(c, str) else c
    def get(s, x, y):
        return s.px[x, y] if 0 <= x < s.w and 0 <= y < s.h else (0, 0, 0, 0)
    def rect(s, x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                s.p(xx, yy, c)
    def hl(s, x, y, l, c):
        for i in range(l): s.p(x + i, y, c)
    def vl(s, x, y, l, c):
        for i in range(l): s.p(x, y + i, c)
    def box(s, x, y, w, h, c='O'):  # contour 1px à l'extérieur du rectangle
        s.hl(x - 1, y - 1, w + 2, c); s.hl(x - 1, y + h, w + 2, c)
        s.vl(x - 1, y, h, c); s.vl(x + w, y, h, c)
    def block(s, x, y, w, h, ramp, out=True):
        S, B, L = RAMPS[ramp] if isinstance(ramp, str) else ramp
        s.rect(x, y, w, h, B)
        s.hl(x, y, w, L); s.vl(x, y, h, L); s.hl(x, y + h - 1, w, S); s.vl(x + w - 1, y, h, S)
        s.p(x + w - 1, y + h - 1, S)
        if out: s.box(x, y, w, h)
    def paste(s, o, x, y):
        s.im.paste(o.im, (int(x), int(y)), o.im)
    def save(s, path):
        s.im.save(path)
    def arr(s):
        return np.array(s.im)

def outline(cv, col='O'):
    """Contour 1 px brun chaud autour de la silhouette (4-voisinage)."""
    a = cv.arr()[:, :, 3] > 0
    pts = []
    for y in range(cv.h):
        for x in range(cv.w):
            if not a[y, x] and ((y > 0 and a[y-1, x]) or (y < cv.h-1 and a[y+1, x]) or
                                (x > 0 and a[y, x-1]) or (x < cv.w-1 and a[y, x+1])):
                pts.append((x, y))
    for x, y in pts: cv.p(x, y, col)

def ell_mask(w, h, cx, cy, rx, ry):
    yy, xx = np.mgrid[0:h, 0:w]
    return ((xx + 0.5 - cx) / rx) ** 2 + ((yy + 0.5 - cy) / ry) ** 2 <= 1.0

def rect_mask(w, h, x, y, rw, rh):
    m = np.zeros((h, w), bool)
    m[max(0, y):max(0, y + rh), max(0, x):max(0, x + rw)] = True
    return m

def paint(cv, mask, ramp, cx=None, cy=None, rx=None, ry=None):
    """Peint un masque en 3 tons : lumière chaude en haut à gauche, ombre froide en bas à droite."""
    S, B, L = RAMPS[ramp] if isinstance(ramp, str) else ramp
    ys, xs = np.nonzero(mask)
    if len(xs) == 0: return
    if cx is None:
        cx, cy = (xs.min() + xs.max() + 1) / 2, (ys.min() + ys.max() + 1) / 2
        rx, ry = (xs.max() - xs.min() + 1) / 2, (ys.max() - ys.min() + 1) / 2
    for y, x in zip(ys, xs):
        v = -0.65 * (x + 0.5 - cx) / rx - 0.75 * (y + 0.5 - cy) / ry
        cv.p(x, y, L if v > 0.38 else (S if v < -0.30 else B))

BAYER = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0

def hash01(x, y, salt=0):
    h = (int(x) * 374761393 + int(y) * 668265263 + int(salt) * 2147483647) & 0xffffffff
    h = ((h ^ (h >> 13)) * 1274126177) & 0xffffffff
    return ((h ^ (h >> 16)) & 0xffff) / 65536.0
