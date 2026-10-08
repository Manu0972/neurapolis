"""Coiffures procédurales pour les têtes greffées : locks, locks papillon, tresses (box braids),
nattes collées (cornrows), afro. Le cuir chevelu de référence est la calotte des têtes VRoid
« Base_Male / Base_Female » (cheveux ras), déjà placée sur la tête par la greffe."""
import bpy, bmesh, math, random, mathutils
from mathutils import Vector

def scalp_samples(cap, n, rng, min_up=-0.15, front_cut=0.35):
    """Points (position, normale) répartis sur la calotte, en évitant le front (au-dessus des yeux)."""
    me = cap.data; mw = cap.matrix_world; nm = mw.to_3x3().inverted().transposed()
    tris = []
    hair_idx = {i for i, m in enumerate(me.materials) if m and m.name.startswith('cheveux')}
    for p in me.polygons:
        if hair_idx and p.material_index not in hair_idx: continue
        c = mw @ p.center; nrm = (nm @ p.normal).normalized()
        if nrm.z < min_up: continue
        tris.append((p, c, nrm, p.area))
    cz = sum(t[1].z for t in tris) / len(tris); cy = sum(t[1].y for t in tris) / len(tris)
    tot = sum(t[3] for t in tris); out = []
    while len(out) < n:
        r = rng.random() * tot; acc = 0
        for p, c, nrm, a in tris:
            acc += a
            if acc >= r: break
        # Pas de mèches qui partent du front bas (visage dégagé), sauf frange voulue.
        if nrm.y < -front_cut and c.z < cz + 0.02: continue
        vs = [mw @ me.vertices[i].co for i in p.vertices]
        w = [rng.random() for _ in vs]; s = sum(w)
        pos = sum((v * (x / s) for v, x in zip(vs, w)), Vector())
        out.append((pos, nrm))
    return out

def _curve_obj(name, splines, radius_fn, bevel, resolution=2):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = bevel; cu.bevel_resolution = 1; cu.resolution_u = resolution; cu.use_fill_caps = True
    for pts in splines:
        sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
        for i, p in enumerate(pts):
            sp.points[i].co = (p.x, p.y, p.z, 1); sp.points[i].radius = radius_fn(i, len(pts))
    ob = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(ob)
    return ob

class Head:
    """Ellipsoïde de la tête (centre et demi-axes) mesuré sur le visage et le crâne greffés."""
    def __init__(self, parts):
        pts = [o.matrix_world @ v.co for o in parts for v in o.data.vertices]
        lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
        hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        self.c = (lo + hi) / 2; self.r = (hi - lo) / 2
        self.c.z += self.r.z * 0.12; self.r.z *= 0.9   # le menton tire le centre vers le bas
    def q(self, p):
        d = p - self.c; return Vector((d.x / self.r.x, d.y / self.r.y, d.z / self.r.z))
    def onto(self, p, scale):
        """Projette p sur l'ellipsoïde agrandi de `scale`."""
        q = self.q(p); q.normalize(); q *= scale
        return self.c + Vector((q.x * self.r.x, q.y * self.r.y, q.z * self.r.z))

def _strand(head, root, length, rng, seg=0.018, sway=0.01, lift=1.06, fall_out=0.12):
    """Mèche : suit le crâne (sans passer devant le visage) jusqu'à sa base, puis tombe librement."""
    pts = [root.copy()]; p = head.onto(root, lift); L = 0.0
    q0 = head.q(root); side = 1.0 if q0.x >= 0 else -1.0
    jitter = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), 0)) * sway
    while L < length:
        pts.append(p.copy())
        q = head.q(p)
        if q.z > -0.25 and q.length < lift * 1.3:
            # Sur le crâne : vers le bas et vers l'arrière ; devant, on s'écarte d'abord du visage.
            want = Vector((0, 0.35, -1.0))
            if q.y < -0.15: want += Vector((side * 1.6, 0.6, 0))
            n = head.q(p); n = Vector((n.x / head.r.x, n.y / head.r.y, n.z / head.r.z)).normalized()
            t = want - n * want.dot(n)
            d = (t.normalized() if t.length > 1e-6 else Vector((0, 0, -1))) + jitter
            p = head.onto(p + d.normalized() * seg, lift + 0.02 * L / max(length, 1e-3))
        else:
            # Libre : tombe, légèrement écartée du cou et des épaules.
            out = Vector((p.x - head.c.x, p.y - head.c.y, 0))
            out = out.normalized() if out.length > 1e-6 else Vector((0, 1, 0))
            d = Vector((0, 0, -1)) + out * fall_out + jitter
            p = p + d.normalized() * seg
        L += seg
    pts.append(p)
    return pts

def locks(cap, mat, head, seed=1, count=70, length=0.32, thick=0.010, butterfly=False):
    """Locks (dreadlocks) ; `butterfly` : locks papillon, épaisseur irrégulière et boucles."""
    rng = random.Random(seed)
    spl = [_strand(head, pos, length * rng.uniform(0.85, 1.1), rng, sway=0.25 if butterfly else 0.08)
           for pos, nrm in scalp_samples(cap, count, rng)]
    if butterfly:
        rad = lambda i, n: (1.0 if i < n - 1 else 0.6) * (0.75 + 0.55 * abs(math.sin(i * 1.7 + n)))
    else:
        rad = lambda i, n: 1.0 if i < n - 1 else 0.7
    ob = _curve_obj('locks', spl, rad, thick, resolution=3 if butterfly else 2)
    ob.data.materials.append(mat); return ob

def box_braids(cap, mat, head, seed=2, count=80, length=0.42, thick=0.007):
    """Tresses fines : tube dont le rayon ondule (lecture « tressée » à distance de jeu)."""
    rng = random.Random(seed)
    spl = [_strand(head, p, length * rng.uniform(0.95, 1.05), rng, seg=0.012, sway=0.03) for p, n in scalp_samples(cap, count, rng)]
    ob = _curve_obj('tresses', spl, lambda i, n: (0.8 + 0.3 * (i % 2)) if i < n - 1 else 0.5, thick, resolution=1)
    ob.data.materials.append(mat); return ob

def cornrows(cap, mat, head, rows=9, thick=0.008):
    """Nattes collées : rangées parallèles de la naissance des cheveux (front) jusqu'à la nuque."""
    spl = []
    for k in range(rows):
        u = (k / (rows - 1) - 0.5) * 1.6          # gauche-droite, en demi-largeurs de tête
        pts = []
        for j in range(36):
            t = math.radians(35 + j * 180 / 35)   # 35° : haut du front ; 215° : nuque
            q = Vector((u, -math.cos(t), math.sin(t)))
            pts.append(head.onto(head.c + Vector((q.x * head.r.x, q.y * head.r.y, q.z * head.r.z)), 1.03))
        spl.append(pts)
    ob = _curve_obj('nattes', spl, lambda i, n: 0.75 + 0.45 * (i % 2), thick, resolution=1)
    ob.data.materials.append(mat); return ob

def afro(cap, mat, head, seed=3, volume=1.75):
    """Afro : grand volume arrondi autour du crâne, qui descend derrière et sur les côtés ; visage et front dégagés."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=5, radius=1.0, location=head.c + Vector((0, head.r.y * 0.15, head.r.z * 0.35)))
    ob = bpy.context.active_object; ob.name = 'afro'
    ob.scale = (head.r.x * volume, head.r.y * volume * 0.97, head.r.z * volume * 0.9)
    bpy.context.view_layer.update()
    bm = bmesh.new(); bm.from_mesh(ob.data)
    def gone(v):
        q = head.q(ob.matrix_world @ v.co)
        return (q.z < -0.8 or (q.y < -0.2 and q.z < 0.62) or (q.z < -0.3 and q.y < 0.25))
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if gone(v)], context='VERTS'); bm.to_mesh(ob.data); bm.free()
    # Deux échelles de relief : grosses touffes (silhouette bosselée) et petites boucles.
    for nm, sc_, st in (('touffes', 0.42, 0.55), ('boucles', 0.12, 0.12)):
        tex = bpy.data.textures.new(nm, 'CLOUDS'); tex.noise_scale = sc_; tex.noise_depth = 1
        d = ob.modifiers.new(nm, 'DISPLACE'); d.texture = tex; d.strength = st; d.mid_level = 0.5
    sol = ob.modifiers.new('epaisseur', 'SOLIDIFY'); sol.thickness = head.r.x * 0.25; sol.offset = -1
    for p in ob.data.polygons: p.use_smooth = True
    ob.data.materials.append(mat); return ob
