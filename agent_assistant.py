import os
import google.generativeai as genai

# Nouvelle clé API du second compte
api_key = "AQ.Ab8RN6Kxka1WDdkMUx_C8KlTotekSs8bHeTVcs2eZsso_Z1FVA"

genai.configure(api_key=api_key)

# Utilisation du modèle 3.8-flash
model_name = 'gemini-3.8-flash'
model = genai.GenerativeModel(model_name)

def interroger_agent_neurapolis(prompt_utilisateur):
    """Envoie une consigne à Gemini pour le projet NEURAPOLIS"""
    try:
        response = model.generate_content(prompt_utilisateur)
        return response.text
    except Exception as e:
        return f"Erreur lors de la communication avec l'API : {e}"

if __name__ == "__main__":
    consigne = "Rédige un module de code de base en JavaScript (Three.js) pour initialiser une scène 3D de NEURAPOLIS."
    print(f"--- Envoi de la consigne avec {model_name} ---")
    resultat = interroger_agent_neurapolis(consigne)
    print("--- Réponse de l'agent ---")
    print(resultat)