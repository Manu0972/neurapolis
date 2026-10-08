"""Chaîne IA libre de droits pour fabriquer un personnage 3D à partir d'une description.

1. FLUX.1-schnell (Apache 2.0) dessine le personnage en pied, de face, fond blanc.
2. StdGEN (Apache 2.0, CVPR 2025) : image → pose de référence (A-pose) → vues multiples →
   maillages séparés (corps, vêtements, cheveux) → affinage.

Les démos tournent sur les GPU gratuits de Hugging Face (ZeroGPU) : il faut une clé lue dans la
variable d'environnement HF_TOKEN (jamais écrite dans le code ni dans la conversation).

Usage : HF_TOKEN=… python3 -I ai_pipeline.py "description en anglais" dossier_sortie [graine]
"""
import os, shutil, sys
from gradio_client import Client, handle_file

STYLE = ("full body character design, front view, standing straight, arms relaxed slightly away from the body, "
         "plain white background, semi-realistic anime illustration style, clean line art, soft cel shading, "
         "detailed expressive face, natural anatomy, everyday clothes")

def main() -> None:
    desc, out = sys.argv[1], sys.argv[2]
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 7
    token = os.environ.get('HF_TOKEN')
    if not token:
        sys.exit('HF_TOKEN manquant (clé Hugging Face en variable d’environnement).')
    os.makedirs(out, exist_ok=True)
    flux = Client('black-forest-labs/FLUX.1-schnell', token=token, verbose=False)
    img = flux.predict(prompt=f'{desc}, {STYLE}', seed=seed, randomize_seed=False, width=768, height=1344,
                       num_inference_steps=4, api_name='/infer')[0]
    concept = shutil.copy(img, os.path.join(out, '1-concept.webp'))
    print('concept', concept)
    std = Client('fabioma/StdGEN', token=token, verbose=False)
    apose = std.predict(handle_file(concept), seed, api_name='/arbitrary_to_apose')
    shutil.copy(apose, os.path.join(out, '2-apose.png'))
    views = std.predict(handle_file(apose), seed, api_name='/apose_to_multiview')
    for i, v in enumerate(views):
        shutil.copy(v['image'], os.path.join(out, f'3-vue{i}.png'))
    meshes = std.predict([{'image': handle_file(v['image']), 'caption': None} for v in views], api_name='/multiview_to_mesh')
    refined = std.predict(meshes[0], meshes[1], meshes[2], seed, api_name='/refine_mesh')
    for name, path in zip(['partie3', 'partie1', 'partie2', 'complet'], refined):
        shutil.copy(path, os.path.join(out, f'4-{name}{os.path.splitext(path)[1]}'))
    print('ok', out)

main()
