import git

def sync_github():
    try:
        # Ouvre le dépôt git local dans le dossier courant
        repo = git.Repo(search_parent_directories=True)
        
        # Vérifie l'état
        print("--- État du dépôt Git ---")
        print(repo.git.status())
        
        # Ajoute tous les fichiers modifiés/nouveaux
        repo.git.add(A=True)
        print("Tous les fichiers ont été ajoutés (git add).")
        
        # Commit des modifications
        commit_message = "Mise à jour : Ajout de l'agent NEURAPOLIS et du code Three.js"
        repo.index.commit(commit_message)
        print(f"Commit effectué avec le message : '{commit_message}'")
        
        # Push vers la branche principale (main ou master)
        origin = repo.remote(name='origin')
        origin.push()
        print("--- Succès : Tout a été poussé sur GitHub avec succès ! ---")
        
    except Exception as e:
        print(f"Erreur lors de la synchronisation Git : {e}")

if __name__ == "__main__":
    sync_github()