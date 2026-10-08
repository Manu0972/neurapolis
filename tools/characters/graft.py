"""Greffe d'une tête anime VRoid (CC0) sur un corps MakeHuman, pour les rendus dessinés."""
import bpy, bmesh, mathutils

def import_vrm_head(path):
    """Importe un VRM et renvoie [visage, crâne, cheveux] (objets séparés) et le point d'attache (base du crâne)."""
    before = set(bpy.data.objects)
    bpy.ops.import_scene.vrm(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    arm = next(o for o in new if o.type == 'ARMATURE')
    body = next(o for o in new if o.type == 'MESH' and o.name.startswith('Body'))
    face = next(o for o in new if o.type == 'MESH' and o.name.startswith('Face'))
    hair = [o for o in new if o.type == 'MESH' and o.name.startswith('Hair')]
    bpy.context.view_layer.update()
    head_bone = arm.pose.bones['J_Bip_C_Head']
    anchor = arm.matrix_world @ head_bone.head
    # Crâne : sommets du corps attachés surtout à l'os de la tête (et matériau de peau ou cheveux).
    gi = body.vertex_groups['J_Bip_C_Head'].index
    bm = bmesh.new(); bm.from_mesh(body.data)
    dl = bm.verts.layers.deform.active
    # Seulement la peau et les cheveux du crâne (pas les vêtements) attachés à la tête.
    skin_idx = {i for i, m in enumerate(body.data.materials) if m and ('SKIN' in m.name.upper() or 'HAIR' in m.name.upper())}
    face_ok = {f.index for f in body.data.polygons if f.material_index in skin_idx}
    bm.faces.ensure_lookup_table()
    ok_verts = set()
    for f in bm.faces:
        if f.index in face_ok:
            for v in f.verts: ok_verts.add(v)
    keep = [v for v in bm.verts if v in ok_verts and v[dl].get(gi, 0.0) > 0.45]
    print('CRANE', body.name, len(keep), '/', len(bm.verts))
    drop = [v for v in bm.verts if v not in set(keep)]
    bmesh.ops.delete(bm, geom=drop, context='VERTS')
    bm.to_mesh(body.data); bm.free()
    skull = body; skull.name = 'Crane'
    parts = [face, skull] + hair
    # Fige la géométrie telle qu'affichée (armature comprise) en coordonnées monde : retirer
    # seulement le modificateur perd la rotation que porte parfois l'armature VRM.
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    baked = []
    for o in parts:
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        me.transform(o.matrix_world)
        no = bpy.data.objects.new(o.name, me); bpy.context.scene.collection.objects.link(no)
        baked.append(no)
    for o in new: bpy.data.objects.remove(o, do_unlink=True)
    parts = baked
    top = max(v.co.z for v in parts[0].data.vertices)
    # Rien sous la base du crâne : le cou reste celui du corps (pas de double cou à la jointure).
    bm = bmesh.new(); bm.from_mesh(parts[1].data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < anchor.z + 0.01], context='VERTS')
    bm.to_mesh(parts[1].data); bm.free()
    # Contrôle : le visage doit regarder vers -Y (vers la caméra) et le haut vers +Z.
    fz = [v.co for v in parts[0].data.vertices]
    print('ORIENT', round(min(c.y for c in fz), 3), round(max(c.y for c in fz), 3), round(min(c.z for c in fz), 3), round(max(c.z for c in fz), 3))
    return parts, anchor, top

def remove_mh_head(base, rig):
    """Supprime la tête MakeHuman (sommets surtout attachés à l'os « head ») ; renvoie le point d'attache."""
    gi = base.vertex_groups['head'].index
    bm = bmesh.new(); bm.from_mesh(base.data)
    dl = bm.verts.layers.deform.active
    zs = [v.co.z for v in bm.verts]
    head_vs = [v for v in bm.verts if v[dl].get(gi, 0.0) > 0.5]
    # Position réelle = base + morphs actifs (les cibles MakeHuman sont des shape keys).
    keys = base.data.shape_keys.key_blocks if base.data.shape_keys else []
    basis = keys[0].data if keys else None
    def real_z(v):
        co = v.co.copy()
        if basis:
            for kb in keys[1:]:
                if kb.value and not kb.mute:
                    co += (kb.data[v.index].co - basis[v.index].co) * kb.value
        return (base.matrix_world @ co).z
    top = max(real_z(v) for v in head_vs)
    bmesh.ops.delete(bm, geom=head_vs, context='VERTS')
    bm.to_mesh(base.data); bm.free()
    # Trait du contour aminci vers le haut du cou (bord ouvert caché sous la mâchoire : pas d'encoche).
    tg = base.vertex_groups.get('trait') or base.vertex_groups.new(name='trait')
    hg = base.vertex_groups['head'].index; ng = base.vertex_groups['neck_01'].index
    for v in base.data.vertices:
        w = {g.group: g.weight for g in v.groups}
        tg.add([v.index], max(0.0, min(1.0, 1.0 - w.get(hg, 0.0) * 3.0 - w.get(ng, 0.0) * 0.5)), 'REPLACE')
    if base.data.shape_keys:
        pass
    anchor = rig.matrix_world @ rig.pose.bones['head'].head
    return anchor, top

def tinted_iris(src, color):
    """Iris recoloré : garde le dessin de la texture d'origine (luminance) multiplié par la couleur voulue."""
    img = next((n.image for n in src.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image), None) if src.use_nodes else None
    m = bpy.data.materials.new('iris'); m.use_nodes = True
    N = m.node_tree.nodes; L = m.node_tree.links
    for n in list(N): N.remove(n)
    out = N.new('ShaderNodeOutputMaterial'); em = N.new('ShaderNodeEmission')
    L.new(em.outputs[0], out.inputs[0])
    if img is None:
        em.inputs[0].default_value = color; return m
    tex = N.new('ShaderNodeTexImage'); tex.image = img
    bw = N.new('ShaderNodeRGBToBW'); mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
    mix.inputs[0].default_value = 1.0; mix.inputs[7].default_value = color
    gam = N.new('ShaderNodeMath'); gam.operation = 'MULTIPLY_ADD'; gam.inputs[1].default_value = 1.4; gam.inputs[2].default_value = 0.15
    L.new(tex.outputs[0], bw.inputs[0]); L.new(bw.outputs[0], gam.inputs[0]); L.new(gam.outputs[0], mix.inputs[6]); L.new(mix.outputs[2], em.inputs[0])
    # Transparence de la texture (le disque de l'iris n'occupe qu'une partie de son maillage).
    tr = N.new('ShaderNodeBsdfTransparent'); ms = N.new('ShaderNodeMixShader')
    L.new(tex.outputs[1], ms.inputs[0]); L.new(tr.outputs[0], ms.inputs[1]); L.new(em.outputs[0], ms.inputs[2])
    L.new(ms.outputs[0], out.inputs[0])
    return m

def graft(base, rig, vrm_path, skin_mat, hair_mat, scale_boost=1.0, face_mat=None, iris=None):
    anchor_mh, top_mh = remove_mh_head(base, rig)
    parts, anchor_v, top_v = import_vrm_head(vrm_path)
    k = (top_mh - anchor_mh.z) / max(1e-3, (top_v - anchor_v.z)) * scale_boost
    print('GRAFT', tuple(round(c, 3) for c in anchor_mh), round(top_mh, 3), tuple(round(c, 3) for c in anchor_v), round(top_v, 3), round(k, 3))
    for o in parts:
        o.matrix_world = mathutils.Matrix.Translation(anchor_mh) @ mathutils.Matrix.Scale(k, 4) @ mathutils.Matrix.Translation(-anchor_v) @ o.matrix_world
        for i, m in enumerate(o.data.materials):
            if m is None: continue
            n = m.name.upper()
            if 'SKIN' in n: o.data.materials[i] = face_mat if (face_mat and o is parts[0]) else skin_mat
            elif 'IRIS' in n and iris: o.data.materials[i] = tinted_iris(m, iris)
            elif 'HAIR' in n: o.data.materials[i] = hair_mat
    return parts
