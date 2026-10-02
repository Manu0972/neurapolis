import git

def sync_github():
    try:
        repo = git.Repo(search_parent_directories=True)
        print("--- État du dépôt Git ---")
        
        # On ajoute uniquement les fichiers nécessaires et sûrs
        repo.index.add(['agent_assistant.py', 'update_github.py', 'GUIDE-DA.md'])
        print("Fichiers essentiels ajoutés à l'index.")
        
        commit_message = "Mise à jour : scripts et assistant NEURAPOLIS"
        repo.index.commit(commit_message)
        print(f"Commit effectué : '{commit_message}'")
        
        origin = repo.remote(name='origin')
        origin.push()
        print("--- Succès : Tout a été poussé sur GitHub avec succès ! ---")
        
    except Exception as e:
        print(f"Erreur lors de la synchronisation Git : {e}")

if __name__ == "__main__":
    sync_github()