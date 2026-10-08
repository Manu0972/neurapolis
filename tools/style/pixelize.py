"""Post-traitement des fantômes : retire le fond uni, réduit en vrai pixel art (48 px et 128 px),
quantifie la palette. `python3 tools/style/pixelize.py image.png [sortie_dossier]`"""
import json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOCK = json.load(open(os.path.join(ROOT, 'art', 'style-locks', 'fantomes.json'), encoding='utf-8'))
POST = LOCK['generation']['post']

def remove_bg(im, hexcol, tol=60):
    key = tuple(int(hexcol[i:i + 2], 16) for i in (1, 3, 5))
    im = im.convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if abs(r - key[0]) + abs(g - key[1]) + abs(b - key[2]) < tol: px[x, y] = (0, 0, 0, 0)
    return im

def pixelize(im, size, colors):
    bbox = im.getbbox() or (0, 0, im.width, im.height)
    im = im.crop(bbox); s = size / max(im.size)
    small = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.BOX)
    alpha = small.getchannel('A').point(lambda a: 255 if a > 128 else 0)
    rgb = small.convert('RGB').quantize(colors=colors, method=Image.Quantize.MEDIANCUT).convert('RGBA')
    rgb.putalpha(alpha)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    canvas.paste(rgb, ((size - rgb.width) // 2, size - rgb.height), rgb)
    return canvas

if __name__ == '__main__':
    src = sys.argv[1]; out = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(src)
    base = os.path.splitext(os.path.basename(src))[0]
    im = remove_bg(Image.open(src), POST['retirer_fond'])
    for size in POST['tailles_px']:
        p = os.path.join(out, f'{base}-{size}px.png'); pixelize(im, size, POST['quantifier_couleurs']).save(p); print(p)
