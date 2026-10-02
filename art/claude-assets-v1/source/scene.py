"""Scène de démonstration (rue de l'épicerie, Cité des Roses) + éclairage en pixels nets.
Ordre de rendu (à reproduire dans le renderer Canvas) :
  ciel -> nuages -> skyline -> haie -> façades -> sol -> ombres portées -> accessoires/personnages (tri par y)
  -> étalonnage de l'heure (multiplication) -> lumières (screen) -> vignette."""
import random
import numpy as np
from PIL import Image, ImageDraw
from lib import *
import tiles as TL, buildings as BD, props as PR, chars as CH

SW, SH = 480, 270
GROUND_Y = 176
GRADE = {   # mul = teinte multipliée sur toute la scène ; k = force ; shadow = opacité des ombres portées ; shlen = longueur
 'jour': dict(mul=(255, 255, 255), k=0.0, shadow=0.22, shlen=22, vig=0.30, lamp=0.0, win=0.0),
 'soir': dict(mul=(255, 196, 150), k=0.55, shadow=0.42, shlen=44, vig=0.45, lamp=0.55, win=0.60),
 'nuit': dict(mul=(84, 104, 180), k=0.80, shadow=0.0, shlen=0, vig=0.55, lamp=0.95, win=0.95),
}
SHADOW_COL = (90, 74, 120)      # ombres portées : violet froid, jamais du gris ni du noir
VIG_COL = (50, 32, 64)
WIN_COL = (255, 214, 138)       # ~1900 K
LAMP_COL = (255, 205, 120)

def light_map(w, h, cx, cy, rx, ry, levels=5, power=1.4):
    """Intensité 0..1 d'une lumière elliptique, quantifiée par trame de Bayer : paliers nets, pas de flou."""
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx + .5 - cx) / rx) ** 2 + ((yy + .5 - cy) / ry) ** 2)
    I = np.clip(1 - d, 0, 1) ** power
    q = np.clip(np.floor(I * levels + BAYER[yy % 4, xx % 4]), 0, levels) / levels
    return np.where(I > 0, q, 0.0)

def screen(arr, alpha, color, k):
    a = (alpha * k)[..., None]
    return 255 - (255 - arr) * (255 - np.array(color, float)[None, None, :] * a) / 255

def mult_mask(arr, mask, col, a):
    m = (mask.astype(float) * a)[..., None]
    return arr * (1 - m) + arr * (np.array(col, float) / 255)[None, None, :] * m

def poly_mask(pts):
    im = Image.new('L', (SW, SH), 0); ImageDraw.Draw(im).polygon(pts, fill=255)
    return np.array(im) > 0

def ell_poly(cx, cy, rx, ry):
    im = Image.new('L', (SW, SH), 0); ImageDraw.Draw(im).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255)
    return np.array(im) > 0

_cache = {}
def cached(key, fn):
    if key not in _cache: _cache[key] = fn()
    return _cache[key]

def sheet_frame(name, d, frame):
    sh = cached(('sheet', name), lambda: CH.sheet(name))
    c, r = CH.FRAMES.index(frame), CH.DIRS.index(d)
    out = Cv(CH.W, CH.H); out.im = sh.im.crop((c * CH.W, r * CH.H, (c + 1) * CH.W, (r + 1) * CH.H)); out.px = out.im.load()
    return out

# positions des bâtiments dans la scène (x du bord gauche) ; sol à y = GROUND_Y
BX = {'epicerie': 24, 'maison': 194, 'immeuble': 314}

def lit_windows():
    """Rectangles (cx, cy, rx, ry) de lumière pour les fenêtres allumées de la scène."""
    out = []
    ex = BX['epicerie']; ey = GROUND_Y - 128
    out.append(('shop', ex + 64, ey + 88, 76, 30)); out.append(('door', ex + 139, ey + 78, 22, 24))
    mx = BX['maison']; my = GROUND_Y - 128
    out += [('mw1', mx + 24, my + 65, 24, 22), ('mw2', mx + 74, my + 65, 24, 22), ('mw3', mx + 74, my + 97, 28, 22)]
    ix = BX['immeuble']; iy = GROUND_Y - 128
    pat = [[1, 0, 1], [0, 1, 1], [1, 0, 0]]
    for ri, wy in enumerate((20, 52, 84)):
        for ci, wx in enumerate((12, 46, 80)):
            if pat[ri][ci]: out.append(('iw', ix + wx + 10, iy + wy + 11, 24, 22))
    return out

def compose(time):
    g = GRADE[time]; lit = time != 'jour'
    cv = Cv(SW, SH)
    cv.paste(cached(('sky', time), lambda: PR.sky('soir' if time == 'soir' else 'jour')), 0, 0)
    clouds = cached('clouds', PR.clouds)
    cv.paste(clouds, 10, 14); cv.paste(clouds, 250, 40)
    cv.paste(cached('skyline', PR.skyline), 0, 62)
    hr = cached('hedge', lambda: PR.hedge_row(480, 32)); cv.paste(hr, 0, 144)
    for name, x in BX.items():
        cv.paste(cached(('b', name, lit), lambda n=name: BD.BUILDINGS[n](lit)), x, GROUND_Y - 128)
    # --- sol : pavé varié + une pelouse sous l'arbre avec bords qui mordent le pavé ---
    for ty in range(GROUND_Y, SH, 32):
        for tx in range(0, SW, 32):
            seed = 1 + int(hash01(tx // 32, ty // 32, 3) * 5)
            cv.paste(cached(('pave', seed), lambda s=seed: TL.pave(s)), tx, ty)
    for gx in (416, 448):
        for gy in (208, 240):
            cv.paste(cached(('herbe', gx, gy), lambda i=(gx // 32 + gy // 32): TL.grass(11 + i % 4, i % 3 == 0)), gx, gy)
        cv.paste(cached(('edge', 's'), lambda: TL.edge('s', 2)), gx, GROUND_Y)
    for gy in (208, 240): cv.paste(cached(('edge', 'e'), lambda: TL.edge('e', 3)), 384, gy)
    arr = np.array(cv.im.convert('RGB')).astype(float)
    # --- ombres portées (soleil bas à gauche : elles partent vers la droite et vers nous) ---
    if g['shadow'] > 0:
        L = g['shlen']
        for name, x in BX.items():
            w = {'epicerie': 160}.get(name, 112)
            arr = mult_mask(arr, poly_mask([(x, GROUND_Y), (x + w, GROUND_Y), (x + w + L, GROUND_Y + int(L * .8)), (x + L, GROUND_Y + int(L * .8))]), SHADOW_COL, g['shadow'])
    cv.im = Image.fromarray(arr.astype(np.uint8)).convert('RGBA'); cv.px = cv.im.load()
    # --- accessoires + personnages triés par y ---
    P = {n: cached(('p', n), f) for n, f in PR.PROPS}
    items = []  # (base_y, x_centre, sprite, ombre rx, ombre ry)
    lampimg = P['lampadaire_on'] if lit else P['lampadaire_off']
    items += [(204, 190, lampimg, 6, 3), (190, 130, P['cageots_fruits'], 15, 4), (192, 70, P['ardoise_pain'], 9, 3),
              (190, 38, P['jardiniere'], 9, 3), (181, 148, P['chat_0'], 6, 2), (200, 240, P['banc'], 18, 4),
              (186, 414, P['poubelle'], 7, 3), (234, 442, P['cerisier'], 18, 5), (182, 301, P['buisson_rosiers'], 13, 3),
              (203, 96, sheet_frame('adulte', 'down', 'idle1'), 6, 3), (222, 288, sheet_frame('camarade', 'left', 'walk2'), 6, 3),
              (240, 200, sheet_frame('joueur', 'down', 'walk0'), 6, 3)]
    items.sort(key=lambda i: i[0])
    shadow_layer = np.zeros((SH, SW), bool)
    for base, x, spr, rx, ry in items:
        shadow_layer |= ell_poly(x + 3, base - 1, rx + 2, ry)
    arr = np.array(cv.im.convert('RGB')).astype(float)
    arr = mult_mask(arr, shadow_layer, SHADOW_COL, 0.45 if g['shadow'] > 0 else 0.30)
    cv.im = Image.fromarray(arr.astype(np.uint8)).convert('RGBA'); cv.px = cv.im.load()
    for base, x, spr, rx, ry in items:
        cv.paste(spr, x - spr.w // 2, base - spr.h)
    # fumée de cheminée + feuilles qui dérivent
    for k, (dx, dy) in enumerate([(0, 0), (4, -11), (9, -22)]):
        cv.paste(P[f'fumee_{k}'], BX['maison'] + 74 + dx, GROUND_Y - 128 - 10 + dy)
    for (lx, ly, i) in [(236, 208, 0), (262, 232, 1), (158, 218, 0), (372, 226, 1)]:
        cv.paste(P[f'feuille_{i}'], lx, ly)
    # --- étalonnage de l'heure ---
    arr = np.array(cv.im.convert('RGB')).astype(float)
    pre = arr.copy(); sky_arr = np.array(cached(('sky', time), None).im.convert('RGB')).astype(float)
    mul = np.array(g['mul'], float) / 255
    arr = arr * ((1 - g['k']) + g['k'] * mul)[None, None, :]
    if time == 'nuit':
        rr = random.Random(4)
        for _ in range(46):
            x, y = rr.randrange(SW), rr.randrange(0, 96)
            if (pre[y, x] == sky_arr[y, x]).all(): arr[y, x] = (255, 233, 184) if rr.random() < .7 else (200, 210, 255)
        arr = screen(arr, light_map(SW, SH, 420, 30, 26, 26, 4, 1.2), (190, 200, 255), .6)
        yy, xx = np.mgrid[0:SH, 0:SW]
        arr[((xx + .5 - 420) ** 2 + (yy + .5 - 30) ** 2) <= 36] = (249, 236, 208)
    # --- lumières chaudes (screen) ---
    if g['win'] > 0:
        for kind, cx, cy, rx, ry in lit_windows():
            arr = screen(arr, light_map(SW, SH, cx, cy, rx, ry, 5, 1.5), WIN_COL, g['win'] * .55)
            if kind in ('shop', 'door'):   # flaque de lumière sur le pavé devant la vitrine
                arr = screen(arr, light_map(SW, SH, cx, GROUND_Y + 14, rx * 1.15, ry * .75, 5, 1.2), WIN_COL, g['win'] * .5)
            if kind == 'mw3':
                arr = screen(arr, light_map(SW, SH, cx, GROUND_Y + 8, rx * 1.2, 14, 5, 1.2), WIN_COL, g['win'] * .5)
    if g['lamp'] > 0:
        arr = screen(arr, light_map(SW, SH, 190, 150, 50, 50, 5, 1.3), LAMP_COL, g['lamp'] * .85)
        arr = screen(arr, light_map(SW, SH, 190, 205, 64, 20, 5, 1.1), LAMP_COL, g['lamp'] * .7)
    # --- vignette chaude-froide ---
    arr = vignette_apply(arr, g['vig'])
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert('RGB')

def vig_alpha(w=SW, h=SH, levels=5):
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx + .5 - w / 2) / (w / 2)) ** 2 + ((yy + .5 - h / 2) / (h / 2)) ** 2)
    I = np.clip((d - .55) / .75, 0, 1) ** 1.3
    return np.clip(np.floor(I * levels + BAYER[yy % 4, xx % 4]), 0, levels) / levels * (I > 0)

def vignette_apply(arr, strength):
    a = (vig_alpha() * strength)[..., None]
    return arr * (1 - a) + np.array(VIG_COL, float)[None, None, :] * a

# ------------------------------------------------------------------ surcouches de lumière prêtes pour Canvas
def overlay_png(m, color, maxa=235):
    h, w = m.shape
    a = np.zeros((h, w, 4), np.uint8); a[..., 0], a[..., 1], a[..., 2] = color; a[..., 3] = (m * maxa).astype(np.uint8)
    return Image.fromarray(a, 'RGBA')

def export_light(dirpath):
    overlay_png(light_map(96, 96, 48, 48, 47, 47, 5, 1.3), LAMP_COL).save(dirpath + '/halo_chaud_96.png')
    overlay_png(light_map(128, 48, 64, 24, 63, 23, 5, 1.1), LAMP_COL).save(dirpath + '/flaque_sol_128x48.png')
    overlay_png(light_map(64, 64, 32, 32, 31, 31, 4, 1.5), WIN_COL).save(dirpath + '/halo_fenetre_64.png')
    a = vig_alpha(); out = np.zeros((SH, SW, 4), np.uint8)
    out[..., 0], out[..., 1], out[..., 2] = VIG_COL; out[..., 3] = (a * 150).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(dirpath + '/vignette_480x270.png')
