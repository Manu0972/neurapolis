import subprocess
import sys
from datetime import datetime

def exec_cmd(cmd):
    res = subprocess.run(cmd, shell=True, text=True, capture_output=True)
    if res.returncode != 0:
        print(f"Erreur lors de l'exécution de : {cmd}")
        print(res.stderr.strip())
        return False
    if res.stdout.strip():
        print(res.stdout.strip())
    return True

def sync():
    print("--- Synchronisation GitHub (NEURAPOLIS) ---")

    # 1. Vérification des modifications locales
    status = subprocess.run("git status --porcelain", shell=True, text=True, capture_output=True)
    if not status.stdout.strip():
        print("Aucune modification à synchroniser. Le dépôt est déjà à jour.")
        return

    # 2. Indexation de tous les fichiers
    print("Indexation des fichiers modifiés...")
    if not exec_cmd("git add -A"):
        sys.exit(1)

    # 3. Message de commit (horodaté par défaut)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    msg = f"sync: mise à jour multi-agents ({timestamp})"

    print(f"Commit : {msg}")
    if not exec_cmd(f'git commit -m "{msg}"'):
        sys.exit(1)

    # 4. Envoi sur la branche distante
    print("Envoi vers origin/main...")
    if not exec_cmd("git push origin main"):
        print("\nÉchec du push. Si des modifications existent en ligne, lance d'abord : git pull --rebase origin main")
        sys.exit(1)

    print("Synchronisation réussie.")

if __name__ == "__main__":
    sync()