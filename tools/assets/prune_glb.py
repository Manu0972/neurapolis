"""Construit le fichier d'animations du jeu à partir des GLB de la Universal Animation Library (CC0).

Garde uniquement : la hiérarchie du squelette (nœuds) et les animations demandées, venues de
plusieurs fichiers qui partagent le même squelette. Retire maillages, peaux, matériaux et images.

Usage : python3 -I prune_glb.py sortie.glb clips.txt entree1.glb [entree2.glb ...]
clips.txt : une ligne par animation, « NomSource » ou « NomSource=NomDansLeJeu ».
"""
import json, struct, sys

FINGERS = ('index_', 'middle_', 'ring_', 'pinky_', 'thumb_')

def read_glb(path):
    data = open(path, 'rb').read()
    assert data[:4] == b'glTF'
    jlen = struct.unpack('<I', data[12:16])[0]
    j = json.loads(data[20:20 + jlen])
    off = 20 + jlen
    blen = struct.unpack('<I', data[off:off + 4])[0]
    return j, data[off + 8:off + 8 + blen]

def main():
    out, clip_file, inputs = sys.argv[1], sys.argv[2], sys.argv[3:]
    wanted = {}
    for line in open(clip_file, encoding='utf-8'):
        line = line.split('#')[0].strip()
        if not line:
            continue
        src, _, dst = line.partition('=')
        wanted[src.strip()] = (dst or src).strip()
    base, _ = read_glb(inputs[0])
    names = [n.get('name') for n in base['nodes']]
    out_buf = bytearray()
    accessors, views, anims = [], [], []

    def copy_accessor(j, buf, ai):
        a = dict(j['accessors'][ai])
        bv = j['bufferViews'][a['bufferView']]
        start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
        comp = {5126: 4, 5123: 2, 5125: 4, 5121: 1}[a['componentType']]
        ncomp = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
        size = a['count'] * comp * ncomp
        assert bv.get('byteStride', comp * ncomp) == comp * ncomp
        while len(out_buf) % 4:
            out_buf.append(0)
        views.append({'buffer': 0, 'byteOffset': len(out_buf), 'byteLength': size})
        out_buf.extend(buf[start:start + size])
        a['bufferView'] = len(views) - 1
        a.pop('byteOffset', None)
        accessors.append(a)
        return len(accessors) - 1

    found = set()
    for path in inputs:
        j, buf = read_glb(path)
        assert [n.get('name') for n in j['nodes']] == names, f'{path} : squelette différent'
        for an in j.get('animations', []):
            if an['name'] not in wanted or an['name'] in found:
                continue
            found.add(an['name'])
            samplers, channels, time_cache = [], [], {}
            for ch in an['channels']:
                node = names[ch['target']['node']] or ''
                path = ch['target']['path']
                # Doigts, os terminaux et échelles : inutiles pour nos mains simples (et lourds).
                if any(f in node for f in FINGERS) or 'leaf' in node or path == 'scale':
                    continue
                # Seul le bassin se déplace ; les autres os ne font que tourner.
                if path == 'translation' and node not in ('pelvis', 'root'):
                    continue
                s = an['samplers'][ch['sampler']]
                if s['input'] not in time_cache:
                    time_cache[s['input']] = copy_accessor(j, buf, s['input'])
                samplers.append({'input': time_cache[s['input']], 'output': copy_accessor(j, buf, s['output']), 'interpolation': s.get('interpolation', 'LINEAR')})
                channels.append({'sampler': len(samplers) - 1, 'target': ch['target']})
            anims.append({'name': wanted[an['name']], 'samplers': samplers, 'channels': channels})
    missing = sorted(set(wanted) - found)
    if missing:
        sys.exit('Animations introuvables : ' + ', '.join(missing))
    nodes = [{k: v for k, v in n.items() if k not in ('mesh', 'skin')} for n in base['nodes']]
    gl = {
        'asset': {'version': '2.0', 'generator': 'NEURAPOLIS prune_glb (Universal Animation Library, Quaternius, CC0)'},
        'scene': 0, 'scenes': base['scenes'], 'nodes': nodes,
        'animations': anims, 'accessors': accessors, 'bufferViews': views,
        'buffers': [{'byteLength': len(out_buf)}],
    }
    js = json.dumps(gl, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    while len(out_buf) % 4:
        out_buf.append(0)
    total = 12 + 8 + len(js) + 8 + len(out_buf)
    with open(out, 'wb') as f:
        f.write(b'glTF' + struct.pack('<II', 2, total))
        f.write(struct.pack('<I', len(js)) + b'JSON' + js)
        f.write(struct.pack('<I', len(out_buf)) + b'BIN\x00' + bytes(out_buf))
    print(f'{out} : {len(anims)} animations, {total / 1e6:.2f} Mo')

main()
