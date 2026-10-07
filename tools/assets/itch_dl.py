"""Télécharge les fichiers gratuits (prix minimum 0) d'une page itch.io.
Usage : python3 -I itch_dl.py <url_du_jeu> <dossier_sortie> [filtre_nom]"""
import http.cookiejar, json, os, re, sys, urllib.parse, urllib.request
game, out = sys.argv[1].rstrip('/'), sys.argv[2]
flt = sys.argv[3] if len(sys.argv) > 3 else ''
os.makedirs(out, exist_ok=True)
cj = http.cookiejar.CookieJar()
op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
op.addheaders = [('User-Agent', 'Mozilla/5.0')]
page = op.open(game, timeout=60).read().decode()
csrf = re.search(r'name="csrf_token" value="([^"]+)"', page).group(1)
# La liste des fichiers est sur la page de téléchargement (après « Download » à 0 $).
dl = json.loads(op.open(game + '/download_url', urllib.parse.urlencode({'csrf_token': csrf}).encode(), timeout=60).read())['url']
dpage = op.open(dl, timeout=60).read().decode()
files = re.findall(r'data-upload_id="(\d+)".{0,800}?class="name"[^>]*>([^<]+)<.{0,400}?class="file_size"[^>]*><span>([^<]+)<', dpage, re.S)
for uid, name, size in files:
    print('fichier', uid, name, size)
    if flt and flt.lower() not in name.lower():
        continue
    j = json.loads(op.open(f'{game}/file/{uid}?source=view_game&as_props=1', urllib.parse.urlencode({'csrf_token': csrf}).encode(), timeout=60).read())
    if 'url' not in j:
        print('refus', j); continue
    dest = os.path.join(out, os.path.basename(name))
    with op.open(j['url'], timeout=900) as resp, open(dest, 'wb') as f:
        while True:
            b = resp.read(1 << 20)
            if not b: break
            f.write(b)
    print('ok', dest, os.path.getsize(dest))
